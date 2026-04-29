-- ============================================================================
-- Migration 14: tabela de tracking de schema migrations
-- ============================================================================
-- Resolve a falha que causou os 500 em /api/bills, /api/incomes etc.:
-- o Postgres so executa init-scripts/*.sql na PRIMEIRA inicializacao do
-- volume postgres_data. Migrations adicionadas depois eram silenciosamente
-- ignoradas. A partir daqui, scripts/migrate.sh gerencia migrations
-- idempotentemente em qualquer boot.

CREATE TABLE IF NOT EXISTS schema_migrations (
    filename     TEXT PRIMARY KEY,
    sha256       TEXT NOT NULL,
    applied_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at
    ON schema_migrations (applied_at DESC);
