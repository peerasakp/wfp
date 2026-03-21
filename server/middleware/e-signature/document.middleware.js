const path = require('path');
const fs = require('fs');
const {
    reimbursementsGeneral,
    reimbursementsAssist,
    reimbursementsEmployeeDeceased,
    reimbursementsChildrenEducation,
} = require('../../models/mariadb');

class document {
    constructor() {
        this.baseUrl = '../../documents';
    }

    general = async (req, res) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            const relativePath = path.join(__dirname, this.baseUrl, data?.document_path)
            this.prepareRespone(res, relativePath);
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
            const relativePath = path.join(__dirname, this.baseUrl, data?.document_path)
            this.prepareRespone(res, relativePath);
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
            const relativePath = path.join(__dirname, this.baseUrl, data?.document_path)
            this.prepareRespone(res, relativePath);
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
            const relativePath = path.join(__dirname, this.baseUrl, data?.document_path)
            this.prepareRespone(res, relativePath);
        } catch (error) {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
    prepareRespone = (res, relativePath) => {
        if (!fs.existsSync(relativePath)) {
            return res.status(404).json({ message: 'ไม่พบไฟล์ในระบบ' });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        fs.createReadStream(relativePath).pipe(res);
    }
}

module.exports = new document()