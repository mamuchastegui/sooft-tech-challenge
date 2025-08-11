-- Migration: Clean invalid account data with proper CBU/CVU validation
-- Remove transfers with invalid account data that cannot be validated

-- Step 1: Identify and log invalid CBU/CVU accounts before cleaning
-- This is for audit purposes - you may want to backup these records first

-- Create temporary function to validate BCRA mod 10 checksum for CBU
CREATE OR REPLACE FUNCTION validate_cbu_checksum(cbu_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    bank_code TEXT;
    account_number TEXT;
    control_digits TEXT;
    bank_checksum INTEGER;
    account_checksum INTEGER;
    i INTEGER;
    digit INTEGER;
    weight INTEGER;
    sum_val INTEGER;
    weights INTEGER[] := ARRAY[1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2];
    product INTEGER;
BEGIN
    -- Ensure exactly 22 digits
    IF LENGTH(cbu_value) != 22 OR cbu_value !~ '^[0-9]{22}$' THEN
        RETURN FALSE;
    END IF;

    -- Extract components: BBBBAAAAAAAAAAAAAACC
    bank_code := SUBSTRING(cbu_value FROM 1 FOR 4);
    account_number := SUBSTRING(cbu_value FROM 5 FOR 16);
    control_digits := SUBSTRING(cbu_value FROM 21 FOR 2);

    -- Validate bank code checksum (first control digit)
    sum_val := 0;
    FOR i IN 1..4 LOOP
        digit := CAST(SUBSTRING(bank_code FROM i FOR 1) AS INTEGER);
        weight := weights[((i-1) % 16) + 1];
        product := digit * weight;
        IF product > 9 THEN
            product := (product / 10)::INTEGER + (product % 10);
        END IF;
        sum_val := sum_val + product;
    END LOOP;
    bank_checksum := (10 - (sum_val % 10)) % 10;

    -- Validate account checksum (second control digit)
    sum_val := 0;
    FOR i IN 1..16 LOOP
        digit := CAST(SUBSTRING(account_number FROM i FOR 1) AS INTEGER);
        weight := weights[((i-1) % 16) + 1];
        product := digit * weight;
        IF product > 9 THEN
            product := (product / 10)::INTEGER + (product % 10);
        END IF;
        sum_val := sum_val + product;
    END LOOP;
    account_checksum := (10 - (sum_val % 10)) % 10;

    -- Check if control digits match calculated values
    RETURN CAST(SUBSTRING(control_digits FROM 1 FOR 1) AS INTEGER) = bank_checksum
       AND CAST(SUBSTRING(control_digits FROM 2 FOR 1) AS INTEGER) = account_checksum;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to validate CVU checksum
CREATE OR REPLACE FUNCTION validate_cvu_checksum(cvu_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    entity_code TEXT;
    account_id TEXT;
    control_digits TEXT;
    entity_checksum INTEGER;
    account_checksum INTEGER;
    i INTEGER;
    digit INTEGER;
    weight INTEGER;
    sum_val INTEGER;
    weights INTEGER[] := ARRAY[2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1];
    product INTEGER;
BEGIN
    -- Ensure exactly 22 digits
    IF LENGTH(cvu_value) != 22 OR cvu_value !~ '^[0-9]{22}$' THEN
        RETURN FALSE;
    END IF;

    -- Extract components: EEEEAAAAAAAAAAAAAACC
    entity_code := SUBSTRING(cvu_value FROM 1 FOR 4);
    account_id := SUBSTRING(cvu_value FROM 5 FOR 16);
    control_digits := SUBSTRING(cvu_value FROM 21 FOR 2);

    -- Validate entity code checksum (first control digit)
    sum_val := 0;
    FOR i IN 1..4 LOOP
        digit := CAST(SUBSTRING(entity_code FROM i FOR 1) AS INTEGER);
        weight := weights[((i-1) % 16) + 1];
        product := digit * weight;
        IF product > 9 THEN
            product := (product / 10)::INTEGER + (product % 10);
        END IF;
        sum_val := sum_val + product;
    END LOOP;
    entity_checksum := (10 - (sum_val % 10)) % 10;

    -- Validate account checksum (second control digit)
    sum_val := 0;
    FOR i IN 1..16 LOOP
        digit := CAST(SUBSTRING(account_id FROM i FOR 1) AS INTEGER);
        weight := weights[((i-1) % 16) + 1];
        product := digit * weight;
        IF product > 9 THEN
            product := (product / 10)::INTEGER + (product % 10);
        END IF;
        sum_val := sum_val + product;
    END LOOP;
    account_checksum := (10 - (sum_val % 10)) % 10;

    -- Check if control digits match calculated values
    RETURN CAST(SUBSTRING(control_digits FROM 1 FOR 1) AS INTEGER) = entity_checksum
       AND CAST(SUBSTRING(control_digits FROM 2 FOR 1) AS INTEGER) = account_checksum;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create audit table to log invalid transfers before deletion
CREATE TABLE IF NOT EXISTS invalid_transfers_audit (
    id UUID,
    debit_account_type VARCHAR(10),
    debit_account_value VARCHAR(22),
    credit_account_type VARCHAR(10),
    credit_account_value VARCHAR(22),
    reason TEXT,
    archived_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Log invalid CBU accounts
INSERT INTO invalid_transfers_audit (id, debit_account_type, debit_account_value, credit_account_type, credit_account_value, reason)
SELECT 
    id, 
    debit_account_type, 
    debit_account_value, 
    credit_account_type, 
    credit_account_value,
    CASE 
        WHEN debit_account_type = 'CBU' AND NOT validate_cbu_checksum(debit_account_value) 
             AND credit_account_type = 'CBU' AND NOT validate_cbu_checksum(credit_account_value)
        THEN 'Both debit and credit CBU accounts have invalid checksums'
        WHEN debit_account_type = 'CBU' AND NOT validate_cbu_checksum(debit_account_value)
        THEN 'Debit CBU account has invalid checksum'
        WHEN credit_account_type = 'CBU' AND NOT validate_cbu_checksum(credit_account_value)
        THEN 'Credit CBU account has invalid checksum'
        WHEN debit_account_type = 'CVU' AND NOT validate_cvu_checksum(debit_account_value)
        THEN 'Debit CVU account has invalid checksum'
        WHEN credit_account_type = 'CVU' AND NOT validate_cvu_checksum(credit_account_value)
        THEN 'Credit CVU account has invalid checksum'
        ELSE 'Other validation failure'
    END as reason
FROM transfers
WHERE 
    -- Invalid CBU accounts
    (debit_account_type = 'CBU' AND NOT validate_cbu_checksum(debit_account_value)) OR
    (credit_account_type = 'CBU' AND NOT validate_cbu_checksum(credit_account_value)) OR
    -- Invalid CVU accounts  
    (debit_account_type = 'CVU' AND NOT validate_cvu_checksum(debit_account_value)) OR
    (credit_account_type = 'CVU' AND NOT validate_cvu_checksum(credit_account_value)) OR
    -- Invalid ALIAS accounts (wrong length or invalid characters)
    (debit_account_type = 'ALIAS' AND (
        LENGTH(debit_account_value) < 6 OR 
        LENGTH(debit_account_value) > 20 OR 
        debit_account_value !~ '^[A-Za-z0-9._-]{6,20}$'
    )) OR
    (credit_account_type = 'ALIAS' AND (
        LENGTH(credit_account_value) < 6 OR 
        LENGTH(credit_account_value) > 20 OR 
        credit_account_value !~ '^[A-Za-z0-9._-]{6,20}$'
    ));

-- Step 4: Report how many invalid records were found
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count FROM invalid_transfers_audit WHERE archived_at >= NOW() - INTERVAL '1 minute';
    RAISE NOTICE 'Found % invalid transfer records that will be archived', invalid_count;
END $$;

-- Step 5: Delete invalid transfers (after archiving them)
-- Note: This is a destructive operation. Consider backing up the data first.
DELETE FROM transfers
WHERE 
    -- Invalid CBU accounts
    (debit_account_type = 'CBU' AND NOT validate_cbu_checksum(debit_account_value)) OR
    (credit_account_type = 'CBU' AND NOT validate_cbu_checksum(credit_account_value)) OR
    -- Invalid CVU accounts
    (debit_account_type = 'CVU' AND NOT validate_cvu_checksum(debit_account_value)) OR
    (credit_account_type = 'CVU' AND NOT validate_cvu_checksum(credit_account_value)) OR
    -- Invalid ALIAS accounts
    (debit_account_type = 'ALIAS' AND (
        LENGTH(debit_account_value) < 6 OR 
        LENGTH(debit_account_value) > 20 OR 
        debit_account_value !~ '^[A-Za-z0-9._-]{6,20}$'
    )) OR
    (credit_account_type = 'ALIAS' AND (
        LENGTH(credit_account_value) < 6 OR 
        LENGTH(credit_account_value) > 20 OR 
        credit_account_value !~ '^[A-Za-z0-9._-]{6,20}$'
    ));

-- Step 6: Add stronger constraints for data integrity
-- Drop existing constraints first if they exist
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS check_debit_account_value_format;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS check_credit_account_value_format;

-- Add new constraints with proper validation
ALTER TABLE transfers
ADD CONSTRAINT check_debit_account_value_format
CHECK (
  (debit_account_type = 'CBU' AND LENGTH(debit_account_value) = 22 AND debit_account_value ~ '^[0-9]{22}$' AND validate_cbu_checksum(debit_account_value)) OR
  (debit_account_type = 'CVU' AND LENGTH(debit_account_value) = 22 AND debit_account_value ~ '^[0-9]{22}$' AND validate_cvu_checksum(debit_account_value)) OR
  (debit_account_type = 'ALIAS' AND LENGTH(debit_account_value) BETWEEN 6 AND 20 AND debit_account_value ~ '^[A-Za-z0-9._-]{6,20}$')
);

ALTER TABLE transfers
ADD CONSTRAINT check_credit_account_value_format
CHECK (
  (credit_account_type = 'CBU' AND LENGTH(credit_account_value) = 22 AND credit_account_value ~ '^[0-9]{22}$' AND validate_cbu_checksum(credit_account_value)) OR
  (credit_account_type = 'CVU' AND LENGTH(credit_account_value) = 22 AND credit_account_value ~ '^[0-9]{22}$' AND validate_cvu_checksum(credit_account_value)) OR
  (credit_account_type = 'ALIAS' AND LENGTH(credit_account_value) BETWEEN 6 AND 20 AND credit_account_value ~ '^[A-Za-z0-9._-]{6,20}$')
);

-- Step 7: Clean up temporary functions
DROP FUNCTION IF EXISTS validate_cbu_checksum(TEXT);
DROP FUNCTION IF EXISTS validate_cvu_checksum(TEXT);

-- Step 8: Report final state
DO $$
DECLARE
    remaining_count INTEGER;
    archived_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM transfers;
    SELECT COUNT(*) INTO archived_count FROM invalid_transfers_audit WHERE archived_at >= NOW() - INTERVAL '1 minute';
    RAISE NOTICE 'Migration completed. % transfers remain active. % invalid transfers archived.', remaining_count, archived_count;
    RAISE NOTICE 'Check invalid_transfers_audit table for archived invalid records.';
END $$;