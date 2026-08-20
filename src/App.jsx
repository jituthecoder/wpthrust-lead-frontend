import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/common/ScrollToTop";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";

// Business (Super Admin)
import BusinessList from "./pages/Businesses/BusinessList";
import BusinessDetails from "./pages/Businesses/BusinessDetails";

import Users from "./pages/Users/Users";

// My Leads
import MyLeads from "./pages/MyLeads/MyLeads";
import LeadDetails from "./pages/MyLeads/LeadDetails";

// Follow-ups
import Followups from "./pages/Followups/Followups";

// Contacts & Segments
import Contacts from "./pages/Contacts/Contacts";
import ContactDetails from "./pages/Contacts/ContactDetails";

// Email Campaigns & Outbound Tools
import EmailCampaigns from "./pages/EmailCampaigns/EmailCampaigns";
import CampaignDetails from "./pages/EmailCampaigns/CampaignDetails";
import EmailSenders from "./pages/EmailSenders/EmailSenders";
import EmailTemplates from "./pages/EmailTemplates/EmailTemplates";

// Unified Inbox
import Inbox from "./pages/Inbox/Inbox";

// PSI Report
import PsiReport from "./pages/PsiReport/PsiReport";

function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>

            {/* Redirect */}
            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
            />

            {/* Public */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Super Admin */}
            <Route
                path="/businesses"
                element={
                    <ProtectedRoute>
                        <BusinessList />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/businesses/:id"
                element={
                    <ProtectedRoute>
                        <BusinessDetails />
                    </ProtectedRoute>
                }
            />

            {/* My Leads */}
            <Route
                path="/my-leads"
                element={
                    <ProtectedRoute>
                        <MyLeads />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/my-leads/:id"
                element={
                    <ProtectedRoute>
                        <LeadDetails />
                    </ProtectedRoute>
                }
            />

            {/* Follow-ups */}
            <Route
                path="/followups"
                element={
                    <ProtectedRoute>
                        <Followups />
                    </ProtectedRoute>
                }
            />

            {/* Contacts & Segment Lists */}
            <Route
                path="/contacts"
                element={
                    <ProtectedRoute>
                        <Contacts />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/contacts/:id"
                element={
                    <ProtectedRoute>
                        <ContactDetails />
                    </ProtectedRoute>
                }
            />

            {/* Email Campaigns */}
            <Route
                path="/email-campaigns"
                element={
                    <ProtectedRoute>
                        <EmailCampaigns />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/email-campaigns/:id"
                element={
                    <ProtectedRoute>
                        <CampaignDetails />
                    </ProtectedRoute>
                }
            />

            {/* Email Senders */}
            <Route
                path="/email-senders"
                element={
                    <ProtectedRoute>
                        <EmailSenders />
                    </ProtectedRoute>
                }
            />

            {/* Email Templates */}
            <Route
                path="/email-templates"
                element={
                    <ProtectedRoute>
                        <EmailTemplates />
                    </ProtectedRoute>
                }
            />

            {/* Unified Inbox */}
            <Route
                path="/inbox"
                element={
                    <ProtectedRoute>
                        <Inbox />
                    </ProtectedRoute>
                }
            />

            {/* PSI Report */}
            <Route
                path="/psi-report"
                element={
                    <ProtectedRoute>
                        <PsiReport />
                    </ProtectedRoute>
                }
            />

            {/* Users */}
            <Route
                path="/users"
                element={
                    <ProtectedRoute>
                        <Users />
                    </ProtectedRoute>
                }
            />

        </Routes>
    </>
);
}

export default App;