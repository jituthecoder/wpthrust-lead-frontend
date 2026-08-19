import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table, Modal } from "react-bootstrap";
import {
    FiArrowLeft,
    FiUsers,
    FiSearch,
    FiTrash2,
    FiPlus,
    FiGlobe,
    FiBookOpen,
    FiDownload,
    FiUpload,
    FiEdit3,
} from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import {
    getContactList,
    getContactListLeads,
    removeLeadFromContactList,
    exportContactList,
    addManualContact,
    importContactCsv,
    updateContactLead,
} from "../../api/contactLists";

export default function ContactDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [list, setList] = useState(null);
    const [loadingList, setLoadingList] = useState(true);

    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [search, setSearch] = useState("");

    // Add Manual Contact Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({
        business_name: "",
        email: "",
        website: "",
        phone: "",
        category: "",
        country: "",
        mobile_pagespeed: "",
        notes: "",
    });
    const [submittingAdd, setSubmittingAdd] = useState(false);

    // Edit Contact Modal
    const [editingContact, setEditingContact] = useState(null);
    const [editForm, setEditForm] = useState({
        business_name: "",
        email: "",
        website: "",
        phone: "",
        category: "",
        country: "",
        mobile_pagespeed: "",
        notes: "",
    });
    const [submittingEdit, setSubmittingEdit] = useState(false);

    // Import CSV Modal
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [submittingCsv, setSubmittingCsv] = useState(false);

    useEffect(() => {
        if (id) {
            loadListDetails();
            loadListLeads(1);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadListLeads(1);
        }
    }, [search]);

    const loadListDetails = async () => {
        try {
            setLoadingList(true);
            const res = await getContactList(id);
            setList(res.data.data);
        } catch (err) {
            toast.error("Failed to load contact list details");
        } finally {
            setLoadingList(false);
        }
    };

    const loadListLeads = async (page = 1) => {
        try {
            setLoadingLeads(true);
            const res = await getContactListLeads(id, { page, search });
            const pData = res.data.data;
            setLeads(pData.data || []);
            setPagination({
                current_page: pData.current_page || 1,
                last_page: pData.last_page || 1,
                total: pData.total || 0,
            });
        } catch (err) {
            toast.error("Failed to load list contacts");
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.loading("Preparing CSV export...", { id: "export" });
            const res = await exportContactList(id);
            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `contacts_${list?.name ? list.name.replace(/\s+/g, "_") : "list"}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success("Contacts exported successfully!", { id: "export" });
        } catch (err) {
            toast.error("Failed to export contacts", { id: "export" });
        }
    };

    const handleAddManualContact = async (e) => {
        e.preventDefault();
        if (!addForm.business_name || !addForm.email) {
            toast.error("Business name and email are required");
            return;
        }

        try {
            setSubmittingAdd(true);
            await addManualContact(id, addForm);
            toast.success("Private contact added to list!");
            setShowAddModal(false);
            setAddForm({
                business_name: "",
                email: "",
                website: "",
                phone: "",
                category: "",
                country: "",
                mobile_pagespeed: "",
                notes: "",
            });
            loadListLeads(1);
            loadListDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add contact");
        } finally {
            setSubmittingAdd(false);
        }
    };

    const handleOpenEdit = (contact) => {
        setEditingContact(contact);
        setEditForm({
            business_name: contact.business_name || "",
            email: contact.email || "",
            website: contact.website || "",
            phone: contact.phone || "",
            category: contact.category || "",
            country: contact.country || "",
            mobile_pagespeed: contact.mobile_pagespeed ?? "",
            notes: contact.notes || "",
        });
    };

    const handleSaveEditContact = async (e) => {
        e.preventDefault();
        if (!editingContact) return;

        try {
            setSubmittingEdit(true);
            await updateContactLead(id, editingContact.id, editForm);
            toast.success("Contact details updated in list!");
            setEditingContact(null);
            loadListLeads(pagination.current_page);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update contact");
        } finally {
            setSubmittingEdit(false);
        }
    };

    const handleImportCsvSubmit = async (e) => {
        e.preventDefault();
        if (!csvFile) {
            toast.error("Please select a CSV file to upload");
            return;
        }

        try {
            setSubmittingCsv(true);
            const formData = new FormData();
            formData.append("file", csvFile);

            const res = await importContactCsv(id, formData);
            toast.success(res.data.message || "CSV contacts imported successfully!");
            setShowImportModal(false);
            setCsvFile(null);
            loadListLeads(1);
            loadListDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to import CSV");
        } finally {
            setSubmittingCsv(false);
        }
    };

    const handleRemoveLead = async (contactLeadId, businessName) => {
        if (!window.confirm(`Are you sure you want to remove '${businessName}' from this contact list?`)) {
            return;
        }
        try {
            await removeLeadFromContactList(id, contactLeadId);
            toast.success("Contact removed from list!");
            loadListLeads(pagination.current_page || 1);
            loadListDetails();
        } catch (err) {
            toast.error("Failed to remove contact");
        }
    };

    if (loadingList) {
        return (
            <DashboardLayout title="Contact List Details">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading contact list...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!list) {
        return (
            <DashboardLayout title="List Not Found">
                <div className="alert alert-danger text-center my-4">
                    Contact list not found or has been deleted.
                </div>
                <Button variant="secondary" onClick={() => navigate("/contacts")}>
                    <FiArrowLeft className="me-1" /> Back to Contacts
                </Button>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={`Contacts - ${list.name}`}>
            {/* Header Toolbar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <Button
                        variant="outline-secondary"
                        className="d-inline-flex align-items-center gap-2 border shadow-sm px-3 py-2 rounded-pill bg-white text-dark fw-semibold mb-3"
                        onClick={() => navigate("/contacts")}
                    >
                        <FiArrowLeft size={18} />
                        <span>Back to Contact Lists</span>
                    </Button>
                    <h3 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                        <FiBookOpen className="text-primary" />
                        <span>{list.name}</span>
                        <Badge bg="info" className="fs-6 px-3 py-1 rounded-pill ms-2">
                            <FiUsers className="me-1" /> {list.total_contacts || pagination.total || 0} Contacts
                        </Badge>
                    </h3>
                    <p className="text-muted m-0 small mt-1">
                        {list.description || "Custom segmented lead list for targeted cold outreach campaigns."}
                    </p>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Button
                        variant="outline-success"
                        size="sm"
                        onClick={handleExport}
                        className="d-inline-flex align-items-center gap-2"
                    >
                        <FiDownload />
                        <span>Export CSV</span>
                    </Button>

                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowImportModal(true)}
                        className="d-inline-flex align-items-center gap-2"
                    >
                        <FiUpload />
                        <span>Import Custom CSV</span>
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        className="d-inline-flex align-items-center gap-2"
                    >
                        <FiPlus />
                        <span>+ Add Private Contact</span>
                    </Button>
                </div>
            </div>

            {/* Filter and Table Card */}
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
                                    placeholder="Search contacts by name, email, website..."
                                    className="border-start-0"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {loadingLeads ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2">Loading contacts...</p>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-3">
                            <FiUsers size={40} className="text-muted mb-2" />
                            <h5 className="fw-bold text-dark">No Contacts Found</h5>
                            <p className="text-muted small">No lead contacts currently match your search filter in this list.</p>
                            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                                + Add First Contact
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover align="middle" className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>BUSINESS NAME</th>
                                        <th>CATEGORY</th>
                                        <th>PSI SCORE</th>
                                        <th>WEBSITE</th>
                                        <th>EMAIL ADDRESS</th>
                                        <th>COUNTRY</th>
                                        <th className="text-end">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((cLead) => (
                                        <tr key={cLead.id}>
                                            <td>
                                                <div className="fw-bold text-dark fs-6">{cLead.business_name}</div>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark" className="border fw-normal px-2 py-1">
                                                    {cLead.category || "-"}
                                                </Badge>
                                            </td>
                                            <td>
                                                {cLead.mobile_pagespeed > 0 ? (
                                                    <Badge bg={cLead.mobile_pagespeed >= 90 ? "success" : cLead.mobile_pagespeed >= 50 ? "warning" : "danger"}>
                                                        {cLead.mobile_pagespeed} / 100
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted small">-</span>
                                                )}
                                            </td>
                                            <td>
                                                {cLead.website && cLead.website !== "-" ? (
                                                    <a href={cLead.website.startsWith("http") ? cLead.website : `https://${cLead.website}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none small d-inline-flex align-items-center gap-1">
                                                        <FiGlobe size={12} />
                                                        <span>{cLead.website}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-muted small">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="fw-semibold text-dark">{cLead.email || "-"}</span>
                                            </td>
                                            <td>
                                                <span className="text-muted small">{cLead.country || "-"}</span>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(cLead)}
                                                        title="Edit isolated contact details in this list"
                                                    >
                                                        <FiEdit3 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveLead(cLead.id, cLead.business_name)}
                                                        title="Remove contact from this list"
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

            {!loadingLeads && leads.length > 0 && (
                <Pagination pagination={pagination} onPageChange={(p) => loadListLeads(p)} />
            )}

            {/* Add Manual Contact Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                        <FiPlus className="text-primary" />
                        <span>Add Private Contact to List</span>
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddManualContact}>
                    <Modal.Body className="p-4">
                        <p className="text-muted small mb-3">
                            This contact will be saved exclusively inside this contact list. It will <strong>NOT</strong> clutter or modify the main global CRM directory.
                        </p>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Business / Person Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Acme Speed Corp"
                                        value={addForm.business_name}
                                        onChange={(e) => setAddForm({ ...addForm, business_name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Email Address *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="e.g. contact@acmespeed.com"
                                        value={addForm.email}
                                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Website</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. acmespeed.com"
                                        value={addForm.website}
                                        onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. +1 555-0192"
                                        value={addForm.phone}
                                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Category</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. E-Commerce, Agency"
                                        value={addForm.category}
                                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Country</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. USA"
                                        value={addForm.country}
                                        onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">PageSpeed Score</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g. 45"
                                        value={addForm.mobile_pagespeed}
                                        onChange={(e) => setAddForm({ ...addForm, mobile_pagespeed: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Add private notes for campaign personalization..."
                                        value={addForm.notes}
                                        onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submittingAdd}>
                            {submittingAdd ? <Spinner size="sm" animation="border" /> : "Save Private Contact"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Contact Details Modal */}
            <Modal show={Boolean(editingContact)} onHide={() => setEditingContact(null)} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                        <FiEdit3 className="text-primary" />
                        <span>Edit Isolated Contact Details</span>
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveEditContact}>
                    <Modal.Body className="p-4">
                        <div className="alert alert-info py-2 small mb-3">
                            ℹ️ Edits made here apply <strong>ONLY</strong> to this contact list. The main CRM business table will remain completely unchanged.
                        </div>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Business / Contact Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.business_name}
                                        onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Email Address *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Website</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.website}
                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Category</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Country</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.country}
                                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">PageSpeed Score</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={editForm.mobile_pagespeed}
                                        onChange={(e) => setEditForm({ ...editForm, mobile_pagespeed: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setEditingContact(null)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submittingEdit}>
                            {submittingEdit ? <Spinner size="sm" animation="border" /> : "Save Changes"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Import Custom CSV Modal */}
            <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                        <FiUpload className="text-primary" />
                        <span>Import Custom CSV Contacts</span>
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleImportCsvSubmit}>
                    <Modal.Body className="p-4">
                        <p className="text-muted small mb-3">
                            Upload a custom CSV file containing lead contacts. These contacts will be imported <strong>only into this list</strong> without altering main CRM database records.
                        </p>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Choose CSV File *</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setCsvFile(e.target.files[0])}
                                required
                            />
                            <Form.Text className="text-muted small">
                                Supported columns: <code>name</code>, <code>email</code>, <code>website</code>, <code>phone</code>, <code>category</code>, <code>country</code>, <code>pagespeed</code>.
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submittingCsv || !csvFile}>
                            {submittingCsv ? <Spinner size="sm" animation="border" /> : "Import CSV Contacts"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </DashboardLayout>
    );
}
