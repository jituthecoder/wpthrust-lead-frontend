import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| Template Variables API Client
|--------------------------------------------------------------------------
*/

export const getTemplateVariables = () => {
    return axiosClient.get("/template-variables");
};

export const previewTemplateVariables = (data) => {
    return axiosClient.post("/template-variables/preview", data);
};

export const renderTemplateVariables = (data) => {
    return axiosClient.post("/template-variables/render", data);
};
