import { useEffect, useState, useRef } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Nav, Tab, Badge, Card } from "react-bootstrap";
import { FiEye, FiSearch, FiCamera, FiGlobe, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { createEmailTemplate, updateEmailTemplate, publishEmailTemplate } from "../../../api/emailTemplates";
import { getTemplateVariables } from "../../../api/templateVariables";
import { getBusinesses } from "../../../api/business";

export default function TemplateModal({ show, onHide, template = null, onSaved }) {
    const isEdit = Boolean(template);
    const [submitting, setSubmitting] = useState(false);
    const [variables, setVariables] = useState([]);
    const [activeTab, setActiveTab] = useState("edit");

    const subjectInputRef = useRef(null);
    const bodyInputRef = useRef(null);
    const [lastFocusedInput, setLastFocusedInput] = useState("body"); // "subject" or "body"

    // Lead Preview Selector State
    const [previewLeads, setPreviewLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState("dummy");
    const [previewLeadSearch, setPreviewLeadSearch] = useState("");
    const [previewPsiFilter, setPreviewPsiFilter] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        template_type: "cold_email",
        category: "outreach",
        subject: "",
        html: "",
        plain_text: "",
        changelog: "",
    });

    useEffect(() => {
        if (show) {
            loadVariables();
            loadPreviewLeads();
            if (template) {
                const curVer = template.current_version;
                setFormData({
                    name: template.name || "",
                    template_type: template.template_type || "cold_email",
                    category: template.category || "outreach",
                    subject: curVer?.subject || "",
                    html: curVer?.html || "",
                    plain_text: curVer?.plain_text || "",
                    changelog: "",
                });
            } else {
                setFormData({
                    name: "",
                    template_type: "cold_email",
                    category: "outreach",
                    subject: "Website Audit & PageSpeed Report for {{business_name}}",
                    html: `<p>Hi {{business_name}} team,</p>\n<p>We recently ran a speed audit on your website ({{website}}) and found your mobile score is <strong>{{mobile_pagespeed}}</strong>.</p>\n<p>{{mobile_screenshot}}</p>\n<p>We can help improve your site performance and convert more visitors.</p>\n<p>Best regards,<br>WPThrust Team</p>`,
                    plain_text: "",
                    changelog: "",
                });
            }
        }
    }, [show, template]);

    useEffect(() => {
        if (show && activeTab === "preview") {
            loadPreviewLeads();
        }
    }, [show, activeTab, previewLeadSearch, previewPsiFilter]);

    const loadVariables = async () => {
        try {
            const res = await getTemplateVariables();
            setVariables(res.data.data || []);
        } catch (error) {
            console.error("Failed to load variables", error);
        }
    };

    const loadPreviewLeads = async () => {
        try {
            setLoadingLeads(true);
            const res = await getBusinesses({
                search: previewLeadSearch,
                psi_filter: previewPsiFilter,
                per_page: 50,
            });
            const list = res.data.data?.data || [];
            setPreviewLeads(list);
        } catch (err) {
            console.error("Failed to load preview leads", err);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const insertVariable = (varTag) => {
        if (lastFocusedInput === "subject") {
            setFormData((prev) => ({
                ...prev,
                subject: prev.subject + " " + varTag,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                html: prev.html + " " + varTag,
            }));
        }
        toast.success(`Inserted ${varTag}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (isEdit) {
                await updateEmailTemplate(template.id, {
                    subject: formData.subject,
                    html: formData.html,
                    plain_text: formData.plain_text,
                    changelog: formData.changelog || "Updated version",
                });
                toast.success("New template version created!");
            } else {
                await createEmailTemplate(formData);
                toast.success("Email template created successfully!");
            }
            onSaved();
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to save template";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        if (!template?.id) return;
        try {
            await publishEmailTemplate(template.id);
            toast.success("Template published successfully!");
            onSaved();
            onHide();
        } catch (error) {
            toast.error("Failed to publish template");
        }
    };

    // Selected lead for live preview
    const activeLead = selectedLeadId === "dummy"
        ? null
        : previewLeads.find((b) => String(b.id) === String(selectedLeadId));

    // Compute dynamic rendered template values
    const renderPreviewSubject = () => {
        let subject = formData.subject || "";
        if (activeLead) {
            subject = subject
                .replace(/\{\{business_name\}\}/g, activeLead.business_name || "Acme Corp")
                .replace(/\{\{website\}\}/g, activeLead.website || "acme.com")
                .replace(/\{\{email\}\}/g, activeLead.email || "contact@acme.com")
                .replace(/\{\{city\}\}/g, activeLead.city || "New York")
                .replace(/\{\{phone\}\}/g, activeLead.phone || "+1 (555) 000-0000");
        } else {
            subject = subject
                .replace(/\{\{business_name\}\}/g, "Acme Corp")
                .replace(/\{\{website\}\}/g, "acme.com")
                .replace(/\{\{email\}\}/g, "contact@acme.com")
                .replace(/\{\{city\}\}/g, "New York")
                .replace(/\{\{phone\}\}/g, "+1 (555) 000-0000");
        }
        return subject;
    };

    const renderPreviewHtml = () => {
        let html = formData.html || "";

        const name = activeLead?.business_name || "Acme Corp";
        const website = activeLead?.website || "acme.com";
        const email = activeLead?.email || "contact@acme.com";
        const phone = activeLead?.phone || "+1 (555) 019-2834";
        const city = activeLead?.city || "New York";
        const category = activeLead?.category || "General";

        const mobileSpeed = activeLead?.audit?.mobile_pagespeed
            ? String(activeLead.audit.mobile_pagespeed)
            : "40";

        const desktopSpeed = activeLead?.audit?.desktop_pagespeed
            ? String(activeLead.audit.desktop_pagespeed)
            : "75";

        const rawShotUrl = activeLead?.audit?.mobile_screenshot_url;

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

        const audit = activeLead?.audit || {};

        const mobileFcp = audit.mobile_fcp || "2.4 s";
        const mobileLcp = audit.mobile_lcp || "4.8 s";
        const mobileTbt = audit.mobile_tbt || "380 ms";
        const mobileCls = audit.mobile_cls || "0.12";
        const mobileSpeedIndex = audit.mobile_speed_index || "5.6 s";

        const mobileSeo = audit.mobile_seo ? String(audit.mobile_seo) : "85";
        const desktopSeo = audit.desktop_seo ? String(audit.desktop_seo) : "90";
        const mobileAccessibility = audit.mobile_accessibility ? String(audit.mobile_accessibility) : "80";
        const desktopAccessibility = audit.desktop_accessibility ? String(audit.desktop_accessibility) : "88";
        const mobileLoadTime = audit.mobile_load_time || "3.2 s";
        const desktopLoadTime = audit.desktop_load_time || "1.4 s";

        const avgRating = audit.average_rating ? String(audit.average_rating) : "4.8";
        const reviewCount = audit.review_count ? String(audit.review_count) : "42";
        const address = activeLead?.address || "123 Business St";
        const state = activeLead?.state || "NY";
        const country = activeLead?.country || "USA";
        const facebook = audit.facebook || "-";
        const instagram = audit.instagram || "-";
        const linkedin = audit.linkedin || "-";
        const contactForm = audit.contact_form ? "Available" : "Not Available";

        html = html
            .replace(/\{\{business_name\}\}/g, name)
            .replace(/\{\{website\}\}/g, website)
            .replace(/\{\{phone\}\}/g, phone)
            .replace(/\{\{email\}\}/g, email)
            .replace(/\{\{city\}\}/g, city)
            .replace(/\{\{address\}\}/g, address)
            .replace(/\{\{state\}\}/g, state)
            .replace(/\{\{country\}\}/g, country)
            .replace(/\{\{category\}\}/g, category)
            .replace(/\{\{mobile_pagespeed\}\}/g, mobileSpeed)
            .replace(/\{\{desktop_pagespeed\}\}/g, desktopSpeed)
            .replace(/\{\{mobile_fcp\}\}/g, mobileFcp)
            .replace(/\{\{mobile_lcp\}\}/g, mobileLcp)
            .replace(/\{\{mobile_tbt\}\}/g, mobileTbt)
            .replace(/\{\{mobile_cls\}\}/g, mobileCls)
            .replace(/\{\{mobile_speed_index\}\}/g, mobileSpeedIndex)
            .replace(/\{\{mobile_seo\}\}/g, mobileSeo)
            .replace(/\{\{desktop_seo\}\}/g, desktopSeo)
            .replace(/\{\{mobile_accessibility\}\}/g, mobileAccessibility)
            .replace(/\{\{desktop_accessibility\}\}/g, desktopAccessibility)
            .replace(/\{\{mobile_load_time\}\}/g, mobileLoadTime)
            .replace(/\{\{desktop_load_time\}\}/g, desktopLoadTime)
            .replace(/\{\{average_rating\}\}/g, avgRating)
            .replace(/\{\{review_count\}\}/g, reviewCount)
            .replace(/\{\{facebook\}\}/g, facebook)
            .replace(/\{\{instagram\}\}/g, instagram)
            .replace(/\{\{linkedin\}\}/g, linkedin)
            .replace(/\{\{contact_form\}\}/g, contactForm)
            .replace(/\{\{mobile_screenshot_url\}\}/g, shotUrl)
            .replace(/\{\{psi_screenshot_url\}\}/g, shotUrl)
            .replace(/\{\{screenshot_url\}\}/g, shotUrl)
            .replace(/\{\{mobile_screenshot\}\}/g, shotHtml)
            .replace(/\{\{psi_screenshot\}\}/g, shotHtml);

        return html;
    };

    // Group variables by group
    const groupedVariables = variables.reduce((acc, item) => {
        const group = item.group || "General";
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">
                    {isEdit ? `Edit Template: ${template?.name}` : "Create New Email Template"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav variant="tabs" className="mb-3">
                        <Nav.Item>
                            <Nav.Link eventKey="edit">Editor</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="preview" className="d-flex align-items-center gap-1">
                                <FiEye />
                                <span>Live Preview</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        <Tab.Pane eventKey="edit">
                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">Template Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder="e.g. Cold Pitch - PageSpeed Outreach"
                                                value={formData.name}
                                                onChange={handleChange}
                                                disabled={isEdit}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">Type *</Form.Label>
                                            <Form.Select
                                                name="template_type"
                                                value={formData.template_type}
                                                onChange={handleChange}
                                                disabled={isEdit}
                                                required
                                            >
                                                <option value="cold_email">Cold Email</option>
                                                <option value="follow_up">Follow Up</option>
                                                <option value="manual">Manual</option>
                                                <option value="transactional">Transactional</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">Category</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="category"
                                                placeholder="e.g. SEO, Audit"
                                                value={formData.category}
                                                onChange={handleChange}
                                                disabled={isEdit}
                                            />
                                        </Form.Group>
                                    </Col>

                                    {/* Variables Picker Box */}
                                    <Col md={12}>
                                        <div className="bg-light p-3 rounded border">
                                            <small className="fw-bold text-uppercase text-secondary d-block mb-2">
                                                Click tag to insert into {lastFocusedInput === "subject" ? "Subject Line" : "Email Body"}:
                                            </small>
                                            <div className="d-flex flex-wrap gap-2" style={{ maxHeight: "120px", overflowY: "auto" }}>
                                                {Object.entries(groupedVariables).map(([group, items]) => (
                                                    <div key={group} className="d-inline-flex gap-1 align-items-center me-2 mb-1">
                                                        <span className="badge bg-secondary me-1">{group}:</span>
                                                        {items.map((item) => (
                                                            <Button
                                                                key={item.key}
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="py-0 px-2 text-nowrap"
                                                                style={{ fontSize: "11px" }}
                                                                onClick={() => insertVariable(item.variable)}
                                                            >
                                                                {item.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">Subject Line *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="subject"
                                                ref={subjectInputRef}
                                                onFocus={() => setLastFocusedInput("subject")}
                                                placeholder="Subject line with {{business_name}}"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">HTML Body *</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={8}
                                                name="html"
                                                ref={bodyInputRef}
                                                onFocus={() => setLastFocusedInput("body")}
                                                placeholder="<p>Hi {{business_name}}, ...</p>"
                                                value={formData.html}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>

                                    {isEdit && (
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small">Version Changelog Note</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="changelog"
                                                    placeholder="Describe what changed in this version..."
                                                    value={formData.changelog}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    )}

                                    <div className="d-flex justify-content-end gap-2 mt-3">
                                        {isEdit && (
                                            <Button
                                                variant="success"
                                                type="button"
                                                onClick={handlePublish}
                                                className="me-auto"
                                            >
                                                Publish Current Version
                                            </Button>
                                        )}
                                        <Button variant="light" onClick={onHide} disabled={submitting}>
                                            Cancel
                                        </Button>
                                        <Button variant="primary" type="submit" disabled={submitting}>
                                            {submitting ? (
                                                <Spinner size="sm" animation="border" />
                                            ) : isEdit ? (
                                                "Save New Version"
                                            ) : (
                                                "Create Template"
                                            )}
                                        </Button>
                                    </div>
                                </Row>
                            </Form>
                        </Tab.Pane>

                        {/* LIVE PREVIEW WITH SPECIFIC LEAD SELECTOR */}
                        <Tab.Pane eventKey="preview">
                            {/* Lead Preview Selector Toolbar */}
                            <div className="bg-light p-3 rounded border mb-3">
                                <Row className="g-2 align-items-center">
                                    <Col md={5}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-dark m-0 mb-1">
                                                Select Specific Lead for Preview:
                                            </Form.Label>
                                            <Form.Select
                                                size="sm"
                                                value={selectedLeadId}
                                                onChange={(e) => setSelectedLeadId(e.target.value)}
                                                className="fw-semibold"
                                            >
                                                <option value="dummy">📌 Sample Dummy Lead (Default Acme Corp)</option>
                                                {previewLeads.map((biz) => {
                                                    const hasShot = Boolean(biz.audit?.mobile_screenshot_url);
                                                    const psiScore = biz.audit?.mobile_pagespeed || "N/A";
                                                    return (
                                                        <option key={biz.id} value={biz.id}>
                                                            🏢 {biz.business_name} — (PSI: {psiScore} | {hasShot ? "📷 Screenshot Available" : "🚫 No Screenshot"})
                                                        </option>
                                                    );
                                                })}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-dark m-0 mb-1">
                                                PSI Filter:
                                            </Form.Label>
                                            <Form.Select
                                                size="sm"
                                                value={previewPsiFilter}
                                                onChange={(e) => setPreviewPsiFilter(e.target.value)}
                                            >
                                                <option value="">All PSI Scores</option>
                                                <option value="less_50">🔴 Poor Score (&lt; 50)</option>
                                                <option value="less_90">🟠 Needs Improvement (&lt; 90)</option>
                                                <option value="good_90">🟢 Good Score (≥ 90)</option>
                                                <option value="not_audited">⚪ Not Audited</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-dark m-0 mb-1">
                                                Search Lead:
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                placeholder="Search by business name..."
                                                value={previewLeadSearch}
                                                onChange={(e) => setPreviewLeadSearch(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            {/* Active Preview Lead Info Banner */}
                            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-white rounded border">
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="primary" className="p-2">
                                        <FiGlobe className="me-1" />
                                        {activeLead ? activeLead.business_name : "Sample Dummy Lead"}
                                    </Badge>
                                    <small className="text-muted">
                                        Email: <strong>{activeLead?.email || "contact@acme.com"}</strong>
                                    </small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    {activeLead?.audit?.mobile_screenshot_url ? (
                                        <Badge bg="success" className="d-flex align-items-center gap-1 px-2 py-1">
                                            <FiCamera />
                                            <span>Screenshot Available</span>
                                        </Badge>
                                    ) : (
                                        <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1 px-2 py-1">
                                            <FiAlertCircle />
                                            <span>Missing Screenshot (Shows Fallback)</span>
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Live Email Preview Frame */}
                            <div className="border rounded p-4 bg-white shadow-sm">
                                <div className="border-bottom pb-3 mb-3">
                                    <small className="text-muted d-block fw-semibold mb-1">Subject Line:</small>
                                    <h5 className="fw-bold mb-0 text-dark">
                                        {renderPreviewSubject()}
                                    </h5>
                                </div>
                                <div
                                    className="preview-html"
                                    dangerouslySetInnerHTML={{
                                        __html: renderPreviewHtml(),
                                    }}
                                />
                            </div>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    );
}
