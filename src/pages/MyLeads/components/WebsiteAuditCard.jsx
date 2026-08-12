import { useState } from "react";
import { Card, Row, Col, Badge, Button } from "react-bootstrap";
import { FiStar, FiMessageSquare, FiZap, FiExternalLink } from "react-icons/fi";
import toast from "react-hot-toast";
import { fetchBusinessPsi } from "../../../api/business";

export default function WebsiteAuditCard({ lead, onRefresh }) {
    const [auditing, setAuditing] = useState(false);
    const audit = lead?.audit || {};

    const pageSpeedScore = Number(audit.mobile_pagespeed || audit.mobile_pagespeed_score || 0);

    const handleRunAudit = async () => {
        const rawWebsite = (lead?.website || "").trim();
        if (!rawWebsite || rawWebsite === "-" || rawWebsite.toLowerCase() === "n/a" || rawWebsite.toLowerCase() === "null") {
            toast.error("Please add a valid website URL to run PageSpeed audit.");
            return;
        }

        try {
            setAuditing(true);
            await fetchBusinessPsi(lead.id);
            toast.success("PageSpeed Insights audit dispatched in background!");
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to trigger PageSpeed audit.");
        } finally {
            setAuditing(false);
        }
    };

    return (
        <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-semibold text-dark d-flex align-items-center gap-2">
                    <FiZap className="text-warning" />
                    <span>Mobile PageSpeed Audit</span>
                </h5>
                <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={auditing}
                    onClick={handleRunAudit}
                    className="d-flex align-items-center gap-1 fw-semibold"
                >
                    <FiZap />
                    <span>{auditing ? "Queuing..." : "Run Audit"}</span>
                </Button>
            </Card.Header>

            <Card.Body>
                <Row className="g-3 mb-3">
                    <Col xs={6}>
                        <div className="p-3 border rounded bg-light text-center">
                            <FiStar className="text-warning mb-1 fs-5" />
                            <div className="text-muted small">Google Rating</div>
                            <h4 className="fw-bold m-0 text-dark">
                                {audit.average_rating || audit.google_rating || "-"}
                            </h4>
                        </div>
                    </Col>

                    <Col xs={6}>
                        <div className="p-3 border rounded bg-light text-center">
                            <FiMessageSquare className="text-primary mb-1 fs-5" />
                            <div className="text-muted small">Reviews</div>
                            <h4 className="fw-bold m-0 text-dark">
                                {audit.review_count || audit.total_reviews || "0"}
                            </h4>
                        </div>
                    </Col>
                </Row>

                <div className="p-3 border rounded bg-white shadow-sm mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold text-dark">Mobile Score</span>
                        <Badge
                            bg={
                                pageSpeedScore >= 90
                                    ? "success"
                                    : pageSpeedScore >= 50
                                    ? "warning"
                                    : pageSpeedScore > 0
                                    ? "danger"
                                    : "secondary"
                            }
                            className="fs-6 px-3 py-1"
                        >
                            {pageSpeedScore > 0 ? `${pageSpeedScore} / 100` : "Not Audited"}
                        </Badge>
                    </div>

                    <div className="row g-2 mt-2 small text-center">
                        <div className="col-4">
                            <div className="p-2 border rounded bg-light">
                                <div className="text-muted">FCP</div>
                                <strong className="text-dark">{audit.mobile_fcp || "-"}</strong>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="p-2 border rounded bg-light">
                                <div className="text-muted">LCP</div>
                                <strong className="text-dark">{audit.mobile_lcp || "-"}</strong>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="p-2 border rounded bg-light">
                                <div className="text-muted">TBT</div>
                                <strong className="text-dark">{audit.mobile_tbt || "-"}</strong>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-2 border rounded bg-light">
                                <div className="text-muted">CLS</div>
                                <strong className="text-dark">{audit.mobile_cls || "-"}</strong>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-2 border rounded bg-light">
                                <div className="text-muted">Speed Index</div>
                                <strong className="text-dark">{audit.mobile_speed_index || "-"}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {audit.mobile_screenshot_url && (
                    <div className="text-center p-2 border rounded bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="fw-semibold text-muted">Mobile Screenshot</small>
                            <a
                                href={audit.mobile_screenshot_url}
                                target="_blank"
                                rel="noreferrer"
                                className="small text-primary text-decoration-none d-flex align-items-center gap-1"
                            >
                                <span>Open Full</span>
                                <FiExternalLink size={12} />
                            </a>
                        </div>
                        <a href={audit.mobile_screenshot_url} target="_blank" rel="noreferrer">
                            <img
                                src={audit.mobile_screenshot_url}
                                alt="Mobile Website Screenshot"
                                className="img-fluid rounded border shadow-sm"
                                style={{ maxHeight: "200px", objectFit: "cover" }}
                            />
                        </a>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}