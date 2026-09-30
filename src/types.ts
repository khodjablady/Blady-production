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
  coutUnitaireStandard?: number;
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

// ==========================================
// QUALITY CONTROL (CONTRÔLE QUALITÉ & LOTS)
// ==========================================
export type DecisionQualite = 'Conforme' | 'NonConforme' | 'EnQuarantaine' | 'Derogation';
export type PhaseControleQualite = 'CuveMelange' | 'EnCoursFabrication' | 'FinConditionnement' | 'LiberationLot';
export type StatutParametre = 'Conforme' | 'Alerte' | 'Critique';
export type AspectVisuelType = 'Conforme' | 'ParticulesDetectees' | 'TurbiditeAnormale' | 'CouleurNonConforme';

export interface ParametreControle {
  id: string;
  code: 'PH' | 'VISCOSITE' | 'DENSITE' | 'ALCOOL' | 'TEMPERATURE' | 'MATIERE_ACTIVE';
  nom: string;
  unite: string;
  valeurCible: number;
  toleranceMin: number;
  toleranceMax: number;
  valeurMesuree: number;
  statut: StatutParametre;
  ecartPourcentage: number;
  commentaire?: string;
}

export interface ControleQualiteLot {
  id: string;
  numeroLot: string;
  ordreFabricationId?: number;
  numeroOF?: string;
  articleId: number;
  articleDesignation: string;
  articleCode: string;
  dateControle: string; // ISO string
  inspecteur: string;
  phaseControle: PhaseControleQualite;
  parametres: ParametreControle[];
  aspectVisuel: AspectVisuelType;
  decision: DecisionQualite;
  remarques?: string;
  conforme: boolean;
  alertesCount: number;
  critiquesCount: number;
  certificatConformiteGenere?: boolean;
  createdBy?: string;
  createdAt?: string;
}

// ==========================================
// TRACEABILITY & LOT GENEALOGY (TRAÇABILITÉ)
// ==========================================
export type TypeLot = 'ProduitFini' | 'VracIntermediaire' | 'MatierePremiere' | 'Emballage';

export interface LotComposantConsomme {
  composantArticleId: number;
  composantCode: string;
  composantDesignation: string;
  typeComposant: 'MatierePremiere' | 'Emballage' | 'Vrac';
  numeroLotFournisseurOuInterne: string;
  fournisseurNom: string;
  numeroBL: string;
  dateReceptionOuMelange: string;
  quantiteConsommee: number;
  unite: UnitType;
  quantiteTheorique: number;
  ecartPourcent: number;
  statutConformiteMatiere: 'Conforme' | 'Alerte' | 'EnQuarantaine';
  certificatFournisseurRef?: string;
}

export interface ClientExpeditionLot {
  commandeId: number;
  numeroCommande: string;
  clientNom: string;
  dateExpedition: string;
  quantiteExpediee: number;
  statutExpedition: 'Livre' | 'EnTransit' | 'EnPreparation';
  bonLivraisonRef: string;
}

export interface DossierLotTracabilite {
  id: string;
  numeroLot: string;
  typeLot: TypeLot;
  articleId: number;
  articleCode: string;
  articleDesignation: string;
  statutLot: 'Libere' | 'EnQuarantaine' | 'EnFabrication' | 'Epuise';
  // Associated Manufacturing Order
  ordreFabricationId?: number;
  numeroOF?: string;
  ligneFabricationNom?: string;
  cuveFormulationNom?: string;
  dateFabrication: string;
  datePeremption?: string;
  operateur: string;
  volumeProduit: number;
  uniteMesure: UnitType;
  // Associated Quality Control
  controleQualiteId?: string;
  decisionQualite: DecisionQualite;
  // Downward traceability: what components were incorporated into this batch?
  composantsConsommes: LotComposantConsomme[];
  // Upward traceability: which clients / shipments received this finished batch?
  expeditionsClients: ClientExpeditionLot[];
  // Notes / Quarantine / Alerts
  remarquesAudit?: string;
}

// ==========================================
// TELEMETRY THRESHOLDS & ALERTS (CONNECTIVITÉ)
// ==========================================
export interface ParameterThresholdConfig {
  enabled: boolean;
  min?: number;
  maxWarning: number;
  maxCritical: number;
  unit: string;
}

export interface MachineTelemetryThresholds {
  machineId: number;
  machineNom: string;
  temperature?: ParameterThresholdConfig;
  pression?: ParameterThresholdConfig;
  cadence?: {
    enabled: boolean;
    minWarning?: number;
    maxWarning?: number;
    unit: string;
  };
}

export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type ThresholdBreachType = 'HIGH_CRITICAL' | 'HIGH_WARNING' | 'LOW_CRITICAL' | 'LOW_WARNING';

export interface TelemetryAlert {
  id: string;
  machineId: number;
  machineNom: string;
  parametre: 'temperature' | 'pression' | 'cadence';
  parametreNom: string;
  valeurActuelle: number;
  valeurSeuil: number;
  unite: string;
  severite: AlertSeverity;
  typeBreach: ThresholdBreachType;
  message: string;
  timestamp: string;
}

// ==========================================
// MACHINE-TO-CLOUD DATA EXCHANGE LOGS (IIoT)
// ==========================================
export type CloudProtocol = 'MQTT_SPARKPLUG_B' | 'HTTPS_REST' | 'OPC_UA_PUBSUB' | 'WEBSOCKET_WSS';
export type CloudFlowDirection = 'EDGE_TO_CLOUD' | 'CLOUD_TO_EDGE' | 'BIDIRECTIONAL';
export type CloudLogStatus = 'SUCCESS' | 'WARNING' | 'ERROR' | 'RETRY';

export interface PipelineLatencyBreakdown {
  edgePackingMs: number;
  tlsEncryptionMs: number;
  networkWanRttMs: number;
  cloudIngestionMs: number;
}

export interface MachineToCloudLogEntry {
  id: string;
  timestamp: string;
  machineId: number;
  machineNom: string;
  protocol: CloudProtocol;
  direction: CloudFlowDirection;
  endpointOrTopic: string;
  methodOrMessageType: string;
  payloadBytes: number;
  cloudLatencyMs: number;
  status: CloudLogStatus;
  responseCode: string | number;
  summary: string;
  headers?: Record<string, string>;
  payloadJson: Record<string, any>;
  pipelineBreakdown: PipelineLatencyBreakdown;
  errorDetails?: string;
  retryAttempt?: number;
}


