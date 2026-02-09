import { api } from "../axios";

const path = "reimbursement-children-education";

export default {
  list(options) {
    return api.get(`${path}/`, {
      params: options,
    });
  },
  getLastShcoolName(options) {
    return api.get(`${path}/latest-school/`, {
      params: options,
    });
  },
  dataById(id) {
    return api.get(`${path}/${id}`);
  },
  delete(id) {
    try {
      return api.delete(`${path}/${id}`);
    }
    catch (error) {
      Promise.reject(error);
    }
  },
  getRemaining(options) {
    return api.get(`${path}/remaining`, {
      params: options,
    });
  },
  getTotalCountRequested(options) {
    return api.get(`${path}/get-Count-Request`, {
      params: options,
    });
  },
  getDeadChild(options) {
    return api.get(`${path}/DeadChild`, {
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
  getSubCategories(options) {
    return api.get(`${path}/subCategories`, {
      params: options,
    });
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
  deleteFile(id, fileType) {
    return api.put(`${path}/delete-file/${id}`, { fileType });
  },
};