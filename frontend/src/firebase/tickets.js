// Opérations Firestore pour la collection tickets/
// RÈGLE CRITIQUE : used = true est immuable — aucune mise à jour ne peut repasser used à false
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'tickets';

// Récupérer tous les billets d'un événement
export const getTicketsByEvent = async (eventId) => {
  const q = query(
    collection(db, COLLECTION),
    where('eventId', '==', eventId),
  );
  const snapshot = await getDocs(q);
  // Tri côté client en attendant que l'index Firestore soit créé
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
};

// Récupérer un billet par son ID
export const getTicketById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Billet introuvable');
  return { id: snap.id, ...snap.data() };
};

// Créer un nouveau billet
export const createTicket = async (data) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    used: false,
    usedAt: null,
    scannedBy: null,
    createdAt: serverTimestamp(),
  });
};

// Marquer un billet comme utilisé — IRRÉVERSIBLE
export const markTicketAsUsed = async (id, scannedBy) => {
  const ticketRef = doc(db, COLLECTION, id);
  const snap      = await getDoc(ticketRef);

  if (!snap.exists()) throw new Error('Billet introuvable');

  // Règle métier : used = true est permanent
  if (snap.data().used === true) {
    throw new Error('Ce billet a déjà été scanné.');
  }

  return updateDoc(ticketRef, {
    used:      true,
    usedAt:    serverTimestamp(),
    scannedBy: scannedBy ?? null,
  });
};
