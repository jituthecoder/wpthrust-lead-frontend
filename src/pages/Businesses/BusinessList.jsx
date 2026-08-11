import { useEffect, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import { getBusinesses } from "../../api/business";

import BusinessTable from "./components/BusinessTable";

import BusinessToolbar from "./components/BusinessToolbar";
import Pagination from "../../components/ui/Pagination";

function BusinessList() {

    const [loading, setLoading] = useState(true);

    const [businesses, setBusinesses] = useState([]);

    const [pagination, setPagination] = useState({});

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("");

    const [category, setCategory] = useState("");

    const [assigned, setAssigned] = useState("");

    useEffect(() => {

        loadBusinesses(1);

    }, [
        search,
        status,
        category,
        assigned,
    ]);

    async function loadBusinesses(page = 1) {

        try {

            setLoading(true);

            const response = await getBusinesses({

                page,

                search,

                status,

                category,

                assigned,

            });

            setBusinesses(response.data.data.data);

            setPagination(response.data.data);

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <DashboardLayout title="Businesses">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark">Businesses</h3>
                    <p className="text-muted m-0 small">Browse and search business directory leads</p>
                </div>
            </div>

            <BusinessToolbar
                search={search}
                setSearch={setSearch}
                status={status}
                setStatus={setStatus}
                category={category}
                setCategory={setCategory}
                assigned={assigned}
                setAssigned={setAssigned}
            />

            <BusinessTable
                businesses={businesses}
                loading={loading}
            />

            <Pagination
                pagination={pagination}
                onPageChange={loadBusinesses}
            />
        </DashboardLayout>

    );

}

export default BusinessList;