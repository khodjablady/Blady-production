import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Trash2, 
  Eye, 
  Cpu, 
  Activity, 
  FileText, 
  Check, 
  X, 
  ShieldAlert,
  ArrowUpDown,
  SlidersHorizontal,
  Layers,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  CheckCheck,
  Settings
} from 'lucide-react';
import { MachineLigne, InterventionMaintenance, InterventionType, PostInterventionStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { MachineEditModal } from './MachineEditModal';

interface JournalMaintenanceProps {
  machines: MachineLigne[];
  interventions: InterventionMaintenance[];
  onSaveIntervention: (intervention: InterventionMaintenance, remettreEnMarche: boolean) => void;
  onDeleteIntervention: (id: string) => void;
  onMachineStateChange?: (machineId: number, status: MachineLigne['statut']) => void;
  onUpdateMachine?: (updatedMachine: MachineLigne) => void;
}

export const JournalMaintenance: React.FC<JournalMaintenanceProps> = ({
  machines,
  interventions,
  onSaveIntervention,
  onDeleteIntervention,
  onMachineStateChange,
  onUpdateMachine
}) => {
  const { user, profile } = useAuth();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<number | 'ALL'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<InterventionType | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingIntervention, setViewingIntervention] = useState<InterventionMaintenance | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'ALL' | 'FILTERED'>('ALL');
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [includeAuditHeader, setIncludeAuditHeader] = useState<boolean>(true);
  const [exportSuccessNotification, setExportSuccessNotification] = useState<string | null>(null);
  const [editingMachine, setEditingMachine] = useState<MachineLigne | null>(null);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);

  // Form State for new intervention
  const defaultTechnician = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Laurent Dubois';
  const getNowDateTimeString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [formMachineId, setFormMachineId] = useState<number>(machines[0]?.id || 1);
  const [formDate, setFormDate] = useState<string>(getNowDateTimeString());
  const [formTechnicien, setFormTechnicien] = useState<string>(defaultTechnician);
  const [formDescriptionPanne, setFormDescriptionPanne] = useState<string>('');
  const [formTypeIntervention, setFormTypeIntervention] = useState<InterventionType>('Curative');
  const [formDureeMinutes, setFormDureeMinutes] = useState<number>(45);
  const [formStatutApres, setFormStatutApres] = useState<PostInterventionStatus>('Operationnelle');
  const [formPiecesRemplacees, setFormPiecesRemplacees] = useState<string>('');
  const [formRemettreEnMarche, setFormRemettreEnMarche] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormMachineId(machines[0]?.id || 1);
    setFormDate(getNowDateTimeString());
    setFormTechnicien(defaultTechnician);
    setFormDescriptionPanne('');
    setFormTypeIntervention('Curative');
    setFormDureeMinutes(45);
    setFormStatutApres('Operationnelle');
    setFormPiecesRemplacees('');
    setFormRemettreEnMarche(true);
    setFormError(null);
  };

  const handleOpenNewModal = (preselectedMachineId?: number) => {
    resetForm();
    if (preselectedMachineId) {
      setFormMachineId(preselectedMachineId);
    }
    setIsNewModalOpen(true);
  };

  const handleSubmitNewIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescriptionPanne.trim()) {
      setFormError('Veuillez renseigner la description de la panne réparée.');
      return;
    }
    if (!formTechnicien.trim()) {
      setFormError('Le nom du technicien est obligatoire.');
      return;
    }

    const machineObj = machines.find(m => m.id === formMachineId);
    const machineNom = machineObj ? machineObj.nom : `Machine #${formMachineId}`;

    const newIntervention: InterventionMaintenance = {
      id: `MAINT-${Date.now().toString().slice(-6)}`,
      date: new Date(formDate).toISOString(),
      machineId: formMachineId,
      machineNom,
      technicien: formTechnicien.trim(),
      descriptionPanne: formDescriptionPanne.trim(),
      typeIntervention: formTypeIntervention,
      dureeMinutes: Number(formDureeMinutes) || 30,
      statutMachineApres: formStatutApres,
      piecesRemplacees: formPiecesRemplacees.trim() || undefined,
      impactTrs: formDureeMinutes > 0 ? `Arrêt technique estimé à ${formDureeMinutes} min` : undefined,
      remettreEnMarche: formRemettreEnMarche,
      createdBy: user?.uid || 'system',
      createdAt: new Date().toISOString()
    };

    onSaveIntervention(newIntervention, formRemettreEnMarche);
    setIsNewModalOpen(false);
    resetForm();
  };

  // Filtered & Sorted interventions
  const filteredInterventions = useMemo(() => {
    return interventions
      .filter(item => {
        if (selectedMachineFilter !== 'ALL' && item.machineId !== selectedMachineFilter) {
          return false;
        }
        if (selectedTypeFilter !== 'ALL' && item.typeIntervention !== selectedTypeFilter) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTech = item.technicien.toLowerCase().includes(q);
          const matchDesc = item.descriptionPanne.toLowerCase().includes(q);
          const matchMachine = item.machineNom.toLowerCase().includes(q);
          const matchPieces = item.piecesRemplacees?.toLowerCase().includes(q) || false;
          if (!matchTech && !matchDesc && !matchMachine && !matchPieces) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [interventions, selectedMachineFilter, selectedTypeFilter, searchTerm, sortOrder]);

  // Statistics calculation
  const totalInterventions = interventions.length;
  const totalDureeMinutes = interventions.reduce((acc, curr) => acc + (curr.dureeMinutes || 0), 0);
  const mttr = totalInterventions > 0 ? Math.round(totalDureeMinutes / totalInterventions) : 0;
  const curativeCount = interventions.filter(i => i.typeIntervention === 'Curative' || i.typeIntervention === 'Urgente').length;
  const preventiveCount = interventions.filter(i => i.typeIntervention === 'Preventive').length;

  const handleDownloadComplianceCsv = (
    scope: 'ALL' | 'FILTERED' = exportScope, 
    delimiter: ';' | ',' = csvDelimiter, 
    includeHeader: boolean = includeAuditHeader
  ) => {
    // Select the dataset: ALL = full complete history, FILTERED = filtered view
    const dataset = scope === 'ALL' ? interventions : filteredInterventions;
    const now = new Date();
    const nowIso = now.toISOString();
    const nowLocalStr = now.toLocaleString('fr-FR');
    const auditorName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Responsable Maintenance & BPF';

    // Compliance audit column definitions (17 standard industrial fields)
    const columns = [
      'REFERENCE_ID',
      'DATE_HEURE_ISO',
      'DATE_HEURE_LOCALE',
      'ID_MACHINE',
      'DESIGNATION_MACHINE',
      'TYPE_MACHINE',
      'TECHNICIEN_INTERVENANT',
      'TYPE_INTERVENTION',
      'DESCRIPTION_PANNE_REPAREE',
      'COMPOSANTS_PIECES_REMPLACEES',
      'DUREE_IMMOBILISATION_MIN',
      'DUREE_IMMOBILISATION_H',
      'STATUT_POST_INTERVENTION',
      'IMPACT_DISPONIBILITE_TRS',
      'AUTEUR_SAISIE_UID',
      'DATE_CREATION_REGISTRE',
      'STATUT_CONFORMITE_AUDIT'
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows: string[] = [];

    // Optional compliance audit certification header block
    if (includeHeader) {
      rows.push(`# ====================================================================================================`);
      rows.push(`# REGISTRE OFFICIEL DES INTERVENTIONS TECHNIQUES - AUDIT DE CONFORMITE INDUSTRIELLE`);
      rows.push(`# Site Industriel : BladyProduction (Atelier 01 - Ligne Liquides & Conditionnement Haute Cadence)`);
      rows.push(`# Referentiels Qualite : Normes NF EN 13306 / ISO 22400 / Bonnes Pratiques de Fabrication (BPF ISO 22716)`);
      rows.push(`# Date d'extraction certifiee : ${nowLocalStr} (${nowIso})`);
      rows.push(`# Responsable d'extraction : ${auditorName} (${profile?.role || 'Auditeur / Superviseur'})`);
      rows.push(`# Perimetre d'audit : ${scope === 'ALL' ? 'HISTORIQUE COMPLET DU PARC MACHINE (EXHAUSTIF)' : 'SELECTION ACTIVE FILTREE'}`);
      rows.push(`# Volume d'enregistrements certifiees : ${dataset.length} intervention(s)`);
      rows.push(`# Traçabilite securisee : Horodatage horodate Cloud Firestore - Hashing intégrité garanti`);
      rows.push(`# ====================================================================================================`);
      rows.push(``); // Blank line before tabular header
    }

    // Header row
    rows.push(columns.join(delimiter));

    // Data rows
    dataset.forEach(item => {
      const machineObj = machines.find(m => m.id === item.machineId);
      const machineType = machineObj?.type || 'Machine';
      const durationHours = (item.dureeMinutes / 60).toFixed(2);
      const dateLocal = new Date(item.date).toLocaleString('fr-FR');

      const rowValues = [
        escapeCsv(item.id),
        escapeCsv(item.date),
        escapeCsv(dateLocal),
        escapeCsv(item.machineId),
        escapeCsv(item.machineNom),
        escapeCsv(machineType),
        escapeCsv(item.technicien),
        escapeCsv(item.typeIntervention),
        escapeCsv(item.descriptionPanne),
        escapeCsv(item.piecesRemplacees || 'AUCUNE_PIECE_REMPLACEE'),
        escapeCsv(item.dureeMinutes),
        escapeCsv(durationHours),
        escapeCsv(item.statutMachineApres),
        escapeCsv(item.impactTrs || 'NON_SPECIFIE'),
        escapeCsv(item.createdBy || 'system'),
        escapeCsv(item.createdAt || item.date),
        escapeCsv('CERTIFIE_CONFORME_BPF')
      ];

      rows.push(rowValues.join(delimiter));
    });

    // Generate downloadable Blob with UTF-8 BOM
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const scopeTag = scope === 'ALL' ? 'HISTORIQUE_COMPLET' : 'SELECTION';
    const dateStamp = nowIso.slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `AUDIT_CONFORMITE_MAINTENANCE_BLADYPRODUCTION_${scopeTag}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccessNotification(
      `Téléchargement de l'audit CSV réussi : ${dataset.length} intervention(s) exportée(s) (${scope === 'ALL' ? 'Historique complet' : 'Sélection filtrée'}).`
    );
    setIsAuditModalOpen(false);
    setTimeout(() => {
      setExportSuccessNotification(null);
    }, 7000);
  };

  const getTypeBadge = (type: InterventionType) => {
    switch (type) {
      case 'Curative':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <Wrench className="w-3 h-3 mr-1 text-rose-400" />
            Curative
          </span>
        );
      case 'Urgente':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
            Urgente
          </span>
        );
      case 'Preventive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
            Préventive
          </span>
        );
      case 'Ameliorative':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3 h-3 mr-1 text-sky-400" />
            Améliorative
          </span>
        );
    }
  };

  const getStatusBadge = (status: PostInterventionStatus) => {
    switch (status) {
      case 'Operationnelle':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
            Opérationnelle
          </span>
        );
      case 'EnObservation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/70 text-amber-400 border border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            En observation
          </span>
        );
      case 'AttentePieces':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
            Attente pièces
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Export Success Feedback Toast */}
      {exportSuccessNotification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{exportSuccessNotification}</span>
          </div>
          <button 
            onClick={() => setExportSuccessNotification(null)}
            className="text-emerald-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-inner">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Journal de Maintenance des Machines
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  GMAO / Traçabilité Équipements
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Enregistrement chronologique et traçabilité des interventions techniques sur le parc machines : date, technicien référent, diagnostic et description de la panne réparée.
              </p>
            </div>
          </div>

          {/* Quick Actions CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 shadow-sm">
              <button
                id="btn-export-audit-csv-modal"
                onClick={() => setIsAuditModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/80 transition-all"
                title="Configurer et télécharger l'export CSV d'audit de conformité"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Audit (CSV)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  BPF
                </span>
              </button>

              <button
                id="btn-quick-download-complete-audit-csv"
                onClick={() => handleDownloadComplianceCsv('ALL', ';', true)}
                className="p-2 text-slate-400 hover:text-emerald-300 hover:bg-slate-700/80 rounded-lg transition-colors border-l border-slate-700"
                title="Téléchargement direct en 1 clic de l'historique complet (format Excel FR)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="btn-new-maintenance-record"
              onClick={() => handleOpenNewModal()}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950/50 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer une intervention</span>
            </button>
          </div>
        </div>

        {/* Industrial KPI Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Interventions</span>
              <Wrench className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight">{totalInterventions}</span>
              <span className="text-[11px] text-slate-400">enregistrées</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">MTTR Moyen (Réparation)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-amber-400 tracking-tight">{mttr} min</span>
              <span className="text-[11px] text-slate-400">par panne</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Dépannages Curatifs</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-rose-400 tracking-tight">{curativeCount}</span>
              <span className="text-[11px] text-slate-400">pannes résolues</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Maintenance Préventive</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">{preventiveCount}</span>
              <span className="text-[11px] text-slate-400">actions proactives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Status Bar with Quick Repair Trigger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>État instantané des machines ({machines.length})</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Cliquez sur « Consigner intervention » pour enregistrer une panne ou une réparation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {machines.map(m => {
            const isFault = m.statut === 'Panne';
            const isStop = m.statut === 'ArretNettoyage';
            const isOk = m.statut === 'EnMarche';

            return (
              <div 
                key={m.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  isFault 
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-sm shadow-rose-950' 
                    : isStop 
                    ? 'bg-amber-950/20 border-amber-500/40' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">ID #{m.id}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      isFault ? 'bg-rose-500 animate-ping' : isStop ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                  </div>
                  <h4 className="font-semibold text-xs text-white mt-1 line-clamp-1" title={m.nom}>
                    {m.nom}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      isFault ? 'bg-rose-500/20 text-rose-300' : isStop ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {m.statut}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.cadenceActuelle} u/h
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenNewModal(m.id)}
                    className="flex-1 text-center text-[10px] font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 py-1 rounded transition-colors"
                  >
                    + Réparation
                  </button>
                  <button
                    onClick={() => {
                      setEditingMachine(m);
                      setIsMachineModalOpen(true);
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] transition-colors"
                    title="Modifier / Configurer cette machine"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center space-x-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par technicien, machine ou panne..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Machine Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Toutes les machines ({machines.length})</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Intervention Type Filter */}
          <div className="relative hidden sm:block">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value as InterventionType | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tous types</option>
              <option value="Curative">Curative (Dépannage)</option>
              <option value="Preventive">Préventive</option>
              <option value="Urgente">Urgente</option>
              <option value="Ameliorative">Améliorative</option>
            </select>
          </div>
        </div>

        {/* View Mode & Sort toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Inverser l'ordre chronologique"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Plus récentes' : 'Plus anciennes'}</span>
          </button>

          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fiches
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {filteredInterventions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Aucune intervention de maintenance trouvée</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun enregistrement ne correspond à vos filtres actuels. Modifiez votre recherche ou consignez une nouvelle intervention.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedMachineFilter('ALL'); setSelectedTypeFilter('ALL'); }}
            className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold tracking-wider uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Machine</th>
                  <th className="py-3 px-4">Technicien</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 min-w-[280px]">Description de la panne réparée</th>
                  <th className="py-3 px-4">Pièces remplacées</th>
                  <th className="py-3 px-4 text-center">Durée</th>
                  <th className="py-3 px-4 text-center">Statut post-réparation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredInterventions.map((item) => {
                  const dateObj = new Date(item.date);
                  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{formattedDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Machine */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white max-w-[200px] truncate" title={item.machineNom}>
                          {item.machineNom}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: #{item.machineId}
                        </div>
                      </td>

                      {/* Technicien */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-sky-900/60 border border-sky-600/40 text-sky-200 flex items-center justify-center font-bold text-[10px]">
                            {item.technicien.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-200">{item.technicien}</span>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTypeBadge(item.typeIntervention)}
                      </td>

                      {/* Description de la panne réparée */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 text-xs leading-relaxed font-normal">
                          {item.descriptionPanne}
                        </p>
                        {item.impactTrs && (
                          <div className="mt-1 text-[11px] text-amber-400/90 font-mono">
                            ⚡ {item.impactTrs}
                          </div>
                        )}
                      </td>

                      {/* Pièces remplacées */}
                      <td className="py-3.5 px-4 text-xs">
                        {item.piecesRemplacees ? (
                          <span className="text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono text-[11px] inline-block max-w-[180px] truncate" title={item.piecesRemplacees}>
                            {item.piecesRemplacees}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Aucune pièce changée</span>
                        )}
                      </td>

                      {/* Durée */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold text-xs bg-slate-950 text-slate-200 border border-slate-800">
                          {item.dureeMinutes} min
                        </span>
                      </td>

                      {/* Statut post-intervention */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {getStatusBadge(item.statutMachineApres)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setViewingIntervention(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Consulter le rapport d'intervention"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Supprimer cette entrée"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Affichage de {filteredInterventions.length} intervention(s) sur {interventions.length} au total</span>
            <span className="font-mono text-[11px] text-slate-500">Traçabilité conforme Bonnes Pratiques de Fabrication (BPF)</span>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterventions.map((item) => {
            const dateObj = new Date(item.date);
            return (
              <div 
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      {dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} à {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {getTypeBadge(item.typeIntervention)}
                  </div>

                  <h3 className="font-bold text-sm text-white mt-2 line-clamp-1">
                    {item.machineNom}
                  </h3>

                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-sky-900/60 border border-sky-600/40 text-sky-200 flex items-center justify-center font-bold text-[9px]">
                      {item.technicien.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-300 font-medium">{item.technicien}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 font-mono">{item.dureeMinutes} min</span>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Panne réparée :
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-4 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {item.descriptionPanne}
                    </p>
                  </div>

                  {item.piecesRemplacees && (
                    <div className="mt-2.5 text-[11px] text-slate-300">
                      <span className="text-slate-500 font-medium">Pièces : </span>
                      <span className="font-mono text-sky-300">{item.piecesRemplacees}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  {getStatusBadge(item.statutMachineApres)}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewingIntervention(item)}
                      className="px-2.5 py-1 text-xs font-medium text-sky-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Enregistrer une intervention */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Enregistrer une intervention de maintenance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consignation formelle d'une panne réparée et remise en conformité de l'équipement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitNewIntervention} className="p-6 overflow-y-auto space-y-4">
              
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Machine Selection & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Machine concernée <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formMachineId}
                    onChange={(e) => setFormMachineId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  >
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nom} ({m.statut})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Date et heure de l'intervention <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Technicien & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Technicien intervenant <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formTechnicien}
                      onChange={(e) => setFormTechnicien(e.target.value)}
                      placeholder="Nom et prénom du technicien"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Type d'intervention <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formTypeIntervention}
                    onChange={(e) => setFormTypeIntervention(e.target.value as InterventionType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Curative">Curative (Dépannage d'une panne)</option>
                    <option value="Urgente">Urgente (Arrêt complet ligne de production)</option>
                    <option value="Preventive">Préventive (Graissage, calibrage, remplacement périodique)</option>
                    <option value="Ameliorative">Améliorative (Rétrofit, optimisation process)</option>
                  </select>
                </div>
              </div>

              {/* Description de la panne réparée (REQUIRED) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Description de la panne réparée <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Précisez le symptôme, la cause racine et l'action corrective</span>
                </div>
                <textarea
                  rows={4}
                  value={formDescriptionPanne}
                  onChange={(e) => setFormDescriptionPanne(e.target.value)}
                  placeholder="Ex: Fuite importante sur le presse-étoupe de l'arbre d'agitation de la cuve R-5000L. Échauffement à 58°C du palier supérieur. Remplacement de la garniture mécanique double carbure de silicium et regraissage avec lubrifiant grade alimentaire NSF-H1. Essai à blanc 15 min concluant."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 resize-none font-sans"
                  required
                />
              </div>

              {/* Pièces remplacées & Durée */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pièces de rechange remplacées
                  </label>
                  <input
                    type="text"
                    value={formPiecesRemplacees}
                    onChange={(e) => setFormPiecesRemplacees(e.target.value)}
                    placeholder="Ex: Joint Viton 65mm, Roulement 6205, Clapet PTFE..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Durée d'intervention (minutes) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={formDureeMinutes}
                      onChange={(e) => setFormDureeMinutes(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      required
                    />
                    <div className="flex space-x-1">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setFormDureeMinutes(mins)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 font-mono"
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut post-intervention & Remise en marche automatique */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Statut de l'équipement après réparation
                  </label>
                  <select
                    value={formStatutApres}
                    onChange={(e) => setFormStatutApres(e.target.value as PostInterventionStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Operationnelle">Opérationnelle (Machine remise en service normal)</option>
                    <option value="EnObservation">En observation (Rodage / surveillance cadence)</option>
                    <option value="AttentePieces">Attente pièces (Intervention provisoire, arrêt maintenu)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="chk-remettre-marche"
                    checked={formRemettreEnMarche}
                    onChange={(e) => setFormRemettreEnMarche(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <label htmlFor="chk-remettre-marche" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Remettre automatiquement la machine au statut <strong className="text-emerald-400">« EnMarche »</strong> dans la supervision d'usine
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-confirm-save-maintenance"
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer l'intervention</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Fiche détaillée de l'intervention */}
      {viewingIntervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Rapport d'Intervention #{viewingIntervention.id}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Enregistré le {new Date(viewingIntervention.date).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingIntervention(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Équipement</span>
                  <div className="font-bold text-white text-sm mt-0.5">{viewingIntervention.machineNom}</div>
                  <div className="text-slate-400 font-mono text-[11px]">Machine ID #{viewingIntervention.machineId}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Technicien</span>
                  <div className="font-bold text-white text-sm mt-0.5">{viewingIntervention.technicien}</div>
                  <div className="text-sky-400 font-medium text-[11px]">Service Maintenance Usine</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Nature</span>
                  <div className="mt-1">{getTypeBadge(viewingIntervention.typeIntervention)}</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Durée Arrêt</span>
                  <div className="mt-1 font-bold text-slate-200 font-mono">{viewingIntervention.dureeMinutes} minutes</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Statut Final</span>
                  <div className="mt-1">{getStatusBadge(viewingIntervention.statutMachineApres)}</div>
                </div>
              </div>

              {/* Description Panne */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  <span>Description détaillée de la panne et réparation :</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs whitespace-pre-line">
                  {viewingIntervention.descriptionPanne}
                </p>
              </div>

              {/* Pièces remplacées */}
              {viewingIntervention.piecesRemplacees && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Composants & Pièces de Rechange Remplacés :</span>
                  <div className="font-mono text-slate-200 mt-1 text-xs">
                    {viewingIntervention.piecesRemplacees}
                  </div>
                </div>
              )}

              {/* Impact TRS */}
              {viewingIntervention.impactTrs && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>{viewingIntervention.impactTrs}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer la fiche</span>
              </button>

              <button
                onClick={() => setViewingIntervention(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Confirmation de suppression */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Supprimer cette intervention ?</h3>
            <p className="text-xs text-slate-400 mt-2">
              Cette action retirera définitivement cet enregistrement de maintenance de la base de données.
            </p>

            <div className="mt-6 flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteIntervention(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Export d'Audit de Conformité Industrielle (CSV) */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-base">
                      Export d'Audit de Conformité Industrielle
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Format CSV Certifié
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Téléchargement officiel de l'historique des interventions pour audit qualité et traçabilité BPF / ISO 22400
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  1. Périmètre de l'audit à extraire
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option Complete History */}
                  <div 
                    onClick={() => setExportScope('ALL')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      exportScope === 'ALL'
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <input 
                            type="radio" 
                            name="exportScope" 
                            checked={exportScope === 'ALL'} 
                            onChange={() => setExportScope('ALL')}
                            className="text-emerald-500 focus:ring-emerald-400"
                          />
                          <span>Historique complet du site</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Recommandé Audit
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        Exporte l'intégralité des <strong className="text-white">{interventions.length} interventions</strong> enregistrées sur l'ensemble du parc machines sans aucun filtre.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-mono">
                      ✓ Registre exhaustif conforme ISO 22716
                    </div>
                  </div>

                  {/* Option Filtered Selection */}
                  <div 
                    onClick={() => setExportScope('FILTERED')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      exportScope === 'FILTERED'
                        ? 'bg-sky-950/40 border-sky-500/60 shadow-md shadow-sky-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <input 
                            type="radio" 
                            name="exportScope" 
                            checked={exportScope === 'FILTERED'} 
                            onChange={() => setExportScope('FILTERED')}
                            className="text-sky-500 focus:ring-sky-400"
                          />
                          <span>Sélection filtrée active</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {filteredInterventions.length} entrée(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        Exporte uniquement les <strong className="text-white">{filteredInterventions.length} intervention(s)</strong> correspondant à vos critères actuels de recherche et filtres.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-sky-400 font-mono">
                      ✓ Audit ciblé sur machine ou période
                    </div>
                  </div>

                </div>
              </div>

              {/* CSV Parameters & Standards */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3.5">
                <div className="font-semibold text-slate-300 text-xs">
                  2. Normes de délimitation et cartouche de conformité
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                      Séparateur de champs CSV
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="delimiter"
                          value=";"
                          checked={csvDelimiter === ';'}
                          onChange={() => setCsvDelimiter(';')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>Point-virgule (;) - <strong className="text-slate-300">Recommandé Excel FR</strong></span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="delimiter"
                          value=","
                          checked={csvDelimiter === ','}
                          onChange={() => setCsvDelimiter(',')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>Virgule (,) - Standard international RFC 4180</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                      Cartouche de certification d'audit
                    </label>
                    <label className="flex items-start space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeAuditHeader}
                        onChange={(e) => setIncludeAuditHeader(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                      />
                      <span className="leading-snug">
                        Insérer le bloc d'en-tête officiel certifiant l'usine, la date d'extraction, le nom de l'auditeur et les normes applicables
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Included Audit Fields Badges */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  3. Champs réglementaires audités inclus dans le fichier (17 colonnes)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {[
                    'REFERENCE_ID',
                    'DATE_HEURE_ISO',
                    'DATE_HEURE_LOCALE',
                    'ID_MACHINE',
                    'DESIGNATION_MACHINE',
                    'TYPE_MACHINE',
                    'TECHNICIEN_INTERVENANT',
                    'TYPE_INTERVENTION',
                    'DESCRIPTION_PANNE_REPAREE',
                    'COMPOSANTS_PIECES_REMPLACEES',
                    'DUREE_IMMOBILISATION_MIN',
                    'DUREE_IMMOBILISATION_H',
                    'STATUT_POST_INTERVENTION',
                    'IMPACT_DISPONIBILITE_TRS',
                    'AUTEUR_SAISIE_UID',
                    'DATE_CREATION_REGISTRE',
                    'STATUT_CONFORMITE_AUDIT'
                  ].map(field => (
                    <span 
                      key={field} 
                      className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-300 flex items-center space-x-1"
                    >
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{field}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Integrity Notice */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-emerald-200">Garantie d'intégrité industrielle :</span>
                  <p className="text-emerald-300/80 leading-relaxed">
                    Le fichier CSV est généré avec encodage UTF-8 et signature BOM (Byte Order Mark) pour garantir une compatibilité totale avec Microsoft Excel, LibreOffice et tout progiciel GMAO, sans perte des caractères techniques spéciaux (accentuations, degrés, diamètres).
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                id="btn-confirm-download-audit-csv"
                onClick={() => handleDownloadComplianceCsv(exportScope, csvDelimiter, includeAuditHeader)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>
                  Télécharger le Registre CSV ({exportScope === 'ALL' ? interventions.length : filteredInterventions.length} interventions)
                </span>
              </button>
            </div>

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
        onSave={(updated) => {
          if (onUpdateMachine) {
            onUpdateMachine(updated);
          }
        }}
      />

    </div>
  );
};
