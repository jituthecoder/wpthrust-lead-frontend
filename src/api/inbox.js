import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| Unified Inbox API Client
|--------------------------------------------------------------------------
*/

export const getInboxMessages = ({
    email_sender_id = "",
    folder = "inbox",
    unread_only = false,
    search = "",
    page = 1,
    per_page = 25,
} = {}) => {
    return axiosClient.get("/inbox", {
        params: {
            email_sender_id,
            folder,
            unread_only,
            search,
            page,
            per_page,
        },
    });
};

export const getInboxSenders = () => {
    return axiosClient.get("/inbox/senders");
};

export const getInboxThread = (threadId) => {
    return axiosClient.get(`/inbox/threads/${threadId}`);
};

export const getInboxMessage = (id) => {
    return axiosClient.get(`/inbox/${id}`);
};

export const sendInboxEmail = (data) => {
    return axiosClient.post("/inbox/send", data);
};

export const replyInboxEmail = (id, data) => {
    return axiosClient.post(`/inbox/${id}/reply`, data);
};

export const markInboxRead = (id, isRead = true) => {
    return axiosClient.put(`/inbox/${id}/mark-read`, { is_read: isRead });
};

export const toggleInboxStar = (id) => {
    return axiosClient.put(`/inbox/${id}/star`);
};

export const deleteInboxMessage = (id) => {
    return axiosClient.delete(`/inbox/${id}`);
};

export const syncInbox = (email_sender_id = "") => {
    return axiosClient.post("/inbox/sync", { email_sender_id });
};
