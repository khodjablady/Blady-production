import { DossierLotTracabilite } from '../types';

export const INITIAL_DOSSIERS_TRACABILITE: DossierLotTracabilite[] = [
  {
    id: 'TRAC-LOT-VIR-2609-A1',
    numeroLot: 'LOT-VIR-2609-A1',
    typeLot: 'ProduitFini',
    articleId: 1,
    articleCode: 'PF-VIR-1000',
    articleDesignation: 'Solution Désinfectante Virucide Flacon 1000ml',
    statutLot: 'Libere',
    ordreFabricationId: 1,
    numeroOF: 'OF-2026-104',
    ligneFabricationNom: 'LIGNE 01 - Conditionnement Flacons 1L',
    cuveFormulationNom: 'Cuve R-101 (Mélangeur Alcool Inox 316L)',
    dateFabrication: '2026-09-21T07:15:00Z',
    datePeremption: '2028-09-20T23:59:59Z',
    operateur: 'Julien Mercier (Opérateur certifié Poste 1)',
    volumeProduit: 350,
    uniteMesure: 'U',
    controleQualiteId: 'QC-2026-091',
    decisionQualite: 'Conforme',
    remarquesAudit: 'Fabrication nominale conforme BPF. Analyse libératoire validée par le Dr. Moreau (CoA-2026-091 émis).',
    composantsConsommes: [
      {
        composantArticleId: 3,
        composantCode: 'MP-ETH-96',
        composantDesignation: 'Éthanol Rectifié 96% Vrac (Alcool Surfin)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'LOT-ETH-2026-08',
        fournisseurNom: 'Chimex Pro Logistique',
        numeroBL: 'BL-FOURN-98421',
        dateReceptionOuMelange: '2026-09-19T09:40:00Z',
        quantiteConsommee: 294.5,
        unite: 'L',
        quantiteTheorique: 291.5,
        ecartPourcent: +1.03,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-CHIM-9821'
      },
      {
        composantArticleId: 5,
        composantCode: 'MP-GLY-99',
        composantDesignation: 'Glycérine Végétale Pure USP/Codex 99.5%',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'LOT-GLY-2026-14',
        fournisseurNom: 'BioOleo France',
        numeroBL: 'BL-BIO-4401',
        dateReceptionOuMelange: '2026-09-18T14:20:00Z',
        quantiteConsommee: 5.25,
        unite: 'L',
        quantiteTheorique: 5.25,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-BIO-3312'
      },
      {
        composantArticleId: 6,
        composantCode: 'MP-EAU-OSM',
        composantDesignation: 'Eau Purifiée Haute Pureté Pharmacopée (Boucle Inox)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'EAU-OSM-2609-01',
        fournisseurNom: 'Génération Interne Usine (Boucle Osmoseur)',
        numeroBL: 'INT-OSM-2609',
        dateReceptionOuMelange: '2026-09-21T06:00:00Z',
        quantiteConsommee: 50.2,
        unite: 'L',
        quantiteTheorique: 50.0,
        ecartPourcent: +0.40,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CONTROLE-BOUCLE-0921'
      },
      {
        composantArticleId: 7,
        composantCode: 'EMB-FLAC-1000',
        composantDesignation: 'Flacon PEHD Blanc Opaque 1000ml Bague 28/410',
        typeComposant: 'Emballage',
        numeroLotFournisseurOuInterne: 'LOT-FLAC-2609-88',
        fournisseurNom: 'Plastipak Industries France',
        numeroBL: 'BL-PLAST-7721',
        dateReceptionOuMelange: '2026-09-17T11:00:00Z',
        quantiteConsommee: 354,
        unite: 'U',
        quantiteTheorique: 350,
        ecartPourcent: +1.14,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-ALIM-PLAST-881'
      },
      {
        composantArticleId: 8,
        composantCode: 'EMB-BOUCH-SPRAY',
        composantDesignation: 'Bouchon Spray Gâchette Déclencheur Résistant Alcool',
        typeComposant: 'Emballage',
        numeroLotFournisseurOuInterne: 'LOT-BOUCH-902',
        fournisseurNom: 'Plastipak Industries France',
        numeroBL: 'BL-PLAST-7721',
        dateReceptionOuMelange: '2026-09-17T11:00:00Z',
        quantiteConsommee: 352,
        unite: 'U',
        quantiteTheorique: 350,
        ecartPourcent: +0.57,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-ETANCH-902'
      },
      {
        composantArticleId: 9,
        composantCode: 'EMB-ETIQ-VIR1L',
        composantDesignation: 'Bobine Étiquettes Synthétiques Virucide 1L (1000/bob)',
        typeComposant: 'Emballage',
        numeroLotFournisseurOuInterne: 'LOT-ETIQ-551',
        fournisseurNom: 'Imprimerie Sécurisée Graphix',
        numeroBL: 'BL-GRA-1201',
        dateReceptionOuMelange: '2026-09-16T16:30:00Z',
        quantiteConsommee: 350,
        unite: 'U',
        quantiteTheorique: 350,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'BAT-CONFORME-551'
      }
    ],
    expeditionsClients: [
      {
        commandeId: 1,
        numeroCommande: 'CC-2026-001',
        clientNom: 'Clinique Chirurgicale Saint-Augustin (Bordeaux)',
        dateExpedition: '2026-09-21T14:30:00Z',
        quantiteExpediee: 200,
        statutExpedition: 'Livre',
        bonLivraisonRef: 'BL-EXP-2026-881'
      }
    ]
  },
  {
    id: 'TRAC-LOT-VIR-2609-B2',
    numeroLot: 'LOT-VIR-2609-B2',
    typeLot: 'ProduitFini',
    articleId: 1,
    articleCode: 'PF-VIR-1000',
    articleDesignation: 'Solution Désinfectante Virucide Flacon 1000ml',
    statutLot: 'EnFabrication',
    ordreFabricationId: 2,
    numeroOF: 'OF-2026-105',
    ligneFabricationNom: 'LIGNE 01 - Conditionnement Flacons 1L',
    cuveFormulationNom: 'Cuve R-101 (Mélangeur Alcool Inox 316L)',
    dateFabrication: '2026-09-21T11:00:00Z',
    datePeremption: '2028-09-21T23:59:59Z',
    operateur: 'Équipe Matin (Poste 1 - Julien M.)',
    volumeProduit: 720,
    uniteMesure: 'U',
    controleQualiteId: 'QC-2026-093',
    decisionQualite: 'Conforme',
    remarquesAudit: 'Conditionnement en cours. Alerte de vigilance sur la viscosité dynamique (proche seuil bas 1.08 cP).',
    composantsConsommes: [
      {
        composantArticleId: 3,
        composantCode: 'MP-ETH-96',
        composantDesignation: 'Éthanol Rectifié 96% Vrac (Alcool Surfin)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'LOT-ETH-2026-08', // Shared lot!
        fournisseurNom: 'Chimex Pro Logistique',
        numeroBL: 'BL-FOURN-98421',
        dateReceptionOuMelange: '2026-09-19T09:40:00Z',
        quantiteConsommee: 605.0,
        unite: 'L',
        quantiteTheorique: 599.8,
        ecartPourcent: +0.87,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-CHIM-9821'
      },
      {
        composantArticleId: 5,
        composantCode: 'MP-GLY-99',
        composantDesignation: 'Glycérine Végétale Pure USP/Codex 99.5%',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'LOT-GLY-2026-14',
        fournisseurNom: 'BioOleo France',
        numeroBL: 'BL-BIO-4401',
        dateReceptionOuMelange: '2026-09-18T14:20:00Z',
        quantiteConsommee: 10.8,
        unite: 'L',
        quantiteTheorique: 10.8,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-BIO-3312'
      },
      {
        composantArticleId: 6,
        composantCode: 'MP-EAU-OSM',
        composantDesignation: 'Eau Purifiée Haute Pureté Pharmacopée (Boucle Inox)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'EAU-OSM-2609-02',
        fournisseurNom: 'Génération Interne Usine (Boucle Osmoseur)',
        numeroBL: 'INT-OSM-2609',
        dateReceptionOuMelange: '2026-09-21T09:30:00Z',
        quantiteConsommee: 103.5,
        unite: 'L',
        quantiteTheorique: 102.9,
        ecartPourcent: +0.58,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CONTROLE-BOUCLE-0921-B'
      },
      {
        composantArticleId: 7,
        composantCode: 'EMB-FLAC-1000',
        composantDesignation: 'Flacon PEHD Blanc Opaque 1000ml Bague 28/410',
        typeComposant: 'Emballage',
        numeroLotFournisseurOuInterne: 'LOT-FLAC-2609-88',
        fournisseurNom: 'Plastipak Industries France',
        numeroBL: 'BL-PLAST-7721',
        dateReceptionOuMelange: '2026-09-17T11:00:00Z',
        quantiteConsommee: 728,
        unite: 'U',
        quantiteTheorique: 720,
        ecartPourcent: +1.11,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-ALIM-PLAST-881'
      },
      {
        composantArticleId: 8,
        composantCode: 'EMB-BOUCH-SPRAY',
        composantDesignation: 'Bouchon Spray Gâchette Déclencheur Résistant Alcool',
        typeComposant: 'Emballage',
        numeroLotFournisseurOuInterne: 'LOT-BOUCH-902',
        fournisseurNom: 'Plastipak Industries France',
        numeroBL: 'BL-PLAST-7721',
        dateReceptionOuMelange: '2026-09-17T11:00:00Z',
        quantiteConsommee: 725,
        unite: 'U',
        quantiteTheorique: 720,
        ecartPourcent: +0.69,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-ETANCH-902'
      },
      {
        composantArticleId: 9,
        composantCode: 'EMB-ETIQ-VIR1L',
        composantDesignation: 'Bobine Étiquettes Synthétiques Virucide 1L (1000/bob)',
        typeComposant: 'Emballage',
        numeroLotFournisseurOuInterne: 'LOT-ETIQ-551',
        fournisseurNom: 'Imprimerie Sécurisée Graphix',
        numeroBL: 'BL-GRA-1201',
        dateReceptionOuMelange: '2026-09-16T16:30:00Z',
        quantiteConsommee: 720,
        unite: 'U',
        quantiteTheorique: 720,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'BAT-CONFORME-551'
      }
    ],
    expeditionsClients: [
      {
        commandeId: 2,
        numeroCommande: 'CC-2026-002',
        clientNom: 'CHU Hôpitaux Universitaires Régionaux (Lyon)',
        dateExpedition: '2026-09-22T08:00:00Z',
        quantiteExpediee: 720,
        statutExpedition: 'EnPreparation',
        bonLivraisonRef: 'BL-EXP-2026-895'
      }
    ]
  },
  {
    id: 'TRAC-LOT-SAV-2609-D4',
    numeroLot: 'LOT-SAV-2609-D4',
    typeLot: 'ProduitFini',
    articleId: 2,
    articleCode: 'PF-SAV-5000',
    articleDesignation: 'Savon Liquide Végétal Dermoprotect Bidon 5L',
    statutLot: 'EnQuarantaine',
    ordreFabricationId: 5,
    numeroOF: 'OF-2026-107',
    ligneFabricationNom: 'LIGNE 02 - Conditionnement Bidons 5L',
    cuveFormulationNom: 'Cuve R-102 (Réacteur Saponification & Mélange)',
    dateFabrication: '2026-09-21T08:30:00Z',
    datePeremption: '2029-03-21T23:59:59Z',
    operateur: 'Sophie Girard (Responsable Ligne Liquides)',
    volumeProduit: 120,
    uniteMesure: 'U',
    controleQualiteId: 'QC-2026-092',
    decisionQualite: 'EnQuarantaine',
    remarquesAudit: '🔴 LOT EN QUARANTAINE IMMÉDIATE : pH mesuré à 10.75 (limite max 10.40) et viscosité à 385 cP (limite min 400 cP). Blocage informatique ERP/MES actif. Expédition interdite.',
    composantsConsommes: [
      {
        composantArticleId: 4,
        composantCode: 'MP-HUI-COCO',
        composantDesignation: 'Huile de Coprah Végétale Vrac (Saponification)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'LOT-HUI-COCO-771',
        fournisseurNom: 'SapoHuiles Bio Méditerranée',
        numeroBL: 'BL-SAPO-3310',
        dateReceptionOuMelange: '2026-09-15T10:15:00Z',
        quantiteConsommee: 135.0,
        unite: 'L',
        quantiteTheorique: 132.0,
        ecartPourcent: +2.27,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-SAPO-771'
      },
      {
        composantArticleId: 6,
        composantCode: 'MP-EAU-OSM',
        composantDesignation: 'Eau Purifiée Haute Pureté Pharmacopée (Boucle Inox)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'EAU-OSM-2609-01',
        fournisseurNom: 'Génération Interne Usine (Boucle Osmoseur)',
        numeroBL: 'INT-OSM-2609',
        dateReceptionOuMelange: '2026-09-21T06:00:00Z',
        quantiteConsommee: 468.0,
        unite: 'L',
        quantiteTheorique: 468.0,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CONTROLE-BOUCLE-0921'
      }
    ],
    expeditionsClients: [] // Blocked: zero shipped!
  },
  {
    id: 'TRAC-LOT-SAV-2609-E1',
    numeroLot: 'LOT-SAV-2609-E1',
    typeLot: 'ProduitFini',
    articleId: 2,
    articleCode: 'PF-SAV-5000',
    articleDesignation: 'Savon Liquide Végétal Dermoprotect Bidon 5L',
    statutLot: 'Libere',
    ordreFabricationId: 3,
    numeroOF: 'OF-2026-103',
    ligneFabricationNom: 'LIGNE 02 - Conditionnement Bidons 5L',
    cuveFormulationNom: 'Cuve R-102 (Réacteur Saponification & Mélange)',
    dateFabrication: '2026-09-18T13:00:00Z',
    datePeremption: '2029-03-18T23:59:59Z',
    operateur: 'Marc Vasseur',
    volumeProduit: 200,
    uniteMesure: 'U',
    controleQualiteId: 'QC-2026-088',
    decisionQualite: 'Conforme',
    remarquesAudit: 'Lot entièrement libéré et expédié.',
    composantsConsommes: [
      {
        composantArticleId: 4,
        composantCode: 'MP-HUI-COCO',
        composantDesignation: 'Huile de Coprah Végétale Vrac (Saponification)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'LOT-HUI-COCO-770',
        fournisseurNom: 'SapoHuiles Bio Méditerranée',
        numeroBL: 'BL-SAPO-3105',
        dateReceptionOuMelange: '2026-09-10T08:00:00Z',
        quantiteConsommee: 220.0,
        unite: 'L',
        quantiteTheorique: 220.0,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CERT-SAPO-770'
      },
      {
        composantArticleId: 6,
        composantCode: 'MP-EAU-OSM',
        composantDesignation: 'Eau Purifiée Haute Pureté Pharmacopée (Boucle Inox)',
        typeComposant: 'MatierePremiere',
        numeroLotFournisseurOuInterne: 'EAU-OSM-2609-01',
        fournisseurNom: 'Génération Interne Usine (Boucle Osmoseur)',
        numeroBL: 'INT-OSM-2609',
        dateReceptionOuMelange: '2026-09-18T12:00:00Z',
        quantiteConsommee: 780.0,
        unite: 'L',
        quantiteTheorique: 780.0,
        ecartPourcent: 0.0,
        statutConformiteMatiere: 'Conforme',
        certificatFournisseurRef: 'CONTROLE-BOUCLE-0918'
      }
    ],
    expeditionsClients: [
      {
        commandeId: 3,
        numeroCommande: 'CC-2026-003',
        clientNom: 'Centrale Distribution Hygiène Pro (Nantes)',
        dateExpedition: '2026-09-19T10:00:00Z',
        quantiteExpediee: 200,
        statutExpedition: 'Livre',
        bonLivraisonRef: 'BL-EXP-2026-850'
      }
    ]
  }
];

