import { Card, Row, Col, ProgressBar } from "react-bootstrap";
import {
    FiStar,
    FiMessageSquare,
    FiSmartphone,
    FiMonitor,
    FiSearch
} from "react-icons/fi";

export default function WebsiteAuditCard({ lead }) {

    const audit = lead.audit || {};

    return (

        <Card className="shadow-sm border-0 h-100">

            <Card.Header className="bg-white border-bottom">

                <h5 className="mb-0 fw-semibold">

                    Website Audit

                </h5>

            </Card.Header>

            <Card.Body>

                <Row className="g-4">

                    <Col xs={6}>

                        <div className="audit-box">

                            <FiStar className="audit-icon text-warning" />

                            <small className="text-muted">

                                Google Rating

                            </small>

                            <h4>

                                {audit.google_rating ?? "-"}

                            </h4>

                        </div>

                    </Col>

                    <Col xs={6}>

                        <div className="audit-box">

                            <FiMessageSquare className="audit-icon text-primary" />

                            <small className="text-muted">

                                Reviews

                            </small>

                            <h4>

                                {audit.total_reviews ?? "-"}

                            </h4>

                        </div>

                    </Col>

                    <Col xs={12}>

                        <small className="fw-semibold">

                            Mobile PageSpeed

                        </small>

                        <ProgressBar
                            now={audit.mobile_pagespeed_score || 0}
                            label={`${audit.mobile_pagespeed_score || 0}%`}
                            className="mb-3"
                        />

                    </Col>

                    <Col xs={12}>

                        <small className="fw-semibold">

                            Desktop PageSpeed

                        </small>

                        <ProgressBar
                            now={audit.desktop_pagespeed_score || 0}
                            label={`${audit.desktop_pagespeed_score || 0}%`}
                            className="mb-3"
                        />

                    </Col>

                    <Col xs={12}>

                        <small className="fw-semibold">

                            SEO Score

                        </small>

                        <ProgressBar
                            now={audit.seo_score || 0}
                            label={`${audit.seo_score || 0}%`}
                        />

                    </Col>

                </Row>

            </Card.Body>

        </Card>

    );

}