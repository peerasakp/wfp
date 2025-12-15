var express = require('express');
var router = express.Router();
const { createPdfGeneral } = require('../controllers/export/general');
const { fetchDataHealthCheckup, fetchDataMedical, fetchDataDental } = require('../middleware/export/general');
const { createPdfAssist } = require('../controllers/export/assist');
const { fetchDataVarious, fetchDataFuneralFamily } = require('../middleware/export/assist');
const { createPdfFuneralDeceaseEmployee } = require('../controllers/export/funeralDeceaseEmployee');
const { fetchDataFuneralDeceaseEmployee } = require('../middleware/export/funeralDeceaseEmployee');
const { createPdfChildrenEducation } = require('../controllers/export/childrenEducation');
const { fetchDatareimChildrenEducation } = require('../middleware/export/childrenEducation');
const { logExport } = require('../middleware/activityLog');

router.get('/health-check-up/:id', logExport('HEALTH_CHECK_UP'), fetchDataHealthCheckup, createPdfGeneral);

router.get('/dental/:id', logExport('DENTAL'), fetchDataDental, createPdfGeneral);

router.get('/medical/:id', logExport('MEDICAL'), fetchDataMedical, createPdfGeneral);

router.get('/various/:id', logExport('VARIOUS_ASSIST'), fetchDataVarious, createPdfAssist);

router.get('/various-Funeral-Family/:id', logExport('VARIOUS_FUNERAL_FAMILY'), fetchDataFuneralFamily, createPdfAssist);

router.get('/funeral-Decease-Employee/:id', logExport('FUNERAL_EMPLOYEE'), fetchDataFuneralDeceaseEmployee, createPdfFuneralDeceaseEmployee);

router.get('/Children-Education/:id', logExport('CHILDREN_EDUCATION'), fetchDatareimChildrenEducation, createPdfChildrenEducation);
module.exports = router;