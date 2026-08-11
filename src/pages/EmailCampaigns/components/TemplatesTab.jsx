import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form, Badge, Spinner, Table } from "react-bootstrap";
import { FiPlus, FiSearch, FiEdit3, FiTrash2, FiCopy, FiCheckCircle, FiEye } from "react-icons/fi";
import toast from "react-hot-toast";
import { getEmailTemplates, deleteEmailTemplate, duplicateEmailTemplate, publishEmailTemplate } from "../../../api/emailTemplates";
import TemplateModal from "./TemplateModal";
import Pagination from "../../../components/ui/Pagination";

export default function TemplatesTab() {
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const loadTemplates = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getEmailTemplates({ page, search, status: statusFilter, template_type: typeFilter });
            setTemplates(res.data.data.data || []);
            setPagination(res.data.data || {});
        } catch (error) {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates(1);
    }, [search, statusFilter, typeFilter]);

    const handleCreate = () => {
        setSelectedTemplate(null);
        setShowModal(true);
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteEmailTemplate(id);
            toast.success("Template deleted successfully");
            loadTemplates(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to delete template");
        }
    };

    const handleDuplicate = async (id) => {
        try {
            await duplicateEmailTemplate(id);
            toast.success("Template duplicated!");
            loadTemplates(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to duplicate template");
        }
    };

    const handlePublish = async (id) => {
        try {
            await publishEmailTemplate(id);
            toast.success("Template published!");
            loadTemplates(pagination.current_page || 1);
        } catch (error) {
            toast.error("Failed to publish template");
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <div className="position-relative" style={{ minWidth: "260px" }}>
                        <Form.Control
                            type="text"
                            placeholder="Search templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-4"
                        />
                        <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                    </div>

                    <Form.Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ width: "160px" }}
                    >
                        <option value="">All Types</option>
                        <option value="cold_email">Cold Email</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="manual">Manual</option>
                        <option value="transactional">Transactional</option>
                    </Form.Select>

                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: "150px" }}
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </Form.Select>
                </div>

                <Button variant="primary" onClick={handleCreate} className="d-flex align-items-center gap-2">
                    <FiPlus />
                    <span>Create Template</span>
                </Button>
            </div>

            {/* Grid / List */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Loading email templates...</p>
                </div>
            ) : templates.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <h5 className="fw-bold text-muted mb-2">No Templates Found</h5>
                        <p className="text-muted mb-3">Create email templates with dynamic merge tags to send personalized cold outreach.</p>
                        <Button variant="outline-primary" onClick={handleCreate}>
                            <FiPlus className="me-1" /> Create Your First Template
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-3">
                    {templates.map((tpl) => {
                        const curVer = tpl.current_version;
                        return (
                            <Col key={tpl.id} lg={6} xl={4}>
                                <Card className="border-0 shadow-sm h-100 position-relative">
                                    <Card.Body className="d-flex flex-column justify-content-between">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="fw-bold mb-0 text-dark">{tpl.name}</h5>
                                                <Badge
                                                    bg={tpl.status === "published" ? "success" : "secondary"}
                                                    className="text-capitalize"
                                                >
                                                    {tpl.status || "draft"}
                                                </Badge>
                                            </div>

                                            <div className="d-flex gap-2 mb-3">
                                                <Badge bg="info" className="text-uppercase" style={{ fontSize: "10px" }}>
                                                    {tpl.template_type}
                                                </Badge>
                                                {tpl.category && (
                                                    <Badge bg="light" className="text-dark border" style={{ fontSize: "10px" }}>
                                                        {tpl.category}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="bg-light p-2.5 rounded mb-3">
                                                <small className="text-muted d-block fw-bold mb-1">Subject:</small>
                                                <p className="text-dark small m-0 fw-medium text-truncate">
                                                    {curVer?.subject || "No subject set"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2 pt-2 border-top align-items-center">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                onClick={() => handleEdit(tpl)}
                                                className="d-flex align-items-center gap-1"
                                            >
                                                <FiEdit3 />
                                                <span>Edit</span>
                                            </Button>

                                            <Button
                                                variant="light"
                                                size="sm"
                                                onClick={() => handleDuplicate(tpl.id)}
                                                className="d-flex align-items-center gap-1"
                                            >
                                                <FiCopy />
                                                <span>Duplicate</span>
                                            </Button>

                                            {tpl.status !== "published" && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handlePublish(tpl.id)}
                                                >
                                                    Publish
                                                </Button>
                                            )}

                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="text-danger ms-auto"
                                                onClick={() => handleDelete(tpl.id)}
                                            >
                                                <FiTrash2 />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {!loading && templates.length > 0 && (
                <div className="mt-4">
                    <Pagination pagination={pagination} onPageChange={loadTemplates} />
                </div>
            )}

            <TemplateModal
                show={showModal}
                onHide={() => setShowModal(false)}
                template={selectedTemplate}
                onSaved={() => loadTemplates(pagination.current_page || 1)}
            />
        </div>
    );
}
