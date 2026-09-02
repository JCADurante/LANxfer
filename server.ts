import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import crypto from 'crypto';

interface StoredFile {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploaderIp: string;
  downloadCount: number;
}

interface StoredNote {
  id: string;
  content: string;
  createdAt: string;
  senderIp: string;
}

const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const METADATA_FILE = path.join(UPLOADS_DIR, '_metadata.json');
const NOTES_FILE = path.join(UPLOADS_DIR, '_notes.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to load files metadata
function loadFilesMetadata(): StoredFile[] {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8');
      const files: StoredFile[] = JSON.parse(data);
      // Filter out files that physically don't exist
      return files.filter(f => fs.existsSync(path.join(UPLOADS_DIR, f.storedName)));
    }
  } catch (err) {
    console.error('Failed to read metadata file:', err);
  }
  return [];
}

// Helper to save files metadata
function saveFilesMetadata(files: StoredFile[]) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(files, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write metadata file:', err);
  }
}

// Helper to load notes
function loadNotes(): StoredNote[] {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read notes file:', err);
  }
  return [];
}

// Helper to save notes
function saveNotes(notes: StoredNote[]) {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write notes file:', err);
  }
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Decode original name properly in case of UTF-8 encoding issues
    let decodedName = file.originalname;
    try {
      decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {
      // ignore
    }
    const ext = path.extname(decodedName);
    const uniqueId = crypto.randomUUID();
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB maximum per file
  },
});

