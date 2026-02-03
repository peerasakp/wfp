const { isNullOrEmpty, getFiscalYear, getYear2Digits, formatNumber, isInvalidNumber, dynamicCheckRemaining } = require('../middleware/utility');
const { initLogger } = require('../logger');
const logger = initLogger('DentalValidator');
const { Op, literal, col } = require('sequelize')
const permissionType = require('../enum/permission')
const statusText = require('../enum/statusText')
const status = require('../enum/status')
const category = require('../enum/category');
const welfareType = require('../enum/welfareType');
const { permissionsHasRoles, reimbursementsGeneral, categories,users, sequelize } = require('../models/mariadb')
const { sendMail } = require('../helper/mail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const fileFolder = path.join(__dirname, '..', 'public', 'upload', 'dental-care-welfare');
if (!fs.existsSync(fileFolder)) {
    fs.mkdirSync(fileFolder, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, callback) { callback(null, fileFolder); },
    filename: function (req, file, callback) {
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        callback(null, Date.now() + '-' + originalname);
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
        if (!isAccess) {
            throw Error("You don't have access to this API");
        }
        else {
            const isEditor = await permissionsHasRoles.count({
                where: {
                    [Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.welfareManagement }],
                },
            });
            if (isEditor) req.isEditor = true;
        }
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
            '$reimbursementsGeneral.categories_id$': { [Op.eq]: category.dentalWelfare },
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
                '$reimbursementsGeneral.categories_id$': { [Op.eq]: category.dentalWelfare },
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
        const { fundReceipt, fundSumRequest, dateReceipt, actionId } = req.body;
        if (req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)) {
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

        if (isNullOrEmpty(fundSumRequest)) {
            errorObj["fundSumRequest"] = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
        } else if (isInvalidNumber(fundSumRequest)) {
            errorObj["fundSumRequest"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundSumRequest <= 0) {
            return res.status(400).json({
                message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
            });
        }
        if (isNullOrEmpty(dateReceipt)) {
            errorObj["dateReceipt"] = "กรุณากรอก วัน/เดือน/ปี ตามใบเสร็จ";
        }
        if ((isNullOrEmpty(actionId) || (actionId != status.draft && actionId != status.waitApprove)) && !req.access) {
            return res.status(400).json({
                message: "ไม่มีการกระทำที่ต้องการ",
            });
        }
        if (Number(fundSumRequest) > Number(fundReceipt)) {
            return res.status(400).json({
                message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบเสร็จรับเงินได้",
            });
        }
        if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
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
        const { fundReceipt, fundSumRequest, dateReceipt, createFor, actionId } = req.body;
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
        var reimNumber = getYear2Digits() + formatNumber(welfareType.general) + formatNumber(category.dentalWelfare) + formatNumber(1);
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            reimNumber = getYear2Digits() + formatNumber(welfareType.general) + formatNumber(category.dentalWelfare) + formatNumber(Number(datas.id) + 1);
        }
        const dataBinding = {
            reim_number: reimNumber,
            fund_receipt: fundReceipt,
            date_receipt: dateReceipt,
            fund_sum_request: fundSumRequest,
            created_by: createFor ?? id,
            updated_by: id,
            status: actionId,
            request_date: actionId === status.waitApprove ? new Date() : null,
            categories_id: category.dentalWelfare,
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
        const { fundReceipt, fundSumRequest, dateReceipt, createFor, actionId } = req.body;
        const { id } = req.user;
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
            where: { id: dataId, categories_id: category.dentalWelfare },
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
            if (req.access && (datas.status != statusText.waitApprove)) {
                return res.status(400).json({
                    message: "ไม่สามารถแก้ไขได้ เนื่องจากสถานะไม่ถูกต้อง",
                });
            }
            if (req.access && (actionId === status.NotApproved || actionId === status.approve) && !isNullOrEmpty(actionId)) {
                const dataBinding = {
                    status: actionId,
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
            date_receipt: dateReceipt,
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
            { '$reimbursementsGeneral.categories_id$': category.dentalWelfare },
            { '$reimbursementsGeneral.status$': { [Op.eq]: status.approve } }
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
            where: { id: dataId, categories_id: category.dentalWelfare },
        });
        if (!welfareCheckData) {
            return res.status(400).json({
                message: "ไม่พบข้อมูล",
            });
        }
        const oldWelfareData = JSON.parse(JSON.stringify(welfareCheckData));
        if (req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)) {
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
        const { fund_sum_request } = req.body;
        if(req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)){
            return next();
        }
        const getFund = await categories.findOne({
            attributes: [
                [col("fund"), "fundRemaining"],
                [col("per_times"), "perTimes"],
            ],
            where: { id: category.dentalWelfare }
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
                    literal(
                        "category.per_users - COUNT(reimbursementsGeneral.fund_sum_request)"
                    ),
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
            where: { id: dataId, created_by: id, categories_id: category.dentalWelfare },
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
        if (!fileName) return res.status(400).json({ message: 'fileName is required' });
        const filePath = path.join(fileFolder, fileName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'ไม่พบไฟล์' });
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
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const sanitizeFileName = (name) => {
    if (!name || name.trim() === '') return 'unknown';
    return name.replace(/\s+/g, '_').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/_{2,}/g, '_').trim() || 'unknown';
};

const generateReceiptFileName = (originalFileName, userName, requestDate) => {
    const ext = path.extname(originalFileName);
    const date = requestDate ? requestDate.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `receipt-${date}-${sanitizeFileName(userName)}${ext}`;
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
            fs.renameSync(oldPath, path.join(fileFolder, uniqueFileName));
            return uniqueFileName;
        }
        fs.renameSync(oldPath, newPath);
        return newFileName;
    }
    return null;
};

