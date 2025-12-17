const { initLogger } = require('../../logger');
const logger = initLogger('ExportHealthCreate');
var htmlToPdf = require("html-pdf-node");
const ejs = require("ejs");
const path = require('path');
const { bahttext } = require('bahttext');
const fs = require('fs');
require('dotenv').config();

// Detect Chromium path based on environment
const getChromiumPath = () => {
    // Check for Docker/Linux path first
    if (fs.existsSync('/usr/bin/chromium-browser')) {
        return '/usr/bin/chromium-browser';
    }
    if (fs.existsSync('/usr/bin/chromium')) {
        return '/usr/bin/chromium';
    }
    // For Windows/local development, let puppeteer find it automatically
    return undefined;
};

const createPdfGeneral = async (req, res, next) => {
    const method = 'CreateGeneralData';
    const { id } = req.user;
    let browser;

    try {
        const puppeteer = require('puppeteer');
        const chromiumPath = getChromiumPath();
        browser = await puppeteer.launch({
            ...(chromiumPath && { executablePath: chromiumPath }),
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files'],
            // timeout: 5000,
            headless: true,
        });

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
    createPdfGeneral,
};