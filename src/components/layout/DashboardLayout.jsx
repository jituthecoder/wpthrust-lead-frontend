import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileSidebar from "./MobileSidebar";
import "../../assets/css/dashboardLayout.css";

export default function DashboardLayout({
    children,
    title = "",
}) {
    return (
        <div className="dashboard-layout d-flex">
            <Sidebar />
            <MobileSidebar />

            <div className="main-content">
                <Header title={title} />

                <main className="main-page">
                    {children}
                </main>
            </div>
        </div>
    );
}