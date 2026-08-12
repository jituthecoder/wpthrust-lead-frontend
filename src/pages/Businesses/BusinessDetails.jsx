import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getLead } from "../../api/business";

export default function BusinessDetails() {

    const { id } = useParams();

    const [business, setBusiness] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadBusiness();

    }, [id]);

    async function loadBusiness() {

        try {

            const response = await getLead(id);

            setBusiness(response.data.data);

        }

        catch (error) {

            console.error(error);

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <DashboardLayout title="Business Details">

            <div className="container-fluid py-4">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>

                        <h2 className="mb-1">

                            Business Details

                        </h2>

                        <small className="text-muted">

                            Business ID #{id}

                        </small>

                    </div>

                    <Link
                        to="/businesses"
                        className="btn btn-outline-secondary"
                    >

                        ← Back

                    </Link>

                </div>

                {loading && (

                    <div className="card">

                        <div className="card-body text-center py-5">

                            Loading...

                        </div>

                    </div>

                )}

                {!loading && business && (

                    <>

                        <div className="card shadow-sm mb-4">

                            <div className="card-body">

                                <div className="row">

                                    <div className="col-md-8">

                                        <h3>

                                            {business.business_name}

                                        </h3>

                                        <p className="text-muted">

                                            {business.category}

                                        </p>

                                    </div>

                                    <div className="col-md-4 text-end">

                                        <span className="badge bg-success">

                                            {business.lead_status}

                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="row">

                            <div className="col-lg-6">

                                <div className="card shadow-sm mb-4">

                                    <div className="card-header">

                                        Business Information

                                    </div>

                                    <div className="card-body">

                                        <p>

                                            <strong>Phone:</strong><br/>

                                            {business.phone || "-"}

                                        </p>

                                        <p>

                                            <strong>Email:</strong><br/>

                                            {business.email || "-"}

                                        </p>

                                        <p>

                                            <strong>Website:</strong><br/>

                                            <a
                                                href={business.website}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {business.website}
                                            </a>

                                        </p>

                                        <p>

                                            <strong>Address:</strong><br/>

                                            {business.address}

                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="col-lg-6">

                                <div className="card shadow-sm mb-4">

                                    <div className="card-header d-flex justify-content-between align-items-center">

                                        <span className="fw-bold">Mobile PageSpeed Audit</span>

                                        <button
                                            className="btn btn-sm btn-outline-primary fw-semibold"
                                            onClick={async () => {
                                                const toast = (await import("react-hot-toast")).default;
                                                const rawWebsite = (business?.website || "").trim();
                                                if (!rawWebsite || rawWebsite === "-" || rawWebsite.toLowerCase() === "n/a" || rawWebsite.toLowerCase() === "null") {
                                                    toast.error("Please add a valid website URL to run PageSpeed audit.");
                                                    return;
                                                }
                                                try {
                                                    const { fetchBusinessPsi } = await import("../../api/business");
                                                    await fetchBusinessPsi(id);
                                                    toast.success("PageSpeed Insights audit dispatched in background!");
                                                    loadBusiness();
                                                } catch (err) {
                                                    toast.error(err.response?.data?.message || "Failed to trigger PSI audit");
                                                }
                                            }}
                                        >
                                            ⚡ Run Audit
                                        </button>

                                    </div>

                                    <div className="card-body">

                                        <div className="row align-items-center mb-3">
                                            <div className="col-sm-6">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`badge fs-5 px-3 py-2 ${
                                                        Number(business.audit?.mobile_pagespeed) >= 90 ? 'bg-success' :
                                                        Number(business.audit?.mobile_pagespeed) >= 50 ? 'bg-warning text-dark' :
                                                        business.audit?.mobile_pagespeed ? 'bg-danger' : 'bg-secondary'
                                                    }`}>
                                                        {business.audit?.mobile_pagespeed ? `${business.audit.mobile_pagespeed} / 100` : 'N/A'}
                                                    </span>
                                                    <span className="text-muted small">Mobile Score</span>
                                                </div>
                                            </div>
                                            <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
                                                <small className="text-muted">
                                                    Status: <span className="badge bg-info text-dark">{business.audit?.psi_status || 'pending'}</span>
                                                </small>
                                            </div>
                                        </div>

                                        <div className="row g-2 mb-3 small">
                                            <div className="col-6 col-md-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <div className="text-muted">FCP</div>
                                                    <strong className="text-dark">{business.audit?.mobile_fcp || '-'}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <div className="text-muted">LCP</div>
                                                    <strong className="text-dark">{business.audit?.mobile_lcp || '-'}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <div className="text-muted">TBT</div>
                                                    <strong className="text-dark">{business.audit?.mobile_tbt || '-'}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <div className="text-muted">CLS</div>
                                                    <strong className="text-dark">{business.audit?.mobile_cls || '-'}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <div className="text-muted">Speed Index</div>
                                                    <strong className="text-dark">{business.audit?.mobile_speed_index || '-'}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {business.audit?.mobile_screenshot_url && (
                                            <div className="mt-3 text-center">
                                                <small className="text-muted d-block mb-1">Mobile Website Screenshot</small>
                                                <a href={business.audit.mobile_screenshot_url} target="_blank" rel="noreferrer">
                                                    <img
                                                        src={business.audit.mobile_screenshot_url}
                                                        alt="Mobile Screenshot"
                                                        className="img-fluid rounded border shadow-sm"
                                                        style={{ maxHeight: "220px", objectFit: "cover" }}
                                                    />
                                                </a>
                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="card shadow-sm">

                            <div className="card-header">

                                Activity Timeline

                            </div>

                            <div className="card-body">

                                {business.activities.length === 0 ? (

                                    <p>No activities found.</p>

                                ) : (

                                    business.activities.map((activity) => (

                                        <div
                                            key={activity.id}
                                            className="border-bottom pb-3 mb-3"
                                        >

                                            <strong>

                                                {activity.activity_type}

                                            </strong>

                                            {" - "}

                                            {activity.status}

                                            <br/>

                                            {activity.comment}

                                            <br/>

                                            <small className="text-muted">

                                                {activity.created_at}

                                            </small>

                                        </div>

                                    ))

                                )}

                            </div>

                        </div>

                    </>

                )}

            </div>

        </DashboardLayout>

    );

}