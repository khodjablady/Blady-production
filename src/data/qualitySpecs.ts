import { ParametreControle, ControleQualiteLot, StatutParametre, DecisionQualite } from '../types';

export interface QualitySpecTemplate {
  articleId: number;
  articleCode: string;
  articleDesignation: string;
  parametresDefaut: Omit<ParametreControle, 'valeurMesuree' | 'statut' | 'ecartPourcentage'>[];
}

export const QUALITY_SPEC_TEMPLATES: Record<string, QualitySpecTemplate> = {
  'PF-VIR-1000': {
    articleId: 1,
    articleCode: 'PF-VIR-1000',
    articleDesignation: 'Solution Désinfectante Virucide Flacon 1000ml',
    parametresDefaut: [
      {
        id: 'param-ph',
        code: 'PH',
        nom: 'pH à 20°C',
        unite: 'pH',
        valeurCible: 7.20,
        toleranceMin: 6.80,
        toleranceMax: 7.60,
        commentaire: 'Stabilité formule virucide & tolérance cutanée'
      },
      {
        id: 'param-visc',
        code: 'VISCOSITE',
        nom: 'Viscosité dynamique (20°C)',
        unite: 'cP',
        valeurCible: 1.50,
        toleranceMin: 1.00,
        toleranceMax: 2.50,
        commentaire: 'Fluidité pulvérisation et remplissage haute vitesse'
      },
      {
        id: 'param-dens',
        code: 'DENSITE',
        nom: 'Masse Volumique / Densité relative',
        unite: 'g/cm³',
        valeurCible: 0.875,
        toleranceMin: 0.860,
        toleranceMax: 0.890,
        commentaire: 'Pycnomètre étalonné 20°C'
      },
      {
        id: 'param-alcool',
        code: 'ALCOOL',
        nom: 'Titre Alcoométrique Volumique',
        unite: '% vol',
        valeurCible: 75.0,
        toleranceMin: 72.0,
        toleranceMax: 78.0,
        commentaire: 'Efficacité virucide certifiée EN 14476'
      },
      {
        id: 'param-temp',
        code: 'TEMPERATURE',
        nom: "Température de l'échantillon",
        unite: '°C',
        valeurCible: 20.0,
        toleranceMin: 18.0,
        toleranceMax: 22.0,
        commentaire: 'Condition de mesure normalisée laboratoire'
      }
    ]
  },
  'PF-SAV-5000': {
    articleId: 2,
    articleCode: 'PF-SAV-5000',
    articleDesignation: 'Savon Liquide Végétal Dermoprotect Bidon 5L',
    parametresDefaut: [
      {
        id: 'param-ph',
        code: 'PH',
        nom: 'pH à 20°C',
        unite: 'pH',
        valeurCible: 9.80,
        toleranceMin: 9.20,
        toleranceMax: 10.40,
        commentaire: 'Neutralisation saponification à froid'
      },
      {
        id: 'param-visc',
        code: 'VISCOSITE',
        nom: 'Viscosité Brookfield (Mobile 3, 20 RPM)',
        unite: 'cP',
        valeurCible: 480,
        toleranceMin: 400,
        toleranceMax: 560,
        commentaire: 'Texture onctueuse & pompabilité bidon 5L'
      },
      {
        id: 'param-dens',
        code: 'DENSITE',
        nom: 'Masse Volumique / Densité relative',
        unite: 'g/cm³',
        valeurCible: 1.025,
        toleranceMin: 1.015,
        toleranceMax: 1.035,
        commentaire: 'Contrôle aération & masse homogène'
      },
      {
        id: 'param-active',
        code: 'MATIERE_ACTIVE',
        nom: 'Teneur en Matière Active Lavante',
        unite: '%',
        valeurCible: 18.0,
        toleranceMin: 16.5,
        toleranceMax: 19.5,
        commentaire: 'Pouvoir moussant et détergent'
      },
      {
        id: 'param-temp',
        code: 'TEMPERATURE',
        nom: "Température de l'échantillon",
        unite: '°C',
        valeurCible: 20.0,
        toleranceMin: 18.0,
        toleranceMax: 22.0,
        commentaire: 'Bain thermostaté'
      }
    ]
  }
};

/**
 * Helper to compute status and % deviation of a measurement
 */
export function evaluateParameterStatus(
  valeurMesuree: number,
  toleranceMin: number,
  toleranceMax: number,
  valeurCible: number
): { statut: StatutParametre; ecartPourcentage: number } {
  const ecart = valeurCible !== 0 
    ? Number((((valeurMesuree - valeurCible) / valeurCible) * 100).toFixed(2))
    : 0;

  // Check out of bounds (Strict tolerance)
  if (valeurMesuree < toleranceMin || valeurMesuree > toleranceMax) {
    return { statut: 'Critique', ecartPourcentage: ecart };
  }

  // Warning margin (within 10% of min or max bound)
  const range = toleranceMax - toleranceMin;
  const marginWarning = range * 0.12;

  if (
    valeurMesuree <= toleranceMin + marginWarning ||
    valeurMesuree >= toleranceMax - marginWarning
  ) {
    return { statut: 'Alerte', ecartPourcentage: ecart };
  }

  return { statut: 'Conforme', ecartPourcentage: ecart };
}

