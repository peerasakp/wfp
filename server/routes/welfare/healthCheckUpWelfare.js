var express = require('express');
var router = express.Router();
const reimbursementsGeneralController = require('../../controllers/healthCheckUpWelfareController');
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
    uploadFilesForRecord,
    deleteFileFromRecord,
    getFileByName
} = require('../../middleware/healthCheckUpWelfare')
const { healthCheck } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware')

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/file/get-by-name', authPermission, getFileByName);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsGeneralController.getById);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsGeneralController.getById);
// Post Methods
router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create, healthCheck, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.post('/file/upload/:id', authPermission, handleFileUpload, uploadFilesForRecord);
router.post('/file/delete/:id', authPermission, deleteFileFromRecord);
// Put Methods
router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, esign.preloadGeneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.put('/approve-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, esign.preloadGeneralApprove, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);

module.exports = router;