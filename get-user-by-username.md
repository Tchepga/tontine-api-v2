# Récupération d'utilisateur par nom d'utilisateur

## Vue d'ensemble

L'endpoint `GET /api/auth/username/:username` permet de récupérer les informations d'un utilisateur à partir de son nom d'utilisateur, sans avoir besoin du mot de passe.

## Endpoint

**URL:** `GET /api/auth/username/:username`

**Description:** Récupère les informations d'un utilisateur par son nom d'utilisateur (sans le mot de passe)

## Paramètres

- **username** (string, requis) : Le nom d'utilisateur à rechercher

## Réponses

### Succès (200)
```json
{
  "username": "john_doe",
  "roles": ["TONTINARD"]
}
```

### Erreur (404)
```json
{
  "statusCode": 404,
  "message": "Utilisateur non trouvé"
}
```

## Exemples d'utilisation

### Récupérer un utilisateur
```bash
curl -X GET http://localhost:3000/api/auth/username/john_doe
```

### Réponse pour un utilisateur trouvé
```json
{
  "username": "john_doe",
  "roles": ["TONTINARD"]
}
```

### Réponse pour un utilisateur non trouvé
```json
{
  "statusCode": 404,
  "message": "Utilisateur non trouvé"
}
```

## Sécurité

- ✅ Le mot de passe n'est jamais retourné dans la réponse
- ✅ Seuls les champs `username` et `roles` sont exposés
- ✅ Gestion d'erreur appropriée si l'utilisateur n'existe pas

## Cas d'usage

1. **Vérification d'existence d'utilisateur** : Vérifier si un nom d'utilisateur existe déjà
2. **Récupération de rôles** : Obtenir les rôles d'un utilisateur spécifique
3. **Validation de données** : Vérifier la validité d'un nom d'utilisateur avant création d'invitation
4. **Interface utilisateur** : Afficher les informations d'un utilisateur sans authentification

## Intégration avec le système d'invitation

Cet endpoint est particulièrement utile pour le système d'invitation :

```javascript
// Vérifier si un utilisateur existe avant de créer une invitation
const checkUser = async (username) => {
  try {
    const response = await fetch(`/api/auth/username/${username}`);
    if (response.ok) {
      const user = await response.json();
      console.log(`Utilisateur trouvé: ${user.username} avec rôles: ${user.roles}`);
      return true;
    }
  } catch (error) {
    console.log('Utilisateur non trouvé');
    return false;
  }
};
```
