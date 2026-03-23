var express = require('express');
var router = express.Router();
const exportDocument = require('../../middleware/e-signature/document.middleware');

router.get('/health-check-up/:id', exportDocument.general);
router.get('/dental/:id', exportDocument.general);
router.get('/medical/:id', exportDocument.general);
router.get('/various/:id', exportDocument.assist);
router.get('/various-Funeral-Family/:id', exportDocument.assist);
router.get('/funeral-Decease-Employee/:id', exportDocument.funeral);
router.get('/Children-Education/:id', exportDocument.education);

module.exports = router;