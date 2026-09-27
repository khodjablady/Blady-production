import React, { useState, useMemo } from 'react';
import { 
  CalendarRange, 
  Calendar, 
  Clock, 
  Layers, 
  GripVertical, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Pause, 
  X, 
  Check, 
  AlertOctagon,
  CalendarDays,
  Info,
  RotateCcw,
  Sliders,
  Maximize2,
  Package
} from 'lucide-react';
import { OrdreFabrication, Article, MachineLigne } from '../types';

interface PlanningGanttViewProps {
  ordresFabrication: OrdreFabrication[];
  articles: Article[];
  machines: MachineLigne[];
  onUpdateOfSchedule: (ofId: number, newDate: string, newLineId?: number) => void;
  onChangerStatutOf: (ofId: number, nouveauStatut: OrdreFabrication['statut']) => void;
  onCreerOf: () => void;
  onOpenDeclareModal?: (ofItem?: OrdreFabrication) => void;
}

export interface ProductionLineInfo {
  id: number;
  code: string;
  nom: string;
  cadenceNominale: string;
  typeConditionnement: string;
  capaciteHeuresJour: number;
  couleurTheme: string;
}

export const PRODUCTION_LINES: ProductionLineInfo[] = [
  {
    id: 1,
    code: 'LIGNE-01',
    nom: 'Ligne 01 • Conditionnement Flacons 1L',
    cadenceNominale: '1 000 U/h',
    typeConditionnement: 'Flacons PEHD 1000ml + Spray Alcool',
    capaciteHeuresJour: 16, // 2x8h
    couleurTheme: 'sky'
  },
  {
    id: 2,
    code: 'LIGNE-02',
    nom: 'Ligne 02 • Bidonnage Savon Végétal 5L',
    cadenceNominale: '250 U/h',
    typeConditionnement: 'Bidons PEHD 5 Litres Bouchon DIN45',
    capaciteHeuresJour: 16,
    couleurTheme: 'amber'
  },
  {
    id: 3,
    code: 'LIGNE-03',
    nom: 'Ligne 03 • Cuves Formulation & Mélange Vrac',
    cadenceNominale: '3 000 L/h',
    typeConditionnement: 'Préparation réacteurs & dilution solvants',
    capaciteHeuresJour: 24, // 3x8h
    couleurTheme: 'indigo'
  }
];

