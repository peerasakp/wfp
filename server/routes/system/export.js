var express = require('express');
var router = express.Router();
const { createPdfGeneral } = require('../../controllers/export/general.js');
const { fetchDataHealthCheckup, fetchDataMedical, fetchDataDental } = require('../../middleware/export/general.js');
const { createPdfAssist } = require('../../controllers/export/assist.js');
const { fetchDataVarious, fetchDataFuneralFamily } = require('../../middleware/export/assist.js');
const { createPdfFuneralDeceaseEmployee } = require('../../controllers/export/funeralDeceaseEmployee.js');
const { fetchDataFuneralDeceaseEmployee } = require('../../middleware/export/funeralDeceaseEmployee.js');
const { createPdfChildrenEducation } = require('../../controllers/export/childrenEducation.js');
const { fetchDatareimChildrenEducation } = require('../../middleware/export/childrenEducation.js');
const { authldap, login, signed } = require('../../middleware/e-signature/esign.middleware.js');

router.get('/health-check-up/:id', fetchDataHealthCheckup, createPdfGeneral);

router.get('/dental/:id', fetchDataDental, createPdfGeneral);

router.get('/medical/:id', fetchDataMedical, createPdfGeneral);

router.get('/various/:id', fetchDataVarious, signed, createPdfAssist);

router.get('/various-Funeral-Family/:id', fetchDataFuneralFamily, createPdfAssist);

router.get('/funeral-Decease-Employee/:id', fetchDataFuneralDeceaseEmployee, createPdfFuneralDeceaseEmployee);

router.get('/Children-Education/:id', fetchDatareimChildrenEducation, createPdfChildrenEducation);

module.exports = router;