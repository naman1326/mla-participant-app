import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../utils/auth";
import entryIcon from "../../data/entry.png";
import plateIcon from "../../data/plate.png";
import modakIcon from "../../data/modak.png";
import malpuaIcon from "../../data/malpua.png";
import logoImg from "../../data/logo.png";

// Map checkpoint code or label to its respective emoticon image
const getCheckpointEmoticon = (cp) => {
    if (!cp) return null;
    const key = `${cp.checkpoint_code || ""} ${cp.checkpoint_label || ""}`.toLowerCase();
    if (key.includes("entry") || key.includes("gate")) return entryIcon;
    if (key.includes("plate") || key.includes("dish") || key.includes("thali")) return plateIcon;
    if (key.includes("modak")) return modakIcon;
    if (key.includes("malpua") || key.includes("malpoha")) return malpuaIcon;
    return null;
};

export default function Dashboard() {
    const [checkpoints, setCheckpoints] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    const qrRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        try {
            const session = getSession();
            if (session && supabase) {
                supabase.rpc("participant_logout", { p_session: session }).catch(() => { });
            }
        } catch (err) {
            console.error("Error during backend logout:", err);
        } finally {
            clearSession();
            navigate("/");
        }
    }, [navigate]);

    const fetchStatus = useCallback(async (isManual = false, isSilent = false) => {
        if (isManual) {
            setRefreshing(true);
        } else if (!isSilent) {
            setLoading(true);
        }
        try {
            const session = getSession();
            if (!session) throw new Error("No session found");

            const { data, error: rpcError } = await supabase.rpc("participant_status", {
                p_session: session
            });

            if (rpcError) throw rpcError;

            if (!data || data.length === 0) {
                handleLogout();
                return;
            }

            setUserData({
                name: data[0].participant_name,
                regNo: data[0].reg_no,
                token: data[0].token,
                total: data[0].total,
                completedCount: data[0].completed_count
            });

            setCheckpoints(data);
            setError("");
        } catch (err) {
            console.error("Failed to fetch status:", err);
            if (!isSilent) {
                setError("Could not load dashboard data. Please try logging in again.");
            }
        } finally {
            if (!isSilent) {
                setLoading(false);
            }
            setRefreshing(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        fetchStatus(false);
        const interval = setInterval(() => {
            fetchStatus(false, true);
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const downloadQR = async () => {
        if (!qrRef.current || downloading) return;
        setDownloading(true);
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
        } finally {
            setDownloading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Glass Skeleton Loader during initial data fetch
    if (loading) {
        return (
            <div className="app-wrapper">
                <div className="ambient-orb orb-top-left" aria-hidden="true"></div>
                <div className="ambient-orb orb-bottom-right" aria-hidden="true"></div>
                <div className="logo-wrapper">
                    <img src={logoImg} alt="Swarajya Logo" />
                </div>
                <div className="loading-skeleton-container">
                    <div className="skeleton-card glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="skeleton-circle" style={{ width: '48px', height: '48px' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                <div className="skeleton-line" style={{ width: '40%', height: '12px' }}></div>
                                <div className="skeleton-line" style={{ width: '70%', height: '22px' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="metrics-grid">
                        <div className="skeleton-card glass-card" style={{ height: '75px' }}></div>
                        <div className="skeleton-card glass-card" style={{ height: '75px' }}></div>
                        <div className="skeleton-card glass-card" style={{ height: '75px' }}></div>
                    </div>
                    <div className="skeleton-card glass-card" style={{ height: '90px' }}></div>
                    <div className="skeleton-card glass-card" style={{ height: '140px' }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-wrapper">
                <div className="ambient-orb orb-top-left" aria-hidden="true"></div>
                <div className="ambient-orb orb-bottom-right" aria-hidden="true"></div>
                <div className="error-screen">
                    <p>{error}</p>
                    <button onClick={handleLogout} className="btn-secondary">Return to Login</button>
                </div>
            </div>
        );
    }

    const completedCount = userData?.completedCount || 0;
    const totalStalls = userData?.total || checkpoints.length || 0;
    const remainingStalls = Math.max(0, totalStalls - completedCount);
    const progressPercentage = totalStalls > 0 ? (completedCount / totalStalls) * 100 : 0;
    const avatarInitial = userData?.name ? userData.name.trim().charAt(0).toUpperCase() : "P";
    const isAllCompleted = completedCount === totalStalls && totalStalls > 0;

    return (
        <div className="app-wrapper">
            {/* Ambient Background Lighting Orbs */}
            <div className="ambient-orb orb-top-left" aria-hidden="true"></div>
            <div className="ambient-orb orb-bottom-right" aria-hidden="true"></div>

            <div className="dashboard-container">
                <div className="logo-wrapper">
                    <img src={logoImg} alt="Swarajya Logo" />
                </div>

                {/* User Profile Header */}
                <header className="dashboard-header glass-card">
                    <div className="header-main">
                        <div className="header-user-info">
                            <div className="participant-avatar">{avatarInitial}</div>
                            <div className="header-details">
                                <span className="welcome-text">Welcome,</span>
                                <h1 className="participant-name">{userData?.name}</h1>
                                <div className="reg-no-tag">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <rect x="3" y="4" width="18" height="16" rx="2" />
                                        <line x1="7" y1="8" x2="17" y2="8" />
                                        <line x1="7" y1="12" x2="13" y2="12" />
                                    </svg>
                                    <span>{userData?.regNo}</span>
                                </div>
                            </div>
                        </div>

                        <div className="header-actions">
                            <div className="live-sync-badge" title="Auto syncing status live every 3 seconds">
                                <span className="live-sync-dot" aria-hidden="true"></span>
                                <span>Live 3s</span>
                            </div>
                            <button
                                onClick={() => fetchStatus(true)}
                                className={`btn-refresh ${refreshing ? "spinning" : ""}`}
                                disabled={refreshing}
                                aria-label="Refresh status"
                                title="Sync status manually"
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
                                    aria-hidden="true"
                                >
                                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                    <path d="M16 16h5v5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Metrics Overview Grid */}
                <section className="metrics-grid">
                    <div className="metric-chip glass-card total">
                        <span className="metric-value">{totalStalls}</span>
                        <span className="metric-label">Total Stalls</span>
                    </div>
                    <div className="metric-chip glass-card claimed">
                        <span className="metric-value">{completedCount}</span>
                        <span className="metric-label">Claimed</span>
                    </div>
                    <div className="metric-chip glass-card remaining">
                        <span className="metric-value">{remainingStalls}</span>
                        <span className="metric-label">Remaining</span>
                    </div>
                </section>

                {/* Pass Progress Bar */}
                <section className="progress-section glass-card">
                    <div className="progress-header">
                        <span className="progress-title">📊Pass Progress</span>
                        <span className="progress-counter-pill">
                            {completedCount} / {totalStalls} Scanned
                        </span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div className="progress-shimmer" aria-hidden="true"></div>
                        </div>
                    </div>

                    {/* Checkpoints Milestone Emoticons Tracker */}
                    {checkpoints.length > 0 && (
                        <div className="progress-emoticons-row">
                            {checkpoints.map((cp, idx) => {
                                const emoticon = getCheckpointEmoticon(cp);
                                return (
                                    <div
                                        key={cp.checkpoint_code || idx}
                                        className={`progress-emoticon-chip ${cp.completed ? "completed" : "pending"}`}
                                        title={`${cp.checkpoint_label || "Checkpoint"}: ${cp.completed ? "Scanned" : "Pending"}`}
                                    >
                                        {emoticon ? (
                                            <img
                                                src={emoticon}
                                                alt=""
                                                className="progress-chip-emoticon"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <span className="progress-chip-fallback">📍</span>
                                        )}
                                        <span className="progress-chip-status" aria-hidden="true">
                                            {cp.completed ? "✔" : idx + 1}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="progress-status-msg">
                        {isAllCompleted ? (
                            <span>🎉 All checkpoints completed!</span>
                        ) : (
                            <span>Keep going! {remainingStalls} {remainingStalls === 1 ? 'stall' : 'stalls'} remaining to scan.</span>
                        )}
                    </div>
                </section>

                {/* Checkpoints Section */}
                <section className="checkpoints-section">
                    <span className="section-label">Food Counter Checkpoints</span>
                    {checkpoints.map((cp, idx) => {
                        const emoticon = getCheckpointEmoticon(cp);
                        return (
                            <div
                                key={cp.checkpoint_code || idx}
                                className={`checkpoint-card ${cp.completed ? 'completed' : 'pending'}`}
                            >
                                <div className="checkpoint-left">
                                    <span className="stall-number">{String(idx + 1).padStart(2, '0')}</span>
                                    <span className="checkpoint-name">
                                        {emoticon && (
                                            <img
                                                src={emoticon}
                                                alt=""
                                                className="checkpoint-emoticon"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span>{cp.checkpoint_label}</span>
                                    </span>
                                </div>
                                <div className="checkpoint-right">
                                    {cp.completed ? (
                                        <span className="status-pill completed">
                                            <span aria-hidden="true">✔</span>
                                            <span>{formatTime(cp.scanned_at)}</span>
                                        </span>
                                    ) : (
                                        <span className="status-pill pending">
                                            <span className="status-dot-pending" aria-hidden="true"></span>
                                            <span>Pending Scan</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Digital Verification Pass (QR Code) */}
                <section className="qr-section glass-card">
                    <h2>Digital Verification Pass</h2>
                    <div className="qr-pass-container">
                        <div className="corner-bracket top-left" aria-hidden="true"></div>
                        <div className="corner-bracket top-right" aria-hidden="true"></div>
                        <div className="corner-bracket bottom-left" aria-hidden="true"></div>
                        <div className="corner-bracket bottom-right" aria-hidden="true"></div>

                        <div className="qr-wrapper" ref={qrRef}>
                            <QRCodeSVG
                                value={`https://food.swarajya-mla.club/pass?t=${userData?.token}`}
                                size={190}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                    </div>

                    <button
                        onClick={downloadQR}
                        className="btn-primary btn-full"
                        disabled={downloading}
                    >
                        {downloading ? (
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
                                <span>Saving Pass Image...</span>
                            </>
                        ) : (
                            <>
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
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Download QR Pass</span>
                            </>
                        )}
                    </button>
                </section>

                {/* Footer controls */}
                <footer className="dashboard-footer">
                    <button onClick={handleLogout} className="btn-logout">
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
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </footer>
            </div>
        </div>
    );
}