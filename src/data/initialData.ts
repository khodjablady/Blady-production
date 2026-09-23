import { Article, Nomenclature, CommandeClient, SuggestionAchat, BonReception, MouvementStock, OrdreFabrication, MachineLigne, OeeMetrics } from '../types';

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    code: 'PF-VIR-1000',
    designation: 'Solution Désinfectante Virucide Flacon 1000ml',
    stockTheorique: 450,
    uniteMesure: 'U',
    estComposant: false,
    seuilCritique: 300,
    quantiteStandardAchat: 500,
    fournisseurParDefautId: undefined,
    delaiLivraisonFournisseurJours: 0,
    densite: 0.885,
    capaciteVolumeLitres: 1.0,
    typeEmballage: 'Flacon PEHD 1L + Spray',
    prixUnitaireEstime: 4.85,
    emplacement: 'Magasin Expéditions - Allée D04'
  },
  {
    id: 2,
    code: 'PF-SAV-5000',
    designation: 'Savon Liquide Végétal Dermoprotect Bidon 5L',
    stockTheorique: 120,
    uniteMesure: 'U',
    estComposant: false,
    seuilCritique: 80,
    quantiteStandardAchat: 200,
    fournisseurParDefautId: undefined,
    delaiLivraisonFournisseurJours: 0,
    densite: 1.025,
    capaciteVolumeLitres: 5.0,
    typeEmballage: 'Bidon Gerbable 5L PEHD',
    prixUnitaireEstime: 14.20,
    emplacement: 'Magasin Expéditions - Allée D02'
  },
  {
    id: 3,
    code: 'MP-ETH-96',
    designation: 'Éthanol Surfin Industriel 96% v/v (Cuve 01)',
    stockTheorique: 1850,
    uniteMesure: 'L',
    estComposant: true,
    seuilCritique: 2500,
    quantiteStandardAchat: 2000,
    fournisseurParDefautId: 101,
    delaiLivraisonFournisseurJours: 3,
    densite: 0.806,
    capaciteVolumeLitres: 10000,
    typeEmballage: 'Cuve Inox Stationnaire 10 000L',
    prixUnitaireEstime: 1.65,
    emplacement: 'Parc Cuves MP - Cuve C-01'
  },
  {
    id: 4,
    code: 'MP-H2O2-30',
    designation: "Peroxyde d'Hydrogène 30% Qualité Process",
    stockTheorique: 380,
    uniteMesure: 'L',
    estComposant: true,
    seuilCritique: 200,
    quantiteStandardAchat: 500,
    fournisseurParDefautId: 102,
    delaiLivraisonFournisseurJours: 4,
    densite: 1.110,
    capaciteVolumeLitres: 1000,
    typeEmballage: 'IBC / GRV 1000L PEHD Palettisé',
    prixUnitaireEstime: 2.10,
    emplacement: 'Zone Réactifs Chimiques - GRV-03'
  },
  {
    id: 5,
    code: 'MP-GLY-99',
    designation: 'Glycérol Végétal 99.5% Codex (Haute Viscosité)',
    stockTheorique: 210,
    uniteMesure: 'L',
    estComposant: true,
    seuilCritique: 350,
    quantiteStandardAchat: 400,
    fournisseurParDefautId: 103,
    delaiLivraisonFournisseurJours: 5,
    densite: 1.261,
    capaciteVolumeLitres: 1000,
    typeEmballage: 'Fût Acier 200L avec Bonde',
    prixUnitaireEstime: 3.40,
    emplacement: 'Zone Matières Premières Fûts - Zone B'
  },
  {
    id: 6,
    code: 'MP-EAU-OSM',
    designation: 'Eau Purifiée Déminéralisée Ultra-Pure < 1µS',
    stockTheorique: 14500,
    uniteMesure: 'L',
    estComposant: true,
    seuilCritique: 4000,
    quantiteStandardAchat: 5000,
    fournisseurParDefautId: 104,
    delaiLivraisonFournisseurJours: 1,
    densite: 1.000,
    capaciteVolumeLitres: 25000,
    typeEmballage: 'Boucle Eau Osmosée Inox 316L',
    prixUnitaireEstime: 0.05,
    emplacement: 'Génération Fluides - Boucle Principale'
  },
  {
    id: 7,
    code: 'EMB-FLAC-1000',
    designation: 'Flacon PEHD Blanc 1000ml Bague 28/410',
    stockTheorique: 1100,
    uniteMesure: 'U',
    estComposant: true,
    seuilCritique: 1500,
    quantiteStandardAchat: 2000,
    fournisseurParDefautId: 105,
    delaiLivraisonFournisseurJours: 6,
    typeEmballage: 'Palette Carton 1200 Unités',
    prixUnitaireEstime: 0.38,
    emplacement: 'Magasin Emballages - Racks R-12'
  },
  {
    id: 8,
    code: 'EMB-BOUCH-SPRAY',
    designation: 'Bouchon Spray Gâchette Déclencheur Résistant Alcool',
    stockTheorique: 3200,
    uniteMesure: 'U',
    estComposant: true,
    seuilCritique: 1200,
    quantiteStandardAchat: 2500,
    fournisseurParDefautId: 105,
    delaiLivraisonFournisseurJours: 6,
    typeEmballage: 'Carton vrac 500 Pièces',
    prixUnitaireEstime: 0.45,
    emplacement: 'Magasin Emballages - Racks R-14'
  },
  {
    id: 9,
    code: 'EMB-ETIQ-VIR1L',
    designation: 'Bobine Étiquettes Synthétiques Virucide 1L (1000/bob)',
    stockTheorique: 4800,
    uniteMesure: 'U',
    estComposant: true,
    seuilCritique: 2000,
    quantiteStandardAchat: 5000,
    fournisseurParDefautId: 106,
    delaiLivraisonFournisseurJours: 4,
    typeEmballage: 'Bobine 1000 Étiquettes',
    prixUnitaireEstime: 0.08,
    emplacement: 'Armoire Consommables Imprimerie'
  }
];

