var express = require('express');
var router = express.Router();
const reimbursementChildrenEducationController = require('../../controllers/reimbursementChildrenEducationController');
const { logReimbursementCreate, logReimbursementUpdate, logReimbursementView } = require('../../middleware/activityLog');
const { authPermission,
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
        handleFileUpload,
        getFileByName,
        uploadFilesForRecord,
        deleteFileFromRecord
    } = require('../../middleware/childrenEducation');
const { childEducation } = require('../../middleware/pdf-management/pdfManagement.middleware');
const esign = require('../../middleware/e-signature/esign.middleware');
const minio = require('../../middleware/e-signature/minio.middleware');

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementChildrenEducationController.list);
router.get('/remaining/', authPermission, getRemaining , reimbursementChildrenEducationController.getRemainingChildFund);
router.get('/get-Count-Request/', authPermission, getRemaining , reimbursementChildrenEducationController.getTotalCountRequestedChildFund);
router.get('/subCategories', authPermission, reimbursementChildrenEducationController.getByCategories)
router.get('/latest-school', authPermission, reimbursementChildrenEducationController.getLatestSchoolByChildName);
router.get('/get-latest-school/latest-school', authPermissionEditor, reimbursementChildrenEducationController.getLatestSchoolByChildName);
router.get('/get-file', authPermission, getFileByName);
router.get('/:id',authPermission, byIdMiddleWare, logReimbursementView('CHILDREN_EDUCATION'), reimbursementChildrenEducationController.getById);
router.get('/get-welfare/:id',authPermissionEditor, byIdMiddleWare, logReimbursementView('CHILDREN_EDUCATION'), reimbursementChildrenEducationController.getById);
// Post Methods
router.post('/', authPermission, logReimbursementCreate('CHILDREN_EDUCATION'), checkNullValue, bindCreate, getRemaining,checkRemaining, reimbursementChildrenEducationController.create, childEducation, esign.acknowledgeDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementChildrenEducationController.update);
router.post('/upload-file/:id', authPermission, handleFileUpload, uploadFilesForRecord);
// Put Methods
router.put('/:id', authPermission,logReimbursementUpdate('CHILDREN_EDUCATION'),checkNullValue, bindUpdate, getRemaining,checkRemaining, reimbursementChildrenEducationController.update);
router.put('/update-welfare/:id', authPermissionEditor, logReimbursementUpdate('CHILDREN_EDUCATION') ,checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, esign.preloadEducationVeify, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementChildrenEducationController.update);
router.put('/approve-welfare/:id', authPermissionEditor,logReimbursementUpdate('CHILDREN_EDUCATION'), checkNullValue, bindUpdate, esign.preloadEducationApprove, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementChildrenEducationController.update)
router.put('/disburse-welfare/:id', authPermissionEditor, logReimbursementUpdate('CHILDREN_EDUCATION'), checkNullValue, bindUpdate, esign.preloadEducationDisburse, minio.putFile, esign.stamper, minio.getPublicFile, minio.deleteFile, esign.nornalize, reimbursementChildrenEducationController.update)
router.put('/delete-file/:id', authPermission, deleteFileFromRecord);
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementChildrenEducationController.deleteReimbursement);

module.exports = router;