import DashboardLayout from "../../layouts/DashboardLayout";
import TemplatesTab from "../EmailCampaigns/components/TemplatesTab";
import { FiFileText } from "react-icons/fi";

export default function EmailTemplates() {
    return (
        <DashboardLayout title="Email Templates">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                        <FiFileText className="text-primary" />
                        <span>Email Templates</span>
                    </h3>
                    <p className="text-muted m-0 small">
                        Create, edit, and personalize reusable cold outreach email templates with dynamic merge variables.
                    </p>
                </div>
            </div>
            <TemplatesTab />
        </DashboardLayout>
    );
}
