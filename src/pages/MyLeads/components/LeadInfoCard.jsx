import { Card, Row, Col } from "react-bootstrap";
import {
    FiMapPin,
    FiPhone,
    FiMail,
    FiGlobe,
    FiTag
} from "react-icons/fi";

export default function LeadInfoCard({ lead }) {

    return (

        <Card className="shadow-sm border-0 h-100">

            <Card.Header className="bg-white border-bottom">

                <h5 className="mb-0 fw-semibold">

                    Business Information

                </h5>

            </Card.Header>

            <Card.Body>

                <Row className="g-4">

                    <Col md={6}>

                        <small className="text-muted">

                            Business Name

                        </small>

                        <div className="lead-info-value">

                            {lead.business_name}

                        </div>

                    </Col>

                    <Col md={6}>

                        <small className="text-muted">

                            Category

                        </small>

                        <div className="lead-info-value">

                            <FiTag className="me-2 text-primary" />

                            {lead.category || "-"}

                        </div>

                    </Col>

                    <Col md={6}>

                        <small className="text-muted">

                            Phone

                        </small>

                        <div className="lead-info-value">

                            <FiPhone className="me-2 text-success" />

                            {lead.phone || "-"}

                        </div>

                    </Col>

                    <Col md={6}>

                        <small className="text-muted">

                            Email

                        </small>

                        <div className="lead-info-value">

                            <FiMail className="me-2 text-danger" />

                            {lead.email || "-"}

                        </div>

                    </Col>

                    <Col md={12}>

                        <small className="text-muted">

                            Website

                        </small>

                        <div className="lead-info-value">

                            <FiGlobe className="me-2 text-primary" />

                            <a
                                href={lead.website}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {lead.website || "-"}
                            </a>

                        </div>

                    </Col>

                    <Col md={12}>

                        <small className="text-muted">

                            Address

                        </small>

                        <div className="lead-info-value">

                            <FiMapPin className="me-2 text-danger" />

                            {lead.address || "-"}

                        </div>

                    </Col>

                </Row>

            </Card.Body>

        </Card>

    );

}