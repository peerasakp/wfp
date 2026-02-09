-- Migration: Add file_death_certificate column to reimbursements_assist for funeral family evidence
-- Date: 2026-02-04
-- Description: Adds file_death_certificate column for สำเนาใบมรณะบัตร

ALTER TABLE `reimbursements_assist`
ADD COLUMN IF NOT EXISTS `file_death_certificate` VARCHAR(255) NULL AFTER `file_house_registration`;
