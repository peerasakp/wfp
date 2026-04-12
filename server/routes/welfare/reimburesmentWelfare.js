var express = require('express');
var router = express.Router();
const reimbursementWelfareController = require('../../controllers/reimbursementWelfareController');
const { authPermission, bindFilter } = require('../../middleware/reimbursementWelfare');

router.get('/', authPermission, bindFilter, reimbursementWelfareController.list);
module.exports = router;
