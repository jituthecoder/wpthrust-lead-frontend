import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getDashboard } from "../../api/dashboard";
import StatCard from "../../components/dashboard/StatCard";
import { useAuth } from "../../contexts/AuthContext";
import {
    FiUsers,
    FiPhone,
    FiCheckCircle,
    FiBriefcase,
    FiTrendingUp,
    FiAlertOctagon,
} from "react-icons/fi";
import { Spinner } from "react-bootstrap";

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const response = await getDashboard();
            setStats(response.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    if (!stats) {
        return (
            <DashboardLayout title="Dashboard">
                <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: "300px" }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Dashboard">
            {/* Welcome Banner */}
            <div
                className="card border-0 mb-4 p-4 text-white"
                style={{
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.25)"
                }}
            >
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                        <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 text-white mb-2 small">
                            <FiTrendingUp className="text-warning" />
                            <span>Overview & Stats</span>
                        </div>
                        <h2 className="fw-bold mb-1">
                            Welcome back, {user?.name || "User"} 👋
                        </h2>
                        <p className="text-slate-300 m-0" style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                            Here's what's happening across your lead pipeline today.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="row g-3 g-md-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        title="Total Businesses"
                        value={stats.total_businesses ?? 0}
                        subtitle="Google Maps Leads"
                        icon={<FiBriefcase />}
                        color="#2563eb"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        title="Assigned"
                        value={stats.assigned ?? 0}
                        subtitle="Sales Executives"
                        icon={<FiUsers />}
                        color="#10b981"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        title="Interested"
                        value={stats.interested ?? 0}
                        subtitle="Potential Clients"
                        icon={<FiCheckCircle />}
                        color="#f59e0b"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        title="Bounced Emails"
                        value={stats.bounced_emails ?? stats.bounced_leads ?? 0}
                        subtitle="Undeliverable Leads"
                        icon={<FiAlertOctagon />}
                        color="#dc2626"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <StatCard
                        title="Today's Calls"
                        value={stats.today_calls ?? 0}
                        subtitle="Completed Today"
                        icon={<FiPhone />}
                        color="#ef4444"
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}

export default Dashboard;