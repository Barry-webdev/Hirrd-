# 🔐 Résumé : Système d'Authentification Dual

## Ce qui a été mis en place

### 1. Deux méthodes de connexion distinctes

#### 🖥️ **Application Web (Admins)**
- Connexion avec **email + mot de passe**
- Accès complet au dashboard
- Peut créer et gérer les scanners

#### 📱 **Application Mobile (Scanners)**
- Connexion avec **numéro de téléphone + code SMS**
- Accès limité au scan de tickets
- Doit être créé par un admin avant de pouvoir se connecter

### 2. Fichiers créés/modifiés

#### Fichiers modifiés :
- ✅ `src/firebase/auth.js` - Ajout vérification rôle admin
- ✅ `src/firebase/users.js` - Ajout création scanners + recherche par téléphone
- ✅ `src/pages/Login.jsx` - Connexion réservée aux admins

#### Nouveaux fichiers :
- ✅ `src/firebase/mobileAuth.js` - Authentification SMS pour mobile
- ✅ `src/pages/Scanners.jsx` - Interface de gestion des scanners
- ✅ `src/pages/MobileLogin.jsx` - Exemple de connexion mobile (web)
- ✅ `AUTHENTICATION.md` - Documentation complète
- ✅ `MOBILE_INTEGRATION.md` - Guide React Native

## Comment ça marche ?

### Workflow Admin (Web)

1. L'admin se connecte avec son email/password
2. Il va dans la page "Scanners"
3. Il crée un nouveau scanner en entrant :
   - Nom complet
   - Numéro de téléphone (format international : +33612345678)
4. Le scanner est enregistré dans Firestore

### Workflow Scanner (Mobile)

1. Le scanner ouvre l'app mobile
2. Il entre son numéro de téléphone
3. L'app vérifie si le numéro existe dans la base
4. Si oui, Firebase envoie un code SMS
5. Le scanner entre le code reçu
6. Il est connecté et peut scanner les tickets

## Prochaines étapes

### 1. Ajouter la page Scanners au menu

Modifie ton fichier de navigation pour ajouter la route :

```javascript
import Scanners from './pages/Scanners';

// Dans tes routes
<Route path="/scanners" element={<Scanners />} />
```

### 2. Créer ton premier admin

Tu peux le faire via Firebase Console ou en code :

```javascript
import { createAccount } from './firebase/auth';
import { setUserProfile } from './firebase/users';

// Créer le compte
const userCred = await createAccount('admin@hirrdé.com', 'motdepasse123');

// Créer le profil
await setUserProfile(userCred.user.uid, {
  email: 'admin@hirrdé.com',
  name: 'Admin Principal',
  role: 'admin'
});
```

### 3. Configurer Firebase Phone Auth

1. Va dans Firebase Console
2. **Authentication** > **Sign-in method**
3. Active **Phone** (Téléphone)
4. Ajoute tes domaines autorisés

### 4. Déployer les règles Firestore

Copie les règles depuis `AUTHENTICATION.md` et déploie-les dans Firebase Console :
- **Firestore Database** > **Rules**

### 5. Développer l'app mobile

Suis le guide dans `MOBILE_INTEGRATION.md` pour intégrer l'authentification dans ton app React Native.

## Structure des données

### Collection `users`

```javascript
// Admin
{
  uid: "abc123",
  email: "admin@example.com",
  name: "Admin Name",
  role: "admin",
  createdAt: timestamp
}

// Scanner
{
  id: "xyz789",
  phoneNumber: "+33612345678",
  name: "Scanner Name",
  role: "scanner",
  isActive: true,
  createdAt: timestamp
}
```

## Sécurité

✅ Les scanners ne peuvent pas créer leur propre compte
✅ Seuls les admins peuvent créer/modifier/supprimer des scanners
✅ Le numéro doit exister dans Firestore avant de pouvoir se connecter
✅ Les comptes peuvent être désactivés par les admins
✅ Vérification du rôle à chaque connexion

## Codes d'erreur

### Web (Admins)
- `ACCESS_DENIED_ADMIN` → Pas un compte admin
- `auth/invalid-credential` → Email/password incorrect

### Mobile (Scanners)
- `PHONE_NOT_REGISTERED` → Numéro non enregistré
- `ACCOUNT_DISABLED` → Compte désactivé
- `INVALID_CODE` → Code SMS incorrect

## Besoin d'aide ?

Consulte les fichiers de documentation :
- `AUTHENTICATION.md` - Documentation technique complète
- `MOBILE_INTEGRATION.md` - Guide d'intégration React Native
