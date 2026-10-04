import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { MachineLigne, InterventionMaintenance, OeeMetrics } from '../types';
import { INITIAL_MACHINES, INITIAL_INTERVENTIONS } from '../data/initialData';
import {
  Cpu,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
  Sliders,
  ExternalLink,
  Wrench,
  Gauge,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
  Filter,
  BarChart3,
  Percent
} from 'lucide-react';

interface MachineAvailabilityViewProps {
  machines?: MachineLigne[];
  interventions?: InterventionMaintenance[];
  currentOee?: OeeMetrics;
  onGoToMaintenance?: () => void;
  onGoToMes?: () => void;
}

type PeriodScale = 'shift' | 'week' | 'month';
type VisualizationMode = 'dual-axis' | 'stacked-time' | 'table';

export interface MachineAvailabilityMetrics {
  id: number;
  nom: string;
  nomCourt: string;
  type: MachineLigne['type'];
  statutActuel: MachineLigne['statut'];
  cadenceNominale: number;
  cadenceActuelle: number;
  cadenceRatioPct: number;
  temperatureC?: number;
  pressionBar?: number;
  // Time breakdown (in minutes)
  tempsOuvertureMin: number;
  tempsFonctionnementMin: number;
  tempsArretTotalMin: number;
  tempsArretPlanifieMin: number; // NEP cleaning, format change, planned maintenance
  tempsArretNonPlanifieMin: number; // Unplanned breakdowns, sensor jams, mechanical issues
  // Rates
  tauxDisponibilite: number; // % = (tempsFonctionnementMin / tempsOuvertureMin) * 100
  tauxIndisponibilite: number; // % = 100 - tauxDisponibilite
  // Reliability indicators
  nombrePannes: number;
  mtbfHeures: number; // Mean Time Between Failures
  mttrMinutes: number; // Mean Time To Repair
  isBottleneck: boolean;
  isBestPerformer: boolean;
  causesFrequentes: string[];
  interventionsLiees: InterventionMaintenance[];
}

