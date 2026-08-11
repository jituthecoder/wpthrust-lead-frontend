import { Card, Row, Col, Badge, Button } from "react-bootstrap";
import {
    FiArrowLeft,
    FiPhone,
    FiMail,
    FiGlobe
} from "react-icons/fi";
import { Link } from "react-router-dom";

export default function LeadHeader({ lead }) {

    return (

        <Card className="shadow-sm border-0 mb-4 lead-header-card">

            <Card.Body>

                <Row className="align-items-center">

                    <Col lg={8}>

                        <div className="d-flex justify-content-between align-items-start">

                            <div>

                                <small className="text-muted">

                                    Lead #{lead.id}

                                </small>

                                <h2 className="fw-bold mb-2">

                                    {lead.business_name}

                                </h2>

                                <p className="text-muted mb-3">

                                    {lead.category}

                                </p>

                            </div>

                            <Badge
                                bg={
                                    lead.lead_status === "interested"
                                        ? "success"
                                        : lead.lead_status === "follow_up"
                                        ? "warning"
                                        : "secondary"
                                }
                                className="px-3 py-2"
                            >

                                {lead.lead_status}

                            </Badge>

                        </div>

                        <div className="lead-contact-info">

                            <div>

                                <FiPhone className="me-2" />

                                {lead.phone || "-"}

                            </div>

                            <div>

                                <FiMail className="me-2" />

                                {lead.email || "-"}

                            </div>

                            <div>

                                <FiGlobe className="me-2" />

                                {lead.website || "-"}

                            </div>

                        </div>

                    </Col>

                    <Col lg={4}>

                        <div className="d-grid gap-2">

                            <Button
                                variant="success"
                                href={`tel:${lead.phone}`}
                                className="w-100 py-3 d-flex justify-content-center align-items-center fw-semibold"
                            >

                                <FiPhone size={18} className="me-2" />

                                {lead.phone}

                            </Button>

                            <Button
                                variant="primary"
                                href={lead.website}
                                target="_blank"
                            >

                                <FiGlobe className="me-2" />

                                Visit Website

                            </Button>

                            <Button
                                variant="outline-secondary"
                                as={Link}
                                to="/my-leads"
                            >

                                <FiArrowLeft className="me-2" />

                                Back

                            </Button>

                        </div>

                    </Col>

                </Row>

            </Card.Body>

        </Card>

    );

}