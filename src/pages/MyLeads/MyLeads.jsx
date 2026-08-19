import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import DashboardLayout from "../../components/layout/DashboardLayout";

import { getMyLeads } from "../../api/lead";

import LeadToolbar from "./components/LeadToolbar";
import LeadTable from "./components/LeadTable";
import LeadPagination from "./components/LeadPagination";

import ImportLeadModal from "./components/ImportLeadModal";

import { useAuth } from "../../contexts/AuthContext";

import AssignLeadModal from "./components/AssignLeadModal";


import { FiUpload, FiUserCheck } from "react-icons/fi";

export default function MyLeads() {
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);
    const [pagination, setPagination] = useState({});
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const { user } = useAuth();
    const [selectedLeads, setSelectedLeads] = useState([]);

    const [filters, setFilters] = useState({
        page: 1,
        per_page: 20,
        search: "",
        status: "",
        category: "",
        location: "",
        created_at: "",
        has_website: "",
        assigned: "",
        assigned_user_id: "",
    });

    useEffect(() => {
        loadLeads();
    }, [filters]);

    async function loadLeads() {
        try {
            setLoading(true);
            const response = await getMyLeads(filters);
            setLeads(response.data.data.data);
            setPagination(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function toggleLead(id) {
        setSelectedLeads((prev) => {
            if (prev.includes(id)) {
                return prev.filter((leadId) => leadId !== id);
            }
            return [...prev, id];
        });
    }

    function toggleAll() {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
            return;
        }
        setSelectedLeads(
            leads.map((lead) => lead.id)
        );
    }

    return (
        <DashboardLayout title="My Leads">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark">My Leads</h3>
                    <p className="text-muted m-0 small">Manage, assign, and track your business lead progress</p>
                </div>

                {user?.role === "super_admin" && (
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        {selectedLeads.length > 0 && (
                            <Button
                                variant="primary"
                                onClick={() => setShowAssignModal(true)}
                                className="shadow-sm d-inline-flex align-items-center gap-2 px-3 py-2"
                            >
                                <FiUserCheck />
                                <span>Assign Leads ({selectedLeads.length})</span>
                            </Button>
                        )}

                        <Button
                            variant="success"
                            onClick={() => setShowImportModal(true)}
                            className="shadow-sm d-inline-flex align-items-center gap-2 px-3 py-2 text-white fw-medium"
                            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                        >
                            <FiUpload />
                            <span>Import CSV</span>
                        </Button>
                    </div>
                )}
            </div>

            <LeadToolbar
                filters={filters}
                setFilters={setFilters}
            />

            <LeadTable
                loading={loading}
                leads={leads}
                selectedLeads={selectedLeads}
                toggleLead={toggleLead}
                toggleAll={toggleAll}
            />

            <LeadPagination
                pagination={pagination}
                filters={filters}
                setFilters={setFilters}
            />

            <ImportLeadModal
                show={showImportModal}
                onHide={() => setShowImportModal(false)}
                onSuccess={() => {

                    setShowImportModal(false);

                    loadLeads();

                }}
            />

            <AssignLeadModal
                show={showAssignModal}
                onHide={() => setShowAssignModal(false)}
                selectedLeads={selectedLeads}
                onSuccess={() => {

                    setShowAssignModal(false);

                    setSelectedLeads([]);

                    loadLeads();

                }}
            />

        </DashboardLayout>

    );

}