const axios = require('axios');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const {
    reimbursementsGeneral,
    reimbursementsAssist,
    reimbursementsEmployeeDeceased,
    reimbursementsChildrenEducation,
    users
} = require('../../models/mariadb');
const statusText = require('../../enum/statusText');
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
            const token = await this.auth("write", this.provisionKey.stamper, "stamper");
            const stampConfig = this.prepareStampConfig(req.esign.sum, req.user.name, req.user.position, req.esign.method);
            const data = {
                psn_id: req.user.psn_id,
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
            const response = await axios.post(
                this.esignPath.stamper,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            req.stamper = response.data;
            if (req.esign.method == 'standardDisburse') {
                req.esign.method = 'standardReceipt';
                await this.stamper(req, res, next);
            } else if (req.esign.method == 'funeralDisburse') {
                req.esign.method = 'funeralReceipt';
                await this.stamper(req, res, next);
            }
            else {
                next();
            }
        } catch (error) {
            console.log('stamper error');
            next(error)
        }
    }

    // signature()
    // This function is used to
    signature = async (psnID) => {
        try {
            const token = await this.auth('read', this.provisionKey.sign, 'sign')
            const data = { psn_id: psnID }
            const respone = await axios.post(
                this.esignPath.sign,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            return respone.data.result;
        } catch (error) {
            return null;
        }
    }
    //
    // This function is used to
    acknowledgeDisburse = async (req, res, next) => {
        const signature = await this.signature(req.esign.owner_psn);
        const document = req.savePath;
        try {
            // Read PDF file
            const pdfBytes = fs.readFileSync(document);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            // convert base64 to png
            const signBase64 = signature.SIGN_BASE64.replace(/^data:image\/png;base64,/, '')
            const signBytes = Buffer.from(signBase64, 'base64');
            const signImg = await pdfDoc.embedPng(signBytes);
            // Mark position
            const acknowledgeConfigs = this.prepareDisburseConfig(req.esign.method);
            const pages = pdfDoc.getPages();
            for (const pageConfig of acknowledgeConfigs) {
                pages[pageConfig.page].drawImage(
                    signImg,
                    {
                        x: pageConfig.positionX,
                        y: pageConfig.positionY,
                        width: 84,
                        height: 42
                    })
            }
            const signPdfBytes = await pdfDoc.save();
            fs.writeFileSync(document, signPdfBytes);
            next();
        } catch (error) {
            next(error);
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

    // prepareStampConfig()
    // This function is used to prepare
    prepareStampConfig = (sum, name, position, welfareType) => {
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
        const formatedDate = date.day + ' ' + date.month + ' ' + date.year;
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
                        text: sum,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '330',
                        translateY: '-238'
                    }, {
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
                        text: position,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '425',
                        translateY: '-440'
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
            case 'standardDisburse':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '380';
                data.signPositionY = '-615';
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
                        translateY: '-648'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '367',
                        translateY: '-670'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '430',
                        translateY: '-670'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
                        translateY: '-670'
                    }
                ]
                break;
            case 'standardReceipt':
                data.pageToSign = '3';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '240';
                data.signPositionY = '-752';
                data.multiStamper = [
                    {
                        text: formatedDate,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '450',
                        translateY: '-172'
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
                        text: sum,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '320',
                        translateY: '-672'
                    }, {
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
                        translateX: '375',
                        translateY: '-753'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '430',
                        translateY: '-753'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
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
            case 'funeralDisburse':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '380';
                data.signPositionY = '-272';
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
                        translateY: '-305'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '367',
                        translateY: '-324'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '430',
                        translateY: '-324'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '500',
                        translateY: '-324'
                    }
                ]
                break
            case 'funeralReceipt':
                data.pageToSign = '3';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '240';
                data.signPositionY = '-724';
                data.multiStamper = [
                    {
                        text: formatedDate,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '456',
                        translateY: '-164'
                    }
                ]
                break
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
                        translateX: '298',
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
                        translateX: '292',
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
                data.pageToSign = '3';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '250';
                data.signPositionY = '-215';
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
                        translateY: '-250'
                    }, {
                        text: position,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '285',
                        translateY: '-269'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '230',
                        translateY: '-285'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '290',
                        translateY: '-285'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-285'
                    }
                ]
                break;
            case 'educationDisburse':
                data.pageToSign = '3';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '250';
                data.signPositionY = '-436';
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
                        translateY: '-468'
                    }, {
                        text: date.day,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '230',
                        translateY: '-490'
                    }, {
                        text: date.month,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '290',
                        translateY: '-490'
                    }, {
                        text: date.year,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '370',
                        translateY: '-490'
                    }
                ]
                break;
        }
        return data;
    }

    // prepareDisburseConfig()
    // This function is used to
    prepareDisburseConfig = (type) => {
        let data = []
        switch (type) {
            case 'standardReceipt':
                data.push({
                    page: 1,
                    positionX: 380,
                    positionY: 236
                })
                data.push({
                    page: 2,
                    positionX: 240,
                    positionY: 72
                })
                break;
            case 'funeralReceipt':
                data.push({
                    page: 1,
                    positionX: 380,
                    positionY: 578
                })
                data.push({
                    page: 2,
                    positionX: 240,
                    positionY: 104
                })
                break;
            case 'educationDisburse':
                data.push({
                    page: 2,
                    positionX: 250,
                    positionY: 416
                })
                break;
        }
        return data
    }

    preloadGeneralVerify = async (req, res, next) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'fund_sum_request']
            })
            req.esign = {
                method: 'standardVerify',
                filePath: data?.document_path || null,
                sum: data?.fund_sum_request || null
            }
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
            req.esign = {
                method: 'standardApprove',
                filePath: data?.document_path || null,
            }
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadGeneralDisburse = async (req, res, next) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'created_by']
            })
            const creator = await users.findOne({
                where: { id: data.created_by },
                attributes: ['psn_id']
            })
            req.esign = {
                method: 'standardDisburse',
                filePath: data?.document_path || null,
                owner_psn: creator?.psn_id || null,
            }
            next();
        } catch (error) {
            next(error);
        }
    }

    preloadAssistVerify = async (req, res, next) => {
        try {
            const data = await reimbursementsAssist.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'fund_sum_request']
            })
            req.esign = {
                method: 'standardVerify',
                filePath: data?.document_path || null,
                sum: data?.fund_sum_request || null
            }
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
            req.esign = {
                method: 'standardApprove',
                filePath: data?.document_path || null,
            }
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadAssistDisburse = async (req, res, next) => {
        try {
            const data = await reimbursementsAssist.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'created_by']
            })
            const creator = await users.findOne({
                where: { id: data.created_by },
                attributes: ['psn_id']
            })
            req.esign = {
                method: 'standardDisburse',
                filePath: data?.document_path || null,
                owner_psn: creator?.psn_id || null,
            }
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadFuneralVerify = async (req, res, next) => {
        try {
            const data = await reimbursementsEmployeeDeceased.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'fund_sum_request']
            })
            req.esign = {
                method: 'funeralVerify',
                filePath: data?.document_path || null,
                sum: data?.fund_sum_request || null
            }
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
            req.esign = {
                method: 'funeralApprove',
                filePath: data?.document_path || null,
            }
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadFuneralDisburse = async (req, res, next) => {
        try {
            const data = await reimbursementsEmployeeDeceased.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'created_by']
            })
            const creator = await users.findOne({
                where: { id: data.created_by },
                attributes: ['psn_id']
            })
            req.esign = {
                method: 'funeralDisburse',
                filePath: data?.document_path || null,
                owner_psn: creator?.psn_id || null
            }
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
            req.esign = {
                method: 'educationVerify',
                filePath: data?.document_path || null,
            }
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
            req.esign = {
                method: 'educationApprove',
                filePath: data?.document_path || null,
            }
            next();
        } catch (error) {
            next(error)
        }
    }
    preloadEducationDisburse = async (req, res, next) => {
        try {
            const data = await reimbursementsChildrenEducation.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'created_by']
            })
            const creator = await users.findOne({
                where: { id: data.created_by },
                attributes: ['psn_id']
            })
            req.esign = {
                method: 'educationDisburse',
                filePath: data?.document_path || null,
                owner_psn: creator?.psn_id || null
            }
            next();
        } catch (error) {
            next(error)
        }
    }

    // Compatibility preload used by several welfare routes.
    preloadDocumentPath = async (req, res, next) => {
        try {
            const data = await reimbursementsGeneral.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'fund_sum_request', 'status']
            });
            req.filePath = data?.document_path || null;
            req.sum = data?.fund_sum_request || null;
            req.method = (
                data?.status === statusText.waitFinalApprove ||
                data?.status === statusText.waitPayment
            ) ? 'standardApprove' : 'standardVerify';
            next();
        } catch (error) {
            next(error);
        }
    }

    // Compatibility preload used by various/funeral employee routes.
    preloadAssist = async (req, res, next) => {
        try {
            const data = await reimbursementsAssist.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'fund_sum_request', 'status']
            });
            req.filePath = data?.document_path || null;
            req.sum = data?.fund_sum_request || null;
            req.method = (
                data?.status === statusText.waitFinalApprove ||
                data?.status === statusText.waitPayment
            ) ? 'standardApprove' : 'standardVerify';
            next();
        } catch (error) {
            next(error);
        }
    }

    // Compatibility preload used by family funeral routes.
    preloadFuneral = async (req, res, next) => {
        try {
            const data = await reimbursementsEmployeeDeceased.findOne({
                where: { id: req.params.id },
                attributes: ['document_path', 'fund_sum_request', 'status']
            });
            req.filePath = data?.document_path || null;
            req.sum = data?.fund_sum_request || null;
            req.method = (
                data?.status === statusText.waitFinalApprove ||
                data?.status === statusText.waitPayment
            ) ? 'funeralApprove' : 'funeralVerify';
            next();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new esign()