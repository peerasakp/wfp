const { initLogger } = require('../../logger');
const logger = initLogger('ExportAssistCreate');
const ejs = require("ejs");
const path = require('path');
const { bahttext } = require('bahttext');
const { sign } = require('crypto');
require('dotenv').config();
const createPdfAssist = async (req, res, next) => {
    const method = 'CreateAssistData';
    const { id } = req.user;
    let browser;

    try {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch()
        //     {
        //     executablePath: '/usr/bin/chromium-browser',
        //     args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files'],
        //     // timeout: 5000,
        //     headless: true,
        // }
        //);
        const data = {
            body: req.body.datas,
            sign: req.body.eSign,
            async: true,
            bahttext,
            path: process.env.fileAccess
        }

        const cssData = await ejs.renderFile('./templateExport/template.css.ejs', {
            fontPath: process.env.fileAccess,
            fontSize: 14,
            textColor: '#333',
        });

        const receipt = await ejs.renderFile('./templateExport/receiptExport.html.ejs', {
            body: req.body.datas,
            sign: eSign,
            async: true,
            bahttext,
            path: process.env.fileAccess,
        });
        const receiptFuneralSupport = await ejs.renderFile('./templateExport/receiptFuneralSupportExport.html.ejs', {
            body: req.body.datas,
            sign: eSign,
            async: true,
            bahttext,
            path: process.env.fileAccess,
        });
        const html = await ejs.renderFile('./templateExport/assistExport.html.ejs', {
            body: req.body.datas,
            receipt: receipt,
            receiptFuneralSupport: receiptFuneralSupport,
            async: true,
            bahttext,
            cssStyles: `<style>${cssData}</style>`,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="welfare_${req.body?.datas?.reimNumber}.pdf"`,
        });
        res.end(pdfBuffer);

        logger.info('Complete', { method, data: { id } });
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
    createPdfAssist,
};