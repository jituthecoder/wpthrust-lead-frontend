import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| Email Senders API Client
|--------------------------------------------------------------------------
*/

export const getEmailSenders = ({
    page = 1,
    search = "",
    provider = "",
} = {}) => {
    return axiosClient.get("/email-senders", {
        params: {
            page,
            search,
            provider,
        },
    });
};

export const createEmailSender = (data) => {
    return axiosClient.post("/email-senders", data);
};

export const getEmailSender = (id) => {
    return axiosClient.get(`/email-senders/${id}`);
};

export const updateEmailSender = (id, data) => {
    return axiosClient.put(`/email-senders/${id}`, data);
};

export const deleteEmailSender = (id) => {
    return axiosClient.delete(`/email-senders/${id}`);
};

export const testSenderConnection = (id) => {
    return axiosClient.post(`/email-senders/${id}/test`);
};

export const sendSenderTestEmail = (id, { to, subject, message, html }) => {
    return axiosClient.post(`/email-senders/${id}/send-test`, {
        to,
        subject,
        message,
        html,
    });
};
