import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SynopticOverview } from './components/SynopticOverview';
import { ErpView } from './components/ErpView';
import { MesView } from './components/MesView';
import { AnalyticsView } from './components/AnalyticsView';
import { IndustrialConnectivityView } from './components/IndustrialConnectivityView';
import { CSharpArchitectureViewer } from './components/CSharpArchitectureViewer';
import { JournalMaintenance } from './components/JournalMaintenance';
import { PlanningGanttView } from './components/PlanningGanttView';
import { QualityControlView } from './components/QualityControlView';
import { TraceabilityView } from './components/TraceabilityView';
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
  INITIAL_OEE,
  INITIAL_INTERVENTIONS
} from './data/initialData';
import { INITIAL_CONTROLES_QUALITE } from './data/qualitySpecs';
import { MrpStockEngine } from './services/mrpService';
import { evaluateTelemetryAlerts, loadTelemetryThresholds } from './utils/telemetryThresholds';
import { Article, Nomenclature, CommandeClient, SuggestionAchat, BonReception, MouvementStock, OrdreFabrication, MachineLigne, OeeMetrics, InterventionMaintenance, ControleQualiteLot } from './types';
import { CheckCircle2, AlertTriangle, Info, X, Factory } from 'lucide-react';
import { BladyLogo } from './components/BladyLogo';
import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { 
  subscribeToOrdresFabrication, 
  persistOrdreFabrication, 
  subscribeToMouvementsStock, 
  persistMouvementStock,
  subscribeToInterventionsMaintenance,
  persistInterventionMaintenance,
  deleteInterventionMaintenance,
  subscribeToControlesQualite,
  persistControleQualite,
  deleteControleQualite
} from './services/firestoreService';

