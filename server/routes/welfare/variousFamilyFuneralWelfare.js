var express = require('express');
var router = express.Router();
const reimbursementsAssistController = require('../../controllers/variousWelfareFuneralFamilyController');
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
} = require('../../middleware/variousWelfareFuneralFamily')
const { funeralFamily } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware')

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsAssistController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsAssistController.getRemaining);
router.get('/get-file', authPermission, getFileByName);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsAssistController.getById);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsAssistController.getById);
// Post Methods
router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsAssistController.create, funeralFamily, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsAssistController.update);
router.post('/upload-file/:id', authPermission, handleFileUpload, uploadFilesForRecord);
// Put Methods
router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsAssistController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, reimbursementsAssistController.update, esign.preloadFuneralVerify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsAssistController.update);
router.put('/delete-file/:id', authPermission, deleteFileFromRecord);
router.put('/approve-welfare/:id', esign.preloadAssistApprove, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsAssistController.update);
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementsAssistController.delete);

module.exports = router;