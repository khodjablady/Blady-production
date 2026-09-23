import { Article, OeeMetrics } from '../types';

export interface DailyStockDataPoint {
  date: string; // YYYY-MM-DD
  label: string; // "01 Sep", "02 Sep", etc.
  dayIndex: number; // 1 to 30
  // Stocks in units / litres
  'PF-VIR-1000': number;
  'PF-SAV-5000': number;
  'MP-ETH-96': number;
  'MP-H2O2-30': number;
  'MP-GLY-99': number;
  'MP-EAU-OSM': number;
  'EMB-FLAC-1L': number;
  'EMB-BOUCH-SPRAY': number;
  'EMB-BID-5L': number;
  // Aggregated indicators
  valeurTotaleStock: number; // €
  entreesVolume: number; // Inflows (L or Units received)
  sortiesVolume: number; // Outflows (consumed in MES + shipped)
  articlesSousSeuil: number;
}

export interface DailyOeeDataPoint {
  date: string;
  label: string;
  dayIndex: number;
  disponibilite: number; // %
  performance: number;   // %
  qualite: number;       // %
  trsGlobal: number;     // % = (D * P * Q) / 10000
  targetTrs: number;     // 85.0% World Class standard
  volumeProduit: number; // Finished units produced
  volumeCible: number;   // Target theoretical units
  rebuts: number;        // Defective units/litres
  tauxRebut: number;     // %
  tempsArretMin: number; // Total downtime in minutes
  incidentRemarquable?: string;
  ofAssocie?: string;
}

export interface LossCauseDataPoint {
  cause: string;
  minutes: number;
  pourcentage: number;
  categorie: 'Disponibilité' | 'Performance' | 'Qualité';
  couleur: string;
}

/**
 * Generates coherent 30-day historical data for both ERP inventory and MES OEE performance.
 * Anchored to end at the current system state.
 */