export default function App() {
  const { user, profile, loading } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState<'synoptic' | 'erp' | 'mes' | 'planning' | 'quality' | 'traceability' | 'analytics' | 'connectivity' | 'csharp' | 'maintenance'>('synoptic');
  
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
  const [interventions, setInterventions] = useState<InterventionMaintenance[]>(INITIAL_INTERVENTIONS);
  const [controlesQualite, setControlesQualite] = useState<ControleQualiteLot[]>(INITIAL_CONTROLES_QUALITE);

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
  const qualityAlertCount = controlesQualite.filter(c => c.decision === 'EnQuarantaine' || c.decision === 'NonConforme').length;
  const telemetryAlertCount = React.useMemo(() => {
    return evaluateTelemetryAlerts(machines, loadTelemetryThresholds()).length;
  }, [machines]);

  // Real-time synchronization with Firestore (Database and Auth)
  useEffect(() => {
    // Only attach onSnapshot listeners if auth is ready and user is authenticated
    if (!user) return;

    const unsubOfs = subscribeToOrdresFabrication((cloudOfs) => {
      if (cloudOfs && cloudOfs.length > 0) {
        setOrdresFabrication(cloudOfs);
      }
    });

    const unsubMvts = subscribeToMouvementsStock((cloudMvts) => {
      if (cloudMvts && cloudMvts.length > 0) {
        setMouvementsStock(cloudMvts);
      }
    });

    const unsubMaint = subscribeToInterventionsMaintenance((cloudInterventions) => {
      if (cloudInterventions && cloudInterventions.length > 0) {
        setInterventions(cloudInterventions);
      }
    });

    const unsubQc = subscribeToControlesQualite((cloudQcs) => {
      if (cloudQcs && cloudQcs.length > 0) {
        setControlesQualite(cloudQcs);
      }
    });

    return () => {
      unsubOfs();
      unsubMvts();
      unsubMaint();
      unsubQc();
    };
  }, [user]);

  // Background industrial telemetry simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setMachines(prevMachines =>
        prevMachines.map(m => {
          if (m.statut !== 'EnMarche') return m;

          // Subtle natural fluctuation proportional to nominal speed
          const minCadence = Math.round(m.cadenceNominale * 0.82);
          const maxCadence = Math.round(m.cadenceNominale * 1.02);
          const deltaCadence = Math.floor(Math.random() * 7) - 3;
          const newCadence = Math.max(minCadence, Math.min(maxCadence, m.cadenceActuelle + deltaCadence));
          
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

      // Micro-fluctuations of live OEE metrics
      setOee(prev => {
        const deltaD = Math.random() * 0.2 - 0.1;
        const newD = Math.max(89.0, Math.min(95.5, Number((prev.disponibilite + deltaD).toFixed(1))));
        const deltaP = Math.random() * 0.4 - 0.2;
        const newP = Math.max(85.0, Math.min(93.0, Number((prev.performance + deltaP).toFixed(1))));
        const newQ = prev.qualite;
        const newTrs = Number(((newD / 100) * (newP / 100) * (newQ / 100) * 100).toFixed(1));
        return {
          ...prev,
          disponibilite: newD,
          performance: newP,
          trsGlobal: newTrs
        };
      });
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
    persistMouvementStock(newMvt, user?.uid);

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
    nouveauxMouvements.forEach(m => persistMouvementStock(m, user?.uid));

    // Update OF progression
    const totalProduit = ofTarget.quantiteProduite + quantiteRealisee;
    const estTermine = totalProduit >= ofTarget.quantiteCible;
    const updatedOf: OrdreFabrication = {
      ...ofTarget,
      quantiteProduite: totalProduit,
      quantiteRebutee: ofTarget.quantiteRebutee + quantiteRebuts,
      statut: estTermine ? 'Termine' : ofTarget.statut
    };

    setOrdresFabrication(prev =>
      prev.map(o => (o.id === ofId ? updatedOf : o))
    );
    persistOrdreFabrication(updatedOf, user?.uid);

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
    persistOrdreFabrication(created, user?.uid);
    showNotification(`OF ${created.numeroOF} créé avec succès.`, 'success');
  };

  // 7. Change OF status
  const handleChangerStatutOf = (ofId: number, nouveauStatut: OrdreFabrication['statut']) => {
    setOrdresFabrication(prev =>
      prev.map(o => {
        if (o.id === ofId) {
          const updated = { ...o, statut: nouveauStatut };
          persistOrdreFabrication(updated, user?.uid);
          return updated;
        }
        return o;
      })
    );
    showNotification(`Statut de l'OF mis à jour : ${nouveauStatut}`, 'info');
  };

  // 7b. Update OF Schedule (Drag & Drop or Manual adjustment)
  const handleUpdateOfSchedule = (ofId: number, newDate: string, newLineId?: number) => {
    let updatedOf: OrdreFabrication | undefined;
    setOrdresFabrication(prev =>
      prev.map(o => {
        if (o.id === ofId) {
          const updated: OrdreFabrication = {
            ...o,
            datePlanifiee: newDate,
            ligneProductionId: newLineId !== undefined ? newLineId : o.ligneProductionId
          };
          updatedOf = updated;
          persistOrdreFabrication(updated, user?.uid);
          return updated;
        }
        return o;
      })
    );

    const dObj = new Date(newDate);
    const dayFormatted = dObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    showNotification(
      `Planning Gantt mis à jour : ${updatedOf?.numeroOF || `OF #${ofId}`} reprogrammé au ${dayFormatted} (Ligne 0${newLineId || updatedOf?.ligneProductionId}).`,
      'success'
    );
  };

  // 8. Machine status change
  const handleMachineStateChange = (machineId: number, newStatut: MachineLigne['statut']) => {
    setMachines(prev =>
      prev.map(m => (m.id === machineId ? { ...m, statut: newStatut } : m))
    );
    showNotification(`État machine mis à jour : ${newStatut}`, 'info');
  };

  // 8b. Update machine full configuration (parameters, nominal speed, name, etc.)
  const handleUpdateMachine = (updatedMachine: MachineLigne) => {
    setMachines(prev =>
      prev.map(m => (m.id === updatedMachine.id ? updatedMachine : m))
    );
    showNotification(
      `Machine "${updatedMachine.nom}" reconfigurée avec succès : Cadence ${updatedMachine.cadenceNominale} U/h, Statut ${updatedMachine.statut}.`,
      'success'
    );
  };

  // 9. Maintenance intervention management
  const handleSaveIntervention = (newIntervention: InterventionMaintenance, remettreEnMarche: boolean) => {
    setInterventions(prev => [newIntervention, ...prev]);
    persistInterventionMaintenance(newIntervention, user?.uid);

    if (remettreEnMarche) {
      setMachines(prev =>
        prev.map(m => m.id === newIntervention.machineId ? { ...m, statut: 'EnMarche' } : m)
      );
    }

    showNotification(
      `Intervention ${newIntervention.id} consignée pour ${newIntervention.machineNom} (${newIntervention.technicien}).${remettreEnMarche ? ' Machine remise en service nominal.' : ''}`,
      'success'
    );
  };

  const handleDeleteIntervention = (interventionId: string) => {
    setInterventions(prev => prev.filter(i => i.id !== interventionId));
    deleteInterventionMaintenance(interventionId);
    showNotification(`Intervention ${interventionId} retirée du journal.`, 'info');
  };

  // 9b. Quality Control handlers
  const handleSaveControleQualite = (qc: ControleQualiteLot) => {
    setControlesQualite(prev => {
      const idx = prev.findIndex(item => item.id === qc.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = qc;
        return copy;
      }
      return [qc, ...prev];
    });

    persistControleQualite(qc, user?.uid);

    // Si le lot est mis en quarantaine, adapter le statut de l'OF correspondant
    if (qc.numeroOF || qc.numeroLot) {
      setOrdresFabrication(prevOfs =>
        prevOfs.map(ofItem => {
          if (ofItem.numeroOF === qc.numeroOF || ofItem.numeroLotFabrique === qc.numeroLot) {
            let nouveauStatut = ofItem.statut;
            if (qc.decision === 'EnQuarantaine' && ofItem.statut !== 'Termine') {
              nouveauStatut = 'Interrompu';
            } else if (qc.decision === 'Conforme' && ofItem.statut === 'ControleQualite') {
              nouveauStatut = 'Termine';
            }
            if (nouveauStatut !== ofItem.statut) {
              const updatedOf = { ...ofItem, statut: nouveauStatut };
              persistOrdreFabrication(updatedOf, user?.uid);
              return updatedOf;
            }
          }
          return ofItem;
        })
      );
    }

    if (qc.decision === 'EnQuarantaine' || qc.decision === 'NonConforme') {
      showNotification(
        `ALERTE QUALITÉ CRITIQUE : Le lot ${qc.numeroLot} a été placé EN QUARANTAINE pour non-conformité analytique. Blocage en atelier actif.`,
        'warning'
      );
    } else {
      showNotification(
        `Contrôle qualité enregistré : Lot ${qc.numeroLot} validé ${qc.decision} (${qc.articleDesignation}).`,
        'success'
      );
    }
  };

  const handleDeleteControleQualite = (id: string) => {
    setControlesQualite(prev => prev.filter(c => c.id !== id));
    deleteControleQualite(id);
    showNotification('Contrôle qualité retiré du registre.', 'info');
  };

  // 9c. Article & Raw Material management
  const handleSaveArticle = (
    articleToSave: Article, 
    ajustementStock?: { difference: number; motif: string }
  ) => {
    setArticles(prevArticles => {
      const exists = prevArticles.some(a => a.id === articleToSave.id);
      if (exists) {
        return prevArticles.map(a => a.id === articleToSave.id ? articleToSave : a);
      } else {
        return [...prevArticles, articleToSave];
      }
    });

    if (ajustementStock && ajustementStock.difference !== 0) {
      const nouveauMouvement: MouvementStock = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        articleId: articleToSave.id,
        quantite: Math.abs(ajustementStock.difference),
        typeMouvement: ajustementStock.difference > 0 ? 'Entree' : 'Sortie',
        referenceDocument: `AJUST-INV-${new Date().toISOString().slice(0, 10)}`,
        dateMouvement: new Date().toISOString(),
        details: `Ajustement d'inventaire : ${ajustementStock.motif || 'Mise à jour fiche article'}`
      };
      setMouvementsStock(prev => [nouveauMouvement, ...prev]);
      persistMouvementStock(nouveauMouvement, user?.uid);
    }

    showNotification(
      `Fiche article ${articleToSave.code} (${articleToSave.designation}) enregistrée avec succès.`,
      'success'
    );
  };

  // 10. Reset data
  const handleResetData = () => {
    setArticles(INITIAL_ARTICLES);
    setCommandesClients(INITIAL_COMMANDES_CLIENTS);
    setSuggestionsAchats(INITIAL_SUGGESTIONS_ACHATS);
    setBonsReceptions(INITIAL_BONS_RECEPTIONS);
    setMouvementsStock(INITIAL_MOUVEMENTS_STOCK);
    setOrdresFabrication(INITIAL_ORDRES_FABRICATION);
    setMachines(INITIAL_MACHINES);
    setOee(INITIAL_OEE);
    setInterventions(INITIAL_INTERVENTIONS);
    setControlesQualite(INITIAL_CONTROLES_QUALITE);
    showNotification("Données d'usine réinitialisées aux valeurs nominales du projet C#.", 'info');
  };

  // 0. Authentication loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="relative mb-4 animate-pulse">
          <BladyLogo className="w-20 h-20 drop-shadow-2xl" />
        </div>
        <div className="flex items-center space-x-3 text-slate-300 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Vérification des accès BladyProduction MES/ERP...</span>
        </div>
      </div>
    );
  }

  // 0. Gate all pages behind the authentication screen (displayed before any page)
  if (!user) {
    return <AuthScreen />;
  }

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
        qualityAlertCount={qualityAlertCount}
        telemetryAlertCount={telemetryAlertCount}
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
            onUpdateOee={(updated) => setOee(prev => ({ ...prev, ...updated }))}
            onOpenDeclareModal={() => handleOpenDeclareModal()}
            onUpdateMachine={handleUpdateMachine}
            onGoToErp={() => setActiveTab('erp')}
            onGoToMes={() => setActiveTab('mes')}
            onGoToCSharp={() => setActiveTab('csharp')}
            onGoToAnalytics={() => setActiveTab('analytics')}
            onGoToMaintenance={() => setActiveTab('maintenance')}
            onGoToPlanning={() => setActiveTab('planning')}
            onGoToQuality={() => setActiveTab('quality')}
            onGoToTraceability={() => setActiveTab('traceability')}
            onGoToConnectivity={() => setActiveTab('connectivity')}
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
            onGoToTraceability={() => setActiveTab('traceability')}
            onGoToMes={() => setActiveTab('mes')}
            onSaveArticle={handleSaveArticle}
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
            onGoToQuality={() => setActiveTab('quality')}
            onGoToTraceability={() => setActiveTab('traceability')}
            onGoToConnectivity={() => setActiveTab('connectivity')}
          />
        )}

        {activeTab === 'planning' && (
          <PlanningGanttView
            ordresFabrication={ordresFabrication}
            articles={articles}
            machines={machines}
            onUpdateOfSchedule={handleUpdateOfSchedule}
            onChangerStatutOf={handleChangerStatutOf}
            onCreerOf={() => setIsNewOfModalOpen(true)}
            onOpenDeclareModal={handleOpenDeclareModal}
          />
        )}

        {activeTab === 'quality' && (
          <QualityControlView
            controles={controlesQualite}
            articles={articles}
            ordresFabrication={ordresFabrication}
            onSaveControle={handleSaveControleQualite}
            onDeleteControle={handleDeleteControleQualite}
          />
        )}

        {activeTab === 'traceability' && (
          <TraceabilityView
            ordresFabrication={ordresFabrication}
            articles={articles}
            controlesQualite={controlesQualite}
            onGoToQuality={() => setActiveTab('quality')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            articles={articles}
            oee={oee}
            commandesClients={commandesClients}
            onGoToErp={() => setActiveTab('erp')}
            onGoToMes={() => setActiveTab('mes')}
            onGoToCSharp={() => setActiveTab('csharp')}
          />
        )}

        {activeTab === 'maintenance' && (
          <JournalMaintenance
            machines={machines}
            interventions={interventions}
            onSaveIntervention={handleSaveIntervention}
            onDeleteIntervention={handleDeleteIntervention}
            onMachineStateChange={handleMachineStateChange}
            onUpdateMachine={handleUpdateMachine}
          />
        )}

        {activeTab === 'connectivity' && (
          <IndustrialConnectivityView
            machines={machines}
            onMachineStateChange={handleMachineStateChange}
            onUpdateMachine={handleUpdateMachine}
            isLiveSimulating={isSimulating}
            interventions={interventions}
            onGoToMaintenance={() => setActiveTab('maintenance')}
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
