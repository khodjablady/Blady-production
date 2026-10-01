import { MachineLigne, InterventionMaintenance, TelemetryAlert } from '../types';

export interface MachineStaticProfile {
  baseRunningHours: number;
  historicalAlertsCount: number;
  criticalAlertsCount: number;
  warningAlertsCount: number;
  mtbfHours: number;
  mttrMinutes: number;
  maintenanceIntervalHours: number;
  recentAlertLogs: {
    id: string;
    timestamp: string;
    parameter: string;
    value: string;
    threshold: string;
    severity: 'WARNING' | 'CRITICAL';
    message: string;
  }[];
}

export const MACHINE_STATIC_PROFILES: Record<number, MachineStaticProfile> = {
  1: {
    baseRunningHours: 2842.5,
    historicalAlertsCount: 14,
    criticalAlertsCount: 3,
    warningAlertsCount: 11,
    mtbfHours: 195,
    mttrMinutes: 48,
    maintenanceIntervalHours: 3000,
    recentAlertLogs: [
      {
        id: 'alt-m1-01',
        timestamp: '30/09/2026 10:14',
        parameter: 'Température Cuve PT100',
        value: '48.6°C',
        threshold: '32.0°C (Max Critique)',
        severity: 'CRITICAL',
        message: 'Dépassement seuil critique régulation thermique réacteur'
      },
      {
        id: 'alt-m1-02',
        timestamp: '28/09/2026 16:42',
        parameter: 'Température Cuve PT100',
        value: '27.4°C',
        threshold: '26.0°C (Max Warning)',
        severity: 'WARNING',
        message: 'Dérive progressive température mélange solution hydro-alcoolique'
      },
      {
        id: 'alt-m1-03',
        timestamp: '25/09/2026 09:18',
        parameter: 'Pression Absolue Cuve',
        value: '1.55 bar',
        threshold: '1.45 bar (Max Warning)',
        severity: 'WARNING',
        message: 'Montée en pression lors de l\'introduction rapide éthanol'
      }
    ]
  },
  2: {
    baseRunningHours: 1964.2,
    historicalAlertsCount: 8,
    criticalAlertsCount: 2,
    warningAlertsCount: 6,
    mtbfHours: 165,
    mttrMinutes: 65,
    maintenanceIntervalHours: 2000,
    recentAlertLogs: [
      {
        id: 'alt-m2-01',
        timestamp: '29/09/2026 14:05',
        parameter: 'Pression Homogénéisation',
        value: '178.5 bar',
        threshold: '170.0 bar (Max Critique)',
        severity: 'CRITICAL',
        message: 'Pic de surpression sur clapet étage 1 d\'homogénéisation'
      },
      {
        id: 'alt-m2-02',
        timestamp: '26/09/2026 11:20',
        parameter: 'Température Corps Pompe',
        value: '29.8°C',
        threshold: '28.0°C (Max Warning)',
        severity: 'WARNING',
        message: 'Échauffement fluide amont dû au cisaillement mécanique'
      }
    ]
  },
  3: {
    baseRunningHours: 3418.8,
    historicalAlertsCount: 16,
    criticalAlertsCount: 4,
    warningAlertsCount: 12,
    mtbfHours: 140,
    mttrMinutes: 38,
    maintenanceIntervalHours: 3500,
    recentAlertLogs: [
      {
        id: 'alt-m3-01',
        timestamp: '29/09/2026 18:30',
        parameter: 'Pression Becs Soutirage',
        value: '2.85 bar',
        threshold: '2.80 bar (Max Critique)',
        severity: 'CRITICAL',
        message: 'Contre-pression élevée détectée lors du remplissage 1L'
      },
      {
        id: 'alt-m3-02',
        timestamp: '27/09/2026 08:45',
        parameter: 'Cadence Soutirage',
        value: '680 U/h',
        threshold: '750 U/h (Min Warning)',
        severity: 'WARNING',
        message: 'Ralentissement cadencement dû à un bourrage amont flacons'
      }
    ]
  },
  4: {
    baseRunningHours: 2154.0,
    historicalAlertsCount: 6,
    criticalAlertsCount: 1,
    warningAlertsCount: 5,
    mtbfHours: 220,
    mttrMinutes: 25,
    maintenanceIntervalHours: 2500,
    recentAlertLogs: [
      {
        id: 'alt-m4-01',
        timestamp: '26/09/2026 15:10',
        parameter: 'Couple Servomoteur Bouchage',
        value: '3.4 N.m',
        threshold: '3.2 N.m (Max Warning)',
        severity: 'WARNING',
        message: 'Couple de vissage légèrement supérieur à la consigne standard'
      }
    ]
  },
  5: {
    baseRunningHours: 1789.3,
    historicalAlertsCount: 11,
    criticalAlertsCount: 2,
    warningAlertsCount: 9,
    mtbfHours: 175,
    mttrMinutes: 30,
    maintenanceIntervalHours: 2000,
    recentAlertLogs: [
      {
        id: 'alt-m5-01',
        timestamp: '28/09/2026 13:22',
        parameter: 'Cellule Détection Écartement',
        value: 'Rebut vision x4',
        threshold: 'Seuil 3 flacons consécutifs',
        severity: 'WARNING',
        message: 'Dérive alignement étiquette face avant'
      }
    ]
  }
};

