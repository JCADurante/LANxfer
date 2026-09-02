import React, { useState, useRef, useCallback } from 'react';
import { UploadQueueItem } from '../types';
import { formatBytes } from '../utils/formatters';
import { 
  UploadCloud, 
  FileUp, 
  FolderUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  RotateCw,
  Sparkles
} from 'lucide-react';

interface DropZoneProps {
  onUploadSuccess?: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Upload a single file with XMLHttpRequest for accurate progress & speed calculation
  const uploadFile = useCallback((item: UploadQueueItem) => {
    const formData = new FormData();
    formData.append('files', item.file);

    const xhr = new XMLHttpRequest();
    let startTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        const currentTime = Date.now();
        const timeElapsed = (currentTime - startTime) / 1000;
        const bytesLoaded = event.loaded - lastLoaded;

        let speedStr = '';
        if (timeElapsed > 0.5) {
          const bytesPerSec = event.loaded / timeElapsed;
          speedStr = `${formatBytes(bytesPerSec)}/s`;
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  progress: percent,
                  speed: speedStr || q.speed,
                  status: percent === 100 ? 'uploading' : 'uploading',
                }
              : q
          )
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, progress: 100, status: 'completed', speed: 'Done' } : q
          )
        );
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        let err = 'Upload failed';
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.error) err = res.error;
        } catch {
          // ignore
        }
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'error', errorMessage: err } : q
          )
        );
      }
    };

    xhr.onerror = () => {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'error', errorMessage: 'Network error' } : q
        )
      );
    };

    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  }, [onUploadSuccess]);

  // Handle addition of new files
  const handleAddFiles = useCallback((files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const newItems: UploadQueueItem[] = fileList.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      progress: 0,
      speed: 'Starting...',
      status: 'queued',
    }));

    setQueue((prev) => [...newItems, ...prev]);

    // Start upload immediately for queued items
    newItems.forEach((item) => {
      uploadFile(item);
    });
  }, [uploadFile]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the main drop boundary
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const retryUpload = (item: UploadQueueItem) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id ? { ...q, progress: 0, status: 'uploading', errorMessage: undefined } : q
      )
    );
    uploadFile(item);
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status === 'uploading' || q.status === 'queued'));
  };

  const hasCompleted = queue.some((q) => q.status === 'completed' || q.status === 'error');

  return (
    <div className="space-y-4">
      {/* Main Drag & Drop Zone */}
      <div
        id="drop-zone-container"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 group overflow-hidden ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-lg shadow-cyan-500/10'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900/80'
        }`}
      >
        {/* Animated Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none opacity-50" />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
              isDragging
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40'
                : 'bg-slate-800 text-cyan-400 border border-slate-700'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-100">
              {isDragging ? 'Drop your files here!' : 'Drag & drop files here to send'}
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Any PC or device connected to this LAN can pick them up immediately. Supports all file types with zero size limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              id="btn-choose-files"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Choose Files</span>
            </button>

            <button
              id="btn-choose-folder"
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <FolderUp className="w-4 h-4 text-slate-400" />
              <span>Upload Folder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Queue Card */}
      {queue.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Upload Queue ({queue.length})
            </h4>

            {hasCompleted && (
              <button
                onClick={clearCompleted}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear finished
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    )}
                    {item.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    {item.status === 'queued' && (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0" />
                    )}
                    <span className="font-medium text-slate-200 truncate">{item.file.name}</span>
                    <span className="text-slate-500 shrink-0">({formatBytes(item.file.size)})</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'uploading' && (
                      <span className="text-cyan-400 font-mono text-[11px]">
                        {item.progress}% {item.speed && `• ${item.speed}`}
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-emerald-400 font-medium text-[11px]">Completed</span>
                    )}
                    {item.status === 'error' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-400 text-[11px]">
                          {item.errorMessage || 'Failed'}
                        </span>
                        <button
                          onClick={() => retryUpload(item)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                          title="Retry"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => removeQueueItem(item.id)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
