const { isNullOrEmpty, getFiscalYear, getYear2Digits, formatNumber, isInvalidNumber, dynamicCheckRemaining } = require('../middleware/utility');
const { initLogger } = require('../logger');
const logger = initLogger('UserValidator');
const { Op, literal, col, fn } = require('sequelize')
const permissionType = require('../enum/permission')
const statusText = require('../enum/statusText')
const status = require('../enum/status')
const category = require('../enum/category');
const welfareType = require('../enum/welfareType');
const { permissionsHasRoles, reimbursementsEmployeeDeceased, categories, reimbursementsEmployeeDeceasedHasCategories,users, sequelize } = require('../models/mariadb');
const { sendMail } = require('../helper/mail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const fileFolder = path.join(__dirname, '..', 'public', 'upload', 'funeral-welfare');
if (!fs.existsSync(fileFolder)) fs.mkdirSync(fileFolder, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, fileFolder),
    filename: (req, file, cb) => {
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.fieldname}-${originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('อนุญาตเฉพาะไฟล์ PDF, JPG, JPEG, PNG เท่านั้น'));
    }
}).fields([
    { name: 'fileReceipt', maxCount: 1 },
    { name: 'fileIdCard', maxCount: 1 },
    { name: 'fileDeathCertificate', maxCount: 1 },
    { name: 'fileWreathReceipt', maxCount: 1 },
    { name: 'fileWreathDocument', maxCount: 1 },
    { name: 'fileVehicleReceipt', maxCount: 1 },
    { name: 'fileVehicleDocument', maxCount: 1 },
]);

const handleFileUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'ขนาดไฟล์ต้องไม่เกิน 10MB' });
            return res.status(400).json({ message: err.message });
        }
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
};

