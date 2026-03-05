const { initLogger } = require('../../logger');
const logger = initLogger('ExportChildrenEducationCreate');
var htmlToPdf = require("html-pdf-node");
const ejs = require("ejs");
const path = require('path');
const { bahttext } = require('bahttext');
const fs = require('fs');
require('dotenv').config();

// Detect Chromium path based on environment
const getChromiumPath = () => {
    if (fs.existsSync('/usr/bin/chromium-browser')) return '/usr/bin/chromium-browser';
    if (fs.existsSync('/usr/bin/chromium')) return '/usr/bin/chromium';
    return undefined;
};

const createPdfChildrenEducation = async (req, res, next) => {
    const method = 'CreateGeneralData';
    const { id } = req.user;
    let browser;

    try {
        console.log('=============== PDF Create ====================')
        const puppeteer = require('puppeteer');
        const path = require('path');
        const outDoucment_Directory = path.join(__dirname, '../../document')
        const chromiumPath = getChromiumPath();
        browser = await puppeteer.launch()
        //     {
        //     ...(chromiumPath && { executablePath: chromiumPath }),
        //     args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files'],
        //     // timeout: 5000,
        //     headless: true,
        // });

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

        const html = await ejs.renderFile('./templateExport/childrenEducationExport.html.ejs', {
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
            format: 'A4' 
        });
        
        await browser.close();

        // res.writeHead(200, {
        //     "Content-Type": "application/pdf",
        //     "Content-Disposition": `attachment; filename="welfare_${req.body?.datas?.reimNumber}.pdf"`,
        // });
        // res.end(pdfBuffer);

        logger.info('Complete', { method, data: { id } });
        req.filePath = filePath;
        req.method = 'education'
        next()

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
    createPdfChildrenEducation,
};