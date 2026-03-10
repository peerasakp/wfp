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
} = require('../../middleware/medicalWelfare')
const { medical } = require('../../middleware/pdf-management/pdfManagement.middleware')
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware');
const { min } = require('date-fns/min');

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/file/get-by-name', authPermission, getFileByName);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsGeneralController.getById, logReimbursementView('MEDICAL'));
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsGeneralController.getById, logReimbursementView('MEDICAL'));

router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create, medical, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update, logReimbursementCreate('MEDICAL'));

router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update, minio.putFile, esign.stamper, minio.getPublicFile, reimbursementsGeneralController.update, minio.deleteFile, logReimbursementUpdate('MEDICAL'));
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, esign.preloadGeneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update, logReimbursementUpdate('MEDICAL'));

router.post('/file/upload/:id', authPermission, handleFileUpload, uploadFilesForRecord);
router.post('/file/delete/:id', authPermission, deleteFileFromRecord);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);

module.exports = router;