// Script de migration pour ajouter les profils Firestore aux utilisateurs existants
import { setUserProfile } from '../firebase/users';

/**
 * Migrer un utilisateur existant en créant son profil Firestore
 * @param {string} uid - UID Firebase Auth de l'utilisateur
 * @param {object} data - Données du profil (nom, email, role)
 */
export const migrateUser = async (uid, data) => {
  const { nom, email, role = 'admin' } = data;
  
  if (!nom || !email) {
    throw new Error('Le nom et l\'email sont requis');
  }
  
  if (!['admin', 'scanner'].includes(role)) {
    throw new Error('Le rôle doit être "admin" ou "scanner"');
  }
  
  try {
    await setUserProfile(uid, {
      nom,
      email,
      role,
    });
    
    console.log(`✅ Profil créé pour ${email} (${role})`);
    return { success: true, uid, email, role };
  } catch (error) {
    console.error(`❌ Erreur pour ${email}:`, error);
    throw error;
  }
};

/**
 * Exemple d'utilisation :
 * 
 * import { migrateUser } from './utils/migrateUsers';
 * 
 * // Récupère l'UID depuis Firebase Console > Authentication
 * await migrateUser('UID_DE_TON_UTILISATEUR', {
 *   nom: 'Admin Principal',
 *   email: 'admin@hirrdé.com',
 *   role: 'admin'
 * });
 */
