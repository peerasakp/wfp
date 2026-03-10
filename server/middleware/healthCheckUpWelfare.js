const { isNullOrEmpty, getFiscalYear, getYear2Digits, formatNumber, isInvalidNumber , dynamicCheckRemaining } = require('../middleware/utility');
const { initLogger } = require('../logger');
const logger = initLogger('HealthCheckupValidator');
const { Op, literal, col } = require('sequelize')
const permissionType = require('../enum/permission')
const statusText = require('../enum/statusText')
const status = require('../enum/status')
const category = require('../enum/category');
const welfareType = require('../enum/welfareType');
const { permissionsHasRoles, reimbursementsGeneral, categories,users, sequelize } = require('../models/mariadb');
const { sendMail } = require('../helper/mail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const fileFolder = path.join(__dirname, '..', 'public', 'upload', 'health-check-up-welfare');

// Ensure directory exists
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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).fields([
    { name: 'fileReceipt', maxCount: 1 },
    { name: 'fileMedicalCertificate', maxCount: 1 }
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
        ('============================authPermissionEditor====================')
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
            '$reimbursementsGeneral.categories_id$': { [Op.eq]: category.healthCheckup },
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
                '$reimbursementsGeneral.categories_id$': { [Op.eq]: category.healthCheckup },
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
        const { fundReceipt, fundDecree, fundUniversity, fundEligible, fundEligibleName, actionId } = req.body;
        
        if(req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)){
            return next();
        }
        const errorObj = {};
        if (isNullOrEmpty(fundReceipt)) {
            errorObj["fundReceipt"] = "กรุณากรอกข้อมูลจำนวนเงินตามใบเสร็จ";
        } else if (isInvalidNumber(fundReceipt)) {
            errorObj["fundReceipt"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundReceipt <= 0) {
            return res.status(400).json({
                message: "จำนวนเงินตามใบเสร็จน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
            });
        }

        if (isInvalidNumber(fundDecree) && !isNullOrEmpty(fundDecree)) {
            errorObj["fundDecree"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundDecree < 0) {
            return res.status(400).json({
                message: "ข้อมูลเงินจากสิทธิที่เบิกได้ตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการรักษาพยาบาลน้อยกว่า 0 ไม่ได้",
            });
        }

        if(isNullOrEmpty(fundUniversity)){
            errorObj["fundUniversity"] = "กรุณากรอกข้อมูลเงินที่ต้องการเบิก";
        }
        else if (isInvalidNumber(fundUniversity) && !isNullOrEmpty(fundUniversity)) {
            errorObj["fundUniversity"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundUniversity < 0) {
            return res.status(400).json({
                message: "เงินที่เบิกได้ตามประกาศสวัสดิการคณะกรรมการสวัสดิการ มหาวิทยาลัยบูรพาน้อยกว่า 0 ไม่ได้",
            });
        }
        if (isInvalidNumber(fundEligible) && !isNullOrEmpty(fundEligible)) {
            errorObj["fundEligible"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundEligible < 0) {
            errorObj["fundEligible"] = "ค่าสิทธิอื่น ๆ น้อยกว่า 0 ไม่ได้";
            return res.status(400).json({
                message: "ค่าสิทธิอื่น ๆ น้อยกว่า 0 ไม่ได้",
            });
        }
        if (!isNullOrEmpty(fundEligible) && isNullOrEmpty(fundEligibleName)) {
            return res.status(400).json({
                message: "กรุณากรอกชื่อสิทธิอื่น ๆ",
            });
        }
        else if (isNullOrEmpty(fundEligible) && !isNullOrEmpty(fundEligibleName)) {
            return res.status(400).json({
                message: "กรุณากรอกจำนวนเงินที่เบิกได้จากสิทธิอื่น ๆ",
            });
        }
        const fundEligibleSum = Number(fundReceipt) -  Number(fundDecree) + Number(fundEligible);
        const fundSumRequest = Number(fundUniversity);
        if ((isNullOrEmpty(actionId) || (actionId != status.draft && actionId != status.waitApprove)) && !req.access) {
            return res.status(400).json({
                message: "ไม่มีการกระทำที่ต้องการ",
            });
        }
        if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
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
        const { fundReceipt, fundDecree, fundUniversity, fundEligible, fundEligibleName, fundEligibleSum, fundSumRequest, createFor, actionId } = req.body;
        const { id, roleId } = req.user;
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
        const results = await reimbursementsGeneral.findOne({
            attributes: ["id"],
            order: [["id", "DESC"]]
        });
        var reimNumber = getYear2Digits() + formatNumber(welfareType.general) + formatNumber(category.healthCheckup) + formatNumber(1);
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            reimNumber = getYear2Digits() + formatNumber(welfareType.general) + formatNumber(category.healthCheckup) + formatNumber(Number(datas.id) + 1);
        }
        const dataBinding = {
            reim_number: reimNumber,
            fund_receipt: fundReceipt,
            fund_decree: fundDecree,
            fund_university: fundUniversity,
            fund_eligible: fundEligible,
            fund_eligible_name: fundEligibleName,
            fund_eligible_sum: fundEligibleSum,
            fund_sum_request: fundSumRequest,
            created_by: createFor ?? id,
            updated_by: id,
            status: actionId,
            request_date: actionId === status.waitApprove ? new Date() : null,
            categories_id: category.healthCheckup,
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
        const { fundReceipt, fundDecree, fundUniversity, fundEligible, fundEligibleName, fundEligibleSum, fundSumRequest, createFor, actionId } = req.body;
        console.log('==============bindUpdate===================')
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
            where: { id: dataId, categories_id: category.healthCheckup },
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
            const allowStatusByRole = roleId === 5
                ? [statusText.waitFinalApprove]
                : roleId === 2
                    ? [statusText.waitApprove, statusText.waitPayment]
                    : [statusText.waitApprove];
            if (req.access && !allowStatusByRole.includes(datas.status)) {
                return res.status(400).json({
                    message: "ไม่สามารถแก้ไขได้ เนื่องจากสถานะไม่ถูกต้อง",
                });
            }
            if (req.access && roleId === 2 && (actionId !== status.approve && actionId !== status.NotApproved)) {
                return res.status(400).json({
                    message: "เจ้าหน้าที่การเงินสามารถทำได้เฉพาะอนุมัติ/ไม่อนุมัติ",
                });
            }
            
            if(req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)){
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
                    status : statusId,
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
            fund_receipt: fundReceipt,
            fund_decree: fundDecree,
            fund_university: fundUniversity,
            fund_eligible: fundEligible,
            fund_eligible_name: fundEligibleName,
            fund_eligible_sum: fundEligibleSum,
            fund_sum_request: fundSumRequest,
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
                { '$reimbursementsGeneral.created_by$': createByData },
            );
        }
        else if (!isNullOrEmpty(created_by) && req.isEditor) {
            req.query.filter[Op.and].push(
                { '$reimbursementsGeneral.created_by$': created_by },
            );
        }
        else if (!isNullOrEmpty(createFor) && req.isEditor) {
            req.query.filter[Op.and].push(
                { '$reimbursementsGeneral.created_by$': createFor },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursementsGeneral.created_by$': id },
            );
        }
        req.query.filter[Op.and].push(
            { '$reimbursementsGeneral.request_date$': getFiscalYearWhere },
            { '$reimbursementsGeneral.categories_id$': category.healthCheckup },
            { '$reimbursementsGeneral.status$': { [Op.eq]: status.approve }}
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
        const { fund_sum_request } = req.body;
        const welfareCheckData = await reimbursementsGeneral.findOne({
            attributes: ["fund_sum_request" , "reim_number"],
            include: [
                {
                  model: users,
                  as: "created_by_user",
                  attributes: ['name','email'],
                }
            ],
            where: { id: dataId, categories_id: category.healthCheckup },
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
        const results = await reimbursementsGeneral.findOne({
            attributes: [
                [
                    literal("category.fund - SUM(reimbursementsGeneral.fund_sum_request)"),
                    "fundRemaining"
                ],
                [col("category.per_times"), "perTimes"],
                [
                    literal("category.per_years - COUNT(reimbursementsGeneral.fund_sum_request)"),
                    "requestsRemaining"
                ],
                [
                    literal("category.per_users - COUNT(reimbursementsGeneral.fund_sum_request)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["category.id"]
        });
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            if (fund_sum_request < oldWelfareData.fund_sum_request) {
                return next();
            }
            else if (fund_sum_request > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                });
            }
            else {
                const diffFund = fund_sum_request - oldWelfareData.fund_sum_request;
                if ((datas.fundRemaining === 0 || datas.fundRemaining - diffFund < 0) && !isNullOrEmpty(datas.fundRemaining)) {
                    return res.status(400).json({
                        message: "ไม่สามารถทำรายการได้เนื่องจากเกินเพดานเงินคงเหลือ",
                    });
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
        console.log('============================checkFullPerTimes====================')
        const { fund_sum_request } = req.body;
        if(req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)){
            return next();
        }
        const getFund = await categories.findOne({
            attributes: [
                [col("fund"), "fundRemaining"],
                [col("per_times"), "perTimes"],
            ],
            where: { id: category.healthCheckup }
        })
        if (getFund) {
            const datas = JSON.parse(JSON.stringify(getFund));
            if (fund_sum_request > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_sum_request > datas.fundRemaining && !isNullOrEmpty(datas.fundRemaining)) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
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
        const { status } = req.body;
        const { filter } = req.query;
        var whereObj = { ...filter }
        const { fund_sum_request } = req.body;
        const results = await reimbursementsGeneral.findOne({
            attributes: [
                [
                    literal("category.fund - SUM(reimbursementsGeneral.fund_sum_request)"),
                    "fundRemaining"
                ],
                [col("category.per_times"), "perTimes"],
                [
                    literal("category.per_years - COUNT(reimbursementsGeneral.fund_sum_request)"),
                    "requestsRemaining"
                ],
                [
                    literal("category.per_users - COUNT(reimbursementsGeneral.fund_sum_request)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                }
            ],
            where: whereObj,
            group: ["category.id"]
        });
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            if (status === 1) {
                return next();
            }
            if (dynamicCheckRemaining(datas)) {
                logger.info('No Remaining', { method });
                return res.status(400).json({
                    message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการดังกล่าว เนื่องจากได้ทำการขอเบิกครบแล้ว",
                });
            };
            if (fund_sum_request > datas.perTimes && !isNullOrEmpty(datas.perTimes)) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_sum_request > datas.fundRemaining && !isNullOrEmpty(datas.fundRemaining)) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
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
            where: { id: dataId, created_by: id, categories_id: category.healthCheckup },
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

// Get file by name
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

// Delete file helper
const deleteFileFromDisk = (fileName) => {
    if (!fileName) return;
    const filePath = path.join(fileFolder, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
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
    fileMedicalCertificate: 'medical-certificate',
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
        // If new filename already exists, add timestamp to make it unique
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

// Upload files for existing record
const uploadFilesForRecord = async (req, res, next) => {
    const method = 'uploadFilesForRecord';
    try {
        const dataId = req.params['id'];
        const { id } = req.user;

        // Get current record with user information
        const record = await reimbursementsGeneral.findOne({
            where: { id: dataId, categories_id: category.healthCheckup },
            include: [
                {
                    model: users,
                    as: 'created_by_user',
                    attributes: ['name']
                }
            ]
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

        await reimbursementsGeneral.update(updateData, {
            where: { id: dataId }
        });

        logger.info('Files uploaded successfully', { method, data: { id, dataId } });
        res.status(200).json({ 
            message: 'อัปโหลดไฟล์สำเร็จ',
            files: {
                fileReceipt: updateData.file_receipt || currentData.file_receipt,
                fileMedicalCertificate: updateData.file_medical_certificate || currentData.file_medical_certificate
            }
        });
    } catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete specific file from record
const deleteFileFromRecord = async (req, res, next) => {
    const method = 'deleteFileFromRecord';
    try {
        const dataId = req.params['id'];
        const { fileType } = req.body; // 'receipt' or 'medical_certificate'
        const { id } = req.user;

        if (!['receipt', 'medical_certificate'].includes(fileType)) {
            return res.status(400).json({ message: 'ประเภทไฟล์ไม่ถูกต้อง' });
        }

        const record = await reimbursementsGeneral.findOne({
            where: { id: dataId, categories_id: category.healthCheckup }
        });

        if (!record) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        }

        const currentData = record.toJSON();
        const fieldName = fileType === 'receipt' ? 'file_receipt' : 'file_medical_certificate';
        
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