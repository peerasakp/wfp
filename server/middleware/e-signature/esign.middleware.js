const axios = require('axios');
const {
    reimbursementsGeneral,
    reimbursementsAssist,
    reimbursementsEmployeeDeceased,
    reimbursementsChildrenEducation
} = require('../../models/mariadb');
const { where } = require('sequelize');

class esign {
    constructor() {
        // super(reimbursementsGeneral)
        this.esignPath = {
            signAuth: 'https://kong-dev.buu.ac.th/e-sign/e-sign.CheckCertificateAndSignatureByPerson/oauth2/token',
            sign: 'https://kong-dev.buu.ac.th/e-sign/e-sign.CheckCertificateAndSignatureByPerson',
            stamperAuth: 'https://kong-dev.buu.ac.th/service-api/e-sign.setaStamper.MultiStampTextSignElectronicSignatureWithImage/oauth2/token',
            stamper: 'https://kong-dev.buu.ac.th/service-api/e-sign.setaStamper.MultiStampTextSignElectronicSignatureWithImage'
        }
        this.client = {
            clientSecret: '6RzgQnt7VhjlvnUdHX2W9s0Qp2owcyqJ',
            clientID: 'U5QhNd2ss5qz3W2uUVlDHSiAd0ktM68G',
            userID: 'informatics-welfare'
        }
        this.provisionKey = {
            sign: 'o31wlYvJANGMjh7RvKXce3jWvXbuCtEu',
            stamper: 'RQbO5w8uavpcA28MOMzmg2HwH2Ur2Rjp'
        }
    }

