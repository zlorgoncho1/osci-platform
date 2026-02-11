-- =============================================================================
-- OSCI Platform - PostgreSQL Initialization
-- =============================================================================
-- This script runs on first database initialization only.
-- It creates the additional databases needed by the platform.
-- The primary database (osci) is created by POSTGRES_DB env var.
-- =============================================================================

-- Create Keycloak database
CREATE DATABASE keycloak;

-- Grant privileges to the application user on the keycloak database
GRANT ALL PRIVILEGES ON DATABASE keycloak TO osci;
