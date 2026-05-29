-- Rollback for migration 001: Initial schema
--
-- WARNING: this drops all application tables and their data. It exists so the
-- rollback mechanism is exercised end-to-end and so ephemeral test databases
-- can be torn back down to empty. Do NOT run against production.

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
DROP TRIGGER IF EXISTS update_shelves_updated_at ON shelves;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS shelves CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column();
