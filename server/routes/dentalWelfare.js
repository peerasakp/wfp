var express = require('express');
var router = express.Router();
const reimbursementsGeneralController = require('../controllers/dentalWelfareController');
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
} = require('../middleware/dentalWelfare')

router.get('/', authPermission, bindFilter, reimbursementsGeneralController.list);
router.get('/remaining', authPermission, getRemaining, reimbursementsGeneralController.getRemaining);
router.get('/file/get-by-name', authPermission, getFileByName);
router.get('/:id', authPermission, byIdMiddleWare, reimbursementsGeneralController.getById);
router.get('/get-welfare/:id', authPermissionEditor, byIdMiddleWare, reimbursementsGeneralController.getById);

router.post('/', authPermission, checkNullValue, bindCreate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.create);

router.put('/:id', authPermission, checkNullValue, bindUpdate, getRemaining, checkRemaining, checkFullPerTimes, reimbursementsGeneralController.update);
router.put('/update-welfare/:id', authPermissionEditor, checkNullValue, bindUpdate, getRemaining, checkUpdateRemaining, checkFullPerTimes, reimbursementsGeneralController.update);

router.post('/file/upload/:id', authPermission, handleFileUpload, uploadFilesForRecord);
router.post('/file/delete/:id', authPermission, deleteFileFromRecord);

router.delete('/:id', authPermission, deletedMiddleware, reimbursementsGeneralController.delete);
module.exports = router;