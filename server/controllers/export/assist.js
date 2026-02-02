const { initLogger } = require('../../logger');
const logger = initLogger('ExportAssistCreate');
const ejs = require("ejs");
const { bahttext } = require('bahttext');
require('dotenv').config();


const createPdfAssist = async (req, res, next) => {
    const method = 'CreateAssistData';
    const { id } = req.user;
    let browser;

    try {
        // const util = require('util');
        // console.log(util.inspect(req.body.esign.result.SIGN_BASE64));
        // //    console.log(req.body);

        // //////////////////////////////////

        // const base64String = req.body.esign.result.SIGN_BASE64;
        // var base64Data = base64String.replace(/^data:image\/png;base64,/, "");
        // require("fs").writeFile("out3.png", base64Data, 'base64', function (err) {
        //     console.log(err);
        // });



        // Usage
        //     const myFile = base64ToImageFile(req.body.esign.result.SIGN_BASE64, "image.png");

        //////////////////////////////////


        const puppeteer = require('puppeteer');
        const fs = require('fs');
        const path = require('path');
        
        const outDoucment_Directory = path.join(__dirname, '../../document')

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
        res.status(200).json({
            success: true,
            fileName,
        });
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