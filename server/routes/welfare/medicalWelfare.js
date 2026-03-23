var express = require('express');
var router = express.Router();
const reimbursementsGeneralController = require('../../controllers/medicalWelfareController');
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
} = require('../../middleware/medicalWelfare');
const { medical } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware');
const minio = require('../../middleware/e-signature/minio.middleware');

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/file/get-by-name', authPermission, getFileByName);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, logReimbursementView('MEDICAL'), reimbursementsGeneralController.getById);
router.get('/:id', authPermission, byIdMiddleWare, logReimbursementView('MEDICAL'), reimbursementsGeneralController.getById);
// Post Methods
router.post('/', authPermission, logReimbursementCreate('MEDICAL'), checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create, medical, esign.acknowledgeDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.post('/file/upload/:id', authPermission, handleFileUpload, uploadFilesForRecord);
router.post('/file/delete/:id', authPermission, deleteFileFromRecord);
// Put Methods
router.put('/:id', authPermission, logReimbursementUpdate('MEDICAL'), checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update, minio.putFile, esign.stamper, minio.getPublicFile, reimbursementsGeneralController.update, minio.deleteFile);
router.put('/update-welfare/:id', authPermissionEditor, logReimbursementUpdate('MEDICAL'), checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, esign.preloadGeneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.put('/approve-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, esign.preloadGeneralApprove, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update);
router.put('/disburse-welfare/:id', authPermissionEditor, logReimbursementUpdate('MEDICAL'), checkNullValue, bindUpdate, esign.preloadGeneralDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update)
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);

module.exports = router;