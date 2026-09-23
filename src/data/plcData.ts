import { PlcStation, ModbusLogEntry, MachineLigne } from '../types';

export const INITIAL_PLCS: PlcStation[] = [
  {
    id: 'PLC-01',
    name: 'Automate Cuve & Réacteur R-5000L',
    brand: 'Siemens',
    model: 'SIMATIC S7-1500 (CPU 1515-2 PN)',
    machineId: 1,
    machineName: 'Cuve de Mélange & Réacteur R-5000L',
    ipAddress: '192.168.1.11',
    port: 502,
    slaveId: 1,
    status: 'ONLINE',
    latencyMs: 3.4,
    latencyMin: 2.1,
    latencyMax: 8.7,
    jitterMs: 0.6,
    latencyHistory: [3.1, 3.4, 3.2, 4.0, 3.3, 3.5, 3.4, 3.2, 3.8, 3.4],
    packetLoss: 0.0,
    pollRateHz: 10,
    cycleCount: 184520,
    cpuLoadPercent: 24,
    firmware: 'v3.0.3 (TIA Portal v18)',
    lastHeartbeat: 'Il y a 0.1s',
    activeRegisters: [
      { address: '40001', name: 'NiveauHydrostatiqueLitres', unit: 'L', dataType: 'UINT16', currentValue: 3450 },
      { address: '40002', name: 'TemperaturePT100', unit: '°C', dataType: 'INT16', currentValue: 22.4 },
      { address: '40003', name: 'PressionAbsolueBar', unit: 'bar', dataType: 'INT16', currentValue: 1.25 },
      { address: '40004', name: 'VitesseAgitateurRPM', unit: 'tr/min', dataType: 'UINT16', currentValue: 140 },
      { address: '00001', name: 'VanneAlimentationEthanol', dataType: 'BOOL', currentValue: true },
      { address: '00002', name: 'BoucleSecuriteSIL3', dataType: 'BOOL', currentValue: true }
    ]
  },
  {
    id: 'PLC-02',
    name: 'Automate Homogénéisateur Haute Pression',
    brand: 'Schneider Electric',
    model: 'Modicon M241 (TM241CE24T)',
    machineId: 2,
    machineName: 'Homogénéisateur H-300',
    ipAddress: '192.168.1.12',
    port: 502,
    slaveId: 2,
    status: 'ONLINE',
    latencyMs: 4.8,
    latencyMin: 3.2,
    latencyMax: 11.4,
    jitterMs: 0.9,
    latencyHistory: [4.5, 4.9, 5.1, 4.7, 4.8, 4.6, 5.2, 4.8, 4.7, 4.8],
    packetLoss: 0.0,
    pollRateHz: 10,
    cycleCount: 162980,
    cpuLoadPercent: 31,
    firmware: 'v5.1.12 (EcoStruxure Machine)',
    lastHeartbeat: 'Il y a 0.1s',
    activeRegisters: [
      { address: '40001', name: 'PressionHomogeneisation', unit: 'bar', dataType: 'UINT16', currentValue: 140.0 },
      { address: '40002', name: 'TemperatureCorpsPompe', unit: '°C', dataType: 'INT16', currentValue: 24.8 },
      { address: '40003', name: 'CourantMoteurPrincipal', unit: 'A', dataType: 'UINT16', currentValue: 38.5 },
      { address: '40004', name: 'VibrationPalierVelo', unit: 'mm/s', dataType: 'INT16', currentValue: 1.4 },
      { address: '00001', name: 'StatutLubrification', dataType: 'BOOL', currentValue: true }
    ]
  },
  {
    id: 'PLC-03',
    name: 'Automate Remplisseuse 12 Becs',
    brand: 'Beckhoff',
    model: 'Embedded PC CX5130 (TwinCAT 3)',
    machineId: 3,
    machineName: 'Remplisseuse Volumétrique Rotative 12 Becs',
    ipAddress: '192.168.1.13',
    port: 502,
    slaveId: 3,
    status: 'ONLINE',
    latencyMs: 2.1,
    latencyMin: 1.4,
    latencyMax: 6.2,
    jitterMs: 0.4,
    latencyHistory: [2.0, 2.2, 2.1, 2.3, 2.0, 2.1, 2.2, 2.1, 2.4, 2.1],
    packetLoss: 0.0,
    pollRateHz: 20,
    cycleCount: 320400,
    cpuLoadPercent: 19,
    firmware: 'TC3.1 Build 4024.32',
    lastHeartbeat: 'Il y a 0.05s',
    activeRegisters: [
      { address: '40001', name: 'CadenceFlaconsHeure', unit: 'fl/h', dataType: 'UINT16', currentValue: 920 },
      { address: '40002', name: 'PressionInjectionLiquide', unit: 'bar', dataType: 'INT16', currentValue: 2.1 },
      { address: '40003', name: 'VolumeMoyenDoseMl', unit: 'mL', dataType: 'UINT16', currentValue: 1002 },
      { address: '40004', name: 'CompteurFlaconsTotal', unit: 'u', dataType: 'UINT16', currentValue: 4520 },
      { address: '00001', name: 'CarrouselTournant', dataType: 'BOOL', currentValue: true },
      { address: '00002', name: 'CelluleArriveeFlacons', dataType: 'BOOL', currentValue: true }
    ]
  },
  {
    id: 'PLC-04',
    name: 'Automate Boucheuse Servomoteur',
    brand: 'Omron',
    model: 'Sysmac NJ501-1300 (EtherNet/IP & Modbus)',
    machineId: 4,
    machineName: 'Boucheuse Automatique Servomoteur',
    ipAddress: '192.168.1.14',
    port: 502,
    slaveId: 4,
    status: 'ONLINE',
    latencyMs: 3.9,
    latencyMin: 2.5,
    latencyMax: 9.8,
    jitterMs: 0.7,
    latencyHistory: [3.8, 4.0, 3.9, 4.1, 3.7, 4.2, 3.9, 3.8, 4.0, 3.9],
    packetLoss: 0.0,
    pollRateHz: 10,
    cycleCount: 174110,
    cpuLoadPercent: 22,
    firmware: 'v1.45 (Sysmac Studio)',
    lastHeartbeat: 'Il y a 0.1s',
    activeRegisters: [
      { address: '40001', name: 'CoupleSerrageMoyenNm', unit: 'N·m', dataType: 'INT16', currentValue: 2.8 },
      { address: '40002', name: 'CourseEnfoncementMm', unit: 'mm', dataType: 'INT16', currentValue: 14.2 },
      { address: '40003', name: 'NiveauBolAlimentation', unit: '%', dataType: 'UINT16', currentValue: 82 },
      { address: '00001', name: 'TeteSerragePrete', dataType: 'BOOL', currentValue: true }
    ]
  },
  {
    id: 'PLC-05',
    name: 'Automate Étiqueteuse Fin de Ligne',
    brand: 'WAGO',
    model: 'PFC200 G2 (750-8212 e!COCKPIT)',
    machineId: 5,
    machineName: 'Étiqueteuse Linéaire Double Face Haute Vitesse',
    ipAddress: '192.168.1.15',
    port: 502,
    slaveId: 5,
    status: 'ONLINE',
    latencyMs: 5.6,
    latencyMin: 3.8,
    latencyMax: 14.1,
    jitterMs: 1.1,
    latencyHistory: [5.2, 5.6, 5.8, 5.4, 6.0, 5.5, 5.7, 5.6, 5.9, 5.6],
    packetLoss: 0.0,
    pollRateHz: 10,
    cycleCount: 158220,
    cpuLoadPercent: 28,
    firmware: 'FW23 (Codesys v3.5)',
    lastHeartbeat: 'Il y a 0.1s',
    activeRegisters: [
      { address: '40001', name: 'CadenceEtiquetage', unit: 'fl/h', dataType: 'UINT16', currentValue: 920 },
      { address: '40002', name: 'TensionBandeBobine', unit: 'N', dataType: 'INT16', currentValue: 12.5 },
      { address: '40003', name: 'LongueurBobineRestante', unit: 'm', dataType: 'UINT16', currentValue: 380 },
      { address: '00001', name: 'DetectionOptiqueFlacon', dataType: 'BOOL', currentValue: true }
    ]
  }
];

