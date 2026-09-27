import { Article, Nomenclature, SuggestionAchat, MouvementStock, ConsommationDeduite } from '../types';

export class MrpStockEngine {
  /**
   * Implémentation exacte de MrpStockService.AppliquerPostDeductionStockAsync (PDF p. 7-8)
   */
  static appliquerPostDeductionStock(
    articleFabriqueId: number,
    quantiteRealisee: number,
    articles: Article[],
    nomenclatures: Nomenclature[],
    numeroLot: string
  ): {
    updatedArticles: Article[];
    nouveauxMouvements: MouvementStock[];
    consommations: ConsommationDeduite[];
  } {
    if (quantiteRealisee <= 0) {
      return { updatedArticles: articles, nouveauxMouvements: [], consommations: [] };
    }

    const lignesNomenclature = nomenclatures.filter(n => n.articleParentId === articleFabriqueId);
    const updatedArticles = [...articles];
    const nouveauxMouvements: MouvementStock[] = [];
    const consommations: ConsommationDeduite[] = [];

    for (const lien of lignesNomenclature) {
      const composantIndex = updatedArticles.findIndex(a => a.id === lien.composantId);
      if (composantIndex === -1) continue;

      const composant = { ...updatedArticles[composantIndex] };

      // Prise en compte de la perte tolérable pour les liquides (PDF C#)
      const facteurPerte = 1 + (lien.pourcentagePerteTolerable / 100);
      const quantiteConsommeeTotal = Number((lien.quantiteBesoinUnitaire * quantiteRealisee * facteurPerte).toFixed(4));

      // Déduction théorique de stock
      composant.stockTheorique = Number((composant.stockTheorique - quantiteConsommeeTotal).toFixed(4));
      updatedArticles[composantIndex] = composant;

      // Journalisation mouvement de stock
      nouveauxMouvements.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        articleId: composant.id,
        quantite: -quantiteConsommeeTotal,
        typeMouvement: 'PostDeductionProduction',
        referenceDocument: `PF-${articleFabriqueId} (Lot: ${numeroLot})`,
        numeroLot: numeroLot,
        dateMouvement: new Date().toISOString(),
        details: `Consommation brute: ${(lien.quantiteBesoinUnitaire * quantiteRealisee).toFixed(2)} ${composant.uniteMesure} + Perte: ${lien.pourcentagePerteTolerable}%`
      });

      consommations.push({
        composantId: composant.id,
        composantCode: composant.code,
        quantiteUnitaireTheorique: lien.quantiteBesoinUnitaire,
        pourcentagePerte: lien.pourcentagePerteTolerable,
        quantiteTotaleDeduite: quantiteConsommeeTotal,
        unite: composant.uniteMesure
      });
    }

    // Incrémenter le stock de produit fini produit (Entrée de production)
    const parentIndex = updatedArticles.findIndex(a => a.id === articleFabriqueId);
    if (parentIndex !== -1) {
      const parent = { ...updatedArticles[parentIndex] };
      parent.stockTheorique = Number((parent.stockTheorique + quantiteRealisee).toFixed(4));
      updatedArticles[parentIndex] = parent;

      nouveauxMouvements.push({
        id: Date.now() + Math.floor(Math.random() * 1000) + 1,
        articleId: parent.id,
        quantite: quantiteRealisee,
        typeMouvement: 'Entree',
        referenceDocument: `OF-PROD (Lot: ${numeroLot})`,
        numeroLot: numeroLot,
        dateMouvement: new Date().toISOString(),
        details: `Entrée en stock de production : +${quantiteRealisee} ${parent.uniteMesure} de ${parent.code}`
      });
    }

    return {
      updatedArticles,
      nouveauxMouvements,
      consommations
    };
  }

  /**
   * Implémentation exacte de MrpStockService.VerifierEtGenererSuggestionAchatAsync (PDF p. 8-9)
   */
  static verifierEtGenererSuggestionAchat(
    composantId: number,
    articles: Article[],
    suggestionsExistantes: SuggestionAchat[]
  ): SuggestionAchat | null {
    const composant = articles.find(a => a.id === composantId);
    if (!composant || !composant.estComposant) return null;

    if (composant.stockTheorique < composant.seuilCritique) {
      const suggestionExisteDeja = suggestionsExistantes.some(
        s => s.articleId === composantId && s.statut === 'AValider'
      );

      if (suggestionExisteDeja) return null;

      const manque = composant.seuilCritique - composant.stockTheorique;
      let quantiteACommander = manque;

      if (composant.quantiteStandardAchat > 0) {
        const multiplicateurs = Math.ceil(manque / composant.quantiteStandardAchat);
        quantiteACommander = multiplicateurs * composant.quantiteStandardAchat;
      }

      const dateMaintenant = new Date();
      const dateBesoin = new Date(dateMaintenant.getTime() + composant.delaiLivraisonFournisseurJours * 24 * 60 * 60 * 1000);
      const dateAuPlusTard = new Date(dateMaintenant.getTime() + 24 * 60 * 60 * 1000);

      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        articleId: composantId,
        quantiteSuggeree: quantiteACommander,
        dateSuggestion: dateMaintenant.toISOString(),
        statut: 'AValider',
        motif: `Stock actuel (${composant.stockTheorique} ${composant.uniteMesure}) inférieur au seuil critique (${composant.seuilCritique} ${composant.uniteMesure}).`,
        dateBesoinUsine: dateBesoin.toISOString(),
        dateCommandeAuPlusTard: dateAuPlusTard.toISOString()
      };
    }

    return null;
  }

  /**
   * Exécute le calcul MRP complet sur tous les composants
   */
  static executerCalculMrpComplet(
    articles: Article[],
    suggestionsActuelles: SuggestionAchat[]
  ): SuggestionAchat[] {
    const nouvellesSuggestions: SuggestionAchat[] = [];
    const suggestionsCombinées = [...suggestionsActuelles];

    for (const article of articles) {
      if (article.estComposant) {
        const suggestion = this.verifierEtGenererSuggestionAchat(article.id, articles, suggestionsCombinées);
        if (suggestion) {
          nouvellesSuggestions.push(suggestion);
          suggestionsCombinées.push(suggestion);
        }
      }
    }

    return nouvellesSuggestions;
  }
}
