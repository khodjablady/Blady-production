import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Activity, 
  Thermometer, 
  Gauge, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Maximize2, 
  AlertTriangle, 
  Info, 
  Flame, 
  Split, 
  Sliders,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { MachineLigne, MachineTelemetryThresholds } from '../types';
import { TelemetryDataPoint } from '../utils/telemetryTimeSeries';

interface TelemetryD3TimeSeriesChartProps {
  machines: MachineLigne[];
  history: Record<number, TelemetryDataPoint[]>;
  thresholds: Record<number, MachineTelemetryThresholds>;
  selectedMachineId: number;
  onSelectMachineId: (id: number) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onResetSeries: () => void;
  injectedCuveAlarm: boolean;
  onToggleInjectedCuveAlarm: () => void;
  injectedPressureMachineId?: number;
  onToggleInjectedPressure: (machineId: number) => void;
}

export const TelemetryD3TimeSeriesChart: React.FC<TelemetryD3TimeSeriesChartProps> = ({
  machines,
  history,
  thresholds,
  selectedMachineId,
  onSelectMachineId,
  isStreaming,
  onToggleStreaming,
  onResetSeries,
  injectedCuveAlarm,
  onToggleInjectedCuveAlarm,
  injectedPressureMachineId,
  onToggleInjectedPressure
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Display toggles
  const [showTemperature, setShowTemperature] = useState<boolean>(true);
  const [showPressure, setShowPressure] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'OVERLAY' | 'SPLIT'>('OVERLAY');
  const [showThresholdLines, setShowThresholdLines] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryDataPoint | null>(null);

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];
  const seriesData = history[selectedMachineId] || [];
  const currentThresholds = thresholds[selectedMachineId];

  // Latest measurements
  const latestPoint = seriesData[seriesData.length - 1];
  const currentTemp = latestPoint?.temperatureC ?? selectedMachine.temperatureC;
  const currentPress = latestPoint?.pressionBar ?? selectedMachine.pressionBar;

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || seriesData.length === 0) return;

    const containerWidth = containerRef.current.clientWidth || 900;
    const height = viewMode === 'SPLIT' ? 520 : 380;
    const svg = d3.select(svgRef.current);

    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('width', containerWidth).attr('height', height);

    const margin = { top: 30, right: 65, bottom: 40, left: 65 };
    const width = containerWidth - margin.left - margin.right;

    // Defs: Gradients and Glow filters
    const defs = svg.append('defs');

    // Temperature Gradient (Amber to Transparent)
    const tempGrad = defs.append('linearGradient')
      .attr('id', 'temp-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    tempGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.4);
    tempGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.0);

    // Temperature Critical Excursion Gradient (Rose to Transparent)
    const tempCritGrad = defs.append('linearGradient')
      .attr('id', 'temp-crit-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    tempCritGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.6);
    tempCritGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    // Pressure Gradient (Cyan to Transparent)
    const pressGrad = defs.append('linearGradient')
      .attr('id', 'press-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    pressGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.4);
    pressGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Glow filter for threshold lines
    const glowFilter = defs.append('filter').attr('id', 'glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Main Chart Group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Time Scale)
    const xDomain = d3.extent(seriesData, d => d.timestamp) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(xDomain[0] && xDomain[1] ? xDomain : [new Date(Date.now() - 60000), new Date()])
      .range([0, width]);

    // Format for X Axis
    const xAxisFormat = d3.timeFormat('%H:%M:%S');
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.max(4, Math.floor(width / 130)))
      .tickFormat(d => xAxisFormat(d as Date))
      .tickSize(- (viewMode === 'SPLIT' ? height - margin.top - margin.bottom : height - margin.top - margin.bottom))
      .tickPadding(10);

    // Render Grid / X Axis
    const xAxisG = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', '#334155');
    xAxisG.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2');
    xAxisG.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '11px').attr('font-family', 'monospace');

    // ----------------------------------------------------
    // SCENARIO 1: OVERLAY DUAL-AXIS VIEW
    // ----------------------------------------------------
    if (viewMode === 'OVERLAY') {
      const plotHeight = height - margin.top - margin.bottom;

      // Y Scale Temp (Left Axis)
      const validTemps = seriesData.map(d => d.temperatureC).filter((t): t is number => t !== undefined);
      const minTempRaw = validTemps.length > 0 ? d3.min(validTemps)! : 15;
      const maxTempRaw = validTemps.length > 0 ? d3.max(validTemps)! : 35;
      const tempWarn = currentThresholds?.temperature?.maxWarning ?? 26.0;
      const tempCrit = currentThresholds?.temperature?.maxCritical ?? 32.0;
      const yScaleTemp = d3.scaleLinear()
        .domain([Math.min(10, minTempRaw - 2), Math.max(tempCrit + 4, maxTempRaw + 3)])
        .nice()
        .range([plotHeight, 0]);

      // Y Scale Pressure (Right Axis)
      const validPress = seriesData.map(d => d.pressionBar).filter((p): p is number => p !== undefined);
      const minPressRaw = validPress.length > 0 ? d3.min(validPress)! : 0.8;
      const maxPressRaw = validPress.length > 0 ? d3.max(validPress)! : 2.5;
      const pressCrit = currentThresholds?.pression?.maxCritical ?? 1.8;
      const yScalePress = d3.scaleLinear()
        .domain([Math.max(0, minPressRaw * 0.8), Math.max(pressCrit * 1.15, maxPressRaw * 1.1)])
        .nice()
        .range([plotHeight, 0]);

      // Horizontal subtle gridlines
      const yGrid = d3.axisLeft(yScaleTemp)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(() => '');
      g.append('g').attr('class', 'y-grid').call(yGrid)
        .selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3');
      g.selectAll('.y-grid .domain').remove();

      // Threshold Reference Lines: Temperature Warning & Critical
      if (showThresholdLines && currentThresholds?.temperature?.enabled && showTemperature) {
        // Warning threshold line
        const warnY = yScaleTemp(tempWarn);
        if (warnY >= 0 && warnY <= plotHeight) {
          g.append('line')
            .attr('x1', 0).attr('x2', width)
            .attr('y1', warnY).attr('y2', warnY)
            .attr('stroke', '#f59e0b').attr('stroke-width', 1.2).attr('stroke-dasharray', '4,4');
          g.append('text')
            .attr('x', 6).attr('y', warnY - 4)
            .attr('fill', '#f59e0b').attr('font-size', '9px').attr('font-family', 'monospace').attr('font-weight', 'bold')
            .text(`▲ Seuil Alerte T°C (${tempWarn}°C)`);
        }

        // Critical threshold line
        const critY = yScaleTemp(tempCrit);
        if (critY >= 0 && critY <= plotHeight) {
          g.append('line')
            .attr('x1', 0).attr('x2', width)
            .attr('y1', critY).attr('y2', critY)
            .attr('stroke', '#f43f5e').attr('stroke-width', 1.5).attr('stroke-dasharray', '5,3')
            .attr('filter', 'url(#glow)');
          g.append('text')
            .attr('x', 6).attr('y', critY - 4)
            .attr('fill', '#f43f5e').attr('font-size', '10px').attr('font-family', 'monospace').attr('font-weight', 'bold')
            .text(`🚨 Seuil Critique Arrêt T°C (${tempCrit}°C)`);
        }
      }

      // Threshold Reference Lines: Pressure Critical
      if (showThresholdLines && currentThresholds?.pression?.enabled && showPressure) {
        const pCrit = currentThresholds.pression.maxCritical;
        const pCritY = yScalePress(pCrit);
        if (pCritY >= 0 && pCritY <= plotHeight) {
          g.append('line')
            .attr('x1', 0).attr('x2', width)
            .attr('y1', pCritY).attr('y2', pCritY)
            .attr('stroke', '#06b6d4').attr('stroke-width', 1.2).attr('stroke-dasharray', '3,3');
          g.append('text')
            .attr('x', width - 6).attr('y', pCritY - 4)
            .attr('text-anchor', 'end')
            .attr('fill', '#06b6d4').attr('font-size', '9px').attr('font-family', 'monospace').attr('font-weight', 'bold')
            .text(`▲ Max Pression (${pCrit} bar)`);
        }
      }

      // Draw Temperature Area & Curve
      if (showTemperature && validTemps.length > 0) {
        const hasThermalAlarm = seriesData.some(d => d.temperatureC && d.temperatureC >= tempCrit);
        const tempArea = d3.area<TelemetryDataPoint>()
          .defined(d => d.temperatureC !== undefined)
          .x(d => xScale(d.timestamp))
          .y0(plotHeight)
          .y1(d => yScaleTemp(d.temperatureC!))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(seriesData)
          .attr('fill', hasThermalAlarm ? 'url(#temp-crit-gradient)' : 'url(#temp-area-gradient)')
          .attr('d', tempArea);

        const tempLine = d3.line<TelemetryDataPoint>()
          .defined(d => d.temperatureC !== undefined)
          .x(d => xScale(d.timestamp))
          .y(d => yScaleTemp(d.temperatureC!))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(seriesData)
          .attr('fill', 'none')
          .attr('stroke', hasThermalAlarm ? '#f43f5e' : '#f59e0b')
          .attr('stroke-width', 2.5)
          .attr('d', tempLine);

        // Alert Markers on Temperature
        seriesData.forEach(pt => {
          if (pt.temperatureC && pt.temperatureC >= tempCrit) {
            g.append('circle')
              .attr('cx', xScale(pt.timestamp))
              .attr('cy', yScaleTemp(pt.temperatureC))
              .attr('r', 5)
              .attr('fill', '#f43f5e')
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)
              .attr('filter', 'url(#glow)');
          }
        });
      }

      // Draw Pressure Area & Curve
      if (showPressure && validPress.length > 0) {
        const pressArea = d3.area<TelemetryDataPoint>()
          .defined(d => d.pressionBar !== undefined)
          .x(d => xScale(d.timestamp))
          .y0(plotHeight)
          .y1(d => yScalePress(d.pressionBar!))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(seriesData)
          .attr('fill', 'url(#press-area-gradient)')
          .attr('d', pressArea);

        const pressLine = d3.line<TelemetryDataPoint>()
          .defined(d => d.pressionBar !== undefined)
          .x(d => xScale(d.timestamp))
          .y(d => yScalePress(d.pressionBar!))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(seriesData)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', 'none')
          .attr('d', pressLine);
      }

      // Left Axis: Temperature
      if (showTemperature) {
        const yAxisTemp = d3.axisLeft(yScaleTemp)
          .ticks(5)
          .tickFormat(d => `${d}°C`);
        const yAxisG = g.append('g').attr('class', 'y-axis-temp').call(yAxisTemp);
        yAxisG.select('.domain').attr('stroke', '#f59e0b');
        yAxisG.selectAll('.tick line').attr('stroke', '#f59e0b');
        yAxisG.selectAll('.tick text').attr('fill', '#f59e0b').attr('font-size', '11px').attr('font-family', 'monospace').attr('font-weight', 'bold');

        // Axis Label
        g.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', -45).attr('x', -plotHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f59e0b').attr('font-size', '11px').attr('font-weight', 'bold')
          .text('Température (°C)');
      }

      // Right Axis: Pressure
      if (showPressure) {
        const yAxisPress = d3.axisRight(yScalePress)
          .ticks(5)
          .tickFormat(d => `${d} bar`);
        const yAxisPressG = g.append('g').attr('class', 'y-axis-press')
          .attr('transform', `translate(${width},0)`)
          .call(yAxisPress);
        yAxisPressG.select('.domain').attr('stroke', '#06b6d4');
        yAxisPressG.selectAll('.tick line').attr('stroke', '#06b6d4');
        yAxisPressG.selectAll('.tick text').attr('fill', '#06b6d4').attr('font-size', '11px').attr('font-family', 'monospace').attr('font-weight', 'bold');

        // Axis Label
        g.append('text')
          .attr('transform', 'rotate(90)')
          .attr('y', -width - 45).attr('x', plotHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#06b6d4').attr('font-size', '11px').attr('font-weight', 'bold')
          .text('Pression (bar)');
      }

      // Crosshair Hover Interaction
      const crosshair = g.append('g').attr('class', 'crosshair').style('display', 'none');
      const verticalLine = crosshair.append('line')
        .attr('stroke', '#94a3b8').attr('stroke-width', 1).attr('stroke-dasharray', '3,3')
        .attr('y1', 0).attr('y2', plotHeight);

      const circleTemp = crosshair.append('circle').attr('r', 5).attr('fill', '#f59e0b').attr('stroke', '#fff').attr('stroke-width', 1.5);
      const circlePress = crosshair.append('circle').attr('r', 5).attr('fill', '#06b6d4').attr('stroke', '#fff').attr('stroke-width', 1.5);

      const bisect = d3.bisector((d: TelemetryDataPoint) => d.timestamp).center;

      svg.on('mousemove', (event) => {
        const [mx] = d3.pointer(event, g.node());
        if (mx < 0 || mx > width) {
          crosshair.style('display', 'none');
          setHoveredPoint(null);
          return;
        }

        const hoveredDate = xScale.invert(mx);
        const idx = bisect(seriesData, hoveredDate);
        const pt = seriesData[idx];
        if (!pt) return;

        const xPos = xScale(pt.timestamp);
        crosshair.style('display', null);
        verticalLine.attr('x1', xPos).attr('x2', xPos);

        if (pt.temperatureC !== undefined && showTemperature) {
          circleTemp.style('display', null).attr('cx', xPos).attr('cy', yScaleTemp(pt.temperatureC));
        } else {
          circleTemp.style('display', 'none');
        }

        if (pt.pressionBar !== undefined && showPressure) {
          circlePress.style('display', null).attr('cx', xPos).attr('cy', yScalePress(pt.pressionBar));
        } else {
          circlePress.style('display', 'none');
        }

        setHoveredPoint(pt);
      });

      svg.on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
      });

    } 
    // ----------------------------------------------------
    // SCENARIO 2: SPLIT LANES (TEMPERATURE ON TOP, PRESSURE BELOW)
    // ----------------------------------------------------
    else {
      const laneHeight = (height - margin.top - margin.bottom - 40) / 2;

      // Lane 1: Temperature (Top)
      const validTemps = seriesData.map(d => d.temperatureC).filter((t): t is number => t !== undefined);
      const yScaleTemp = d3.scaleLinear()
        .domain([10, Math.max(35, d3.max(validTemps) || 30)])
        .nice()
        .range([laneHeight, 0]);

      // Lane 2: Pressure (Bottom)
      const validPress = seriesData.map(d => d.pressionBar).filter((p): p is number => p !== undefined);
      const yScalePress = d3.scaleLinear()
        .domain([0, Math.max(2.5, (d3.max(validPress) || 2.0) * 1.1)])
        .nice()
        .range([laneHeight, 0]);

      // Group 1: Temperature Lane
      const gTemp = g.append('g').attr('class', 'temp-lane');
      const tempLine = d3.line<TelemetryDataPoint>()
        .defined(d => d.temperatureC !== undefined)
        .x(d => xScale(d.timestamp))
        .y(d => yScaleTemp(d.temperatureC!))
        .curve(d3.curveMonotoneX);

      gTemp.append('path')
        .datum(seriesData)
        .attr('fill', 'url(#temp-area-gradient)')
        .attr('d', d3.area<TelemetryDataPoint>().defined(d => d.temperatureC !== undefined).x(d => xScale(d.timestamp)).y0(laneHeight).y1(d => yScaleTemp(d.temperatureC!)).curve(d3.curveMonotoneX));

      gTemp.append('path')
        .datum(seriesData)
        .attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2).attr('d', tempLine);

      const yAxisTemp = d3.axisLeft(yScaleTemp).ticks(4).tickFormat(d => `${d}°C`);
      gTemp.append('g').call(yAxisTemp).selectAll('text').attr('fill', '#f59e0b').attr('font-mono', 'true');

      // Group 2: Pressure Lane
      const gPress = g.append('g').attr('class', 'press-lane').attr('transform', `translate(0,${laneHeight + 35})`);
      const pressLine = d3.line<TelemetryDataPoint>()
        .defined(d => d.pressionBar !== undefined)
        .x(d => xScale(d.timestamp))
        .y(d => yScalePress(d.pressionBar!))
        .curve(d3.curveMonotoneX);

      gPress.append('path')
        .datum(seriesData)
        .attr('fill', 'url(#press-area-gradient)')
        .attr('d', d3.area<TelemetryDataPoint>().defined(d => d.pressionBar !== undefined).x(d => xScale(d.timestamp)).y0(laneHeight).y1(d => yScalePress(d.pressionBar!)).curve(d3.curveMonotoneX));

      gPress.append('path')
        .datum(seriesData)
        .attr('fill', 'none').attr('stroke', '#06b6d4').attr('stroke-width', 2).attr('d', pressLine);

      const yAxisPress = d3.axisLeft(yScalePress).ticks(4).tickFormat(d => `${d} bar`);
      gPress.append('g').call(yAxisPress).selectAll('text').attr('fill', '#06b6d4').attr('font-mono', 'true');
    }

  }, [seriesData, viewMode, showTemperature, showPressure, showThresholdLines, selectedMachineId, currentThresholds]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Horodatage', 'Heure', 'ID_Machine', 'Machine', 'Temperature_C', 'Pression_bar', 'Est_Alerte', 'Type_Alerte'];
    const rows = seriesData.map(d => [
      d.timestamp.toISOString(),
      d.timeLabel,
      d.machineId,
      `"${selectedMachine.nom.replace(/"/g, '""')}"`,
      d.temperatureC !== undefined ? d.temperatureC : '',
      d.pressionBar !== undefined ? d.pressionBar : '',
      d.isAlert ? 'OUI' : 'NON',
      d.alertType || 'NONE'
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telemetrie_d3_courbes_${selectedMachine.nom.split(' ')[0]}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Historique Temporel & Courbes Télémétriques (D3.js)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80 font-bold">
                  D3 v7.9 Dynamic SVG
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rendu vectoriel haute précision des variations physiques (température, pression) en flux glissant avec projection des seuils d'alarme.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick Test Injections */}
            {selectedMachine.id === 1 && (
              <button
                onClick={onToggleInjectedCuveAlarm}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  injectedCuveAlarm
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-amber-500/30'
                }`}
                title="Injecter une surchauffe immédiate à 48.6°C pour observer le pic sur la courbe D3"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{injectedCuveAlarm ? 'Annuler Pic T°C' : 'Spike T°C (48.6°C)'}</span>
              </button>
            )}

            {(selectedMachine.id === 2 || selectedMachine.id === 3 || selectedMachine.id === 1) && (
              <button
                onClick={() => onToggleInjectedPressure(selectedMachine.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  injectedPressureMachineId === selectedMachine.id
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 border-cyan-500/30'
                }`}
                title="Injecter un pic de pression pour observer l'excursion de courbe"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{injectedPressureMachineId === selectedMachine.id ? 'Annuler Surpression' : 'Spike Pression'}</span>
              </button>
            )}

            {/* Stream Play/Pause */}
            <button
              onClick={onToggleStreaming}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isStreaming
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              {isStreaming ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Flux Continu</span>
                  <Pause className="w-3 h-3 ml-0.5 opacity-60" />
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-amber-400" />
                  <span>En Pause</span>
                </>
              )}
            </button>

            {/* Reset History */}
            <button
              onClick={onResetSeries}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              title="Réinitialiser l'historique de la série temporelle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              title="Exporter les points de mesure affichés au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Machine Selector Tabs */}
        <div className="flex items-center overflow-x-auto space-x-2 mt-4 pt-4 border-t border-slate-800/80">
          {machines.map(m => {
            const isSelected = m.id === selectedMachineId;
            const mData = history[m.id] || [];
            const hasAlert = mData.some(d => d.isAlert);

            return (
              <button
                key={m.id}
                onClick={() => onSelectMachineId(m.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-sky-600/30 text-sky-200 border-sky-500/60 shadow-sm ring-1 ring-sky-500/40 font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  hasAlert 
                    ? 'bg-rose-500 animate-ping' 
                    : m.statut === 'EnMarche' 
                    ? 'bg-emerald-400' 
                    : 'bg-slate-500'
                }`} />
                <span>{m.nom.split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-slate-500">#{m.id}</span>
              </button>
            );
          })}
        </div>

        {/* Live Gauges Bar for current machine */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80">
          
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Température Actuelle</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className={`text-xl font-bold font-mono ${
                  currentTemp !== undefined && currentTemp >= (currentThresholds?.temperature?.maxCritical ?? 32)
                    ? 'text-rose-400 animate-pulse'
                    : currentTemp !== undefined && currentTemp >= (currentThresholds?.temperature?.maxWarning ?? 26)
                    ? 'text-amber-400'
                    : 'text-amber-300'
                }`}>
                  {currentTemp !== undefined ? currentTemp.toFixed(1) : '--'}
                </span>
                <span className="text-xs text-slate-400 font-mono">°C</span>
              </div>
            </div>
            <Thermometer className="w-5 h-5 text-amber-400 opacity-60" />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Pression Circuit</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className={`text-xl font-bold font-mono ${
                  currentPress !== undefined && currentPress >= (currentThresholds?.pression?.maxCritical ?? 1.8)
                    ? 'text-rose-400 animate-pulse'
                    : 'text-cyan-400'
                }`}>
                  {currentPress !== undefined ? currentPress.toFixed(2) : '--'}
                </span>
                <span className="text-xs text-slate-400 font-mono">bar</span>
              </div>
            </div>
            <Gauge className="w-5 h-5 text-cyan-400 opacity-60" />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Cadence Instantanée</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-emerald-400">{selectedMachine.cadenceActuelle}</span>
                <span className="text-xs text-slate-400 font-mono">U/h</span>
              </div>
            </div>
            <Activity className="w-5 h-5 text-emerald-400 opacity-60" />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Points Tracés D3</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-indigo-300">{seriesData.length}</span>
                <span className="text-xs text-slate-400 font-mono">échantillons</span>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-400 opacity-60" />
          </div>

        </div>

      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Chart View Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
          
          {/* Curve Toggles */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTemperature}
                onChange={e => setShowTemperature(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded"
              />
              <span className="font-semibold text-amber-300 flex items-center gap-1">
                <span className="w-2.5 h-1 bg-amber-400 inline-block rounded"></span>
                <span>Température (°C)</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPressure}
                onChange={e => setShowPressure(e.target.checked)}
                className="w-3.5 h-3.5 accent-cyan-500 rounded"
              />
              <span className="font-semibold text-cyan-300 flex items-center gap-1">
                <span className="w-2.5 h-1 bg-cyan-400 inline-block rounded"></span>
                <span>Pression (bar)</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer select-none pl-2 border-l border-slate-800 text-slate-400">
              <input
                type="checkbox"
                checked={showThresholdLines}
                onChange={e => setShowThresholdLines(e.target.checked)}
                className="w-3.5 h-3.5 accent-rose-500 rounded"
              />
              <span>Lignes de seuils</span>
            </label>
          </div>

          {/* View Mode: Overlay vs Split */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Mode d'affichage :</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center space-x-1">
              <button
                onClick={() => setViewMode('OVERLAY')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  viewMode === 'OVERLAY'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Superposition à double axe (Y1: Température, Y2: Pression)"
              >
                Double Axe
              </button>
              <button
                onClick={() => setViewMode('SPLIT')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  viewMode === 'SPLIT'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Deux voies séparées synchronisées"
              >
                Voies Séparées
              </button>
            </div>
          </div>

        </div>

        {/* D3 SVG Container */}
        <div ref={containerRef} className="w-full relative overflow-hidden bg-slate-950/90 rounded-xl border border-slate-800/80 p-2">
          
          <svg 
            ref={svgRef} 
            className="w-full overflow-visible select-none"
          />

          {/* Live Hover Scrubber Info Box */}
          {hoveredPoint && (
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs font-mono space-y-1 pointer-events-none animate-in fade-in">
              <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between gap-4">
                <span>Point échantillon :</span>
                <span className="text-white font-bold">{hoveredPoint.timeLabel}</span>
              </div>
              {hoveredPoint.temperatureC !== undefined && (
                <div className="flex justify-between gap-4">
                  <span className="text-amber-400">Température :</span>
                  <span className={`font-bold ${hoveredPoint.temperatureC >= 32 ? 'text-rose-400' : 'text-white'}`}>
                    {hoveredPoint.temperatureC.toFixed(1)} °C
                  </span>
                </div>
              )}
              {hoveredPoint.pressionBar !== undefined && (
                <div className="flex justify-between gap-4">
                  <span className="text-cyan-400">Pression :</span>
                  <span className="text-white font-bold">{hoveredPoint.pressionBar.toFixed(2)} bar</span>
                </div>
              )}
              {hoveredPoint.isAlert && (
                <div className="text-[10px] text-rose-400 font-bold pt-1 border-t border-slate-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Seuil procédé dépassé</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Legend & Insights Footer */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 rounded"></span>
              <span className="text-slate-300">Température PT100 (Axe gauche °C)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 rounded"></span>
              <span className="text-slate-300">Pression Piézorésistive (Axe droit bar)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-300">Dépassement de seuil</span>
            </span>
          </div>

          <div className="font-mono text-slate-500">
            Survolez le graphique pour explorer les valeurs point par point (D3.bisector)
          </div>
        </div>

      </div>

    </div>
  );
};
