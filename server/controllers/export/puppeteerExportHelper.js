const fs = require('fs');

/** Chromium in Docker/Debian images */
const getChromiumPath = () => {
    if (fs.existsSync('/usr/bin/chromium-browser')) return '/usr/bin/chromium-browser';
    if (fs.existsSync('/usr/bin/chromium')) return '/usr/bin/chromium';
    return undefined;
};

/** Avoid hangs/OOM in Docker: small /dev/shm makes repeat launches fail after first PDF */
const PUPPETEER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--allow-file-access-from-files',
    '--disable-dev-shm-usage',
    '--disable-gpu',
];

const NAV_TIMEOUT_MS = 120000;
const PDF_TIMEOUT_MS = 120000;

/**
 * Run Puppeteer with guaranteed browser.close(); render HTML string to PDF buffer.
 * Uses waitUntil: 'load' instead of networkidle0 (networkidle often never settles → 504 behind proxy).
 */
async function renderHtmlToPdfBuffer(html) {
    const puppeteer = require('puppeteer');
    const chromiumPath = getChromiumPath();
    const browser = await puppeteer.launch({
        ...(chromiumPath && { executablePath: chromiumPath }),
        args: PUPPETEER_ARGS,
        headless: true,
    });
    let page;
    try {
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
        await page.setDefaultTimeout(NAV_TIMEOUT_MS);
        await page.setContent(html, {
            waitUntil: 'load',
            timeout: NAV_TIMEOUT_MS,
        });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            timeout: PDF_TIMEOUT_MS,
        });
        return pdfBuffer;
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (_) {
                /* ignore */
            }
        }
        try {
            await browser.close();
        } catch (_) {
            /* ignore */
        }
    }
}

module.exports = {
    getChromiumPath,
    renderHtmlToPdfBuffer,
};
