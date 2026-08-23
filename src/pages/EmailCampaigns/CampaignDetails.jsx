import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table, ProgressBar, Modal } from "react-bootstrap";
import { FiArrowLeft, FiPlay, FiPause, FiRefreshCw, FiPlus, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiSearch, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
    getEmailCampaign,
    getCampaignStats,
    getCampaignLeads,
    startEmailCampaign,
    pauseEmailCampaign,
    resumeEmailCampaign,
    cancelEmailCampaign,
    retryCampaignLead,
    retryAllFailedCampaignLeads,
    syncCampaignLeads,
    removeCampaignLead,
} from "../../api/emailCampaigns";
import AssignLeadsModal from "./components/AssignLeadsModal";
import CreateCampaignModal from "./components/CreateCampaignModal";
import Pagination from "../../components/ui/Pagination";

export default function CampaignDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [selectedSentLead, setSelectedSentLead] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [stats, setStats] = useState(null);

    // Leads table state
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [leads, setLeads] = useState([]);
    const [pagination, setPagination] = useState({});
    const [statusFilter, setStatusFilter] = useState("");
    const [errorFilter, setErrorFilter] = useState("");
    const [errorSearch, setErrorSearch] = useState("");
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [search, setSearch] = useState("");

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [retryingLeadId, setRetryingLeadId] = useState(null);
    const [retryingAll, setRetryingAll] = useState(false);
    const [syncingLeads, setSyncingLeads] = useState(false);

    const refreshStatsSilent = async () => {
        if (!id) return;
        try {
            const statsRes = await getCampaignStats(id);
            setStats(statsRes.data.data);
            if (statsRes.data.data?.status && campaign?.status !== statsRes.data.data.status) {
                const cmpRes = await getEmailCampaign(id);
                setCampaign(cmpRes.data.data);
            }
        } catch (e) {
            // silent polling error ignored
        }
    };

    const loadCampaignData = async () => {
        try {
            setLoading(true);
            const [cmpRes, statsRes] = await Promise.all([
                getEmailCampaign(id),
                getCampaignStats(id),
            ]);
            setCampaign(cmpRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            toast.error("Failed to load campaign details");
        } finally {
            setLoading(false);
        }
    };

    const loadLeads = async (page = 1) => {
        try {
            setLeadsLoading(true);
            const res = await getCampaignLeads(id, {
                status: statusFilter,
                search,
                error_search: errorSearch,
                page,
                per_page: 20,
            });
            setLeads(res.data.data?.data || []);
            setPagination(res.data.data || {});
        } catch (error) {
            toast.error("Failed to load campaign leads");
        } finally {
            setLeadsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadCampaignData();
            loadLeads(1);
        }
    }, [id, statusFilter, search, errorSearch]);

    // Live Stats Polling for running or paused campaigns
    useEffect(() => {
        if (!campaign || (campaign.status !== "running" && campaign.status !== "paused")) {
            return;
        }

        const intervalId = setInterval(() => {
            refreshStatsSilent();
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(intervalId);
    }, [campaign?.status, id]);

    const handleStart = async () => {
        if (!window.confirm("Are you sure you want to START this campaign? Emails will begin queuing and sending to leads.")) return;
        try {
            await startEmailCampaign(id);
            toast.success("Campaign started successfully!");
            loadCampaignData();
            loadLeads(1);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to start campaign";
            toast.error(msg);
        }
    };

    const handlePause = async () => {
        if (!window.confirm("Are you sure you want to PAUSE this campaign? Email dispatch will be temporarily suspended.")) return;
        try {
            await pauseEmailCampaign(id);
            toast.success("Campaign paused!");
            loadCampaignData();
            loadLeads(1);
        } catch (error) {
            toast.error("Failed to pause campaign");
        }
    };

    const handleResume = async () => {
        if (!window.confirm("Are you sure you want to RESUME this campaign? Email sending will resume.")) return;
        try {
            await resumeEmailCampaign(id);
            toast.success("Campaign resumed!");
            loadCampaignData();
            loadLeads(1);
        } catch (error) {
            toast.error("Failed to resume campaign");
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this campaign? Pending leads will be stopped.")) return;
        try {
            await cancelEmailCampaign(id);
            toast.success("Campaign cancelled!");
            loadCampaignData();
            loadLeads(1);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to cancel campaign";
            toast.error(msg);
        }
    };

    const handleRetryLead = async (leadId) => {
        try {
            setRetryingLeadId(leadId);
            await retryCampaignLead(id, leadId);
            toast.success("Lead queued for retry!");
            loadLeads(pagination.current_page || 1);
            loadCampaignData();
        } catch (error) {
            toast.error("Failed to retry lead");
        } finally {
            setRetryingLeadId(null);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeadIds(leads.map((l) => l.id));
        } else {
            setSelectedLeadIds([]);
        }
    };

    const handleSelectLead = (leadId) => {
        setSelectedLeadIds((prev) =>
            prev.includes(leadId) ? prev.filter((i) => i !== leadId) : [...prev, leadId]
        );
    };

    const handleRetryAllFailed = async (overrideFilter = null, targetLeadIds = null) => {
        try {
            setRetryingAll(true);
            const filterToUse = overrideFilter !== null ? overrideFilter : errorFilter;
            const idsToUse = targetLeadIds || (selectedLeadIds.length > 0 ? selectedLeadIds : null);

            const res = await retryAllFailedCampaignLeads(id, {
                error_filter: filterToUse,
                lead_ids: idsToUse,
            });

            toast.success(res.data.message || "Failed leads queued for retry");
            setSelectedLeadIds([]);
            loadLeads(1);
            loadCampaignData();
        } catch (error) {
            toast.error("Failed to retry leads");
        } finally {
            setRetryingAll(false);
        }
    };

    const handleSyncLeads = async () => {
        try {
            setSyncingLeads(true);
            const res = await syncCampaignLeads(id);
            const added = res.data?.data?.added_count || 0;
            toast.success(`Synced ${added} matching leads from database to campaign!`);
            loadCampaignData();
            loadLeads(1);
        } catch (error) {
            toast.error("Failed to sync matching leads");
        } finally {
            setSyncingLeads(false);
        }
    };

    const handleRemoveLead = async (leadId) => {
        if (!window.confirm("Are you sure you want to remove this lead from the campaign?")) {
            return;
        }
        try {
            await removeCampaignLead(id, leadId);
            toast.success("Lead removed from campaign");
            loadLeads(pagination.current_page || 1);
            loadCampaignData();
        } catch (error) {
            toast.error("Failed to remove lead");
        }
    };

    const getLeadStatusBadge = (status) => {
        switch (status) {
            case "sent":
                return <Badge bg="success"><FiCheckCircle className="me-1" /> Sent</Badge>;
            case "opened":
                return <Badge bg="info"><FiCheckCircle className="me-1" /> Opened</Badge>;
            case "clicked":
                return <Badge bg="primary"><FiCheckCircle className="me-1" /> Clicked</Badge>;
            case "unsubscribed":
                return <Badge bg="dark"><FiXCircle className="me-1" /> Unsubscribed</Badge>;
            case "processing":
                return <Badge bg="warning"><Spinner size="sm" animation="border" className="me-1" /> Processing</Badge>;
            case "failed":
                return <Badge bg="danger"><FiXCircle className="me-1" /> Failed</Badge>;
            default:
                return <Badge bg="secondary"><FiClock className="me-1" /> Pending</Badge>;
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Campaign Details">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading campaign dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!campaign) {
        return (
            <DashboardLayout title="Campaign Not Found">
                <div className="alert alert-danger text-center">
                    Campaign not found or has been deleted.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={`Campaign: ${campaign.name}`}>
            {/* Header / Back */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 bg-white p-3 p-md-4 rounded-3 border border-light-subtle shadow-sm">
                <div className="d-flex align-items-center gap-3">
                    <Button
                        variant="light"
                        className="rounded-circle p-2 border shadow-sm"
                        onClick={() => navigate("/email-campaigns")}
                    >
                        <FiArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            <h4 className="fw-bold m-0 text-dark">{campaign.name}</h4>
                            <Badge
                                bg={
                                    campaign.status === "running"
                                        ? "success"
                                        : campaign.status === "paused"
                                        ? "warning"
                                        : campaign.status === "completed"
                                        ? "info"
                                        : "secondary"
                                }
                                className="text-uppercase px-2 py-1"
                            >
                                {campaign.status}
                            </Badge>
                        </div>
                        {campaign.description && (
                            <p className="text-muted m-0 small mt-1">{campaign.description}</p>
                        )}
                    </div>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={loadCampaignData}
                        title="Refresh Stats"
                        className="d-inline-flex align-items-center gap-1 py-2 px-3"
                    >
                        <FiRefreshCw />
                        <span className="d-none d-sm-inline ms-1">Refresh</span>
                    </Button>

                    {(campaign.status === "draft" || campaign.status === "scheduled") && (
                        <Button variant="success" onClick={handleStart} className="d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap">
                            <FiPlay />
                            <span>Start Campaign</span>
                        </Button>
                    )}

                    {campaign.status === "running" && (
                        <Button variant="warning" onClick={handlePause} className="d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap">
                            <FiPause />
                            <span>Pause Campaign</span>
                        </Button>
                    )}

                    {campaign.status === "paused" && (
                        <Button variant="primary" onClick={handleResume} className="d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap">
                            <FiPlay />
                            <span>Resume Campaign</span>
                        </Button>
                    )}

                    {(campaign.status === "running" || campaign.status === "paused") && (
                        <Button variant="outline-danger" onClick={handleCancel} className="d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap">
                            <FiXCircle />
                            <span>Cancel</span>
                        </Button>
                    )}

                    <Button variant="outline-dark" onClick={() => setShowEditModal(true)} className="d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap">
                        <FiEdit />
                        <span>Edit</span>
                    </Button>

                    <Button variant="outline-primary" onClick={() => setShowAssignModal(true)} className="d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap">
                        <FiPlus />
                        <span>Add Leads</span>
                    </Button>

                    {campaign.auto_sync_enabled && (
                        <Button
                            variant="info"
                            className="text-white d-inline-flex align-items-center gap-2 py-2 px-3 text-nowrap"
                            onClick={handleSyncLeads}
                            disabled={syncingLeads}
                            title="Scan database and pull all matching imported leads into campaign"
                        >
                            {syncingLeads ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                            <span>Auto-Sync Leads</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Performance Stats Cards */}
            <Row className="row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-xl-7 g-3 mb-4">
                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Total Leads</small>
                            <h3 className="fw-bold text-dark mt-2 mb-0">{stats?.total_leads || 0}</h3>
                            <small className="text-muted text-nowrap">Target audience</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Sent Emails</small>
                            <h3 className="fw-bold text-success mt-2 mb-0">{stats?.sent ?? campaign?.sent_count ?? 0}</h3>
                            <small className="text-muted text-nowrap">Successfully delivered</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Open Rate</small>
                            <h3 className="fw-bold text-success mt-2 mb-0">{stats?.open_rate ?? campaign?.open_rate ?? 0}%</h3>
                            <small className="text-muted text-nowrap">{stats?.opened_count ?? campaign?.opened_count ?? 0} opened</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Click Rate</small>
                            <h3 className="fw-bold text-primary mt-2 mb-0">{stats?.click_rate ?? campaign?.click_rate ?? 0}%</h3>
                            <small className="text-muted text-nowrap">{stats?.clicked_count ?? campaign?.clicked_count ?? 0} clicked</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Unsubscribed</small>
                            <h3 className="fw-bold text-warning mt-2 mb-0">{stats?.unsubscribed || 0}</h3>
                            <small className="text-muted text-nowrap">{stats?.unsubscribe_rate || 0}% rate</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Pending Queue</small>
                            <h3 className="fw-bold text-info mt-2 mb-0">{(stats?.pending || 0) + (stats?.processing || 0)}</h3>
                            <small className="text-muted text-nowrap">Awaiting dispatch</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Bounced</small>
                            <h3 className="fw-bold text-danger mt-2 mb-0">{stats?.bounced || 0}</h3>
                            <small className="text-muted text-nowrap">Invalid/bounce</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                        <Card.Body className="p-3">
                            <small className="text-muted fw-semibold text-uppercase text-truncate d-block">Failed</small>
                            <h3 className="fw-bold text-danger mt-2 mb-0">{stats?.failed || 0}</h3>
                            <small className="text-muted text-nowrap">Send errors</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Progress Bar Card */}
            <Card className="border-0 shadow-sm mb-4 rounded-3">
                <Card.Body className="p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-dark">Campaign Progress</span>
                        <span className="fw-bold text-primary">{campaign?.status === "completed" ? 100 : (stats?.progress || 0)}% Completed</span>
                    </div>
                    <ProgressBar
                        now={campaign?.status === "completed" ? 100 : (stats?.progress || 0)}
                        variant={campaign?.status === "completed" ? "info" : "primary"}
                        style={{ height: "10px" }}
                        animated={campaign?.status === "running"}
                    />
                </Card.Body>
            </Card>

            {/* Per-Sender Breakdown Card */}
            {stats?.sender_stats && stats.sender_stats.length > 0 && (
                <Card className="border-0 shadow-sm mb-4 rounded-3">
                    <Card.Header className="bg-white border-0 p-3 p-md-4 pb-2">
                        <h5 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                            <FiUsers className="text-primary" />
                            <span>Sender Account Performance Breakdown</span>
                        </h5>
                        <small className="text-muted">Track emails sent, opens, clicks, unsubscribes, and bounces for each sender account assigned to this campaign.</small>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover align="middle" className="mb-0 text-nowrap">
                                <thead className="table-light">
                                    <tr>
                                        <th>Sender Account</th>
                                        <th>Provider</th>
                                        <th>Sent / Delivered</th>
                                        <th>Opened</th>
                                        <th>Clicked</th>
                                        <th>Unsubscribed</th>
                                        <th>Bounced</th>
                                        <th>Failed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.sender_stats.map((s) => (
                                        <tr key={s.sender_id}>
                                            <td>
                                                <div className="fw-bold text-dark">{s.display_name || s.name}</div>
                                                <small className="text-primary">{s.email}</small>
                                            </td>
                                            <td>
                                                <Badge bg="light" className="text-dark border text-uppercase px-2 py-1">
                                                    {s.provider || "SMTP"}
                                                </Badge>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-dark">{s.sent}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Badge bg="success" className="px-2 py-1">{s.opened}</Badge>
                                                    <small className="text-muted">({s.open_rate}%)</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Badge bg="primary" className="px-2 py-1">{s.clicked}</Badge>
                                                    <small className="text-muted">({s.click_rate}%)</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-semibold text-warning">{s.unsubscribed}</span>
                                            </td>
                                            <td>
                                                <span className="fw-semibold text-danger">{s.bounced}</span>
                                            </td>
                                            <td>
                                                <span className="fw-semibold text-secondary">{s.failed}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Leads Table Card */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white border-0 p-3 p-md-4 pb-2">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <h5 className="fw-bold m-0 text-dark">Campaign Audience & Execution Logs</h5>

                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <div className="position-relative" style={{ minWidth: "220px" }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search lead or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    className="ps-4"
                                />
                                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                            </div>

                            <Form.Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: "150px" }}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="sent">Sent</option>
                                <option value="unsubscribed">Unsubscribed</option>
                                <option value="bounced">Bounced</option>
                                <option value="failed">Failed</option>
                            </Form.Select>

                            {(statusFilter === "failed" || (stats?.failed || 0) > 0) && (
                                <div className="position-relative" style={{ minWidth: "240px" }}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Filter error text (e.g. JWT, auth)..."
                                        value={errorSearch}
                                        onChange={(e) => setErrorSearch(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        className="ps-4"
                                    />
                                    <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-danger" />
                                </div>
                            )}

                            {selectedLeadIds.length > 0 ? (
                                <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleRetryAllFailed(null, selectedLeadIds)}
                                    disabled={retryingAll}
                                    className="d-inline-flex align-items-center gap-1 text-nowrap py-2 px-3 fw-bold text-dark"
                                >
                                    {retryingAll ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                    <span>Retry Selected ({selectedLeadIds.length})</span>
                                </Button>
                            ) : errorSearch.trim() !== "" ? (
                                <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleRetryAllFailed(errorSearch)}
                                    disabled={retryingAll}
                                    className="d-inline-flex align-items-center gap-1 text-nowrap py-2 px-3 fw-bold text-dark"
                                    title={`Retry leads matching error: "${errorSearch}"`}
                                >
                                    {retryingAll ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                    <span>Retry Filtered Errors</span>
                                </Button>
                            ) : (stats?.failed || 0) > 0 && (
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={() => handleRetryAllFailed("auth")}
                                        disabled={retryingAll}
                                        className="d-inline-flex align-items-center gap-1 text-nowrap py-2 px-3 fw-bold text-dark"
                                        title="Retry leads that failed due to account re-authorization / token issues"
                                    >
                                        {retryingAll ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                        <span>Retry Auth Errors</span>
                                    </Button>

                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleRetryAllFailed(null)}
                                        disabled={retryingAll}
                                        className="d-inline-flex align-items-center gap-1 text-nowrap py-2 px-3"
                                        title="Retry all failed leads"
                                    >
                                        {retryingAll ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                        <span>Retry All Failed</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {leadsLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2">Loading campaign leads...</p>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            No campaign leads found matching criteria.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover align="middle" className="mb-0 text-nowrap" style={{ minWidth: "1050px" }}>
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: "40px" }} className="text-center">
                                            <Form.Check
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                                            />
                                        </th>
                                        <th style={{ width: "20%" }}>Business Lead</th>
                                        <th style={{ width: "20%" }}>Target Email</th>
                                        <th style={{ width: "16%" }}>Delivered From</th>
                                        <th style={{ width: "12%" }}>Status</th>
                                        <th style={{ width: "14%" }}>Sent / Processed At</th>
                                        <th style={{ width: "18%" }}>Error Details</th>
                                        <th className="text-end" style={{ width: "10%" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => {
                                        const errorMsg = lead.failure_reason || lead.error_message;
                                        const senderEmail = lead.sender?.email || lead.sender?.from_email || lead.sender?.name || lead.sender?.display_name || lead.sender?.sender_account?.username || "-";
                                        const processedTime = lead.sent_at
                                            ? new Date(lead.sent_at).toLocaleString()
                                            : lead.last_attempt_at
                                            ? new Date(lead.last_attempt_at).toLocaleString()
                                            : lead.updated_at
                                            ? new Date(lead.updated_at).toLocaleString()
                                            : "-";
                                        const isSelected = selectedLeadIds.includes(lead.id);
                                        return (
                                            <tr key={lead.id} className={isSelected ? "table-active" : ""}>
                                                <td className="text-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectLead(lead.id)}
                                                    />
                                                </td>
                                                <td className="fw-medium text-dark">
                                                    {lead.business?.business_name || "N/A"}
                                                </td>
                                                <td className="text-primary">{lead.business?.email || "N/A"}</td>
                                                <td className="small text-muted">{senderEmail}</td>
                                                <td>{getLeadStatusBadge(lead.status)}</td>
                                                <td className="small text-muted">{processedTime}</td>
                                                <td className="small text-danger" style={{ maxWidth: "250px" }}>
                                                    {errorMsg ? (
                                                        <span className="text-truncate d-block" title={errorMsg}>
                                                            {errorMsg}
                                                        </span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-1">
                                                    {(lead.sent_subject || lead.sent_body_html || lead.sent_at) && (
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={() => setSelectedSentLead(lead)}
                                                            className="d-inline-flex align-items-center gap-1"
                                                            title="View Sent Email Content"
                                                        >
                                                            <FiEye size={14} />
                                                            <span>View Email</span>
                                                        </Button>
                                                    )}

                                                    {lead.status === "failed" && (
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() => handleRetryLead(lead.id)}
                                                            disabled={retryingLeadId === lead.id}
                                                        >
                                                            {retryingLeadId === lead.id ? (
                                                                <Spinner size="sm" animation="border" />
                                                            ) : (
                                                                "Retry"
                                                            )}
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveLead(lead.id)}
                                                        title="Remove lead from campaign"
                                                        className="d-inline-flex align-items-center"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {!leadsLoading && leads.length > 0 && (
                <div className="mt-4">
                    <Pagination pagination={pagination} onPageChange={loadLeads} />
                </div>
            )}

            <AssignLeadsModal
                show={showAssignModal}
                onHide={() => setShowAssignModal(false)}
                campaignId={id}
                onAssigned={() => {
                    loadCampaignData();
                    loadLeads(1);
                }}
            />

            {/* View Sent Email Modal */}
            <Modal show={Boolean(selectedSentLead)} onHide={() => setSelectedSentLead(null)} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                        <FiEye className="text-primary" />
                        <span>Delivered Email Content</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedSentLead && (
                        <div>
                            <div className="mb-3 p-3 bg-light rounded-3 border">
                                <div className="row g-2 small">
                                    <div className="col-md-6">
                                        <strong>To Business:</strong> {selectedSentLead.business?.business_name || "N/A"}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Recipient Email:</strong> <span className="text-primary">{selectedSentLead.business?.email || "N/A"}</span>
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Status:</strong> {getLeadStatusBadge(selectedSentLead.status)}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Sent At:</strong> {selectedSentLead.sent_at ? new Date(selectedSentLead.sent_at).toLocaleString() : "N/A"}
                                    </div>
                                    <div className="col-12 mt-2 pt-2 border-top">
                                        <strong>Email Title / Subject:</strong>
                                        <div className="fw-semibold text-primary mt-1 fs-6">
                                            {selectedSentLead.sent_subject || "Initial Campaign Outreach"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <label className="fw-bold mb-2 small text-muted text-uppercase">Rendered Email Body (HTML)</label>
                            <div
                                className="p-3 border rounded-3 bg-white shadow-sm"
                                style={{ maxHeight: "450px", overflowY: "auto" }}
                                dangerouslySetInnerHTML={{
                                    __html: selectedSentLead.sent_body_html || `<div class="p-4 text-muted text-center">No HTML body preview cached for this dispatch.</div>`
                                }}
                            />
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setSelectedSentLead(null)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Campaign Modal */}
            {showEditModal && (
                <CreateCampaignModal
                    show={showEditModal}
                    onHide={() => setShowEditModal(false)}
                    campaign={campaign}
                    onSaved={() => {
                        setShowEditModal(false);
                        loadCampaignData();
                        loadLeads(1);
                        toast.success("Campaign updated successfully!");
                    }}
                />
            )}
        </DashboardLayout>
    );
}
