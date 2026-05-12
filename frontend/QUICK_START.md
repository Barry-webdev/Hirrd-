# 🚀 Démarrage Rapide

## Tu as déjà créé des utilisateurs dans Firebase ?

### Étape 1 : Lance l'app
```bash
npm run dev
```

### Étape 2 : Va sur la page de migration
Ouvre ton navigateur et va sur :
```
http://localhost:5173/migrate-users
```

### Étape 3 : Récupère l'UID
1. Ouvre [Firebase Console](https://console.firebase.google.com)
2. Va dans **Authentication**
3. Clique sur ton utilisateur
4. Copie l'**UID**

### Étape 4 : Crée le profil
Sur la page `/migrate-users`, remplis :
- UID (celui que tu viens de copier)
- Nom complet
- Email (le même que dans Firebase Auth)
- Rôle : **admin**

Clique sur "Créer le profil Firestore"

### Étape 5 : Connecte-toi
Va sur `/login` et connecte-toi avec ton email/password. Ça devrait marcher ! 🎉

---

## Tu veux créer un nouvel utilisateur ?

### Option 1 : Via l'interface (recommandé)

1. Connecte-toi en tant qu'admin
2. Va sur `/users`
3. Clique sur "Nouvel utilisateur"
4. Remplis le formulaire
5. C'est fait ! Le compte Firebase Auth + le profil Firestore sont créés automatiquement

### Option 2 : Via le code

```javascript
import { createAccount } from './firebase/auth';
import { setUserProfile } from './firebase/users';

// Créer le compte
const cred = await createAccount('email@example.com', 'password123');

// Créer le profil
await setUserProfile(cred.user.uid, {
  nom: 'Nom Complet',
  email: 'email@example.com',
  role: 'admin' // ou 'scanner'
});
```

---

## Structure du projet

```
src/
├── firebase/
│   ├── auth.js          → Authentification (email/password pour admins)
│   ├── mobileAuth.js    → Authentification (SMS pour scanners)
│   ├── users.js         → Gestion des utilisateurs
│   └── config.js        → Configuration Firebase
├── pages/
│   ├── Login.jsx        → Connexion web (admins)
│   ├── MobileLogin.jsx  → Connexion mobile (scanners)
│   ├── Users.jsx        → Gestion des utilisateurs
│   ├── Scanners.jsx     → Gestion des scanners
│   └── MigrateUsers.jsx → Migration (temporaire)
└── utils/
    └── migrateUsers.js  → Script de migration (temporaire)
```

---

## Prochaines étapes

1. ✅ Migrer tes utilisateurs existants
2. ✅ Te connecter en tant qu'admin
3. 📱 Créer des scanners pour l'app mobile
4. 🔧 Configurer Firebase Phone Auth (voir `AUTHENTICATION.md`)
5. 📱 Développer l'app mobile (voir `MOBILE_INTEGRATION.md`)

---

## Besoin d'aide ?

- **Migration** → Lis `MIGRATION_GUIDE.md`
- **Authentification** → Lis `AUTHENTICATION.md`
- **App mobile** → Lis `MOBILE_INTEGRATION.md`
- **Résumé** → Lis `RESUME_AUTHENTIFICATION.md`
