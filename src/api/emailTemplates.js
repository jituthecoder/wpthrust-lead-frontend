import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| Email Templates API Client
|--------------------------------------------------------------------------
*/

export const getEmailTemplates = ({
    page = 1,
    search = "",
    status = "",
    template_type = "",
} = {}) => {
    return axiosClient.get("/email-templates", {
        params: {
            page,
            search,
            status,
            template_type,
        },
    });
};

export const createEmailTemplate = (data) => {
    return axiosClient.post("/email-templates", data);
};

export const getEmailTemplate = (id) => {
    return axiosClient.get(`/email-templates/${id}`);
};

export const updateEmailTemplate = (id, data) => {
    return axiosClient.put(`/email-templates/${id}`, data);
};

export const deleteEmailTemplate = (id) => {
    return axiosClient.delete(`/email-templates/${id}`);
};

export const publishEmailTemplate = (id) => {
    return axiosClient.post(`/email-templates/${id}/publish`);
};

export const duplicateEmailTemplate = (id) => {
    return axiosClient.post(`/email-templates/${id}/duplicate`);
};

export const getTemplateVersions = (id) => {
    return axiosClient.get(`/email-templates/${id}/versions`);
};
