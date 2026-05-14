# Guide des Rôles - Hirrdé

## 🎭 Les 3 Rôles du Système

### 1. **Admin** (Administrateur)
**Accès complet** - Gère tout le système

#### Pages accessibles :
- ✅ Tableau de bord
- ✅ Événements (création, modification, suppression)
- ✅ Billets (vue globale)
- ✅ Rapports (tous les événements)
- ✅ Utilisateurs (création admin/scanner/propriétaire)
- ✅ Paramètres

#### Responsabilités :
- Créer les événements
- Générer les billets
- Créer les comptes utilisateurs (scanners et propriétaires)
- Assigner les événements aux propriétaires
- Consulter tous les rapports

---

### 2. **Owner** (Propriétaire d'événement)
**Vue limitée** - Voit uniquement ses événements

#### Pages accessibles :
- ✅ Mon événement (dashboard propriétaire)
- ✅ Paramètres

#### Ce qu'il voit :
- **Statistiques en temps réel** de son/ses événement(s)
- **Nombre total de billets** générés
- **Billets par catégorie** (normal, prévente, VIP, VVIP)
- **Nombre de billets scannés** (global et par catégorie)
- **Montants générés** (global et par catégorie)
- **Taux de scan** (pourcentage d'entrées)
- **Recettes collectées vs potentiel**

#### Limitations :
- ❌ Ne peut PAS créer d'événements
- ❌ Ne peut PAS générer de billets
- ❌ Ne peut PAS voir les autres événements
- ❌ Ne peut PAS gérer les utilisateurs
- ✅ Consultation uniquement (lecture seule)

---

### 3. **Scanner**
**Scan mobile uniquement** - Contrôle d'accès à l'entrée

#### Pages accessibles :
- ✅ Paramètres (web)
- ✅ Scanner (application mobile uniquement)

#### Responsabilités :
- Scanner les QR codes des billets à l'entrée
- Valider l'accès des participants
- Utilise l'application mobile dédiée

#### Limitations :
- ❌ Aucun accès aux pages web (sauf paramètres)
- ✅ Ne voit que l'événement qui lui est assigné
- ✅ Scan via application mobile uniquement

---

## 📱 Workflow Complet

### Étape 1 : Préparation (Admin)
1. Admin crée un événement
2. Admin génère les billets (par catégorie)
3. Admin crée un compte **propriétaire**
4. Admin assigne l'événement au propriétaire
5. Admin crée des comptes **scanners**
6. Admin assigne l'événement aux scanners

### Étape 2 : Suivi (Propriétaire)
1. Propriétaire se connecte sur le web
2. Accède à "Mon événement"
3. Voit les stats en temps réel :
   - Billets générés
   - Billets scannés
   - Montants collectés
   - Détail par catégorie

### Étape 3 : Contrôle d'accès (Scanner)
1. Scanner se connecte sur l'app mobile
2. Voit uniquement son événement assigné
3. Scanne les QR codes à l'entrée
4. Valide ou refuse l'accès

### Étape 4 : Mise à jour automatique
- Chaque scan met à jour les stats en temps réel
- Le propriétaire voit immédiatement les changements
- L'admin peut consulter les rapports détaillés

---

## 🔐 Sécurité et Permissions

### Règles de sécurité Firebase (à configurer) :
```javascript
// Propriétaires : lecture seule de leurs événements
match /events/{eventId} {
  allow read: if request.auth.uid in resource.data.ownersIds;
}

// Scanners : lecture des tickets de leur événement assigné
match /tickets/{ticketId} {
  allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.eventAssigned == resource.data.eventId;
}
```

---

## 🎯 Avantages du Système

### Pour l'Admin :
- Contrôle total
- Vue d'ensemble de tous les événements
- Gestion centralisée

### Pour le Propriétaire :
- Transparence totale
- Suivi en temps réel
- Pas besoin de demander des rapports
- Voit exactement combien il gagne

### Pour le Scanner :
- Interface simple
- Uniquement son événement
- Pas de confusion possible
- App mobile optimisée

---

## 📊 Données Visibles par le Propriétaire

### Vue Globale :
- Total billets émis
- Total billets scannés
- Total non utilisés
- Recettes collectées (GNF)
- Taux de scan (%)

### Par Catégorie :
| Catégorie | Prix | Total | Scannés | Restants | Taux | Recettes |
|-----------|------|-------|---------|----------|------|----------|
| NORMAL    | 50k  | 100   | 75      | 25       | 75%  | 3,750k   |
| PRÉVENTE  | 40k  | 50    | 48      | 2        | 96%  | 1,920k   |
| VIP       | 100k | 20    | 18      | 2        | 90%  | 1,800k   |
| VVIP      | 200k | 10    | 10      | 0        | 100% | 2,000k   |
| **TOTAL** |      | 180   | 151     | 29       | 84%  | 9,470k   |

---

## 🚀 Prochaines Étapes

1. ✅ Système de rôles implémenté
2. ✅ Page propriétaire créée
3. ✅ Navigation adaptée par rôle
4. ⏳ Configurer les règles de sécurité Firebase
5. ⏳ Tester avec des comptes propriétaires réels
6. ⏳ Intégration avec l'app mobile pour les scanners

---

## 📝 Notes Importantes

- Les **propriétaires** ne peuvent PAS modifier les données
- Toutes les stats sont en **temps réel** (Firebase Realtime)
- Les **scanners** utilisent uniquement l'app mobile
- L'**admin** reste le seul à pouvoir créer/modifier/supprimer
