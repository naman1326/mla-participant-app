import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { saveSession, getSession } from "../utils/auth";
import logoImg from "../../data/logo.png";

export default function Login() {
    const [regNo, setRegNo] = useState("");
    const [token, setToken] = useState("");
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (getSession()) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc("participant_login", {
                p_reg_no: regNo.trim(),
                p_token: token.trim()
            });

            if (rpcError) throw rpcError;

            if (data.status === "success") {
                saveSession(data.session);
                navigate("/dashboard");
            } else {
                setError("Invalid Registration Number or Password");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Ambient Background Lighting Orbs */}
            <div className="ambient-orb orb-top-left" aria-hidden="true"></div>
            <div className="ambient-orb orb-bottom-right" aria-hidden="true"></div>

            <div className="logo-wrapper">
                <img src={logoImg} alt="Swarajya Logo" />
            </div>

            <div className="login-card glass-card">
                <div className="portal-badge-wrapper">
                    <div className="portal-badge">
                        <span className="badge-dot" aria-hidden="true"></span>
                        Official Participant Portal
                    </div>
                </div>

                <div className="brand-header">
                    <h1>Swarajya Food Pass</h1>
                    <p>Enter your details to access your food pass</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && (
                        <div className="error-banner" role="alert">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="regNo">Registration Number</label>
                        <div className="input-with-icon">
                            <span className="input-icon" aria-hidden="true">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                id="regNo"
                                type="text"
                                placeholder="Enter Reg No (e.g. REG123)"
                                value={regNo}
                                onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                                required
                                autoComplete="off"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="token">Password</label>
                        <div className="input-with-icon">
                            <span className="input-icon" aria-hidden="true">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                id="token"
                                type={showToken ? "text" : "password"}
                                placeholder="Password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                                autoComplete="off"
                                className="has-toggle"
                            />
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="btn-toggle-password"
                                aria-label={showToken ? "Hide password" : "Show password"}
                            >
                                {showToken ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08a10.43 10.43 0 0 1 1.27-.08c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" y1="2" x2="22" y2="22" />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="login-hint">
                            Have a personalized setup link? Use it to set or reset your password
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || !regNo || !token}
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="spinner-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="12" y1="2" x2="12" y2="6" />
                                    <line x1="12" y1="18" x2="12" y2="22" />
                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                                    <line x1="2" y1="12" x2="6" y2="12" />
                                    <line x1="18" y1="12" x2="22" y2="12" />
                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                                </svg>
                                <span>Verifying Credentials...</span>
                            </>
                        ) : (
                            <>
                                <span>Login</span>
                                <svg
                                    className="btn-arrow"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer-note">
                    <p>
                        <span aria-hidden="true">💡</span>
                        Keep your QR code ready at food counters for instant scanning
                    </p>
                </div>
            </div>
        </div>
    );
}