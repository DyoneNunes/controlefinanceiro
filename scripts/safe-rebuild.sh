#!/usr/bin/env bash
#
# safe-rebuild.sh — sincroniza com o git e sobe a aplicacao sem perder dados do Postgres.
#
# Fluxo:
#   1. git fetch e compara HEAD local com remoto.
#   2. Se tiver atualizacao: backup do banco, git pull (merge), rebuild + up.
#   3. Se NAO tiver atualizacao: so garante que os containers estao de pe (up -d).
#
# O volume nomeado `postgres_data` so e apagado com `down -v` ou `volume rm`.
# Este script NUNCA usa essas flags. Como protecao extra, faz `pg_dump` antes
# de qualquer rebuild.
#
# Uso:
#   ./scripts/safe-rebuild.sh               # sync + rebuild condicional
#   ./scripts/safe-rebuild.sh frontend      # limita o rebuild ao frontend
#   ./scripts/safe-rebuild.sh backend       # limita o rebuild ao backend
#   FORCE_BUILD=1 ./scripts/safe-rebuild.sh # rebuilda mesmo sem atualizacao
#   NO_BACKUP=1   ./scripts/safe-rebuild.sh # pula o backup (nao recomendado)
#   NO_CACHE=1    ./scripts/safe-rebuild.sh # build sem cache
#   NO_PULL=1     ./scripts/safe-rebuild.sh # nao mexe no git, so sobe/builda

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

SERVICES=("$@")
if [ ${#SERVICES[@]} -eq 0 ]; then
  SERVICES=(frontend backend)
fi

BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

log()  { printf '\033[1;34m[safe-rebuild]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[safe-rebuild]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[safe-rebuild]\033[0m %s\n' "$*" >&2; }

backup_db() {
  if [ "${NO_BACKUP:-0}" = "1" ]; then
    warn "NO_BACKUP=1 — pulando backup."
    return
  fi
  if ! docker compose ps --services --status running | grep -qx db; then
    warn "Container 'db' nao esta rodando — subindo antes do backup."
    docker compose up -d db
    for _ in $(seq 1 30); do
      if docker compose ps db --format '{{.Health}}' 2>/dev/null | grep -q healthy; then break; fi
      sleep 2
    done
  fi
  mkdir -p "$BACKUP_DIR"
  # shellcheck disable=SC1091
  set -a; . ./server/.env; set +a
  log "Backup do banco em $BACKUP_FILE"
  docker compose exec -T db \
    pg_dump -U "${POSTGRES_USER:?POSTGRES_USER nao definido}" \
            -d "${POSTGRES_DB:?POSTGRES_DB nao definido}" \
    | gzip > "$BACKUP_FILE"
  log "Backup concluido ($(du -h "$BACKUP_FILE" | cut -f1))"
}

rebuild_and_up() {
  backup_db
  local build_args=()
  if [ "${NO_CACHE:-0}" = "1" ]; then build_args+=(--no-cache); fi
  log "docker compose build ${build_args[*]-} ${SERVICES[*]}"
  docker compose build "${build_args[@]}" "${SERVICES[@]}"
  log "docker compose up -d ${SERVICES[*]}"
  docker compose up -d "${SERVICES[@]}"
  log "docker compose up -d db redis (garante que continuam ativos)"
  docker compose up -d db redis
}

just_up() {
  log "Sem mudancas — so garantindo que a stack esta de pe."
  docker compose up -d
}

# -----------------------------------------------------------------------------
# 1) Sincroniza com o git
# -----------------------------------------------------------------------------
HAS_UPDATES=0

if [ "${NO_PULL:-0}" = "1" ]; then
  warn "NO_PULL=1 — pulando sync com o git."
elif [ ! -d .git ]; then
  warn "Nao e um repo git — pulando sync."
else
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  log "Branch atual: $BRANCH. Rodando git fetch..."
  git fetch --prune origin "$BRANCH"

  LOCAL="$(git rev-parse HEAD)"
  REMOTE="$(git rev-parse "origin/$BRANCH")"
  BASE="$(git merge-base HEAD "origin/$BRANCH")"

  if [ "$LOCAL" = "$REMOTE" ]; then
    log "Ja esta atualizado com origin/$BRANCH."
  elif [ "$LOCAL" = "$BASE" ]; then
    log "Ha atualizacoes em origin/$BRANCH — fazendo merge."
    if ! git -c pull.rebase=false pull --no-edit origin "$BRANCH"; then
      err "Conflito no git pull. Resolva manualmente e rode de novo."
      exit 1
    fi
    HAS_UPDATES=1
  elif [ "$REMOTE" = "$BASE" ]; then
    warn "Local esta a frente do remoto (commits nao enviados). Nenhum pull necessario."
  else
    log "Branches divergiram — tentando merge de origin/$BRANCH."
    if ! git -c pull.rebase=false pull --no-edit origin "$BRANCH"; then
      err "Conflito no merge. Resolva manualmente e rode de novo."
      exit 1
    fi
    HAS_UPDATES=1
  fi
fi

# -----------------------------------------------------------------------------
# 2) Decide: rebuild ou so up
# -----------------------------------------------------------------------------
if [ "${FORCE_BUILD:-0}" = "1" ] || [ "$HAS_UPDATES" = "1" ]; then
  rebuild_and_up
else
  just_up
fi

log "Pronto. Volume 'postgres_data' preservado."
docker compose ps
