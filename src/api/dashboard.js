import axiosClient from "./axios";

export const getDashboard = () => {
    return axiosClient.get("/dashboard");
};