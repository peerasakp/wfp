var express = require('express');
var router = express.Router();
const { login } = require('../controllers/accountController');
const { validate } = require('../middleware/account');
const auth = require('../middleware/auth');

router.post('/login', validate, login);

module.exports = router;