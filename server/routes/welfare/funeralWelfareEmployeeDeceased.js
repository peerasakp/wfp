var express = require('express');
var router = express.Router();
const reimbursementsEmployeeDeceasedController = require('../../controllers/funeralWelfareEmployeeDeceasedController');
const {
    authPermission,
    bindFilter,
    getRemaining,
    checkRemaining,
    bindUpdate,
    bindCreate,
    deletedMiddleware,
    byIdMiddleWare,
    authPermissionEditor,
    checkNullValue,
    checkUpdateRemaining,
    checkFullPerTimes,
    handleFileUpload,
    getFileByName,
    uploadFilesForRecord
} = require('../../middleware/funeralWelfareEmployeeDeceased')
const { funeralEmployee } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware');
const { min } = require('date-fns/min');

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsEmployeeDeceasedController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsEmployeeDeceasedController.getRemaining);
router.get('/get-file', authPermission, getFileByName);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsEmployeeDeceasedController.getById);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsEmployeeDeceasedController.getById);
// Post Methods
router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.create, funeralEmployee, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsEmployeeDeceasedController.update);
router.post('/upload-file/:id', authPermission, handleFileUpload, uploadFilesForRecord);
// Put Methods
router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, esign.preloadFuneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsEmployeeDeceasedController.update);
router.put('/approve-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, esign.preloadFuneralApprove, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsEmployeeDeceasedController.update)
router.put('/disburse-welfare/:id', authPermissionEditor, esign.preloadFuneralDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.acknowledgeDisburse, esign.nornalize, reimbursementsEmployeeDeceasedController.update)
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementsEmployeeDeceasedController.delete);

module.exports = router;