// SSE Connected clients list
const sseClients = new Set<Response>();

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// Get network interfaces
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; address: string; family: 'IPv4' | 'IPv6'; isInternal: boolean }[] = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === 'IPv4') {
        addresses.push({
          name,
          address: net.address,
          family: 'IPv4',
          isInternal: net.internal,
        });
      }
    }
  }

  // Sort so non-internal LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) come first
  addresses.sort((a, b) => {
    if (a.isInternal && !b.isInternal) return 1;
    if (!a.isInternal && b.isInternal) return -1;
    if (a.address.startsWith('192.168.') && !b.address.startsWith('192.168.')) return -1;
    return 0;
  });

  return addresses;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'Local PC';
}

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API: Server & Network Information
  app.get('/api/info', (req, res) => {
    const addresses = getNetworkInterfaces();
    const files = loadFilesMetadata();
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const hostHeader = req.headers.host || `localhost:${PORT}`;
    const protocol = req.protocol;

    const externalIpv4 = addresses.find(a => !a.isInternal);
    const preferredUrl = externalIpv4
      ? `http://${externalIpv4.address}:${PORT}`
      : `${protocol}://${hostHeader}`;

    res.json({
      hostname: os.hostname(),
      port: PORT,
      localIps: addresses,
      preferredUrl,
      totalFiles: files.length,
      totalBytes,
      activePeers: sseClients.size,
      storageDir: UPLOADS_DIR,
      isLocalServer: !process.env.APP_URL || process.env.APP_URL.includes('localhost'),
    });
  });

  // API: SSE for real-time events
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Broadcast updated peer count
    broadcastSSE('peer-count', { count: sseClients.size });

    // Send initial ping
    res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);

    // Heartbeat to keep connection open
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
      broadcastSSE('peer-count', { count: sseClients.size });
    });
  });

  // API: Get all files
  app.get('/api/files', (_req, res) => {
    const files = loadFilesMetadata();
    res.json(files);
  });

  // API: Upload files
  app.post('/api/upload', upload.array('files', 50), (req, res) => {
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploaderIp = getClientIp(req);
    const existing = loadFilesMetadata();
    const newRecords: StoredFile[] = [];

    for (const f of uploadedFiles) {
      let originalName = f.originalname;
      try {
        originalName = Buffer.from(f.originalname, 'latin1').toString('utf8');
      } catch {
        // ignore
      }

      const fileRecord: StoredFile = {
        id: crypto.randomUUID(),
        originalName,
        storedName: f.filename,
        size: f.size,
        mimeType: f.mimetype || 'application/octet-stream',
        uploadDate: new Date().toISOString(),
        uploaderIp,
        downloadCount: 0,
      };
      newRecords.push(fileRecord);
      existing.unshift(fileRecord);
    }

    saveFilesMetadata(existing);

    // Broadcast new files to all connected peers
    broadcastSSE('files-updated', { action: 'upload', files: newRecords, totalCount: existing.length });

    return res.status(201).json({
      message: `Successfully uploaded ${newRecords.length} file(s)`,
      files: newRecords,
    });
  });

  // API: Download file
  app.get('/api/files/:id/download', (req, res) => {
    const files = loadFilesMetadata();
    const file = files.find(f => f.id === req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(UPLOADS_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File data missing from disk' });
    }

    // Increment download count
    file.downloadCount += 1;
    saveFilesMetadata(files);
    broadcastSSE('files-updated', { action: 'download-count', id: file.id, count: file.downloadCount });

    // Set proper UTF-8 Content-Disposition header
    const encodedFilename = encodeURIComponent(file.originalName);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );

    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  });

  // API: View / Stream file inline (for previewing images, videos, audio, pdf)
  app.get('/api/files/:id/view', (req, res) => {
    const files = loadFilesMetadata();
    const file = files.find(f => f.id === req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(UPLOADS_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File data missing' });
    }

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    // Handle range requests for video and audio playback
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mimeType,
      });
      return fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': file.mimeType,
        'Accept-Ranges': 'bytes',
      });
      return fs.createReadStream(filePath).pipe(res);
    }
  });

  // API: Delete file
  app.delete('/api/files/:id', (req, res) => {
    let files = loadFilesMetadata();
    const file = files.find(f => f.id === req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(UPLOADS_DIR, file.storedName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete physical file:', err);
      }
    }

    files = files.filter(f => f.id !== req.params.id);
    saveFilesMetadata(files);

    broadcastSSE('files-updated', { action: 'delete', id: req.params.id, totalCount: files.length });
    return res.json({ message: 'File deleted', id: req.params.id });
  });

  // API: Clear all files
  app.post('/api/files/clear', (_req, res) => {
    const files = loadFilesMetadata();
    for (const f of files) {
      const filePath = path.join(UPLOADS_DIR, f.storedName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore
        }
      }
    }

    saveFilesMetadata([]);
    broadcastSSE('files-updated', { action: 'clear', totalCount: 0 });
    return res.json({ message: 'All files cleared' });
  });

  // API: Quick Text Snippets
  app.get('/api/notes', (_req, res) => {
    res.json(loadNotes());
  });

  app.post('/api/notes', (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const notes = loadNotes();
    const newNote: StoredNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      senderIp: getClientIp(req),
    };

    notes.unshift(newNote);
    // Keep max 50 notes
    if (notes.length > 50) notes.splice(50);
    saveNotes(notes);

    broadcastSSE('notes-updated', { action: 'add', note: newNote });
    return res.status(201).json(newNote);
  });

  app.delete('/api/notes/:id', (req, res) => {
    let notes = loadNotes();
    notes = notes.filter(n => n.id !== req.params.id);
    saveNotes(notes);
    broadcastSSE('notes-updated', { action: 'delete', id: req.params.id });
    return res.json({ message: 'Note deleted' });
  });

  // Setup Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🚀 Portable LAN File Transfer Server Active!`);
    console.log(`📡 Local Port: ${PORT}`);
    const addresses = getNetworkInterfaces();
    console.log(`🌐 Available LAN Addresses:`);
    for (const a of addresses) {
      console.log(`   👉 http://${a.address}:${PORT} (${a.name})`);
    }
    console.log(`📂 Storage Folder: ${UPLOADS_DIR}`);
    console.log(`========================================\n`);
  });
}

startServer();
