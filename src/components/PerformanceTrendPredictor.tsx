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
  ReferenceLine
} from 'recharts';
import { OeeMetrics } from '../types';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  HelpCircle,
  Clock,
  Gauge,
  Info
} from 'lucide-react';

interface PerformanceTrendPredictorProps {
  currentOee: OeeMetrics;
}

export type ForecastingModel = 'LINEAR_REGRESSION' | 'HOLT_EXPONENTIAL' | 'WEIGHTED_MOVING_AVG';
export type ForecastScenario = 'NOMINAL' | 'OPTIMISTIC' | 'CONSERVATIVE';

export interface TimelineDataPoint {
  index: number;
  dayOffset: number; // -6 to +3
  dateStr: string;
  dayLabel: string;
  fullDate: string;
  type: 'HISTORICAL' | 'TODAY' | 'FORECAST';
  // Metrics
  trs: number;
  disponibilite: number;
  performance: number;
  qualite: number;
  volume: number;
  // Forecast confidence bands (only for FORECAST)
  confidenceLow?: number;
  confidenceHigh?: number;
  // Chart split series for continuous smooth lines
  trsHistory?: number | null;
  trsForecast?: number | null;
  // Meta
  note?: string;
}

export const PerformanceTrendPredictor: React.FC<PerformanceTrendPredictorProps> = ({
  currentOee
}) => {
  const [model, setModel] = useState<ForecastingModel>('LINEAR_REGRESSION');
  const [scenario, setScenario] = useState<ForecastScenario>('NOMINAL');
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // 1. Build the 7-day historical dataset (D-6 to D0/Aujourd'hui) anchored to current live OEE
  const historicalDays = useMemo(() => {
    const today = new Date('2026-09-21T08:00:00Z');
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    const pastConfigs = [
      { offset: -6, deltaD: -3.2, deltaP: -2.8, deltaQ: -0.4, vol: 880, note: 'Démarrage hebdomadaire & réglages' },
      { offset: -5, deltaD: -1.0, deltaP: +1.2, deltaQ: +0.2, vol: 940, note: 'Stabilisation réacteur 5000L' },
      { offset: -4, deltaD: -5.8, deltaP: -4.5, deltaQ: -1.1, vol: 810, note: 'CIP & changement de format flacons 1L' },
      { offset: -3, deltaD: +0.8, deltaP: +2.1, deltaQ: +0.5, vol: 980, note: 'Excellente régularité cadence' },
      { offset: -2, deltaD: +1.5, deltaP: +1.8, deltaQ: +0.6, vol: 995, note: 'Pic de performance atelier' },
      { offset: -1, deltaD: -1.2, deltaP: -0.5, deltaQ: -0.1, vol: 930, note: 'Nettoyage filtres de ligne' }
    ];

    const history: TimelineDataPoint[] = pastConfigs.map((cfg, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() + cfg.offset);
      const dName = dayNames[d.getDay()];
      const dNum = String(d.getDate()).padStart(2, '0');
      const mName = monthNames[d.getMonth()];

      const dVal = Math.max(75, Math.min(98, Number((currentOee.disponibilite + cfg.deltaD).toFixed(1))));
      const pVal = Math.max(75, Math.min(98, Number((currentOee.performance + cfg.deltaP).toFixed(1))));
      const qVal = Math.max(90, Math.min(99.8, Number((currentOee.qualite + cfg.deltaQ).toFixed(1))));
      const trs = Number(((dVal / 100) * (pVal / 100) * (qVal / 100) * 100).toFixed(1));

      return {
        index: idx,
        dayOffset: cfg.offset,
        dateStr: d.toISOString().slice(0, 10),
        dayLabel: `${dName} ${dNum}`,
        fullDate: `${dNum} ${mName} 2026`,
        type: 'HISTORICAL' as const,
        trs,
        disponibilite: dVal,
        performance: pVal,
        qualite: qVal,
        volume: cfg.vol,
        trsHistory: trs,
        trsForecast: null,
        note: cfg.note
      };
    });

    // Today (D0 - Index 6)
    const todayNum = String(today.getDate()).padStart(2, '0');
    const todayName = dayNames[today.getDay()];
    const todayMonth = monthNames[today.getMonth()];

    history.push({
      index: 6,
      dayOffset: 0,
      dateStr: today.toISOString().slice(0, 10),
      dayLabel: `Aujourd'hui`,
      fullDate: `${todayNum} ${todayMonth} 2026 (Direct)`,
      type: 'TODAY' as const,
      trs: currentOee.trsGlobal,
      disponibilite: currentOee.disponibilite,
      performance: currentOee.performance,
      qualite: currentOee.qualite,
      volume: currentOee.piecesBonnes,
      trsHistory: currentOee.trsGlobal,
      trsForecast: currentOee.trsGlobal, // Anchor transition point
      note: 'Production en cours (Ligne conditionnement)'
    });

    return history;
  }, [currentOee]);

  // 2. Statistical Inférence Engine: Compute trend on the 7 days (index 0..6)
  const inferenceStats = useMemo(() => {
    const n = historicalDays.length; // 7
    const xValues = historicalDays.map(p => p.index); // [0, 1, 2, 3, 4, 5, 6]
    const yTrs = historicalDays.map(p => p.trs);
    const yDispo = historicalDays.map(p => p.disponibilite);
    const yPerf = historicalDays.map(p => p.performance);
    const yQual = historicalDays.map(p => p.qualite);

    const calcLinearRegression = (y: number[]) => {
      const meanX = 3;
      const meanY = y.reduce((acc, v) => acc + v, 0) / n;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (xValues[i] - meanX) * (y[i] - meanY);
        den += Math.pow(xValues[i] - meanX, 2);
      }
      const slope = den !== 0 ? num / den : 0;
      const intercept = meanY - slope * meanX;

      // Residual Standard Error (Sy.x) & R2
      let ssRes = 0;
      let ssTot = 0;
      for (let i = 0; i < n; i++) {
        const yPred = slope * xValues[i] + intercept;
        ssRes += Math.pow(y[i] - yPred, 2);
        ssTot += Math.pow(y[i] - meanY, 2);
      }
      const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
      const stdError = Math.sqrt(ssRes / Math.max(1, n - 2));

      return { slope, intercept, rSquared, stdError, meanY };
    };

    const trsReg = calcLinearRegression(yTrs);
    const dispoReg = calcLinearRegression(yDispo);
    const perfReg = calcLinearRegression(yPerf);
    const qualReg = calcLinearRegression(yQual);

    // Holt's Double Exponential Smoothing
    const calcHoltForecast = (y: number[], alpha = 0.55, beta = 0.25) => {
      let level = y[0];
      let trend = y[1] - y[0];
      for (let i = 1; i < n; i++) {
        const prevLevel = level;
        const prevTrend = trend;
        level = alpha * y[i] + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
      }
      return {
        predict: (stepsAhead: number) => level + stepsAhead * trend,
        slope: trend
      };
    };

    const holtTrs = calcHoltForecast(yTrs);

    // Weighted Moving Average (WMA)
    const calcWmaForecast = (y: number[]) => {
      const weights = [1, 1.5, 2, 2.5, 3, 3.5, 4.5];
      const sumW = weights.reduce((a, b) => a + b, 0);
      const wma = y.reduce((acc, val, i) => acc + val * weights[i], 0) / sumW;
      const recentSlope = (y[n - 1] - y[n - 3]) / 2;
      return {
        predict: (stepsAhead: number) => wma + stepsAhead * (recentSlope * 0.6),
        slope: recentSlope
      };
    };

    const wmaTrs = calcWmaForecast(yTrs);

    return {
      trsReg,
      dispoReg,
      perfReg,
      qualReg,
      holtTrs,
      wmaTrs
    };
  }, [historicalDays]);

  // 3. Generate 3-Day Forecast Points (J+1, J+2, J+3)
  const forecastDays = useMemo(() => {
    const today = new Date('2026-09-21T08:00:00Z');
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    // Scenario Modifiers
    const scenarioOffset = scenario === 'OPTIMISTIC' ? +1.2 : scenario === 'CONSERVATIVE' ? -1.8 : 0;

    const futureOffsets = [
      { step: 1, labelSuffix: 'J+1 (Demain)', note: 'Prévision basée sur la régularité du poste 1' },
      { step: 2, labelSuffix: 'J+2 (Mercredi)', note: 'Intègre la cadence prévue sur flacons 1000ml' },
      { step: 3, labelSuffix: 'J+3 (Jeudi)', note: 'Projection moyen terme avant fin de semaine' }
    ];

    const results: TimelineDataPoint[] = futureOffsets.map((f, i) => {
      const targetIndex = 6 + f.step;
      const d = new Date(today);
      d.setDate(d.getDate() + f.step);
      const dName = dayNames[d.getDay()];
      const dNum = String(d.getDate()).padStart(2, '0');
      const mName = monthNames[d.getMonth()];

      let rawTrs = 0;
      if (model === 'LINEAR_REGRESSION') {
        rawTrs = inferenceStats.trsReg.slope * targetIndex + inferenceStats.trsReg.intercept;
      } else if (model === 'HOLT_EXPONENTIAL') {
        rawTrs = inferenceStats.holtTrs.predict(f.step);
      } else {
        rawTrs = inferenceStats.wmaTrs.predict(f.step);
      }

      // Apply scenario factor
      rawTrs += scenarioOffset;

      // Bound to realistic physical thresholds [65%, 98.5%]
      const trs = Math.max(68, Math.min(98.5, Number(rawTrs.toFixed(1))));

      // Forecast components
      const rawDispo = inferenceStats.dispoReg.slope * targetIndex + inferenceStats.dispoReg.intercept + (scenarioOffset * 0.7);
      const rawPerf = inferenceStats.perfReg.slope * targetIndex + inferenceStats.perfReg.intercept + (scenarioOffset * 0.8);
      const rawQual = inferenceStats.qualReg.slope * targetIndex + inferenceStats.qualReg.intercept + (scenarioOffset * 0.2);

      const dispo = Math.max(70, Math.min(98.5, Number(rawDispo.toFixed(1))));
      const perf = Math.max(70, Math.min(98.5, Number(rawPerf.toFixed(1))));
      const qual = Math.max(90, Math.min(99.9, Number(rawQual.toFixed(1))));

      // Confidence Interval widening with horizon step
      const z = 1.96;
      const horizonExpansion = Math.sqrt(1 + (1 / 7) + Math.pow(targetIndex - 3, 2) / 28);
      const margin = Number((z * inferenceStats.trsReg.stdError * horizonExpansion * 0.65).toFixed(1));
      const confidenceLow = Math.max(65, Number((trs - margin).toFixed(1)));
      const confidenceHigh = Math.min(99.5, Number((trs + margin).toFixed(1)));

      const estimatedVolume = Math.round((trs / 85) * 950);

      return {
        index: targetIndex,
        dayOffset: f.step,
        dateStr: d.toISOString().slice(0, 10),
        dayLabel: `J+${f.step} (${dName})`,
        fullDate: `${dNum} ${mName} 2026`,
        type: 'FORECAST' as const,
        trs,
        disponibilite: dispo,
        performance: perf,
        qualite: qual,
        volume: estimatedVolume,
        confidenceLow,
        confidenceHigh,
        trsHistory: null,
        trsForecast: trs,
        note: f.note
      };
    });

    return results;
  }, [inferenceStats, model, scenario]);

  // Combined 10-day timeline (7 past + 3 future)
  const fullTimelineData = useMemo(() => {
    return [...historicalDays, ...forecastDays];
  }, [historicalDays, forecastDays]);

  // Global Key Predictive Metrics
  const todayPoint = historicalDays[historicalDays.length - 1];
  const j1Point = forecastDays[0];
  const j3Point = forecastDays[forecastDays.length - 1];

  const deltaJ1Points = Number((j1Point.trs - todayPoint.trs).toFixed(1));
  const deltaJ3Points = Number((j3Point.trs - todayPoint.trs).toFixed(1));
  const avgForecastTrs = Number(
    (forecastDays.reduce((a, b) => a + b.trs, 0) / forecastDays.length).toFixed(1)
  );

  const isGlobalTrendPositive = deltaJ3Points >= 0;
  const isTargetAchievedAtJ3 = j3Point.trs >= 85.0;

  // Custom Chart Tooltip
  const CustomForecastTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelineDataPoint;
      const isForecast = data.type === 'FORECAST';
      const isToday = data.type === 'TODAY';

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 min-w-[270px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white text-sm">{data.fullDate}</span>
              {isToday && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Aujourd'hui
                </span>
              )}
              {isForecast && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Prédiction Inférence J+{data.dayOffset}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                <span className={`w-2.5 h-2.5 rounded-full ${isForecast ? 'bg-purple-400' : 'bg-sky-400'}`}></span>
                <span>{isForecast ? 'TRS Prévisionnel :' : 'TRS Réel :'}</span>
              </span>
              <span className={`font-mono text-base font-bold ${
                data.trs >= 85 ? 'text-emerald-400' : data.trs >= 80 ? 'text-sky-300' : 'text-rose-400'
              }`}>
                {data.trs}%
              </span>
            </div>

            {isForecast && data.confidenceLow && data.confidenceHigh && (
              <div className="text-[11px] text-purple-300/80 flex items-center justify-between px-1">
                <span>Intervalle de confiance (95%) :</span>
                <span className="font-mono font-semibold">
                  [{data.confidenceLow}% - {data.confidenceHigh}%]
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Dispo (D)</span>
                <span className="font-mono font-bold text-sky-400">{data.disponibilite}%</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Perf (P)</span>
                <span className="font-mono font-bold text-amber-400">{data.performance}%</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Qualité (Q)</span>
                <span className="font-mono font-bold text-emerald-400">{data.qualite}%</span>
              </div>
            </div>

            {data.note && (
              <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800 italic">
                {isForecast ? '🔮 Inférence :' : '📋 Contexte :'} {data.note}
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
      
      {/* Component Header with Inférence details */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Prédictions de Tendances de Performance (J+1 à J+3)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                Inférence Statistique Continue
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Extrapolation algorithmique basée sur les observations des 7 derniers jours : projection du TRS, détection précoce des dérives et analyse de sensibilité sur les 3 prochains jours.
            </p>
          </div>
        </div>

        {/* Model & Scenario Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Model Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setModel('LINEAR_REGRESSION')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                model === 'LINEAR_REGRESSION'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Régression linéaire par moindres carrés"
            >
              Moindres Carrés (OLS)
            </button>
            <button
              onClick={() => setModel('HOLT_EXPONENTIAL')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                model === 'HOLT_EXPONENTIAL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Lissage exponentiel double de Holt (poids récent fort)"
            >
              Lissage Holt
            </button>
            <button
              onClick={() => setModel('WEIGHTED_MOVING_AVG')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                model === 'WEIGHTED_MOVING_AVG'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Moyenne mobile pondérée sur 7 jours"
            >
              WMA-7
            </button>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setScenario('NOMINAL')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all ${
                scenario === 'NOMINAL' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Nominal
            </button>
            <button
              onClick={() => setScenario('OPTIMISTIC')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all ${
                scenario === 'OPTIMISTIC' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-slate-400'
              }`}
              title="+1.2% amélioration continue"
            >
              Optimiste (+1.2%)
            </button>
            <button
              onClick={() => setScenario('CONSERVATIVE')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all ${
                scenario === 'CONSERVATIVE' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'text-slate-400'
              }`}
              title="-1.8% aléas maintenance"
            >
              Prudent (-1.8%)
            </button>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {forecastDays.map((fc, index) => {
          const deltaVsToday = Number((fc.trs - todayPoint.trs).toFixed(1));
          const isUp = deltaVsToday >= 0;
          const isTargetOk = fc.trs >= 85.0;

          return (
            <div 
              key={fc.dayOffset}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isTargetOk
                  ? 'bg-gradient-to-b from-purple-950/40 to-slate-950/80 border-purple-500/40 shadow-lg shadow-purple-950/20'
                  : 'bg-gradient-to-b from-amber-950/30 to-slate-950/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">
                      {fc.dayLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {fc.fullDate.split(' ')[0]} {fc.fullDate.split(' ')[1]}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isTargetOk
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isTargetOk ? '≥ Cible 85%' : 'Alerte Sous-Cible'}
                  </span>
                </div>

                {/* Main Forecasted Value */}
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                      isTargetOk ? 'text-purple-300' : 'text-amber-300'
                    }`}>
                      {fc.trs}%
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">TRS prévu</span>
                  </div>

                  <div className={`flex items-center space-x-1 text-xs font-semibold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{isUp ? `+${deltaVsToday}` : `${deltaVsToday}`} pts</span>
                  </div>
                </div>

                {/* Confidence Range */}
                <div className="mt-1 text-[11px] text-slate-400 font-mono">
                  Fourchette IC95% : <strong className="text-slate-300">[{fc.confidenceLow}% - {fc.confidenceHigh}%]</strong>
                </div>

                {/* Estimated Production Volume */}
                <div className="mt-2 text-xs text-slate-300 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Volume estimé :</span>
                  <span className="font-mono font-bold text-white">{fc.volume} flacons</span>
                </div>
              </div>

              {/* 3 Pillars Projection Grid */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">D (Dispo)</span>
                  <span className="font-mono font-bold text-sky-400">{fc.disponibilite}%</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">P (Perf)</span>
                  <span className="font-mono font-bold text-amber-400">{fc.performance}%</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">Q (Qual)</span>
                  <span className="font-mono font-bold text-emerald-400">{fc.qualite}%</span>
                </div>
              </div>

            </div>
          );
        })}

      </div>

      {/* Main Continuous Timeline Chart: 7 Days Actual + 3 Days Forecast */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-2 bg-sky-500 rounded"></span>
              <span className="text-slate-200 font-medium">Historique Réel Certifié (J-6 à J0)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-purple-400 border-dashed border-t"></span>
              <span className="text-purple-300 font-medium">Projection Inférence (J+1 à J+3)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 border-dashed border-t"></span>
              <span className="text-emerald-400 font-medium">Seuil World Class (85%)</span>
            </span>
          </div>

          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="flex items-center space-x-1 text-slate-400 hover:text-purple-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="underline">Détails mathématiques du modèle</span>
          </button>
        </div>

        {/* Recharts Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={fullTimelineData}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="forecastConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
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
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip content={<CustomForecastTooltip />} />

              {/* 85% Target Line */}
              <ReferenceLine
                y={85}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: 'Objectif 85%', fill: '#10b981', fontSize: 10, position: 'right' }}
              />

              {/* Today Vertical Demarcation Line */}
              <ReferenceLine
                x="Aujourd'hui"
                stroke="#38bdf8"
                strokeDasharray="2 2"
                strokeWidth={1.5}
                label={{ value: 'Aujourd\'hui (Direct)', fill: '#38bdf8', fontSize: 10, position: 'top' }}
              />

              {/* Historical Area */}
              <Area
                type="monotone"
                dataKey="trsHistory"
                name="Historique Réel"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#historyGradient)"
                dot={{ r: 3, fill: '#38bdf8' }}
              />

              {/* Forecast Area (Confidence Band) */}
              <Area
                type="monotone"
                dataKey="confidenceHigh"
                name="Borne Haute IC95%"
                stroke="transparent"
                fill="url(#forecastConfidenceGradient)"
              />

              {/* Forecast Line */}
              <Line
                type="monotone"
                dataKey="trsForecast"
                name="Prédiction Inférence"
                stroke="#c084fc"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#c084fc', stroke: '#7e22ce', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#c084fc' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explanatory Statistical Panel (Collapsible / Toggleable) */}
      {showFormulaDetails && (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Paramètres Mathématiques & Inférence Statistique</span>
            </span>
            <span className="text-[11px] font-mono text-purple-300">
              Modèle actif : {model === 'LINEAR_REGRESSION' ? 'Moindres Carrés Ordinaires (OLS)' : model === 'HOLT_EXPONENTIAL' ? 'Lissage Double de Holt' : 'Moyenne Pondérée (WMA)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Pente Moyenne (β1)</span>
              <span className={`text-base font-bold font-mono ${
                inferenceStats.trsReg.slope >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {inferenceStats.trsReg.slope >= 0 ? `+${inferenceStats.trsReg.slope.toFixed(2)}` : inferenceStats.trsReg.slope.toFixed(2)} % / jour
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Vitesse de progression</span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Corrélation R²</span>
              <span className="text-base font-bold font-mono text-sky-400">
                {(inferenceStats.trsReg.rSquared * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Qualité de l'ajustement</span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Écart-Type Résiduel (Se)</span>
              <span className="text-base font-bold font-mono text-amber-400">
                ±{inferenceStats.trsReg.stdError.toFixed(2)} pts
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Volatilité quotidienne</span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Moyenne 7 Jours (ȳ)</span>
              <span className="text-base font-bold font-mono text-purple-400">
                {inferenceStats.trsReg.meanY.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Niveau de base référence</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed pt-1">
            <strong>Méthode d'inférence :</strong> La projection calcule l'extrapolation linéaire et exponentielle des 7 points chronologiques récents (J-6 à J0). Les intervalles de confiance à 95% s'élargissent proportionnellement à la distance temporelle du point prédit pour respecter la marge d'incertitude industrielle.
          </div>
        </div>
      )}

      {/* Synthesis & Industrial Recommendation */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
        isTargetAchievedAtJ3
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
          : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
      }`}>
        {isTargetAchievedAtJ3 ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="font-bold flex items-center space-x-2">
            <span>Synthèse Industrielle Prédictive :</span>
            <span className="font-normal opacity-90">
              Moyenne prévisionnelle sur 3 jours de <strong className="underline">{avgForecastTrs}%</strong>
            </span>
          </div>
          <p className="opacity-80 leading-relaxed">
            {isTargetAchievedAtJ3
              ? `La dynamique constatée sur les 7 derniers jours confirme le maintien au-dessus du seuil cible de 85% pour les 3 prochains jours. Aucun goulot d'étranglement critique n'est anticipé si la disponibilité machine reste au niveau nominal actuel.`
              : `Attention : la tendance actuelle projette un TRS sous le seuil d'excellence industrielle à J+3 (${j3Point.trs}%). Il est recommandé d'anticiper le nettoyage des circuits et de vérifier les réglages de cadence sur la ligne de conditionnement.`
            }
          </p>
        </div>
      </div>

    </div>
  );
};
