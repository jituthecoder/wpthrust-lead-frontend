import axiosClient from "./axios";

/*
|--------------------------------------------------------------------------
| PSI Report API Client
|--------------------------------------------------------------------------
*/

export const getPsiStats = () => {
    return axiosClient.get("/psi-report/stats");
};

export const getPsiReports = ({
    availability = "all",
    search = "",
    sort_by = "latest",
    page = 1,
    per_page = 20,
} = {}) => {
    return axiosClient.get("/psi-report", {
        params: {
            availability,
            search,
            sort_by,
            page,
            per_page,
        },
    });
};

export const retryPsiAudit = (businessIds) => {
    return axiosClient.post("/psi-report/retry", {
        business_ids: businessIds,
    });
};

export const retryPsiBatch = (condition) => {
    return axiosClient.post("/psi-report/retry-batch", {
        condition,
    });
};
