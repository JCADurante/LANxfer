import React, { useState, useEffect, useCallback } from 'react';
import { FileRecord, ServerInfo, TextSnippet } from './types';
import { NetworkHostCard } from './components/NetworkHostCard';
import { DropZone } from './components/DropZone';
import { FileList } from './components/FileList';
import { FilePreviewModal } from './components/FilePreviewModal';
import { QuickTextDrop } from './components/QuickTextDrop';
import { PortableGuideModal } from './components/PortableGuideModal';
import { 
  ArrowLeftRight, 
  FolderSync, 
  HardDrive, 
  ShieldCheck, 
  Wifi, 
  Sparkles,
  RefreshCw,
  Bell
} from 'lucide-react';

export default function App() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [notes, setNotes] = useState<TextSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch Server & Network info
  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const data = await res.json();
        setServerInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch server info:', err);
    }
  }, []);

  // Fetch Files
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  }, []);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  }, []);

  // Initial load and SSE real-time listener
  useEffect(() => {
    Promise.all([fetchInfo(), fetchFiles(), fetchNotes()]).finally(() => {
      setLoading(false);
    });

    // Setup Server-Sent Events (SSE) for zero-latency peer updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('files-updated', (e) => {
        try {
          const payload = JSON.parse(e.data);
          fetchFiles();
          fetchInfo();
          if (payload.action === 'upload' && payload.files && payload.files.length > 0) {
            showToast(`📥 Received new file: ${payload.files[0].originalName}`);
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('notes-updated', (e) => {
        try {
          const payload = JSON.parse(e.data);
          fetchNotes();
          if (payload.action === 'add' && payload.note) {
            showToast(`💬 New text snippet shared on LAN`);
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('peer-count', (e) => {
        try {
          const payload = JSON.parse(e.data);
          setServerInfo((prev) => (prev ? { ...prev, activePeers: payload.count } : null));
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('port-switched', (e) => {
        try {
          const payload = JSON.parse(e.data);
          fetchInfo();
          if (payload.port) {
            showToast(`⚡ Port switched to :${payload.port} (Auto-running)`);
          }
        } catch {
          // ignore
        }
      });
    } catch (err) {
      console.error('SSE initialization error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchInfo, fetchFiles, fetchNotes, showToast]);

  // Download Handler
  const handleDownload = (file: FileRecord) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = `/api/files/${file.id}/download`;
    downloadLink.download = file.originalName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        fetchInfo();
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  // Clear All Handler
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/files/clear', { method: 'POST' });
      if (res.ok) {
        setFiles([]);
        fetchInfo();
      }
    } catch (err) {
      console.error('Failed to clear files:', err);
    }
  };

  // Add Note Handler
  const handleAddNote = async (content: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  // Delete Note Handler
  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 shadow-2xl rounded-2xl px-4 py-3 text-xs md:text-sm text-cyan-200 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm md:text-base tracking-tight flex items-center gap-2">
                LAN File Transfer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Portable
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Direct PC-to-PC local high-speed file sharing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchInfo();
                fetchFiles();
                fetchNotes();
              }}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowGuide(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>LAN Status</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Network Host Connection Banner */}
        <NetworkHostCard 
          serverInfo={serverInfo} 
          onOpenGuide={() => setShowGuide(true)} 
          onPortSwitched={() => fetchInfo()} 
        />

        {/* Upload & Drag-and-Drop Area */}
        <DropZone onUploadSuccess={() => { fetchFiles(); fetchInfo(); }} />

        {/* Files Grid / List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold text-slate-100 flex items-center gap-2">
              <FolderSync className="w-5 h-5 text-cyan-400" />
              Shared Files ({files.length})
            </h2>
          </div>

          <FileList
            files={files}
            onDownload={handleDownload}
            onPreview={(f) => setPreviewFile(f)}
            onDelete={handleDelete}
            onClearAll={handleClearAll}
            loading={loading}
          />
        </div>

        {/* Quick Text / Link Drop */}
        <QuickTextDrop
          notes={notes}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/30 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Portable Node.js LAN File Hub • Safe local network transfers</span>
          <span>Zero cloud dependency • Full speed gigabit LAN</span>
        </div>
      </footer>

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      {/* Guide Modal */}
      <PortableGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}
