import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { OeeMetrics } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Gauge, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Sliders
} from 'lucide-react';

export interface DailyOee7DaysPoint {
  dayOffset: number; // -6 to 0
  date: string;      // YYYY-MM-DD
  dayLabel: string;  // "Lun 15", "Mar 16", etc.
  fullDate: string;  // "15 Septembre 2026"
  isToday: boolean;
  trsGlobal: number; // %
  disponibilite: number; // %
  performance: number;   // %
  qualite: number;       // %
  targetTrs: number;     // 85%
  volumeProduit: number; // flacons
  volumeTheorique: number;
  rebuts: number;
  tempsArretMin: number;
  commentaire: string;
  ofCode: string;
}

interface OeeWeeklyEvolutionChartProps {
  currentOee: OeeMetrics;
  onGoToMes?: () => void;
}

export const OeeWeeklyEvolutionChart: React.FC<OeeWeeklyEvolutionChartProps> = ({
  currentOee,
  onGoToMes
}) => {
  const [chartMode, setChartMode] = useState<'trs' | 'pillars' | 'composed'>('trs');
  const [hoveredPoint, setHoveredPoint] = useState<DailyOee7DaysPoint | null>(null);

  // Compute 7-day data anchored to current live OEE on Day 0
  const data7Days: DailyOee7DaysPoint[] = useMemo(() => {
    const today = new Date('2026-09-21T08:00:00Z');
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    // Pre-calculated realistic daily operational variations leading up to today
    const pastDaysConfig = [
      {
        dayOffset: -6,
        deltaD: -3.2,
        deltaP: -2.8,
        deltaQ: -0.4,
        volume: 880,
        rebuts: 7,
        arret: 52,
        of: 'OF-2026-098',
        comment: 'Démarrage hebdomadaire et étalonnage des 12 becs doseurs'
      },
      {
        dayOffset: -5,
        deltaD: -1.0,
        deltaP: +1.2,
        deltaQ: +0.2,
        volume: 940,
        rebuts: 5,
        arret: 38,
        of: 'OF-2026-099',
        comment: 'Cadence nominale atteinte, stabilité du réacteur R-5000L'
      },
      {
        dayOffset: -4,
        deltaD: -5.8,
        deltaP: -4.5,
        deltaQ: -1.1,
        volume: 810,
        rebuts: 11,
        arret: 68,
        of: 'OF-2026-100',
        comment: 'Nettoyage en place (CIP) et changement de format de flacons 1L'
      },
      {
        dayOffset: -3,
        deltaD: +0.8,
        deltaP: +2.1,
        deltaQ: +0.5,
        volume: 980,
        rebuts: 3,
        arret: 24,
        of: 'OF-2026-101',
        comment: 'Excellente régularité, zéro incident capteur'
      },
      {
        dayOffset: -2,
        deltaD: +1.5,
        deltaP: +1.8,
        deltaQ: +0.6,
        volume: 995,
        rebuts: 2,
        arret: 20,
        of: 'OF-2026-102',
        comment: 'Pic de performance atelier (TRS > 86%)'
      },
      {
        dayOffset: -1,
        deltaD: -1.2,
        deltaP: -0.5,
        deltaQ: -0.1,
        volume: 930,
        rebuts: 4,
        arret: 32,
        of: 'OF-2026-103',
        comment: 'Maintenance préventive des filtres de ligne en fin de poste'
      }
    ];

    const result: DailyOee7DaysPoint[] = pastDaysConfig.map(cfg => {
      const d = new Date(today);
      d.setDate(d.getDate() + cfg.dayOffset);
      const dayName = dayNames[d.getDay()];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthName = monthNames[d.getMonth()];

      const dVal = Math.max(78, Math.min(98, Number((currentOee.disponibilite + cfg.deltaD).toFixed(1))));
      const pVal = Math.max(75, Math.min(96, Number((currentOee.performance + cfg.deltaP).toFixed(1))));
      const qVal = Math.max(92, Math.min(99.8, Number((currentOee.qualite + cfg.deltaQ).toFixed(1))));
      const trs = Number(((dVal / 100) * (pVal / 100) * (qVal / 100) * 100).toFixed(1));

      return {
        dayOffset: cfg.dayOffset,
        date: d.toISOString().slice(0, 10),
        dayLabel: `${dayName} ${dayNum}`,
        fullDate: `${dayNum} ${monthName} 2026`,
        isToday: false,
        trsGlobal: trs,
        disponibilite: dVal,
        performance: pVal,
        qualite: qVal,
        targetTrs: 85.0,
        volumeProduit: cfg.volume,
        volumeTheorique: 1000,
        rebuts: cfg.rebuts,
        tempsArretMin: cfg.arret,
        commentaire: cfg.comment,
        ofCode: cfg.of
      };
    });

    // Today (Day 0 - Live Anchor)
    const todayNum = String(today.getDate()).padStart(2, '0');
    const todayName = dayNames[today.getDay()];
    const todayMonth = monthNames[today.getMonth()];

    result.push({
      dayOffset: 0,
      date: today.toISOString().slice(0, 10),
      dayLabel: `Aujourd'hui`,
      fullDate: `${todayNum} ${todayMonth} 2026 (Direct)`,
      isToday: true,
      trsGlobal: currentOee.trsGlobal,
      disponibilite: currentOee.disponibilite,
      performance: currentOee.performance,
      qualite: currentOee.qualite,
      targetTrs: 85.0,
      volumeProduit: currentOee.piecesBonnes,
      volumeTheorique: 1000,
      rebuts: currentOee.piecesRebuts,
      tempsArretMin: Math.round(currentOee.tempsArretMin),
      commentaire: 'Production en cours sur ligne de conditionnement flacons 1000ml',
      ofCode: 'OF-2026-104'
    });

    return result;
  }, [currentOee]);

  // Aggregate metrics over the 7 days
  const averageTrs7Days = useMemo(() => {
    const sum = data7Days.reduce((acc, curr) => acc + curr.trsGlobal, 0);
    return (sum / data7Days.length).toFixed(1);
  }, [data7Days]);

  const averageDispo7Days = useMemo(() => {
    const sum = data7Days.reduce((acc, curr) => acc + curr.disponibilite, 0);
    return (sum / data7Days.length).toFixed(1);
  }, [data7Days]);

  const averagePerf7Days = useMemo(() => {
    const sum = data7Days.reduce((acc, curr) => acc + curr.performance, 0);
    return (sum / data7Days.length).toFixed(1);
  }, [data7Days]);

  const averageQual7Days = useMemo(() => {
    const sum = data7Days.reduce((acc, curr) => acc + curr.qualite, 0);
    return (sum / data7Days.length).toFixed(1);
  }, [data7Days]);

  // 7-day evolution delta (Today vs J-6)
  const firstDay = data7Days[0];
  const lastDay = data7Days[data7Days.length - 1];
  const trsDeltaPoints = Number((lastDay.trsGlobal - firstDay.trsGlobal).toFixed(1));
  const isTrendPositive = trsDeltaPoints >= 0;

  // Best & lowest days in the week
  const bestDay = useMemo(() => {
    return [...data7Days].sort((a, b) => b.trsGlobal - a.trsGlobal)[0];
  }, [data7Days]);

  const lowestDay = useMemo(() => {
    return [...data7Days].sort((a, b) => a.trsGlobal - b.trsGlobal)[0];
  }, [data7Days]);

  // Custom Recharts Tooltip
  const Custom7DaysTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyOee7DaysPoint;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2.5 min-w-[260px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white text-sm">{data.fullDate}</span>
              {data.isToday && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  En Direct
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              {data.ofCode}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>TRS Global (OEE) :</span>
              </span>
              <span className={`font-mono text-base font-bold ${
                data.trsGlobal >= 85 ? 'text-emerald-400' : data.trsGlobal >= 80 ? 'text-sky-300' : 'text-rose-400'
              }`}>
                {data.trsGlobal}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
              <div className="bg-slate-900/50 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 text-[10px] block">Dispo (D)</span>
                <span className="font-mono font-bold text-sky-400">{data.disponibilite}%</span>
              </div>
              <div className="bg-slate-900/50 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 text-[10px] block">Perf (P)</span>
                <span className="font-mono font-bold text-amber-400">{data.performance}%</span>
              </div>
              <div className="bg-slate-900/50 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 text-[10px] block">Qualité (Q)</span>
                <span className="font-mono font-bold text-emerald-400">{data.qualite}%</span>
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Production : <strong className="text-white font-mono">{data.volumeProduit} U</strong></span>
              <span>Rebuts : <strong className="text-rose-400 font-mono">{data.rebuts} U</strong></span>
              <span>Arrêts : <strong className="text-amber-400 font-mono">{data.tempsArretMin} min</strong></span>
            </div>

            {data.commentaire && (
              <div className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 italic">
                ℹ️ {data.commentaire}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Component Header with title, context and visual mode toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Évolution de l'OEE / TRS sur les 7 Derniers Jours
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800/80 font-mono">
                Recharts • Fenêtre Glissante J-7
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Analyse dynamique de l'efficacité globale des équipements : suivi journalier du TRS, seuil d'excellence industrielle à 85% et corrélation des 3 piliers opérationnels.
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start lg:self-auto">
          <button
            onClick={() => setChartMode('trs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              chartMode === 'trs'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Courbe TRS (%)</span>
          </button>
          <button
            onClick={() => setChartMode('pillars')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              chartMode === 'pillars'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3 Piliers (D/P/Q)</span>
          </button>
          <button
            onClick={() => setChartMode('composed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              chartMode === 'composed'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>TRS + Volume</span>
          </button>
        </div>
      </div>

      {/* 7-Day Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* Metric 1: OEE Actuel (Aujourd'hui) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>OEE Aujourd'hui</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${
              currentOee.trsGlobal >= 85 ? 'text-emerald-400' : currentOee.trsGlobal >= 80 ? 'text-sky-300' : 'text-rose-400'
            }`}>
              {currentOee.trsGlobal}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Live
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dispo : {currentOee.disponibilite}%</span>
            <span>Perf : {currentOee.performance}%</span>
          </div>
        </div>

        {/* Metric 2: Moyenne 7 Jours */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Moyenne Hebdomadaire</span>
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              {averageTrs7Days}%
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
              Cible 85%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            D: {averageDispo7Days}% • P: {averagePerf7Days}% • Q: {averageQual7Days}%
          </div>
        </div>

        {/* Metric 3: Tendance 7 Jours */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tendance vs J-6</span>
            {isTrendPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isTrendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTrendPositive ? `+${trsDeltaPoints}` : `${trsDeltaPoints}`} pts
            </span>
            <div className={`flex items-center text-xs font-semibold ${isTrendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTrendPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{Math.abs(Number(((trsDeltaPoints / firstDay.trsGlobal) * 100).toFixed(1)))}%</span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isTrendPositive ? 'Progression continue' : 'Légère baisse de cadence'}
          </div>
        </div>

        {/* Metric 4: Extrêmes Hebdomadaires */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Extrêmes Hebdo</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Pic :</span>
              <span className="font-mono font-bold text-emerald-400">
                {bestDay.trsGlobal}% <span className="text-[10px] text-slate-400 font-normal">({bestDay.dayLabel})</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Creux :</span>
              <span className="font-mono font-bold text-amber-400">
                {lowestDay.trsGlobal}% <span className="text-[10px] text-slate-400 font-normal">({lowestDay.dayLabel})</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Recharts Area */}
      <div className="space-y-3">
        {/* Chart Legend & Thresholds Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
          <div className="flex flex-wrap items-center gap-4">
            {chartMode === 'trs' && (
              <>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-2 bg-sky-500 rounded"></span>
                  <span className="text-slate-200 font-medium">TRS Journalier (%)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400 border-dashed border-t"></span>
                  <span className="text-emerald-400 font-medium">Seuil World Class (85%)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 border-dashed border-t"></span>
                  <span className="text-rose-400 font-medium">Seuil Critique Alerte (80%)</span>
                </span>
              </>
            )}

            {chartMode === 'pillars' && (
              <>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-1.5 bg-sky-400 rounded"></span>
                  <span className="text-sky-300 font-medium">Disponibilité (D)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-1.5 bg-amber-400 rounded"></span>
                  <span className="text-amber-300 font-medium">Performance (P)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-1.5 bg-emerald-400 rounded"></span>
                  <span className="text-emerald-300 font-medium">Qualité (Q)</span>
                </span>
              </>
            )}

            {chartMode === 'composed' && (
              <>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-2 bg-emerald-500/80 rounded"></span>
                  <span className="text-emerald-300 font-medium">Flacons Fabriqués (U)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-1.5 bg-sky-400 rounded"></span>
                  <span className="text-sky-300 font-medium">TRS Global (%)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-slate-400 border-dashed border-t"></span>
                  <span className="text-slate-400 font-medium">Capacité Nominale (1000 U)</span>
                </span>
              </>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Norme NF E60-182 / ISO 22400
          </span>
        </div>

        {/* Dynamic Chart Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            
            {chartMode === 'trs' ? (
              <AreaChart 
                data={data7Days} 
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="oee7DaysGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis 
                  dataKey="dayLabel" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={[65, 100]} 
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<Custom7DaysTooltip />} />
                
                {/* 85% World Class Standard Reference Line */}
                <ReferenceLine 
                  y={85} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: 'Objectif 85%', fill: '#10b981', fontSize: 11, position: 'right' }} 
                />

                {/* 80% Warning Threshold Reference Line */}
                <ReferenceLine 
                  y={80} 
                  stroke="#f43f5e" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  label={{ value: 'Alerte 80%', fill: '#f43f5e', fontSize: 10, position: 'right' }} 
                />

                {/* Average 7-day TRS Reference Line */}
                <ReferenceLine 
                  y={Number(averageTrs7Days)} 
                  stroke="#94a3b8" 
                  strokeDasharray="2 2" 
                />

                <Area 
                  type="monotone" 
                  dataKey="trsGlobal" 
                  name="TRS Global"
                  stroke="#38bdf8" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#oee7DaysGradient)" 
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0284c7', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : chartMode === 'pillars' ? (
              <LineChart 
                data={data7Days} 
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis 
                  dataKey="dayLabel" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={[70, 100]} 
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<Custom7DaysTooltip />} />
                <ReferenceLine y={85} stroke="#64748b" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="disponibilite" 
                  name="Disponibilité (D)" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  name="Performance (P)" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="qualite" 
                  name="Qualité (Q)" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <ComposedChart 
                data={data7Days} 
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis 
                  dataKey="dayLabel" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={[0, 1200]}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(v) => `${v}U`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#38bdf8" 
                  fontSize={11} 
                  domain={[60, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<Custom7DaysTooltip />} />
                <Bar 
                  yAxisId="left" 
                  dataKey="volumeProduit" 
                  name="Flacons Produits (U)" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.8}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="trsGlobal" 
                  name="TRS Global (%)" 
                  stroke="#38bdf8" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38bdf8' }}
                />
                <ReferenceLine 
                  yAxisId="left" 
                  y={1000} 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Capacité 1000 U', fill: '#94a3b8', fontSize: 10, position: 'insideTopLeft' }}
                />
              </ComposedChart>
            )}

          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Day-by-Day Micro Pills */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Revue quotidienne de la semaine :
          </span>
          <span className="text-[10px] text-slate-500">
            Survolez un jour pour analyser les détails
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {data7Days.map((item) => {
            const isOk = item.trsGlobal >= 85;
            const isWarning = item.trsGlobal < 80;

            return (
              <div
                key={item.date}
                className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  item.isToday 
                    ? 'bg-sky-950/40 border-sky-500/60 shadow-md shadow-sky-950/30'
                    : isWarning 
                    ? 'bg-rose-950/20 border-rose-500/40' 
                    : isOk 
                    ? 'bg-emerald-950/20 border-emerald-500/30' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">{item.dayLabel}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.isToday ? 'bg-sky-400 animate-pulse' : isWarning ? 'bg-rose-400' : isOk ? 'bg-emerald-400' : 'bg-slate-400'
                    }`} />
                  </div>
                  <div className={`text-base font-bold font-mono mt-1 ${
                    isOk ? 'text-emerald-400' : isWarning ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {item.trsGlobal}%
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>{item.volumeProduit} U</span>
                  <span className="text-slate-500">{item.tempsArretMin}m</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
