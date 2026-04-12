const axios = require('axios');
const { initLogger } = require('../../logger');
const logger = initLogger('EsignExport');

/** 1×1 transparent PNG — ใช้แทนลายเซ็นเมื่อไม่เรียก Kong (export PDF ยังทำงาน) */
const MOCK_SIGN_BASE64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function applyMockEsignForExport(req) {
    req.body.esign = {
        result: {
            SIGN_BASE64: MOCK_SIGN_BASE64,
        },
    };
    req.body.signedAt = signedDate();
}

const getEsignTokenUrl = () => {
    const base = (process.env.ESIGN_API_BASE || '').replace(/\/$/, '');
    if (!base) return null;
    return `${base}/e-sign/e-sign.CheckCertificateAndSignatureByPerson/oauth2/token`;
};

const getEsignSignUrl = () => {
    const base = (process.env.ESIGN_API_BASE || '').replace(/\/$/, '');
    if (!base) return null;
    return `${base}/e-sign/e-sign.CheckCertificateAndSignatureByPerson`;
};

// authEsign()
const authEsign = async (clientSecret, clientID, userID) => {
    const tokenUrl = getEsignTokenUrl();
    if (!tokenUrl) {
        return null;
    }
    try {
        const data = {
            client_secret: clientSecret,
            client_id: clientID,
            grant_type: 'password',
            scope: 'read',
            provision_key: process.env.ESIGN_PROVISION_KEY || 'o31wlYvJANGMjh7RvKXce3jWvXbuCtEu',
            authenticated_userid: userID,
        };
        const respone = await axios.post(tokenUrl, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: Number(process.env.ESIGN_REQUEST_TIMEOUT_MS) || 30000,
        });
        return respone.data;
    } catch (error) {
        logger.warn(`authEsign failed: ${error.message}`);
        return null;
    }
};

// signed() — ใช้กับ export เฉพาะ various (assist PDF)
const signed = async (req, res, next) => {
    const strict = process.env.ESIGN_EXPORT_STRICT === '1' || process.env.ESIGN_EXPORT_STRICT === 'true';

    if (process.env.ESIGN_EXPORT_MOCK === '1' || process.env.ESIGN_EXPORT_MOCK === 'true') {
        applyMockEsignForExport(req);
        return next();
    }

    if (!getEsignTokenUrl()) {
        logger.warn('ESIGN_API_BASE ไม่ได้ตั้งค่า — export various ใช้ลายเซ็นจำลอง');
        applyMockEsignForExport(req);
        return next();
    }

    try {
        const token = await authEsign(
            process.env.ESIGN_CLIENT_SECRET || '6RzgQnt7VhjlvnUdHX2W9s0Qp2owcyqJ',
            process.env.ESIGN_CLIENT_ID || 'U5QhNd2ss5qz3W2uUVlDHSiAd0ktM68G',
            process.env.ESIGN_SERVICE_USER || 'informatics-welfare'
        );

        if (!token?.access_token) {
            if (strict) {
                return res.status(503).json({
                    message: 'ไม่สามารถเชื่อมต่อบริการ e-sign ได้ กรุณาตรวจสอบ ESIGN_API_BASE และข้อมูลยืนยันตัวตน',
                });
            }
            logger.warn('E-sign token ไม่ได้รับ — export various ใช้ลายเซ็นจำลอง');
            applyMockEsignForExport(req);
            return next();
        }

        const signUrl = getEsignSignUrl();
        const data = { psn_id: process.env.ESIGN_EXPORT_PSN_ID || '00000000' };
        const respone = await axios.post(signUrl, data, {
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json',
            },
            timeout: Number(process.env.ESIGN_REQUEST_TIMEOUT_MS) || 30000,
        });
        req.body.esign = respone.data;
        req.body.signedAt = signedDate();
        return next();
    } catch (error) {
        logger.warn(`signed export error: ${error.message}`);
        if (strict) {
            return res.status(503).json({
                message: 'ไม่สามารถดึงลายเซ็นสำหรับ export ได้ กรุณาลองใหม่หรือตรวจสอบบริการ e-sign',
            });
        }
        applyMockEsignForExport(req);
        return next();
    }
};

const signedDate = () => {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const monthsTH = [
        'มกราคม',
        'กุมภาพันธ์',
        'มีนาคม',
        'เมษายน',
        'พฤษภาคม',
        'มิถุนายน',
        'กรกฎาคม',
        'สิงหาคม',
        'กันยายน',
        'ตุลาคม',
        'พฤศจิกายน',
        'ธันวาคม',
    ];
    return {
        day: today.getDate(),
        month: monthsTH[today.getMonth()],
        year: today.getFullYear() + 543,
    };
};

module.exports = {
    signed,
    signedDate,
};
