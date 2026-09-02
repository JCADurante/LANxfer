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
  Sliders,
  Power,
  Sparkles,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface NetworkHostCardProps {
  serverInfo: ServerInfo | null;
  onOpenGuide: () => void;
}

interface PortPreset {
  port: number;
  label: string;
  tag: string;
  desc: string;
}

const PORT_PRESETS: PortPreset[] = [
  { port: 1111, label: '1111', tag: 'Ch. 1', desc: 'Lightweight Stream' },
  { port: 2222, label: '2222', tag: 'Ch. 2', desc: 'Direct Mirror' },
  { port: 3000, label: '3000', tag: 'Default', desc: 'Standard Core Port' },
  { port: 5000, label: '5000', tag: 'Dev', desc: 'Secondary Bridge' },
  { port: 8080, label: '8080', tag: 'Proxy', desc: 'Alternate Web Port' },
];

export const NetworkHostCard: React.FC<NetworkHostCardProps> = ({ serverInfo, onOpenGuide }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPortOptions, setShowPortOptions] = useState(false);
  const [copiedPortCmd, setCopiedPortCmd] = useState<string | null>(null);
  const [selectedIpIndex, setSelectedIpIndex] = useState(0);

  // Compute active connection URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const activePort = serverInfo?.port || 3000;
  
  // Selected switch port (defaults to active host port or 3000)
  const [selectedSwitchPort, setSelectedSwitchPort] = useState<number>(activePort);
  const [customPortInput, setCustomPortInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    !PORT_PRESETS.some(p => p.port === activePort)
  );

  const lanAddresses = serverInfo?.localIps.filter(ip => !ip.isInternal) || [];
  const selectedIp = lanAddresses[selectedIpIndex]?.address;
  
  // If running in local LAN environment, preferred is the LAN IP; otherwise current browser origin
  const connectUrl = selectedIp 
    ? `http://${selectedIp}:${activePort}`
    : (serverInfo?.preferredUrl || currentOrigin);

  // Preview URL for the selected switched port
  const previewSwitchedUrl = selectedIp
    ? `http://${selectedIp}:${selectedSwitchPort}`
    : `http://localhost:${selectedSwitchPort}`;

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

  const handleSelectPort = (port: number) => {
    setSelectedSwitchPort(port);
    setIsCustomMode(false);
  };

  const handleCustomPortChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 5);
    setCustomPortInput(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      setSelectedSwitchPort(parsed);
    }
  };

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

            {/* Active Port Pill with Interactive Switch Indicator */}
            <button
              id="btn-active-port-indicator"
              onClick={() => setShowPortOptions(!showPortOptions)}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer group shadow-sm"
              title="Click to open multi-port switch panel"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>Port Switch: <strong className="text-white font-mono">{activePort}</strong></span>
              <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-200 rounded text-[10px] uppercase font-semibold group-hover:bg-cyan-400/30 transition-colors">
                {showPortOptions ? 'Close' : 'Switch'}
              </span>
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

            {/* Port Switch Toggle Button */}
            <button
              id="btn-port-options"
              onClick={() => setShowPortOptions(!showPortOptions)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                showPortOptions
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Configure local host port switch"
            >
              <Power className={`w-3.5 h-3.5 ${showPortOptions ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>Port Switch</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                {selectedSwitchPort}
              </span>
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

      {/* Unique Hardware-Style Multi-Position Port Rocker Switch Panel */}
      {showPortOptions && (
        <div className="mt-5 pt-5 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
          
          {/* Switch Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                  Multi-Channel Port Switcher
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a designated frequency channel or input a custom port
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Current Server:</span>
              <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                Port {activePort} {selectedSwitchPort === activePort ? '(Active)' : ''}
              </span>
            </div>
          </div>

          {/* PHYSICAL-STYLE MULTI-CHANNEL SWITCH SELECTOR */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2 md:p-3 shadow-inner">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-2 mb-2 flex items-center justify-between">
              <span>Channel Toggle Bank</span>
              <span className="text-cyan-400/80 font-mono">Selected: {selectedSwitchPort}</span>
            </div>

            {/* Segmented Rocker Switch Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PORT_PRESETS.map((preset) => {
                const isSelected = !isCustomMode && selectedSwitchPort === preset.port;
                const isCurrentlyActive = activePort === preset.port;

                return (
                  <button
                    key={preset.port}
                    id={`btn-port-switch-${preset.port}`}
                    onClick={() => handleSelectPort(preset.port)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 cursor-pointer border text-center ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/25 to-cyan-900/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 scale-[1.02]'
                        : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Status LED */}
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[9px] font-mono uppercase px-1 rounded ${
                        isSelected ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {preset.tag}
                      </span>
                      <span className={`w-2 h-2 rounded-full transition-all ${
                        isCurrentlyActive 
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' 
                          : isSelected 
                            ? 'bg-cyan-400 shadow-sm shadow-cyan-400' 
                            : 'bg-slate-700'
                      }`} />
                    </div>

                    {/* Port Number Display */}
                    <span className={`font-mono text-base font-bold tracking-tight ${
                      isSelected ? 'text-cyan-300' : 'text-slate-100'
                    }`}>
                      {preset.label}
                    </span>

                    {/* Subtitle */}
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate w-full">
                      {preset.desc}
                    </span>

                    {/* Active State Marker */}
                    {isCurrentlyActive && (
                      <span className="absolute -bottom-1 text-[8px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom Port Switch Tab */}
              <button
                id="btn-port-switch-custom"
                onClick={() => setIsCustomMode(true)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 cursor-pointer border text-center ${
                  isCustomMode
                    ? 'bg-gradient-to-b from-indigo-500/25 to-indigo-900/40 border-indigo-400 text-white shadow-lg shadow-indigo-500/10 scale-[1.02]'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[9px] font-mono uppercase px-1 rounded ${
                    isCustomMode ? 'bg-indigo-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Custom
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isCustomMode ? 'bg-indigo-400 shadow-sm shadow-indigo-400' : 'bg-slate-700'}`} />
                </div>

                <span className={`font-mono text-base font-bold tracking-tight ${
                  isCustomMode ? 'text-indigo-300' : 'text-slate-100'
                }`}>
                  {isCustomMode && customPortInput ? customPortInput : 'Other'}
                </span>

                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Any 1-65535
                </span>
              </button>
            </div>

            {/* Custom Port Input Field if Custom Mode Active */}
            {isCustomMode && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">Custom Port Number:</span>
                <input
                  type="text"
                  value={customPortInput}
                  onChange={(e) => handleCustomPortChange(e.target.value)}
                  placeholder="e.g. 2222, 4000, 7777"
                  className="bg-slate-900 border border-indigo-500/50 rounded-lg px-3 py-1 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32"
                  autoFocus
                />
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-indigo-300 font-mono">http://localhost:{selectedSwitchPort}</strong>
                </span>
              </div>
            )}
          </div>

          {/* DYNAMIC INSTANT LAUNCHER COMMAND GENERATOR FOR SELECTED PORT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Launch / Run Server on Port <span className="font-mono text-cyan-300">:{selectedSwitchPort}</span>
              </span>

              {selectedSwitchPort === activePort ? (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Currently Active on Host
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" /> Use command below to start on port {selectedSwitchPort}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Windows 1-Click Launch Command */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Windows Launcher</div>
                  <div className="font-mono text-xs text-cyan-300 font-medium mt-1">start.bat {selectedSwitchPort}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Runs on port {selectedSwitchPort} &amp; auto-opens browser</p>
                </div>
                <button
                  id={`btn-copy-win-${selectedSwitchPort}`}
                  onClick={() => handleCopyCmd(`start.bat ${selectedSwitchPort}`, `win-${selectedSwitchPort}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer active:scale-95"
                >
                  {copiedPortCmd === `win-${selectedSwitchPort}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPortCmd === `win-${selectedSwitchPort}` ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>

              {/* Linux / macOS Launch Command */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Linux / macOS</div>
                  <div className="font-mono text-xs text-cyan-300 font-medium mt-1">./start.sh {selectedSwitchPort}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Or: PORT={selectedSwitchPort} ./start.sh</p>
                </div>
                <button
                  id={`btn-copy-sh-${selectedSwitchPort}`}
                  onClick={() => handleCopyCmd(`./start.sh ${selectedSwitchPort}`, `sh-${selectedSwitchPort}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer active:scale-95"
                >
                  {copiedPortCmd === `sh-${selectedSwitchPort}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPortCmd === `sh-${selectedSwitchPort}` ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>

              {/* Standalone Node CLI Command */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Direct Node CLI</div>
                  <div className="font-mono text-xs text-cyan-300 font-medium mt-1">node server.cjs --port {selectedSwitchPort}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Zero dependencies CLI invocation</p>
                </div>
                <button
                  id={`btn-copy-node-${selectedSwitchPort}`}
                  onClick={() => handleCopyCmd(`node dist/server.cjs --port ${selectedSwitchPort}`, `node-${selectedSwitchPort}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer active:scale-95"
                >
                  {copiedPortCmd === `node-${selectedSwitchPort}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPortCmd === `node-${selectedSwitchPort}` ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


