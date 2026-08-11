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

                                    <div className="card-header">

                                        Website Audit

                                    </div>

                                    <div className="card-body">

                                        <p>

                                            <strong>Google Rating:</strong>

                                            {" "}

                                            {business.audit?.average_rating}

                                        </p>

                                        <p>

                                            <strong>Reviews:</strong>

                                            {" "}

                                            {business.audit?.review_count}

                                        </p>

                                        <p>

                                            <strong>Mobile PageSpeed:</strong>

                                            {" "}

                                            {business.audit?.mobile_pagespeed}

                                        </p>

                                        <p>

                                            <strong>Desktop PageSpeed:</strong>

                                            {" "}

                                            {business.audit?.desktop_pagespeed}

                                        </p>

                                        <p>

                                            <strong>SEO:</strong>

                                            {" "}

                                            {business.audit?.mobile_seo}

                                        </p>

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