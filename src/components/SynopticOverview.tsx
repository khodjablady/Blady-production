import React, { useState } from 'react';
import { 
  Activity, 
  Droplets, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  Sliders, 
  Layers, 
  TrendingUp,
  FileCode2,
  PackageCheck,
  BarChart3,
  Wrench,
  CalendarRange,
  FlaskConical,
  GitFork,
  Settings
} from 'lucide-react';
import { Article, OrdreFabrication, MachineLigne, OeeMetrics } from '../types';
import { ProductionPerformance } from './ProductionPerformance';
import { MachineEditModal } from './MachineEditModal';
import { 
  INDUSTRIAL_OEE_THRESHOLDS, 
  evaluateOeeWarnings, 
  OeeThresholds 
} from '../utils/oeeThresholds';

interface SynopticOverviewProps {
  articles: Article[];
  machines: MachineLigne[];
  activeOf?: OrdreFabrication;
  oee: OeeMetrics;
  onOpenDeclareModal: () => void;
  onGoToErp: () => void;
  onGoToMes: () => void;
  onGoToCSharp: () => void;
  onGoToAnalytics?: () => void;
  onGoToMaintenance?: () => void;
  onGoToPlanning?: () => void;
  onGoToQuality?: () => void;
  onGoToTraceability?: () => void;
  onGoToConnectivity?: () => void;
  onUpdateOee?: (updated: Partial<OeeMetrics>) => void;
  onUpdateMachine?: (updatedMachine: MachineLigne) => void;
  thresholds?: OeeThresholds;
}

