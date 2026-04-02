-- ============================================================================
-- Migração E2EE: Criptografia de Ponta-a-Ponta
-- ============================================================================
--
-- Esta migração adiciona suporte a armazenamento de dados criptografados
-- em todas as tabelas financeiras.
--
-- MODELO DE SEGURANÇA:
-- - Os campos 'encrypted_data' e 'encryption_iv' armazenam o blob
--   criptografado e o vetor de inicialização, respectivamente.
-- - O servidor NÃO possui a chave para descriptografar esses dados.
-- - Apenas o navegador do proprietário, com a senha correta, pode ler
--   o conteúdo.
-- - Campos de metadados (status, due_date, group_id) são mantidos em
--   texto plano para permitir ordenação e filtragem no servidor.
--
-- DADOS EXISTENTES:
-- - As colunas originais (name, value, description, etc.) não são removidas
-- - Registros sem encrypted_data são tratados como dados legacy (pre-E2EE)
-- - Na migração no login, o frontend lê dados legacy, criptografa e reenvia
-- ============================================================================

-- 1. Tabela de chaves de criptografia por usuário
-- O servidor armazena a MEK (Master Encryption Key) encapsulada (wrapped)
-- pela DEK (derivada da senha). O servidor NUNCA vê a MEK em texto plano.
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Salt usado na derivação PBKDF2 (16 bytes em Base64)
    -- Armazenado em texto plano — NÃO é segredo
    salt TEXT NOT NULL,
    
    -- MEK encapsulada pela DEK (encrypted master key em Base64)
    -- Só pode ser descriptografada com a DEK correta (senha do usuário)
    wrapped_mek TEXT NOT NULL,
    
    -- IV usado ao encapsular a MEK (12 bytes em Base64)
    -- Necessário para unwrap da MEK
    mek_iv TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar colunas de dados criptografados nas tabelas financeiras
-- O campo encrypted_data armazena o JSON dos dados sensíveis, criptografado
-- com AES-256-GCM. O campo encryption_iv armazena o IV de 12 bytes necessário
-- para descriptografar (único por registro).

-- Bills (Contas)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

-- Incomes (Receitas)
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

-- Investments (Investimentos)
ALTER TABLE investments ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

-- Random Expenses (Gastos Variáveis)
ALTER TABLE random_expenses ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE random_expenses ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

-- 3. Índice para busca rápida de chaves por usuário (já é PK, mas
-- explicitamos para documentação)
-- CREATE INDEX IF NOT EXISTS idx_encryption_keys_user ON user_encryption_keys(user_id);

-- 4. Comentários de documentação nas colunas
COMMENT ON TABLE user_encryption_keys IS 'Armazena chaves de criptografia encapsuladas por usuário para E2EE. O servidor nunca possui acesso à MEK em texto plano.';
COMMENT ON COLUMN user_encryption_keys.salt IS 'Salt PBKDF2 (16 bytes, Base64). Não é segredo — garante unicidade na derivação de chave.';
COMMENT ON COLUMN user_encryption_keys.wrapped_mek IS 'Master Encryption Key criptografada com a DEK do usuário (AES-GCM, Base64).';
COMMENT ON COLUMN user_encryption_keys.mek_iv IS 'IV usado para encapsular a MEK (12 bytes, Base64).';
