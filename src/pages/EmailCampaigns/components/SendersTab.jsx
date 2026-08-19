import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table, ProgressBar } from "react-bootstrap";
import { FiPlus, FiSearch, FiCheckCircle, FiSend, FiEdit3, FiTrash2, FiActivity, FiList, FiGrid } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import toast from "react-hot-toast";
import { getEmailSenders, deleteEmailSender, testSenderConnection } from "../../../api/emailSenders";
import axiosClient from "../../../api/axios";
import SenderModal from "./SenderModal";
import SendTestEmailModal from "./SendTestEmailModal";
import Pagination from "../../../components/ui/Pagination";

export default function SendersTab() {
    const [loading, setLoading] = useState(true);
    const [senders, setSenders] = useState([]);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState("");
    const [providerFilter, setProviderFilter] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

    const [showSenderModal, setShowSenderModal] = useState(false);
    const [selectedSender, setSelectedSender] = useState(null);
    const [initialProvider, setInitialProvider] = useState("smtp");

    const [showTestModal, setShowTestModal] = useState(false);
    const [testingSenderId, setTestingSenderId] = useState(null);

    const loadSenders = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                search,
                provider: providerFilter,
            };
            const res = await getEmailSenders(params);
            if (res.data?.success) {
                setSenders(res.data.data.data || []);
                setPagination({
                    current_page: res.data.data.current_page,
                    last_page: res.data.data.last_page,
                    total: res.data.data.total,
                    per_page: res.data.data.per_page,
                });
            }
        } catch (error) {
            toast.error("Failed to load email senders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSenders(1);
    }, [search, providerFilter]);

    const handleGoogleOAuthRedirect = async () => {
        try {
            const res = await axiosClient.get("/oauth/google/redirect?mode=json");
            if (res.data?.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error("Failed to fetch Google authentication URL.");
            }
        } catch (error) {
            const msg = error.response?.data?.message || "GOOGLE_CLIENT_ID is not configured in .env file.";
            toast.error(msg);
        }
    };

    const handleMicrosoftOAuthRedirect = async () => {
        try {
            const res = await axiosClient.get("/oauth/microsoft/redirect?mode=json");
            if (res.data?.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error("Failed to fetch Microsoft authentication URL.");
            }
        } catch (error) {
            const msg = error.response?.data?.message || "MICROSOFT_CLIENT_ID is not configured in .env file.";
            toast.error(msg);
        }
    };

    const handleAddSender = (prov = "smtp") => {
        if (prov === "gmail") {
            handleGoogleOAuthRedirect();
            return;
        }
        if (prov === "outlook" || prov === "microsoft") {
            handleMicrosoftOAuthRedirect();
            return;
        }
        setSelectedSender(null);
        setInitialProvider(typeof prov === "string" ? prov : "smtp");
        setShowSenderModal(true);
    };

    const handleEditSender = (sender) => {
        setSelectedSender(sender);
        setShowSenderModal(true);
    };

    const handleDeleteSender = async (id) => {
        if (!window.confirm("Are you sure you want to delete this email sender?")) return;

        try {
            await deleteEmailSender(id);
            toast.success("Email sender deleted successfully!");
            loadSenders(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to delete email sender");
        }
    };

    const handleTestConnection = async (sender) => {
        try {
            setTestingSenderId(sender.id);
            const res = await testSenderConnection(sender.id);
            if (res.data?.success) {
                toast.success(`[${sender.name}] Connection test successful!`);
            } else {
                toast.error(res.data?.message || `[${sender.name}] Connection test failed`);
            }
        } catch (error) {
            toast.error(`[${sender.name}] Connection test failed`);
        } finally {
            setTestingSenderId(null);
        }
    };

    const handleOpenTestEmail = (sender) => {
        setSelectedSender(sender);
        setShowTestModal(true);
    };

    const renderProviderBadge = (provider) => {
        const prov = (provider || "smtp").toLowerCase();
        if (prov === "gmail") {
            return (
                <Badge bg="light" className="text-dark border d-inline-flex align-items-center gap-1 px-2 py-1 fw-semibold">
                    <FcGoogle size={14} /> Gmail
                </Badge>
            );
        }
        if (prov === "outlook" || prov === "microsoft") {
            return (
                <Badge bg="primary" className="text-uppercase d-inline-flex align-items-center gap-1 px-2 py-1 fw-semibold">
                    <BsMicrosoft size={12} /> Outlook
                </Badge>
            );
        }
        return (
            <Badge bg="dark" className="text-uppercase px-2 py-1 fw-semibold">
                SMTP
            </Badge>
        );
    };

    return (
        <div>
            {/* Quick Provider Connect Hero Banner */}
            <Card className="border-0 shadow-sm mb-4 bg-light">
                <Card.Body className="p-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                        <div>
                            <h5 className="fw-bold mb-1 text-dark">Email Senders & Accounts</h5>
                            <p className="text-muted small mb-0">
                                Connect Gmail, Outlook / Microsoft 365, or Custom SMTP accounts to distribute cold email campaigns seamlessly.
                            </p>
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <Button
                            variant="light"
                            className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                            onClick={() => handleAddSender("gmail")}
                        >
                            <FcGoogle size={18} />
                            <span>Sign in with Google</span>
                        </Button>

                        <Button
                            variant="light"
                            className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                            onClick={() => handleAddSender("outlook")}
                        >
                            <BsMicrosoft size={16} className="text-primary" />
                            <span>Sign in with Microsoft</span>
                        </Button>

                        <Button
                            variant="light"
                            className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                            onClick={() => handleAddSender("smtp")}
                        >
                            <FiPlus size={16} />
                            <span>Connect SMTP/IMAP</span>
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Action Bar & Controls */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <div className="position-relative" style={{ minWidth: "260px" }}>
                        <Form.Control
                            type="text"
                            placeholder="Search senders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-4"
                        />
                        <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                    </div>

                    <Form.Select
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        style={{ width: "160px" }}
                    >
                        <option value="">All Providers</option>
                        <option value="smtp">SMTP</option>
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook</option>
                    </Form.Select>
                </div>

                {/* View Mode Toggle (Table vs Cards Grid) */}
                <div className="d-flex align-items-center gap-1 bg-white p-1 border rounded shadow-sm">
                    <Button
                        variant={viewMode === "table" ? "primary" : "light"}
                        size="sm"
                        className="d-flex align-items-center gap-1 px-3 py-1 fw-medium"
                        onClick={() => setViewMode("table")}
                    >
                        <FiList size={16} />
                        <span>Table View</span>
                    </Button>
                    <Button
                        variant={viewMode === "grid" ? "primary" : "light"}
                        size="sm"
                        className="d-flex align-items-center gap-1 px-3 py-1 fw-medium"
                        onClick={() => setViewMode("grid")}
                    >
                        <FiGrid size={16} />
                        <span>Grid View</span>
                    </Button>
                </div>
            </div>

            {/* Content Area: Table View vs Grid View */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading email senders...</p>
                </div>
            ) : senders.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <h5 className="fw-bold text-muted mb-2">No Email Senders Configured</h5>
                        <p className="text-muted mb-3">Add your SMTP or OAuth email accounts to start launching cold email campaigns.</p>
                        <Button variant="outline-primary" onClick={() => handleAddSender("smtp")}>
                            <FiPlus className="me-1" /> Add Your First Sender
                        </Button>
                    </Card.Body>
                </Card>
            ) : viewMode === "table" ? (
                /* Sleek Table View for Hundreds of Senders */
                <Card className="border-0 shadow-sm overflow-hidden">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ minWidth: "220px" }}>Account & Sender Details</th>
                                <th>Email Address</th>
                                <th>Provider</th>
                                <th style={{ minWidth: "160px" }}>Daily Limit</th>
                                <th style={{ minWidth: "150px" }}>Hourly Limit</th>
                                <th className="text-end" style={{ minWidth: "220px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {senders.map((sender) => {
                                const dailyPct = Math.min(100, Math.round(((sender.sent_today || 0) / (sender.daily_limit || 100)) * 100));
                                const hourlyPct = Math.min(100, Math.round(((sender.sent_this_hour || 0) / (sender.hourly_limit || 20)) * 100));

                                return (
                                    <tr key={sender.id}>
                                        <td>
                                            <div className="fw-bold text-dark">{sender.name}</div>
                                            <small className="text-muted">{sender.display_name || "—"}</small>
                                        </td>
                                        <td>
                                            <span className="fw-medium text-primary">{sender.email}</span>
                                        </td>
                                        <td>{renderProviderBadge(sender.provider)}</td>
                                        <td>
                                            <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                                                <span>{sender.sent_today || 0} / {sender.daily_limit}</span>
                                                <span>{dailyPct}%</span>
                                            </div>
                                            <ProgressBar
                                                now={dailyPct}
                                                variant={dailyPct > 80 ? "warning" : "primary"}
                                                style={{ height: "5px" }}
                                            />
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                                                <span>{sender.sent_this_hour || 0} / {sender.hourly_limit}</span>
                                                <span>{hourlyPct}%</span>
                                            </div>
                                            <ProgressBar
                                                now={hourlyPct}
                                                variant={hourlyPct > 80 ? "warning" : "info"}
                                                style={{ height: "5px" }}
                                            />
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex gap-1 justify-content-end align-items-center">
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    onClick={() => handleTestConnection(sender)}
                                                    disabled={testingSenderId === sender.id}
                                                    title="Test Connection"
                                                    className="d-flex align-items-center gap-1"
                                                >
                                                    {testingSenderId === sender.id ? (
                                                        <Spinner size="sm" animation="border" />
                                                    ) : (
                                                        <FiCheckCircle />
                                                    )}
                                                    <span className="d-none d-xl-inline">Test</span>
                                                </Button>

                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleOpenTestEmail(sender)}
                                                    title="Send Test Email"
                                                    className="d-flex align-items-center gap-1"
                                                >
                                                    <FiSend />
                                                    <span className="d-none d-xl-inline">Send Mail</span>
                                                </Button>

                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    onClick={() => handleEditSender(sender)}
                                                    title="Edit Sender"
                                                    className="border"
                                                >
                                                    <FiEdit3 />
                                                </Button>

                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    className="text-danger border"
                                                    onClick={() => handleDeleteSender(sender.id)}
                                                    title="Delete Sender"
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
                </Card>
            ) : (
                /* Cards / Grid View */
                <Row className="g-3">
                    {senders.map((sender) => (
                        <Col key={sender.id} lg={6} xl={4}>
                            <Card className="border-0 shadow-sm h-100 position-relative">
                                <Card.Body className="d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h5 className="fw-bold mb-0 text-dark">{sender.name}</h5>
                                                <small className="text-muted">{sender.display_name}</small>
                                            </div>
                                            {renderProviderBadge(sender.provider)}
                                        </div>

                                        <p className="text-primary fw-medium mb-3 small">{sender.email}</p>

                                        <div className="bg-light p-2 rounded mb-3">
                                            <div className="d-flex justify-content-between small text-muted mb-1">
                                                <span><FiActivity className="me-1" /> Daily Limit:</span>
                                                <span className="fw-bold text-dark">{sender.sent_today || 0} / {sender.daily_limit}</span>
                                            </div>
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span>Hourly Limit:</span>
                                                <span className="fw-bold text-dark">{sender.sent_this_hour || 0} / {sender.hourly_limit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => handleTestConnection(sender)}
                                            disabled={testingSenderId === sender.id}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            {testingSenderId === sender.id ? (
                                                <Spinner size="sm" animation="border" />
                                            ) : (
                                                <FiCheckCircle />
                                            )}
                                            <span>Test</span>
                                        </Button>

                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            onClick={() => handleOpenTestEmail(sender)}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <FiSend />
                                            <span>Send Test Email</span>
                                        </Button>

                                        <div className="ms-auto d-flex gap-1">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                onClick={() => handleEditSender(sender)}
                                            >
                                                <FiEdit3 />
                                            </Button>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="text-danger"
                                                onClick={() => handleDeleteSender(sender.id)}
                                            >
                                                <FiTrash2 />
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {!loading && senders.length > 0 && (
                <div className="mt-4">
                    <Pagination pagination={pagination} onPageChange={loadSenders} />
                </div>
            )}

            {/* Modals */}
            <SenderModal
                show={showSenderModal}
                onHide={() => setShowSenderModal(false)}
                sender={selectedSender}
                initialProvider={initialProvider}
                onSaved={() => loadSenders(pagination.current_page || 1)}
            />

            <SendTestEmailModal
                show={showTestModal}
                onHide={() => setShowTestModal(false)}
                sender={selectedSender}
            />
        </div>
    );
}