export const SynopticOverview: React.FC<SynopticOverviewProps> = ({
  articles,
  machines,
  activeOf,
  oee,
  onOpenDeclareModal,
  onGoToErp,
  onGoToMes,
  onGoToCSharp,
  onGoToAnalytics,
  onGoToMaintenance,
  onGoToPlanning,
  onGoToQuality,
  onGoToTraceability,
  onGoToConnectivity,
  onUpdateOee,
  onUpdateMachine,
  thresholds = INDUSTRIAL_OEE_THRESHOLDS
}) => {
  const [editingMachine, setEditingMachine] = useState<MachineLigne | null>(null);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState<boolean>(false);

  const handleOpenEditMachine = (m: MachineLigne) => {
    setEditingMachine(m);
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = (updated: MachineLigne) => {
    if (onUpdateMachine) {
      onUpdateMachine(updated);
    }
  };

  const currentThresholds = thresholds;
  const oeeWarnings = evaluateOeeWarnings(oee, currentThresholds);
  const ethanol = articles.find(a => a.code === 'MP-ETH-96');
  const glycerol = articles.find(a => a.code === 'MP-GLY-99');
  const h2o2 = articles.find(a => a.code === 'MP-H2O2-30');
  const eau = articles.find(a => a.code === 'MP-EAU-OSM');
  const flacon = articles.find(a => a.code === 'EMB-FLAC-1L');
  const bouchon = articles.find(a => a.code === 'EMB-BOUCH-SPRAY');

  const cuveMelange = machines.find(m => m.type === 'CuveMelange') || machines[0];
  const remplisseuse = machines.find(m => m.type === 'Remplisseuse') || machines[2];
  const etiqueteuse = machines.find(m => m.type === 'Etiqueteuse') || machines[4];

  const tankCapacity = cuveMelange.capaciteMaxLitres || 5000;
  const tankLevel = cuveMelange.niveauCuveLitres !== undefined ? cuveMelange.niveauCuveLitres : 3450;
  const tankPercent = Math.min(100, Math.max(0, Math.round((tankLevel / tankCapacity) * 100)));

  const ofProgression = activeOf 
    ? Math.min(100, Math.round((activeOf.quantiteProduite / activeOf.quantiteCible) * 100)) 
    : 0;

  // Simulation test handlers for industrial thresholds
  const handleSimulateDispoDrop = () => {
    const newD = 87.2;
    const newP = oee.performance;
    const newQ = oee.qualite;
    const newTrs = Number(((newD / 100) * (newP / 100) * (newQ / 100) * 100).toFixed(1));
    onUpdateOee?.({ disponibilite: newD, trsGlobal: newTrs });
  };

  const handleSimulatePerfDrop = () => {
    const newD = oee.disponibilite;
    const newP = 81.4;
    const newQ = oee.qualite;
    const newTrs = Number(((newD / 100) * (newP / 100) * (newQ / 100) * 100).toFixed(1));
    onUpdateOee?.({ performance: newP, trsGlobal: newTrs });
  };

  const handleSimulateQualiteDrop = () => {
    const newD = oee.disponibilite;
    const newP = oee.performance;
    const newQ = 96.2;
    const newTrs = Number(((newD / 100) * (newP / 100) * (newQ / 100) * 100).toFixed(1));
    onUpdateOee?.({ qualite: newQ, trsGlobal: newTrs });
  };

  const handleSimulateCriticalDrop = () => {
    const newD = 85.5;
    const newP = 82.0;
    const newQ = 96.0;
    const newTrs = Number(((newD / 100) * (newP / 100) * (newQ / 100) * 100).toFixed(1));
    onUpdateOee?.({ disponibilite: newD, performance: newP, qualite: newQ, trsGlobal: newTrs });
  };

  const handleResetNominal = () => {
    onUpdateOee?.({ disponibilite: 92.4, performance: 88.6, qualite: 98.9, trsGlobal: 81.0 });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Status & Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Supervision Usine Process Liquides & Conditionnement
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800/60">
                Atelier 01 - Ligne Haute Cadence
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Pilotage unifié ERP & MES sous architecture Monolithe Modulaire C# .NET 8/9.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-quick-declare"
              onClick={onOpenDeclareModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Déclaration de Production</span>
            </button>
            <button
              id="btn-quick-mrp"
              onClick={onGoToErp}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Calcul MRP (ERP)</span>
            </button>
            {onGoToPlanning && (
              <button
                id="btn-quick-planning"
                onClick={onGoToPlanning}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-600/40 transition-colors"
              >
                <CalendarRange className="w-4 h-4 text-indigo-400" />
                <span>Planning Gantt</span>
              </button>
            )}
            {onGoToQuality && (
              <button
                id="btn-quick-quality"
                onClick={onGoToQuality}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/40 transition-colors"
              >
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Contrôle Qualité</span>
              </button>
            )}
            {onGoToTraceability && (
              <button
                id="btn-quick-traceability"
                onClick={onGoToTraceability}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-600/40 transition-colors"
              >
                <GitFork className="w-4 h-4 text-indigo-400" />
                <span>Traçabilité Lots</span>
              </button>
            )}
            {onGoToMaintenance && (
              <button
                id="btn-quick-maintenance"
                onClick={onGoToMaintenance}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Journal Maintenance</span>
              </button>
            )}
            <button
              id="btn-quick-csharp"
              onClick={onGoToCSharp}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 transition-colors"
            >
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span>Code C# (.NET)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Industrial Warning System Banner (Displayed when any threshold is breached) */}
      {oeeWarnings.hasAnyWarning && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-2 border-rose-500/80 rounded-2xl p-4 shadow-xl shadow-rose-950/40 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-rose-900/60 border border-rose-600 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-rose-200 tracking-tight flex items-center gap-2">
                    <span>SYSTÈME D'ALERTE INDUSTRIEL (NF E60-182 / ISO 22400)</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-900/90 border border-rose-600 text-rose-300">
                      Sous Seuil Critique
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-rose-300/80">
                  Une ou plusieurs métriques OEE ont chuté sous les normes industrielles d'exploitation :
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {oeeWarnings.disponibilite.isWarning && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-950/90 text-rose-400 border border-rose-700/80 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      Disponibilité : {oee.disponibilite}% (Norme ≥ {currentThresholds.disponibilite}%)
                    </span>
                  )}
                  {oeeWarnings.performance.isWarning && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-950/90 text-rose-400 border border-rose-700/80 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      Performance : {oee.performance}% (Norme ≥ {currentThresholds.performance}%)
                    </span>
                  )}
                  {oeeWarnings.qualite.isWarning && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-950/90 text-rose-400 border border-rose-700/80 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      Qualité : {oee.qualite}% (Norme ≥ {currentThresholds.qualite}%)
                    </span>
                  )}
                  {oeeWarnings.trsGlobal.isWarning && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-950/90 text-rose-400 border border-rose-700/80 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      TRS Global : {oee.trsGlobal}% (Objectif ≥ {currentThresholds.trsGlobal}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={onGoToMes}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-900/80 hover:bg-rose-800 text-white border border-rose-600 transition-colors shadow-sm"
              >
                Inspecter MES
              </button>
              <button
                onClick={handleResetNominal}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Rétablir Nominal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Testing & Simulation Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">Simulation Alertes Seuils OEE :</span>
          <span className="text-slate-400 hidden lg:inline">
            (Normes : Dispo ≥ {currentThresholds.disponibilite}% | Perf ≥ {currentThresholds.performance}% | Qualité ≥ {currentThresholds.qualite}% | TRS ≥ {currentThresholds.trsGlobal}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleResetNominal}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition-colors"
          >
            Régime Nominal
          </button>
          <button
            onClick={handleSimulateDispoDrop}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              oeeWarnings.disponibilite.isWarning
                ? 'bg-rose-900 text-white border border-rose-500 font-bold'
                : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700'
            }`}
          >
            Alerte Dispo (&lt;90%)
          </button>
          <button
            onClick={handleSimulatePerfDrop}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              oeeWarnings.performance.isWarning
                ? 'bg-rose-900 text-white border border-rose-500 font-bold'
                : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700'
            }`}
          >
            Alerte Perf (&lt;85%)
          </button>
          <button
            onClick={handleSimulateQualiteDrop}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              oeeWarnings.qualite.isWarning
                ? 'bg-rose-900 text-white border border-rose-500 font-bold'
                : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700'
            }`}
          >
            Alerte Qualité (&lt;98%)
          </button>
          <button
            onClick={handleSimulateCriticalDrop}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              oeeWarnings.hasAnyWarning && oeeWarnings.trsGlobal.isWarning
                ? 'bg-rose-900 text-white border border-rose-500 animate-pulse font-bold'
                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80'
            }`}
          >
            Alerte Multi-Critères
          </button>
        </div>
      </div>

      {/* KPI Bar: TRS / OEE & Active Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TRS Global Card */}
        <div className={`rounded-xl p-4 flex flex-col justify-between transition-all ${
          oeeWarnings.trsGlobal.isWarning
            ? 'bg-rose-950/25 border-2 border-rose-500/80 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40'
            : 'bg-slate-900 border border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold flex items-center gap-1.5 ${
              oeeWarnings.trsGlobal.isWarning ? 'text-rose-300' : 'text-slate-400'
            }`}>
              {oeeWarnings.trsGlobal.isWarning && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
              <span>Taux de Rendement Synthétique</span>
            </span>
            <Gauge className={`w-4 h-4 ${oeeWarnings.trsGlobal.isWarning ? 'text-rose-400' : 'text-sky-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-bold font-mono tracking-tight ${
              oeeWarnings.trsGlobal.isWarning ? 'text-rose-500 font-extrabold animate-pulse' : 'text-white'
            }`}>
              {oee.trsGlobal}%
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              oeeWarnings.trsGlobal.isWarning
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {oeeWarnings.trsGlobal.isWarning ? `< ${currentThresholds.trsGlobal}% Alerte Seuil` : `Objectif ≥ ${currentThresholds.trsGlobal}%`}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 text-center border-t border-slate-800/80 pt-2 text-[11px]">
            <div>
              <div className={`flex items-center justify-center gap-0.5 ${
                oeeWarnings.disponibilite.isWarning ? 'text-rose-400 font-bold' : 'text-slate-400'
              }`}>
                {oeeWarnings.disponibilite.isWarning && <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                <span>Dispo</span>
              </div>
              <div className={`font-semibold font-mono ${
                oeeWarnings.disponibilite.isWarning ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-200'
              }`}>
                {oee.disponibilite}%
              </div>
              <div className={`text-[9px] font-mono ${
                oeeWarnings.disponibilite.isWarning ? 'text-rose-400 font-bold' : 'text-slate-500'
              }`}>
                {oeeWarnings.disponibilite.isWarning ? `<${currentThresholds.disponibilite}%` : `≥${currentThresholds.disponibilite}%`}
              </div>
            </div>
            <div>
              <div className={`flex items-center justify-center gap-0.5 ${
                oeeWarnings.performance.isWarning ? 'text-rose-400 font-bold' : 'text-slate-400'
              }`}>
                {oeeWarnings.performance.isWarning && <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                <span>Perf</span>
              </div>
              <div className={`font-semibold font-mono ${
                oeeWarnings.performance.isWarning ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-200'
              }`}>
                {oee.performance}%
              </div>
              <div className={`text-[9px] font-mono ${
                oeeWarnings.performance.isWarning ? 'text-rose-400 font-bold' : 'text-slate-500'
              }`}>
                {oeeWarnings.performance.isWarning ? `<${currentThresholds.performance}%` : `≥${currentThresholds.performance}%`}
              </div>
            </div>
            <div>
              <div className={`flex items-center justify-center gap-0.5 ${
                oeeWarnings.qualite.isWarning ? 'text-rose-400 font-bold' : 'text-slate-400'
              }`}>
                {oeeWarnings.qualite.isWarning && <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                <span>Qualité</span>
              </div>
              <div className={`font-semibold font-mono ${
                oeeWarnings.qualite.isWarning ? 'text-rose-500 font-bold animate-pulse' : 'text-emerald-400'
              }`}>
                {oee.qualite}%
              </div>
              <div className={`text-[9px] font-mono ${
                oeeWarnings.qualite.isWarning ? 'text-rose-400 font-bold' : 'text-slate-500'
              }`}>
                {oeeWarnings.qualite.isWarning ? `<${currentThresholds.qualite}%` : `≥${currentThresholds.qualite}%`}
              </div>
            </div>
          </div>
          {onGoToAnalytics && (
            <button
              onClick={onGoToAnalytics}
              className="mt-2 text-[11px] text-sky-400 hover:text-sky-300 flex items-center justify-between w-full pt-1.5 border-t border-slate-800/60 font-medium transition-colors"
            >
              <span>Historique OEE & Stocks 30j</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Ordre de Fabrication Actif */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">OF en Cours (MES)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {activeOf?.statut || 'En cours'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-white flex items-center justify-between">
              <span>{activeOf?.numeroOF || 'OF-2026-104'}</span>
              <span className="font-mono text-xs text-sky-400">Lot: {activeOf?.numeroLotFabrique}</span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Solution Désinfectante 1000ml
            </p>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono">
              <span>{activeOf?.quantiteProduite} / {activeOf?.quantiteCible} U</span>
              <span className="font-semibold text-sky-400">{ofProgression}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                style={{ width: `${ofProgression}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cadence Ligne Instantanée */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Cadence Remplisseuse</span>
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {remplisseuse.cadenceActuelle}
            </span>
            <span className="text-xs text-slate-400">flacons / h</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Nominale: 1000 / h</span>
            <span className="text-emerald-400 font-mono">92% charge</span>
          </div>
        </div>

        {/* Cuve de Mélange & Réacteur */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Réacteur R-5000L</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {cuveMelange.niveauCuveLitres || 3450}
            </span>
            <span className="text-xs text-slate-400">Litres en cuve</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>T°: <strong className="text-slate-200">{cuveMelange.temperatureC}°C</strong></span>
            <span>P: <strong className="text-slate-200">{cuveMelange.pressionBar} bar</strong></span>
            <span className="text-emerald-400">Agitateur ON</span>
          </div>
        </div>

      </div>

      {/* Production Performance D3 Live Trends Component */}
      <ProductionPerformance 
        oee={oee}
        machines={machines}
        activeOf={activeOf}
        thresholds={currentThresholds}
      />

      {/* Industrial Process Flow Synoptic */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Synoptique Fonctionnel de la Ligne de Process</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                ISA-88 / S88 Batch Control
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Flux continu : Approvisionnement MP → Dosage & Formulation → Homogénéisation → Remplissage → Étiquetage
            </p>
          </div>
          <button 
            onClick={onGoToMes}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1 font-medium"
          >
            <span>Détails Poste Opérateur</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Process Diagram Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1: Raw Material Tanks (MP) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <span className="text-xs font-bold text-sky-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>1. Stockage MP</span>
              </span>
              <span className="text-[10px] text-slate-400">Cuves & IBC</span>
            </div>

            {/* Micro Tank gauges */}
            <div className="space-y-2.5 my-3">
              {/* Éthanol */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium truncate">Éthanol 96%</span>
                  <span className="font-mono text-slate-400">{ethanol?.stockTheorique} L</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (ethanol?.stockTheorique || 0) < (ethanol?.seuilCritique || 1) 
                        ? 'bg-amber-500 animate-pulse' 
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round(((ethanol?.stockTheorique || 0) / 4000) * 100))}%` }}
                  />
                </div>
                {(ethanol?.stockTheorique || 0) < (ethanol?.seuilCritique || 0) && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 inline" /> Seuil critique atteint!
                  </span>
                )}
              </div>

              {/* H2O2 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium truncate">Peroxyde H2O2</span>
                  <span className="font-mono text-slate-400">{h2o2?.stockTheorique} L</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((h2o2?.stockTheorique || 0) / 1000) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Glycérol */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium truncate">Glycérol 99%</span>
                  <span className="font-mono text-slate-400">{glycerol?.stockTheorique} L</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      (glycerol?.stockTheorique || 0) < (glycerol?.seuilCritique || 1) ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round(((glycerol?.stockTheorique || 0) / 600) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Eau Osmosée */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium truncate">Eau Osmosée</span>
                  <span className="font-mono text-slate-400">{eau?.stockTheorique} L</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((eau?.stockTheorique || 0) / 10000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex justify-between">
              <span>Vannes proportionnelles</span>
              <span className="text-emerald-400">Asservies</span>
            </div>
          </div>

          {/* Step 2: Mixing Reactor Tank */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <span className="text-xs font-bold text-cyan-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>2. Cuve de Mélange ({cuveMelange.nom.split(' ')[0]})</span>
              </span>
              <button
                onClick={() => handleOpenEditMachine(cuveMelange)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700 text-[10px] flex items-center gap-1 transition-colors"
                title="Modifier / Configurer cette cuve"
              >
                <Settings className="w-3 h-3" />
                <span>Configurer</span>
              </button>
            </div>

            <div className="my-4 flex flex-col items-center justify-center">
              {/* Animated Tank Graphic */}
              <div className="w-24 h-32 border-2 border-slate-600 rounded-b-2xl rounded-t-md relative overflow-hidden bg-slate-900 flex flex-col justify-end shadow-inner">
                {/* Liquid fill */}
                <div 
                  className="w-full bg-gradient-to-t from-cyan-600 to-sky-400 transition-all duration-700 relative"
                  style={{ height: `${tankPercent}%` }}
                >
                  {/* Wave effect */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-200/50 animate-pulse"></div>
                  {/* Bubbles / agitation */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <span className="animate-spin text-xs">∿</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-mono font-bold text-white drop-shadow">
                    {tankLevel.toLocaleString('fr-FR')} L
                  </span>
                  <span className="text-[10px] text-cyan-200 drop-shadow">
                    {tankPercent}% plein
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-800/60 pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Agitateur :</span>
                <span className="text-emerald-400 font-mono">180 tr/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tolérance perte cuve :</span>
                <span className="text-sky-400 font-mono">+3.5% purge</span>
              </div>
            </div>
          </div>

          {/* Step 3: Filling and Capping Machine */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>3. Remplisseuse ({remplisseuse.nom.split(' ')[0]})</span>
              </span>
              <button
                onClick={() => handleOpenEditMachine(remplisseuse)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700 text-[10px] flex items-center gap-1 transition-colors"
                title="Modifier / Configurer la remplisseuse"
              >
                <Settings className="w-3 h-3" />
                <span>Configurer</span>
              </button>
            </div>

            <div className="my-3 space-y-3">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Cadence courante</div>
                <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-1">
                  <span>{remplisseuse.cadenceActuelle.toLocaleString('fr-FR')}</span>
                  <span className="text-xs text-slate-400 font-normal">flacons / h</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div className="text-slate-400">Flacons 1L</div>
                  <div className="font-mono text-slate-200 font-semibold">{flacon?.stockTheorique.toLocaleString('fr-FR') || '1 100'} U</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div className="text-slate-400">Bouchons Spray</div>
                  <div className="font-mono text-slate-200 font-semibold">{bouchon?.stockTheorique.toLocaleString('fr-FR') || '3 200'} U</div>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-800/60 pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Vissage couple :</span>
                <span className="text-emerald-400 font-mono">2.8 N.m (OK)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perte démarrage :</span>
                <span className="text-slate-400 font-mono">1.2% calage</span>
              </div>
            </div>
          </div>

          {/* Step 4: Quality & Packaging */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>4. Étiquetage & Qualité</span>
              </span>
              <button
                onClick={() => handleOpenEditMachine(etiqueteuse)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700 text-[10px] flex items-center gap-1 transition-colors"
                title="Modifier / Configurer l'étiqueteuse"
              >
                <Settings className="w-3 h-3" />
                <span>Configurer</span>
              </button>
            </div>

            <div className="my-3 space-y-2.5">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Conformité Vision</span>
                  <span className="font-bold text-emerald-400">98.9%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rebuts rejetés :</span>
                  <span className="text-rose-400 font-mono">4 flacons</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-400 font-medium">N° Lot Fini Imprimé :</div>
                <div className="font-mono text-xs text-sky-300 font-semibold bg-slate-950 p-1 rounded border border-slate-800 text-center">
                  {activeOf?.numeroLotFabrique || 'LOT-VIR-2609-A1'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <button
                onClick={onOpenDeclareModal}
                className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
              >
                <span>Déclarer Fin de Lot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: Backflushing Explanation & System Integration Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-white flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Spécificité Fluides & Pertes Process</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Dans le code C# du domaine (<code className="text-sky-300 font-mono">Nomenclature.cs</code>), 
            chaque composant liquide intègre un <strong className="text-slate-200">PourcentagePerteTolerable</strong>.
            Le service <code className="text-sky-300 font-mono">MrpStockService</code> applique automatiquement le facteur :
          </p>
          <pre className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`decimal facteur = 1 + (lien.PourcentagePerteTolerable / 100m);
quantiteConsommee = besoinUnitaire * quantiteRealisee * facteur;`}
          </pre>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Boucle de Réapprovisionnement MRP</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Lorsque la post-déduction fait chuter le <strong className="text-slate-200">StockTheorique</strong> sous le 
            <strong className="text-slate-200"> SeuilCritique</strong>, l'ERP génère automatiquement une <code className="text-amber-300 font-mono">SuggestionAchat</code> arrondie aux multiples du conditionnement standard (<code className="text-slate-200 font-mono">QuantiteStandardAchat</code>).
          </p>
          <div className="pt-1">
            <button 
              onClick={onGoToErp}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>Accéder au module Achats & MRP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Visualisation Recharts 30 Jours</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Module de business intelligence industriel : trajectoire temporelle des niveaux de stock ERP (avec seuils d'alerte), décomposition D/P/Q du TRS MES et analyse Pareto des arrêts de ligne.
          </p>
          <div className="pt-1">
            {onGoToAnalytics && (
              <button 
                onClick={onGoToAnalytics}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Ouvrir le module Analytique</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-white flex items-center space-x-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <span>Monolithe Modulaire C# (.NET 8/9)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Une seule solution .NET regroupant les projets <code className="text-slate-200">BladyProduction.Erp</code>, <code className="text-slate-200">BladyProduction.Mes</code> et <code className="text-slate-200">BladyProduction.Connectivity</code>. Déploiement unique en local sans microservices complexes.
          </p>
          <div className="pt-1">
            <button 
              onClick={onGoToCSharp}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Consulter la solution .NET</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-white flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span>Connectivité Industrielle & Automates</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Supervision temps réel des automates PLC (Siemens S7-1200, Schneider M241), nœuds OPC UA (IEC 62541), trames Modbus/TCP et configuration des machines.
          </p>
          <div className="pt-1">
            {onGoToConnectivity && (
              <button 
                onClick={onGoToConnectivity}
                className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                <span>Accéder à la Connectivité Industrielle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Machine Edit Modal */}
      <MachineEditModal
        isOpen={isMachineModalOpen}
        machine={editingMachine}
        onClose={() => {
          setIsMachineModalOpen(false);
          setEditingMachine(null);
        }}
        onSave={handleSaveMachine}
      />

    </div>
  );
};
