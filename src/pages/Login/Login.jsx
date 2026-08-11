import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await loginApi(form);
            login(
                response.data.user,
                response.data.token
            );
            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center justify-content-center px-3"
            style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            }}
        >
            <div className="w-100" style={{ maxWidth: "420px" }}>
                <div className="card border-0 shadow-lg p-4 p-md-5 rounded-4">
                    <div className="text-center mb-4">
                        <div
                            className="d-inline-flex align-items-center justify-content-center text-white mb-3"
                            style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "16px",
                                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
                                fontSize: "1.5rem",
                                fontWeight: 700
                            }}
                        >
                            WP
                        </div>
                        <h3 className="fw-bold text-dark m-0">WPThrust CRM</h3>
                        <p className="text-muted small mt-1 mb-0">Sign in to manage your sales pipeline</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger border-0 small rounded-3 mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-control form-control-lg"
                                placeholder="name@company.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label small fw-semibold text-muted">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-control form-control-lg"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-100 fw-bold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-4">
                    <small className="text-muted" style={{ opacity: 0.7 }}>
                        &copy; {new Date().getFullYear()} WPThrust Lead CRM. All rights reserved.
                    </small>
                </div>
            </div>
        </div>
    );
}

export default Login;