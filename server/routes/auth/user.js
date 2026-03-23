var express = require('express');
var router = express.Router();
const userController = require('../../controllers/usersController');
const ums = require('../../controllers/ums.controller');
const { authPermission, 
    bindFilter, 
    bindCreate, 
    bindUpdate, 
    validateDuplicate, 
    newValueUserType, 
    checkNullValue 
} = require('../../middleware/user')

// Get Methods
router.get('/', authPermission, bindFilter, userController.list);
router.get('/order/name', bindFilter, userController.listOrderByName);
router.get('/userInitialData', bindFilter, userController.getUserInitialData);
router.get('/ums/:uslogin', ums.SpersonByInformatics);
router.get('/:id', userController.getById);
// Post Methods
router.post('/', authPermission, checkNullValue, bindCreate, validateDuplicate, newValueUserType, userController.create);
// Put Methods
router.put('/:id', authPermission, checkNullValue, bindUpdate, validateDuplicate, newValueUserType, userController.update);
// Delete Methods
router.delete('/:id', authPermission, userController.delete);
router.delete('/delete-child/:id', authPermission, userController.deletChild);

module.exports = router;