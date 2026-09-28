import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Article, CommandeClient } from '../types';
import { 
  Calculator, 
  TrendingUp, 
  ArrowUpRight, 
  Boxes, 
  FileText, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  BellRing,
  ShieldAlert,
  Flame,
  Filter,
  Eye,
  Info
} from 'lucide-react';

interface ProductCostVsRevenueSectionProps {
  articles: Article[];
  commandesClients: CommandeClient[];
  costThresholdPct?: number;
  onCostThresholdChange?: (threshold: number) => void;
  onGoToErp?: () => void;
}

export const ProductCostVsRevenueSection: React.FC<ProductCostVsRevenueSectionProps> = ({
  articles,
  commandesClients,
  costThresholdPct: initialThreshold = 85,
  onCostThresholdChange,
  onGoToErp
}) => {
  const [displayMode, setDisplayMode] = useState<'cumule' | 'unitaire' | 'commandes'>('cumule');
  const [statusFilter, setStatusFilter] = useState<'all' | 'EnAttente' | 'EnProduction' | 'Expediee'>('all');
  
  // Configurable cost threshold (default: 85%)
  const [costThreshold, setCostThreshold] = useState<number>(initialThreshold);
  const [filterAlertsOnly, setFilterAlertsOnly] = useState<boolean>(false);
  const [isAlertBannerDismissed, setIsAlertBannerDismissed] = useState<boolean>(false);

  const handleThresholdChange = (val: number) => {
    const clamped = Math.max(10, Math.min(100, val));
    setCostThreshold(clamped);
    if (onCostThresholdChange) {
      onCostThresholdChange(clamped);
    }
  };

  // Filter orders by status
  const filteredCommandes = useMemo(() => {
    if (statusFilter === 'all') return commandesClients;
    return commandesClients.filter(c => c.statut === statusFilter);
  }, [commandesClients, statusFilter]);

  // Aggregate profitability data per finished product / article
  const articleProfitability = useMemo(() => {
    // Map to hold aggregated totals
    const map = new Map<number, {
      articleId: number;
      article: Article;
      totalQuantite: number;
      totalChiffreAffaires: number;
      commandesCount: number;
    }>();

    // Iterate through all filtered customer orders and their lines
    filteredCommandes.forEach(cmd => {
      cmd.lignes.forEach(ligne => {
        const art = articles.find(a => a.id === ligne.articleId);
        if (!art) return;

        const current = map.get(ligne.articleId) || {
          articleId: ligne.articleId,
          article: art,
          totalQuantite: 0,
          totalChiffreAffaires: 0,
          commandesCount: 0
        };

        current.totalQuantite += ligne.quantiteCommandee;
        current.totalChiffreAffaires += (ligne.quantiteCommandee * ligne.prixUnitaire);
        current.commandesCount += 1;
        map.set(ligne.articleId, current);
      });
    });

    // Also include finished products with 0 sales for comprehensive coverage
    articles.filter(a => !a.estComposant).forEach(art => {
      if (!map.has(art.id)) {
        map.set(art.id, {
          articleId: art.id,
          article: art,
          totalQuantite: 0,
          totalChiffreAffaires: 0,
          commandesCount: 0
        });
      }
    });

    // Convert map to array with all derived metrics
    return Array.from(map.values()).map(item => {
      const art = item.article;
      const coutStd = art.coutUnitaireStandard ?? art.prixUnitaireEstime ?? 0;
      const prixVenteMoyen = item.totalQuantite > 0 
        ? item.totalChiffreAffaires / item.totalQuantite 
        : (art.prixUnitaireEstime ?? 0);

      const totalCoutRevient = item.totalQuantite * coutStd;
      const margeBruteTotale = item.totalChiffreAffaires - totalCoutRevient;
      const tauxMargePct = item.totalChiffreAffaires > 0 
        ? (margeBruteTotale / item.totalChiffreAffaires) * 100 
        : 0;

      const margeUnitaire = prixVenteMoyen - coutStd;
      const tauxMargeUnitairePct = prixVenteMoyen > 0 ? (margeUnitaire / prixVenteMoyen) * 100 : 0;

      // Ratio of cost to selling price
      const ratioCoutVente = item.totalChiffreAffaires > 0
        ? (totalCoutRevient / item.totalChiffreAffaires) * 100
        : (prixVenteMoyen > 0 ? (coutStd / prixVenteMoyen) * 100 : 0);

      // Does it exceed the defined threshold?
      const isOverThreshold = ratioCoutVente >= costThreshold;
      const depassementPoints = ratioCoutVente - costThreshold;

      return {
        ...item,
        coutUnitaireStandard: coutStd,
        prixVenteMoyen,
        totalCoutRevient,
        margeBruteTotale,
        tauxMargePct,
        margeUnitaire,
        tauxMargeUnitairePct,
        ratioCoutVente,
        isOverThreshold,
        depassementPoints
      };
    }).sort((a, b) => b.totalChiffreAffaires - a.totalChiffreAffaires);
  }, [filteredCommandes, articles, costThreshold]);

  // List of articles exceeding the threshold
  const articlesEnAlerte = useMemo(() => {
    return articleProfitability.filter(item => item.isOverThreshold);
  }, [articleProfitability]);

  // Articles to display in the table based on filter
  const displayedArticles = useMemo(() => {
    if (!filterAlertsOnly) return articleProfitability;
    return articleProfitability.filter(item => item.isOverThreshold);
  }, [articleProfitability, filterAlertsOnly]);

  // Global KPIs across all customer orders
  const globalSummary = useMemo(() => {
    let totalCA = 0;
    let totalCout = 0;
    let totalUnites = 0;

    articleProfitability.forEach(item => {
      totalCA += item.totalChiffreAffaires;
      totalCout += item.totalCoutRevient;
      totalUnites += item.totalQuantite;
    });

    const totalMarge = totalCA - totalCout;
    const tauxMargeGlobal = totalCA > 0 ? (totalMarge / totalCA) * 100 : 0;

    return {
      totalCA,
      totalCout,
      totalMarge,
      tauxMargeGlobal,
      totalUnites
    };
  }, [articleProfitability]);

  // Chart data for Cumulative Mode
  const chartDataCumule = useMemo(() => {
    return articleProfitability
      .filter(item => item.totalQuantite > 0)
      .map(item => ({
        code: item.article.code,
        nom: item.article.designation,
        totalCoutRevient: Math.round(item.totalCoutRevient),
        totalChiffreAffaires: Math.round(item.totalChiffreAffaires),
        margeBruteTotale: Math.round(item.margeBruteTotale),
        tauxMarge: Number(item.tauxMargePct.toFixed(1)),
        quantite: item.totalQuantite,
        isOverThreshold: item.isOverThreshold,
        ratioCoutVente: Number(item.ratioCoutVente.toFixed(1))
      }));
  }, [articleProfitability]);

  // Chart data for Unitary Mode
  const chartDataUnitaire = useMemo(() => {
    return articleProfitability
      .filter(item => item.coutUnitaireStandard > 0 || item.prixVenteMoyen > 0)
      .map(item => ({
        code: item.article.code,
        nom: item.article.designation,
        coutStd: Number(item.coutUnitaireStandard.toFixed(2)),
        prixVente: Number(item.prixVenteMoyen.toFixed(2)),
        margeUnitaire: Number(item.margeUnitaire.toFixed(2)),
        tauxMarge: Number(item.tauxMargeUnitairePct.toFixed(1)),
        isOverThreshold: item.isOverThreshold,
        ratioCoutVente: Number(item.ratioCoutVente.toFixed(1))
      }));
  }, [articleProfitability]);

  // Donut chart data: Contribution to total margin
  const marginPieData = useMemo(() => {
    const valid = articleProfitability.filter(item => item.margeBruteTotale > 0);
    return valid.map(item => ({
      name: item.article.code,
      value: Math.round(item.margeBruteTotale)
    }));
  }, [articleProfitability]);

  const PIE_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899'];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Rentabilité Commerciale & Cumul des Coûts de Revient</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Coût Standard ERP ⇄ Ventes Réelles
                </span>
                {articlesEnAlerte.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{articlesEnAlerte.length} alerte(s) seuil</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rapprochement analytique du Coût Unitaire Standard de fabrication avec les prix de vente effectifs des commandes clients.
              </p>
            </div>
          </div>
        </div>

        {/* View & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="px-2 text-slate-500 text-[11px]">Commandes:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Toutes ({commandesClients.length})
            </button>
            <button
              onClick={() => setStatusFilter('EnProduction')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'EnProduction'
                  ? 'bg-amber-900/60 text-amber-300 shadow-sm border border-amber-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              En Prod
            </button>
            <button
              onClick={() => setStatusFilter('EnAttente')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'EnAttente'
                  ? 'bg-sky-900/60 text-sky-300 shadow-sm border border-sky-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              En Attente
            </button>
            <button
              onClick={() => setStatusFilter('Expediee')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'Expediee'
                  ? 'bg-emerald-900/60 text-emerald-300 shadow-sm border border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expédiées
            </button>
          </div>

          {/* Mode switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDisplayMode('cumule')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                displayMode === 'cumule'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cumul Global (DA)
            </button>
            <button
              onClick={() => setDisplayMode('unitaire')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                displayMode === 'unitaire'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comparatif Unitaire (DA/U)
            </button>
            <button
              onClick={() => setDisplayMode('commandes')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                displayMode === 'commandes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Détail par Commande
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Control Bar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-slate-300 font-medium">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Seuil d'Alerte Coût de Revient :</span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center space-x-1">
            {[60, 70, 80, 85, 90].map(val => (
              <button
                key={val}
                onClick={() => handleThresholdChange(val)}
                className={`px-2 py-0.5 rounded-lg font-mono text-[11px] transition-all ${
                  costThreshold === val
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {val}% {val === 85 && <span className="text-[10px] opacity-75">(Défaut)</span>}
              </button>
            ))}
          </div>

          {/* Slider and number input */}
          <div className="flex items-center space-x-2">
            <input 
              type="range"
              min="50"
              max="95"
              step="1"
              value={costThreshold}
              onChange={e => handleThresholdChange(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5">
              <input
                type="number"
                min="10"
                max="100"
                value={costThreshold}
                onChange={e => handleThresholdChange(Number(e.target.value))}
                className="w-10 bg-transparent text-white font-mono font-bold text-center focus:outline-none"
              />
              <span className="text-slate-400 font-mono">%</span>
            </div>
          </div>
        </div>

        {/* Filter Toggle: All vs Alerts only */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all text-xs font-semibold ${
              filterAlertsOnly 
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-950' 
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Articles en dépassement ({articlesEnAlerte.length})</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION VISUELLE DE DÉPASSEMENT DE SEUIL */}
      {articlesEnAlerte.length > 0 && !isAlertBannerDismissed && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/70 bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-950 p-4 shadow-xl shadow-rose-950/40 animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-200 tracking-tight flex items-center gap-2">
                    <span>ALERTE DE RENTABILITÉ : DÉPASSEMENT DU SEUIL DE COÛT DE REVIENT</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-mono text-xs font-bold border border-rose-500/50">
                    Seuil critique : ≥ {costThreshold}% du Prix de Vente
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed max-w-3xl">
                  Attention : <strong className="text-white font-semibold">{articlesEnAlerte.length} référence(s)</strong> présentent un coût de revient standard unitaire qui absorbe plus de {costThreshold}% du prix de vente effectif des commandes clients. Cela réduit la marge commerciale résiduelle à moins de <strong className="text-white">{(100 - costThreshold).toFixed(0)}%</strong>, exposant l'usine à un risque de perte en cas de fluctuation des prix matières ou de micro-pertes fluides.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => setFilterAlertsOnly(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Isoler les références critiques</span>
              </button>
              <button
                onClick={() => setIsAlertBannerDismissed(true)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded"
                title="Masquer cette bannière"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Cards for each article exceeding threshold */}
          <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-rose-500/20">
            {articlesEnAlerte.map(item => (
              <div 
                key={item.articleId}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/40 text-xs space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {item.article.code}
                  </span>
                  <span className="font-mono font-extrabold text-rose-400 text-xs bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                    Ratio : {item.ratioCoutVente.toFixed(1)}% (+{item.depassementPoints.toFixed(1)} pts)
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 truncate" title={item.article.designation}>
                  {item.article.designation}
                </div>

                {/* Visual Ratio Gauge */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Absorption : {item.ratioCoutVente.toFixed(1)}%</span>
                    <span className="text-rose-400 font-bold">Seuil max : {costThreshold}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.ratioCoutVente)}%` }}
                    />
                    {/* Threshold marker line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
                      style={{ left: `${costThreshold}%` }}
                      title={`Seuil: ${costThreshold}%`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 font-mono">
                  <span className="text-indigo-300">Coût Std : {item.coutUnitaireStandard.toFixed(2)} DA</span>
                  <span className="text-sky-300">Prix Vente : {item.prixVenteMoyen.toFixed(2)} DA</span>
                  <span className="text-amber-400 font-bold">Marge : +{item.margeUnitaire.toFixed(2)} DA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUCCESS BANNER WHEN NO ALERTS EXIST */}
      {articlesEnAlerte.length === 0 && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Seuils de Coûts Maîtrisés :</strong> Aucun article ne dépasse le seuil critique de <strong>{costThreshold}%</strong> du prix de vente. Toutes les marges unitaires sont supérieures à {(100 - costThreshold).toFixed(0)}%.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/80">
            0 / {articleProfitability.length} en alerte
          </span>
        </div>
      )}

      {/* Top Summary Cards (5-grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Chiffre d'Affaires Réel */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Chiffre d'Affaires Réel</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {globalSummary.totalUnites.toLocaleString()} U vendues
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {globalSummary.totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">DA</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Prix moyen :</span>
            <span className="font-mono text-slate-200">
              {globalSummary.totalUnites > 0 ? (globalSummary.totalCA / globalSummary.totalUnites).toFixed(2) : '0.00'} DA / U
            </span>
          </div>
        </div>

        {/* Card 2: Coût de Revient Standard Cumulé */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Coût de Revient Cumulé</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Coût Std Référence
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-300">
            {globalSummary.totalCout.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">DA</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Part du CA :</span>
            <span className="font-mono text-slate-200">
              {globalSummary.totalCA > 0 ? ((globalSummary.totalCout / globalSummary.totalCA) * 100).toFixed(1) : 0}% du CA
            </span>
          </div>
        </div>

        {/* Card 3: Marge Brute Cumulée */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Marge Brute Cumulée</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Bénéfice Brut
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400 flex items-baseline gap-1">
            <span>+{globalSummary.totalMarge.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm font-normal text-slate-400">DA</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Marge unitaire :</span>
            <span className="font-mono text-emerald-400">
              +{globalSummary.totalUnites > 0 ? (globalSummary.totalMarge / globalSummary.totalUnites).toFixed(2) : '0.00'} DA / U
            </span>
          </div>
        </div>

        {/* Card 4: Taux de Marge Global */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Taux Marge Commerciale</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              globalSummary.tauxMargeGlobal >= 30
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {globalSummary.tauxMargeGlobal >= 30 ? 'Rentabilité Saine' : 'Standard'}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{globalSummary.tauxMargeGlobal.toFixed(1)}%</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(5, globalSummary.tauxMargeGlobal))}%` }}
            />
          </div>
        </div>

        {/* Card 5: Surveillance Seuil d'Alerte */}
        <div className={`p-4 rounded-xl border shadow-sm transition-all ${
          articlesEnAlerte.length > 0 
            ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30' 
            : 'bg-slate-950 border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={articlesEnAlerte.length > 0 ? 'text-rose-300 font-semibold' : 'text-slate-400'}>
              Alerte Seuil (≥ {costThreshold}%)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              articlesEnAlerte.length > 0 
                ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50 animate-pulse' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {articlesEnAlerte.length > 0 ? 'Critique' : 'Normal'}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono flex items-baseline gap-2">
            <span className={articlesEnAlerte.length > 0 ? 'text-rose-400 font-extrabold' : 'text-white'}>
              {articlesEnAlerte.length}
            </span>
            <span className="text-xs font-normal text-slate-400">/ {articleProfitability.length} réf.</span>
          </div>
          <div className="mt-1 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Statut :</span>
            <span className={`font-mono font-semibold ${articlesEnAlerte.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {articlesEnAlerte.length > 0 ? 'Dépassement détecté' : 'Conforme'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics View - Charts */}
      {displayMode !== 'commandes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Primary Comparison Chart (2 cols) */}
          <div className="lg:col-span-2 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <BarChart className="w-4 h-4 text-indigo-400" />
                {displayMode === 'cumule' 
                  ? 'Cumul Chiffre d\'Affaires vs Coût de Revient Standard par Article (DA)' 
                  : 'Comparatif Prix de Vente Réel vs Coût Unitaire Standard (DA / Unité)'}
              </span>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="font-mono text-slate-400">
                  {displayMode === 'cumule' ? 'Volumes pondérés' : 'Niveau unitaire'}
                </span>
                {articlesEnAlerte.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] border border-rose-500/30">
                    Seuil {costThreshold}%
                  </span>
                )}
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {displayMode === 'cumule' ? (
                  <BarChart data={chartDataCumule} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k DA`} />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => {
                        const nameStr = String(name || '');
                        const isAlert = props?.payload?.isOverThreshold;
                        const ratio = props?.payload?.ratioCoutVente;
                        const label = nameStr === 'totalChiffreAffaires' 
                          ? 'CA Réel' 
                          : nameStr === 'totalCoutRevient' 
                            ? `Coût Revient Std (Ratio: ${ratio}% ${isAlert ? '🚨 ALERTE' : ''})` 
                            : 'Marge Brute';
                        return [`${Number(value).toLocaleString()} DA`, label];
                      }}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="totalCoutRevient" name="Coût Revient Standard Cumulé (DA)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalChiffreAffaires" name="Chiffre d'Affaires Réel (DA)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="margeBruteTotale" name="Marge Brute Cumulée (DA)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={chartDataUnitaire} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} DA`} />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => {
                        const nameStr = String(name || '');
                        const isAlert = props?.payload?.isOverThreshold;
                        const ratio = props?.payload?.ratioCoutVente;
                        const label = nameStr === 'prixVente' 
                          ? 'Prix Vente Réel' 
                          : nameStr === 'coutStd' 
                            ? `Coût Unitaire Standard (${ratio}% du PV ${isAlert ? '🚨 ALERTE' : ''})` 
                            : 'Marge Unitaire';
                        return [`${Number(value).toFixed(2)} DA / U`, label];
                      }}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="coutStd" name="Coût Unitaire Standard (DA/U)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="prixVente" name="Prix Vente Réel (DA/U)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="margeUnitaire" name="Marge Unitaire (DA/U)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Margin Distribution Pie Chart (1 col) */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Contribution à la Marge Globale</span>
                <span className="text-[11px] font-mono text-emerald-400">+{globalSummary.totalMarge.toLocaleString()} DA</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Répartition des gains bruts par référence de produit fini.
              </p>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marginPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {marginPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => [`${Number(v).toLocaleString()} DA`, 'Marge Brute']}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              {marginPieData.map((item, idx) => {
                const pct = globalSummary.totalMarge > 0 ? ((item.value / globalSummary.totalMarge) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="font-mono text-slate-300 font-semibold">{item.name}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {item.value.toLocaleString()} DA <span className="text-emerald-400 font-bold">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode 1 & 2: Detailed Profitability Table by Article */}
      {displayMode !== 'commandes' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-white">Matrice de Rentabilité & Cumul des Coûts par Référence</span>
              {filterAlertsOnly && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] border border-rose-500/40 font-bold">
                  Vue filtrée : Alertes Seuil Uniquement ({articlesEnAlerte.length})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
              <span>Seuil actif : <strong className="text-indigo-300 font-bold">{costThreshold}%</strong></span>
              <span>•</span>
              <span>{displayedArticles.length} / {articleProfitability.length} références</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Référence / Désignation</th>
                  <th className="p-3 text-right">Volume Commandé</th>
                  <th className="p-3 text-right">Coût Unitaire Std</th>
                  <th className="p-3 text-right">Prix Vente Réel</th>
                  <th className="p-3 text-center">Ratio Coût/Vente (Seuil {costThreshold}%)</th>
                  <th className="p-3 text-right">Marge Unitaire</th>
                  <th className="p-3 text-right">Cumul Coût Revient Std</th>
                  <th className="p-3 text-right">Cumul CA Réel</th>
                  <th className="p-3 text-right">Marge Brute Cumulée</th>
                  <th className="p-3 text-center">Diagnostic & Statut Seuil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {displayedArticles.map(item => {
                  const art = item.article;
                  const isOver = item.isOverThreshold;

                  return (
                    <tr 
                      key={art.id} 
                      className={`transition-colors ${
                        isOver 
                          ? 'bg-rose-950/30 hover:bg-rose-950/40 border-l-4 border-l-rose-500' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          {isOver && (
                            <span className="p-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40" title={`Dépassement de seuil: ${item.ratioCoutVente.toFixed(1)}% ≥ ${costThreshold}%`}>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            </span>
                          )}
                          <span>{art.code}</span>
                          {!art.estComposant && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans border border-emerald-500/30">
                              PF
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[200px]">
                          {art.designation}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-white">
                        {item.totalQuantite.toLocaleString('fr-FR')} {art.uniteMesure}
                      </td>

                      <td className="p-3 text-right font-mono text-indigo-300 font-bold">
                        {item.coutUnitaireStandard.toFixed(4)} DA
                      </td>

                      <td className="p-3 text-right font-mono text-sky-300">
                        {item.prixVenteMoyen > 0 ? `${item.prixVenteMoyen.toFixed(2)} DA` : '—'}
                      </td>

                      {/* Visual Ratio Progress Bar with Threshold Marker */}
                      <td className="p-3 text-center min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className={isOver ? 'text-rose-400 font-extrabold' : 'text-slate-300 font-semibold'}>
                              {item.ratioCoutVente.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (Seuil: {costThreshold}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden relative border border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isOver 
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                                  : item.ratioCoutVente >= 70 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, item.ratioCoutVente))}%` }}
                            />
                            {/* Vertical line indicator at threshold */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-rose-400 shadow"
                              style={{ left: `${costThreshold}%` }}
                              title={`Seuil: ${costThreshold}%`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono">
                        {item.prixVenteMoyen > 0 ? (
                          <span className={item.margeUnitaire >= 0 ? (isOver ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold') : 'text-rose-400 font-bold'}>
                            {item.margeUnitaire >= 0 ? `+${item.margeUnitaire.toFixed(2)}` : item.margeUnitaire.toFixed(2)} DA
                            <span className="text-[10px] ml-1 text-slate-400">({item.tauxMargeUnitairePct.toFixed(1)}%)</span>
                          </span>
                        ) : '—'}
                      </td>

                      <td className="p-3 text-right font-mono text-indigo-200">
                        {item.totalCoutRevient.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                      </td>

                      <td className="p-3 text-right font-mono text-white font-bold">
                        {item.totalChiffreAffaires.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                      </td>

                      <td className="p-3 text-right font-mono font-bold">
                        {item.totalChiffreAffaires > 0 ? (
                          <span className={item.margeBruteTotale >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            +{item.margeBruteTotale.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                          </span>
                        ) : '—'}
                      </td>

                      <td className="p-3 text-center">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>DÉPASSEMENT ({item.ratioCoutVente.toFixed(1)}% ≥ {costThreshold}%)</span>
                          </span>
                        ) : item.totalQuantite === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            Aucune vente
                          </span>
                        ) : item.tauxMargePct >= 35 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Marge Saine ({item.tauxMargePct.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Conforme ({item.tauxMargePct.toFixed(1)}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-950 font-semibold border-t border-slate-700 text-xs">
                <tr>
                  <td className="p-3 text-white font-mono">TOTAL CUMULÉ VENTES</td>
                  <td className="p-3 text-right font-mono text-white font-bold">
                    {globalSummary.totalUnites.toLocaleString('fr-FR')} U
                  </td>
                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">—</td>
                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">—</td>
                  <td className="p-3 text-center font-mono text-slate-300 text-[11px]">
                    Ratio Global : {globalSummary.totalCA > 0 ? ((globalSummary.totalCout / globalSummary.totalCA) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">—</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-300">
                    {globalSummary.totalCout.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sky-400">
                    {globalSummary.totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                    +{globalSummary.totalMarge.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {globalSummary.tauxMargeGlobal.toFixed(1)}% Marge
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Mode 3: Detailed Breakdown by Customer Order */}
      {displayMode === 'commandes' && (
        <div className="space-y-4">
          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Analyse de Rentabilité Contrat par Contrat (Commandes Clients)</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {filteredCommandes.length} commande(s) filtrée(s)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCommandes.map(cmd => {
              // Compute order-level totals
              let cmdCA = 0;
              let cmdCoutStd = 0;

              const lignesDetail = cmd.lignes.map(l => {
                const art = articles.find(a => a.id === l.articleId);
                const coutStd = art?.coutUnitaireStandard ?? art?.prixUnitaireEstime ?? 0;
                const totalLigneCA = l.quantiteCommandee * l.prixUnitaire;
                const totalLigneCout = l.quantiteCommandee * coutStd;
                const margeLigne = totalLigneCA - totalLigneCout;
                const tauxLigne = totalLigneCA > 0 ? (margeLigne / totalLigneCA) * 100 : 0;
                const ratioLigne = totalLigneCA > 0 ? (totalLigneCout / totalLigneCA) * 100 : 0;
                const isLigneOver = ratioLigne >= costThreshold;

                cmdCA += totalLigneCA;
                cmdCoutStd += totalLigneCout;

                return {
                  ...l,
                  article: art,
                  coutStd,
                  totalLigneCA,
                  totalLigneCout,
                  margeLigne,
                  tauxLigne,
                  ratioLigne,
                  isLigneOver
                };
              });

              const cmdMarge = cmdCA - cmdCoutStd;
              const cmdTauxMarge = cmdCA > 0 ? (cmdMarge / cmdCA) * 100 : 0;
              const cmdRatio = cmdCA > 0 ? (cmdCoutStd / cmdCA) * 100 : 0;
              const isCmdOver = cmdRatio >= costThreshold;

              return (
                <div 
                  key={cmd.id} 
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    isCmdOver 
                      ? 'bg-slate-950 border-rose-800/80 shadow-md shadow-rose-950/20' 
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-800 text-sky-300 font-mono font-bold text-xs">
                        {cmd.numeroCommande}
                      </span>
                      <div>
                        <div className="font-semibold text-white text-xs flex items-center gap-2">
                          <span>{cmd.clientNom}</span>
                          {isCmdOver && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Coût ≥ {costThreshold}%
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">Date: {new Date(cmd.dateCommande).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        cmd.statut === 'Expediee'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : cmd.statut === 'EnProduction'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {cmd.statut}
                      </span>

                      <div className="text-right">
                        <div className="text-white font-mono font-bold">{cmdCA.toLocaleString()} DA</div>
                        <div className={`font-mono text-[11px] font-semibold ${isCmdOver ? 'text-amber-400' : 'text-emerald-400'}`}>
                          +{cmdMarge.toLocaleString()} DA ({cmdTauxMarge.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order lines breakdown */}
                  <div className="divide-y divide-slate-800/60 text-xs">
                    {lignesDetail.map(l => (
                      <div 
                        key={l.id} 
                        className={`py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                          l.isLigneOver ? 'bg-rose-950/20 px-2 rounded-lg' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {l.isLigneOver && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                          <span className="font-mono text-sky-300 font-semibold">{l.article?.code}</span>
                          <span className="text-slate-400 text-[11px]">• {l.article?.designation}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
                          <span>Qte: <strong className="text-white">{l.quantiteCommandee} {l.article?.uniteMesure}</strong></span>
                          <span>Coût Std: <strong className="text-indigo-300">{l.coutStd.toFixed(2)} DA</strong></span>
                          <span>Prix Vendu: <strong className="text-sky-300">{l.prixUnitaire.toFixed(2)} DA</strong></span>
                          <span className={l.isLigneOver ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            Ratio: {l.ratioLigne.toFixed(1)}%
                          </span>
                          <span>Total Vente: <span className="text-white font-bold">{l.totalLigneCA.toLocaleString()} DA</span></span>
                          <span className={l.isLigneOver ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold'}>
                            Marge: +{l.margeLigne.toLocaleString()} DA ({l.tauxLigne.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer / ERP Navigation link */}
      {onGoToErp && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pour ajuster le Coût Unitaire Standard d'un article ou modifier une nomenclature BOM :</span>
          </div>
          <button
            onClick={onGoToErp}
            className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 transition-colors self-start sm:self-auto"
          >
            <span>Accéder au module ERP & Fiches Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
