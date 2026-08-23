# Runbook production — API Tontine v2

Guide opérationnel pour l’API NestJS déployée sur VPS Hostinger (`api.tontine.devcoorp.net`).

## Architecture

- **Reverse proxy** : Caddy (HTTPS) → instances NestJS
- **Instances** : `tontine-api@8081` (primaire), `tontine-api@8082` (secours)
- **Deploy** : GitHub Actions `deploy_prod.yml` sur push `master`
- **Config** : `~/config/.env-tontine-api` → `/root/apps/tontine/.env`

## Variables d’environnement obligatoires

```env
NODE_ENV=production
JWT_SECRET=<secret fort, 32+ caractères>
DB_SYNCHRONIZE=false
DB_HOST=...
DB_PORT=3306
DB_USERNAME=...
DB_PASSWORD=...
DB_DATABASE=...
SENTRY_DSN=https://...@....ingest.sentry.io/...
CORS_ORIGINS=https://devcoorp.net
RESEND_API_KEY=...   # optionnel, pour reset password / emails
```

> **Ne jamais** mettre `DB_SYNCHRONIZE=true` en production. Le boot crash volontairement si c’est le cas.

## Déploiement

1. Merge sur `master` → CI (`ci.yml`) : tests + build
2. `deploy_prod.yml` : SSH VPS → `git pull` → `npm ci --omit=dev` → `npm run build`
3. **Migrations** : `NODE_ENV=production npm run migration:run:prod`
4. Rolling restart : 8082 puis 8081
5. Health check : `https://api.tontine.devcoorp.net/api/health`

## Migrations base de données

```bash
# Sur le VPS, dans /root/apps/tontine
NODE_ENV=production npm run migration:run:prod

# Revenir en arrière (urgence)
NODE_ENV=production npm run migration:revert:prod
```

Migrations versionnées dans `src/database/migrations/`.

## Rollback

1. Sur le VPS : `git checkout <commit-précédent>`
2. `npm ci --omit=dev && npm run build`
3. Si migration incompatible : `npm run migration:revert:prod` (une migration)
4. `systemctl restart tontine-api@8082 && systemctl restart tontine-api@8081`
5. Vérifier health check

## Backup MySQL

```bash
# Exemple cron quotidien (adapter credentials)
mysqldump -u USER -p DATABASE > /backup/tontine-$(date +%Y%m%d).sql
```

Conserver au minimum 7 jours de backups. Tester une restauration avant le lancement prod.

## Rotation secrets

| Secret | Fréquence | Procédure |
|---|---|---|
| `JWT_SECRET` | 6–12 mois | Générer nouveau secret, déployer, tous les users reconnectés |
| `DB_PASSWORD` | Annuel | Changer MySQL + `.env` + restart |
| `SENTRY_DSN` | Si compromis | Régénérer dans Sentry dashboard |

## Monitoring

- **Sentry** : erreurs 5xx et exceptions non gérées (`SENTRY_DSN`)
- **Logs systemd** : `journalctl -u tontine-api@8081 -f`
- **Fichiers logs** : `/root/apps/tontine/logs/app-8081.log`
- **Health** : `GET /api/health` (public)

## Incidents courants

| Symptôme | Cause probable | Action |
|---|---|---|
| 502 après deploy | Instance pas démarrée | `systemctl status tontine-api@8081`, logs |
| 403 sur toutes les routes | Header `tontine-id` manquant (mobile) | Vérifier version app |
| Migration échoue | Schéma drift | Comparer `SHOW CREATE TABLE` vs migration |
| WebSocket déconnecté | Token expiré | Reconnexion avec `?token=<JWT>` |

## Sécurité — décisions produit

- **`POST /api/auth/register`** : reste **public** pour l’instant (inscription tontinard). Pour prod stricte, désactiver via feature flag ou retirer `@Public()` et n’autoriser que l’invitation par le président.
- **Mot de passe par défaut** : les nouveaux membres créés par le président reçoivent un mot de passe temporaire avec `mustChangePassword=true` (si implémenté côté member.service).
- **Rate limiting** : login limité à 5 req/min par IP.

## Environnement staging (recommandé)

Créer une instance API séparée (ex. `api-staging.tontine.devcoorp.net`) avec base MySQL dédiée. Mettre à jour `assets/env/.env.staging` côté mobile pour pointer vers cette URL — **ne pas tester sur l’API prod**.
