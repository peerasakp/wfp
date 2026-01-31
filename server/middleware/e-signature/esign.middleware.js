const axios = require('axios');
const mockuAuthEsign = {}

// authEsign()
// This function is used to authen E-sign and get token
const authEsign = async (clientSecret, clientID, userID) => {
    try{
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
    }catch(error){
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
    }catch(error){
        console.log("signed error : ",error);
    }
}

// signedDate()
// This function is used to calculate signed date.
const signedDate = () => {
    const today = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok'})
    )
    const monthsTH = [
        'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
        'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
    ]
    const formatedDate = {
        day: today.getDate(),
        month: monthsTH[today.getMonth()],
        year: today.getFullYear() + 543
    }
    return formatedDate
}

module.exports = {
    signed
}