var express = require('express');
var router = express.Router();
const reimbursementsEmployeeDeceasedController = require('../../controllers/funeralWelfareEmployeeDeceasedController');
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
    getFileByName,
    uploadFilesForRecord
} = require('../../middleware/funeralWelfareEmployeeDeceased')
const { funeralEmployee } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware')

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementsEmployeeDeceasedController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsEmployeeDeceasedController.getRemaining);
router.get('/get-file', authPermission, getFileByName);
router.get('/:id', authPermission, byIdMiddleWare, logReimbursementView('FUNERAL_EMPLOYEE'), reimbursementsEmployeeDeceasedController.getById);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, logReimbursementView('FUNERAL_EMPLOYEE'), reimbursementsEmployeeDeceasedController.getById);

router.post('/', authPermission, logReimbursementCreate('FUNERAL_EMPLOYEE'), checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.create, funeralEmployee, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsEmployeeDeceasedController.update);
router.post('/upload-file/:id', authPermission, handleFileUpload, uploadFilesForRecord);

router.put('/:id', authPermission, logReimbursementUpdate('FUNERAL_EMPLOYEE'), checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.update);
router.put('/update-welfare/:id', authPermissionEditor, logReimbursementUpdate('FUNERAL_EMPLOYEE'), checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, esign.preloadAssist, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementsEmployeeDeceasedController.update);
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementsEmployeeDeceasedController.delete);

module.exports = router;