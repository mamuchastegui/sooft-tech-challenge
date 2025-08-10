-- Migration: Update materialized views to alias business_name as name for API consistency
-- This allows external API to consistently use 'name' while keeping internal 'businessName'

-- Drop and recreate mv_companies_last_month with business_name aliased as name
DROP MATERIALIZED VIEW IF EXISTS mv_companies_last_month;

CREATE MATERIALIZED VIEW mv_companies_last_month AS
SELECT  c.id,
        c.cuit,
        c.business_name AS name,
        c.joined_at,
        c.type,
        COUNT(t.id)  AS transfer_count,
        SUM(t.amount) AS total_amount
FROM companies c
JOIN transfers t ON t.company_id = c.id
WHERE t.created_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND t.created_at <  date_trunc('month', now())
GROUP BY c.id, c.cuit, c.business_name, c.joined_at, c.type;

-- Recreate unique index for efficient queries
CREATE UNIQUE INDEX idx_mv_company_id ON mv_companies_last_month (id);

-- Drop and recreate mv_companies_joined_last_month with business_name aliased as name
DROP MATERIALIZED VIEW IF EXISTS mv_companies_joined_last_month;

CREATE MATERIALIZED VIEW mv_companies_joined_last_month AS
SELECT  id,
        cuit,
        business_name AS name,
        joined_at,
        type
FROM companies
WHERE joined_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND joined_at <  date_trunc('month', now());

-- Recreate unique index for efficient queries
CREATE UNIQUE INDEX idx_mv_joined_id ON mv_companies_joined_last_month (id);