export const INITIAL_NOMENCLATURES: Nomenclature[] = [
  // PF-VIR-1000 (Article ID 1) Formule & Composants
  {
    id: 1,
    articleParentId: 1,
    composantId: 3, // MP-ETH-96
    quantiteBesoinUnitaire: 0.833, // 833 ml d'éthanol par litre fini
    pourcentagePerteTolerable: 3.5 // Évaporation, purge pompe, fond de cuve
  },
  {
    id: 2,
    articleParentId: 1,
    composantId: 4, // MP-H2O2-30
    quantiteBesoinUnitaire: 0.042, // 42 ml
    pourcentagePerteTolerable: 2.0
  },
  {
    id: 3,
    articleParentId: 1,
    composantId: 5, // MP-GLY-99
    quantiteBesoinUnitaire: 0.015, // 15 ml
    pourcentagePerteTolerable: 4.5 // Fluide très visqueux, perte sur parois cuve
  },
  {
    id: 4,
    articleParentId: 1,
    composantId: 6, // MP-EAU-OSM
    quantiteBesoinUnitaire: 0.110, // 110 ml
    pourcentagePerteTolerable: 1.0
  },
  {
    id: 5,
    articleParentId: 1,
    composantId: 7, // EMB-FLAC-1000
    quantiteBesoinUnitaire: 1.0,
    pourcentagePerteTolerable: 1.2 // Flacons écrasés lors du calage régleuse
  },
  {
    id: 6,
    articleParentId: 1,
    composantId: 8, // EMB-BOUCH-SPRAY
    quantiteBesoinUnitaire: 1.0,
    pourcentagePerteTolerable: 0.5
  },
  {
    id: 7,
    articleParentId: 1,
    composantId: 9, // EMB-ETIQ-VIR1L
    quantiteBesoinUnitaire: 1.0,
    pourcentagePerteTolerable: 2.0 // Amorçage bobine étiqueteuse
  }
];

