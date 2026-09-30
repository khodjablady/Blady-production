import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Thermometer, 
  Gauge, 
  Sliders, 
  RotateCcw, 
  X, 
  ChevronRight,
  Flame,
  Activity
} from 'lucide-react';
import { TelemetryAlert } from '../types';

interface TelemetryAlertBannerProps {
  alerts: TelemetryAlert[];
  onOpenThresholdsConfig: () => void;
  onResetInjectedAlarms: () => void;
  hasInjectedAlarms: boolean;
  onAcknowledgeAlerts?: () => void;
  isAcknowledged?: boolean;
}

export const TelemetryAlertBanner: React.FC<TelemetryAlertBannerProps> = ({
  alerts,
  onOpenThresholdsConfig,
  onResetInjectedAlarms,
  hasInjectedAlarms,
  onAcknowledgeAlerts,
  isAcknowledged = false
}) => {
  if (alerts.length === 0 || isAcknowledged) return null;

  const criticalCount = alerts.filter(a => a.severite === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severite === 'WARNING').length;
  const isCritical = criticalCount > 0;

  return (
    <div 
      className={`rounded-2xl border p-4 shadow-xl transition-all duration-300 animate-in slide-in-from-top-3 ${
        isCritical 
          ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-rose-500 shadow-rose-950/50 ring-1 ring-rose-400/40' 
          : 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500 shadow-amber-950/50 ring-1 ring-amber-400/40'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        
        {/* Left header with pulsating icon */}
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
            isCritical 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded tracking-wider border ${
                isCritical 
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                  : 'bg-amber-600 text-white border-amber-400'
              }`}>
                {isCritical ? 'DÉPASSEMENT CRITIQUE PROCÉDÉ' : 'AVERTISSEMENT TÉLÉMÉTRIE'}
              </span>

              <span className="text-xs font-bold text-white">
                {alerts.length} paramètre(s) hors tolérances configurées
              </span>

              {criticalCount > 0 && (
                <span className="text-[10px] font-mono text-rose-300 font-semibold">
                  ({criticalCount} critique{criticalCount > 1 ? 's' : ''})
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] font-mono text-amber-300 font-semibold">
                  ({warningCount} warning{warningCount > 1 ? 's' : ''})
                </span>
              )}
            </div>

            {/* List of breached parameters */}
            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-2">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`flex flex-wrap items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border font-mono ${
                    alert.severite === 'CRITICAL'
                      ? 'bg-rose-950/70 text-rose-200 border-rose-500/40'
                      : 'bg-amber-950/70 text-amber-200 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {alert.parametre === 'temperature' ? (
                      <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    ) : alert.parametre === 'pression' ? (
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="font-bold text-white">{alert.machineNom.split(' ')[0]}</span>
                    <span className="text-slate-400">• {alert.parametreNom} :</span>
                    <span className={`font-bold ${alert.severite === 'CRITICAL' ? 'text-rose-300 underline' : 'text-amber-300'}`}>
                      {alert.valeurActuelle} {alert.unite}
                    </span>
                    <span className="text-slate-400">
                      ({alert.typeBreach.includes('HIGH') ? 'max :' : 'min :'} {alert.valeurSeuil} {alert.unite})
                    </span>
                  </div>

                  <span className="text-[10px] opacity-75 font-sans">
                    {alert.severite === 'CRITICAL' ? 'Arrêt recommandé' : 'Surveillance'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
          {hasInjectedAlarms && (
            <button
              onClick={onResetInjectedAlarms}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Annuler les dérives de test injectées et rétablir les valeurs nominales"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Rétablir Nominal</span>
            </button>
          )}

          <button
            onClick={onOpenThresholdsConfig}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all hover:scale-[1.02] ${
              isCritical
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/60'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ajuster Seuils</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {onAcknowledgeAlerts && (
            <button
              onClick={onAcknowledgeAlerts}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Acquitter l'affichage visuel temporairement"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
