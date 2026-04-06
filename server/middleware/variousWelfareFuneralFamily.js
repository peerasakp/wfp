const { isNullOrEmpty, getFiscalYear, getYear2Digits, formatNumber, isInvalidNumber, dynamicCheckRemaining, canApplicantEditReimbursement, editorUpdateAllowedStatuses } = require('../middleware/utility');
const { initLogger } = require('../logger');
const logger = initLogger('UserValidator');
const { Op, literal, col, fn } = require('sequelize')
const permissionType = require('../enum/permission')
const statusText = require('../enum/statusText')
const status = require('../enum/status')
const category = require('../enum/category');
const welfareType = require('../enum/welfareType');
const { permissionsHasRoles, reimbursementsAssist, categories, subCategories, reimbursementsAssistHasSubCategories,users, sequelize } = require('../models/mariadb')
const { sendMail } = require('../helper/mail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const fileFolder = path.join(__dirname, '..', 'public', 'upload', 'funeral-family-welfare');
if (!fs.existsSync(fileFolder)) fs.mkdirSync(fileFolder, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, fileFolder),
    filename: (req, file, cb) => {
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, Date.now() + '-' + file.fieldname + '-' + originalname);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('อัปโหลดได้เฉพาะ PDF, JPG, JPEG, PNG เท่านั้น'), false);
};
const uploadFiles = multer({
    storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 }
}).fields([
    { name: 'fileReceipt', maxCount: 1 },
    { name: 'fileDocument', maxCount: 1 },
    { name: 'fileDeathCertificate', maxCount: 1 },
    { name: 'filePhoto', maxCount: 1 },
    { name: 'fileHouseRegistration', maxCount: 1 }
]);
const authPermission = async (req, res, next) => {
    const method = 'AuthPermission';
    const { roleId } = req.user;
    if (roleId === 4) {
        req.isEditor = true;
        return next();
    }
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
    if (roleId === 4) {
        req.access = true;
        return next();
    }
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
                '$reimbursementsAssist.reim_number$': { [Op.like]: `%${keyword}%` },
            });
        }
        if (!isNullOrEmpty(from) && !isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$reimbursementsAssist.request_date$': { [Op.between]: [from, to] },
            });
        }
        if (!isNullOrEmpty(from) && isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$reimbursementsAssist.request_date$': { [Op.eq]: from },
            });
        }
        if (!isNullOrEmpty(status)) {
            req.query.filter[Op.and].push({
                '$reimbursementsAssist.status$': { [Op.eq]: status },
            });
        }
        req.query.filter[Op.and].push({
            '$reimbursementsAssist.created_by$': { [Op.eq]: id },
            '$reimbursementsAssist.categories_id$': { [Op.eq]: category.variousFuneralFamily },
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
                { '$reimbursementsAssist.id$': { [Op.eq]: dataId } },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursementsAssist.id$': { [Op.eq]: dataId } },
                { '$reimbursementsAssist.created_by$': { [Op.eq]: id }, }
            );
        }
        req.query.filter[Op.and].push(
            {
                '$reimbursementsAssist.categories_id$': { [Op.eq]: category.variousFuneralFamily },
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
        const { fundReceipt, decease, fundDecease, fundReceiptWreath, fundWreathUniversity, fundWreathArrange,
            fundReceiptVechicle, fundVechicle, selectedWreath, selectedVechicle, actionId, deceasedType } = req.body;
        if (req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)) {
            return next();
        }
        const errorObj = {};

        if (isNullOrEmpty(fundReceipt)) {
            errorObj["fundReceipt"] = "กรุณากรอกข้อมูลจำนวนเงินตามใบเสร็จ";
        } else if (isInvalidNumber(fundReceipt)) {
            errorObj["fundReceipt"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundReceipt < 0) {
            return res.status(400).json({
                message: "จำนวนเงินตามใบเสร็จน้อยกว่า 0 ไม่ได้",
            });
        }

        if (isInvalidNumber(fundDecease)) {
            errorObj["fundDecease"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundDecease < 0) {
            return res.status(400).json({
                message: "จำนวนเงินที่ต้องการเบิกน้อยกว่า 0 ไม่ได้",
            });
        }

        if (deceasedType) {
            if (isNullOrEmpty(decease)) {
                errorObj["decease"] = "กรุณากรอกข้อมูล ชื่อ - นามสกุล ของผู้เสียชีวิต";
            }
        }

        if (selectedWreath) {
            if (isNullOrEmpty(fundReceiptWreath)) {
                errorObj["fundReceiptWreath"] = "กรุณากรอกข้อมูลจำนวนเงินสนับสนุนค่าพวงหรีดตามใบสำคัญรับเงิน";
            } else if (isInvalidNumber(fundReceiptWreath)) {
                errorObj["fundReceiptWreath"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundReceiptWreath <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินตามใบสำคัญรับเงินน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (isNullOrEmpty(fundWreathUniversity)) {
                errorObj["fundWreathUniversity"] = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก (ในนามมหาวิทยาลัย)";
            } else if (isInvalidNumber(fundWreathUniversity)) {
                errorObj["fundWreathUniversity"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundWreathUniversity < 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (isNullOrEmpty(fundWreathArrange)) {
                errorObj["fundWreathArrange"] = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก (ในนามส่วนงาน)";
            } else if (isInvalidNumber(fundWreathArrange)) {
                errorObj["fundWreathArrange"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundWreathArrange < 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (Number(fundWreathArrange + fundWreathUniversity) > Number(fundReceiptWreath)) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบสำคัญรับเงินได้",
                });
            }
        }
        else {
            req.body = {
                ...req.body,
                fundReceiptWreath: null,
                fundWreathUniversity: null,
                fundWreathArrange: null,
            }
        }
        if (selectedVechicle) {
            if (isNullOrEmpty(fundReceiptVechicle)) {
                errorObj["fundReceiptVechicle"] = "กรุณากรอกข้อมูลจำนวนเงินสนับสนุนค่าพาหนะเหมาจ่ายตามใบสำคัญรับเงิน";
            } else if (isInvalidNumber(fundReceiptVechicle)) {
                errorObj["fundReceiptVechicle"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundReceiptVechicle <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินตามใบสำคัญรับเงินน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (isNullOrEmpty(fundVechicle)) {
                errorObj["fundVechicle"] = "กรุณากรอกข้อมูลจำนวนเงินสนับสนุนค่าพาหนะเหมาจ่ายที่ต้องการเบิก";
            } else if (isInvalidNumber(fundVechicle)) {
                errorObj["fundVechicle"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundVechicle <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (Number(fundVechicle) > Number(fundReceiptVechicle)) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบสำคัญรับเงินได้",
                });
            }
        }
        else {
            req.body = {
                ...req.body,
                fundReceiptVechicle: null,
                fundVechicle: null,
            }
        }
        if ((isNullOrEmpty(actionId) || (actionId != status.draft && actionId != status.waitApprove)) && !req.access) {
            return res.status(400).json({
                message: "ไม่มีการกระทำที่ต้องการ",
            });
        }
        if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
        var fundSumWreathRequest = Number(fundWreathUniversity) + Number(fundWreathArrange);
        var fundSumRequest = Number(fundDecease) + Number(fundSumWreathRequest) + Number(fundVechicle);
        var fundSumReceipt = Number(fundReceipt) + Number(fundReceiptWreath) + Number(fundReceiptVechicle);
        req.body = {
            ...req.body,
            fundSumReceipt: fundSumReceipt,
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
            fundReceipt, decease, fundDecease, fundReceiptWreath, fundWreathUniversity, fundWreathArrange, fundSumReceipt,
            fundReceiptVechicle, fundVechicle, selectedWreath, selectedVechicle, fundSumRequest, createFor, actionId, deceasedType } = req.body;
        const { id, roleId } = req.user;
        if (roleId === 4) {
            return res.status(403).json({ message: "ไม่มีสิทธิ์สร้างสวัสดิการ" });
        }
        if (roleId === 2 && !isNullOrEmpty(createFor) && createFor !== id) {
            return res.status(400).json({
                message: "เจ้าหน้าที่การเงินสามารถสร้างคำร้องของตนเองเท่านั้น",
            });
        }
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
        const results = await reimbursementsAssist.findOne({
            attributes: ["id"],
            order: [["id", "DESC"]]
        });
        var reimNumber = getYear2Digits() + formatNumber(welfareType.Assist) + formatNumber(category.variousFuneralFamily) + formatNumber(1);
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            reimNumber = getYear2Digits() + formatNumber(welfareType.Assist) + formatNumber(category.variousFuneralFamily) + formatNumber(Number(datas.id) + 1);
        }
        const dataBinding = {
            reim_number: reimNumber,
            deceased_type: deceasedType,
            deceased: decease,
            selected_wreath: selectedWreath,
            selected_vechicle: selectedVechicle,
            fund_receipt: fundReceipt,
            fund_decease: fundDecease,
            fund_receipt_wreath: fundReceiptWreath,
            fund_wreath_university: fundWreathUniversity,
            fund_wreath_arrange: fundWreathArrange,
            fund_receipt_vechicle: fundReceiptVechicle,
            fund_vechicle: fundVechicle,
            fund_sum_request: fundSumRequest,
            fund_sum_receipt: fundSumReceipt,
            created_by: createFor ?? id,
            updated_by: id,
            status: actionId,
            request_date: actionId === status.waitApprove ? new Date() : null,
            categories_id: category.variousFuneralFamily,
        }
        req.body = dataBinding;
        next();
    } catch (error) {
        console.error('Error in bindCreate middleware:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};
const bindUpdate = async (req, res, next) => {
    try {
        const {
            fundReceipt, decease, fundDecease, fundReceiptWreath, fundWreathUniversity, fundWreathArrange, fundSumReceipt,
            fundReceiptVechicle, fundVechicle, selectedWreath, selectedVechicle, fundSumRequest, createFor, actionId, deceasedType } = req.body;
        const { id, roleId } = req.user;
        if (roleId === 4) {
            return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขสวัสดิการ" });
        }
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
        const results = await reimbursementsAssist.findOne({
            attributes: ["status", "created_by", "document_path"],
            where: { id: dataId, categories_id: category.variousFuneralFamily },
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
            if (!req.access && !canApplicantEditReimbursement(datas, statusText)) {
                return res.status(400).json({
                    message: "ไม่สามารถแก้ไขได้ เนื่องจากสถานะไม่ถูกต้อง",
                });
            }
            const allowStatusByRole = roleId === 5
                ? [statusText.waitFinalApprove]
                : roleId === 2
                    ? [statusText.waitApprove, statusText.waitPayment]
                    : [statusText.waitApprove];
            const editorAllowed = editorUpdateAllowedStatuses(allowStatusByRole, statusText);
            if (req.access && !editorAllowed.includes(datas.status)) {
                return res.status(400).json({
                    message: "ไม่สามารถแก้ไขได้ เนื่องจากสถานะไม่ถูกต้อง",
                });
            }
            if (req.access && roleId === 2 && (actionId !== status.approve && actionId !== status.NotApproved)) {
                return res.status(400).json({
                    message: "เจ้าหน้าที่การเงินสามารถทำได้เฉพาะอนุมัติ/ไม่อนุมัติ",
                });
            }
            if (req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)) {
                let statusId = actionId;
                if (actionId === status.approve) {
                    if (roleId === 2 && datas.status === statusText.waitApprove) {
                        statusId = status.waitFinalApprove;
                    } else if (roleId === 5 && datas.status === statusText.waitFinalApprove) {
                        statusId = status.waitPayment;
                    } else if (roleId === 2 && datas.status === statusText.waitPayment) {
                        statusId = status.approve;
                    }
                }
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
            deceased_type: deceasedType,
            deceased: decease,
            selected_wreath: selectedWreath,
            selected_vechicle: selectedVechicle,
            fund_receipt: fundReceipt,
            fund_decease: fundDecease,
            fund_receipt_wreath: fundReceiptWreath,
            fund_wreath_university: fundWreathUniversity,
            fund_wreath_arrange: fundWreathArrange,
            fund_receipt_vechicle: fundReceiptVechicle,
            fund_vechicle: fundVechicle,
            fund_sum_request: fundSumRequest,
            fund_sum_receipt: fundSumReceipt,
            updated_by: id,
        }
        if (!isNullOrEmpty(actionId)) {
            if (req.access && actionId != 3) {
                return res.status(400).json({
                    message: "ไม่มีการกระทำที่ต้องการ",
                });
            }
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
        if (req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)) {
            return next();
        }
        req.query.filter = {};
        req.query.filter[Op.and] = [];
        const getFiscalYearWhere = getFiscalYear();
        if (req.access && !isNullOrEmpty(createByData)) {
            req.query.filter[Op.and].push(
                { '$reimbursements_assist.created_by$': createByData },
            );
        }
        else if (!isNullOrEmpty(created_by) && req.isEditor) {
            req.query.filter[Op.and].push(
                { '$reimbursements_assist.created_by$': created_by },
            );
        }
        else if (!isNullOrEmpty(createFor) && req.isEditor) {
            req.query.filter[Op.and].push(
                { '$reimbursements_assist.created_by$': createFor },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursements_assist.created_by$': id },
            );
        }
        req.query.filter[Op.and].push(
            { '$reimbursements_assist.request_date$': getFiscalYearWhere },
            { '$reimbursements_assist.categories_id$': category.variousFuneralFamily },
            { '$reimbursements_assist.status$': { [Op.eq]: status.approve } },
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
        const { fund_decease, fund_wreath_university, fund_wreath_arrange, fund_vechicle, actionId } = req.body;
        const welfareCheckData = await reimbursementsAssist.findOne({
            attributes: ["fund_decease", "fund_wreath_university", "fund_wreath_arrange", "fund_vechicle", "reim_number"],
            include: [
                {
                    model: users,
                    as: "created_by_user",
                    attributes: ['name', 'email'],
                }
            ],
            where: { id: dataId, categories_id: category.variousFuneralFamily },
        });
        if (!welfareCheckData) {
            return res.status(400).json({
                message: "ไม่พบข้อมูล",
            });
        }
        const oldWelfareData = JSON.parse(JSON.stringify(welfareCheckData));
        if (req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)) {
            sendMail(oldWelfareData.created_by_user.email, oldWelfareData.reim_number, req.body.status, oldWelfareData.created_by_user.name);
            return next();
        }
        whereObj[Op.and].push(
            { '$sub_category.id$': { [Op.in]: [3, 4, 5, 6] } }
        );
        const decreaseRemaining = await reimbursementsAssistHasSubCategories.findAll({
            attributes: [
                [
                    literal("sub_category.fund - SUM(reimbursements_assist.fund_decease)"),
                    "fundRemaining"
                ],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_assist.fund_decease)"),
                    "requestsRemaining"
                ],
                [col("sub_category.per_times"), "perTimes"],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_assist.fund_decease)"),
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
                    model: reimbursementsAssist,
                    as: "reimbursements_assist",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        whereObj[Op.and].push(
            { '$sub_category.id$': { [Op.in]: [7, 8] } }
        );
        const wreathRemaining = await reimbursementsAssistHasSubCategories.findAll({
            attributes: [
                [col("sub_category.per_times"), "perTimes"],
                // fund_wreath_arrange
                [
                    fn("SUM", literal("CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE 0 END")),
                    "fundRemainingArrange"
                ],
                [
                    fn("sub_category.per_years - COUNT", literal("CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE NULL END")),
                    "requestsRemainingArrange"
                ],
                [
                    literal("sub_category.per_users - COUNT(CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE NULL END)"),
                    "perUsersRemainingArrange"
                ],

                // fund_wreath_university
                [
                    fn("SUM", literal("CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE 0 END")),
                    "fundRemainingUniversity"
                ],
                [
                    fn("sub_category.per_years - COUNT", literal("CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE NULL END")),
                    "requestsRemainingUniversity"
                ],
                [
                    literal("sub_category.per_users - COUNT(CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE NULL END)"),
                    "perUsersRemainingUniversity"
                ]
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
                {
                    model: reimbursementsAssist,
                    as: "reimbursements_assist",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        whereObj[Op.and] = whereObj[Op.and].filter(item => [7, 8].includes(item['$sub_category.id$']));
        whereObj[Op.and].push(
            { '$sub_category.id$': 9 }
        );
        const vechicleRemaining = await reimbursementsAssistHasSubCategories.findAll({
            attributes: [
                [
                    literal("sub_category.fund - SUM(reimbursements_assist.fund_vechicle)"),
                    "fundRemaining"
                ],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_assist.fund_vechicle)"),
                    "requestsRemaining"
                ],
                [col("sub_category.per_times"), "perTimes"],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_assist.fund_vechicle)"),
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
                    model: reimbursementsAssist,
                    as: "reimbursements_assist",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });

        if (!isNullOrEmpty(decreaseRemaining) || !isNullOrEmpty(wreathRemaining) || !isNullOrEmpty(vechicleRemaining)) {
            if (!isNullOrEmpty(decreaseRemaining)) {
                const datas = JSON.parse(JSON.stringify(decreaseRemaining[0]));
                if (fund_decease < oldWelfareData.fund_decease) {
                    return next();
                }
                else if (fund_decease > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFundDecease = fund_decease - oldWelfareData.fund_decease;
                    if ((datas.fundRemaining === 0 || datas.fundRemaining - diffFundDecease < 0) && !isNullOrEmpty(datas.fundRemaining)) {
                        return res.status(400).json({
                            message: "ไม่สามารถทำรายการได้เนื่องจากเกินเพดานเงินคงเหลือ",
                        });
                    }
                }
            }

            if (!isNullOrEmpty(wreathRemaining)) {
                const datas = JSON.parse(JSON.stringify(wreathRemaining[0]));
                if (fund_wreath_university < oldWelfareData.fund_wreath_university || fund_wreath_arrange < oldWelfareData.fund_wreath_arrange) {
                    return next();
                }
                else if (fund_wreath_university > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกในนามมหาวิทยาลัยได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else if (fund_wreath_arrange > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกในนามส่วนงานได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFundUniversity = fund_wreath_university - oldWelfareData.fund_wreath_university;
                    const diffFundArrange = fund_wreath_arrange - oldWelfareData.fund_wreath_arrange;
                    if ((datas.fundRemaining === 0 || datas.fundRemaining - diffFundUniversity < 0) && !isNullOrEmpty(datas.fundRemaining)) {
                        return res.status(400).json({
                            message: "ไม่สามารถทำรายการเบิกในนามมหาวิทยาลัยได้เนื่องจากเกินเพดานเงินคงเหลือ",
                        });
                    }
                    if ((datas.fundRemaining === 0 || datas.fundRemaining - diffFundArrange < 0) && !isNullOrEmpty(datas.fundRemaining)) {
                        return res.status(400).json({
                            message: "ไม่สามารถทำรายการเบิกในนามส่วนงานได้เนื่องจากเกินเพดานเงินคงเหลือ",
                        });
                    }
                }
            }
            if (!isNullOrEmpty(vechicleRemaining)) {
                const datas = JSON.parse(JSON.stringify(vechicleRemaining[0]));
                if (fund_vechicle < oldWelfareData.fund_vechicle) {
                    return next();
                }
                else if (fund_vechicle > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFundVechicle = fund_vechicle - oldWelfareData.fund_vechicle;
                    if (datas.fundRemaining === 0 || datas.fundRemaining - diffFundVechicle < 0) {
                        return res.status(400).json({
                            message: "ไม่สามารถทำรายการเบิกค่าพาหนะได้เนื่องจากเกินเพดานเงินคงเหลือ",
                        });
                    }
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
const checkFullPerTimes = async (req, res, next) => {
    const method = 'CheckFullPerTimes';
    try {
        const { fund_decease, fund_wreath_university, fund_wreath_arrange, fund_vechicle, fundReceiptWreath } = req.body;
        if (req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)) {
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
                    [Op.in]: [3, 4, 5, 6, 7, 8, 9]
                }
            }
        })
        if (!isNullOrEmpty(getFund)) {
            const datasDecease = JSON.parse(JSON.stringify(getFund));
            const datasWreath = JSON.parse(JSON.stringify(getFund[0]));
            const datasVechicle = JSON.parse(JSON.stringify(getFund[1]));

            if (fund_decease > datasDecease.perTimes && datasDecease.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกได้สูงสุด " + datasDecease.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_decease > datasDecease.fundRemaining && datasDecease.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }

            if (fund_wreath_university > datasWreath.perTimes && datasWreath.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว ค่าพวงหลีด ในนามมหาวิทยาลัยได้สูงสุด " + datasWreath.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_wreath_university > datasWreath.fundRemaining && datasWreath.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว ค่าพวงหลีด ในนามมหาวิทยาลัย เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }
            if (fund_wreath_arrange > datasWreath.perTimes && datasWreath.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว ค่าพวงหลีด ในนามส่วนงานได้สูงสุด " + datasWreath.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_wreath_arrange > datasWreath.fundRemaining && datasWreath.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว ค่าพวงหลีด ในนามส่วนงาน เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }

            if (fund_vechicle > datasVechicle.perTimes && datasVechicle.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว ค่าพาหนะเหมาจ่าย" + datasVechicle.perTimes + " ต่อครั้ง",
                });
            }
            if ((fund_wreath_arrange + fund_wreath_university) > datasWreath.perTimes && datasWreath.perTimes) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนเงินรวมของค่าพวงหรีด ต้องไม่เกินจำนวนเงินตามใบสำคัญรับเงิน",
                });
            }
            // if (fund_vechicle > datasVechicle.fundRemaining && datasVechicle.fundRemaining) {
            //     logger.info('Request Over', { method });
            //     return res.status(400).json({
            //         message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว ค่าพาหนะเหมาจ่าย เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
            //     });
            // }
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
        const { status, fund_decease, fund_wreath_university, fund_wreath_arrange, fund_vechicle } = req.body;
        const { filter } = req.query;
        var whereObj = { ...filter }
        whereObj[Op.and].push(
            { '$sub_category.id$': { [Op.in]: [3, 4, 5, 6] } }
        );
        logger.info('Filter from request:', req.query.filter);
        logger.info('Final Where Object before query:', whereObj);
        const decreaseRemaining = await reimbursementsAssistHasSubCategories.findAll({
            attributes: [
                [col("sub_category.id"), "subCategoriesId"],
                [col("sub_category.name"), "subCategoriesName"],
                [fn("SUM", col("reimbursements_assist.fund_decease")), "totalSumRequested"],
                [col("sub_category.fund"), "fund"],
                [
                    literal("sub_category.fund - SUM(reimbursements_assist.fund_decease)"),
                    "fundRemaining"
                ],
                [fn("COUNT", col("reimbursements_assist.fund_decease")), "totalCountRequested"],
                [col("sub_category.per_years"), "perYears"],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_assist.fund_decease)"),
                    "requestsRemaining"
                ],
                [col("sub_category.per_times"), "perTimesRemaining"],
                [col("sub_category.per_users"), "perUsers"],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_assist.fund_decease)"),
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
                    model: reimbursementsAssist,
                    as: "reimbursements_assist",
                    attributes: [],
                    required: false
                }
            ],
            where: whereObj,
            group: ["sub_category.id", "sub_category.name", "sub_category.fund", "sub_category.per_years", "sub_category.per_times", "sub_category.per_users"]
        });
        whereObj[Op.and].push(
            { '$sub_category.id$': { [Op.in]: [7, 8] } }
        );
        const wreathRemaining = await reimbursementsAssistHasSubCategories.findAll({
            attributes: [
                [col("sub_category.id"), "subCategoriesId"],
                [col("sub_category.name"), "subCategoriesName"],
                [col("sub_category.fund"), "fund"],
                [col("sub_category.per_years"), "perYears"],
                [col("sub_category.per_times"), "perTimesRemaining"],
                [col("sub_category.per_users"), "perUsers"],

                // fund_wreath_arrange
                [
                    fn("SUM", literal("CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE 0 END")),
                    "totalSumRequestedArrange"
                ],
                [
                    fn("SUM", literal("CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE 0 END")),
                    "fundRemainingArrange"
                ],
                [
                    fn("COUNT", literal("CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE NULL END")),
                    "totalCountRequestedArrange"
                ],
                [
                    fn("sub_category.per_years - COUNT", literal("CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE NULL END")),
                    "requestsRemainingArrange"
                ],
                [
                    literal("sub_category.per_users - COUNT(CASE WHEN sub_category.id = 7 THEN reimbursements_assist.fund_wreath_arrange ELSE NULL END)"),
                    "perUsersRemainingArrange"
                ],

                // fund_wreath_university
                [
                    fn("SUM", literal("CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE 0 END")),
                    "totalSumRequestedUniversity"
                ],
                [
                    fn("SUM", literal("CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE 0 END")),
                    "fundRemainingUniversity"
                ],
                [
                    fn("COUNT", literal("CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE NULL END")),
                    "totalCountRequestedUniversity"
                ],
                [
                    fn("sub_category.per_years - COUNT", literal("CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE NULL END")),
                    "requestsRemainingUniversity"
                ],
                [
                    literal("sub_category.per_users - COUNT(CASE WHEN sub_category.id = 8 THEN reimbursements_assist.fund_wreath_university ELSE NULL END)"),
                    "perUsersRemainingUniversity"
                ]

            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
                {
                    model: reimbursementsAssist,
                    as: "reimbursements_assist",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        whereObj[Op.and] = whereObj[Op.and].filter(item => [7, 8].includes(item['$sub_category.id$']));
        whereObj[Op.and].push(
            { '$sub_category.id$': 9 }
        );
        const vechicleRemaining = await reimbursementsAssistHasSubCategories.findAll({
            attributes: [
                [col("sub_category.id"), "subCategoriesId"],
                [col("sub_category.name"), "subCategoriesName"],
                [fn("SUM", col("reimbursements_assist.fund_vechicle")), "totalSumRequested"],
                [col("sub_category.fund"), "fund"],
                [
                    literal("sub_category.fund - SUM(reimbursements_assist.fund_vechicle)"),
                    "fundRemaining"
                ],
                [fn("COUNT", col("reimbursements_assist.fund_vechicle")), "totalCountRequested"],
                [col("sub_category.per_years"), "perYears"],
                [
                    literal("sub_category.per_years - COUNT(reimbursements_assist.fund_vechicle)"),
                    "requestsRemaining"
                ],
                [col("sub_category.per_times"), "perTimesRemaining"],
                [col("sub_category.per_users"), "perUsers"],
                [
                    literal("sub_category.per_users - COUNT(reimbursements_assist.fund_vechicle)"),
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
                    model: reimbursementsAssist,
                    as: "reimbursements_assist",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["sub_category.id"],
        });
        if (!isNullOrEmpty(decreaseRemaining) || !isNullOrEmpty(wreathRemaining) || !isNullOrEmpty(vechicleRemaining)) {
            if (status === 1) {
                return next();
            }
            if (!isNullOrEmpty(decreaseRemaining)) {
                const datas = JSON.parse(JSON.stringify(decreaseRemaining));
                const remainingData = datas;
                if ((dynamicCheckRemaining(remainingData))) {
                    logger.info('No Remaining', { method });
                    return res.status(400).json({
                        message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการเสียชีวิตครอบครัว เนื่องจากได้ทำการขอเบิกครบแล้ว",
                    });
                };
                if (fund_decease > remainingData.perTimes && remainingData.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว " + remainingData.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_decease > remainingData.fundRemaining && remainingData.fundRemaining) {
                    logger.info('Request Over', { method });
                    return res.status(400).json({
                        message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                    });
                }
            }
            if (!isNullOrEmpty(wreathRemaining)) {
                const datas = JSON.parse(JSON.stringify(wreathRemaining[0]));
                if ((dynamicCheckRemaining(datas)) || fund_wreath_arrange || fund_wreath_university) {
                    logger.info('No Remaining', { method });
                    return res.status(400).json({
                        message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการการเสียชีวิตครอบครัว สนับสนุนค่าพวงหลีด เนื่องจากได้ทำการขอเบิกครบแล้ว",
                    });
                };
                if (fund_wreath_university > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพวงหลีด ในนามมหาวิทยาลัยได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_wreath_university > datas.fundRemaining && datas.fundRemaining) {
                    logger.info('Request Over', { method });
                    return res.status(400).json({
                        message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพวงหลีด ในนามมหาวิทยาลัย เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                    });
                }
                if (fund_wreath_arrange > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพวงหลีด ในนามส่วนงานได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_wreath_arrange > datas.fundRemaining && datas.fundRemaining) {
                    logger.info('Request Over', { method });
                    return res.status(400).json({
                        message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพวงหลีด ในนามส่วนงาน เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                    });
                }
            }
            if (!isNullOrEmpty(vechicleRemaining)) {
                const datas = JSON.parse(JSON.stringify(vechicleRemaining[0]));
                if ((dynamicCheckRemaining(datas)) && fund_vechicle) {
                    logger.info('No Remaining', { method });
                    return res.status(400).json({
                        message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพาหนะ เนื่องจากได้ทำการขอเบิกครบแล้ว",
                    });
                };
                if (fund_vechicle > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพาหนะ " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_vechicle > datas.fundRemaining && datas.fundRemaining) {
                    logger.info('Request Over', { method });
                    return res.status(400).json({
                        message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพาหนะ เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
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
        const results = await reimbursementsAssist.findOne({
            attributes: ["status"],
            where: { id: dataId, created_by: id, categories_id: category.variousFuneralFamily },
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
    uploadFiles(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `อัปโหลดไฟล์ผิดพลาด: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// Get file by name
const getFileByName = async (req, res, next) => {
    try {
        const { fileName } = req.query;
        if (!fileName) return res.status(400).json({ message: 'ไม่พบชื่อไฟล์' });
        const filePath = path.join(fileFolder, fileName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'ไม่พบไฟล์' });
        const ext = path.extname(fileName).toLowerCase();
        const contentTypes = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        next(error);
    }
};

// Delete file from disk helper
const deleteFileFromDisk = (fileName) => {
    if (!fileName) return;
    const filePath = path.join(fileFolder, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// Sanitize filename - remove special characters and spaces, preserve Thai characters
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
    fileDeathCertificate: 'death-certificate',
    filePhoto: 'photo',
    fileHouseRegistration: 'house-registration',
};

const documentPrefixByDeceasedType = {
    3: 'house-registration',
    4: 'house-registration',
    5: 'marriage-certificate',
    6: 'birth-certificate',
};

// Generate filename: {prefix}-{date}-{userName}.{extension}
const generateFileName = (originalFileName, userName, requestDate, prefix) => {
    const ext = path.extname(originalFileName);
    const date = requestDate ? requestDate.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sanitizedUserName = sanitizeFileName(userName);
    return `${prefix}-${date}-${sanitizedUserName}${ext}`;
};

// Rename file helper
const renameFile = (oldFileName, newFileName) => {
    if (!oldFileName || !newFileName) return null;
    const oldPath = path.join(fileFolder, oldFileName);
    const newPath = path.join(fileFolder, newFileName);
    if (fs.existsSync(oldPath)) {
        if (fs.existsSync(newPath)) {
            const ext = path.extname(newFileName);
            const nameWithoutExt = path.basename(newFileName, ext);
            const uniqueFileName = `${nameWithoutExt}-${Date.now()}${ext}`;
            fs.renameSync(oldPath, path.join(fileFolder, uniqueFileName));
            return uniqueFileName;
        }
        fs.renameSync(oldPath, newPath);
        return newFileName;
    }
    return null;
};

// Upload files for existing record
const uploadFilesForRecord = async (req, res, next) => {
    try {
        const dataId = req.params['id'];
        const record = await reimbursementsAssist.findOne({
            where: { id: dataId },
            include: [{ model: users, as: 'created_by_user', attributes: ['name'] }]
        });
        if (!record) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

        const currentData = record.toJSON();

        const fileFieldMap = {
            fileReceipt: 'file_receipt',
            fileDocument: 'file_document',
            fileDeathCertificate: 'file_death_certificate',
            filePhoto: 'file_photo',
            fileHouseRegistration: 'file_house_registration'
        };

        // Get user name for file renaming
        let userName = currentData.created_by_user?.name;
        if (!userName?.trim()) {
            const userRecord = await users.findByPk(currentData.created_by);
            if (userRecord) userName = userRecord.name;
        }
        if (!userName?.trim()) userName = 'unknown';
        const requestDate = currentData.request_date || null;

        const updateData = {};
        console.log('[uploadFilesForRecord] req.files keys:', req.files ? Object.keys(req.files) : 'NO FILES');
        console.log('[uploadFilesForRecord] deceased_type:', currentData.deceased_type);
        for (const [fieldName, dbColumn] of Object.entries(fileFieldMap)) {
            if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
                if (record[dbColumn]) deleteFileFromDisk(record[dbColumn]);
                const tempFileName = req.files[fieldName][0].filename;
                let prefix;
                if (fieldName === 'fileDocument') {
                    prefix = documentPrefixByDeceasedType[currentData.deceased_type] || 'document';
                } else {
                    prefix = fieldPrefixMap[fieldName] || fieldName;
                }
                const newFileName = generateFileName(tempFileName, userName, requestDate, prefix);
                const renamedFile = renameFile(tempFileName, newFileName);
                console.log('[uploadFilesForRecord]', fieldName, ':', tempFileName, '->', newFileName, '| rename result:', renamedFile);
                updateData[dbColumn] = renamedFile || tempFileName;
            }
        }
        console.log('[uploadFilesForRecord] updateData:', updateData);

        if (Object.keys(updateData).length > 0) {
            await reimbursementsAssist.update(updateData, { where: { id: dataId } });
        }

        res.status(200).json({ message: 'อัปโหลดไฟล์สำเร็จ' });
    } catch (error) {
        next(error);
    }
};

// Delete specific file from record
const deleteFileFromRecord = async (req, res, next) => {
    try {
        const dataId = req.params['id'];
        const { fileType } = req.body;
        const fileFieldMap = {
            receipt: 'file_receipt',
            document: 'file_document',
            death_certificate: 'file_death_certificate',
            photo: 'file_photo',
            house_registration: 'file_house_registration'
        };
        const dbColumn = fileFieldMap[fileType];
        if (!dbColumn) return res.status(400).json({ message: 'ประเภทไฟล์ไม่ถูกต้อง' });

        const record = await reimbursementsAssist.findByPk(dataId);
        if (!record) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

        if (record[dbColumn]) deleteFileFromDisk(record[dbColumn]);
        await reimbursementsAssist.update({ [dbColumn]: null }, { where: { id: dataId } });

        res.status(200).json({ message: 'ลบไฟล์สำเร็จ' });
    } catch (error) {
        next(error);
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