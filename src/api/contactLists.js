import axiosClient from "./axios";

export const getContactLists = ({ page = 1, search = "", per_page = 20 } = {}) => {
    return axiosClient.get("/contact-lists", {
        params: { page, search, per_page },
    });
};

export const createContactList = (data) => {
    return axiosClient.post("/contact-lists", data);
};

export const getContactList = (id) => {
    return axiosClient.get(`/contact-lists/${id}`);
};

export const updateContactList = (id, data) => {
    return axiosClient.put(`/contact-lists/${id}`, data);
};

export const deleteContactList = (id) => {
    return axiosClient.delete(`/contact-lists/${id}`);
};

export const getContactListLeads = (id, { page = 1, search = "", per_page = 20 } = {}) => {
    return axiosClient.get(`/contact-lists/${id}/leads`, {
        params: { page, search, per_page },
    });
};

export const addManualContact = (id, data) => {
    return axiosClient.post(`/contact-lists/${id}/contacts`, data);
};

export const importContactCsv = (id, formData) => {
    return axiosClient.post(`/contact-lists/${id}/import-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const updateContactLead = (listId, contactLeadId, data) => {
    return axiosClient.put(`/contact-lists/${listId}/contacts/${contactLeadId}`, data);
};

export const removeLeadFromContactList = (id, contactLeadId) => {
    return axiosClient.delete(`/contact-lists/${id}/leads/${contactLeadId}`);
};

export const exportContactList = (id) => {
    return axiosClient.get(`/contact-lists/${id}/export`, {
        responseType: "blob",
    });
};

export const importContactListToCampaign = (campaignId, contactListId) => {
    return axiosClient.post(`/email-campaigns/${campaignId}/import-contact-list`, {
        contact_list_id: contactListId,
    });
};
