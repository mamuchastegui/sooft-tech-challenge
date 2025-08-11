-- Migration: Refactor account fields from single ID to type/value pattern
-- Replace debit_account_id and credit_account_id with type/value columns

-- Add new account type and value columns
ALTER TABLE transfers 
ADD COLUMN debit_account_type VARCHAR(10) NOT NULL DEFAULT 'CBU',
ADD COLUMN debit_account_value VARCHAR(22) NOT NULL DEFAULT '',
ADD COLUMN credit_account_type VARCHAR(10) NOT NULL DEFAULT 'CBU',
ADD COLUMN credit_account_value VARCHAR(22) NOT NULL DEFAULT '';

-- Migrate existing data: assume existing account_ids are CBUs
UPDATE transfers 
SET 
  debit_account_type = 'CBU',
  debit_account_value = debit_account_id,
  credit_account_type = 'CBU', 
  credit_account_value = credit_account_id
WHERE debit_account_id IS NOT NULL AND credit_account_id IS NOT NULL;

-- Remove old columns
ALTER TABLE transfers 
DROP COLUMN IF EXISTS debit_account_id,
DROP COLUMN IF EXISTS credit_account_id;

-- Add constraints for account types
ALTER TABLE transfers 
ADD CONSTRAINT check_debit_account_type 
CHECK (debit_account_type IN ('CBU', 'CVU', 'ALIAS'));

ALTER TABLE transfers 
ADD CONSTRAINT check_credit_account_type 
CHECK (credit_account_type IN ('CBU', 'CVU', 'ALIAS'));

-- Add constraints for account value formats
ALTER TABLE transfers
ADD CONSTRAINT check_debit_account_value_format
CHECK (
  (debit_account_type IN ('CBU', 'CVU') AND LENGTH(debit_account_value) = 22 AND debit_account_value ~ '^[0-9]{22}$') OR
  (debit_account_type = 'ALIAS' AND LENGTH(debit_account_value) BETWEEN 6 AND 20 AND debit_account_value ~ '^[A-Za-z0-9._-]{6,20}$')
);

ALTER TABLE transfers
ADD CONSTRAINT check_credit_account_value_format  
CHECK (
  (credit_account_type IN ('CBU', 'CVU') AND LENGTH(credit_account_value) = 22 AND credit_account_value ~ '^[0-9]{22}$') OR
  (credit_account_type = 'ALIAS' AND LENGTH(credit_account_value) BETWEEN 6 AND 20 AND credit_account_value ~ '^[A-Za-z0-9._-]{6,20}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transfers_debit_account 
ON transfers (debit_account_type, debit_account_value);

CREATE INDEX IF NOT EXISTS idx_transfers_credit_account 
ON transfers (credit_account_type, credit_account_value);