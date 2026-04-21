# Test des endpoints de réinitialisation de mot de passe

## Endpoints implémentés

### 1. Demander une réinitialisation de mot de passe
**POST** `/api/auth/forgot-password`

**Body:**
```json
{
  "usernameOrEmail": "nom_utilisateur"
}
```

**Réponse:**
```json
{
  "message": "Token de réinitialisation généré. En production, un email serait envoyé.",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Réinitialiser le mot de passe
**POST** `/api/auth/reset-password`

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "nouveauMotDePasse123"
}
```

**Réponse:**
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

## Flux de réinitialisation

1. **L'utilisateur oublie son mot de passe**
2. **Il fait une demande de réinitialisation** via `/api/auth/forgot-password`
3. **Le système génère un token JWT** valide 1 heure
4. **En production, un email serait envoyé** avec un lien contenant le token
5. **L'utilisateur utilise le token** pour réinitialiser son mot de passe via `/api/auth/reset-password`

## Sécurité

- ✅ **Token JWT sécurisé** avec expiration (1 heure)
- ✅ **Type de token spécifique** (`password_reset`) pour éviter la confusion
- ✅ **Validation du token** avant réinitialisation
- ✅ **Hachage du nouveau mot de passe** avec bcrypt
- ✅ **Gestion des erreurs** (token expiré, invalide, utilisateur non trouvé)

## Documentation Swagger

Les endpoints sont entièrement documentés dans Swagger avec :
- Descriptions détaillées
- Exemples de requêtes/réponses
- Codes d'erreur possibles
- Validation des données
