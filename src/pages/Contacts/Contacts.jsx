import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table, Modal } from "react-bootstrap";
import { FiBookOpen, FiPlus, FiTrash2, FiEdit3, FiEye, FiUsers, FiSearch, FiCheckCircle, FiXCircle, FiFilter } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import {
    getContactLists,
    createContactList,
    updateContactList,
    deleteContactList,
    getContactListLeads,
    removeLeadFromContactList,
} from "../../api/contactLists";
import { getBusinesses, getBusinessCategories, getBusinessCountries } from "../../api/business";

export default function Contacts() {
    const navigate = useNavigate();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [search, setSearch] = useState("");

    // Create / Edit List Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingList, setEditingList] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");

    // Lead Filter Toolbar for Create List
    const [filterSearch, setFilterSearch] = useState("");
    const [filterPsi, setFilterPsi] = useState("");
    const [filterScreenshot, setFilterScreenshot] = useState("");
    const [filterWebsite, setFilterWebsite] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterCountry, setFilterCountry] = useState("");

    const [matchingCount, setMatchingCount] = useState(0);
    const [checkingMatching, setCheckingMatching] = useState(false);

    // View Leads Modal State
    const [selectedListForView, setSelectedListForView] = useState(null);
    const [viewLeads, setViewLeads] = useState([]);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewPagination, setViewPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [viewSearch, setViewSearch] = useState("");

    useEffect(() => {
        loadContactLists(1);
    }, [search]);

    const loadContactLists = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getContactLists({ page, search });
            const pData = res.data.data;
            setLists(pData.data || []);
            setPagination({
                current_page: pData.current_page || 1,
                last_page: pData.last_page || 1,
                total: pData.total || 0,
            });
        } catch (err) {
            toast.error("Failed to load contact lists");
        } finally {
            setLoading(false);
        }
    };

    // Calculate matching leads when filters change in Create Modal
    useEffect(() => {
        if (showCreateModal && !editingList) {
            checkMatchingLeads();
        }
    }, [showCreateModal, filterSearch, filterPsi, filterScreenshot, filterWebsite, filterCategory, filterCountry]);

    const checkMatchingLeads = async () => {
        try {
            setCheckingMatching(true);
            const res = await getBusinesses({
                search: filterSearch,
                psi_filter: filterPsi,
                has_screenshot: filterScreenshot,
                has_website: filterWebsite,
                category: filterCategory,
                country: filterCountry,
                per_page: 1,
            });
            setMatchingCount(res.data.data?.total || 0);
        } catch (err) {
            console.error("Failed to check matching leads", err);
        } finally {
            setCheckingMatching(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingList(null);
        setFormName("");
        setFormDesc("");
        setFilterSearch("");
        setFilterPsi("");
        setFilterScreenshot("");
        setFilterWebsite("");
        setFilterCategory("");
        setFilterCountry("");
        setShowCreateModal(true);
    };

    const handleOpenEdit = (list) => {
        setEditingList(list);
        setFormName(list.name);
        setFormDesc(list.description || "");
        setShowCreateModal(true);
    };

    const handleSaveList = async (e) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error("Contact list name is required");
            return;
        }

        try {
            setSubmitting(true);
            if (editingList) {
                await updateContactList(editingList.id, {
                    name: formName,
                    description: formDesc,
                });
                toast.success("Contact list updated successfully!");
            } else {
                const payload = {
                    name: formName,
                    description: formDesc,
                    filter_criteria: {
                        search: filterSearch,
                        psi_filter: filterPsi,
                        has_screenshot: filterScreenshot,
                        has_website: filterWebsite,
                        category: filterCategory,
                        country: filterCountry,
                    },
                };
                const res = await createContactList(payload);
                toast.success(`Contact list '${res.data.data.name}' created with ${res.data.data.total_contacts} leads!`);
            }
            setShowCreateModal(false);
            loadContactLists(1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save contact list");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteList = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete contact list '${name}'?`)) {
            return;
        }
        try {
            await deleteContactList(id);
            toast.success("Contact list deleted!");
            loadContactLists(pagination.current_page);
        } catch (err) {
            toast.error("Failed to delete contact list");
        }
    };

    // Open View Leads Modal
    const handleOpenViewLeads = async (list, page = 1) => {
        setSelectedListForView(list);
        try {
            setViewLoading(true);
            const res = await getContactListLeads(list.id, { page, search: viewSearch });
            const pData = res.data.data;
            setViewLeads(pData.data || []);
            setViewPagination({
                current_page: pData.current_page || 1,
                last_page: pData.last_page || 1,
                total: pData.total || 0,
            });
        } catch (err) {
            toast.error("Failed to load list leads");
        } finally {
            setViewLoading(false);
        }
    };

    const handleRemoveLeadFromList = async (businessId) => {
        if (!selectedListForView) return;
        try {
            await removeLeadFromContactList(selectedListForView.id, businessId);
            toast.success("Lead removed from contact list");
            handleOpenViewLeads(selectedListForView, viewPagination.current_page);
            loadContactLists(pagination.current_page);
        } catch (err) {
            toast.error("Failed to remove lead");
        }
    };

    return (
        <DashboardLayout title="Contacts">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                        <FiBookOpen className="text-primary" />
                        <span>Contact Segment Lists</span>
                    </h3>
                    <p className="text-muted m-0 small">
                        Organize your leads into custom segmented contact lists (e.g. content-need-contact, seo-service-needed) and import them cleanly into campaigns.
                    </p>
                </div>
                <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
                    <FiPlus />
                    <span>Create Contact List</span>
                </Button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <FiSearch className="text-muted" />
                                </span>
                                <Form.Control
                                    type="text"
                                    placeholder="Search contact lists..."
                                    className="border-start-0"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2">Loading contact lists...</p>
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-3">
                            <FiBookOpen size={40} className="text-muted mb-2" />
                            <h5 className="fw-bold text-dark">No Contact Lists Found</h5>
                            <p className="text-muted small">Create custom target segment lists to group leads for your campaigns.</p>
                            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                                + Create First Contact List
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover align="middle" className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>LIST NAME</th>
                                        <th>DESCRIPTION</th>
                                        <th>TOTAL CONTACTS</th>
                                        <th>CREATED AT</th>
                                        <th className="text-end">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lists.map((list) => (
                                        <tr key={list.id}>
                                            <td>
                                                <div
                                                    className="fw-bold text-primary fs-6 cursor-pointer"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => navigate(`/contacts/${list.id}`)}
                                                >
                                                    {list.name}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-muted small">{list.description || "No description provided."}</span>
                                            </td>
                                            <td>
                                                <Badge bg="info" className="px-3 py-2 fs-7 rounded-pill">
                                                    <FiUsers className="me-1" /> {list.total_contacts || 0} Contacts
                                                </Badge>
                                            </td>
                                            <td>
                                                <small className="text-muted">{new Date(list.created_at).toLocaleDateString()}</small>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/contacts/${list.id}`)}
                                                        className="d-inline-flex align-items-center gap-1"
                                                    >
                                                        <FiEye size={14} />
                                                        <span>View Contacts</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(list)}
                                                    >
                                                        <FiEdit3 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteList(list.id, list.name)}
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {!loading && lists.length > 0 && (
                <Pagination pagination={pagination} onPageChange={(p) => loadContactLists(p)} />
            )}

            {/* Create / Edit Contact List Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                        <FiBookOpen className="text-primary" />
                        <span>{editingList ? `Edit Contact List: ${editingList.name}` : "Create New Contact List"}</span>
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveList}>
                    <Modal.Body className="p-4">
                        <Row className="g-3 mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-bold small">Contact List Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. content-need-contact, optimization-service-needed"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        required
                                    />
                                    <Form.Text className="text-muted small">Choose a clear name to identify this lead segment during campaign creation.</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-bold small">Description (Optional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Leads filtered with PSI < 70 requiring website speed optimization..."
                                        value={formDesc}
                                        onChange={(e) => setFormDesc(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {!editingList && (
                            <Card className="border p-3 bg-light rounded-3">
                                <div className="d-flex align-items-center gap-2 mb-2 text-dark fw-bold">
                                    <FiFilter className="text-primary" />
                                    <span>Filter Database Leads to Attach to this List</span>
                                </div>
                                <p className="text-muted small mb-3">
                                    Set your filter criteria below. All matching leads from your database will automatically be populated into this contact list.
                                </p>

                                <Row className="g-2 mb-3">
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Search Keyword</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder="Name, email, website..."
                                            value={filterSearch}
                                            onChange={(e) => setFilterSearch(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">PageSpeed Score</Form.Label>
                                        <Form.Select size="sm" value={filterPsi} onChange={(e) => setFilterPsi(e.target.value)}>
                                            <option value="">All PageSpeed Scores</option>
                                            <option value="less_30">🔴 Very Poor (&lt; 30)</option>
                                            <option value="less_50">🔴 Poor Score (&lt; 50)</option>
                                            <option value="less_70">🟠 Below Average (&lt; 70)</option>
                                            <option value="less_90">🟠 Needs Improvement (&lt; 90)</option>
                                            <option value="between_50_89">🟡 Moderate (50 - 89)</option>
                                            <option value="good_90">🟢 Good Score (≥ 90)</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Has Screenshot</Form.Label>
                                        <Form.Select size="sm" value={filterScreenshot} onChange={(e) => setFilterScreenshot(e.target.value)}>
                                            <option value="">Any</option>
                                            <option value="yes">Must Have Screenshot</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Has Website</Form.Label>
                                        <Form.Select size="sm" value={filterWebsite} onChange={(e) => setFilterWebsite(e.target.value)}>
                                            <option value="">Any</option>
                                            <option value="yes">Must Have Website</option>
                                            <option value="no">No Website Only</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Category Filter</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder="e.g. Plumber, Agency"
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label className="small fw-semibold mb-1">Country Filter</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder="e.g. USA, US, India"
                                            value={filterCountry}
                                            onChange={(e) => setFilterCountry(e.target.value)}
                                        />
                                    </Col>
                                </Row>

                                <div className="p-2 bg-white rounded border d-flex align-items-center justify-content-between">
                                    <span className="small text-muted">Matching Leads Ready to Import:</span>
                                    {checkingMatching ? (
                                        <Spinner size="sm" animation="border" variant="primary" />
                                    ) : (
                                        <Badge bg="success" className="fs-6 px-3 py-1">
                                            {matchingCount} Matching Leads
                                        </Badge>
                                    )}
                                </div>
                            </Card>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : editingList ? "Update Contact List" : "Create & Attach Leads"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* View Contacts in List Modal */}
            <Modal show={Boolean(selectedListForView)} onHide={() => setSelectedListForView(null)} size="xl" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                        <FiUsers className="text-primary" />
                        <span>Contacts in '{selectedListForView?.name}' ({viewPagination.total})</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="row g-2 mb-3">
                        <div className="col-md-5">
                            <Form.Control
                                size="sm"
                                type="text"
                                placeholder="Search leads in this list..."
                                value={viewSearch}
                                onChange={(e) => {
                                    setViewSearch(e.target.value);
                                    if (selectedListForView) handleOpenViewLeads(selectedListForView, 1);
                                }}
                            />
                        </div>
                    </div>

                    {viewLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : viewLeads.length === 0 ? (
                        <div className="text-center py-4 text-muted">No contacts found in this list.</div>
                    ) : (
                        <div className="table-responsive">
                            <Table size="sm" hover align="middle">
                                <thead>
                                    <tr>
                                        <th>BUSINESS NAME</th>
                                        <th>CATEGORY</th>
                                        <th>PSI SCORE</th>
                                        <th>WEBSITE</th>
                                        <th>EMAIL</th>
                                        <th className="text-end">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewLeads.map((biz) => (
                                        <tr key={biz.id}>
                                            <td className="fw-bold">{biz.business_name}</td>
                                            <td><Badge bg="light" text="dark" className="border">{biz.category || "-"}</Badge></td>
                                            <td>
                                                {biz.audit?.mobile_pagespeed > 0 ? (
                                                    <Badge bg={biz.audit.mobile_pagespeed >= 90 ? "success" : biz.audit.mobile_pagespeed >= 50 ? "warning" : "danger"}>
                                                        {biz.audit.mobile_pagespeed} / 100
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted small">-</span>
                                                )}
                                            </td>
                                            <td><small className="text-primary">{biz.website || "-"}</small></td>
                                            <td><span className="fw-semibold text-dark">{biz.email}</span></td>
                                            <td className="text-end">
                                                <Button variant="outline-danger" size="sm" onClick={() => handleRemoveLeadFromList(biz.id)}>
                                                    <FiTrash2 size={12} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!viewLoading && viewLeads.length > 0 && (
                        <div className="me-auto">
                            <Pagination pagination={viewPagination} onPageChange={(p) => handleOpenViewLeads(selectedListForView, p)} />
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => setSelectedListForView(null)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </DashboardLayout>
    );
}
