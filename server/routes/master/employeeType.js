var express = require('express');
var router = express.Router();
const employeeTypeController = require('../../controllers/employeeTypeController');

router.get('/', employeeTypeController.listAll);
module.exports = router;