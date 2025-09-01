# 🚀 Guide de Déploiement - API Tontine avec Sentry

## 📋 Vue d'ensemble

Ce projet utilise maintenant **Sentry** pour le monitoring et **systemd** pour la gestion des services, remplaçant complètement PM2.

## 🔧 Configuration requise

### Variables d'environnement GitHub Secrets

```bash
# SSH et serveur
SSH_KEY_VPS_HOSTINGER=votre-clé-ssh-privée
HOST_VPS_HOSTINGER=ip-du-serveur
HOST_VPS_USER=utilisateur-ssh

# Sentry
SENTRY_DSN=votre-sentry-dsn
SENTRY_AUTH_TOKEN=votre-sentry-auth-token
SENTRY_ORG=votre-organisation-sentry
SENTRY_PROJECT=votre-projet-sentry
```

## 🚀 Déploiement automatique

### Déclenchement
- **Push** sur la branche `deploy`
- **Merge** d'une pull request vers `deploy`

### Étapes du déploiement

1. **✅ Vérification du code**
   - Linting avec ESLint
   - Tests avec Jest
   - Construction avec NestJS

2. **📊 Configuration Sentry**
   - Vérification des variables d'environnement
   - Configuration automatique sur le serveur

3. **🚀 Déploiement sur le serveur**
   - Création d'une archive de déploiement
   - Transfert SSH sécurisé
   - Installation et configuration du service systemd
   - Démarrage automatique

4. **🔍 Vérification**
   - Test de connectivité
   - Vérification du statut du service
   - Rollback automatique en cas d'échec

## 🛠️ Gestion des services

### Service systemd

Le service `tontine-api.service` est automatiquement installé et configuré :

```bash
# Statut du service
systemctl status tontine-api.service

# Logs en temps réel
journalctl -u tontine-api.service -f

# Redémarrage
systemctl restart tontine-api.service

# Arrêt
systemctl stop tontine-api.service
```

### Avantages vs PM2

| PM2 | systemd + Sentry |
|-----|------------------|
| Gestion des processus | ✅ | ✅ |
| Monitoring basique | ✅ | ❌ |
| Capture d'erreurs | ❌ | ✅ |
| Performance monitoring | ❌ | ✅ |
| Dashboard avancé | ❌ | ✅ |
| Intégration OS | ❌ | ✅ |
| Gestion des logs | ❌ | ✅ |

## 📊 Monitoring avec Sentry

### Fonctionnalités
- **Capture automatique des erreurs**
- **Performance monitoring**
- **Releases automatisées**
- **Source maps** pour le debugging
- **Alertes intelligentes**

### Dashboard
Consultez votre dashboard Sentry pour :
- Voir les erreurs en temps réel
- Analyser les performances
- Surveiller la santé de l'API
- Recevoir des notifications

## 🔍 Diagnostic et dépannage

### Commandes utiles

```bash
# Connexion SSH
ssh utilisateur@ip-serveur

# Accès à l'application
cd /root/apps/tontine

# Statut du service
systemctl status tontine-api.service

# Logs du service
journalctl -u tontine-api.service -f

# Test de connectivité
curl -v http://localhost:8080/health

# Vérification des processus
ps aux | grep "node dist/main.js"
```

### Fichiers importants

- **Logs** : `/root/apps/tontine/logs/app.log`
- **Service** : `/etc/systemd/system/tontine-api.service`
- **Configuration** : `/root/apps/tontine/.env`
- **Application** : `/root/apps/tontine/dist/main.js`

## 🚨 Gestion des erreurs

### Rollback automatique
En cas d'échec du déploiement :
1. L'ancienne version est automatiquement restaurée
2. Le service est redémarré
3. Les logs d'erreur sont affichés

### Logs d'erreur
- **Service** : `journalctl -u tontine-api.service`
- **Application** : `/root/apps/tontine/logs/app.log`
- **Sentry** : Dashboard en ligne

## 🔄 Mise à jour

### Déploiement manuel
```bash
# Sur le serveur
cd /root/apps/tontine
git pull origin deploy
npm ci --only=production
npm run build
systemctl restart tontine-api.service
```

### Variables d'environnement
Assurez-vous que `/root/config/.env-tontine-api` contient :
```bash
NODE_ENV=production
SENTRY_DSN=votre-dsn
SENTRY_ORG=votre-org
SENTRY_PROJECT=votre-projet
# ... autres variables
```

## 📈 Métriques et surveillance

### Sentry
- Erreurs en temps réel
- Performance des endpoints
- Utilisation des ressources
- Alertes automatiques

### Systemd
- Statut du service
- Logs système
- Redémarrages automatiques
- Gestion des signaux

## 🎯 Bonnes pratiques

1. **Toujours tester** sur une branche de développement
2. **Vérifier les variables** d'environnement avant déploiement
3. **Surveiller les logs** après déploiement
4. **Utiliser Sentry** pour le debugging en production
5. **Maintenir** les permissions SSH et les clés

---

**🚀 Votre API Tontine est maintenant prête pour la production avec un monitoring professionnel !**
