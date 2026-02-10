CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE ai_advisor_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES finance_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    summary_input TEXT NOT NULL,
    advice_output JSONB NOT NULL
);

CREATE INDEX idx_ai_advisor_history_group_id ON ai_advisor_history(group_id);
CREATE INDEX idx_ai_advisor_history_user_id ON ai_advisor_history(user_id);
