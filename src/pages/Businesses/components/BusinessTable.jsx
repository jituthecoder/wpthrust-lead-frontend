// import { Badge, Button } from "react-bootstrap";
import "./BusinessTable.css";

import { FiEye, FiPhone } from "react-icons/fi";
import { Badge, Button, ButtonGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function BusinessTable({ businesses }) {

    const navigate = useNavigate();

    return (
        <div className="card shadow-sm border-0">

            <div className="card-body p-0">

                <div className="table-responsive">

                    <table className="table business-table align-middle mb-0">

                        <thead>

                            <tr>

                                <th width="70">#</th>

                                <th>Business</th>

                                <th width="180">Category</th>

                                <th width="170">Phone</th>

                                <th width="140">Status</th>

                                <th width="180">Assigned</th>

                                {/* <th width="100">Rating</th> */}

                                <th width="100" className="text-center">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {businesses.map((business) => (

                                <tr key={business.id}>

                                    <td>{business.id}</td>

                                    <td>

                                        <div className="business-name">

                                            {business.business_name}

                                        </div>

                                        <div className="business-location">

                                            {business.city}, {business.state}

                                        </div>

                                        {business.website && (

                                            <a
                                                href={business.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="business-link"
                                            >
                                                Visit Website
                                            </a>

                                        )}

                                    </td>

                                    <td>

                                        {business.category}

                                    </td>

                                    <td>

                                        {business.phone || "-"}

                                    </td>

                                    <td>

                                        <Badge
                                            bg={
                                                business.lead_status === "new"
                                                    ? "primary"
                                                    : business.lead_status === "interested"
                                                    ? "success"
                                                    : business.lead_status === "call_later"
                                                    ? "warning"
                                                    : business.lead_status === "converted"
                                                    ? "dark"
                                                    : "secondary"
                                            }
                                        >

                                            {business.lead_status}

                                        </Badge>

                                    </td>

                                    <td>

                                        {business.assigned_user ? (

                                            <>
                                                <div className="fw-semibold">

                                                    {business.assigned_user.name}

                                                </div>

                                                <small className="text-muted">

                                                    Sales Executive

                                                </small>
                                            </>

                                        ) : (

                                            <span className="text-muted">

                                                Unassigned

                                            </span>

                                        )}

                                    </td>

                                    {/* <td>

                                        ⭐ {business.audit?.average_rating ?? "-"}

                                    </td> */}

                                    <td className="text-center">

                                        <ButtonGroup>

                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => navigate(`/businesses/${business.id}`)}
                                            >

                                                <FiEye />

                                            </Button>

                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                href={`tel:${business.phone}`}
                                                disabled={!business.phone}
                                            >

                                                <FiPhone />

                                            </Button>

                                        </ButtonGroup>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}