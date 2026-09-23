import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Zap, 
  Sliders, 
  HardDrive,
  Clock,
  Gauge,
  ShieldCheck,
  Server,
  Wrench,
  AlertOctagon,
  XCircle,
  RotateCcw,
  Bug,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { PlcStation, MachineLigne, SimulatedFaultType } from '../types';

interface PlcDashboardProps {
  plcs: PlcStation[];
  machines: MachineLigne[];
  selectedPlcId: string | null;
  onSelectPlc: (id: string) => void;
  onPollPlc: (plcId: string) => void;
  onTogglePlcOffline: (plcId: string) => void;
  diagnosticMode?: boolean;
  targetDiagnosticPlcId?: string;
  onSelectTargetDiagnosticPlc?: (plcId: string) => void;
  onInjectFault?: (plcId: string, fault: SimulatedFaultType) => void;
  onResetFault?: (plcId: string) => void;
  onResetAllFaults?: () => void;
}

export const PlcDashboard: React.FC<PlcDashboardProps> = ({
  plcs,
  machines,
  selectedPlcId,
  onSelectPlc,
  onPollPlc,
  onTogglePlcOffline,
  diagnosticMode = false,
  targetDiagnosticPlcId,
  onSelectTargetDiagnosticPlc,
  onInjectFault,
  onResetFault,
  onResetAllFaults
}) => {
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null);

  // Global network KPIs
  const onlineCount = plcs.filter(p => p.status === 'ONLINE').length;
  const avgLatency = (plcs.reduce((acc, p) => acc + (p.status === 'ONLINE' ? p.latencyMs : 0), 0) / Math.max(1, onlineCount)).toFixed(1);
  const totalCycles = plcs.reduce((acc, p) => acc + p.cycleCount, 0);

  // Active faults count in diagnostic mode
  const activeFaultsCount = plcs.filter(p => p.simulatedFault && p.simulatedFault !== 'NONE').length;
  const activeTargetId = targetDiagnosticPlcId || selectedPlcId || 'PLC-01';
  const targetPlc = plcs.find(p => p.id === activeTargetId) || plcs[0];

  // Sparkline renderer
  const renderSparkline = (history: number[], isOffline: boolean, simulatedFault?: SimulatedFaultType) => {
    if (isOffline || simulatedFault === 'TIMEOUT') {
      return (
        <div className="h-7 w-24 flex items-center justify-center text-[10px] text-rose-500 font-mono font-bold animate-pulse">
          {simulatedFault === 'TIMEOUT' ? 'TIMEOUT (2.5s)' : 'NO CARRIER'}
        </div>
      );
    }
    const max = Math.max(...history, 10);
    const min = Math.min(...history, 0);
    const range = max - min || 1;
    const width = 96;
    const height = 24;
    const step = width / (history.length - 1);

    const points = history
      .map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');

    const strokeColor = simulatedFault === 'HIGH_LATENCY' 
      ? '#f59e0b' 
      : simulatedFault === 'INTERMITTENT_LOSS'
      ? '#f97316'
      : history[history.length - 1] > 20
      ? '#fbbf24'
      : '#38bdf8';

    return (
      <svg className="w-24 h-6 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {history.length > 0 && (
          <circle
            cx={(history.length - 1) * step}
            cy={height - ((history[history.length - 1] - min) / range) * (height - 4) - 2}
            r="2.5"
            fill={strokeColor}
          />
        )}
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Network Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Automates En Ligne</div>
            <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              <span>{onlineCount} / {plcs.length} PLC</span>
              {onlineCount === plcs.length ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Latence Moyenne Bus</div>
            <div className="text-sm font-bold text-sky-400 font-mono">
              {avgLatency} ms <span className="text-[10px] text-slate-500 font-sans font-normal">(TCP RTT)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Fréquence Échange</div>
            <div className="text-sm font-bold text-indigo-300 font-mono">
              ~28 trames/s <span className="text-[10px] text-slate-500 font-sans font-normal">(10-20 Hz)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Sous-réseau Modbus/TCP</div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              192.168.1.0/24 <span className="text-[10px] text-slate-500 font-sans font-normal">(VLAN 10)</span>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC MODE CONTROL PANEL */}
      {diagnosticMode && (
        <div className="bg-slate-900/95 border-2 border-purple-500/50 rounded-xl p-4 shadow-xl shadow-purple-950/20 text-xs space-y-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500"></div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">Mode Diagnostic : Injection Manuelle d'Erreurs de Communication</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                    TESTS DE ROBUSTESSE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulez des incidents réseau et protocolaires sur un automate spécifique pour vérifier la réactivité et l'affichage des alertes MES.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-center">
              {activeFaultsCount > 0 ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activeFaultsCount} panne(s) active(s)</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Flotte nominale (0 panne)</span>
                </span>
              )}

              {onResetAllFaults && (
                <button
                  onClick={onResetAllFaults}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                  title="Rétablir l'état nominal pour tous les automates"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tout Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {/* Target PLC Selector */}
          <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>1. Sélectionner l'automate programmable cible :</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Automate ciblé : <span className="font-bold text-sky-300">{targetPlc?.id} - {targetPlc?.brand} ({targetPlc?.ipAddress})</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {plcs.map(p => {
                const isTarget = activeTargetId === p.id;
                const hasFault = p.simulatedFault && p.simulatedFault !== 'NONE';
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (onSelectTargetDiagnosticPlc) {
                        onSelectTargetDiagnosticPlc(p.id);
                      } else {
                        onSelectPlc(p.id);
                      }
                    }}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      isTarget
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      hasFault ? 'bg-amber-400 animate-pulse' : p.status === 'OFFLINE' ? 'bg-rose-500' : 'bg-emerald-400'
                    }`} />
                    <span className="font-mono font-bold text-sky-300">{p.id}</span>
                    <span className="text-slate-400">({p.brand.split(' ')[0]})</span>
                    {hasFault && (
                      <span className="text-[9px] font-mono font-bold bg-amber-950 px-1.5 py-0.2 rounded text-amber-300 border border-amber-800">
                        {p.simulatedFault}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fault Injection Actions for the selected target PLC */}
          <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                <span>2. Injecter une panne sur {targetPlc?.id} ({targetPlc?.brand}) :</span>
              </span>
              {targetPlc?.simulatedFault && targetPlc.simulatedFault !== 'NONE' && onResetFault && (
                <button
                  onClick={() => onResetFault(targetPlc.id)}
                  className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold underline underline-offset-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rétablir {targetPlc.id} à l'état nominal</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Fault 1: Timeout */}
              <button
                onClick={() => onInjectFault?.(targetPlc?.id || 'PLC-01', 'TIMEOUT')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  targetPlc?.simulatedFault === 'TIMEOUT'
                    ? 'bg-rose-950/80 border-rose-500 ring-1 ring-rose-500/50 text-white'
                    : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40 hover:bg-slate-850 text-slate-200'
                }`}
                title="Simule une absence complète de réponse TCP (>2500ms). Déclenche l'alerte MES-COM-01."
              >
                <div className="flex items-center justify-between mb-1">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-900">
                    2500ms
                  </span>
                </div>
                <div className="font-bold text-xs">Timeout Réseau</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">WSAETIMEDOUT (TCP)</div>
              </button>

              {/* Fault 2: Exception 0x02 */}
              <button
                onClick={() => onInjectFault?.(targetPlc?.id || 'PLC-01', 'EXCEPTION_02')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  targetPlc?.simulatedFault === 'EXCEPTION_02'
                    ? 'bg-purple-950/80 border-purple-500 ring-1 ring-purple-500/50 text-white'
                    : 'bg-slate-900/90 border-slate-800 hover:border-purple-500/40 hover:bg-slate-850 text-slate-200'
                }`}
                title="Simule un code exception Modbus 0x02 (Illegal Data Address). Déclenche l'alerte MES-COM-02."
              >
                <div className="flex items-center justify-between mb-1">
                  <AlertOctagon className="w-4 h-4 text-purple-400" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950/60 text-purple-400 border border-purple-900">
                    FC 0x83
                  </span>
                </div>
                <div className="font-bold text-xs">Exception 0x02</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Illegal Data Address</div>
              </button>

              {/* Fault 3: Exception 0x03 */}
              <button
                onClick={() => onInjectFault?.(targetPlc?.id || 'PLC-01', 'ILLEGAL_DATA')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  targetPlc?.simulatedFault === 'ILLEGAL_DATA'
                    ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500/50 text-white'
                    : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 text-slate-200'
                }`}
                title="Simule un code exception Modbus 0x03 (Illegal Data Value). Déclenche l'alerte MES-COM-03."
              >
                <div className="flex items-center justify-between mb-1">
                  <AlertTriangle className="w-4 h-4 text-indigo-400" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-900">
                    FC 0x83
                  </span>
                </div>
                <div className="font-bold text-xs">Exception 0x03</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Illegal Data Value</div>
              </button>

              {/* Fault 4: Latence Critique */}
              <button
                onClick={() => onInjectFault?.(targetPlc?.id || 'PLC-01', 'HIGH_LATENCY')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  targetPlc?.simulatedFault === 'HIGH_LATENCY'
                    ? 'bg-amber-950/80 border-amber-500 ring-1 ring-amber-500/50 text-white'
                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 text-slate-200'
                }`}
                title="Simule un pic de latence réseau (>280ms) avec forte gigue. Déclenche l'avertissement MES-COM-04."
              >
                <div className="flex items-center justify-between mb-1">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-900">
                    &gt;280ms
                  </span>
                </div>
                <div className="font-bold text-xs">Latence Critique</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Gigue & bufferbloat</div>
              </button>

              {/* Fault 5: Pertes Intermittentes */}
              <button
                onClick={() => onInjectFault?.(targetPlc?.id || 'PLC-01', 'INTERMITTENT_LOSS')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  targetPlc?.simulatedFault === 'INTERMITTENT_LOSS'
                    ? 'bg-orange-950/80 border-orange-500 ring-1 ring-orange-500/50 text-white'
                    : 'bg-slate-900/90 border-slate-800 hover:border-orange-500/40 hover:bg-slate-850 text-slate-200'
                }`}
                title="Simule une perte intermittente de paquets (50%). Permet de tester le flapping et le debounce des alertes."
              >
                <div className="flex items-center justify-between mb-1">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-orange-950/60 text-orange-400 border border-orange-900">
                    50% Drop
                  </span>
                </div>
                <div className="font-bold text-xs">Pertes 50%</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Flapping réseau</div>
              </button>

              {/* Fault 6: Coupure Port 502 / Offline */}
              <button
                onClick={() => onInjectFault?.(targetPlc?.id || 'PLC-01', 'OFFLINE')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  targetPlc?.status === 'OFFLINE'
                    ? 'bg-rose-950/80 border-rose-500 ring-1 ring-rose-500/50 text-white'
                    : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40 hover:bg-slate-850 text-slate-200'
                }`}
                title="Simule une rupture de lien physique (câble débranché ou port fermé). Déclenche l'alerte critique MES-COM-00."
              >
                <div className="flex items-center justify-between mb-1">
                  <WifiOff className="w-4 h-4 text-rose-500" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-900">
                    Down
                  </span>
                </div>
                <div className="font-bold text-xs">Coupure Port 502</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Déconnexion physique</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLC Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plcs.map((plc) => {
          const isOffline = plc.status === 'OFFLINE';
          const isSelected = selectedPlcId === plc.id;
          const hasSimulatedFault = plc.simulatedFault && plc.simulatedFault !== 'NONE';
          const machine = machines.find(m => m.id === plc.machineId);
          const isMenuOpen = cardMenuOpen === plc.id;

          // Border color based on status or active simulated fault
          let cardBorderClass = isSelected
            ? 'border-sky-500 ring-1 ring-sky-500/50 bg-slate-900/90'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60';

          if (hasSimulatedFault || isOffline) {
            if (plc.simulatedFault === 'HIGH_LATENCY' || plc.simulatedFault === 'INTERMITTENT_LOSS') {
              cardBorderClass = 'border-amber-500/70 shadow-lg shadow-amber-950/20 bg-slate-900/90 ring-1 ring-amber-500/30';
            } else if (plc.simulatedFault === 'EXCEPTION_02' || plc.simulatedFault === 'ILLEGAL_DATA') {
              cardBorderClass = 'border-purple-500/70 shadow-lg shadow-purple-950/20 bg-slate-900/90 ring-1 ring-purple-500/30';
            } else {
              cardBorderClass = 'border-rose-500/70 shadow-lg shadow-rose-950/20 bg-slate-900/90 ring-1 ring-rose-500/30';
            }
          }

          return (
            <div
              key={plc.id}
              onClick={() => onSelectPlc(plc.id)}
              className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer shadow-sm relative overflow-hidden ${cardBorderClass}`}
            >
              {/* Top Row: Brand, Model & Status Badge */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                      {plc.id}
                    </span>
                    <span className="text-xs font-bold text-white tracking-tight truncate max-w-[170px]">
                      {plc.brand}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                    {plc.model}
                  </div>
                </div>

                {/* Status indicator & Diagnostic Pill */}
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 border ${
                    isOffline
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : hasSimulatedFault
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isOffline ? (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>OFFLINE</span>
                      </>
                    ) : hasSimulatedFault ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>FAULT</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>ONLINE</span>
                      </>
                    )}
                  </span>

                  {hasSimulatedFault && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                      SIMUL: {plc.simulatedFault}
                    </span>
                  )}

                  {!hasSimulatedFault && (
                    <span className="text-[9px] text-slate-500 font-mono">
                      {plc.lastHeartbeat}
                    </span>
                  )}
                </div>
              </div>

              {/* ACTIVE ALERT BANNER (ROBUSTNESS TEST) */}
              {(hasSimulatedFault || isOffline) && (
                <div className={`mt-2.5 p-2.5 rounded-lg border flex items-start justify-between gap-2 text-xs ${
                  plc.simulatedFault === 'HIGH_LATENCY' || plc.simulatedFault === 'INTERMITTENT_LOSS'
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                    : plc.simulatedFault === 'EXCEPTION_02' || plc.simulatedFault === 'ILLEGAL_DATA'
                    ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                    : 'bg-rose-950/90 border-rose-500/70 text-rose-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 animate-pulse ${
                      plc.simulatedFault === 'HIGH_LATENCY' || plc.simulatedFault === 'INTERMITTENT_LOSS'
                        ? 'text-amber-400'
                        : plc.simulatedFault === 'EXCEPTION_02' || plc.simulatedFault === 'ILLEGAL_DATA'
                        ? 'text-purple-400'
                        : 'text-rose-400'
                    }`} />
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span>
                          {plc.simulatedFault === 'TIMEOUT' ? '[ALERTE MES-COM-01] TIMEOUT' :
                           plc.simulatedFault === 'EXCEPTION_02' ? '[ALERTE MES-COM-02] EXC 0x02' :
                           plc.simulatedFault === 'ILLEGAL_DATA' ? '[ALERTE MES-COM-03] EXC 0x03' :
                           plc.simulatedFault === 'HIGH_LATENCY' ? '[ATTENTION MES-COM-04] GIGUE/LATENCE' :
                           plc.simulatedFault === 'INTERMITTENT_LOSS' ? '[ALERTE MES-COM-05] PERTES 50%' :
                           '[CRITIQUE MES-COM-00] LIEN ROMPU'}
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug opacity-90 line-clamp-2">
                        {plc.activeAlert || (
                          plc.simulatedFault === 'TIMEOUT' ? 'Aucune réponse reçue du port 502 après 2500ms.' :
                          plc.simulatedFault === 'EXCEPTION_02' ? 'Code 0x02 : Adresse registre %MW9999 hors plage.' :
                          plc.simulatedFault === 'ILLEGAL_DATA' ? 'Code 0x03 : Donnée non conforme transmise.' :
                          plc.simulatedFault === 'HIGH_LATENCY' ? `Temps RTT anormal (${plc.latencyMs}ms > 50ms).` :
                          plc.simulatedFault === 'INTERMITTENT_LOSS' ? 'Flapping réseau : 50% de trames perdues.' :
                          'Liaison automate interrompue - Surveillance ligne stoppée.'
                        )}
                      </p>
                    </div>
                  </div>
                  {onResetFault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetFault(plc.id);
                      }}
                      className="shrink-0 px-2 py-1 text-[10px] rounded font-semibold bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
                      title="Rétablir la communication normale pour cet automate"
                    >
                      Rétablir
                    </button>
                  )}
                </div>
              )}

              {/* Machine & IP Details */}
              <div className="py-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px]">Machine associée :</span>
                  <span className="font-medium text-white truncate max-w-[160px]">
                    {plc.machineName.split(' ')[0]} {plc.machineName.split(' ')[1] || ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px]">Adresse IP & Port :</span>
                  <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                    {plc.ipAddress}:{plc.port} <span className="text-sky-400 font-semibold">(UID {plc.slaveId})</span>
                  </span>
                </div>

                {/* Latency Section with Real-Time Sparkline */}
                <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>Latence Réseau (Ping RTT)</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className={`text-lg font-bold font-mono tracking-tight ${
                        isOffline || plc.simulatedFault === 'TIMEOUT'
                          ? 'text-rose-500' 
                          : plc.latencyMs > 20 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`}>
                        {isOffline || plc.simulatedFault === 'TIMEOUT' ? '2500 ms' : `${plc.latencyMs} ms`}
                      </span>
                      {!isOffline && plc.simulatedFault !== 'TIMEOUT' && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (±{plc.jitterMs}ms)
                        </span>
                      )}
                    </div>
                    {!isOffline && plc.simulatedFault !== 'TIMEOUT' && (
                      <div className="text-[9px] text-slate-500 font-mono">
                        Min: {plc.latencyMin}ms | Max: {plc.latencyMax}ms
                      </div>
                    )}
                  </div>

                  {/* Mini sparkline */}
                  <div className="flex flex-col items-end">
                    {renderSparkline(plc.latencyHistory, isOffline, plc.simulatedFault)}
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                      10 derniers pings
                    </span>
                  </div>
                </div>

                {/* Hardware Telemetry Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Charge CPU Automate</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-sky-500 h-full rounded-full transition-all"
                          style={{ width: `${isOffline ? 0 : plc.cpuLoadPercent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-200">
                        {isOffline ? '0%' : `${plc.cpuLoadPercent}%`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Cycles Polling Traités</div>
                    <div className="font-mono text-xs font-bold text-indigo-300 mt-0.5">
                      {plc.cycleCount.toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Key registers snapshot */}
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>Registres Modbus Actifs :</span>
                    <span className="font-mono text-[9px] text-slate-500">{plc.activeRegisters.length} tags</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                    {plc.activeRegisters.slice(0, 4).map((reg, rIdx) => (
                      <div key={rIdx} className="bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 text-[9px] truncate max-w-[70px]" title={reg.name}>
                          {reg.address}
                        </span>
                        <span className="font-bold text-emerald-400">
                          {typeof reg.currentValue === 'boolean' 
                            ? (reg.currentValue ? 'TRUE' : 'FALSE')
                            : `${reg.currentValue}${reg.unit ? ` ${reg.unit}` : ''}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPollPlc(plc.id);
                    }}
                    disabled={isOffline}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-sky-400" />
                    <span>Poll Forcé</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlcOffline(plc.id);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                      isOffline
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isOffline ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        <span>Reconnecter</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>Déconnexion</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Per-card Diagnostic Quick Injection in Diagnostic Mode */}
                {diagnosticMode && (
                  <div className="relative">
                    {hasSimulatedFault ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetFault?.(plc.id);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                        title="Effacer la panne et rétablir l'état nominal"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Rétablir</span>
                      </button>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardMenuOpen(isMenuOpen ? null : plc.id);
                          }}
                          className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                          title="Injecter une erreur de communication sur cet automate"
                        >
                          <Bug className="w-3 h-3 text-purple-400" />
                          <span>Simuler Panne</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {/* Card Dropdown Menu */}
                        {isMenuOpen && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-1 w-52 bg-slate-950 border border-purple-500/40 rounded-xl shadow-2xl p-1.5 z-20 space-y-1 text-xs"
                          >
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                              Injecter sur {plc.id} :
                            </div>
                            <button
                              onClick={() => {
                                onInjectFault?.(plc.id, 'TIMEOUT');
                                setCardMenuOpen(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 flex items-center justify-between text-[11px]"
                            >
                              <span>Timeout Réseau (2500ms)</span>
                              <span className="text-[9px] font-mono text-rose-400">TIMEOUT</span>
                            </button>
                            <button
                              onClick={() => {
                                onInjectFault?.(plc.id, 'EXCEPTION_02');
                                setCardMenuOpen(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-purple-950/60 text-slate-200 hover:text-purple-200 flex items-center justify-between text-[11px]"
                            >
                              <span>Exception Modbus 0x02</span>
                              <span className="text-[9px] font-mono text-purple-400">EXC 02</span>
                            </button>
                            <button
                              onClick={() => {
                                onInjectFault?.(plc.id, 'ILLEGAL_DATA');
                                setCardMenuOpen(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-950/60 text-slate-200 hover:text-indigo-200 flex items-center justify-between text-[11px]"
                            >
                              <span>Exception Modbus 0x03</span>
                              <span className="text-[9px] font-mono text-indigo-400">EXC 03</span>
                            </button>
                            <button
                              onClick={() => {
                                onInjectFault?.(plc.id, 'HIGH_LATENCY');
                                setCardMenuOpen(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-950/60 text-slate-200 hover:text-amber-200 flex items-center justify-between text-[11px]"
                            >
                              <span>Latence Critique (&gt;280ms)</span>
                              <span className="text-[9px] font-mono text-amber-400">&gt;280ms</span>
                            </button>
                            <button
                              onClick={() => {
                                onInjectFault?.(plc.id, 'INTERMITTENT_LOSS');
                                setCardMenuOpen(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-orange-950/60 text-slate-200 hover:text-orange-200 flex items-center justify-between text-[11px]"
                            >
                              <span>Pertes de Paquets (50%)</span>
                              <span className="text-[9px] font-mono text-orange-400">50% DROP</span>
                            </button>
                            <button
                              onClick={() => {
                                onInjectFault?.(plc.id, 'OFFLINE');
                                setCardMenuOpen(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 flex items-center justify-between text-[11px]"
                            >
                              <span>Coupure Totale (Offline)</span>
                              <span className="text-[9px] font-mono text-rose-500">DOWN</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