const uploadFilesForRecord = async (req, res, next) => {
    const method = 'uploadFilesForRecord';
    try {
        const dataId = req.params['id'];
        const { id } = req.user;
        const record = await reimbursementsGeneral.findOne({
            where: { id: dataId, categories_id: category.dentalWelfare },
            include: [{ model: users, as: 'created_by_user', attributes: ['name'] }]
        });
        if (!record) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        const currentData = record.toJSON();
        const updateData = {};
        if (req.files?.fileReceipt?.[0]) {
            if (currentData.file_receipt) deleteFileFromDisk(currentData.file_receipt);
            const tempFileName = req.files.fileReceipt[0].filename;
            let userName = currentData.created_by_user?.name;
            if (!userName?.trim()) {
                const userRecord = await users.findByPk(currentData.created_by);
                if (userRecord) userName = userRecord.name;
            }
            if (!userName?.trim()) userName = 'unknown';
            const requestDate = currentData.request_date || null;
            const newFileName = generateReceiptFileName(tempFileName, userName, requestDate);
            updateData.file_receipt = renameFile(tempFileName, newFileName) || tempFileName;
        }
        if (req.files?.fileMedicalCertificate?.[0]) {
            if (currentData.file_medical_certificate) deleteFileFromDisk(currentData.file_medical_certificate);
            updateData.file_medical_certificate = req.files.fileMedicalCertificate[0].filename;
        }
        if (Object.keys(updateData).length === 0) return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์' });
        updateData.updated_by = id;
        await reimbursementsGeneral.update(updateData, { where: { id: dataId } });
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

const deleteFileFromRecord = async (req, res, next) => {
    const method = 'deleteFileFromRecord';
    try {
        const dataId = req.params['id'];
        const { fileType } = req.body;
        const { id } = req.user;
        if (!['receipt', 'medical_certificate'].includes(fileType)) return res.status(400).json({ message: 'ประเภทไฟล์ไม่ถูกต้อง' });
        const record = await reimbursementsGeneral.findOne({ where: { id: dataId, categories_id: category.dentalWelfare } });
        if (!record) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        const currentData = record.toJSON();
        const fieldName = fileType === 'receipt' ? 'file_receipt' : 'file_medical_certificate';
        if (currentData[fieldName]) {
            deleteFileFromDisk(currentData[fieldName]);
            await reimbursementsGeneral.update({ [fieldName]: null, updated_by: id }, { where: { id: dataId } });
            logger.info('File deleted successfully', { method, data: { id, dataId, fileType } });
            res.status(200).json({ message: 'ลบไฟล์สำเร็จ' });
        } else res.status(404).json({ message: 'ไม่พบไฟล์ที่ต้องการลบ' });
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