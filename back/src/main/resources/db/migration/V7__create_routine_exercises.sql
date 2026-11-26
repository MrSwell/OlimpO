-- =============================================================
-- V7: Exercise plan for each routine
-- =============================================================

CREATE TABLE routine_exercises (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    routine_id   BIGINT       NOT NULL,
    name         VARCHAR(150) NOT NULL,
    sets_count   INT          NULL,
    reps         VARCHAR(50)  NULL,
    rest_seconds INT          NULL,
    notes        VARCHAR(255) NULL,
    position     INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_routine_exercises_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE,
    CONSTRAINT chk_routine_exercises_sets CHECK (sets_count IS NULL OR sets_count > 0),
    CONSTRAINT chk_routine_exercises_rest CHECK (rest_seconds IS NULL OR rest_seconds >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_routine_exercises_routine ON routine_exercises (routine_id, position);
