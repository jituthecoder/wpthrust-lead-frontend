import { useEffect, useState } from "react";
import { Spinner, Row, Col } from "react-bootstrap";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { getLead } from "../../api/lead";

import LeadHeader from "./components/LeadHeader";
import LeadInfoCard from "./components/LeadInfoCard";
import WebsiteAuditCard from "./components/WebsiteAuditCard";
import LeadUpdateCard from "./components/LeadUpdateCard";
import ActivityTimeline from "./components/ActivityTimeline";

import "./lead.css";

export default function LeadDetails() {

    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [lead, setLead] = useState(null);

    useEffect(() => {
        loadLead();
    }, [id]);

    async function loadLead() {

        try {

            const response = await getLead(id);

            setLead(response.data.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    if (loading) {

        return (

            <DashboardLayout title="Lead Details">

                <div className="text-center py-5">

                    <Spinner animation="border" />

                </div>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout title="Lead Details">

            <LeadHeader lead={lead} />

            <Row className="g-4">

                <Col lg={8}>

                    <LeadInfoCard lead={lead} />

                </Col>

                <Col lg={4}>

                    <WebsiteAuditCard lead={lead} />

                </Col>

            </Row>

            <LeadUpdateCard
                lead={lead}
                onUpdated={setLead}
            />
            <ActivityTimeline
                activities={lead.activities}
            />

        </DashboardLayout>

    );

}