    // auth()
    // This function is used to authen esign (dynimics)
    auth = async (scope, provisionKey, callMethod) => {
        try {
            let path
            switch (callMethod) {
                case 'sign':
                    path = this.esignPath.signAuth;
                    break;
                case 'stamper':
                    path = this.esignPath.stamperAuth;
                    break;
            }
            const data = {
                client_secret: this.client.clientSecret,
                client_id: this.client.clientID,
                grant_type: "password",
                scope: scope,
                provision_key: provisionKey,
                authenticated_userid: this.client.userID
            }
            const respone = await axios.post(
                path,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            return respone.data;
        } catch (error) {
            if (error.response?.status === 401) {
                return await this.refreshToken(method);
            }
            throw error;
        }
    }

    // refreshToken()
    // This function is used to 
    refreshToken = async (callMethod) => {
        try {
            let path
            switch (callMethod) {
                case 'sign':
                    path = this.esignPath.signAuth;
                    break;
                case 'stamper':
                    path = this.esignPath.stamperAuth;
                    break;
            }
            const data = {
                client_secret: this.client.clientSecret,
                client_id: this.client.clientID,
                grant_type: "refresh_token",
                refresh_token: ""
            }
            const respone = await axios.post(
                path,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            return respone.data;
        } catch (error) {
            throw error;
        }
    }

    // stmped()
    // This function is used to stamped document on Minio
    stamper = async (req, res, next) => {
        try {
            console.log('====================== stamper ========================================')
            const token = await this.auth("write", this.provisionKey.stamper, "stamper");
            const stampConfig = this.prepareData(req.user.name, req.method);
            const data = {
                psn_id: '00000000',
                positionType: 'normal',
                multiStamp: stampConfig.multiStamper,
                imgWidth: stampConfig.signImgWidth,
                imgHeight: stampConfig.signImgHeight,
                position: 'left_top',
                positionX: stampConfig.signPositionX,
                positionY: stampConfig.signPositionY,
                page: stampConfig.pageToSign,
                documentName: req.fileName,
                bucket: 'informatics.welfare.storage'
            }
            const respone = await axios.post(
                this.esignPath.stamper,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            req.stamper = respone.data;
            next();
        } catch (error) {
            console.log('stamper error');
            throw error
        }
    }

    nornalize = (req, res, next) => {
        try {
            req.params.id = req.params.id || req.createdId;
            req.body.document_path = req.savePath;
            next();
        } catch (error) {
            throw error
        }
    }

    // signedDate()
    // This function is used to calculate signed date.
    signedDate = () => {
        const today = new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
        )
        const monthsTH = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ]
        const formatedDate = {
            day: today.getDate(),
            month: monthsTH[today.getMonth()],
            year: today.getFullYear() + 543
        }
        return formatedDate
    }

    // prepareData()
    // This function is used to prepare
    prepareData = (name, welfareType) => {
        let data = {
            signAt: '',
            pageToSign: '',
            signImgWidth: '',
            signImgHeight: '',
            signPositionX: '',
            signPositionY: '',
            multiStamper: []
        }
        const date = this.signedDate()
        switch (welfareType) {
            case 'standard':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '360';
                data.signPositionY = '-75';
                data.textTranslateX = '360';
                data.textTranslateY = '-125'
                data.multiStamper = [
                    {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '365',
                        translateY: '-128'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '425',
                        translateY: '-128'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
                        translateY: '-128'
                    }
                ]
                break;
            case 'standardVerify':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '380';
                data.signPositionY = '-250';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '365',
                        translateY: '-285'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '367',
                        translateY: '-320'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '430',
                        translateY: '-320'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
                        translateY: '-320'
                    }
                ]
                break;
            case 'standardApprove':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '380';
                data.signPositionY = '-390';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '365',
                        translateY: '-425'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '367',
                        translateY: '-460'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '430',
                        translateY: '-460'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
                        translateY: '-460'
                    }
                ]
                break;
            case 'funeral':
                data.pageToSign = '1';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '270';
                data.signPositionY = '-360';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '260',
                        translateY: '-388'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '260',
                        translateY: '-412'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '305',
                        translateY: '-412'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-412'
                    }
                ]
                break;
            case 'funeralVerify':
                data.pageToSign = '1';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '380';
                data.signPositionY = '-685';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '365',
                        translateY: '-719'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '365',
                        translateY: '-753'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '395',
                        translateY: '-753'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '450',
                        translateY: '-753'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '450',
                        translateY: '-753'
                    }
                ]
                break;
            case 'funeralApprove':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '380';
                data.signPositionY = '-58';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-90'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-124'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '430',
                        translateY: '-124'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
                        translateY: '-124'
                    }
                ]
                break;
            case 'education':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '240';
                data.signPositionY = '-615';
                data.multiStamper = [
                    {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '240',
                        translateY: '-670'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '295',
                        translateY: '-670'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-670'
                    }
                ]
                break;
            case 'educationVerify':
                data.pageToSign = '3';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '240';
                data.signPositionY = '-75';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '240',
                        translateY: '-108'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '235',
                        translateY: '-145'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '290',
                        translateY: '-145'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '365',
                        translateY: '-145'
                    }
                ]
                break;
            case 'educationApprove':
                data.pageToSign = '1';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '270';
                data.signPositionY = '-360';
                data.multiStamper = [
                    {
                        text: name,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '260',
                        translateY: '-388'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '260',
                        translateY: '-412'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '305',
                        translateY: '-412'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-412'
                    }
                ]
                break;
        }
        return data;
    }

    preloadGeneralVerify = async (req, res, next) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'standardVerify'
            req.filePath = data?.document_path || null;
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadGeneralApprove = async (req, res, next) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'standardApprove'
            req.filePath = data?.document_path || null;
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadAssistVerify = async (req, res, next) => {
        try {
            const data = await reimbursementsAssist.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'standardVerify'
            req.filePath = data?.document_path || null;
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadAssistApprove = async (req, res, next) => {
        try {
            const data = await reimbursementsAssist.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'standardApprove'
            req.filePath = data?.document_path || null
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadFuneralVerify = async (req, res, next) => {
        try {
            const data = await reimbursementsEmployeeDeceased.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'funeralVerify'
            req.filePath = data?.document_path || null;
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadFuneralApprove = async (req, res, next) => {
        try {
            const data = await reimbursementsEmployeeDeceased.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'funeralApprove'
            req.filePath = data?.document_path || null;
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadEducationVeify = async (req, res, next) => {
        try {
            const data = await reimbursementsChildrenEducation.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'educationVerify';
            req.filePath = data?.document_path || null;
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadEducationApprove = async (req, res, next) => {
        try {
            const data = await reimbursementsChildrenEducation.findOne({
                where: { id: req.params.id },
                attributes: ['document_path']
            })
            req.method = 'educationApprove'
            req.filePath = data?.document_path || null
            next();
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new esign()