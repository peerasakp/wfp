var express = require('express');
var router = express.Router();
const reimbursementChildrenEducationController = require('../../controllers/reimbursementChildrenEducationController');
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
        checkUpdateRemaining 
    } = require('../../middleware/childrenEducation');
const { childEducation } = require('../../middleware/pdf-management/pdfManagement.middleware');

// Get Methods
router.get('/', authPermission, bindFilter, reimbursementChildrenEducationController.list);
router.get('/remaining/', authPermission, getRemaining , reimbursementChildrenEducationController.getRemainingChildFund);
router.get('/get-Count-Request/', authPermission, getRemaining , reimbursementChildrenEducationController.getTotalCountRequestedChildFund);
router.get('/subCategories', authPermission, reimbursementChildrenEducationController.getByCategories)
router.get('/latest-school', authPermission, reimbursementChildrenEducationController.getLatestSchoolByChildName);
router.get('/get-latest-school/latest-school', authPermissionEditor, reimbursementChildrenEducationController.getLatestSchoolByChildName);
router.get('/:id',authPermission, byIdMiddleWare, reimbursementChildrenEducationController.getById);
router.get('/get-welfare/:id',authPermissionEditor, byIdMiddleWare, reimbursementChildrenEducationController.getById);
// Post Methods
router.post('/', authPermission, checkNullValue, bindCreate, getRemaining,checkRemaining, reimbursementChildrenEducationController.create, childEducation);
// Put Methods
router.put('/:id', authPermission,checkNullValue, bindUpdate, getRemaining,checkRemaining, reimbursementChildrenEducationController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, reimbursementChildrenEducationController.update);
// Delete Methods
router.delete('/:id', authPermission, deletedMiddleware, reimbursementChildrenEducationController.deleteReimbursement);

module.exports = router;