-- Migration: Create materialized view for companies joined last month report
-- This materialized view filters companies that joined in the previous month

CREATE MATERIALIZED VIEW mv_companies_joined_last_month AS
SELECT  id,
        cuit,
        business_name,
        joined_at,
        type
FROM companies
WHERE joined_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND joined_at <  date_trunc('month', now());

-- Create unique index for efficient queries
CREATE UNIQUE INDEX idx_mv_joined_id ON mv_companies_joined_last_month (id);