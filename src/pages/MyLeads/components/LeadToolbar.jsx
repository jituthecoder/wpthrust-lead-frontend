import { Row, Col, Form, InputGroup, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { getSalesExecutives } from "../../../api/user";
import { FiSearch, FiRefreshCw, FiFilter, FiChevronDown, FiChevronUp, FiMapPin, FiCalendar, FiGlobe } from "react-icons/fi";

export default function LeadToolbar({ filters, setFilters }) {
    const [users, setUsers] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const response = await getSalesExecutives();
            setUsers(response.data.data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleSearch = (e) => {
        setFilters({
            ...filters,
            search: e.target.value,
            page: 1,
        });
    };

    const handleStatus = (e) => {
        setFilters({
            ...filters,
            status: e.target.value,
            page: 1,
        });
    };

    const handleCategory = (e) => {
        setFilters({
            ...filters,
            category: e.target.value,
            page: 1,
        });
    };

    const handleLocation = (e) => {
        setFilters({
            ...filters,
            location: e.target.value,
            page: 1,
        });
    };

    const handleCreatedAt = (e) => {
        setFilters({
            ...filters,
            created_at: e.target.value,
            page: 1,
        });
    };

    const handleHasWebsite = (e) => {
        setFilters({
            ...filters,
            has_website: e.target.value,
            page: 1,
        });
    };

    const handleAssignedUser = (e) => {
        setFilters({
            ...filters,
            assigned_user_id: e.target.value,
            page: 1,
        });
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            search: "",
            status: "",
            category: "",
            location: "",
            created_at: "",
            has_website: "",
            assigned: "",
            assigned_user_id: "",
        });
    };

    // Count active filters (excluding search & page)
    const activeFilterCount = [
        filters.status,
        filters.category,
        filters.location,
        filters.created_at,
        filters.has_website,
        filters.assigned_user_id
    ].filter(Boolean).length;

    return (
        <div className="card border-0 shadow-sm p-2 p-md-3 mb-3">
            {/* Search Bar + Mobile Filter Toggle Row */}
            <div className="d-flex align-items-center gap-2">
                <div className="flex-grow-1">
                    <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0">
                            <FiSearch className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            className="border-start-0"
                            placeholder="Search business, phone or email..."
                            value={filters.search}
                            onChange={handleSearch}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        />
                    </InputGroup>
                </div>

                {/* Mobile Filter Toggle Button */}
                <Button
                    variant={activeFilterCount > 0 ? "primary" : "outline-secondary"}
                    className="d-md-none d-inline-flex align-items-center gap-1 px-3 py-2 flex-shrink-0"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                    <FiFilter />
                    <span className="small fw-semibold">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="badge bg-white text-primary rounded-circle ms-1">
                            {activeFilterCount}
                        </span>
                    )}
                    {showMobileFilters ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                </Button>
            </div>

            {/* Filter Dropdowns & Inputs (Visible always on Desktop, Collapsible on Mobile) */}
            <div className={`mt-3 ${showMobileFilters ? 'd-block' : 'd-none d-md-block'}`}>
                <Row className="g-2 g-md-3">
                    <Col xl={2} lg={3} md={4} sm={6} xs={12}>
                        <Form.Select
                            value={filters.status}
                            onChange={handleStatus}
                            className="form-select-sm py-2"
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="follow_up">Follow Up</option>
                            <option value="interested">Interested</option>
                            <option value="not_interested">Not Interested</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                        </Form.Select>
                    </Col>

                    <Col xl={2} lg={3} md={4} sm={6} xs={12}>
                        <Form.Control
                            placeholder="Category"
                            value={filters.category}
                            onChange={handleCategory}
                            className="form-control-sm py-2"
                        />
                    </Col>

                    <Col xl={2} lg={3} md={4} sm={6} xs={12}>
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-white text-muted pe-1">
                                <FiMapPin size={14} />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Location..."
                                value={filters.location}
                                onChange={handleLocation}
                                className="form-control-sm py-2 border-start-0 ps-1"
                            />
                        </InputGroup>
                    </Col>

                    <Col xl={2} lg={3} md={4} sm={6} xs={12}>
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-white text-muted pe-1" title="Lead Created Date">
                                <FiCalendar size={14} />
                            </InputGroup.Text>
                            <Form.Control
                                type="date"
                                value={filters.created_at}
                                onChange={handleCreatedAt}
                                className="form-control-sm py-2 border-start-0 ps-1"
                                title="Lead Created Date"
                            />
                        </InputGroup>
                    </Col>

                    <Col xl={2} lg={3} md={4} sm={6} xs={12}>
                        <Form.Select
                            value={filters.has_website}
                            onChange={handleHasWebsite}
                            className="form-select-sm py-2"
                        >
                            <option value="">All Websites</option>
                            <option value="yes">🌐 Website Available</option>
                            <option value="no">🚫 Website Not Available</option>
                        </Form.Select>
                    </Col>

                    <Col xl={2} lg={3} md={4} sm={6} xs={12}>
                        <Form.Select
                            value={filters.assigned_user_id || ""}
                            onChange={handleAssignedUser}
                            className="form-select-sm py-2"
                        >
                            <option value="">All Users</option>
                            <option value="unassigned">🚫 Unassigned Leads</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    👤 {user.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>

                    <Col xl={12} className="d-flex justify-content-end mt-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="py-1 px-3 d-flex align-items-center gap-1"
                            onClick={resetFilters}
                            title="Reset Filters"
                        >
                            <FiRefreshCw size={13} />
                            <span>Reset Filters</span>
                        </Button>
                    </Col>
                </Row>
            </div>
        </div>
    );
}