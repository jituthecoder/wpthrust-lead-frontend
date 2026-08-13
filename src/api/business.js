import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| Get Businesses
|--------------------------------------------------------------------------
*/

export const getBusinesses = ({
    page = 1,
    per_page = 20,
    search = "",
    status = "",
    category = "",
    assigned = "",
    psi_filter = "",
    has_screenshot = "",
    has_website = "",
} = {}) => {
    return axiosClient.get("/businesses", {
        params: {
            page,
            per_page,
            search,
            status,
            category,
            assigned,
            psi_filter,
            has_screenshot,
            has_website,
        },
    });
};

export const getBusinessCategories = () => {
    return axiosClient.get("/businesses/categories");
};

/*
|--------------------------------------------------------------------------
| Get Business Details
|--------------------------------------------------------------------------
*/

export const getLead = (id) => {
    return axiosClient.get(`/my-leads/${id}`);
};

/*
|--------------------------------------------------------------------------
| Assign Lead
|--------------------------------------------------------------------------
*/

export const assignLead = (data) => {
    return axiosClient.post("/businesses/assign", data);
};

/*
|--------------------------------------------------------------------------
| Call Lead
|--------------------------------------------------------------------------
*/

export const callLead = (id, data) => {
    return axiosClient.post(`/businesses/${id}/call`, data);
};

/*
|--------------------------------------------------------------------------
| Import Businesses
|--------------------------------------------------------------------------
*/

export const importBusinesses = (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return axiosClient.post(
        "/businesses/import",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
};

/*
|--------------------------------------------------------------------------
| Assign Leads
|--------------------------------------------------------------------------
*/

export const assignLeads = (businessIds, assignedUserId) => {
    return axiosClient.post("/businesses/assign", {
        business_ids: businessIds,
        assigned_user_id: assignedUserId,
    });
};

export const fetchBusinessPsi = (id) => {
    return axiosClient.post(`/businesses/${id}/fetch-psi`);
};