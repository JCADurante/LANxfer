import React, { useState, useMemo } from 'react';
import { FileRecord } from '../types';
import { formatBytes, formatRelativeTime, getFileCategory } from '../utils/formatters';
import { 
  Download, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Archive, 
  Code, 
  File, 
  LayoutGrid, 
  List, 
  HardDrive,
  Sparkles,
  ArrowUpDown,
  CheckSquare,
  Square
} from 'lucide-react';

interface FileListProps {
  files: FileRecord[];
  onDownload: (file: FileRecord) => void;
  onPreview: (file: FileRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  loading?: boolean;
}

type SortField = 'date' | 'name' | 'size' | 'downloads';
type SortOrder = 'asc' | 'desc';

export const FileList: React.FC<FileListProps> = ({
  files,
  onDownload,
  onPreview,
  onDelete,
  onClearAll,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (categoryFilter === 'all') return true;
        const cat = getFileCategory(file.mimeType, file.originalName);
        return cat === categoryFilter;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        } else if (sortField === 'name') {
          diff = a.originalName.localeCompare(b.originalName);
        } else if (sortField === 'size') {
          diff = b.size - a.size;
        } else if (sortField === 'downloads') {
          diff = b.downloadCount - a.downloadCount;
        }
        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [files, search, categoryFilter, sortField, sortOrder]);

  const handleCopyLink = async (file: FileRecord) => {
    try {
      const fullUrl = `${window.location.origin}/api/files/${file.id}/download`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleDownloadSelected = () => {
    filteredFiles
      .filter((f) => selectedIds.has(f.id))
      .forEach((f, idx) => {
        // slight stagger to avoid browser blocking multiple downloads
        setTimeout(() => {
          onDownload(f);
        }, idx * 300);
      });
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedIds.size} selected file(s)?`)) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  const renderFileIcon = (mimeType: string, originalName: string) => {
    const cat = getFileCategory(mimeType, originalName);
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-orange-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-emerald-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'document', label: 'Documents' },
    { id: 'archive', label: 'Archives' },
    { id: 'code', label: 'Code' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search, Sort, View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Sort Menu */}
          <button
            onClick={() => {
              if (sortField === 'date') setSortField('name');
              else if (sortField === 'name') setSortField('size');
              else if (sortField === 'size') setSortField('downloads');
              else setSortField('date');
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
            title={`Sorted by: ${sortField}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize hidden sm:inline">{sortField}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-cyan-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedIds.size}</span>
            <span>file(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Selected</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Files Display */}
      {files.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <HardDrive className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">No files shared yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Drop files above or connect another PC on the LAN to transfer files back and forth.
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No files matching your search or category filter.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFiles.map((file) => {
            const isSelected = selectedIds.has(file.id);
            const isImage = file.mimeType.startsWith('image/');

            return (
              <div
                key={file.id}
                className={`group bg-slate-900 border rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between relative hover:border-slate-700 ${
                  isSelected ? 'border-cyan-500/80 bg-cyan-950/20' : 'border-slate-800'
                }`}
              >
                {/* Select Checkbox */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleSelect(file.id)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 shrink-0">
                      {renderFileIcon(file.mimeType, file.originalName)}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="font-medium text-slate-100 text-xs md:text-sm truncate hover:text-cyan-300 transition-colors cursor-pointer"
                        title={file.originalName}
                        onClick={() => onPreview(file)}
                      >
                        {file.originalName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(file.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Image Thumbnail preview in grid */}
                {isImage && (
                  <div
                    onClick={() => onPreview(file)}
                    className="mt-3 w-full h-28 bg-slate-950 rounded-xl overflow-hidden cursor-pointer relative group-hover:opacity-90 transition-opacity border border-slate-800/80 flex items-center justify-center"
                  >
                    <img
                      src={`/api/files/${file.id}/view`}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Bottom Meta & Actions */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {file.uploaderIp === '::1' || file.uploaderIp === '127.0.0.1' ? 'Host PC' : file.uploaderIp}
                    {file.downloadCount > 0 && ` • ${file.downloadCount} dl`}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPreview(file)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Copy Download Link"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onDownload(file)}
                      className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDelete(file.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="p-3.5 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                    >
                      {selectedIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Uploaded</th>
                  <th className="p-3.5">Sender</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFiles.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <button
                          onClick={() => toggleSelect(file.id)}
                          className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-medium text-slate-100 flex items-center gap-2 min-w-[200px]">
                        {renderFileIcon(file.mimeType, file.originalName)}
                        <span
                          className="truncate hover:text-cyan-300 cursor-pointer"
                          title={file.originalName}
                          onClick={() => onPreview(file)}
                        >
                          {file.originalName}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-400">{formatBytes(file.size)}</td>
                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {formatRelativeTime(file.uploadDate)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {file.uploaderIp}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(file)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                            title="Copy link"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => onDownload(file)}
                            className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(file.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear All action button */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
          <span>Total {files.length} file(s) hosted on LAN</span>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all hosted files on the server?')) {
                onClearAll();
              }
            }}
            className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            Clear all files
          </button>
        </div>
      )}
    </div>
  );
};
