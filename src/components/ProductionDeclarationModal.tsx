import React, { useState } from 'react';
import { X, PackageCheck, AlertTriangle, Droplets, Check, ArrowRight } from 'lucide-react';
import { OrdreFabrication, Article, Nomenclature } from '../types';

interface ProductionDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ofItem?: OrdreFabrication;
  articles: Article[];
  nomenclatures: Nomenclature[];
  onConfirmDeclaration: (
    ofId: number,
    quantiteRealisee: number,
    quantiteRebuts: number,
    operateur: string
  ) => void;
}

export const ProductionDeclarationModal: React.FC<ProductionDeclarationModalProps> = ({
  isOpen,
  onClose,
  ofItem,
  articles,
  nomenclatures,
  onConfirmDeclaration
}) => {
  if (!isOpen || !ofItem) return null;

  const article = articles.find(a => a.id === ofItem.articleId);
  const relevantNomenclatures = nomenclatures.filter(n => n.articleParentId === ofItem.articleId);

  const [quantiteRealisee, setQuantiteRealisee] = useState<number>(
    Math.max(50, ofItem.quantiteCible - ofItem.quantiteProduite)
  );
  const [quantiteRebuts, setQuantiteRebuts] = useState<number>(2);
  const [operateur, setOperateur] = useState<string>(ofItem.operateur || 'Julien Mercier (Opérateur Chef)');

  // Calculate live preview of post-deduction
  const previews = relevantNomenclatures.map(n => {
    const comp = articles.find(a => a.id === n.composantId);
    const facteurPerte = 1 + (n.pourcentagePerteTolerable / 100);
    const totalDeduction = Number((n.quantiteBesoinUnitaire * quantiteRealisee * facteurPerte).toFixed(4));
    const stockRestant = comp ? Number((comp.stockTheorique - totalDeduction).toFixed(4)) : 0;
    const passeSousSeuil = comp ? stockRestant < comp.seuilCritique : false;

    return {
      comp,
      nom: n,
      facteurPerte,
      totalDeduction,
      stockRestant,
      passeSousSeuil
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantiteRealisee <= 0) return;
    onConfirmDeclaration(ofItem.id, quantiteRealisee, quantiteRebuts, operateur);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Déclaration de Fin de Lot & Post-Déduction (MES ➔ ERP)
              </h3>
              <p className="text-xs text-slate-400">
                OF : <strong className="text-white font-mono">{ofItem.numeroOF}</strong> | Lot : <strong className="text-sky-300 font-mono">{ofItem.numeroLotFabrique}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Form inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Quantité Bonne Réalisée (U) :
              </label>
              <input
                type="number"
                min="1"
                max={ofItem.quantiteCible * 2}
                value={quantiteRealisee}
                onChange={e => setQuantiteRealisee(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white text-sm focus:outline-none focus:border-sky-500"
                required
              />
              <span className="text-[10px] text-slate-500">Reste cible : {ofItem.quantiteCible - ofItem.quantiteProduite} U</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Rebuts constatés (U) :
              </label>
              <input
                type="number"
                min="0"
                value={quantiteRebuts}
                onChange={e => setQuantiteRebuts(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white text-sm focus:outline-none focus:border-rose-500"
              />
              <span className="text-[10px] text-slate-500">Défauts flacon ou fuites</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Opérateur déclarant :
              </label>
              <input
                type="text"
                value={operateur}
                onChange={e => setOperateur(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          {/* Live calculation banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Simulation Post-Déduction C# (Facteur de perte liquide inclus)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                MrpStockService.AppliquerPostDeductionStockAsync
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="pb-1.5">Composant</th>
                    <th className="pb-1.5 text-right">Besoin brut</th>
                    <th className="pb-1.5 text-right">Tolérance perte</th>
                    <th className="pb-1.5 text-right">Déduction finale</th>
                    <th className="pb-1.5 text-right">Stock après déduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {previews.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-mono text-sky-300">{p.comp?.code}</td>
                      <td className="py-1.5 text-right font-mono">
                        {(p.nom.quantiteBesoinUnitaire * quantiteRealisee).toFixed(2)} {p.comp?.uniteMesure}
                      </td>
                      <td className="py-1.5 text-right font-mono text-amber-400">
                        +{p.nom.pourcentagePerteTolerable}%
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-rose-400">
                        -{p.totalDeduction} {p.comp?.uniteMesure}
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        <span className={p.passeSousSeuil ? 'text-amber-400 font-bold flex items-center justify-end gap-1' : 'text-slate-300'}>
                          {p.passeSousSeuil && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                          {p.stockRestant} {p.comp?.uniteMesure}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previews.some(p => p.passeSousSeuil) && (
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Avertissement seuil critique :</strong> La déduction de ce lot fera passer certains composants sous leur seuil critique. Le moteur MRP générera une suggestion d'achat automatique.
                </span>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-colors flex items-center space-x-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Valider Déclaration & Post-Déduire Stocks</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
