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
  X,
  Settings,
  ShieldAlert,
  BellRing,
  Cloud,
  TrendingUp,
  LineChart,
  Info
} from 'lucide-react';
import { 
  MachineLigne, 
  OpcUaNode, 
  PlcStation, 
  ModbusLogEntry, 
  SimulatedFaultType,
  MachineTelemetryThresholds,
  TelemetryAlert,
  MachineToCloudLogEntry,
  InterventionMaintenance
} from '../types';
import { INITIAL_PLCS, INITIAL_MODBUS_LOGS, generateModbusTelegram } from '../data/plcData';
import { INITIAL_M2C_LOGS, generateMachineToCloudLog } from '../data/machineToCloudData';
import { INITIAL_INTERVENTIONS } from '../data/initialData';
import { 
  loadTelemetryThresholds, 
  saveTelemetryThresholds, 
  evaluateTelemetryAlerts, 
  DEFAULT_TELEMETRY_THRESHOLDS 
} from '../utils/telemetryThresholds';
import { 
  generateInitialTelemetryHistory, 
  appendTelemetryPoint, 
  TelemetryDataPoint 
} from '../utils/telemetryTimeSeries';
import { PlcDashboard } from './PlcDashboard';
import { ModbusLogTerminal } from './ModbusLogTerminal';
import { MachineEditModal } from './MachineEditModal';
import { TelemetryThresholdsPanel } from './TelemetryThresholdsPanel';
import { TelemetryAlertBanner } from './TelemetryAlertBanner';
import { MachineToCloudLogViewer } from './MachineToCloudLogViewer';
import { TelemetryD3TimeSeriesChart } from './TelemetryD3TimeSeriesChart';
import { MachineAdvancedDetailsModal } from './MachineAdvancedDetailsModal';
import { HardwareProtocolLatencyBoard } from './HardwareProtocolLatencyBoard';

interface IndustrialConnectivityViewProps {
  machines: MachineLigne[];
  onMachineStateChange: (machineId: number, newStatut: MachineLigne['statut']) => void;
  onUpdateMachine?: (updatedMachine: MachineLigne) => void;
  isLiveSimulating: boolean;
  interventions?: InterventionMaintenance[];
  onGoToMaintenance?: () => void;
}

