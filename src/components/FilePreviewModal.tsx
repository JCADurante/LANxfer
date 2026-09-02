import React, { useState, useEffect } from 'react';
import { FileRecord } from '../types';
import { getFileCategory, formatBytes, formatRelativeTime } from '../utils/formatters';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Music, 
  Video, 
  Image as ImageIcon,
  Loader2,
  Maximize2
} from 'lucide-react';

interface FilePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDownload: (file: FileRecord) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onDownload }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!file) {
      setTextContent(null);
      return;
    }

    const category = getFileCategory(file.mimeType, file.originalName);
    if (category === 'code' || (category === 'document' && (file.originalName.endsWith('.txt') || file.originalName.endsWith('.md') || file.originalName.endsWith('.json') || file.originalName.endsWith('.csv')))) {
      setTextLoading(true);
      fetch(`/api/files/${file.id}/view`)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setTextLoading(false);
        })
        .catch(() => {
          setTextContent('Failed to load text preview.');
          setTextLoading(false);
        });
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const category = getFileCategory(file.mimeType, file.originalName);
  const viewUrl = `/api/files/${file.id}/view`;
  const downloadUrl = `/api/files/${file.id}/download`;

  const handleCopyLink = async () => {
    try {
      const fullUrl = `${window.location.origin}${downloadUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 shrink-0">
              {category === 'image' && <ImageIcon className="w-5 h-5" />}
              {category === 'video' && <Video className="w-5 h-5" />}
              {category === 'audio' && <Music className="w-5 h-5" />}
              {(category === 'document' || category === 'code') && <FileText className="w-5 h-5" />}
              {category === 'archive' || category === 'other' && <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-100 text-sm md:text-base truncate">
                {file.originalName}
              </h3>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size)} • {formatRelativeTime(file.uploadDate)} • From {file.uploaderIp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Copy Direct Download Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center min-h-[300px] max-h-[70vh] bg-slate-950/30">
          {category === 'image' && (
            <div className="flex items-center justify-center w-full h-full">
              <img
                src={viewUrl}
                alt={file.originalName}
                className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {category === 'video' && (
            <div className="w-full flex items-center justify-center">
              <video
                src={viewUrl}
                controls
                autoPlay
                className="max-h-[65vh] max-w-full rounded-xl shadow-lg bg-black"
              />
            </div>
          )}

          {category === 'audio' && (
            <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-xl">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 animate-pulse">
                <Music className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-200 text-sm">{file.originalName}</p>
                <p className="text-xs text-slate-400 mt-1">{formatBytes(file.size)}</p>
              </div>
              <audio src={viewUrl} controls autoPlay className="w-full" />
            </div>
          )}

          {file.originalName.toLowerCase().endsWith('.pdf') && (
            <iframe
              src={viewUrl}
              title={file.originalName}
              className="w-full h-[65vh] rounded-xl border border-slate-800 bg-slate-900"
            />
          )}

          {(category === 'code' || textContent !== null) && !file.originalName.toLowerCase().endsWith('.pdf') && (
            <div className="w-full h-full">
              {textLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span>Loading text preview...</span>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto max-h-[60vh] font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-text">
                  {textContent}
                </div>
              )}
            </div>
          )}

          {category === 'archive' && (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-200">Compressed Archive File</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Preview is not available for compressed archives ({file.originalName.split('.').pop()?.toUpperCase()}). Download the file to extract its contents.
                </p>
              </div>
              <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Archive ({formatBytes(file.size)})</span>
              </button>
            </div>
          )}

          {category === 'other' && !file.originalName.toLowerCase().endsWith('.pdf') && textContent === null && (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-200">Binary or Unsupported Format</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Direct browser preview is not available for this file type.
                </p>
              </div>
              <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download File ({formatBytes(file.size)})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