export const INITIAL_MODBUS_LOGS: ModbusLogEntry[] = [
  {
    id: 'mb-001',
    timestamp: '15:04:18.120',
    plcId: 'PLC-01',
    direction: 'TX',
    transactionId: 1042,
    unitId: 1,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: '04 12 00 00 00 06 01 03 00 00 00 04',
    decodedSummary: 'Lecture 4 registres (%MW0 à %MW3) - Capteurs Cuve R-5000L',
    latencyMs: 3.2,
    status: 'SUCCESS'
  },
  {
    id: 'mb-002',
    timestamp: '15:04:18.124',
    plcId: 'PLC-01',
    direction: 'RX',
    transactionId: 1042,
    unitId: 1,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers [Rep]',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: '04 12 00 00 00 0B 01 03 08 0D 7A 00 E0 00 7D 00 8C',
    decodedSummary: 'Niveau=3450 L | Temp=22.4°C | Pression=1.25 bar | Vitesse=140 RPM',
    latencyMs: 3.4,
    status: 'SUCCESS'
  },
  {
    id: 'mb-003',
    timestamp: '15:04:18.200',
    plcId: 'PLC-03',
    direction: 'TX',
    transactionId: 1043,
    unitId: 3,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: '04 13 00 00 00 06 03 03 00 00 00 04',
    decodedSummary: 'Polling Cadence & Pression Becs Remplisseuse CX5130',
    latencyMs: 2.1,
    status: 'SUCCESS'
  },
  {
    id: 'mb-004',
    timestamp: '15:04:18.202',
    plcId: 'PLC-03',
    direction: 'RX',
    transactionId: 1043,
    unitId: 3,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers [Rep]',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: '04 13 00 00 00 0B 03 03 08 03 98 00 D2 03 EA 11 A8',
    decodedSummary: 'Cadence=920 fl/h | Pression=2.10 bar | Volume=1002 mL | Total=4520',
    latencyMs: 2.1,
    status: 'SUCCESS'
  },
  {
    id: 'mb-005',
    timestamp: '15:04:18.310',
    plcId: 'PLC-02',
    direction: 'TX',
    transactionId: 1044,
    unitId: 2,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: '04 14 00 00 00 06 02 03 00 00 00 04',
    decodedSummary: 'Vérification Pression Homogénéisation & Échauffement',
    latencyMs: 4.6,
    status: 'SUCCESS'
  },
  {
    id: 'mb-006',
    timestamp: '15:04:18.315',
    plcId: 'PLC-02',
    direction: 'RX',
    transactionId: 1044,
    unitId: 2,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers [Rep]',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: '04 14 00 00 00 0B 02 03 08 00 8C 00 F8 01 81 00 0E',
    decodedSummary: 'Pression=140.0 bar | Temp=24.8°C | Courant=38.5 A | Velo=1.4 mm/s',
    latencyMs: 4.8,
    status: 'SUCCESS'
  },
  {
    id: 'mb-007',
    timestamp: '15:04:18.420',
    plcId: 'PLC-04',
    direction: 'TX',
    transactionId: 1045,
    unitId: 4,
    functionCode: 1,
    functionName: 'FC01 Read Coils',
    registerOffset: 0,
    registerCount: 8,
    hexFrame: '04 15 00 00 00 06 04 01 00 00 00 08',
    decodedSummary: 'Lecture état capteurs tout-ou-rien Boucheuse Sysmac NJ501',
    latencyMs: 3.9,
    status: 'SUCCESS'
  },
  {
    id: 'mb-008',
    timestamp: '15:04:18.424',
    plcId: 'PLC-04',
    direction: 'RX',
    transactionId: 1045,
    unitId: 4,
    functionCode: 1,
    functionName: 'FC01 Read Coils [Rep]',
    registerOffset: 0,
    registerCount: 8,
    hexFrame: '04 15 00 00 00 04 04 01 01 A7',
    decodedSummary: 'Coils=0xA7 [Tête=1, Sécu=1, Trémie=0, Présence=1]',
    latencyMs: 3.9,
    status: 'SUCCESS'
  },
  {
    id: 'mb-009',
    timestamp: '15:04:18.530',
    plcId: 'PLC-05',
    direction: 'TX',
    transactionId: 1046,
    unitId: 5,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers',
    registerOffset: 0,
    registerCount: 3,
    hexFrame: '04 16 00 00 00 06 05 03 00 00 00 03',
    decodedSummary: 'Lecture Dérouleur Bobine Étiqueteuse PFC200',
    latencyMs: 5.5,
    status: 'SUCCESS'
  },
  {
    id: 'mb-010',
    timestamp: '15:04:18.536',
    plcId: 'PLC-05',
    direction: 'RX',
    transactionId: 1046,
    unitId: 5,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers [Rep]',
    registerOffset: 0,
    registerCount: 3,
    hexFrame: '04 16 00 00 00 09 05 03 06 03 98 00 7D 01 7C',
    decodedSummary: 'Cadence=920 fl/h | Tension=12.5 N | Réserve=380 m',
    latencyMs: 5.6,
    status: 'SUCCESS'
  }
];

