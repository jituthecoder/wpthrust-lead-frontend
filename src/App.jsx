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

// Email Campaigns
import EmailCampaigns from "./pages/EmailCampaigns/EmailCampaigns";
import CampaignDetails from "./pages/EmailCampaigns/CampaignDetails";

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