export const INITIAL_COMMANDES_CLIENTS: CommandeClient[] = [
  {
    id: 1,
    numeroCommande: 'CC-2026-0841',
    clientNom: 'Centre Hospitalier Universitaire Régional (CHUR)',
    dateCommande: '2026-09-18T08:30:00Z',
    statut: 'EnProduction',
    lignes: [
      {
        id: 101,
        commandeClientId: 1,
        articleId: 1,
        quantiteCommandee: 800,
        quantiteDejaProduite: 350,
        prixUnitaire: 4.85
      }
    ]
  },
  {
    id: 2,
    numeroCommande: 'CC-2026-0842',
    clientNom: 'Pharmavie Distribution Groupe SA',
    dateCommande: '2026-09-20T11:15:00Z',
    statut: 'EnAttente',
    lignes: [
      {
        id: 102,
        commandeClientId: 2,
        articleId: 1,
        quantiteCommandee: 1200,
        quantiteDejaProduite: 0,
        prixUnitaire: 4.60
      }
    ]
  },
  {
    id: 3,
    numeroCommande: 'CC-2026-0839',
    clientNom: 'Hygiène & Services Collectivités',
    dateCommande: '2026-09-15T14:20:00Z',
    statut: 'Expediee',
    lignes: [
      {
        id: 103,
        commandeClientId: 3,
        articleId: 2,
        quantiteCommandee: 200,
        quantiteDejaProduite: 200,
        prixUnitaire: 14.20
      }
    ]
  }
];

export const INITIAL_SUGGESTIONS_ACHATS: SuggestionAchat[] = [
  {
    id: 1,
    articleId: 3, // MP-ETH-96 (Stock 1850 < Seuil 2500, manque 650 => x1 de 2000L)
    quantiteSuggeree: 2000,
    dateSuggestion: '2026-09-21T05:00:00Z',
    statut: 'AValider',
    motif: 'Stock actuel (1850 L) inférieur au seuil critique (2500 L).',
    dateBesoinUsine: '2026-09-24T06:00:00Z',
    dateCommandeAuPlusTard: '2026-09-21T18:00:00Z'
  },
  {
    id: 2,
    articleId: 5, // MP-GLY-99 (Stock 210 < Seuil 350, manque 140 => x1 de 400L)
    quantiteSuggeree: 400,
    dateSuggestion: '2026-09-21T05:05:00Z',
    statut: 'AValider',
    motif: 'Stock actuel (210 L) inférieur au seuil critique (350 L).',
    dateBesoinUsine: '2026-09-26T08:00:00Z',
    dateCommandeAuPlusTard: '2026-09-21T16:00:00Z'
  },
  {
    id: 3,
    articleId: 7, // EMB-FLAC-1000 (Stock 1100 < Seuil 1500, manque 400 => x1 de 2000U)
    quantiteSuggeree: 2000,
    dateSuggestion: '2026-09-21T05:10:00Z',
    statut: 'AValider',
    motif: 'Stock actuel (1100 U) inférieur au seuil critique (1500 U).',
    dateBesoinUsine: '2026-09-27T08:00:00Z',
    dateCommandeAuPlusTard: '2026-09-21T12:00:00Z'
  }
];

export const INITIAL_BONS_RECEPTIONS: BonReception[] = [
  {
    id: 1,
    numeroBL: 'BL-FOURN-98421',
    commandeFournisseurId: 401,
    fournisseurNom: 'Chimex Pro Logistique',
    dateReception: '2026-09-19T09:40:00Z',
    recuPar: 'M. Laurent Dubois (Magasinier)',
    lignes: [
      {
        id: 501,
        bonReceptionId: 1,
        articleId: 4,
        quantiteCommandee: 500,
        quantiteRecue: 500,
        quantiteRejetee: 0,
        numeroLotFournisseur: 'LOT-CHIM-2026-09A'
      }
    ]
  }
];

export const INITIAL_MOUVEMENTS_STOCK: MouvementStock[] = [
  {
    id: 1,
    articleId: 4,
    quantite: 500,
    typeMouvement: 'Entree',
    referenceDocument: 'BL-FOURN-98421',
    numeroLot: 'LOT-CHIM-2026-09A',
    dateMouvement: '2026-09-19T09:45:00Z',
    details: 'Réception conforme certificat analyse'
  },
  {
    id: 2,
    articleId: 3,
    quantite: -294.5,
    typeMouvement: 'PostDeductionProduction',
    referenceDocument: 'OF-2026-104',
    numeroLot: 'LOT-ETH-2026-08',
    dateMouvement: '2026-09-20T16:30:00Z',
    details: 'Backflush automatique fabrication 350x PF-VIR-1000 (+3.5% perte)'
  }
];

