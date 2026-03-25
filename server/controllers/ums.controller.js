const axios = require('axios');

class ums {
    constructor() {
        this.ePersonPath = {
            ePersonAuth: process.env.ePersonAuth,
            ePersonData: process.env.ePersonData
        }
        this.client = {
            clientSecret: process.env.clientSecret,
            clientID: process.env.clientID,
            userID: process.env.userID
        }
        this.provisionKey = {
            ePerson:  process.env.ePersonKey
        }
    }
    // auth()
    auth = async () => {
        try {
            const data = {
                client_secret: this.client.clientSecret,
                client_id: this.client.clientID,
                grant_type: "password",
                scope: "read",
                provision_key: this.provisionKey.ePerson,
                authenticated_userid: this.client.userID
            }
            const respone = await axios.post(
                this.ePersonPath.ePersonAuth,
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
                return await this.refreshToken();
            }
            throw error;
        }
    }
    // refreshToken
    refreshToken = async () => {
        try {
            const data = {
                client_secret: this.client.clientSecret,
                client_id: this.client.clientID,
                grant_type: "refresh_token",
                refresh_token: ''
            }
            const respone = await axios.post(
                this.ePersonPath.ePersonAuth,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            return respone.data;
        } catch (error) {
            throw error
        }

    }
    SpersonByInformatics = async (req, res) => {
        try {
            const token = await this.auth();
            const respone = await axios.post(
                this.ePersonPath.ePersonData,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            const personData = this.isMatch(respone.data?.result, req.params.uslogin);
            if (personData) {
                return res.status(200).json({ data: personData });
            } else {
                return res.status(404).json({ message: 'ไม่พบข้อมูลบุคลากร' });
            }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    isMatch = (persons, uslogin) => {
        if (!persons || !Array.isArray(persons)) return null;
        let data = {
            psn_id: '',
            prf_nameth: '',
            psn_fullname: '',
            fac_nameth: '',
            psn_admitdate: '',
        }
        for (const person of persons) {
            if (uslogin == person.uslogin) {
                data.psn_id = person.psn_id;
                data.prf_nameth = person.prf_nameth;
                data.psn_fullname = person.psn_fnameth + ' ' + person.psn_lnameth;
                return data;
            }
        }
        return null;
    }

}
module.exports = new ums()