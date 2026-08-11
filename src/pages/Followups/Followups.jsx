import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";

import DashboardLayout from "../../components/layout/DashboardLayout";

import {
    getTodayFollowups,
    getUpcomingFollowups,
    getOverdueFollowups,
} from "../../api/followup";
// import {
//     getTodayFollowups,
//     getUpcomingFollowups,
//     getOverdueFollowups,
// } from "../../api/followups";

import FollowupStats from "./components/FollowupStats";
import FollowupFilters from "./components/FollowupFilters";
import FollowupTable from "./components/FollowupTable";


import "./followups.css";

export default function Followups() {

    const [loading, setLoading] = useState(true);

    const [today, setToday] = useState([]);

    const [upcoming, setUpcoming] = useState([]);

    const [overdue, setOverdue] = useState([]);

    const [activeTab, setActiveTab] = useState("today");

    useEffect(() => {

        loadFollowups();

    }, []);

    async function loadFollowups() {

        try {

            setLoading(true);

            const [
                todayResponse,
                upcomingResponse,
                overdueResponse,
            ] = await Promise.all([

                getTodayFollowups(),

                getUpcomingFollowups(),

                getOverdueFollowups(),

            ]);

            setToday(todayResponse.data.data.data);

            setUpcoming(upcomingResponse.data.data.data);

            setOverdue(overdueResponse.data.data.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    const getCurrentData = () => {

        switch (activeTab) {

            case "upcoming":
                return upcoming;

            case "overdue":
                return overdue;

            default:
                return today;

        }

    };

    return (

        <DashboardLayout title="Follow-ups">
            <div className="mb-4">
                <h3 className="fw-bold m-0 text-dark">Follow-ups Schedule</h3>
                <p className="text-muted m-0 small">Track call reminders, upcoming meetings, and overdue leads</p>
            </div>

            <Row className="g-3">
                <Col sm={12}>
                    <FollowupStats
                        todayCount={today.length}
                        upcomingCount={upcoming.length}
                        overdueCount={overdue.length}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </Col>
            </Row>

            <Row className="mt-3">
                <Col sm={12}>
                    <FollowupFilters />
                </Col>
            </Row>

            <Row className="mt-3">
                <Col sm={12}>
                    <FollowupTable
                        loading={loading}
                        followups={getCurrentData()}
                    />
                </Col>
            </Row>
        </DashboardLayout>

    );

}