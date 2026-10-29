-- =============================================================
-- V6: Relax clients.sex column type (CHAR -> VARCHAR) so that
-- Hibernate schema validation matches the String mapping.
-- =============================================================

ALTER TABLE clients MODIFY COLUMN sex VARCHAR(1) NULL;
