const path = require('path');
const fs = require('fs');
const minio = require('./minio.middleware');
const {
    reimbursementsGeneral,
    reimbursementsAssist,
    reimbursementsEmployeeDeceased,
    reimbursementsChildrenEducation,
} = require('../../models/mariadb');

class document {
    constructor() {
        this.baseUrls = ['../../documents'];
    }

    general = async (req, res) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            if (!data?.document_path) {
                return res.status(404).json({ message: 'ไม่พบไฟล์ในระบบ' });
            }
            this.prepareRespone(res, data.document_path);
        } catch (error) {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
    assist = async (req, res) => {
        try {
            const data = await reimbursementsAssist.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            if (!data?.document_path) {
                return res.status(404).json({ message: 'ไม่พบไฟล์ในระบบ' });
            }
            this.prepareRespone(res, data.document_path);
        } catch (error) {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
    funeral = async (req, res) => {
        try {
            const data = await reimbursementsEmployeeDeceased.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            if (!data?.document_path) {
                return res.status(404).json({ message: 'ไม่พบไฟล์ในระบบ' });
            }
            this.prepareRespone(res, data.document_path);
        } catch (error) {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
    education = async (req, res) => {
        try {
            const data = await reimbursementsChildrenEducation.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            if (!data?.document_path) {
                return res.status(404).json({ message: 'ไม่พบไฟล์ในระบบ' });
            }
            this.prepareRespone(res, data.document_path);
        } catch (error) {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
    prepareRespone = (res, documentPath) => {
        let filePath = this.baseUrls
            .map((baseUrl) => path.join(__dirname, baseUrl, documentPath))
            .find((fullPath) => fs.existsSync(fullPath));

        const streamFile = () => {
            if (!filePath) return res.status(404).json({ message: 'ไม่พบไฟล์ในระบบ' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(documentPath)}"`);
            fs.createReadStream(filePath).pipe(res);
        };

        if (filePath) return streamFile();

        this.downloadFromMinioIfPossible(documentPath)
            .then(() => {
                filePath = this.baseUrls
                    .map((baseUrl) => path.join(__dirname, baseUrl, documentPath))
                    .find((fullPath) => fs.existsSync(fullPath));
                streamFile();
            })
            .catch(() => streamFile());
    }

    downloadFromMinioIfPossible = async (documentPath) => {
        const normalized = String(documentPath || '').replace(/\\/g, '/');
        const [templateDir] = normalized.split('/');
        const fileName = path.basename(normalized);
        const match = fileName.match(/^(signed|verified|approved|disbursed)_(.+)$/);
        if (!match) return;

        const prefix = match[1];
        const minioFileName = match[2];
        const methodMap = {
            standard: { signed: 'standard', verified: 'standardVerify', approved: 'standardApprove', disbursed: 'standardDisburse' },
            funeral: { signed: 'funeral', verified: 'funeralVerify', approved: 'funeralApprove', disbursed: 'funeralDisburse' },
            education: { signed: 'education', verified: 'educationVerify', approved: 'educationApprove', disbursed: 'educationDisburse' },
        };
        const method = methodMap?.[templateDir]?.[prefix];
        if (!method) return;

        const req = { fileName: minioFileName, esign: { method } };
        await new Promise((resolve, reject) => {
            minio.getPublicFile(req, {}, (error) => (error ? reject(error) : resolve()));
        });
    }
}

module.exports = new document()