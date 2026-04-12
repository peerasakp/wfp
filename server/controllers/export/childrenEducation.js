const { initLogger } = require('../../logger');
const logger = initLogger('ExportChildrenEducationCreate');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require("ejs");
const fs = require('fs');
const { bahttext } = require('bahttext');
require('dotenv').config();

const createPdfChildrenEducation = async (req, res, next) => {
    const method = 'CreateGeneralData';
    const { id } = req.user;
    let browser;

    try {
        const outDoucment_Directory = path.join(__dirname, '../../documents')
        if (!fs.existsSync(outDoucment_Directory)) {
            fs.mkdirSync(outDoucment_Directory, { recursive: true });
        }
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

        logger.info('Complete', { method, data: { id } });
        req.esign = {
            method: 'education',
            filePath: filePath
        }
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