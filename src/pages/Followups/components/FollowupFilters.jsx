import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

export default function FollowupFilters({
    search,
    setSearch,
    onRefresh,
}) {
    return (
        <Card className="shadow-sm border-0 mb-4">

            <Card.Body>

                <Row className="align-items-center">

                    <Col md={10}>

                        <div className="position-relative">

                            <FiSearch
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "15px",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                }}
                            />

                            <Form.Control
                                type="text"
                                placeholder="Search business name, phone..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                style={{
                                    paddingLeft: "42px",
                                    height: "48px",
                                }}
                            />

                        </div>

                    </Col>

                    <Col md={2}>

                        <Button
                            variant="primary"
                            className="w-100"
                            style={{ height: "48px" }}
                            onClick={onRefresh}
                        >

                            <FiRefreshCw className="me-2" />

                            Refresh

                        </Button>

                    </Col>

                </Row>

            </Card.Body>

        </Card>
    );
}