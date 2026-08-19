import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Table, Row, Col, Badge, Pagination } from "react-bootstrap";
import { FiCamera, FiGlobe, FiZap, FiTrash2, FiCheckCircle, FiList, FiCheckSquare, FiBookOpen, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { assignCampaignLeads } from "../../../api/emailCampaigns";
import { getBusinesses, getBusinessCategories, getBusinessCountries } from "../../../api/business";
import { getContactLists, importContactListToCampaign } from "../../../api/contactLists";

export default function AssignLeadsModal({ show, onHide, campaignId, onAssigned }) {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);

    // Contact lists state
    const [savedContactLists, setSavedContactLists] = useState([]);
    const [loadingContactLists, setLoadingContactLists] = useState(false);
    const [importingListId, setImportingListId] = useState(null);

    // Map storing full objects of selected leads: { [id]: businessObject }
    const [selectedMap, setSelectedMap] = useState({});

    // View tab: "all" or "selected"
    const [viewMode, setViewMode] = useState("all");

    // Pagination state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [lastPage, setLastPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filter states
    const [search, setSearch] = useState("");
    const [psiFilter, setPsiFilter] = useState("");
    const [hasScreenshot, setHasScreenshot] = useState("");
    const [hasWebsite, setHasWebsite] = useState("");
    const [category, setCategory] = useState("");
    const [country, setCountry] = useState("");

    useEffect(() => {
        if (show) {
            loadCategories();
            loadCountries();
            setSelectedMap({});
            setViewMode("all");
            setPage(1);
        }
    }, [show]);

    useEffect(() => {
        if (show && campaignId) {
            loadLeads();
        }
    }, [show, campaignId, page, perPage, search, psiFilter, hasScreenshot, hasWebsite, category, country]);

    const loadCategories = async () => {
        try {
            const res = await getBusinessCategories();
            setCategories(res.data.data || []);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    const loadCountries = async () => {
        try {
            const res = await getBusinessCountries();
            setCountries(res.data.data || []);
        } catch (err) {
            console.error("Failed to load countries", err);
        }
    };

    const loadLeads = async () => {
        try {
            setLoading(true);
            const res = await getBusinesses({
                search,
                psi_filter: psiFilter,
                has_screenshot: hasScreenshot,
                has_website: hasWebsite,
                category,
                country,
                page,
                per_page: perPage,
            });
            const paginatedData = res.data.data;
            const list = (paginatedData?.data || []).filter((b) => Boolean(b.email));
            setBusinesses(list);
            setLastPage(paginatedData?.last_page || 1);
            setTotalCount(paginatedData?.total || list.length);
        } catch (error) {
            toast.error("Failed to load business directory");
        } finally {
            setLoading(false);
        }
    };

    const loadSavedContactLists = async () => {
        try {
            setLoadingContactLists(true);
            const res = await getContactLists({ per_page: 100 });
            setSavedContactLists(res.data.data?.data || []);
        } catch (err) {
            toast.error("Failed to load saved contact lists");
        } finally {
            setLoadingContactLists(false);
        }
    };

    const handleImportContactList = async (listId, listName) => {
        if (!campaignId) return;
        try {
            setImportingListId(listId);
            const res = await importContactListToCampaign(campaignId, listId);
            toast.success(res.data.message || `Imported contacts from '${listName}' into campaign!`);
            onAssigned();
            onHide();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to import contact list");
        } finally {
            setImportingListId(null);
        }
    };

    const toggleSelect = (biz) => {
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

    const toggleSelectAllPage = () => {
        const currentPageIds = businesses.map((b) => b.id);
        const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedMap[id]);

        setSelectedMap((prev) => {
            const next = { ...prev };
            if (allPageSelected) {
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
            const res = await getBusinesses({
                search,
                psi_filter: psiFilter,
                has_screenshot: hasScreenshot,
                has_website: hasWebsite,
                category,
                country,
                page: 1,
                per_page: 500, // fetch larger chunk of filtered leads
            });
            const list = (res.data.data?.data || []).filter((b) => Boolean(b.email));
            setSelectedMap((prev) => {
                const next = { ...prev };
                list.forEach((biz) => {
                    next[biz.id] = biz;
                });
                return next;
            });
            toast.success(`Selected ${list.length} target leads!`, { id: "select_all" });
        } catch (err) {
            toast.error("Failed to select all leads", { id: "select_all" });
        }
    };

    const removeSelectedLead = (id) => {
        setSelectedMap((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const clearAllSelected = () => {
        setSelectedMap({});
    };

    const selectedIds = Object.keys(selectedMap).map(Number);
    const selectedList = Object.values(selectedMap);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            toast.error("Please select at least one business lead.");
            return;
        }

        try {
            setSubmitting(true);
            await assignCampaignLeads(campaignId, selectedIds);
            toast.success(`${selectedIds.length} target lead(s) assigned to campaign!`);
            onAssigned();
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to assign leads";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const resetFilters = () => {
        setSearch("");
        setPsiFilter("");
        setHasScreenshot("");
        setHasWebsite("");
        setCategory("");
        setCountry("");
        setPage(1);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                    <FiZap className="text-warning" />
                    <span>Target Lead Selection & Scalable Management</span>
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-0">
                    {/* View Mode Selector Tabs */}
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <div className="btn-group">
                            <Button
                                variant={viewMode === "all" ? "primary" : "outline-secondary"}
                                size="sm"
                                onClick={() => setViewMode("all")}
                                className="d-flex align-items-center gap-2"
                            >
                                <FiList />
                                <span>Lead Directory ({totalCount})</span>
                            </Button>
                            <Button
                                variant={viewMode === "contact_list" ? "info" : "outline-info"}
                                size="sm"
                                onClick={() => {
                                    setViewMode("contact_list");
                                    loadSavedContactLists();
                                }}
                                className="d-flex align-items-center gap-2"
                            >
                                <FiBookOpen />
                                <span>Import Saved Contact List</span>
                            </Button>
                            <Button
                                variant={viewMode === "selected" ? "success" : "outline-success"}
                                size="sm"
                                onClick={() => setViewMode("selected")}
                                className="d-flex align-items-center gap-2"
                            >
                                <FiCheckCircle />
                                <span>Selected Target Leads ({selectedIds.length})</span>
                            </Button>
                        </div>

                        {viewMode === "selected" && selectedIds.length > 0 && (
                            <Button variant="outline-danger" size="sm" onClick={clearAllSelected}>
                                Clear All Selected
                            </Button>
                        )}
                    </div>

                    {/* Contact Lists View Mode */}
                    {viewMode === "contact_list" && (
                        <div className="p-3 bg-light rounded border mb-3">
                            <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                <FiBookOpen className="text-info" />
                                <span>Saved Contact Segment Lists</span>
                            </h6>
                            <p className="text-muted small mb-3">
                                Select a pre-segmented contact list (e.g. content-need-contact, optimization-service-needed) to import all its contacts into this campaign with 1 click.
                            </p>

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
                                    {savedContactLists.map((list) => (
                                        <Col key={list.id} md={6}>
                                            <Card className="border shadow-sm h-100">
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
                                                        variant="success"
                                                        size="sm"
                                                        className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                                        onClick={() => handleImportContactList(list.id, list.name)}
                                                        disabled={importingListId === list.id || (list.total_contacts || 0) === 0}
                                                    >
                                                        {importingListId === list.id ? (
                                                            <>
                                                                <Spinner size="sm" animation="border" />
                                                                <span>Importing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiCheckCircle />
                                                                <span>Import All {list.total_contacts || 0} Leads to Campaign</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </div>
                    )}

                    {/* Filter Bar (Shown in Directory View Mode) */}
                    {viewMode === "all" && (
                        <div className="bg-light p-3 rounded border mb-3">
                            <Row className="g-2">
                                <Col md={2}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search name, email..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        size="sm"
                                    />
                                </Col>
                                <Col md={2}>
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        placeholder="Country (e.g. USA, US...)"
                                        value={country}
                                        onChange={(e) => {
                                            setCountry(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        size="sm"
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
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
                                <Col md={1}>
                                    <Form.Select
                                        size="sm"
                                        value={hasScreenshot}
                                        onChange={(e) => {
                                            setHasScreenshot(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="">All Shot</option>
                                        <option value="yes">📷 Yes</option>
                                        <option value="no">🚫 No</option>
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
                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                    <Button variant="outline-secondary" size="sm" onClick={resetFilters} className="w-100">
                                        Reset
                                    </Button>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {/* Content Table for ALL DIRECTORY LEADS */}
                    {viewMode === "all" && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted fw-semibold">
                                    Page {page} of {lastPage} — Showing {businesses.length} of {totalCount} matching leads
                                </small>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" size="sm" onClick={toggleSelectAllPage}>
                                        {businesses.length > 0 && businesses.every((b) => selectedMap[b.id])
                                            ? "Deselect Page"
                                            : "Select All on Page"}
                                    </Button>
                                    <Button variant="outline-success" size="sm" onClick={selectAllFilteredLeads}>
                                        <FiCheckSquare className="me-1" />
                                        Select All {totalCount} Filtered Leads
                                    </Button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : businesses.length === 0 ? (
                                <div className="alert alert-warning text-center">
                                    No eligible business leads matching these filter criteria found.
                                </div>
                            ) : (
                                <div className="table-responsive border rounded" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                    <Table hover size="sm" className="align-middle mb-0">
                                        <thead className="bg-light sticky-top">
                                            <tr>
                                                <th style={{ width: "40px" }}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={businesses.length > 0 && businesses.every((b) => selectedMap[b.id])}
                                                        onChange={toggleSelectAllPage}
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
                                                        onClick={() => toggleSelect(biz)}
                                                        style={{ cursor: "pointer" }}
                                                        className={isSelected ? "table-active" : ""}
                                                    >
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelect(biz)}
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

                    {/* Content Table for SELECTED TARGET LEADS VIEW */}
                    {viewMode === "selected" && (
                        <div>
                            {selectedList.length === 0 ? (
                                <div className="alert alert-info text-center py-4">
                                    No target leads selected yet. Switch to the <strong>Lead Directory</strong> tab to select leads across any page.
                                </div>
                            ) : (
                                <div className="table-responsive border rounded" style={{ maxHeight: "380px", overflowY: "auto" }}>
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
                                                            onClick={() => removeSelectedLead(biz.id)}
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
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
                    <span className="fw-semibold text-dark">
                        {selectedIds.length} lead(s) selected
                    </span>
                    <div>
                        <Button variant="light" onClick={onHide} disabled={submitting} className="me-2">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submitting || selectedIds.length === 0}>
                            {submitting ? (
                                <>
                                    <Spinner size="sm" animation="border" className="me-2" />
                                    Assigning...
                                </>
                            ) : (
                                `Assign (${selectedIds.length}) Target Leads`
                            )}
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
