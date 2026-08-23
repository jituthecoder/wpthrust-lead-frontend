import { useEffect, useState } from "react";
import {
    Row,
    Col,
    Card,
    Button,
    Form,
    Badge,
    Spinner,
    Table,
    Modal,
    Nav,
} from "react-bootstrap";
import {
    FiActivity,
    FiCheckCircle,
    FiAlertTriangle,
    FiXCircle,
    FiRefreshCw,
    FiSearch,
    FiExternalLink,
    FiImage,
    FiEye,
    FiZap,
    FiSmartphone,
    FiMonitor,
} from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import {
    getPsiStats,
    getPsiReports,
    retryPsiAudit,
    retryPsiBatch,
} from "../../api/psiReport";

export default function PsiReport() {
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const [reportsLoading, setReportsLoading] = useState(true);
    const [audits, setAudits] = useState([]);
    const [pagination, setPagination] = useState({});

    // Filters
    const [availability, setAvailability] = useState("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("latest");

    // Selection
    const [selectedBusinessIds, setSelectedBusinessIds] = useState([]);

    // Action state
    const [retrying, setRetrying] = useState(false);
    const [retryingBatch, setRetryingBatch] = useState(false);

    // Detail Modal
    const [selectedAudit, setSelectedAudit] = useState(null);

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            const res = await getPsiStats();
            if (res.data?.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error("Error loading PSI stats:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    const loadAudits = async (page = 1) => {
        try {
            setReportsLoading(true);
            const res = await getPsiReports({
                availability,
                search,
                sort_by: sortBy,
                page,
                per_page: 20,
            });
            if (res.data?.success) {
                setAudits(res.data.data?.data || []);
                setPagination(res.data.data || {});
            }
        } catch (error) {
            toast.error("Failed to load PSI report data");
        } finally {
            setReportsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        loadAudits(1);
        setSelectedBusinessIds([]);
    }, [availability, search, sortBy]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const ids = audits.map((a) => a.business_id).filter(Boolean);
            setSelectedBusinessIds(ids);
        } else {
            setSelectedBusinessIds([]);
        }
    };

    const handleSelectBusiness = (businessId) => {
        if (!businessId) return;
        setSelectedBusinessIds((prev) =>
            prev.includes(businessId)
                ? prev.filter((id) => id !== businessId)
                : [...prev, businessId]
        );
    };

    const handleRetrySelected = async () => {
        if (selectedBusinessIds.length === 0) return;
        try {
            setRetrying(true);
            const res = await retryPsiAudit(selectedBusinessIds);
            toast.success(res.data.message || "Queued PSI retry for selected websites!");
            setSelectedBusinessIds([]);
            loadAudits(pagination.current_page || 1);
            loadStats();
        } catch (error) {
            toast.error("Failed to retry selected websites");
        } finally {
            setRetrying(false);
        }
    };

    const handleRetrySingle = async (businessId) => {
        try {
            setRetrying(true);
            const res = await retryPsiAudit([businessId]);
            toast.success(res.data.message || "Queued PSI retry!");
            loadAudits(pagination.current_page || 1);
            loadStats();
        } catch (error) {
            toast.error("Failed to queue PSI retry");
        } finally {
            setRetrying(false);
        }
    };

    const handleRetryBatchCondition = async (condition) => {
        if (
            !window.confirm(
                `Are you sure you want to queue batch PSI retries for condition '${condition}'?`
            )
        ) {
            return;
        }
        try {
            setRetryingBatch(true);
            const res = await retryPsiBatch(condition);
            toast.success(res.data.message || "Batch retry queued successfully!");
            loadAudits(1);
            loadStats();
        } catch (error) {
            toast.error("Failed to trigger batch retry");
        } finally {
            setRetryingBatch(false);
        }
    };

    const renderScoreBadge = (score) => {
        if (score === null || score === undefined) {
            return <Badge bg="secondary" className="px-2 py-1">N/A</Badge>;
        }
        const numScore = Number(score);
        let variant = "danger";
        if (numScore >= 90) variant = "success";
        else if (numScore >= 50) variant = "warning";

        return (
            <Badge bg={variant} className="px-2 py-1 fs-6 font-monospace">
                {numScore} / 100
            </Badge>
        );
    };

    const renderScreenshotBadge = (audit) => {
        if (audit.mobile_screenshot_url || audit.mobile_screenshot_path) {
            return (
                <Badge bg="success" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                    <FiImage /> Available
                </Badge>
            );
        }
        return (
            <Badge bg="danger" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                <FiXCircle /> Missing
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="container-fluid p-0">
                {/* Header Title Bar */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 bg-white p-4 rounded-3 border shadow-sm">
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h4 className="fw-bold m-0 text-dark">PageSpeed Insights (PSI) Audit Report</h4>
                            <Badge bg="primary" className="px-2 py-1">Audit Hub</Badge>
                        </div>
                        <p className="text-muted m-0 small mt-1">
                            Monitor PageSpeed scores and mobile screenshots availability across all lead websites
                        </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                loadStats();
                                loadAudits(1);
                            }}
                            className="d-inline-flex align-items-center gap-1"
                        >
                            <FiRefreshCw /> Refresh
                        </Button>

                        {(stats?.score_only || 0) > 0 && (
                            <Button
                                variant="warning"
                                onClick={() => handleRetryBatchCondition("score_only")}
                                disabled={retryingBatch}
                                className="d-inline-flex align-items-center gap-1 text-dark fw-bold"
                                title="Retry all websites that have scores but are missing mobile screenshots"
                            >
                                {retryingBatch ? <Spinner size="sm" animation="border" /> : <FiZap />}
                                <span>Fetch Missing Screenshots ({stats.score_only})</span>
                            </Button>
                        )}

                        {(stats?.missing_both || 0) > 0 && (
                            <Button
                                variant="danger"
                                onClick={() => handleRetryBatchCondition("missing_both")}
                                disabled={retryingBatch}
                                className="d-inline-flex align-items-center gap-1 fw-bold"
                                title="Retry all websites missing both score and screenshot"
                            >
                                {retryingBatch ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                <span>Retry Failed Audits ({stats.missing_both})</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Executive KPI Stats Cards */}
                <Row className="g-3 mb-4">
                    <Col xs={6} md={3} xl>
                        <Card className="border-0 shadow-sm h-100 bg-white rounded-3">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center text-muted small fw-semibold text-uppercase">
                                    <span>Total Websites</span>
                                    <FiActivity size={18} className="text-primary" />
                                </div>
                                <h3 className="fw-bold text-dark mt-2 mb-0">
                                    {statsLoading ? <Spinner size="sm" animation="border" /> : stats?.total_businesses || 0}
                                </h3>
                                <small className="text-muted">In Lead Database</small>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xs={6} md={3} xl>
                        <Card className="border-0 shadow-sm h-100 bg-white rounded-3 border-start border-success border-4">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center text-success small fw-semibold text-uppercase">
                                    <span>Score & Screenshot</span>
                                    <FiCheckCircle size={18} />
                                </div>
                                <h3 className="fw-bold text-success mt-2 mb-0">
                                    {statsLoading ? <Spinner size="sm" animation="border" /> : stats?.both_available || 0}
                                </h3>
                                <small className="text-muted">100% Complete</small>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xs={6} md={3} xl>
                        <Card className="border-0 shadow-sm h-100 bg-white rounded-3 border-start border-warning border-4">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center text-warning small fw-semibold text-uppercase">
                                    <span>Score Only</span>
                                    <FiAlertTriangle size={18} />
                                </div>
                                <h3 className="fw-bold text-warning mt-2 mb-0">
                                    {statsLoading ? <Spinner size="sm" animation="border" /> : stats?.score_only || 0}
                                </h3>
                                <small className="text-muted">Missing Screenshot</small>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xs={6} md={3} xl>
                        <Card className="border-0 shadow-sm h-100 bg-white rounded-3 border-start border-danger border-4">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center text-danger small fw-semibold text-uppercase">
                                    <span>Missing Both</span>
                                    <FiXCircle size={18} />
                                </div>
                                <h3 className="fw-bold text-danger mt-2 mb-0">
                                    {statsLoading ? <Spinner size="sm" animation="border" /> : stats?.missing_both || 0}
                                </h3>
                                <small className="text-muted">Failed / Not Audited</small>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xs={12} md={6} xl="3">
                        <Card className="border-0 shadow-sm h-100 bg-light rounded-3">
                            <Card.Body className="p-3 d-flex justify-content-around align-items-center">
                                <div className="text-center">
                                    <small className="text-muted d-block fw-semibold"><FiSmartphone /> Mobile Avg</small>
                                    <span className="fs-4 fw-bold text-primary">{stats?.avg_mobile_pagespeed || 0}</span>
                                </div>
                                <div className="vr"></div>
                                <div className="text-center">
                                    <small className="text-muted d-block fw-semibold"><FiMonitor /> Desktop Avg</small>
                                    <span className="fs-4 fw-bold text-info">{stats?.avg_desktop_pagespeed || 0}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Main Data Table Section */}
                <Card className="border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white p-3 p-md-4 pb-0 border-0">
                        {/* Availability Navigation Tabs */}
                        <Nav
                            variant="tabs"
                            activeKey={availability}
                            onSelect={(k) => setAvailability(k)}
                            className="border-bottom-0 mb-3"
                        >
                            <Nav.Item>
                                <Nav.Link eventKey="all" className="fw-semibold">
                                    All Websites ({stats?.total_audits || 0})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="both" className="fw-semibold text-success">
                                    Both Available ({stats?.both_available || 0})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="score_only" className="fw-semibold text-warning">
                                    Score Only ({stats?.score_only || 0})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="missing_both" className="fw-semibold text-danger">
                                    Missing Both / Failed ({stats?.missing_both || 0})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="failed" className="fw-semibold text-dark">
                                    Audit Errors ({stats?.failed_count || 0})
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        {/* Search & Action Controls */}
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3">
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <div className="position-relative" style={{ minWidth: "260px" }}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search website domain or business name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        className="ps-4"
                                    />
                                    <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                                </div>

                                <Form.Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{ width: "180px" }}
                                >
                                    <option value="latest">Latest Audited</option>
                                    <option value="score_asc">Lowest Score First</option>
                                    <option value="score_desc">Highest Score First</option>
                                    <option value="oldest">Oldest Audited</option>
                                </Form.Select>
                            </div>

                            {selectedBusinessIds.length > 0 && (
                                <Button
                                    variant="warning"
                                    onClick={handleRetrySelected}
                                    disabled={retrying}
                                    className="d-inline-flex align-items-center gap-2 fw-bold text-dark"
                                >
                                    {retrying ? <Spinner size="sm" animation="border" /> : <FiRefreshCw />}
                                    <span>Retry Selected Websites ({selectedBusinessIds.length})</span>
                                </Button>
                            )}
                        </div>
                    </Card.Header>

                    <Card.Body className="p-0">
                        {reportsLoading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="text-muted mt-2">Loading PSI audit reports...</p>
                            </div>
                        ) : audits.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                No websites found matching availability filter condition.
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
                                                    checked={
                                                        audits.length > 0 &&
                                                        selectedBusinessIds.length === audits.length
                                                    }
                                                />
                                            </th>
                                            <th style={{ width: "25%" }}>Business & Domain</th>
                                            <th style={{ width: "12%" }}>Mobile Score</th>
                                            <th style={{ width: "12%" }}>Desktop Score</th>
                                            <th style={{ width: "15%" }}>Mobile Screenshot</th>
                                            <th style={{ width: "14%" }}>Audit Status</th>
                                            <th style={{ width: "12%" }}>Last Audited</th>
                                            <th className="text-end" style={{ width: "10%" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audits.map((audit) => {
                                            const biz = audit.business;
                                            const isSelected = selectedBusinessIds.includes(biz?.id);
                                            return (
                                                <tr key={audit.id} className={isSelected ? "table-active" : ""}>
                                                    <td className="text-center">
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectBusiness(biz?.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold text-dark">
                                                            {biz?.business_name || "N/A"}
                                                        </div>
                                                        <a
                                                            href={biz?.website || `https://${biz?.domain}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="small text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                                                        >
                                                            <span>{biz?.domain || biz?.website || "—"}</span>
                                                            <FiExternalLink size={12} />
                                                        </a>
                                                    </td>
                                                    <td>{renderScoreBadge(audit.mobile_pagespeed)}</td>
                                                    <td>{renderScoreBadge(audit.desktop_pagespeed)}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {renderScreenshotBadge(audit)}
                                                            {audit.mobile_screenshot_url && (
                                                                <Button
                                                                    variant="light"
                                                                    size="sm"
                                                                    className="p-1 border"
                                                                    onClick={() => setSelectedAudit(audit)}
                                                                    title="Preview Mobile Screenshot"
                                                                >
                                                                    <FiEye size={14} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {audit.psi_status === "failed" ? (
                                                            <div>
                                                                <Badge bg="danger" className="px-2 py-1">Failed</Badge>
                                                                {audit.psi_error_reason && (
                                                                    <small
                                                                        className="text-danger d-block mt-1 text-truncate"
                                                                        style={{ maxWidth: "160px" }}
                                                                        title={audit.psi_error_reason}
                                                                    >
                                                                        {audit.psi_error_reason}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        ) : audit.psi_status === "processing" ? (
                                                            <Badge bg="warning" className="px-2 py-1">
                                                                <Spinner size="sm" animation="border" className="me-1" /> Processing
                                                            </Badge>
                                                        ) : (audit.mobile_pagespeed !== null || audit.mobile_screenshot_path) ? (
                                                            <Badge bg="success" className="px-2 py-1">Completed</Badge>
                                                        ) : (
                                                            <Badge bg="secondary" className="px-2 py-1">Pending</Badge>
                                                        )}
                                                    </td>
                                                    <td className="small text-muted">
                                                        {audit.psi_fetched_at
                                                            ? new Date(audit.psi_fetched_at).toLocaleDateString()
                                                            : audit.updated_at
                                                            ? new Date(audit.updated_at).toLocaleDateString()
                                                            : "—"}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-1">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => setSelectedAudit(audit)}
                                                                title="View Full PSI Details"
                                                            >
                                                                <FiEye size={14} />
                                                            </Button>

                                                            <Button
                                                                variant="outline-warning"
                                                                size="sm"
                                                                onClick={() => handleRetrySingle(biz?.id)}
                                                                disabled={retrying}
                                                                title="Retry PSI Audit for this website"
                                                            >
                                                                <FiRefreshCw size={14} />
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

                {!reportsLoading && audits.length > 0 && (
                    <div className="mt-4">
                        <Pagination pagination={pagination} onPageChange={loadAudits} />
                    </div>
                )}

                {/* Audit Detail / Screenshot Modal */}
                <Modal show={Boolean(selectedAudit)} onHide={() => setSelectedAudit(null)} size="lg" centered>
                    <Modal.Header closeButton className="bg-light">
                        <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                            <FiActivity className="text-primary" />
                            <span>Website PSI Audit Details: {selectedAudit?.business?.business_name}</span>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {selectedAudit && (
                            <Row className="g-4">
                                <Col md={6}>
                                    <div className="bg-light p-3 rounded border mb-3">
                                        <h6 className="fw-bold mb-2">Website Information</h6>
                                        <p className="mb-1"><strong>Domain:</strong> {selectedAudit.business?.domain}</p>
                                        <p className="mb-1"><strong>URL:</strong> {selectedAudit.business?.website}</p>
                                        <p className="mb-0"><strong>Status:</strong> {selectedAudit.psi_status || "Completed"}</p>
                                    </div>

                                    <div className="bg-white p-3 rounded border mb-3">
                                        <h6 className="fw-bold mb-3 text-primary">PageSpeed Scores</h6>
                                        <div className="d-flex justify-content-around text-center">
                                            <div>
                                                <small className="text-muted d-block fw-bold mb-1">Mobile Score</small>
                                                {renderScoreBadge(selectedAudit.mobile_pagespeed)}
                                            </div>
                                            <div className="vr"></div>
                                            <div>
                                                <small className="text-muted d-block fw-bold mb-1">Desktop Score</small>
                                                {renderScoreBadge(selectedAudit.desktop_pagespeed)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-light p-3 rounded border">
                                        <h6 className="fw-bold mb-2">Core Web Vitals Metrics</h6>
                                        <ul className="list-unstyled mb-0 small">
                                            <li className="d-flex justify-content-between py-1 border-bottom">
                                                <span>FCP (First Contentful Paint):</span>
                                                <strong>{selectedAudit.mobile_fcp || "N/A"}</strong>
                                            </li>
                                            <li className="d-flex justify-content-between py-1 border-bottom">
                                                <span>LCP (Largest Contentful Paint):</span>
                                                <strong>{selectedAudit.mobile_lcp || "N/A"}</strong>
                                            </li>
                                            <li className="d-flex justify-content-between py-1 border-bottom">
                                                <span>TBT (Total Blocking Time):</span>
                                                <strong>{selectedAudit.mobile_tbt || "N/A"}</strong>
                                            </li>
                                            <li className="d-flex justify-content-between py-1">
                                                <span>CLS (Layout Shift):</span>
                                                <strong>{selectedAudit.mobile_cls || "N/A"}</strong>
                                            </li>
                                        </ul>
                                    </div>
                                </Col>

                                <Col md={6}>
                                    <h6 className="fw-bold mb-2">Mobile Website Screenshot Preview</h6>
                                    {selectedAudit.mobile_screenshot_url ? (
                                        <div className="border rounded p-2 text-center bg-dark shadow-sm">
                                            <img
                                                src={selectedAudit.mobile_screenshot_url}
                                                alt="Mobile Website Screenshot"
                                                className="img-fluid rounded"
                                                style={{ maxHeight: "380px", objectFit: "contain" }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="border rounded p-5 text-center text-muted bg-light">
                                            <FiImage size={48} className="mb-2 text-secondary" />
                                            <h6>No Mobile Screenshot Available</h6>
                                            <p className="small mb-3">Click retry below to capture a screenshot using PageSpeed Insights API.</p>
                                            <Button
                                                variant="warning"
                                                size="sm"
                                                onClick={() => {
                                                    handleRetrySingle(selectedAudit.business_id);
                                                    setSelectedAudit(null);
                                                }}
                                                className="fw-bold text-dark"
                                            >
                                                <FiRefreshCw className="me-1" /> Fetch Screenshot
                                            </Button>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setSelectedAudit(null)}>
                            Close
                        </Button>
                        {selectedAudit && (
                            <Button
                                variant="warning"
                                onClick={() => {
                                    handleRetrySingle(selectedAudit.business_id);
                                    setSelectedAudit(null);
                                }}
                                className="fw-bold text-dark"
                            >
                                <FiRefreshCw className="me-1" /> Queue Audit Retry
                            </Button>
                        )}
                    </Modal.Footer>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
