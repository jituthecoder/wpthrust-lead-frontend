import { Table, Badge, Button, Spinner } from "react-bootstrap";
import { FiPhone, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function FollowupTable({

    loading,

    followups,

}) {

    const navigate = useNavigate();

    const getStatusColor = (status) => {

        switch (status) {

            case "interested":
                return "success";

            case "call_later":
                return "warning";

            case "converted":
                return "primary";

            case "not_interested":
                return "danger";

            default:
                return "secondary";

        }

    };

    if (loading) {

        return (

            <div className="text-center py-5">

                <Spinner animation="border" />

            </div>

        );

    }

    return (

        <div className="card shadow-sm border-0">

            <div className="table-responsive">

                <Table hover className="align-middle mb-0">

                    <thead className="table-light">

                        <tr>

                            <th>Business</th>

                            <th>Phone</th>

                            <th>Status</th>

                            <th>Follow-up</th>

                            <th>Assigned To</th>

                            <th width="170">

                                Action

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {followups.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="text-center py-5"
                                >

                                    No follow-ups found.

                                </td>

                            </tr>

                        ) : (

                            followups.map((lead) => (

                                <tr key={lead.id}>

                                    <td>

                                        <strong>

                                            {lead.business_name}

                                        </strong>

                                        <div className="text-muted small">

                                            {lead.city}

                                        </div>

                                    </td>

                                    <td>

                                        {lead.phone}

                                    </td>

                                    <td>

                                        <Badge bg={getStatusColor(lead.lead_status)}>

                                            {lead.lead_status}

                                        </Badge>

                                    </td>

                                    <td>

                                        {lead.next_followup_at
                                            ? new Date(
                                                lead.next_followup_at
                                            ).toLocaleString()
                                            : "-"}

                                    </td>

                                    <td>

                                        {lead.assigned_user?.name || "-"}

                                    </td>

                                    <td>

                                        <div className="d-flex gap-2">

                                            <Button
                                                variant="success"
                                                size="sm"
                                                href={`tel:${lead.phone}`}
                                            >

                                                <FiPhone />

                                            </Button>

                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() =>
                                                    navigate(`/my-leads/${lead.id}`)
                                                }
                                            >

                                                <FiEye />

                                            </Button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </Table>

            </div>

        </div>

    );

}