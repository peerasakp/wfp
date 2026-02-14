const axios = require('axios');
const formData = require('form-data');
const fs = require('fs');
const path = require('path');

class minio {
    constructor() {
        this.minioPath = {
            putFileAuth: 'https://kong-dev.buu.ac.th/service-api/minio.PutFile/oauth2/token',
            putFile: 'https://kong-dev.buu.ac.th/service-api/minio.PutFile',
            getFileAuth: 'https://kong-dev.buu.ac.th/service-api/minio.GetPublicFile/oauth2/token',
            getFile: 'https://kong-dev.buu.ac.th/service-api/minio.GetPublicFile',
            deleteFileAuth: 'https://kong-dev.buu.ac.th/service-api/minio.DeleteFile/oauth2/token',
            deleteFile: 'https://kong-dev.buu.ac.th/service-api/minio.DeleteFile'
        }
        this.client = {
            clientSecret: '6RzgQnt7VhjlvnUdHX2W9s0Qp2owcyqJ',
            clientID: 'U5QhNd2ss5qz3W2uUVlDHSiAd0ktM68G',
            userID: 'informatics-welfare'
        }
    }

    // auth()
    // This function is used to authen mino (dynamics)
    auth = async (scope, provisionKey, method) => {
        try {
            const data = {
                client_secret: this.client.clientSecret,
                client_id: this.client.clientID,
                grant_type: "password",
                scope: scope,
                provision_key: provisionKey,
                authenticated_userid: this.client.userID
            }

            let path
            switch (method) {
                case 'put':
                    path = this.minioPath.putFileAuth;
                    break;
                case 'get':
                    path = this.minioPath.getFileAuth;
                    break;
                case 'delete':
                    path = this.minioPath.deleteFileAuth;
                    break
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
    // This function is used to refresh token
    refreshToken = async (method) => {
        try {
            const data = {
                client_secret: this.client.clientSecret,
                client_id: this.client.clientID,
                grant_type: "refresh_token",
                refresh_token: ""
            }
            let path
            switch (method) {
                case 'put':
                    path = this.minioPath.putFileAuth;
                    break;
                case 'get':
                    path = this.minioPath.getFileAuth;
                    break;
                case 'delete':
                    path = this.minioPath.deleteFileAuth;
                    break
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
            return respone.data
        } catch (error) {
            throw error;
        }
    }

    // putFile()
    // This function is used to authen and put pdf file to Minio (Object Store) 
    putFile = async (req, res, next) => {
        try {
            const token = await this.auth('write', 'l7hdoiyMMtelzqUJoXofCxI3m56CPXZ6', 'put');
            
            const filePath = path.join(
                __dirname,
                '../../document/welfare_69020519.pdf'
            );
            const data = new formData();
            data.append('qrVerify', 'false');
            data.append('path', '/');
            data.append('fileName', '');
            data.append('bucket', 'informatics.welfare.storage');
            data.append('originalExtension', 'pdf');
            data.append('fileUpload', fs.createReadStream(filePath)); // Mock up

            const respone = await axios.post(
                this.minioPath.putFile,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        ...data.getHeaders()
                    }
                }
            )
            req.fileName = respone.data.result;
            req.putRespone = respone.data;
            next();
        } catch (error) {
            console.log(error)
        }
    }

    // getPublicFile()
    // This function is used to get pdf file form Minio
    getPublicFile = async (req, res, next) => {
        try {
            const token = await this.auth('read', 'DI3abB5mVqz1L3tibii1hrjuUo89lfcW', 'get')
            const data = {
                filePath:
                {
                    file_1: req.fileName
                },
                time: 10,
                carbonTime: "M",
                bucket: "informatics.welfare.storage",
                originalFileName: {
                    file_1: "ทดสอบเรียกไฟล์เอกสาร.pdf" //Mock
                }
            }
            const respone = await axios.post(
                this.minioPath.getFile,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            req.getRespone = respone.data;
            next();
        } catch (error) {
            console.log(error)
        }
    }

    // deleteFile()
    // This function is used to delete pdf file in Minio
    deleteFile = async (req, res) => {
        try {
            const token = await this.auth('write', 'UV1yu0y4JaYl3WduIMNw8qMuk9SJSChD', 'delete')
            const data = {
                filePath: req.fileName,
                bucket: "informatics.welfare.storage"
            }
            const respone = await axios.delete(
                this.minioPath.deleteFile,
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    data: data
                }
            )
            res.json({
                put: req.putRespone,
                get: req.getRespone,
                delete: respone.data
            })
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new minio();