var express = require('express');
var router = express.Router();
const dashboardController = require('../../controllers/dashboardController');
const { authPermission, bindGetDataDashboard } = require('../../middleware/dashboard');

router.get('/report/report-compare-expense', authPermission, bindGetDataDashboard, dashboardController.list);
router.get('/report/report-personal', authPermission, bindGetDataDashboard, dashboardController.listAll);
router.get('/report/report-fund-request-per-year', authPermission, dashboardController.reportFundRequestPerYear);
router.get('/report/report-fund-request-per-year-each-type', authPermission, dashboardController.reportFundRequestPerYearEachType);
module.exports = router;
