import DashboardLayout from "../../layouts/DashboardLayout";
import SendersTab from "../EmailCampaigns/components/SendersTab";
import { FiServer } from "react-icons/fi";

export default function EmailSenders() {
    return (
        <DashboardLayout title="Email Senders">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                        <FiServer className="text-primary" />
                        <span>Email Senders</span>
                    </h3>
                    <p className="text-muted m-0 small">
                        Manage OAuth accounts (Google, Microsoft) and SMTP/IMAP sender credentials for campaign outreach.
                    </p>
                </div>
            </div>
            <SendersTab />
        </DashboardLayout>
    );
}
