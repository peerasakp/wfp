var express = require('express');
var router = express.Router();
const departmentController = require('../../controllers/departmentController');

router.get('/', departmentController.listAll);
module.exports = router;