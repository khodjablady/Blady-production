import { OeeMetrics } from '../types';

export interface OeeThresholds {
  disponibilite: number; // Norme standard: 90.0%
  performance: number;   // Norme standard: 85.0%
  qualite: number;       // Norme standard: 98.0%
  trsGlobal: number;     // Norme standard: 80.0%
}

export const INDUSTRIAL_OEE_THRESHOLDS: OeeThresholds = {
  disponibilite: 90.0,
  performance: 85.0,
  qualite: 98.0,
  trsGlobal: 80.0
};

export interface MetricWarningStatus {
  isWarning: boolean;
  metric: 'disponibilite' | 'performance' | 'qualite' | 'trsGlobal';
  label: string;
  currentValue: number;
  threshold: number;
  delta: number;
  severity: 'normal' | 'warning' | 'critical';
  recommendation: string;
}

export function evaluateOeeWarnings(
  oee: OeeMetrics, 
  thresholds: OeeThresholds = INDUSTRIAL_OEE_THRESHOLDS
): {
  hasAnyWarning: boolean;
  warnings: MetricWarningStatus[];
  disponibilite: MetricWarningStatus;
  performance: MetricWarningStatus;
  qualite: MetricWarningStatus;
  trsGlobal: MetricWarningStatus;
} {
  const checkMetric = (
    val: number, 
    thresh: number, 
    metric: 'disponibilite' | 'performance' | 'qualite' | 'trsGlobal',
    label: string,
    rec: string
  ): MetricWarningStatus => {
    const isWarning = val < thresh;
    const delta = Number((val - thresh).toFixed(1));
    const isCritical = val < (thresh - 5.0);
    return {
      isWarning,
      metric,
      label,
      currentValue: val,
      threshold: thresh,
      delta,
      severity: !isWarning ? 'normal' : isCritical ? 'critical' : 'warning',
      recommendation: rec
    };
  };

  const dispoStatus = checkMetric(
    oee.disponibilite,
    thresholds.disponibilite,
    'disponibilite',
    'Disponibilité (D)',
    'Vérifier les micro-arrêts, réapprovisionnement flacons et temps de changement de série.'
  );

  const perfStatus = checkMetric(
    oee.performance,
    thresholds.performance,
    'performance',
    'Performance (P)',
    'Contrôler la vitesse d\'injection remplisseuse et la synchronisation convoyeur.'
  );

  const qualStatus = checkMetric(
    oee.qualite,
    thresholds.qualite,
    'qualite',
    'Qualité (Q)',
    'Inspecter le couple de serrage des bouchons et l\'alignement optique étiqueteuse.'
  );

  const trsStatus = checkMetric(
    oee.trsGlobal,
    thresholds.trsGlobal,
    'trsGlobal',
    'TRS Global (OEE)',
    'Plan d\'action TPM (Total Productive Maintenance) requis pour restaurer la rentabilité de ligne.'
  );

  const allWarnings: MetricWarningStatus[] = [];
  if (dispoStatus.isWarning) allWarnings.push(dispoStatus);
  if (perfStatus.isWarning) allWarnings.push(perfStatus);
  if (qualStatus.isWarning) allWarnings.push(qualStatus);
  if (trsStatus.isWarning) allWarnings.push(trsStatus);

  return {
    hasAnyWarning: allWarnings.length > 0,
    warnings: allWarnings,
    disponibilite: dispoStatus,
    performance: perfStatus,
    qualite: qualStatus,
    trsGlobal: trsStatus
  };
}