/**
 * Computes consolidated machine advanced statistics from static profiles,
 * real-time telemetry alerts, and the maintenance interventions journal.
 */
export function getMachineAdvancedStatistics(
  machine: MachineLigne,
  interventions: InterventionMaintenance[],
  activeAlerts: TelemetryAlert[]
) {
  const profile = MACHINE_STATIC_PROFILES[machine.id] || {
    baseRunningHours: 1500,
    historicalAlertsCount: 5,
    criticalAlertsCount: 1,
    warningAlertsCount: 4,
    mtbfHours: 180,
    mttrMinutes: 40,
    maintenanceIntervalHours: 2000,
    recentAlertLogs: []
  };

  // Find all interventions for this machine sorted by date descending
  const machineInterventions = interventions
    .filter(i => i.machineId === machine.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastIntervention = machineInterventions[0] || null;

  // Active alerts for this machine right now
  const currentActiveAlerts = activeAlerts.filter(a => a.machineId === machine.id);
  const totalTriggeredAlerts = profile.historicalAlertsCount + currentActiveAlerts.length;

  // Cumulative operating hours
  const totalOperatingHours = Number((profile.baseRunningHours + (machine.statut === 'EnMarche' ? 2.8 : 0)).toFixed(1));
  const remainingHoursBeforeMaintenance = Math.max(0, profile.maintenanceIntervalHours - totalOperatingHours);
  const maintenanceProgressPct = Math.min(100, Math.round((totalOperatingHours / profile.maintenanceIntervalHours) * 100));

  return {
    totalOperatingHours,
    hoursThisMonth: Number((totalOperatingHours * 0.08).toFixed(1)),
    hoursToday: machine.statut === 'EnMarche' ? 7.6 : 2.4,
    operatingRatioPct: 94.6,
    maintenanceIntervalHours: profile.maintenanceIntervalHours,
    remainingHoursBeforeMaintenance: Number(remainingHoursBeforeMaintenance.toFixed(1)),
    maintenanceProgressPct,
    mtbfHours: profile.mtbfHours,
    mttrMinutes: profile.mttrMinutes,
    totalTriggeredAlerts,
    criticalAlertsCount: profile.criticalAlertsCount + currentActiveAlerts.filter(a => a.severite === 'CRITICAL').length,
    warningAlertsCount: profile.warningAlertsCount + currentActiveAlerts.filter(a => a.severite === 'WARNING').length,
    currentActiveAlerts,
    recentAlertLogs: profile.recentAlertLogs,
    lastIntervention,
    allInterventionsCount: machineInterventions.length,
    machineInterventions
  };
}