/**
 * Seed initial Quality Control inspection data
 */
export const INITIAL_CONTROLES_QUALITE: ControleQualiteLot[] = [
  {
    id: 'QC-2026-091',
    numeroLot: 'LOT-VIR-2609-A1',
    ordreFabricationId: 1,
    numeroOF: 'OF-2026-104',
    articleId: 1,
    articleCode: 'PF-VIR-1000',
    articleDesignation: 'Solution Désinfectante Virucide Flacon 1000ml',
    dateControle: '2026-09-21T09:15:00Z',
    inspecteur: 'Dr. Cécile Moreau (Resp. CQ)',
    phaseControle: 'LiberationLot',
    parametres: [
      {
        id: 'p1',
        code: 'PH',
        nom: 'pH à 20°C',
        unite: 'pH',
        valeurCible: 7.20,
        toleranceMin: 6.80,
        toleranceMax: 7.60,
        valeurMesuree: 7.18,
        statut: 'Conforme',
        ecartPourcentage: -0.28,
        commentaire: 'Stabilité parfaite du tampon'
      },
      {
        id: 'p2',
        code: 'VISCOSITE',
        nom: 'Viscosité dynamique (20°C)',
        unite: 'cP',
        valeurCible: 1.50,
        toleranceMin: 1.00,
        toleranceMax: 2.50,
        valeurMesuree: 1.55,
        statut: 'Conforme',
        ecartPourcentage: +3.33,
        commentaire: 'Rhéologie conforme'
      },
      {
        id: 'p3',
        code: 'DENSITE',
        nom: 'Masse Volumique / Densité relative',
        unite: 'g/cm³',
        valeurCible: 0.875,
        toleranceMin: 0.860,
        toleranceMax: 0.890,
        valeurMesuree: 0.876,
        statut: 'Conforme',
        ecartPourcentage: +0.11,
        commentaire: 'Pycnomètre certifié'
      },
      {
        id: 'p4',
        code: 'ALCOOL',
        nom: 'Titre Alcoométrique Volumique',
        unite: '% vol',
        valeurCible: 75.0,
        toleranceMin: 72.0,
        toleranceMax: 78.0,
        valeurMesuree: 75.2,
        statut: 'Conforme',
        ecartPourcentage: +0.27,
        commentaire: 'Conforme EN 14476'
      },
      {
        id: 'p5',
        code: 'TEMPERATURE',
        nom: "Température de l'échantillon",
        unite: '°C',
        valeurCible: 20.0,
        toleranceMin: 18.0,
        toleranceMax: 22.0,
        valeurMesuree: 20.1,
        statut: 'Conforme',
        ecartPourcentage: +0.50
      }
    ],
    aspectVisuel: 'Conforme',
    decision: 'Conforme',
    conforme: true,
    alertesCount: 0,
    critiquesCount: 0,
    certificatConformiteGenere: true,
    remarques: 'Lot entièrement conforme aux spécifications pharmacopée. Libération accordée pour conditionnement et expédition.',
    createdBy: 'system',
    createdAt: '2026-09-21T09:20:00Z'
  },
  {
    id: 'QC-2026-092',
    numeroLot: 'LOT-SAV-2609-D4',
    ordreFabricationId: 5,
    numeroOF: 'OF-2026-107',
    articleId: 2,
    articleCode: 'PF-SAV-5000',
    articleDesignation: 'Savon Liquide Végétal Dermoprotect Bidon 5L',
    dateControle: '2026-09-21T10:45:00Z',
    inspecteur: 'Karim Belkacem (Technicien Labo)',
    phaseControle: 'CuveMelange',
    parametres: [
      {
        id: 'p1',
        code: 'PH',
        nom: 'pH à 20°C',
        unite: 'pH',
        valeurCible: 9.80,
        toleranceMin: 9.20,
        toleranceMax: 10.40,
        valeurMesuree: 10.75, // OUT OF TOLERANCE!
        statut: 'Critique',
        ecartPourcentage: +9.69,
        commentaire: 'DÉPASSEMENT SEUIL MAX (10.40) : Excès de soude de saponification non neutralisé'
      },
      {
        id: 'p2',
        code: 'VISCOSITE',
        nom: 'Viscosité Brookfield (Mobile 3, 20 RPM)',
        unite: 'cP',
        valeurCible: 480,
        toleranceMin: 400,
        toleranceMax: 560,
        valeurMesuree: 385, // OUT OF TOLERANCE!
        statut: 'Critique',
        ecartPourcentage: -19.79,
        commentaire: 'SOUS LE MINIMUM (400 cP) : Viscosité insuffisante'
      },
      {
        id: 'p3',
        code: 'DENSITE',
        nom: 'Masse Volumique / Densité relative',
        unite: 'g/cm³',
        valeurCible: 1.025,
        toleranceMin: 1.015,
        toleranceMax: 1.035,
        valeurMesuree: 1.027,
        statut: 'Conforme',
        ecartPourcentage: +0.20
      },
      {
        id: 'p4',
        code: 'MATIERE_ACTIVE',
        nom: 'Teneur en Matière Active Lavante',
        unite: '%',
        valeurCible: 18.0,
        toleranceMin: 16.5,
        toleranceMax: 19.5,
        valeurMesuree: 17.1,
        statut: 'Conforme',
        ecartPourcentage: -5.00
      },
      {
        id: 'p5',
        code: 'TEMPERATURE',
        nom: "Température de l'échantillon",
        unite: '°C',
        valeurCible: 20.0,
        toleranceMin: 18.0,
        toleranceMax: 22.0,
        valeurMesuree: 21.8,
        statut: 'Alerte',
        ecartPourcentage: +9.00,
        commentaire: 'Cuve encore tiède en fin de cycle thermique'
      }
    ],
    aspectVisuel: 'TurbiditeAnormale',
    decision: 'EnQuarantaine',
    conforme: false,
    alertesCount: 1,
    critiquesCount: 2,
    certificatConformiteGenere: false,
    remarques: 'ALERTE QUALITÉ CRITIQUE : Cuve R-102 mise en quarantaine immédiate. Action corrective requise : injection acide citrique 10% pour ramener le pH < 10.0 et ajustement du sel viscosant.',
    createdBy: 'system',
    createdAt: '2026-09-21T10:50:00Z'
  },
  {
    id: 'QC-2026-093',
    numeroLot: 'LOT-VIR-2609-B2',
    ordreFabricationId: 2,
    numeroOF: 'OF-2026-105',
    articleId: 1,
    articleCode: 'PF-VIR-1000',
    articleDesignation: 'Solution Désinfectante Virucide Flacon 1000ml',
    dateControle: '2026-09-21T11:30:00Z',
    inspecteur: 'Dr. Cécile Moreau (Resp. CQ)',
    phaseControle: 'EnCoursFabrication',
    parametres: [
      {
        id: 'p1',
        code: 'PH',
        nom: 'pH à 20°C',
        unite: 'pH',
        valeurCible: 7.20,
        toleranceMin: 6.80,
        toleranceMax: 7.60,
        valeurMesuree: 7.25,
        statut: 'Conforme',
        ecartPourcentage: +0.69
      },
      {
        id: 'p2',
        code: 'VISCOSITE',
        nom: 'Viscosité dynamique (20°C)',
        unite: 'cP',
        valeurCible: 1.50,
        toleranceMin: 1.00,
        toleranceMax: 2.50,
        valeurMesuree: 1.08,
        statut: 'Alerte', // Close to lower bound 1.00
        ecartPourcentage: -28.0,
        commentaire: 'Proche borne minimale (1.00 cP) - À surveiller sur les flacons suivants'
      },
      {
        id: 'p3',
        code: 'DENSITE',
        nom: 'Masse Volumique / Densité relative',
        unite: 'g/cm³',
        valeurCible: 0.875,
        toleranceMin: 0.860,
        toleranceMax: 0.890,
        valeurMesuree: 0.878,
        statut: 'Conforme',
        ecartPourcentage: +0.34
      },
      {
        id: 'p4',
        code: 'ALCOOL',
        nom: 'Titre Alcoométrique Volumique',
        unite: '% vol',
        valeurCible: 75.0,
        toleranceMin: 72.0,
        toleranceMax: 78.0,
        valeurMesuree: 74.8,
        statut: 'Conforme',
        ecartPourcentage: -0.27
      },
      {
        id: 'p5',
        code: 'TEMPERATURE',
        nom: "Température de l'échantillon",
        unite: '°C',
        valeurCible: 20.0,
        toleranceMin: 18.0,
        toleranceMax: 22.0,
        valeurMesuree: 19.8,
        statut: 'Conforme',
        ecartPourcentage: -1.00
      }
    ],
    aspectVisuel: 'Conforme',
    decision: 'Conforme',
    conforme: true,
    alertesCount: 1,
    critiquesCount: 0,
    certificatConformiteGenere: false,
    remarques: 'Contrôle intermédiaire en ligne de conditionnement satisfaisant. Viscosité sous surveillance rapprochée.',
    createdBy: 'system',
    createdAt: '2026-09-21T11:35:00Z'
  }
];
