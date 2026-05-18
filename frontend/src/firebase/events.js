// Opérations Firestore pour la collection events/
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'events';

// Récupérer tous les événements triés par date décroissante
export const getEvents = async () => {
  const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Récupérer un événement par son ID
export const getEventById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Événement introuvable');
  return { id: snap.id, ...snap.data() };
};

// Créer un nouvel événement
export const createEvent = async (data) => {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    status: 'draft',
    createdAt: serverTimestamp(),
  });
};

// Mettre à jour un événement existant
export const updateEvent = async (id, data) =>
  updateDoc(doc(db, COLLECTION, id), data);

// Supprimer un événement et tous ses tickets associés (cascade delete)
export const deleteEvent = async (id) => {
  // Importer la fonction de suppression des tickets
  const { deleteTicketsByEvent } = await import('./tickets');
  
  // Supprimer d'abord tous les tickets de l'événement
  await deleteTicketsByEvent(id);
  
  // Puis supprimer l'événement
  return deleteDoc(doc(db, COLLECTION, id));
};
