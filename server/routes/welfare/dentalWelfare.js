var express = require('express');
var router = express.Router();
const reimbursementsGeneralController = require('../../controllers/dentalWelfareController');
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
} = require('../../middleware/dentalWelfare')
const { dental } = require('../../middleware/pdf-management/pdfManagement.middleware')
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware')

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/file/get-by-name', authPermission, getFileByName);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsGeneralController.getById, logReimbursementView('DENTAL'));
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsGeneralController.getById, logReimbursementView('DENTAL'));
// Post Methods
router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create, dental, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update, logReimbursementCreate('DENTAL'));
// Put Methods
router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update, logReimbursementUpdate('DENTAL'));
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, reimbursementsGeneralController.update, esign.preloadGeneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsGeneralController.update, logReimbursementUpdate('DENTAL'));

router.post('/file/upload/:id', authPermission, handleFileUpload, uploadFilesForRecord);
router.post('/file/delete/:id', authPermission, deleteFileFromRecord);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);

module.exports = router;