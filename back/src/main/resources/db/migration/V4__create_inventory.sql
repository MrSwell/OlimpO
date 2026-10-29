-- =============================================================
-- V4: Inventory: items, movements (stock control) and machines
-- =============================================================

CREATE TABLE inventory_items (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    name      VARCHAR(150) NOT NULL,
    category  VARCHAR(100) NULL,
    quantity  INT          NOT NULL DEFAULT 0,
    min_stock INT          NOT NULL DEFAULT 5,
    unit      VARCHAR(20)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE inventory_movements (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    item_id       BIGINT       NOT NULL,
    type          VARCHAR(10)  NOT NULL COMMENT 'INBOUND / OUTBOUND',
    quantity      INT          NOT NULL,
    movement_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observation   VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_movements_item  FOREIGN KEY (item_id) REFERENCES inventory_items (id) ON DELETE RESTRICT,
    CONSTRAINT chk_movements_type CHECK (type IN ('INBOUND', 'OUTBOUND'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_movements_item ON inventory_movements (item_id);

CREATE TABLE machines (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(150) NOT NULL,
    brand         VARCHAR(100) NULL,
    model         VARCHAR(100) NULL,
    serial_number VARCHAR(100) NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    PRIMARY KEY (id),
    UNIQUE KEY uk_machines_serial (serial_number),
    CONSTRAINT chk_machines_status CHECK (status IN ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
