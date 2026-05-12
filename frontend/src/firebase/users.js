// Opérations Firestore pour la collection users/
import {
  collection, doc, getDocs, getDoc,
  setDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'users';

// Récupérer tous les utilisateurs
export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Récupérer un utilisateur par son ID
export const getUserById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Utilisateur introuvable');
  return { id: snap.id, ...snap.data() };
};

// Créer ou mettre à jour un profil utilisateur (utilisé après createAccount)
export const setUserProfile = async (uid, data) => {
  return setDoc(doc(db, COLLECTION, uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

// Mettre à jour un utilisateur existant
export const updateUser = async (id, data) =>
  updateDoc(doc(db, COLLECTION, id), data);

// Supprimer un utilisateur
export const deleteUser = async (id) =>
  deleteDoc(doc(db, COLLECTION, id));
