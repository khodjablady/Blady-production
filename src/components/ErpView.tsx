import React, { useState } from 'react';
import { 
  Boxes, 
  Layers, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Plus, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ArrowDownRight, 
  ExternalLink,
  Search,
  Droplets,
  Building2,
  Calendar,
  CheckCircle2,
  GitFork,
  Edit3,
  Calculator
} from 'lucide-react';
import { Article, Nomenclature, CommandeClient, SuggestionAchat, BonReception, MouvementStock } from '../types';
import { ArticleModal } from './ArticleModal';

interface ErpViewProps {
  articles: Article[];
  nomenclatures: Nomenclature[];
  commandesClients: CommandeClient[];
  suggestionsAchats: SuggestionAchat[];
  bonsReceptions: BonReception[];
  mouvementsStock: MouvementStock[];
  onLancerMrp: () => void;
  onValiderSuggestion: (id: number) => void;
  onCreerBonReception: (suggestion: SuggestionAchat) => void;
  onLancerProductionDepuisVente: (commandeId: number, ligneId: number) => void;
  onGoToTraceability?: (lotNumber?: string) => void;
  onGoToMes?: () => void;
  onSaveArticle?: (article: Article, ajustementStock?: { difference: number; motif: string }) => void;
}

export const ErpView: React.FC<ErpViewProps> = ({
  articles,
  nomenclatures,
  commandesClients,
  suggestionsAchats,
  bonsReceptions,
  mouvementsStock,
  onLancerMrp,
  onValiderSuggestion,
  onCreerBonReception,
  onLancerProductionDepuisVente,
  onGoToTraceability,
  onGoToMes,
  onSaveArticle
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'nomenclatures' | 'ventes' | 'achats' | 'receptions' | 'mouvements'>('articles');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mp' | 'pf'>('all');
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [selectedArticleToEdit, setSelectedArticleToEdit] = useState<Article | undefined>(undefined);

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.designation.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'mp') return matchesSearch && a.estComposant;
    if (filterType === 'pf') return matchesSearch && !a.estComposant;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Module ERP Industrie des Liquides (BladyProduction.Erp)
                </h2>
                <p className="text-xs text-slate-400">
                  Gestion des stocks théoriques, formulations avec pertes de process et moteur de réapprovisionnement MRP.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-erp-run-mrp"
              onClick={onLancerMrp}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
              title="Exécuter VerifierEtGenererSuggestionAchatAsync sur tous les articles"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Exécuter Calcul MRP</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center overflow-x-auto border-t border-slate-800 mt-5 pt-3 space-x-1 text-xs">
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'articles' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Articles & Matières ({articles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('nomenclatures')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'nomenclatures' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Nomenclatures & Pertes ({nomenclatures.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ventes')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'ventes' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Commandes Clients ({commandesClients.length})
          </button>
          <button
            onClick={() => setActiveSubTab('achats')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center space-x-1 ${
              activeSubTab === 'achats' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Suggestions MRP ({suggestionsAchats.filter(s => s.statut === 'AValider').length})</span>
            {suggestionsAchats.filter(s => s.statut === 'AValider').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('receptions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'receptions' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Bons de Réception ({bonsReceptions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('mouvements')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSubTab === 'mouvements' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Mouvements de Stock ({mouvementsStock.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Articles */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          {/* Cost of Goods & Stock Valuation Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400">Valeur Totale du Stock (Std)</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {articles
                    .reduce((acc, a) => acc + (a.stockTheorique * (a.coutUnitaireStandard ?? a.prixUnitaireEstime ?? 0)), 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Calculator className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400">Stock Matières Premières</span>
                <div className="text-base font-bold font-mono text-sky-400">
                  {articles
                    .filter(a => a.estComposant)
                    .reduce((acc, a) => acc + (a.stockTheorique * (a.coutUnitaireStandard ?? a.prixUnitaireEstime ?? 0)), 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                </div>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Boxes className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400">Stock Produits Finis</span>
                <div className="text-base font-bold font-mono text-indigo-400">
                  {articles
                    .filter(a => !a.estComposant)
                    .reduce((acc, a) => acc + (a.stockTheorique * (a.coutUnitaireStandard ?? a.prixUnitaireEstime ?? 0)), 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                </div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-400">Articles avec Coût Standard</span>
                <div className="text-base font-bold font-mono text-white">
                  {articles.filter(a => a.coutUnitaireStandard !== undefined).length} / {articles.length}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher code, désignation..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Tous ({articles.length})
                </button>
                <button
                  onClick={() => setFilterType('mp')}
                  className={`px-2.5 py-1 rounded ${filterType === 'mp' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Matières & Composants ({articles.filter(a => a.estComposant).length})
                </button>
                <button
                  onClick={() => setFilterType('pf')}
                  className={`px-2.5 py-1 rounded ${filterType === 'pf' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Produits Finis ({articles.filter(a => !a.estComposant).length})
                </button>
              </div>

              {onSaveArticle && (
                <button
                  onClick={() => {
                    setSelectedArticleToEdit(undefined);
                    setIsArticleModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-colors ml-auto sm:ml-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouvel Article / Matière</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3">Code / Article</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Stock Théorique</th>
                    <th className="p-3 text-right">Coût Unitaire Std</th>
                    <th className="p-3 text-right">Valo. Stock (Std)</th>
                    <th className="p-3 text-right">Seuil Critique</th>
                    <th className="p-3 text-right">Qté Std Achat</th>
                    <th className="p-3">Spécificités Liquides</th>
                    <th className="p-3">Emplacement / Emballage</th>
                    <th className="p-3">Statut Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredArticles.map(article => {
                    const isBelowCritical = article.stockTheorique < article.seuilCritique;
                    const coutStd = article.coutUnitaireStandard ?? article.prixUnitaireEstime;
                    const valeurStock = coutStd !== undefined ? article.stockTheorique * coutStd : undefined;

                    return (
                      <tr key={article.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold font-mono text-white">{article.code}</div>
                          <div className="text-slate-400 text-[11px] truncate max-w-xs">{article.designation}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            article.estComposant 
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {article.estComposant ? 'Composant / MP' : 'Produit Fini (PF)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {article.stockTheorique.toLocaleString('fr-FR')} {article.uniteMesure}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {article.coutUnitaireStandard !== undefined ? (
                            <span className="text-indigo-300 font-bold">
                              {article.coutUnitaireStandard.toFixed(4)} DA
                            </span>
                          ) : article.prixUnitaireEstime !== undefined ? (
                            <span className="text-slate-400 italic text-[11px]">
                              ~{article.prixUnitaireEstime.toFixed(2)} DA (est.)
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {valeurStock !== undefined ? (
                            `${valeurStock.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`
                          ) : (
                            <span className="text-slate-600 font-normal">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {article.seuilCritique.toLocaleString('fr-FR')} {article.uniteMesure}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          {article.quantiteStandardAchat.toLocaleString('fr-FR')} {article.uniteMesure}
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">
                          {article.densite ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sky-300 font-mono">d = {article.densite}</span>
                              {article.capaciteVolumeLitres && (
                                <span className="text-slate-400">({article.capaciteVolumeLitres} L)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px]">
                          <div className="text-slate-300 truncate max-w-[150px]">{article.typeEmballage || '—'}</div>
                          <div className="text-slate-500 text-[10px] truncate max-w-[150px]">{article.emplacement}</div>
                        </td>
                        <td className="p-3">
                          {isBelowCritical ? (
                            <span className="flex items-center space-x-1 text-amber-400 text-[11px] font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Sous seuil!</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Conforme</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {onSaveArticle && (
                            <button
                              onClick={() => {
                                setSelectedArticleToEdit(article);
                                setIsArticleModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center space-x-1"
                              title={`Modifier la fiche de ${article.code}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-medium hidden sm:inline">Modifier</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Nomenclatures */}
      {activeSubTab === 'nomenclatures' && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start space-x-3">
            <Droplets className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Prise en compte des pertes dans BladyProduction.Erp.Domain.Nomenclature</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Les fluides subissent des pertes incompressibles lors du transfert (fond de cuve, purge de circuit, évaporation des alcools).
                Le champ <code className="text-sky-300 font-mono">PourcentagePerteTolerable</code> permet d'augmenter mathématiquement
                le besoin net prélevé lors de la post-déduction de fabrication (backflushing).
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white text-xs">
                Formulation & Nomenclature de fabrication (PF-VIR-1000)
              </span>
              <span className="text-xs text-slate-400">
                1 Flacon 1000ml fini
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Composant Code</th>
                    <th className="p-3">Désignation Matière</th>
                    <th className="p-3 text-right">Besoin Unitaire Théorique</th>
                    <th className="p-3 text-right">Perte Tolérable (%)</th>
                    <th className="p-3 text-right">Besoin Réel Effectif</th>
                    <th className="p-3 text-right">Coût Std Composant</th>
                    <th className="p-3 text-right">Part Coût Revient</th>
                    <th className="p-3 text-right">Stock Actuel Composant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {nomenclatures.map(nom => {
                    const comp = articles.find(a => a.id === nom.composantId);
                    const facteur = 1 + (nom.pourcentagePerteTolerable / 100);
                    const besoinReel = nom.quantiteBesoinUnitaire * facteur;
                    const coutComp = comp?.coutUnitaireStandard ?? comp?.prixUnitaireEstime ?? 0;
                    const partCout = besoinReel * coutComp;

                    return (
                      <tr key={nom.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-sky-400">{comp?.code}</td>
                        <td className="p-3 text-slate-300">{comp?.designation}</td>
                        <td className="p-3 text-right font-mono">
                          {nom.quantiteBesoinUnitaire} {comp?.uniteMesure}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                            +{nom.pourcentagePerteTolerable}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {besoinReel.toFixed(4)} {comp?.uniteMesure}
                        </td>
                        <td className="p-3 text-right font-mono text-indigo-300">
                          {coutComp > 0 ? `${coutComp.toFixed(4)} DA` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {partCout.toFixed(4)} DA
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {comp?.stockTheorique} {comp?.uniteMesure}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-950/90 font-semibold border-t border-slate-700 text-xs">
                  <tr>
                    <td colSpan={6} className="p-3 text-right text-slate-300">
                      Coût Matières & Emballages Cumulé (BOM) :
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      {nomenclatures.reduce((total, nom) => {
                        const comp = articles.find(a => a.id === nom.composantId);
                        const facteur = 1 + (nom.pourcentagePerteTolerable / 100);
                        const besoinReel = nom.quantiteBesoinUnitaire * facteur;
                        const coutComp = comp?.coutUnitaireStandard ?? comp?.prixUnitaireEstime ?? 0;
                        return total + (besoinReel * coutComp);
                      }, 0).toFixed(4)} DA
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">par flacon fini</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Commandes Clients & Ventes */}
      {activeSubTab === 'ventes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {commandesClients.map(commande => (
              <div key={commande.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-white text-sm">{commande.numeroCommande}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      commande.statut === 'EnProduction' 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : commande.statut === 'Expediee'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {commande.statut}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {commande.clientNom}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(commande.dateCommande).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Lignes de commande */}
                <div className="space-y-2">
                  {commande.lignes.map(ligne => {
                    const article = articles.find(a => a.id === ligne.articleId);
                    const percentProduced = Math.min(100, Math.round((ligne.quantiteDejaProduite / ligne.quantiteCommandee) * 100));

                    return (
                      <div key={ligne.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs gap-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white font-mono">{article?.code} - {article?.designation}</div>
                          <div className="text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>Prix vente: <strong className="text-white">{ligne.prixUnitaire} DA</strong></span>
                            {article?.coutUnitaireStandard !== undefined && (
                              <span>Coût std: <strong className="text-indigo-300">{article.coutUnitaireStandard.toFixed(2)} DA</strong></span>
                            )}
                            {article?.coutUnitaireStandard !== undefined && (
                              <span className={`font-semibold ${ligne.prixUnitaire >= article.coutUnitaireStandard ? 'text-emerald-400' : 'text-rose-400'}`}>
                                Marge: +{(ligne.prixUnitaire - article.coutUnitaireStandard).toFixed(2)} DA / U ({(((ligne.prixUnitaire - article.coutUnitaireStandard) / ligne.prixUnitaire) * 100).toFixed(1)}%)
                              </span>
                            )}
                            <span>Total Vente: <strong className="text-white">{(ligne.prixUnitaire * ligne.quantiteCommandee).toFixed(2)} DA</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-mono text-slate-300">
                              {ligne.quantiteDejaProduite} / {ligne.quantiteCommandee} U
                            </div>
                            <div className="text-[10px] text-sky-400 font-semibold">{percentProduced}% produit</div>
                          </div>

                          {commande.statut !== 'Expediee' && ligne.quantiteDejaProduite < ligne.quantiteCommandee && (
                            <button
                              onClick={() => onLancerProductionDepuisVente(commande.id, ligne.id)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded text-xs transition-colors flex items-center space-x-1"
                            >
                              <span>Lancer OF (MES)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Suggestions MRP & Achats */}
      {activeSubTab === 'achats' && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Moteur de Réapprovisionnement MRP (MrpStockService.cs)</span>
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Algorithme C# exact du PDF : Lorsqu'un composant passe sous son <strong className="text-slate-200">SeuilCritique</strong>, 
                le manque est calculé (<code className="text-sky-300 font-mono">manque = SeuilCritique - StockTheorique</code>) 
                puis arrondi au multiple supérieur de la quantité standard d'achat (<code className="text-sky-300 font-mono">Math.Ceiling(manque / QuantiteStandardAchat) * QuantiteStandardAchat</code>).
              </p>
            </div>
            <button
              onClick={onLancerMrp}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm"
            >
              Re-calculer MRP
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {suggestionsAchats.length === 0 ? (
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
                Aucune suggestion d'achat en attente. Tous les stocks de matières premières sont au-dessus de leur seuil critique.
              </div>
            ) : (
              suggestionsAchats.map(sugg => {
                const article = articles.find(a => a.id === sugg.articleId);
                return (
                  <div key={sugg.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-sm">{article?.code}</span>
                        <span className="text-slate-300 font-medium text-xs">{article?.designation}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          sugg.statut === 'AValider' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {sugg.statut}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{sugg.motif}</p>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-3 pt-1">
                        <span>Besoin usine: {new Date(sugg.dateBesoinUsine).toLocaleDateString('fr-FR')}</span>
                        <span>Commande max: {new Date(sugg.dateCommandeAuPlusTard).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Quantité Suggérée</div>
                        <div className="text-base font-bold font-mono text-emerald-400">
                          {sugg.quantiteSuggeree.toLocaleString('fr-FR')} {article?.uniteMesure}
                        </div>
                      </div>

                      {sugg.statut === 'AValider' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onValiderSuggestion(sugg.id)}
                            className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
                          >
                            Valider DA
                          </button>
                          <button
                            onClick={() => onCreerBonReception(sugg)}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Réceptionner</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Commandé / Reçu
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Bons de Réception */}
      {activeSubTab === 'receptions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">N° Bon Livraison (BL)</th>
                    <th className="p-3">Fournisseur</th>
                    <th className="p-3">Date Réception</th>
                    <th className="p-3">Réceptionnaire</th>
                    <th className="p-3">Articles & Lots Reçus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {bonsReceptions.map(bl => (
                    <tr key={bl.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">{bl.numeroBL}</td>
                      <td className="p-3 text-slate-300">{bl.fournisseurNom}</td>
                      <td className="p-3 text-slate-400">
                        {new Date(bl.dateReception).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-3 text-slate-300">{bl.recuPar}</td>
                      <td className="p-3">
                        {bl.lignes.map(l => {
                          const art = articles.find(a => a.id === l.articleId);
                          return (
                            <div key={l.id} className="text-[11px] font-mono flex items-center flex-wrap gap-1">
                              <span className="text-sky-400 font-bold">{art?.code}</span> : {l.quantiteRecue} {art?.uniteMesure} 
                              {l.numeroLotFournisseur && onGoToTraceability ? (
                                <button
                                  onClick={() => onGoToTraceability(l.numeroLotFournisseur)}
                                  className="text-indigo-400 hover:text-indigo-300 ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/40 hover:border-indigo-500 transition-colors"
                                  title="Inspecter ce lot dans l'arbre de traçabilité"
                                >
                                  <GitFork className="w-3 h-3" />
                                  <span>Lot: {l.numeroLotFournisseur}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 ml-2">(Lot: {l.numeroLotFournisseur})</span>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Mouvements de Stock (Audit Log) */}
      {activeSubTab === 'mouvements' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date / Heure</th>
                    <th className="p-3">Article</th>
                    <th className="p-3">Type Mouvement</th>
                    <th className="p-3 text-right">Quantité Mouvementée</th>
                    <th className="p-3">Réf Document</th>
                    <th className="p-3">N° Lot</th>
                    <th className="p-3">Détails Traçabilité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {mouvementsStock.slice(-20).reverse().map(mvt => {
                    const art = articles.find(a => a.id === mvt.articleId);
                    const isNegative = mvt.quantite < 0;

                    return (
                      <tr key={mvt.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {new Date(mvt.dateMouvement).toLocaleString('fr-FR')}
                        </td>
                        <td className="p-3 font-mono text-white">
                          {art?.code}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            mvt.typeMouvement === 'PostDeductionProduction'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {mvt.typeMouvement}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {mvt.quantite > 0 ? `+${mvt.quantite}` : mvt.quantite} {art?.uniteMesure}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-300">
                          {mvt.referenceDocument}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-sky-400">
                          {mvt.numeroLot ? (
                            onGoToTraceability ? (
                              <button
                                onClick={() => onGoToTraceability(mvt.numeroLot)}
                                className="text-sky-400 hover:text-indigo-300 inline-flex items-center gap-1 hover:underline transition-colors"
                                title="Inspecter ce lot dans l'arbre de traçabilité"
                              >
                                <GitFork className="w-3 h-3 text-indigo-400" />
                                <span>{mvt.numeroLot}</span>
                              </button>
                            ) : (
                              <span>{mvt.numeroLot}</span>
                            )
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">
                          {mvt.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Article Creation & Editing Modal */}
      {isArticleModalOpen && onSaveArticle && (
        <ArticleModal
          isOpen={isArticleModalOpen}
          onClose={() => {
            setIsArticleModalOpen(false);
            setSelectedArticleToEdit(undefined);
          }}
          articleToEdit={selectedArticleToEdit}
          onSave={onSaveArticle}
          existingCodes={articles.map(a => a.code)}
        />
      )}

    </div>
  );
};
