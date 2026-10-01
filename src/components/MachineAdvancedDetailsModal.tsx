import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  ShieldAlert, 
  Wrench, 
  Activity, 
  Cpu, 
  Calendar, 
  User, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Gauge, 
  Layers, 
  Server, 
  FileText, 
  ArrowRight,
  Info,
  Timer,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { MachineLigne, InterventionMaintenance, TelemetryAlert, MachineTelemetryThresholds } from '../types';
import { getMachineAdvancedStatistics } from '../utils/machineAdvancedStats';

interface MachineAdvancedDetailsModalProps {
  isOpen: boolean;
  machine: MachineLigne | null;
  onClose: () => void;
  interventions: InterventionMaintenance[];
  activeAlerts: TelemetryAlert[];
  thresholds?: MachineTelemetryThresholds;
  onNavigateToMaintenance?: () => void;
  onNavigateToCurves?: (machineId: number) => void;
  onNavigateToThresholds?: () => void;
}

export const MachineAdvancedDetailsModal: React.FC<MachineAdvancedDetailsModalProps> = ({
  isOpen,
  machine,
  onClose,
  interventions,
  activeAlerts,
  thresholds,
  onNavigateToMaintenance,
  onNavigateToCurves,
  onNavigateToThresholds
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'maintenance' | 'telemetry'>('overview');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !machine) return null;

  const stats = getMachineAdvancedStatistics(machine, interventions, activeAlerts);
  const machineAlerts = stats.currentActiveAlerts;
  const hasCriticalAlert = machineAlerts.some(a => a.severite === 'CRITICAL');
  const hasActiveAlert = machineAlerts.length > 0;

  // Format date helper
  const formatDateStr = (isoString?: string) => {
    if (!isoString) return 'Aucune intervention enregistrée';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800/80 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                MACHINE #{machine.id}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {machine.nom}
              </h2>
              <span className="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-slate-700/60">
                {machine.type}
              </span>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Nœud d'échange : <code className="text-sky-300 font-mono">{machine.nodeOpcUa}</code></span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  machine.statut === 'EnMarche' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`} />
                <span className="font-medium text-slate-300">
                  {machine.statut === 'EnMarche' ? 'En Production Réelle' : machine.statut === 'ArretNettoyage' ? 'Nettoyage / CIP' : machine.statut}
                </span>
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 transition-colors"
            title="Fermer la fenêtre (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 3 Core Metrics Requested by User */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-950/40 border-b border-slate-800/80">
          
          {/* Card 1: Horamètre & Heures de marche cumulées */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Heures de Marche</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                HORAMÈTRE
              </span>
            </div>

            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {stats.totalOperatingHours.toLocaleString('fr-FR')}
                </span>
                <span className="text-xs text-sky-400 font-bold font-mono">heures</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Ce mois : <strong className="text-slate-200">{stats.hoursThisMonth} h</strong></span>
                <span>Aujourd'hui : <strong className="text-emerald-400">+{stats.hoursToday} h</strong></span>
              </div>
            </div>

            {/* Cycle progress bar to next maintenance */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Palier révision : {stats.maintenanceIntervalHours} h</span>
                <span className="text-sky-300 font-bold">Reste {stats.remainingHoursBeforeMaintenance} h</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{ width: `${stats.maintenanceProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Nombre d'alertes déclenchées */}
          <div className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-3 transition-all ${
            hasCriticalAlert
              ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/50'
              : hasActiveAlert
              ? 'bg-amber-950/20 border-amber-500/80 ring-1 ring-amber-500/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className={`w-4 h-4 ${hasCriticalAlert ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                <span>Alertes Déclenchées</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                hasCriticalAlert
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : hasActiveAlert
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {hasCriticalAlert ? 'CRITIQUE EN COURS' : hasActiveAlert ? 'AVERTISSEMENT ACTIF' : 'NOMINAL (0 ALERTE)'}
              </span>
            </div>

            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  hasCriticalAlert ? 'text-rose-400' : 'text-white'
                }`}>
                  {stats.totalTriggeredAlerts}
                </span>
                <span className="text-xs text-slate-400 font-bold">dépassements cumulés</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span className="text-rose-400 font-semibold">{stats.criticalAlertsCount} critiques</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300 font-semibold">{stats.warningAlertsCount} avertissements</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>Taux de conformité :</span>
              <span className="text-emerald-400 font-bold">98.9% nominal</span>
            </div>
          </div>

          {/* Card 3: Date de la dernière maintenance */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Dernière Maintenance</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {stats.lastIntervention?.typeIntervention.toUpperCase() || 'HISTORIQUE'}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{formatDateStr(stats.lastIntervention?.date)}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Technicien : <strong className="text-slate-200">{stats.lastIntervention?.technicien || 'Équipe interne'}</strong></span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>Durée arrêt : <strong className="text-slate-200">{stats.lastIntervention?.dureeMinutes || 45} min</strong></span>
              <span className="text-emerald-400 font-bold">● {stats.lastIntervention?.statutMachineApres || 'Opérationnelle'}</span>
            </div>
          </div>

        </div>

        {/* Modal Inner Navigation Subtabs */}
        <div className="px-5 sm:px-6 pt-3 border-b border-slate-800 flex items-center space-x-3 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 font-semibold transition-all whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'text-sky-400 border-sky-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Horamètre & Fiabilité</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-2.5 font-semibold transition-all whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'alerts'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Historique des Alertes ({stats.totalTriggeredAlerts})</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-2.5 font-semibold transition-all whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'maintenance'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Carnet d'Entretien ({stats.allInterventionsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-2.5 font-semibold transition-all whitespace-nowrap border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'telemetry'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Connectivité & Réseau</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: OVERVIEW & RUNNING HOURS DETAIL */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Operating Time Breakdown */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-sky-400" />
                    <span>Répartition de l'Exploitation</span>
                  </h4>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div>
                      <div className="flex justify-between text-slate-300 pb-1">
                        <span>Production Active (EnMarche)</span>
                        <span className="text-emerald-400 font-bold">86.4% ({Math.round(stats.totalOperatingHours * 0.864)} h)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '86.4%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1">
                        <span>Nettoyage & Cycles CIP</span>
                        <span className="text-amber-400 font-bold">7.2% ({Math.round(stats.totalOperatingHours * 0.072)} h)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '7.2%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1">
                        <span>Arrêts Pannes & Interventions</span>
                        <span className="text-rose-400 font-bold">3.8% ({Math.round(stats.totalOperatingHours * 0.038)} h)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: '3.8%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 pb-1">
                        <span>Attente Ligne & Cadencement</span>
                        <span className="text-sky-400 font-bold">2.6% ({Math.round(stats.totalOperatingHours * 0.026)} h)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: '2.6%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industrial Reliability Indicators (MTBF / MTTR) */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Fiabilité & Performance Industrielle</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">MTBF (Temps moyen bon fonction.)</span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-400">{stats.mtbfHours}</span>
                        <span className="text-xs text-slate-400">heures</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Moyenne ligne : 160h</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">MTTR (Temps moyen réparation)</span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-xl font-bold font-mono text-sky-400">{stats.mttrMinutes}</span>
                        <span className="text-xs text-slate-400">min</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Objectif usine : &lt; 45min</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">Disponibilité Opérationnelle</span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-300">{stats.operatingRatioPct}%</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Norme ISO 22400</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">Taux d'Usure Estimé</span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-xl font-bold font-mono text-amber-300">{stats.maintenanceProgressPct}%</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Organes mécaniques</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Maintenance Schedule Roadmap */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Prochaine révision préventive planifiée</h5>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Palier des <strong>{stats.maintenanceIntervalHours} h</strong> de fonctionnement (encore <strong>{stats.remainingHoursBeforeMaintenance} h</strong> restantes).
                    </p>
                  </div>
                </div>

                {onNavigateToMaintenance && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToMaintenance();
                    }}
                    className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shrink-0"
                  >
                    <span>Consulter le journal de maintenance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ALERTS HISTORY */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              
              {/* Active alerts warning if any */}
              {machineAlerts.length > 0 ? (
                <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs ${
                  hasCriticalAlert 
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
                    : 'bg-amber-950/80 border-amber-500 text-amber-200'
                }`}>
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-white" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider block">
                      Alerte(s) active(s) en temps réel sur cet équipement !
                    </span>
                    {machineAlerts.map(a => (
                      <div key={a.id} className="text-[11px] font-mono">
                        • {a.message} (Valeur mesurée : <strong>{a.valeurActuelle} {a.unite}</strong> &gt; Seuil tolérance : <strong>{a.valeurSeuil} {a.unite}</strong>)
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Aucune alerte active en temps réel. Tous les paramètres télémétriques respectent les plages de sécurité définies.</span>
                </div>
              )}

              {/* Historical Triggered Alerts Log */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Historique des dépassements de seuils enregistrés</span>
                  </span>
                  {onNavigateToThresholds && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToThresholds();
                      }}
                      className="text-sky-400 hover:text-sky-300 text-[11px] underline"
                    >
                      Ajuster les seuils
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto font-mono text-xs">
                  {stats.recentAlertLogs.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Aucun historique d'alerte spécifique consigné.
                    </div>
                  ) : (
                    stats.recentAlertLogs.map(alt => (
                      <div key={alt.id} className="p-3 hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              alt.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {alt.severity}
                            </span>
                            <span className="font-bold text-white">{alt.parameter}</span>
                            <span className="text-slate-500 text-[10px]">{alt.timestamp}</span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{alt.message}</p>
                        </div>

                        <div className="text-right sm:text-right text-[11px] shrink-0">
                          <span className="font-bold text-white underline">{alt.value}</span>
                          <span className="text-slate-500 block text-[10px]">{alt.threshold}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: MAINTENANCE LOGBOOK */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              
              {/* Last maintenance highlight card */}
              {stats.lastIntervention ? (
                <div className="p-4 bg-slate-950/80 border border-emerald-500/40 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-sm">Dernière Intervention : {stats.lastIntervention.id}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {stats.lastIntervention.typeIntervention}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Date & Heure :</span>
                      <span>{formatDateStr(stats.lastIntervention.date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Technicien Référent :</span>
                      <span className="text-white font-bold">{stats.lastIntervention.technicien}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Durée d'Intervention :</span>
                      <span className="text-sky-300 font-bold">{stats.lastIntervention.dureeMinutes} minutes</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-300 pt-2 border-t border-slate-800/60">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono">Détail des Travaux & Diagnostic :</span>
                    <p className="leading-relaxed text-slate-200">{stats.lastIntervention.descriptionPanne}</p>
                  </div>

                  {stats.lastIntervention.piecesRemplacees && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                      <span className="text-slate-400 font-mono block">Pièces & Organes Remplacés :</span>
                      <span className="text-emerald-300 font-medium">{stats.lastIntervention.piecesRemplacees}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aucune intervention de maintenance archivée pour cet équipement.
                </div>
              )}

              {/* Maintenance History list */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
                  <span>Historique des interventions enregistrées ({stats.allInterventionsCount})</span>
                  {onNavigateToMaintenance && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToMaintenance();
                      }}
                      className="text-sky-400 hover:text-sky-300 text-[11px] underline flex items-center gap-1"
                    >
                      <span>Ouvrir Journal Maintenance</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-56 overflow-y-auto">
                  {stats.machineInterventions.map(inter => (
                    <div key={inter.id} className="p-3 hover:bg-slate-900/60 transition-colors flex items-center justify-between">
                      <div className="space-y-0.5 truncate max-w-md">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{inter.id}</span>
                          <span className="text-[10px] text-slate-400">{formatDateStr(inter.date)}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {inter.typeIntervention}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate">{inter.descriptionPanne}</p>
                      </div>

                      <div className="text-right text-[11px] shrink-0 pl-2">
                        <span className="text-slate-300 block">{inter.technicien}</span>
                        <span className="text-emerald-400 font-bold">{inter.dureeMinutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TELEMETRY & NETWORK SPECS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">NŒUD OPC UA (IEC 62541)</span>
                  <span className="text-sky-300 font-bold text-xs truncate block">{machine.nodeOpcUa}</span>
                  <span className="text-[10px] text-slate-400 block">Protocole binaire sur port TCP 4840</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">COMMUNICATION MODBUS / TCP</span>
                  <span className="text-emerald-300 font-bold text-xs block">Port standard 502 • Esclave #{machine.id}</span>
                  <span className="text-[10px] text-slate-400 block">Polling cyclique 10 Hz haute fréquence</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">CADENCE NOMINALE / ACTUELLE</span>
                  <span className="text-white font-bold text-sm block">
                    {machine.cadenceActuelle} / {machine.cadenceNominale} U/h
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Rendement de vitesse : {Math.round((machine.cadenceActuelle / machine.cadenceNominale) * 100)}%
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">CAPTEURS PHYSIQUES EN SERVICE</span>
                  <span className="text-amber-300 font-bold text-xs block">
                    T° : {machine.temperatureC !== undefined ? `${machine.temperatureC}°C` : 'N/A'} • Pression : {machine.pressionBar !== undefined ? `${machine.pressionBar} bar` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Capteur PT100 & Transmetteur piézo</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center space-x-2">
            {onNavigateToCurves && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToCurves(machine.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-white border border-amber-500/40 font-semibold flex items-center space-x-1.5 transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Voir Courbes D3.js</span>
              </button>
            )}

            {onNavigateToMaintenance && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToMaintenance();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Journal de Maintenance</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            Fermer
          </button>

        </div>

      </div>
    </div>
  );
};
