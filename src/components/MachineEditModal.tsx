import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Gauge, 
  Thermometer, 
  Droplets, 
  Cpu, 
  Layers,
  Zap,
  RotateCcw
} from 'lucide-react';
import { MachineLigne } from '../types';

interface MachineEditModalProps {
  isOpen: boolean;
  machine: MachineLigne | null;
  onClose: () => void;
  onSave: (updatedMachine: MachineLigne) => void;
}

export const MachineEditModal: React.FC<MachineEditModalProps> = ({
  isOpen,
  machine,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<MachineLigne | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (machine) {
      setFormData({ ...machine });
      setErrors({});
    }
  }, [machine]);

  if (!isOpen || !formData) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.nom.trim()) {
      errs.nom = 'Le nom de la machine est requis';
    }
    if (formData.cadenceNominale <= 0) {
      errs.cadenceNominale = 'La cadence nominale doit être supérieure à 0';
    }
    if (formData.cadenceActuelle < 0) {
      errs.cadenceActuelle = 'La cadence actuelle ne peut pas être négative';
    }
    if (!formData.nodeOpcUa.trim()) {
      errs.nodeOpcUa = 'Le nœud OPC UA est requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onClose();
  };

  const performanceRatio = formData.cadenceNominale > 0 
    ? Math.round((formData.cadenceActuelle / formData.cadenceNominale) * 100) 
    : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-machine-title"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="modal-machine-title" className="text-base font-bold text-white tracking-tight">
                  Modifier la Machine Opérationnelle
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  ID: #{formData.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configuration des paramètres de procédé, cadences et statut opérationnel en direct.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Section 1: Informations Générales & Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Identification de l'Équipement</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Modèle & Catégorie</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nom de la machine :
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="ex: Remplisseuse Linéaire 6 Becs"
                  className={`w-full bg-slate-950 border ${
                    errors.nom ? 'border-rose-500' : 'border-slate-700'
                  } rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none`}
                />
                {errors.nom && <span className="text-rose-400 text-[10px] mt-1 block">{errors.nom}</span>}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Type d'équipement :
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as MachineLigne['type'] })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="CuveMelange">Cuve de Mélange & Formulation (Liquides)</option>
                  <option value="Homogeneiseur">Homogénéisateur Haute Pression</option>
                  <option value="Remplisseuse">Remplisseuse Linéaire ou Rotative</option>
                  <option value="Boucheuse">Boucheuse / Visseuse Automatique</option>
                  <option value="Etiqueteuse">Étiqueteuse & Marquage Jet d'Encre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Statut Opérationnel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Statut Opérationnel en Direct</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Contrôle PLC / MES</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { 
                  val: 'EnMarche', 
                  label: 'En Marche', 
                  desc: 'Production nominale', 
                  border: 'border-emerald-500/40', 
                  bgActive: 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
                  dot: 'bg-emerald-400'
                },
                { 
                  val: 'EnAttente', 
                  label: 'En Attente', 
                  desc: 'Machine prête, arrêt flux', 
                  border: 'border-sky-500/40', 
                  bgActive: 'bg-sky-500/20 text-sky-300 border-sky-400',
                  dot: 'bg-sky-400'
                },
                { 
                  val: 'ArretNettoyage', 
                  label: 'Nettoyage (CIP)', 
                  desc: 'Cycle NEP en cours', 
                  border: 'border-amber-500/40', 
                  bgActive: 'bg-amber-500/20 text-amber-300 border-amber-400',
                  dot: 'bg-amber-400'
                },
                { 
                  val: 'Panne', 
                  label: 'En Panne', 
                  desc: 'Arrêt anomalie GMAO', 
                  border: 'border-rose-500/40', 
                  bgActive: 'bg-rose-500/20 text-rose-300 border-rose-400',
                  dot: 'bg-rose-400'
                }
              ].map(st => (
                <button
                  type="button"
                  key={st.val}
                  onClick={() => setFormData({ ...formData, statut: st.val as MachineLigne['statut'] })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.statut === st.val
                      ? `${st.bgActive} shadow-md`
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                    <span>{st.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                    {st.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Cadences Industrielles & Performance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-indigo-400" />
                <span>Cadences Industrielles (Vitesse Machine)</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-300">
                Performance : {performanceRatio}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cadence Nominale Théorique (U/h ou L/h) :
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.cadenceNominale}
                  onChange={e => setFormData({ ...formData, cadenceNominale: Number(e.target.value) })}
                  className={`w-full bg-slate-950 border ${
                    errors.cadenceNominale ? 'border-rose-500' : 'border-slate-700'
                  } rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none`}
                />
                <span className="text-slate-500 text-[10px] mt-1 block">
                  Vitesse maximale de référence pour le calcul du TRS / OEE.
                </span>
                {errors.cadenceNominale && <span className="text-rose-400 text-[10px] block">{errors.cadenceNominale}</span>}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cadence Actuelle Réelle (U/h ou L/h) :
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.cadenceActuelle}
                  onChange={e => setFormData({ ...formData, cadenceActuelle: Number(e.target.value) })}
                  className={`w-full bg-slate-950 border ${
                    errors.cadenceActuelle ? 'border-rose-500' : 'border-slate-700'
                  } rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none`}
                />
                <span className="text-slate-500 text-[10px] mt-1 block">
                  Vitesse instantanée relevée par les capteurs ou injectée par automate.
                </span>
                {errors.cadenceActuelle && <span className="text-rose-400 text-[10px] block">{errors.cadenceActuelle}</span>}
              </div>
            </div>

            {/* Performance Visual Indicator */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <span className="text-slate-400 text-[11px]">Rapport de Performance Machine :</span>
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>{formData.cadenceActuelle} U/h</span>
                  <span className={performanceRatio >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {performanceRatio}%
                  </span>
                  <span>{formData.cadenceNominale} U/h</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      performanceRatio >= 90 
                        ? 'bg-emerald-500' 
                        : performanceRatio >= 75 
                          ? 'bg-amber-500' 
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, performanceRatio))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Procédé & Grandeurs Physiques */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Paramètres Procédé & Capacités Cuves</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Consignes Physiques</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Température (°C) :
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperatureC ?? 22.0}
                  onChange={e => setFormData({ ...formData, temperatureC: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Pression (bar) :
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.pressionBar ?? 1.0}
                  onChange={e => setFormData({ ...formData, pressionBar: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Capacité Max (L) :
                </label>
                <input
                  type="number"
                  step="50"
                  value={formData.capaciteMaxLitres ?? 1000}
                  onChange={e => setFormData({ ...formData, capaciteMaxLitres: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Niveau Actuel (L) :
                </label>
                <input
                  type="number"
                  step="25"
                  value={formData.niveauCuveLitres ?? 500}
                  onChange={e => setFormData({ ...formData, niveauCuveLitres: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Connectivité OPC UA & Réseau Automate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Nœud OPC UA (IEC 62541)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Modbus / TCP</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                NodeId OPC UA :
              </label>
              <input
                type="text"
                value={formData.nodeOpcUa}
                onChange={e => setFormData({ ...formData, nodeOpcUa: e.target.value })}
                placeholder="ex: ns=2;s=Line1.Filler.State"
                className={`w-full bg-slate-950 border ${
                  errors.nodeOpcUa ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3 py-2 text-sky-300 font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none`}
              />
              <span className="text-slate-500 text-[10px] mt-1 block">
                Adresse symbolique du nœud sur le serveur OPC UA interrogé par le worker .NET 8.
              </span>
              {errors.nodeOpcUa && <span className="text-rose-400 text-[10px] block">{errors.nodeOpcUa}</span>}
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Machine #{formData.id} • Modifiée pour la ligne de production
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-950/40 transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enregistrer la Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
