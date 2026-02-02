var express = require('express');
var router = express.Router();
const reimbursementsGeneralController = require('../../controllers/healthCheckUpWelfareController');
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
} = require('../../middleware/healthCheckUpWelfare')

router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsGeneralController.getById);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsGeneralController.getById);

router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create);

router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, reimbursementsGeneralController.update);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);

module.exports = router;