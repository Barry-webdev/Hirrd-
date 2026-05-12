// Fonctions d'authentification Firebase
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config';

// Connexion avec email et mot de passe
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Déconnexion
export const logout = () => signOut(auth);

// Création d'un compte (admin uniquement)
export const createAccount = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);
