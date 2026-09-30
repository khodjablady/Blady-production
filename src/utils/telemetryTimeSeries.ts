import { MachineLigne } from '../types';

export interface TelemetryDataPoint {
  id: string;
  timestamp: Date;
  timeLabel: string;
  machineId: number;
  temperatureC?: number;
  pressionBar?: number;
  cadenceActuelle?: number;
  isAlert?: boolean;
  alertType?: 'NONE' | 'TEMP_WARNING' | 'TEMP_CRITICAL' | 'PRESS_WARNING' | 'PRESS_CRITICAL';
}

/**
 * Pre-populates realistic historical telemetry series (last 30 points, 2 seconds apart).
 */
export function generateInitialTelemetryHistory(machines: MachineLigne[]): Record<number, TelemetryDataPoint[]> {
  const result: Record<number, TelemetryDataPoint[]> = {};
  const now = Date.now();
  const pointCount = 35;
  const intervalMs = 2000;

  machines.forEach(machine => {
    const points: TelemetryDataPoint[] = [];
    const baseTemp = machine.temperatureC ?? (machine.id === 1 ? 22.4 : machine.id === 2 ? 24.8 : 21.0);
    const basePress = machine.pressionBar ?? (machine.id === 1 ? 1.25 : machine.id === 2 ? 140.0 : 2.10);

    for (let i = pointCount - 1; i >= 0; i--) {
      const pointTime = new Date(now - i * intervalMs);
      const timeLabel = pointTime.toTimeString().split(' ')[0];

      // Add gentle realistic industrial drift
      const tempDrift = Number((Math.sin(i / 4) * 0.4 + (Math.random() * 0.2 - 0.1)).toFixed(2));
      const pressDrift = Number((Math.cos(i / 5) * (basePress > 50 ? 1.8 : 0.05) + (Math.random() * (basePress > 50 ? 0.8 : 0.02) - (basePress > 50 ? 0.4 : 0.01))).toFixed(2));

      points.push({
        id: `pt-${machine.id}-${pointTime.getTime()}`,
        timestamp: pointTime,
        timeLabel,
        machineId: machine.id,
        temperatureC: machine.temperatureC !== undefined ? Number((baseTemp + tempDrift).toFixed(1)) : undefined,
        pressionBar: machine.pressionBar !== undefined ? Number((basePress + pressDrift).toFixed(2)) : undefined,
        cadenceActuelle: machine.cadenceActuelle,
        isAlert: false,
        alertType: 'NONE'
      });
    }

    result[machine.id] = points;
  });

  return result;
}

/**
 * Appends a new real-time point to the machine history, keeping a max buffer of points.
 */
export function appendTelemetryPoint(
  history: Record<number, TelemetryDataPoint[]>,
  machine: MachineLigne,
  injectedCuveAlarm: boolean = false,
  injectedPressureMachineId?: number,
  maxPoints: number = 50
): Record<number, TelemetryDataPoint[]> {
  const now = new Date();
  const timeLabel = now.toTimeString().split(' ')[0];

  let currentTemp = machine.temperatureC;
  if (machine.id === 1 && injectedCuveAlarm) {
    currentTemp = 48.6;
  }

  let currentPress = machine.pressionBar;
  if (injectedPressureMachineId === machine.id) {
    currentPress = machine.id === 2 ? 178.5 : machine.id === 3 ? 3.10 : 2.25;
  }

  // Slight jitter if nominal
  if (currentTemp !== undefined && !(machine.id === 1 && injectedCuveAlarm)) {
    const jitter = Number((Math.random() * 0.16 - 0.08).toFixed(2));
    currentTemp = Number((currentTemp + jitter).toFixed(1));
  }

  if (currentPress !== undefined && injectedPressureMachineId !== machine.id) {
    const jitter = currentPress > 50 
      ? Number((Math.random() * 0.6 - 0.3).toFixed(1))
      : Number((Math.random() * 0.02 - 0.01).toFixed(2));
    currentPress = Number((currentPress + jitter).toFixed(2));
  }

  // Check alert condition
  let isAlert = false;
  let alertType: TelemetryDataPoint['alertType'] = 'NONE';

  if (currentTemp !== undefined && currentTemp >= 32.0) {
    isAlert = true;
    alertType = 'TEMP_CRITICAL';
  } else if (currentTemp !== undefined && currentTemp >= 26.0) {
    isAlert = true;
    alertType = 'TEMP_WARNING';
  }

  if (currentPress !== undefined) {
    if ((machine.id === 1 && currentPress >= 1.8) || (machine.id === 2 && currentPress >= 170.0) || (machine.id === 3 && currentPress >= 2.8)) {
      isAlert = true;
      alertType = 'PRESS_CRITICAL';
    }
  }

  const newPoint: TelemetryDataPoint = {
    id: `pt-${machine.id}-${now.getTime()}`,
    timestamp: now,
    timeLabel,
    machineId: machine.id,
    temperatureC: currentTemp,
    pressionBar: currentPress,
    cadenceActuelle: machine.cadenceActuelle,
    isAlert,
    alertType
  };

  const existingPoints = history[machine.id] || [];
  const updatedPoints = [...existingPoints, newPoint].slice(-maxPoints);

  return {
    ...history,
    [machine.id]: updatedPoints
  };
}
