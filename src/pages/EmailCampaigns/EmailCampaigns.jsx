import { useEffect, useState } from "react";
import { Nav, Tab } from "react-bootstrap";
import { FiSend, FiMail, FiUsers, FiSliders } from "react-icons/fi";
import DashboardLayout from "../../layouts/DashboardLayout";
import CampaignsTab from "./components/CampaignsTab";
import SendersTab from "./components/SendersTab";
import TemplatesTab from "./components/TemplatesTab";

export default function EmailCampaigns() {
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("tab") || "campaigns";
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab && (tab === "senders" || tab === "templates" || tab === "campaigns")) {
            setActiveTab(tab);
        }
    }, []);

    return (
        <DashboardLayout title="Email Campaigns">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                        <FiSend className="text-primary" />
                        <span>Email Campaigns</span>
                    </h3>
                    <p className="text-muted m-0 small">
                        Automate cold outreach, manage sender accounts, and build personalized email templates.
                    </p>
                </div>
            </div>

            {/* Hunter.io Style Tabbed Navigation */}
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <div className="bg-white p-2 rounded shadow-sm mb-4 border">
                    <Nav variant="pills" className="gap-2">
                        <Nav.Item>
                            <Nav.Link
                                eventKey="campaigns"
                                className="d-flex align-items-center gap-2 py-2 px-3 fw-semibold"
                            >
                                <FiSend />
                                <span>Campaigns</span>
                            </Nav.Link>
                        </Nav.Item>

                        <Nav.Item>
                            <Nav.Link
                                eventKey="senders"
                                className="d-flex align-items-center gap-2 py-2 px-3 fw-semibold"
                            >
                                <FiMail />
                                <span>Email Senders</span>
                            </Nav.Link>
                        </Nav.Item>

                        <Nav.Item>
                            <Nav.Link
                                eventKey="templates"
                                className="d-flex align-items-center gap-2 py-2 px-3 fw-semibold"
                            >
                                <FiSliders />
                                <span>Email Templates</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>

                <Tab.Content>
                    <Tab.Pane eventKey="campaigns">
                        <CampaignsTab />
                    </Tab.Pane>

                    <Tab.Pane eventKey="senders">
                        <SendersTab />
                    </Tab.Pane>

                    <Tab.Pane eventKey="templates">
                        <TemplatesTab />
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </DashboardLayout>
    );
}
