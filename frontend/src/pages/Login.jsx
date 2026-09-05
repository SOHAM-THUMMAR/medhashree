import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGoogleAuth from "../hooks/useGoogleAuth";
import { API_BASE } from "../config/api";

function Login() {
    const navigate = useNavigate();
    const [step, setStep] = useState("email"); // "email" | "password" | "otp"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpMessage, setOtpMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        login_heading: "Welcome Back",
        login_subheading: "Enter your credentials to enter the quiz arena"
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/site-settings`);
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings(prev => ({
                        ...prev,
                        ...data.data
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch login settings:", err);
            }
        };
        fetchSettings();
    }, []);

    // Google auth success handler
    const handleGoogleSuccess = useCallback((data) => {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        const role = data.data.user.role;
        if (role === 'admin') {
            navigate("/admin");
        } else {
            navigate("/dashboard");
        }
    }, [navigate]);

    // Google auth error handler
    const handleGoogleError = useCallback((errorMsg) => {
        setError(errorMsg);
    }, []);

    const { loading: googleLoading, handleGoogleLogin } = useGoogleAuth({
        onSuccess: handleGoogleSuccess,
        onError: handleGoogleError,
    });

    // Step 1: Handle Email Check
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/check-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Failed to find account with this email.");
                setLoading(false);
                return;
            }

            if (data.isAdmin) {
                setStep("otp");
                setOtpMessage(data.message || "OTP verification code sent to your admin email.");
            } else {
                setStep("password");
            }
        } catch {
            setError("Cannot connect to server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2A: Handle Password Login (Non-Admin)
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));
                
                const role = data.data.user.role;
                if (role === 'admin') {
                    navigate("/admin");
                } else {
                    navigate("/dashboard");
                }
            } else {
                setError(data.error || "Login failed. Check your password.");
            }
        } catch {
            setError("Cannot connect to server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2B: Handle Admin OTP Verification
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/verify-admin-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: otpCode })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));
                navigate("/admin");
            } else {
                setError(data.error || "Invalid OTP verification code");
            }
        } catch {
            setError("Cannot connect to server for OTP verification");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToEmail = () => {
        setStep("email");
        setError("");
        setPassword("");
        setOtpCode("");
    };

    return (
        <div>
            {/* Header */}
            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                    {settings.login_heading}
                </h2>
                <p className="text-sm text-gray-400 font-light">
                    {settings.login_subheading}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm text-center font-medium backdrop-blur-md">
                    ⚠️ {error}
                </div>
            )}

            {/* Step 1: Initial Email Form */}
            {step === "email" && (
                <form className="space-y-6" onSubmit={handleEmailSubmit}>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-light"
                            placeholder="you@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.99] text-sm disabled:opacity-50"
                    >
                        {loading ? 'Checking Account...' : 'Continue →'}
                    </button>
                </form>
            )}

            {/* Step 2A: Password Form (Non-Admin) */}
            {step === "password" && (
                <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-gray-300 font-medium truncate max-w-[220px]">
                            📧 {email}
                        </span>
                        <button
                            type="button"
                            onClick={handleBackToEmail}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                            Change
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                                Password
                            </label>
                            <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-light"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.99] text-sm disabled:opacity-50"
                    >
                        {loading ? 'Entering Arena...' : 'Enter Arena'}
                    </button>
                </form>
            )}

            {/* Step 2B: Admin OTP Form */}
            {step === "otp" && (
                <form className="space-y-6" onSubmit={handleOtpSubmit}>
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl text-center">
                        <span className="text-2xl block mb-1">👑</span>
                        <h3 className="text-sm font-bold text-indigo-300">Admin 2FA Security Required</h3>
                        <p className="text-xs text-gray-300 mt-1">{otpMessage}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                            6-Digit Admin Verification OTP
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            required
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl border border-indigo-500/40 bg-indigo-950/40 text-center font-mono text-xl tracking-[8px] text-indigo-200 placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-all font-bold"
                            placeholder="123456"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.99] text-sm disabled:opacity-50"
                    >
                        {loading ? 'Verifying Admin OTP...' : '🔑 Verify & Access Admin Panel'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleBackToEmail}
                            className="text-xs text-gray-400 hover:text-white transition"
                        >
                            ← Change Email
                        </button>
                    </div>
                </form>
            )}

            {/* Divider */}
            <div className="flex items-center my-8">
                <div className="flex-1 border-t border-white/5"></div>
                <span className="px-4 text-xs font-bold uppercase tracking-widest text-gray-600">or</span>
                <div className="flex-1 border-t border-white/5"></div>
            </div>

            {/* Google Auth Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-gray-200 py-3.5 rounded-xl font-semibold transition-all duration-300"
            >
                <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {googleLoading ? "Connecting..." : "Sign in with Google"}
            </button>

            {/* Registration Prompt */}
            <div className="mt-8 text-center text-sm text-gray-500">
                New to the league?{" "}
                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                    Create Account
                </Link>
            </div>
        </div>
    );
}

export default Login;