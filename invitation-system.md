# Système d'Invitation - API Tontine

## Vue d'ensemble

Le système d'invitation permet aux présidents de tontine de créer des liens d'invitation pour inviter de nouveaux membres à rejoindre leur tontine. Les membres peuvent accepter ces invitations en créant un compte.

## Fonctionnalités

### 1. Création de liens d'invitation (Présidents uniquement)

**Endpoint:** `POST /api/tontine/:id/invitation`

**Permissions:** Seuls les présidents peuvent créer des liens d'invitation.

**Fonctionnalités:**
- Génération automatique d'un token unique
- Validation du nom d'utilisateur (pas déjà membre)
- Vérification des doublons (pas de lien actif existant)
- Expiration fixe de 1 jour
- Interface simplifiée (seul le username requis)

**Exemple de requête:**
```json
{
  "username": "jean_dupont"
}
```

**Réponse:**
```json
{
  "invitationLink": {
    "id": 1,
    "token": "abc123def456ghi789",
    "username": "jean_dupont",
    "firstName": null,
    "lastName": null,
    "phone": null,
    "status": "ACTIVE",
    "expiresAt": "2024-12-31T23:59:59Z"
  },
  "invitationUrl": "http://localhost:3000/invitation/abc123def456ghi789",
  "message": "Lien d'invitation créé avec succès"
}
```

### 2. Gestion des liens d'invitation

**Endpoints:**
- `GET /api/tontine/:id/invitation` - Voir tous les liens d'invitation
- `DELETE /api/tontine/:id/invitation/:invitationId` - Révoquer un lien

**Permissions:** Seuls les présidents peuvent gérer les liens d'invitation.

### 3. Acceptation d'invitation (Public)

**Endpoint:** `POST /api/invitation/accept`

**Permissions:** Aucune authentification requise.

**Fonctionnalités:**
- Validation du token d'invitation
- Vérification de l'expiration
- Création automatique du compte membre (sans email requis)
- Création automatique du compte utilisateur
- Ajout automatique à la tontine
- Marquage du lien comme utilisé

**Exemple de requête:**
```json
{
  "token": "abc123def456ghi789",
  "username": "jean_dupont",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+237 123 456 789"
}
```

**Réponse:**
```json
{
  "member": {
    "id": 1,
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": null,
    "username": "jean_dupont",
    "roles": ["TONTINARD"]
  },
  "message": "Invitation acceptée avec succès. Vous êtes maintenant membre de la tontine."
}
```

## États des liens d'invitation

- **ACTIVE**: Lien valide et utilisable
- **USED**: Lien utilisé (membre a rejoint)
- **EXPIRED**: Lien expiré
- **REVOKED**: Lien révoqué par le président

## Sécurité

### Validation des tokens
- Tokens uniques de 32 caractères
- Vérification de l'expiration
- Validation du statut (ACTIVE uniquement)

### Contrôle d'accès
- Seuls les présidents peuvent créer/gérer les invitations
- Vérification des doublons (username déjà membre)
- Validation des noms d'utilisateur uniques

### Gestion des erreurs
- Messages d'erreur explicites
- Codes de statut HTTP appropriés
- Validation des données d'entrée

## Workflow d'invitation

1. **Président crée un lien d'invitation**
   - Fournit uniquement le nom d'utilisateur du futur membre
   - Reçoit l'URL d'invitation

2. **Envoi de l'invitation**
   - Le président envoie l'URL au futur membre
   - L'URL contient le token unique

3. **Acceptation de l'invitation**
   - Le futur membre clique sur le lien
   - Il remplit ses informations de compte
   - Le système crée automatiquement le compte et l'ajoute à la tontine

4. **Finalisation**
   - Le lien est marqué comme utilisé
   - Le nouveau membre peut se connecter
   - Il a automatiquement le rôle TONTINARD

## Configuration

### Variables d'environnement
- `FRONTEND_URL`: URL du frontend pour les liens d'invitation (défaut: http://localhost:3000)

### Durée d'expiration
- 1 jour fixe pour tous les liens d'invitation
- Non configurable (simplification)

## Exemples d'utilisation

### Créer une invitation
```bash
curl -X POST http://localhost:3000/api/tontine/1/invitation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nouveau_membre"
  }'
```

### Accepter une invitation
```bash
curl -X POST http://localhost:3000/api/invitation/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456ghi789",
    "username": "nouveau_membre",
    "password": "motdepasse123"
  }'
```

## Intégration avec le système existant

- **Notifications**: Les invitations peuvent déclencher des notifications
- **Rôles**: Les nouveaux membres reçoivent automatiquement le rôle TONTINARD
- **Membres**: Intégration complète avec le système de gestion des membres (sans email requis)
- **Authentification**: Création automatique des comptes utilisateur
