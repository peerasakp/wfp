const { initLogger } = require('../../logger');
const logger = initLogger('ExportAssistCreate');
const ejs = require("ejs");
const { bahttext } = require('bahttext');
const fs = require('fs');
require('dotenv').config();

// Detect Chromium path based on environment
const getChromiumPath = () => {
    if (fs.existsSync('/usr/bin/chromium-browser')) return '/usr/bin/chromium-browser';
    if (fs.existsSync('/usr/bin/chromium')) return '/usr/bin/chromium';
    return undefined;
};

const createPdfAssist = async (req, res, next) => {
    const method = 'CreateAssistData';
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

        // //////////////////////////////////



        const base64String = req.body.esign.result.SIGN_BASE64;

        var base64Data = base64String.replace(/^data:image\/png;base64,/, "");

        // require("fs").writeFile("out3.png", base64Data, 'base64', function (err) {
        //     console.log(err);
        // });



        // Usage
        //     const myFile = base64ToImageFile(req.body.esign.result.SIGN_BASE64, "image.png");

        //////////////////////////////////

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