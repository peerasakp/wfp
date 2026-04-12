var express = require('express');
var router = express.Router();
const logCategoryController = require('../../controllers/logCategoryController');
const { authPermission } = require('../../middleware/configWelfare')
const { bindAdd } = require('../../middleware/logCategory')

router.post('/', authPermission, bindAdd, logCategoryController.create);
module.exports = router;
