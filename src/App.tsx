import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SynopticOverview } from './components/SynopticOverview';
import { ErpView } from './components/ErpView';
import { MesView } from './components/MesView';
import { AnalyticsView } from './components/AnalyticsView';
import { IndustrialConnectivityView } from './components/IndustrialConnectivityView';
import { CSharpArchitectureViewer } from './components/CSharpArchitectureViewer';
import { ProductionDeclarationModal } from './components/ProductionDeclarationModal';
import { ReceiptModal } from './components/ReceiptModal';
import { NewOfModal } from './components/NewOfModal';
import { 
  INITIAL_ARTICLES, 
  INITIAL_NOMENCLATURES, 
  INITIAL_COMMANDES_CLIENTS, 
  INITIAL_SUGGESTIONS_ACHATS, 
  INITIAL_BONS_RECEPTIONS, 
  INITIAL_MOUVEMENTS_STOCK, 
  INITIAL_ORDRES_FABRICATION, 
  INITIAL_MACHINES, 
  INITIAL_OEE 
} from './data/initialData';
import { MrpStockEngine } from './services/mrpService';
import { Article, Nomenclature, CommandeClient, SuggestionAchat, BonReception, MouvementStock, OrdreFabrication, MachineLigne, OeeMetrics } from './types';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'synoptic' | 'erp' | 'mes' | 'analytics' | 'connectivity' | 'csharp'>('synoptic');
  
  // Data state
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [nomenclatures] = useState<Nomenclature[]>(INITIAL_NOMENCLATURES);
  const [commandesClients, setCommandesClients] = useState<CommandeClient[]>(INITIAL_COMMANDES_CLIENTS);
  const [suggestionsAchats, setSuggestionsAchats] = useState<SuggestionAchat[]>(INITIAL_SUGGESTIONS_ACHATS);
  const [bonsReceptions, setBonsReceptions] = useState<BonReception[]>(INITIAL_BONS_RECEPTIONS);
  const [mouvementsStock, setMouvementsStock] = useState<MouvementStock[]>(INITIAL_MOUVEMENTS_STOCK);
  const [ordresFabrication, setOrdresFabrication] = useState<OrdreFabrication[]>(INITIAL_ORDRES_FABRICATION);
  const [machines, setMachines] = useState<MachineLigne[]>(INITIAL_MACHINES);
  const [oee, setOee] = useState<OeeMetrics>(INITIAL_OEE);

  // Simulation & Modal state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState<boolean>(false);
  const [selectedOfForDeclare, setSelectedOfForDeclare] = useState<OrdreFabrication | undefined>(undefined);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [selectedSuggestionForReceipt, setSelectedSuggestionForReceipt] = useState<SuggestionAchat | undefined>(undefined);
  const [isNewOfModalOpen, setIsNewOfModalOpen] = useState<boolean>(false);

  // In-app notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>({
    message: "Système BladyProduction initialisé avec l'architecture C# (.NET 8/9). Prêt pour le pilotage opérationnel.",
    type: 'info'
  });

  const showNotification = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 6000);
  };

  // Active OF
  const activeOf = ordresFabrication.find(o => o.statut === 'EnConditionnement' || o.statut === 'EnMelange') || ordresFabrication[0];

  // Critical alerts count
  const criticalStockCount = articles.filter(a => a.estComposant && a.stockTheorique < a.seuilCritique).length;

  // Background industrial telemetry simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setMachines(prevMachines =>
        prevMachines.map(m => {
          if (m.statut !== 'EnMarche') return m;

          // Subtle natural fluctuation
          const deltaCadence = Math.floor(Math.random() * 7) - 3;
          const newCadence = Math.max(880, Math.min(960, m.cadenceActuelle + deltaCadence));
          
          let newTemp = m.temperatureC;
          if (m.temperatureC) {
            newTemp = Number((m.temperatureC + (Math.random() * 0.2 - 0.1)).toFixed(1));
          }

          let newPression = m.pressionBar;
          if (m.pressionBar) {
            newPression = Number((m.pressionBar + (Math.random() * 0.04 - 0.02)).toFixed(2));
          }

          return {
            ...m,
            cadenceActuelle: newCadence,
            temperatureC: newTemp,
            pressionBar: newPression
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // 1. Run MRP calculation (faithful to MrpStockService.cs)
  const handleLancerMrp = () => {
    const nouvellesSuggestions = MrpStockEngine.executerCalculMrpComplet(articles, suggestionsAchats);
    if (nouvellesSuggestions.length > 0) {
      setSuggestionsAchats(prev => [...nouvellesSuggestions, ...prev]);
      showNotification(
        `Calcul MRP C# terminé : ${nouvellesSuggestions.length} nouvelle(s) suggestion(s) d'achat générée(s) (arrondies aux multiples standard).`,
        'warning'
      );
    } else {
      showNotification("Calcul MRP exécuté : aucune nouvelle rupture constatée.", 'success');
    }
  };

  // 2. Validate suggestion d'achat
  const handleValiderSuggestion = (id: number) => {
    setSuggestionsAchats(prev =>
      prev.map(s => (s.id === id ? { ...s, statut: 'Commandee' } : s))
    );
    showNotification("Demande d'achat validée et transmise au service Approvisionnements.", 'success');
  };

  // 3. Create Bon de Réception from suggestion
  const handleOpenReceiptModal = (suggestion: SuggestionAchat) => {
    setSelectedSuggestionForReceipt(suggestion);
    setIsReceiptModalOpen(true);
  };

  const handleConfirmReceipt = (
    articleId: number,
    quantiteRecue: number,
    numeroLotFournisseur: string,
    fournisseurNom: string
  ) => {
    const art = articles.find(a => a.id === articleId);

    // Increase stock
    setArticles(prev =>
      prev.map(a =>
        a.id === articleId ? { ...a, stockTheorique: a.stockTheorique + quantiteRecue } : a
      )
    );

    // Log movement
    const newMvt: MouvementStock = {
      id: Date.now(),
      articleId,
      quantite: quantiteRecue,
      typeMouvement: 'Entree',
      referenceDocument: `BL-REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      numeroLot: numeroLotFournisseur,
      dateMouvement: new Date().toISOString(),
      details: `Réception de ${quantiteRecue} ${art?.uniteMesure} de ${fournisseurNom}`
    };
    setMouvementsStock(prev => [...prev, newMvt]);

    // Create BonReception
    const newBL: BonReception = {
      id: Date.now(),
      numeroBL: newMvt.referenceDocument,
      commandeFournisseurId: 400 + Math.floor(Math.random() * 100),
      fournisseurNom,
      dateReception: new Date().toISOString(),
      recuPar: 'Agent Magasin Central',
      lignes: [
        {
          id: Date.now() + 1,
          bonReceptionId: Date.now(),
          articleId,
          quantiteCommandee: quantiteRecue,
          quantiteRecue,
          quantiteRejetee: 0,
          numeroLotFournisseur
        }
      ]
    };
    setBonsReceptions(prev => [newBL, ...prev]);

    // Mark suggestion as Commandee
    if (selectedSuggestionForReceipt) {
      setSuggestionsAchats(prev =>
        prev.map(s => s.id === selectedSuggestionForReceipt.id ? { ...s, statut: 'Commandee' } : s)
      );
    }

    showNotification(
      `Réception enregistrée : +${quantiteRecue} ${art?.uniteMesure} pour ${art?.code} (Lot ${numeroLotFournisseur}). Stock mis à jour.`,
      'success'
    );
  };

  // 4. Production declaration with backflushing post-deduction
  const handleOpenDeclareModal = (ofItem?: OrdreFabrication) => {
    setSelectedOfForDeclare(ofItem || activeOf);
    setIsDeclareModalOpen(true);
  };

  const handleConfirmDeclaration = (
    ofId: number,
    quantiteRealisee: number,
    quantiteRebuts: number,
    operateur: string
  ) => {
    const ofTarget = ordresFabrication.find(o => o.id === ofId);
    if (!ofTarget) return;

    // Apply the exact C# AppliquerPostDeductionStockAsync logic
    const { updatedArticles, nouveauxMouvements, consommations } = MrpStockEngine.appliquerPostDeductionStock(
      ofTarget.articleId,
      quantiteRealisee,
      articles,
      nomenclatures,
      ofTarget.numeroLotFabrique
    );

    // Update articles state
    setArticles(updatedArticles);
    setMouvementsStock(prev => [...prev, ...nouveauxMouvements]);

    // Update OF progression
    const totalProduit = ofTarget.quantiteProduite + quantiteRealisee;
    const estTermine = totalProduit >= ofTarget.quantiteCible;

    setOrdresFabrication(prev =>
      prev.map(o =>
        o.id === ofId
          ? {
              ...o,
              quantiteProduite: totalProduit,
              quantiteRebutee: o.quantiteRebutee + quantiteRebuts,
              statut: estTermine ? 'Termine' : o.statut
            }
          : o
      )
    );

    // Also update sales order if linked
    if (ofTarget.commandeClientId) {
      setCommandesClients(prevCmds =>
        prevCmds.map(cmd => {
          if (cmd.id !== ofTarget.commandeClientId) return cmd;
          const updatedLignes = cmd.lignes.map(l =>
            l.articleId === ofTarget.articleId
              ? { ...l, quantiteDejaProduite: Math.min(l.quantiteCommandee, l.quantiteDejaProduite + quantiteRealisee) }
              : l
          );
          const allComplete = updatedLignes.every(l => l.quantiteDejaProduite >= l.quantiteCommandee);
          return {
            ...cmd,
            lignes: updatedLignes,
            statut: allComplete ? 'Expediee' : cmd.statut
          };
        })
      );
    }

    // Check if new shortages were created and trigger MRP suggestions as C# bridge does
    const newSuggestions: SuggestionAchat[] = [];
    for (const cons of consommations) {
      const artAfter = updatedArticles.find(a => a.id === cons.composantId);
      if (artAfter && artAfter.stockTheorique < artAfter.seuilCritique) {
        const suggestion = MrpStockEngine.verifierEtGenererSuggestionAchat(
          artAfter.id,
          updatedArticles,
          [...suggestionsAchats, ...newSuggestions]
        );
        if (suggestion) {
          newSuggestions.push(suggestion);
        }
      }
    }

    if (newSuggestions.length > 0) {
      setSuggestionsAchats(prev => [...newSuggestions, ...prev]);
    }

    showNotification(
      `Déclaration validée pour ${quantiteRealisee} unités (Lot: ${ofTarget.numeroLotFabrique}). Post-déduction de ${consommations.length} matières appliquée avec facteurs de pertes fluides. ${newSuggestions.length > 0 ? `(${newSuggestions.length} réappro MRP déclenché)` : ''}`,
      'success'
    );
  };

  // 5. Create OF from Sale
  const handleLancerProductionDepuisVente = (commandeId: number, ligneId: number) => {
    const cmd = commandesClients.find(c => c.id === commandeId);
    const ligne = cmd?.lignes.find(l => l.id === ligneId);
    if (!cmd || !ligne) return;

    const quantiteARealiser = ligne.quantiteCommandee - ligne.quantiteDejaProduite;
    const nouveauLot = `LOT-VIR-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-CC${cmd.id}`;

    const nouvelOf: OrdreFabrication = {
      id: Date.now(),
      numeroOF: `OF-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 800)}`,
      articleId: ligne.articleId,
      quantiteCible: quantiteARealiser,
      quantiteProduite: 0,
      quantiteRebutee: 0,
      datePlanifiee: new Date().toISOString(),
      statut: 'EnConditionnement',
      ligneProductionId: 1,
      numeroLotFabrique: nouveauLot,
      operateur: 'Équipe Ligne 01',
      commandeClientId: cmd.id,
      tempsCycleSecondes: 3.6,
      tempsProductionMinutes: 0
    };

    setOrdresFabrication(prev => [nouvelOf, ...prev]);
    setCommandesClients(prev =>
      prev.map(c => (c.id === commandeId ? { ...c, statut: 'EnProduction' } : c))
    );

    setActiveTab('mes');
    showNotification(
      `OF ${nouvelOf.numeroOF} lancé pour ${quantiteARealiser} U (Commande ${cmd.numeroCommande}).`,
      'success'
    );
  };

  // 6. Create custom OF
  const handleConfirmCreateOf = (newOfData: Omit<OrdreFabrication, 'id'>) => {
    const created: OrdreFabrication = {
      ...newOfData,
      id: Date.now()
    };
    setOrdresFabrication(prev => [created, ...prev]);
    showNotification(`OF ${created.numeroOF} créé avec succès.`, 'success');
  };

  // 7. Change OF status
  const handleChangerStatutOf = (ofId: number, nouveauStatut: OrdreFabrication['statut']) => {
    setOrdresFabrication(prev =>
      prev.map(o => (o.id === ofId ? { ...o, statut: nouveauStatut } : o))
    );
    showNotification(`Statut de l'OF mis à jour : ${nouveauStatut}`, 'info');
  };

  // 8. Machine status change
  const handleMachineStateChange = (machineId: number, newStatut: MachineLigne['statut']) => {
    setMachines(prev =>
      prev.map(m => (m.id === machineId ? { ...m, statut: newStatut } : m))
    );
    showNotification(`État machine mis à jour : ${newStatut}`, 'info');
  };

  // 9. Reset data
  const handleResetData = () => {
    setArticles(INITIAL_ARTICLES);
    setCommandesClients(INITIAL_COMMANDES_CLIENTS);
    setSuggestionsAchats(INITIAL_SUGGESTIONS_ACHATS);
    setBonsReceptions(INITIAL_BONS_RECEPTIONS);
    setMouvementsStock(INITIAL_MOUVEMENTS_STOCK);
    setOrdresFabrication(INITIAL_ORDRES_FABRICATION);
    setMachines(INITIAL_MACHINES);
    setOee(INITIAL_OEE);
    showNotification("Données d'usine réinitialisées aux valeurs nominales du projet C#.", 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        onResetData={handleResetData}
        criticalAlertCount={criticalStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* In-app Toast Banner */}
        {notification && (
          <div className="mb-5 p-3.5 rounded-xl border flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 text-xs bg-slate-900 border-slate-800">
            <div className="flex items-center space-x-2.5">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />}
              <span className="text-slate-200 font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Router */}
        {activeTab === 'synoptic' && (
          <SynopticOverview
            articles={articles}
            machines={machines}
            activeOf={activeOf}
            oee={oee}
            onOpenDeclareModal={() => handleOpenDeclareModal()}
            onGoToErp={() => setActiveTab('erp')}
            onGoToMes={() => setActiveTab('mes')}
            onGoToCSharp={() => setActiveTab('csharp')}
            onGoToAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'erp' && (
          <ErpView
            articles={articles}
            nomenclatures={nomenclatures}
            commandesClients={commandesClients}
            suggestionsAchats={suggestionsAchats}
            bonsReceptions={bonsReceptions}
            mouvementsStock={mouvementsStock}
            onLancerMrp={handleLancerMrp}
            onValiderSuggestion={handleValiderSuggestion}
            onCreerBonReception={handleOpenReceiptModal}
            onLancerProductionDepuisVente={handleLancerProductionDepuisVente}
          />
        )}

        {activeTab === 'mes' && (
          <MesView
            ordresFabrication={ordresFabrication}
            articles={articles}
            machines={machines}
            oee={oee}
            onUpdateOee={setOee}
            onOpenDeclareModal={handleOpenDeclareModal}
            onChangerStatutOf={handleChangerStatutOf}
            onCreerOf={() => setIsNewOfModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            articles={articles}
            oee={oee}
            onGoToErp={() => setActiveTab('erp')}
            onGoToMes={() => setActiveTab('mes')}
            onGoToCSharp={() => setActiveTab('csharp')}
          />
        )}

        {activeTab === 'connectivity' && (
          <IndustrialConnectivityView
            machines={machines}
            onMachineStateChange={handleMachineStateChange}
            isLiveSimulating={isSimulating}
          />
        )}

        {activeTab === 'csharp' && (
          <CSharpArchitectureViewer />
        )}

      </main>

      {/* Production Declaration Modal */}
      <ProductionDeclarationModal
        isOpen={isDeclareModalOpen}
        onClose={() => setIsDeclareModalOpen(false)}
        ofItem={selectedOfForDeclare}
        articles={articles}
        nomenclatures={nomenclatures}
        onConfirmDeclaration={handleConfirmDeclaration}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        suggestion={selectedSuggestionForReceipt}
        articles={articles}
        onConfirmReceipt={handleConfirmReceipt}
      />

      {/* New OF Modal */}
      <NewOfModal
        isOpen={isNewOfModalOpen}
        onClose={() => setIsNewOfModalOpen(false)}
        articles={articles}
        onConfirmCreateOf={handleConfirmCreateOf}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BladyProduction Monolithe Modulaire C# (.NET 8/9) — Architecture ERP + MES & Connectivité Industrielle</span>
          <span className="font-mono text-slate-400">ISA-95 / ISA-88 Batch Manufacturing</span>
        </div>
      </footer>

    </div>
  );
}
