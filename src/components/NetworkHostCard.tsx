import React, { useState } from 'react';
import { ServerInfo } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Wifi, 
  Copy, 
  Check, 
  QrCode, 
  Users, 
  HardDrive, 
  Laptop, 
  ExternalLink,
  ChevronDown,
  Info,
  Cpu,
  Radio,
  Sliders
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface NetworkHostCardProps {
  serverInfo: ServerInfo | null;
  onOpenGuide: () => void;
}

export const NetworkHostCard: React.FC<NetworkHostCardProps> = ({ serverInfo, onOpenGuide }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPortOptions, setShowPortOptions] = useState(false);
  const [copiedPortCmd, setCopiedPortCmd] = useState<string | null>(null);
  const [selectedIpIndex, setSelectedIpIndex] = useState(0);

  // Compute active connection URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const activePort = serverInfo?.port || 3000;
  
  const lanAddresses = serverInfo?.localIps.filter(ip => !ip.isInternal) || [];
  const selectedIp = lanAddresses[selectedIpIndex]?.address;
  
  // If running in local LAN environment, preferred is the LAN IP; otherwise current browser origin
  const connectUrl = selectedIp 
    ? `http://${selectedIp}:${activePort}`
    : (serverInfo?.preferredUrl || currentOrigin);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(connectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCmd = async (cmd: string, id: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedPortCmd(id);
      setTimeout(() => setCopiedPortCmd(null), 2000);
    } catch {
      // fallback
    }
  };

  const presetPorts = [3000, 8080, 5000, 8000, 4000];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 text-slate-100 shadow-xl relative overflow-hidden">
      {/* Background Subtle Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Server Status & IP */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Host Server Running</span>
            </div>

            {/* Active Port Pill */}
            <button
              onClick={() => setShowPortOptions(!showPortOptions)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors cursor-pointer"
              title="Click to see custom localhost port options"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Port: <strong>{activePort}</strong></span>
              <span className="text-[10px] text-cyan-400/80 underline ml-0.5">change</span>
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{serverInfo?.activePeers || 1} Connected</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>{serverInfo ? formatBytes(serverInfo.totalBytes) : '0 B'} Used</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
              <Wifi className="w-6 h-6 text-cyan-400" />
              LAN File Hub
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Open the address below on any other PC, Mac, phone, or tablet on the same Wi-Fi / LAN to instantly drop and pick up files.
            </p>
          </div>

          {/* Connect URL Pill */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm font-mono text-cyan-300 max-w-full overflow-hidden shadow-inner">
              <span className="truncate selection:bg-cyan-500/30">{connectUrl}</span>
            </div>

            <button
              id="btn-copy-lan-url"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Copy link to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy URL'}</span>
            </button>

            <button
              id="btn-show-qr"
              onClick={() => setShowQr(!showQr)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                showQr 
                  ? 'bg-slate-700 text-white border-slate-600' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Show QR Code for Mobile"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>QR Code</span>
            </button>

            <button
              id="btn-port-options"
              onClick={() => setShowPortOptions(!showPortOptions)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                showPortOptions
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Configure local host port"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Port Options</span>
            </button>

            <button
              id="btn-portable-guide"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Portable &amp; CI Guide</span>
            </button>
          </div>

          {/* Multiple Network Interfaces Selector */}
          {lanAddresses.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span>Adapter:</span>
              <div className="relative inline-block">
                <select
                  value={selectedIpIndex}
                  onChange={(e) => setSelectedIpIndex(Number(e.target.value))}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs appearance-none pr-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {lanAddresses.map((ip, idx) => (
                    <option key={ip.address} value={idx}>
                      {ip.name} ({ip.address})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Right: QR Code Preview (collapsible or toggleable) */}
        {showQr && (
          <div className="bg-white p-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150 self-center">
            <QRCodeSVG value={connectUrl} size={130} level="M" />
            <span className="text-[11px] font-semibold text-slate-700 mt-2 text-center">
              Scan with phone camera
            </span>
            <span className="text-[9px] text-slate-500 truncate max-w-[140px]">
              {connectUrl}
            </span>
          </div>
        )}
      </div>

      {/* Port Configuration Helper Panel */}
      {showPortOptions && (
        <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Custom Localhost Port Options (Default: 3000)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Active Host Port: <strong className="text-white">{activePort}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Need to avoid port conflicts with other local services? You can launch the server on any custom port (e.g. 8080, 5000, 8000, or any number up to 65535):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {/* Windows command */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Windows Launcher</div>
                <div className="font-mono text-xs text-cyan-300 mt-1">start.bat 8080</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Launches on http://localhost:8080</p>
              </div>
              <button
                onClick={() => handleCopyCmd('start.bat 8080', 'win-8080')}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                {copiedPortCmd === 'win-8080' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPortCmd === 'win-8080' ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>

            {/* Linux/Mac command */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Linux / macOS Launcher</div>
                <div className="font-mono text-xs text-cyan-300 mt-1">./start.sh 8080</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Or: PORT=8080 ./start.sh</p>
              </div>
              <button
                onClick={() => handleCopyCmd('./start.sh 8080', 'sh-8080')}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                {copiedPortCmd === 'sh-8080' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPortCmd === 'sh-8080' ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>

            {/* Standalone Node binary command */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Direct Node CLI</div>
                <div className="font-mono text-xs text-cyan-300 mt-1">node server.cjs --port 5000</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Pass custom --port flag directly</p>
              </div>
              <button
                onClick={() => handleCopyCmd('node dist/server.cjs --port 5000', 'node-5000')}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                {copiedPortCmd === 'node-5000' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPortCmd === 'node-5000' ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

