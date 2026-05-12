# 🔄 Guide de Migration des Utilisateurs

## Problème

Tu as créé des utilisateurs directement dans Firebase Authentication, mais ils n'ont pas de profil dans Firestore avec le champ `role`. Du coup, quand tu te connectes, l'app ne trouve pas le rôle et ça plante.

## Solution

J'ai créé une page de migration pour ajouter facilement les profils Firestore à tes utilisateurs existants.

## Étapes

### 1. Accède à la page de migration

Une fois connecté (même si ça plante après), va directement sur :
```
http://localhost:5173/migrate-users
```

Ou tape l'URL manuellement dans ton navigateur.

### 2. Récupère l'UID de ton utilisateur

1. Va dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionne ton projet **hirrde-pass**
3. Clique sur **Authentication** dans le menu
4. Tu verras la liste de tes utilisateurs
5. Clique sur un utilisateur
6. Copie l'**UID** (User UID) - c'est une longue chaîne comme `abc123xyz789...`

### 3. Remplis le formulaire

Sur la page `/migrate-users`, remplis :
- **UID Firebase Auth** : Colle l'UID que tu viens de copier
- **Nom complet** : Le nom de l'utilisateur (ex: "Admin Principal")
- **Email** : L'email de l'utilisateur (doit correspondre à celui dans Firebase Auth)
- **Rôle** : Choisis `admin` ou `scanner`

### 4. Clique sur "Créer le profil Firestore"

Si tout se passe bien, tu verras un message de succès ✅

### 5. Répète pour chaque utilisateur

Si tu as plusieurs utilisateurs, répète les étapes 2-4 pour chacun.

### 6. Teste la connexion

Maintenant, déconnecte-toi et reconnecte-toi avec ton email/password. Ça devrait fonctionner !

## Exemple concret

Imaginons que tu as créé un utilisateur avec :
- Email : `admin@hirrdé.com`
- Password : `monmotdepasse`
- UID : `xK9mP2nQ7rS8tU1vW3xY4zA5`

Tu vas sur `/migrate-users` et tu remplis :
```
UID Firebase Auth : xK9mP2nQ7rS8tU1vW3xY4zA5
Nom complet       : Admin Principal
Email             : admin@hirrdé.com
Rôle              : admin
```

Clique sur "Créer le profil Firestore" et c'est bon !

## Vérification

Pour vérifier que ça a marché :

1. Va dans Firebase Console
2. Clique sur **Firestore Database**
3. Ouvre la collection `users`
4. Tu devrais voir un document avec l'UID comme ID
5. Le document doit contenir : `nom`, `email`, `role`, `createdAt`

## Après la migration

Une fois tous tes utilisateurs migrés :

1. Tu peux supprimer la page de migration :
   - `src/pages/MigrateUsers.jsx`
   - `src/utils/migrateUsers.js`
   - La route dans `src/App.jsx`

2. Pour créer de nouveaux utilisateurs, utilise la page **Utilisateurs** (`/users`) qui crée automatiquement le compte Firebase Auth + le profil Firestore.

## Problèmes courants

### "Erreur : Le nom et l'email sont requis"
→ Vérifie que tu as bien rempli tous les champs

### "Erreur : Permission denied"
→ Vérifie tes règles Firestore (voir `AUTHENTICATION.md`)

### "Je ne peux pas accéder à /migrate-users"
→ Tape l'URL directement dans ton navigateur, même si tu es déconnecté après le login

### "L'UID n'existe pas"
→ Vérifie que tu as bien copié l'UID complet depuis Firebase Console

## Besoin d'aide ?

Si ça ne marche toujours pas, vérifie :
1. Que Firebase est bien configuré (`src/firebase/config.js`)
2. Que les règles Firestore permettent l'écriture (voir `AUTHENTICATION.md`)
3. Que tu es bien connecté à Internet
4. La console du navigateur (F12) pour voir les erreurs
