import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Gauge, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Layers, 
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { OeeMetrics, MachineLigne, OrdreFabrication } from '../types';
import { 
  INDUSTRIAL_OEE_THRESHOLDS, 
  evaluateOeeWarnings, 
  OeeThresholds 
} from '../utils/oeeThresholds';

export interface ShiftDataPoint {
  time: Date;
  timeLabel: string;
  disponibilite: number;
  performance: number;
  qualite: number;
  trsGlobal: number;
  cadence: number;
  event?: string;
  eventType?: 'info' | 'warning' | 'stop';
}

interface ProductionPerformanceProps {
  oee: OeeMetrics;
  machines?: MachineLigne[];
  activeOf?: OrdreFabrication;
  thresholds?: OeeThresholds;
}

type MetricKey = 'all' | 'trs' | 'disponibilite' | 'performance' | 'qualite';
type ShiftType = 'matin' | 'apres-midi' | 'nuit';

export const ProductionPerformance: React.FC<ProductionPerformanceProps> = ({
  oee,
  machines = [],
  activeOf,
  thresholds = INDUSTRIAL_OEE_THRESHOLDS
}) => {
  const currentThresholds = thresholds;
  const oeeWarnings = useMemo(() => evaluateOeeWarnings(oee, currentThresholds), [oee, currentThresholds]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 850, height: 280 });
  const [activeMetric, setActiveMetric] = useState<MetricKey>('all');
  const [activeShift, setActiveShift] = useState<ShiftType>('matin');
  const [granularity, setGranularity] = useState<'15m' | '30m' | '1h'>('30m');
  const [hoveredPoint, setHoveredPoint] = useState<ShiftDataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Generate baseline shift trend data
  const baseShiftData = useMemo<ShiftDataPoint[]>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    let startHour = 6;
    let endHour = 14;

    if (activeShift === 'apres-midi') {
      startHour = 14;
      endHour = 22;
    } else if (activeShift === 'nuit') {
      startHour = 22;
      endHour = 30; // wraps around
    }

    const points: ShiftDataPoint[] = [];
    const stepMinutes = granularity === '15m' ? 15 : granularity === '30m' ? 30 : 60;
    const totalMinutes = 8 * 60;

    for (let m = 0; m <= totalMinutes; m += stepMinutes) {
      const pointDate = new Date(year, month, day, startHour, m, 0);
      const hours = pointDate.getHours().toString().padStart(2, '0');
      const mins = pointDate.getMinutes().toString().padStart(2, '0');
      const timeLabel = `${hours}:${mins}`;

      // Realistic shift progression dynamics:
      // Start of shift (warmup, slight ramp), mid-shift steady state, brief setup stoppage, high performance stretch
      const progress = m / totalMinutes;
      let dVal = 93.0;
      let pVal = 89.0;
      let qVal = 99.2;
      let eventText: string | undefined = undefined;
      let evtType: 'info' | 'warning' | 'stop' | undefined = undefined;

      if (m === 0) {
        dVal = 86.0;
        pVal = 81.0;
        qVal = 98.0;
        eventText = 'Prise de poste · Checklist démarrage ligne';
        evtType = 'info';
      } else if (m === 60) {
        dVal = 91.5;
        pVal = 87.2;
        qVal = 98.7;
        eventText = 'Validation conformité 1er article (CQ libéré)';
        evtType = 'info';
      } else if (m === 120) {
        dVal = 94.0;
        pVal = 91.5;
        qVal = 99.1;
      } else if (m === 180) {
        // Micro-stop event
        dVal = 84.5;
        pVal = 86.0;
        qVal = 97.8;
        eventText = 'Arrêt 12 min · Bourrage goulotte étiqueteuse';
        evtType = 'stop';
      } else if (m === 240) {
        // Mid shift pause / team rotation
        dVal = 89.0;
        pVal = 88.5;
        qVal = 99.0;
        eventText = 'Relève d\'équipe · Nettoyage tête remplisseuse';
        evtType = 'info';
      } else if (m === 300) {
        dVal = 93.5;
        pVal = 92.4;
        qVal = 99.4;
        eventText = 'Pleine cadence atteinte (960 fl/h)';
        evtType = 'info';
      } else if (m === 360) {
        dVal = 94.2;
        pVal = 90.8;
        qVal = 99.0;
      } else if (m === 420) {
        dVal = 92.8;
        pVal = 89.5;
        qVal = 98.9;
        eventText = 'Contrôle métrologique étanchéité bouchons';
        evtType = 'info';
      } else {
        // Smooth interpolation with slight organic noise
        const wave = Math.sin(progress * Math.PI * 3) * 2.2;
        const noise = (Math.cos(m * 17) * 1.2);
        dVal = Number((92.0 + wave + noise).toFixed(1));
        pVal = Number((89.5 + wave * 0.8 - noise * 0.5).toFixed(1));
        qVal = Number((98.9 + Math.sin(m) * 0.4).toFixed(1));
      }

      // Bound values
      dVal = Math.max(70, Math.min(99.5, dVal));
      pVal = Math.max(68, Math.min(98.0, pVal));
      qVal = Math.max(92, Math.min(100, qVal));

      const trs = Number(((dVal / 100) * (pVal / 100) * (qVal / 100) * 100).toFixed(1));
      const cadence = Math.round((pVal / 100) * 1000);

      points.push({
        time: pointDate,
        timeLabel,
        disponibilite: dVal,
        performance: pVal,
        qualite: qVal,
        trsGlobal: trs,
        cadence,
        event: eventText,
        eventType: evtType
      });
    }

    return points;
  }, [activeShift, granularity]);

  // Merge live telemetry values into the latest data points
  const shiftData = useMemo<ShiftDataPoint[]>(() => {
    if (baseShiftData.length === 0) return [];
    const copy = [...baseShiftData];
    const lastIdx = copy.length - 1;
    // Anchor the last point to current live oee props
    copy[lastIdx] = {
      ...copy[lastIdx],
      disponibilite: oee.disponibilite,
      performance: oee.performance,
      qualite: oee.qualite,
      trsGlobal: oee.trsGlobal,
      cadence: machines.find(m => m.type === 'Remplisseuse')?.cadenceActuelle || 920,
      event: 'Point Temps Réel Télémétrie Ligne',
      eventType: 'info'
    };

    // Also adjust the second-to-last point slightly for smooth gradient
    if (lastIdx > 0) {
      const prev = copy[lastIdx - 1];
      copy[lastIdx - 1] = {
        ...prev,
        trsGlobal: Number(((prev.trsGlobal + oee.trsGlobal) / 2).toFixed(1))
      };
    }

    return copy;
  }, [baseShiftData, oee, machines]);

  // ResizeObserver to ensure SVG responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 200) {
          setDimensions({ width, height: 280 });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || shiftData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean slate

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 25, right: 35, bottom: 35, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define gradients
    const defs = svg.append('defs');

    // TRS Area Gradient
    const trsGradient = defs.append('linearGradient')
      .attr('id', 'trs-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    trsGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#38bdf8') // sky-400
      .attr('stop-opacity', 0.28);
    trsGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#38bdf8')
      .attr('stop-opacity', 0.0);

    // Scales
    const xExtent = d3.extent(shiftData, d => d.time) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, innerWidth]);

    // OEE domain: 60% to 105% to give breathing room for 100% and targets
    const yScale = d3.scaleLinear()
      .domain([65, 102])
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yGridTicks = [70, 80, 90, 100];
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yGridTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d === 80 ? 'none' : '3,3')
      .attr('stroke-opacity', d => d === 80 ? 0.8 : 0.4);

    // Target threshold logic based on active metric
    const activeTargetVal = activeMetric === 'disponibilite' 
      ? currentThresholds.disponibilite 
      : activeMetric === 'performance' 
      ? currentThresholds.performance 
      : activeMetric === 'qualite' 
      ? currentThresholds.qualite 
      : currentThresholds.trsGlobal;

    const isCurrentUnderTarget = activeMetric === 'disponibilite'
      ? oeeWarnings.disponibilite.isWarning
      : activeMetric === 'performance'
      ? oeeWarnings.performance.isWarning
      : activeMetric === 'qualite'
      ? oeeWarnings.qualite.isWarning
      : oeeWarnings.trsGlobal.isWarning;

    const targetLabel = activeMetric === 'disponibilite'
      ? `Seuil Dispo ≥ ${currentThresholds.disponibilite}%`
      : activeMetric === 'performance'
      ? `Seuil Perf ≥ ${currentThresholds.performance}%`
      : activeMetric === 'qualite'
      ? `Seuil Qualité ≥ ${currentThresholds.qualite}%`
      : `Cible TRS ≥ ${currentThresholds.trsGlobal}%`;

    // Objective / Target line
    const targetGroup = g.append('g').attr('class', 'target-line-group');
    targetGroup.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(activeTargetVal))
      .attr('y2', yScale(activeTargetVal))
      .attr('stroke', isCurrentUnderTarget ? '#f43f5e' : '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,4');

    const badgeWidth = isCurrentUnderTarget ? 130 : 105;
    targetGroup.append('rect')
      .attr('x', innerWidth - badgeWidth - 4)
      .attr('y', yScale(activeTargetVal) - 18)
      .attr('width', badgeWidth)
      .attr('height', 16)
      .attr('rx', 4)
      .attr('fill', isCurrentUnderTarget ? '#4c0519' : '#064e3b')
      .attr('stroke', isCurrentUnderTarget ? '#e11d48' : '#059669')
      .attr('stroke-width', 0.8);

    targetGroup.append('text')
      .attr('x', innerWidth - (badgeWidth / 2) - 4)
      .attr('y', yScale(activeTargetVal) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', isCurrentUnderTarget ? '#fca5a5' : '#6ee7b7')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(isCurrentUnderTarget ? `${targetLabel} [ALERTE]` : targetLabel);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(width < 500 ? 4 : 8)
      .tickFormat(d => d3.timeFormat('%H:%M')(d as Date));

    const yAxis = d3.axisLeft(yScale)
      .tickValues([70, 80, 90, 100])
      .tickFormat(d => `${d}%`);

    // Render X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'x-axis')
      .call(xAxis)
      .call(axis => axis.select('.domain').attr('stroke', '#475569'))
      .call(axis => axis.selectAll('.tick line').attr('stroke', '#475569'))
      .call(axis => axis.selectAll('.tick text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('dy', '10px'));

    // Render Y Axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call(axis => axis.select('.domain').remove())
      .call(axis => axis.selectAll('.tick line').remove())
      .call(axis => axis.selectAll('.tick text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('dx', '-6px'));

    // Line and Area Generators
    const createLine = (accessor: (d: ShiftDataPoint) => number) => {
      return d3.line<ShiftDataPoint>()
        .x(d => xScale(d.time))
        .y(d => yScale(accessor(d)))
        .curve(d3.curveMonotoneX);
    };

    const trsArea = d3.area<ShiftDataPoint>()
      .x(d => xScale(d.time))
      .y0(innerHeight)
      .y1(d => yScale(d.trsGlobal))
      .curve(d3.curveMonotoneX);

    // 1. TRS Area Fill
    if (activeMetric === 'all' || activeMetric === 'trs') {
      g.append('path')
        .datum(shiftData)
        .attr('fill', 'url(#trs-area-gradient)')
        .attr('d', trsArea);
    }

    // 2. Lines Rendering
    // Availability (Disponibilité) - Sky-500
    if (activeMetric === 'all' || activeMetric === 'disponibilite') {
      g.append('path')
        .datum(shiftData)
        .attr('fill', 'none')
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', activeMetric === 'all' ? '4,2' : 'none')
        .attr('d', createLine(d => d.disponibilite));
    }

    // Performance - Amber-400
    if (activeMetric === 'all' || activeMetric === 'performance') {
      g.append('path')
        .datum(shiftData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', activeMetric === 'all' ? '3,3' : 'none')
        .attr('d', createLine(d => d.performance));
    }

    // Quality (Qualité) - Emerald-400
    if (activeMetric === 'all' || activeMetric === 'qualite') {
      g.append('path')
        .datum(shiftData)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', activeMetric === 'all' ? '6,3' : 'none')
        .attr('d', createLine(d => d.qualite));
    }

    // TRS Global - Main Highlighted Solid Line
    if (activeMetric === 'all' || activeMetric === 'trs') {
      g.append('path')
        .datum(shiftData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8') // Sky-400
        .attr('stroke-width', 2.8)
        .attr('d', createLine(d => d.trsGlobal));
    }

    // Event markers on the timeline (Stoppage, Quality checks, etc.)
    const events = shiftData.filter(d => d.event);
    g.selectAll('.event-marker')
      .data(events)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.time))
      .attr('cy', d => yScale(d.trsGlobal))
      .attr('r', d => d.eventType === 'stop' ? 5.5 : 4)
      .attr('fill', d => d.eventType === 'stop' ? '#f43f5e' : (d.eventType === 'warning' ? '#f59e0b' : '#38bdf8'))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Live pulsing dot at the very latest data point
    const latest = shiftData[shiftData.length - 1];
    if (latest) {
      const pulseGroup = g.append('g').attr('class', 'live-pulse');
      pulseGroup.append('circle')
        .attr('cx', xScale(latest.time))
        .attr('cy', yScale(latest.trsGlobal))
        .attr('r', 8)
        .attr('fill', '#38bdf8')
        .attr('opacity', 0.3)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '4;10;4')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');

      pulseGroup.append('circle')
        .attr('cx', xScale(latest.time))
        .attr('cy', yScale(latest.trsGlobal))
        .attr('r', 4.5)
        .attr('fill', '#38bdf8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

    // Interactive Overlay for crosshair & tooltip tracking
    const crosshair = g.append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const highlightCircle = g.append('circle')
      .attr('class', 'highlight-circle')
      .attr('r', 6)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    const bisectTime = d3.bisector<ShiftDataPoint, Date>(d => d.time).center;

    // Overlay rect to capture pointer interactions
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('pointermove', function(event) {
        const [pointerX, pointerY] = d3.pointer(event);
        const xDate = xScale.invert(pointerX);
        const index = bisectTime(shiftData, xDate);
        const selected = shiftData[index];

        if (selected) {
          const cx = xScale(selected.time);
          const cy = yScale(selected.trsGlobal);

          crosshair
            .attr('x1', cx)
            .attr('x2', cx)
            .style('opacity', 1);

          highlightCircle
            .attr('cx', cx)
            .attr('cy', cy)
            .style('opacity', 1);

          setHoveredPoint(selected);
          setHoverPos({ x: cx + margin.left, y: cy + margin.top });
        }
      })
      .on('pointerleave', function() {
        crosshair.style('opacity', 0);
        highlightCircle.style('opacity', 0);
        setHoveredPoint(null);
        setHoverPos(null);
      });

  }, [shiftData, dimensions, activeMetric]);

  // Derived shift statistics
  const averageTrs = useMemo(() => {
    if (shiftData.length === 0) return 0;
    const sum = shiftData.reduce((acc, curr) => acc + curr.trsGlobal, 0);
    return Number((sum / shiftData.length).toFixed(1));
  }, [shiftData]);

  const minTrs = useMemo(() => {
    if (shiftData.length === 0) return 0;
    return Math.min(...shiftData.map(d => d.trsGlobal));
  }, [shiftData]);

  const maxTrs = useMemo(() => {
    if (shiftData.length === 0) return 0;
    return Math.max(...shiftData.map(d => d.trsGlobal));
  }, [shiftData]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Header with Title, Shift Selector, and Live Status */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Performance de Production (TRS / OEE)
                </h3>
                <span className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Télémétrie Directe D3.js
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi dynamique du quart en cours · Décomposition Disponibilité, Performance et Qualité (Norme NF E60-182)
              </p>
            </div>
          </div>
        </div>

        {/* Shift and Granularity Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Shift Segmented Control */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveShift('matin')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeShift === 'matin'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Poste Matin (06h-14h)
            </button>
            <button
              onClick={() => setActiveShift('apres-midi')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeShift === 'apres-midi'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Après-Midi (14h-22h)
            </button>
            <button
              onClick={() => setActiveShift('nuit')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeShift === 'nuit'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nuit (22h-06h)
            </button>
          </div>

          {/* Granularity */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            {(['15m', '30m', '1h'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                  granularity === g 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 4 Shift KPI Cards: TRS Global, Disponibilité, Performance, Qualité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* TRS Global Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          oeeWarnings.trsGlobal.isWarning
            ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40'
            : activeMetric === 'trs' 
            ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/40' 
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className={`font-semibold flex items-center gap-1.5 ${
              oeeWarnings.trsGlobal.isWarning ? 'text-rose-300' : 'text-slate-300'
            }`}>
              {oeeWarnings.trsGlobal.isWarning && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
              <span>TRS Global (OEE)</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              oeeWarnings.trsGlobal.isWarning 
                ? 'text-rose-300 bg-rose-950 border-rose-800/80' 
                : 'text-sky-400 bg-sky-950 border-sky-800/60'
            }`}>
              D × P × Q
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`text-2xl font-bold font-mono tracking-tight ${
              oeeWarnings.trsGlobal.isWarning ? 'text-rose-500 font-extrabold animate-pulse' : 'text-white'
            }`}>
              {oee.trsGlobal}%
            </div>
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
              oeeWarnings.trsGlobal.isWarning
                ? 'text-rose-300 bg-rose-950/90 border border-rose-700/80 animate-pulse'
                : oee.trsGlobal >= 80 
                ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60' 
                : 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
            }`}>
              {oeeWarnings.trsGlobal.isWarning ? `< ${currentThresholds.trsGlobal}% Alerte Seuil` : '≥ 80% Conforme'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Moyenne shift : <strong className="text-slate-200 font-mono">{averageTrs}%</strong></span>
            <span>Min/Max : <span className="font-mono text-slate-300">{minTrs}% / {maxTrs}%</span></span>
          </div>
        </div>

        {/* Disponibilité Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          oeeWarnings.disponibilite.isWarning
            ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40'
            : activeMetric === 'disponibilite' 
            ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/40' 
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className={`font-semibold flex items-center gap-1.5 ${
              oeeWarnings.disponibilite.isWarning ? 'text-rose-300 font-bold' : 'text-sky-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                oeeWarnings.disponibilite.isWarning ? 'bg-rose-500' : 'bg-sky-500'
              }`}></span>
              Disponibilité (D)
            </span>
            {oeeWarnings.disponibilite.isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`text-2xl font-bold font-mono tracking-tight ${
              oeeWarnings.disponibilite.isWarning ? 'text-rose-500 font-extrabold animate-pulse' : 'text-sky-400'
            }`}>
              {oee.disponibilite}%
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              oeeWarnings.disponibilite.isWarning
                ? 'text-rose-300 bg-rose-950/90 border border-rose-700/80 font-semibold'
                : 'text-slate-400 bg-slate-900 border border-slate-800'
            }`}>
              {oeeWarnings.disponibilite.isWarning ? `< ${currentThresholds.disponibilite}% Alerte` : `Obj: ≥${currentThresholds.disponibilite}%`}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Temps marche : <strong className="text-slate-200 font-mono">443 min</strong></span>
            <span>Arrêts : <strong className="text-rose-400 font-mono">37 min</strong></span>
          </div>
        </div>

        {/* Performance Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          oeeWarnings.performance.isWarning
            ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40'
            : activeMetric === 'performance' 
            ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/40' 
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className={`font-semibold flex items-center gap-1.5 ${
              oeeWarnings.performance.isWarning ? 'text-rose-300 font-bold' : 'text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                oeeWarnings.performance.isWarning ? 'bg-rose-500' : 'bg-amber-400'
              }`}></span>
              Performance (P)
            </span>
            {oeeWarnings.performance.isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`text-2xl font-bold font-mono tracking-tight ${
              oeeWarnings.performance.isWarning ? 'text-rose-500 font-extrabold animate-pulse' : 'text-amber-400'
            }`}>
              {oee.performance}%
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              oeeWarnings.performance.isWarning
                ? 'text-rose-300 bg-rose-950/90 border border-rose-700/80 font-semibold'
                : 'text-slate-400 bg-slate-900 border border-slate-800'
            }`}>
              {oeeWarnings.performance.isWarning ? `< ${currentThresholds.performance}% Alerte` : `Obj: ≥${currentThresholds.performance}%`}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Cadence : <strong className="text-slate-200 font-mono">920 fl/h</strong></span>
            <span>Théorique : <strong className="text-slate-400 font-mono">1 000 fl/h</strong></span>
          </div>
        </div>

        {/* Qualité Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          oeeWarnings.qualite.isWarning
            ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40'
            : activeMetric === 'qualite' 
            ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40' 
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className={`font-semibold flex items-center gap-1.5 ${
              oeeWarnings.qualite.isWarning ? 'text-rose-300 font-bold' : 'text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                oeeWarnings.qualite.isWarning ? 'bg-rose-500' : 'bg-emerald-400'
              }`}></span>
              Qualité (Q)
            </span>
            {oeeWarnings.qualite.isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`text-2xl font-bold font-mono tracking-tight ${
              oeeWarnings.qualite.isWarning ? 'text-rose-500 font-extrabold animate-pulse' : 'text-emerald-400'
            }`}>
              {oee.qualite}%
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              oeeWarnings.qualite.isWarning
                ? 'text-rose-300 bg-rose-950/90 border border-rose-700/80 font-semibold'
                : 'text-slate-400 bg-slate-900 border border-slate-800'
            }`}>
              {oeeWarnings.qualite.isWarning ? `< ${currentThresholds.qualite}% Alerte` : `Obj: ≥${currentThresholds.qualite}%`}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Conformes : <strong className="text-emerald-400 font-mono">{oee.piecesBonnes}</strong></span>
            <span>Rebuts : <strong className="text-rose-400 font-mono">{oee.piecesRebuts}</strong></span>
          </div>
        </div>

      </div>

      {/* D3 Graph Controls & Curve Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-1.5 text-xs flex-wrap gap-y-1.5">
          <span className="text-slate-400 text-[11px] font-medium mr-1.5">Courbes actives :</span>
          
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeMetric === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes les courbes
          </button>

          <button
            onClick={() => setActiveMetric('trs')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeMetric === 'trs'
                ? (oeeWarnings.trsGlobal.isWarning ? 'bg-rose-700 text-white' : 'bg-sky-600 text-white')
                : (oeeWarnings.trsGlobal.isWarning 
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-700/80' 
                    : 'bg-slate-950 text-sky-400 hover:text-sky-300 border border-slate-800')
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${oeeWarnings.trsGlobal.isWarning ? 'bg-rose-400' : 'bg-sky-400'}`}></span>
            <span>TRS Global ({oee.trsGlobal}%)</span>
            {oeeWarnings.trsGlobal.isWarning && <AlertTriangle className="w-3 h-3 text-rose-300 animate-pulse ml-0.5" />}
          </button>

          <button
            onClick={() => setActiveMetric('disponibilite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeMetric === 'disponibilite'
                ? (oeeWarnings.disponibilite.isWarning ? 'bg-rose-700 text-white' : 'bg-sky-700 text-white')
                : (oeeWarnings.disponibilite.isWarning 
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-700/80' 
                    : 'bg-slate-950 text-sky-400 hover:text-sky-300 border border-slate-800')
            }`}
          >
            <span className={`w-2 h-0.5 ${oeeWarnings.disponibilite.isWarning ? 'bg-rose-400' : 'bg-sky-400'}`}></span>
            <span>Dispo ({oee.disponibilite}%)</span>
            {oeeWarnings.disponibilite.isWarning && <AlertTriangle className="w-3 h-3 text-rose-300 animate-pulse ml-0.5" />}
          </button>

          <button
            onClick={() => setActiveMetric('performance')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeMetric === 'performance'
                ? (oeeWarnings.performance.isWarning ? 'bg-rose-700 text-white' : 'bg-amber-600 text-white')
                : (oeeWarnings.performance.isWarning 
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-700/80' 
                    : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800')
            }`}
          >
            <span className={`w-2 h-0.5 ${oeeWarnings.performance.isWarning ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
            <span>Perf ({oee.performance}%)</span>
            {oeeWarnings.performance.isWarning && <AlertTriangle className="w-3 h-3 text-rose-300 animate-pulse ml-0.5" />}
          </button>

          <button
            onClick={() => setActiveMetric('qualite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeMetric === 'qualite'
                ? (oeeWarnings.qualite.isWarning ? 'bg-rose-700 text-white' : 'bg-emerald-600 text-white')
                : (oeeWarnings.qualite.isWarning 
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-700/80' 
                    : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800')
            }`}
          >
            <span className={`w-2 h-0.5 ${oeeWarnings.qualite.isWarning ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
            <span>Qualité ({oee.qualite}%)</span>
            {oeeWarnings.qualite.isWarning && <AlertTriangle className="w-3 h-3 text-rose-300 animate-pulse ml-0.5" />}
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Incident / Seuil critique</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Nominal</span>
          </span>
        </div>
      </div>

      {/* D3 SVG Chart Container */}
      <div 
        ref={containerRef} 
        className="w-full relative bg-slate-950/80 rounded-xl p-3 border border-slate-800/90 overflow-hidden"
      >
        <svg 
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible block"
        />

        {/* Floating Tooltip during pointer hover */}
        {hoveredPoint && hoverPos && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[220px]"
            style={{
              left: Math.min(hoverPos.x + 15, dimensions.width - 240),
              top: Math.max(10, Math.min(hoverPos.y - 70, dimensions.height - 150))
            }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-300 font-mono font-bold">
              <span>Heure {hoveredPoint.timeLabel}</span>
              <span className={hoveredPoint.trsGlobal < currentThresholds.trsGlobal ? 'text-rose-400 font-bold' : 'text-sky-400'}>
                {hoveredPoint.trsGlobal}% TRS {hoveredPoint.trsGlobal < currentThresholds.trsGlobal ? '[ALERTE]' : ''}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 ${
                  hoveredPoint.disponibilite < currentThresholds.disponibilite ? 'text-rose-400 font-semibold' : 'text-sky-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hoveredPoint.disponibilite < currentThresholds.disponibilite ? 'bg-rose-500' : 'bg-sky-400'
                  }`}></span>
                  Disponibilité :
                </span>
                <span className={`font-mono font-semibold ${
                  hoveredPoint.disponibilite < currentThresholds.disponibilite ? 'text-rose-400 font-bold' : 'text-white'
                }`}>
                  {hoveredPoint.disponibilite}% {hoveredPoint.disponibilite < currentThresholds.disponibilite ? '(Alerte <90%)' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 ${
                  hoveredPoint.performance < currentThresholds.performance ? 'text-rose-400 font-semibold' : 'text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hoveredPoint.performance < currentThresholds.performance ? 'bg-rose-500' : 'bg-amber-400'
                  }`}></span>
                  Performance :
                </span>
                <span className={`font-mono font-semibold ${
                  hoveredPoint.performance < currentThresholds.performance ? 'text-rose-400 font-bold' : 'text-white'
                }`}>
                  {hoveredPoint.performance}% {hoveredPoint.performance < currentThresholds.performance ? '(Alerte <85%)' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 ${
                  hoveredPoint.qualite < currentThresholds.qualite ? 'text-rose-400 font-semibold' : 'text-emerald-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hoveredPoint.qualite < currentThresholds.qualite ? 'bg-rose-500' : 'bg-emerald-400'
                  }`}></span>
                  Qualité :
                </span>
                <span className={`font-mono font-semibold ${
                  hoveredPoint.qualite < currentThresholds.qualite ? 'text-rose-400 font-bold' : 'text-white'
                }`}>
                  {hoveredPoint.qualite}% {hoveredPoint.qualite < currentThresholds.qualite ? '(Alerte <98%)' : ''}
                </span>
              </div>
            </div>

            {hoveredPoint.event && (
              <div className={`mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] flex items-start gap-1 ${
                hoveredPoint.eventType === 'stop' 
                  ? 'text-rose-400' 
                  : hoveredPoint.eventType === 'warning' 
                  ? 'text-amber-400' 
                  : 'text-sky-300'
              }`}>
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="leading-snug">{hoveredPoint.event}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Production Context Footnote */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center space-x-2">
          <span className="text-slate-300 font-medium">Ordre de fabrication actif :</span>
          <span className="font-mono text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {activeOf?.numeroOF || 'OF-2026-104'}
          </span>
          <span>·</span>
          <span>Cadence cible : <strong>1 000 flacons/h</strong></span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Formule D3 : curveMonotoneX · Échelle adaptative ISO 22400
        </div>
      </div>

    </div>
  );
};
