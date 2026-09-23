import React, { useState } from 'react';
import { X, Truck, Check, PackagePlus } from 'lucide-react';
import { SuggestionAchat, Article } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion?: SuggestionAchat;
  articles: Article[];
  onConfirmReceipt: (
    articleId: number,
    quantiteRecue: number,
    numeroLotFournisseur: string,
    fournisseurNom: string
  ) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  suggestion,
  articles,
  onConfirmReceipt
}) => {
  if (!isOpen || !suggestion) return null;

  const article = articles.find(a => a.id === suggestion.articleId);

  const [quantiteRecue, setQuantiteRecue] = useState<number>(suggestion.quantiteSuggeree);
  const [numeroLot, setNumeroLot] = useState<string>(
    `LOT-FOURN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [fournisseurNom, setFournisseurNom] = useState<string>('Fournisseur Agréé');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReceipt(suggestion.articleId, quantiteRecue, numeroLot, fournisseurNom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bon de Réception Fournisseur</h3>
              <p className="text-xs text-slate-400">Entrée en stock magasin & traçabilité</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400">Article réceptionné :</div>
            <div className="font-bold text-white font-mono">{article?.code}</div>
            <div className="text-slate-300">{article?.designation}</div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Fournisseur :</label>
            <input
              type="text"
              value={fournisseurNom}
              onChange={e => setFournisseurNom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Quantité Réceptionnée ({article?.uniteMesure}) :
            </label>
            <input
              type="number"
              min="1"
              value={quantiteRecue}
              onChange={e => setQuantiteRecue(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">N° Lot Fournisseur :</label>
            <input
              type="text"
              value={numeroLot}
              onChange={e => setNumeroLot(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-sky-300"
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Valider Entrée en Stock</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
