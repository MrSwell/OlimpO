-- =============================================================
-- V2: Profiles: clients (1:1 users) and trainers (1:1 users)
-- =============================================================

CREATE TABLE clients (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    document_number VARCHAR(20)  NOT NULL,
    birth_date      DATE         NULL,
    sex             CHAR(1)      NULL COMMENT 'M / F',
    fitness_goal    VARCHAR(100) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_clients_user (user_id),
    CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE trainers (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    specialty           VARCHAR(100)  NULL,
    years_of_experience INT           NULL,
    fee                 DECIMAL(10,2) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_trainers_user (user_id),
    CONSTRAINT fk_trainers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
