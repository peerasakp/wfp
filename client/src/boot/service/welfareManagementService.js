import { api } from "../axios";


export default {
    dataHealthCheckUpById(id) {
        return api.get(`health-check-up-welfare/get-welfare/${id}`);
    },

    updateHealthCheckUp(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `health-check-up-welfare/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `health-check-up-welfare/approve-welfare/${id}`
                : `health-check-up-welfare/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },
    dataMedicalById(id) {
        return api.get(`medical-welfare/get-welfare/${id}`);
    },
    updateMedical(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `medical-welfare/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `medical-welfare/approve-welfare/${id}`
                : `medical-welfare/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },
    dataDentalById(id) {
        return api.get(`dental-welfare/get-welfare/${id}`);
    },
    updateDental(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `dental-welfare/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `dental-welfare/approve-welfare/${id}`
                : `dental-welfare/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },
    dataFuneralById(id) {
        return api.get(`funeral-welfare/get-welfare/${id}`);
    },
    updateFuneral(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `funeral-welfare/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `funeral-welfare/approve-welfare/${id}`
                : `funeral-welfare/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },
    dataFamilyFuneralById(id) {
        return api.get(`various-welfare-funeral-family/get-welfare/${id}`);
    },
    updateFamilyFuneral(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `various-welfare-funeral-family/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `various-welfare-funeral-family/approve-welfare/${id}`
                : `various-welfare-funeral-family/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },
    dataVariousById(id) {
        return api.get(`various-welfare/get-welfare/${id}`);
    },
    updateVarious(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `various-welfare/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `various-welfare/approve-welfare/${id}`
                : `various-welfare/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },

    dataChildrenById(id) {
        return api.get(`reimbursement-children-education/get-welfare/${id}`);
    },
    updateChildren(id, options) {
        try {
            const { isFinalApprove, isDisburseApprove, ...payload } = options ?? {};
            const endpoint =
              isDisburseApprove && payload?.actionId === 3
                ? `reimbursement-children-education/disburse-welfare/${id}`
                : isFinalApprove && payload?.actionId === 3
                ? `reimbursement-children-education/approve-welfare/${id}`
                : `reimbursement-children-education/update-welfare/${id}`;
            return api.put(endpoint, payload);
        }
        catch (error) {
            Promise.reject(error);
        }
    },
    getLastShcoolNameEditor(options) {
        return api.get(`reimbursement-children-education/get-latest-school/latest-school`, {
          params: options,
        });
    },
};
