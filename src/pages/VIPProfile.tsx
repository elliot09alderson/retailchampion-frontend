import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { toast, Toaster } from 'react-hot-toast';

interface VIPUser {
  _id: string;
  name: string;
  phoneNumber: string;
  couponCode: string;
  vipStatus: 'vip' | 'vvip';
  referralCode?: string;
  package: number;
  createdAt: string;
  gallery?: string[];
}

interface Referral {
  _id: string;
  name: string;
  phoneNumber: string;
  vipStatus: string;
  createdAt: string;
}

interface ReferralStats {
  total: number;
  vipCount: number;
  vvipCount: number;
}

interface GalleryItem {
  _id: string;
  imageUrl: string;
  heading?: string;
  subheading?: string;
  description?: string;
  createdAt: string;
}

interface LotteryWinner {
  _id: string;
  eventName: string;
  completedAt: string;
  winners: {
    _id: string;
    name: string;
    selfieUrl?: string;
  }[];
  prizes: number[];
}

export default function VIPProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<VIPUser | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [lotteryHistory, setLotteryHistory] = useState<LotteryWinner[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, vipCount: 0, vvipCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchGallery();
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
        const token = localStorage.getItem('vip_token');
        if (!token) return;
        
        const res = await fetch(API_ENDPOINTS.LOTTERY.PUBLIC_WINNERS, {
             headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) setLotteryHistory(data.data);
    } catch(e) { console.error(e); }
  };

  const fetchGallery = async () => {
    try {
        const res = await fetch(API_ENDPOINTS.GALLERY.LIST);
        const data = await res.json();
        if(data.success) setGalleryItems(data.data);
    } catch(e) { console.error(e); }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('vip_token');
    if (!token) {
      navigate('/vip/login');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.VIP.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setReferrals(data.data.referrals || []);
        setStats(data.data.referralStats || { total: 0, vipCount: 0, vvipCount: 0 });
      } else {
        toast.error(data.message || 'Failed to load profile');
        localStorage.removeItem('vip_token');
        localStorage.removeItem('vip_user');
        navigate('/vip/login');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vip_token');
    localStorage.removeItem('vip_user');
    navigate('/vip/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isVVIP = user.vipStatus === 'vvip';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-4 md:p-8">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
              isVVIP 
                ? 'bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-purple-600 shadow-purple-500/30'
                : 'bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 shadow-amber-500/30'
            }`}>
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {isVVIP ? 'VVIP' : 'VIP'} <span className={isVVIP ? 'text-purple-400' : 'text-amber-400'}>Profile</span>
              </h1>
              <p className="text-slate-400 text-sm">Welcome back, {user.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all"
          >
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 md:p-8 mb-6 ${
          isVVIP ? 'border-purple-500/30' : 'border-amber-500/30'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Full Name</label>
                <p className="text-white text-lg font-bold">{user.name}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone Number</label>
                <p className="text-white text-lg font-bold">{user.phoneNumber}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Package</label>
                <p className="text-white text-lg font-bold">₹{user.package.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Your Coupon Code</label>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-lg font-black tracking-widest font-mono">{user.couponCode}</span>
                  <button onClick={() => copyToClipboard(user.couponCode)} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  isVVIP 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isVVIP ? '⭐ VVIP' : '★ VIP'}
                </span>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Your Referral Code</label>
                {user.referralCode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-lg font-black tracking-widest font-mono">{user.referralCode}</span>
                    <button onClick={() => copyToClipboard(user.referralCode!)} className="text-slate-400 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">Contact admin to generate your referral code</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {galleryItems.length > 0 && (
           <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
               <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                   </div>
                   <div>
                       <h2 className="text-xl font-black text-white">Winner's Hall of Fame</h2>
                       <p className="text-slate-400 text-xs mt-0.5">Celebrating our champions</p>
                   </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryItems.map((item) => (
                      <div 
                        key={item._id} 
                        className="group flex flex-col"
                      >
                          <div 
                              className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-xl cursor-pointer hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-1 mb-3"
                              onClick={() => window.open(item.imageUrl, '_blank')}
                          >
                              <img src={item.imageUrl} alt="Winner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                  <span className="text-white text-xs font-bold uppercase tracking-widest text-center py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">View Full</span>
                              </div>
                          </div>
                          {(item.heading || item.subheading || item.description) && (
                              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                  {item.heading && <h3 className="text-sm font-bold text-white mb-1 truncate">{item.heading}</h3>}
                                  {item.subheading && <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2 truncate">{item.subheading}</p>}
                                  {item.description && <p className="text-xs text-slate-300 font-medium leading-relaxed">{item.description}</p>}
                              </div>
                          )}
                      </div>
                  ))}
               </div>
           </div>
        )}

        {/* Latest Champions Section */}
        {lotteryHistory.length > 0 && (
           <div className="mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
               <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-lg shadow-lg shadow-emerald-500/20">
                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div>
                       <h2 className="text-xl font-black text-white">Latest Champions</h2>
                       <p className="text-slate-400 text-xs mt-0.5">Recent winners and their prizes</p>
                   </div>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                   <div className="overflow-x-auto">
                       <table className="w-full">
                           <thead className="bg-white/5 border-b border-white/5">
                               <tr>
                                   <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Winner</th>
                                   <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Prize</th>
                                   <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Contest</th>
                                   <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                               {lotteryHistory.flatMap(lottery => 
                                   lottery.winners.map((winner, idx) => ({
                                       ...winner,
                                       prize: lottery.prizes[idx] || 0,
                                       contestName: lottery.eventName,
                                       date: lottery.completedAt,
                                       lotteryId: lottery._id
                                   }))
                               ).slice(0, 10).map((item, i) => ( 
                                   <tr key={`${item.lotteryId}-${item._id}-${i}`} className="hover:bg-white/5 transition-colors">
                                       <td className="p-4">
                                           <div className="flex items-center gap-3">
                                               <img 
                                                   src={item.selfieUrl || "https://ui-avatars.com/api/?name=" + item.name} 
                                                   alt={item.name}
                                                   className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
                                               />
                                               <span className="font-bold text-white text-sm">{item.name}</span>
                                           </div>
                                       </td>
                                       <td className="p-4">
                                           <span className="text-emerald-400 font-black text-sm">₹{item.prize.toLocaleString()}</span>
                                       </td>
                                       <td className="p-4">
                                           <span className="text-slate-300 text-xs font-bold bg-white/5 px-2 py-1 rounded-lg">{item.contestName}</span>
                                       </td>
                                       <td className="p-4 text-right text-slate-500 text-xs font-medium">
                                           {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
             <p className={`text-4xl font-black ${isVVIP ? 'text-purple-400' : 'text-amber-400'}`}>{stats.total}</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Total Referrals</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
             <p className="text-4xl font-black text-amber-400">{stats.vipCount}</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">VIP Members</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
             <p className="text-4xl font-black text-purple-400">{stats.vvipCount}</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">VVIP Members</p>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-black text-white">Your Referrals</h2>
            <p className="text-slate-400 text-sm mt-1">Members who joined using your referral code</p>
          </div>

          {referrals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">No referrals yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Share your referral code to grow your network!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">#</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals.map((ref, idx) => (
                    <tr key={ref._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-4 text-white font-bold">{ref.name}</td>
                      <td className="p-4 text-slate-300">{ref.phoneNumber}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase ${
                          ref.vipStatus === 'vvip' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : ref.vipStatus === 'vip'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {ref.vipStatus === 'vvip' ? 'VVIP' : ref.vipStatus === 'vip' ? 'VIP' : 'Member'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VVIP Progress (if VIP) */}
        {!isVVIP && (
          <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold">VVIP Progress</h3>
                <p className="text-purple-300 text-sm">Refer 10 VIPs to become VVIP</p>
              </div>
              <span className="text-purple-400 font-black text-2xl">{stats.vipCount}/10</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.vipCount / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
