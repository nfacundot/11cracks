-- CreateEnum
CREATE TYPE "EvaluationDimensionGroup" AS ENUM ('SPORT', 'NEUROCRACKS');

-- CreateEnum
CREATE TYPE "CoachRubricLevel" AS ENUM ('NOT_OBSERVED', 'NEEDS_SUPPORT', 'IN_DEVELOPMENT', 'ADEQUATE', 'OUTSTANDING', 'CONSOLIDATED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CORRECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'PENDING');

-- CreateEnum
CREATE TYPE "ScoreCalculationStatus" AS ENUM ('INCOMPLETE', 'PREVIEW', 'FINAL');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "PetContributionStatus" AS ENUM ('COLLECTED', 'PENDING_DISPATCH', 'IN_BATCH', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PetBatchStatus" AS ENUM ('DRAFT', 'SENT', 'WEIGHED', 'SETTLED', 'RECONCILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PetSettlementStatus" AS ENUM ('PENDING', 'SETTLED', 'RECONCILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StreakEvidenceType" AS ENUM ('ATTENDANCE', 'NEUROCRACKS', 'CHALLENGE', 'PET', 'VALIDATION');

-- CreateEnum
CREATE TYPE "StreakEvidenceStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "CoinSourceType" AS ENUM ('PET', 'STREAK', 'CORRECTION');

-- CreateEnum
CREATE TYPE "CoinLedgerStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED', 'VOID');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('UPLOADED', 'PARSED', 'VALIDATED', 'READY_TO_APPLY', 'APPLIED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('VALID', 'WARNING', 'ERROR', 'CORRECTED', 'APPLIED');
-- CreateTable
CREATE TABLE "EvaluationDimensionDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "group" "EvaluationDimensionGroup" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationDimensionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachEvaluation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sessionId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "ruleVersion" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "supersedesEvaluationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachEvaluationItem" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "rubricLevel" "CoachRubricLevel" NOT NULL,
    "normalizedValue" INTEGER,
    "comment" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachEvaluationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeuroDigitalPeriodScore" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "sourceSummary" JSONB,
    "ruleVersion" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeuroDigitalPeriodScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreFormulaVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sportWeight" DECIMAL(5,4) NOT NULL,
    "neuroWeight" DECIMAL(5,4) NOT NULL,
    "config" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreFormulaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerScoreSnapshot" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "formulaVersionId" TEXT NOT NULL,
    "sportScore" DECIMAL(5,2),
    "neuroScore" DECIMAL(5,2),
    "elevenScore" DECIMAL(5,2),
    "calculationStatus" "ScoreCalculationStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "sourceSummary" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "markedAt" TIMESTAMP(3),
    "notes" TEXT,
    "correctionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakRuleVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "attendanceWeight" DECIMAL(5,4) NOT NULL,
    "neurocracksWeight" DECIMAL(5,4) NOT NULL,
    "challengeWeight" DECIMAL(5,4) NOT NULL,
    "petWeight" DECIMAL(5,4) NOT NULL,
    "validationWeight" DECIMAL(5,4) NOT NULL,
    "componentConfig" JSONB,
    "verifiedWeekThreshold" DECIMAL(5,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakEvidence" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "StreakEvidenceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "StreakEvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "correctionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakPeriodResult" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "ruleVersionId" TEXT NOT NULL,
    "attendanceComponent" DECIMAL(5,2),
    "neurocracksComponent" DECIMAL(5,2),
    "challengeComponent" DECIMAL(5,2),
    "petComponent" DECIMAL(5,2),
    "validationComponent" DECIMAL(5,2),
    "streakScore" DECIMAL(5,2),
    "verifiedWeek" BOOLEAN,
    "calculationStatus" "ScoreCalculationStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "sourceSummary" JSONB,
    "manualOverride" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakPeriodResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currencyFrom" TEXT NOT NULL,
    "currencyTo" TEXT NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overriddenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetBatch" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "status" "PetBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "dispatchDate" TIMESTAMP(3),
    "dispatchedBy" TEXT,
    "bottlesSent" INTEGER,
    "estimatedKg" DECIMAL(12,3),
    "processorName" TEXT,
    "receivedAt" TIMESTAMP(3),
    "realKg" DECIMAL(12,3),
    "weighingDocumentUrl" TEXT,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "correctionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetContribution" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT,
    "sessionId" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "bottlesCount" INTEGER NOT NULL,
    "estimatedKg" DECIMAL(12,3),
    "batchId" TEXT,
    "status" "PetContributionStatus" NOT NULL DEFAULT 'COLLECTED',
    "notes" TEXT,
    "importBatchId" TEXT,
    "sourceRowNumber" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "correctionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetSettlement" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "PetSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "realKg" DECIMAL(12,3) NOT NULL,
    "copPaid" DECIMAL(18,2) NOT NULL,
    "pricePerKg" DECIMAL(18,4),
    "exchangeRateId" TEXT,
    "usdReference" DECIMAL(18,2),
    "paymentReference" TEXT,
    "settlementDocumentUrl" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" TEXT,
    "correctionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinRuleVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sourceType" "CoinSourceType" NOT NULL,
    "sourceEvent" TEXT,
    "config" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrackCoinLedger" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceType" "CoinSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "ruleVersionId" TEXT,
    "coinDelta" INTEGER NOT NULL,
    "status" "CoinLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdBy" TEXT NOT NULL,
    "correctionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrackCoinLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCorrection" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT,
    "originalValue" JSONB,
    "requestedValue" JSONB,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "replacementRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "clubId" TEXT,
    "importType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'UPLOADED',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRowError" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "sourceRowKey" TEXT,
    "rawData" JSONB NOT NULL,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "correctedData" JSONB,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'ERROR',
    "correctedBy" TEXT,
    "correctedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRowError_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "EvaluationDimensionDefinition_group_active_idx" ON "EvaluationDimensionDefinition"("group", "active");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationDimensionDefinition_key_version_key" ON "EvaluationDimensionDefinition"("key", "version");

-- CreateIndex
CREATE INDEX "CoachEvaluation_clubId_playerId_periodStart_idx" ON "CoachEvaluation"("clubId", "playerId", "periodStart");

-- CreateIndex
CREATE INDEX "CoachEvaluation_coachId_status_idx" ON "CoachEvaluation"("coachId", "status");

-- CreateIndex
CREATE INDEX "CoachEvaluation_clubId_playerId_periodStart_status_idx" ON "CoachEvaluation"("clubId", "playerId", "periodStart", "status");

-- CreateIndex
CREATE INDEX "CoachEvaluationItem_dimensionId_idx" ON "CoachEvaluationItem"("dimensionId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachEvaluationItem_evaluationId_dimensionId_key" ON "CoachEvaluationItem"("evaluationId", "dimensionId");

-- CreateIndex
CREATE INDEX "NeuroDigitalPeriodScore_clubId_playerId_periodEnd_idx" ON "NeuroDigitalPeriodScore"("clubId", "playerId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "NeuroDigitalPeriodScore_playerId_dimensionId_periodStart_pe_key" ON "NeuroDigitalPeriodScore"("playerId", "dimensionId", "periodStart", "periodEnd", "ruleVersion");

-- CreateIndex
CREATE INDEX "ScoreFormulaVersion_status_effectiveFrom_idx" ON "ScoreFormulaVersion"("status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreFormulaVersion_version_key" ON "ScoreFormulaVersion"("version");

-- CreateIndex
CREATE INDEX "PlayerScoreSnapshot_clubId_playerId_periodEnd_idx" ON "PlayerScoreSnapshot"("clubId", "playerId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerScoreSnapshot_playerId_periodStart_periodEnd_formulaV_key" ON "PlayerScoreSnapshot"("playerId", "periodStart", "periodEnd", "formulaVersionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_clubId_playerId_createdAt_idx" ON "AttendanceRecord"("clubId", "playerId", "createdAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_coachId_sessionId_idx" ON "AttendanceRecord"("coachId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_playerId_key" ON "AttendanceRecord"("sessionId", "playerId");

-- CreateIndex
CREATE INDEX "StreakRuleVersion_status_effectiveFrom_idx" ON "StreakRuleVersion"("status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "StreakRuleVersion_version_key" ON "StreakRuleVersion"("version");

-- CreateIndex
CREATE INDEX "StreakEvidence_clubId_playerId_occurredAt_idx" ON "StreakEvidence"("clubId", "playerId", "occurredAt");

-- CreateIndex
CREATE INDEX "StreakEvidence_type_sourceId_idx" ON "StreakEvidence"("type", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "StreakEvidence_idempotencyKey_key" ON "StreakEvidence"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StreakPeriodResult_clubId_playerId_periodEnd_idx" ON "StreakPeriodResult"("clubId", "playerId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "StreakPeriodResult_playerId_periodStart_periodEnd_ruleVersi_key" ON "StreakPeriodResult"("playerId", "periodStart", "periodEnd", "ruleVersionId");

-- CreateIndex
CREATE INDEX "ExchangeRate_effectiveDate_idx" ON "ExchangeRate"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currencyFrom_currencyTo_effectiveDate_source_key" ON "ExchangeRate"("currencyFrom", "currencyTo", "effectiveDate", "source");

-- CreateIndex
CREATE INDEX "PetBatch_clubId_status_idx" ON "PetBatch"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PetBatch_batchCode_key" ON "PetBatch"("batchCode");

-- CreateIndex
CREATE INDEX "PetContribution_clubId_recordedAt_idx" ON "PetContribution"("clubId", "recordedAt");

-- CreateIndex
CREATE INDEX "PetContribution_playerId_recordedAt_idx" ON "PetContribution"("playerId", "recordedAt");

-- CreateIndex
CREATE INDEX "PetContribution_batchId_idx" ON "PetContribution"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "PetContribution_idempotencyKey_key" ON "PetContribution"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PetSettlement_batchId_key" ON "PetSettlement"("batchId");

-- CreateIndex
CREATE INDEX "PetSettlement_clubId_status_idx" ON "PetSettlement"("clubId", "status");

-- CreateIndex
CREATE INDEX "PetSettlement_settledAt_idx" ON "PetSettlement"("settledAt");

-- CreateIndex
CREATE INDEX "CoinRuleVersion_sourceType_status_effectiveFrom_idx" ON "CoinRuleVersion"("sourceType", "status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "CoinRuleVersion_version_sourceType_key" ON "CoinRuleVersion"("version", "sourceType");

-- CreateIndex
CREATE INDEX "CrackCoinLedger_clubId_playerId_occurredAt_idx" ON "CrackCoinLedger"("clubId", "playerId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrackCoinLedger_sourceType_sourceId_idx" ON "CrackCoinLedger"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CrackCoinLedger_idempotencyKey_key" ON "CrackCoinLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DataCorrection_entityType_entityId_idx" ON "DataCorrection"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DataCorrection_status_requestedAt_idx" ON "DataCorrection"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "ImportBatch_clubId_uploadedAt_idx" ON "ImportBatch"("clubId", "uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_fileHash_importType_key" ON "ImportBatch"("fileHash", "importType");

-- CreateIndex
CREATE INDEX "ImportRowError_importBatchId_rowNumber_idx" ON "ImportRowError"("importBatchId", "rowNumber");

-- CreateIndex
CREATE INDEX "ImportRowError_status_idx" ON "ImportRowError"("status");
-- AddForeignKey
ALTER TABLE "CoachEvaluation" ADD CONSTRAINT "CoachEvaluation_supersedesEvaluationId_fkey" FOREIGN KEY ("supersedesEvaluationId") REFERENCES "CoachEvaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEvaluationItem" ADD CONSTRAINT "CoachEvaluationItem_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "CoachEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEvaluationItem" ADD CONSTRAINT "CoachEvaluationItem_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "EvaluationDimensionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeuroDigitalPeriodScore" ADD CONSTRAINT "NeuroDigitalPeriodScore_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "EvaluationDimensionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerScoreSnapshot" ADD CONSTRAINT "PlayerScoreSnapshot_formulaVersionId_fkey" FOREIGN KEY ("formulaVersionId") REFERENCES "ScoreFormulaVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakPeriodResult" ADD CONSTRAINT "StreakPeriodResult_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "StreakRuleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetContribution" ADD CONSTRAINT "PetContribution_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PetBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetSettlement" ADD CONSTRAINT "PetSettlement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PetBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetSettlement" ADD CONSTRAINT "PetSettlement_exchangeRateId_fkey" FOREIGN KEY ("exchangeRateId") REFERENCES "ExchangeRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackCoinLedger" ADD CONSTRAINT "CrackCoinLedger_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "CoinRuleVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackCoinLedger" ADD CONSTRAINT "CrackCoinLedger_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "CrackCoinLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRowError" ADD CONSTRAINT "ImportRowError_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;