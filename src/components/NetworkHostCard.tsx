import React, { useState, useEffect } from 'react';
import { ServerInfo } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Wifi, 
  Copy, 
  Check, 
  QrCode, 
  Users, 
  HardDrive, 
  ExternalLink,
  ChevronDown,
  Cpu,
  Radio,
  Sliders,
  Power,
  Sparkles,
  ArrowRight,
  Terminal,
  Loader2,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface NetworkHostCardProps {
  serverInfo: ServerInfo | null;
  onOpenGuide: () => void;
  onPortSwitched?: () => void;
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

export const NetworkHostCard: React.FC<NetworkHostCardProps> = ({ 
  serverInfo, 
  onOpenGuide,
  onPortSwitched 
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPortOptions, setShowPortOptions] = useState(false);
  const [copiedPortCmd, setCopiedPortCmd] = useState<string | null>(null);
  const [selectedIpIndex, setSelectedIpIndex] = useState(0);

  // Auto-run status and transition states
  const [isSwitching, setIsSwitching] = useState(false);
  const [autoOpenInBrowser, setAutoOpenInBrowser] = useState(true);
  const [switchFeedback, setSwitchFeedback] = useState<{
    port: number;
    success: boolean;
    message: string;
    targetUrl: string;
  } | null>(null);

  // Compute active connection URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const activePort = serverInfo?.port || 3000;
  
  // Selected switch port (defaults to active host port or 3000)
  const [selectedSwitchPort, setSelectedSwitchPort] = useState<number>(activePort);
  const [customPortInput, setCustomPortInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    !PORT_PRESETS.some(p => p.port === activePort)
  );

  useEffect(() => {
    if (serverInfo?.port) {
      setSelectedSwitchPort(serverInfo.port);
      if (!PORT_PRESETS.some(p => p.port === serverInfo.port)) {
        setIsCustomMode(true);
        setCustomPortInput(serverInfo.port.toString());
      }
    }
  }, [serverInfo?.port]);

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

  // Perform Auto-run port switch
  const handleAutoRunPort = async (targetPort: number) => {
    setSelectedSwitchPort(targetPort);
    setIsSwitching(true);
    setSwitchFeedback(null);

    try {
      const res = await fetch('/api/server/switch-port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: targetPort }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSwitchFeedback({
          port: targetPort,
          success: true,
          message: data.message || `Server auto-bound to port ${targetPort}`,
          targetUrl: data.targetUrl || `http://localhost:${targetPort}`,
        });

        // Save in client storage
        try {
          localStorage.setItem('preferred_lan_port', targetPort.toString());
        } catch {
          // ignore
        }

        if (onPortSwitched) onPortSwitched();

        // If running locally on localhost and auto-open is enabled, open in new tab
        if (autoOpenInBrowser && typeof window !== 'undefined') {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isLocalhost && window.location.port !== targetPort.toString()) {
            setTimeout(() => {
              window.open(`http://localhost:${targetPort}`, '_blank');
            }, 400);
          }
        }
      } else {
        setSwitchFeedback({
          port: targetPort,
          success: false,
          message: data.error || 'Failed to auto-switch port',
          targetUrl: `http://localhost:${targetPort}`,
        });
      }
    } catch (err: any) {
      setSwitchFeedback({
        port: targetPort,
        success: false,
        message: err?.message || 'Server connection error during port switch',
        targetUrl: `http://localhost:${targetPort}`,
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSelectPort = (port: number) => {
    setIsCustomMode(false);
    handleAutoRunPort(port);
  };

  const handleCustomPortSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(customPortInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      handleAutoRunPort(parsed);
    }
  };

  const isCurrentActive = (port: number) => activePort === port;
  const isListeningPort = (port: number) => serverInfo?.activePorts?.includes(port) || activePort === port;

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
              title="Click to open auto-run port switch panel"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>Port: <strong className="text-white font-mono">{activePort}</strong></span>
              <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-200 rounded text-[10px] uppercase font-semibold group-hover:bg-cyan-400/30 transition-colors">
                {showPortOptions ? 'Close' : 'Auto-Switch'}
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
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-cyan-300 font-mono text-sm tracking-wide shadow-inner max-w-full overflow-hidden">
              <span className="select-all truncate">{connectUrl}</span>
            </div>

            <button
              id="btn-copy-address"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              id="btn-show-qr"
              onClick={() => setShowQr(!showQr)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
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
              title="Auto-run on custom port"
            >
              <Power className={`w-3.5 h-3.5 ${showPortOptions ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>Auto-Run Port</span>
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

        {/* Right: QR Code Preview */}
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

      {/* AUTO-RUN PORT SWITCH CONTROL PANEL */}
      {showPortOptions && (
        <div className="mt-5 pt-5 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
          
          {/* Switch Header with Auto-open setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Power className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                  Auto-Run Port Switcher
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono normal-case">
                    Instant Auto-Run
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Clicking any channel immediately switches the server port and auto-runs on that address
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto open toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoOpenInBrowser}
                  onChange={(e) => setAutoOpenInBrowser(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Auto-open browser on switch</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-emerald-400 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active: Port {activePort}
                </span>
              </div>
            </div>
          </div>

          {/* PHYSICAL-STYLE MULTI-CHANNEL SWITCH SELECTOR */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 md:p-3.5 shadow-inner">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-1 mb-2.5 flex items-center justify-between">
              <span>Instant Channel Select (1111 &bull; 2222 &bull; 3000 &bull; 5000 &bull; 8080)</span>
              {isSwitching && (
                <span className="text-cyan-400 flex items-center gap-1 font-mono text-[10px] animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Auto-running on Port {selectedSwitchPort}...
                </span>
              )}
            </div>

            {/* Segmented Rocker Switch Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PORT_PRESETS.map((preset) => {
                const isSelected = selectedSwitchPort === preset.port;
                const isLive = isCurrentActive(preset.port);
                const isListening = isListeningPort(preset.port);

                return (
                  <button
                    key={preset.port}
                    id={`btn-port-switch-${preset.port}`}
                    disabled={isSwitching}
                    onClick={() => handleSelectPort(preset.port)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 cursor-pointer border text-center ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/30 to-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 scale-[1.03] ring-1 ring-cyan-400/50'
                        : isLive
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:border-emerald-400'
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
                        isLive 
                          ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse' 
                          : isListening
                            ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                            : 'bg-slate-700'
                      }`} />
                    </div>

                    {/* Port Number Display */}
                    <span className={`font-mono text-base font-bold tracking-tight ${
                      isSelected ? 'text-cyan-300' : isLive ? 'text-emerald-300' : 'text-slate-100'
                    }`}>
                      {preset.label}
                    </span>

                    {/* Subtitle */}
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate w-full">
                      {preset.desc}
                    </span>

                    {/* Active State Marker */}
                    {isLive && (
                      <span className="absolute -bottom-1.5 text-[8px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow">
                        RUNNING
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
                    ? 'bg-gradient-to-b from-indigo-500/30 to-indigo-950/60 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-[1.03] ring-1 ring-indigo-400/50'
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
              <form onSubmit={handleCustomPortSubmit} className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">Enter Custom Port:</span>
                <input
                  type="text"
                  value={customPortInput}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setCustomPortInput(cleaned);
                  }}
                  placeholder="e.g. 7777, 4000"
                  className="bg-slate-900 border border-indigo-500/50 rounded-lg px-3 py-1 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-28"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!customPortInput || isSwitching}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Auto-Run Port
                </button>
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-indigo-300 font-mono">http://localhost:{customPortInput || selectedSwitchPort}</strong>
                </span>
              </form>
            )}
          </div>

          {/* AUTO-RUN LIVE STATUS & LAUNCH FEEDBACK */}
          {switchFeedback && (
            <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150 ${
              switchFeedback.success 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 text-xs">
                {switchFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Power className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{switchFeedback.message}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`http://localhost:${switchFeedback.port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open http://localhost:{switchFeedback.port}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* AUTO-RUN LAUNCHER COMMAND GENERATOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Launcher Shortcuts for Channel <span className="font-mono text-cyan-300">:{selectedSwitchPort}</span>
              </span>

              <span className="text-[11px] text-slate-400">
                Auto-saved to <code className="text-cyan-400 font-mono">port.conf</code>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Windows 1-Click Launch Command */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Windows Launcher</div>
                  <div className="font-mono text-xs text-cyan-300 font-medium mt-1">start.bat {selectedSwitchPort}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Auto-runs port {selectedSwitchPort} &amp; opens browser</p>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Zero dependencies CLI execution</p>
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
