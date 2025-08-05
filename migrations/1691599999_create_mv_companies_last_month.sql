-- Migration: Create materialized view for last month companies report
-- This materialized view aggregates companies with their transfer data for the previous month

CREATE MATERIALIZED VIEW mv_companies_last_month AS
SELECT  c.id,
        c.cuit,
        c.business_name,
        c.joined_at,
        c.type,
        COUNT(t.id)  AS transfer_count,
        SUM(t.amount) AS total_amount
FROM companies c
JOIN transfers t ON t.company_id = c.id
WHERE t.created_at >= date_trunc('month', now()) - INTERVAL '1 month'
  AND t.created_at <  date_trunc('month', now())
GROUP BY c.id, c.cuit, c.business_name, c.joined_at, c.type;

-- Create unique index for efficient queries
CREATE UNIQUE INDEX idx_mv_company_id ON mv_companies_last_month (id);