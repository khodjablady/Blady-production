import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Radio, 
  Activity, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Sliders, 
  Terminal, 
  RefreshCw,
  Server,
  Flame,
  Gauge,
  Network,
  FileCode2,
  Send,
  Layers,
  Clock,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Wrench,
  Bug,
  RotateCcw,
  X
} from 'lucide-react';
import { MachineLigne, OpcUaNode, PlcStation, ModbusLogEntry, SimulatedFaultType } from '../types';
import { INITIAL_PLCS, INITIAL_MODBUS_LOGS, generateModbusTelegram } from '../data/plcData';
import { PlcDashboard } from './PlcDashboard';
import { ModbusLogTerminal } from './ModbusLogTerminal';

interface IndustrialConnectivityViewProps {
  machines: MachineLigne[];
  onMachineStateChange: (machineId: number, newStatut: MachineLigne['statut']) => void;
  isLiveSimulating: boolean;
}

export const IndustrialConnectivityView: React.FC<IndustrialConnectivityViewProps> = ({
  machines,
  onMachineStateChange,
  isLiveSimulating
}) => {
  // Navigation tabs inside connectivity
  const [subTab, setSubTab] = useState<'plc-modbus' | 'opc-ua' | 'csharp'>('plc-modbus');

  // PLC Fleet state
  const [plcs, setPlcs] = useState<PlcStation[]>(INITIAL_PLCS);
  const [selectedPlcId, setSelectedPlcId] = useState<string | null>('PLC-01');

  // Diagnostic Mode state & error injection
  const [diagnosticMode, setDiagnosticMode] = useState<boolean>(false);
  const [diagnosticTargetPlcId, setDiagnosticTargetPlcId] = useState<string>('PLC-01');
  const [diagnosticNotification, setDiagnosticNotification] = useState<{
    plcId: string;
    fault: SimulatedFaultType;
    message: string;
    severity: 'CRITICAL' | 'WARNING' | 'ERROR' | 'SUCCESS';
  } | null>(null);

  // Modbus Terminal state
  const [modbusLogs, setModbusLogs] = useState<ModbusLogEntry[]>(INITIAL_MODBUS_LOGS);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const transactionCounterRef = useRef<number>(1047);

  // OPC UA state & thermal alarm
  const [selectedNode, setSelectedNode] = useState<string>('ns=2;s=Cuve_Melange.Niveau');
  const [injectedAlarm, setInjectedAlarm] = useState<boolean>(false);

  // CSV Export feedback notification
  const [exportNotification, setExportNotification] = useState<{
    filename: string;
    totalCount: number;
    errorCount: number;
  } | null>(null);

  // Real-time polling & telemetry loop
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Pick next PLC in round-robin fashion or weighted
      setPlcs(prevPlcs => {
        // Active PLCs to poll: online PLCs or PLCs under simulation tests
        const activePlcs = prevPlcs.filter(p => p.status !== 'OFFLINE' || p.simulatedFault === 'TIMEOUT' || p.simulatedFault === 'OFFLINE');
        if (activePlcs.length === 0) return prevPlcs;

        // Choose one PLC to poll in this tick
        const chosenPlc = activePlcs[Math.floor(Math.random() * activePlcs.length)];
        const machine = machines.find(m => m.id === chosenPlc.machineId);

        // Calculate realistic fluctuating latency (RTT)
        let newLatency: number;
        if (chosenPlc.simulatedFault === 'HIGH_LATENCY') {
          newLatency = Number((280 + Math.random() * 75).toFixed(1));
        } else if (chosenPlc.simulatedFault === 'TIMEOUT' || chosenPlc.status === 'OFFLINE') {
          newLatency = 2500;
        } else {
          const jitter = Number((Math.random() * 0.8 - 0.4).toFixed(1));
          newLatency = Math.max(1.5, Number((chosenPlc.latencyMs + jitter).toFixed(1)));
          // Occasional minor micro-spike
          if (Math.random() < 0.08) {
            newLatency = Number((newLatency + Math.random() * 4).toFixed(1));
          }
        }

        // Generate Modbus transaction
        const tid = transactionCounterRef.current++;
        const { tx, rx } = generateModbusTelegram(tid, chosenPlc, machine, injectedAlarm);

        // Add to logs
        setModbusLogs(prevLogs => [rx, tx, ...prevLogs].slice(0, 120));

        // Update PLC state
        return prevPlcs.map(p => {
          if (p.id !== chosenPlc.id) return p;

          const newHistory = [...p.latencyHistory.slice(1), newLatency];
          const newMin = Math.min(p.latencyMin, newLatency);
          const newMax = Math.max(p.latencyMax, newLatency);

          // Update active register values from machine state
          const updatedRegisters = p.activeRegisters.map(reg => {
            if (p.id === 'PLC-01') {
              if (reg.address === '40001') return { ...reg, currentValue: machine?.niveauCuveLitres || 3450 };
              if (reg.address === '40002') return { ...reg, currentValue: injectedAlarm ? 48.6 : (machine?.temperatureC || 22.4) };
              if (reg.address === '40003') return { ...reg, currentValue: machine?.pressionBar || 1.25 };
            } else if (p.id === 'PLC-02') {
              if (reg.address === '40001') return { ...reg, currentValue: machine?.pressionBar || 140.0 };
              if (reg.address === '40002') return { ...reg, currentValue: machine?.temperatureC || 24.8 };
            } else if (p.id === 'PLC-03') {
              if (reg.address === '40001') return { ...reg, currentValue: machine?.cadenceActuelle || 920 };
              if (reg.address === '40002') return { ...reg, currentValue: machine?.pressionBar || 2.1 };
            } else if (p.id === 'PLC-05') {
              if (reg.address === '40001') return { ...reg, currentValue: machine?.cadenceActuelle || 920 };
            }
            return reg;
          });

          return {
            ...p,
            latencyMs: newLatency,
            latencyMin: newMin,
            latencyMax: newMax,
            latencyHistory: newHistory,
            cycleCount: p.cycleCount + 1,
            lastHeartbeat: 'Il y a 0.1s',
            activeRegisters: updatedRegisters
          };
        });
      });
    }, isLiveSimulating ? 1200 : 2200);

    return () => clearInterval(interval);
  }, [isStreaming, isLiveSimulating, machines, injectedAlarm]);

  // Handler: Manual Force Poll for a PLC
  const handlePollPlc = (plcId: string) => {
    const targetPlc = plcs.find(p => p.id === plcId);
    if (!targetPlc) return;
    const machine = machines.find(m => m.id === targetPlc.machineId);
    const tid = transactionCounterRef.current++;
    const { tx, rx } = generateModbusTelegram(tid, targetPlc, machine, injectedAlarm);
    
    setModbusLogs(prev => [rx, tx, ...prev].slice(0, 120));

    setPlcs(prev =>
      prev.map(p => {
        if (p.id !== plcId) return p;
        const newLat = p.simulatedFault === 'TIMEOUT' || p.status === 'OFFLINE'
          ? 2500
          : p.simulatedFault === 'HIGH_LATENCY'
          ? Number((280 + Math.random() * 60).toFixed(1))
          : Math.max(1.2, Number((p.latencyMs + (Math.random() * 0.4 - 0.2)).toFixed(1)));

        return {
          ...p,
          latencyMs: newLat,
          latencyHistory: [...p.latencyHistory.slice(1), newLat],
          cycleCount: p.cycleCount + 1,
          lastHeartbeat: 'À l\'instant'
        };
      })
    );
  };

  // Handler: Toggle PLC Offline simulation
  const handleTogglePlcOffline = (plcId: string) => {
    setPlcs(prev =>
      prev.map(p => {
        if (p.id !== plcId) return p;
        const willBeOffline = p.status !== 'OFFLINE';
        
        // If becoming offline, push a timeout error into logs
        if (willBeOffline) {
          const tid = transactionCounterRef.current++;
          const timeoutEntry: ModbusLogEntry = {
            id: `mb-timeout-${tid}`,
            timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
            plcId: p.id,
            direction: 'RX',
            transactionId: tid,
            unitId: p.slaveId,
            functionCode: 3,
            functionName: 'FC03 Read Holding Registers [Timeout]',
            registerOffset: 0,
            registerCount: 4,
            hexFrame: `[ERR_TIMEOUT] Aucune trame reçue de ${p.ipAddress}:502 après 2500ms`,
            decodedSummary: `Liaison interrompue avec l'automate ${p.id} (${p.brand} ${p.model}). Détection timeout réseau MES.`,
            latencyMs: 2500,
            status: 'TIMEOUT',
            details: 'WSAETIMEDOUT: Connection reset by peer / Link carrier down'
          };
          setModbusLogs(prev => [timeoutEntry, ...prev].slice(0, 120));
        }

        return {
          ...p,
          status: willBeOffline ? 'OFFLINE' : 'ONLINE',
          simulatedFault: willBeOffline ? 'OFFLINE' : 'NONE',
          activeAlert: willBeOffline 
            ? `URGENCE MES-COM-00: Déconnexion physique totale de ${p.id} (${p.brand}) - Port 502 injoignable`
            : undefined,
          lastHeartbeat: willBeOffline ? 'Déconnecté' : 'À l\'instant'
        };
      })
    );
  };

  // Handler: Inject communication fault on a specific PLC (Diagnostic Mode)
  const handleInjectFault = (plcId: string, fault: SimulatedFaultType) => {
    const targetPlc = plcs.find(p => p.id === plcId);
    if (!targetPlc) return;
    const machine = machines.find(m => m.id === targetPlc.machineId);

    let nextStatus: PlcStation['status'] = 'ONLINE';
    let alertMsg: string | undefined = undefined;
    let newLat = targetPlc.latencyMs;

    if (fault === 'TIMEOUT') {
      nextStatus = 'FAULT';
      alertMsg = `ALERTE MES-COM-01: Timeout Modbus/TCP (>2500ms) sur ${targetPlc.ipAddress}:502 - Absence acquittement`;
      newLat = 2500;
    } else if (fault === 'EXCEPTION_02') {
      nextStatus = 'FAULT';
      alertMsg = `ALERTE MES-COM-02: Code Exception 0x02 reçu du PLC ${targetPlc.id} - Adresse %MW9999 hors plage automate`;
    } else if (fault === 'ILLEGAL_DATA') {
      nextStatus = 'FAULT';
      alertMsg = `ALERTE MES-COM-03: Code Exception 0x03 reçu du PLC ${targetPlc.id} - Quantité de registres > 125 invalide`;
    } else if (fault === 'HIGH_LATENCY') {
      nextStatus = 'WARNING';
      newLat = Number((295 + Math.random() * 45).toFixed(1));
      alertMsg = `AVERTISSEMENT MES-COM-04: Dégradation RTT critique (${newLat}ms > seuil 50ms) sur ${targetPlc.ipAddress}`;
    } else if (fault === 'INTERMITTENT_LOSS') {
      nextStatus = 'WARNING';
      alertMsg = `ALERTE MES-COM-05: Instabilité bus Modbus/TCP sur ${targetPlc.id} (Pertes de trames 50% détectées)`;
    } else if (fault === 'OFFLINE') {
      nextStatus = 'OFFLINE';
      alertMsg = `URGENCE MES-COM-00: Déconnexion physique de ${targetPlc.id} (${targetPlc.brand}) - Liaison coupée`;
      newLat = 2500;
    }

    // Immediately push transaction telegram to logs so user sees it right away
    const tid = transactionCounterRef.current++;
    const testPlcObj: PlcStation = {
      ...targetPlc,
      status: nextStatus,
      simulatedFault: fault,
      latencyMs: newLat
    };
    const { tx, rx } = generateModbusTelegram(tid, testPlcObj, machine, injectedAlarm);
    setModbusLogs(prev => [rx, tx, ...prev].slice(0, 120));

    // Update PLC state
    setPlcs(prev =>
      prev.map(p => {
        if (p.id !== plcId) return p;
        const newHist = [...p.latencyHistory.slice(1), newLat];
        return {
          ...p,
          status: nextStatus,
          simulatedFault: fault,
          activeAlert: alertMsg,
          faultCount: (p.faultCount || 0) + 1,
          latencyMs: newLat,
          latencyHistory: newHist,
          lastHeartbeat: 'À l\'instant (Panne injectée)'
        };
      })
    );

    setDiagnosticNotification({
      plcId,
      fault,
      message: alertMsg || `Panne ${fault} simulée sur ${targetPlc.id}`,
      severity: fault === 'TIMEOUT' || fault === 'OFFLINE' ? 'CRITICAL' : fault === 'HIGH_LATENCY' || fault === 'INTERMITTENT_LOSS' ? 'WARNING' : 'ERROR'
    });
  };

  // Handler: Reset fault on a specific PLC back to nominal state
  const handleResetFault = (plcId: string) => {
    const targetPlc = plcs.find(p => p.id === plcId);
    if (!targetPlc) return;

    const restoredLatency = targetPlc.id === 'PLC-03' ? 2.1 : targetPlc.id === 'PLC-01' ? 3.4 : targetPlc.id === 'PLC-02' ? 4.8 : 4.0;
    
    // Recovery log in Modbus logs
    const tid = transactionCounterRef.current++;
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const recoveryLog: ModbusLogEntry = {
      id: `mb-recovery-${tid}`,
      timestamp: timeStr,
      plcId,
      direction: 'RX',
      transactionId: tid,
      unitId: targetPlc.slaveId,
      functionCode: 3,
      functionName: 'FC03 [Rétablissement Nominal]',
      registerOffset: 0,
      registerCount: 4,
      hexFrame: `[SYS_OK] Rétablissement liaison nominale avec ${targetPlc.ipAddress}:502`,
      decodedSummary: `[DIAGNOSTIC] Fin d'incident simulé. Retour à l'état nominal pour ${targetPlc.id} (${targetPlc.brand}).`,
      latencyMs: restoredLatency,
      status: 'SUCCESS'
    };

    setModbusLogs(prev => [recoveryLog, ...prev].slice(0, 120));

    setPlcs(prev =>
      prev.map(p => {
        if (p.id !== plcId) return p;
        return {
          ...p,
          status: 'ONLINE',
          simulatedFault: 'NONE',
          activeAlert: undefined,
          latencyMs: restoredLatency,
          latencyHistory: [...p.latencyHistory.slice(1), restoredLatency],
          lastHeartbeat: 'À l\'instant (Rétabli)'
        };
      })
    );

    setDiagnosticNotification({
      plcId,
      fault: 'NONE',
      message: `Communication rétablie à 100% nominale pour ${targetPlc.id} (${targetPlc.brand}). Alerte effacée.`,
      severity: 'SUCCESS'
    });
  };

  // Handler: Reset all faults fleet-wide
  const handleResetAllFaults = () => {
    setPlcs(prev =>
      prev.map(p => {
        const nominalLat = p.id === 'PLC-03' ? 2.1 : p.id === 'PLC-01' ? 3.4 : p.id === 'PLC-02' ? 4.8 : 4.0;
        return {
          ...p,
          status: 'ONLINE',
          simulatedFault: 'NONE',
          activeAlert: undefined,
          latencyMs: nominalLat,
          latencyHistory: [...p.latencyHistory.slice(1), nominalLat],
          lastHeartbeat: 'À l\'instant (Reset général)'
        };
      })
    );

    // Push reset log
    const tid = transactionCounterRef.current++;
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const recoveryLog: ModbusLogEntry = {
      id: `mb-recovery-${tid}`,
      timestamp: timeStr,
      plcId: 'PLC-ALL',
      direction: 'RX',
      transactionId: tid,
      unitId: 1,
      functionCode: 3,
      functionName: 'FC03 [Reset Général Pannes]',
      registerOffset: 0,
      registerCount: 0,
      hexFrame: `[SYS_OK] Rétablissement global de la flotte d'automates`,
      decodedSummary: `[DIAGNOSTIC] Réinitialisation générale de toutes les pannes simulées. Flotte 100% nominale.`,
      latencyMs: 2.8,
      status: 'SUCCESS'
    };
    setModbusLogs(prev => [recoveryLog, ...prev].slice(0, 120));

    setDiagnosticNotification({
      plcId: 'ALL',
      fault: 'NONE',
      message: 'Toutes les erreurs simulées ont été réinitialisées. Flotte PLC 100% en ligne et nominale.',
      severity: 'SUCCESS'
    });
  };

  // Handler: Manual Modbus Command Injection from terminal
  const handleManualSend = (plcId: string, fc: number, reg: number, val: number) => {
    const targetPlc = plcs.find(p => p.id === plcId);
    if (!targetPlc) return;

    const tid = transactionCounterRef.current++;
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const tidHex = tid.toString(16).padStart(4, '0').toUpperCase();
    const uidHex = targetPlc.slaveId.toString(16).padStart(2, '0').toUpperCase();
    const regHex = reg.toString(16).padStart(4, '0').toUpperCase();
    const valHex = val.toString(16).padStart(4, '0').toUpperCase();

    let funcName = 'FC03 Read Holding Registers';
    if (fc === 1) funcName = 'FC01 Read Coils';
    if (fc === 5) funcName = 'FC05 Write Single Coil';
    if (fc === 6) funcName = 'FC06 Write Single Register';

    const tx: ModbusLogEntry = {
      id: `mb-tx-${tid}`,
      timestamp: timeStr,
      plcId: targetPlc.id,
      direction: 'TX',
      transactionId: tid,
      unitId: targetPlc.slaveId,
      functionCode: fc,
      functionName: funcName,
      registerOffset: reg,
      registerCount: 1,
      hexFrame: `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 0${fc} ${regHex.slice(0, 2)} ${regHex.slice(2, 4)} ${valHex.slice(0, 2)} ${valHex.slice(2, 4)}`,
      decodedSummary: `Commande manuelle ${funcName} vers ${targetPlc.ipAddress} [Reg: 0x${regHex}, Val: ${val}]`,
      latencyMs: targetPlc.latencyMs,
      status: targetPlc.status === 'OFFLINE' ? 'TIMEOUT' : 'SUCCESS'
    };

    const rx: ModbusLogEntry = {
      id: `mb-rx-${tid}`,
      timestamp: timeStr,
      plcId: targetPlc.id,
      direction: 'RX',
      transactionId: tid,
      unitId: targetPlc.slaveId,
      functionCode: fc,
      functionName: `${funcName} [Ack]`,
      registerOffset: reg,
      registerCount: 1,
      hexFrame: targetPlc.status === 'OFFLINE'
        ? `[TIMEOUT] Pas d'acquittement après 2500ms`
        : `${tidHex.slice(0, 2)} ${tidHex.slice(2, 4)} 00 00 00 06 ${uidHex} 0${fc} ${regHex.slice(0, 2)} ${regHex.slice(2, 4)} ${valHex.slice(0, 2)} ${valHex.slice(2, 4)}`,
      decodedSummary: targetPlc.status === 'OFFLINE'
        ? `Échec de commande : Automate ${targetPlc.id} non joignable.`
        : `Acquittement automate réussi : Valeur appliquée (Reg 0x${regHex} = ${val})`,
      latencyMs: targetPlc.latencyMs,
      status: targetPlc.status === 'OFFLINE' ? 'TIMEOUT' : 'SUCCESS'
    };

    setModbusLogs(prev => [rx, tx, ...prev].slice(0, 120));

    // Update target register on the PLC
    if (targetPlc.status !== 'OFFLINE') {
      setPlcs(prev =>
        prev.map(p => {
          if (p.id !== plcId) return p;
          const updatedRegs = p.activeRegisters.map(r => {
            if (r.address === String(reg) || r.address === `4000${reg}`) {
              return { ...r, currentValue: fc === 5 ? (val > 0) : val };
            }
            return r;
          });
          return {
            ...p,
            cycleCount: p.cycleCount + 1,
            activeRegisters: updatedRegs
          };
        })
      );
    }
  };

  // Handler: Export current dashboard telemetry & Modbus/TCP logs to CSV
  const handleExportCsv = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    // RFC 4180 CSV cell formatting with semicolon separator for French/European Excel compatibility
    const formatCell = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const lines: string[] = [];

    // --- EN-TÊTE DU RAPPORT D'ANALYSE ---
    const onlinePlcs = plcs.filter(p => p.status === 'ONLINE').length;
    const errorLogs = modbusLogs.filter(l => l.status !== 'SUCCESS');
    const avgLatency = (plcs.reduce((acc, p) => acc + (p.status === 'ONLINE' ? p.latencyMs : 0), 0) / Math.max(1, onlinePlcs)).toFixed(1);

    lines.push(formatCell('# ========================================================================='));
    lines.push(formatCell('# BLADY PRODUCTION MES - RAPPORT D\'ANALYSE HORS-LIGNE MODBUS/TCP & TÉLÉMÉTRIE AUTOMATES'));
    lines.push(formatCell('# ========================================================================='));
    lines.push(`${formatCell('Date_Heure_Export')};${formatCell(now.toLocaleString('fr-FR'))}`);
    lines.push(`${formatCell('Automates_Actifs')};${formatCell(`${onlinePlcs} sur ${plcs.length} PLC connectés`)}`);
    lines.push(`${formatCell('Latence_Moyenne_Bus')};${formatCell(`${avgLatency} ms (TCP RTT)`)}`);
    lines.push(`${formatCell('Total_Trames_Capturees')};${formatCell(modbusLogs.length)}`);
    lines.push(`${formatCell('Nombre_Erreurs_Et_Timeouts')};${formatCell(`${errorLogs.length} incident(s) détecté(s)`)}`);
    lines.push(`${formatCell('Taux_Erreur_Communication')};${formatCell(`${((errorLogs.length / Math.max(1, modbusLogs.length)) * 100).toFixed(2)} %`)}`);
    lines.push('');

    // --- SECTION 1 : SYNTHÈSE DES AUTOMATES (PLC) ---
    lines.push(formatCell('--- 1. TABLEAU DE BORD DES AUTOMATES PROGRAMMABLES (PLC) & SANTÉ RÉSEAU ---'));
    lines.push([
      'ID_Automate',
      'Constructeur',
      'Modele',
      'Machine_Ligne',
      'Adresse_IP',
      'Port_TCP',
      'Slave_Unit_ID',
      'Statut_Liaison',
      'Panne_Simulee_Diagnostic',
      'Alerte_MES_Active',
      'Latence_RTT_Actuelle_ms',
      'Latence_Min_ms',
      'Latence_Max_ms',
      'Jitter_ms',
      'Charge_CPU_pct',
      'Nombre_Cycles_Poll',
      'Dernier_Heartbeat',
      'Registres_Surveilles_Valeurs'
    ].map(formatCell).join(';'));

    plcs.forEach(p => {
      const regDetails = p.activeRegisters
        .map(r => `${r.name || r.address} (${r.address}) = ${r.currentValue}${r.unit ? ` ${r.unit}` : ''}`)
        .join(' | ');

      lines.push([
        p.id,
        p.brand,
        p.model,
        p.machineName,
        p.ipAddress,
        p.port,
        p.slaveId,
        p.status,
        p.simulatedFault || 'AUCUNE',
        p.activeAlert || 'AUCUNE',
        p.latencyMs,
        p.latencyMin,
        p.latencyMax,
        p.jitterMs,
        p.cpuLoadPercent,
        p.cycleCount,
        p.lastHeartbeat,
        regDetails
      ].map(formatCell).join(';'));
    });

    lines.push('');
    lines.push('');

    // --- SECTION 2 : JOURNAL COMPLET DES TRAMES ET ERREURS MODBUS/TCP ---
    lines.push(formatCell('--- 2. JOURNAL DÉTAILLÉ DES TRAMES & ERREURS MODBUS/TCP (ANALYSE HORS-LIGNE) ---'));
    lines.push([
      'Horodatage',
      'Transaction_ID',
      'ID_Automate',
      'Constructeur',
      'Machine_Associee',
      'Direction',
      'Code_Fonction',
      'Libelle_Fonction',
      'Offset_Registre',
      'Nombre_Registres',
      'Latence_ms',
      'Statut_Communication',
      'Est_Une_Erreur',
      'Type_Anomalie',
      'Trame_Hexadécimale_MBAP_PDU',
      'Resume_Decodage_Metier',
      'Details_Techniques_Erreur'
    ].map(formatCell).join(';'));

    modbusLogs.forEach(log => {
      const plc = plcs.find(p => p.id === log.plcId);
      const isError = log.status !== 'SUCCESS';
      let errorType = 'AUCUNE (Trame nominale)';
      if (log.status === 'TIMEOUT') {
        errorType = 'TIMEOUT_RESEAU (Automate non joignable ou liaison coupée)';
      } else if (log.status === 'EXCEPTION_02') {
        errorType = 'EXCEPTION_02 (Adresse registre invalide sur automate)';
      } else if (log.status === 'ILLEGAL_DATA') {
        errorType = 'ILLEGAL_DATA_VALUE (Valeur transmise non conforme)';
      } else if (log.decodedSummary.includes('DÉPASSEMENT') || log.decodedSummary.includes('ALERTE') || log.decodedSummary.includes('critique')) {
        errorType = 'SEUIL_PROCEDE_DEPASSE (Alerte thermique/pression procédé)';
      }

      lines.push([
        log.timestamp,
        log.transactionId,
        log.plcId,
        plc?.brand || 'Inconnu',
        plc?.machineName || 'Machine',
        log.direction,
        `FC0${log.functionCode}`,
        log.functionName,
        log.registerOffset,
        log.registerCount,
        log.latencyMs,
        log.status,
        isError ? 'OUI - ANOMALIE/TIMEOUT' : 'NON - NOMINAL',
        errorType,
        log.hexFrame,
        log.decodedSummary,
        log.details || ''
      ].map(formatCell).join(';'));
    });

    // Create CSV Blob with UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `modbus_tcp_telemetrie_logs_${timestampStr}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Provide visual notification
    setExportNotification({
      filename,
      totalCount: modbusLogs.length,
      errorCount: errorLogs.length
    });
    setTimeout(() => {
      setExportNotification(null);
    }, 5000);
  };

  // OPC UA Nodes list
  const opcUaNodes: OpcUaNode[] = [
    {
      nodeId: 'ns=2;s=Cuve_Melange.Niveau',
      browseName: 'NiveauCuveLitres',
      dataType: 'Double',
      value: machines[0]?.niveauCuveLitres || 3450,
      timestamp: new Date().toISOString(),
      quality: 'Good',
      description: 'Niveau hydrostatique du réacteur agité R-5000L (Transmetteur 4-20mA HART)'
    },
    {
      nodeId: 'ns=2;s=Cuve_Melange.Temperature',
      browseName: 'TemperatureProcess',
      dataType: 'Float',
      value: injectedAlarm ? 48.6 : (machines[0]?.temperatureC || 22.4),
      timestamp: new Date().toISOString(),
      quality: injectedAlarm ? 'Uncertain' : 'Good',
      description: 'Sonde PT100 double corps à l\'intérieur du réacteur de préparation'
    },
    {
      nodeId: 'ns=2;s=Cuve_Melange.PressionBar',
      browseName: 'PressionInterne',
      dataType: 'Float',
      value: machines[0]?.pressionBar || 1.25,
      timestamp: new Date().toISOString(),
      quality: 'Good',
      description: 'Capteur de pression absolue membrane affleurante inox 316L'
    },
    {
      nodeId: 'ns=2;s=Homogeneiseur.PressionBar',
      browseName: 'PressionHomogeneisation',
      dataType: 'Float',
      value: machines[1]?.pressionBar || 140.0,
      timestamp: new Date().toISOString(),
      quality: 'Good',
      description: 'Pression de cisaillement pompe triplex haute pression H-300'
    },
    {
      nodeId: 'ns=2;s=Remplisseuse.CadenceFlaconsHeure',
      browseName: 'CadenceFlaconsHeure',
      dataType: 'Int32',
      value: machines[2]?.cadenceActuelle || 920,
      timestamp: new Date().toISOString(),
      quality: 'Good',
      description: 'Fréquence de passage cellule photoélectrique carrousel rotatif'
    },
    {
      nodeId: 'ns=2;s=Remplisseuse.PressionInjection',
      browseName: 'PressionInjectionLiquide',
      dataType: 'Float',
      value: machines[2]?.pressionBar || 2.1,
      timestamp: new Date().toISOString(),
      quality: 'Good',
      description: 'Pression d\'alimentation becs de dosage volumétrique'
    },
    {
      nodeId: 'ns=2;s=Ligne.ArretUrgence',
      browseName: 'ChaineSecuriteArretUrgence',
      dataType: 'Boolean',
      value: false,
      timestamp: new Date().toISOString(),
      quality: 'Good',
      description: 'Boucle de sécurité relais Pilz catégorie 4 SIL3 / ISO 13849 PLe'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Connectivité Industrielle & Télémétrie Automates
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                  BladyProduction.Connectivity
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervision temps réel des automates programmables (Siemens, Schneider, Beckhoff, Omron, WAGO), mesure de latence réseau et captures de trames Modbus/TCP & OPC UA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-mono text-emerald-400">Modbus/TCP :502</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-sky-400">OPC UA :4840</span>
            </span>

            {/* Injected thermal alarm toggle button right on top */}
            <button
              onClick={() => setInjectedAlarm(!injectedAlarm)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                injectedAlarm
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
              title="Injecter une dérive thermique anormale sur la cuve"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{injectedAlarm ? 'ALARME CUVE ACTIVE (48.6°C)' : 'Injecter Dérive Thermique'}</span>
            </button>

            {/* Mode Diagnostic Toggle Button */}
            <button
              id="toggle-diagnostic-mode-btn"
              onClick={() => setDiagnosticMode(!diagnosticMode)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                diagnosticMode
                  ? 'bg-purple-600/30 text-purple-200 border-purple-500 shadow-md shadow-purple-950/40 ring-1 ring-purple-400/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
              }`}
              title="Activer le mode diagnostic pour simuler manuellement des erreurs de communication sur un PLC spécifique et tester l'affichage des alertes"
            >
              <Wrench className={`w-4 h-4 ${diagnosticMode ? 'text-purple-300' : 'text-purple-400'}`} />
              <span>Mode Diagnostic</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                diagnosticMode 
                  ? 'bg-purple-500 text-white border-purple-400 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}>
                {diagnosticMode ? 'ACTIF' : 'TESTS'}
              </span>
            </button>

            {/* Exporter Logs CSV Button */}
            <button
              id="export-logs-csv-btn"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border-emerald-500/40 hover:border-emerald-500/60 shadow-sm"
              title="Télécharger le tableau de bord actuel et les trames Modbus/TCP au format CSV pour analyse hors-ligne des erreurs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exporter Logs</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                CSV
              </span>
            </button>
          </div>
        </div>

        {/* CSV Export Success Banner */}
        {exportNotification && (
          <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white">Export CSV réussi : </span>
                <code className="font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  {exportNotification.filename}
                </code>
                <span className="ml-2 text-slate-300">
                  ({exportNotification.totalCount} trames exportées • {exportNotification.errorCount} erreur(s)/timeout(s) prêtes pour analyse hors-ligne)
                </span>
              </div>
            </div>
            <button 
              onClick={() => setExportNotification(null)}
              className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-emerald-900/40 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Diagnostic Notification Banner */}
        {diagnosticNotification && (
          <div className={`mt-3 p-3 rounded-xl flex items-center justify-between text-xs border ${
            diagnosticNotification.severity === 'CRITICAL'
              ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
              : diagnosticNotification.severity === 'WARNING'
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
              : diagnosticNotification.severity === 'ERROR'
              ? 'bg-purple-950/70 border-purple-500/50 text-purple-200'
              : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center space-x-2.5">
              {diagnosticNotification.severity === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className={`w-4 h-4 shrink-0 animate-pulse ${
                  diagnosticNotification.severity === 'CRITICAL' ? 'text-rose-400' :
                  diagnosticNotification.severity === 'WARNING' ? 'text-amber-400' : 'text-purple-400'
                }`} />
              )}
              <div>
                <span className="font-semibold text-white">
                  {diagnosticNotification.severity === 'SUCCESS' ? 'Diagnostic Rétabli : ' : 'Simulation d\'Incident Active : '}
                </span>
                <span className="font-mono text-slate-200">
                  {diagnosticNotification.message}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setDiagnosticNotification(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setSubTab('plc-modbus')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'plc-modbus'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-300" />
            <span>Tableau de Bord Automates & Modbus/TCP</span>
          </button>

          <button
            onClick={() => setSubTab('opc-ua')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'opc-ua'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Espace d'Adressage OPC UA (IEC 62541)</span>
          </button>

          <button
            onClick={() => setSubTab('csharp')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'csharp'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <span>Driver C# .NET 8 (ModbusTcpMasterClient)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PLC FLEET DASHBOARD & REAL-TIME MODBUS/TCP TERMINAL */}
      {subTab === 'plc-modbus' && (
        <div className="space-y-6">
          
          {/* Top Section: PLC Status & Latency Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>État des Automates Programmables Industriels (PLC) & Latence Réseau</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Subnet: 192.168.1.0/24 • Modbus/TCP Port 502
              </span>
            </div>

            <PlcDashboard
              plcs={plcs}
              machines={machines}
              selectedPlcId={selectedPlcId}
              onSelectPlc={setSelectedPlcId}
              onPollPlc={handlePollPlc}
              onTogglePlcOffline={handleTogglePlcOffline}
              diagnosticMode={diagnosticMode}
              targetDiagnosticPlcId={diagnosticTargetPlcId}
              onSelectTargetDiagnosticPlc={setDiagnosticTargetPlcId}
              onInjectFault={handleInjectFault}
              onResetFault={handleResetFault}
              onResetAllFaults={handleResetAllFaults}
            />
          </div>

          {/* Bottom Section: Real-Time Modbus/TCP Log Terminal */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Trameur Réseau & Logs de Communication Modbus/TCP Simulés (Temps Réel)</span>
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 hidden md:inline">
                  Protocole Modbus Application Protocol v1.1b3 (En-tête MBAP 7 octets + PDU)
                </span>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm"
                  title="Télécharger le journal des trames et erreurs au format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exporter Logs (CSV)</span>
                </button>
              </div>
            </div>

            <ModbusLogTerminal
              logs={modbusLogs}
              plcs={plcs}
              isStreaming={isStreaming}
              onToggleStreaming={() => setIsStreaming(!isStreaming)}
              onClearLogs={() => setModbusLogs([])}
              onManualSend={handleManualSend}
              onExportCsv={handleExportCsv}
            />
          </div>

        </div>
      )}

      {/* VIEW 2: OPC UA ADDRESS SPACE EXPLORER */}
      {subTab === 'opc-ua' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: OPC UA Address Space Explorer */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-4">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Espace d'Adressage OPC UA (Address Space / Nodes)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Protocole OPC UA Binary (IEC 62541)
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Node Identifier</th>
                    <th className="pb-2">Nom / Tag</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Valeur Instantanée</th>
                    <th className="pb-2">Qualité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {opcUaNodes.map(node => (
                    <tr 
                      key={node.nodeId}
                      onClick={() => setSelectedNode(node.nodeId)}
                      className={`cursor-pointer transition-colors ${
                        selectedNode === node.nodeId ? 'bg-sky-950/40 border-l-2 border-sky-400' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 pr-2 font-mono text-[11px] text-sky-300">{node.nodeId}</td>
                      <td className="py-2.5 font-medium text-white">{node.browseName}</td>
                      <td className="py-2.5 font-mono text-[10px] text-slate-400">{node.dataType}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        {typeof node.value === 'number' ? node.value.toLocaleString('fr-FR') : String(node.value)}
                      </td>
                      <td className="py-2.5 pl-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          node.quality === 'Good' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {node.quality}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Node detail display */}
            <div className="p-4 bg-slate-950/70 border-t border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Description du Tag sélectionné :</div>
              <div className="font-semibold text-white">
                {opcUaNodes.find(n => n.nodeId === selectedNode)?.description}
              </div>
            </div>
          </div>

          {/* Col 3: Machine State Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Simulateur d'États Machines</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                OPC UA ONLINE
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Machine toggles */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="font-medium text-white">États Opérationnels Machines :</div>
                
                {machines.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 first:border-0 first:pt-0">
                    <span className="text-slate-300 truncate max-w-[140px]">{m.nom.split(' ')[0]} {m.nom.split(' ')[1] || ''}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onMachineStateChange(m.id, m.statut === 'EnMarche' ? 'ArretNettoyage' : 'EnMarche')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          m.statut === 'EnMarche'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {m.statut}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Background Worker Note */}
              <div className="p-3 bg-sky-950/20 border border-sky-800/40 rounded-xl text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-sky-400">Code C# : IndustrialBackgroundWorker.cs</span>
                <p className="text-slate-400 leading-relaxed">
                  Ce worker hérite de <code className="text-sky-300 font-mono">BackgroundService</code> en .NET 8,
                  effectue un polling non-bloquant sur les nœuds OPC UA via TCP et notifie les services MES en continu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: C# MODBUS DRIVER CODE VIEWER */}
      {subTab === 'csharp' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span>BladyProduction.Connectivity.Industrial / ModbusTcpMasterClient.cs</span>
              </h3>
              <p className="text-xs text-slate-400">
                Implémentation C# .NET 8 du client maître Modbus/TCP utilisant <code className="text-sky-300 font-mono">TcpClient</code> et <code className="text-sky-300 font-mono">Stopwatch</code> pour la mesure de latence RTT.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              .NET 8 / C# 12
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed max-h-[500px]">
            <pre className="text-sky-300">
{`using System.Diagnostics;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace BladyProduction.Connectivity.Industrial;

public interface IModbusTcpMasterClient
{
    Task<ModbusReadResult> ReadHoldingRegistersAsync(string ipAddress, int port, byte unitId, ushort startAddress, ushort count, CancellationToken ct = default);
    Task<ModbusWriteResult> WriteSingleCoilAsync(string ipAddress, int port, byte unitId, ushort coilAddress, bool value, CancellationToken ct = default);
}

public record ModbusReadResult(ushort TransactionId, byte[] RawBytes, ushort[] Registers, double LatencyMs, bool Success, string? ErrorMessage);

public class ModbusTcpMasterClient : IModbusTcpMasterClient
{
    private readonly ILogger<ModbusTcpMasterClient> _logger;
    private ushort _transactionIdCounter = 0;

    public async Task<ModbusReadResult> ReadHoldingRegistersAsync(
        string ipAddress, int port, byte unitId, ushort startAddress, ushort count, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        ushort tid = Interlocked.Increment(ref _transactionIdCounter);

        using var client = new TcpClient();
        await client.ConnectAsync(ipAddress, port, ct);
        using var stream = client.GetStream();

        // Trame MBAP 7 octets: [TID (2B)][Protocol 0x0000 (2B)][Length 0x0006 (2B)][UnitId (1B)] + PDU [FC03][Address (2B)][Count (2B)]
        byte[] request = new byte[12];
        request[0] = (byte)(tid >> 8);
        request[1] = (byte)(tid & 0xFF);
        request[4] = 0x00; request[5] = 0x06;
        request[6] = unitId;
        request[7] = 0x03; // FC03 Read Holding Registers
        request[8] = (byte)(startAddress >> 8); request[9] = (byte)(startAddress & 0xFF);
        request[10] = (byte)(count >> 8); request[11] = (byte)(count & 0xFF);

        await stream.WriteAsync(request, 0, request.Length, ct);

        byte[] response = new byte[9 + (count * 2)];
        int bytesRead = await stream.ReadAsync(response, 0, response.Length, ct);
        sw.Stop();

        // Décodage des registres en mémoire
        ushort[] registers = new ushort[count];
        for (int i = 0; i < count; i++)
        {
            registers[i] = (ushort)((response[9 + i * 2] << 8) | response[9 + i * 2 + 1]);
        }

        return new ModbusReadResult(tid, response, registers, sw.Elapsed.TotalMilliseconds, true, null);
    }
}`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