export function generate30DaysHistory(
  currentArticles: Article[],
  currentOee: OeeMetrics
): {
  stockHistory: DailyStockDataPoint[];
  oeeHistory: DailyOeeDataPoint[];
  lossPareto: LossCauseDataPoint[];
} {
  const stockHistory: DailyStockDataPoint[] = [];
  const oeeHistory: DailyOeeDataPoint[] = [];

  // Anchor date: 2026-09-21 (current local date)
  const anchorDate = new Date('2026-09-21T08:00:00Z');

  // Baseline prices for stock valuation
  const priceMap: Record<string, number> = {
    'PF-VIR-1000': 4.85,
    'PF-SAV-5000': 14.20,
    'MP-ETH-96': 1.65,
    'MP-H2O2-30': 2.10,
    'MP-GLY-99': 3.40,
    'MP-EAU-OSM': 0.05,
    'EMB-FLAC-1L': 0.28,
    'EMB-BOUCH-SPRAY': 0.35,
    'EMB-BID-5L': 1.15,
  };

  // Thresholds for alerts count
  const criticalMap: Record<string, number> = {
    'PF-VIR-1000': 300,
    'PF-SAV-5000': 80,
    'MP-ETH-96': 2500,
    'MP-H2O2-30': 200,
    'MP-GLY-99': 350,
    'MP-EAU-OSM': 4000,
    'EMB-FLAC-1L': 2000,
    'EMB-BOUCH-SPRAY': 2000,
    'EMB-BID-5L': 500,
  };

  // Find current values
  const getCurrStock = (code: string, fallback: number) => {
    const art = currentArticles.find(a => a.code === code);
    return art ? art.stockTheorique : fallback;
  };

  const finalEthanol = getCurrStock('MP-ETH-96', 1850);
  const finalVirucide = getCurrStock('PF-VIR-1000', 450);
  const finalSavon = getCurrStock('PF-SAV-5000', 120);
  const finalH2O2 = getCurrStock('MP-H2O2-30', 380);
  const finalGly = getCurrStock('MP-GLY-99', 210);
  const finalEau = getCurrStock('MP-EAU-OSM', 14500);
  const finalFlac = getCurrStock('EMB-FLAC-1L', 3200);
  const finalSpray = getCurrStock('EMB-BOUCH-SPRAY', 2900);
  const finalBidon = getCurrStock('EMB-BID-5L', 850);

  // Key notable events across 30 days
  const specialEvents: Record<number, { incident: string; of: string; trsDrop?: number; stockInflow?: string }> = {
    4: { incident: 'Arrêt planifié maintenance préventive NEP', of: 'OF-2026-0814', trsDrop: 12 },
    8: { incident: 'Réception citerne vrac Éthanol 3000L', of: 'OF-2026-0818', stockInflow: 'Ethanol' },
    12: { incident: 'Micro-arrêts réglage couple visseuse', of: 'OF-2026-0822', trsDrop: 6 },
    17: { incident: 'Changement de format flacon 1L vers bidon 5L', of: 'OF-2026-0827', trsDrop: 8 },
    21: { incident: 'Cadence record sur lot virucide export', of: 'OF-2026-0831' },
    25: { incident: 'Purge circuit suite détection bulles d’air', of: 'OF-2026-0835', trsDrop: 5 },
    28: { incident: 'Alerte seuil bas Éthanol & déclenchement MRP', of: 'OF-2026-0839' },
    30: { incident: 'Cycle en cours — Déclaration opérateur active', of: 'OF-2026-0840' }
  };

  for (let i = 29; i >= 0; i--) {
    const dayIndex = 30 - i;
    const dateObj = new Date(anchorDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dayOfMonth = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
    const label = `${dayOfMonth} ${monthName}`;

    const progressRatio = dayIndex / 30; // 0.033 to 1.0

    // OEE Curve Generation
    let baseDispo = 91.0 + Math.sin(dayIndex * 0.7) * 3.5;
    let basePerf = 88.0 + Math.cos(dayIndex * 0.5) * 4.0;
    let baseQual = 98.8 + Math.sin(dayIndex * 1.2) * 0.8;

    // Apply special event drops
    const evt = specialEvents[dayIndex];
    if (evt?.trsDrop) {
      baseDispo -= evt.trsDrop * 0.7;
      basePerf -= evt.trsDrop * 0.3;
    }

    // On the final day (today), calibrate closely with current live OEE
    if (dayIndex === 30) {
      baseDispo = currentOee.disponibilite;
      basePerf = currentOee.performance;
      baseQual = currentOee.qualite;
    }

    baseDispo = Math.max(72, Math.min(97, Number(baseDispo.toFixed(1))));
    basePerf = Math.max(70, Math.min(96, Number(basePerf.toFixed(1))));
    baseQual = Math.max(94, Math.min(99.9, Number(baseQual.toFixed(1))));

    const trs = Number(((baseDispo * basePerf * baseQual) / 10000).toFixed(1));

    // Volume & Rebuts
    const targetVolume = 1000;
    const volumeProduit = Math.round(targetVolume * (trs / 100) * (0.95 + Math.random() * 0.1));
    const scrapRate = Number((100 - baseQual).toFixed(2));
    const rebuts = Math.max(2, Math.round(volumeProduit * (scrapRate / 100)));
    const tempsArretMin = Math.round((100 - baseDispo) * 4.8); // 480 min ouverture

    oeeHistory.push({
      date: dateStr,
      label,
      dayIndex,
      disponibilite: baseDispo,
      performance: basePerf,
      qualite: baseQual,
      trsGlobal: trs,
      targetTrs: 85.0,
      volumeProduit,
      volumeCible: targetVolume,
      rebuts,
      tauxRebut: scrapRate,
      tempsArretMin,
      incidentRemarquable: evt?.incident,
      ofAssocie: evt?.of || `OF-2026-${(810 + dayIndex).toString().padStart(4, '0')}`
    });

    // Stock Trajectory Generation
    // Back-calculated realistically towards current values
    // Ethanol has had a drop from 4500L down to ~1850L with a refill at day 8
    let eth = 4200 - (dayIndex * 110);
    if (dayIndex >= 8) {
      eth += 2500; // Inflow from tank truck
    }
    eth -= (dayIndex - 8) * 120;
    // Blend with actual final day stock
    const ethOffset = finalEthanol - (4200 + (dayIndex >= 8 ? 2500 : 0) - 30 * 115);
    const dayEth = Math.max(800, Math.round(eth + (ethOffset * progressRatio)));

    // Finished goods (PF-VIR-1000): oscillates with batches produced and order shipments
    const virBatchCycles = Math.sin(dayIndex * 0.8) * 200 + 400;
    const virOffset = finalVirucide - 450;
    const dayVir = Math.max(150, Math.round(virBatchCycles + virOffset * progressRatio));

    // Savon (PF-SAV-5000):
    const savBatch = 100 + Math.cos(dayIndex * 0.6) * 60;
    const daySav = Math.max(40, Math.round(savBatch + (finalSavon - 120) * progressRatio));

    // H2O2:
    const dayH2O2 = Math.max(120, Math.round(finalH2O2 + (30 - dayIndex) * 8 + Math.sin(dayIndex) * 40));

    // Glycerol:
    const dayGly = Math.max(100, Math.round(finalGly + (30 - dayIndex) * 12 + Math.cos(dayIndex) * 30));

    // Eau purifiée (demineralized water, large capacity, produced on site):
    const dayEau = Math.max(10000, Math.round(finalEau + Math.sin(dayIndex * 0.4) * 1500));

    // Packaging:
    const dayFlac = Math.max(1200, Math.round(finalFlac + (30 - dayIndex) * 35));
    const daySpray = Math.max(1000, Math.round(finalSpray + (30 - dayIndex) * 30));
    const dayBid = Math.max(300, Math.round(finalBidon + (30 - dayIndex) * 15));

    // Calculate Inflows / Outflows
    let dailyInflow = (dayIndex === 8) ? 3000 : (dayIndex === 20 ? 1500 : (Math.random() > 0.6 ? Math.round(300 + Math.random() * 500) : 0));
    let dailyOutflow = Math.round(volumeProduit * 0.95);

    // Calculate valuation
    const stockMapCurrent: Record<string, number> = {
      'PF-VIR-1000': dayIndex === 30 ? finalVirucide : dayVir,
      'PF-SAV-5000': dayIndex === 30 ? finalSavon : daySav,
      'MP-ETH-96': dayIndex === 30 ? finalEthanol : dayEth,
      'MP-H2O2-30': dayIndex === 30 ? finalH2O2 : dayH2O2,
      'MP-GLY-99': dayIndex === 30 ? finalGly : dayGly,
      'MP-EAU-OSM': dayIndex === 30 ? finalEau : dayEau,
      'EMB-FLAC-1L': dayIndex === 30 ? finalFlac : dayFlac,
      'EMB-BOUCH-SPRAY': dayIndex === 30 ? finalSpray : daySpray,
      'EMB-BID-5L': dayIndex === 30 ? finalBidon : dayBid,
    };

    let totalVal = 0;
    let criticalCount = 0;
    for (const [code, qty] of Object.entries(stockMapCurrent)) {
      totalVal += qty * (priceMap[code] || 1);
      if (qty < (criticalMap[code] || 0)) {
        criticalCount++;
      }
    }

    stockHistory.push({
      date: dateStr,
      label,
      dayIndex,
      'PF-VIR-1000': stockMapCurrent['PF-VIR-1000'],
      'PF-SAV-5000': stockMapCurrent['PF-SAV-5000'],
      'MP-ETH-96': stockMapCurrent['MP-ETH-96'],
      'MP-H2O2-30': stockMapCurrent['MP-H2O2-30'],
      'MP-GLY-99': stockMapCurrent['MP-GLY-99'],
      'MP-EAU-OSM': stockMapCurrent['MP-EAU-OSM'],
      'EMB-FLAC-1L': stockMapCurrent['EMB-FLAC-1L'],
      'EMB-BOUCH-SPRAY': stockMapCurrent['EMB-BOUCH-SPRAY'],
      'EMB-BID-5L': stockMapCurrent['EMB-BID-5L'],
      valeurTotaleStock: Math.round(totalVal),
      entreesVolume: dailyInflow,
      sortiesVolume: dailyOutflow,
      articlesSousSeuil: criticalCount
    });
  }

  // Pareto distribution of cumulative downtime causes over 30 days
  const lossPareto: LossCauseDataPoint[] = [
    { cause: 'Nettoyage en Place (NEP) & Rinçage cuves', minutes: 340, pourcentage: 32.5, categorie: 'Disponibilité', couleur: '#38bdf8' },
    { cause: 'Changement de format (Flacons 1L ↔ Bidons 5L)', minutes: 235, pourcentage: 22.5, categorie: 'Disponibilité', couleur: '#0ea5e9' },
    { cause: 'Ralentissements & Perte de cadence ligne', minutes: 190, pourcentage: 18.2, categorie: 'Performance', couleur: '#f59e0b' },
    { cause: 'Bourrage poste vissage / étiquetage', minutes: 135, pourcentage: 12.9, categorie: 'Disponibilité', couleur: '#fbbf24' },
    { cause: 'Pertes matières premières (fond cuve / purge)', minutes: 90, pourcentage: 8.6, categorie: 'Qualité', couleur: '#ef4444' },
    { cause: 'Rebuts flacons non conformes (contrôle vision)', minutes: 55, pourcentage: 5.3, categorie: 'Qualité', couleur: '#f87171' },
  ];

  return { stockHistory, oeeHistory, lossPareto };
}