export const MachineAvailabilityView: React.FC<MachineAvailabilityViewProps> = ({
  machines = INITIAL_MACHINES,
  interventions = INITIAL_INTERVENTIONS,
  currentOee,
  onGoToMaintenance,
  onGoToMes
}) => {
  const [period, setPeriod] = useState<PeriodScale>('shift');
  const [vizMode, setVizMode] = useState<VisualizationMode>('dual-axis');
  const [selectedMachineId, setSelectedMachineId] = useState<number>(3); // Default to Remplisseuse (critical)

  // Total opening time depending on the selected scale
  const tempsOuverture = useMemo(() => {
    switch (period) {
      case 'shift':
        return 480; // 8 hours in minutes
      case 'week':
        return 2400; // 5 days x 8 hours = 40 hours = 2,400 min
      case 'month':
        return 9600; // 20 working days x 8 hours = 160 hours = 9,600 min
      default:
        return 480;
    }
  }, [period]);

  // Factor to scale baseline downtime from shift to week/month
  const scaleMultiplier = useMemo(() => {
    switch (period) {
      case 'shift':
        return 1.0;
      case 'week':
        return 4.8; // accounts for slight weekly stabilization
      case 'month':
        return 18.5;
      default:
        return 1.0;
    }
  }, [period]);

  // Calculate detailed availability vs downtime metrics for each of the 5 line machines
  const machineMetricsList: MachineAvailabilityMetrics[] = useMemo(() => {
    // Baseline empirical downtime characteristics for each machine on the liquid packaging line
    const baselineDowntimeConfig: Record<number, {
      shortName: string;
      basePlanifie: number; // planned cleaning/setup min per shift
      baseNonPlanifie: number; // unplanned breakdowns min per shift
      pannesCount: number;
      frequentCauses: string[];
    }> = {
      1: {
        shortName: 'Cuve R-5000L',
        basePlanifie: 12,
        baseNonPlanifie: 4,
        pannesCount: 1,
        frequentCauses: ['Nettoyage NEP fin de lot', 'Attente validation contrôle qualité pH/viscosité', 'Alimentation éthanol']
      },
      2: {
        shortName: 'Homogénéisateur H-300',
        basePlanifie: 10,
        baseNonPlanifie: 8,
        pannesCount: 1,
        frequentCauses: ['Montée en pression progressive', 'Remplacement joint piston haute pression', 'Vérification clapets']
      },
      3: {
        shortName: 'Remplisseuse 12 Becs',
        basePlanifie: 16,
        baseNonPlanifie: 34,
        pannesCount: 3,
        frequentCauses: ['Goutte à goutte / étalonnage volume', 'Micro-arrêts alimentation flacons 1L', 'Purge bulles d’air sur circuit']
      },
      4: {
        shortName: 'Boucheuse Servomoteur',
        basePlanifie: 10,
        baseNonPlanifie: 16,
        pannesCount: 2,
        frequentCauses: ['Bourrage goulot distributeur bouchons spray', 'Calage couple de serrage visseuse', 'Contrôle présence joint']
      },
      5: {
        shortName: 'Étiqueteuse Linéaire',
        basePlanifie: 14,
        baseNonPlanifie: 22,
        pannesCount: 2,
        frequentCauses: ['Changement bobine étiquettes', 'Nettoyage rouleaux colle/pression', 'Recentrage cellule optique repérage']
      }
    };

    // First pass to compute values
    const rawMetrics = machines.map((machine) => {
      const config = baselineDowntimeConfig[machine.id] || {
        shortName: machine.nom.substring(0, 18),
        basePlanifie: 12,
        baseNonPlanifie: 15,
        pannesCount: 1,
        frequentCauses: ['Arrêt opérationnel indéterminé']
      };

      // Filter interventions for this machine
      const relatedInterventions = interventions.filter((itv) => itv.machineId === machine.id);
      const realInterventionMinutes = relatedInterventions.reduce((sum, itv) => sum + (itv.dureeMinutes || 0), 0);

      // Adjust based on live machine status
      let livePenaltyMinutes = 0;
      if (machine.statut === 'Panne') {
        livePenaltyMinutes += 45;
      } else if (machine.statut === 'ArretNettoyage') {
        livePenaltyMinutes += 25;
      } else if (machine.statut === 'EnAttente') {
        livePenaltyMinutes += 15;
      }

      // Compute scaled downtimes
      let plannedMin = Math.round(config.basePlanifie * scaleMultiplier);
      let unplannedMin = Math.round((config.baseNonPlanifie * scaleMultiplier) + (livePenaltyMinutes * (period === 'shift' ? 1 : 0.4)));

      // Add real logged interventions influence
      if (realInterventionMinutes > 0) {
        unplannedMin = Math.round(Math.max(unplannedMin, (realInterventionMinutes * (period === 'shift' ? 0.4 : 1.2))));
      }

      const totalDowntimeMin = plannedMin + unplannedMin;
      const uptimeMin = Math.max(0, tempsOuverture - totalDowntimeMin);
      const availabilityRate = Number(((uptimeMin / tempsOuverture) * 100).toFixed(1));
      const unavailabilityRate = Number((100 - availabilityRate).toFixed(1));

      // Cadence ratio
      const cadenceRatioPct = machine.cadenceNominale > 0
        ? Math.round((machine.cadenceActuelle / machine.cadenceNominale) * 100)
        : 100;

      // Failures count scaled
      const failuresCount = Math.max(1, Math.round(config.pannesCount * (period === 'shift' ? 1 : (period === 'week' ? 3.5 : 12))));

      // MTBF (hours) = (Operating hours) / Failures count
      const operatingHours = uptimeMin / 60;
      const mtbfHeures = Number((operatingHours / failuresCount).toFixed(1));

      // MTTR (minutes) = Unplanned downtime minutes / Failures count
      const mttrMinutes = Math.round(unplannedMin / failuresCount);

      return {
        id: machine.id,
        nom: machine.nom,
        nomCourt: config.shortName,
        type: machine.type,
        statutActuel: machine.statut,
        cadenceNominale: machine.cadenceNominale,
        cadenceActuelle: machine.cadenceActuelle,
        cadenceRatioPct,
        temperatureC: machine.temperatureC,
        pressionBar: machine.pressionBar,
        tempsOuvertureMin: tempsOuverture,
        tempsFonctionnementMin: uptimeMin,
        tempsArretTotalMin: totalDowntimeMin,
        tempsArretPlanifieMin: plannedMin,
        tempsArretNonPlanifieMin: unplannedMin,
        tauxDisponibilite: availabilityRate,
        tauxIndisponibilite: unavailabilityRate,
        nombrePannes: failuresCount,
        mtbfHeures,
        mttrMinutes,
        isBottleneck: false,
        isBestPerformer: false,
        causesFrequentes: config.frequentCauses,
        interventionsLiees: relatedInterventions
      };
    });

    // Determine bottleneck (lowest availability) and best performer (highest availability)
    let minAvail = Infinity;
    let maxAvail = -Infinity;
    let bottleneckId = rawMetrics[0]?.id || 1;
    let bestId = rawMetrics[0]?.id || 1;

    rawMetrics.forEach((m) => {
      if (m.tauxDisponibilite < minAvail) {
        minAvail = m.tauxDisponibilite;
        bottleneckId = m.id;
      }
      if (m.tauxDisponibilite > maxAvail) {
        maxAvail = m.tauxDisponibilite;
        bestId = m.id;
      }
    });

    return rawMetrics.map((m) => ({
      ...m,
      isBottleneck: m.id === bottleneckId,
      isBestPerformer: m.id === bestId
    }));
  }, [machines, interventions, tempsOuverture, scaleMultiplier, period]);

  // Selected Machine Details
  const selectedMachine = useMemo(() => {
    return machineMetricsList.find((m) => m.id === selectedMachineId) || machineMetricsList[0];
  }, [machineMetricsList, selectedMachineId]);

  // Global Line Aggregates
  const lineSummary = useMemo(() => {
    const totalDowntime = machineMetricsList.reduce((sum, m) => sum + m.tempsArretTotalMin, 0);
    const totalPlanned = machineMetricsList.reduce((sum, m) => sum + m.tempsArretPlanifieMin, 0);
    const totalUnplanned = machineMetricsList.reduce((sum, m) => sum + m.tempsArretNonPlanifieMin, 0);
    const avgAvailability = Number(
      (machineMetricsList.reduce((sum, m) => sum + m.tauxDisponibilite, 0) / machineMetricsList.length).toFixed(1)
    );
    const bottleneck = machineMetricsList.find((m) => m.isBottleneck);
    const bestPerformer = machineMetricsList.find((m) => m.isBestPerformer);

    return {
      totalDowntime,
      totalPlanned,
      totalUnplanned,
      avgAvailability,
      bottleneck,
      bestPerformer
    };
  }, [machineMetricsList]);

  // Color helper according to availability
  const getAvailabilityColor = (rate: number) => {
    if (rate >= 94) return '#10b981'; // Emerald
    if (rate >= 90) return '#38bdf8'; // Sky blue
    if (rate >= 85) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  // Custom Recharts Tooltip for Dual Axis
  const CustomDualAxisTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MachineAvailabilityMetrics;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur text-xs space-y-3 min-w-[280px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white block text-sm">{data.nomCourt}</span>
              <span className="text-[10px] text-slate-400">{data.nom}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                data.statutActuel === 'EnMarche'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : data.statutActuel === 'Panne'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {data.statutActuel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Taux Disponibilité</span>
              <span className="text-base font-black font-mono text-sky-400">
                {data.tauxDisponibilite}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Temps d'Arrêt Total</span>
              <span className="text-base font-black font-mono text-rose-400">
                {data.tempsArretTotalMin} min
              </span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded bg-indigo-500"></span>
                <span>Arrêts Planifiés (NEP / Réglages) :</span>
              </span>
              <span className="font-mono font-semibold">{data.tempsArretPlanifieMin} min</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded bg-rose-500"></span>
                <span>Arrêts Non Planifiés (Aléas / Pannes) :</span>
              </span>
              <span className="font-mono font-semibold text-rose-300">{data.tempsArretNonPlanifieMin} min</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Temps Fonctionnement Utile :</span>
              <span className="font-mono font-semibold text-emerald-400">{data.tempsFonctionnementMin} min</span>
            </div>
          </div>

          {data.isBottleneck && (
            <div className="bg-rose-950/40 border border-rose-800/70 p-1.5 rounded-lg text-[10px] text-rose-200 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Goulet d'étranglement principal de la ligne</span>
            </div>
          )}

          <div className="text-[10px] text-slate-500 italic text-center pt-1">
            Cliquez sur la colonne pour verrouiller l'inspection détaillée
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Disponibilité vs Temps d'Arrêt par Machine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-800">
                  Recharts • Analyse Ligne 01
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparatif détaillé du taux de disponibilité opérationnelle et de la durée cumulée des arrêts (planifiés vs non planifiés) pour chaque équipement du process.
              </p>
            </div>
          </div>
        </div>

        {/* Filters and View Mode Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setPeriod('shift')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                period === 'shift'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Poste (8h)
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                period === 'week'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semaine (40h)
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                period === 'month'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mois (160h)
            </button>
          </div>

          {/* Visualization Modes */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setVizMode('dual-axis')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                vizMode === 'dual-axis'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Graphique combiné Double Axe : Disponibilité (%) & Temps d'Arrêt (min)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Double Axe</span>
            </button>
            <button
              onClick={() => setVizMode('stacked-time')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                vizMode === 'stacked-time'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Graphique empilé : Temps de Marche vs Temps d'Arrêt"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Temps 100%</span>
            </button>
            <button
              onClick={() => setVizMode('table')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                vizMode === 'table'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue tabulaire synthétique"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Line Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Disponibilité Moyenne Ligne */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Disponibilité Moyenne Ligne
          </span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-black font-mono ${lineSummary.avgAvailability >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {lineSummary.avgAvailability}%
            </span>
            <span className="text-xs text-slate-400">/ Cible 90%</span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            {lineSummary.avgAvailability >= 90 ? '✓ Seuil de disponibilité global atteint' : 'Pénalité par micro-arrêts répétés'}
          </span>
        </div>

        {/* KPI 2: Machine Goulet d'Étranglement */}
        <div className="bg-slate-950/70 border border-rose-950/50 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">
              Goulet de la Ligne
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold text-white truncate max-w-[160px]">
              {lineSummary.bottleneck?.nomCourt || 'Remplisseuse 12 Becs'}
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">
              {lineSummary.bottleneck?.tauxDisponibilite}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            Arrêt cumulé : <strong className="text-rose-300">{lineSummary.bottleneck?.tempsArretTotalMin} min</strong>
          </span>
        </div>

        {/* KPI 3: Équipement le Plus Fiable */}
        <div className="bg-slate-950/70 border border-emerald-950/50 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Machine la Plus Fiable
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold text-white truncate max-w-[160px]">
              {lineSummary.bestPerformer?.nomCourt || 'Cuve R-5000L'}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {lineSummary.bestPerformer?.tauxDisponibilite}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            MTBF record : <strong className="text-emerald-300">{lineSummary.bestPerformer?.mtbfHeures} h</strong>
          </span>
        </div>

        {/* KPI 4: Temps d'Arrêt Total Cumulé */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Arrêts Cumulés (Ligne Complète)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black font-mono text-white">
              {lineSummary.totalDowntime}
            </span>
            <span className="text-xs text-slate-400">minutes</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span className="text-indigo-300">Planifié : {lineSummary.totalPlanned}m</span>
            <span>•</span>
            <span className="text-rose-300">Aléas : {lineSummary.totalUnplanned}m</span>
          </div>
        </div>
      </div>

      {/* MAIN VISUALIZATION AREA */}
      {vizMode === 'dual-axis' && (
        <div className="space-y-3">
          {/* Chart Sub-legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-sky-400 rounded-sm"></span>
                <span className="text-slate-200 font-medium">Taux de Disponibilité (%) — Axe Y Gauche</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
                <span className="text-rose-300 font-medium">Arrêts Non Planifiés (min) — Axe Y Droit</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span>
                <span className="text-indigo-300 font-medium">Arrêts Planifiés NEP (min) — Axe Y Droit</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-0.5 bg-emerald-400 border-dashed border-t"></span>
                <span className="text-emerald-400 font-semibold">Cible Disponibilité (90%)</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Période : {tempsOuverture} min temps d'ouverture
            </span>
          </div>

          {/* Recharts ComposedChart: Dual Axis */}
          <div className="h-84 w-full bg-slate-950/60 p-2 sm:p-4 rounded-2xl border border-slate-800/80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={machineMetricsList}
                margin={{ top: 15, right: 25, left: -10, bottom: 15 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setSelectedMachineId(e.activePayload[0].payload.id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />

                {/* X Axis: 5 Line Machines */}
                <XAxis
                  dataKey="nomCourt"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />

                {/* Left Y Axis: Availability Rate % */}
                <YAxis
                  yAxisId="left"
                  stroke="#38bdf8"
                  fontSize={11}
                  domain={[70, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#38bdf8' }}
                  tickFormatter={(val) => `${val}%`}
                />

                {/* Right Y Axis: Downtime Minutes */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f43f5e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#f43f5e' }}
                  tickFormatter={(val) => `${val}m`}
                />

                <Tooltip content={<CustomDualAxisTooltip />} />

                {/* Reference Target for Availability */}
                <ReferenceLine
                  yAxisId="left"
                  y={90}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Cible 90%',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopLeft'
                  }}
                />

                {/* Stacked Bars for Downtime (Right Axis) */}
                <Bar
                  yAxisId="right"
                  dataKey="tempsArretPlanifieMin"
                  name="Arrêts Planifiés (min)"
                  stackId="downtime"
                  fill="#6366f1"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  yAxisId="right"
                  dataKey="tempsArretNonPlanifieMin"
                  name="Arrêts Non Planifiés (min)"
                  stackId="downtime"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {machineMetricsList.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.id === selectedMachineId ? '#fb7185' : '#f43f5e'}
                      stroke={entry.id === selectedMachineId ? '#ffffff' : 'none'}
                      strokeWidth={entry.id === selectedMachineId ? 2 : 0}
                    />
                  ))}
                </Bar>

                {/* Line Curve for Availability Rate (Left Axis) */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tauxDisponibilite"
                  name="Disponibilité (%)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIZ MODE 2: STACKED 100% TIME BREAKDOWN */}
      {vizMode === 'stacked-time' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span className="text-slate-200">Temps de Fonctionnement Opérationnel</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span>
                <span className="text-indigo-300">Arrêts Planifiés (Nettoyage / Formats)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
                <span className="text-rose-300">Arrêts Imprévus (Aléas / Défaillances)</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Total = 100% ({tempsOuverture} minutes)
            </span>
          </div>

          <div className="h-80 w-full bg-slate-950/60 p-2 sm:p-4 rounded-2xl border border-slate-800/80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={machineMetricsList}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setSelectedMachineId(e.activePayload[0].payload.id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, tempsOuverture]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${Math.round((val / tempsOuverture) * 100)}%`}
                />
                <YAxis
                  type="category"
                  dataKey="nomCourt"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<CustomDualAxisTooltip />} />
                <Bar
                  dataKey="tempsFonctionnementMin"
                  name="Fonctionnement (min)"
                  stackId="time"
                  fill="#10b981"
                  maxBarSize={28}
                />
                <Bar
                  dataKey="tempsArretPlanifieMin"
                  name="Arrêt Planifié (min)"
                  stackId="time"
                  fill="#6366f1"
                  maxBarSize={28}
                />
                <Bar
                  dataKey="tempsArretNonPlanifieMin"
                  name="Arrêt Imprévu (min)"
                  stackId="time"
                  fill="#f43f5e"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIZ MODE 3: DETAILED TABULAR VIEW */}
      {vizMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Machine</th>
                <th className="py-3 px-3 font-semibold">Statut</th>
                <th className="py-3 px-3 font-semibold text-right">Disponibilité</th>
                <th className="py-3 px-3 font-semibold text-right">Temps Marche</th>
                <th className="py-3 px-3 font-semibold text-right">Arrêts Planifiés</th>
                <th className="py-3 px-3 font-semibold text-right">Arrêts Imprévus</th>
                <th className="py-3 px-3 font-semibold text-right">Arrêt Total</th>
                <th className="py-3 px-3 font-semibold text-right">MTBF</th>
                <th className="py-3 px-3 font-semibold text-right">MTTR</th>
                <th className="py-3 px-4 font-semibold text-center">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {machineMetricsList.map((m) => {
                const isSelected = m.id === selectedMachineId;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMachineId(m.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-950/40 text-white'
                        : 'hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${m.isBottleneck ? 'bg-rose-400' : (m.isBestPerformer ? 'bg-emerald-400' : 'bg-sky-400')}`} />
                      <div>
                        <div className="font-semibold text-slate-100">{m.nomCourt}</div>
                        <div className="text-[10px] text-slate-400">{m.type}</div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.statutActuel === 'EnMarche'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : m.statutActuel === 'Panne'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {m.statutActuel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={m.tauxDisponibilite >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                        {m.tauxDisponibilite}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-300">
                      {m.tempsFonctionnementMin} m
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-300">
                      {m.tempsArretPlanifieMin} m
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-300 font-semibold">
                      {m.tempsArretNonPlanifieMin} m
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {m.tempsArretTotalMin} m
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {m.mtbfHeures} h
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {m.mttrMinutes} m
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.isBottleneck ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          Goulet Critique
                        </span>
                      ) : m.isBestPerformer ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Haute Disponibilité
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Nominal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILED DRILLDOWN CARD FOR THE SELECTED MACHINE */}
      {selectedMachine && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-white">
                    {selectedMachine.nom}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedMachine.statutActuel === 'EnMarche'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : selectedMachine.statutActuel === 'Panne'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {selectedMachine.statutActuel}
                  </span>
                  {selectedMachine.isBottleneck && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      Goulet d'étranglement
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadence : {selectedMachine.cadenceActuelle} / {selectedMachine.cadenceNominale} U/h ({selectedMachine.cadenceRatioPct}% rendement)
                  {selectedMachine.temperatureC && ` • Temp : ${selectedMachine.temperatureC}°C`}
                  {selectedMachine.pressionBar && ` • Pression : ${selectedMachine.pressionBar} bar`}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              {onGoToMaintenance && (
                <button
                  onClick={onGoToMaintenance}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Journal Maintenance</span>
                </button>
              )}
              {onGoToMes && (
                <button
                  onClick={onGoToMes}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <span>Piloter dans MES</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drilldown Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Disponibilité Machine
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-xl font-black font-mono ${selectedMachine.tauxDisponibilite >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedMachine.tauxDisponibilite}%
                </span>
                <span className="text-[10px] text-slate-400">/ 90%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${selectedMachine.tauxDisponibilite >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${selectedMachine.tauxDisponibilite}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Temps d'Arrêt Total
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-black font-mono text-rose-400">
                  {selectedMachine.tempsArretTotalMin}
                </span>
                <span className="text-[10px] text-slate-400">minutes</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Planifié: {selectedMachine.tempsArretPlanifieMin}m • Aléas: {selectedMachine.tempsArretNonPlanifieMin}m
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                MTBF (Temps Moyen Avant Panne)
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-black font-mono text-sky-300">
                  {selectedMachine.mtbfHeures}
                </span>
                <span className="text-[10px] text-slate-400">heures</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                {selectedMachine.nombrePannes} arrêt(s) recensé(s)
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                MTTR (Durée Moyenne Réparation)
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-black font-mono text-purple-300">
                  {selectedMachine.mttrMinutes}
                </span>
                <span className="text-[10px] text-slate-400">minutes</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Temps moyen d'intervention
              </span>
            </div>
          </div>

          {/* Causes of downtime & linked interventions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Frequent causes */}
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Causes Fréquentes d'Arrêts Constatées :</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedMachine.causesFrequentes.map((cause, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Linked Maintenance Interventions */}
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                <span>Interventions Enregistrées ({selectedMachine.interventionsLiees.length}) :</span>
              </span>
              {selectedMachine.interventionsLiees.length > 0 ? (
                <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                  {selectedMachine.interventionsLiees.slice(0, 3).map((itv) => (
                    <div
                      key={itv.id}
                      className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="font-semibold text-sky-300">{itv.typeIntervention}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{itv.dureeMinutes} min</span>
                      </div>
                      <p className="text-slate-400 truncate">{itv.descriptionPanne}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  Aucune intervention corrective lourde enregistrée récemment sur cet équipement.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
