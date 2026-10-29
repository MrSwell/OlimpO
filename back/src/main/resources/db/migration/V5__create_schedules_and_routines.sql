-- =============================================================
-- V5: Weekly trainer schedules, routines and routine assignments
-- =============================================================

CREATE TABLE trainer_schedules (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    trainer_id  BIGINT      NOT NULL,
    day_of_week TINYINT     NOT NULL COMMENT '1 = Sunday ... 7 = Saturday',
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    PRIMARY KEY (id),
    CONSTRAINT fk_schedules_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (id) ON DELETE CASCADE,
    CONSTRAINT chk_schedules_times  CHECK (end_time > start_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_schedules_trainer ON trainer_schedules (trainer_id);

CREATE TABLE routines (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    trainer_id  BIGINT        NULL COMMENT 'NULL for GENERAL routines',
    name        VARCHAR(150)  NOT NULL,
    type        VARCHAR(20)   NOT NULL DEFAULT 'GENERAL',
    description TEXT          NULL,
    price       DECIMAL(10,2) NULL COMMENT 'Only for CUSTOM routines',
    PRIMARY KEY (id),
    CONSTRAINT fk_routines_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (id) ON DELETE SET NULL,
    CONSTRAINT chk_routines_type   CHECK (type IN ('GENERAL', 'CUSTOM'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE routine_assignments (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    routine_id      BIGINT      NOT NULL,
    client_id       BIGINT      NOT NULL,
    assignment_date DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    PRIMARY KEY (id),
    CONSTRAINT fk_assignments_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_client  FOREIGN KEY (client_id)  REFERENCES clients (id)  ON DELETE CASCADE,
    CONSTRAINT chk_assignments_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_assignments_routine ON routine_assignments (routine_id);
CREATE INDEX idx_assignments_client  ON routine_assignments (client_id);
