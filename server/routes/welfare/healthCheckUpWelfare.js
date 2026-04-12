var express = require('express');
var router = express.Router();
const reimbursementsGeneralController = require('../../controllers/healthCheckUpWelfareController');
const { logReimbursementCreate, logReimbursementUpdate, logReimbursementView } = require('../../middleware/activityLog');
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
} = require('../../middleware/healthCheckUpWelfare');
const { healthCheck } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware');
const minio = require('../../middleware/e-signature/minio.middleware');
const { prepareGeneralSubmitEsign, respondDraftCreateWithoutEsign } = require('../../middleware/submitDraftWithEsign.middleware');
const category = require('../../enum/category');

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/file/get-by-name', authPermission, getFileByName);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, logReimbursementView('HEALTH_CHECKUP'), reimbursementsGeneralController.getById);
router.get('/:id', authPermission, byIdMiddleWare, logReimbursementView('HEALTH_CHECKUP'), reimbursementsGeneralController.getById);
// Post Methods
router.post('/', authPermission, logReimbursementCreate('HEALTH_CHECKUP'), checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create, respondDraftCreateWithoutEsign, healthCheck, esign.acknowledgeDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.post('/file/upload/:id', authPermission, handleFileUpload, uploadFilesForRecord);
router.post('/file/delete/:id', authPermission, deleteFileFromRecord);
// Put Methods
router.put('/:id', authPermission, logReimbursementUpdate('HEALTH_CHECKUP'), prepareGeneralSubmitEsign(category.healthCheckup), checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update, healthCheck, esign.acknowledgeDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.put('/update-welfare/:id', authPermissionEditor, logReimbursementUpdate('HEALTH_CHECKUP'), checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, esign.preloadGeneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.put('/approve-welfare/:id', authPermissionEditor, logReimbursementUpdate('DENTAL'), checkNullValue, bindUpdate, esign.preloadGeneralApprove, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.put('/disburse-welfare/:id', authPermissionEditor, logReimbursementUpdate('HEALTH_CHECKUP'), checkNullValue, bindUpdate, esign.preloadGeneralDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);

module.exports = router;