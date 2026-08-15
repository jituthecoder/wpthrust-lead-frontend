import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table, ProgressBar, Modal } from "react-bootstrap";
import { FiArrowLeft, FiPlay, FiPause, FiRefreshCw, FiPlus, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiSearch, FiEye, FiEdit } from "react-icons/fi";
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
    const [search, setSearch] = useState("");

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [retryingLeadId, setRetryingLeadId] = useState(null);
    const [retryingAll, setRetryingAll] = useState(false);

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
    }, [id, statusFilter, search]);

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

    const handleRetryAllFailed = async () => {
        try {
            setRetryingAll(true);
            const res = await retryAllFailedCampaignLeads(id);
            toast.success(res.data.message || "Failed leads queued for retry");
            loadLeads(1);
            loadCampaignData();
        } catch (error) {
            toast.error("Failed to retry all failed leads");
        } finally {
            setRetryingAll(false);
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
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                    <Button
                        variant="light"
                        className="rounded-circle p-2 border"
                        onClick={() => navigate("/email-campaigns")}
                    >
                        <FiArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h3 className="fw-bold m-0 text-dark">{campaign.name}</h3>
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
                                className="text-uppercase"
                            >
                                {campaign.status}
                            </Badge>
                        </div>
                        {campaign.description && (
                            <p className="text-muted m-0 small">{campaign.description}</p>
                        )}
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={loadCampaignData}
                        title="Refresh Stats"
                    >
                        <FiRefreshCw />
                    </Button>

                    {(campaign.status === "draft" || campaign.status === "scheduled") && (
                        <Button variant="success" onClick={handleStart} className="d-flex align-items-center gap-2">
                            <FiPlay />
                            <span>Start Campaign</span>
                        </Button>
                    )}

                    {campaign.status === "running" && (
                        <Button variant="warning" onClick={handlePause} className="d-flex align-items-center gap-2">
                            <FiPause />
                            <span>Pause Campaign</span>
                        </Button>
                    )}

                    {campaign.status === "paused" && (
                        <Button variant="primary" onClick={handleResume} className="d-flex align-items-center gap-2">
                            <FiPlay />
                            <span>Resume Campaign</span>
                        </Button>
                    )}

                    {(campaign.status === "running" || campaign.status === "paused") && (
                        <Button variant="outline-danger" onClick={handleCancel} className="d-flex align-items-center gap-2">
                            <FiXCircle />
                            <span>Cancel Campaign</span>
                        </Button>
                    )}

                    <Button variant="outline-dark" onClick={() => setShowEditModal(true)} className="d-flex align-items-center gap-2">
                        <FiEdit />
                        <span>Edit Campaign</span>
                    </Button>

                    <Button variant="outline-primary" onClick={() => setShowAssignModal(true)} className="d-flex align-items-center gap-2">
                        <FiPlus />
                        <span>Add Leads</span>
                    </Button>
                </div>
            </div>

            {/* Performance Stats Cards */}
            <Row className="g-3 mb-4">
                <Col sm={6} lg={2}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body>
                            <small className="text-muted fw-semibold text-uppercase">Total Leads</small>
                            <h2 className="fw-bold text-dark mt-1 mb-0">{stats?.total_leads || 0}</h2>
                            <small className="text-muted">Target audience</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col sm={6} lg={2}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body>
                            <small className="text-muted fw-semibold text-uppercase">Sent Emails</small>
                            <h2 className="fw-bold text-success mt-1 mb-0">{stats?.sent ?? campaign?.sent_count ?? 0}</h2>
                            <small className="text-muted">Successfully delivered</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col sm={6} lg={2}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body>
                            <small className="text-muted fw-semibold text-uppercase">Open Rate</small>
                            <h2 className="fw-bold text-success mt-1 mb-0">{stats?.open_rate ?? campaign?.open_rate ?? 0}%</h2>
                            <small className="text-muted">{stats?.opened_count ?? campaign?.opened_count ?? 0} emails opened</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col sm={6} lg={2}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body>
                            <small className="text-muted fw-semibold text-uppercase">Click Rate</small>
                            <h2 className="fw-bold text-primary mt-1 mb-0">{stats?.click_rate ?? campaign?.click_rate ?? 0}%</h2>
                            <small className="text-muted">{stats?.clicked_count ?? campaign?.clicked_count ?? 0} links clicked</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col sm={6} lg={2}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body>
                            <small className="text-muted fw-semibold text-uppercase">Pending Queue</small>
                            <h2 className="fw-bold text-primary mt-1 mb-0">{(stats?.pending || 0) + (stats?.processing || 0)}</h2>
                            <small className="text-muted">Awaiting dispatch</small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col sm={6} lg={2}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body>
                            <small className="text-muted fw-semibold text-uppercase">Failed Deliveries</small>
                            <h2 className="fw-bold text-danger mt-1 mb-0">{stats?.failed || 0}</h2>
                            <small className="text-muted">Bounced or error</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Progress Bar Card */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
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

            {/* Leads Table Card */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-3 pb-2">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <h5 className="fw-bold m-0 text-dark">Campaign Audience & Execution Logs</h5>

                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <div className="position-relative" style={{ minWidth: "220px" }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search lead or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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
                                <option value="failed">Failed</option>
                            </Form.Select>

                            {(stats?.failed || 0) > 0 && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleRetryAllFailed}
                                    disabled={retryingAll}
                                    className="d-flex align-items-center gap-1"
                                >
                                    {retryingAll ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                    <span>Retry All Failed</span>
                                </Button>
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
                            <Table hover align="middle" className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Business Lead</th>
                                        <th>Target Email</th>
                                        <th>Status</th>
                                        <th>Sent / Processed At</th>
                                        <th>Error Details</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => {
                                        const errorMsg = lead.failure_reason || lead.error_message;
                                        return (
                                            <tr key={lead.id}>
                                                <td className="fw-medium text-dark">
                                                    {lead.business?.business_name || "N/A"}
                                                </td>
                                                <td className="text-primary">{lead.business?.email || "N/A"}</td>
                                                <td>{getLeadStatusBadge(lead.status)}</td>
                                                <td className="small text-muted">
                                                    {lead.sent_at ? new Date(lead.sent_at).toLocaleString() : "-"}
                                                </td>
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
