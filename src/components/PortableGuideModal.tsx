import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  FolderCheck, 
  Cpu, 
  GitBranch, 
  Download, 
  FileCode, 
  ShieldCheck, 
  FolderGit2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PortableGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortableGuideModal: React.FC<PortableGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'portable' | 'workflow'>('portable');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSection(id);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      // ignore
    }
  };

  const workflowTriggerCmd = `git push origin main`;
  const batCmd = `start.bat`;
  const shCmd = `./start.sh`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Portable Node.js & GitHub Compiler</h3>
              <p className="text-xs text-slate-400">Zero-install LAN server bundled via automated CI/CD.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('portable')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'portable'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Run with Portable Node.js
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'workflow'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            2. GitHub Actions Compiler
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 text-xs md:text-sm text-slate-300">
          {activeTab === 'portable' ? (
            <>
              {/* Step 1 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
                  Place your Portable Node.js
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Download or copy your portable <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">node.exe</code> (Windows) or <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">node</code> binary (Linux/Mac) into the app folder right next to <code className="text-slate-200 font-mono">start.bat</code>.
                </p>
                
                {/* Folder visualizer */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] text-slate-400 space-y-1">
                  <div className="text-slate-200 font-semibold flex items-center gap-1.5 text-cyan-400">
                    <FolderCheck className="w-3.5 h-3.5" /> portable-lan-transfer/
                  </div>
                  <div className="pl-4 text-emerald-400 font-semibold">├── node.exe &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← [YOUR PORTABLE NODE]</div>
                  <div className="pl-4 text-cyan-300">├── start.bat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← Double-click to launch (Windows)</div>
                  <div className="pl-4 text-cyan-300">├── start.sh &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← Run in terminal (Linux/Mac)</div>
                  <div className="pl-4">├── dist/</div>
                  <div className="pl-8">├── server.cjs &nbsp;&nbsp;&nbsp;← Pre-compiled standalone backend</div>
                  <div className="pl-8">└── index.html &nbsp;&nbsp;&nbsp;← Built web UI assets</div>
                  <div className="pl-4">└── uploads/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← Shared local storage</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
                  Launch the Server with 1 Click
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Double-click <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">start.bat</code>. The launcher automatically locates your portable Node runtime, initializes the LAN web server, and opens your browser at <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">http://localhost:3000</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Windows</div>
                      <code className="font-mono text-cyan-300 text-xs">{batCmd}</code>
                    </div>
                    <button
                      onClick={() => copyCode(batCmd, 'bat')}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      {copiedSection === 'bat' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Linux / macOS</div>
                      <code className="font-mono text-cyan-300 text-xs">{shCmd}</code>
                    </div>
                    <button
                      onClick={() => copyCode(shCmd, 'sh')}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      {copiedSection === 'sh' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
                  Zero Dependencies & USB Drive Ready
                </h4>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs text-slate-400">
                  <p className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <strong>No NPM or Node installation required:</strong> Backend dependencies are bundled into a standalone binary JS module.
                  </p>
                  <p className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <strong>Runs from any USB drive:</strong> Everything is contained in the folder without writing to Windows Registry.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* GitHub Workflow Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
                  Automated Cloud Compiler Workflow
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  The repository includes <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">.github/workflows/build-portable-release.yml</code>. Whenever you push to your GitHub repo, GitHub Actions automatically compiles the React client and bundles the backend server.
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Trigger Build</div>
                    <code className="font-mono text-cyan-300 text-xs">{workflowTriggerCmd}</code>
                  </div>
                  <button
                    onClick={() => copyCode(workflowTriggerCmd, 'wf')}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedSection === 'wf' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* How to download */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
                  Downloading Pre-Compiled Ready-To-Use ZIP
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
                  <li>Navigate to your GitHub repository in your browser.</li>
                  <li>Click on the <strong>Actions</strong> tab at the top.</li>
                  <li>Click on the latest completed workflow run: <strong className="text-slate-200">"Build & Package Ready-To-Use Portable App"</strong>.</li>
                  <li>Scroll down to the <strong>Artifacts</strong> section and download <strong className="text-cyan-300">portable-lan-transfer-ready-to-use.zip</strong>.</li>
                  <li>Unzip it anywhere and drop your portable <code className="text-slate-200">node.exe</code> to run!</li>
                </ol>
              </div>

              {/* Manual Local Packaging */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
                  Compiling Locally (Optional)
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  If you want to package the portable release locally instead of using GitHub Actions:
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <code className="font-mono text-cyan-300 text-xs">npm run package:portable</code>
                  <button
                    onClick={() => copyCode('npm run package:portable', 'pkg')}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedSection === 'pkg' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            LAN direct connection &bull; No cloud data transmission
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
