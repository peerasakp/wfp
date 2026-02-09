-- Migration: Add file columns to reimbursements_children_education
-- Date: 2026-02-04
-- Description: Adds file upload columns for children education welfare evidence

ALTER TABLE `reimbursements_children_education`
ADD COLUMN IF NOT EXISTS `file_receipt` VARCHAR(255) NULL AFTER `categories_id`,
ADD COLUMN IF NOT EXISTS `file_id_card` VARCHAR(255) NULL AFTER `file_receipt`,
ADD COLUMN IF NOT EXISTS `file_birth_certificate` VARCHAR(255) NULL AFTER `file_id_card`,
ADD COLUMN IF NOT EXISTS `file_document` VARCHAR(255) NULL AFTER `file_birth_certificate`;
