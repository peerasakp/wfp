var express = require('express');
var router = express.Router();
const subCategoryController = require('../../controllers/subCategoryController');
const { bindUpdate, authPermission } = require('../../middleware/configWelfare')

router.get('/', authPermission ,subCategoryController.list);
router.put('/:id', authPermission, bindUpdate, subCategoryController.update);
module.exports = router;
