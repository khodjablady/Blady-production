import React, { useState, useMemo } from 'react';
import {
  GitFork,
  Search,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  Boxes,
  Truck,
  Building2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FlaskConical,
  RefreshCw,
  ExternalLink,
  Layers,
  Factory,
  Check,
  AlertOctagon,
  FileCheck2,
  Package,
  Network
} from 'lucide-react';
import { 
  DossierLotTracabilite, 
  LotComposantConsomme, 
  OrdreFabrication, 
  Article,
  ControleQualiteLot
} from '../types';
import { 
  INITIAL_DOSSIERS_TRACABILITE, 
  buildUpwardComponentTraceIndex,
  ComponentTraceIndexItem 
} from '../data/traceabilityData';
import { TraceabilityD3Tree } from './TraceabilityD3Tree';

interface TraceabilityViewProps {
  ordresFabrication: OrdreFabrication[];
  articles: Article[];
  controlesQualite: ControleQualiteLot[];
  onGoToQuality?: () => void;
}

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({
  ordresFabrication,
  articles,
  controlesQualite,
  onGoToQuality
}) => {
  // Navigation mode: 'descending' (Finished -> Components) | 'ascending' (Component -> Finished & Recall) | 'register' (Full matrix)
  const [activeMode, setActiveMode] = useState<'descending' | 'ascending' | 'register'>('descending');
  
  // Layout representation: 'both' | 'tree' (D3) | 'cards'
  const [viewStyle, setViewStyle] = useState<'both' | 'tree' | 'cards'>('both');
  
  // Selected IDs
  const [selectedFinishedLotNumber, setSelectedFinishedLotNumber] = useState<string>('LOT-VIR-2609-A1');
  const [selectedComponentLotNumber, setSelectedComponentLotNumber] = useState<string>('LOT-ETH-2026-08');

  // Search input
  const [searchTerm, setSearchTerm] = useState('');

  // Recall simulation active in Ascending mode
  const [isSimulatingRecall, setIsSimulatingRecall] = useState(false);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Master dossiers state (can be extended with new records)
  const [dossiers] = useState<DossierLotTracabilite[]>(INITIAL_DOSSIERS_TRACABILITE);

  // Upward reverse index of all raw material / packaging lots
  const upwardComponentIndex = useMemo(() => {
    return buildUpwardComponentTraceIndex(dossiers);
  }, [dossiers]);

  // Current selected finished lot dossier
  const currentFinishedLot = useMemo(() => {
    return dossiers.find(d => d.numeroLot === selectedFinishedLotNumber) || dossiers[0];
  }, [dossiers, selectedFinishedLotNumber]);

  // Current selected component trace item
  const currentComponentTrace = useMemo(() => {
    return upwardComponentIndex.find(c => c.numeroLotMatiere === selectedComponentLotNumber) || upwardComponentIndex[0];
  }, [upwardComponentIndex, selectedComponentLotNumber]);

  // Associated Quality Control record if available
  const associatedQc = useMemo(() => {
    if (!currentFinishedLot) return null;
    return controlesQualite.find(q => q.numeroLot === currentFinishedLot.numeroLot);
  }, [controlesQualite, currentFinishedLot]);

  // Search suggestions: list of all lot numbers (finished + components) matching search
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();

    const finishedMatches = dossiers
      .filter(d => 
        d.numeroLot.toLowerCase().includes(term) ||
        d.articleDesignation.toLowerCase().includes(term) ||
        (d.numeroOF && d.numeroOF.toLowerCase().includes(term))
      )
      .map(d => ({
        lotNumber: d.numeroLot,
        type: 'finished' as const,
        label: `${d.numeroLot} (${d.articleDesignation})`,
        subLabel: `OF : ${d.numeroOF || 'N/A'} • ${d.volumeProduit} ${d.uniteMesure}`
      }));

    const componentMatches = upwardComponentIndex
      .filter(c =>
        c.numeroLotMatiere.toLowerCase().includes(term) ||
        c.articleDesignation.toLowerCase().includes(term) ||
        c.fournisseurNom.toLowerCase().includes(term)
      )
      .map(c => ({
        lotNumber: c.numeroLotMatiere,
        type: 'component' as const,
        label: `${c.numeroLotMatiere} (${c.articleDesignation})`,
        subLabel: `Fournisseur : ${c.fournisseurNom} • BL : ${c.numeroBL}`
      }));

    return [...finishedMatches, ...componentMatches];
  }, [searchTerm, dossiers, upwardComponentIndex]);

  // Handler to navigate directly from component card to Ascending View
  const handleJumpToAscending = (componentLotNum: string) => {
    setSelectedComponentLotNumber(componentLotNum);
    setActiveMode('ascending');
  };

  // Handler to navigate directly from impact list to Descending View
  const handleJumpToDescending = (finishedLotNum: string) => {
    setSelectedFinishedLotNumber(finishedLotNum);
    setActiveMode('descending');
  };

  return (
    <div className="space-y-6">

      {/* TOP HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <GitFork className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Traçabilité Bidirectionnelle & Généalogie des Lots
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  ISA-88 / BPF Annexe 11
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Arborescence ascendante et descendante : généalogie des matières incorporées, rapprochement des lots fournisseurs, et simulation d'impact de rappel de lot client.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2.5 self-start lg:self-auto">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Générer et imprimer le dossier de lot complet (Audit)"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Dossier de Lot (PDF)</span>
            </button>

            {onGoToQuality && (
              <button
                onClick={onGoToQuality}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 transition-colors"
              >
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Contrôles CQ</span>
              </button>
            )}
          </div>
        </div>

        {/* MODE SELECTOR SEGMENTED CONTROL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-800">
          
          <button
            onClick={() => setActiveMode('descending')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
              activeMode === 'descending'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-950'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <div className="text-left">
              <div>Traçabilité Descendante</div>
              <div className="text-[10px] font-normal opacity-80">Lot Fini → Matières & Composants</div>
            </div>
          </button>

          <button
            onClick={() => setActiveMode('ascending')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
              activeMode === 'ascending'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-950'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <div className="text-left">
              <div>Traçabilité Ascendante</div>
              <div className="text-[10px] font-normal opacity-80">Composant → Lots Finis & Rappel</div>
            </div>
          </button>

          <button
            onClick={() => setActiveMode('register')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
              activeMode === 'register'
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-950'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-950'
            }`}
          >
            <Layers className="w-4 h-4" />
            <div className="text-left">
              <div>Matrice Complète d'Audit</div>
              <div className="text-[10px] font-normal opacity-80">Registre BPF de tous les lots</div>
            </div>
          </button>

        </div>
      </div>

      {/* QUICK BATCH SELECTOR & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Universal Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par n° de lot (fini ou matière), OF, client..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Direct Lot Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
            <span className="text-[11px] text-slate-500 whitespace-nowrap">Lots récents :</span>
            
            {activeMode === 'descending' ? (
              dossiers.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedFinishedLotNumber(d.numeroLot)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors border ${
                    selectedFinishedLotNumber === d.numeroLot
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : d.statutLot === 'EnQuarantaine'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/60'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {d.numeroLot}
                </button>
              ))
            ) : (
              upwardComponentIndex.slice(0, 4).map(c => (
                <button
                  key={c.numeroLotMatiere}
                  onClick={() => setSelectedComponentLotNumber(c.numeroLotMatiere)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors border ${
                    selectedComponentLotNumber === c.numeroLotMatiere
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {c.numeroLotMatiere}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown if search is non-empty */}
        {searchResults.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1 divide-y divide-slate-800/60 animate-in fade-in">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.type === 'finished') {
                    setSelectedFinishedLotNumber(item.lotNumber);
                    setActiveMode('descending');
                  } else {
                    setSelectedComponentLotNumber(item.lotNumber);
                    setActiveMode('ascending');
                  }
                  setSearchTerm('');
                }}
                className="pt-1.5 first:pt-0 p-2 rounded-lg hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-white">{item.label}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      item.type === 'finished' ? 'bg-indigo-950 text-indigo-300' : 'bg-purple-950 text-purple-300'
                    }`}>
                      {item.type === 'finished' ? 'Lot Fini' : 'Lot Matière'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{item.subLabel}</div>
                </div>
                <ArrowRightAlt className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        )}

        {/* View Style Switcher (D3 Tree vs Detailed Cards vs Both) */}
        {activeMode !== 'register' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800/80 gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <Network className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-300">Mode de Visualisation Graphique :</span>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1 self-start sm:self-auto">
              <button
                onClick={() => setViewStyle('both')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewStyle === 'both'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vue Combinée (Arbre D3 + Cartes)
              </button>
              <button
                onClick={() => setViewStyle('tree')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewStyle === 'tree'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Arbre D3.js Uniquement
              </button>
              <button
                onClick={() => setViewStyle('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewStyle === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cartes Nomenclatures Seules
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODE 1 : TRAÇABILITÉ DESCENDANTE (LOT FINI -> COMPOSANTS)      */}
      {/* ============================================================== */}
      {activeMode === 'descending' && currentFinishedLot && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Identity Card of the Finished Batch */}
          <div className={`bg-slate-900 rounded-2xl border p-6 shadow-sm ${
            currentFinishedLot.statutLot === 'EnQuarantaine'
              ? 'border-rose-500/60 shadow-lg shadow-rose-950/20'
              : 'border-slate-800'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Dossier de Lot Produit Fini</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                    currentFinishedLot.statutLot === 'Libere'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : currentFinishedLot.statutLot === 'EnQuarantaine'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {currentFinishedLot.statutLot === 'Libere' ? '🟢 Lot Libéré' : currentFinishedLot.statutLot === 'EnQuarantaine' ? '🔴 En Quarantaine' : '🟡 En Fabrication'}
                  </span>
                </div>
                <div className="flex items-baseline space-x-3 mt-1">
                  <h2 className="text-2xl font-bold font-mono text-white">{currentFinishedLot.numeroLot}</h2>
                  <span className="text-sm font-semibold text-sky-400">{currentFinishedLot.articleDesignation}</span>
                </div>
              </div>

              {/* Manufacturing Key Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Ordre Fabrication</span>
                  <span className="text-white font-mono font-bold">{currentFinishedLot.numeroOF}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Volume Fabriqué</span>
                  <span className="text-emerald-400 font-mono font-bold">{currentFinishedLot.volumeProduit} {currentFinishedLot.uniteMesure}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Date Fabrication</span>
                  <span className="text-white font-mono">{new Date(currentFinishedLot.dateFabrication).toLocaleDateString('fr-FR')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Péremption (EXP)</span>
                  <span className="text-slate-300 font-mono">{currentFinishedLot.datePeremption ? new Date(currentFinishedLot.datePeremption).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </div>
              </div>

            </div>

            {/* Sub-header details: Equipment, Operator, Quality Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-xs text-slate-300">
              
              <div className="flex items-start space-x-2.5">
                <Factory className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Équipements de production :</span>
                  <span className="font-semibold text-white">{currentFinishedLot.ligneFabricationNom}</span>
                  <div className="text-[11px] text-slate-400">{currentFinishedLot.cuveFormulationNom}</div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <User className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Opérateur de fabrication :</span>
                  <span className="font-semibold text-white">{currentFinishedLot.operateur}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Contrôle Qualité & Libération :</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${
                      currentFinishedLot.decisionQualite === 'Conforme' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {currentFinishedLot.decisionQualite}
                    </span>
                    {associatedQc && (
                      <span className="text-[11px] text-slate-400 font-mono">({associatedQc.id})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{currentFinishedLot.remarquesAudit}</div>
                </div>
              </div>

            </div>
          </div>

          {/* D3.JS DYNAMIC DEPENDENCY TREE (DESCENTE) */}
          {(viewStyle === 'both' || viewStyle === 'tree') && (
            <div className="space-y-2">
              <TraceabilityD3Tree
                mode="descending"
                finishedLot={currentFinishedLot}
                onSelectComponent={handleJumpToAscending}
                onSelectFinishedLot={handleJumpToDescending}
              />
            </div>
          )}

          {/* VISUAL GENEALOGY TREE / COMPONENT BREAKDOWN (CARDS VIEW) */}
          {(viewStyle === 'both' || viewStyle === 'cards') && (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Boxes className="w-5 h-5 text-indigo-400" />
                      <span>Détail des Matières & Emballages Incorporés (Fiches Nomenclatures)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nomenclatures réelles consommées, rapprochement des lots fournisseurs et bilans matières avec pourcentages d'écarts.
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    {currentFinishedLot.composantsConsommes.length} composants tracés
                  </span>
                </div>

                {/* Tree Flow: Intermediate Bulk Step -> Detailed Raw Materials Cards */}
                <div className="space-y-4">
                  
                  {/* Intermediate formulation bulk step */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold font-mono">
                        M1
                      </div>
                      <div>
                        <span className="font-bold text-indigo-200">Formulation & Mélange Réacteur Vrac</span>
                        <div className="text-[11px] text-indigo-300/80">
                          Effectué dans {currentFinishedLot.cuveFormulationNom} • Pression 1.02 bar • Vitesse agitation 250 RPM
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Mélange Homogène Validé
                    </span>
                  </div>

                  {/* Cards Grid of Consumed Components */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentFinishedLot.composantsConsommes.map((comp, idx) => {
                      const isDeviation = Math.abs(comp.ecartPourcent) > 1.5;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
                        >
                          <div>
                            {/* Component Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-slate-500 block">
                                  {comp.composantCode} • {comp.typeComposant}
                                </span>
                                <span className="font-bold text-white text-xs line-clamp-1">
                                  {comp.composantDesignation}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                {comp.statutConformiteMatiere}
                              </span>
                            </div>

                            {/* Batch Number & Supplier */}
                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 mt-3 text-xs">
                              <div className="flex justify-between items-baseline">
                                <span className="text-[11px] text-slate-400">Lot Fournisseur :</span>
                                <span className="font-mono font-bold text-indigo-300">{comp.numeroLotFournisseurOuInterne}</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-[11px] text-slate-400">Fournisseur :</span>
                                <span className="font-medium text-slate-300 truncate max-w-[130px]">{comp.fournisseurNom}</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-[11px] text-slate-400">Bon Réception :</span>
                                <span className="font-mono text-slate-400 text-[10px]">{comp.numeroBL}</span>
                              </div>
                            </div>

                            {/* Quantities & Loss deviation */}
                            <div className="mt-3 space-y-1 text-xs font-mono">
                              <div className="flex justify-between text-slate-300">
                                <span className="text-slate-500 font-sans">Quantité dosée :</span>
                                <span className="font-bold text-white">{comp.quantiteConsommee} {comp.unite}</span>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span className="text-slate-500 font-sans">Théorique / Écart :</span>
                                <span className={isDeviation ? 'text-amber-400' : 'text-slate-400'}>
                                  {comp.quantiteTheorique} {comp.unite} ({comp.ecartPourcent >= 0 ? `+${comp.ecartPourcent}%` : `${comp.ecartPourcent}%`})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Jump to Ascending Traceability Button */}
                          <button
                            onClick={() => handleJumpToAscending(comp.numeroLotFournisseurOuInterne)}
                            className="w-full mt-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-indigo-950 text-indigo-300 border border-slate-800 hover:border-indigo-700 transition-colors flex items-center justify-center space-x-1.5"
                            title="Voir tous les autres lots fabriqués avec cette matière"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Traçabilité Ascendante de ce lot</span>
                          </button>

                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* EXPEDITIONS & CLIENT DELIVERIES SECTION */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-sky-400" />
                  <span>Expéditions & Commandes Clientes Livrées</span>
                </h3>

                {currentFinishedLot.expeditionsClients.length > 0 ? (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-3">Client Destinataire</th>
                          <th className="p-3">N° Commande</th>
                          <th className="p-3">Bon Livraison (BL)</th>
                          <th className="p-3 text-right">Quantité Livrée</th>
                          <th className="p-3">Date Expédition</th>
                          <th className="p-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono">
                        {currentFinishedLot.expeditionsClients.map((exp, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-3 font-sans font-bold text-white">{exp.clientNom}</td>
                            <td className="p-3 text-sky-400">{exp.numeroCommande}</td>
                            <td className="p-3 text-slate-400">{exp.bonLivraisonRef}</td>
                            <td className="p-3 text-right font-bold text-emerald-400">{exp.quantiteExpediee} {currentFinishedLot.uniteMesure}</td>
                            <td className="p-3 text-slate-400">{new Date(exp.dateExpedition).toLocaleDateString('fr-FR')}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                {exp.statutExpedition}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    {currentFinishedLot.statutLot === 'EnQuarantaine' 
                      ? '🔒 Aucune expédition autorisée : Le lot est sous séquestre qualité.'
                      : 'Ce lot est actuellement stocké en magasin central (aucune expédition client enregistrée).'}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2 : TRAÇABILITÉ ASCENDANTE (COMPOSANT -> LOTS FINIS)      */}
      {/* ============================================================== */}
      {activeMode === 'ascending' && currentComponentTrace && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Identity Card of the Raw Material / Packaging Batch */}
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-purple-400">Matière Première / Composant Source</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    Traçabilité Ascendante
                  </span>
                </div>
                <div className="flex items-baseline space-x-3 mt-1">
                  <h2 className="text-2xl font-bold font-mono text-white">{currentComponentTrace.numeroLotMatiere}</h2>
                  <span className="text-sm font-semibold text-slate-300">{currentComponentTrace.articleDesignation}</span>
                </div>
              </div>

              {/* Reception info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Fournisseur</span>
                  <span className="text-white font-medium truncate block max-w-[140px]">{currentComponentTrace.fournisseurNom}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">N° Bon Réception</span>
                  <span className="text-sky-400 font-mono font-bold">{currentComponentTrace.numeroBL}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Date Entrée Magasin</span>
                  <span className="text-slate-300 font-mono">{new Date(currentComponentTrace.dateReception).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

            </div>

            {/* Quick stats on affected batches */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Lots Finis Fabriqués</span>
                <span className="text-xl font-bold font-mono text-white">
                  {currentComponentTrace.lotsProduitsFinisImpactes.length} lots
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Quantité Consommée</span>
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {currentComponentTrace.lotsProduitsFinisImpactes.reduce((acc, l) => acc + l.quantiteConsommee, 0)} {currentComponentTrace.lotsProduitsFinisImpactes[0]?.unite}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Flacons / Unités Produits</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {currentComponentTrace.lotsProduitsFinisImpactes.reduce((acc, l) => acc + l.volumeTotalProduit, 0)} U
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Clients Destinataires</span>
                <span className="text-xl font-bold font-mono text-sky-400">
                  {currentComponentTrace.lotsProduitsFinisImpactes.flatMap(l => l.expeditions).length} clients
                </span>
              </div>
            </div>
          </div>

          {/* SIMULATEUR D'URGENCE : RAPPEL DE LOT (BATCH RECALL CONTAINMENT) */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Simulateur de Périmètre de Rappel de Lot (Procédure d'Urgence)
                  </h3>
                  <p className="text-xs text-slate-400">
                    En cas de contamination ou défaut signalé sur ce composant, identifie instantanément les clients à notifier et les stocks à bloquer.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSimulatingRecall(!isSimulatingRecall)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isSimulatingRecall
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isSimulatingRecall ? 'Désactiver Simulation' : 'Simuler Rappel d\'Urgence'}</span>
              </button>
            </div>

            {isSimulatingRecall && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/60 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-2 text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>PLAN DE SÉQUESTRATION ET RAPPEL ACTIVÉ</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Le lot matière <strong className="text-white font-mono">{currentComponentTrace.numeroLotMatiere}</strong> a été incorporé dans <strong className="text-white font-mono">{currentComponentTrace.lotsProduitsFinisImpactes.length} lots de produits finis</strong>.
                  Les commandes en cours doivent être suspendues et les clients ci-dessous contactés pour blocage de sécurité.
                </p>
              </div>
            )}
          </div>

          {/* D3.JS DYNAMIC DEPENDENCY TREE (ASCENDANTE / IMPACT) */}
          {(viewStyle === 'both' || viewStyle === 'tree') && (
            <div className="space-y-2">
              <TraceabilityD3Tree
                mode="ascending"
                componentTrace={currentComponentTrace}
                onSelectComponent={handleJumpToAscending}
                onSelectFinishedLot={handleJumpToDescending}
              />
            </div>
          )}

          {/* LIST OF FINISHED PRODUCT BATCHES INCORPORATING THIS COMPONENT (CARDS VIEW) */}
          {(viewStyle === 'both' || viewStyle === 'cards') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-purple-400" />
                <span>Lots de Produits Finis Ayant Incorporé ce Composant</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentComponentTrace.lotsProduitsFinisImpactes.map((finished, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-white">{finished.numeroLotFini}</span>
                            <span className="text-[10px] font-mono text-sky-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {finished.numeroOF}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-300 mt-1">
                            {finished.articleDesignation}
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          finished.statutLotFini === 'Libere'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : finished.statutLotFini === 'EnQuarantaine'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {finished.statutLotFini}
                        </span>
                      </div>

                      <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs space-y-1 font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-sans">Quantité de matière dosée :</span>
                          <span className="text-white font-bold">{finished.quantiteConsommee} {finished.unite}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="font-sans">Volume total du lot produit :</span>
                          <span className="text-emerald-400 font-bold">{finished.volumeTotalProduit} U</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="font-sans">Date de fabrication :</span>
                          <span className="text-slate-300">{new Date(finished.dateFabrication).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {/* Shipments breakdown */}
                      <div className="mt-3 text-xs space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Clients expédiés :</span>
                        {finished.expeditions.length > 0 ? (
                          finished.expeditions.map((e, ei) => (
                            <div key={ei} className="flex justify-between text-[11px] text-slate-300">
                              <span className="truncate max-w-[200px]">• {e.clientNom}</span>
                              <span className="font-mono font-bold text-sky-400">{e.quantiteExpediee} U</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Aucune expédition (encore en stock usine)</span>
                        )}
                      </div>
                    </div>

                    {/* Jump button to Finished Batch view */}
                    <button
                      onClick={() => handleJumpToDescending(finished.numeroLotFini)}
                      className="w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <span>Ouvrir Fiche Complète du Lot Fini</span>
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3 : MATRICE COMPLETE DE REGISTRE BPF                      */}
      {/* ============================================================== */}
      {activeMode === 'register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>Registre Global de Traçabilité Industrielle (Audit BPF)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tableau synoptique de concordance liant les matières premières d'entrée, les ordres de fabrication et les lots finis expédiés.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Lot Fini</th>
                  <th className="p-3">Produit</th>
                  <th className="p-3">OF</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Composants Incorporés</th>
                  <th className="p-3">Lots Matières Fournisseurs</th>
                  <th className="p-3 text-center">Statut Lot</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {dossiers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-white">{d.numeroLot}</td>
                    <td className="p-3 text-slate-200">{d.articleDesignation}</td>
                    <td className="p-3 font-mono text-sky-400">{d.numeroOF}</td>
                    <td className="p-3 font-mono text-slate-400">{new Date(d.dateFabrication).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-slate-300">{d.composantsConsommes.length} composants</td>
                    <td className="p-3 font-mono text-[11px] text-indigo-300">
                      {d.composantsConsommes.slice(0, 3).map(c => c.numeroLotFournisseurOuInterne).join(', ')}
                      {d.composantsConsommes.length > 3 ? '...' : ''}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.statutLot === 'Libere'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : d.statutLot === 'EnQuarantaine'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {d.statutLot}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedFinishedLotNumber(d.numeroLot);
                          setActiveMode('descending');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold p-1"
                      >
                        Inspecter →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL : DOSSIER DE LOT IMPRIMABLE (AUDIT BPF / PDF)             */}
      {/* ============================================================== */}
      {isPrintModalOpen && currentFinishedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Dossier de Lot & Généalogie Officielle (Format Audit)</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-lg space-y-6 text-xs font-sans print:p-0">
              
              {/* Sheet Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">BladyProduction • MonUsine ERP/MES</h1>
                  <p className="text-xs text-slate-600 font-mono">Dossier de Fabrication & Fiche de Généalogie de Lot (ISA-88 / BPF)</p>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div>Date d'émission : {new Date().toLocaleDateString('fr-FR')}</div>
                  <div className="font-bold text-slate-900">REF : DOS-LOT-{currentFinishedLot.numeroLot}</div>
                </div>
              </div>

              {/* Identification Block */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Lot de Produit Fini</span>
                  <span className="text-base font-bold font-mono text-slate-900">{currentFinishedLot.numeroLot}</span>
                  <div className="font-medium text-slate-700 mt-1">{currentFinishedLot.articleDesignation} ({currentFinishedLot.articleCode})</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Paramètres de fabrication</span>
                  <div>Ordre de Fabrication : <strong className="font-mono">{currentFinishedLot.numeroOF}</strong></div>
                  <div>Volume Produit : <strong>{currentFinishedLot.volumeProduit} {currentFinishedLot.uniteMesure}</strong></div>
                  <div>Ligne : <strong>{currentFinishedLot.ligneFabricationNom}</strong></div>
                  <div>Opérateur : <strong>{currentFinishedLot.operateur}</strong></div>
                </div>
              </div>

              {/* Table of Incorporated Raw Materials */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-xs tracking-wider border-b border-slate-300 pb-1">
                  1. Rapprochement des Matières Premières & Emballages Incorporés
                </h3>
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-200 text-slate-700 font-mono text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Composant</th>
                      <th className="p-2 border-r border-slate-300">Lot Fournisseur</th>
                      <th className="p-2 border-r border-slate-300">Fournisseur</th>
                      <th className="p-2 border-r border-slate-300">N° BL</th>
                      <th className="p-2 border-r border-slate-300 text-right">Dosé</th>
                      <th className="p-2 text-center">Conformité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentFinishedLot.composantsConsommes.map((c, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium border-r border-slate-200">{c.composantDesignation}</td>
                        <td className="p-2 font-mono font-bold border-r border-slate-200">{c.numeroLotFournisseurOuInterne}</td>
                        <td className="p-2 border-r border-slate-200">{c.fournisseurNom}</td>
                        <td className="p-2 font-mono border-r border-slate-200">{c.numeroBL}</td>
                        <td className="p-2 font-mono text-right border-r border-slate-200">{c.quantiteConsommee} {c.unite}</td>
                        <td className="p-2 text-center font-bold text-emerald-700">{c.statutConformiteMatiere}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quality & Release Block */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-xs tracking-wider border-b border-slate-300 pb-1">
                  2. Décision de Libération Qualité
                </h3>
                <div className="p-3 border border-slate-300 rounded-lg flex justify-between items-center">
                  <div>
                    <div>Verdict Qualité : <strong className="uppercase">{currentFinishedLot.decisionQualite}</strong></div>
                    <div className="text-slate-600 text-[10px]">Observations : {currentFinishedLot.remarquesAudit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">Visa Assurance Qualité (Dr. Moreau)</div>
                    <div className="text-[10px] text-slate-500">Signature électronique certifiée BPF</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

function ArrowRightAlt(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
