-- ============================================
-- Homy Database Initialization
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app schema if needed
-- CREATE SCHEMA IF NOT EXISTS homy;

-- Grant permissions (for production, use specific user)
-- GRANT ALL PRIVILEGES ON SCHEMA homy TO homy;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA homy TO homy;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA homy TO homy;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Homy database initialized at %', NOW();
END $$;
