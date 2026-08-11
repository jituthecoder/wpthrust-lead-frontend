import {
    FiMenu,
    FiSearch,
    FiBell,
    FiSettings,
    FiLogOut,
    FiUser
} from "react-icons/fi";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Header({ title }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="crm-header">
            <div className="header-left">
                <button
                    className="menu-toggle-btn d-lg-none"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#mobileSidebar"
                    aria-controls="mobileSidebar"
                    aria-label="Toggle navigation"
                >
                    <FiMenu />
                </button>

                {title && (
                    <h4 className="m-0 fw-bold d-none d-md-block text-dark">
                        {title}
                    </h4>
                )}

                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search leads, businesses..."
                    />
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn" title="Notifications">
                    <FiBell size={18} />
                </button>

                <button className="icon-btn" title="Settings">
                    <FiSettings size={18} />
                </button>

                <Dropdown>
                    <Dropdown.Toggle
                        variant="light"
                        className="border-0 bg-transparent p-0 shadow-none"
                        id="user-dropdown-toggle"
                    >
                        <div className="user-box">
                            <div className="avatar">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="text-start d-none d-md-block">
                                <div style={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.2 }}>
                                    {user?.name}
                                </div>
                                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                    {user?.role === "super_admin" ? "Super Admin" : "Sales Executive"}
                                </small>
                            </div>
                        </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu align="end" className="shadow-sm border-0 rounded-3 mt-2">
                        <div className="px-3 py-2 border-bottom d-md-none">
                            <div className="fw-bold">{user?.name}</div>
                            <small className="text-muted">{user?.role}</small>
                        </div>

                        <Dropdown.Item className="py-2 d-flex align-items-center gap-2">
                            <FiUser className="text-muted" />
                            <span>Profile</span>
                        </Dropdown.Item>

                        <Dropdown.Divider />

                        <Dropdown.Item
                            onClick={handleLogout}
                            className="py-2 text-danger d-flex align-items-center gap-2"
                        >
                            <FiLogOut />
                            <span>Logout</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
}

export default Header;