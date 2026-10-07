import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Server,
  Zap,
  Activity,
  Radio,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  Send,
  Database
} from 'lucide-react';
import { MachineLigne, PlcStation } from '../types';

interface HardwareProtocolLatencyBoardProps {
  machines: MachineLigne[];
  plcs: PlcStation[];
  isLiveSimulating: boolean;
  onPollMachine?: (machineId: number) => void;
  onToggleFault?: (plcId: string) => void;
}

export interface MachineProtocolTelemetry {
  machineId: number;
  modbusStatus: 'ONLINE' | 'POLLING' | 'WARNING' | 'TIMEOUT' | 'OFFLINE';
  modbusLatencyMs: number;
  modbusJitterMs: number;
  modbusPacketsSec: number;
  modbusPort: number;
  modbusSlaveId: number;
  opcUaStatus: 'CONNECTED' | 'SUBSCRIBED' | 'WARNING' | 'DISCONNECTED';
  opcUaLatencyMs: number;
  opcUaEndpoint: string;
  opcUaPublishIntervalMs: number;
  hardwareBusType: 'PROFINET / RJ45' | 'EtherNet/IP' | 'Modbus RTU / RS-485' | 'CANopen';
  plcScanCycleMs: number;
  lastHeartbeat: string;
  pingActive: boolean;
}

