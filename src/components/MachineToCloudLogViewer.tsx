import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cloud, 
  Radio, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Bug, 
  Cpu, 
  Zap, 
  Server, 
  RefreshCw,
  Terminal,
  Activity,
  Send,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { MachineLigne, MachineToCloudLogEntry, CloudProtocol, CloudFlowDirection } from '../types';

interface MachineToCloudLogViewerProps {
  logs: MachineToCloudLogEntry[];
  machines: MachineLigne[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClearLogs: () => void;
  onTriggerManualPing: () => void;
  onInjectCloudFault: (fault: 'NORMAL' | 'HIGH_LATENCY' | 'RATE_LIMIT_429' | 'GATEWAY_TIMEOUT_504' | 'INJECTED_THERMAL_ALERT') => void;
  activeCloudFault: 'NORMAL' | 'HIGH_LATENCY' | 'RATE_LIMIT_429' | 'GATEWAY_TIMEOUT_504' | 'INJECTED_THERMAL_ALERT';
}

export const MachineToCloudLogViewer: React.FC<MachineToCloudLogViewerProps> = ({
  logs,
  machines,
  isStreaming,
  onToggleStreaming,
  onClearLogs,
  onTriggerManualPing,
  onInjectCloudFault,
  activeCloudFault
}) => {
  // Filters
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Expanded log rows
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll anchor
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll]);

  // Copy JSON payload
  const handleCopyPayload = (id: string, payload: Record<string, any>) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered log list
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedProtocol !== 'ALL' && log.protocol !== selectedProtocol) return false;
      if (selectedMachineId !== 'ALL' && String(log.machineId) !== selectedMachineId) return false;
      if (selectedDirection !== 'ALL' && log.direction !== selectedDirection) return false;
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'SUCCESS' && log.status !== 'SUCCESS') return false;
        if (selectedStatus === 'WARNING' && log.status !== 'WARNING') return false;
        if (selectedStatus === 'ERROR' && log.status !== 'ERROR') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inSummary = log.summary.toLowerCase().includes(q);
        const inEndpoint = log.endpointOrTopic.toLowerCase().includes(q);
        const inMachine = log.machineNom.toLowerCase().includes(q);
        const inCode = String(log.responseCode).toLowerCase().includes(q);
        const inPayload = JSON.stringify(log.payloadJson).toLowerCase().includes(q);
        if (!inSummary && !inEndpoint && !inMachine && !inCode && !inPayload) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedProtocol, selectedMachineId, selectedDirection, selectedStatus, searchQuery]);

  // Statistics
  const totalCount = logs.length;
  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const errorCount = logs.filter(l => l.status === 'ERROR').length;
  const warningCount = logs.filter(l => l.status === 'WARNING').length;
  const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '100.0';
  const avgLatency = totalCount > 0 
    ? (logs.reduce((acc, l) => acc + l.cloudLatencyMs, 0) / totalCount).toFixed(1) 
    : '15.0';

  // Export handlers
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `machine_to_cloud_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['Horodatage', 'ID', 'Protocole', 'Direction', 'Machine', 'Endpoint_Topic', 'Code_Reponse', 'Latence_ms', 'Statut', 'Resume'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.id,
      l.protocol,
      l.direction,
      `"${l.machineNom.replace(/"/g, '""')}"`,
      `"${l.endpointOrTopic.replace(/"/g, '""')}"`,
      `"${String(l.responseCode).replace(/"/g, '""')}"`,
      l.cloudLatencyMs,
      l.status,
      `"${l.summary.replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `machine_to_cloud_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Telemetry Cloud Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Volet d'Échange Machine-to-Cloud (IIoT & Ingestion Temps Réel)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                  EDGE ➔ CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Surveillance du pipeline d'ingestion télémétrique : sérialisation edge, chiffrement TLS 1.3, courtier MQTT Sparkplug B, API REST et publication AMQP.
              </p>
            </div>
          </div>

          {/* Quick simulation / debug triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTriggerManualPing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-[1.02]"
              title="Émettre immédiatement un paquet télémétrique de test"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ping Test Manuel</span>
            </button>

            {/* Injected Fault Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Bug className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400 text-[11px] hidden sm:inline">Test Réseau :</span>
              <select
                value={activeCloudFault}
                onChange={e => onInjectCloudFault(e.target.value as any)}
                className="bg-transparent font-mono text-purple-300 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="NORMAL" className="bg-slate-900 text-white">Nominal (100% OK)</option>
                <option value="HIGH_LATENCY" className="bg-slate-900 text-amber-300">Gigue WAN (240ms)</option>
                <option value="RATE_LIMIT_429" className="bg-slate-900 text-rose-300">HTTP 429 (Rate Limit)</option>
                <option value="GATEWAY_TIMEOUT_504" className="bg-slate-900 text-rose-400">Timeout 504 (Gateway)</option>
                <option value="INJECTED_THERMAL_ALERT" className="bg-slate-900 text-orange-300">Alerte Prioritaire (QoS 2)</option>
              </select>
            </div>

            {/* Stream toggle */}
            <button
              onClick={onToggleStreaming}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isStreaming
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              {isStreaming ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Flux Actif</span>
                  <Pause className="w-3 h-3 ml-0.5 opacity-60" />
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-amber-400" />
                  <span>En Pause</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cloud Endpoints & Protocol KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Courtier MQTT Broker</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-mono text-xs text-white font-bold truncate">mqtts://iot.blady.cloud:8883</span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 block">TLS 1.3 • Sparkplug B v1.0</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Latence Moyenne WAN</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="font-mono text-base text-emerald-400 font-bold">{avgLatency}</span>
              <span className="text-[10px] text-slate-400">ms (RTT)</span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Edge ➔ Ingest API Gateway</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Taux de Réussite Ingestion</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="font-mono text-base text-sky-400 font-bold">{successRate}%</span>
              <span className="text-[10px] text-slate-400">ACK</span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 block">
              {errorCount > 0 ? `${errorCount} incident(s) détecté(s)` : '0 rejet / 0 perte'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Trames Capturées</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="font-mono text-base text-indigo-300 font-bold">{totalCount}</span>
              <span className="text-[10px] text-slate-400">échanges</span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Tampon circulaire (max 150)</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans les payloads (topic, métrique, température, 200 OK)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer select-none mr-2">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 accent-cyan-500 rounded"
              />
              <span className="text-[11px]">Défilement auto</span>
            </label>

            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Exporter les logs affichés au format JSON"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Exporter les logs affichés au format CSV (Excel compatible)"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={onClearLogs}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Vider l'historique des trames"
            >
              <Trash2 className="w-3 h-3" />
              <span>Effacer</span>
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Protocol filter */}
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">Protocole :</label>
            <select
              value={selectedProtocol}
              onChange={e => setSelectedProtocol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Tous les protocoles</option>
              <option value="MQTT_SPARKPLUG_B">MQTT (Sparkplug B)</option>
              <option value="HTTPS_REST">HTTPS (REST API)</option>
              <option value="OPC_UA_PUBSUB">OPC UA PubSub (AMQP)</option>
              <option value="WEBSOCKET_WSS">WebSocket (WSS Stream)</option>
            </select>
          </div>

          {/* Machine filter */}
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">Machine :</label>
            <select
              value={selectedMachineId}
              onChange={e => setSelectedMachineId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Toutes les machines ({machines.length})</option>
              {machines.map(m => (
                <option key={m.id} value={String(m.id)}>#{m.id} - {m.nom.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Direction filter */}
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">Sens du flux :</label>
            <select
              value={selectedDirection}
              onChange={e => setSelectedDirection(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Tous les sens</option>
              <option value="EDGE_TO_CLOUD">Edge ➔ Cloud (Ingest)</option>
              <option value="CLOUD_TO_EDGE">Cloud ➔ Edge (Sync)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">Statut :</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="SUCCESS">Succès (200 / PUBACK)</option>
              <option value="WARNING">Avertissements / Dérives</option>
              <option value="ERROR">Erreurs / Timeout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Terminal Streaming Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Terminal Title Bar */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-mono text-slate-400 ml-2 font-medium">
              journal-machine-to-cloud.log • {filteredLogs.length} échange(s) listé(s)
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 Active</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>QoS 1 Ingress</span>
          </div>
        </div>

        {/* Logs Feed Container */}
        <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-850 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Cloud className="w-10 h-10 mx-auto opacity-30 animate-pulse text-cyan-400" />
              <p className="font-medium text-slate-400">Aucun log ne correspond aux critères de filtre.</p>
              <p className="text-[11px]">Modifiez les filtres de protocole ou relancez le flux télémétrique.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const isError = log.status === 'ERROR';
              const isWarning = log.status === 'WARNING';

              // Protocol color badge
              let protoBadge = 'bg-sky-950 text-sky-300 border-sky-800';
              let protoLabel = 'MQTT SpB';
              if (log.protocol === 'HTTPS_REST') {
                protoBadge = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                protoLabel = 'HTTPS REST';
              } else if (log.protocol === 'OPC_UA_PUBSUB') {
                protoBadge = 'bg-purple-950 text-purple-300 border-purple-800';
                protoLabel = 'OPC UA PubSub';
              } else if (log.protocol === 'WEBSOCKET_WSS') {
                protoBadge = 'bg-indigo-950 text-indigo-300 border-indigo-800';
                protoLabel = 'WSS Stream';
              }

              return (
                <div 
                  key={log.id}
                  className={`transition-colors ${
                    isExpanded 
                      ? 'bg-slate-900/90' 
                      : isError 
                      ? 'bg-rose-950/20 hover:bg-rose-950/30' 
                      : isWarning
                      ? 'bg-amber-950/15 hover:bg-amber-950/25'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Summary Row */}
                  <div 
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <button className="text-slate-500 hover:text-slate-300">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      {/* Timestamp */}
                      <span className="text-slate-500 text-[11px] shrink-0">{log.timestamp}</span>

                      {/* Direction */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 flex items-center gap-1 border ${
                        log.direction === 'EDGE_TO_CLOUD'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                      }`}>
                        {log.direction === 'EDGE_TO_CLOUD' ? (
                          <>
                            <span>EDGE➔CLOUD</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </>
                        ) : (
                          <>
                            <span>CLOUD➔EDGE</span>
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                          </>
                        )}
                      </span>

                      {/* Protocol */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ${protoBadge}`}>
                        {protoLabel}
                      </span>

                      {/* Machine */}
                      <span className="text-slate-300 text-[11px] font-semibold shrink-0">
                        {log.machineNom.split(' ')[0]}
                      </span>

                      {/* Topic or Endpoint */}
                      <span className="text-slate-400 text-[11px] truncate max-w-xs md:max-w-md hidden sm:inline" title={log.endpointOrTopic}>
                        {log.endpointOrTopic}
                      </span>
                    </div>

                    {/* Right side stats */}
                    <div className="flex items-center space-x-2.5 text-[11px] shrink-0 pl-6 md:pl-0">
                      {/* Latency */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        log.cloudLatencyMs < 20 
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : log.cloudLatencyMs < 100
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
                      }`}>
                        {log.cloudLatencyMs} ms
                      </span>

                      {/* Payload size */}
                      <span className="text-slate-500 text-[10px] hidden md:inline">
                        {log.payloadBytes} B
                      </span>

                      {/* Response status code */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : log.status === 'WARNING'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-rose-950/90 text-rose-300 border-rose-800'
                      }`}>
                        {log.responseCode}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-slate-900 border-t border-slate-800 space-y-4">
                      
                      {/* Human-readable summary banner */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start space-x-2">
                        <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white">Analyse de trame : </span>
                          <span>{log.summary}</span>
                        </div>
                      </div>

                      {/* Error details if any */}
                      {log.errorDetails && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs text-rose-200 flex items-start space-x-2 font-mono">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase tracking-wider block">Diagnostic d'erreur :</span>
                            <p className="mt-0.5 leading-relaxed">{log.errorDetails}</p>
                          </div>
                        </div>
                      )}

                      {/* Ingestion Pipeline Latency Breakdown */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Décomposition de la Latence du Pipeline Ingestion (Total : {log.cloudLatencyMs} ms)</span>
                          </span>
                          <span className="text-slate-500 text-[10px]">Profilage micro-secondes</span>
                        </div>

                        {/* Breakdown progress bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">1. Sérialisation Edge</span>
                            <span className="text-white font-bold">{log.pipelineBreakdown.edgePackingMs} ms</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">2. Chiffrement TLS 1.3</span>
                            <span className="text-cyan-300 font-bold">{log.pipelineBreakdown.tlsEncryptionMs} ms</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">3. RTT Réseau WAN</span>
                            <span className="text-indigo-300 font-bold">{log.pipelineBreakdown.networkWanRttMs} ms</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">4. Ingestion Cloud DB</span>
                            <span className="text-emerald-300 font-bold">{log.pipelineBreakdown.cloudIngestionMs} ms</span>
                          </div>
                        </div>
                      </div>

                      {/* Payload and Headers Split */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        
                        {/* JSON Telemetry Payload */}
                        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Contenu Payload JSON (Télémétrie) :</span>
                            <button
                              onClick={() => handleCopyPayload(log.id, log.payloadJson)}
                              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white text-[10px] transition-colors"
                            >
                              {copiedId === log.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copier JSON</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-sky-300 font-mono text-[11px] p-2 bg-slate-900 rounded-lg overflow-x-auto max-h-48">
                            {JSON.stringify(log.payloadJson, null, 2)}
                          </pre>
                        </div>

                        {/* Network En-têtes & Métadonnées */}
                        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                          <span className="text-slate-400 text-xs font-medium block">
                            En-têtes Protocolaires & Métadonnées :
                          </span>
                          <div className="bg-slate-900 p-2 rounded-lg max-h-48 overflow-y-auto space-y-1 text-[11px] font-mono">
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span className="text-slate-500">endpoint/topic:</span>
                              <span className="text-slate-200 truncate max-w-xs">{log.endpointOrTopic}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span className="text-slate-500">method:</span>
                              <span className="text-cyan-300 font-semibold">{log.methodOrMessageType}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-1">
                              <span className="text-slate-500">machineRef:</span>
                              <span className="text-slate-200">ID #{log.machineId} ({log.machineNom})</span>
                            </div>
                            {log.headers && Object.entries(log.headers).map(([k, v]) => (
                              <div key={k} className="flex justify-between border-b border-slate-800/60 pb-1 last:border-0">
                                <span className="text-slate-500">{k}:</span>
                                <span className="text-slate-300 truncate max-w-xs">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Footer Status Line */}
        <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Flux temps réel Edge-to-Cloud actif sur port 8883 (MQTTs) & 443 (HTTPS)</span>
          </div>
          <div>
            Filtré : <strong className="text-white">{filteredLogs.length}</strong> / {totalCount} logs
          </div>
        </div>

      </div>

    </div>
  );
};
