-- Smart Receipt 2.0 migration
-- Adds google_review_url to users + creates receipt_tokens table.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_review_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS receipt_tokens (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    click_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_receipt_tokens_token ON receipt_tokens(token);
CREATE INDEX IF NOT EXISTS idx_receipt_tokens_sale ON receipt_tokens(sale_id);
