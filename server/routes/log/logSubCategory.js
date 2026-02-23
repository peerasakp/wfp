var express = require('express');
var router = express.Router();
const logSubCategoryController = require('../../controllers/logSubCategoryController');
const { authPermission } = require('../../middleware/configWelfare')
const { bindAdd } = require('../../middleware/logSubCategory')

router.post('/', authPermission, bindAdd, logSubCategoryController.create);
module.exports = router;