const getFileByName = async (req, res, next) => {
    try {
        const { fileName } = req.query;
        if (!fileName) return res.status(400).json({ message: 'fileName is required' });
        const filePath = path.join(fileFolder, fileName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'ไม่พบไฟล์' });
        const ext = path.extname(fileName).toLowerCase();
        const contentTypes = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        logger.error(`Error ${error.message}`, { method: 'getFileByName' });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

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
    fileIdCard: 'id-card',
    fileDeathCertificate: 'death-certificate',
    fileWreathReceipt: 'wreath-receipt',
    fileWreathDocument: 'wreath-document',
    fileVehicleReceipt: 'vehicle-receipt',
    fileVehicleDocument: 'vehicle-document',
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

const uploadFilesForRecord = async (req, res, next) => {
    try {
        const dataId = req.params['id'];
        const record = await reimbursementsEmployeeDeceased.findOne({
            where: { id: dataId },
            include: [{ model: users, as: 'created_by_user', attributes: ['name'] }]
        });
        if (!record) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

        const currentData = record.toJSON();

        const fileFieldMap = {
            fileReceipt: 'file_receipt',
            fileIdCard: 'file_id_card',
            fileDeathCertificate: 'file_death_certificate',
            fileWreathReceipt: 'file_wreath_receipt',
            fileWreathDocument: 'file_wreath_document',
            fileVehicleReceipt: 'file_vehicle_receipt',
            fileVehicleDocument: 'file_vehicle_document',
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
        for (const [formField, dbField] of Object.entries(fileFieldMap)) {
            if (req.files && req.files[formField] && req.files[formField][0]) {
                if (record[dbField]) deleteFileFromDisk(record[dbField]);
                const tempFileName = req.files[formField][0].filename;
                const prefix = fieldPrefixMap[formField] || formField;
                const newFileName = generateFileName(tempFileName, userName, requestDate, prefix);
                updateData[dbField] = renameFile(tempFileName, newFileName) || tempFileName;
            }
        }

        if (Object.keys(updateData).length > 0) {
            await record.update(updateData);
        }

        res.status(200).json({ message: 'อัปโหลดไฟล์สำเร็จ' });
    } catch (error) {
        logger.error(`Error ${error.message}`, { method: 'uploadFilesForRecord' });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
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
        req.query.filter = {
            [Op.and]: []
        };

        if (!isNullOrEmpty(keyword)) {
            req.query.filter[Op.and].push({
                '$reimbursementsEmployeeDeceased.reim_number$': { [Op.like]: `%${keyword}%` },
            });
        }

        if (!isNullOrEmpty(from) && !isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$reimbursementsEmployeeDeceased.request_date$': { [Op.between]: [from, to] },
            });
        } else if (!isNullOrEmpty(from)) {
            req.query.filter[Op.and].push({
                '$reimbursementsEmployeeDeceased.request_date$': { [Op.eq]: from },
            });
        }

        if (!isNullOrEmpty(status)) {
            req.query.filter[Op.and].push({
                '$reimbursementsEmployeeDeceased.status$': { [Op.eq]: status },
            });
        }

        req.query.filter[Op.and].push({
            '$reimbursementsEmployeeDeceased.created_by$': { [Op.eq]: id },
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
                { '$reimbursements_employee_deceased.id$': { [Op.eq]: dataId } },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursements_employee_deceased.id$': { [Op.eq]: dataId } },
                { '$reimbursements_employee_deceased.created_by$': { [Op.eq]: id }, }
            );
        }
        req.query.filter[Op.and].push(
            {
                '$reimbursements_employee_deceased.categories.id$': { [Op.eq]: category.funeralWelfareEmployeeDeceased },
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
        const { fundReceipt, deceased, organizer, fundRequest, fundReceiptWreath, fundWreathUniversity, fundWreathArrange,
            fundReceiptVehicle, fundVehicle, selectedWreath, selectedVehicle, actionId } = req.body;
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
                message: "จำนวนเงินตามใบเสร็จน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
            });
        }

        if (isNullOrEmpty(fundRequest)) {
            errorObj["fundRequest"] = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
        } else if (isInvalidNumber(fundRequest)) {
            errorObj["fundRequest"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
        } else if (fundRequest < 0) {
            return res.status(400).json({
                message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
            });
        }
        if (Number(fundRequest) > Number(fundReceipt)) {
            return res.status(400).json({
                message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบสำคัญรับเงินได้",
            });
        }

        // if (isNullOrEmpty(organizer)) {
        //     errorObj["decease"] = "กรุณากรอกเลือก ชื่อ - นามสกุล ของผู้จัดงาน";
        // }

        if (isNullOrEmpty(deceased)) {
            errorObj["deceased"] = "กรุณากรอกเลือก ชื่อ - นามสกุล ของผู้เสียชีวิต";
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
            if (fundWreathUniversity < 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (fundWreathArrange < 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (Number(fundSumWreathRequest) > Number(fundReceiptWreath)) {
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
        if (selectedVehicle) {
            if (isNullOrEmpty(fundReceiptVehicle)) {
                errorObj["fundReceiptVehicle"] = "กรุณากรอกข้อมูลจำนวนเงินสนับสนุนค่าพาหนะเหมาจ่ายตามใบสำคัญรับเงิน";
            } else if (isInvalidNumber(fundReceiptVehicle)) {
                errorObj["fundReceiptVehicle"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundReceiptVehicle <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินตามใบสำคัญรับเงินน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (isNullOrEmpty(fundVehicle)) {
                errorObj["fundVehicle"] = "กรุณากรอกข้อมูลจำนวนเงินสนับสนุนค่าพาหนะเหมาจ่ายที่ต้องการเบิก";
            } else if (isInvalidNumber(fundVehicle)) {
                errorObj["fundVehicle"] = "ค่าที่กรอกไม่ใช่ตัวเลข";
            } else if (fundVehicle <= 0) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกน้อยกว่าหรือเท่ากับ 0 ไม่ได้",
                });
            }
            if (Number(fundVehicle) > Number(fundReceiptVehicle)) {
                return res.status(400).json({
                    message: "จำนวนเงินที่ต้องการเบิกไม่สามารถมากกว่าจำนวนเงินตามใบสำคัญรับเงินได้",
                });
            }
        }
        else {
            req.body = {
                ...req.body,
                fundReceiptVehicle: null,
                fundVehicle: null,
            }
        }
        if ((isNullOrEmpty(actionId) || (actionId != status.draft && actionId != status.waitApprove)) && !req.access) {
            return res.status(400).json({
                message: "ไม่มีการกระทำที่ต้องการ",
            });
        }
        if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
        var fundSumWreathRequest = Number(fundWreathUniversity) + Number(fundWreathArrange);
        var fundSumRequest = Number(fundRequest) + Number(fundSumWreathRequest) + Number(fundVehicle);
        var fundSumReceipt = Number(fundReceipt) + Number(fundReceiptWreath) + Number(fundReceiptVehicle);
        req.body = {
            ...req.body,
            fundSumReceipt: fundSumReceipt,
            fundSumRequest: fundSumRequest,
        }
        next();
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,  // เพิ่มข้อมูลของข้อผิดพลาดใน response
        });
    }

}
const bindCreate = async (req, res, next) => {
    try {

        const {
            fundReceipt, deceased, organizer, fundRequest, fundReceiptWreath, fundWreathUniversity, fundWreathArrange,
            fundReceiptVehicle, fundVehicle, selectedWreath, selectedVehicle, actionId, fundSumRequest, fundSumReceipt, createFor } = req.body;
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
        const results = await reimbursementsEmployeeDeceased.findOne({
            attributes: ["id"],
            order: [["id", "DESC"]]
        });
        var reimNumber = getYear2Digits() + formatNumber(welfareType.deceased) + formatNumber(category.funeralWelfareEmployeeDeceased) + formatNumber(1);
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            reimNumber = getYear2Digits() + formatNumber(welfareType.deceased) + formatNumber(category.funeralWelfareEmployeeDeceased) + formatNumber(Number(datas.id) + 1);
        }
        const dataBinding = {
            reim_number: reimNumber,
            organizer: organizer ? organizer : null,
            deceased: deceased,
            selected_wreath: selectedWreath,
            selected_vehicle: selectedVehicle,
            fund_receipt: fundReceipt,
            fund_request: fundRequest,
            fund_receipt_wreath: fundReceiptWreath,
            fund_wreath_university: fundWreathUniversity,
            fund_wreath_arrange: fundWreathArrange,
            fund_receipt_vehicle: fundReceiptVehicle,
            fund_vehicle: fundVehicle,
            fund_sum_request: fundSumRequest,
            fund_sum_receipt: fundSumReceipt,
            created_by: createFor ?? id,
            updated_by: id,
            status: actionId,
            request_date: actionId === status.waitApprove ? new Date() : null,
            categories_id: category.funeralWelfareEmployeeDeceased,
        }
        req.body = dataBinding;
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};
const bindUpdate = async (req, res, next) => {
    try {
        const {
            fundReceipt, deceased, organizer, fundRequest, fundReceiptWreath, fundWreathUniversity, fundWreathArrange,
            fundReceiptVehicle, fundVehicle, selectedWreath, selectedVehicle, actionId, fundSumRequest, fundSumReceipt, createFor } = req.body;
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
        const results = await reimbursementsEmployeeDeceased.findOne({
            attributes: ["status", "created_by"],
            where: { id: dataId, },
        });
        var checkData;
        if (results) {
            const datas = JSON.parse(JSON.stringify(results));
            checkData = datas.deceased;
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
            organizer: organizer,
            deceased: deceased,
            selected_wreath: selectedWreath,
            selected_vehicle: selectedVehicle,
            fund_receipt: fundReceipt,
            fund_request: fundRequest,
            fund_receipt_wreath: fundReceiptWreath,
            fund_wreath_university: fundWreathUniversity,
            fund_wreath_arrange: fundWreathArrange,
            fund_receipt_vehicle: fundReceiptVehicle,
            fund_vehicle: fundVehicle,
            fund_sum_request: fundSumRequest,
            fund_sum_receipt: fundSumReceipt,
            updated_by: id,
        }
        if (!isNullOrEmpty(actionId)) {
            if (req.access && actionId != status.approve) {
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
        if (!isNullOrEmpty(checkData) && req.access) {
            dataBinding.checkData = checkData;
        }
        req.body = dataBinding;

        next();
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message, // เพิ่มข้อมูลของข้อผิดพลาดใน response
        });
    }
};
const getRemaining = async (req, res, next) => {
    const method = 'RemainingMiddleware';
    try {
        const { id } = req.user;
        const { deceasedId } = req.query;
        const { deceased, checkData } = req.body;
        if (req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)) {
            return next();
        }
        req.query.filter = {};
        req.query.filter[Op.and] = [];
        const getFiscalYearWhere = getFiscalYear();
        if (req.access && !isNullOrEmpty(checkData)) {
            req.query.filter[Op.and].push(
                { '$reimbursements_employee_deceased.deceased$': checkData },
            );
        }
        else if (!isNullOrEmpty(deceasedId)) {
            req.query.filter[Op.and].push(
                { '$reimbursements_employee_deceased.deceased$': deceasedId },
            );
        }
        else {
            req.query.filter[Op.and].push(
                { '$reimbursements_employee_deceased.deceased$': deceased ?? id },
            );
        }
        req.query.filter[Op.and].push(
            { '$reimbursements_employee_deceased.request_date$': getFiscalYearWhere },
            { '$reimbursements_employee_deceased.status$': { [Op.eq]: status.approve } },
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
        const { fund_request, fund_wreath_university, fund_wreath_arrange, fund_vehicle, actionId } = req.body;

        const welfareCheckData = await reimbursementsEmployeeDeceased.findOne({
            attributes: ["fund_request", "fund_wreath_university", "fund_wreath_arrange", "fund_vehicle", "reim_number"],
            include: [
                {
                    model: users,
                    as: "created_by_user",
                    attributes: ['name', 'email'],
                }
            ],
            where: { id: dataId, },
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
            { '$category.id$': 9 }
        );
        const decreaseRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
            attributes: [
                [
                    literal("category.fund - SUM(reimbursements_employee_deceased.fund_request)"),
                    "fundRemaining"
                ],
                [
                    literal("category.per_years - COUNT(reimbursements_employee_deceased.fund_request)"),
                    "requestsRemaining"
                ],
                [col("category.per_times"), "perTimes"],
                [
                    literal("category.per_users - COUNT(reimbursements_employee_deceased.fund_request)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
                {
                    model: reimbursementsEmployeeDeceased,
                    as: "reimbursements_employee_deceased",
                    attributes: [],

                },
            ],
            where: whereObj,
            group: ["category.id"],
        });

        whereObj[Op.and].push({ '$category.id$': { [Op.in]: [10, 11] } });

        const wreathRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
            attributes: [
                [col("category.per_times"), "perTimes"],
                // fund_wreath_arrange
                [
                    fn("SUM", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE 0 END")),
                    "fundRemainingArrange"
                ],
                [
                    fn("category.per_years - COUNT", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END")),
                    "requestsRemainingArrange"
                ],
                [
                    literal("category.per_users - COUNT(CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END)"),
                    "perUsersRemainingArrange"
                ],
                // fund_wreath_university
                [
                    fn("SUM", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE 0 END")),
                    "fundRemainingUniversity"
                ],
                [
                    fn("category.per_years - COUNT", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END")),
                    "requestsRemainingUniversity"
                ],
                [
                    literal("category.per_users - COUNT(CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END)"),
                    "perUsersRemainingUniversity"
                ],
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
                {
                    model: reimbursementsEmployeeDeceased,
                    as: "reimbursements_employee_deceased",
                    attributes: [],

                },
            ],
            where: whereObj,
            group: ["category.id"],
        });

        whereObj[Op.and] = whereObj[Op.and].filter(item => [10, 11].includes(item['$category.id$']));
        whereObj[Op.and].push({ '$category.id$': 12 });

        const vehicleRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
            attributes: [
                [
                    literal("category.fund - SUM(reimbursements_employee_deceased.fund_vehicle)"),
                    "fundRemaining"
                ],
                [
                    literal("category.per_years - COUNT(reimbursements_employee_deceased.fund_vehicle)"),
                    "requestsRemaining"
                ],
                [col("category.per_times"), "perTimes"],
                [
                    literal("category.per_users - COUNT(reimbursements_employee_deceased.fund_vehicle)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
                {
                    model: reimbursementsEmployeeDeceased,
                    as: "reimbursements_employee_deceased",
                    attributes: [],

                },
            ],
            where: whereObj,
            group: ["category.id"],
        });
        
        if (!isNullOrEmpty(decreaseRemaining) || !isNullOrEmpty(wreathRemaining) || !isNullOrEmpty(vehicleRemaining)) {
            if (!isNullOrEmpty(decreaseRemaining)) {
                const datas = JSON.parse(JSON.stringify(decreaseRemaining[0]));
                if (fund_request < oldWelfareData.fund_request) {
                    return next();
                }
                else if (fund_request > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFundDecease = fund_request - oldWelfareData.fund_request;
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
            if (!isNullOrEmpty(vehicleRemaining)) {
                const datas = JSON.parse(JSON.stringify(vehicleRemaining[0]));
                if (fund_vehicle < oldWelfareData.fund_vehicle) {
                    return next();
                }
                else if (fund_vehicle > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกได้สูงสุด " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                else {
                    const diffFundVehicle = fund_vehicle - oldWelfareData.fund_vehicle;
                    if (datas.fundRemaining === 0 || datas.fundRemaining - diffFundVehicle < 0) {
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
        const { fund_request, fund_wreath_university, fund_wreath_arrange, fund_vehicle } = req.body;
        if (req.access && (req.body.status === status.NotApproved || req.body.status === status.approve) && !isNullOrEmpty(req.body.status)) {
                   return next();
               }
        const getFund = await categories.findAll({
            attributes: [
                [col("id"), "CategoriesId"],
                [col("name"), "CategoriesName"],
                [col("fund"), "fundRemaining"],
                [col("per_years"), "requestsRemaining"],
                [col("per_times"), "perTimesRemaining"],
            ],
            where: {
                id: {
                    [Op.in]: [9, 10, 11, 12]
                }
            }
        })
        if (!isNullOrEmpty(getFund)) {
            const datasDecease = JSON.parse(JSON.stringify(getFund));
            const datasWreath = JSON.parse(JSON.stringify(getFund[0]));
            const datasVehicle = JSON.parse(JSON.stringify(getFund[1]));

            if (fund_request > datasDecease.perTimes && datasDecease.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกได้สูงสุด " + datasDecease.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_request > datasDecease.fundRemaining && datasDecease.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกเกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }

            if (fund_wreath_university > datasWreath.perTimes && datasWreath.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเสียชีวิตของผู้ปฎิบัติงาน ค่าพวงหลีด ในนามมหาวิทยาลัยได้สูงสุด " + datasWreath.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_wreath_university > datasWreath.fundRemaining && datasWreath.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตของผู้ปฎิบัติงาน ค่าพวงหลีด ในนามมหาวิทยาลัย เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }
            if (fund_wreath_arrange > datasWreath.perTimes && datasWreath.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเสียชีวิตของผู้ปฎิบัติงาน ค่าพวงหลีด ในนามส่วนงานได้สูงสุด " + datasWreath.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_wreath_arrange > datasWreath.fundRemaining && datasWreath.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตของผู้ปฎิบัติงาน ค่าพวงหลีด ในนามส่วนงาน เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
                });
            }

            if (fund_vehicle > datasVehicle.perTimes && datasVehicle.perTimes) {
                return res.status(400).json({
                    message: "คุณสามารถเบิกสวัสดิการเสียชีวิตของผู้ปฎิบัติงาน ค่าพาหนะเหมาจ่าย" + datasVehicle.perTimes + " ต่อครั้ง",
                });
            }
            if (fund_vehicle > datasVehicle.fundRemaining && datasVehicle.fundRemaining) {
                logger.info('Request Over', { method });
                return res.status(400).json({
                    message: "จำนวนที่ขอเบิกสวัสดิการเสียชีวิตของผู้ปฎิบัติงาน ค่าพาหนะเหมาจ่าย เกินเพดานเงินกรุณาลองใหม่อีกครั้ง",
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
        const { status, fund_request, fund_wreath_university, fund_wreath_arrange, fund_vehicle } = req.body;
        const { filter } = req.query;
        var whereObj = { ...filter }
        whereObj[Op.and].push(
            { '$category.id$': 9 }
        );
        const decreaseRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
            attributes: [
                [col("category.id"), "categoriesId"],
                [col("category.name"), "categoriesName"],
                [fn("SUM", col("reimbursements_employee_deceased.fund_request")), "totalSumRequested"],
                [col("category.fund"), "fund"],
                [
                    literal("category.fund - SUM(reimbursements_employee_deceased.fund_request)"),
                    "fundRemaining"
                ],
                [fn("COUNT", col("reimbursements_employee_deceased.fund_request")), "totalCountRequested"],
                [col("category.per_years"), "perYears"],
                [
                    literal("category.per_years - COUNT(reimbursements_employee_deceased.fund_request)"),
                    "requestsRemaining"
                ],
                [col("category.per_times"), "perTimesRemaining"],
                [col("category.per_users"), "perUsers"],
                [
                    literal("category.per_users - COUNT(reimbursements_employee_deceased.fund_request)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
                {
                    model: reimbursementsEmployeeDeceased,
                    as: "reimbursements_employee_deceased",
                    attributes: [],

                },
            ],
            where: whereObj,
            group: ["category.id"],
        });
        whereObj[Op.and].push({ '$category.id$': { [Op.in]: [10, 11] } });

        const wreathRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
            attributes: [
                [col("category.id"), "categoriesId"],
                [col("category.name"), "categoriesName"],
                [col("category.fund"), "fund"],
                [col("category.per_years"), "perYears"],
                [col("category.per_times"), "perTimesRemaining"],
                [col("category.per_users"), "perUsers"],
                // fund_wreath_arrange
                [
                    fn("SUM", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE 0 END")),
                    "totalSumRequestedArrange"
                ],
                [
                    fn("SUM", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE 0 END")),
                    "fundRemainingArrange"
                ],
                [
                    fn("COUNT", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END")),
                    "totalCountRequestedArrange"
                ],
                [
                    fn("category.per_years - COUNT", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END")),
                    "requestsRemainingArrange"
                ],
                [
                    literal("category.per_users - COUNT(CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END)"),
                    "perUsersRemainingArrange"
                ],
                // fund_wreath_university
                [
                    fn("SUM", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE 0 END")),
                    "totalSumRequestedUniversity"
                ],
                [
                    fn("SUM", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE 0 END")),
                    "fundRemainingUniversity"
                ],
                [
                    fn("COUNT", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END")),
                    "totalCountRequestedUniversity"
                ],
                [
                    fn("category.per_years - COUNT", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END")),
                    "requestsRemainingUniversity"
                ],
                [
                    literal("category.per_users - COUNT(CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END)"),
                    "perUsersRemainingUniversity"
                ],
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
                {
                    model: reimbursementsEmployeeDeceased,
                    as: "reimbursements_employee_deceased",
                    attributes: [],
                    include: []
                },
            ],
            where: whereObj,
            group: ["category.id"],
        });

        whereObj[Op.and] = whereObj[Op.and].filter(item => [10, 11].includes(item['$category.id$']));
        whereObj[Op.and].push({ '$category.id$': 12 });

        const vehicleRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
            attributes: [
                [col("category.id"), "categoriesId"],
                [col("category.name"), "categoriesName"],
                [fn("SUM", col("reimbursements_employee_deceased.fund_vehicle")), "totalSumRequested"],
                [col("category.fund"), "fund"],
                [
                    literal("category.fund - SUM(reimbursements_employee_deceased.fund_vehicle)"),
                    "fundRemaining"
                ],
                [fn("COUNT", col("reimbursements_employee_deceased.fund_vehicle")), "totalCountRequested"],
                [col("category.per_years"), "perYears"],
                [
                    literal("category.per_years - COUNT(reimbursements_employee_deceased.fund_vehicle)"),
                    "requestsRemaining"
                ],
                [col("category.per_times"), "perTimesRemaining"],
                [col("category.per_users"), "perUsers"],
                [
                    literal("category.per_users - COUNT(reimbursements_employee_deceased.fund_vehicle)"),
                    "perUsersRemaining"
                ]
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
                {
                    model: reimbursementsEmployeeDeceased,
                    as: "reimbursements_employee_deceased",
                    attributes: [],
                    include: []
                },
            ],
            where: whereObj,
            group: ["category.id"],
        });
        if (!isNullOrEmpty(decreaseRemaining) || !isNullOrEmpty(wreathRemaining) || !isNullOrEmpty(vehicleRemaining)) {
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
                if (fund_request > remainingData.perTimes && remainingData.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว " + remainingData.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_request > remainingData.fundRemaining && remainingData.fundRemaining) {
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
            if (!isNullOrEmpty(vehicleRemaining)) {
                const datas = JSON.parse(JSON.stringify(vehicleRemaining[0]));
                if ((dynamicCheckRemaining(datas)) && fund_vehicle) {
                    logger.info('No Remaining', { method });
                    return res.status(400).json({
                        message: "ไม่มีสิทธิ์ขอเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพาหนะ เนื่องจากได้ทำการขอเบิกครบแล้ว",
                    });
                };
                if (fund_vehicle > datas.perTimes && datas.perTimes) {
                    return res.status(400).json({
                        message: "คุณสามารถเบิกสวัสดิการเสียชีวิตครอบครัว สนับสนุนค่าพาหนะ " + datas.perTimes + " ต่อครั้ง",
                    });
                }
                if (fund_vehicle > datas.fundRemaining && datas.fundRemaining) {
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
        const results = await reimbursementsEmployeeDeceased.findOne({
            attributes: ["status"],
            where: { id: dataId, created_by: id, },
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
    getFileByName,
    uploadFilesForRecord
};