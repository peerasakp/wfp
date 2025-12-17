import { api } from "../axios";

const path = "health-check-up-welfare";

export default {
  list(options) {
    return api.get(`${path}/`, {
      params: options,
    });
  },
  dataById(id) {
    return api.get(`${path}/${id}`);
  },
  getWelfareById(id) {
    return api.get(`${path}/get-welfare/${id}`);
  },
  getRemaining(options) {
    return api.get(`${path}/remaining`, {
      params: options,
    });
  },
  create(payload) {
    try {
      return api.post(`${path}/`, payload);
    }
    catch (error) {
      Promise.reject(error);
    }
  },
  update(id, options) {
    try {
      return api.put(`${path}/${id}`, options);
    }
    catch (error) {
      Promise.reject(error);
    }
  },
  delete(id) {
    try {
      return api.delete(`${path}/${id}`);
    }
    catch (error) {
      Promise.reject(error);
    }
  },
  uploadFile(id, formData) {
    return api.post(`${path}/file/upload/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile(id, fileType) {
    return api.post(`${path}/file/delete/${id}`, { fileType });
  },
  getFileByName(fileName) {
    return api.get(`${path}/file/get-by-name`, {
      params: { fileName },
      responseType: 'arraybuffer',
    });
  },
};
