-- Migration: Add file columns to reimbursements_assist for various welfare evidence uploads
-- Date: 2026-02-04
-- Description: Adds file_receipt, file_document, file_photo, file_house_registration columns

ALTER TABLE `reimbursements_assist`
ADD COLUMN IF NOT EXISTS `file_receipt` VARCHAR(255) NULL AFTER `categories_id`,
ADD COLUMN IF NOT EXISTS `file_document` VARCHAR(255) NULL AFTER `file_receipt`,
ADD COLUMN IF NOT EXISTS `file_photo` VARCHAR(255) NULL AFTER `file_document`,
ADD COLUMN IF NOT EXISTS `file_house_registration` VARCHAR(255) NULL AFTER `file_photo`;
