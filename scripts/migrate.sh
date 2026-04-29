#!/usr/bin/env bash
# migrate.sh — runner idempotente para init-scripts/*.sql
#
# - Registra cada arquivo aplicado em schema_migrations(filename, sha256).
# - So aplica arquivos cujo nome ainda nao consta na tabela.
# - Se um arquivo ja registrado tiver SHA256 diferente, alerta (drift de
#   migration historica — problema serio que precisa de revisao manual).
#
# Uso:
#   ./scripts/migrate.sh                # aplica pendentes
#   ./scripts/migrate.sh --bootstrap    # marca todos os scripts atuais como
#                                       # ja aplicados (NAO executa). Use uma
#                                       # unica vez em um banco que ja foi
#                                       # populado fora deste runner.
#   ./scripts/migrate.sh --status       # so mostra estado, nao aplica nada

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
INIT_DIR="$PROJECT_DIR/init-scripts"
DB_CONTAINER="${DB_CONTAINER:-finance_db}"
MODE="${1:-apply}"

log()  { printf '\033[1;34m[migrate]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[migrate]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[migrate]\033[0m %s\n' "$*" >&2; }

PG_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER)"
PG_DB="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB)"

psql_exec() {
  docker exec -i "$DB_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 "$@"
}

# Variante sem -i para chamadas que NAO recebem dados via stdin
# (evita que `docker exec -i` consuma o stdin de loops `while read`).
psql_run() {
  docker exec "$DB_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 "$@"
}

ensure_table() {
  if [ -f "$INIT_DIR/14-schema-migrations.sql" ]; then
    psql_exec -q < "$INIT_DIR/14-schema-migrations.sql" >/dev/null
  else
    psql_run -q -c "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP);" >/dev/null
  fi
}

is_applied() {
  local f="$1"
  psql_run -t -A -c "SELECT sha256 FROM schema_migrations WHERE filename = '$f'" </dev/null
}

record() {
  local f="$1" sha="$2"
  psql_run -q -c "INSERT INTO schema_migrations (filename, sha256) VALUES ('$f', '$sha') ON CONFLICT (filename) DO NOTHING;" </dev/null >/dev/null
}

list_files() {
  ls -1 "$INIT_DIR"/*.sql 2>/dev/null | sort
}

ensure_table

case "$MODE" in
  --status)
    log "Estado das migrations:"
    printf '  %-40s %-12s %s\n' "arquivo" "estado" "sha256(local)"
    while IFS= read -r path; do
      f=$(basename "$path")
      sha=$(sha256sum "$path" | awk '{print $1}')
      recorded=$(is_applied "$f")
      if [ -z "$recorded" ]; then
        printf '  %-40s %-12s %s\n' "$f" "PENDENTE" "$sha"
      elif [ "$recorded" != "$sha" ]; then
        printf '  %-40s \033[1;33m%-12s\033[0m %s != %s\n' "$f" "DRIFT!" "$sha" "$recorded"
      else
        printf '  %-40s \033[1;32m%-12s\033[0m %s\n' "$f" "ok" "$sha"
      fi
    done < <(list_files)
    ;;

  --bootstrap)
    log "Bootstrap: marcando arquivos atuais como ja aplicados (sem executar)."
    while IFS= read -r path; do
      f=$(basename "$path")
      sha=$(sha256sum "$path" | awk '{print $1}')
      record "$f" "$sha"
      log "registrado: $f"
    done < <(list_files)
    log "Pronto. Daqui pra frente, ./scripts/migrate.sh so aplicara novos arquivos."
    ;;

  apply|"")
    APPLIED=0
    while IFS= read -r path; do
      f=$(basename "$path")
      sha=$(sha256sum "$path" | awk '{print $1}')
      recorded=$(is_applied "$f")
      if [ -z "$recorded" ]; then
        log "Aplicando $f..."
        if ! psql_exec < "$path"; then
          err "Falha ao aplicar $f. Abortando."
          exit 2
        fi
        record "$f" "$sha"
        APPLIED=$((APPLIED+1))
      elif [ "$recorded" != "$sha" ]; then
        warn "DRIFT em $f: SHA local difere do registrado. Revise manualmente."
      fi
    done < <(list_files)
    if [ "$APPLIED" -eq 0 ]; then
      log "Nenhuma migration pendente."
    else
      log "$APPLIED migration(s) aplicada(s)."
    fi
    ;;

  *)
    err "Modo desconhecido: $MODE. Use --status, --bootstrap ou (sem arg) para aplicar."
    exit 1
    ;;
esac
