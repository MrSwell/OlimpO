-- =============================================================
-- V3: Memberships (history, max 1 ACTIVE per client) and payments
-- =============================================================

CREATE TABLE memberships (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    client_id  BIGINT        NOT NULL,
    type       VARCHAR(20)   NOT NULL COMMENT 'DAILY / QUARTERLY / MONTHLY',
    start_date DATE          NOT NULL,
    end_date   DATE          NOT NULL,
    status     VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    price      DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_memberships_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT,
    CONSTRAINT chk_memberships_type   CHECK (type IN ('DAILY', 'QUARTERLY', 'MONTHLY')),
    CONSTRAINT chk_memberships_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT chk_memberships_dates  CHECK (end_date > start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Business rule: at most one ACTIVE membership per client
CREATE UNIQUE INDEX uk_memberships_client_status ON memberships (client_id, status);

CREATE INDEX idx_memberships_client ON memberships (client_id);
CREATE INDEX idx_memberships_status ON memberships (status);

CREATE TABLE payments (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    membership_id BIGINT        NOT NULL,
    client_id     BIGINT        NOT NULL,
    amount        DECIMAL(10,2) NOT NULL,
    payment_date  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method        VARCHAR(30)   NOT NULL COMMENT 'CASH / CARD / TRANSFER / NEQUI',
    reference     VARCHAR(100)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_payments_membership FOREIGN KEY (membership_id) REFERENCES memberships (id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_client     FOREIGN KEY (client_id)     REFERENCES clients (id)     ON DELETE RESTRICT,
    CONSTRAINT chk_payments_method    CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'NEQUI'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_payments_client     ON payments (client_id);
CREATE INDEX idx_payments_membership ON payments (membership_id);
