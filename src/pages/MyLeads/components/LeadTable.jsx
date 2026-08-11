import { Table, Spinner } from "react-bootstrap";
import { FiEye, FiPhone, FiGlobe } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function LeadTable({
    loading,
    leads,
    selectedLeads,
    toggleLead,
    toggleAll,
}) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="card border-0 shadow-sm p-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted small mt-2 m-0">Loading leads...</p>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th width="50" className="text-center ps-3 d-none d-md-table-cell">
                                <input
                                    type="checkbox"
                                    className="form-check-input cursor-pointer"
                                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                    checked={
                                        leads.length > 0 &&
                                        selectedLeads.length === leads.length
                                    }
                                    onChange={toggleAll}
                                />
                            </th>
                            <th>Business Name</th>
                            <th>Category</th>
                            <th width="120" className="text-center pe-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-5">
                                    <div className="text-muted">
                                        <p className="fw-semibold mb-1">No leads found</p>
                                        <small>Try adjusting your search or filters.</small>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => {
                                const websiteUrl = lead.website?.trim();
                                const hasWebsite = Boolean(
                                    websiteUrl &&
                                    websiteUrl.toLowerCase() !== "n/a" &&
                                    websiteUrl !== "-"
                                );

                                return (
                                    <tr key={lead.id}>
                                        <td className="text-center ps-3 d-none d-md-table-cell">
                                            <input
                                                type="checkbox"
                                                className="form-check-input cursor-pointer"
                                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                checked={selectedLeads.includes(lead.id)}
                                                onChange={() => toggleLead(lead.id)}
                                            />
                                        </td>

                                        <td>
                                            <div
                                                className="fw-semibold text-dark"
                                                style={{ fontSize: "0.88rem", overflow: "hidden", whiteSpace: "nowrap" }}
                                                title={lead.business_name}
                                            >
                                                {lead.business_name}
                                            </div>
                                            <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                                                {hasWebsite ? (
                                                    <a
                                                        href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-success text-decoration-none d-inline-flex align-items-center gap-1"
                                                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                                                        title={websiteUrl}
                                                    >
                                                        <FiGlobe size={11} />
                                                        <span>Available</span>
                                                    </a>
                                                ) : (
                                                    <span
                                                        className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle"
                                                        style={{ fontSize: "0.68rem", padding: "1px 5px", fontWeight: 600 }}
                                                    >
                                                        N/A
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className="badge bg-light text-dark border font-normal d-inline-block"
                                                style={{ fontSize: "0.75rem", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "100%" }}
                                            >
                                                {lead.category || "General"}
                                            </span>
                                        </td>

                                        <td className="text-center pe-2">
                                            <div className="d-flex align-items-center justify-content-center gap-1">
                                                <a
                                                    className="btn action-icon-btn action-icon-btn-phone"
                                                    href={lead.phone ? `tel:${lead.phone}` : "#"}
                                                    title={lead.phone ? `Call ${lead.phone}` : "No phone number"}
                                                    style={{
                                                        backgroundColor: "#10b981",
                                                        borderColor: "#10b981",
                                                        color: "#ffffff",
                                                        opacity: lead.phone ? 1 : 0.5,
                                                        pointerEvents: lead.phone ? "auto" : "none"
                                                    }}
                                                >
                                                    <FiPhone style={{ color: "#ffffff", stroke: "#ffffff", strokeWidth: 2 }} />
                                                </a>

                                                <button
                                                    className="btn action-icon-btn action-icon-btn-view"
                                                    onClick={() => navigate(`/my-leads/${lead.id}`)}
                                                    title="View Lead Details"
                                                    style={{
                                                        backgroundColor: "#eff6ff",
                                                        borderColor: "#bfdbfe",
                                                        color: "#2563eb"
                                                    }}
                                                >
                                                    <FiEye style={{ color: "#2563eb", stroke: "#2563eb", strokeWidth: 2 }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}