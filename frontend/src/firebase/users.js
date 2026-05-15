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
  // Validation du rôle
  const validRoles = ['admin', 'scanner', 'owner'];
  if (data.role && !validRoles.includes(data.role)) {
    throw new Error('Rôle invalide. Utilisez "admin", "scanner" ou "owner".');
  }
  
  return setDoc(doc(db, COLLECTION, uid), {
    ...data,
    role: data.role || 'scanner', // Par défaut : scanner
    createdAt: serverTimestamp(),
  });
};

// Créer un scanner directement dans Firestore (sans Firebase Auth)
export const createScannerProfile = async (data) => {
  const { nom, phoneNumber, pinCode, eventAssigned } = data;
  
  if (!nom || !phoneNumber || !pinCode) {
    throw new Error('Le nom, le numéro de téléphone et le PIN sont requis.');
  }
  
  // Vérifier si le numéro existe déjà
  const { query: fsQuery, where, getDocs: fsGetDocs } = await import('firebase/firestore');
  const q = fsQuery(
    collection(db, COLLECTION),
    where('phoneNumber', '==', phoneNumber),
    where('role', '==', 'scanner')
  );
  const snapshot = await fsGetDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Ce numéro de téléphone est déjà enregistré.');
  }
  
  // Créer le document avec un ID auto-généré
  const scannerRef = doc(collection(db, COLLECTION));
  await setDoc(scannerRef, {
    nom,
    phoneNumber,
    pinCode,
    role: 'scanner',
    eventAssigned: eventAssigned || null,
    createdAt: serverTimestamp(),
  });
  
  return { id: scannerRef.id, nom, phoneNumber, pinCode, role: 'scanner', eventAssigned };
};

// Créer un scanner avec numéro de téléphone (sans authentification Firebase)
export const createScanner = async (data) => {
  const { phoneNumber, name } = data;
  
  if (!phoneNumber || !name) {
    throw new Error('Le numéro de téléphone et le nom sont requis.');
  }
  
  // Vérifier si le numéro existe déjà
  const existingScanner = await getScannerByPhone(phoneNumber);
  if (existingScanner) {
    throw new Error('Ce numéro de téléphone est déjà enregistré.');
  }
  
  // Créer le document avec un ID auto-généré
  const scannerRef = doc(collection(db, COLLECTION));
  await setDoc(scannerRef, {
    phoneNumber,
    name,
    role: 'scanner',
    isActive: true,
    createdAt: serverTimestamp(),
  });
  
  return { id: scannerRef.id, phoneNumber, name, role: 'scanner' };
};

// Récupérer un scanner par son numéro de téléphone
export const getScannerByPhone = async (phoneNumber) => {
  const { query, where, getDocs } = await import('firebase/firestore');
  const q = query(
    collection(db, COLLECTION),
    where('phoneNumber', '==', phoneNumber),
    where('role', '==', 'scanner')
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Vérifier si un scanner est actif (pour les scanners créés via Users.jsx)
export const isScannerActive = (scanner) => {
  // Si le champ isActive existe, on l'utilise
  if (scanner.hasOwnProperty('isActive')) {
    return scanner.isActive === true;
  }
  // Sinon, on considère que le scanner est actif par défaut
  return true;
};

// Mettre à jour un utilisateur existant
export const updateUser = async (id, data) =>
  updateDoc(doc(db, COLLECTION, id), data);

// Réinitialiser le PIN d'un scanner
export const resetScannerPIN = async (scannerId, newPIN) => {
  await updateDoc(doc(db, COLLECTION, scannerId), {
    pinCode: newPIN,
  });
  return newPIN;
};

// Supprimer un utilisateur
export const deleteUser = async (id) =>
  deleteDoc(doc(db, COLLECTION, id));
