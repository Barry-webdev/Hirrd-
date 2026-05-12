# 📱 Création de Scanners

## Deux façons de créer un scanner

### Option 1 : Via la page Utilisateurs (Recommandé)

Cette méthode crée un compte Firebase Auth complet avec email/password + profil Firestore.

**Avantages :**
- Le scanner peut se connecter via SMS sur mobile
- Le scanner peut aussi se connecter via email/password si besoin
- Gestion complète du compte

**Comment faire :**

1. Connecte-toi en tant qu'admin
2. Va sur `/users`
3. Clique sur "Nouvel utilisateur"
4. Remplis le formulaire :
   - **Nom complet** : Nom du scanner
   - **Email** : Email du scanner (pour Firebase Auth)
   - **Mot de passe** : Mot de passe (6 caractères min)
   - **Rôle** : Sélectionne "Scanner"
   - **Numéro de téléphone** : Format international (ex: +33612345678) ⭐ **OBLIGATOIRE**
   - **Événement assigné** : Optionnel
5. Clique sur "Créer"

**Structure créée :**
```javascript
// Firebase Auth
{
  uid: "abc123",
  email: "scanner@example.com",
  phoneNumber: null // Pas lié au phone auth
}

// Firestore users/abc123
{
  nom: "Jean Dupont",
  email: "scanner@example.com",
  phoneNumber: "+33612345678", // ⭐ Utilisé pour la connexion SMS
  role: "scanner",
  eventAssigned: "event-id",
  createdAt: timestamp
}
```

### Option 2 : Via la page Scanners

Cette méthode crée uniquement un profil Firestore (pas de compte Firebase Auth).

**Avantages :**
- Plus simple et rapide
- Pas besoin d'email/password
- Uniquement pour la connexion SMS

**Comment faire :**

1. Connecte-toi en tant qu'admin
2. Va sur `/scanners`
3. Clique sur "Nouveau scanner"
4. Remplis le formulaire :
   - **Nom complet** : Nom du scanner
   - **Numéro de téléphone** : Format international (ex: +33612345678)
5. Clique sur "Créer"

**Structure créée :**
```javascript
// Firestore users/xyz789 (pas de compte Firebase Auth)
{
  id: "xyz789",
  nom: "Marie Martin",
  phoneNumber: "+33612345678",
  role: "scanner",
  isActive: true,
  createdAt: timestamp
}
```

## Quelle option choisir ?

### Utilise Option 1 (Users) si :
- ✅ Tu veux que le scanner puisse se connecter via email/password aussi
- ✅ Tu veux une gestion complète du compte
- ✅ Tu veux pouvoir réinitialiser le mot de passe via Firebase

### Utilise Option 2 (Scanners) si :
- ✅ Tu veux uniquement la connexion SMS
- ✅ Tu veux créer rapidement plusieurs scanners
- ✅ Tu ne veux pas gérer d'emails/passwords

## Connexion mobile

Peu importe l'option choisie, le scanner se connecte de la même façon sur mobile :

1. Il entre son numéro de téléphone
2. L'app vérifie si le numéro existe dans Firestore (champ `phoneNumber`)
3. Si oui, Firebase envoie un code SMS
4. Il entre le code et se connecte

## Gestion des scanners

### Activer/Désactiver (Option 2 uniquement)

Sur la page `/scanners`, tu peux activer/désactiver un scanner.
Un scanner désactivé ne peut pas se connecter.

### Modifier

Sur la page `/users`, tu peux modifier :
- Le nom
- Le numéro de téléphone
- L'événement assigné

### Supprimer

**Option 1 (Users)** : Supprime le profil Firestore, mais le compte Firebase Auth reste (supprime-le manuellement dans Firebase Console si besoin)

**Option 2 (Scanners)** : Supprime complètement le profil Firestore

## Validation du numéro

Le numéro de téléphone doit :
- ✅ Commencer par `+` (format international)
- ✅ Être unique (pas de doublons)
- ✅ Être valide pour Firebase Phone Auth

**Exemples valides :**
- `+33612345678` (France)
- `+1234567890` (USA)
- `+221771234567` (Sénégal)

**Exemples invalides :**
- `0612345678` (pas de +)
- `33612345678` (pas de +)
- `+33 6 12 34 56 78` (espaces)

## Vérification avant connexion

Quand un scanner tente de se connecter :

1. ✅ L'app vérifie que le numéro existe dans Firestore
2. ✅ L'app vérifie que le rôle est "scanner"
3. ✅ L'app vérifie que le compte est actif (si le champ `isActive` existe)
4. ✅ Si tout est OK, Firebase envoie le code SMS
5. ❌ Sinon, affiche une erreur

## Erreurs courantes

### "Ce numéro n'est pas enregistré"
→ Le numéro n'existe pas dans Firestore ou le rôle n'est pas "scanner"

### "Le numéro doit être au format international"
→ Le numéro ne commence pas par `+`

### "Ce numéro de téléphone est déjà enregistré"
→ Un autre scanner utilise déjà ce numéro

### "Ton compte a été désactivé"
→ Le scanner a été désactivé par un admin (Option 2 uniquement)

## Recommandation

Pour la plupart des cas, utilise **Option 1 (Users)** car elle offre plus de flexibilité et une meilleure gestion des comptes.

Utilise **Option 2 (Scanners)** uniquement si tu veux vraiment simplifier au maximum et n'avoir que la connexion SMS.
