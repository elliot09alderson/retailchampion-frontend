import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function AdminLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        // Check if user is admin (role is now in data.data)
        if (data.data.role === 'admin') {
          navigate('/admin/lottery');
        } else {
          setError('Access denied. Admin privileges required.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#0f172a] mb-2 tracking-tight">
            Admin Login
          </h1>
          <p className="text-[#64748b] text-sm">Enter your credentials to access the control panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-[#e2e8f0] p-8 md:p-10 rounded-xl shadow-sm">
          {error && (
            <div className="mb-6 bg-[#fef2f2] border border-[#ef4444] rounded-lg p-4 text-center">
              <p className="text-[#dc2626] font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[#334155] font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                maxLength={10}
                required
                className="w-full px-4 py-3 rounded-md bg-white border border-[#e2e8f0] text-[#1f2937] placeholder-[#94a3b8] focus:ring-1 focus:ring-[#334155] focus:border-[#334155] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[#334155] font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-md bg-white border border-[#e2e8f0] text-[#1f2937] placeholder-[#94a3b8] focus:ring-1 focus:ring-[#334155] focus:border-[#334155] focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-[#334155] text-white font-medium text-lg rounded-md hover:bg-[#475569] focus:outline-none focus:ring-2 focus:ring-[#334155] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-[#334155] hover:text-[#0f172a] text-sm font-medium transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
