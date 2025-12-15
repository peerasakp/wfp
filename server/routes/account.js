var express = require('express');
var router = express.Router();
const { login, logout } = require('../controllers/accountController');
const { validate } = require('../middleware/account');
const auth = require('../middleware/auth');

router.post('/login', validate, login);
router.post('/logout', auth, logout);

module.exports = router;