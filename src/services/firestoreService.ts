import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrdreFabrication, MouvementStock } from '../types';
import { INITIAL_ORDRES_FABRICATION, INITIAL_MOUVEMENTS_STOCK } from '../data/initialData';

const OF_COLLECTION = 'ordres_fabrication';
const MVT_COLLECTION = 'mouvements_stock';

export function subscribeToOrdresFabrication(
  callback: (ofs: OrdreFabrication[]) => void
): () => void {
  const colRef = collection(db, OF_COLLECTION);
  const q = query(colRef, limit(50));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      // Seed initial OFs if collection is empty
      INITIAL_ORDRES_FABRICATION.forEach(async (item) => {
        try {
          await setDoc(doc(db, OF_COLLECTION, String(item.id)), {
            id: String(item.id),
            articleCode: String(item.articleId),
            quantiteDemandee: item.quantiteCible,
            quantiteProduite: item.quantiteProduite || 0,
            statut: item.statut === 'Termine' ? 'Termine' : 'EnConditionnement',
            createdBy: 'system',
            updatedAt: new Date().toISOString()
          });
        } catch {
          // Ignore seeding errors
        }
      });
      callback(INITIAL_ORDRES_FABRICATION);
      return;
    }

    const ofs: OrdreFabrication[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const numId = parseInt(data.id, 10) || INITIAL_ORDRES_FABRICATION[0].id;
      const initialMatch = INITIAL_ORDRES_FABRICATION.find(o => o.id === numId);
      ofs.push({
        id: numId,
        numeroOF: initialMatch?.numeroOF || `OF-${data.id}`,
        articleId: initialMatch?.articleId || parseInt(data.articleCode, 10) || 1,
        quantiteCible: data.quantiteDemandee || initialMatch?.quantiteCible || 1000,
        quantiteProduite: data.quantiteProduite || 0,
        quantiteRebutee: initialMatch?.quantiteRebutee || 0,
        datePlanifiee: initialMatch?.datePlanifiee || new Date().toISOString(),
        statut: (data.statut as OrdreFabrication['statut']) || 'EnConditionnement',
        ligneProductionId: initialMatch?.ligneProductionId || 1,
        numeroLotFabrique: initialMatch?.numeroLotFabrique || `LOT-${data.id}`,
        operateur: initialMatch?.operateur || 'Équipe Ligne 01',
        commandeClientId: initialMatch?.commandeClientId,
        tempsCycleSecondes: initialMatch?.tempsCycleSecondes || 3.6,
        tempsProductionMinutes: initialMatch?.tempsProductionMinutes || 0
      });
    });

    callback(ofs);
  }, (err) => {
    console.warn('[Firestore] Error subscribing to OFs, using local state:', err);
    callback(INITIAL_ORDRES_FABRICATION);
  });
}

export async function persistOrdreFabrication(
  ofItem: OrdreFabrication,
  userUid: string = 'system'
): Promise<void> {
  try {
    await setDoc(doc(db, OF_COLLECTION, String(ofItem.id)), {
      id: String(ofItem.id),
      articleCode: String(ofItem.articleId),
      quantiteDemandee: ofItem.quantiteCible,
      quantiteProduite: ofItem.quantiteProduite || 0,
      statut: ofItem.statut === 'Termine' ? 'Termine' : 'EnConditionnement',
      createdBy: userUid,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Firestore] Could not persist OF:', err);
  }
}

export function subscribeToMouvementsStock(
  callback: (mvts: MouvementStock[]) => void
): () => void {
  const colRef = collection(db, MVT_COLLECTION);
  const q = query(colRef, limit(50));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(INITIAL_MOUVEMENTS_STOCK);
      return;
    }

    const mvts: MouvementStock[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const numId = parseInt(data.id, 10) || Date.now();
      mvts.push({
        id: numId,
        articleId: parseInt(data.articleCode, 10) || 1,
        quantite: data.quantite,
        typeMouvement: data.type === 'ENTREE_RECEPTION' ? 'Entree' : (data.type === 'SORTIE_PRODUCTION' ? 'Sortie' : 'PostDeductionProduction'),
        referenceDocument: data.referenceDocument || '',
        numeroLot: '',
        dateMouvement: data.date || new Date().toISOString(),
        details: 'Synchronisé depuis Firestore'
      });
    });

    callback(mvts);
  }, (err) => {
    console.warn('[Firestore] Error subscribing to stock movements, using local state:', err);
    callback(INITIAL_MOUVEMENTS_STOCK);
  });
}

export async function persistMouvementStock(
  mvt: MouvementStock,
  userUid: string = 'system'
): Promise<void> {
  try {
    await setDoc(doc(db, MVT_COLLECTION, String(mvt.id)), {
      id: String(mvt.id),
      date: mvt.dateMouvement,
      articleCode: String(mvt.articleId),
      type: mvt.typeMouvement === 'Entree' ? 'ENTREE_RECEPTION' : 'SORTIE_PRODUCTION',
      quantite: mvt.quantite,
      referenceDocument: mvt.referenceDocument,
      createdBy: userUid
    });
  } catch (err) {
    console.warn('[Firestore] Could not persist stock movement:', err);
  }
}
