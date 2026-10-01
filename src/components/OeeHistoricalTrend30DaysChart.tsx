import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Dot
} from 'recharts';
import { OeeMetrics, OrdreFabrication } from '../types';
import { DailyOeeDataPoint } from '../data/analyticsHistoryData';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Sliders,
  Award,
  Zap,
  Filter
} from 'lucide-react';

export type EnrichedOeePoint = DailyOeeDataPoint & {
  movingAvg7: number;
  hasEvent: boolean;
  ofDetails?: OrdreFabrication;
};

interface OeeHistoricalTrend30DaysChartProps {
  oeeHistory: DailyOeeDataPoint[];
  currentOee: OeeMetrics;
  ordresFabrication?: OrdreFabrication[];
  onGoToMes?: () => void;
}

export const OeeHistoricalTrend30DaysChart: React.FC<OeeHistoricalTrend30DaysChartProps> = ({
  oeeHistory,
  currentOee,
  ordresFabrication,
  onGoToMes
}) => {
  // Chart visual display options
  const [showPillars, setShowPillars] = useState<boolean>(false);
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);
  const [showEventsOnly, setShowEventsOnly] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<DailyOeeDataPoint | null>(null);

  // Ensure we have 30 days of data and compute moving averages
  const enrichedData: EnrichedOeePoint[] = useMemo(() => {
    // Take 30 days of data
    const slice30 = oeeHistory.slice(-30);

    return slice30.map((point, index, array) => {
      // 7-day moving average calculation
      const windowStart = Math.max(0, index - 6);
      const windowPoints = array.slice(windowStart, index + 1);
      const avgTrs7 = Number(
        (windowPoints.reduce((acc, p) => acc + p.trsGlobal, 0) / windowPoints.length).toFixed(1)
      );

      // Check if real OF matches
      const matchedOf = ordresFabrication?.find(
        (of) => of.numeroOF === point.ofAssocie || String(of.id) === point.ofAssocie
      );

      const hasEvent = Boolean(point.incidentRemarquable);

      return {
        ...point,
        movingAvg7: avgTrs7,
        hasEvent,
        ofDetails: matchedOf
      };
    });
  }, [oeeHistory, ordresFabrication]);

  // Summary statistics across 30 days
  const stats = useMemo(() => {
    if (enrichedData.length === 0) {
      return {
        avgTrs: 85,
        maxTrs: 85,
        maxPoint: null as EnrichedOeePoint | null,
        minTrs: 85,
        minPoint: null as EnrichedOeePoint | null,
        daysAboveTarget: 0,
        pctAboveTarget: 0,
        trendDelta: 0,
        totalVolume: 0,
        totalRebuts: 0,
        totalArretMin: 0
      };
    }

    const trsValues = enrichedData.map((d) => d.trsGlobal);
    const sumTrs = trsValues.reduce((a, b) => a + b, 0);
    const avgTrs = Number((sumTrs / enrichedData.length).toFixed(1));

    let maxTrs = -Infinity;
    let maxPoint: EnrichedOeePoint | null = null;
    let minTrs = Infinity;
    let minPoint: EnrichedOeePoint | null = null;

    enrichedData.forEach((d) => {
      if (d.trsGlobal > maxTrs) {
        maxTrs = d.trsGlobal;
        maxPoint = d;
      }
      if (d.trsGlobal < minTrs) {
        minTrs = d.trsGlobal;
        minPoint = d;
      }
    });

    const daysAboveTarget = enrichedData.filter((d) => d.trsGlobal >= 85).length;
    const pctAboveTarget = Math.round((daysAboveTarget / enrichedData.length) * 100);

    // Linear regression slope approximation (first 5 days avg vs last 5 days avg)
    const first5 = enrichedData.slice(0, 5);
    const last5 = enrichedData.slice(-5);
    const first5Avg = first5.reduce((a, b) => a + b.trsGlobal, 0) / first5.length;
    const last5Avg = last5.reduce((a, b) => a + b.trsGlobal, 0) / last5.length;
    const trendDelta = Number((last5Avg - first5Avg).toFixed(1));

    const totalVolume = enrichedData.reduce((acc, p) => acc + p.volumeProduit, 0);
    const totalRebuts = enrichedData.reduce((acc, p) => acc + p.rebuts, 0);
    const totalArretMin = enrichedData.reduce((acc, p) => acc + p.tempsArretMin, 0);

    return {
      avgTrs,
      maxTrs,
      maxPoint,
      minTrs,
      minPoint,
      daysAboveTarget,
      pctAboveTarget,
      trendDelta,
      totalVolume,
      totalRebuts,
      totalArretMin
    };
  }, [enrichedData]);

  // Default selected day to current day or highest/latest
  const activeDay = selectedDay || enrichedData[enrichedData.length - 1];

  // Custom Interactive Tooltip
  const CustomHistoricalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isTargetMet = data.trsGlobal >= 85;

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-3 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold text-white text-xs">{data.label} ({data.date})</span>
            </div>
            <span className="font-mono text-[10px] text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800">
              {data.ofAssocie}
            </span>
          </div>

          {/* TRS Main Status */}
          <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                TRS Global Journalier
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className={`text-xl font-black font-mono ${isTargetMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {data.trsGlobal}%
                </span>
                <span className="text-[11px] text-slate-400">/ Cible 85%</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Moyenne 7j
              </span>
              <span className="text-sm font-bold font-mono text-purple-300">
                {data.movingAvg7}%
              </span>
            </div>
          </div>

          {/* 3 Pillars Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-sky-400 block font-semibold">Disponibilité</span>
              <span className="text-xs font-mono font-bold text-slate-200">{data.disponibilite}%</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-amber-400 block font-semibold">Performance</span>
              <span className="text-xs font-mono font-bold text-slate-200">{data.performance}%</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-emerald-400 block font-semibold">Qualité</span>
              <span className="text-xs font-mono font-bold text-slate-200">{data.qualite}%</span>
            </div>
          </div>

          {/* Volume and Production details */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
            <span>Production : <strong className="text-white">{data.volumeProduit.toLocaleString('fr-FR')} U</strong></span>
            <span className="text-rose-400">Rebuts : {data.rebuts} U ({data.tauxRebut}%)</span>
          </div>

          {/* Event description if any */}
          {data.incidentRemarquable && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-2 text-[11px] text-amber-200 flex items-start space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{data.incidentRemarquable}</span>
            </div>
          )}

          <div className="text-[10px] text-slate-400 italic text-center">
            Cliquez sur le point pour verrouiller l'analyse du jour
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Top Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Tendance Historique du TRS Global (30 Derniers Jours)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-800/80">
                  Recharts • 30 Jours
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Analyse chronologique du Taux de Rendement Synthétique atelier, comparaison à la cible TPM (85%) et moyenne mobile.
              </p>
            </div>
          </div>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMovingAvg(!showMovingAvg)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center space-x-1.5 ${
              showMovingAvg
                ? 'bg-purple-950/70 border-purple-500/50 text-purple-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Afficher/masquer la moyenne mobile lissée sur 7 jours"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Moyenne Mobile 7j</span>
          </button>

          <button
            onClick={() => setShowPillars(!showPillars)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center space-x-1.5 ${
              showPillars
                ? 'bg-sky-950/70 border-sky-500/50 text-sky-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Afficher/masquer la décomposition des 3 piliers (D, P, Q)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3 Piliers (D/P/Q)</span>
          </button>

          {onGoToMes && (
            <button
              onClick={onGoToMes}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>Module MES</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 30-Day Executive Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Moyenne 30j */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            TRS Moyen 30j
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-xl font-black font-mono ${stats.avgTrs >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {stats.avgTrs}%
            </span>
            <span className="text-[10px] text-slate-400">vs 85% cible</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {stats.avgTrs >= 85 ? '✓ Conforme standard' : 'Écart à combler : -' + (85 - stats.avgTrs).toFixed(1) + '%'}
          </span>
        </div>

        {/* Card 2: Dynamique de Tendance */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Tendance (30j)
          </span>
          <div className="flex items-center space-x-1.5">
            {stats.trendDelta >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
            <span className={`text-xl font-black font-mono ${stats.trendDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.trendDelta >= 0 ? `+${stats.trendDelta}%` : `${stats.trendDelta}%`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {stats.trendDelta >= 0 ? 'Trajectoire haussière' : 'Légère baisse de cadence'}
          </span>
        </div>

        {/* Card 3: Pic de performance */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Record Max
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black font-mono text-emerald-300">
              {stats.maxTrs}%
            </span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {stats.maxPoint?.label || 'Jour record'} ({stats.maxPoint?.ofAssocie})
          </span>
        </div>

        {/* Card 4: Creux de performance */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Point Bas
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black font-mono text-amber-400">
              {stats.minTrs}%
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {stats.minPoint?.label || 'Point bas'} (Maintenance)
          </span>
        </div>

        {/* Card 5: Jours au-dessus de 85% */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Conformité Cible
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black font-mono text-sky-300">
              {stats.daysAboveTarget} / 30
            </span>
            <span className="text-[10px] text-slate-400">({stats.pctAboveTarget}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${stats.pctAboveTarget}%` }}
            />
          </div>
        </div>

        {/* Card 6: Production Cumulée */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Volume 30j
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black font-mono text-white">
              {(stats.totalVolume / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-slate-400">flacons</span>
          </div>
          <span className="text-[10px] text-rose-400 block truncate">
            Rebuts cumulés : {stats.totalRebuts} U
          </span>
        </div>
      </div>

      {/* Main Recharts Area: 30-Day Historical Trend */}
      <div className="space-y-3">
        {/* Chart Legend & Indicators */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-3.5 h-1.5 bg-sky-400 rounded-sm"></span>
              <span className="text-slate-200 font-medium">TRS Global Journalier (%)</span>
            </span>

            {showMovingAvg && (
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-0.5 bg-purple-400 rounded-full"></span>
                <span className="text-purple-300 font-medium">Moyenne Mobile 7 jours</span>
              </span>
            )}

            <span className="flex items-center space-x-1.5">
              <span className="w-3.5 h-0.5 bg-emerald-400 border-dashed border-t"></span>
              <span className="text-emerald-400 font-semibold">Cible Standard TPM (85.0%)</span>
            </span>

            <span className="flex items-center space-x-1.5">
              <span className="w-3.5 h-0.5 bg-slate-500 border-dotted border-t"></span>
              <span className="text-slate-400">Moyenne 30j ({stats.avgTrs}%)</span>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Axe X : 30 jours consécutifs • Axe Y : Taux de Rendement Synthétique
          </span>
        </div>

        {/* Recharts Container */}
        <div className="h-80 w-full bg-slate-950/60 p-2 sm:p-4 rounded-2xl border border-slate-800/80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enrichedData}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedDay(e.activePayload[0].payload as DailyOeeDataPoint);
                }
              }}
            >
              <defs>
                <linearGradient id="trsTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#0ea5e9" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dispoPillarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />

              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                interval={2}
              />

              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={[60, 100]}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip content={<CustomHistoricalTooltip />} />

              {/* Reference Lines: Standard Target 85% & 30-Day Average */}
              <ReferenceLine
                y={85}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Cible TPM 85%',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'insideTopRight',
                  offset: 8
                }}
              />

              <ReferenceLine
                y={stats.avgTrs}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth={1}
              />

              {/* Area Under TRS Curve */}
              <Area
                type="monotone"
                dataKey="trsGlobal"
                stroke="#38bdf8"
                strokeWidth={2.8}
                fillOpacity={1}
                fill="url(#trsTrendAreaGrad)"
                name="TRS Global (%)"
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* 7-Day Moving Average Line */}
              {showMovingAvg && (
                <Line
                  type="monotone"
                  dataKey="movingAvg7"
                  stroke="#c084fc"
                  strokeWidth={2.2}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Moyenne Mobile 7j"
                />
              )}

              {/* Optional 3 Pillars Breakdown */}
              {showPillars && (
                <>
                  <Line
                    type="monotone"
                    dataKey="disponibilite"
                    stroke="#38bdf8"
                    strokeWidth={1.2}
                    dot={false}
                    name="Disponibilité"
                  />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    stroke="#f59e0b"
                    strokeWidth={1.2}
                    dot={false}
                    name="Performance"
                  />
                  <Line
                    type="monotone"
                    dataKey="qualite"
                    stroke="#10b981"
                    strokeWidth={1.2}
                    dot={false}
                    name="Qualité"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Day Inspector Card */}
      {activeDay && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                Détail du {activeDay.label} ({activeDay.date})
              </span>
              <span className="font-mono text-xs text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                {activeDay.ofAssocie}
              </span>
              {activeDay.trsGlobal >= 85 ? (
                <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Objectif atteint</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[11px] text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sous la cible (-{(85 - activeDay.trsGlobal).toFixed(1)}%)</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">
              {activeDay.incidentRemarquable ? (
                <span className="text-amber-300">Événement : {activeDay.incidentRemarquable}</span>
              ) : (
                <span className="text-slate-400">Production nominale fluide sans arrêt majeur recensé.</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Volume Fabriqué</span>
              <span className="text-sm font-mono font-bold text-white">
                {activeDay.volumeProduit.toLocaleString('fr-FR')} U
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Temps d'Arrêt</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {activeDay.tempsArretMin} min
              </span>
            </div>

            {onGoToMes && (
              <button
                onClick={onGoToMes}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors flex items-center space-x-1.5"
              >
                <span>Consulter OF</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
