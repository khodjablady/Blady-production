import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Boxes, 
  AlertTriangle, 
  Droplet, 
  Truck, 
  Scale, 
  DollarSign, 
  MapPin, 
  Sparkles,
  Info,
  Calculator
} from 'lucide-react';
import { Article, UnitType } from '../types';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleToEdit?: Article;
  onSave: (article: Article, ajustementStock?: { difference: number; motif: string }) => void;
  existingCodes: string[];
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  articleToEdit,
  onSave,
  existingCodes
}) => {
  const isEditing = Boolean(articleToEdit);

  // Form State
  const [code, setCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [estComposant, setEstComposant] = useState(true);
  const [uniteMesure, setUniteMesure] = useState<UnitType>('L');
  const [stockTheorique, setStockTheorique] = useState(0);
  const [initialStock, setInitialStock] = useState(0);
  const [seuilCritique, setSeuilCritique] = useState(0);
  const [quantiteStandardAchat, setQuantiteStandardAchat] = useState(0);
  const [delaiLivraisonFournisseurJours, setDelaiLivraisonFournisseurJours] = useState(3);
  const [densite, setDensite] = useState<number | undefined>(undefined);
  const [capaciteVolumeLitres, setCapaciteVolumeLitres] = useState<number | undefined>(undefined);
  const [typeEmballage, setTypeEmballage] = useState('');
  const [prixUnitaireEstime, setPrixUnitaireEstime] = useState<number | undefined>(undefined);
  const [coutUnitaireStandard, setCoutUnitaireStandard] = useState<number | undefined>(undefined);
  const [emplacement, setEmplacement] = useState('');

  // Stock inventory adjustment state
  const [genererMouvementInventaire, setGenererMouvementInventaire] = useState(true);
  const [motifInventaire, setMotifInventaire] = useState('Inventaire physique / Régularisation fiche');

  // Error validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (articleToEdit) {
      setCode(articleToEdit.code);
      setDesignation(articleToEdit.designation);
      setEstComposant(articleToEdit.estComposant);
      setUniteMesure(articleToEdit.uniteMesure);
      setStockTheorique(articleToEdit.stockTheorique);
      setInitialStock(articleToEdit.stockTheorique);
      setSeuilCritique(articleToEdit.seuilCritique);
      setQuantiteStandardAchat(articleToEdit.quantiteStandardAchat);
      setDelaiLivraisonFournisseurJours(articleToEdit.delaiLivraisonFournisseurJours);
      setDensite(articleToEdit.densite);
      setCapaciteVolumeLitres(articleToEdit.capaciteVolumeLitres);
      setTypeEmballage(articleToEdit.typeEmballage || '');
      setPrixUnitaireEstime(articleToEdit.prixUnitaireEstime);
      setCoutUnitaireStandard(articleToEdit.coutUnitaireStandard);
      setEmplacement(articleToEdit.emplacement || '');
    } else {
      // Default creation template
      setCode('');
      setDesignation('');
      setEstComposant(true);
      setUniteMesure('L');
      setStockTheorique(1000);
      setInitialStock(1000);
      setSeuilCritique(500);
      setQuantiteStandardAchat(2000);
      setDelaiLivraisonFournisseurJours(3);
      setDensite(1.0);
      setCapaciteVolumeLitres(undefined);
      setTypeEmballage('Cuve Inox Vrac');
      setPrixUnitaireEstime(2.50);
      setCoutUnitaireStandard(2.50);
      setEmplacement('Magasin MP - Allée A');
    }
    setErrors({});
  }, [articleToEdit, isOpen]);

  if (!isOpen) return null;

  const stockDifference = stockTheorique - initialStock;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Le code article est requis.';
    } else {
      const codeUpper = code.trim().toUpperCase();
      const codeExists = existingCodes.some(
        c => c.toUpperCase() === codeUpper && (!articleToEdit || articleToEdit.code.toUpperCase() !== codeUpper)
      );
      if (codeExists) {
        newErrors.code = 'Ce code article existe déjà.';
      }
    }

    if (!designation.trim()) {
      newErrors.designation = 'La désignation est requise.';
    }

    if (stockTheorique < 0) {
      newErrors.stockTheorique = 'Le stock ne peut pas être négatif.';
    }

    if (seuilCritique < 0) {
      newErrors.seuilCritique = 'Le seuil critique ne peut pas être négatif.';
    }

    if (quantiteStandardAchat <= 0) {
      newErrors.quantiteStandardAchat = 'La quantité standard doit être supérieure à 0.';
    }

    if (densite !== undefined && densite <= 0) {
      newErrors.densite = 'La densité doit être supérieure à 0.';
    }

    if (coutUnitaireStandard !== undefined && coutUnitaireStandard < 0) {
      newErrors.coutUnitaireStandard = 'Le coût unitaire standard ne peut pas être négatif.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const savedArticle: Article = {
      id: articleToEdit ? articleToEdit.id : Date.now(),
      code: code.trim().toUpperCase(),
      designation: designation.trim(),
      estComposant,
      uniteMesure,
      stockTheorique: Number(stockTheorique),
      seuilCritique: Number(seuilCritique),
      quantiteStandardAchat: Number(quantiteStandardAchat),
      delaiLivraisonFournisseurJours: Number(delaiLivraisonFournisseurJours),
      densite: densite !== undefined ? Number(densite) : undefined,
      capaciteVolumeLitres: capaciteVolumeLitres !== undefined ? Number(capaciteVolumeLitres) : undefined,
      typeEmballage: typeEmballage.trim() || undefined,
      prixUnitaireEstime: prixUnitaireEstime !== undefined ? Number(prixUnitaireEstime) : undefined,
      coutUnitaireStandard: coutUnitaireStandard !== undefined ? Number(coutUnitaireStandard) : undefined,
      emplacement: emplacement.trim() || undefined
    };

    const ajustement = (isEditing && stockDifference !== 0 && genererMouvementInventaire)
      ? { difference: stockDifference, motif: motifInventaire }
      : undefined;

    onSave(savedArticle, ajustement);
    onClose();
  };

  // Quick preset templates
  const applyPreset = (type: 'mp-liquide' | 'emballage' | 'pf-liquide') => {
    if (type === 'mp-liquide') {
      setEstComposant(true);
      setUniteMesure('L');
      setTypeEmballage('Cuve Inox Vrac');
      setDensite(1.0);
      setCapaciteVolumeLitres(undefined);
      setEmplacement('Parc Cuves Matières Premières');
      setDelaiLivraisonFournisseurJours(3);
      setPrixUnitaireEstime(1.65);
      setCoutUnitaireStandard(1.65);
    } else if (type === 'emballage') {
      setEstComposant(true);
      setUniteMesure('U');
      setTypeEmballage('Carton palette 500 unités');
      setDensite(undefined);
      setCapaciteVolumeLitres(1.0);
      setEmplacement('Magasin Emballages - Allée E');
      setDelaiLivraisonFournisseurJours(5);
      setPrixUnitaireEstime(0.40);
      setCoutUnitaireStandard(0.40);
    } else if (type === 'pf-liquide') {
      setEstComposant(false);
      setUniteMesure('U');
      setTypeEmballage('Carton de 12 flacons PEHD');
      setDensite(0.95);
      setCapaciteVolumeLitres(1.0);
      setEmplacement('Magasin Produits Finis - Quai 02');
      setDelaiLivraisonFournisseurJours(0);
      setPrixUnitaireEstime(4.85);
      setCoutUnitaireStandard(2.80);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEditing ? `Modifier Article • ${articleToEdit?.code}` : 'Créer un Nouvel Article ou Matière Première'}
              </h3>
              <p className="text-xs text-slate-400">
                Fiche article ERP, paramètres d'approvisionnement MRP et caractéristiques physico-chimiques liquides.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets for New Article */}
        {!isEditing && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Modèles rapides :</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => applyPreset('mp-liquide')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-950 text-sky-300 border border-slate-800 hover:border-sky-600 transition-colors font-medium text-[11px]"
              >
                Matière Première Liquide (L)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('emballage')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950 text-purple-300 border border-slate-800 hover:border-purple-600 transition-colors font-medium text-[11px]"
              >
                Composant Emballage (U)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('pf-liquide')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-slate-800 hover:border-emerald-600 transition-colors font-medium text-[11px]"
              >
                Produit Fini Liquide (U)
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* Section 1 : Identification Générale */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <span>1. Identification & Type d'Article</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Code Article */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Code Article <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ex: MP-ETH-96, PF-VIR-1L"
                  className={`w-full px-3 py-2 bg-slate-950 border ${errors.code ? 'border-rose-500' : 'border-slate-800'} rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500`}
                />
                {errors.code && <p className="text-[11px] text-rose-400 mt-1">{errors.code}</p>}
              </div>

              {/* Type d'article */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Typologie Industrielle <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstComposant(true)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      estComposant 
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Composant / MP
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstComposant(false)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      !estComposant 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Produit Fini (PF)
                  </button>
                </div>
              </div>

              {/* Unité de mesure */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unité de Stockage <span className="text-rose-400">*</span>
                </label>
                <select
                  value={uniteMesure}
                  onChange={e => setUniteMesure(e.target.value as UnitType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value="L">Litre (L) - Liquides vrac</option>
                  <option value="KG">Kilogramme (KG) - Poudres / Poids</option>
                  <option value="U">Unité (U) - Flacons / Emballages / PF</option>
                </select>
              </div>

            </div>

            {/* Désignation complète */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Désignation Commerciale / Technique <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="ex: Éthanol Surfin Rectifié 96% v/v Vrac ou Flacon PEHD 1000ml Blanc"
                className={`w-full px-3 py-2 bg-slate-950 border ${errors.designation ? 'border-rose-500' : 'border-slate-800'} rounded-xl text-xs text-white focus:outline-none focus:border-sky-500`}
              />
              {errors.designation && <p className="text-[11px] text-rose-400 mt-1">{errors.designation}</p>}
            </div>

          </div>

          {/* Section 2 : Gestion des Stocks & Paramètres MRP */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <span>2. Niveaux de Stock & Approvisionnement MRP</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Stock Théorique Actuel */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stock Théorique Actuel ({uniteMesure}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={stockTheorique}
                  onChange={e => setStockTheorique(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-950 border ${errors.stockTheorique ? 'border-rose-500' : 'border-slate-800'} rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500`}
                />
                {errors.stockTheorique && <p className="text-[11px] text-rose-400 mt-1">{errors.stockTheorique}</p>}
              </div>

              {/* Seuil Critique de Réappro */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Seuil Critique / Mini ({uniteMesure}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={seuilCritique}
                  onChange={e => setSeuilCritique(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-950 border ${errors.seuilCritique ? 'border-rose-500' : 'border-slate-800'} rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-sky-500`}
                />
                <p className="text-[10px] text-slate-500 mt-1">Déclenche les alertes et suggestions d'achat MRP.</p>
              </div>

              {/* Quantité Standard d'Achat (EOQ) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lot Standard d'Achat ({uniteMesure}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantiteStandardAchat}
                  onChange={e => setQuantiteStandardAchat(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-950 border ${errors.quantiteStandardAchat ? 'border-rose-500' : 'border-slate-800'} rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500`}
                />
                <p className="text-[10px] text-slate-500 mt-1">Quantité minimale commandée au fournisseur.</p>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Délai Livraison Fournisseur */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Délai Fournisseur (Jours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={delaiLivraisonFournisseurJours}
                  onChange={e => setDelaiLivraisonFournisseurJours(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Coût Unitaire Standard (Suivi Coût de Revient) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    Coût Std (DA/{uniteMesure})
                  </span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={coutUnitaireStandard ?? ''}
                  onChange={e => setCoutUnitaireStandard(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="ex: 1.6500"
                  className={`w-full px-3 py-2 bg-slate-950 border ${errors.coutUnitaireStandard ? 'border-rose-500' : 'border-indigo-700/60'} rounded-xl text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-400`}
                />
                {errors.coutUnitaireStandard ? (
                  <p className="text-[10px] text-rose-400 mt-1">{errors.coutUnitaireStandard}</p>
                ) : (
                  <p className="text-[10px] text-indigo-300/80 mt-1">Coût de revient standard de référence.</p>
                )}
              </div>

              {/* Prix unitaire estimé / Vente */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {estComposant ? 'Prix Achat Estimé (DA)' : 'Prix Vente Estimé (DA)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prixUnitaireEstime ?? ''}
                  onChange={e => setPrixUnitaireEstime(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="ex: 1.85"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Tarif marché / catalogue.</p>
              </div>

              {/* Emplacement de stockage */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Emplacement Stockage
                </label>
                <input
                  type="text"
                  value={emplacement}
                  onChange={e => setEmplacement(e.target.value)}
                  placeholder="ex: Cuve Inox 01, Allée B3, Quai 02"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Zone logistique usine.</p>
              </div>

            </div>

            {/* Inventory Adjustment Warning Box if stock changed */}
            {isEditing && stockDifference !== 0 && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Écart d'inventaire détecté :</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    stockDifference > 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {stockDifference > 0 ? `+${stockDifference}` : stockDifference} {uniteMesure}
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-inventaire"
                    checked={genererMouvementInventaire}
                    onChange={e => setGenererMouvementInventaire(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="chk-inventaire" className="text-slate-300 text-xs cursor-pointer">
                    Enregistrer automatiquement un mouvement d'ajustement d'inventaire dans le registre ERP
                  </label>
                </div>

                {genererMouvementInventaire && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={motifInventaire}
                      onChange={e => setMotifInventaire(e.target.value)}
                      placeholder="Motif de l'ajustement (ex: Inventaire tournant mensuel)"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Section 3 : Spécificités Procédé Liquides & Emballage */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <span>3. Spécificités Liquides & Conditionnement</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Densité relative */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Densité du Liquide (g/cm³)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={densite ?? ''}
                  onChange={e => setDensite(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="ex: 0.806 (Éthanol), 1.26 (Glycérol)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-sky-400 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Utilisé pour les conversions Massique ➔ Volumique.</p>
              </div>

              {/* Capacité unitaire / volume */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Volume Unitaire (Litres)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={capaciteVolumeLitres ?? ''}
                  onChange={e => setCapaciteVolumeLitres(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="ex: 1.0 (flacon 1L), 5.0 (bidon 5L)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Type d'emballage / contenant */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contenant / Type Emballage
                </label>
                <input
                  type="text"
                  value={typeEmballage}
                  onChange={e => setTypeEmballage(e.target.value)}
                  placeholder="ex: Cuve Inox, IBC 1000L, Flacon PEHD"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

            </div>

          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Enregistrer les Modifications' : 'Créer l\'Article'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
