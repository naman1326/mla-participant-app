import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../utils/auth";

export default function Dashboard() {
    const [checkpoints, setCheckpoints] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const qrRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStatus(false);
    }, []);

    const fetchStatus = async (isManual = false) => {
        if (isManual) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const session = getSession();
            if (!session) throw new Error("No session found");

            const { data, error: rpcError } = await supabase.rpc("participant_status", {
                p_session: session
            });

            if (rpcError) throw rpcError;

            // If the query returns nothing, the session might be expired or invalid
            if (!data || data.length === 0) {
                handleLogout();
                return;
            }

            // Extract the user data from the first row (since it's repeated in the SQL join)
            setUserData({
                name: data[0].participant_name,
                regNo: data[0].reg_no,
                token: data[0].token,
                total: data[0].total,
                completedCount: data[0].completed_count
            });

            setCheckpoints(data);
        } catch (err) {
            console.error("Failed to fetch status:", err);
            setError("Could not load dashboard data. Please try logging in again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogout = () => {
        try {
            const session = getSession();
            if (session && supabase) {
                // Attempt to kill the session on the backend in the background
                supabase.rpc("participant_logout", { p_session: session }).catch(() => { });
            }
        } catch (err) {
            console.error("Error during backend logout:", err);
        } finally {
            clearSession();
            navigate("/");
        }
    };

    const downloadQR = async () => {
        if (!qrRef.current) return;
        try {
            const dataUrl = await toPng(qrRef.current, {
                backgroundColor: "#ffffff",
                padding: 20
            });
            const link = document.createElement("a");
            link.download = `${userData.regNo}_FoodPass.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to download QR:", err);
            alert("Could not download QR code. Please try again.");
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return <div className="loading-screen">Loading your pass...</div>;
    }

    if (error) {
        return (
            <div className="error-screen">
                <p>{error}</p>
                <button onClick={handleLogout} className="btn-secondary">Return to Login</button>
            </div>
        );
    }

    const progressPercentage = (userData.completedCount / userData.total) * 100;

    return (
        <div className="dashboard-container">
            <div className="logo-wrapper">
                <img src="/logo.png" alt="Swarajya Logo" />
            </div>
            {/* Header section */}
            <header className="dashboard-header">
                <div className="header-main">
                    <div className="header-info">
                        <p className="welcome-text">Hello,</p>
                        <h1 className="participant-name">{userData.name}</h1>
                        <p className="reg-no">{userData.regNo}</p>
                    </div>
                    <button 
                        onClick={() => fetchStatus(true)} 
                        className={`btn-refresh ${refreshing ? "spinning" : ""}`}
                        disabled={refreshing}
                        aria-label="Refresh status"
                    >
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
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Progress section */}
            <section className="progress-section">
                <div className="progress-text">
                    <span>Progress</span>
                    <span>{userData.completedCount} / {userData.total} Completed</span>
                </div>
                <div className="progress-bar-bg">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </section>

            {/* Checkpoints list */}
            <section className="checkpoints-section">
                {checkpoints.map((cp) => (
                    <div key={cp.checkpoint_code} className={`checkpoint-card ${cp.completed ? 'completed' : 'pending'}`}>
                        <div className="checkpoint-info">
                            <span className="status-icon">
                                {cp.completed ? "✔" : "□"}
                            </span>
                            <span className="checkpoint-name">{cp.checkpoint_label}</span>
                        </div>
                        <div className="checkpoint-time">
                            {cp.completed ? formatTime(cp.scanned_at) : "Pending"}
                        </div>
                    </div>
                ))}
            </section>

            {/* QR Code section */}
            <section className="qr-section">
                <h2>Your QR Code</h2>
                {/* The ref is attached to this div so the download captures the white background properly */}
                <div className="qr-wrapper" ref={qrRef}>
                    <QRCodeSVG
                        value={`https://food.swarajya-mla.club/pass?t=${userData.token}`}
                        size={200}
                        level="M"
                        includeMargin={false}
                    />
                </div>
                <button onClick={downloadQR} className="btn-primary btn-full" style={{ marginTop: "1.5rem" }}>
                    Download QR
                </button>
            </section>

            {/* Footer controls */}
            <div className="dashboard-footer">
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </div>
        </div>
    );
}