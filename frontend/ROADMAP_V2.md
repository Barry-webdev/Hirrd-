# Hirrdé - Roadmap Version 2.0

## 🎯 Vision
Transformer Hirrdé en une plateforme multi-tenant permettant à plusieurs organisateurs d'événements de gérer leurs propres événements, billets et équipes de scanners de manière indépendante.

---

## 🔐 Système de Rôles Multi-Tenant

### Rôles proposés

#### 1. **SuperAdmin** (Nouveau)
- **Accès** : Plateforme complète
- **Permissions** :
  - Créer, modifier, supprimer des organisateurs
  - Voir tous les événements de tous les organisateurs
  - Accéder aux statistiques globales de la plateforme
  - Gérer les paramètres système
  - Modération et support

#### 2. **Organizer** (Porteur d'événement) (Nouveau)
- **Accès** : Ses propres données uniquement
- **Permissions** :
  - Créer et gérer ses événements
  - Générer et gérer ses billets
  - Créer et gérer ses scanners
  - Voir ses statistiques et rapports
  - Configurer son profil organisateur

#### 3. **Scanner** (Existant - Modifié)
- **Accès** : Application mobile uniquement
- **Permissions** :
  - Scanner les billets de son organisateur
  - Voir les stats de l'événement assigné
- **Modification** : Lié à un `organizerId` spécifique

---

## 📊 Modifications de la Base de Données

### Collection `users`
```javascript
{
  id: "user123",
  email: "organizer@example.com",
  nom: "Jean Dupont",
  role: "organizer", // superAdmin | organizer | scanner
  organizerId: "org456", // null pour superAdmin, propre ID pour organizer, ID parent pour scanner
  phoneNumber: "+224626058033", // pour scanners
  isActive: true,
  createdAt: timestamp,
  
  // Nouveaux champs pour organizers
  companyName: "Events Pro", // Nom de la société
  logo: "https://...", // Logo de l'organisateur
  description: "Organisateur d'événements...",
  website: "https://eventspro.com",
  address: "Conakry, Guinée",
}
```

### Collection `events`
```javascript
{
  id: "event789",
  organizerId: "org456", // ID de l'organisateur propriétaire
  nom: "Concert Live",
  // ... autres champs existants
}
```

### Collection `tickets`
```javascript
{
  id: "ticket101",
  eventId: "event789",
  organizerId: "org456", // Dénormalisation pour filtrage rapide
  // ... autres champs existants
}
```

### Collection `scanners` (Optionnel - Alternative à users)
```javascript
{
  id: "scanner202",
  organizerId: "org456",
  eventAssigned: "event789",
  // ... autres champs existants
}
```

---

## 🏗️ Architecture Technique

### Règles de Sécurité Firestore
```javascript
// Exemple de règles pour events
match /events/{eventId} {
  allow read: if request.auth != null;
  allow create: if request.auth.token.role in ['superAdmin', 'organizer'];
  allow update, delete: if request.auth.token.role == 'superAdmin' 
    || (request.auth.token.role == 'organizer' 
        && resource.data.organizerId == request.auth.token.organizerId);
}
```

### Filtrage des Données
```javascript
// Exemple pour un organizer
const q = query(
  collection(db, 'events'),
  where('organizerId', '==', currentUser.organizerId)
);

// Exemple pour superAdmin (pas de filtre)
const q = collection(db, 'events');
```

---

## 🎨 Nouvelles Pages Web

### 1. **Dashboard SuperAdmin**
- Liste de tous les organisateurs
- Statistiques globales de la plateforme
- Nombre total d'événements, billets, scanners
- Graphiques d'activité par organisateur
- Gestion des organisateurs (CRUD)

### 2. **Page Organisateurs** (SuperAdmin)
- Tableau avec tous les organisateurs
- Filtres et recherche
- Actions : Créer, Modifier, Désactiver, Supprimer
- Voir les détails d'un organisateur

### 3. **Profil Organisateur** (Organizer)
- Modifier ses informations
- Logo, description, coordonnées
- Statistiques de ses événements
- Paramètres de compte

### 4. **Dashboard Organisateur** (Organizer)
- Statistiques de ses propres événements
- Ses billets, ses scanners
- Graphiques personnalisés

---

## 📱 Modifications Mobile

### Authentification Scanner
- Vérifier que le scanner appartient au bon organisateur
- Afficher le logo de l'organisateur dans l'app
- Filtrer les événements par `organizerId`

### Écran de Scan
- Vérifier que le billet appartient à un événement de l'organisateur
- Afficher le nom de l'organisateur

---

## 🔄 Migration v1 → v2

### Étapes de Migration
1. **Ajouter le champ `organizerId`** à toutes les collections
2. **Créer un organisateur par défaut** pour les données existantes
3. **Assigner tous les événements/billets existants** à cet organisateur
4. **Mettre à jour les règles Firestore**
5. **Ajouter les nouveaux rôles** dans Firebase Auth custom claims
6. **Créer les nouvelles pages** pour superAdmin et organizers

