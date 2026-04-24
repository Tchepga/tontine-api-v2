#!/usr/bin/env bash
# Exécute le seed SQL « Les Amicales 2026 » sur le serveur (MySQL).
#
# Usage :
#   sudo ./scripts/run-seed-test-tontine.sh
#   ENV_FILE=/chemin/vers/.env ./scripts/run-seed-test-tontine.sh
#   DROP_EXISTING=yes ./scripts/run-seed-test-tontine.sh   # supprime d’abord la tontine de test
#
# Variables optionnelles :
#   SQL_FILE   — chemin du .sql (défaut : scripts/sql/seed-test-tontine.sql)
#   ENV_FILE   — fichier .env avec DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
#              (défaut prod : /root/config/.env-tontine-api)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="${SQL_FILE:-$SCRIPT_DIR/sql/seed-test-tontine.sql}"
ENV_FILE="${ENV_FILE:-/root/config/.env-tontine-api}"
DROP_EXISTING="${DROP_EXISTING:-no}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Fichier SQL introuvable : $SQL_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fichier d’environnement introuvable : $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
read_env() {
  grep "^$1=" "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

DB_HOST="$(read_env DB_HOST)"
DB_PORT="$(read_env DB_PORT)"
DB_USER="$(read_env DB_USERNAME)"
DB_PASS="$(read_env DB_PASSWORD)"
DB_NAME="$(read_env DB_DATABASE)"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-tontine}"

if [[ -z "$DB_PASS" ]]; then
  echo "DB_PASSWORD manquant dans $ENV_FILE" >&2
  exit 1
fi

run_mysql() {
  # MYSQL_PWD évite -p sur la ligne de commande (avertissement « insecure »)
  MYSQL_PWD="$DB_PASS" mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" "$@"
}

echo "═══════════════════════════════════════════════════"
echo "  Seed — Les Amicales 2026"
echo "═══════════════════════════════════════════════════"
echo "Base : $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "SQL  : $SQL_FILE"

if [[ "$DROP_EXISTING" == "yes" || "$DROP_EXISTING" == "y" || "$DROP_EXISTING" == "true" ]]; then
  echo ""
  echo "Suppression de la tontine de test existante (titre = Les Amicales 2026)..."
  run_mysql <<'DROPSQL'
SET FOREIGN_KEY_CHECKS = 0;
DELETE po FROM part_order po
  JOIN config_tontine ct ON ct.id = po.configId
  JOIN tontine t ON t.configId = ct.id
  WHERE t.title = 'Les Amicales 2026';

DELETE d FROM deposit d
  JOIN cash_flow cf ON cf.id = d.cashFlowId
  JOIN tontine t ON t.cashFlowId = cf.id
  WHERE t.title = 'Les Amicales 2026';

DELETE mr FROM member_role mr
  JOIN tontine t ON t.id = mr.tontineId
  WHERE t.title = 'Les Amicales 2026';

DELETE FROM tontine_members_member
  WHERE tontineId IN (SELECT id FROM tontine WHERE title = 'Les Amicales 2026');

DELETE FROM tontine WHERE title = 'Les Amicales 2026';

DELETE ct FROM config_tontine ct
  WHERE NOT EXISTS (SELECT 1 FROM tontine t WHERE t.configId = ct.id);

DELETE cf FROM cash_flow cf
  WHERE NOT EXISTS (SELECT 1 FROM tontine t WHERE t.cashFlowId = cf.id);

SET FOREIGN_KEY_CHECKS = 1;
DROPSQL
  echo "OK — ancienne tontine supprimée (si elle existait)."
fi

echo ""
echo "Exécution du seed..."
run_mysql <"$SQL_FILE"

echo ""
echo "Terminé. Comptes (mot de passe : Tontine2026!) : ronaldo, patrick, steve, romeo, paola, ryan, albert"
