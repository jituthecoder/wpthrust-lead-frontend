import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Badge, Card, Table, Pagination } from "react-bootstrap";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import { FiPlus, FiCamera, FiGlobe, FiZap, FiTrash2, FiCheckCircle, FiList, FiCheckSquare } from "react-icons/fi";
import { createEmailCampaign, updateEmailCampaign } from "../../../api/emailCampaigns";
import { getEmailTemplates } from "../../../api/emailTemplates";
import { getEmailSenders } from "../../../api/emailSenders";
import { getBusinesses, getBusinessCategories } from "../../../api/business";
import SenderModal from "./SenderModal";

export default function CreateCampaignModal({ show, onHide, campaign = null, onSaved }) {
    const isEdit = Boolean(campaign);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    // Options data
    const [templates, setTemplates] = useState([]);
    const [senders, setSenders] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // View Mode tab in Step 4: "all" or "selected"
    const [leadViewMode, setLeadViewMode] = useState("all");

    // Scalable map storing selected leads: { [id]: businessObject }
    const [selectedMap, setSelectedMap] = useState({});

    // Pagination for Step 4
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filter states for Step 4
    const [businessSearch, setBusinessSearch] = useState("");
    const [psiFilter, setPsiFilter] = useState("");
    const [hasScreenshot, setHasScreenshot] = useState("");
    const [hasWebsite, setHasWebsite] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    // Quick Add Sender Modal
    const [showSenderModal, setShowSenderModal] = useState(false);
    const [initialSenderProvider, setInitialSenderProvider] = useState("smtp");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        email_template_id: "",
        scheduled_at: "",
        senders: [],
    });

    useEffect(() => {
        if (show) {
            setStep(1);
            setLeadViewMode("all");
            setPage(1);
            setSelectedMap({});
            loadAllOptions();
            if (campaign) {
                setFormData({
                    name: campaign.name || "",
                    description: campaign.description || "",
                    email_template_id: campaign.email_template_id || "",
                    scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : "",
                    senders: campaign.senders ? campaign.senders.map((s) => s.email_sender_id) : [],
                });
                if (campaign.leads) {
                    const map = {};
                    campaign.leads.forEach((l) => {
                        if (l.business) {
                            map[l.business_id] = l.business;
                        } else {
                            map[l.business_id] = { id: l.business_id, business_name: `Business #${l.business_id}`, email: "-" };
                        }
                    });
                    setSelectedMap(map);
                }
            } else {
                setFormData({
                    name: "",
                    description: "",
                    email_template_id: "",
                    scheduled_at: "",
                    senders: [],
                });
            }
        }
    }, [show, campaign]);

    useEffect(() => {
        if (show && step === 4) {
            loadLeadsFiltered();
        }
    }, [show, step, page, perPage, businessSearch, psiFilter, hasScreenshot, hasWebsite, categoryFilter]);

    const loadAllOptions = async () => {
        try {
            setLoadingOptions(true);
            const [tplRes, senderRes, catRes] = await Promise.all([
                getEmailTemplates({ status: "published" }),
                getEmailSenders(),
                getBusinessCategories(),
            ]);
            setTemplates(tplRes.data.data?.data || tplRes.data.data || []);
            setSenders(senderRes.data.data?.data || senderRes.data.data || []);
            setCategories(catRes.data.data || []);
            await loadLeadsFiltered();
        } catch (error) {
            console.error("Failed to load campaign options", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const loadLeadsFiltered = async () => {
        try {
            const bizRes = await getBusinesses({
                search: businessSearch,
                psi_filter: psiFilter,
                has_screenshot: hasScreenshot,
                has_website: hasWebsite,
                category: categoryFilter,
                page,
                per_page: perPage,
            });
            const paginatedData = bizRes.data.data;
            const bizList = (paginatedData?.data || []).filter((b) => Boolean(b.email));
            setBusinesses(bizList);
            setLastPage(paginatedData?.last_page || 1);
            setTotalCount(paginatedData?.total || bizList.length);
        } catch (err) {
            console.error("Failed to load leads", err);
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

    const toggleBusiness = (biz) => {
        setSelectedMap((prev) => {
            const next = { ...prev };
            if (next[biz.id]) {
                delete next[biz.id];
            } else {
                next[biz.id] = biz;
            }
            return next;
        });
    };

    const toggleSelectAllBusinessesPage = () => {
        const currentPageIds = businesses.map((b) => b.id);
        const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedMap[id]);

        setSelectedMap((prev) => {
            const next = { ...prev };
            if (allSelected) {
                currentPageIds.forEach((id) => delete next[id]);
            } else {
                businesses.forEach((biz) => {
                    next[biz.id] = biz;
                });
            }
            return next;
        });
    };

    const selectAllFilteredLeads = async () => {
        try {
            toast.loading("Selecting all matching leads across pages...", { id: "select_all" });
            const bizRes = await getBusinesses({
                search: businessSearch,
                psi_filter: psiFilter,
                has_screenshot: hasScreenshot,
                has_website: hasWebsite,
                category: categoryFilter,
                page: 1,
                per_page: 500,
            });
            const bizList = (bizRes.data.data?.data || []).filter((b) => Boolean(b.email));
            setSelectedMap((prev) => {
                const next = { ...prev };
                bizList.forEach((biz) => {
                    next[biz.id] = biz;
                });
                return next;
            });
            toast.success(`Selected ${bizList.length} target leads!`, { id: "select_all" });
        } catch (err) {
            toast.error("Failed to select all leads", { id: "select_all" });
        }
    };

    const removeSelectedBusiness = (id) => {
        setSelectedMap((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const clearAllSelectedBusinesses = () => {
        setSelectedMap({});
    };

    const selectedIds = Object.keys(selectedMap).map(Number);
    const selectedList = Object.values(selectedMap);

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

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
        if (selectedIds.length === 0) {
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
                businesses: selectedIds,
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
        <Modal show={show} onHide={onHide} size="xl" centered>
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
                                    {/* View Mode Selector Tabs */}
                                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                        <div className="btn-group">
                                            <Button
                                                variant={leadViewMode === "all" ? "primary" : "outline-secondary"}
                                                size="sm"
                                                onClick={() => setLeadViewMode("all")}
                                                className="d-flex align-items-center gap-2"
                                            >
                                                <FiList />
                                                <span>Lead Directory ({totalCount})</span>
                                            </Button>
                                            <Button
                                                variant={leadViewMode === "selected" ? "success" : "outline-success"}
                                                size="sm"
                                                onClick={() => setLeadViewMode("selected")}
                                                className="d-flex align-items-center gap-2"
                                            >
                                                <FiCheckCircle />
                                                <span>Selected Target Leads ({selectedIds.length})</span>
                                            </Button>
                                        </div>

                                        {leadViewMode === "selected" && selectedIds.length > 0 && (
                                            <Button variant="outline-danger" size="sm" onClick={clearAllSelectedBusinesses}>
                                                Clear All Selected
                                            </Button>
                                        )}
                                    </div>

                                    {/* Advanced Filter Toolbar (Shown in Directory View Mode) */}
                                    {leadViewMode === "all" && (
                                        <div className="bg-light p-3 rounded border mb-3">
                                            <Row className="g-2">
                                                <Col md={3}>
                                                    <Form.Control
                                                        type="text"
                                                        size="sm"
                                                        placeholder="Search name, email, website..."
                                                        value={businessSearch}
                                                        onChange={(e) => {
                                                            setBusinessSearch(e.target.value);
                                                            setPage(1);
                                                        }}
                                                    />
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Select
                                                        size="sm"
                                                        value={psiFilter}
                                                        onChange={(e) => {
                                                            setPsiFilter(e.target.value);
                                                            setPage(1);
                                                        }}
                                                    >
                                                        <option value="">All PSI Scores</option>
                                                        <option value="less_50">🔴 Poor Score (&lt; 50)</option>
                                                        <option value="less_90">🟠 Needs Improvement (&lt; 90)</option>
                                                        <option value="good_90">🟢 Good Score (≥ 90)</option>
                                                        <option value="not_audited">⚪ Not Audited Yet</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Select
                                                        size="sm"
                                                        value={hasScreenshot}
                                                        onChange={(e) => {
                                                            setHasScreenshot(e.target.value);
                                                            setPage(1);
                                                        }}
                                                    >
                                                        <option value="">All Screenshots</option>
                                                        <option value="yes">📷 Has Screenshot</option>
                                                        <option value="no">🚫 Missing Screenshot</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Select
                                                        size="sm"
                                                        value={hasWebsite}
                                                        onChange={(e) => {
                                                            setHasWebsite(e.target.value);
                                                            setPage(1);
                                                        }}
                                                    >
                                                        <option value="">All Websites</option>
                                                        <option value="yes">🌐 Has Website</option>
                                                        <option value="no">🚫 No Website</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Select
                                                        size="sm"
                                                        value={categoryFilter}
                                                        onChange={(e) => {
                                                            setCategoryFilter(e.target.value);
                                                            setPage(1);
                                                        }}
                                                    >
                                                        <option value="">All Categories</option>
                                                        {categories.map((cat, idx) => (
                                                            <option key={idx} value={cat}>
                                                                {cat}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}

                                    {/* Directory Table View */}
                                    {leadViewMode === "all" && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <small className="text-muted fw-semibold">
                                                    Page {page} of {lastPage} — Showing {businesses.length} of {totalCount} matching leads
                                                </small>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleSelectAllBusinessesPage();
                                                        }}
                                                    >
                                                        {businesses.length > 0 && businesses.every((b) => selectedMap[b.id])
                                                            ? "Deselect Page"
                                                            : "Select All on Page"}
                                                    </Button>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        type="button"
                                                        onClick={selectAllFilteredLeads}
                                                    >
                                                        <FiCheckSquare className="me-1" />
                                                        Select All {totalCount} Filtered Leads
                                                    </Button>
                                                </div>
                                            </div>

                                            {businesses.length === 0 ? (
                                                <div className="alert alert-warning text-center">No leads matching these filter criteria found.</div>
                                            ) : (
                                                <div className="table-responsive border rounded" style={{ maxHeight: "320px", overflowY: "auto" }}>
                                                    <Table hover size="sm" className="align-middle mb-0">
                                                        <thead className="bg-light sticky-top">
                                                            <tr>
                                                                <th style={{ width: "40px" }}>
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        checked={businesses.length > 0 && businesses.every((b) => selectedMap[b.id])}
                                                                        onChange={toggleSelectAllBusinessesPage}
                                                                    />
                                                                </th>
                                                                <th>Business Name</th>
                                                                <th>Category</th>
                                                                <th>PSI Score</th>
                                                                <th>Screenshot</th>
                                                                <th>Website</th>
                                                                <th>Email</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {businesses.map((biz) => {
                                                                const isSelected = Boolean(selectedMap[biz.id]);
                                                                const psiScore = Number(biz.audit?.mobile_pagespeed || 0);
                                                                const hasShot = Boolean(biz.audit?.mobile_screenshot_path);

                                                                return (
                                                                    <tr
                                                                        key={biz.id}
                                                                        onClick={() => toggleBusiness(biz)}
                                                                        style={{ cursor: "pointer" }}
                                                                        className={isSelected ? "table-active" : ""}
                                                                    >
                                                                        <td onClick={(e) => e.stopPropagation()}>
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={() => toggleBusiness(biz)}
                                                                            />
                                                                        </td>
                                                                        <td className="fw-semibold text-dark">{biz.business_name}</td>
                                                                        <td>
                                                                            <Badge bg="light" text="dark" className="border">
                                                                                {biz.category || "General"}
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            <Badge
                                                                                bg={
                                                                                    psiScore >= 90
                                                                                        ? "success"
                                                                                        : psiScore >= 50
                                                                                        ? "warning"
                                                                                        : psiScore > 0
                                                                                        ? "danger"
                                                                                        : "secondary"
                                                                                }
                                                                                className="px-2 py-1"
                                                                            >
                                                                                {psiScore > 0 ? `${psiScore} / 100` : "Not Audited"}
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            {hasShot ? (
                                                                                <Badge bg="info" className="d-inline-flex align-items-center gap-1">
                                                                                    <FiCamera />
                                                                                    <span>Available</span>
                                                                                </Badge>
                                                                            ) : (
                                                                                <small className="text-muted">-</small>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {biz.website && biz.website !== "-" ? (
                                                                                <small className="text-primary text-truncate d-block" style={{ maxWidth: "140px" }}>
                                                                                    <FiGlobe className="me-1" />
                                                                                    {biz.website}
                                                                                </small>
                                                                            ) : (
                                                                                <small className="text-muted">-</small>
                                                                            )}
                                                                        </td>
                                                                        <td className="text-primary small">{biz.email}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}

                                            {/* Server-Side Pagination Controls */}
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <small className="text-muted">Rows per page:</small>
                                                    <Form.Select
                                                        size="sm"
                                                        style={{ width: "80px" }}
                                                        value={perPage}
                                                        onChange={(e) => {
                                                            setPerPage(Number(e.target.value));
                                                            setPage(1);
                                                        }}
                                                    >
                                                        <option value={15}>15</option>
                                                        <option value={20}>20</option>
                                                        <option value={50}>50</option>
                                                        <option value={100}>100</option>
                                                    </Form.Select>
                                                </div>

                                                <Pagination size="sm" className="mb-0">
                                                    <Pagination.First disabled={page <= 1} onClick={() => setPage(1)} />
                                                    <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                                                    <Pagination.Item active>{page}</Pagination.Item>
                                                    <Pagination.Next disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} />
                                                    <Pagination.Last disabled={page >= lastPage} onClick={() => setPage(lastPage)} />
                                                </Pagination>
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected Target Leads View */}
                                    {leadViewMode === "selected" && (
                                        <div>
                                            {selectedList.length === 0 ? (
                                                <div className="alert alert-info text-center py-4">
                                                    No target leads selected yet. Switch to the <strong>Lead Directory</strong> tab to select leads across any page.
                                                </div>
                                            ) : (
                                                <div className="table-responsive border rounded" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                                    <Table hover size="sm" className="align-middle mb-0">
                                                        <thead className="bg-light sticky-top">
                                                            <tr>
                                                                <th>Business Name</th>
                                                                <th>Category</th>
                                                                <th>Website</th>
                                                                <th>Email</th>
                                                                <th className="text-end" style={{ width: "90px" }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedList.map((biz) => (
                                                                <tr key={biz.id}>
                                                                    <td className="fw-semibold text-dark">{biz.business_name}</td>
                                                                    <td>
                                                                        <Badge bg="light" text="dark" className="border">
                                                                            {biz.category || "General"}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>
                                                                        {biz.website && biz.website !== "-" ? (
                                                                            <small className="text-primary text-truncate d-block" style={{ maxWidth: "150px" }}>
                                                                                {biz.website}
                                                                            </small>
                                                                        ) : (
                                                                            <small className="text-muted">-</small>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-primary small">{biz.email}</td>
                                                                    <td className="text-end">
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            onClick={() => removeSelectedBusiness(biz.id)}
                                                                            title="Remove lead from campaign target list"
                                                                        >
                                                                            <FiTrash2 />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}
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
                                            <li className="mb-1"><strong>Target Leads:</strong> {selectedIds.length} lead(s)</li>
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
