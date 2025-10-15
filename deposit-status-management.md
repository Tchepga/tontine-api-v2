# Gestion des statuts de dépôts

## Vue d'ensemble

Le système de gestion des dépôts permet de contrôler le statut des dépôts avec des restrictions de rôles appropriées.

## Statuts disponibles

- **PENDING** : Dépôt en attente de validation
- **APPROVED** : Dépôt approuvé et validé
- **REJECTED** : Dépôt rejeté

## Rôles et permissions

### Création de dépôts
- **TONTINARD** : Peut créer des dépôts (statut PENDING par défaut)
- **PRESIDENT** : Peut créer des dépôts (statut APPROVED automatiquement)
- **ACCOUNT_MANAGER** : Peut créer des dépôts (statut APPROVED automatiquement)

### Modification des statuts
- **PRESIDENT** : Peut modifier le statut de tous les dépôts
- **ACCOUNT_MANAGER** : Peut modifier le statut de tous les dépôts
- **TONTINARD** : Ne peut pas modifier les statuts

## Endpoints disponibles

### 1. Créer un dépôt
**POST** `/api/tontine/:id/deposit`

**Body:**
```json
{
  "amount": 50000,
  "currency": "FCFA",
  "memberId": 1,
  "cashFlowId": 1,
  "reasons": "Cotisation mensuelle de janvier"
}
```

**Réponse:**
```json
{
  "id": 1,
  "amount": 50000,
  "status": "PENDING",
  "creationDate": "2024-01-15T10:00:00Z",
  "author": { "id": 1, "firstName": "Jean", "lastName": "Dupont" }
}
```

### 2. Récupérer tous les dépôts d'une tontine
**GET** `/api/tontine/:id/deposit`

**Réponse:**
```json
[
  {
    "id": 1,
    "amount": 50000,
    "status": "PENDING",
    "creationDate": "2024-01-15T10:00:00Z",
    "author": { "id": 1, "firstName": "Jean", "lastName": "Dupont" }
  }
]
```

### 3. Modifier le statut d'un dépôt (PRESIDENT/ACCOUNT_MANAGER uniquement)
**PATCH** `/api/tontine/:id/deposit/:depositId/status`

**Body:**
```json
{
  "status": "APPROVED",
  "reason": "Dépôt validé après vérification des documents"
}
```

**Réponse:**
```json
{
  "deposit": {
    "id": 1,
    "amount": 50000,
    "status": "APPROVED",
    "reasons": "Dépôt validé après vérification des documents"
  },
  "message": "Statut du dépôt mis à jour de PENDING à APPROVED"
}
```

## Flux de validation

1. **Un membre (TONTINARD) crée un dépôt**
   - Statut initial : PENDING
   - Notification créée

2. **Un président ou gestionnaire de compte valide le dépôt**
   - Statut changé vers : APPROVED ou REJECTED
   - Raison du changement enregistrée
   - Notification de mise à jour créée

3. **Le membre est informé du changement de statut**
   - Via les notifications
   - Le statut est visible dans la liste des dépôts

## Sécurité

- ✅ **Contrôle d'accès basé sur les rôles**
- ✅ **Validation des permissions** avant modification
- ✅ **Vérification de l'appartenance** du dépôt à la tontine
- ✅ **Notifications automatiques** pour tous les changements
- ✅ **Traçabilité** des modifications avec raisons

## Documentation Swagger

Tous les endpoints sont entièrement documentés dans Swagger avec :
- Descriptions détaillées
- Exemples de requêtes/réponses
- Codes d'erreur possibles
- Validation des données
- Restrictions de rôles

**URL Swagger :** `http://localhost:3000/api/docs`
