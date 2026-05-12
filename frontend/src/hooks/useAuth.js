// Hook d'authentification — écoute l'état de connexion et récupère le rôle Firestore
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de sécurité — si Firebase ne répond pas en 5s, on débloque le loading
    const timeout = setTimeout(() => setLoading(false), 5000);

    // Abonnement aux changements d'état d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        setUser(firebaseUser);

        // Récupération du rôle depuis la collection users/ de Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role ?? null);
          } else {
            setRole(null);
          }
        } catch (err) {
          console.error('Erreur lors de la récupération du rôle :', err);
          setRole(null);
        }
      } else {
        // Utilisateur déconnecté
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    }, (err) => {
      // Erreur Firebase (credentials invalides, réseau, etc.)
      console.error('Firebase Auth error :', err);
      clearTimeout(timeout);
      setLoading(false);
    });

    // Nettoyage de l'abonnement au démontage
    return () => { unsubscribe(); clearTimeout(timeout); };
  }, []);

  return { user, loading, role };
}
