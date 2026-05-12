// Fonctions d'authentification Firebase
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config';
import { getUserById } from './users';

// Connexion avec email et mot de passe + vérification du rôle
export const loginWithEmail = async (email, password, requiredRole = null) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Si un rôle spécifique est requis, on vérifie
  if (requiredRole) {
    try {
      const userProfile = await getUserById(userCredential.user.uid);
      
      if (userProfile.role !== requiredRole) {
        // Déconnexion immédiate si le rôle ne correspond pas
        await signOut(auth);
        throw new Error(`ACCESS_DENIED_${requiredRole.toUpperCase()}`);
      }
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  }
  
  return userCredential;
};

// Déconnexion
export const logout = () => signOut(auth);

// Création d'un compte avec rôle
export const createAccount = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);
