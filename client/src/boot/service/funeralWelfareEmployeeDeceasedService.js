import { api } from "../axios";

const path = "funeral-welfare";

export default {
  list(options) {
    return api.get(`${path}/`, {
      params: options,
    });
  },
  dataById(id) {
    return api.get(`${path}/${id}`);
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
    return api.post(`${path}/upload-file/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFile(fileName) {
    return api.get(`${path}/get-file`, {
      params: { fileName },
      responseType: 'blob',
    });
  },
};
