-- Migration: Add file columns to reimbursements_general table
-- Date: 2025-12-17
-- Description: Adds file_receipt and file_medical_certificate columns for health checkup welfare file uploads

ALTER TABLE `reimbursements_general` 
ADD COLUMN `file_receipt` VARCHAR(255) NULL AFTER `categories_id`,
ADD COLUMN `file_medical_certificate` VARCHAR(255) NULL AFTER `file_receipt`;

