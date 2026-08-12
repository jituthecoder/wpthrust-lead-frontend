import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table } from "react-bootstrap";
import { FiPlus, FiSearch, FiCheckCircle, FiSend, FiEdit3, FiTrash2, FiActivity } from "react-icons/fi";
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

    const [showSenderModal, setShowSenderModal] = useState(false);
    const [selectedSender, setSelectedSender] = useState(null);
    const [initialProvider, setInitialProvider] = useState("smtp");

    const [showTestModal, setShowTestModal] = useState(false);
    const [testingSenderId, setTestingSenderId] = useState(null);

    const loadSenders = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getEmailSenders({ page, search, provider: providerFilter });
            setSenders(res.data.data.data || []);
            setPagination(res.data.data || {});
        } catch (error) {
            toast.error("Failed to load email senders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSenders(1);
        const params = new URLSearchParams(window.location.search);
        if (params.has("oauth_success")) {
            toast.success(params.get("oauth_success"));
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.has("oauth_error")) {
            toast.error(params.get("oauth_error"));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
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

    const handleAddSender = (prov = "smtp") => {
        if (prov === "gmail") {
            handleGoogleOAuthRedirect();
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
        if (!window.confirm("Are you sure you want to delete this sender account?")) return;
        try {
            await deleteEmailSender(id);
            toast.success("Sender deleted successfully");
            loadSenders(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to delete sender");
        }
    };

    const handleTestConnection = async (sender) => {
        try {
            setTestingSenderId(sender.id);
            const res = await testSenderConnection(sender.id);
            if (res.data.success) {
                toast.success(`Connection test successful for ${sender.email}!`);
            } else {
                toast.error(res.data.message || "Connection failed");
            }
        } catch (error) {
            toast.error("Connection test failed");
        } finally {
            setTestingSenderId(null);
        }
    };

    const handleOpenTestEmail = (sender) => {
        setSelectedSender(sender);
        setShowTestModal(true);
    };

    return (
        <div>
            {/* Hunter.io Style Quick Connection Banner */}
            <Card className="border-0 shadow-sm mb-4 bg-white">
                <Card.Body className="p-3">
                    <h6 className="fw-bold text-dark mb-1">Sender accounts</h6>
                    <p className="text-muted small mb-3">
                        Select the email account(s) to send the sequence. If multiple accounts are chosen, the emails will be distributed among them.
                    </p>

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

            {/* Action Bar */}
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
            </div>

            {/* List / Cards */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading email senders...</p>
                </div>
            ) : senders.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <h5 className="fw-bold text-muted mb-2">No Email Senders Configured</h5>
                        <p className="text-muted mb-3">Add your SMTP or email accounts to start launching cold email campaigns.</p>
                        <Button variant="outline-primary" onClick={() => handleAddSender("smtp")}>
                            <FiPlus className="me-1" /> Add Your First Sender
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
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
                                            <Badge bg="primary" className="text-uppercase" style={{ fontSize: "10px" }}>
                                                {sender.provider}
                                            </Badge>
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

            {!loading && senders.length === 0 && null}

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
