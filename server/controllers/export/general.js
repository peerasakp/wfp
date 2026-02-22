const { initLogger } = require('../../logger');
const logger = initLogger('ExportHealthCreate');
var htmlToPdf = require("html-pdf-node");
const ejs = require("ejs");
const path = require('path');
const { bahttext } = require('bahttext');
require('dotenv').config();
const createPdfGeneral = async (req, res, next) => {
    const method = 'CreateGeneralData';
    const { id } = req.user;
    let browser;

    try {
        const puppeteer = require('puppeteer');
        const path = require('path');
        const outDoucment_Directory = path.join(__dirname, '../../document');

        browser = await puppeteer.launch()
        //     {
        //     executablePath: '/usr/bin/chromium-browser',
        //     args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files'],
        //     // timeout: 5000,
        //     headless: true,
        // });
        const data = {
            body: req.body.datas,
            bahttext,
            path: process.env.fileAccess
        }
        const cssData = await ejs.renderFile('./templateExport/template.css.ejs', {
            fontPath: process.env.fileAccess,
            fontSize: 14,
            textColor: '#333',
        });

        const receipt = await ejs.renderFile('./templateExport/receiptExport.html.ejs', data,{ async: true });
        const html = await ejs.renderFile('./templateExport/generalExport.html.ejs', {
            body: req.body.datas,
            receipt: receipt,
            async: true,
            bahttext,
            cssStyles: `<style>${cssData}</style>`,
        });

        const fileName = `welfare_${req.body?.datas?.reimNumber}.pdf`;
        const filePath = path.join(outDoucment_Directory, fileName);

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: filePath,
            format: 'A4' });

        await browser.close();

        // res.writeHead(200, {
        //     "Content-Type": "application/pdf",
        //     "Content-Disposition": `attachment; filename="welfare_${req.body?.datas?.reimNumber}.pdf"`,
        // });
        // res.end(pdfBuffer);

        logger.info('Complete', { method, data: { id } });
        // res.status(200).json({
        //     success: true,
        //     fileName,
        // });
        req.filePath = filePath;
        req.method = 'general'
        next();
    } catch (error) {
        if (browser) {
            await browser.close();
        }
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