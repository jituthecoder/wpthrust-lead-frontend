import { Card, Col, Row } from "react-bootstrap";
import {
    FiCalendar,
    FiClock,
    FiAlertCircle,
} from "react-icons/fi";

export default function FollowupStats({
    todayCount,
    upcomingCount,
    overdueCount,
    activeTab,
    setActiveTab,
}) {

    const cards = [
        {
            key: "today",
            title: "Today's Follow-ups",
            value: todayCount,
            icon: <FiCalendar size={26} />,
            color: "primary",
        },
        {
            key: "upcoming",
            title: "Upcoming",
            value: upcomingCount,
            icon: <FiClock size={26} />,
            color: "success",
        },
        {
            key: "overdue",
            title: "Overdue",
            value: overdueCount,
            icon: <FiAlertCircle size={26} />,
            color: "danger",
        },
    ];

    return (

        <Row className="g-4">

            {cards.map((card) => (

                <Col lg={4} md={4} sm={12} key={card.key}>

                    <Card
                        className={`followup-stat-card shadow-sm border-0 ${
                            activeTab === card.key
                                ? "active"
                                : ""
                        }`}
                        onClick={() => setActiveTab(card.key)}
                    >

                        <Card.Body>

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <small className="text-muted">

                                        {card.title}

                                    </small>

                                    <h2 className="mt-2 mb-0">

                                        {card.value}

                                    </h2>

                                </div>

                                <div
                                    className={`stat-icon bg-${card.color}`}
                                >

                                    {card.icon}

                                </div>

                            </div>

                        </Card.Body>

                    </Card>

                </Col>

            ))}

        </Row>

    );

}