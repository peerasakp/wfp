var express = require('express');
var router = express.Router();
const categoryController = require('../../controllers/categoryController');
const { bindUpdate, authPermission } = require('../../middleware/configWelfare')

router.get('/', authPermission, categoryController.list);
router.put('/:id', authPermission, bindUpdate, categoryController.update);
module.exports = router;
