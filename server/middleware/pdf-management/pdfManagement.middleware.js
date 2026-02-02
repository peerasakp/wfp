
// Composer
const { composer } = require('../composer/composer.middleware.js')
// Fetch Data
const { fetchDataHealthCheckup, fetchDataMedical, fetchDataDental } = require('../export/general.js');
const { fetchDataVarious, fetchDataFuneralFamily } = require('../export/assist.js');
const { fetchDatareimChildrenEducation } = require('../export/childrenEducation.js');
const { fetchDataFuneralDeceaseEmployee } = require('../export/funeralDeceaseEmployee.js');
// Signed
const { signed } = require('../e-signature/esign.middleware.js')
// Generate PDF
const { createPdfGeneral } = require('../../controllers/export/general');
const { createPdfAssist } = require('../../controllers/export/assist.js');
const { createPdfChildrenEducation } = require('../../controllers/export/childrenEducation.js');
const { createPdfFuneralDeceaseEmployee } = require('../../controllers/export/funeralDeceaseEmployee.js');


// ค่าตรวจสุขภาพ
const healthCheck = composer([
    fetchDataHealthCheckup,
    signed,
    createPdfGeneral
])

// กรณีเจ็บป่วย
const medical = composer([
    fetchDataMedical,
    signed,
    createPdfGeneral
])

// ทำฟัน
const dental = composer([
    fetchDataDental,
    signed,
    createPdfGeneral
])

// ค่าสงเคราะห์ต่าง ๆ
const various = composer([
    fetchDataVarious,
    signed,
    createPdfAssist
])
    
// สงเคราะห์การศึกษาบุตร
const childEducation = composer([
    fetchDatareimChildrenEducation,
    signed,
    createPdfChildrenEducation
])

// สงเคราะห์การเสียชีวิตครอบครัว 
const funeralFamily = composer([
    fetchDataFuneralFamily,
    signed,
    createPdfAssist
])

// สงเคราะห์การเสียชีวิตผู้ปฏิบัติงาน
const funeralEmployee = composer([
    fetchDataFuneralDeceaseEmployee,
    createPdfFuneralDeceaseEmployee 
])

module.exports = {
    healthCheck,
    medical,
    dental,
    various,
    childEducation,
    funeralFamily,
    funeralEmployee
}