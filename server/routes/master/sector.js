var express = require('express');
var router = express.Router();
const sectorController = require('../../controllers/sectorController');

router.get('/', sectorController.listAll);
module.exports = router;