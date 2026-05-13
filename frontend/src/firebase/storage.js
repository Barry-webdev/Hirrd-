// Opérations Firebase Storage pour l'upload de fichiers
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload une image vers Firebase Storage
 * @param {File} file - Fichier image à uploader
 * @param {string} folder - Dossier de destination (ex: 'events', 'users')
 * @returns {Promise<string>} URL de téléchargement de l'image
 */
export const uploadImage = async (file, folder = 'events') => {
  if (!file) throw new Error('Aucun fichier fourni');

  // Vérifier que c'est bien une image
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image');
  }

  // Vérifier la taille (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('L\'image ne doit pas dépasser 5MB');
  }

  // Créer un nom unique pour le fichier
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const extension = file.name.split('.').pop();
  const fileName = `${timestamp}_${randomStr}.${extension}`;

  // Référence vers le fichier dans Storage
  const storageRef = ref(storage, `${folder}/${fileName}`);

  // Upload du fichier
  const snapshot = await uploadBytes(storageRef, file);

  // Récupérer l'URL de téléchargement
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};

/**
 * Upload une image avec preview
 * @param {File} file - Fichier image
 * @param {Function} onProgress - Callback pour la progression (optionnel)
 * @returns {Promise<{url: string, preview: string}>}
 */
export const uploadImageWithPreview = async (file, onProgress) => {
  // Créer une preview locale
  const preview = URL.createObjectURL(file);

  // Upload vers Firebase
  const url = await uploadImage(file);

  return { url, preview };
};
