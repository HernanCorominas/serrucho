-- ==========================================
-- SERRUCHO V2 SCHEMA ENHANCEMENTS
-- ==========================================

-- 1. Add Category to Expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'OTHER' 
CHECK (category IN ('LODGING', 'FOOD_GROCERIES', 'DRINKS_ALCOHOL', 'FUEL_TRANSPORT', 'RESTAURANT', 'ENTERTAINMENT', 'OTHER'));

-- 2. Add is_paid and paid_at to Settlement Snapshots
ALTER TABLE settlement_snapshots
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamptz DEFAULT null;

-- Index for payment queries
CREATE INDEX IF NOT EXISTS idx_settlement_snapshots_paid ON settlement_snapshots(serrucho_id, is_paid);
