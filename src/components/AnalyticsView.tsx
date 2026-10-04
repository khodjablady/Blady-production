import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Article, OeeMetrics, CommandeClient, OrdreFabrication, MachineLigne, InterventionMaintenance } from '../types';
import { generate30DaysHistory, DailyStockDataPoint, DailyOeeDataPoint } from '../data/analyticsHistoryData';
import { INITIAL_COMMANDES_CLIENTS } from '../data/initialData';
import { OeeHistoricalTrend30DaysChart } from './OeeHistoricalTrend30DaysChart';
import { OeeWeeklyEvolutionChart } from './OeeWeeklyEvolutionChart';
import { PerformanceTrendPredictor } from './PerformanceTrendPredictor';
import { ProductCostVsRevenueSection } from './ProductCostVsRevenueSection';
import { MachineAvailabilityView } from './MachineAvailabilityView';
import { 
  TrendingUp, 
  TrendingDown, 
  Boxes, 
  Layers, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  Activity, 
  Clock, 
  Droplets, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Maximize2,
  FileCode2
} from 'lucide-react';

interface AnalyticsViewProps {
  articles: Article[];
  oee: OeeMetrics;
  commandesClients?: CommandeClient[];
  ordresFabrication?: OrdreFabrication[];
  machines?: MachineLigne[];
  interventions?: InterventionMaintenance[];
  onGoToErp?: () => void;
  onGoToMes?: () => void;
  onGoToCSharp?: () => void;
  onGoToMaintenance?: () => void;
}

