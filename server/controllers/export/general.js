const { initLogger } = require('../../logger');
const logger = initLogger('ExportHealthCreate');
const ejs = require("ejs");
const { bahttext } = require('bahttext');
require('dotenv').config();
const { renderHtmlToPdfBuffer } = require('./puppeteerExportHelper');

const createPdfGeneral = async (req, res, next) => {
    const method = 'CreateGeneralData';
    const { id } = req.user;

    try {
        const cssData = await ejs.renderFile('./templateExport/template.css.ejs', {
            fontPath: process.env.fileAccess,
            fontSize: 14,
            textColor: '#333',
        });

        const receipt = await ejs.renderFile('./templateExport/receiptExport.html.ejs', {
            body: req.body.datas,
            async: true,
            bahttext,
            path: process.env.fileAccess,
        });

        const html = await ejs.renderFile('./templateExport/generalExport.html.ejs', {
            body: req.body.datas,
            receipt: receipt,
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
    createPdfGeneral,
};
