-- Migration: Ensure all file columns exist on reimbursements_general
-- Run this if your DB was created before these columns were in the dump.
-- Adds: file_receipt, file_medical_certificate, file_supervisor_letter,
--       file_receipt_patient_visit, file_medical_certificate_patient_visit

-- Add file_receipt and file_medical_certificate if missing (ignore errors if they exist)
ALTER TABLE `reimbursements_general`
ADD COLUMN IF NOT EXISTS `file_receipt` VARCHAR(255) NULL AFTER `categories_id`,
ADD COLUMN IF NOT EXISTS `file_medical_certificate` VARCHAR(255) NULL AFTER `file_receipt`;

-- Add the three medical welfare evidence columns if missing
ALTER TABLE `reimbursements_general`
ADD COLUMN IF NOT EXISTS `file_supervisor_letter` VARCHAR(255) NULL AFTER `file_medical_certificate`,
ADD COLUMN IF NOT EXISTS `file_receipt_patient_visit` VARCHAR(255) NULL AFTER `file_supervisor_letter`,
ADD COLUMN IF NOT EXISTS `file_medical_certificate_patient_visit` VARCHAR(255) NULL AFTER `file_receipt_patient_visit`;
