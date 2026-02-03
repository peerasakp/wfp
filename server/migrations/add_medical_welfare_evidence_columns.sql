-- Migration: Add medical welfare evidence file columns to reimbursements_general
-- Date: 2026-02-04
-- Description: Adds file_supervisor_letter, file_receipt_patient_visit, file_medical_certificate_patient_visit for full evidence upload (accident + patient visit)

ALTER TABLE `reimbursements_general`
ADD COLUMN `file_supervisor_letter` VARCHAR(255) NULL AFTER `file_medical_certificate`,
ADD COLUMN `file_receipt_patient_visit` VARCHAR(255) NULL AFTER `file_supervisor_letter`,
ADD COLUMN `file_medical_certificate_patient_visit` VARCHAR(255) NULL AFTER `file_receipt_patient_visit`;
