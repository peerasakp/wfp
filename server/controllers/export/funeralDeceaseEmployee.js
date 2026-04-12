const { initLogger } = require('../../logger');
const logger = initLogger('ExportFuneralDeceaseEmployeeCreate');
const ejs = require("ejs");
const { bahttext } = require('bahttext');
require('dotenv').config();
const { renderHtmlToPdfBuffer } = require('./puppeteerExportHelper');

const createPdfFuneralDeceaseEmployee = async (req, res, next) => {
    const method = 'CreateAssistData';
    const { id } = req.user;

    try {
        const cssData = await ejs.renderFile('./templateExport/template.css.ejs', {
            fontPath: process.env.fileAccess,
            fontSize: 14,
            textColor: '#333',
        });

        const receiptFuneral = await ejs.renderFile('./templateExport/receiptFuneralExport.html.ejs', {
            body: req.body.datas,
            async: true,
            bahttext,
            path: process.env.fileAccess,
        });
        const receiptFuneralSupport = await ejs.renderFile('./templateExport/receiptFuneralSupportExport.html.ejs', {
            body: req.body.datas,
            async: true,
            bahttext,
            path: process.env.fileAccess,
        });
        const html = await ejs.renderFile('./templateExport/funeralDeceaseEmployeeExport.html.ejs', {
            body: req.body.datas,
            receiptFuneral: receiptFuneral,
            receiptFuneralSupport: receiptFuneralSupport,
            async: true,
            bahttext,
            cssStyles: `<style>${cssData}</style>`,
        });

        const pdfBuffer = await renderHtmlToPdfBuffer(html);

        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="welfare_${req.body?.datas?.reimNumber}.pdf"`,
        });
        res.end(pdfBuffer);

        logger.info('Complete', { method, data: { id } });
    } catch (error) {
        logger.error(`Error ${error.message}`, {
            method,
            data: { id },
        });
        next(error);
    }
};
module.exports = {
    createPdfFuneralDeceaseEmployee,
};
