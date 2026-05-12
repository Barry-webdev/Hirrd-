# Système d'Authentification Dual

Ce projet utilise Firebase Authentication avec deux méthodes distinctes :
- **Web (Admins)** : Email + mot de passe
- **Mobile (Scanners)** : Numéro de téléphone + code SMS

## Architecture

### Rôles disponibles
- **`admin`** : Accès complet à l'application web (dashboard, gestion des événements, tickets, utilisateurs)
- **`scanner`** : Accès limité à l'application mobile (scan de tickets uniquement)

### Structure Firestore

Collection `users` :
```javascript
{
  // Pour les admins
  uid: "firebase-auth-uid",
  email: "admin@example.com",
  role: "admin",
  name: "Nom Admin",
  createdAt: timestamp
}

{
  // Pour les scanners
  id: "auto-generated-id",
  phoneNumber: "+33612345678",
  role: "scanner",
  name: "Nom Scanner",
  isActive: true,
  createdAt: timestamp
}
```

## Utilisation

### Application Web (Admins)

#### Connexion admin
```javascript
import { loginWithEmail } from './firebase/auth';

// Connexion avec vérification du rôle admin
await loginWithEmail(email, password, 'admin');
```

#### Créer un scanner (par l'admin)
```javascript
import { createScanner } from './firebase/users';

// L'admin crée un scanner avec son numéro
await createScanner({
  name: "Jean Dupont",
  phoneNumber: "+33612345678"
});
```

### Application Mobile (Scanners)

#### Étape 1 : Envoyer le code SMS
```javascript
import { sendSMSCode } from './firebase/mobileAuth';

// Vérifier si le numéro existe et envoyer le code
const { confirmationResult, scanner } = await sendSMSCode(
  phoneNumber, 
  recaptchaContainer
);
```

#### Étape 2 : Vérifier le code SMS
```javascript
import { verifySMSCode } from './firebase/mobileAuth';

// Vérifier le code et connecter l'utilisateur
const { user, scanner } = await verifySMSCode(confirmationResult, code);
```

#### Alternative pour React Native
```javascript
import { loginScannerWithPhone } from './firebase/mobileAuth';

// Connexion directe avec verificationId
const { user, scanner } = await loginScannerWithPhone(
  phoneNumber,
  verificationCode,
  verificationId
);
```

## Configuration Firebase

### 1. Activer Phone Authentication

Dans la console Firebase :
1. Aller dans **Authentication** > **Sign-in method**
2. Activer **Phone** (Téléphone)
3. Ajouter les domaines autorisés pour reCAPTCHA

### 2. Configuration reCAPTCHA

Pour le web, Firebase utilise reCAPTCHA invisible. Assure-toi que :
- Ton domaine est autorisé dans Firebase Console
- Le container reCAPTCHA existe dans le DOM

Pour React Native, utilise `firebase.auth().verifyPhoneNumber()` qui gère automatiquement la vérification.

## Workflow complet

### Création d'un scanner par l'admin

1. L'admin se connecte sur le web avec email/password
2. Il va dans la section "Scanners"
3. Il crée un nouveau scanner avec :
   - Nom complet
   - Numéro de téléphone (format international)
4. Le scanner est créé dans Firestore avec `isActive: true`

### Connexion du scanner sur mobile

1. Le scanner ouvre l'app mobile
2. Il entre son numéro de téléphone
3. L'app vérifie si le numéro existe dans Firestore
4. Si oui, Firebase envoie un code SMS
5. Le scanner entre le code reçu
6. Si le code est correct, il est connecté

## Sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper pour vérifier le rôle
    function getUserRole(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role;
    }
    
    function isAdmin() {
      return request.auth != null && getUserRole(request.auth.uid) == 'admin';
    }
    
    function isScanner() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             getUserRole(request.auth.uid) == 'scanner';
    }
    
    // Collection users
    match /users/{userId} {
      // Lecture : tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Création/modification : seulement les admins
      allow create, update: if isAdmin();
      
      // Suppression : seulement les admins
      allow delete: if isAdmin();
    }
    
    // Collection events
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Collection tickets
    match /tickets/{ticketId} {
      allow read: if request.auth != null;
      
      // Admins : tout
      // Scanners : seulement mise à jour du statut
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || isScanner();
    }
  }
}
```

## Messages d'erreur

### Erreurs web (admins)
- `ACCESS_DENIED_ADMIN` : L'utilisateur n'est pas un admin
- `auth/invalid-credential` : Email ou mot de passe incorrect

### Erreurs mobile (scanners)
- `PHONE_NOT_REGISTERED` : Le numéro n'existe pas dans le système
- `ACCOUNT_DISABLED` : Le compte a été désactivé par un admin
- `INVALID_CODE` : Le code SMS est incorrect
- `SCANNER_NOT_FOUND` : Profil scanner introuvable

## Gestion des scanners

### Activer/désactiver un scanner
```javascript
import { updateUser } from './firebase/users';

// Désactiver un scanner
await updateUser(scannerId, { isActive: false });
```

### Supprimer un scanner
```javascript
import { deleteUser } from './firebase/users';

await deleteUser(scannerId);
```

## Notes importantes

1. **Format du numéro** : Toujours utiliser le format international (ex: +33612345678)
2. **reCAPTCHA** : Nécessaire pour le web, automatique sur React Native
3. **Vérification** : Le numéro doit exister dans Firestore AVANT de pouvoir se connecter
4. **Sécurité** : Les scanners ne peuvent pas créer leur propre compte
