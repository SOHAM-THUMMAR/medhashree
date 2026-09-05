import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [settings, setSettings] = useState({
    forgot_password_heading: "Reset Password"
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
        console.error("Failed to fetch forgot password settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep(2);
        setMessage({ text: data.message, type: 'success' });
      } else {
        setMessage({ text: data.error, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ text: 'Password reset successful! Redirecting...', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ text: data.error, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/10">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-black text-white italic tracking-widest inline-block mb-6">
            Quiz<span className="text-indigo-500">Hub.</span>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">{settings.forgot_password_heading}</h2>
          <p className="text-sm text-gray-400">
            {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
          </p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm font-medium mb-6 text-center ${
            message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="name@example.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-primary text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors tracking-widest text-center text-lg font-mono"
                placeholder="000000"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-primary text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setMessage({ text: '', type: '' });
                setOtp('');
              }}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to Email
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-400">
          Remember your password? <Link to="/login" className="text-indigo-500 hover:underline font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;