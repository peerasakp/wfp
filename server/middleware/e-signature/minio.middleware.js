const axios = require('axios');
const { th } = require('date-fns/locale/th');
const formData = require('form-data');
const fs = require('fs');
const path = require('path');

class minio {
    constructor() {
        this.minioPath = {
            putFileAuth: process.env.putFileAuth,
            putFile: process.env.putFile,
            getFileAuth: process.env.getFileAuth,
            getFile: process.env.getFile,
            deleteFileAuth: process.env.deleteFileAuth,
            deleteFile: process.env.deleteFile
        }
        this.client = {
            clientSecret: process.env.clientSecret,
            clientID: process.env.clientID,
            userID: process.env.userID
        }
        this.provisionKey = {
            putFile: process.env.putFileKey,
            getPublicFile: process.env.getFileKey,
            deleteFile: process.env.deleteFileKey
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
            console.log('==================== putfile ===================')
            console.log('==== client: ', this.client)
            const token = await this.auth('write', this.provisionKey.putFile, 'put');
            const filePath = req.esign.filePath
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
            console.log('Getfile Success :::::::::::::')
            const token = await this.auth('read', this.provisionKey.getPublicFile, 'get')
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
            const templateType = this.resolveTemplateDirectory(req.esign.method);
            const prefix = this.resolveFilePrefix(req.esign.method)
            const savePath = await this.downloadAndSaveFile(respone.data.result.file_1.download, `${prefix}_${req.fileName}`, templateType)
            const relativePath = savePath.split(/documents[\\/]/)[1];
            req.esign = {
                ...req.esign,
                newFilePath: relativePath
            }
            next();
        } catch (error) {
            next(error);
        }
    }

    // deleteFile()
    // This function is used to delete pdf file in Minio
    deleteFile = async (req, res, next) => {
        try {
            const token = await this.auth('write', this.provisionKey.deleteFile, 'delete')
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
            const relativePath = path.join(__dirname, '../../documents', req.esign.filePath)
            fs.unlinkSync(req.esign.filePath);
            console.log('=================== delete success =================', req.esign)
            next();
        } catch (error) {
            next(error);
        }
    }

    // downloadAndSaveFile()
    // This function is used to download and save file to target directory.
    downloadAndSaveFile = async (url, fileName, formatType) => {
        try {
            const baseDirectory = path.join(__dirname, '../../documents');
            const targetDirectory = path.join(baseDirectory, formatType);

            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, { recursive: true });
            }

            const filePath = path.join(targetDirectory, fileName)
            const respone = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream'
            });
            const writer = fs.createWriteStream(filePath);
            respone.data.pipe(writer)
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    resolve(filePath);
                });
                writer.on('error', reject)
            });
        } catch (error) {
            throw error
        }
    }

    resolveTemplateDirectory = (formatType) => {
        const directoryMap = {
            standard: ['standard', 'standardVerify', 'standardApprove', 'standardDisburse', 'standardReceipt'],
            funeral: ['funeral', 'funeralVerify', 'funeralApprove', 'funeralDisburse', 'funeralReceipt'],
            education: ['education', 'educationVerify', 'educationApprove', 'educationDisburse'],
        };

        for (const [directory, types] of Object.entries(directoryMap)) {
            if (types.includes(formatType)) return directory;
        }

        return null;
    };

    resolveFilePrefix = (formatType) => {
        if (formatType.includes('Verify')) return 'verified';
        if (formatType.includes('Approve')) return 'approved';
        if (formatType.includes('Disburse') || formatType.includes('Receipt')) return 'disbursed';
        return 'signed';
    }
}

module.exports = new minio();