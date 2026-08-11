import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import { assignCampaignLeads } from "../../../api/emailCampaigns";
import { getBusinesses } from "../../../api/business";

export default function AssignLeadsModal({ show, onHide, campaignId, onAssigned }) {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (show && campaignId) {
            loadLeads("");
            setSelectedIds([]);
        }
    }, [show, campaignId]);

    const loadLeads = async (searchQuery = "") => {
        try {
            setLoading(true);
            const res = await getBusinesses({ search: searchQuery, page: 1, per_page: 100 });
            const list = (res.data.data?.data || []).filter((b) => Boolean(b.email));
            setBusinesses(list);
        } catch (error) {
            toast.error("Failed to load business directory");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearch(query);
        loadLeads(query);
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const allIds = businesses.map((b) => b.id);
        const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : allIds);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            toast.error("Please select at least one business lead.");
            return;
        }

        try {
            setSubmitting(true);
            await assignCampaignLeads(campaignId, selectedIds);
            toast.success("Business leads assigned to campaign!");
            onAssigned();
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to assign leads";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">Assign Business Leads to Campaign</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-0">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search lead directory..."
                            value={search}
                            onChange={handleSearch}
                            style={{ maxWidth: "300px" }}
                        />
                        <Button variant="outline-secondary" size="sm" onClick={toggleSelectAll}>
                            {businesses.length > 0 && businesses.every((b) => selectedIds.includes(b.id))
                                ? "Deselect All"
                                : "Select All"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : businesses.length === 0 ? (
                        <div className="alert alert-warning text-center">
                            No eligible business leads with email addresses found.
                        </div>
                    ) : (
                        <div className="table-responsive border rounded" style={{ maxHeight: "350px", overflowY: "auto" }}>
                            <Table hover size="sm" className="align-middle mb-0">
                                <thead className="bg-light sticky-top">
                                    <tr>
                                        <th style={{ width: "40px" }}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={businesses.length > 0 && businesses.every((b) => selectedIds.includes(b.id))}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>Business Name</th>
                                        <th>Email</th>
                                        <th>City / Country</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {businesses.map((biz) => {
                                        const isSelected = selectedIds.includes(biz.id);
                                        return (
                                            <tr
                                                key={biz.id}
                                                onClick={() => toggleSelect(biz.id)}
                                                style={{ cursor: "pointer" }}
                                                className={isSelected ? "table-active" : ""}
                                            >
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(biz.id)}
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
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={onHide} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting || selectedIds.length === 0}>
                        {submitting ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Assigning...
                            </>
                        ) : (
                            `Assign (${selectedIds.length}) Leads`
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
