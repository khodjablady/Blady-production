import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  Trash2,
  Eye,
  SlidersHorizontal,
  Layers,
  Thermometer,
  Droplets,
  Gauge,
  Sparkles,
  FlaskConical,
  X,
  Check,
  ChevronDown,
  ArrowUpDown,
  FileCheck2,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { 
  ControleQualiteLot, 
  ParametreControle, 
  DecisionQualite, 
  PhaseControleQualite, 
  Article, 
  OrdreFabrication,
  StatutParametre,
  AspectVisuelType
} from '../types';
import { 
  QUALITY_SPEC_TEMPLATES, 
  evaluateParameterStatus 
} from '../data/qualitySpecs';
import { useAuth } from '../context/AuthContext';

interface QualityControlViewProps {
  controles: ControleQualiteLot[];
  articles: Article[];
  ordresFabrication: OrdreFabrication[];
  onSaveControle: (controle: ControleQualiteLot) => void;
  onDeleteControle: (id: string) => void;
}

export const QualityControlView: React.FC<QualityControlViewProps> = ({
  controles,
  articles,
  ordresFabrication,
  onSaveControle,
  onDeleteControle
}) => {
  const { user, profile } = useAuth();

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDecisionFilter, setSelectedDecisionFilter] = useState<DecisionQualite | 'ALL'>('ALL');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<PhaseControleQualite | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingControle, setViewingControle] = useState<ControleQualiteLot | null>(null);
  const [viewingCoa, setViewingCoa] = useState<ControleQualiteLot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Inspection Form State
  const [selectedOfId, setSelectedOfId] = useState<string>('CUSTOM');
  const [customLot, setCustomLot] = useState<string>('');
  const [customOfNum, setCustomOfNum] = useState<string>('');
  const [selectedArticleCode, setSelectedArticleCode] = useState<string>('PF-VIR-1000');
  const [phaseControle, setPhaseControle] = useState<PhaseControleQualite>('FinConditionnement');
  const [inspecteur, setInspecteur] = useState<string>(
    user?.displayName || profile?.displayName || 'Dr. Cécile Moreau (Resp. CQ)'
  );
  const [aspectVisuel, setAspectVisuel] = useState<AspectVisuelType>('Conforme');
  const [remarques, setRemarques] = useState<string>('');
  const [forcedDecision, setForcedDecision] = useState<DecisionQualite | 'AUTO'>('AUTO');

  // Parameters measurements state for the modal
  const [parametersInput, setParametersInput] = useState<ParametreControle[]>(() => {
    const template = QUALITY_SPEC_TEMPLATES['PF-VIR-1000'] || Object.values(QUALITY_SPEC_TEMPLATES)[0];
    return template.parametresDefaut.map(p => ({
      ...p,
      valeurMesuree: p.valeurCible,
      statut: 'Conforme',
      ecartPourcentage: 0
    }));
  });

  // When article changes in modal, reset parameters to standard template
  const handleArticleChange = (code: string) => {
    setSelectedArticleCode(code);
    const template = QUALITY_SPEC_TEMPLATES[code] || Object.values(QUALITY_SPEC_TEMPLATES)[0];
    setParametersInput(
      template.parametresDefaut.map(p => ({
        ...p,
        valeurMesuree: p.valeurCible,
        statut: 'Conforme',
        ecartPourcentage: 0
      }))
    );
  };

  // When OF is selected from dropdown
  const handleOfSelectionChange = (ofIdStr: string) => {
    setSelectedOfId(ofIdStr);
    if (ofIdStr !== 'CUSTOM') {
      const ofItem = ordresFabrication.find(o => String(o.id) === ofIdStr);
      if (ofItem) {
        setCustomLot(ofItem.numeroLotFabrique);
        setCustomOfNum(ofItem.numeroOF);
        const art = articles.find(a => a.id === ofItem.articleId);
        if (art && QUALITY_SPEC_TEMPLATES[art.code]) {
          handleArticleChange(art.code);
        }
      }
    }
  };

  // Update a single parameter value and re-evaluate its conformity
  const handleParameterValueChange = (index: number, rawVal: string) => {
    const val = parseFloat(rawVal) || 0;
    setParametersInput(prev => {
      const updated = [...prev];
      const p = updated[index];
      const evalRes = evaluateParameterStatus(val, p.toleranceMin, p.toleranceMax, p.valeurCible);
      updated[index] = {
        ...p,
        valeurMesuree: val,
        statut: evalRes.statut,
        ecartPourcentage: evalRes.ecartPourcentage
      };
      return updated;
    });
  };

  // Automatic decision computed from parameters
  const computedDecision = useMemo<DecisionQualite>(() => {
    if (forcedDecision !== 'AUTO') return forcedDecision;
    const hasCritical = parametersInput.some(p => p.statut === 'Critique');
    const isVisualBad = aspectVisuel !== 'Conforme';
    if (hasCritical || isVisualBad) {
      return 'EnQuarantaine';
    }
    return 'Conforme';
  }, [parametersInput, aspectVisuel, forcedDecision]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const total = controles.length;
    const conformes = controles.filter(c => c.decision === 'Conforme').length;
    const quarantaines = controles.filter(c => c.decision === 'EnQuarantaine' || c.decision === 'NonConforme').length;
    const derogations = controles.filter(c => c.decision === 'Derogation').length;
    const totalAlerts = controles.reduce((acc, c) => acc + (c.alertesCount || 0), 0);
    const rate = total > 0 ? Number(((conformes / total) * 100).toFixed(1)) : 100;

    return { total, conformes, quarantaines, derogations, totalAlerts, rate };
  }, [controles]);

  // Critical quarantined batches
  const quarantinedBatches = useMemo(() => {
    return controles.filter(c => c.decision === 'EnQuarantaine' || c.decision === 'NonConforme');
  }, [controles]);

  // Filtered List
  const filteredControles = useMemo(() => {
    return controles.filter(c => {
      // Search
      const searchMatch =
        searchTerm.trim() === '' ||
        c.numeroLot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.numeroOF && c.numeroOF.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.articleDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.articleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.inspecteur.toLowerCase().includes(searchTerm.toLowerCase());

      // Decision filter
      const decisionMatch =
        selectedDecisionFilter === 'ALL' || c.decision === selectedDecisionFilter;

      // Phase filter
      const phaseMatch =
        selectedPhaseFilter === 'ALL' || c.phaseControle === selectedPhaseFilter;

      return searchMatch && decisionMatch && phaseMatch;
    });
  }, [controles, searchTerm, selectedDecisionFilter, selectedPhaseFilter]);

  // Submit new inspection
  const handleSubmitNewControle = (e: React.FormEvent) => {
    e.preventDefault();

    const lotFinal = selectedOfId !== 'CUSTOM' ? customLot : (customLot.trim() || `LOT-${Date.now().toString().slice(-6)}`);
    const ofFinal = selectedOfId !== 'CUSTOM' ? customOfNum : (customOfNum.trim() || undefined);
    const art = articles.find(a => a.code === selectedArticleCode) || articles[0];

    const alertesCount = parametersInput.filter(p => p.statut === 'Alerte').length;
    const critiquesCount = parametersInput.filter(p => p.statut === 'Critique').length;
    const isConforme = critiquesCount === 0 && aspectVisuel === 'Conforme';

    const newQc: ControleQualiteLot = {
      id: `QC-${Date.now().toString().slice(-6)}`,
      numeroLot: lotFinal,
      numeroOF: ofFinal,
      articleId: art.id,
      articleCode: art.code,
      articleDesignation: art.designation,
      dateControle: new Date().toISOString(),
      inspecteur: inspecteur.trim() || 'Inspecteur Qualité',
      phaseControle,
      parametres: parametersInput,
      aspectVisuel,
      decision: computedDecision,
      remarques: remarques.trim(),
      conforme: isConforme,
      alertesCount,
      critiquesCount,
      certificatConformiteGenere: isConforme,
      createdBy: user?.uid || 'local-user'
    };

    onSaveControle(newQc);
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* TOP HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Contrôle Qualité & Libération des Lots
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  ISO 9001 / BPF Cosmétique
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Suivi analytique des paramètres critiques (pH, viscosité, densité, titre alcoolique), détection des dérives et génération des Certificats de Conformité (CoA).
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3 self-start lg:self-auto">
            <button
              onClick={() => {
                // Initialize form with first OF if available
                if (ordresFabrication.length > 0) {
                  const firstOf = ordresFabrication[0];
                  setSelectedOfId(String(firstOf.id));
                  setCustomLot(firstOf.numeroLotFabrique);
                  setCustomOfNum(firstOf.numeroOF);
                  const art = articles.find(a => a.id === firstOf.articleId);
                  if (art && QUALITY_SPEC_TEMPLATES[art.code]) {
                    handleArticleChange(art.code);
                  }
                }
                setIsNewModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Contrôle Lot</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Taux Conformité</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{kpis.rate}%</div>
              <div className="text-[10px] text-slate-500 font-mono">{kpis.conformes} / {kpis.total} lots validés</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Lots Contrôlés</div>
              <div className="text-xl font-bold font-mono text-white">{kpis.total}</div>
              <div className="text-[10px] text-slate-500 font-mono">Enregistrements labo</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Alertes Dérives</div>
              <div className="text-xl font-bold font-mono text-amber-400">{kpis.totalAlerts}</div>
              <div className="text-[10px] text-slate-500 font-mono">Paramètres en limite</div>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex items-center space-x-3 ${
            kpis.quarantaines > 0 
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
              : 'bg-slate-950/70 border-slate-800 text-slate-400'
          }`}>
            <div className={`p-2.5 rounded-lg ${
              kpis.quarantaines > 0 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium">En Quarantaine</div>
              <div className={`text-xl font-bold font-mono ${kpis.quarantaines > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {kpis.quarantaines}
              </div>
              <div className="text-[10px] opacity-75 font-mono">
                {kpis.quarantaines > 0 ? 'Expédition bloquée' : 'Zéro non-conformité'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CRITICAL QUARANTINE WARNING BANNER IF ANY BATCH IS BLOCKED */}
      {quarantinedBatches.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/70 via-rose-900/40 to-slate-950 border border-rose-500/60 shadow-lg shadow-rose-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Alerte Qualité Critique • Lot en Quarantaine
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-200 border border-rose-800">
                  {quarantinedBatches.length} lot(s) bloqué(s)
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                Le lot <strong className="text-white underline font-mono">{quarantinedBatches[0].numeroLot}</strong> ({quarantinedBatches[0].articleDesignation}) présente des paramètres hors tolérance. 
                {quarantinedBatches[0].parametres.filter(p => p.statut === 'Critique').map(p => ` [${p.nom}: ${p.valeurMesuree} ${p.unite} (Tolérance: ${p.toleranceMin}-${p.toleranceMax})]`).join(', ')}.
                Le conditionnement et l'expédition sont suspendus.
              </p>
            </div>
          </div>

          <button
            onClick={() => setViewingControle(quarantinedBatches[0])}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950 shrink-0 transition-all"
          >
            Examiner Dérive
          </button>
        </div>
      )}

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher lot, OF, produit, inspecteur..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          
          {/* Decision Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDecisionFilter}
              onChange={(e) => setSelectedDecisionFilter(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Toutes décisions</option>
              <option value="Conforme" className="bg-slate-900">🟢 Conforme (Libéré)</option>
              <option value="EnQuarantaine" className="bg-slate-900">🔴 En Quarantaine</option>
              <option value="NonConforme" className="bg-slate-900">❌ Non Conforme</option>
              <option value="Derogation" className="bg-slate-900">🟡 Dérogation</option>
            </select>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPhaseFilter}
              onChange={(e) => setSelectedPhaseFilter(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Toutes phases</option>
              <option value="CuveMelange" className="bg-slate-900">Cuve de mélange</option>
              <option value="EnCoursFabrication" className="bg-slate-900">En cours conditionnement</option>
              <option value="FinConditionnement" className="bg-slate-900">Fin conditionnement</option>
              <option value="LiberationLot" className="bg-slate-900">Libération finale lot</option>
            </select>
          </div>

        </div>
      </div>

      {/* INSPECTIONS GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredControles.map((ctrl) => {
          const isQuarantined = ctrl.decision === 'EnQuarantaine' || ctrl.decision === 'NonConforme';
          const isConforme = ctrl.decision === 'Conforme';
          const isDerogation = ctrl.decision === 'Derogation';

          const formattedDate = new Date(ctrl.dateControle).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={ctrl.id}
              className={`bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isQuarantined 
                  ? 'border-rose-500/60 shadow-lg shadow-rose-950/20' 
                  : isDerogation
                    ? 'border-amber-500/50'
                    : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-800/80">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-white">{ctrl.numeroLot}</span>
                      {ctrl.numeroOF && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400 font-mono">
                          {ctrl.numeroOF}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mt-1 line-clamp-1">
                      {ctrl.articleDesignation}
                    </div>
                  </div>

                  {/* Decision Badge */}
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${
                    isConforme
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : isQuarantined
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {ctrl.decision === 'Conforme' ? '🟢 Conforme' : ctrl.decision === 'EnQuarantaine' ? '🔴 En Quarantaine' : ctrl.decision === 'NonConforme' ? '❌ Non Conforme' : '🟡 Dérogation'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center space-x-1 truncate max-w-[150px]">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{ctrl.inspecteur.split(' ')[0]} {ctrl.inspecteur.split(' ')[1] || ''}</span>
                  </span>
                </div>
              </div>

              {/* Critical Parameters Visual Gauges */}
              <div className="p-4 space-y-3 bg-slate-950/40 flex-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Paramètres Critiques</span>
                  <span className="text-slate-500">{ctrl.phaseControle}</span>
                </div>

                <div className="space-y-2.5">
                  {ctrl.parametres.map((p) => {
                    const isCrit = p.statut === 'Critique';
                    const isWarn = p.statut === 'Alerte';

                    // Progress percentage within [min, max]
                    const range = p.toleranceMax - p.toleranceMin;
                    const normalized = range > 0 
                      ? Math.min(100, Math.max(0, ((p.valeurMesuree - p.toleranceMin) / range) * 100))
                      : 50;

                    return (
                      <div key={p.id} className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-medium truncate max-w-[170px]">
                            {p.nom}
                          </span>
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className={`font-bold ${
                              isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {p.valeurMesuree} {p.unite}
                            </span>
                            {isCrit && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            )}
                          </div>
                        </div>

                        {/* Visual Range Bar */}
                        <div className="relative w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          {/* Target marker */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" 
                            style={{ left: `${Math.min(95, Math.max(5, ((p.valeurCible - p.toleranceMin) / range) * 100))}%` }}
                            title={`Cible : ${p.valeurCible}`}
                          />
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${normalized}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Min: {p.toleranceMin}</span>
                          <span>Cible: {p.valeurCible}</span>
                          <span>Max: {p.toleranceMax}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {ctrl.remarques && (
                  <div className="mt-3 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic line-clamp-2">
                    "{ctrl.remarques}"
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setViewingControle(ctrl)}
                  className="flex items-center space-x-1.5 text-sky-400 hover:text-sky-300 font-semibold p-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Détails & Mesures</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewingCoa(ctrl)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Voir et imprimer le Certificat d'Analyse (CoA)"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Certificat CoA</span>
                  </button>

                  <button
                    onClick={() => setDeletingId(ctrl.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Supprimer ce contrôle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredControles.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FlaskConical className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Aucun contrôle qualité trouvé</h3>
          <p className="text-xs max-w-sm mx-auto">
            Aucun enregistrement ne correspond à vos critères de recherche.
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1 : NOUVEAU CONTROLE QUALITE PAR LOT                      */}
      {/* ============================================================== */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Enregistrement Contrôle Qualité</h2>
                  <p className="text-xs text-slate-400">Saisie des paramètres critiques et évaluation en direct de la tolérance.</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitNewControle} className="p-6 space-y-6 flex-1">
              
              {/* Section 1 : Rattachement Lot & OF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                
                {/* Select OF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sélection Ordre Fabrication
                  </label>
                  <select
                    value={selectedOfId}
                    onChange={(e) => handleOfSelectionChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CUSTOM">-- Saisie libre sans OF --</option>
                    {ordresFabrication.map(o => (
                      <option key={o.id} value={String(o.id)}>
                        {o.numeroOF} • {o.numeroLotFabrique} ({articles.find(a => a.id === o.articleId)?.designation || 'Article'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Numéro Lot */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    N° de Lot de Fabrication *
                  </label>
                  <input
                    type="text"
                    required
                    value={customLot}
                    onChange={(e) => setCustomLot(e.target.value)}
                    placeholder="ex: LOT-VIR-2609-B2"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Article Référence */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Référence Produit *
                  </label>
                  <select
                    value={selectedArticleCode}
                    onChange={(e) => handleArticleChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="PF-VIR-1000">PF-VIR-1000 • Solution Virucide 1L</option>
                    <option value="PF-SAV-5000">PF-SAV-5000 • Savon Végétal 5L</option>
                  </select>
                </div>

              </div>

              {/* Section 2 : Conditions & Phase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phase de Contrôle
                  </label>
                  <select
                    value={phaseControle}
                    onChange={(e) => setPhaseControle(e.target.value as PhaseControleQualite)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CuveMelange">Cuve de Mélange</option>
                    <option value="EnCoursFabrication">En cours de conditionnement</option>
                    <option value="FinConditionnement">Fin de Conditionnement</option>
                    <option value="LiberationLot">Libération finale de lot (CoA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Inspecteur / Technicien CQ *
                  </label>
                  <input
                    type="text"
                    required
                    value={inspecteur}
                    onChange={(e) => setInspecteur(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Aspect Visuel & Limpidité
                  </label>
                  <select
                    value={aspectVisuel}
                    onChange={(e) => setAspectVisuel(e.target.value as AspectVisuelType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Conforme">Limpide, conforme</option>
                    <option value="ParticulesDetectees">Particules étrangères détectées</option>
                    <option value="TurbiditeAnormale">Turbidité / Voile anormal</option>
                    <option value="CouleurNonConforme">Couleur non conforme</option>
                  </select>
                </div>

              </div>

              {/* Section 3 : Saisie des Paramètres Critiques avec Jauges Interactives */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    <span>Mesures Analytiques & Tolérances Normalisées</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Spécification : {selectedArticleCode}
                  </span>
                </div>

                <div className="space-y-4">
                  {parametersInput.map((p, idx) => {
                    const isCrit = p.statut === 'Critique';
                    const isWarn = p.statut === 'Alerte';

                    const range = p.toleranceMax - p.toleranceMin;
                    const pct = range > 0 ? Math.min(100, Math.max(0, ((p.valeurMesuree - p.toleranceMin) / range) * 100)) : 50;

                    return (
                      <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white">{p.nom}</span>
                            <span className="text-[11px] text-slate-400 ml-2 font-mono">
                              [Tolérance : {p.toleranceMin} à {p.toleranceMax} {p.unite}]
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400 font-semibold">Valeur mesurée :</span>
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                value={p.valeurMesuree}
                                onChange={(e) => handleParameterValueChange(idx, e.target.value)}
                                className={`w-28 text-right font-mono font-bold text-sm px-3 py-1.5 rounded-lg border focus:outline-none ${
                                  isCrit 
                                    ? 'bg-rose-950/80 border-rose-500 text-rose-300' 
                                    : isWarn
                                      ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                                      : 'bg-slate-900 border-slate-700 text-emerald-400'
                                }`}
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-mono w-10">{p.unite}</span>
                          </div>
                        </div>

                        {/* Interactive Visual Gauge Slider */}
                        <div className="pt-1">
                          <div className="relative w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            {/* Target notch */}
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-white z-10"
                              style={{ left: `${Math.min(95, Math.max(5, ((p.valeurCible - p.toleranceMin) / range) * 100))}%` }}
                              title={`Cible idéale : ${p.valeurCible}`}
                            />
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
                            <span>Min: {p.toleranceMin}</span>
                            <span className="text-slate-300 font-semibold">Cible: {p.valeurCible}</span>
                            <span>Max: {p.toleranceMax}</span>
                          </div>
                        </div>

                        {/* Status text alert */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                          <span className={`flex items-center space-x-1.5 font-semibold ${
                            isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {isCrit ? <XCircle className="w-3.5 h-3.5" /> : isWarn ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>
                              {isCrit ? 'HORS TOLÉRANCE' : isWarn ? 'ALERTE LIMITE (Dérive)' : 'CONFORME'}
                            </span>
                          </span>
                          <span className="font-mono text-slate-500">
                            Écart : {p.ecartPourcentage >= 0 ? `+${p.ecartPourcentage}%` : `${p.ecartPourcentage}%`}
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4 : Décision & Remarques */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Décision Qualité Proposée
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Calculée automatiquement en fonction des mesures ou ajustable manuellement.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setForcedDecision('AUTO')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        forcedDecision === 'AUTO'
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Automatique
                    </button>
                    <select
                      value={forcedDecision === 'AUTO' ? computedDecision : forcedDecision}
                      onChange={(e) => setForcedDecision(e.target.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                        computedDecision === 'Conforme'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : 'bg-rose-950 text-rose-300 border-rose-600'
                      }`}
                    >
                      <option value="Conforme">🟢 Conforme (Libération)</option>
                      <option value="EnQuarantaine">🔴 Mise en Quarantaine</option>
                      <option value="NonConforme">❌ Non Conforme (Rejet)</option>
                      <option value="Derogation">🟡 Dérogation Exceptionnelle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Remarques / Actions correctives laboratoire
                  </label>
                  <textarea
                    rows={2}
                    value={remarques}
                    onChange={(e) => setRemarques(e.target.value)}
                    placeholder="Observations sur le lot, réajustements requis, résultats microbiologiques..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 transition-all flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer le Contrôle Qualité</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2 : DETAILS D'UN CONTROLE QUALITE                        */}
      {/* ============================================================== */}
      {viewingControle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-lg text-white">{viewingControle.numeroLot}</span>
                  {viewingControle.numeroOF && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-950 text-sky-400 font-mono border border-slate-800">
                      {viewingControle.numeroOF}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{viewingControle.articleDesignation}</div>
              </div>

              <button
                onClick={() => setViewingControle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Date Contrôle</span>
                <span className="text-white font-mono font-medium">{new Date(viewingControle.dateControle).toLocaleDateString('fr-FR')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Phase</span>
                <span className="text-white font-medium">{viewingControle.phaseControle}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Inspecteur</span>
                <span className="text-white font-medium truncate">{viewingControle.inspecteur}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Décision</span>
                <span className={`font-bold ${viewingControle.decision === 'Conforme' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {viewingControle.decision}
                </span>
              </div>
            </div>

            {/* Parameters Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Paramètre</th>
                    <th className="p-3 text-right">Tolérance</th>
                    <th className="p-3 text-right">Cible</th>
                    <th className="p-3 text-right">Mesure</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {viewingControle.parametres.map(p => (
                    <tr key={p.id}>
                      <td className="p-3 text-white font-sans">{p.nom}</td>
                      <td className="p-3 text-right text-slate-400">{p.toleranceMin} - {p.toleranceMax} {p.unite}</td>
                      <td className="p-3 text-right text-slate-300">{p.valeurCible}</td>
                      <td className={`p-3 text-right font-bold ${
                        p.statut === 'Critique' ? 'text-rose-400' : p.statut === 'Alerte' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {p.valeurMesuree} {p.unite}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.statut === 'Critique'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : p.statut === 'Alerte'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {p.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewingControle.remarques && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Remarques Qualité</span>
                <p className="italic">"{viewingControle.remarques}"</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setViewingCoa(viewingControle);
                  setViewingControle(null);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Ouvrir Certificat d'Analyse (CoA)</span>
              </button>

              <button
                onClick={() => setViewingControle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3 : CERTIFICAT D'ANALYSE (CoA - CERTIFICATE OF ANALYSIS) */}
      {/* ============================================================== */}
      {viewingCoa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 space-y-6">
            
            {/* Header Document */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <div className="text-xl font-black uppercase tracking-tight text-slate-950">
                  BladyProduction Industries
                </div>
                <div className="text-xs text-slate-600">Laboratoire Contrôle Qualité & Assurance Qualité</div>
                <div className="text-[11px] text-slate-500">Parc Industriel Chimique • Site de Fabrication Normandie</div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-900">
                  CERTIFICAT D'ANALYSE (CoA)
                </span>
                <div className="text-[11px] text-slate-500 font-mono mt-1">Document Réf: CoA-{viewingCoa.id}</div>
              </div>
            </div>

            {/* Batch Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Désignation Produit</span>
                <span className="font-bold text-slate-900">{viewingCoa.articleDesignation}</span>
                <span className="text-slate-500 font-mono text-[11px] block mt-0.5">Code: {viewingCoa.articleCode}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Numéro de Lot</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{viewingCoa.numeroLot}</span>
                {viewingCoa.numeroOF && (
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">OF: {viewingCoa.numeroOF}</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Date d'Analyse</span>
                <span className="font-mono font-medium text-slate-800">{new Date(viewingCoa.dateControle).toLocaleDateString('fr-FR')}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Responsable Contrôle</span>
                <span className="font-medium text-slate-800">{viewingCoa.inspecteur}</span>
              </div>
            </div>

            {/* Test Results Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Résultats des Essais Physico-Chimiques
              </h4>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Paramètre</th>
                    <th className="p-2.5">Méthode / Norme</th>
                    <th className="p-2.5 text-right">Spécification</th>
                    <th className="p-2.5 text-right">Résultat Mesuré</th>
                    <th className="p-2.5 text-center">Conformité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {viewingCoa.parametres.map(p => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-sans font-medium text-slate-900">{p.nom}</td>
                      <td className="p-2.5 text-slate-500 text-[10px]">BPF / Pharmacopée</td>
                      <td className="p-2.5 text-right text-slate-600">{p.toleranceMin} - {p.toleranceMax} {p.unite}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{p.valeurMesuree} {p.unite}</td>
                      <td className="p-2.5 text-center font-bold">
                        {p.statut === 'Critique' ? (
                          <span className="text-rose-600">NON CONFORME</span>
                        ) : (
                          <span className="text-emerald-700">CONFORME</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-900">Aspect Visuel & Limpidité</td>
                    <td className="p-2.5 text-slate-500 text-[10px]">Visuel 20°C</td>
                    <td className="p-2.5 text-right text-slate-600">Limpide, sans particule</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{viewingCoa.aspectVisuel}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">
                      {viewingCoa.aspectVisuel === 'Conforme' ? 'CONFORME' : 'NON CONFORME'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verdict statement */}
            <div className={`p-4 rounded-xl border text-xs ${
              viewingCoa.decision === 'Conforme'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="font-bold uppercase tracking-wider text-[11px]">
                Conclusion Qualité Finale :
              </div>
              <p className="mt-1 font-medium leading-relaxed">
                {viewingCoa.decision === 'Conforme'
                  ? `Nous certifions que le lot ${viewingCoa.numeroLot} a été analysé conformément aux méthodes validées et satisfait à toutes les spécifications d'homologation. Le lot est LIBÉRÉ pour mise sur le marché.`
                  : `ATTENTION : Le lot ${viewingCoa.numeroLot} NE RESPECTE PAS l'ensemble des critères analytiques spécifiés. Le lot est MAINTENU EN QUARANTAINE / REJETÉ.`
                }
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs text-slate-600">
              <div>
                <span className="block font-semibold text-slate-800">Technicien Analyste :</span>
                <span className="block font-mono text-[11px] text-slate-500 mt-1">{viewingCoa.inspecteur}</span>
                <div className="h-10 mt-2 border-b border-dashed border-slate-400 flex items-center text-[10px] text-slate-400 italic">
                  [Signature Électronique Validée]
                </div>
              </div>
              <div>
                <span className="block font-semibold text-slate-800">Pharmacien / Responsable Assurance Qualité :</span>
                <span className="block font-mono text-[11px] text-slate-500 mt-1">Dr. Cécile Moreau</span>
                <div className="h-10 mt-2 border-b border-dashed border-slate-400 flex items-center text-[10px] text-slate-400 italic">
                  [Visa Libération Accordé]
                </div>
              </div>
            </div>

            {/* Action buttons (Print) */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Certificat (PDF)</span>
              </button>

              <button
                onClick={() => setViewingCoa(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Supprimer ce contrôle qualité ?</h3>
            </div>
            <p className="text-xs text-slate-400">
              Cette action est irréversible. L'enregistrement analytique du lot sera définitivement effacé du registre.
            </p>
            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteControle(deletingId);
                  setDeletingId(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
