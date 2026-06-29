import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGoogleAuth from "../hooks/useGoogleAuth";
import { API_BASE } from "../config/api";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        username: "",
        password: "",
        role: "student"
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        register_heading: "Create Account",
        register_subheading: "Join Medhashree and start your tech quiz league"
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
                console.error("Failed to fetch register settings:", err);
            }
        };
        fetchSettings();
    }, []);

    // Google auth success handler
    const handleGoogleSuccess = useCallback((data) => {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        navigate("/dashboard");
    }, [navigate]);

    // Google auth error handler
    const handleGoogleError = useCallback((errorMsg) => {
        setError(errorMsg);
    }, []);

    const { loading: googleLoading, handleGoogleLogin } = useGoogleAuth({
        onSuccess: handleGoogleSuccess,
        onError: handleGoogleError,
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Save token to localStorage
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));
                
                // Redirect directly to the dashboard
                navigate("/dashboard");
            } else {
                setError(data.error || "Registration failed");
            }
        } catch {
            setError("Cannot connect to server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="text-center lg:text-left mb-6">
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                    {settings.register_heading}
                </h2>
                <p className="text-sm text-gray-400 font-light">
                    {settings.register_subheading}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-4 text-sm text-center font-medium backdrop-blur-md">
                    ⚠️ {error}
                </div>
            )}

            {/* Google Auth Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-gray-200 py-3 rounded-xl font-semibold transition-all duration-300 mb-6"
            >
                <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {googleLoading ? "Connecting..." : "Sign up with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white/5"></div>
                <span className="px-4 text-xs font-bold uppercase tracking-widest text-gray-600">or</span>
                <div className="flex-1 border-t border-white/5"></div>
            </div>

            {/* Form */}
            <form className="space-y-4 font-light" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            placeholder="johndoe123"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                        className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        placeholder="••••••••"
                    />
                </div>



                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 disabled:text-white/60 text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/30 hover:scale-[1.01] mt-6"
                >
                    {loading ? "Registering Candidate..." : "Create Account & Play"}
                </button>
            </form>

            {/* Login Prompt */}
            <div className="mt-6 text-center text-sm text-gray-500">
                Already registered?{" "}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                    Sign In
                </Link>
            </div>
        </div>
    );
}

export default Register;
