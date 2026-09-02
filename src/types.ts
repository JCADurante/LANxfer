export interface FileRecord {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploaderIp: string;
  downloadCount: number;
}

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: 'IPv4' | 'IPv6';
  isInternal: boolean;
}

export interface ServerInfo {
  hostname: string;
  port: number;
  activePorts?: number[];
  localIps: NetworkInterfaceInfo[];
  preferredUrl: string;
  totalFiles: number;
  totalBytes: number;
  activePeers: number;
  storageDir: string;
  isLocalServer: boolean;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  speed: string;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export interface TextSnippet {
  id: string;
  content: string;
  createdAt: string;
  senderIp: string;
}
