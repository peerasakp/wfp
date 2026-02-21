const axios = require('axios');
const { composer } = require('../composer/composer.middleware');
const minio = require('./minio.middleware')

class esign {
    constructor() {
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
            const stampConfig = this.prepareData('healthcheck')
            const data = {
                psn_id: '00000000',
                positionType: 'normal',
                multiStamp: [
                    {
                        text: stampConfig.signAt,
                        fontSize: '16',
                        opacity: '1',
                        fontWeight: 'normal',
                        fontColor: [0, 0, 0],
                        outlineColor: [0, 0, 0],
                        position: 'left_top',
                        translateX: '360',
                        translateY: '-125'
                    }
                ],
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
        try{
           req.params.id = req.createdId;
           req.body.document_path = req.savePath;
           next(); 
        }catch(error){
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
    prepareData = (welfareType) => {
        let data = {
            signAt: '',
            pageToSign: '',
            signImgWidth: '',
            signImgHeight: '',
            signPositionX: '',
            signPositionY: ''
        }
        const date = this.signedDate()
        data.signAt = '  ' + date.day + '             ' + date.month + '          ' + date.year ;
        switch(welfareType){
            case 'healthcheck':
                data.pageToSign = '2';
                data.signImgWidth = '84';
                data.signImgHeight = '42';
                data.signPositionX = '340';
                data.signPositionY = '-75';
                break;
        }
        return data;
    }
}

module.exports = new esign()