export interface ComponentTraceIndexItem {
  numeroLotMatiere: string;
  articleCode: string;
  articleDesignation: string;
  fournisseurNom: string;
  numeroBL: string;
  dateReception: string;
  certificatFournisseurRef?: string;
  statutMatiere: 'Conforme' | 'Alerte' | 'EnQuarantaine';
  // Finished product batches where this component was incorporated
  lotsProduitsFinisImpactes: {
    dossierId: string;
    numeroLotFini: string;
    articleDesignation: string;
    numeroOF: string;
    dateFabrication: string;
    quantiteConsommee: number;
    unite: string;
    volumeTotalProduit: number;
    statutLotFini: string;
    expeditions: {
      clientNom: string;
      quantiteExpediee: number;
      numeroCommande: string;
      dateExpedition: string;
    }[];
  }[];
}

/**
 * Helper to build the reverse (Upward) index of all component batches
 * to track which finished lots incorporated them.
 */
export function buildUpwardComponentTraceIndex(
  dossiers: DossierLotTracabilite[]
): ComponentTraceIndexItem[] {
  const map = new Map<string, ComponentTraceIndexItem>();

  dossiers.forEach(dossier => {
    dossier.composantsConsommes.forEach(comp => {
      const lotKey = comp.numeroLotFournisseurOuInterne;
      if (!map.has(lotKey)) {
        map.set(lotKey, {
          numeroLotMatiere: lotKey,
          articleCode: comp.composantCode,
          articleDesignation: comp.composantDesignation,
          fournisseurNom: comp.fournisseurNom,
          numeroBL: comp.numeroBL,
          dateReception: comp.dateReceptionOuMelange,
          certificatFournisseurRef: comp.certificatFournisseurRef,
          statutMatiere: comp.statutConformiteMatiere,
          lotsProduitsFinisImpactes: []
        });
      }

      const item = map.get(lotKey)!;
      // Add reference to this finished lot
      item.lotsProduitsFinisImpactes.push({
        dossierId: dossier.id,
        numeroLotFini: dossier.numeroLot,
        articleDesignation: dossier.articleDesignation,
        numeroOF: dossier.numeroOF || 'OF-N/A',
        dateFabrication: dossier.dateFabrication,
        quantiteConsommee: comp.quantiteConsommee,
        unite: comp.unite,
        volumeTotalProduit: dossier.volumeProduit,
        statutLotFini: dossier.statutLot,
        expeditions: dossier.expeditionsClients.map(e => ({
          clientNom: e.clientNom,
          quantiteExpediee: e.quantiteExpediee,
          numeroCommande: e.numeroCommande,
          dateExpedition: e.dateExpedition
        }))
      });
    });
  });

  return Array.from(map.values());
}
