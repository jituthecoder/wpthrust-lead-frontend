import { Card, Badge } from "react-bootstrap";
import { FiPhone, FiUser, FiCalendar } from "react-icons/fi";

export default function ActivityTimeline({ activities = [] }) {

    return (

        <Card className="shadow-sm border-0 mt-4">

            <Card.Header className="bg-white">

                <h5 className="mb-0">

                    Activity Timeline

                </h5>

            </Card.Header>

            <Card.Body>

                {activities.length === 0 ? (

                    <div className="text-muted">

                        No activity found.

                    </div>

                ) : (

                    activities.map((activity) => (

                        <div
                            key={activity.id}
                            className="timeline-item"
                        >

                            <div className="timeline-icon">

                                <FiPhone />

                            </div>

                            <div className="timeline-content">

                                <div className="d-flex justify-content-between">

                                    <strong>

                                        {activity.activity_type.toUpperCase()}

                                    </strong>

                                    <Badge bg="primary">

                                        {activity.status}

                                    </Badge>

                                </div>

                                <div className="text-muted small mt-2">

                                    <FiUser className="me-2" />

                                    {activity.user?.name}

                                </div>

                                {activity.comment && (

                                    <p className="mt-2 mb-2">

                                        {activity.comment}

                                    </p>

                                )}

                                {activity.followup_date && (

                                    <div className="text-muted small">

                                        <FiCalendar className="me-2" />

                                        Follow-up :

                                        {" "}

                                        {new Date(
                                            activity.followup_date
                                        ).toLocaleString()}

                                    </div>

                                )}

                                <div className="text-muted small mt-2">

                                    {new Date(
                                        activity.created_at
                                    ).toLocaleString()}

                                </div>

                            </div>

                        </div>

                    ))

                )}

            </Card.Body>

        </Card>

    );

}