import React, { useState } from 'react';
import { 
  Layers, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Gauge, 
  Sliders, 
  PackageCheck, 
  GitFork, 
  Search,
  UserCheck,
  RotateCw,
  PlusCircle,
  FileCheck,
  FlaskConical,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { OrdreFabrication, Article, MachineLigne, OeeMetrics } from '../types';

interface MesViewProps {
  ordresFabrication: OrdreFabrication[];
  articles: Article[];
  machines: MachineLigne[];
  oee: OeeMetrics;
  onUpdateOee: (newOee: OeeMetrics) => void;
  onOpenDeclareModal: (of?: OrdreFabrication) => void;
  onChangerStatutOf: (ofId: number, nouveauStatut: OrdreFabrication['statut']) => void;
  onCreerOf: () => void;
  onGoToQuality?: (ofItem?: OrdreFabrication) => void;
  onGoToTraceability?: (lotNumber?: string) => void;
  onGoToConnectivity?: () => void;
}

export const MesView: React.FC<MesViewProps> = ({
  ordresFabrication,
  articles,
  machines,
  oee,
  onUpdateOee,
  onOpenDeclareModal,
  onChangerStatutOf,
  onCreerOf,
  onGoToQuality,
  onGoToTraceability,
  onGoToConnectivity
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'of' | 'declaration' | 'trs' | 'tracabilite'>('of');
  const [selectedLotForTrace, setSelectedLotForTrace] = useState<string>('LOT-VIR-2609-A1');

  // Interactive TRS simulation controls
  const [tempsArret, setTempsArret] = useState<number>(oee.tempsArretMin);
  const [cadenceReelle, setCadenceReelle] = useState<number>(920);
  const [rebutsCount, setRebutsCount] = useState<number>(oee.piecesRebuts);

  const recalculateInteractiveTrs = (newArret: number, newCadence: number, newRebuts: number) => {
    setTempsArret(newArret);
    setCadenceReelle(newCadence);
    setRebutsCount(newRebuts);

    const tempsOuverture = 480; // 8 heures = 480 min
    const tempsFonctionnement = Math.max(0, tempsOuverture - newArret);
    const dispo = (tempsFonctionnement / tempsOuverture);

    const cadenceTheorique = 1000;
    const perf = Math.min(1, newCadence / cadenceTheorique);

    const totalPieces = Math.max(1, Math.round((newCadence / 60) * tempsFonctionnement));
    const bonnesPieces = Math.max(0, totalPieces - newRebuts);
    const qual = Math.min(1, bonnesPieces / totalPieces);

    const trs = dispo * perf * qual;

    onUpdateOee({
      disponibilite: Number((dispo * 100).toFixed(1)),
      performance: Number((perf * 100).toFixed(1)),
      qualite: Number((qual * 100).toFixed(1)),
      trsGlobal: Number((trs * 100).toFixed(1)),
      tempsOuvertureMin: tempsOuverture,
      tempsArretMin: newArret,
      piecesBonnes: bonnesPieces,
      piecesRebuts: newRebuts
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Sub Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Module MES Atelier & Performance (BladyProduction.Mes)
              </h2>
              <p className="text-xs text-slate-400">
                Exécution des Ordres de Fabrication, déclaration de fin de lot avec backflushing ERP et indicateurs TRS.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onGoToConnectivity && (
              <button
                onClick={onGoToConnectivity}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Superviser et configurer les machines opérationnelles de la ligne"
              >
                <Cpu className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Machines & Automates</span>
              </button>
            )}
            <button
              onClick={onCreerOf}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              <span>Nouvel OF</span>
            </button>
            <button
              onClick={() => onOpenDeclareModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Déclarer Production</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center overflow-x-auto border-t border-slate-800 mt-5 pt-3 space-x-1 text-xs">
          <button
            onClick={() => setActiveSubTab('of')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'of' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Ordres de Fabrication ({ordresFabrication.length})
          </button>
          <button
            onClick={() => setActiveSubTab('declaration')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'declaration' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Poste Opérateur & Déclaration
          </button>
          <button
            onClick={() => setActiveSubTab('trs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'trs' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Calculateur TRS / OEE ({oee.trsGlobal}%)
          </button>
          <button
            onClick={() => setActiveSubTab('tracabilite')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'tracabilite' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Généalogie & Traçabilité Lots
          </button>
        </div>
      </div>

      {/* SubTab 1: Ordres de Fabrication */}
      {activeSubTab === 'of' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {ordresFabrication.map(ofItem => {
              const article = articles.find(a => a.id === ofItem.articleId);
              const progress = Math.min(100, Math.round((ofItem.quantiteProduite / ofItem.quantiteCible) * 100));

              return (
                <div key={ofItem.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-base text-white">{ofItem.numeroOF}</span>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        Lot: {ofItem.numeroLotFabrique}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        ofItem.statut === 'EnConditionnement'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : ofItem.statut === 'Termine'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {ofItem.statut}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        {ofItem.operateur}
                      </span>
                      <span>Planifié: {new Date(ofItem.datePlanifiee).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-xs text-slate-400">Article Produit</div>
                      <div className="font-bold text-white text-sm font-mono mt-0.5">{article?.code}</div>
                      <div className="text-xs text-slate-400 truncate">{article?.designation}</div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono">
                        <span>Quantité: {ofItem.quantiteProduite} / {ofItem.quantiteCible} U</span>
                        <span className="text-sky-400 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>Rebuts: {ofItem.quantiteRebutee} U</span>
                        <span>Cadence théorique: {article ? (3600 / ofItem.tempsCycleSecondes).toFixed(0) : 1000} U/h</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 flex-wrap gap-y-1">
                      {ofItem.statut !== 'Termine' ? (
                        <>
                          <button
                            onClick={() => onOpenDeclareModal(ofItem)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Déclarer Fin</span>
                          </button>
                          {ofItem.statut === 'Planifie' && (
                            <button
                              onClick={() => onChangerStatutOf(ofItem.id, 'EnPreparation')}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Démarrer OF
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> OF Clôturé
                        </span>
                      )}

                      {onGoToQuality && (
                        <button
                          onClick={() => onGoToQuality(ofItem)}
                          className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                          title="Effectuer ou consulter le contrôle qualité de ce lot"
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                          <span>CQ</span>
                        </button>
                      )}

                      {onGoToTraceability && (
                        <button
                          onClick={() => onGoToTraceability(ofItem.numeroLotFabrique)}
                          className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                          title="Consulter l'arbre de traçabilité de ce lot"
                        >
                          <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Trace</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Poste Opérateur & Déclaration */}
      {activeSubTab === 'declaration' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Poste Déclaration Opérateur Ligne</h3>
                <p className="text-xs text-slate-400">
                  Déclaration du volume produit, déclenchant l'événement découplé vers l'ERP pour déduction des composants avec tolérances pertes fluides.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-white">OF Actif : OF-2026-104</span>
                  <span className="font-mono text-sky-400">Lot: LOT-VIR-2609-A1</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400">Article :</span>
                    <div className="font-bold text-white">PF-VIR-1000</div>
                    <div className="text-[11px] text-slate-400">Solution Virucide 1000ml</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Opérateur Poste :</span>
                    <div className="font-bold text-emerald-400">Julien Mercier (Ligne 01)</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-sky-950/20 border border-sky-800/40 rounded-xl text-xs space-y-2">
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  <span>Pont Découplé MES ➔ ERP (Clean Architecture C#)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Lorsque vous cliquez sur Déclarer ci-dessous, le service C# émet l'événement 
                  <code className="text-sky-300 font-mono"> ProductionRealiseeIntegrationEvent</code>. Le module ERP consomme cet événement et appelle la méthode C# 
                  <code className="text-sky-300 font-mono"> MrpStockService.AppliquerPostDeductionStockAsync</code> pour ajuster le stock théorique en appliquant les facteurs de perte de chaque fluide.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => onOpenDeclareModal()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 transition-colors flex items-center space-x-2"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>Ouvrir la Fenêtre de Déclaration de Lot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Calculateur TRS / OEE */}
      {activeSubTab === 'trs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-xs text-slate-400">Disponibilité (D)</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{oee.disponibilite}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Temps Fonc. / Temps Requis</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-xs text-slate-400">Performance (P)</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{oee.performance}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Cadence Réelle / Cadence Nominale</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-xs text-slate-400">Qualité (Q)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{oee.qualite}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Pièces Bonnes / Total Produit</div>
            </div>
            <div className="bg-slate-900 border border-sky-800/60 rounded-xl p-4 text-center bg-gradient-to-br from-slate-900 to-sky-950/30">
              <div className="text-xs text-sky-400 font-semibold">TRS GLOBAL (OEE)</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-1">{oee.trsGlobal}%</div>
              <div className="text-[10px] text-emerald-400 mt-1">Norme AFNOR NF E60-182</div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Simulateur & Analyse de Sensibilité TRS en Temps Réel</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">Shift 8 heures (480 min)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Slider 1: Temps d'arrêt */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Temps d'arrêt (Pannes, Purges) :</span>
                  <span className="font-mono font-bold text-amber-400">{tempsArret} min</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={tempsArret}
                  onChange={e => recalculateInteractiveTrs(Number(e.target.value), cadenceReelle, rebutsCount)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="text-[10px] text-slate-500">
                  Affecte directement le taux de Disponibilité.
                </div>
              </div>

              {/* Slider 2: Cadence */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Cadence réelle de remplissage :</span>
                  <span className="font-mono font-bold text-sky-400">{cadenceReelle} / h</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="1100"
                  step="20"
                  value={cadenceReelle}
                  onChange={e => recalculateInteractiveTrs(tempsArret, Number(e.target.value), rebutsCount)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="text-[10px] text-slate-500">
                  Nominale : 1000 flacons/h (Affecte la Performance).
                </div>
              </div>

              {/* Slider 3: Rebuts */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Nombre de rebuts / non-conformités :</span>
                  <span className="font-mono font-bold text-rose-400">{rebutsCount} flacons</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={rebutsCount}
                  onChange={e => recalculateInteractiveTrs(tempsArret, cadenceReelle, Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="text-[10px] text-slate-500">
                  Défaut de vissage, fuite ou étiquette de travers (Affecte la Qualité).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Traçabilité & Généalogie des Lots */}
      {activeSubTab === 'tracabilite' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <GitFork className="w-4 h-4 text-sky-400" />
                  <span>Généalogie de Lot (Traçabilité Descendante & Ascendante)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conformité Pharma & Cosmétique (GMP / BPF) : Rattachement des lots MP au lot fini.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Sélectionner Lot :</span>
                <select
                  value={selectedLotForTrace}
                  onChange={e => setSelectedLotForTrace(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-sky-300 px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="LOT-VIR-2609-A1">LOT-VIR-2609-A1 (Solution Virucide)</option>
                  <option value="LOT-SAV-2609-D4">LOT-SAV-2609-D4 (Savon Végétal)</option>
                </select>

                {onGoToTraceability && (
                  <button
                    onClick={() => onGoToTraceability(selectedLotForTrace)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                    title="Basculer vers la vue complète Traçabilité avec arbre dynamique D3.js"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Arbre D3.js Complet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tree View */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="w-8 h-8 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold font-mono text-xs border border-sky-500/30">
                  PF
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono text-xs">{selectedLotForTrace}</span>
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Contrôle Qualité Validé
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Produit Fini : Solution Virucide 1000ml | Ligne 01 | Opérateur: J. Mercier
                  </div>
                </div>
              </div>

              {/* Sub-lots used */}
              <div className="pl-6 border-l-2 border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 mb-2">Composants & Matières Premières Incorporées :</div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono text-sky-400 font-bold">MP-ETH-96</span>
                    <span className="text-slate-300 ml-2">Éthanol Surfin 96%</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Lot Fournisseur: <strong className="text-slate-200">LOT-BIOALC-8841</strong> (Perte cuve: 3.5%)
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono text-cyan-400 font-bold">MP-H2O2-30</span>
                    <span className="text-slate-300 ml-2">Peroxyde d'Hydrogène 30%</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Lot Fournisseur: <strong className="text-slate-200">LOT-CHIM-2026-09A</strong> (Certificat Conforme)
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono text-emerald-400 font-bold">MP-GLY-99</span>
                    <span className="text-slate-300 ml-2">Glycérol Végétal Codex</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Lot Fournisseur: <strong className="text-slate-200">LOT-OLEO-9912</strong> (Perte cuve: 4.5%)
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono text-amber-400 font-bold">EMB-FLAC-1000</span>
                    <span className="text-slate-300 ml-2">Flacon PEHD Blanc 1L</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Lot Fabricant: <strong className="text-slate-200">LOT-PLAST-4412</strong>
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
