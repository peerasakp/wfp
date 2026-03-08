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
const esign = require('../../middleware/e-signature/esign.middleware')
const minio = require('../../middleware/e-signature/minio.middleware')

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementChildrenEducationController.list);
router.get('/remaining/', authPermission, getRemaining , reimbursementChildrenEducationController.getRemainingChildFund);
router.get('/get-Count-Request/', authPermission, getRemaining , reimbursementChildrenEducationController.getTotalCountRequestedChildFund);
router.get('/subCategories', authPermission, reimbursementChildrenEducationController.getByCategories)
router.get('/latest-school', authPermission, reimbursementChildrenEducationController.getLatestSchoolByChildName);
router.get('/get-latest-school/latest-school', authPermissionEditor, reimbursementChildrenEducationController.getLatestSchoolByChildName);
router.get('/get-file', authPermission, getFileByName);

router.get('/:id',authPermission, byIdMiddleWare, reimbursementChildrenEducationController.getById, logReimbursementView('CHILDREN_EDUCATION'));
router.get('/get-welfare/:id',authPermissionEditor, byIdMiddleWare, reimbursementChildrenEducationController.getById, logReimbursementView('CHILDREN_EDUCATION'));

router.post('/', authPermission, checkNullValue, bindCreate, getRemaining,checkRemaining, reimbursementChildrenEducationController.create, logReimbursementCreate('CHILDREN_EDUCATION'));
router.post('/upload-file/:id', authPermission, handleFileUpload, uploadFilesForRecord);

router.put('/:id', authPermission,checkNullValue, bindUpdate, getRemaining,checkRemaining, reimbursementChildrenEducationController.update, logReimbursementUpdate('CHILDREN_EDUCATION'));
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, reimbursementChildrenEducationController.update, logReimbursementUpdate('CHILDREN_EDUCATION'));
router.put('/delete-file/:id', authPermission, deleteFileFromRecord);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementChildrenEducationController.deleteReimbursement);

module.exports = router;