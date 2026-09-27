export type UnitType = 'L' | 'KG' | 'U';

export interface Article {
  id: number;
  code: string;
  designation: string;
  stockTheorique: number;
  uniteMesure: UnitType;
  estComposant: boolean;
  seuilCritique: number;
  quantiteStandardAchat: number;
  fournisseurParDefautId?: number;
  delaiLivraisonFournisseurJours: number;
  densite?: number;
  capaciteVolumeLitres?: number;
  typeEmballage?: string;
  prixUnitaireEstime?: number;
  emplacement?: string;
}

export interface Nomenclature {
  id: number;
  articleParentId: number;
  composantId: number;
  quantiteBesoinUnitaire: number;
  pourcentagePerteTolerable: number; // e.g. 3.5% fond de cuve / purge
}

export interface CommandeClient {
  id: number;
  numeroCommande: string;
  clientNom: string;
  dateCommande: string;
  statut: 'EnAttente' | 'EnProduction' | 'Expediee' | 'Cloturee';
  lignes: LigneCommande[];
}

export interface LigneCommande {
  id: number;
  commandeClientId: number;
  articleId: number;
  quantiteCommandee: number;
  quantiteDejaProduite: number;
  prixUnitaire: number;
}

export interface SuggestionAchat {
  id: number;
  articleId: number;
  quantiteSuggeree: number;
  dateSuggestion: string;
  statut: 'AValider' | 'Commandee' | 'Ignoree';
  motif: string;
  dateBesoinUsine: string;
  dateCommandeAuPlusTard: string;
}

export interface BonReception {
  id: number;
  numeroBL: string;
  commandeFournisseurId: number;
  fournisseurNom: string;
  dateReception: string;
  recuPar: string;
  lignes: LigneReception[];
}

export interface LigneReception {
  id: number;
  bonReceptionId: number;
  articleId: number;
  quantiteCommandee: number;
  quantiteRecue: number;
  quantiteRejetee: number;
  numeroLotFournisseur?: string;
}

export interface MouvementStock {
  id: number;
  articleId: number;
  quantite: number;
  typeMouvement: 'Entree' | 'Sortie' | 'Ajustement' | 'PostDeductionProduction';
  referenceDocument: string;
  numeroLot?: string;
  dateMouvement: string;
  details?: string;
}

// MES specific models
export interface OrdreFabrication {
  id: number;
  numeroOF: string;
  articleId: number;
  quantiteCible: number;
  quantiteProduite: number;
  quantiteRebutee: number;
  datePlanifiee: string;
  statut: 'Planifie' | 'EnPreparation' | 'EnMelange' | 'EnConditionnement' | 'ControleQualite' | 'Termine' | 'Interrompu';
  ligneProductionId: number;
  numeroLotFabrique: string;
  operateur: string;
  commandeClientId?: number;
  tempsCycleSecondes: number;
  tempsProductionMinutes: number;
  dureeEstimeeHeures?: number;
  priorite?: 'Basse' | 'Normale' | 'Haute' | 'Urgente';
  dateFinEstimee?: string;
}

export interface DeclarationProduction {
  id: number;
  ordreFabricationId: number;
  quantiteRealisee: number;
  quantiteRebuts: number;
  dateDeclaration: string;
  operateur: string;
  numeroLot: string;
  consommationsDeduites: ConsommationDeduite[];
}

export interface ConsommationDeduite {
  composantId: number;
  composantCode: string;
  quantiteUnitaireTheorique: number;
  pourcentagePerte: number;
  quantiteTotaleDeduite: number;
  unite: UnitType;
}

export interface MachineLigne {
  id: number;
  nom: string;
  type: 'CuveMelange' | 'Homogeneiseur' | 'Remplisseuse' | 'Boucheuse' | 'Etiqueteuse';
  cadenceNominale: number; // units or liters per hour
  cadenceActuelle: number;
  statut: 'EnMarche' | 'EnAttente' | 'ArretNettoyage' | 'Panne';
  temperatureC?: number;
  pressionBar?: number;
  niveauCuveLitres?: number;
  capaciteMaxLitres?: number;
  nodeOpcUa: string;
}

export interface OeeMetrics {
  disponibilite: number; // % (Temps fonctionnel / Temps requis)
  performance: number;   // % (Cadence réelle / Cadence théorique)
  qualite: number;       // % (Bonnes pièces / Pièces totales)
  trsGlobal: number;     // Disponibilité * Performance * Qualité
  tempsOuvertureMin: number;
  tempsArretMin: number;
  piecesBonnes: number;
  piecesRebuts: number;
}

export interface OpcUaNode {
  nodeId: string;
  browseName: string;
  dataType: string;
  value: string | number | boolean;
  timestamp: string;
  quality: 'Good' | 'Uncertain' | 'Bad';
  description: string;
}

export interface CSharpFileDefinition {
  path: string;
  project: string;
  category: 'Domain' | 'Service' | 'Infrastructure' | 'Host' | 'Connectivity' | 'Shared';
  filename: string;
  description: string;
  code: string;
}

export interface PlcRegisterDefinition {
  address: string;
  name: string;
  unit?: string;
  dataType: 'INT16' | 'UINT16' | 'REAL32' | 'BOOL';
  currentValue: number | boolean | string;
}

export type SimulatedFaultType = 
  | 'NONE'
  | 'TIMEOUT'
  | 'EXCEPTION_02'
  | 'ILLEGAL_DATA'
  | 'HIGH_LATENCY'
  | 'INTERMITTENT_LOSS'
  | 'OFFLINE';

export interface PlcStation {
  id: string;
  name: string;
  brand: string;
  model: string;
  machineId: number;
  machineName: string;
  ipAddress: string;
  port: number;
  slaveId: number;
  status: 'ONLINE' | 'STANDBY' | 'WARNING' | 'FAULT' | 'OFFLINE';
  latencyMs: number;
  latencyMin: number;
  latencyMax: number;
  jitterMs: number;
  latencyHistory: number[];
  packetLoss: number;
  pollRateHz: number;
  cycleCount: number;
  cpuLoadPercent: number;
  firmware: string;
  lastHeartbeat: string;
  activeRegisters: PlcRegisterDefinition[];
  simulatedFault?: SimulatedFaultType;
  activeAlert?: string;
  faultCount?: number;
}

export interface ModbusLogEntry {
  id: string;
  timestamp: string;
  plcId: string;
  direction: 'TX' | 'RX';
  transactionId: number;
  unitId: number;
  functionCode: number;
  functionName: string;
  registerOffset: number;
  registerCount: number;
  hexFrame: string;
  decodedSummary: string;
  latencyMs: number;
  status: 'SUCCESS' | 'TIMEOUT' | 'EXCEPTION_02' | 'ILLEGAL_DATA';
  details?: string;
}

export type InterventionType = 'Curative' | 'Preventive' | 'Ameliorative' | 'Urgente';
export type PostInterventionStatus = 'Operationnelle' | 'EnObservation' | 'AttentePieces';

export interface InterventionMaintenance {
  id: string;
  date: string; // ISO string
  machineId: number;
  machineNom: string;
  technicien: string;
  descriptionPanne: string;
  typeIntervention: InterventionType;
  dureeMinutes: number;
  statutMachineApres: PostInterventionStatus;
  piecesRemplacees?: string;
  impactTrs?: string;
  remettreEnMarche?: boolean;
  createdBy?: string;
  createdAt?: string;
}
