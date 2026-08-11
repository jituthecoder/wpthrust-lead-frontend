import axiosClient from "./axios";

export const getTodayFollowups = () => {
    return axiosClient.get("/followups/today");
};

export const getUpcomingFollowups = () => {
    return axiosClient.get("/followups/upcoming");
};

export const getOverdueFollowups = () => {
    return axiosClient.get("/followups/overdue");
};