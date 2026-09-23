import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  Trash2, 
  ArrowDownCircle, 
  Filter, 
  Download, 
  Search, 
  Send,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Layers
} from 'lucide-react';
import { ModbusLogEntry, PlcStation } from '../types';

interface ModbusLogTerminalProps {
  logs: ModbusLogEntry[];
  plcs: PlcStation[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClearLogs: () => void;
  onManualSend: (plcId: string, fc: number, reg: number, val: number) => void;
  onExportCsv?: () => void;
}

export const ModbusLogTerminal: React.FC<ModbusLogTerminalProps> = ({
  logs,
  plcs,
  isStreaming,
  onToggleStreaming,
  onClearLogs,
  onManualSend,
  onExportCsv
}) => {
  const [selectedPlcFilter, setSelectedPlcFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'TX' | 'RX'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Manual command state
  const [cmdPlc, setCmdPlc] = useState<string>('PLC-01');
  const [cmdFc, setCmdFc] = useState<number>(5); // FC05 Write Single Coil or FC06
  const [cmdReg, setCmdReg] = useState<number>(1);
  const [cmdVal, setCmdVal] = useState<number>(1);
  const [isSending, setIsSending] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (selectedPlcFilter !== 'ALL' && log.plcId !== selectedPlcFilter) return false;
    if (directionFilter !== 'ALL' && log.direction !== directionFilter) return false;
    if (statusFilter === 'SUCCESS' && log.status !== 'SUCCESS') return false;
    if (statusFilter === 'ERROR' && log.status === 'SUCCESS') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        log.decodedSummary.toLowerCase().includes(q) ||
        log.hexFrame.toLowerCase().includes(q) ||
        log.plcId.toLowerCase().includes(q) ||
        log.functionName.toLowerCase().includes(q) ||
        String(log.transactionId).includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSendManual = () => {
    setIsSending(true);
    onManualSend(cmdPlc, cmdFc, cmdReg, cmdVal);
    setTimeout(() => setIsSending(false), 400);
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `modbus_tcp_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[560px]">
      
      {/* Terminal Top Bar */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="h-4 w-px bg-slate-800"></div>
          <span className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Console Modbus/TCP (Port 502)</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {filteredLogs.length} / {logs.length} trames
          </span>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleStreaming}
            title={isStreaming ? 'Suspendre la capture en direct' : 'Reprendre la capture'}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-semibold transition-colors ${
              isStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Live Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>En Pause</span>
              </>
            )}
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[11px] border transition-colors flex items-center gap-1 ${
              autoScroll
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Défilement automatique"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Auto-scroll</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Effacer les logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-semibold transition-colors shadow-sm"
              title="Exporter les logs et erreurs Modbus/TCP au format CSV pour analyse hors-ligne"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exporter Logs</span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800/60">
                CSV
              </span>
            </button>
          )}

          <button
            onClick={handleExportLogs}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Exporter logs (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* PLC filter */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[11px]">Automate:</span>
            <select
              value={selectedPlcFilter}
              onChange={(e) => setSelectedPlcFilter(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tous les PLCs (5)</option>
              {plcs.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name.split(' ')[1] || p.name}</option>
              ))}
            </select>
          </div>

          {/* Direction filter */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setDirectionFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                directionFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setDirectionFilter('TX')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                directionFilter === 'TX' ? 'bg-sky-600 text-white font-bold' : 'text-sky-400/70 hover:text-sky-300'
              }`}
            >
              TX (Req)
            </button>
            <button
              onClick={() => setDirectionFilter('RX')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                directionFilter === 'RX' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400/70 hover:text-emerald-300'
              }`}
            >
              RX (Rep)
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-1 pl-1">
            <button
              onClick={() => setStatusFilter(statusFilter === 'ERROR' ? 'ALL' : 'ERROR')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                statusFilter === 'ERROR'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                  : 'text-slate-400 border-transparent hover:text-rose-400'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Erreurs / Timeouts</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrer par tag, hex, TID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 text-slate-200 pl-8 pr-3 py-1 rounded text-[11px] font-mono border border-slate-800 focus:outline-none focus:border-sky-500 w-44 md:w-56"
          />
        </div>
      </div>

      {/* Terminal Output Window */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-10">
            <Radio className="w-8 h-8 text-slate-600 animate-pulse" />
            <p>Aucune trame correspondant aux filtres sélectionnés.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isTx = log.direction === 'TX';
            const isTimeout = log.status === 'TIMEOUT';
            const isExc = log.status.startsWith('EXCEPTION');
            const targetPlc = plcs.find(p => p.id === log.plcId);

            return (
              <div 
                key={log.id} 
                className={`py-1 px-2.5 rounded border transition-colors ${
                  isTimeout 
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' 
                    : isExc 
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                    : isTx 
                    ? 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900' 
                    : 'bg-emerald-950/10 border-emerald-900/30 hover:bg-emerald-950/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-mono">{log.timestamp}</span>
                    
                    {/* Direction badge */}
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      isTx ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.direction}
                    </span>

                    {/* PLC ID & IP */}
                    <span className="text-slate-200 font-bold">
                      {log.plcId}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">
                      ({targetPlc?.ipAddress || '192.168.1.x'}:{targetPlc?.port || 502})
                    </span>

                    {/* Function code */}
                    <span className="text-indigo-400 font-semibold">
                      {log.functionName}
                    </span>

                    {/* TID & Slave */}
                    <span className="text-slate-500 text-[10px]">
                      TID:#{log.transactionId} | UID:{log.unitId}
                    </span>
                  </div>

                  {/* Latency & Status */}
                  <div className="flex items-center space-x-2">
                    {log.latencyMs > 0 && (
                      <span className={`font-mono ${
                        log.latencyMs > 15 ? 'text-amber-400 font-bold' : log.latencyMs > 50 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {log.latencyMs}ms
                      </span>
                    )}
                    <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                      isTimeout 
                        ? 'bg-rose-500 text-white' 
                        : isExc 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>

                {/* Hex dump & Decoded summary */}
                <div className="mt-1 grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
                  <div className="md:col-span-5 font-mono text-[10px] text-cyan-300/80 bg-black/40 px-2 py-0.5 rounded overflow-x-auto select-all">
                    {log.hexFrame}
                  </div>
                  <div className="md:col-span-7 text-[11px] text-slate-300 flex items-center">
                    <span className="text-slate-400 mr-1.5">↳</span>
                    <span className="font-sans font-medium text-slate-200">{log.decodedSummary}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Manual Modbus Command Injector Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
            <Send className="w-3 h-3 text-sky-400" />
            <span>Test Télégramme Manuel :</span>
          </span>
          
          <select
            value={cmdPlc}
            onChange={(e) => setCmdPlc(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono"
          >
            {plcs.map(p => (
              <option key={p.id} value={p.id}>{p.id} ({p.name.split(' ')[1] || p.name})</option>
            ))}
          </select>

          <select
            value={cmdFc}
            onChange={(e) => setCmdFc(Number(e.target.value))}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono"
          >
            <option value={3}>FC03 Read Holding Registers</option>
            <option value={1}>FC01 Read Coils</option>
            <option value={5}>FC05 Write Single Coil</option>
            <option value={6}>FC06 Write Single Register</option>
          </select>

          <div className="flex items-center space-x-1 font-mono text-[11px]">
            <span className="text-slate-400">Reg:</span>
            <input
              type="number"
              value={cmdReg}
              onChange={(e) => setCmdReg(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-center"
            />
          </div>

          <div className="flex items-center space-x-1 font-mono text-[11px]">
            <span className="text-slate-400">Val:</span>
            <input
              type="number"
              value={cmdVal}
              onChange={(e) => setCmdVal(Number(e.target.value))}
              className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-center"
            />
          </div>
        </div>

        <button
          onClick={handleSendManual}
          disabled={isSending}
          className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
        >
          <Send className="w-3 h-3" />
          <span>{isSending ? 'Émission...' : 'Émettre Trame'}</span>
        </button>
      </div>

    </div>
  );
};
