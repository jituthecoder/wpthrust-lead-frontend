import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Badge, Card, Table, Pagination } from "react-bootstrap";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import { FiPlus, FiCamera, FiGlobe, FiZap, FiTrash2, FiCheckCircle, FiList, FiCheckSquare, FiBookOpen, FiUsers } from "react-icons/fi";
import { createEmailCampaign, updateEmailCampaign, getEmailCampaign } from "../../../api/emailCampaigns";
import { getEmailTemplates } from "../../../api/emailTemplates";
import { getEmailSenders } from "../../../api/emailSenders";
import { getBusinesses, getBusinessCategories, getBusinessCountries } from "../../../api/business";
import { getContactLists, getContactListLeads } from "../../../api/contactLists";
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
    const [countries, setCountries] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Contact Lists state for Hunter.io style selection
    const [savedContactLists, setSavedContactLists] = useState([]);
    const [loadingContactLists, setLoadingContactLists] = useState(false);
    const [selectedContactListId, setSelectedContactListId] = useState(null);
    const [selectedContactListName, setSelectedContactListName] = useState(null);
    const [selectedContactListTotal, setSelectedContactListTotal] = useState(0);

    // View Mode tab in Step 4: "contact_list", "all", or "selected"
    const [leadViewMode, setLeadViewMode] = useState("contact_list");

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
    const [countryFilter, setCountryFilter] = useState("");

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

    // Multi-Step Follow-ups and Auto-Sync State
    const [sequenceSteps, setSequenceSteps] = useState([]);
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
    const [autoSyncCriteria, setAutoSyncCriteria] = useState({
        has_website: "",
        has_screenshot: "",
        psi_filter: "",
        category: "",
        country: "",
    });

    useEffect(() => {
        if (show) {
            setStep(1);
            setLeadViewMode("all");
            setPage(1);
            setSelectedMap({});
            loadAllOptions();

            const populateCampaignData = (cmp) => {
                setFormData({
                    name: cmp.name || "",
                    description: cmp.description || "",
                    email_template_id: cmp.email_template_id || "",
                    scheduled_at: cmp.scheduled_at ? cmp.scheduled_at.slice(0, 16) : "",
                    senders: cmp.senders ? cmp.senders.map((s) => s.email_sender_id) : [],
                });
                setAutoSyncEnabled(Boolean(cmp.auto_sync_enabled));
                setAutoSyncCriteria(cmp.auto_sync_criteria || {
                    has_website: "",
                    has_screenshot: "",
                    psi_filter: "",
                    category: "",
                    country: "",
                });

                const steps = cmp.sequence_steps || cmp.sequenceSteps || [];
                if (steps && steps.length > 1) {
                    const followups = steps.filter((s) => s.step_number > 1).map((s) => ({
                        delay_days: s.delay_days || 2,
                        condition: s.condition || "always",
                        email_template_id: s.email_template_id || cmp.email_template_id,
                    }));
                    setSequenceSteps(followups);
                } else {
                    setSequenceSteps([]);
                }

                // Clear selectedMap so leads are not loaded or sent when editing
                setSelectedMap({});
            };

            if (campaign) {
                populateCampaignData(campaign);
                // Fetch full fresh campaign details from API
                getEmailCampaign(campaign.id)
                    .then((res) => {
                        if (res.data?.data) {
                            populateCampaignData(res.data.data);
                        }
                    })
                    .catch(() => {});
            } else {
                setFormData({
                    name: "",
                    description: "",
                    email_template_id: "",
                    scheduled_at: "",
                    senders: [],
                });
                setSequenceSteps([]);
                setAutoSyncEnabled(false);
                setAutoSyncCriteria({
                    has_website: "",
                    has_screenshot: "",
                    psi_filter: "",
                    category: "",
                });
            }
        }
    }, [show, campaign]);

    useEffect(() => {
        if (show && step === 4) {
            loadLeadsFiltered();
        }
    }, [show, step, page, perPage, businessSearch, psiFilter, hasScreenshot, hasWebsite, categoryFilter, countryFilter]);

    const loadAllOptions = async () => {
        try {
            setLoadingOptions(true);
            const [tplRes, senderRes, catRes, countryRes] = await Promise.all([
                getEmailTemplates({ status: "published" }),
                getEmailSenders(),
                getBusinessCategories(),
                getBusinessCountries(),
            ]);
            setTemplates(tplRes.data.data?.data || tplRes.data.data || []);
            setSenders(senderRes.data.data?.data || senderRes.data.data || []);
            setCategories(catRes.data.data || []);
            setCountries(countryRes.data.data || []);
            await Promise.all([loadLeadsFiltered(), loadSavedContactLists()]);
        } catch (error) {
            console.error("Failed to load campaign options", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const loadSavedContactLists = async () => {
        try {
            setLoadingContactLists(true);
            const res = await getContactLists({ per_page: 100 });
            setSavedContactLists(res.data.data?.data || []);
        } catch (err) {
            console.error("Failed to load saved contact lists", err);
        } finally {
            setLoadingContactLists(false);
        }
    };

    const handleSelectContactList = (list) => {
        if (selectedContactListId === list.id) {
            // Deselect list
            setSelectedContactListId(null);
            setSelectedContactListName(null);
            setSelectedContactListTotal(0);
            toast.success(`Deselected contact list '${list.name}'`);
        } else {
            setSelectedContactListId(list.id);
            setSelectedContactListName(list.name);
            setSelectedContactListTotal(list.total_contacts || 0);
            setSelectedMap({}); // Clear manual business selections
            toast.success(`Selected contact list '${list.name}' (${list.total_contacts || 0} contacts)!`);
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
                country: countryFilter,
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

        const maxStep = isEdit ? 4 : 5;

        if (step !== maxStep) {
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
        if (!isEdit && !selectedContactListId && selectedIds.length === 0 && !autoSyncEnabled) {
            toast.error("Please select a contact list, target business leads, or enable auto-sync.");
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
                sequence_steps: sequenceSteps,
                auto_sync_enabled: autoSyncEnabled,
                auto_sync_criteria: autoSyncCriteria,
            };

            // Attach contact_list_id OR businesses array when creating a new campaign.
            if (!isEdit) {
                if (selectedContactListId) {
                    payload.contact_list_id = selectedContactListId;
                } else if (selectedIds.length > 0) {
                    payload.businesses = selectedIds;
                }
            }

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

    const maxStep = isEdit ? 4 : 5;
    const stepItems = isEdit
        ? [
            { num: 1, label: "Basic Info" },
            { num: 2, label: "Template" },
            { num: 3, label: "Senders" },
            { num: 4, label: "Schedule & Save" },
          ]
        : [
            { num: 1, label: "Basic Info" },
            { num: 2, label: "Template" },
            { num: 3, label: "Senders" },
            { num: 4, label: "Target Leads" },
            { num: 5, label: "Schedule & Launch" },
          ];

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">
                    {isEdit ? `Edit Campaign: ${campaign?.name}` : "Create New Email Campaign"}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && step < maxStep) e.preventDefault(); }}>
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
                                {stepItems.map((s) => (
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
                                                onClick={handleGoogleOAuthRedirect}
                                            >
                                                <FcGoogle size={18} />
                                                <span>Sign in with Google</span>
                                            </Button>

                                            <Button
                                                variant="light"
                                                type="button"
                                                className="d-flex align-items-center gap-2 px-3 py-2 border shadow-sm fw-semibold text-dark bg-white"
                                                onClick={handleMicrosoftOAuthRedirect}
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

                            {/* Step 4: Target Leads (New Campaign Only) */}
                            {!isEdit && step === 4 && (
                                <div>
                                     {/* View Mode Selector Tabs */}
                                     <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                         <div className="btn-group">
                                             <Button
                                                 variant={leadViewMode === "contact_list" ? "info" : "outline-info"}
                                                 size="sm"
                                                 onClick={() => {
                                                     setLeadViewMode("contact_list");
                                                     loadSavedContactLists();
                                                 }}
                                                 className="d-flex align-items-center gap-2"
                                             >
                                                 <FiBookOpen />
                                                 <span>Select Saved Contact List</span>
                                             </Button>
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
                                                  <span>Selected Target Leads ({selectedContactListId ? selectedContactListTotal : selectedIds.length})</span>
                                             </Button>
                                         </div>

                                         {leadViewMode === "selected" && selectedIds.length > 0 && (
                                             <Button variant="outline-danger" size="sm" onClick={clearAllSelectedBusinesses}>
                                                 Clear All Selected
                                             </Button>
                                         )}
                                     </div>

                                     {/* Contact List View Mode (Hunter.io Style List Selection) */}
                                     {leadViewMode === "contact_list" && (
                                         <div className="p-3 bg-light rounded border mb-3">
                                             <div className="d-flex justify-content-between align-items-center mb-2">
                                                 <div>
                                                     <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                                         <FiBookOpen className="text-info" />
                                                         <span>Select a Lead Contact List to add Recipients</span>
                                                     </h6>
                                                     <small className="text-muted">
                                                         Choose a segmented contact list to import its contacts directly into this campaign.
                                                     </small>
                                                 </div>
                                             </div>

                                             {loadingContactLists ? (
                                                 <div className="text-center py-4">
                                                     <Spinner animation="border" variant="info" />
                                                 </div>
                                             ) : savedContactLists.length === 0 ? (
                                                 <div className="text-center py-4 bg-white rounded border text-muted">
                                                     <FiBookOpen size={32} className="mb-2 text-muted" />
                                                     <h6>No Saved Contact Lists Found</h6>
                                                     <small>Go to <strong>Contacts</strong> in the main left sidebar to create custom segment lists.</small>
                                                 </div>
                                             ) : (
                                                 <Row className="g-3">
                                                     {savedContactLists.map((list) => {
                                                         const isSelected = selectedContactListId === list.id;
                                                         return (
                                                             <Col key={list.id} md={6}>
                                                                 <Card
                                                                     className={`border shadow-sm h-100 ${isSelected ? "border-info bg-white" : ""}`}
                                                                 >
                                                                     <Card.Body className="d-flex flex-column justify-content-between p-3">
                                                                         <div>
                                                                             <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                 <h6 className="fw-bold text-primary mb-0">{list.name}</h6>
                                                                                 <Badge bg="info" className="px-2 py-1">
                                                                                     <FiUsers className="me-1" /> {list.total_contacts || 0} Contacts
                                                                                 </Badge>
                                                                             </div>
                                                                             <p className="text-muted small mb-3">
                                                                                 {list.description || "Segmented contact list."}
                                                                             </p>
                                                                         </div>

                                                                         <Button
                                                                             variant={isSelected ? "success" : "outline-primary"}
                                                                             size="sm"
                                                                             className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                                                             onClick={() => handleSelectContactList(list)}
                                                                             disabled={(list.total_contacts || 0) === 0}
                                                                         >
                                                                             {isSelected ? (
                                                                                 <>
                                                                                     <FiCheckCircle />
                                                                                     <span>Selected List ({list.total_contacts} Contacts)</span>
                                                                                 </>
                                                                             ) : (
                                                                                 <>
                                                                                     <FiPlus />
                                                                                     <span>Select List ({list.total_contacts} Contacts)</span>
                                                                                 </>
                                                                             )}
                                                                         </Button>
                                                                     </Card.Body>
                                                                 </Card>
                                                             </Col>
                                                         );
                                                     })}
                                                 </Row>
                                             )}
                                         </div>
                                     )}

                                    {/* Advanced Filter Toolbar (Shown in Directory View Mode) */}
                                    {leadViewMode === "all" && (
                                        <div className="bg-light p-3 rounded border mb-3">
                                            <Row className="g-2">
                                                <Col md={2}>
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
                                                    <Form.Control
                                                        type="text"
                                                        size="sm"
                                                        placeholder="Country (e.g. USA, US...)"
                                                        value={countryFilter}
                                                        onChange={(e) => {
                                                            setCountryFilter(e.target.value);
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
                                                        <option value="">All PageSpeed Scores</option>
                                                        <option value="less_30">🔴 Very Poor (&lt; 30)</option>
                                                        <option value="less_50">🔴 Poor Score (&lt; 50)</option>
                                                        <option value="less_70">🟠 Below Average (&lt; 70)</option>
                                                        <option value="less_90">🟠 Needs Improvement (&lt; 90)</option>
                                                        <option value="between_50_89">🟡 Moderate (50 - 89)</option>
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
                                                <Col md={2}>
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

                            {/* Step 4 for Edit, or Step 5 for New: Schedule & Review */}
                            {((isEdit && step === 4) || (!isEdit && step === 5)) && (
                                <div>
                                    <h6 className="fw-bold mb-3 text-dark">Campaign Sequence & Launch Settings</h6>

                                    {/* 1. Sequence Builder */}
                                    <Card className="border-0 bg-light p-3 mb-4 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <h6 className="fw-bold mb-0 text-dark">Conditional Multi-Step Sequence</h6>
                                                <small className="text-muted">Set up automated follow-ups based on recipient actions.</small>
                                            </div>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setSequenceSteps([
                                                    ...sequenceSteps,
                                                    { delay_days: 2, condition: "if_opened", email_template_id: formData.email_template_id }
                                                ])}
                                            >
                                                + Add Follow-up Step
                                            </Button>
                                        </div>

                                        {/* Step 1 Display */}
                                        <div className="bg-white p-2 border rounded mb-2 d-flex align-items-center justify-content-between">
                                            <div>
                                                <span className="badge bg-primary me-2">Step 1</span>
                                                <strong className="small">Initial Email</strong>
                                                <span className="text-muted small ms-2">
                                                    (Template: {templates.find((t) => String(t.id) === String(formData.email_template_id))?.name || "Selected Template"})
                                                </span>
                                            </div>
                                            <span className="badge bg-light text-dark border">Dispatched Immediately</span>
                                        </div>

                                        {/* Additional Sequence Steps */}
                                        {sequenceSteps.map((seqStep, idx) => (
                                            <Card key={idx} className="border p-3 mb-2 bg-white">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="badge bg-info text-dark fw-bold">Step {idx + 2} Follow-up</span>
                                                    <Button
                                                        variant="link"
                                                        className="text-danger p-0 small"
                                                        onClick={() => setSequenceSteps(sequenceSteps.filter((_, i) => i !== idx))}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                <Row className="g-2">
                                                    <Col md={3}>
                                                        <Form.Label className="small fw-semibold mb-1">Send Delay</Form.Label>
                                                        <Form.Select
                                                            size="sm"
                                                            value={seqStep.delay_days}
                                                            onChange={(e) => {
                                                                const updated = [...sequenceSteps];
                                                                updated[idx].delay_days = parseInt(e.target.value, 10);
                                                                setSequenceSteps(updated);
                                                            }}
                                                        >
                                                            <option value={1}>1 Day After</option>
                                                            <option value={2}>2 Days After</option>
                                                            <option value={3}>3 Days After</option>
                                                            <option value={4}>4 Days After</option>
                                                            <option value={5}>5 Days After</option>
                                                            <option value={6}>6 Days After</option>
                                                            <option value={7}>7 Days After</option>
                                                            <option value={9}>9 Days After</option>
                                                            <option value={10}>10 Days After</option>
                                                            <option value={14}>14 Days After (2 Weeks)</option>
                                                            <option value={21}>21 Days After (3 Weeks)</option>
                                                            <option value={30}>30 Days After (1 Month)</option>
                                                        </Form.Select>
                                                    </Col>
                                                    <Col md={4}>
                                                        <Form.Label className="small fw-semibold mb-1">Condition Rule</Form.Label>
                                                        <Form.Select
                                                            size="sm"
                                                            value={seqStep.condition}
                                                            onChange={(e) => {
                                                                const updated = [...sequenceSteps];
                                                                updated[idx].condition = e.target.value;
                                                                setSequenceSteps(updated);
                                                            }}
                                                        >
                                                            <option value="always">Always Send</option>
                                                            <option value="if_opened">If Email Opened</option>
                                                            <option value="if_not_opened">If Email NOT Opened</option>
                                                            <option value="if_clicked">If Link Clicked</option>
                                                            <option value="if_not_clicked">If Link NOT Clicked</option>
                                                        </Form.Select>
                                                    </Col>
                                                    <Col md={5}>
                                                        <Form.Label className="small fw-semibold mb-1">Follow-up Template</Form.Label>
                                                        <Form.Select
                                                            size="sm"
                                                            value={seqStep.email_template_id}
                                                            onChange={(e) => {
                                                                const updated = [...sequenceSteps];
                                                                updated[idx].email_template_id = e.target.value;
                                                                setSequenceSteps(updated);
                                                            }}
                                                        >
                                                            {templates.map((t) => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        ))}
                                    </Card>

                                    {/* 2. Auto-Sync New Leads */}
                                    <Card className="border-0 bg-light p-3 mb-4 shadow-sm">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <div>
                                                <h6 className="fw-bold mb-0 text-dark">Dynamic Lead Auto-Sync</h6>
                                                <small className="text-muted">Automatically add newly imported leads to this campaign if they match criteria.</small>
                                            </div>
                                            <Form.Check
                                                type="switch"
                                                id="auto-sync-switch"
                                                checked={autoSyncEnabled}
                                                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                                            />
                                        </div>

                                        {autoSyncEnabled && (
                                            <Row className="g-2 mt-2 pt-2 border-top">
                                                <Col md={3}>
                                                    <Form.Label className="small fw-semibold mb-1">Has Website</Form.Label>
                                                    <Form.Select
                                                        size="sm"
                                                        value={autoSyncCriteria.has_website}
                                                        onChange={(e) => setAutoSyncCriteria({ ...autoSyncCriteria, has_website: e.target.value })}
                                                    >
                                                        <option value="">Any (With or Without)</option>
                                                        <option value="yes">Must Have Website</option>
                                                        <option value="no">No Website Only</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Label className="small fw-semibold mb-1">Has Screenshot</Form.Label>
                                                    <Form.Select
                                                        size="sm"
                                                        value={autoSyncCriteria.has_screenshot}
                                                        onChange={(e) => setAutoSyncCriteria({ ...autoSyncCriteria, has_screenshot: e.target.value })}
                                                    >
                                                        <option value="">Any</option>
                                                        <option value="yes">Must Have Screenshot</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Label className="small fw-semibold mb-1">PageSpeed Score</Form.Label>
                                                    <Form.Select
                                                        size="sm"
                                                        value={autoSyncCriteria.psi_filter}
                                                        onChange={(e) => setAutoSyncCriteria({ ...autoSyncCriteria, psi_filter: e.target.value })}
                                                    >
                                                        <option value="">All PageSpeed Scores</option>
                                                        <option value="less_30">🔴 Very Poor (&lt; 30)</option>
                                                        <option value="less_50">🔴 Poor Score (&lt; 50)</option>
                                                        <option value="less_70">🟠 Below Average (&lt; 70)</option>
                                                        <option value="less_90">🟠 Needs Improvement (&lt; 90)</option>
                                                        <option value="between_50_89">🟡 Moderate (50 - 89)</option>
                                                        <option value="good_90">🟢 Good Score (≥ 90)</option>
                                                        <option value="not_audited">⚪ Not Audited Yet</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Label className="small fw-semibold mb-1">Category Filter</Form.Label>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="e.g. Plumber"
                                                        value={autoSyncCriteria.category || ""}
                                                        onChange={(e) => setAutoSyncCriteria({ ...autoSyncCriteria, category: e.target.value })}
                                                    />
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Label className="small fw-semibold mb-1">Country Filter</Form.Label>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="e.g. USA, US, India"
                                                        value={autoSyncCriteria.country || ""}
                                                        onChange={(e) => setAutoSyncCriteria({ ...autoSyncCriteria, country: e.target.value })}
                                                    />
                                                </Col>
                                            </Row>
                                        )}
                                    </Card>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold small">Scheduled Start Time (Optional)</Form.Label>
                                        <Form.Control
                                            type="datetime-local"
                                            value={formData.scheduled_at}
                                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        />
                                        <Form.Text className="text-muted small">Leave blank to save as Draft and start manually.</Form.Text>
                                    </Form.Group>
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
                    {step < maxStep ? (
                        <Button
                            variant="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setStep((s) => Math.min(s + 1, maxStep));
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
