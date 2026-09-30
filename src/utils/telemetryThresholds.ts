import { MachineLigne, MachineTelemetryThresholds, TelemetryAlert } from '../types';

export const STORAGE_KEY_THRESHOLDS = 'blady_telemetry_thresholds_v1';

export const DEFAULT_TELEMETRY_THRESHOLDS: Record<number, MachineTelemetryThresholds> = {
  // Machine 1: Cuve Réacteur Agité R-5000L
  1: {
    machineId: 1,
    machineNom: 'Cuve Réacteur Agité R-5000L (Mélange)',
    temperature: {
      enabled: true,
      min: 10.0,
      maxWarning: 26.0,
      maxCritical: 32.0,
      unit: '°C'
    },
    pression: {
      enabled: true,
      min: 0.8,
      maxWarning: 1.45,
      maxCritical: 1.8,
      unit: 'bar'
    },
    cadence: {
      enabled: true,
      minWarning: 2400,
      maxWarning: 3200,
      unit: 'L/h'
    }
  },

  // Machine 2: Homogénéisateur Haute Pression H-300
  2: {
    machineId: 2,
    machineNom: 'Homogénéisateur Haute Pression H-300',
    temperature: {
      enabled: true,
      min: 15.0,
      maxWarning: 29.0,
      maxCritical: 36.0,
      unit: '°C'
    },
    pression: {
      enabled: true,
      min: 110.0,
      maxWarning: 155.0,
      maxCritical: 175.0,
      unit: 'bar'
    },
    cadence: {
      enabled: true,
      minWarning: 2000,
      maxWarning: 2700,
      unit: 'L/h'
    }
  },

  // Machine 3: Remplisseuse Volumétrique Rotative 12 Becs
  3: {
    machineId: 3,
    machineNom: 'Remplisseuse Volumétrique Rotative 12 Becs',
    temperature: {
      enabled: true,
      min: 12.0,
      maxWarning: 24.5,
      maxCritical: 28.5,
      unit: '°C'
    },
    pression: {
      enabled: true,
      min: 1.6,
      maxWarning: 2.35,
      maxCritical: 2.75,
      unit: 'bar'
    },
    cadence: {
      enabled: true,
      minWarning: 800,
      maxWarning: 1100,
      unit: 'fl/h'
    }
  },

  // Machine 4: Boucheuse Automatique Servomoteur
  4: {
    machineId: 4,
    machineNom: 'Boucheuse Automatique Servomoteur',
    pression: {
      enabled: true,
      min: 1.8,
      maxWarning: 3.2,
      maxCritical: 3.6,
      unit: 'bar'
    },
    cadence: {
      enabled: true,
      minWarning: 800,
      maxWarning: 1100,
      unit: 'fl/h'
    }
  },

  // Machine 5: Étiqueteuse Linéaire Double Face Haute Vitesse
  5: {
    machineId: 5,
    machineNom: 'Étiqueteuse Linéaire Double Face Haute Vitesse',
    cadence: {
      enabled: true,
      minWarning: 800,
      maxWarning: 1200,
      unit: 'fl/h'
    }
  }
};

/**
 * Load thresholds from localStorage or fall back to default
 */
export function loadTelemetryThresholds(): Record<number, MachineTelemetryThresholds> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
    if (!raw) return { ...DEFAULT_TELEMETRY_THRESHOLDS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_TELEMETRY_THRESHOLDS, ...parsed };
  } catch {
    return { ...DEFAULT_TELEMETRY_THRESHOLDS };
  }
}

/**
 * Save thresholds to localStorage
 */
export function saveTelemetryThresholds(thresholds: Record<number, MachineTelemetryThresholds>): void {
  try {
    localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(thresholds));
  } catch (err) {
    console.warn('[TelemetryThresholds] Unable to save to localStorage:', err);
  }
}

/**
 * Evaluates active telemetry readings against configured thresholds.
 */
