import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Badge, Card, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import { FiPlus } from "react-icons/fi";
import { createEmailCampaign, updateEmailCampaign } from "../../../api/emailCampaigns";
import { getEmailTemplates } from "../../../api/emailTemplates";
import { getEmailSenders } from "../../../api/emailSenders";
import { getBusinesses } from "../../../api/business";
import SenderModal from "./SenderModal";

export default function CreateCampaignModal({ show, onHide, campaign = null, onSaved }) {
    const isEdit = Boolean(campaign);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    // Options data
    const [templates, setTemplates] = useState([]);
    const [senders, setSenders] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [businessSearch, setBusinessSearch] = useState("");

    // Quick Add Sender Modal
    const [showSenderModal, setShowSenderModal] = useState(false);
    const [initialSenderProvider, setInitialSenderProvider] = useState("smtp");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        email_template_id: "",
        scheduled_at: "",
        senders: [],
        businesses: [],
    });

    useEffect(() => {
        if (show) {
            setStep(1);
            loadAllOptions();
            if (campaign) {
                setFormData({
                    name: campaign.name || "",
                    description: campaign.description || "",
                    email_template_id: campaign.email_template_id || "",
                    scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : "",
                    senders: campaign.senders ? campaign.senders.map((s) => s.email_sender_id) : [],
                    businesses: campaign.leads ? campaign.leads.map((l) => l.business_id) : [],
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    email_template_id: "",
                    scheduled_at: "",
                    senders: [],
                    businesses: [],
                });
            }
        }
    }, [show, campaign]);

    const loadAllOptions = async () => {
        try {
            setLoadingOptions(true);
            const [tplRes, senderRes, bizRes] = await Promise.all([
                getEmailTemplates({ status: "published" }),
                getEmailSenders(),
                getBusinesses({ page: 1, per_page: 100 }),
            ]);
            setTemplates(tplRes.data.data?.data || tplRes.data.data || []);
            setSenders(senderRes.data.data?.data || senderRes.data.data || []);
            
            // Filter businesses that have email
            const bizList = (bizRes.data.data?.data || []).filter((b) => Boolean(b.email));
            setBusinesses(bizList);
        } catch (error) {
            console.error("Failed to load campaign options", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleSearchBusinesses = async (e) => {
        const query = e.target.value;
        setBusinessSearch(query);
        try {
            const bizRes = await getBusinesses({ search: query, page: 1, per_page: 100 });
            const bizList = (bizRes.data.data?.data || []).filter((b) => Boolean(b.email));
            setBusinesses(bizList);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSender = (senderId) => {
        setFormData((prev) => {
            const exists = prev.senders.includes(senderId);
            return {
                ...prev,
                senders: exists
                    ? prev.senders.filter((id) => id !== senderId)
                    : [...prev.senders, senderId],
            };
        });
    };

    const toggleBusiness = (bizId) => {
        setFormData((prev) => {
            const exists = prev.businesses.includes(bizId);
            return {
                ...prev,
                businesses: exists
                    ? prev.businesses.filter((id) => id !== bizId)
                    : [...prev.businesses, bizId],
            };
        });
    };

    const toggleSelectAllBusinesses = () => {
        const allIds = businesses.map((b) => b.id);
        const allSelected = allIds.length > 0 && allIds.every((id) => formData.businesses.includes(id));
        setFormData((prev) => ({
            ...prev,
            businesses: allSelected
                ? prev.businesses.filter((id) => !allIds.includes(id))
                : [...new Set([...prev.businesses, ...allIds])],
        }));
    };

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Strictly prevent form submission on wizard steps 1, 2, 3, or 4
        if (step !== 5) {
            return;
        }

        if (!formData.email_template_id) {
            toast.error("Please select an email template.");
            setStep(2);
            return;
        }
        if (formData.senders.length === 0) {
            toast.error("Please select at least one sender account.");
            setStep(3);
            return;
        }
        if (formData.businesses.length === 0) {
            toast.error("Please select at least one target business lead.");
            setStep(4);
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                name: formData.name,
                description: formData.description || null,
                email_template_id: parseInt(formData.email_template_id, 10),
                scheduled_at: formData.scheduled_at || null,
                senders: formData.senders,
                businesses: formData.businesses,
            };

            if (isEdit) {
                await updateEmailCampaign(campaign.id, payload);
                toast.success("Campaign updated successfully!");
            } else {
                await createEmailCampaign(payload);
                toast.success("Campaign created successfully!");
            }
            onSaved();
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to save campaign";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">
                    {isEdit ? `Edit Campaign: ${campaign?.name}` : "Create New Email Campaign"}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && step < 5) e.preventDefault(); }}>
                <Modal.Body className="pt-0">
                    {loadingOptions ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2">Loading options...</p>
                        </div>
                    ) : (
                        <div>
                            {/* Step Indicator */}
                            <div className="d-flex justify-content-between mb-4 border-bottom pb-3">
                                {[
                                    { num: 1, label: "Basic Info" },
                                    { num: 2, label: "Template" },
                                    { num: 3, label: "Senders" },
                                    { num: 4, label: "Target Leads" },
                                    { num: 5, label: "Schedule & Launch" },
                                ].map((s) => (
                                    <button
                                        key={s.num}
                                        type="button"
                                        className={`btn btn-sm ${
                                            step === s.num
                                                ? "btn-primary font-weight-bold"
                                                : step > s.num
                                                ? "btn-outline-primary"
                                                : "btn-light text-muted"
                                        } rounded-pill px-3`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setStep(s.num);
                                        }}
                                    >
                                        {s.num}. {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Step 1: Basic Info */}
                            {step === 1 && (
                                <Row className="g-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">Campaign Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. Q3 SEO Audit Outreach"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold small">Description</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Cold campaign targeting businesses with low page speed..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            )}

                            {/* Step 2: Template Selection */}
                            {step === 2 && (
                                <div>
                                    <h6 className="fw-bold mb-3 text-dark">Select Email Template *</h6>
                                    {templates.length === 0 ? (
                                        <div className="alert alert-warning">
                                            No published templates found. Please create and publish a template first in the Templates tab.
                                        </div>
                                    ) : (
                                        <Row className="g-3">
                                            {templates.map((tpl) => (
                                                <Col key={tpl.id} md={6}>
                                                    <Card
                                                        className={`border ${
                                                            String(formData.email_template_id) === String(tpl.id)
                                                                ? "border-primary bg-light"
                                                                : ""
                                                        } cursor-pointer`}
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => setFormData({ ...formData, email_template_id: tpl.id })}
                                                    >
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <h6 className="fw-bold m-0 text-dark">{tpl.name}</h6>
                                                                {String(formData.email_template_id) === String(tpl.id) && (
                                                                    <Badge bg="primary">Selected</Badge>
                                                                )}
                                                            </div>
                                                            <small className="text-muted d-block text-truncate">
                                                                {tpl.current_version?.subject || "No subject"}
                                                            </small>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Senders */}
                            {step === 3 && (
                                <div>
                                    <div className="bg-light p-3 rounded border mb-4">
                                        <h6 className="fw-bold text-dark mb-1">Sender accounts</h6>
                                        <p className="text-muted small mb-3">
                                            Select the email account(s) to send the sequence. If multiple accounts are chosen, the emails will be distributed among them.
                                        </p>

                                        <div className="d-flex flex-wrap gap-2 align-items-center">
                                            <Button
                                                variant="light"
                                                type="button"
                                                className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                                                onClick={() => {
                                                    setInitialSenderProvider("gmail");
                                                    setShowSenderModal(true);
                                                }}
                                            >
                                                <FcGoogle size={18} />
                                                <span>Sign in with Google</span>
                                            </Button>

                                            <Button
                                                variant="light"
                                                type="button"
                                                className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                                                onClick={() => {
                                                    setInitialSenderProvider("outlook");
                                                    setShowSenderModal(true);
                                                }}
                                            >
                                                <BsMicrosoft size={16} className="text-primary" />
                                                <span>Sign in with Microsoft</span>
                                            </Button>

                                            <Button
                                                variant="light"
                                                type="button"
                                                className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                                                onClick={() => {
                                                    setInitialSenderProvider("smtp");
                                                    setShowSenderModal(true);
                                                }}
                                            >
                                                <FiPlus size={16} />
                                                <span>Connect SMTP/IMAP</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-2 text-dark">Available Senders ({formData.senders.length} Selected) *</h6>
                                    {senders.length === 0 ? (
                                        <div className="alert alert-warning">
                                            No sender accounts connected. Please click one of the buttons above to connect an email account.
                                        </div>
                                    ) : (
                                        <Row className="g-3">
                                            {senders.map((s) => {
                                                const isSelected = formData.senders.includes(s.id);
                                                return (
                                                    <Col key={s.id} md={6}>
                                                        <Card
                                                            className={`border ${isSelected ? "border-primary bg-light" : ""}`}
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => toggleSender(s.id)}
                                                        >
                                                            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <h6 className="fw-bold m-0 text-dark">{s.name}</h6>
                                                                    <small className="text-primary">{s.email}</small>
                                                                    <div className="text-muted small mt-1">Limit: {s.daily_limit}/day</div>
                                                                </div>
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleSender(s.id);
                                                                    }}
                                                                />
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Target Leads */}
                            {step === 4 && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h6 className="fw-bold m-0 text-dark">Target Business Leads ({formData.businesses.length} Selected) *</h6>
                                            <small className="text-muted">Only leads with a valid email address are listed.</small>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                placeholder="Search leads..."
                                                value={businessSearch}
                                                onChange={handleSearchBusinesses}
                                                style={{ width: "200px" }}
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleSelectAllBusinesses();
                                                }}
                                            >
                                                {businesses.length > 0 && businesses.every((b) => formData.businesses.includes(b.id))
                                                    ? "Deselect All"
                                                     : "Select All"}
                                            </Button>
                                        </div>
                                    </div>

                                    {businesses.length === 0 ? (
                                        <div className="alert alert-warning">No leads with email address found.</div>
                                    ) : (
                                        <div className="table-responsive border rounded" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                            <Table hover size="sm" className="align-middle mb-0">
                                                <thead className="bg-light sticky-top">
                                                    <tr>
                                                        <th style={{ width: "40px" }}>
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={businesses.length > 0 && businesses.every((b) => formData.businesses.includes(b.id))}
                                                                onChange={toggleSelectAllBusinesses}
                                                            />
                                                        </th>
                                                        <th>Business Name</th>
                                                        <th>Email</th>
                                                        <th>City / Country</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {businesses.map((biz) => {
                                                        const isSelected = formData.businesses.includes(biz.id);
                                                        return (
                                                            <tr
                                                                key={biz.id}
                                                                onClick={() => toggleBusiness(biz.id)}
                                                                style={{ cursor: "pointer" }}
                                                                className={isSelected ? "table-active" : ""}
                                                            >
                                                                <td onClick={(e) => e.stopPropagation()}>
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleBusiness(biz.id)}
                                                                    />
                                                                </td>
                                                                <td className="fw-medium text-dark">{biz.business_name}</td>
                                                                <td className="text-primary">{biz.email}</td>
                                                                <td className="text-muted small">
                                                                    {biz.city || ""}{biz.country ? `, ${biz.country}` : ""}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 5: Schedule & Review */}
                            {step === 5 && (
                                <div>
                                    <h6 className="fw-bold mb-3 text-dark">Schedule & Review Summary</h6>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold small">Scheduled Start Time (Optional)</Form.Label>
                                        <Form.Control
                                            type="datetime-local"
                                            value={formData.scheduled_at}
                                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        />
                                        <Form.Text className="text-muted small">Leave blank to save as Draft and start manually.</Form.Text>
                                    </Form.Group>

                                    <Card className="bg-light border-0 p-3 mb-3">
                                        <h6 className="fw-bold text-secondary mb-2">Campaign Overview</h6>
                                        <ul className="list-unstyled mb-0 small">
                                            <li className="mb-1"><strong>Campaign Name:</strong> {formData.name || "(Not set)"}</li>
                                            <li className="mb-1"><strong>Template:</strong> {templates.find((t) => String(t.id) === String(formData.email_template_id))?.name || "None selected"}</li>
                                            <li className="mb-1"><strong>Senders Count:</strong> {formData.senders.length} account(s)</li>
                                            <li className="mb-1"><strong>Target Leads:</strong> {formData.businesses.length} lead(s)</li>
                                        </ul>
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0">
                    {step > 1 && (
                        <Button
                            variant="light"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setStep((s) => Math.max(s - 1, 1));
                            }}
                            disabled={submitting}
                        >
                            Back
                        </Button>
                    )}
                    {step < 5 ? (
                        <Button
                            variant="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setStep((s) => Math.min(s + 1, 5));
                            }}
                        >
                            Next Step
                        </Button>
                    ) : (
                        <Button variant="success" type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Spinner size="sm" animation="border" className="me-2" />
                                    Saving...
                                </>
                            ) : isEdit ? (
                                "Update Campaign"
                            ) : (
                                "Save Campaign"
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>

            <SenderModal
                show={showSenderModal}
                onHide={() => setShowSenderModal(false)}
                initialProvider={initialSenderProvider}
                onSaved={() => loadAllOptions()}
            />
        </Modal>
    );
}
