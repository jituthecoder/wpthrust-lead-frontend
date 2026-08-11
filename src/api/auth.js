import axiosClient from "./axios";

export const loginApi = (data) => {

    return axiosClient.post("/login", data);

};