import React, { useState } from 'react';
import { 
  Sliders, 
  Thermometer, 
  Gauge, 
  Layers, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Info,
  Flame,
  Check,
  X
} from 'lucide-react';
import { MachineLigne, MachineTelemetryThresholds, TelemetryAlert } from '../types';
import { DEFAULT_TELEMETRY_THRESHOLDS } from '../utils/telemetryThresholds';

interface TelemetryThresholdsPanelProps {
  machines: MachineLigne[];
  thresholds: Record<number, MachineTelemetryThresholds>;
  onSaveThresholds: (updatedThresholds: Record<number, MachineTelemetryThresholds>) => void;
  onResetDefaults: () => void;
  activeAlerts: TelemetryAlert[];
  injectedCuveAlarm: boolean;
  onToggleInjectedCuveAlarm: () => void;
  injectedPressureMachineId?: number;
  onToggleInjectedPressure: (machineId: number) => void;
}

export const TelemetryThresholdsPanel: React.FC<TelemetryThresholdsPanelProps> = ({
  machines,
  thresholds,
  onSaveThresholds,
  onResetDefaults,
  activeAlerts,
  injectedCuveAlarm,
  onToggleInjectedCuveAlarm,
  injectedPressureMachineId,
  onToggleInjectedPressure
}) => {
  const [localThresholds, setLocalThresholds] = useState<Record<number, MachineTelemetryThresholds>>(thresholds);
  const [selectedMachineId, setSelectedMachineId] = useState<number>(machines[0]?.id || 1);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync with prop when changed externally
  React.useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];
  const currentConfig = localThresholds[selectedMachineId] || DEFAULT_TELEMETRY_THRESHOLDS[selectedMachineId];

  const handleUpdateTemp = (field: 'min' | 'maxWarning' | 'maxCritical', value: number) => {
    setLocalThresholds(prev => {
      const existing = prev[selectedMachineId] || { machineId: selectedMachineId, machineNom: selectedMachine.nom };
      const currentTemp = existing.temperature || {
        enabled: true,
        min: 10.0,
        maxWarning: 26.0,
        maxCritical: 32.0,
        unit: '°C'
      };
      return {
        ...prev,
        [selectedMachineId]: {
          ...existing,
          temperature: {
            ...currentTemp,
            [field]: Number(value)
          }
        }
      };
    });
  };

  const handleToggleTempEnabled = () => {
    setLocalThresholds(prev => {
      const existing = prev[selectedMachineId] || { machineId: selectedMachineId, machineNom: selectedMachine.nom };
      const currentTemp = existing.temperature || {
        enabled: true,
        min: 10.0,
        maxWarning: 26.0,
        maxCritical: 32.0,
        unit: '°C'
      };
      return {
        ...prev,
        [selectedMachineId]: {
          ...existing,
          temperature: {
            ...currentTemp,
            enabled: !currentTemp.enabled
          }
        }
      };
    });
  };

  const handleUpdatePress = (field: 'min' | 'maxWarning' | 'maxCritical', value: number) => {
    setLocalThresholds(prev => {
      const existing = prev[selectedMachineId] || { machineId: selectedMachineId, machineNom: selectedMachine.nom };
      const currentPress = existing.pression || {
        enabled: true,
        min: 0.8,
        maxWarning: 1.45,
        maxCritical: 1.8,
        unit: 'bar'
      };
      return {
        ...prev,
        [selectedMachineId]: {
          ...existing,
          pression: {
            ...currentPress,
            [field]: Number(value)
          }
        }
      };
    });
  };

  const handleTogglePressEnabled = () => {
    setLocalThresholds(prev => {
      const existing = prev[selectedMachineId] || { machineId: selectedMachineId, machineNom: selectedMachine.nom };
      const currentPress = existing.pression || {
        enabled: true,
        min: 0.8,
        maxWarning: 1.45,
        maxCritical: 1.8,
        unit: 'bar'
      };
      return {
        ...prev,
        [selectedMachineId]: {
          ...existing,
          pression: {
            ...currentPress,
            enabled: !currentPress.enabled
          }
        }
      };
    });
  };

  const handleSave = () => {
    onSaveThresholds(localThresholds);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const machineAlerts = activeAlerts.filter(a => a.machineId === selectedMachineId);

  // Live value helpers
  const currentTemp = (selectedMachine.id === 1 && injectedCuveAlarm) ? 48.6 : selectedMachine.temperatureC;
  const isHighPressInjected = injectedPressureMachineId === selectedMachine.id;
  const currentPress = isHighPressInjected 
    ? (currentConfig?.pression ? currentConfig.pression.maxCritical + 5.0 : 180.0) 
    : selectedMachine.pressionBar;

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Configuration des Seuils d'Alerte Télémétrie
                </h3>
                {activeAlerts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                    {activeAlerts.length} anomalie(s) active(s)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                    Tous paramètres nominaux
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Définissez les seuils minimums, alertes préventives (Warning) et alarmes critiques (Critical) pour la température et la pression.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onResetDefaults}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Rétablir les seuils standards recommandés par l'ingénierie procédés"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Rétablir Usine</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all hover:scale-[1.02]"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Appliquer les Seuils</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Machine Selector Tabs */}
        <div className="flex items-center overflow-x-auto space-x-2 mt-5 pt-4 border-t border-slate-800/80">
          {machines.map(m => {
            const hasAlert = activeAlerts.some(a => a.machineId === m.id);
            const hasCrit = activeAlerts.some(a => a.machineId === m.id && a.severite === 'CRITICAL');
            const isSelected = m.id === selectedMachineId;

            return (
              <button
                key={m.id}
                onClick={() => setSelectedMachineId(m.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-sky-600/30 text-sky-200 border-sky-500/60 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  hasCrit 
                    ? 'bg-rose-500 animate-ping' 
                    : hasAlert 
                    ? 'bg-amber-400' 
                    : m.statut === 'EnMarche' 
                    ? 'bg-emerald-400' 
                    : 'bg-slate-500'
                }`} />
                <span className="font-semibold">{m.nom.split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-slate-500">#{m.id}</span>
                {hasAlert && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    hasCrit ? 'bg-rose-500 text-white' : 'bg-amber-500/30 text-amber-300'
                  }`}>
                    {activeAlerts.filter(a => a.machineId === m.id).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Machine Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Machine banner header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                Machine ID #{selectedMachine.id}
              </span>
              <h4 className="text-base font-bold text-white">
                {selectedMachine.nom}
              </h4>
              <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                selectedMachine.statut === 'EnMarche'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : selectedMachine.statut === 'Panne'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {selectedMachine.statut}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Type : <span className="font-mono text-slate-300">{selectedMachine.type}</span> • Nœud OPC UA : <span className="font-mono text-sky-400">{selectedMachine.nodeOpcUa}</span>
            </p>
          </div>

          {/* Quick simulation buttons for testing threshold breach */}
          <div className="flex items-center space-x-2">
            {selectedMachine.id === 1 && (
              <button
                onClick={onToggleInjectedCuveAlarm}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  injectedCuveAlarm
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40'
                }`}
                title="Simuler un dépassement thermique immédiat sur la cuve (48.6°C)"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{injectedCuveAlarm ? 'Annuler Alarme Cuve' : 'Tester Dérive T°C (48.6°C)'}</span>
              </button>
            )}

            {(selectedMachine.id === 2 || selectedMachine.id === 3 || selectedMachine.id === 1) && (
              <button
                onClick={() => onToggleInjectedPressure(selectedMachine.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isHighPressInjected
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
                }`}
                title="Simuler une surpression hydraulique au-delà du seuil critique"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{isHighPressInjected ? 'Annuler Surpression' : 'Tester Surpression critique'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Active machine alerts (if any) */}
        {machineAlerts.length > 0 && (
          <div className="space-y-2">
            {machineAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs animate-in fade-in ${
                  alert.severite === 'CRITICAL' 
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200' 
                    : 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${
                  alert.severite === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      {alert.severite === 'CRITICAL' ? '🚨 Seuil Critique Dépassé' : '⚠️ Avertissement Seuil Dépassé'}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">{alert.timestamp}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PARAMÈTRE 1 : TEMPÉRATURE */}
          {currentConfig?.temperature ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-white">Seuils de Température (°C)</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-[11px] text-slate-400">Activer surveillance :</span>
                  <input
                    type="checkbox"
                    checked={currentConfig.temperature.enabled}
                    onChange={handleToggleTempEnabled}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Current Value Display & Visual Gauge */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Valeur mesurée en direct</span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className={`text-xl font-bold font-mono ${
                      currentTemp !== undefined && currentTemp >= currentConfig.temperature.maxCritical
                        ? 'text-rose-400 animate-pulse'
                        : currentTemp !== undefined && currentTemp >= currentConfig.temperature.maxWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {currentTemp !== undefined ? currentTemp.toFixed(1) : '--'}
                    </span>
                    <span className="text-xs text-slate-400">°C</span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono">
                  <span className="text-slate-400">Nominale : </span>
                  <span className="text-slate-200">22.4 °C</span>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Seuil Min (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!currentConfig.temperature.enabled}
                    value={currentConfig.temperature.min ?? 10.0}
                    onChange={e => handleUpdateTemp('min', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 disabled:opacity-50 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">Alerte basse</span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-amber-400 mb-1">
                    Max Warning (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!currentConfig.temperature.enabled}
                    value={currentConfig.temperature.maxWarning}
                    onChange={e => handleUpdateTemp('maxWarning', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-amber-500/50 disabled:opacity-50 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[9px] text-amber-500/80 mt-0.5 block">Avertissement</span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-rose-400 mb-1">
                    Max Critique (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!currentConfig.temperature.enabled}
                    value={currentConfig.temperature.maxCritical}
                    onChange={e => handleUpdateTemp('maxCritical', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-rose-500/50 disabled:opacity-50 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-200 focus:outline-none focus:border-rose-400"
                  />
                  <span className="text-[9px] text-rose-500/80 mt-0.5 block">Alarme arrêt</span>
                </div>
              </div>

              {/* Progress scale visual indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{currentConfig.temperature.min ?? 10}°C</span>
                  <span className="text-amber-400">▲ {currentConfig.temperature.maxWarning}°C</span>
                  <span className="text-rose-400">▲ {currentConfig.temperature.maxCritical}°C</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500/60" style={{ width: '60%' }} title="Zone nominale" />
                  <div className="h-full bg-amber-500/80" style={{ width: '25%' }} title="Zone d'avertissement" />
                  <div className="h-full bg-rose-500" style={{ width: '15%' }} title="Zone critique" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center text-slate-500">
              <Thermometer className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-xs">Pas de sonde de température process configurée pour cette machine.</p>
            </div>
          )}

          {/* PARAMÈTRE 2 : PRESSION */}
          {currentConfig?.pression ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-sm text-white">Seuils de Pression (bar)</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-[11px] text-slate-400">Activer surveillance :</span>
                  <input
                    type="checkbox"
                    checked={currentConfig.pression.enabled}
                    onChange={handleTogglePressEnabled}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Current Value Display */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Pression mesurée en direct</span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className={`text-xl font-bold font-mono ${
                      currentPress !== undefined && currentPress >= currentConfig.pression.maxCritical
                        ? 'text-rose-400 animate-pulse'
                        : currentPress !== undefined && currentPress >= currentConfig.pression.maxWarning
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}>
                      {currentPress !== undefined ? currentPress.toFixed(2) : '--'}
                    </span>
                    <span className="text-xs text-slate-400">bar</span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono">
                  <span className="text-slate-400">Nominale : </span>
                  <span className="text-slate-200">
                    {selectedMachine.id === 2 ? '140.0 bar' : selectedMachine.id === 3 ? '2.10 bar' : '1.25 bar'}
                  </span>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Seuil Min (bar)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    disabled={!currentConfig.pression.enabled}
                    value={currentConfig.pression.min ?? 0.8}
                    onChange={e => handleUpdatePress('min', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 disabled:opacity-50 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">Dépression / amorçage</span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-amber-400 mb-1">
                    Max Warning (bar)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    disabled={!currentConfig.pression.enabled}
                    value={currentConfig.pression.maxWarning}
                    onChange={e => handleUpdatePress('maxWarning', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-amber-500/50 disabled:opacity-50 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[9px] text-amber-500/80 mt-0.5 block">Surpression modérée</span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-rose-400 mb-1">
                    Max Critique (bar)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    disabled={!currentConfig.pression.enabled}
                    value={currentConfig.pression.maxCritical}
                    onChange={e => handleUpdatePress('maxCritical', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-rose-500/50 disabled:opacity-50 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-200 focus:outline-none focus:border-rose-400"
                  />
                  <span className="text-[9px] text-rose-500/80 mt-0.5 block">Soupape / Décharge</span>
                </div>
              </div>

              {/* Progress scale */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{currentConfig.pression.min ?? 0.8} bar</span>
                  <span className="text-amber-400">▲ {currentConfig.pression.maxWarning} bar</span>
                  <span className="text-rose-400">▲ {currentConfig.pression.maxCritical} bar</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-cyan-500/60" style={{ width: '60%' }} title="Zone nominale" />
                  <div className="h-full bg-amber-500/80" style={{ width: '25%' }} title="Zone d'avertissement" />
                  <div className="h-full bg-rose-500" style={{ width: '15%' }} title="Zone critique" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center text-slate-500">
              <Gauge className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-xs">Pas de capteur de pression configuré pour cette machine.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