export const IndustrialConnectivityView: React.FC<IndustrialConnectivityViewProps> = ({
  machines,
  onMachineStateChange,
  onUpdateMachine,
  isLiveSimulating,
  interventions = INITIAL_INTERVENTIONS,
  onGoToMaintenance
}) => {
  // Navigation tabs inside connectivity
  const [subTab, setSubTab] = useState<'protocols-latency' | 'plc-modbus' | 'opc-ua' | 'm2c' | 'curves' | 'machines' | 'thresholds' | 'csharp'>('protocols-latency');

  // Advanced Details modal state
  const [advancedDetailsMachine, setAdvancedDetailsMachine] = useState<MachineLigne | null>(null);
  const [isAdvancedDetailsOpen, setIsAdvancedDetailsOpen] = useState<boolean>(false);

  const handleOpenAdvancedDetails = (machine: MachineLigne) => {
    setAdvancedDetailsMachine(machine);
    setIsAdvancedDetailsOpen(true);
  };

  // D3 Time-Series Telemetry History state
  const [telemetryHistory, setTelemetryHistory] = useState<Record<number, TelemetryDataPoint[]>>(() => 
    generateInitialTelemetryHistory(machines)
  );
  const [selectedCurveMachineId, setSelectedCurveMachineId] = useState<number>(1);
  const [isCurveStreaming, setIsCurveStreaming] = useState<boolean>(true);

  // Machine-to-Cloud telemetry streaming state
  const [m2cLogs, setM2cLogs] = useState<MachineToCloudLogEntry[]>(INITIAL_M2C_LOGS);
  const [isM2cStreaming, setIsM2cStreaming] = useState<boolean>(true);
  const [activeCloudFault, setActiveCloudFault] = useState<'NORMAL' | 'HIGH_LATENCY' | 'RATE_LIMIT_429' | 'GATEWAY_TIMEOUT_504' | 'INJECTED_THERMAL_ALERT'>('NORMAL');

  // Telemetry threshold state & alerts
  const [thresholds, setThresholds] = useState<Record<number, MachineTelemetryThresholds>>(loadTelemetryThresholds);
  const [injectedPressureMachineId, setInjectedPressureMachineId] = useState<number | undefined>(undefined);
  const [isAlertAcknowledged, setIsAlertAcknowledged] = useState<boolean>(false);

  // Machine editing modal state
  const [editingMachine, setEditingMachine] = useState<MachineLigne | null>(null);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState<boolean>(false);

  const handleOpenEditMachine = (machine: MachineLigne) => {
    setEditingMachine(machine);
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = (updatedMachine: MachineLigne) => {
    if (onUpdateMachine) {
      onUpdateMachine(updatedMachine);
    }
  };

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

  // Evaluate active telemetry alerts against current machine readings
  const activeAlerts = React.useMemo(() => {
    return evaluateTelemetryAlerts(machines, thresholds, injectedAlarm, injectedPressureMachineId);
  }, [machines, thresholds, injectedAlarm, injectedPressureMachineId]);

  // Reset acknowledgment when alert count increases
  const prevAlertsCountRef = useRef<number>(0);
  useEffect(() => {
    if (activeAlerts.length > prevAlertsCountRef.current) {
      setIsAlertAcknowledged(false);
    }
    prevAlertsCountRef.current = activeAlerts.length;
  }, [activeAlerts.length]);

  const handleSaveThresholds = (updated: Record<number, MachineTelemetryThresholds>) => {
    setThresholds(updated);
    saveTelemetryThresholds(updated);
  };

  const handleResetThresholds = () => {
    setThresholds(DEFAULT_TELEMETRY_THRESHOLDS);
    saveTelemetryThresholds(DEFAULT_TELEMETRY_THRESHOLDS);
  };

  const handleToggleInjectedPressure = (machineId: number) => {
    setInjectedPressureMachineId(prev => prev === machineId ? undefined : machineId);
  };

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
            } else if (p.id === 'PLC-04') {
              if (reg.address === '00001') return { ...reg, currentValue: machine?.statut === 'EnMarche' };
            } else if (p.id === 'PLC-05') {
              if (reg.address === '40001') return { ...reg, currentValue: machine?.cadenceActuelle || 920 };
            }
            return reg;
          });

          // Sync PLC status with machine status if not in simulated fault test
          let effectiveStatus = p.status;
          if (!p.simulatedFault || p.simulatedFault === 'NONE') {
            if (machine?.statut === 'Panne') {
              effectiveStatus = 'FAULT';
            } else if (machine?.statut === 'ArretNettoyage' || machine?.statut === 'EnAttente') {
              effectiveStatus = 'STANDBY';
            } else if (machine?.statut === 'EnMarche') {
              effectiveStatus = 'ONLINE';
            }
          }

          return {
            ...p,
            status: effectiveStatus,
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

  // Machine-to-Cloud Real-time Streaming Pipeline Loop
  useEffect(() => {
    if (!isM2cStreaming) return;

    const interval = setInterval(() => {
      setM2cLogs(prev => {
        const effectiveFault = injectedAlarm ? 'INJECTED_THERMAL_ALERT' : activeCloudFault;
        const newLog = generateMachineToCloudLog(machines, prev, effectiveFault);
        return [newLog, ...prev].slice(0, 150);
      });
    }, isLiveSimulating ? 1800 : 3200);

    return () => clearInterval(interval);
  }, [isM2cStreaming, isLiveSimulating, machines, activeCloudFault, injectedAlarm]);

  const handleTriggerManualPing = () => {
    const newLog = generateMachineToCloudLog(machines, m2cLogs, activeCloudFault);
    setM2cLogs(prev => [newLog, ...prev].slice(0, 150));
  };

  // D3 Time-Series Telemetry Streaming Loop
  useEffect(() => {
    if (!isCurveStreaming) return;

    const interval = setInterval(() => {
      setTelemetryHistory(prev => {
        let updated = { ...prev };
        machines.forEach(m => {
          updated = appendTelemetryPoint(
            updated,
            m,
            injectedAlarm,
            injectedPressureMachineId,
            50
          );
        });
        return updated;
      });
    }, isLiveSimulating ? 1500 : 2500);

    return () => clearInterval(interval);
  }, [isCurveStreaming, isLiveSimulating, machines, injectedAlarm, injectedPressureMachineId]);

  const handleResetCurves = () => {
    setTelemetryHistory(generateInitialTelemetryHistory(machines));
  };

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

            {/* Seuils & Alarmes Télémétrie Header Button */}
            <button
              id="header-thresholds-btn"
              onClick={() => setSubTab('thresholds')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeAlerts.length > 0
                  ? 'bg-rose-600/30 text-rose-200 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-400/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
              }`}
              title="Configurer les seuils d'alerte pour les températures et pressions machines"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Seuils Télémétrie</span>
              {activeAlerts.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white border border-rose-400 animate-pulse">
                  {activeAlerts.length}
                </span>
              )}
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
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setSubTab('protocols-latency')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              subTab === 'protocols-latency'
                ? 'bg-gradient-to-r from-sky-600 to-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Matrice Protocoles (OPC UA / Modbus) & Latence</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Live
            </span>
          </button>

          <button
            onClick={() => setSubTab('plc-modbus')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
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
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              subTab === 'opc-ua'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Espace d'Adressage OPC UA (IEC 62541)</span>
          </button>

          <button
            id="subtab-m2c-btn"
            onClick={() => setSubTab('m2c')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              subTab === 'm2c'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span>Flux Machine-to-Cloud (IIoT)</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-0.5"></span>
          </button>

          <button
            id="subtab-curves-btn"
            onClick={() => setSubTab('curves')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              subTab === 'curves'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Courbes Temporelles D3.js</span>
          </button>

          <button
            onClick={() => setSubTab('machines')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              subTab === 'machines'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Machines Opérationnelles ({machines.length})</span>
          </button>

          <button
            onClick={() => setSubTab('thresholds')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              subTab === 'thresholds'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Seuils Télémétrie & Alarmes</span>
            {activeAlerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('csharp')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
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

      {/* Visual Notification Banner for Telemetry Alerts */}
      <TelemetryAlertBanner
        alerts={activeAlerts}
        onOpenThresholdsConfig={() => setSubTab('thresholds')}
        onResetInjectedAlarms={() => {
          setInjectedAlarm(false);
          setInjectedPressureMachineId(undefined);
        }}
        hasInjectedAlarms={injectedAlarm || injectedPressureMachineId !== undefined}
        onAcknowledgeAlerts={() => setIsAlertAcknowledged(true)}
        isAcknowledged={isAlertAcknowledged}
      />

      {/* VIEW: PROTOCOLS STATUS & HARDWARE LATENCY BOARD */}
      {subTab === 'protocols-latency' && (
        <div className="space-y-6">
          <HardwareProtocolLatencyBoard
            machines={machines}
            plcs={plcs}
            isLiveSimulating={isLiveSimulating}
            onPollMachine={(machineId) => {
              const plc = plcs.find(p => p.machineId === machineId);
              if (plc) handlePollPlc(plc.id);
            }}
            onToggleFault={handleTogglePlcOffline}
          />

          {/* Quick Shortcuts to Deep Protocol Analyzers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div 
              onClick={() => setSubTab('opc-ua')}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-sm hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>Explorateur Nœuds OPC UA</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400">
                Consulter les 12 variables industrielles surveillées (niveaux, températures, pressions) sous la norme IEC 62541.
              </p>
            </div>

            <div 
              onClick={() => setSubTab('plc-modbus')}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-sm hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Trameur Réseau Modbus/TCP</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400">
                Inspecter les en-têtes MBAP, Function Codes 03/16 et paquets hexadécimaux échangés à 20Hz.
              </p>
            </div>

            <div 
              onClick={() => setSubTab('m2c')}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-sm hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>Flux Machine-to-Cloud (IIoT)</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400">
                Suivre l'encapsulation télémétrique MQTT Sparkplug B et l'ingestion Cloud en direct.
              </p>
            </div>
          </div>
        </div>
      )}

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
              telemetryAlerts={activeAlerts}
            />
          </div>

          {/* Quick Discovery Banner to Machine-to-Cloud Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Pipeline Cloud Ingest (MQTT Sparkplug B, REST & OPC UA PubSub)</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                    {m2cLogs.length} trames
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Les données capturées sur ces automates sont encapsulées et transmises en continu vers le Cloud pour analyse et archivage.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSubTab('m2c')}
              className="px-3.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition-all hover:scale-[1.02]"
            >
              <span>Voir les logs Machine-to-Cloud</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                <div className="flex items-center justify-between">
                  <div className="font-medium text-white">États Opérationnels Machines :</div>
                  <button
                    onClick={() => setSubTab('machines')}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Gérer le parc</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                
                {machines.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/60 first:border-0 first:pt-0">
                    <div className="flex flex-col truncate max-w-[130px]">
                      <span className="text-slate-200 font-medium truncate">{m.nom}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{m.cadenceActuelle} / {m.cadenceNominale} U/h</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onMachineStateChange(m.id, m.statut === 'EnMarche' ? 'ArretNettoyage' : 'EnMarche')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          m.statut === 'EnMarche'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                        title="Basculer l'état opérationnel"
                      >
                        {m.statut}
                      </button>

                      <button
                        onClick={() => handleOpenEditMachine(m)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700 text-[10px] transition-colors"
                        title="Modifier / Configurer cette machine"
                      >
                        <Settings className="w-3.5 h-3.5" />
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

      {/* VIEW: MACHINE-TO-CLOUD DATA EXCHANGE LOGS */}
      {subTab === 'm2c' && (
        <MachineToCloudLogViewer
          logs={m2cLogs}
          machines={machines}
          isStreaming={isM2cStreaming}
          onToggleStreaming={() => setIsM2cStreaming(!isM2cStreaming)}
          onClearLogs={() => setM2cLogs([])}
          onTriggerManualPing={handleTriggerManualPing}
          onInjectCloudFault={setActiveCloudFault}
          activeCloudFault={activeCloudFault}
        />
      )}

      {/* VIEW: D3.JS TELEMETRY TIME-SERIES CURVES */}
      {subTab === 'curves' && (
        <TelemetryD3TimeSeriesChart
          machines={machines}
          history={telemetryHistory}
          thresholds={thresholds}
          selectedMachineId={selectedCurveMachineId}
          onSelectMachineId={setSelectedCurveMachineId}
          isStreaming={isCurveStreaming}
          onToggleStreaming={() => setIsCurveStreaming(!isCurveStreaming)}
          onResetSeries={handleResetCurves}
          injectedCuveAlarm={injectedAlarm}
          onToggleInjectedCuveAlarm={() => setInjectedAlarm(!injectedAlarm)}
          injectedPressureMachineId={injectedPressureMachineId}
          onToggleInjectedPressure={handleToggleInjectedPressure}
        />
      )}

      {/* VIEW: OPERATIONAL MACHINES FLEET & CONFIGURATION */}
      {subTab === 'machines' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Gestion & Configuration des Machines Opérationnelles</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervisez et modifiez en direct les paramètres nominaux, vitesses, seuils et nœuds OPC UA des machines de la ligne.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[11px] font-semibold">
                {machines.filter(m => m.statut === 'EnMarche').length} / {machines.length} en marche
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map(m => {
              const performancePct = m.cadenceNominale > 0 
                ? Math.round((m.cadenceActuelle / m.cadenceNominale) * 100) 
                : 0;
              const machineAlerts = activeAlerts.filter(a => a.machineId === m.id);
              const hasCritical = machineAlerts.some(a => a.severite === 'CRITICAL');
              const hasAlert = machineAlerts.length > 0;
              const tempAlert = machineAlerts.find(a => a.parametre === 'temperature');
              const pressAlert = machineAlerts.find(a => a.parametre === 'pression');

              const cardBorder = hasCritical
                ? 'border-2 border-rose-500 shadow-2xl shadow-rose-950/80 bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 ring-2 ring-rose-500 animate-pulse'
                : hasAlert
                ? 'border-2 border-amber-500 shadow-xl shadow-amber-950/60 bg-gradient-to-b from-amber-950/25 via-slate-900 to-slate-900 ring-2 ring-amber-500/70 animate-pulse'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900';

              return (
                <div 
                  key={m.id}
                  className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-all flex flex-col justify-between ${cardBorder}`}
                >
                  <div className="space-y-3">
                    {/* Emergency Visual Indicator Beacon (Flashing Red / Amber) */}
                    {hasAlert && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono font-bold animate-pulse ${
                        hasCritical
                          ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/70 ring-1 ring-rose-300'
                          : 'bg-amber-500/25 text-amber-200 border-amber-500/70 ring-1 ring-amber-400/50'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-3 w-3 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasCritical ? 'bg-white' : 'bg-amber-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${hasCritical ? 'bg-rose-200' : 'bg-amber-500'}`}></span>
                          </span>
                          <span className="uppercase tracking-wider">
                            {hasCritical ? '🚨 DÉPASSEMENT SEUIL SÉCURITÉ' : '⚠️ AVERTISSEMENT SEUIL PROCÉDÉ'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono">
                          {machineAlerts.map(a => `${a.parametreNom}: ${a.valeurActuelle}${a.unite}`).join(' • ')}
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800">
                            #{m.id}
                          </span>
                          <h4 className="text-sm font-bold text-white truncate max-w-[170px]" title={m.nom}>
                            {m.nom}
                          </h4>
                          <button
                            onClick={() => handleOpenAdvancedDetails(m)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-sky-600/30 text-slate-400 hover:text-sky-300 border border-slate-700/60 transition-colors"
                            title="Ouvrir les détails avancés (heures de marche, alertes, maintenance)"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Type : <strong className="text-slate-200">{m.type}</strong>
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          m.statut === 'EnMarche'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : m.statut === 'EnAttente'
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              : m.statut === 'ArretNettoyage'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {m.statut === 'EnMarche' ? '● En Marche' : m.statut === 'EnAttente' ? '○ En Attente' : m.statut === 'ArretNettoyage' ? '∿ Nettoyage CIP' : '⚠ En Panne'}
                        </span>

                        {hasAlert && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1 ${
                            hasCritical 
                              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-sm shadow-rose-900' 
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            <span>{hasCritical ? 'SEUIL CRITIQUE' : 'SEUIL WARNING'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Threshold Alert on Machine */}
                    {hasAlert && (
                      <div className={`p-2 rounded-xl border flex flex-col gap-1 text-[11px] font-mono ${
                        hasCritical ? 'bg-rose-950/90 border-rose-500/90 text-rose-200' : 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-[10px] uppercase">
                          <span className="flex items-center gap-1">
                            <ShieldAlert className={`w-3.5 h-3.5 ${hasCritical ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                            <span>Anomalie Télémétrie Détectée</span>
                          </span>
                          <button
                            onClick={() => setSubTab('thresholds')}
                            className="text-[9px] underline hover:text-white"
                          >
                            Régler seuils
                          </button>
                        </div>
                        {machineAlerts.map(a => (
                          <div key={a.id} className="text-[10px] pl-4 text-slate-200">
                            • {a.parametreNom} : <span className="font-bold text-white underline">{a.valeurActuelle} {a.unite}</span> (seuil : {a.valeurSeuil} {a.unite})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cadences */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cadence réelle / nominale :</span>
                        <span className="font-mono font-bold text-white">
                          {m.cadenceActuelle} / {m.cadenceNominale} U/h
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            performancePct >= 90 ? 'bg-emerald-500' : performancePct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, performancePct))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Rendement Vitesse</span>
                        <span className={performancePct >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {performancePct}%
                        </span>
                      </div>
                    </div>

                    {/* Sensors / Physical values */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {m.temperatureC !== undefined && (
                        <div className={`p-2.5 rounded-xl border flex justify-between items-center transition-all ${
                          tempAlert
                            ? tempAlert.severite === 'CRITICAL'
                              ? 'border-2 border-rose-500 bg-rose-950/90 text-white font-black animate-pulse shadow-md shadow-rose-950 ring-2 ring-rose-400/60'
                              : 'border-2 border-amber-500 bg-amber-950/90 text-amber-200 font-bold ring-1 ring-amber-400/50'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}>
                          <span className="text-slate-400 text-xs">Temp. :</span>
                          <span className={`font-bold ${tempAlert ? 'text-white' : 'text-amber-300'}`}>
                            {m.temperatureC}°C {tempAlert ? '⚠️' : ''}
                          </span>
                        </div>
                      )}
                      {m.pressionBar !== undefined && (
                        <div className={`p-2.5 rounded-xl border flex justify-between items-center transition-all ${
                          pressAlert
                            ? pressAlert.severite === 'CRITICAL'
                              ? 'border-2 border-rose-500 bg-rose-950/90 text-white font-black animate-pulse shadow-md shadow-rose-950 ring-2 ring-rose-400/60'
                              : 'border-2 border-amber-500 bg-amber-950/90 text-amber-200 font-bold ring-1 ring-amber-400/50'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}>
                          <span className="text-slate-400 text-xs">Press. :</span>
                          <span className={`font-bold ${pressAlert ? 'text-white' : 'text-cyan-300'}`}>
                            {m.pressionBar} bar {pressAlert ? '⚠️' : ''}
                          </span>
                        </div>
                      )}
                      {m.capaciteMaxLitres !== undefined && (
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Capacité :</span>
                          <span className="text-slate-200">{m.capaciteMaxLitres} L</span>
                        </div>
                      )}
                      {m.niveauCuveLitres !== undefined && (
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Niveau :</span>
                          <span className="text-emerald-300 font-bold">{m.niveauCuveLitres} L</span>
                        </div>
                      )}
                    </div>

                    {/* OPC UA Node */}
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 truncate">
                      <span className="text-slate-500">Nœud OPC UA:</span> <span className="text-sky-300">{m.nodeOpcUa}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onMachineStateChange(m.id, m.statut === 'EnMarche' ? 'ArretNettoyage' : 'EnMarche')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        m.statut === 'EnMarche'
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {m.statut === 'EnMarche' ? 'Arrêter / Nettoyer' : 'Démarrer'}
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleOpenAdvancedDetails(m)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-white border border-slate-700 hover:border-sky-500/50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all hover:scale-[1.02]"
                        title="Consulter les statistiques avancées (heures de marche, alertes, dernière maintenance)"
                      >
                        <Info className="w-3.5 h-3.5 text-sky-400" />
                        <span>Détails avancés</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCurveMachineId(m.id);
                          setSubTab('curves');
                        }}
                        className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-white border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all hover:scale-[1.02]"
                        title="Visualiser les courbes temporelles dynamiques D3.js de cette machine"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Courbes D3</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditMachine(m)}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-950/40 transition-colors flex items-center space-x-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: CONFIGURABLE TELEMETRY THRESHOLDS & ALERTS */}
      {subTab === 'thresholds' && (
        <TelemetryThresholdsPanel
          machines={machines}
          thresholds={thresholds}
          onSaveThresholds={handleSaveThresholds}
          onResetDefaults={handleResetThresholds}
          activeAlerts={activeAlerts}
          injectedCuveAlarm={injectedAlarm}
          onToggleInjectedCuveAlarm={() => setInjectedAlarm(!injectedAlarm)}
          injectedPressureMachineId={injectedPressureMachineId}
          onToggleInjectedPressure={handleToggleInjectedPressure}
        />
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

      {/* Machine Edit Modal */}
      <MachineEditModal
        isOpen={isMachineModalOpen}
        machine={editingMachine}
        onClose={() => {
          setIsMachineModalOpen(false);
          setEditingMachine(null);
        }}
        onSave={handleSaveMachine}
      />

      {/* Machine Advanced Details Modal */}
      <MachineAdvancedDetailsModal
        isOpen={isAdvancedDetailsOpen}
        machine={advancedDetailsMachine}
        onClose={() => {
          setIsAdvancedDetailsOpen(false);
          setAdvancedDetailsMachine(null);
        }}
        interventions={interventions}
        activeAlerts={activeAlerts}
        thresholds={advancedDetailsMachine ? thresholds[advancedDetailsMachine.id] : undefined}
        onNavigateToMaintenance={onGoToMaintenance}
        onNavigateToCurves={(machineId) => {
          setSelectedCurveMachineId(machineId);
          setSubTab('curves');
        }}
        onNavigateToThresholds={() => setSubTab('thresholds')}
      />

    </div>
  );
};