export const INITIAL_ORDRES_FABRICATION: OrdreFabrication[] = [
  {
    id: 1,
    numeroOF: 'OF-2026-104',
    articleId: 1,
    quantiteCible: 800,
    quantiteProduite: 350,
    quantiteRebutee: 4,
    datePlanifiee: '2026-09-21T07:00:00Z',
    statut: 'EnConditionnement',
    ligneProductionId: 1,
    numeroLotFabrique: 'LOT-VIR-2609-A1',
    operateur: 'Julien Mercier',
    commandeClientId: 1,
    tempsCycleSecondes: 3.6, // 1000 flacons / h
    tempsProductionMinutes: 145
  },
  {
    id: 2,
    numeroOF: 'OF-2026-105',
    articleId: 1,
    quantiteCible: 1200,
    quantiteProduite: 0,
    quantiteRebutee: 0,
    datePlanifiee: '2026-09-22T06:00:00Z',
    statut: 'Planifie',
    ligneProductionId: 1,
    numeroLotFabrique: 'LOT-VIR-2609-B2',
    operateur: 'Équipe Matin (Poste 1)',
    commandeClientId: 2,
    tempsCycleSecondes: 3.6,
    tempsProductionMinutes: 0
  },
  {
    id: 3,
    numeroOF: 'OF-2026-103',
    articleId: 2,
    quantiteCible: 200,
    quantiteProduite: 200,
    quantiteRebutee: 1,
    datePlanifiee: '2026-09-17T08:00:00Z',
    statut: 'Termine',
    ligneProductionId: 2,
    numeroLotFabrique: 'LOT-SAV-2609-C3',
    operateur: 'Marc Vasseur',
    commandeClientId: 3,
    tempsCycleSecondes: 12.0,
    tempsProductionMinutes: 190
  }
];

export const INITIAL_MACHINES: MachineLigne[] = [
  {
    id: 1,
    nom: 'Cuve Réacteur Agité R-5000L (Mélange)',
    type: 'CuveMelange',
    cadenceNominale: 3000,
    cadenceActuelle: 2850,
    statut: 'EnMarche',
    temperatureC: 22.4,
    pressionBar: 1.25,
    niveauCuveLitres: 3450,
    capaciteMaxLitres: 5000,
    nodeOpcUa: 'ns=2;s=Cuve_Melange.Niveau'
  },
  {
    id: 2,
    nom: 'Homogénéisateur Haute Pression H-300',
    type: 'Homogeneiseur',
    cadenceNominale: 2500,
    cadenceActuelle: 2400,
    statut: 'EnMarche',
    temperatureC: 24.8,
    pressionBar: 140.0,
    nodeOpcUa: 'ns=2;s=Homogeneiseur.PressionBar'
  },
  {
    id: 3,
    nom: 'Remplisseuse Volumétrique Rotative 12 Becs',
    type: 'Remplisseuse',
    cadenceNominale: 1000,
    cadenceActuelle: 920,
    statut: 'EnMarche',
    temperatureC: 21.0,
    pressionBar: 2.1,
    nodeOpcUa: 'ns=2;s=Remplisseuse.CadenceFlaconsHeure'
  },
  {
    id: 4,
    nom: 'Boucheuse Automatique Servomoteur',
    type: 'Boucheuse',
    cadenceNominale: 1000,
    cadenceActuelle: 920,
    statut: 'EnMarche',
    nodeOpcUa: 'ns=2;s=Boucheuse.Statut'
  },
  {
    id: 5,
    nom: 'Étiqueteuse Linéaire Double Face Haute Vitesse',
    type: 'Etiqueteuse',
    cadenceNominale: 1100,
    cadenceActuelle: 920,
    statut: 'EnMarche',
    nodeOpcUa: 'ns=2;s=Etiqueteuse.Cadence'
  }
];

export const INITIAL_OEE: OeeMetrics = {
  disponibilite: 92.4, // %
  performance: 88.6,   // %
  qualite: 98.9,       // %
  trsGlobal: 80.9,     // 0.924 * 0.886 * 0.989 = 80.9%
  tempsOuvertureMin: 480,
  tempsArretMin: 36.5,
  piecesBonnes: 350,
  piecesRebuts: 4
};
