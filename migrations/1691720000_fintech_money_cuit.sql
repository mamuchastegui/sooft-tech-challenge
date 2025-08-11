-- Migration: Update CUIT and Money storage for fintech standards
-- CUIT: Store as CHAR(11) digits only with proper constraints
-- Money: Prepare for future cents-based storage (keeping current decimal for compatibility)

-- Companies table: Update CUIT column to store normalized format
-- First check if we need to update existing data format
DO $$
BEGIN
    -- Check if cuit column exists and has the old format (with dashes)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'cuit'
    ) THEN
        -- Update any existing CUITs to normalized format (remove dashes)
        UPDATE companies 
        SET cuit = REGEXP_REPLACE(cuit, '[^0-9]', '', 'g')
        WHERE cuit ~ '-';
        
        -- Modify column constraints
        ALTER TABLE companies 
        ALTER COLUMN cuit TYPE CHAR(11);
        
        -- Add check constraint for digits only
        ALTER TABLE companies 
        DROP CONSTRAINT IF EXISTS check_cuit_format;
        
        ALTER TABLE companies 
        ADD CONSTRAINT check_cuit_format 
        CHECK (cuit ~ '^[0-9]{11}$');
        
        -- Ensure UNIQUE constraint exists
        ALTER TABLE companies 
        DROP CONSTRAINT IF EXISTS unique_cuit;
        
        ALTER TABLE companies 
        ADD CONSTRAINT unique_cuit UNIQUE (cuit);
        
        RAISE NOTICE 'CUIT column updated to normalized format';
    END IF;
END $$;

-- Add comments to document the fintech standards
COMMENT ON COLUMN companies.cuit IS 'CUIT stored as 11 digits (normalized format). UI should format as XX-XXXXXXXX-X';

-- Add future-ready columns for Money with currency support
-- Keep existing decimal columns for backward compatibility
DO $$
BEGIN
    -- Add currency column for future Money improvements (default ARS for now)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transfers' AND column_name = 'currency'
    ) THEN
        ALTER TABLE transfers 
        ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'ARS';
        
        ALTER TABLE transfers 
        ADD CONSTRAINT check_currency_format 
        CHECK (currency ~ '^[A-Z]{3}$');
        
        ALTER TABLE transfers 
        ADD CONSTRAINT check_valid_currency 
        CHECK (currency IN ('ARS', 'USD', 'EUR', 'BRL'));
        
        COMMENT ON COLUMN transfers.currency IS 'ISO-4217 currency code. Money VO handles currency validation';
        
        RAISE NOTICE 'Currency column added to transfers table';
    END IF;
END $$;

-- Add index for currency-based queries
CREATE INDEX IF NOT EXISTS idx_transfers_currency ON transfers (currency);

-- Add comments documenting the money storage strategy
COMMENT ON COLUMN transfers.amount IS 'Legacy decimal storage. Future: migrate to cents-based BIGINT for precision';

-- Create function to validate CUIT checksum at database level (optional extra validation)
CREATE OR REPLACE FUNCTION validate_cuit_checksum(cuit_digits TEXT) RETURNS BOOLEAN AS $$
DECLARE
    multipliers INT[] := ARRAY[5,4,3,2,7,6,5,4,3,2];
    digit_sum INT := 0;
    i INT;
    check_digit INT;
    expected_check_digit INT;
BEGIN
    -- Validate input format
    IF length(cuit_digits) != 11 OR cuit_digits !~ '^[0-9]{11}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate checksum
    FOR i IN 1..10 LOOP
        digit_sum := digit_sum + (substring(cuit_digits, i, 1)::INT * multipliers[i]);
    END LOOP;
    
    expected_check_digit := 11 - (digit_sum % 11);
    IF expected_check_digit = 11 THEN 
        expected_check_digit := 0;
    ELSIF expected_check_digit = 10 THEN 
        expected_check_digit := 9;
    END IF;
    
    check_digit := substring(cuit_digits, 11, 1)::INT;
    
    RETURN check_digit = expected_check_digit;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add optional checksum validation constraint (commented out for performance)
-- ALTER TABLE companies ADD CONSTRAINT check_cuit_checksum CHECK (validate_cuit_checksum(cuit));

COMMENT ON FUNCTION validate_cuit_checksum IS 'Validates CUIT checksum at database level. Optional constraint for extra validation';