import React, { useState } from 'react';
import { X, Layers, Plus } from 'lucide-react';
import { Article, OrdreFabrication } from '../types';

interface NewOfModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onConfirmCreateOf: (newOf: Omit<OrdreFabrication, 'id'>) => void;
}

export const NewOfModal: React.FC<NewOfModalProps> = ({
  isOpen,
  onClose,
  articles,
  onConfirmCreateOf
}) => {
  if (!isOpen) return null;

  const produitsFinis = articles.filter(a => !a.estComposant);

  const [selectedArticleId, setSelectedArticleId] = useState<number>(produitsFinis[0]?.id || 1);
  const [quantiteCible, setQuantiteCible] = useState<number>(500);
  const [numeroLot, setNumeroLot] = useState<string>(
    `LOT-VIR-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-X${Math.floor(10 + Math.random() * 90)}`
  );
  const [operateur, setOperateur] = useState<string>('Équipe Après-Midi (Ligne 01)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCreateOf({
      numeroOF: `OF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      articleId: selectedArticleId,
      quantiteCible,
      quantiteProduite: 0,
      quantiteRebutee: 0,
      datePlanifiee: new Date().toISOString(),
      statut: 'Planifie',
      ligneProductionId: 1,
      numeroLotFabrique: numeroLot,
      operateur,
      tempsCycleSecondes: 3.6,
      tempsProductionMinutes: 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Créer un Ordre de Fabrication (MES)</h3>
              <p className="text-xs text-slate-400">Lancement d'un lot de production</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Article à Fabriquer (PF) :</label>
            <select
              value={selectedArticleId}
              onChange={e => setSelectedArticleId(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-medium"
            >
              {produitsFinis.map(pf => (
                <option key={pf.id} value={pf.id}>
                  {pf.code} - {pf.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Quantité Cible (Unités) :</label>
            <input
              type="number"
              min="10"
              step="10"
              value={quantiteCible}
              onChange={e => setQuantiteCible(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Numéro de Lot à Générer :</label>
            <input
              type="text"
              value={numeroLot}
              onChange={e => setNumeroLot(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-sky-300"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Opérateur / Équipe Ligne :</label>
            <input
              type="text"
              value={operateur}
              onChange={e => setOperateur(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Créer l'OF</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
