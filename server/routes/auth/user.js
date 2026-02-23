var express = require('express');
var router = express.Router();
const userController = require('../../controllers/usersController');
const { authPermission, bindFilter, bindCreate, bindUpdate, validateDuplicate,newValueUserType,checkNullValue } = require('../../middleware/user')

router.get('/', authPermission, bindFilter, userController.list);
router.get('/order/name', bindFilter, userController.listOrderByName);
router.get('/userInitialData', bindFilter, userController.getUserInitialData);
router.get('/:id', userController.getById);
router.post('/', authPermission, checkNullValue, bindCreate, validateDuplicate, newValueUserType, userController.create);
router.put('/:id', authPermission, checkNullValue, bindUpdate, validateDuplicate, newValueUserType, userController.update);
router.delete('/:id', authPermission, userController.delete);
router.delete('/delete-child/:id', authPermission, userController.deletChild);
module.exports = router;