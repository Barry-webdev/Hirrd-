// Authentification spécifique pour l'application mobile (scanners)
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from './config';
import { getScannerByPhone, isScannerActive } from './users';

/**
 * Étape 1 : Vérifier si le numéro existe et envoyer le code SMS
 * @param {string} phoneNumber - Format international (ex: +33612345678)
 * @param {HTMLElement} recaptchaContainer - Élément DOM pour le reCAPTCHA
 * @returns {Promise<{verificationId: string, scanner: object}>}
 */
export const sendSMSCode = async (phoneNumber, recaptchaContainer) => {
  // 1. Vérifier si le scanner existe dans Firestore
  const scanner = await getScannerByPhone(phoneNumber);
  
  if (!scanner) {
    throw new Error('PHONE_NOT_REGISTERED');
  }
  
  if (!isScannerActive(scanner)) {
    throw new Error('ACCOUNT_DISABLED');
  }
  
  // 2. Configurer reCAPTCHA (nécessaire pour Firebase Phone Auth)
  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA résolu, on peut envoyer le SMS
    }
  });
  
  // 3. Envoyer le code SMS via Firebase
  const confirmationResult = await signInWithPhoneNumber(
    auth, 
    phoneNumber, 
    recaptchaVerifier
  );
  
  return {
    verificationId: confirmationResult.verificationId,
    scanner,
    confirmationResult // Pour usage interne
  };
};

/**
 * Étape 2 : Vérifier le code SMS et connecter l'utilisateur
 * @param {string} verificationId - ID de vérification reçu à l'étape 1
 * @param {string} code - Code SMS à 6 chiffres
 * @returns {Promise<{user: object, scanner: object}>}
 */
export const verifySMSCode = async (confirmationResult, code) => {
  try {
    // Vérifier le code et connecter l'utilisateur
    const userCredential = await confirmationResult.confirm(code);
    
    // Récupérer le profil scanner
    const scanner = await getScannerByPhone(userCredential.user.phoneNumber);
    
    if (!scanner) {
      await auth.signOut();
      throw new Error('SCANNER_NOT_FOUND');
    }
    
    return {
      user: userCredential.user,
      scanner
    };
  } catch (error) {
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('INVALID_CODE');
    }
    throw error;
  }
};

/**
 * Alternative : Connexion directe avec numéro + code (pour React Native)
 * Utilise PhoneAuthProvider au lieu de signInWithPhoneNumber
 */
export const loginScannerWithPhone = async (phoneNumber, verificationCode, verificationId) => {
  // Créer les credentials
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  
  // Se connecter avec les credentials
  const userCredential = await signInWithCredential(auth, credential);
  
  // Vérifier que le scanner existe
  const scanner = await getScannerByPhone(phoneNumber);
  
  if (!scanner) {
    await auth.signOut();
    throw new Error('PHONE_NOT_REGISTERED');
  }
  
  if (!isScannerActive(scanner)) {
    await auth.signOut();
    throw new Error('ACCOUNT_DISABLED');
  }
  
  return {
    user: userCredential.user,
    scanner
  };
};
