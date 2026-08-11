import { Row, Col, Form, InputGroup, Button } from "react-bootstrap";
import { FiSearch, FiRefreshCw, FiPlus } from "react-icons/fi";

export default function UserToolbar({
    filters,
    setFilters,
    onCreate,
}) {

    const handleSearch = (e) => {

        setFilters({
            ...filters,
            search: e.target.value,
            page: 1,
        });

    };

    const handleRole = (e) => {

        setFilters({
            ...filters,
            role: e.target.value,
            page: 1,
        });

    };

    const resetFilters = () => {

        setFilters({
            page: 1,
            search: "",
            role: "",
        });

    };

    return (

        <div className="mb-4">

            <Row className="g-3 align-items-center">

                <Col lg={5} md={12}>

                    <InputGroup>

                        <InputGroup.Text>

                            <FiSearch />

                        </InputGroup.Text>

                        <Form.Control
                            placeholder="Search user..."
                            value={filters.search}
                            onChange={handleSearch}
                        />

                    </InputGroup>

                </Col>

                <Col lg={3} md={6}>

                    <Form.Select
                        value={filters.role}
                        onChange={handleRole}
                    >

                        <option value="">

                            All Roles

                        </option>

                        <option value="super_admin">

                            Super Admin

                        </option>

                        <option value="sales_executive">

                            Sales Executive

                        </option>

                    </Form.Select>

                </Col>

                <Col lg={2} md={6}>

                    <Button
                        variant="primary"
                        className="w-100"
                        onClick={onCreate}
                    >

                        <FiPlus className="me-2" />

                        Create User

                    </Button>

                </Col>

                <Col lg={2} md={12}>

                    <Button
                        variant="outline-secondary"
                        className="w-100"
                        onClick={resetFilters}
                    >

                        <FiRefreshCw />

                    </Button>

                </Col>

            </Row>

        </div>

    );

}