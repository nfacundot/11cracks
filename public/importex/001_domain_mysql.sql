-- 11 CRACKS DOMAIN DDL (MySQL 8)
-- Reference implementation mirroring the Prisma fragment.
-- IMPORTANT: adapt charset/collation and FK constraints to the existing base schema.

CREATE TABLE evaluation_dimension_definitions (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `group` ENUM('SPORT','NEUROCRACKS') NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  version VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_eval_dimension (organization_id, `key`, version),
  KEY ix_eval_dimension_active (organization_id, `group`, active)
) ENGINE=InnoDB;

CREATE TABLE coach_evaluations (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  coach_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NULL,
  period_start DATETIME(3) NOT NULL,
  period_end DATETIME(3) NOT NULL,
  status ENUM('DRAFT','PUBLISHED','CORRECTED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  notes TEXT NULL,
  rule_version VARCHAR(64) NOT NULL,
  supersedes_evaluation_id VARCHAR(32) NULL,
  published_at DATETIME(3) NULL,
  published_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_coach_eval_player (organization_id, club_id, player_id, period_start),
  KEY ix_coach_eval_coach (organization_id, coach_id, status),
  KEY ix_coach_eval_supersedes (supersedes_evaluation_id)
) ENGINE=InnoDB;

CREATE TABLE coach_evaluation_items (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  evaluation_id VARCHAR(32) NOT NULL,
  dimension_id VARCHAR(32) NOT NULL,
  rubric_level ENUM('NOT_OBSERVED','NEEDS_SUPPORT','IN_DEVELOPMENT','ADEQUATE','OUTSTANDING','CONSOLIDATED') NOT NULL,
  normalized_value INT NULL,
  comment TEXT NULL,
  evidence_url VARCHAR(1024) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_eval_item (evaluation_id, dimension_id),
  KEY ix_eval_item_dimension (organization_id, dimension_id),
  CONSTRAINT fk_eval_item_eval FOREIGN KEY (evaluation_id) REFERENCES coach_evaluations(id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_item_dim FOREIGN KEY (dimension_id) REFERENCES evaluation_dimension_definitions(id)
) ENGINE=InnoDB;

CREATE TABLE neuro_digital_period_scores (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  dimension_id VARCHAR(32) NOT NULL,
  period_start DATETIME(3) NOT NULL,
  period_end DATETIME(3) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  source_summary JSON NULL,
  rule_version VARCHAR(64) NOT NULL,
  calculated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_neuro_digital (organization_id, player_id, dimension_id, period_start, period_end, rule_version),
  KEY ix_neuro_digital_player (organization_id, club_id, player_id, period_end),
  CONSTRAINT fk_neuro_digital_dim FOREIGN KEY (dimension_id) REFERENCES evaluation_dimension_definitions(id)
) ENGINE=InnoDB;

CREATE TABLE score_formula_versions (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  version VARCHAR(64) NOT NULL,
  sport_weight DECIMAL(5,4) NOT NULL,
  neuro_weight DECIMAL(5,4) NOT NULL,
  config JSON NULL,
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  status ENUM('DRAFT','ACTIVE','RETIRED') NOT NULL DEFAULT 'DRAFT',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_score_formula (organization_id, version),
  KEY ix_score_formula_active (organization_id, status, effective_from)
) ENGINE=InnoDB;

CREATE TABLE player_score_snapshots (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  period_start DATETIME(3) NOT NULL,
  period_end DATETIME(3) NOT NULL,
  formula_version_id VARCHAR(32) NOT NULL,
  sport_score DECIMAL(5,2) NULL,
  neuro_score DECIMAL(5,2) NULL,
  eleven_score DECIMAL(5,2) NULL,
  calculation_status ENUM('INCOMPLETE','PREVIEW','FINAL') NOT NULL DEFAULT 'INCOMPLETE',
  source_summary JSON NULL,
  calculated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_score_snapshot (organization_id, player_id, period_start, period_end, formula_version_id),
  KEY ix_score_snapshot_player (organization_id, club_id, player_id, period_end),
  CONSTRAINT fk_score_snapshot_formula FOREIGN KEY (formula_version_id) REFERENCES score_formula_versions(id)
) ENGINE=InnoDB;

CREATE TABLE attendance_records (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  coach_id VARCHAR(64) NOT NULL,
  status ENUM('PRESENT','ABSENT','PENDING') NOT NULL DEFAULT 'PENDING',
  marked_at DATETIME(3) NULL,
  notes TEXT NULL,
  correction_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_attendance (organization_id, session_id, player_id),
  KEY ix_attendance_player (organization_id, club_id, player_id, created_at),
  KEY ix_attendance_coach (organization_id, coach_id, session_id)
) ENGINE=InnoDB;

CREATE TABLE streak_rule_versions (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  version VARCHAR(64) NOT NULL,
  attendance_weight DECIMAL(5,4) NOT NULL,
  neurocracks_weight DECIMAL(5,4) NOT NULL,
  challenge_weight DECIMAL(5,4) NOT NULL,
  pet_weight DECIMAL(5,4) NOT NULL,
  validation_weight DECIMAL(5,4) NOT NULL,
  component_config JSON NULL,
  verified_week_threshold DECIMAL(5,2) NULL,
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  status ENUM('DRAFT','ACTIVE','RETIRED') NOT NULL DEFAULT 'DRAFT',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_streak_rule (organization_id, version),
  KEY ix_streak_rule_active (organization_id, status, effective_from)
) ENGINE=InnoDB;

CREATE TABLE streak_evidence (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NULL,
  type ENUM('ATTENDANCE','NEUROCRACKS','CHALLENGE','PET','VALIDATION') NOT NULL,
  source_id VARCHAR(128) NOT NULL,
  status ENUM('PENDING','VERIFIED','REJECTED','REVERSED') NOT NULL DEFAULT 'PENDING',
  occurred_at DATETIME(3) NOT NULL,
  validated_by VARCHAR(64) NULL,
  validated_at DATETIME(3) NULL,
  metadata JSON NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  correction_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_streak_evidence_idempotency (idempotency_key),
  KEY ix_streak_evidence_player (organization_id, club_id, player_id, occurred_at),
  KEY ix_streak_evidence_source (organization_id, type, source_id)
) ENGINE=InnoDB;

CREATE TABLE streak_period_results (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  period_start DATETIME(3) NOT NULL,
  period_end DATETIME(3) NOT NULL,
  rule_version_id VARCHAR(32) NOT NULL,
  attendance_component DECIMAL(5,2) NULL,
  neurocracks_component DECIMAL(5,2) NULL,
  challenge_component DECIMAL(5,2) NULL,
  pet_component DECIMAL(5,2) NULL,
  validation_component DECIMAL(5,2) NULL,
  streak_score DECIMAL(5,2) NULL,
  verified_week BOOLEAN NULL,
  calculation_status ENUM('INCOMPLETE','PREVIEW','FINAL') NOT NULL DEFAULT 'INCOMPLETE',
  source_summary JSON NULL,
  manual_override JSON NULL,
  calculated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  correction_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_streak_period (organization_id, player_id, period_start, period_end, rule_version_id),
  KEY ix_streak_period_player (organization_id, club_id, player_id, period_end),
  CONSTRAINT fk_streak_result_rule FOREIGN KEY (rule_version_id) REFERENCES streak_rule_versions(id)
) ENGINE=InnoDB;

CREATE TABLE pet_batches (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  batch_code VARCHAR(128) NOT NULL,
  status ENUM('DRAFT','SENT','WEIGHED','SETTLED','RECONCILED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  dispatch_date DATETIME(3) NULL,
  dispatched_by VARCHAR(64) NULL,
  bottles_sent INT NULL,
  estimated_kg DECIMAL(12,3) NULL,
  processor_name VARCHAR(255) NULL,
  received_at DATETIME(3) NULL,
  real_kg DECIMAL(12,3) NULL,
  weighing_document_url VARCHAR(1024) NULL,
  closed_by VARCHAR(64) NULL,
  closed_at DATETIME(3) NULL,
  correction_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_pet_batch_code (organization_id, batch_code),
  KEY ix_pet_batch_status (organization_id, club_id, status)
) ENGINE=InnoDB;

CREATE TABLE pet_contributions (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NULL,
  session_id VARCHAR(64) NULL,
  recorded_by VARCHAR(64) NOT NULL,
  recorded_at DATETIME(3) NOT NULL,
  bottles_count INT NOT NULL,
  estimated_kg DECIMAL(12,3) NULL,
  batch_id VARCHAR(32) NULL,
  status ENUM('COLLECTED','PENDING_DISPATCH','IN_BATCH','CANCELLED') NOT NULL DEFAULT 'COLLECTED',
  notes TEXT NULL,
  import_batch_id VARCHAR(32) NULL,
  source_row_number INT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  correction_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_pet_contribution_idempotency (idempotency_key),
  KEY ix_pet_contribution_club (organization_id, club_id, recorded_at),
  KEY ix_pet_contribution_player (organization_id, player_id, recorded_at),
  KEY ix_pet_contribution_batch (batch_id),
  CONSTRAINT fk_pet_contribution_batch FOREIGN KEY (batch_id) REFERENCES pet_batches(id)
) ENGINE=InnoDB;

CREATE TABLE exchange_rates (
  id VARCHAR(32) PRIMARY KEY,
  currency_from VARCHAR(8) NOT NULL,
  currency_to VARCHAR(8) NOT NULL,
  rate DECIMAL(18,6) NOT NULL,
  effective_date DATETIME(3) NOT NULL,
  source VARCHAR(255) NOT NULL,
  retrieved_at DATETIME(3) NOT NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT NULL,
  overridden_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_exchange_rate (currency_from, currency_to, effective_date, source),
  KEY ix_exchange_rate_date (effective_date)
) ENGINE=InnoDB;

CREATE TABLE pet_settlements (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  batch_id VARCHAR(32) NOT NULL,
  status ENUM('PENDING','SETTLED','RECONCILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  settled_at DATETIME(3) NULL,
  real_kg DECIMAL(12,3) NOT NULL,
  cop_paid DECIMAL(18,2) NOT NULL,
  price_per_kg DECIMAL(18,4) NOT NULL,
  exchange_rate_id VARCHAR(32) NULL,
  usd_reference DECIMAL(18,2) NULL,
  payment_reference VARCHAR(255) NULL,
  settlement_document_url VARCHAR(1024) NULL,
  reconciled_at DATETIME(3) NULL,
  reconciled_by VARCHAR(64) NULL,
  correction_id VARCHAR(32) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_pet_settlement_batch (batch_id),
  KEY ix_pet_settlement_status (organization_id, club_id, status),
  KEY ix_pet_settlement_date (settled_at),
  CONSTRAINT fk_pet_settlement_batch FOREIGN KEY (batch_id) REFERENCES pet_batches(id),
  CONSTRAINT fk_pet_settlement_fx FOREIGN KEY (exchange_rate_id) REFERENCES exchange_rates(id)
) ENGINE=InnoDB;

CREATE TABLE coin_rule_versions (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  version VARCHAR(64) NOT NULL,
  source_type ENUM('PET','STREAK','CORRECTION') NOT NULL,
  source_event VARCHAR(128) NULL,
  config JSON NULL,
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  status ENUM('DRAFT','ACTIVE','RETIRED') NOT NULL DEFAULT 'DRAFT',
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_coin_rule (organization_id, version, source_type),
  KEY ix_coin_rule_active (organization_id, source_type, status, effective_from)
) ENGINE=InnoDB;

CREATE TABLE crack_coin_ledger (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  source_type ENUM('PET','STREAK','CORRECTION') NOT NULL,
  source_id VARCHAR(128) NOT NULL,
  rule_version_id VARCHAR(32) NULL,
  coin_delta INT NOT NULL,
  status ENUM('PENDING','POSTED','REVERSED','VOID') NOT NULL DEFAULT 'PENDING',
  idempotency_key VARCHAR(255) NOT NULL,
  reversal_of_id VARCHAR(32) NULL,
  created_by VARCHAR(64) NOT NULL,
  correction_id VARCHAR(32) NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_coin_ledger_idempotency (idempotency_key),
  KEY ix_coin_player (organization_id, club_id, player_id, occurred_at),
  KEY ix_coin_source (organization_id, source_type, source_id),
  KEY ix_coin_reversal (reversal_of_id),
  CONSTRAINT fk_coin_rule FOREIGN KEY (rule_version_id) REFERENCES coin_rule_versions(id)
) ENGINE=InnoDB;

CREATE TABLE data_corrections (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  entity_type VARCHAR(128) NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  field_name VARCHAR(128) NULL,
  original_value JSON NULL,
  requested_value JSON NULL,
  reason TEXT NOT NULL,
  requested_by VARCHAR(64) NOT NULL,
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  status ENUM('PENDING','APPROVED','REJECTED','APPLIED') NOT NULL DEFAULT 'PENDING',
  approved_by VARCHAR(64) NULL,
  approved_at DATETIME(3) NULL,
  applied_at DATETIME(3) NULL,
  replacement_record_id VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_correction_entity (organization_id, entity_type, entity_id),
  KEY ix_correction_status (organization_id, status, requested_at)
) ENGINE=InnoDB;

CREATE TABLE import_batches (
  id VARCHAR(32) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  club_id VARCHAR(64) NULL,
  import_type VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_hash VARCHAR(128) NOT NULL,
  uploaded_by VARCHAR(64) NOT NULL,
  uploaded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  status ENUM('UPLOADED','PARSED','VALIDATED','READY_TO_APPLY','APPLIED','FAILED','CANCELLED') NOT NULL DEFAULT 'UPLOADED',
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  applied_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_import_file (organization_id, file_hash, import_type),
  KEY ix_import_batch (organization_id, club_id, uploaded_at)
) ENGINE=InnoDB;

CREATE TABLE import_row_errors (
  id VARCHAR(32) PRIMARY KEY,
  import_batch_id VARCHAR(32) NOT NULL,
  row_number INT NOT NULL,
  source_row_key VARCHAR(255) NULL,
  raw_data JSON NOT NULL,
  error_code VARCHAR(128) NOT NULL,
  error_message TEXT NOT NULL,
  corrected_data JSON NULL,
  status ENUM('VALID','WARNING','ERROR','CORRECTED','APPLIED') NOT NULL DEFAULT 'ERROR',
  corrected_by VARCHAR(64) NULL,
  corrected_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_import_row (import_batch_id, row_number),
  KEY ix_import_row_status (status),
  CONSTRAINT fk_import_row_batch FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE CASCADE
) ENGINE=InnoDB;
