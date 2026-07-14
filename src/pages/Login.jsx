import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { saveSession, getSession } from "../utils/auth";

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
                p_token: token.trim().toUpperCase()
            });

            if (rpcError) throw rpcError;

            if (data.status === "success") {
                saveSession(data.session);
                navigate("/dashboard");
            } else {
                setError("Invalid Registration Number or Token");
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
            <div className="logo-wrapper">
                <img src="/logo.png" alt="Swarajya Logo" />
            </div>
            <div className="login-card">
                <div className="brand-header">
                    <h1>Swarajya Food Pass</h1>
                    <p>Participant Portal</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && <div className="error-banner">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="regNo">Registration Number</label>
                        <input
                            id="regNo"
                            type="text"
                            placeholder="e.g. 23BCS001"
                            value={regNo}
                            onChange={(e) => setRegNo(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="token">Token</label>
                        <div className="password-wrapper">
                            <input
                                id="token"
                                type={showToken ? "text" : "password"}
                                placeholder="8-character code"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                                autoComplete="off"
                                maxLength={8}
                                style={{ textTransform: 'uppercase' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="btn-toggle-password"
                                aria-label={showToken ? "Hide token" : "Show token"}
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
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || !regNo || !token}
                    >
                        {loading ? "Verifying..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}