import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { saveSession } from "../utils/auth";
import logoImg from "../../data/logo.png";

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const reg = (searchParams.get("reg") || searchParams.get("REG") || "").trim();
    const key = (searchParams.get("key") || searchParams.get("KEY") || "").trim();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const isLinkMissingParams = !reg || !key;

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setError("");

        // Client-side checks for immediate validation
        if (isLinkMissingParams) {
            setError("Invalid setup link. Registration number and setup key are required.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match. Please ensure both fields match.");
            return;
        }

        if (!supabase) {
            setError("Database connection not configured. Please contact support.");
            return;
        }

        setLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc("participant_set_password", {
                p_reg_no: reg,
                p_setup_key: key,
                p_new_password: newPassword
            });

            if (rpcError) throw rpcError;

            if (!data) {
                setError("No response received from the server. Please try again.");
                return;
            }

            if (data.status === "success") {
                saveSession(data.session);
                navigate("/dashboard");
            } else if (data.status === "password_too_short") {
                setError("Password must be at least 6 characters long.");
            } else if (data.status === "invalid_link") {
                setError("Invalid or expired setup link. The registration number or key does not match.");
            } else {
                setError(data.message || "Failed to set password. Please try again.");
            }
        } catch (err) {
            console.error("Set password error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Client-side immediate feedback indicators
    const showLengthWarning = newPassword.length > 0 && newPassword.length < 6;
    const showMismatchWarning = confirmPassword.length > 0 && newPassword !== confirmPassword;
    const showMatchSuccess = confirmPassword.length >= 6 && newPassword === confirmPassword;

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
                        Password Setup
                    </div>
                </div>

                <div className="brand-header">
                    <h1>Set Password</h1>
                    <p>Create a password to secure your food pass</p>
                </div>

                {isLinkMissingParams && (
                    <div className="error-banner" role="alert" style={{ marginBottom: "1.25rem" }}>
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
                        <span>Invalid setup link. Make sure you use the complete personalized link sent to you.</span>
                    </div>
                )}

                {error && (
                    <div className="error-banner" role="alert" style={{ marginBottom: "1.25rem" }}>
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

                <form onSubmit={handleSetPassword} className="login-form">
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
                                value={reg}
                                placeholder={isLinkMissingParams ? "No registration number found in link" : ""}
                                readOnly
                                aria-readonly="true"
                                className="input-readonly"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="newPassword">New Password</label>
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
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter at least 6 characters"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (error) setError("");
                                }}
                                required
                                autoComplete="new-password"
                                className="has-toggle"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="btn-toggle-password"
                                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                                {showNewPassword ? (
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
                        {showLengthWarning && (
                            <p className="field-hint error">
                                Password must be at least 6 characters long
                            </p>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
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
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter password to confirm"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (error) setError("");
                                }}
                                required
                                autoComplete="new-password"
                                className="has-toggle"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="btn-toggle-password"
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirmPassword ? (
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
                        {showMismatchWarning && (
                            <p className="field-hint error">
                                Passwords do not match
                            </p>
                        )}
                        {showMatchSuccess && (
                            <p className="field-hint success">
                                Passwords match
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || isLinkMissingParams || !newPassword || !confirmPassword}
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
                                <span>Setting Password...</span>
                            </>
                        ) : (
                            <>
                                <span>Set Password & Access Pass</span>
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
                        Already set your password?{" "}
                        <Link
                            to="/"
                            style={{
                                color: "var(--primary-saffron)",
                                textDecoration: "underline",
                                marginLeft: "0.25rem",
                                fontWeight: "600"
                            }}
                        >
                            Log in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
