import { NavLink, useNavigate } from "react-router-dom";
import {
    FiHome,
    FiPhoneCall,
    FiCalendar,
    FiSend,
    FiMail,
    FiUsers,
    FiLogOut,
    FiX,
    FiLayers,
    FiServer,
    FiFileText,
    FiBookOpen,
} from "react-icons/fi";
import "../../assets/css/sidebar.css";
import { useAuth } from "../../contexts/AuthContext";

function Sidebar({ mobile = false, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onClose) onClose();
        logout();
        navigate("/login");
    };

    const handleNavClick = () => {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.body.classList.remove("offcanvas-open", "modal-open");
        const backdrops = document.querySelectorAll(".offcanvas-backdrop, .modal-backdrop");
        backdrops.forEach((b) => b.remove());

        if (mobile && onClose) {
            onClose();
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-brand">
                    <div className="sidebar-logo-icon">
                        <FiLayers />
                    </div>
                    <div>
                        <h3>WPThrust</h3>
                        <p>Lead CRM</p>
                    </div>
                </div>

                {mobile && (
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Close"
                        onClick={onClose}
                        data-bs-dismiss="offcanvas"
                    ></button>
                )}
            </div>

            <div className="sidebar-menu">
                <NavLink
                    to="/dashboard"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiHome />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/my-leads"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiPhoneCall />
                    <span>My Leads</span>
                </NavLink>

                <NavLink
                    to="/followups"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiCalendar />
                    <span>Follow-ups</span>
                </NavLink>

                <NavLink
                    to="/contacts"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiBookOpen />
                    <span>Contacts</span>
                </NavLink>

                <NavLink
                    to="/email-campaigns"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiSend />
                    <span>Email Campaigns</span>
                </NavLink>

                <NavLink
                    to="/email-senders"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiServer />
                    <span>Email Senders</span>
                </NavLink>

                <NavLink
                    to="/email-templates"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiFileText />
                    <span>Email Templates</span>
                </NavLink>

                <NavLink
                    to="/inbox"
                    className="nav-link"
                    onClick={handleNavClick}
                >
                    <FiMail />
                    <span>Inbox</span>
                </NavLink>

                {user?.role === "super_admin" && (
                    <NavLink
                        to="/users"
                        className="nav-link"
                        onClick={handleNavClick}
                    >
                        <FiUsers />
                        <span>Users</span>
                    </NavLink>
                )}
            </div>

            <div className="sidebar-footer">
                <button
                    className="btn btn-outline-secondary text-white border-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={handleLogout}
                >
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;