import { api } from "../axios";

const path = "user";

export default {
  list(options) {
    return api.get(`${path}/`, {
      params: options,
    });
  },
  listOrderName(options) {
    return api.get(`${path}/order/name`, {
      params: options,
    });
  },
  dataById(id) {
    return api.get(`${path}/${id}`);
  },
  getUserInitialData(options) {
    return api.get(`${path}/userInitialData`, {
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
  deleteChild(id) {
    try {
      return api.delete(`${path}/delete-child/${id}`);
    }
    catch (error) {
      Promise.reject(error);
    }
  },
  getPersonByUsername(uslogin) {
    return api.get(`${path}/ums/${uslogin}`);
},
};
