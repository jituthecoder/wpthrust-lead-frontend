import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Badge, Card } from "react-bootstrap";
import { FiSend, FiMail, FiCheckCircle, FiAlertCircle, FiGlobe, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";
import { sendSenderTestEmail, getEmailSenders } from "../../../api/emailSenders";
import { getEmailTemplates } from "../../../api/emailTemplates";
import { getBusinesses } from "../../../api/business";

export default function SendTestEmailModal({ show, onHide, sender = null }) {
    const [sending, setSending] = useState(false);
    const [senders, setSenders] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Selected options
    const [selectedSenderId, setSelectedSenderId] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("custom");
    const [selectedLeadId, setSelectedLeadId] = useState("dummy");

    // Form inputs
    const [recipientEmail, setRecipientEmail] = useState("");
    const [customSubject, setCustomSubject] = useState("Test Email from WPThrust CRM");
    const [customMessage, setCustomMessage] = useState("Hi,\n\nThis is a test email sent to verify your email sender settings in WPThrust CRM.");
    const [renderedHtml, setRenderedHtml] = useState("");

    useEffect(() => {
        if (show) {
            loadModalData();
            setRecipientEmail("");
        }
    }, [show, sender]);

    const loadModalData = async () => {
        try {
            setLoadingOptions(true);
            const [sendersRes, tplRes, bizRes] = await Promise.all([
                getEmailSenders(),
                getEmailTemplates({ status: "published" }),
                getBusinesses({ per_page: 50 }),
            ]);

            const senderList = sendersRes.data.data?.data || sendersRes.data.data || [];
            setSenders(senderList);
            if (sender?.id) {
                setSelectedSenderId(String(sender.id));
            } else if (senderList.length > 0) {
                setSelectedSenderId(String(senderList[0].id));
            }

            setTemplates(tplRes.data.data?.data || tplRes.data.data || []);
            setLeads(bizRes.data.data?.data || []);
        } catch (err) {
            console.error("Failed to load options for test email modal", err);
        } finally {
            setLoadingOptions(false);
        }
    };

    // Re-render template variables whenever selected template or selected lead changes
    useEffect(() => {
        if (selectedTemplateId === "custom") {
            setRenderedHtml("");
            return;
        }

        const tpl = templates.find((t) => String(t.id) === String(selectedTemplateId));
        if (!tpl || !tpl.current_version) return;

        const curVer = tpl.current_version;
        const activeLead = selectedLeadId === "dummy"
            ? null
            : leads.find((b) => String(b.id) === String(selectedLeadId));

        // Variable Replacements
        const name = activeLead?.business_name || "Acme Corp";
        const website = activeLead?.website || "acme.com";
        const email = activeLead?.email || "contact@acme.com";
        const phone = activeLead?.phone || "+1 (555) 019-2834";
        const city = activeLead?.city || "New York";
        const category = activeLead?.category || "General";

        const audit = activeLead?.audit || {};

        const mobileSpeed = audit.mobile_pagespeed ? String(audit.mobile_pagespeed) : "40";
        const desktopSpeed = audit.desktop_pagespeed ? String(audit.desktop_pagespeed) : "75";
        const mobileFcp = audit.mobile_fcp || "2.4 s";
        const mobileLcp = audit.mobile_lcp || "4.8 s";
        const mobileTbt = audit.mobile_tbt || "380 ms";
        const mobileCls = audit.mobile_cls || "0.12";
        const mobileSpeedIndex = audit.mobile_speed_index || "5.6 s";

        const rawShotUrl = audit.mobile_screenshot_url;
        const shotUrl = activeLead
            ? (rawShotUrl || "")
            : "https://pagespeed.web.dev/static/lh/images/lh-logo-128.png";

        const shotHtml = shotUrl
            ? `<div style="text-align:center; margin:5px 0; max-height:230px; overflow:hidden;">
                <img src="${shotUrl}" alt="PageSpeed Screenshot" style="max-width:100%; max-height:220px; width:auto; height:auto; border-radius:6px; border:1px solid #e2e8f0; object-fit:contain; display:block; margin:0 auto;" />
               </div>`
            : `<div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:15px; text-align:center; color:#64748b; font-size:12px; margin:5px 0;">
                📷 <strong>No PSI Screenshot Captured</strong> for <em>${name}</em>
               </div>`;

        let subj = curVer.subject || "";
        subj = subj
            .replace(/\{\{business_name\}\}/g, name)
            .replace(/\{\{website\}\}/g, website)
            .replace(/\{\{email\}\}/g, email)
            .replace(/\{\{city\}\}/g, city)
            .replace(/\{\{phone\}\}/g, phone)
            .replace(/\{\{mobile_pagespeed\}\}/g, mobileSpeed);

        setCustomSubject(subj);

        let body = curVer.html || "";
        body = body
            .replace(/\{\{business_name\}\}/g, name)
            .replace(/\{\{website\}\}/g, website)
            .replace(/\{\{phone\}\}/g, phone)
            .replace(/\{\{email\}\}/g, email)
            .replace(/\{\{city\}\}/g, city)
            .replace(/\{\{category\}\}/g, category)
            .replace(/\{\{mobile_pagespeed\}\}/g, mobileSpeed)
            .replace(/\{\{desktop_pagespeed\}\}/g, desktopSpeed)
            .replace(/\{\{mobile_fcp\}\}/g, mobileFcp)
            .replace(/\{\{mobile_lcp\}\}/g, mobileLcp)
            .replace(/\{\{mobile_tbt\}\}/g, mobileTbt)
            .replace(/\{\{mobile_cls\}\}/g, mobileCls)
            .replace(/\{\{mobile_speed_index\}\}/g, mobileSpeedIndex)
            .replace(/\{\{mobile_screenshot_url\}\}/g, shotUrl)
            .replace(/\{\{psi_screenshot_url\}\}/g, shotUrl)
            .replace(/\{\{screenshot_url\}\}/g, shotUrl)
            .replace(/\{\{mobile_screenshot\}\}/g, shotHtml)
            .replace(/\{\{psi_screenshot\}\}/g, shotHtml);

        setRenderedHtml(body);
    }, [selectedTemplateId, selectedLeadId, templates, leads]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const targetSenderId = selectedSenderId || sender?.id;
        if (!targetSenderId) {
            toast.error("Please select a sender account.");
            return;
        }
        if (!recipientEmail) {
            toast.error("Please enter a recipient email address.");
            return;
        }

        try {
            setSending(true);
            const payload = {
                to: recipientEmail,
                subject: customSubject,
                message: customMessage,
                html: selectedTemplateId !== "custom" ? renderedHtml : null,
            };

            await sendSenderTestEmail(targetSenderId, payload);
            toast.success(`Test email sent successfully to ${recipientEmail}!`);
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to send test email";
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    const activeLeadObj = selectedLeadId === "dummy"
        ? null
        : leads.find((b) => String(b.id) === String(selectedLeadId));

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold d-flex align-items-center gap-2 fs-5">
                    <FiSend className="text-primary" />
                    <span>Send Test Email</span>
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-0">
                    {loadingOptions ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2 small">Loading options...</p>
                        </div>
                    ) : (
                        <Row className="g-3">
                            {/* Sender Account */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Sender Account *</Form.Label>
                                    <Form.Select
                                        value={selectedSenderId}
                                        onChange={(e) => setSelectedSenderId(e.target.value)}
                                        required
                                    >
                                        {senders.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.display_name || s.name} ({s.email})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Recipient Email */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Send Test To (Your Email) *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="e.g. you@domain.com"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            {/* Email Template Selector */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Select Email Template</Form.Label>
                                    <Form.Select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    >
                                        <option value="custom">📝 Custom Simple Message (No Template)</option>
                                        {templates.map((tpl) => (
                                            <option key={tpl.id} value={tpl.id}>
                                                📧 {tpl.name} ({tpl.category || "General"})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Lead Data Selector for Variable Binding */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Sample Lead Data for Variables</Form.Label>
                                    <Form.Select
                                        value={selectedLeadId}
                                        onChange={(e) => setSelectedLeadId(e.target.value)}
                                        disabled={selectedTemplateId === "custom"}
                                    >
                                        <option value="dummy">📌 Dummy Sample Lead (Acme Corp)</option>
                                        {leads.map((biz) => {
                                            const score = biz.audit?.mobile_pagespeed || "N/A";
                                            const hasShot = Boolean(biz.audit?.mobile_screenshot_url);
                                            return (
                                                <option key={biz.id} value={biz.id}>
                                                    🏢 {biz.business_name} (PSI: {score} | {hasShot ? "📷 Shot" : "No Shot"})
                                                </option>
                                            );
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Subject Line */}
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Subject Line *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={customSubject}
                                        onChange={(e) => setCustomSubject(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            {/* Custom Message or HTML Template Live Preview */}
                            <Col md={12}>
                                {selectedTemplateId === "custom" ? (
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">Test Message *</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            required
                                        />
                                    </Form.Group>
                                ) : (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Form.Label className="fw-semibold small m-0">
                                                Rendered Email Template Preview:
                                            </Form.Label>
                                            <small className="text-muted">
                                                Lead: <strong>{activeLeadObj ? activeLeadObj.business_name : "Acme Corp"}</strong>
                                            </small>
                                        </div>
                                        <div
                                            className="border rounded p-3 bg-white"
                                            style={{ maxHeight: "250px", overflowY: "auto", fontSize: "14px" }}
                                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                        />
                                    </div>
                                )}
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={onHide} disabled={sending}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={sending || !recipientEmail}>
                        {sending ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Sending...
                            </>
                        ) : (
                            "Send Test Email"
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
