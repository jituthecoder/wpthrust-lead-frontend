import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table, ProgressBar } from "react-bootstrap";
import { FiPlus, FiSearch, FiPlay, FiPause, FiEye, FiEdit3, FiTrash2, FiRefreshCw, FiSend, FiXCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getEmailCampaigns, startEmailCampaign, pauseEmailCampaign, resumeEmailCampaign, cancelEmailCampaign, deleteEmailCampaign } from "../../../api/emailCampaigns";
import CreateCampaignModal from "./CreateCampaignModal";
import Pagination from "../../../components/ui/Pagination";

export default function CampaignsTab() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState([]);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    const loadCampaigns = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getEmailCampaigns({ page, search, status: statusFilter });
            setCampaigns(res.data.data.data || []);
            setPagination(res.data.data || {});
        } catch (error) {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns(1);
    }, [search, statusFilter]);

    const handleCreate = () => {
        setSelectedCampaign(null);
        setShowCreateModal(true);
    };

    const handleEdit = (campaign) => {
        setSelectedCampaign(campaign);
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this campaign?")) return;
        try {
            await deleteEmailCampaign(id);
            toast.success("Campaign deleted successfully");
            loadCampaigns(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to delete campaign");
        }
    };

    const handleStart = async (id) => {
        try {
            await startEmailCampaign(id);
            toast.success("Campaign started!");
            loadCampaigns(pagination.current_page || 1);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to start campaign";
            toast.error(msg);
        }
    };

    const handlePause = async (id) => {
        try {
            await pauseEmailCampaign(id);
            toast.success("Campaign paused!");
            loadCampaigns(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to pause campaign");
        }
    };

    const handleResume = async (id) => {
        try {
            await resumeEmailCampaign(id);
            toast.success("Campaign resumed!");
            loadCampaigns(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to resume campaign");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this campaign? Pending leads will be stopped.")) return;
        try {
            await cancelEmailCampaign(id);
            toast.success("Campaign cancelled!");
            loadCampaigns(pagination.current_page || 1);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to cancel campaign";
            toast.error(msg);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "running":
                return <Badge bg="success" className="px-2 py-1">Running</Badge>;
            case "paused":
                return <Badge bg="warning" text="dark" className="px-2 py-1">Paused</Badge>;
            case "completed":
                return <Badge bg="info" className="px-2 py-1">Completed</Badge>;
            case "cancelled":
                return <Badge bg="danger" className="px-2 py-1">Cancelled</Badge>;
            case "scheduled":
                return <Badge bg="primary" className="px-2 py-1">Scheduled</Badge>;
            default:
                return <Badge bg="secondary" className="px-2 py-1">Draft</Badge>;
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <div className="position-relative" style={{ minWidth: "260px" }}>
                        <Form.Control
                            type="text"
                            placeholder="Search campaigns..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-4"
                        />
                        <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                    </div>

                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: "160px" }}
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="running">Running</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </Form.Select>
                </div>

                <Button variant="primary" onClick={handleCreate} className="d-flex align-items-center gap-2">
                    <FiPlus />
                    <span>Create Campaign</span>
                </Button>
            </div>

            {/* List / Table */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading email campaigns...</p>
                </div>
            ) : campaigns.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <h5 className="fw-bold text-muted mb-2">No Campaigns Found</h5>
                        <p className="text-muted mb-3">Launch automated cold email sequences to turn prospects into active leads.</p>
                        <Button variant="outline-primary" onClick={handleCreate}>
                            <FiPlus className="me-1" /> Create Your First Campaign
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="table-responsive">
                        <Table hover align="middle" className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Campaign Name</th>
                                    <th>Template</th>
                                    <th>Status</th>
                                    <th>Leads</th>
                                    <th>Progress</th>
                                    <th>Open Rate</th>
                                    <th>Click Rate</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((cmp) => {
                                    const total = cmp.total_leads || 0;
                                    const sent = cmp.sent_count ?? cmp.sent_leads ?? 0;
                                    const progressPct = cmp.status === "completed" ? 100 : (total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0);

                                    return (
                                        <tr key={cmp.id}>
                                            <td>
                                                <div
                                                    className="fw-bold text-dark cursor-pointer text-primary-hover"
                                                    onClick={() => navigate(`/email-campaigns/${cmp.id}`)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {cmp.name}
                                                </div>
                                                {cmp.description && (
                                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: "250px" }}>
                                                        {cmp.description}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <span className="fw-medium text-dark">{cmp.template?.name || "N/A"}</span>
                                            </td>
                                            <td>{getStatusBadge(cmp.status)}</td>
                                            <td>
                                                <span className="fw-bold text-dark">{cmp.total_leads || 0}</span>
                                            </td>
                                            <td style={{ minWidth: "130px" }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <ProgressBar
                                                        now={progressPct}
                                                        variant={cmp.status === "completed" ? "info" : "primary"}
                                                        style={{ height: "6px", flex: 1 }}
                                                    />
                                                    <small className="text-muted fw-semibold">{progressPct}%</small>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg="success" className="px-2 py-1">
                                                    {cmp.open_rate ?? 0}%
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="primary" className="px-2 py-1">
                                                    {cmp.click_rate ?? 0}%
                                                </Badge>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-inline-flex gap-1">
                                                    {/* Control Buttons */}
                                                    {(cmp.status === "draft" || cmp.status === "scheduled") && (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleStart(cmp.id)}
                                                            title="Start Campaign"
                                                            className="d-flex align-items-center gap-1"
                                                        >
                                                            <FiPlay />
                                                            <span>Start</span>
                                                        </Button>
                                                    )}

                                                    {cmp.status === "running" && (
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            onClick={() => handlePause(cmp.id)}
                                                            title="Pause Campaign"
                                                            className="d-flex align-items-center gap-1"
                                                        >
                                                            <FiPause />
                                                            <span>Pause</span>
                                                        </Button>
                                                    )}

                                                    {cmp.status === "paused" && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleResume(cmp.id)}
                                                            title="Resume Campaign"
                                                            className="d-flex align-items-center gap-1"
                                                        >
                                                            <FiPlay />
                                                            <span>Resume</span>
                                                        </Button>
                                                    )}

                                                    {(cmp.status === "running" || cmp.status === "paused") && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleCancel(cmp.id)}
                                                            title="Cancel Campaign"
                                                            className="d-flex align-items-center gap-1"
                                                        >
                                                            <FiXCircle />
                                                            <span>Cancel</span>
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => navigate(`/email-campaigns/${cmp.id}`)}
                                                        title="View Stats & Leads"
                                                    >
                                                        <FiEye />
                                                    </Button>

                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => handleEdit(cmp)}
                                                        title="Edit Campaign"
                                                    >
                                                        <FiEdit3 />
                                                    </Button>

                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => handleDelete(cmp.id)}
                                                        title="Delete Campaign"
                                                    >
                                                        <FiTrash2 />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}

            {!loading && campaigns.length > 0 && (
                <div className="mt-4">
                    <Pagination pagination={pagination} onPageChange={loadCampaigns} />
                </div>
            )}

            <CreateCampaignModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                campaign={selectedCampaign}
                onSaved={() => loadCampaigns(pagination.current_page || 1)}
            />
        </div>
    );
}
