-- Migration: Add file_social_security column to reimbursements_general
-- Date: 2026-02-04
-- Description: Adds file_social_security column for dental welfare social security benefit evidence

ALTER TABLE `reimbursements_general`
ADD COLUMN IF NOT EXISTS `file_social_security` VARCHAR(255) NULL AFTER `file_medical_certificate_patient_visit`;
