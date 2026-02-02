var express = require('express');
var router = express.Router();
const roleController = require('../../controllers/roleController');

router.get('/', roleController.listAll);
module.exports = router;