### Script de Migration
```javascript
// Pseudo-code
async function migrateToV2() {
  // 1. Créer un organisateur par défaut
  const defaultOrg = await createOrganizer({
    email: "admin@hirrde.com",
    companyName: "Hirrdé Admin",
    role: "organizer"
  });

  // 2. Mettre à jour tous les événements
  const events = await getDocs(collection(db, 'events'));
  for (const event of events.docs) {
    await updateDoc(event.ref, { organizerId: defaultOrg.id });
  }

  // 3. Mettre à jour tous les billets
  const tickets = await getDocs(collection(db, 'tickets'));
  for (const ticket of tickets.docs) {
    await updateDoc(ticket.ref, { organizerId: defaultOrg.id });
  }

  // 4. Mettre à jour tous les scanners
  const scanners = await getDocs(query(collection(db, 'users'), where('role', '==', 'scanner')));
  for (const scanner of scanners.docs) {
    await updateDoc(scanner.ref, { organizerId: defaultOrg.id });
  }
}
```

---

## 🚀 Fonctionnalités Additionnelles v2

### 1. **Tableau de Bord Comparatif** (SuperAdmin)
- Comparer les performances entre organisateurs
- Top organisateurs par nombre d'événements
- Top organisateurs par recettes

### 2. **Système de Facturation** (Optionnel)
- Abonnement mensuel par organisateur
- Commission sur les billets vendus
- Historique des paiements

### 3. **Branding Personnalisé**
- Chaque organisateur peut personnaliser :
  - Logo sur les billets imprimés
  - Couleurs de l'interface
  - Email de notification personnalisé

### 4. **Gestion d'Équipe** (Organizer)
- Inviter des membres d'équipe
- Rôles internes : admin, éditeur, lecteur
- Permissions granulaires

### 5. **API Publique**
- Permettre aux organisateurs d'intégrer Hirrdé dans leurs sites
- Endpoints pour créer des événements, générer des billets
- Webhooks pour les notifications

### 6. **Analytics Avancés**
- Taux de conversion par catégorie
- Heures de pointe de scan
- Analyse démographique (si données disponibles)
- Export des données en CSV/Excel

### 7. **Notifications**
- Email/SMS aux organisateurs lors d'événements importants
- Alertes en temps réel sur le dashboard
- Notifications push sur mobile

---

## 📋 Checklist de Développement

### Phase 1 : Architecture
- [ ] Définir le modèle de données complet
- [ ] Créer les règles de sécurité Firestore
- [ ] Mettre en place les custom claims Firebase Auth
- [ ] Créer le script de migration

### Phase 2 : Backend
- [ ] Ajouter les fonctions Cloud pour la gestion des organisateurs
- [ ] Implémenter les filtres par `organizerId`
- [ ] Mettre à jour les fonctions existantes

### Phase 3 : Frontend Web
- [ ] Créer le dashboard SuperAdmin
- [ ] Créer la page de gestion des organisateurs
- [ ] Adapter les pages existantes pour les organizers
- [ ] Créer la page de profil organisateur

### Phase 4 : Mobile
- [ ] Adapter l'authentification scanner
- [ ] Filtrer les événements par organisateur
- [ ] Afficher le branding de l'organisateur

### Phase 5 : Tests & Déploiement
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests de migration
- [ ] Déploiement progressif

---

## 💡 Idées Futures (v3+)

- **Marketplace d'événements** : Les utilisateurs peuvent découvrir et acheter des billets
- **Intégration paiement** : Orange Money, MTN Mobile Money, Visa/Mastercard
- **QR Code dynamique** : Rotation du QR code pour éviter les captures d'écran
- **Contrôle d'accès NFC** : Support des cartes NFC en plus des QR codes
- **Application Scanner iOS** : Version native iOS en plus d'Android
- **Mode hors ligne** : Scanner peut fonctionner sans connexion internet
- **Revente de billets** : Marketplace secondaire sécurisé
- **Programme de fidélité** : Points et récompenses pour les participants réguliers

---

## 📝 Notes Techniques

### Considérations de Performance
- Indexer `organizerId` dans Firestore pour des requêtes rapides
- Utiliser la pagination pour les listes d'organisateurs
- Cache côté client pour réduire les lectures Firestore

### Sécurité
- Validation stricte des `organizerId` côté serveur
- Audit logs pour les actions des superAdmins
- Rate limiting sur les API

### Scalabilité
- Architecture prête pour des milliers d'organisateurs
- Sharding possible si nécessaire
- CDN pour les assets statiques (logos, images)

---

## 🎯 Objectifs Business v2

1. **Acquisition** : Attirer 50+ organisateurs d'événements en Guinée
2. **Rétention** : Taux de satisfaction > 90%
3. **Revenus** : Modèle freemium ou commission sur billets
4. **Expansion** : Déploiement dans d'autres pays d'Afrique de l'Ouest

---

**Date de création** : 13 mai 2026  
**Statut** : Planification  
**Priorité** : Moyenne (après stabilisation v1)
