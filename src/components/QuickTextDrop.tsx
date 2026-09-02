import React, { useState } from 'react';
import { TextSnippet } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { MessageSquare, Send, Copy, Check, Trash2, Sparkles } from 'lucide-react';

interface QuickTextDropProps {
  notes: TextSnippet[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

export const QuickTextDrop: React.FC<QuickTextDropProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const [content, setContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddNote(content.trim());
    setContent('');
  };

  const handleCopy = async (note: TextSnippet) => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">Quick Clipboard / Text Drop</h3>
            <p className="text-xs text-slate-400">Send links, passwords, or text snippets between connected PCs instantly.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or type text, links, or code here..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Notes List */}
      {notes.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 pt-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs group hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-slate-200 font-mono text-xs whitespace-pre-wrap break-words selection:bg-cyan-500/30">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{formatRelativeTime(note.createdAt)}</span>
                  <span>•</span>
                  <span>From {note.senderIp}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopy(note)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Copy Text"
                >
                  {copiedId === note.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
