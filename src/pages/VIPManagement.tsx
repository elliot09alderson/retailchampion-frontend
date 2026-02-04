import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

interface VIP {
  _id: string;
  name: string;
  phoneNumber: string;
  couponCode: string;
  package: number;
  vipStatus: string;
  referralCode: string | null;
  referralCount: number;
  selfieUrl?: string;
  createdAt: string;
}

interface VIPReferral {
  _id: string;
  name: string;
  phoneNumber: string;
  vipStatus: string;
  createdAt: string;
}

export default function VIPManagement() {
  const [activeTab, setActiveTab] = useState<'vip' | 'vvip'>('vip');
  const [vips, setVips] = useState<VIP[]>([]);
  const [vvips, setVvips] = useState<VIP[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVIP, setSelectedVIP] = useState<VIP | null>(null);
  const [referrals, setReferrals] = useState<VIPReferral[]>([]);
  const [referralStats, setReferralStats] = useState<{ total: number; vipCount: number; vvipCount: number } | null>(null);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = localStorage.getItem('token');

  const fetchVIPs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVips(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch VIPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVVIPs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.VVIP_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVvips(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch VVIPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async (vipId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.VIP.GENERATE_REFERRAL(vipId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Referral code generated: ${data.data.referralCode}` });
        // Refresh the list
        if (activeTab === 'vip') fetchVIPs();
        else fetchVVIPs();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate referral code' });
    }
  };

  const viewReferrals = async (vip: VIP) => {
    setSelectedVIP(vip);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.GET_REFERRALS(vip._id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReferrals(data.data.referrals);
        setReferralStats(data.data.stats);
        setShowReferralsModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'vip') {
      fetchVIPs();
    } else {
      fetchVVIPs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const currentList = activeTab === 'vip' ? vips : vvips;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              VIP <span className="text-yellow-500">Management</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage VIPs and VVIPs, generate referral codes</p>
          </div>
          <Link
            to="/admin/lottery"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
              message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('vip')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'vip'
                ? 'bg-yellow-500 text-black'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            VIP Members ({vips.length})
          </button>
          <button
            onClick={() => setActiveTab('vvip')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'vvip'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            VVIP Members ({vvips.length})
          </button>
        </div>

        {/* VIP/VVIP List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-400 mt-4">Loading...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">{activeTab === 'vip' ? '👑' : '💎'}</div>
              <p className="text-slate-400">No {activeTab.toUpperCase()} members yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Package
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Login Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Referral Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Referrals
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((vip) => (
                  <tr key={vip._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={vip.selfieUrl || '/placeholder.png'}
                          alt={vip.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/50"
                        />
                        <div>
                          <p className="font-semibold text-white">{vip.name}</p>
                          <p className="text-xs text-slate-400">{vip.phoneNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                        ₹{vip.package}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group">
                        <code className="px-2 py-1 bg-white/10 rounded text-sm font-mono text-emerald-400">
                          {vip.couponCode}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(vip.couponCode);
                            // Optional: Add simple toast or feedback here if desired
                          }}
                          className="text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy Code"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vip.referralCode ? (
                        <code className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-mono">
                          {vip.referralCode}
                        </code>
                      ) : (
                        <span className="text-slate-500 text-sm">Not generated</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewReferrals(vip)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm font-medium transition-colors"
                      >
                        {vip.referralCount} referrals
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => generateReferralCode(vip._id)}
                        disabled={!!vip.referralCode}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                          vip.referralCode
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                            : 'bg-yellow-500 text-black hover:bg-yellow-400'
                        }`}
                      >
                        {vip.referralCode ? 'Code Generated' : 'Generate Code'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Referrals Modal */}
        {showReferralsModal && selectedVIP && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Referrals by {selectedVIP.name}
                  </h2>
                  {referralStats && (
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm text-slate-400">
                        Total: <strong className="text-white">{referralStats.total}</strong>
                      </span>
                      <span className="text-sm text-yellow-400">
                        VIPs: <strong>{referralStats.vipCount}</strong>
                      </span>
                      <span className="text-sm text-purple-400">
                        VVIPs: <strong>{referralStats.vvipCount}</strong>
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowReferralsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {referrals.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No referrals yet</p>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-white">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.phoneNumber}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            r.vipStatus === 'vvip'
                              ? 'bg-purple-500/20 text-purple-400'
                              : r.vipStatus === 'vip'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {r.vipStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
