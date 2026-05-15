// Utilitaire pour générer des codes PIN aléatoires

/**
 * Génère un code PIN à 6 chiffres
 * @returns {string} PIN à 6 chiffres (ex: "123456")
 */
export const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} Mot de passe aléatoire
 */
export const generatePassword = (length = 6) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Copie du texte dans le presse-papiers
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Erreur lors de la copie :', err);
    return false;
  }
};