export function evaluateTelemetryAlerts(
  machines: MachineLigne[],
  thresholds: Record<number, MachineTelemetryThresholds>,
  injectedCuveAlarm: boolean = false,
  injectedHighPressureMachineId?: number
): TelemetryAlert[] {
  const alerts: TelemetryAlert[] = [];
  const now = new Date().toLocaleTimeString('fr-FR');

  machines.forEach(machine => {
    const config = thresholds[machine.id];
    if (!config) return;

    // 1. Température evaluation
    if (config.temperature && config.temperature.enabled) {
      let currentTemp = machine.temperatureC;
      // Handle simulated cuve thermal alarm
      if (machine.id === 1 && injectedCuveAlarm) {
        currentTemp = 48.6;
      }

      if (currentTemp !== undefined) {
        const { min, maxWarning, maxCritical, unit } = config.temperature;

        if (currentTemp >= maxCritical) {
          alerts.push({
            id: `alert-temp-crit-${machine.id}`,
            machineId: machine.id,
            machineNom: machine.nom,
            parametre: 'temperature',
            parametreNom: 'Température Procédé',
            valeurActuelle: currentTemp,
            valeurSeuil: maxCritical,
            unite: unit,
            severite: 'CRITICAL',
            typeBreach: 'HIGH_CRITICAL',
            message: `Température critique à ${currentTemp} ${unit} (seuil critique : ${maxCritical} ${unit}) — Écart +${(currentTemp - maxCritical).toFixed(1)} ${unit} ! Risque d'emballement ou dégradation produit.`,
            timestamp: now
          });
        } else if (currentTemp >= maxWarning) {
          alerts.push({
            id: `alert-temp-warn-${machine.id}`,
            machineId: machine.id,
            machineNom: machine.nom,
            parametre: 'temperature',
            parametreNom: 'Température Procédé',
            valeurActuelle: currentTemp,
            valeurSeuil: maxWarning,
            unite: unit,
            severite: 'WARNING',
            typeBreach: 'HIGH_WARNING',
            message: `Température anormale à ${currentTemp} ${unit} (seuil alerte : ${maxWarning} ${unit}) — Écart +${(currentTemp - maxWarning).toFixed(1)} ${unit}. Surveillance requise.`,
            timestamp: now
          });
        } else if (min !== undefined && currentTemp < min) {
          alerts.push({
            id: `alert-temp-min-${machine.id}`,
            machineId: machine.id,
            machineNom: machine.nom,
            parametre: 'temperature',
            parametreNom: 'Température Procédé',
            valeurActuelle: currentTemp,
            valeurSeuil: min,
            unite: unit,
            severite: 'WARNING',
            typeBreach: 'LOW_WARNING',
            message: `Température trop basse à ${currentTemp} ${unit} (seuil min : ${min} ${unit}) — Risque d'épaississement ou solidification.`,
            timestamp: now
          });
        }
      }
    }

    // 2. Pression evaluation
    if (config.pression && config.pression.enabled) {
      let currentPress = machine.pressionBar;
      if (injectedHighPressureMachineId === machine.id) {
        currentPress = config.pression.maxCritical + 5.0;
      }

      if (currentPress !== undefined) {
        const { min, maxWarning, maxCritical, unit } = config.pression;

        if (currentPress >= maxCritical) {
          alerts.push({
            id: `alert-press-crit-${machine.id}`,
            machineId: machine.id,
            machineNom: machine.nom,
            parametre: 'pression',
            parametreNom: 'Pression Circuit',
            valeurActuelle: currentPress,
            valeurSeuil: maxCritical,
            unite: unit,
            severite: 'CRITICAL',
            typeBreach: 'HIGH_CRITICAL',
            message: `Pression critique à ${currentPress} ${unit} (seuil max : ${maxCritical} ${unit}) — Déclenchement sécurité imminent ou surpression hydraulique !`,
            timestamp: now
          });
        } else if (currentPress >= maxWarning) {
          alerts.push({
            id: `alert-press-warn-${machine.id}`,
            machineId: machine.id,
            machineNom: machine.nom,
            parametre: 'pression',
            parametreNom: 'Pression Circuit',
            valeurActuelle: currentPress,
            valeurSeuil: maxWarning,
            unite: unit,
            severite: 'WARNING',
            typeBreach: 'HIGH_WARNING',
            message: `Pression haute à ${currentPress} ${unit} (seuil alerte : ${maxWarning} ${unit}). Vérifier circuit refoulement et vannes.`,
            timestamp: now
          });
        } else if (min !== undefined && currentPress < min) {
          alerts.push({
            id: `alert-press-min-${machine.id}`,
            machineId: machine.id,
            machineNom: machine.nom,
            parametre: 'pression',
            parametreNom: 'Pression Circuit',
            valeurActuelle: currentPress,
            valeurSeuil: min,
            unite: unit,
            severite: 'WARNING',
            typeBreach: 'LOW_WARNING',
            message: `Pression insuffisante à ${currentPress} ${unit} (seuil min : ${min} ${unit}) — Défaut d'alimentation ou amorçage pompe.`,
            timestamp: now
          });
        }
      }
    }

    // 3. Cadence evaluation (if machine is running)
    if (config.cadence && config.cadence.enabled && machine.statut === 'EnMarche') {
      const { minWarning, unit } = config.cadence;
      if (minWarning !== undefined && machine.cadenceActuelle < minWarning) {
        alerts.push({
          id: `alert-cadence-min-${machine.id}`,
          machineId: machine.id,
          machineNom: machine.nom,
          parametre: 'cadence',
          parametreNom: 'Cadence de Production',
          valeurActuelle: machine.cadenceActuelle,
          valeurSeuil: minWarning,
          unite: unit,
          severite: 'WARNING',
          typeBreach: 'LOW_WARNING',
          message: `Cadence ralentie à ${machine.cadenceActuelle} ${unit} (seuil bas : ${minWarning} ${unit}). Sous-vitesse constatée.`,
          timestamp: now
        });
      }
    }
  });

  return alerts;
}