export const HardwareProtocolLatencyBoard: React.FC<HardwareProtocolLatencyBoardProps> = ({
  machines,
  plcs,
  isLiveSimulating,
  onPollMachine,
  onToggleFault
}) => {
  // Live dynamic telemetry state per machine
  const [telemetryMap, setTelemetryMap] = useState<Record<number, MachineProtocolTelemetry>>(() => {
    const initial: Record<number, MachineProtocolTelemetry> = {};
    machines.forEach((m, idx) => {
      const plc = plcs.find((p) => p.machineId === m.id) || plcs[idx % plcs.length];
      const baseLat = plc?.latencyMs || 2.4 + idx * 0.8;
      initial[m.id] = {
        machineId: m.id,
        modbusStatus: plc?.status === 'OFFLINE' ? 'OFFLINE' : plc?.simulatedFault === 'TIMEOUT' ? 'TIMEOUT' : 'ONLINE',
        modbusLatencyMs: baseLat,
        modbusJitterMs: Number((Math.random() * 0.4 + 0.1).toFixed(2)),
        modbusPacketsSec: 25 + Math.floor(Math.random() * 10),
        modbusPort: 502,
        modbusSlaveId: plc?.slaveId || idx + 1,
        opcUaStatus: plc?.status === 'OFFLINE' ? 'DISCONNECTED' : 'SUBSCRIBED',
        opcUaLatencyMs: Number((baseLat * 0.85 + 0.5).toFixed(1)),
        opcUaEndpoint: `opc.tcp://${plc?.ipAddress || '192.168.1.' + (10 + idx)}:4840`,
        opcUaPublishIntervalMs: 50,
        hardwareBusType: idx === 0 ? 'PROFINET / RJ45' : idx === 1 ? 'EtherNet/IP' : idx === 2 ? 'PROFINET / RJ45' : 'Modbus RTU / RS-485',
        plcScanCycleMs: Number((4.5 + Math.random() * 1.5).toFixed(1)),
        lastHeartbeat: new Date().toLocaleTimeString('fr-FR'),
        pingActive: false
      };
    });
    return initial;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'opc-ua' | 'modbus' | 'latency-alert'>('all');
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);

  // Live simulation tick: fluctuate latency and pulse packets
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setTelemetryMap((prev) => {
        const next = { ...prev };
        machines.forEach((m, idx) => {
          const current = next[m.id];
          if (!current) return;

          const plc = plcs.find((p) => p.machineId === m.id);
          const isFaulty = plc?.status === 'OFFLINE' || plc?.simulatedFault === 'TIMEOUT';
          const isHighLat = plc?.simulatedFault === 'HIGH_LATENCY';

          let modbusLat: number;
          let opcUaLat: number;

          if (isFaulty) {
            modbusLat = 2500;
            opcUaLat = 2500;
          } else if (isHighLat) {
            modbusLat = Number((240 + Math.random() * 60).toFixed(1));
            opcUaLat = Number((210 + Math.random() * 50).toFixed(1));
          } else {
            // Normal slight jitter
            const delta = (Math.random() * 0.6 - 0.3);
            modbusLat = Math.max(1.2, Number((current.modbusLatencyMs + delta).toFixed(1)));
            opcUaLat = Math.max(1.0, Number((current.opcUaLatencyMs + delta * 0.8).toFixed(1)));
          }

          next[m.id] = {
            ...current,
            modbusStatus: isFaulty ? 'TIMEOUT' : isHighLat ? 'WARNING' : 'POLLING',
            opcUaStatus: isFaulty ? 'DISCONNECTED' : 'SUBSCRIBED',
            modbusLatencyMs: modbusLat,
            modbusJitterMs: Number((Math.random() * 0.5 + 0.1).toFixed(2)),
            modbusPacketsSec: isFaulty ? 0 : 20 + Math.floor(Math.random() * 15),
            opcUaLatencyMs: opcUaLat,
            lastHeartbeat: new Date().toLocaleTimeString('fr-FR'),
            pingActive: !isFaulty && Math.random() > 0.4
          };
        });
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveSimulating, machines, plcs]);

  // Helper to color latency badge & gauge
  const getLatencyColor = (latencyMs: number) => {
    if (latencyMs >= 1000) return { text: 'text-rose-400', bg: 'bg-rose-950/80', border: 'border-rose-700', bar: 'bg-rose-500', label: 'Timeout (>1s)' };
    if (latencyMs > 100) return { text: 'text-amber-400', bg: 'bg-amber-950/80', border: 'border-amber-700', bar: 'bg-amber-500', label: 'Critique (>100ms)' };
    if (latencyMs > 25) return { text: 'text-yellow-300', bg: 'bg-yellow-950/60', border: 'border-yellow-700', bar: 'bg-yellow-400', label: 'Modérée' };
    return { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-700', bar: 'bg-emerald-400', label: 'Temps Réel (<10ms)' };
  };

  const handleManualPing = (machineId: number) => {
    setTelemetryMap((prev) => ({
      ...prev,
      [machineId]: {
        ...prev[machineId],
        pingActive: true,
        lastHeartbeat: new Date().toLocaleTimeString('fr-FR')
      }
    }));
    if (onPollMachine) {
      onPollMachine(machineId);
    }
    setTimeout(() => {
      setTelemetryMap((prev) => ({
        ...prev,
        [machineId]: { ...prev[machineId], pingActive: false }
      }));
    }, 600);
  };

  const filteredMachines = machines.filter((m) => {
    if (activeFilter === 'all') return true;
    const telem = telemetryMap[m.id];
    if (!telem) return true;
    if (activeFilter === 'latency-alert') {
      return telem.modbusLatencyMs > 25 || telem.modbusStatus === 'TIMEOUT';
    }
    return true;
  });

  // Calculate overall stats
  const totalModbusActive = Object.values(telemetryMap).filter((t) => t.modbusStatus !== 'TIMEOUT' && t.modbusStatus !== 'OFFLINE').length;
  const totalOpcActive = Object.values(telemetryMap).filter((t) => t.opcUaStatus === 'SUBSCRIBED' || t.opcUaStatus === 'CONNECTED').length;
  const averageLatency = (
    Object.values(telemetryMap).reduce((acc, t) => acc + (t.modbusLatencyMs < 1000 ? t.modbusLatencyMs : 0), 0) /
    Math.max(1, totalModbusActive)
  ).toFixed(1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-sky-400 border border-sky-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Matrice de Connectivité Matérielle & Statut des Protocoles
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Temps Réel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Surveillance dynamique des bus de terrain (OPC UA Binary & Modbus/TCP) avec télémétrie de latence matérielle par machine.
              </p>
            </div>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Modbus/TCP :</span>
            <span className="font-mono font-bold text-emerald-300">{totalModbusActive}/{machines.length} en ligne</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">OPC UA :</span>
            <span className="font-mono font-bold text-sky-300">{totalOpcActive}/{machines.length} abonnés</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Latence Moy. :</span>
            <span className="font-mono font-bold text-amber-300">{averageLatency} ms</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Vue :</span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
              activeFilter === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Toutes les Machines ({machines.length})
          </button>
          <button
            onClick={() => setActiveFilter('latency-alert')}
            className={`px-3 py-1 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              activeFilter === 'latency-alert'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-300" />
            <span>Alertes Latence / Timeout</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
          Échantillonnage matériel : cycle 50 ms (20 Hz)
        </span>
      </div>

      {/* Grid of Machines with Protocol Status & Latency Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMachines.map((machine) => {
          const telem = telemetryMap[machine.id];
          const plc = plcs.find((p) => p.machineId === machine.id);
          const modbusColor = getLatencyColor(telem?.modbusLatencyMs || 5);
          const opcUaColor = getLatencyColor(telem?.opcUaLatencyMs || 5);

          const isSelected = selectedMachineId === machine.id;
          const isFault = telem?.modbusStatus === 'TIMEOUT' || plc?.status === 'OFFLINE';

          return (
            <div
              key={machine.id}
              onClick={() => setSelectedMachineId(isSelected ? null : machine.id)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-950 border-sky-500 ring-2 ring-sky-500/20 shadow-xl'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              {/* Subtle pulsing background glow when pinging */}
              {telem?.pingActive && (
                <div className="absolute inset-0 bg-sky-500/5 pointer-events-none animate-pulse" />
              )}

              <div>
                {/* Top: Machine Title & Physical Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-300 font-bold text-xs">
                      {machine.id}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight truncate max-w-[150px]">
                        {machine.nom}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {plc?.name || `PLC-0${machine.id}`} • {plc?.ipAddress || '192.168.1.1' + machine.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      machine.statut === 'EnMarche'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {machine.statut}
                    </span>
                  </div>
                </div>

                {/* Protocol 1: Modbus/TCP Card */}
                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 mb-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-semibold text-slate-200 text-[11px]">Modbus/TCP</span>
                      <span className="text-[9px] font-mono text-slate-500">Port {telem?.modbusPort || 502}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        telem?.modbusStatus === 'TIMEOUT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : telem?.modbusStatus === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {telem?.modbusStatus || 'ONLINE'}
                      </span>
                    </div>
                  </div>

                  {/* Latency Gauge Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Latence RTT :</span>
                      <span className={`font-bold ${modbusColor.text}`}>
                        {telem?.modbusLatencyMs || 2.4} ms
                      </span>
                    </div>
                    {/* Visual latency bar (scale 0 to 100ms) */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${modbusColor.bar}`}
                        style={{
                          width: `${Math.min(100, Math.max(5, ((telem?.modbusLatencyMs || 2) / 80) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Protocol 2: OPC UA Binary Card */}
                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <Server className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold text-slate-200 text-[11px]">OPC UA (IEC 62541)</span>
                    </div>

                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      telem?.opcUaStatus === 'DISCONNECTED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-sky-950 text-sky-300 border border-sky-800'
                    }`}>
                      {telem?.opcUaStatus || 'SUBSCRIBED'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Délai Session :</span>
                      <span className={`font-bold ${opcUaColor.text}`}>
                        {telem?.opcUaLatencyMs || 2.1} ms
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${opcUaColor.bar}`}
                        style={{
                          width: `${Math.min(100, Math.max(5, ((telem?.opcUaLatencyMs || 2) / 80) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono truncate" title={machine.nodeOpcUa}>
                    Tag : <span className="text-slate-300">{machine.nodeOpcUa}</span>
                  </div>
                </div>

                {/* Hardware Bus details */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Bus Matériel :</span>
                    <span className="text-slate-300 font-semibold">{telem?.hardwareBusType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cycle PLC :</span>
                    <span className="text-slate-300 font-semibold">{telem?.plcScanCycleMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions: Ping & Fault injection */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  Battement: {telem?.lastHeartbeat}
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualPing(machine.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all"
                    title="Envoyer un ping matériel et forcer la scrutation"
                  >
                    <RefreshCw className={`w-3 h-3 ${telem?.pingActive ? 'animate-spin' : ''}`} />
                    <span>Ping</span>
                  </button>

                  {plc && onToggleFault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFault(plc.id);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        isFault
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                      title={isFault ? "Rétablir la connexion matérielle" : "Simuler un timeout matériel"}
                    >
                      {isFault ? "Rétablir" : "Défaut"}
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
