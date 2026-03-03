const { isNullOrEmpty, getFiscalYear, getYear2Digits, formatNumber, isInvalidNumber, dynamicCheckRemaining } = require('../middleware/utility');
const { initLogger } = require('../logger');
const logger = initLogger('DentalValidator');
const { Op, literal, col, fn } = require('sequelize')
const permissionType = require('../enum/permission')
const statusText = require('../enum/statusText')
const status = require('../enum/status')
const category = require('../enum/category');
const welfareType = require('../enum/welfareType');
const { permissionsHasRoles, reimbursementsGeneral, categories, subCategories, reimbursementsGeneralHasSubCategories,users, sequelize } = require('../models/mariadb')
const { sendMail } = require('../helper/mail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration for medical welfare
const fileFolder = path.join(__dirname, '..', 'public', 'upload', 'medical-welfare');
if (!fs.existsSync(fileFolder)) {
    fs.mkdirSync(fileFolder, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, fileFolder);
    },
    filename: function (req, file, callback) {
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        callback(null, Date.now() + '-' + file.fieldname + '-' + originalname);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('อัปโหลดได้เฉพาะ PDF, JPG, JPEG, PNG เท่านั้น'), false);
    }
};
const uploadFiles = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
}).fields([
    { name: 'fileReceipt', maxCount: 1 },
    { name: 'fileMedicalCertificate', maxCount: 1 },
    { name: 'fileSupervisorLetter', maxCount: 1 },
    { name: 'fileReceiptPatientVisit', maxCount: 1 },
    { name: 'fileMedicalCertificatePatientVisit', maxCount: 1 }
]);

