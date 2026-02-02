var express = require('express');
var router = express.Router();
const reimbursementsEmployeeDeceasedController = require('../../controllers/funeralWelfareEmployeeDeceasedController');
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
    checkFullPerTimes
} = require('../../middleware/funeralWelfareEmployeeDeceased')

router.get('/', authPermission, bindFilter, reimbursementsEmployeeDeceasedController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsEmployeeDeceasedController.getRemaining);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsEmployeeDeceasedController.getById);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsEmployeeDeceasedController.getById);

router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.create);

router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, reimbursementsEmployeeDeceasedController.update);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementsEmployeeDeceasedController.delete);
module.exports = router;