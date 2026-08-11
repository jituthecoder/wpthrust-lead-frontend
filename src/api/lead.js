import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| My Leads
|--------------------------------------------------------------------------
*/

export const getMyLeads = ({
    page = 1,
    per_page = 20,
    search = "",
    status = "",
    category = "",
    assigned = "",
    assigned_user_id = "",
} = {}) => {

    return axiosClient.get("/my-leads", {
        params: {
            page,
            per_page,
            search,
            status,
            category,
            assigned,
            assigned_user_id,
        },
    });

};

export const getLead = (id) => {
    return axiosClient.get(`/my-leads/${id}`);
};

export const callLead = async (id, data) => {
    const response = await axiosClient.post(
        `/my-leads/${id}/call`,
        data
    );

    return response.data;
};

/*
|--------------------------------------------------------------------------
| Follow-ups
|--------------------------------------------------------------------------
*/

export const getTodayFollowups = () => {
    return axiosClient.get("/followups/today");
};

export const getUpcomingFollowups = () => {
    return axiosClient.get("/followups/upcoming");
};

export const getOverdueFollowups = () => {
    return axiosClient.get("/followups/overdue");
};