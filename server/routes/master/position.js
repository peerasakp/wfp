var express = require('express');
var router = express.Router();
const positionController = require('../../controllers/postitionController');

router.get('/',positionController.listAll);
module.exports = router;