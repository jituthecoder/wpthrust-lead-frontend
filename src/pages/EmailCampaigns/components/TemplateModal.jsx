import { useEffect, useState, useRef } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Nav, Tab, Badge } from "react-bootstrap";
import toast from "react-hot-toast";
import { createEmailTemplate, updateEmailTemplate, publishEmailTemplate } from "../../../api/emailTemplates";
import { getTemplateVariables } from "../../../api/templateVariables";

export default function TemplateModal({ show, onHide, template = null, onSaved }) {
    const isEdit = Boolean(template);
    const [submitting, setSubmitting] = useState(false);
    const [variables, setVariables] = useState([]);
    const [activeTab, setActiveTab] = useState("edit");

    const subjectInputRef = useRef(null);
    const bodyInputRef = useRef(null);
    const [lastFocusedInput, setLastFocusedInput] = useState("body"); // "subject" or "body"

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
                    subject: "Growth Opportunity for {{business_name}}",
                    html: `<p>Hi {{business_name}} team,</p>\n<p>I was reviewing your website ({{website}}) and noticed your Mobile PageSpeed score is <strong>{{mobile_pagespeed}}</strong>.</p>\n<p>We can help improve your site performance and convert more visitors.</p>\n<p>Best regards,<br>WPThrust Team</p>`,
                    plain_text: "",
                    changelog: "",
                });
            }
        }
    }, [show, template]);

    const loadVariables = async () => {
        try {
            const res = await getTemplateVariables();
            setVariables(res.data.data || []);
        } catch (error) {
            console.error("Failed to load variables", error);
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
                            <Nav.Link eventKey="preview">Live Preview</Nav.Link>
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

                        <Tab.Pane eventKey="preview">
                            <div className="border rounded p-4 bg-white">
                                <div className="border-bottom pb-3 mb-3">
                                    <small className="text-muted d-block">Subject:</small>
                                    <h5 className="fw-bold mb-0">
                                        {formData.subject
                                            .replace(/\{\{business_name\}\}/g, "Acme Corp")
                                            .replace(/\{\{website\}\}/g, "acme.com")
                                            .replace(/\{\{email\}\}/g, "contact@acme.com")}
                                    </h5>
                                </div>
                                <div
                                    className="preview-html"
                                    dangerouslySetInnerHTML={{
                                        __html: formData.html
                                            .replace(/\{\{business_name\}\}/g, "Acme Corp")
                                            .replace(/\{\{website\}\}/g, "acme.com")
                                            .replace(/\{\{phone\}\}/g, "+1 (555) 019-2834")
                                            .replace(/\{\{email\}\}/g, "contact@acme.com")
                                            .replace(/\{\{city\}\}/g, "New York")
                                            .replace(/\{\{mobile_pagespeed\}\}/g, "45/100")
                                            .replace(/\{\{desktop_pagespeed\}\}/g, "78/100"),
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
