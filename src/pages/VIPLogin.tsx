import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { toast, Toaster } from 'react-hot-toast';

export default function VIPLogin() {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vipUserId, setVipUserId] = useState<string | null>(null);

  const handleVerifyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error('Please enter your coupon code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.VERIFY_COUPON, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: couponCode.toUpperCase() }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.needsPassword) {
          // First time login - need to set password
          setVipUserId(data.userId);
          setShowSetPassword(true);
          toast.success('Coupon verified! Please set your password.');
        } else {
          // Has password - proceed to password entry
          setVipUserId(data.userId);
          toast.success('Coupon verified! Enter your password.');
        }
      } else {
        toast.error(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.SET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: vipUserId,
          password: newPassword 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and navigate to profile
        localStorage.setItem('vip_token', data.token);
        localStorage.setItem('vip_user', JSON.stringify(data.user));
        toast.success('Password set successfully!');
        navigate('/vip/profile');
      } else {
        toast.error(data.message || 'Failed to set password');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          couponCode: couponCode.toUpperCase(),
          password 
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('vip_token', data.token);
        localStorage.setItem('vip_user', JSON.stringify(data.user));
        toast.success('Login successful!');
        navigate('/vip/profile');
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] flex items-center justify-center p-6">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md">
        {/* VIP Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 shadow-xl shadow-amber-500/30 mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            VIP <span className="text-amber-400">Portal</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Access your exclusive VIP dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {!vipUserId ? (
            // Step 1: Enter Coupon Code
            <form onSubmit={handleVerifyCoupon} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
                  Your Coupon Code
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg font-bold tracking-[0.1em] text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify Coupon
                  </>
                )}
              </button>
            </form>

          ) : showSetPassword ? (
            // Step 2a: Set Password (First time)
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                <p className="text-amber-400 text-sm font-medium text-center">
                  Welcome! Create a password to secure your VIP account.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : 'Set Password & Continue'}
              </button>
            </form>

          ) : (
            // Step 2b: Enter Password (Returning user)
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                <p className="text-emerald-400 text-sm font-medium text-center">
                  Coupon verified! Enter your password.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVipUserId(null);
                  setCouponCode('');
                  setPassword('');
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Use Different Coupon
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a href="/" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">
            ← Back to Registration
          </a>
        </div>
      </div>
    </div>
  );
}
