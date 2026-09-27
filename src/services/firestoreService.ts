import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrdreFabrication, MouvementStock, InterventionMaintenance } from '../types';
import { INITIAL_ORDRES_FABRICATION, INITIAL_MOUVEMENTS_STOCK, INITIAL_INTERVENTIONS } from '../data/initialData';

const OF_COLLECTION = 'ordres_fabrication';
const MVT_COLLECTION = 'mouvements_stock';
const INTERVENTION_COLLECTION = 'interventions_maintenance';

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
      statut: ofItem.statut,
      datePlanifiee: ofItem.datePlanifiee,
      ligneProductionId: ofItem.ligneProductionId,
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

export function subscribeToInterventionsMaintenance(
  callback: (interventions: InterventionMaintenance[]) => void
): () => void {
  const colRef = collection(db, INTERVENTION_COLLECTION);
  const q = query(colRef, limit(100));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      // Seed initial maintenance entries if cloud collection is empty
      INITIAL_INTERVENTIONS.forEach(async (item) => {
        try {
          await setDoc(doc(db, INTERVENTION_COLLECTION, item.id), {
            id: item.id,
            date: item.date,
            machineId: item.machineId,
            machineNom: item.machineNom,
            technicien: item.technicien,
            descriptionPanne: item.descriptionPanne,
            typeIntervention: item.typeIntervention,
            dureeMinutes: item.dureeMinutes || 30,
            statutMachineApres: item.statutMachineApres || 'Operationnelle',
            piecesRemplacees: item.piecesRemplacees || '',
            createdBy: 'system'
          });
        } catch {
          // ignore seeding write error
        }
      });
      callback(INITIAL_INTERVENTIONS);
      return;
    }

    const items: InterventionMaintenance[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      items.push({
        id: data.id || d.id,
        date: data.date || new Date().toISOString(),
        machineId: data.machineId || 1,
        machineNom: data.machineNom || 'Machine industrielle',
        technicien: data.technicien || 'Technicien Maintenance',
        descriptionPanne: data.descriptionPanne || '',
        typeIntervention: data.typeIntervention || 'Curative',
        dureeMinutes: data.dureeMinutes || 30,
        statutMachineApres: data.statutMachineApres || 'Operationnelle',
        piecesRemplacees: data.piecesRemplacees || '',
        impactTrs: data.impactTrs,
        createdBy: data.createdBy,
        createdAt: data.createdAt || data.date
      });
    });

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(items);
  }, (err) => {
    console.warn('[Firestore] Error subscribing to maintenance logs, using local state:', err);
    callback(INITIAL_INTERVENTIONS);
  });
}

export async function persistInterventionMaintenance(
  intervention: InterventionMaintenance,
  userUid: string = 'system'
): Promise<void> {
  try {
    await setDoc(doc(db, INTERVENTION_COLLECTION, intervention.id), {
      id: intervention.id,
      date: intervention.date,
      machineId: intervention.machineId,
      machineNom: intervention.machineNom,
      technicien: intervention.technicien,
      descriptionPanne: intervention.descriptionPanne,
      typeIntervention: intervention.typeIntervention,
      dureeMinutes: intervention.dureeMinutes,
      statutMachineApres: intervention.statutMachineApres,
      piecesRemplacees: intervention.piecesRemplacees || '',
      createdBy: userUid
    });
  } catch (err) {
    console.warn('[Firestore] Could not persist maintenance intervention:', err);
  }
}

export async function deleteInterventionMaintenance(
  interventionId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, INTERVENTION_COLLECTION, interventionId));
  } catch (err) {
    console.warn('[Firestore] Could not delete maintenance intervention:', err);
  }
}