const authPermission = async (req, res, next) => {
    const method = 'AuthPermission';
    const { roleId } = req.user;
    try {
        const isAccess = await permissionsHasRoles.count({
            where: {
                [Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.generalWelfare }],
            },
        });
        const isEditor = await permissionsHasRoles.count({
            where: {
                [Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.welfareManagement }],
            },
        });
        if (!isAccess && !isEditor) {
            throw Error("You don't have access to this API");
        }
        if (isEditor) req.isEditor = true;
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(401).json({ message: error.message });
    }
};
const authPermissionEditor = async (req, res, next) => {
    const method = 'AuthPermissionEditor';
    const { roleId } = req.user;
    try {
        const isAccess = await permissionsHasRoles.count({
            where: {
                [Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.welfareManagement }],
            },
        });
        if (!isAccess) {
            throw Error("You don't have access to this API");
        }
        req.access = true;
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(401).json({ error: error.message });
    }
};
const bindFilter = async (req, res, next) => {
    const method = 'BindFilter';
    const { id } = req.user;
    try {
        const { keyword, from, to, status } = req.query;
        req.query.filter = {};
        req.query.filter[Op.and] = [];
        if (!isNullOrEmpty(keyword)) {
            req.query.filter[Op.and].push({
                '$reimbursementsGeneral.reim_number$': { [Op.like]: `%${keyword}%` },
            });
        }
        if (!isNullOrEmpty(from) && !isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$reimbursementsGeneral.request_date$': { [Op.between]: [from, to] },
            });
        }
        if (!isNullOrEmpty(from) && isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$reimbursementsGeneral.request_date$': { [Op.eq]: from },
            });
        }
        if (!isNullOrEmpty(status)) {
            req.query.filter[Op.and].push({
                '$reimbursementsGeneral.status$': { [Op.eq]: status },
            });
        }
        req.query.filter[Op.and].push({
            '$reimbursementsGeneral.created_by$': { [Op.eq]: id },
            '$reimbursementsGeneral.categories_id$': { [Op.eq]: category.medicalWelfare },
        });
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(400).json({ message: error.message });
    }
};
const byIdMiddleWare = async (req, res, next) => {
    const method = 'ByIdMiddleware';
    const dataId = req.params['id'];
    const { id } = req.user;
    try {
        req.query.filter = {};
        req.query.filter[Op.and] = [];
        if (req.access) {
            req.query.filter[Op.and].push(
                { '$reimbursementsGeneral.id$': { [Op.eq]: dataId } },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursementsGeneral.id$': { [Op.eq]: dataId } },
                { '$reimbursementsGeneral.created_by$': { [Op.eq]: id }, }
            );
        }
        req.query.filter[Op.and].push(
            {
                '$reimbursementsGeneral.categories_id$': { [Op.eq]: category.medicalWelfare },
            }
        );
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(400).json({ message: error.message });
    }
};
const checkNullValue = async (req, res, next) => {
    try {
        const { fundReceipt, fundEligible, fundReceiptPatientVisit, fundSumRequestPatientVisit, selectedAccident, selectedPatientVisit, startDate, endDate, actionId } = req.body;
        if (req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)) {
            return next();
        }
        const errorObj = {};
        if (!selectedAccident && !selectedPatientVisit) {
            return res.status(400).json({
                message: "กรุณาเลือกอย่างน้อย 1 สวัสดิการสำหรับเบิก",
            });
        }
        if (selectedAccident) {
            if (isNullOrEmpty(fundReceipt)) {
                errorObj["fundReceipt"] = "กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน";
            } else if (isInvalidNumber(fundReceipt)) {
                errorObj["fundReceipt"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundReceipt <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินตามใบสำคัญรับเงินน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }

            if (isNullOrEmpty(fundEligible)) {
                errorObj["fundEligible"] = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
            } else if (isInvalidNumber(fundEligible)) {
                errorObj["fundEligible"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundEligible <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (Number(fundEligible) > Number(fundReceipt)) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบสำคัญรับเงินได้",
                });
            }
        }
        else {
            req.body = {
                ...req.body,
                fundReceipt: null,
                fundEligible: null,
            }
        }
        if (selectedPatientVisit) {
            if (isNullOrEmpty(fundReceiptPatientVisit)) {
                errorObj["fundReceiptPatientVisit"] = "กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน";
            } else if (isInvalidNumber(fundReceiptPatientVisit)) {
                errorObj["fundReceiptPatientVisit"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundReceiptPatientVisit <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินตามใบสำคัญรับเงินน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (isNullOrEmpty(fundSumRequestPatientVisit)) {
                errorObj["fundSumRequestPatientVisit"] = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
            } else if (isInvalidNumber(fundSumRequestPatientVisit)) {
                errorObj["fundSumRequestPatientVisit"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundSumRequestPatientVisit <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (isNullOrEmpty(startDate)) {
                errorObj["startDate"] = "กรุณากรอก วัน/เดือน/ปี ตั้งแ่วันที่";
            }
            if (isNullOrEmpty(endDate)) {
                errorObj["endDate"] = "กรุณากรอก วัน/เดือน/ปี ถึงวันที่";
            }
            if (Number(fundSumRequestPatientVisit) > Number(fundReceiptPatientVisit)) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบสำคัญรับเงินได้",
                });
            }
        }
        else {
            req.body = {
                ...req.body,
                fundReceiptPatientVisit: null,
                fundSumRequestPatientVisit: null,
                startDate: null,
                endDate: null,
            }
        }
        if ((isNullOrEmpty(actionId) || (actionId != status.draft && actionId != status.waitApprove)) && !req.access) {
            return res.status(400).json({
                message: "ไม่มีการกระทำที่ต้องการ",
            });
        }
        if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
        var fundSumRequest = Number(fundEligible) + Number(fundSumRequestPatientVisit);
        var fundEligibleSum = Number(fundReceipt) + Number(fundReceiptPatientVisit);
        req.body = {
            ...req.body,
            fundEligibleSum: fundEligibleSum,
            fundSumRequest: fundSumRequest,
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
}

const bindCreate = async (req, res, next) => {
    try {
        const {
            fundReceipt, fundEligible, selectedAccident, selectedPatientVisit,
            fundReceiptPatientVisit, fundSumRequestPatientVisit,
            fundEligibleSum, fundSumRequest, startDate, endDate,
            createFor, actionId
        } = req.body;
        const { id } = req.user;
        if (!isNullOrEmpty(createFor) && !req.isEditor) {
            return res.status(400).json({
                message: "ไม่มีสิทธิ์สร้างให้คนอื่นได้",
            });
        }
        if (!isNullOrEmpty(createFor) && actionId == status.draft && createFor !== id) {
            return res.status(400).json({
                message: "กรณีเบิกให้ผู้อื่น ไม่สามารถบันทึกฉบับร่างได้",
            });
        }
        const results = await reimbursementsGeneral.findOne({
            attributes: ["id"],
            order: [["id", "DESC"]]
        });
        var reimNumber = getYear2Digits() + formatNumber(welfareType.general) + formatNumber(category.medicalWelfare) + formatNumber(1);
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            reimNumber = getYear2Digits() + formatNumber(welfareType.general) + formatNumber(category.medicalWelfare) + formatNumber(Number(datas.id) + 1);
        }
        const dataBinding = {
            reim_number: reimNumber,
            selected_accident: selectedAccident,
            selected_patient_visit: selectedPatientVisit,
            fund_receipt: fundReceipt,
            fund_eligible: fundEligible,
            fund_receipt_patient_visit: fundReceiptPatientVisit,
            fund_sum_request_patient_visit: fundSumRequestPatientVisit,
            start_date: startDate,
            end_date: endDate,
            fund_sum_request: fundSumRequest,
            fund_eligible_sum: fundEligibleSum,
            created_by: createFor ?? id,
            updated_by: id,
            status: actionId,
            request_date: actionId === status.waitApprove ? new Date() : null,
            categories_id: category.medicalWelfare,
        }
        req.body = dataBinding;
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
};
const bindUpdate = async (req, res, next) => {
    try {
        const {
            fundReceipt, fundEligible, selectedAccident, selectedPatientVisit,
            fundReceiptPatientVisit, fundSumRequestPatientVisit,
            fundEligibleSum, fundSumRequest, startDate, endDate,
            createFor, actionId
        } = req.body;
        const { id, roleId } = req.user;
        if (!isNullOrEmpty(createFor) && !req.isEditor) {
            return res.status(400).json({
                message: "ไม่มีสิทธิ์แก้ไขให้คนอื่นได้",
            });
        }
        if (!isNullOrEmpty(createFor) && actionId == status.draft && createFor !== id) {
            return res.status(400).json({
                message: "กรณีเบิกให้ผู้อื่น ไม่สามารถบันทึกฉบับร่างได้",
            });
        }
        const dataId = req.params['id'];
        const results = await reimbursementsGeneral.findOne({
            attributes: ["status", "created_by"],
            where: { id: dataId, categories_id: category.medicalWelfare },
        });
        var createByData;
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            createByData = datas.created_by;
            if (!req.access && datas.created_by !== id) {
                return res.status(400).json({
                    message: "ไม่มีสิทธิ์แก้ไขให้คนอื่นได้",
                });
            }
            if (!req.access && datas.status !== statusText.draft) {
                return res.status(400).json({
                    message: "ไม่สามารถแก้ไขได้ เนื่องจากสถานะไม่ถูกต้อง",
                });
            }
            if (req.access && (datas.status != (roleId === 5 ? statusText.waitFinalApprove : statusText.waitApprove))) {
                return res.status(400).json({
                    message: "ไม่สามารถแก้ไขได้ เนื่องจากสถานะไม่ถูกต้อง",
                });
            }
            if (req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)) {
                const statusId = actionId === status.approve && roleId === 2
                    ? status.waitFinalApprove
                    : actionId;
                const dataBinding = {
                    status: statusId,
                    updated_by: id,
                }
                req.body = dataBinding;
                return next();
            }
        }
        else {
            return res.status(400).json({
                message: "ไม่พบข้อมูล",
            });
        }
        const dataBinding = {
            selected_accident: selectedAccident,
            selected_patient_visit: selectedPatientVisit,
            fund_receipt: fundReceipt,
            fund_eligible: fundEligible,
            fund_receipt_patient_visit: fundReceiptPatientVisit,
            fund_sum_request_patient_visit: fundSumRequestPatientVisit,
            start_date: startDate,
            end_date: endDate,
            fund_sum_request: fundSumRequest,
            fund_eligible_sum: fundEligibleSum,
            updated_by: id,
        }
        if (!isNullOrEmpty(actionId)) {
            dataBinding.status = actionId;
            if (actionId === status.waitApprove) {
                dataBinding.request_date = new Date();
            }
        }
        if (!isNullOrEmpty(createFor) && !req.access) {
            dataBinding.created_by = createFor;
        }
        if (!isNullOrEmpty(createByData) && req.access) {
            dataBinding.createByData = createByData;
        }
        req.body = dataBinding;
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
};
const getRemaining = async (req, res, next) => {
    const method = 'RemainingMiddleware';
    try {
        const { id } = req.user;
        const { createFor } = req.query;
        const { created_by, createByData } = req.body;
        if(req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)){
            return next();
        }
        req.query.filter = {};
        req.query.filter[Op.and] = [];
        const getFiscalYearWhere = getFiscalYear();
        if (req.access && !isNullOrEmpty(createByData)) {
            req.query.filter[Op.and].push(
                { '$reimbursements_general.created_by$': createByData },
            );
        }
        else if (!isNullOrEmpty(created_by) && req.isEditor) {
            req.query.filter[Op.and].push(
                { '$reimbursements_general.created_by$': created_by },
            );
        }
        else if (!isNullOrEmpty(createFor) && req.isEditor) {
            req.query.filter[Op.and].push(
                { '$reimbursements_general.created_by$': createFor },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursements_general.created_by$': id },
            );
        }
        req.query.filter[Op.and].push(
            { '$reimbursements_general.request_date$': getFiscalYearWhere },
            { '$reimbursements_general.categories_id$': category.medicalWelfare },
            { '$reimbursements_general.status$': { [Op.eq]: status.approve } }
        );
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(400).json({ message: error.message });
    }
};
const checkUpdateRemaining = async (req, res, next) => {
    const method = 'CheckUpdateRemainingMiddleware';
    try {
        const { filter } = req.query;
        const dataId = req.params['id'];
        var whereObj = { ...filter }
        const { fund_eligible, fund_sum_request_patient_visit } = req.body;
        const welfareCheckData = await reimbursementsGeneral.findOne({
            attributes: ["fund_eligible", "fund_sum_request_patient_visit", "reim_number"],
            include: [
                {
                  model: users,
                  as: "created_by_user",
                  attributes: ['name','email'],
                }
            ],
            where: { id: dataId, categories_id: category.medicalWelfare },
        });
        if (!welfareCheckData) {
            return res.status(400).json({
                message: "ไม่พบข้อมูล",
            });
        }
        const oldWelfareData = JSON.parse(JSON.stringify(welfareCheckData));
        if(req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)){
            sendMail(oldWelfareData.created_by_user.email,oldWelfareData.reim_number,req.body.status,oldWelfareData.created_by_user.name);
            return next();
        }
        whereObj[Op.and].push(
            { '$sub_category.id$': 1 },
        );
        const accidentRemaining = await reimbursementsGeneralHasSubCategories.findAll({
            attributes: [
                [
                    literal("sub_category.fund - SUM(reimbursements_general.fund_eligible)"),
                    "fundRemaining"
                ],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_general.fund_eligible)"),
                    "requestsRemaining"
                ],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_general.fund_eligible)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
                {
                    model: reimbursementsGeneral,
                    as: "reimbursements_general",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        whereObj[Op.and] = whereObj[Op.and].filter(item => item['$sub_category.id$'] !== 1);
        whereObj[Op.and].push(
            { '$sub_category.id$': 2 },
        );
        const patientVisitRemaining = await reimbursementsGeneralHasSubCategories.findAll({
            attributes: [
                [
                    literal("sub_category.fund - SUM(reimbursements_general.fund_sum_request_patient_visit)"),
                    "fundRemaining"
                ],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_general.fund_sum_request_patient_visit)"),
                    "requestsRemaining"
                ],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_general.fund_sum_request_patient_visit)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
                {
                    model: reimbursementsGeneral,
                    as: "reimbursements_general",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });

        if (!isNullOrEmpty(accidentRemaining) || !isNullOrEmpty(patientVisitRemaining)) {
            if (!isNullOrEmpty(accidentRemaining)) {
                const datas = JSON.parse(JSON.stringify(accidentRemaining[0]));
                if (fund_eligible < oldWelfareData.fund_eligible) {
                    return next();
                }
                else if (fund_eligible > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFund = fund_eligible - oldWelfareData.fund_eligible;
                    if ((datas.fundRemaining === 0 || datas.fundRemaining - diffFund < 0) && !isNullOrEmpty(datas.fundRemaining)) {
                        return res.status(400).json({
                            message: "ไม่สามารถทำรายการได้เนื่องจากเกินเพดานเงินคงเหลือ",
                        });
                    }
                }
            }
            if (!isNullOrEmpty(patientVisitRemaining)) {
                const datas = JSON.parse(JSON.stringify(patientVisitRemaining[0]));
                if (fund_sum_request_patient_visit < oldWelfareData.fund_sum_request_patient_visit) {
                    return next();
                }
                else if (fund_sum_request_patient_visit > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFund = fund_sum_request_patient_visit - oldWelfareData.fund_sum_request_patient_visit;
                    if ((datas.fundRemaining === 0 || datas.fundRemaining - diffFund < 0) && !isNullOrEmpty(datas.fundRemaining)) {
                        return res.status(400).json({
                            message: "ไม่สามารถทำรายการได้เนื่องจากเกินเพดานเงินคงเหลือ",
                        });
                    }
                }
            }
        };
        sendMail(oldWelfareData.created_by_user.email,oldWelfareData.reim_number,req.body.status,oldWelfareData.created_by_user.name);
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        next(error);
    }
}
const checkFullPerTimes = async (req, res, next) => {
    const method = 'CheckFullPerTimes';
    try {
        const { fund_eligible, fund_sum_request_patient_visit } = req.body;
        if(req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)){
            return next();
        }
        const getFund = await subCategories.findAll({
            attributes: [
                [col("id"), "subCategoriesId"],
                [col("name"), "subCategoriesName"],
                [col("fund"), "fundRemaining"],
                [col("per_years"), "requestsRemaining"],
                [col("per_times"), "perTimesRemaining"],
            ],
            where: {
                id: {
                    [Op.in]: [1, 2]
                }
            }
        })
        if (!isNullOrEmpty(getFund)) {
            const datasAccident = JSON.parse(JSON.stringify(getFund[0]));
            const datasPatientVisit = JSON.parse(JSON.stringify(getFund[1]));
            if (fund_eligible > datasAccident.perTimes && !isNullOrEmpty(datasAccident.perTimes)) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการประสบอุบัติเหตุขณะปฏิบัติงานได้สูงสุด " + datasAccident.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_eligible > datasAccident.fundRemaining && !isNullOrEmpty(datasAccident.fundRemaining)) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการประสบอุบัติเหตุขณะปฏิบัติงานเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }
            if (fund_sum_request_patient_visit > datasPatientVisit.perTimes && !isNullOrEmpty(datasPatientVisit.perTimes)) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเยี่ยมไข้ผู้ปฏิบัติงาน " + datasPatientVisit.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_sum_request_patient_visit > datasPatientVisit.fundRemaining && !isNullOrEmpty(datasPatientVisit.fundRemaining)) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการเยี่ยมไข้ผู้ปฏิบัติงานเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }
        }
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        next(error);
    }
}
const checkRemaining = async (req, res, next) => {
    const method = 'CheckRemainingMiddleware';
    try {
        const { status, fund_eligible, fund_sum_request_patient_visit } = req.body;
        const { filter } = req.query;
        var whereObj = { ...filter }
        whereObj[Op.and].push(
            { '$sub_category.id$': 1 },
        );
        const accidentRemaining = await reimbursementsGeneralHasSubCategories.findAll({
            attributes: [
                [
                    literal("sub_category.fund - SUM(reimbursements_general.fund_eligible)"),
                    "fundRemaining"
                ],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_general.fund_eligible)"),
                    "requestsRemaining"
                ],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_general.fund_eligible)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
                {
                    model: reimbursementsGeneral,
                    as: "reimbursements_general",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        whereObj[Op.and] = whereObj[Op.and].filter(item => item['$sub_category.id$'] !== 1);
        whereObj[Op.and].push(
            { '$sub_category.id$': 2 },
        );
        const patientVisitRemaining = await reimbursementsGeneralHasSubCategories.findAll({
            attributes: [
                [
                    literal("sub_category.fund - SUM(reimbursements_general.fund_sum_request_patient_visit)"),
                    "fundRemaining"
                ],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_general.fund_sum_request_patient_visit)"),
                    "requestsRemaining"
                ],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_general.fund_sum_request_patient_visit)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
                {
                    model: reimbursementsGeneral,
                    as: "reimbursements_general",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        if (!isNullOrEmpty(accidentRemaining) || !isNullOrEmpty(patientVisitRemaining)) {
            if (status === 1) {
                return next();
            }
            if (!isNullOrEmpty(accidentRemaining)) {
                const datas = JSON.parse(JSON.stringify(accidentRemaining[0]));
                if ((dynamicCheckRemaining(datas)) && fund_eligible) {
                    logger.info('No Remaining', { method });
                    return res.status(400).json({
                        message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการประสบอุบัติเหตุขณะปฏิบัติงาน เนื่องจากได้ทำการขอเบิกครบแล้ว",
                    });
                };
                if (fund_eligible > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการประสบอุบัติเหตุขณะปฏิบัติงานได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_eligible > datas.fundRemaining && !isNullOrEmpty(datas.fundRemaining)) {
                    logger.info('Request Over', { method });
                    return res.status(400).json({
                        message: "จำนวนที่ขอเบิกสวัสดิการประสบอุบัติเหตุขณะปฏิบัติงานเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                    });
                }
            }
            if (!isNullOrEmpty(patientVisitRemaining)) {
                const datas = JSON.parse(JSON.stringify(patientVisitRemaining[0]));
                if ((dynamicCheckRemaining(datas)) && fund_sum_request_patient_visit) {
                    logger.info('No Remaining', { method });
                    return res.status(400).json({
                        message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการเยี่ยมไข้ผู้ปฏิบัติงาน เนื่องจากได้ทำการขอเบิกครบแล้ว",
                    });
                };
                if (fund_sum_request_patient_visit > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเยี่ยมไข้ผู้ปฏิบัติงาน " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_sum_request_patient_visit > datas.fundRemaining && !isNullOrEmpty(datas.fundRemaining)) {
                    logger.info('Request Over', { method });
                    return res.status(400).json({
                        message: "จำนวนที่ขอเบิกสวัสดิการเยี่ยมไข้ผู้ปฏิบัติงานเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                    });
                }
            }
        };
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        next(error);
    }
}
const deletedMiddleware = async (req, res, next) => {
    const method = 'DeletedMiddleware';
    try {
        const dataId = req.params['id'];
        const { id } = req.user;
        const results = await reimbursementsGeneral.findOne({
            attributes: ["status"],
            where: { id: dataId, created_by: id, categories_id: category.medicalWelfare },
        });
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            if (datas.status !== statusText.draft) {
                logger.info('Can not Deleted', { method });
                return res.status(400).json({
                    message: "ไม่สามารถลบใบเบิกนี้ได้",
                });
            };
            return next();
        };
        res.status(404).json({
            message: "ไม่พบข้อมูลที่ต้องการลบ กรุณาลองอีกครั้ง"
        });
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        next(error);
    }
}

// File upload handler
const handleFileUpload = (req, res, next) => {
    const method = 'HandleFileUpload';
    uploadFiles(req, res, (err) => {
        if (err) {
            logger.error(`File upload error: ${err.message}`, { method });
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

const getFileByName = async (req, res, next) => {
    const method = 'getFileByName';
    try {
        const { fileName } = req.query;
        if (!fileName) {
            return res.status(400).json({ message: 'fileName is required' });
        }
        const filePath = path.join(fileFolder, fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'ไม่พบไฟล์' });
        }
        const fileBuffer = fs.readFileSync(filePath);
        const sanitizedFileName = fileName.replace(/^\d+-/, '');
        const encodedFileName = encodeURIComponent(sanitizedFileName);
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
        res.setHeader('Content-Type', contentType);
        res.send(fileBuffer);
    } catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteFileFromDisk = (fileName) => {
    if (!fileName) return;
    const filePath = path.join(fileFolder, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const sanitizeFileName = (name) => {
    if (!name || name.trim() === '') return 'unknown';
    return name
        .replace(/\s+/g, '_')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/_{2,}/g, '_')
        .trim() || 'unknown';
};

// Field name to file prefix mapping
const fieldPrefixMap = {
    fileReceipt: 'receipt',
    fileMedicalCertificate: 'medical-certificate',
    fileSupervisorLetter: 'supervisor-letter',
    fileReceiptPatientVisit: 'visit-receipt',
    fileMedicalCertificatePatientVisit: 'visit-medical-certificate',
};

const generateFileName = (originalFileName, userName, requestDate, prefix) => {
    const ext = path.extname(originalFileName);
    const date = requestDate ? requestDate.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sanitizedUserName = sanitizeFileName(userName);
    return `${prefix}-${date}-${sanitizedUserName}${ext}`;
};

const renameFile = (oldFileName, newFileName) => {
    if (!oldFileName || !newFileName) return null;
    const oldPath = path.join(fileFolder, oldFileName);
    const newPath = path.join(fileFolder, newFileName);
    if (fs.existsSync(oldPath)) {
        if (fs.existsSync(newPath)) {
            const ext = path.extname(newFileName);
            const nameWithoutExt = path.basename(newFileName, ext);
            const uniqueFileName = `${nameWithoutExt}-${Date.now()}${ext}`;
            const uniquePath = path.join(fileFolder, uniqueFileName);
            fs.renameSync(oldPath, uniquePath);
            return uniqueFileName;
        } else {
            fs.renameSync(oldPath, newPath);
            return newFileName;
        }
    }
    return null;
};

const uploadFilesForRecord = async (req, res, next) => {
    const method = 'uploadFilesForRecord';
    try {
        const dataId = req.params['id'];
        const { id } = req.user;
        const record = await reimbursementsGeneral.findOne({
            where: { id: dataId, categories_id: category.medicalWelfare },
            include: [{ model: users, as: 'created_by_user', attributes: ['name'] }]
        });
        if (!record) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        }
        const currentData = record.toJSON();
        const updateData = {};
        // Get user name for file renaming
        let userName = currentData.created_by_user?.name;
        if (!userName?.trim()) {
            const userRecord = await users.findByPk(currentData.created_by);
            if (userRecord) userName = userRecord.name;
        }
        if (!userName?.trim()) userName = 'unknown';
        const requestDate = currentData.request_date || null;

        const fileFieldMap = {
            fileReceipt: 'file_receipt',
            fileMedicalCertificate: 'file_medical_certificate',
            fileSupervisorLetter: 'file_supervisor_letter',
            fileReceiptPatientVisit: 'file_receipt_patient_visit',
            fileMedicalCertificatePatientVisit: 'file_medical_certificate_patient_visit',
        };

        for (const [formField, dbColumn] of Object.entries(fileFieldMap)) {
            if (req.files?.[formField]?.[0]) {
                if (currentData[dbColumn]) deleteFileFromDisk(currentData[dbColumn]);
                const tempFileName = req.files[formField][0].filename;
                const prefix = fieldPrefixMap[formField] || formField;
                const newFileName = generateFileName(tempFileName, userName, requestDate, prefix);
                updateData[dbColumn] = renameFile(tempFileName, newFileName) || tempFileName;
            }
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์' });
        }
        updateData.updated_by = id;
        await reimbursementsGeneral.update(updateData, { where: { id: dataId } });
        logger.info('Files uploaded successfully', { method, data: { id, dataId } });
        res.status(200).json({
            message: 'อัปโหลดไฟล์สำเร็จ',
            files: {
                fileReceipt: updateData.file_receipt ?? currentData.file_receipt,
                fileMedicalCertificate: updateData.file_medical_certificate ?? currentData.file_medical_certificate,
                fileSupervisorLetter: updateData.file_supervisor_letter ?? currentData.file_supervisor_letter,
                fileReceiptPatientVisit: updateData.file_receipt_patient_visit ?? currentData.file_receipt_patient_visit,
                fileMedicalCertificatePatientVisit: updateData.file_medical_certificate_patient_visit ?? currentData.file_medical_certificate_patient_visit
            }
        });
    } catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteFileFromRecord = async (req, res, next) => {
    const method = 'deleteFileFromRecord';
    try {
        const dataId = req.params['id'];
        const { fileType } = req.body;
        const { id } = req.user;
        const fieldMap = {
            receipt: 'file_receipt',
            medical_certificate: 'file_medical_certificate',
            supervisor_letter: 'file_supervisor_letter',
            receipt_patient_visit: 'file_receipt_patient_visit',
            medical_certificate_patient_visit: 'file_medical_certificate_patient_visit'
        };
        if (!fieldMap[fileType]) {
            return res.status(400).json({ message: 'ประเภทไฟล์ไม่ถูกต้อง' });
        }
        const record = await reimbursementsGeneral.findOne({
            where: { id: dataId, categories_id: category.medicalWelfare }
        });
        if (!record) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        }
        const currentData = record.toJSON();
        const fieldName = fieldMap[fileType];
        if (currentData[fieldName]) {
            deleteFileFromDisk(currentData[fieldName]);
            await reimbursementsGeneral.update(
                { [fieldName]: null, updated_by: id },
                { where: { id: dataId } }
            );
            logger.info('File deleted successfully', { method, data: { id, dataId, fileType } });
            res.status(200).json({ message: 'ลบไฟล์สำเร็จ' });
        } else {
            res.status(404).json({ message: 'ไม่พบไฟล์ที่ต้องการลบ' });
        }
    } catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    authPermission,
    bindFilter,
    getRemaining,
    checkRemaining,
    bindCreate,
    bindUpdate,
    deletedMiddleware,
    byIdMiddleWare,
    authPermissionEditor,
    checkNullValue,
    checkUpdateRemaining,
    checkFullPerTimes,
    handleFileUpload,
    uploadFilesForRecord,
    deleteFileFromRecord,
    getFileByName
};