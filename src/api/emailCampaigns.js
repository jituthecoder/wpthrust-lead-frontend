import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| Email Campaigns API Client
|--------------------------------------------------------------------------
*/

export const getEmailCampaigns = ({
    page = 1,
    search = "",
    status = "",
} = {}) => {
    return axiosClient.get("/email-campaigns", {
        params: {
            page,
            search,
            status,
        },
    });
};

export const createEmailCampaign = (data) => {
    return axiosClient.post("/email-campaigns", data);
};

export const getEmailCampaign = (id) => {
    return axiosClient.get(`/email-campaigns/${id}`);
};

export const updateEmailCampaign = (id, data) => {
    return axiosClient.put(`/email-campaigns/${id}`, data);
};

export const deleteEmailCampaign = (id) => {
    return axiosClient.delete(`/email-campaigns/${id}`);
};

export const startEmailCampaign = (id) => {
    return axiosClient.post(`/email-campaigns/${id}/start`);
};

export const pauseEmailCampaign = (id) => {
    return axiosClient.post(`/email-campaigns/${id}/pause`);
};

export const resumeEmailCampaign = (id) => {
    return axiosClient.post(`/email-campaigns/${id}/resume`);
};

export const cancelEmailCampaign = (id) => {
    return axiosClient.post(`/email-campaigns/${id}/cancel`);
};

export const assignCampaignLeads = (id, businessIds) => {
    return axiosClient.post(`/email-campaigns/${id}/leads`, {
        businesses: businessIds,
    });
};

export const getCampaignStats = (id) => {
    return axiosClient.get(`/email-campaigns/${id}/stats`);
};

export const getCampaignLeads = (id, { status = "", search = "", per_page = 20, page = 1 } = {}) => {
    return axiosClient.get(`/email-campaigns/${id}/leads`, {
        params: {
            status,
            search,
            per_page,
            page,
        },
    });
};

export const retryCampaignLead = (campaignId, campaignLeadId) => {
    return axiosClient.post(`/email-campaigns/${campaignId}/leads/${campaignLeadId}/retry`);
};

export const retryAllFailedCampaignLeads = (campaignId) => {
    return axiosClient.post(`/email-campaigns/${campaignId}/leads/retry-all`);
};

export const syncCampaignLeads = (campaignId) => {
    return axiosClient.post(`/email-campaigns/${campaignId}/sync-leads`);
};