type PeriodDays = 7 | 14 | 30;
type ViewCategory = 'all' | 'oee' | 'machines' | 'predictions' | 'stocks' | 'costs' | 'correlation';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  articles,
  oee,
  commandesClients,
  ordresFabrication,
  machines,
  interventions,
  onGoToErp,
  onGoToMes,
  onGoToCSharp,
  onGoToMaintenance
}) => {
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [selectedCategory, setSelectedCategory] = useState<ViewCategory>('all');
  const [selectedArticleCode, setSelectedArticleCode] = useState<string>('MP-ETH-96');
  const [activeMetricTab, setActiveMetricTab] = useState<'trs' | 'pillars' | 'volume' | 'pareto'>('trs');
  
  // Cost overrun alert state (default 85% of selling price)
  const [costThresholdPct, setCostThresholdPct] = useState<number>(85);
  const [showTopCostAlert, setShowTopCostAlert] = useState<boolean>(true);

  // Check for cost overrun alerts (cost >= threshold % of selling price)
  const articlesWithCostAlert = useMemo(() => {
    const cmds = commandesClients || INITIAL_COMMANDES_CLIENTS;
    const result: { article: Article; ratio: number; coutStd: number; prixVente: number }[] = [];

    articles.filter(a => !a.estComposant).forEach(art => {
      let totalQty = 0;
      let totalCA = 0;
      cmds.forEach(cmd => {
        cmd.lignes.forEach(l => {
          if (l.articleId === art.id) {
            totalQty += l.quantiteCommandee;
            totalCA += (l.quantiteCommandee * l.prixUnitaire);
          }
        });
      });

      const coutStd = art.coutUnitaireStandard ?? art.prixUnitaireEstime ?? 0;
      const prixVente = totalQty > 0 ? (totalCA / totalQty) : (art.prixUnitaireEstime ?? 0);
      const ratio = prixVente > 0 ? (coutStd / prixVente) * 100 : 0;

      if (ratio >= costThresholdPct) {
        result.push({
          article: art,
          ratio,
          coutStd,
          prixVente
        });
      }
    });

    return result;
  }, [articles, commandesClients, costThresholdPct]);

  // Generate historical data anchored to current state
  const { stockHistory, oeeHistory, lossPareto } = useMemo(() => {
    return generate30DaysHistory(articles, oee);
  }, [articles, oee]);

  // Slice based on chosen period (last 7, 14, or 30 days)
  const filteredStockHistory = useMemo(() => {
    return stockHistory.slice(stockHistory.length - period);
  }, [stockHistory, period]);

  const filteredOeeHistory = useMemo(() => {
    return oeeHistory.slice(oeeHistory.length - period);
  }, [oeeHistory, period]);

  // Aggregate KPI computations
  const avgTrs = useMemo(() => {
    const sum = filteredOeeHistory.reduce((acc, p) => acc + p.trsGlobal, 0);
    return (sum / filteredOeeHistory.length).toFixed(1);
  }, [filteredOeeHistory]);

  const avgDispo = useMemo(() => {
    const sum = filteredOeeHistory.reduce((acc, p) => acc + p.disponibilite, 0);
    return (sum / filteredOeeHistory.length).toFixed(1);
  }, [filteredOeeHistory]);

  const avgPerf = useMemo(() => {
    const sum = filteredOeeHistory.reduce((acc, p) => acc + p.performance, 0);
    return (sum / filteredOeeHistory.length).toFixed(1);
  }, [filteredOeeHistory]);

  const avgQual = useMemo(() => {
    const sum = filteredOeeHistory.reduce((acc, p) => acc + p.qualite, 0);
    return (sum / filteredOeeHistory.length).toFixed(1);
  }, [filteredOeeHistory]);

  const totalVolume = useMemo(() => {
    return filteredOeeHistory.reduce((acc, p) => acc + p.volumeProduit, 0);
  }, [filteredOeeHistory]);

  const totalRebuts = useMemo(() => {
    return filteredOeeHistory.reduce((acc, p) => acc + p.rebuts, 0);
  }, [filteredOeeHistory]);

  const globalScrapRate = useMemo(() => {
    return ((totalRebuts / (totalVolume + totalRebuts)) * 100).toFixed(2);
  }, [totalVolume, totalRebuts]);

  // Current selected article metadata
  const selectedArticle = useMemo(() => {
    return articles.find(a => a.code === selectedArticleCode) || articles[0];
  }, [articles, selectedArticleCode]);

  // Latest valuation vs start of period
  const currentValuation = filteredStockHistory[filteredStockHistory.length - 1]?.valeurTotaleStock || 0;
  const startValuation = filteredStockHistory[0]?.valeurTotaleStock || 0;
  const valuationDelta = currentValuation - startValuation;
  const valuationDeltaPct = startValuation > 0 ? ((valuationDelta / startValuation) * 100).toFixed(1) : '0';

  // Custom Tooltips for Recharts
  const CustomOeeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyOeeDataPoint;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-200">{data.label} ({data.date})</span>
            <span className="font-mono text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800">
              {data.ofAssocie}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>TRS Global:</span>
              </span>
              <span className={`font-bold font-mono ${data.trsGlobal >= 85 ? 'text-emerald-400' : data.trsGlobal >= 75 ? 'text-sky-300' : 'text-amber-400'}`}>
                {data.trsGlobal}%
              </span>
            </div>

            <div className="text-[11px] text-slate-400 pl-3 border-l border-slate-800 space-y-0.5">
              <div className="flex justify-between">
                <span>Disponibilité (D):</span>
                <span className="font-mono text-slate-300">{data.disponibilite}%</span>
              </div>
              <div className="flex justify-between">
                <span>Performance (P):</span>
                <span className="font-mono text-slate-300">{data.performance}%</span>
              </div>
              <div className="flex justify-between">
                <span>Qualité (Q):</span>
                <span className="font-mono text-slate-300">{data.qualite}%</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-1.5 text-[11px] text-slate-400 flex justify-between">
              <span>Volume produit / Rebuts:</span>
              <span className="font-mono text-emerald-400">
                {data.volumeProduit.toLocaleString()} U <span className="text-red-400 font-normal">({data.rebuts} reb.)</span>
              </span>
            </div>

            {data.incidentRemarquable && (
              <div className="mt-1 p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-amber-300">
                ⚠️ {data.incidentRemarquable}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomStockTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyStockDataPoint;
      const currentVal = (data as any)[selectedArticleCode];
      const isCritical = selectedArticle && currentVal < selectedArticle.seuilCritique;

      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 min-w-[250px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-200">{data.label} ({data.date})</span>
            <span className="text-[10px] text-slate-400">Stock ERP Théorique</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">{selectedArticle.designation}:</span>
              <span className={`font-mono font-bold text-sm ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                {currentVal?.toLocaleString()} {selectedArticle.uniteMesure}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Seuil critique sécurité:</span>
              <span className="font-mono text-amber-300">{selectedArticle.seuilCritique} {selectedArticle.uniteMesure}</span>
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Valeur globale stock usine:</span>
              <span className="font-mono text-sky-400">{data.valeurTotaleStock.toLocaleString()} DA</span>
            </div>

            {data.entreesVolume > 0 && (
              <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <span>↓ Réception fournisseur ce jour : +{data.entreesVolume} {selectedArticle.uniteMesure}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Analytique & Visualisation de Données (ERP + MES)</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recharts .NET
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trajectoire temporelle des stocks (ERP) et performance de fabrication (MES OEE / TRS) sur les {period} derniers jours.
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Timeframe selector & Filter Category */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="px-2 text-slate-400 flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5" /> Période:
              </span>
              {([7, 14, 30] as PeriodDays[]).map(days => (
                <button
                  key={days}
                  onClick={() => setPeriod(days)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    period === days
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {days} jours
                </button>
              ))}
            </div>

            {/* Category tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(
                [
                  { id: 'all', label: 'Vue Globale' },
                  { id: 'oee', label: 'MES (OEE / TRS)' },
                  { id: 'machines', label: 'Disponibilité Machines' },
                  { id: 'predictions', label: 'Prédictions J+3' },
                  { id: 'stocks', label: 'ERP (Stocks)' },
                  { id: 'costs', label: 'Rentabilité & Coûts' },
                  { id: 'correlation', label: 'Corrélation' }
                ] as { id: ViewCategory; label: string }[]
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.id === 'costs' && articlesWithCostAlert.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/25 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/40 animate-pulse">
                      {articlesWithCostAlert.length} ⚠️
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Architecture C# link badge */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[11px]">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>BladyProduction.Erp.Services.MrpStockService</span>
            </span>
            <span className="text-slate-600">⇄</span>
            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>BladyProduction.Mes.Services.OeeCalculatorService</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Modèle mathématique standard ISA-95 : <span className="text-sky-300 font-mono">TRS = Disponibilité × Performance × Qualité</span>
          </div>
        </div>
      </div>

      {/* TOP NOTIFICATION VISUELLE : ALERTE DÉPASSEMENT SEUIL COÛT DE REVIENT */}
      {articlesWithCostAlert.length > 0 && showTopCostAlert && (
        <div className="rounded-2xl border-2 border-rose-500/70 bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-950 p-4 shadow-xl shadow-rose-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-rose-200 text-sm">
                  🚨 Alerte Rentabilité Industrielle : {articlesWithCostAlert.length} référence(s) dépasse(nt) le seuil de coût critique (≥ {costThresholdPct}% du prix de vente)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-mono text-xs font-bold border border-rose-500/40">
                  Seuil défini : {costThresholdPct}%
                </span>
              </div>
              <p className="text-rose-200/80 text-[11px] leading-relaxed">
                {articlesWithCostAlert.map(a => `${a.article.code} (${a.ratio.toFixed(1)}% du PV • Coût Std ${a.coutStd.toFixed(2)} DA / Vente ${a.prixVente.toFixed(2)} DA)`).join(' | ')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setSelectedCategory('costs')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 shadow-sm"
            >
              <span>Inspecter dans Rentabilité & Coûts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowTopCostAlert(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 text-xs"
              title="Fermer cette alerte"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TRS Moyen */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">TRS Moyen ({period}j)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Cible: 85%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-white">
              {avgTrs}%
            </div>
            <div className="flex items-center text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+1.8%</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>D: {avgDispo}%</span>
            <span>P: {avgPerf}%</span>
            <span>Q: {avgQual}%</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (Number(avgTrs) / 85) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Production Volume */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Volume Total Fabriqué</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Atelier MES
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {totalVolume.toLocaleString()} <span className="text-xs font-normal text-slate-400">unités</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              ~{(totalVolume / period).toFixed(0)} / jour
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rebuts déclarés :</span>
            <span className="font-mono text-red-400">{totalRebuts} U ({globalScrapRate}%)</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.max(5, 100 - Number(globalScrapRate) * 10)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Stock Valuation */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Valeur Actuelle Stocks</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Inventaire ERP
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-white">
              {currentValuation.toLocaleString()} DA
            </div>
            <div className={`flex items-center text-xs font-medium ${Number(valuationDeltaPct) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Number(valuationDeltaPct) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              <span>{valuationDeltaPct}%</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Matières & Emballages :</span>
            <span className="font-mono text-slate-300">~68%</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '74%' }} />
          </div>
        </div>

        {/* Card 4: Critical Alerts & MRP */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Alertes Rupture MRP</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Seuils Critiques
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {articles.filter(a => a.estComposant && a.stockTheorique < a.seuilCritique).length} <span className="text-xs font-normal text-slate-400">composants</span>
            </div>
            <button 
              onClick={onGoToErp}
              className="text-xs text-sky-400 hover:text-sky-300 underline font-medium"
            >
              Gérer dans ERP →
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Éthanol 96% & Glycérol</span>
            <span className="text-amber-300 font-mono text-[10px]">Réappro suggéré</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      {/* SECTION 1: 30-DAY OEE HISTORICAL TREND CHART (RECHARTS) */}
      {(selectedCategory === 'all' || selectedCategory === 'oee' || selectedCategory === 'predictions') && (
        <OeeHistoricalTrend30DaysChart
          oeeHistory={oeeHistory}
          currentOee={oee}
          ordresFabrication={ordresFabrication}
          onGoToMes={onGoToMes}
        />
      )}

      {/* SECTION: MACHINE AVAILABILITY VS DOWNTIME BY MACHINE (RECHARTS) */}
      {(selectedCategory === 'all' || selectedCategory === 'machines' || selectedCategory === 'oee') && (
        <MachineAvailabilityView
          machines={machines}
          interventions={interventions}
          currentOee={oee}
          onGoToMaintenance={onGoToMaintenance}
          onGoToMes={onGoToMes}
        />
      )}

      {/* SECTION 1B: 7-DAY OEE WEEKLY EVOLUTION CHART (RECHARTS) */}
      {(selectedCategory === 'all' || selectedCategory === 'oee' || selectedCategory === 'predictions') && (
        <OeeWeeklyEvolutionChart currentOee={oee} onGoToMes={onGoToMes} />
      )}

      {/* SECTION 1B: 3-DAY PERFORMANCE TREND PREDICTOR (STATISTICAL INFERENCE) */}
      {(selectedCategory === 'all' || selectedCategory === 'oee' || selectedCategory === 'predictions') && (
        <PerformanceTrendPredictor currentOee={oee} />
      )}

      {/* SECTION 2: MES OEE PERFORMANCE GRAPHS */}
      {(selectedCategory === 'all' || selectedCategory === 'oee') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Performance Atelier & Taux de Rendement Synthétique (TRS / OEE)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Historique des indicateurs de la ligne de conditionnement flacons & liquides sur {period} jours.
              </p>
            </div>

            {/* Sub metric tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveMetricTab('trs')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeMetricTab === 'trs'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TRS Global (%)
              </button>
              <button
                onClick={() => setActiveMetricTab('pillars')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeMetricTab === 'pillars'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3 Piliers (D / P / Q)
              </button>
              <button
                onClick={() => setActiveMetricTab('volume')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeMetricTab === 'volume'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Volume & Rebuts
              </button>
              <button
                onClick={() => setActiveMetricTab('pareto')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeMetricTab === 'pareto'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pareto des Arrêts
              </button>
            </div>
          </div>

          {/* Chart View based on activeMetricTab */}
          {activeMetricTab === 'trs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1.5 bg-sky-500 rounded"></span>
                    <span>TRS Global Journalier</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-emerald-400 border-dashed border-t"></span>
                    <span className="text-emerald-400">Objectif Standard (85%)</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-slate-500 border-dotted border-t"></span>
                    <span>Moyenne période ({avgTrs}%)</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Calcul : D × P × Q
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredOeeHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      domain={[50, 100]} 
                      tickLine={false}
                      axisLine={{ stroke: '#475569' }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip content={<CustomOeeTooltip />} />
                    <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Cible 85%', fill: '#10b981', fontSize: 11, position: 'right' }} />
                    <ReferenceLine y={Number(avgTrs)} stroke="#94a3b8" strokeDasharray="2 2" />
                    <Area 
                      type="monotone" 
                      dataKey="trsGlobal" 
                      stroke="#38bdf8" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorTrs)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeMetricTab === 'pillars' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1 bg-sky-400 rounded"></span>
                    <span>Disponibilité (D) : ~{avgDispo}%</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1 bg-amber-400 rounded"></span>
                    <span>Performance (P) : ~{avgPerf}%</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1 bg-emerald-400 rounded"></span>
                    <span>Qualité (Q) : ~{avgQual}%</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Écart type maîtrisé &lt; 2.5%
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredOeeHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} tickLine={false} axisLine={{ stroke: '#475569' }} tickFormatter={(val) => `${val}%`} />
                    <Tooltip content={<CustomOeeTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="disponibilite" name="Disponibilité" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="performance" name="Performance" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="qualite" name="Qualité" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeMetricTab === 'volume' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-2 bg-emerald-500 rounded"></span>
                    <span>Volume Produit Conforme (U)</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-2 bg-red-500 rounded"></span>
                    <span>Rebuts & Purges (U)</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-slate-400 border-dashed border-t"></span>
                    <span>Capacité Nominale Théorique (1000 U/j)</span>
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredOeeHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f87171" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                    <Tooltip content={<CustomOeeTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar yAxisId="left" dataKey="volumeProduit" name="Flacons Produits" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
                    <Bar yAxisId="right" dataKey="rebuts" name="Rebuts Contrôle" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="volumeCible" name="Cible (1000 U)" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeMetricTab === 'pareto' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={lossPareto} 
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v} min`} />
                    <YAxis 
                      type="category" 
                      dataKey="cause" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      width={180}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any, item: any) => [
                        `${value} minutes (${item.payload.pourcentage}%)`, 
                        `Catégorie : ${item.payload.categorie}`
                      ]}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                      {lossPareto.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.couleur} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pareto explanation card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-sky-400 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Analyse des 1 045 minutes d'arrêts</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Le <span className="text-sky-300 font-medium">Nettoyage en Place (NEP)</span> et les <span className="text-sky-300 font-medium">changements de formats de flacons</span> représentent plus de 55% des pertes de disponibilité.
                </p>
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Pertes de Disponibilité :</span>
                    <span className="font-mono text-sky-400 font-bold">67.9%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Pertes de Cadence :</span>
                    <span className="font-mono text-amber-400 font-bold">18.2%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Pertes Qualité & Rebuts :</span>
                    <span className="font-mono text-red-400 font-bold">13.9%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ERP INVENTORY EVOLUTION (Recharts) */}
      {(selectedCategory === 'all' || selectedCategory === 'stocks') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Évolution des Niveaux de Stock & Flux Matières (Module ERP)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Traçabilité des entrées réceptions, consommations backflushing et alertes sur seuils de réapprovisionnement.
              </p>
            </div>

            {/* Article Selector Dropdown */}
            <div className="flex items-center space-x-2">
              <label htmlFor="select-article-graph" className="text-xs text-slate-400">
                Composant / Produit :
              </label>
              <select
                id="select-article-graph"
                value={selectedArticleCode}
                onChange={(e) => setSelectedArticleCode(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                <optgroup label="Matières Premières (Liquides)">
                  <option value="MP-ETH-96">Éthanol Surfin 96% (Cuve C-01)</option>
                  <option value="MP-H2O2-30">Peroxyde Hydrogène 30%</option>
                  <option value="MP-GLY-99">Glycérol Végétal 99.5%</option>
                  <option value="MP-EAU-OSM">Eau Purifiée Déminéralisée</option>
                </optgroup>
                <optgroup label="Produits Finis">
                  <option value="PF-VIR-1000">Solution Virucide 1000ml</option>
                  <option value="PF-SAV-5000">Savon Dermoprotect 5L</option>
                </optgroup>
                <optgroup label="Emballages">
                  <option value="EMB-FLAC-1L">Flacons PEHD 1000ml</option>
                  <option value="EMB-BOUCH-SPRAY">Bouchons Pulvérisateurs Spray</option>
                  <option value="EMB-BID-5L">Bidons Gerbables 5L</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Selected Article Dynamic Metrics Bar */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{selectedArticle.designation}</span>
                  <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                    {selectedArticle.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Emplacement : {selectedArticle.emplacement || 'Entrepôt Central'} • Unité : {selectedArticle.uniteMesure}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-[11px]">
              <div>
                <div className="text-slate-400">Stock Actuel ERP</div>
                <div className={`font-mono font-bold text-sm ${selectedArticle.stockTheorique < selectedArticle.seuilCritique ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedArticle.stockTheorique.toLocaleString()} {selectedArticle.uniteMesure}
                </div>
              </div>

              <div className="border-l border-slate-800 pl-4">
                <div className="text-slate-400">Seuil Critique (Point Commande)</div>
                <div className="font-mono font-bold text-sm text-amber-300">
                  {selectedArticle.seuilCritique.toLocaleString()} {selectedArticle.uniteMesure}
                </div>
              </div>

              <div className="border-l border-slate-800 pl-4">
                <div className="text-slate-400">Délai Fournisseur</div>
                <div className="font-mono text-slate-300">
                  {selectedArticle.delaiLivraisonFournisseurJours} jours ouvrés
                </div>
              </div>

              <div className="border-l border-slate-800 pl-4">
                <div className="text-slate-400">Conditionnement Standard</div>
                <div className="font-mono text-slate-300">
                  +{selectedArticle.quantiteStandardAchat} {selectedArticle.uniteMesure}
                </div>
              </div>
            </div>
          </div>

          {/* Graph 1: Stock Curve with Reference Threshold Line */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-medium text-slate-300">
                Trajectoire du Stock ({selectedArticle.uniteMesure}) sur les {period} derniers jours
              </span>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 bg-emerald-400"></span>
                  <span>Niveau effectif</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 bg-red-400 border-dashed border-t"></span>
                  <span className="text-red-300">Seuil d'Alerte MRP ({selectedArticle.seuilCritique} {selectedArticle.uniteMesure})</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredStockHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#475569' }} />
                  <Tooltip content={<CustomStockTooltip />} />
                  <ReferenceLine 
                    y={selectedArticle.seuilCritique} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ value: `Seuil critique (${selectedArticle.seuilCritique})`, fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedArticleCode} 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorStock)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 2: Stock Flux (Entrées Réceptions vs Sorties Consommations) */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  Flux Entrées (Réceptions BL) vs Sorties (Production MES)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Volume en L/U</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredStockHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="entreesVolume" name="Entrées Réceptions BL" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="sortiesVolume" name="Sorties MES (Consommations)" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 3: Total Stock Valuation (DA) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                  Valorisation Monétaire Globale des Stocks (DA)
                </span>
                <span className="text-[11px] font-mono text-indigo-300">
                  Actuel: {currentValuation.toLocaleString()} DA
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredStockHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k DA`} />
                    <Tooltip 
                      formatter={(v: any) => [`${Number(v).toLocaleString()} DA`, 'Valorisation Stock Totale']}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                    />
                    <Area type="monotone" dataKey="valeurTotaleStock" stroke="#818cf8" strokeWidth={2} fill="url(#colorValuation)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: RENTABILITÉ PRODUITS & CUMUL DES COÛTS DE REVIENT (Coût Standard vs Ventes Réelles) */}
      {(selectedCategory === 'all' || selectedCategory === 'costs') && (
        <ProductCostVsRevenueSection
          articles={articles}
          commandesClients={commandesClients || INITIAL_COMMANDES_CLIENTS}
          costThresholdPct={costThresholdPct}
          onCostThresholdChange={setCostThresholdPct}
          onGoToErp={onGoToErp}
        />
      )}

      {/* SECTION 3: CORRELATION ERP ⇄ MES ARCHITECTURE */}
      {(selectedCategory === 'all' || selectedCategory === 'correlation') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Cohérence Architecturale : Pont Événementiel ERP ⇄ MES
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Démonstration de la synergie entre les modules dans le monolithe modulaire C# (.NET 8/9) de BladyProduction.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-800 flex items-center justify-center text-[10px]">1</span>
                <span>Exécution Atelier (MES)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                L'automate OPC UA transmet la cadence réelle et le statut machine à <code className="text-slate-300 font-mono">ExecutionProductionService</code>. L'OEE est calculé en continu (<code className="text-slate-300 font-mono">OeeCalculatorService.cs</code>).
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px]">2</span>
                <span>Bus Événementiel Kernel</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                À la clôture du lot, <code className="text-indigo-300 font-mono">ProductionRealiseeIntegrationEvent</code> est publié de façon asynchrone sans couplage fort entre les deux modules.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px]">3</span>
                <span>Post-Déduction ERP (MRP)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <code className="text-emerald-300 font-mono">MrpStockService.cs</code> déduit les stocks composants selon la nomenclature et les pertes de fluide (<code className="text-slate-300 font-mono">PourcentagePerteTolerable</code>), puis évalue les seuils critiques.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
            <span>Envie d'examiner le code C# backend de ces calculs ?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onGoToCSharp}
                className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-colors flex items-center gap-1.5"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Ouvrir l'explorateur C# (.NET)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
