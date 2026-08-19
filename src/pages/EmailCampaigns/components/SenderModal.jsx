import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Row, Col } from "react-bootstrap";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import { FiPlus, FiCheckCircle } from "react-icons/fi";
import { createEmailSender, updateEmailSender, testSenderConnection } from "../../../api/emailSenders";
import axiosClient from "../../../api/axios";

export default function SenderModal({ show, onHide, sender = null, initialProvider = "smtp", onSaved }) {
    const isEdit = Boolean(sender);
    const [submitting, setSubmitting] = useState(false);
    const [testing, setTesting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        display_name: "",
        email: "",
        provider: "smtp",
        daily_limit: 100,
        hourly_limit: 20,
        signature: "",
        settings: {
            host: "",
            port: 587,
            username: "",
            password: "",
            encryption: "tls",
        },
    });

    const isOAuth = formData.provider === "gmail" || formData.provider === "outlook" || formData.provider === "microsoft";

    const getProviderDefaults = (prov) => {
        if (prov === "gmail") {
            return { host: "smtp.gmail.com", port: 587, encryption: "tls" };
        }
        if (prov === "outlook") {
            return { host: "smtp.office365.com", port: 587, encryption: "tls" };
        }
        return { host: "", port: 587, encryption: "tls" };
    };

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

    const handleSelectProvider = (prov) => {
        if (prov === "gmail") {
            handleGoogleOAuthRedirect();
            return;
        }
        if (prov === "outlook" || prov === "microsoft") {
            handleMicrosoftOAuthRedirect();
            return;
        }
        const defaults = getProviderDefaults(prov);
        setFormData((prev) => ({
            ...prev,
            provider: prov,
            settings: {
                ...prev.settings,
                host: defaults.host,
                port: defaults.port,
                encryption: defaults.encryption,
            },
        }));
    };

    useEffect(() => {
        if (sender) {
            const savedSettings = sender.senderAccount?.settings || sender.sender_account?.settings || sender.settings || {};
            setFormData({
                name: sender.name || "",
                display_name: sender.display_name || "",
                email: sender.email || "",
                provider: sender.provider || "smtp",
                daily_limit: sender.daily_limit || 100,
                hourly_limit: sender.hourly_limit || 20,
                signature: sender.signature || "",
                settings: {
                    host: savedSettings.host || "",
                    port: savedSettings.port || 587,
                    username: savedSettings.username || sender.email || "",
                    password: "",
                    encryption: savedSettings.encryption || "tls",
                },
            });
        } else {
            const defaults = getProviderDefaults(initialProvider);
            setFormData({
                name: "",
                display_name: "",
                email: "",
                provider: initialProvider,
                daily_limit: 100,
                hourly_limit: 20,
                signature: "",
                settings: {
                    host: defaults.host,
                    port: defaults.port,
                    username: "",
                    password: "",
                    encryption: defaults.encryption,
                },
            });
        }
    }, [sender, show, initialProvider]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSettingChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                [name]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            const existingSettings = sender?.sender_account?.settings 
                || sender?.senderAccount?.settings 
                || sender?.settings 
                || {};

            const payload = {
                ...formData,
                daily_limit: parseInt(formData.daily_limit, 10),
                hourly_limit: parseInt(formData.hourly_limit, 10),
                settings: isOAuth
                    ? (Object.keys(existingSettings).length > 0 ? existingSettings : { is_oauth: true })
                    : {
                        ...formData.settings,
                        port: parseInt(formData.settings.port || 587, 10),
                    },
            };

            if (isEdit) {
                await updateEmailSender(sender.id, payload);
                toast.success("Sender updated successfully!");
            } else {
                await createEmailSender(payload);
                toast.success("Sender created successfully!");
            }
            onSaved();
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to save email sender";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTestConnection = async () => {
        if (!sender?.id) {
            toast.error("Please save the sender first before testing connection.");
            return;
        }
        try {
            setTesting(true);
            const res = await testSenderConnection(sender.id);
            if (res.data.success) {
                toast.success("Connection test successful!");
            } else {
                toast.error(res.data.message || "Connection test failed");
            }
        } catch (error) {
            toast.error("Connection test failed");
        } finally {
            setTesting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    {isEdit ? "Edit Email Sender" : "Add Email Sender Account"}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-3">

                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Account Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Sales Outbound"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Sender Display Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="display_name"
                                    placeholder="e.g. John from WPThrust"
                                    value={formData.display_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Email Address *</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Provider *</Form.Label>
                                <Form.Select
                                    name="provider"
                                    value={formData.provider}
                                    onChange={handleChange}
                                    required
                                    disabled={isEdit && isOAuth}
                                >
                                    <option value="smtp">SMTP Server</option>
                                    <option value="gmail">Google / Gmail</option>
                                    <option value="outlook">Outlook / Microsoft 365</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Daily Sending Limit *</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="daily_limit"
                                    min="1"
                                    value={formData.daily_limit}
                                    onChange={handleChange}
                                    required
                                />
                                <Form.Text className="text-muted small">Max emails allowed per day</Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Hourly Sending Limit *</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="hourly_limit"
                                    min="1"
                                    value={formData.hourly_limit}
                                    onChange={handleChange}
                                    required
                                />
                                <Form.Text className="text-muted small">Max emails allowed per hour</Form.Text>
                            </Form.Group>
                        </Col>

                        {/* OAuth Provider vs SMTP Settings Section */}
                        {isOAuth ? (
                            <Col md={12}>
                                <div className="bg-light p-3 rounded border my-2 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        {formData.provider === "gmail" ? <FcGoogle size={24} /> : <BsMicrosoft size={22} className="text-primary" />}
                                        <div>
                                            <h6 className="fw-bold mb-0 text-dark">
                                                {formData.provider === "gmail" ? "Google OAuth Account" : "Microsoft 365 / Outlook OAuth Account"}
                                            </h6>
                                            <small className="text-muted">
                                                Authenticated via OAuth 2.0. No SMTP host or password required.
                                            </small>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        type="button"
                                        onClick={() => handleSelectProvider(formData.provider)}
                                        className="d-inline-flex align-items-center gap-1"
                                    >
                                        <span>Re-authenticate</span>
                                    </Button>
                                </div>
                            </Col>
                        ) : (
                            <>
                                <Col md={12}>
                                    <hr className="my-2" />
                                    <h6 className="fw-bold mb-3 text-primary">SMTP Server Settings</h6>
                                </Col>

                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">SMTP Host *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="host"
                                            placeholder="smtp.domain.com"
                                            value={formData.settings.host}
                                            onChange={handleSettingChange}
                                            required={formData.provider === "smtp"}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">Port *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="port"
                                            placeholder="587"
                                            value={formData.settings.port}
                                            onChange={handleSettingChange}
                                            required={formData.provider === "smtp"}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">SMTP Username *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            placeholder="your-email@domain.com"
                                            value={formData.settings.username}
                                            onChange={handleSettingChange}
                                            required={formData.provider === "smtp"}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">
                                            SMTP Password {isEdit ? "(Leave blank to keep unchanged)" : "*"}
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            placeholder={isEdit ? "•••••••• (Leave blank to keep current password)" : "SMTP Password"}
                                            value={formData.settings.password}
                                            onChange={handleSettingChange}
                                            required={!isEdit && formData.provider === "smtp"}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">Encryption *</Form.Label>
                                        <Form.Select
                                            name="encryption"
                                            value={formData.settings.encryption}
                                            onChange={handleSettingChange}
                                            required={formData.provider === "smtp"}
                                        >
                                            <option value="tls">TLS (Port 587)</option>
                                            <option value="ssl">SSL (Port 465)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </>
                        )}

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Email Signature (Optional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="signature"
                                    placeholder="Best regards, John Doe&#10;Sales Director"
                                    value={formData.signature}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    {isEdit && (
                        <Button
                            variant="outline-info"
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testing || submitting}
                            className="me-auto d-inline-flex align-items-center gap-1"
                        >
                            {testing ? <Spinner size="sm" animation="border" /> : <FiCheckCircle />}
                            <span>Test Connection</span>
                        </Button>
                    )}
                    <Button variant="light" onClick={onHide} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Saving...
                            </>
                        ) : isEdit ? (
                            "Update Sender"
                        ) : (
                            "Save Sender"
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
