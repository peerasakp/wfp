const { initLogger } = require('../../logger');
const logger = initLogger('ExportAssistCreate');
const ejs = require("ejs");
const { bahttext } = require('bahttext');
require('dotenv').config();
const { renderHtmlToPdfBuffer } = require('./puppeteerExportHelper');

const createPdfAssist = async (req, res, next) => {
    const method = 'CreateAssistData';
    const { id } = req.user;

    try {
        const data = {
            body: req.body.datas,
            sign: req.body.esign,
            signedAt: req.body.signedAt,
            bahttext,
            path: process.env.fileAccess
        }
        const cssData = await ejs.renderFile('./templateExport/template.css.ejs', {
            fontPath: process.env.fileAccess,
            fontSize: 14,
            textColor: '#333',
        });
        const receipt = await ejs.renderFile('./templateExport/receiptExport.html.ejs', data, { async: true });
        const receiptFuneralSupport = await ejs.renderFile('./templateExport/receiptFuneralSupportExport.html.ejs', data, { async: true });
        const html = await ejs.renderFile('./templateExport/assistExport.html.ejs', {
            body: req.body.datas,
            sign: req.body.esign,
            signedAt: req.body.signedAt,
            receipt: receipt,
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
    createPdfAssist,
};
