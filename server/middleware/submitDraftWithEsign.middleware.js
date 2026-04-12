const { Op } = require('sequelize');
const status = require('../enum/status');
const statusText = require('../enum/statusText');
const category = require('../enum/category');
const {
    reimbursementsGeneral,
    reimbursementsAssist,
    reimbursementsEmployeeDeceased,
    reimbursementsChildrenEducation,
} = require('../models/mariadb');

/**
 * หลังอัปเดตคำร้องเป็นส่งคำร้อง (waitApprove) จากฉบับร่าง และยังไม่มี document_path
 * ให้ส่งต่อไปยัง middleware สร้าง PDF + ลายเซ็น (เหมือน POST)
 */
function tryContinueSubmitDraftEsign(req, res, next, { dataId, dataUpdate }) {
    if (req._submitEsignAlreadyContinued) return false;
    if (!req._submitEsignCtx || !dataUpdate) return false;
    const submitting = dataUpdate.status === status.waitApprove;
    const fromDraft = req._submitEsignCtx.beforeStatus === statusText.draft;
    if (!submitting || !fromDraft || req._submitEsignCtx.hadDocumentPath) {
        return false;
    }
    req._submitEsignAlreadyContinued = true;
    req.createdId = Number(dataId);
    next();
    return true;
}

/**
 * POST สร้างคำร้อง: ถ้าเป็นฉบับร่าง ไม่ต้องเข้า export PDF + e-sign
 * (middleware fetch ข้อมูลสำหรับ PDF ค้นหาเฉพาะสถานะรอตรวจสอบ — ร่างจะได้ message "ไม่พบข้อมูล" แม้บันทึก DB สำเร็จ)
 */
function respondDraftCreateWithoutEsign(req, res, next) {
    if (req.body?.status == status.draft && req.createdId) {
        return res.status(201).json({
            newItem: { id: req.createdId },
            message: 'บันทึกฉบับร่างสำเร็จ',
        });
    }
    next();
}

const prepareGeneralSubmitEsign = (categories_id) => async (req, res, next) => {
    try {
        const row = await reimbursementsGeneral.findOne({
            where: { id: req.params.id, categories_id },
            attributes: ['document_path', 'status'],
        });
        req._submitEsignCtx = row
            ? {
                  hadDocumentPath: !!(row.document_path && String(row.document_path).trim()),
                  beforeStatus: row.status,
              }
            : null;
        next();
    } catch (e) {
        next(e);
    }
};

const prepareAssistVariousSubmitEsign = async (req, res, next) => {
    try {
        const row = await reimbursementsAssist.findOne({
            where: {
                id: req.params.id,
                categories_id: { [Op.ne]: category.variousFuneralFamily },
            },
            attributes: ['document_path', 'status'],
        });
        req._submitEsignCtx = row
            ? {
                  hadDocumentPath: !!(row.document_path && String(row.document_path).trim()),
                  beforeStatus: row.status,
              }
            : null;
        next();
    } catch (e) {
        next(e);
    }
};

const prepareAssistFamilySubmitEsign = async (req, res, next) => {
    try {
        const row = await reimbursementsAssist.findOne({
            where: { id: req.params.id, categories_id: category.variousFuneralFamily },
            attributes: ['document_path', 'status'],
        });
        req._submitEsignCtx = row
            ? {
                  hadDocumentPath: !!(row.document_path && String(row.document_path).trim()),
                  beforeStatus: row.status,
              }
            : null;
        next();
    } catch (e) {
        next(e);
    }
};

const prepareFuneralEmployeeSubmitEsign = async (req, res, next) => {
    try {
        const row = await reimbursementsEmployeeDeceased.findByPk(req.params.id, {
            attributes: ['document_path', 'status'],
        });
        req._submitEsignCtx = row
            ? {
                  hadDocumentPath: !!(row.document_path && String(row.document_path).trim()),
                  beforeStatus: row.status,
              }
            : null;
        next();
    } catch (e) {
        next(e);
    }
};

const prepareChildrenEducationSubmitEsign = async (req, res, next) => {
    try {
        const row = await reimbursementsChildrenEducation.findByPk(req.params.id, {
            attributes: ['document_path', 'status'],
        });
        req._submitEsignCtx = row
            ? {
                  hadDocumentPath: !!(row.document_path && String(row.document_path).trim()),
                  beforeStatus: row.status,
              }
            : null;
        next();
    } catch (e) {
        next(e);
    }
};

module.exports = {
    tryContinueSubmitDraftEsign,
    respondDraftCreateWithoutEsign,
    prepareGeneralSubmitEsign,
    prepareAssistVariousSubmitEsign,
    prepareAssistFamilySubmitEsign,
    prepareFuneralEmployeeSubmitEsign,
    prepareChildrenEducationSubmitEsign,
};
