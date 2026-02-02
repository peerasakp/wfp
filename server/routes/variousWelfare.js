var express = require('express');
var router = express.Router();
const reimbursementsAssistController = require('../controllers/variousWelfareController');
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
} = require('../middleware/variousWelfare')

const { various } = require('../middleware/pdf-management/pdfManagement.middleware')

router.get('/', authPermission, bindFilter, reimbursementsAssistController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsAssistController.getRemaining);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsAssistController.getById);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsAssistController.getById);

// test route
//router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, various);
router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsAssistController.create, various);

router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsAssistController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, reimbursementsAssistController.update);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementsAssistController.delete);
module.exports = router;