// Helper to generate a realistic Modbus/TCP packet based on current state
export function generateModbusTelegram(
  transactionId: number,
  plc: PlcStation,
  machine?: MachineLigne,
  injectedAlarm: boolean = false
): { tx: ModbusLogEntry; rx: ModbusLogEntry } {
  const now = new Date();
  const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
  
  const tidHex = transactionId.toString(16).padStart(4, '0').toUpperCase();
  const uidHex = plc.slaveId.toString(16).padStart(2, '0').toUpperCase();

  // If PLC is OFFLINE or has simulated OFFLINE or TIMEOUT fault
  if (plc.status === 'OFFLINE' || plc.simulatedFault === 'OFFLINE' || plc.simulatedFault === 'TIMEOUT') {
    const isExplicitTimeout = plc.simulatedFault === 'TIMEOUT';
    const tx: ModbusLogEntry = {
      id: `mb-tx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'TX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC03 Read Holding Registers',
      registerOffset: 0,
      registerCount: 4,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 03 00 00 00 04`,
      decodedSummary: `Requête polling vers ${plc.ipAddress}:502...`,
      latencyMs: 0,
      status: 'TIMEOUT'
    };
    const rx: ModbusLogEntry = {
      id: `mb-rx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'RX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: isExplicitTimeout ? 'FC03 Read [Timeout Réseau Simulé]' : 'FC03 Read Holding Registers [Timeout]',
      registerOffset: 0,
      registerCount: 0,
      hexFrame: `[ERR_TIMEOUT] Pas de réponse de l'hôte ${plc.ipAddress} après 2500ms`,
      decodedSummary: isExplicitTimeout 
        ? `[DIAGNOSTIC] Timeout forcé : Absence de trame d'acquittement après 2500ms sur ${plc.id} (${plc.brand})`
        : `Timeout Modbus/TCP après 2500ms (Hôte injoignable)`,
      latencyMs: 2500,
      status: 'TIMEOUT',
      details: 'WSAETIMEDOUT: Connection timed out on port 502 / Packet drop'
    };
    return { tx, rx };
  }

  // Intermittent packet loss simulation (50% drop rate)
  if (plc.simulatedFault === 'INTERMITTENT_LOSS' && Math.random() < 0.5) {
    const tx: ModbusLogEntry = {
      id: `mb-tx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'TX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC03 Read Holding Registers',
      registerOffset: 0,
      registerCount: 4,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 03 00 00 00 04`,
      decodedSummary: `Requête polling vers ${plc.ipAddress}:502 (Test gigue/pertes)...`,
      latencyMs: 0,
      status: 'TIMEOUT'
    };
    const rx: ModbusLogEntry = {
      id: `mb-rx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'RX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC03 Read [Perte Paquet 50%]',
      registerOffset: 0,
      registerCount: 0,
      hexFrame: `[ERR_PACKET_LOSS] Paquet TCP perdu en transit vers ${plc.ipAddress}`,
      decodedSummary: `[DIAGNOSTIC] Perte intermittente de trame Modbus/TCP simulée (50% drop rate)`,
      latencyMs: 1850,
      status: 'TIMEOUT',
      details: 'DIAG_FAULT: Intermittent frame drop on Ethernet switch port'
    };
    return { tx, rx };
  }

  // Modbus Exception 0x02: Illegal Data Address (FC 0x83, code 0x02)
  if (plc.simulatedFault === 'EXCEPTION_02') {
    const tx: ModbusLogEntry = {
      id: `mb-tx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'TX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC03 Read Holding Registers [Addr Hors Plage]',
      registerOffset: 9999,
      registerCount: 4,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 03 27 0F 00 04`,
      decodedSummary: `Lecture d'un registre hors limite (%MW9999) sur ${plc.id}`,
      latencyMs: Math.max(1.8, plc.latencyMs),
      status: 'EXCEPTION_02'
    };
    const rx: ModbusLogEntry = {
      id: `mb-rx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'RX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC83 Exception 0x02 [Illegal Data Address]',
      registerOffset: 9999,
      registerCount: 4,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 03 ${uidHex} 83 02`,
      decodedSummary: `[DIAGNOSTIC] Erreur Exception Modbus 0x02 : Adresse de registre invalide (Illegal Data Address) retournée par ${plc.brand}`,
      latencyMs: Math.max(2.1, plc.latencyMs + 1.2),
      status: 'EXCEPTION_02',
      details: 'MODBUS EXCEPTION 0x02: The data address received in the query is not an allowable address for the server/slave.'
    };
    return { tx, rx };
  }

  // Modbus Exception 0x03: Illegal Data Value (FC 0x83, code 0x03)
  if (plc.simulatedFault === 'ILLEGAL_DATA') {
    const tx: ModbusLogEntry = {
      id: `mb-tx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'TX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC03 Read [Taille Invalide]',
      registerOffset: 0,
      registerCount: 250,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 03 00 00 00 FA`,
      decodedSummary: `Requête de lecture avec quantité de registres invalide (> 125) sur ${plc.id}`,
      latencyMs: Math.max(1.8, plc.latencyMs),
      status: 'ILLEGAL_DATA'
    };
    const rx: ModbusLogEntry = {
      id: `mb-rx-${transactionId}`,
      timestamp: timeStr,
      plcId: plc.id,
      direction: 'RX',
      transactionId,
      unitId: plc.slaveId,
      functionCode: 3,
      functionName: 'FC83 Exception 0x03 [Illegal Data Value]',
      registerOffset: 0,
      registerCount: 250,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 03 ${uidHex} 83 03`,
      decodedSummary: `[DIAGNOSTIC] Erreur Exception Modbus 0x03 : Donnée non conforme (Illegal Data Value) transmise par ${plc.brand}`,
      latencyMs: Math.max(2.0, plc.latencyMs + 0.8),
      status: 'ILLEGAL_DATA',
      details: 'MODBUS EXCEPTION 0x03: A value contained in the query data field is not an allowable value for server/slave.'
    };
    return { tx, rx };
  }

  // High latency simulation
  let latency = Math.max(1.2, Number((plc.latencyMs + (Math.random() * 0.8 - 0.4)).toFixed(1)));
  if (plc.simulatedFault === 'HIGH_LATENCY') {
    latency = Number((280 + Math.random() * 75).toFixed(1));
  }

  let summary = '';
  let hexData = '';

  if (plc.id === 'PLC-01') {
    const niv = machine?.niveauCuveLitres || 3450;
    const temp = injectedAlarm ? 48.6 : (machine?.temperatureC || 22.4);
    const press = machine?.pressionBar || 1.25;
    const tempHex = Math.round(temp * 10).toString(16).padStart(4, '0').toUpperCase();
    const nivHex = Math.round(niv).toString(16).padStart(4, '0').toUpperCase();
    const pressHex = Math.round(press * 100).toString(16).padStart(4, '0').toUpperCase();
    
    summary = `Niveau=${niv} L | Temp=${temp}°C ${injectedAlarm ? '(ALERTE)' : ''} | Pression=${press} bar`;
    hexData = `${nivHex.slice(0, 2)} ${nivHex.slice(2, 4)} ${tempHex.slice(0, 2)} ${tempHex.slice(2, 4)} ${pressHex.slice(0, 2)} ${pressHex.slice(2, 4)} 00 8C`;
  } else if (plc.id === 'PLC-02') {
    const press = machine?.pressionBar || 140.0;
    const temp = machine?.temperatureC || 24.8;
    summary = `Pression=${press} bar | Temp=${temp}°C | Courant=38.5 A | Vibrations=1.4 mm/s`;
    hexData = `00 8C 00 F8 01 81 00 0E`;
  } else if (plc.id === 'PLC-03') {
    const cad = machine?.cadenceActuelle || 920;
    const press = machine?.pressionBar || 2.1;
    summary = `Cadence=${cad} fl/h | Pression=${press} bar | Dose=1002 mL`;
    hexData = `03 98 00 D2 03 EA 11 A8`;
  } else if (plc.id === 'PLC-04') {
    summary = `Couple=2.8 N·m | Course=14.2 mm | Tremie=82%`;
    hexData = `00 1C 00 8E 00 52 00 01`;
  } else {
    const cad = machine?.cadenceActuelle || 920;
    summary = `Cadence=${cad} fl/h | Tension=12.5 N | Bobine=380 m`;
    hexData = `03 98 00 7D 01 7C 00 01`;
  }

  const tx: ModbusLogEntry = {
    id: `mb-tx-${transactionId}`,
    timestamp: timeStr,
    plcId: plc.id,
    direction: 'TX',
    transactionId,
    unitId: plc.slaveId,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 03 00 00 00 04`,
    decodedSummary: `Polling registres 40001-40004 de ${plc.name.split(' ')[1] || plc.name}`,
    latencyMs: latency,
    status: 'SUCCESS'
  };

  const rx: ModbusLogEntry = {
    id: `mb-rx-${transactionId}`,
    timestamp: timeStr,
    plcId: plc.id,
    direction: 'RX',
    transactionId,
    unitId: plc.slaveId,
    functionCode: 3,
    functionName: 'FC03 Read Holding Registers [Rep]',
    registerOffset: 0,
    registerCount: 4,
    hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 0B ${uidHex} 03 08 ${hexData}`,
    decodedSummary: summary,
    latencyMs: latency,
    status: 'SUCCESS'
  };

  return { tx, rx };
}