export const PlanningGanttView: React.FC<PlanningGanttViewProps> = ({
  ordresFabrication,
  articles,
  machines,
  onUpdateOfSchedule,
  onChangerStatutOf,
  onCreerOf,
  onOpenDeclareModal
}) => {
  // Timeline Horizon State
  // Anchor date: Monday 21 Sept 2026
  const [horizonDays, setHorizonDays] = useState<7 | 14 | 21>(7);
  const [startDateStr, setStartDateStr] = useState<string>('2026-09-21');
  const [selectedLineFilter, setSelectedLineFilter] = useState<number | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Drag-and-Drop state
  const [draggedOfId, setDraggedOfId] = useState<number | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ lineId: number; dateStr: string } | null>(null);

  // Modal Detail & Edit
  const [selectedOfDetail, setSelectedOfDetail] = useState<OrdreFabrication | null>(null);
  const [manualDateInput, setManualDateInput] = useState<string>('');
  const [manualLineInput, setManualLineInput] = useState<number>(1);

  // Compute days list based on startDateStr and horizonDays
  const timelineDays = useMemo(() => {
    const days: { dateStr: string; dayLabel: string; dayNum: string; monthLabel: string; isToday: boolean; isWeekend: boolean }[] = [];
    const base = new Date(startDateStr + 'T00:00:00Z');
    const todayStr = '2026-09-21';

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 0; i < horizonDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();

      days.push({
        dateStr: dStr,
        dayLabel: dayNames[dayOfWeek],
        dayNum: String(d.getDate()).padStart(2, '0'),
        monthLabel: monthNames[d.getMonth()],
        isToday: dStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    return days;
  }, [startDateStr, horizonDays]);

  // Navigate time window
  const handleShiftTimeWindow = (days: number) => {
    const current = new Date(startDateStr + 'T00:00:00Z');
    current.setDate(current.getDate() + days);
    setStartDateStr(current.toISOString().slice(0, 10));
  };

  const handleResetToCurrentWeek = () => {
    setStartDateStr('2026-09-21');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, ofItem: OrdreFabrication) => {
    setDraggedOfId(ofItem.id);
    e.dataTransfer.setData('text/plain', String(ofItem.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOfId(null);
    setDragOverCell(null);
  };

  const handleCellDragOver = (e: React.DragEvent, lineId: number, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.lineId !== lineId || dragOverCell.dateStr !== dateStr) {
      setDragOverCell({ lineId, dateStr });
    }
  };

  const handleCellDragLeave = (lineId: number, dateStr: string) => {
    if (dragOverCell?.lineId === lineId && dragOverCell?.dateStr === dateStr) {
      setDragOverCell(null);
    }
  };

  const handleCellDrop = (e: React.DragEvent, targetLineId: number, targetDateStr: string) => {
    e.preventDefault();
    const ofIdStr = e.dataTransfer.getData('text/plain');
    const ofId = parseInt(ofIdStr, 10) || draggedOfId;

    if (ofId) {
      const ofObj = ordresFabrication.find(o => o.id === ofId);
      if (ofObj) {
        // Construct new date preserving existing time if available, or defaulting to 07:00 morning shift
        const existingTime = ofObj.datePlanifiee.includes('T') ? ofObj.datePlanifiee.split('T')[1] : '07:00:00Z';
        const newIsoDate = `${targetDateStr}T${existingTime}`;
        onUpdateOfSchedule(ofId, newIsoDate, targetLineId);
      }
    }
    setDraggedOfId(null);
    setDragOverCell(null);
  };

  // Quick 1-day shift handlers (for accessibility / mobile)
  const handleQuickShiftOf = (ofId: number, deltaDays: number) => {
    const ofObj = ordresFabrication.find(o => o.id === ofId);
    if (!ofObj) return;

    const currentD = new Date(ofObj.datePlanifiee);
    currentD.setDate(currentD.getDate() + deltaDays);
    onUpdateOfSchedule(ofId, currentD.toISOString(), ofObj.ligneProductionId);
  };

  // Filtered OF list
  const filteredOfs = useMemo(() => {
    return ordresFabrication.filter(ofItem => {
      if (selectedLineFilter !== 'ALL' && ofItem.ligneProductionId !== selectedLineFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'ACTIVE' && (ofItem.statut === 'Termine' || ofItem.statut === 'Interrompu')) {
          return false;
        }
        if (selectedStatusFilter === 'PLANIFIE' && ofItem.statut !== 'Planifie') {
          return false;
        }
        if (selectedStatusFilter === 'EN_COURS' && (ofItem.statut === 'Planifie' || ofItem.statut === 'Termine')) {
          return false;
        }
        if (selectedStatusFilter === 'TERMINE' && ofItem.statut !== 'Termine') {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const article = articles.find(a => a.id === ofItem.articleId);
        const matchOf = ofItem.numeroOF.toLowerCase().includes(q);
        const matchLot = ofItem.numeroLotFabrique.toLowerCase().includes(q);
        const matchArticle = article?.designation.toLowerCase().includes(q) || article?.code.toLowerCase().includes(q);
        const matchOp = ofItem.operateur.toLowerCase().includes(q);
        if (!matchOf && !matchLot && !matchArticle && !matchOp) {
          return false;
        }
      }
      return true;
    });
  }, [ordresFabrication, selectedLineFilter, selectedStatusFilter, searchTerm, articles]);

  // KPIs calculation
  const totalOfsCount = ordresFabrication.length;
  const inProgressOfs = ordresFabrication.filter(o => o.statut === 'EnConditionnement' || o.statut === 'EnMelange' || o.statut === 'EnPreparation').length;
  const plannedOfs = ordresFabrication.filter(o => o.statut === 'Planifie').length;
  const completedOfs = ordresFabrication.filter(o => o.statut === 'Termine').length;

  // Conflict / Overlap Detector: finds days where 2 or more OFs are scheduled on the same line
  const conflictCount = useMemo(() => {
    let count = 0;
    PRODUCTION_LINES.forEach(line => {
      const lineOfs = ordresFabrication.filter(o => o.ligneProductionId === line.id && o.statut !== 'Termine');
      const dateMap: Record<string, number> = {};
      lineOfs.forEach(o => {
        const dStr = o.datePlanifiee.slice(0, 10);
        dateMap[dStr] = (dateMap[dStr] || 0) + 1;
      });
      Object.values(dateMap).forEach(val => {
        if (val > 1) count += (val - 1);
      });
    });
    return count;
  }, [ordresFabrication]);

  // Open Edit Modal
  const handleOpenOfModal = (ofItem: OrdreFabrication) => {
    setSelectedOfDetail(ofItem);
    setManualDateInput(ofItem.datePlanifiee.slice(0, 16));
    setManualLineInput(ofItem.ligneProductionId);
  };

  const handleSaveManualEdit = () => {
    if (selectedOfDetail) {
      const newIso = new Date(manualDateInput).toISOString();
      onUpdateOfSchedule(selectedOfDetail.id, newIso, manualLineInput);
      setSelectedOfDetail(null);
    }
  };

  // Status badge styling helper
  const getStatusStyle = (statut: OrdreFabrication['statut']) => {
    switch (statut) {
      case 'EnConditionnement':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200',
          badgeBg: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50',
          progressColor: 'bg-emerald-500',
          label: 'Conditionnement'
        };
      case 'EnMelange':
      case 'EnPreparation':
        return {
          bg: 'bg-amber-950/80 border-amber-500/80 text-amber-200',
          badgeBg: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
          progressColor: 'bg-amber-500',
          label: statut === 'EnMelange' ? 'Mélange Cuve' : 'Préparation'
        };
      case 'Planifie':
        return {
          bg: 'bg-indigo-950/80 border-indigo-500/80 text-indigo-200',
          badgeBg: 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50',
          progressColor: 'bg-indigo-500',
          label: 'Planifié'
        };
      case 'ControleQualite':
        return {
          bg: 'bg-purple-950/80 border-purple-500/80 text-purple-200',
          badgeBg: 'bg-purple-500/30 text-purple-300 border-purple-500/50',
          progressColor: 'bg-purple-500',
          label: 'Contrôle Labo'
        };
      case 'Termine':
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-400',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          progressColor: 'bg-emerald-600',
          label: 'Terminé'
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          progressColor: 'bg-slate-500',
          label: statut
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <CalendarRange className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Planning d'Ordonnancement & Gantt Atelier
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  Glisser-Déposer Actif
                </span>
                {conflictCount > 0 ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center space-x-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{conflictCount} chevauchement(s) détecté(s)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lissage de charge optimal</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                Visualisation interactive des Ordres de Fabrication (OF). Glissez et déposez directement les barres de production sur la grille temporelle pour ajuster la date de début et la ligne d'affectation.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-plan-new-of"
              onClick={onCreerOf}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/50 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Planifier un OF</span>
            </button>
          </div>
        </div>

        {/* Industrial KPI Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total OFs Usine</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight">{totalOfsCount}</span>
              <span className="text-[11px] text-slate-400">ordres</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">OFs En Cours (Lignes)</span>
              <Play className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">{inProgressOfs}</span>
              <span className="text-[11px] text-slate-400">sur ligne</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">OFs Planifiés (File)</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-indigo-300 tracking-tight">{plannedOfs}</span>
              <span className="text-[11px] text-slate-400">en attente</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Lignes Opérationnelles</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-amber-300 tracking-tight">3 / 3</span>
              <span className="text-[11px] text-slate-400">disponibles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        
        {/* Left: Time Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => handleShiftTimeWindow(-7)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Semaine précédente (-7 jours)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetToCurrentWeek}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
              <span>Semaine Courante</span>
            </button>
            <button
              onClick={() => handleShiftTimeWindow(7)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Semaine suivante (+7 jours)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Horizon Scale Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setHorizonDays(7)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                horizonDays === 7 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Jours
            </button>
            <button
              onClick={() => setHorizonDays(14)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                horizonDays === 14 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Jours
            </button>
            <button
              onClick={() => setHorizonDays(21)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                horizonDays === 21 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              21 Jours
            </button>
          </div>
        </div>

        {/* Right: Filters and Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher OF, lot, article..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Line Filter */}
          <select
            value={selectedLineFilter}
            onChange={(e) => setSelectedLineFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Toutes les lignes (3)</option>
            {PRODUCTION_LINES.map(line => (
              <option key={line.id} value={line.id}>
                {line.code} : {line.nom.split('•')[1] || line.nom}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Tous statuts</option>
            <option value="ACTIVE">En cours & Planifiés</option>
            <option value="EN_COURS">En cours uniquement</option>
            <option value="PLANIFIE">Planifiés uniquement</option>
            <option value="TERMINE">Terminés</option>
          </select>
        </div>

      </div>

      {/* Drag & Drop Instruction Hint Strip */}
      <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-indigo-200">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
          <span>
            <strong>Ajustement interactif :</strong> Saisissez et glissez n'importe quelle barre d'OF pour déplacer sa date de début ou réaffecter sa ligne de production.
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] font-mono text-indigo-300/80">
          Mise à jour en temps réel & persistée
        </span>
      </div>

      {/* Gantt Interactive Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            
            {/* Header: Timeline Column Dates */}
            <div className="grid grid-cols-[220px_1fr] border-b border-slate-800 bg-slate-950/90 text-xs font-semibold">
              <div className="p-3.5 border-r border-slate-800 flex items-center justify-between text-slate-400">
                <span className="uppercase tracking-wider text-[11px]">Ressources / Lignes</span>
                <span className="text-[10px] font-mono text-slate-500">Capacité</span>
              </div>

              {/* Day Headers */}
              <div 
                className="grid divide-x divide-slate-800/80"
                style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}
              >
                {timelineDays.map(day => (
                  <div 
                    key={day.dateStr}
                    className={`p-2.5 text-center transition-colors ${
                      day.isToday 
                        ? 'bg-sky-950/50 text-sky-300 font-bold border-b-2 border-sky-400' 
                        : day.isWeekend 
                        ? 'bg-slate-950/40 text-slate-500' 
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-mono">
                      {day.dayLabel}
                    </div>
                    <div className="text-base font-bold font-mono mt-0.5 leading-none">
                      {day.dayNum}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {day.monthLabel}
                    </div>
                    {day.isToday && (
                      <span className="inline-block px-1 py-0.2 rounded text-[8px] bg-sky-500 text-white font-bold mt-1">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Body: Production Lines (Swimlanes) */}
            <div className="divide-y divide-slate-800/80">
              {PRODUCTION_LINES
                .filter(line => selectedLineFilter === 'ALL' || line.id === selectedLineFilter)
                .map(line => {
                  return (
                    <div 
                      key={line.id}
                      className="grid grid-cols-[220px_1fr] group min-h-[140px] hover:bg-slate-950/30 transition-colors"
                    >
                      {/* Left: Production Line Header Card */}
                      <div className="p-4 border-r border-slate-800 bg-slate-950/40 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-900 border border-slate-700 text-white">
                              {line.code}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Ligne en production" />
                          </div>

                          <h3 className="font-bold text-xs text-white mt-2 leading-tight">
                            {line.nom}
                          </h3>

                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {line.typeConditionnement}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Cadence :</span>
                          <span className="text-slate-200 font-bold">{line.cadenceNominale}</span>
                        </div>
                      </div>

                      {/* Right: Days Cells with Task Bars */}
                      <div 
                        className="grid divide-x divide-slate-800/60 relative"
                        style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}
                      >
                        {timelineDays.map(day => {
                          const isTargetDragCell = dragOverCell?.lineId === line.id && dragOverCell?.dateStr === day.dateStr;

                          // Find OFs scheduled on this line on this day
                          const cellOfs = filteredOfs.filter(o => 
                            o.ligneProductionId === line.id && o.datePlanifiee.startsWith(day.dateStr)
                          );

                          const hasMultiple = cellOfs.length > 1;

                          return (
                            <div
                              key={day.dateStr}
                              onDragOver={(e) => handleCellDragOver(e, line.id, day.dateStr)}
                              onDragLeave={() => handleCellDragLeave(line.id, day.dateStr)}
                              onDrop={(e) => handleCellDrop(e, line.id, day.dateStr)}
                              className={`p-1.5 transition-all flex flex-col gap-2 relative min-h-[140px] ${
                                isTargetDragCell 
                                  ? 'bg-indigo-900/40 border-2 border-dashed border-indigo-400 shadow-inner' 
                                  : day.isToday 
                                  ? 'bg-sky-950/20' 
                                  : day.isWeekend 
                                  ? 'bg-slate-950/20' 
                                  : 'hover:bg-slate-900/40'
                              }`}
                            >
                              {/* Drag-over overlay indicator */}
                              {isTargetDragCell && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-indigo-950/70 backdrop-blur-[1px] rounded pointer-events-none">
                                  <div className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold shadow-lg flex items-center space-x-1">
                                    <Plus className="w-3 h-3" />
                                    <span>Planifier ici</span>
                                  </div>
                                </div>
                              )}

                              {/* Overlap Warning Indicator on Cell */}
                              {hasMultiple && (
                                <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>{cellOfs.length} OFs simultanés</span>
                                </div>
                              )}

                              {/* Scheduled OF Bars */}
                              {cellOfs.map(ofItem => {
                                const article = articles.find(a => a.id === ofItem.articleId);
                                const style = getStatusStyle(ofItem.statut);
                                const progressPct = ofItem.quantiteCible > 0 
                                  ? Math.min(100, Math.round((ofItem.quantiteProduite / ofItem.quantiteCible) * 100)) 
                                  : 0;

                                const isBeingDragged = draggedOfId === ofItem.id;

                                return (
                                  <div
                                    key={ofItem.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, ofItem)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleOpenOfModal(ofItem)}
                                    className={`p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-md select-none group/card relative ${
                                      style.bg
                                    } ${isBeingDragged ? 'opacity-40 scale-95 border-dashed border-sky-400' : 'hover:scale-[1.02] hover:shadow-lg'}`}
                                  >
                                    {/* Top Bar: OF Number, Drag Handle, Status */}
                                    <div className="flex items-center justify-between text-[10px]">
                                      <div className="flex items-center space-x-1">
                                        <GripVertical className="w-3 h-3 text-slate-400 shrink-0 opacity-60 group-hover/card:opacity-100" />
                                        <span className="font-bold font-mono tracking-tight text-white">
                                          {ofItem.numeroOF}
                                        </span>
                                      </div>
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${style.badgeBg}`}>
                                        {style.label}
                                      </span>
                                    </div>

                                    {/* Product Title */}
                                    <div className="mt-1 font-semibold text-xs text-white line-clamp-1" title={article?.designation}>
                                      {article?.code} • {article?.designation}
                                    </div>

                                    {/* Quantities & Progress Bar */}
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center justify-between text-[10px] font-mono">
                                        <span className="text-slate-300">
                                          {ofItem.quantiteProduite} / {ofItem.quantiteCible} {article?.uniteMesure || 'U'}
                                        </span>
                                        <span className="font-bold text-white">
                                          {progressPct}%
                                        </span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div 
                                          className={`h-full ${style.progressColor} transition-all duration-300`} 
                                          style={{ width: `${progressPct}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Operator & Time Footer */}
                                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                                      <span className="truncate max-w-[80px]" title={ofItem.operateur}>
                                        👤 {ofItem.operateur.split(' ')[0]}
                                      </span>
                                      <span className="font-mono text-slate-300">
                                        {ofItem.dureeEstimeeHeures || 8}h estimées
                                      </span>
                                    </div>

                                    {/* Quick Actions Hover Palette (1-day nudge buttons) */}
                                    <div className="mt-2 pt-1 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickShiftOf(ofItem.id, -1);
                                        }}
                                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-mono border border-slate-700"
                                        title="Décaler de -1 jour"
                                      >
                                        ◀ -1j
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onOpenDeclareModal) onOpenDeclareModal(ofItem);
                                        }}
                                        className="px-1.5 py-0.5 bg-sky-700/80 hover:bg-sky-600 text-white rounded text-[9px] font-semibold"
                                        title="Déclarer production"
                                      >
                                        Déclarer
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickShiftOf(ofItem.id, 1);
                                        }}
                                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-mono border border-slate-700"
                                        title="Décaler de +1 jour"
                                      >
                                        +1j ▶
                                      </button>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        </div>

        {/* Footer: Timeline summary & Legend */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-400 font-semibold">Légende Statuts :</span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">En Conditionnement</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">En Mélange / Prépa</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span className="text-slate-300">Planifié</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="text-slate-300">Terminé</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {filteredOfs.length} OF(s) affiché(s) sur la période • Ordonnancement temps réel
          </div>
        </div>
      </div>

      {/* MODAL: Édition et Réajustement Manuel d'un OF */}
      {selectedOfDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Ordonnancement de l'OF {selectedOfDetail.numeroOF}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Lot : {selectedOfDetail.numeroLotFabrique}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOfDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Produit fabriqué</span>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {articles.find(a => a.id === selectedOfDetail.articleId)?.designation}
                  </div>
                  <div className="text-sky-400 font-mono text-[11px]">
                    Code : {articles.find(a => a.id === selectedOfDetail.articleId)?.code}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Quantité Cible</span>
                  <div className="font-bold text-white text-sm font-mono mt-0.5">
                    {selectedOfDetail.quantiteCible} U
                  </div>
                  <div className="text-emerald-400 font-mono text-[11px]">
                    Produit : {selectedOfDetail.quantiteProduite} U
                  </div>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date et heure planifiée de début d'OF <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={manualDateInput}
                  onChange={(e) => setManualDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Production Line Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ligne de production affectée <span className="text-rose-400">*</span>
                </label>
                <select
                  value={manualLineInput}
                  onChange={(e) => setManualLineInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {PRODUCTION_LINES.map(line => (
                    <option key={line.id} value={line.id}>
                      {line.code} • {line.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Change */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Changer le statut de fabrication
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Planifie', 'EnPreparation', 'EnConditionnement', 'ControleQualite', 'Termine'] as OrdreFabrication['statut'][]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onChangerStatutOf(selectedOfDetail.id, st)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        selectedOfDetail.statut === st
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOfDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={handleSaveManualEdit}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer l'ordonnancement</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
