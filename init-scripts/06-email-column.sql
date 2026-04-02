-- Migration 06: Add email column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
