const axios = require('axios');
const { composer } = require('../composer/composer.middleware');
const minio = require('./minio.middleware')
const esignPath = {
    signAuth: 'https://kong-dev.buu.ac.th/e-sign/e-sign.CheckCertificateAndSignatureByPerson/oauth2/token',
    sign: 'https://kong-dev.buu.ac.th/e-sign/e-sign.CheckCertificateAndSignatureByPerson',
    stamperAuth: 'https://kong-dev.buu.ac.th/service-api/e-sign.setaStamper.MultiStampTextSignElectronicSignatureWithImage/oauth2/token',
    stamper: 'https://kong-dev.buu.ac.th/service-api/e-sign.setaStamper.MultiStampTextSignElectronicSignatureWithImage'
}
const client = {
    clientSecret: '6RzgQnt7VhjlvnUdHX2W9s0Qp2owcyqJ',
    clientID: 'U5QhNd2ss5qz3W2uUVlDHSiAd0ktM68G',
    userID: 'informatics-welfare'
}
const provisionKey = {
    sign: 'o31wlYvJANGMjh7RvKXce3jWvXbuCtEu',
    stamper: 'RQbO5w8uavpcA28MOMzmg2HwH2Ur2Rjp'
}

// auth()
// This function is used to authen esign (dynimics)
const auth = async (scope, provisionKey, callMethod) => {
    try {
        let path
        switch (callMethod) {
            case 'sign':
                path = esignPath.signAuth;
                break;
            case 'stamper':
                path = esignPath.stamperAuth;
                break;
        }
        const data = {
            client_secret: client.clientSecret,
            client_id: client.clientID,
            grant_type: "password",
            scope: scope,
            provision_key: provisionKey,
            authenticated_userid: client.userID
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
            return await refreshToken(method);
        }
        throw error;
    }
}

// refreshToken()
// This function is used to 
const refreshToken = async (callMethod) => {
    try {
        let path
        switch (callMethod) {
            case 'sign':
                path = esignPath.signAuth;
                break;
            case 'stamper':
                path = esignPath.stamperAuth;
                break;
        }
        const data = {
            client_secret: client.clientSecret,
            client_id: client.clientID,
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


// authEsign()
// This function is used to authen E-sign and get token
const authEsign = async (clientSecret, clientID, userID) => {
    try {
        const data = {
            client_secret: clientSecret,
            client_id: clientID,
            grant_type: "password",
            scope: "read",
            provision_key: "o31wlYvJANGMjh7RvKXce3jWvXbuCtEu",
            authenticated_userid: userID
        }
        const respone = await axios.post(
            'https://kong-dev.buu.ac.th/e-sign/e-sign.CheckCertificateAndSignatureByPerson/oauth2/token',
            data,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
        console.log("authEsign console: ", respone.data)
        return respone.data
    } catch (error) {
        console.log(error);
    }
}

// signed()
// This function is used to get signature form E-sign
const signed = async (req, res, next) => {
    try {
        const token = await authEsign(
            '6RzgQnt7VhjlvnUdHX2W9s0Qp2owcyqJ',
            'U5QhNd2ss5qz3W2uUVlDHSiAd0ktM68G',
            'informatics-welfare'
        )
        const data = {
            psn_id: "00000000"
        }
        const respone = await axios.post(
            'https://kong-dev.buu.ac.th/e-sign/e-sign.CheckCertificateAndSignatureByPerson',
            data,
            {
                headers: {
                    'Authorization': `Bearer ${token.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        )
        req.body.esign = respone.data
        req.body.signedAt = signedDate()
        next()
    } catch (error) {
        console.log("signed error : ", error);
    }
}

// stmped()
// This function is used to stamped document on Minio
const stamper = async (req, res, next) => {
    try {
        const token = await auth("write", provisionKey.stamper, "stamper");
        const data = {
            psn_id: '00000000',
            positionType: 'normal',
            multiStamp: [
                {
                    text: 'ผู้ทดสอบระบบ',
                    fontSize: '16',
                    opacity: '1',
                    fontWeight: 'normal',
                    fontColor: [0, 0, 0],
                    outlineColor: [0, 0, 0],
                    position: 'left_top',
                    translateX: '200',
                    translateY: '-250'
                }
            ],
            imgWidth: '150',
            imgHeight: '80',
            position: 'left_top',
            positionX: '200',
            positionY: '-180',
            page: '1',
            documentName: req.fileName,
            bucket: 'informatics.welfare.storage'
        }
        const respone = await axios.post(
            esignPath.stamper,
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

// signedDate()
// This function is used to calculate signed date.
const signedDate = () => {
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

// This function is used to test
const testFlow = composer([
    minio.putFile,
    stamper,
    minio.getPublicFile,
    // minio.deleteFile
])

module.exports = {
    signed,
    testFlow
}