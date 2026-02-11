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
  referralFormsLeft?: number;
  vipReferralFormsLeft?: number;
  retailReferralFormsLeft?: number;
  referralExpiryDate?: string;
  retailReferralExpiryDate?: string;
  vipReferralExpiryDate?: string;
  activeRetailPackName?: string;
  activeVipPackName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
}

interface Referral {
  _id: string;
  name: string;
  phoneNumber: string;
  vipStatus: string;
  package: number;
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
  const [rechargeHistory, setRechargeHistory] = useState<any[]>([]);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerFormType, setRegisterFormType] = useState<'retail' | 'vip'>('retail');
  const [showReferrals, setShowReferrals] = useState(false);
  const [referralTypeFilter, setReferralTypeFilter] = useState<'all' | 'vip' | 'retail' | 'vvip'>('all');
  const [packageFilter, setPackageFilter] = useState<number | 'all'>('all');
  const [registerData, setRegisterData] = useState<{name: string, phoneNumber: string, packageAmount: string, image: File | null, idNumber: string, billImage: File | null}>({ 
      name: '', 
      phoneNumber: '',
      packageAmount: '',
      image: null,
      idNumber: '',
      billImage: null
  });
  const [registeredUserCode, setRegisteredUserCode] = useState<string | null>(null);
  
  // KYC Modal State
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycData, setKycData] = useState({
    aadhaarNumber: '',
    panNumber: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    phoneNumber: ''
  });

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
        setKycData({
            aadhaarNumber: data.data.user.aadhaarNumber || '',
            panNumber: data.data.user.panNumber || '',
            bankName: data.data.user.bankName || '',
            bankAccountNumber: data.data.user.bankAccountNumber || '',
            ifscCode: data.data.user.ifscCode || '',
            phoneNumber: data.data.user.phoneNumber || ''
        });
        setReferrals(data.data.referrals || []);
        setStats(data.data.referralStats || { total: 0, vipCount: 0, vvipCount: 0 });
        setRechargeHistory(data.data.rechargeHistory || []);
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

  const handleUpdateKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('vip_token');
        const res = await fetch(API_ENDPOINTS.VIP.PROFILE, {
             method: 'PUT',
             headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
             },
             body: JSON.stringify(kycData)
        });
        const data = await res.json();
        if(data.success) {
            toast.success('KYC Details updated successfully');
            setShowKYCModal(false);
            fetchProfile();
        } else {
             toast.error(data.message || 'Update failed');
        }
    } catch(e) {
        toast.error('Update failed');
    }
  };

  const handleRegisterReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('vip_token');
        const formData = new FormData();
        formData.append('name', registerData.name);
        formData.append('phoneNumber', registerData.phoneNumber);
        formData.append('formType', registerFormType);
        if (registerFormType === 'vip' && registerData.packageAmount) {
            formData.append('packageAmount', registerData.packageAmount);
        }
        if (registerData.image) {
            formData.append('image', registerData.image);
        }
        if (registerData.idNumber) {
            formData.append('idNumber', registerData.idNumber);
        }
        if (registerData.billImage) {
            formData.append('billImage', registerData.billImage);
        }

        const res = await fetch(API_ENDPOINTS.VIP.REGISTER_REFERRAL, {
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${token}` 
                // Content-Type not set for FormData
            },
            body: formData
        });
        const data = await res.json();
        if(data.success) {
            toast.success('Registration successful');
            setShowRegisterModal(false);
            setRegisteredUserCode(data.data.couponCode); // Show success modal
            setRegisterData({ name: '', phoneNumber: '', packageAmount: '', image: null, idNumber: '', billImage: null });
            fetchProfile(); // Refresh stats
        } else {
            toast.error(data.message);
        }
    } catch(e) {
        toast.error('Registration failed');
    }
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

  const getPackageName = (amount: number) => {
    if (amount === 999 || amount === 1000) return 'Basic';
    if (amount === 4500) return 'Advance';
    if (amount >= 8000) return 'Premium';
    return `₹${amount.toLocaleString()}`;
  };

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
        
        {/* Buttons Row */}
        <div className="flex justify-end mb-4">
            <button
                onClick={() => setShowKYCModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z" /></svg>
                Manage KYC & Banking
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
                <p className="text-white text-lg font-bold">{getPackageName(user.package)}</p>
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

        {/* Minimal Referral Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white/5 border border-white/10 rounded-2xl p-4">
             <div className="flex items-center gap-6">
                 <div>
                     <p className="text-2xl font-black text-emerald-400">{user.retailReferralFormsLeft || 0}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Retail Forms 
                        {user.activeRetailPackName ? (
                            <span className="block text-emerald-500 normal-case mt-0.5">{user.activeRetailPackName}</span>
                        ) : (
                            (user.retailReferralFormsLeft || 0) > 0 && <span className="block text-emerald-500/50 normal-case text-[10px] italic mt-0.5">Standard Pack</span>
                        )}
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1">
                        Expires: <span className="text-white">{user.retailReferralExpiryDate ? new Date(user.retailReferralExpiryDate).toLocaleDateString() : (user.referralExpiryDate ? new Date(user.referralExpiryDate).toLocaleDateString() : 'No Expiry')}</span>
                     </p>
                 </div>
                 <div className="h-10 w-px bg-white/10"></div>
                 <div>
                     <p className="text-2xl font-black text-yellow-400">{user.vipReferralFormsLeft || 0}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        VIP Forms
                        {user.activeVipPackName ? (
                            <span className="block text-yellow-500 normal-case mt-0.5">{user.activeVipPackName}</span>
                        ) : (
                            (user.vipReferralFormsLeft || 0) > 0 && <span className="block text-yellow-500/50 normal-case text-[10px] italic mt-0.5">Standard Pack</span>
                        )}
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1">
                        Expires: <span className="text-white">{user.vipReferralExpiryDate ? new Date(user.vipReferralExpiryDate).toLocaleDateString() : (user.referralExpiryDate ? new Date(user.referralExpiryDate).toLocaleDateString() : 'No Expiry')}</span>
                     </p>
                 </div>
             </div>
             
             <div className="flex gap-3 w-full md:w-auto">
                <button 
                    onClick={() => { setRegisterFormType('retail'); setShowRegisterModal(true); }}
                    disabled={(user.retailReferralFormsLeft || 0) <= 0}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                        (user.retailReferralFormsLeft || 0) > 0 
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30 cursor-pointer' 
                        : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                    }`}
                >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                     Retail Form
                </button>
                <button 
                     onClick={() => { setRegisterFormType('vip'); setShowRegisterModal(true); }}
                     disabled={(user.vipReferralFormsLeft || 0) <= 0}
                     className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                        (user.vipReferralFormsLeft || 0) > 0 
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30 cursor-pointer' 
                        : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                    }`}
                >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                     VIP Form
                </button>
             </div>
        </div>

        {/* Recharge History Section */}
        {rechargeHistory.length > 0 && (
            <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Recharge History</h2>
                        <p className="text-xs text-slate-400">Track your past recharges and their validity</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-white/10">
                                <th className="pb-3 pl-2 font-bold uppercase tracking-wider">Date</th>
                                <th className="pb-3 font-bold uppercase tracking-wider">Pack Name</th>
                                <th className="pb-3 font-bold uppercase tracking-wider">Forms</th>
                                <th className="pb-3 font-bold uppercase tracking-wider">Available</th>
                                <th className="pb-3 font-bold uppercase tracking-wider">Price</th>
                                <th className="pb-3 pr-2 font-bold uppercase tracking-wider text-right">Expiry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rechargeHistory.map((item: any) => (
                                <tr key={item._id} className="text-sm group hover:bg-white/5 transition-colors">
                                    <td className="py-3 pl-2 text-slate-400 font-mono">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 font-bold text-white">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${item.type === 'vip' ? 'bg-yellow-500' : 'bg-emerald-500'}`}></span>
                                            {item.packName}
                                        </div>
                                    </td>
                                    <td className="py-3 text-slate-300">
                                        {item.referralForms} Forms
                                    </td>
                                    <td className="py-3 text-emerald-400 font-bold">
                                        {item.referralForms - (item.formsUsed || 0)} Left
                                    </td>
                                    <td className="py-3 text-yellow-400 font-mono font-bold">
                                        ₹{item.price || 0}
                                    </td>
                                    <td className="py-3 pr-2 text-right">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${new Date(item.expiryDate) < new Date() ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {new Date(item.expiryDate).toLocaleDateString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Latest Champions / Referrals Section */}
        {(lotteryHistory.length > 0 || referrals.length > 0) && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shadow-lg ${showReferrals ? 'bg-gradient-to-tr from-blue-400 to-indigo-500 shadow-blue-500/20' : 'bg-gradient-to-tr from-emerald-400 to-green-500 shadow-emerald-500/20'}`}>
                            {showReferrals ? (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            ) : (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-white">
                                    {showReferrals ? 'My Referrals' : 'Latest Champions'}
                                </h2>
                                <button
                                    onClick={() => setShowReferrals(!showReferrals)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                        showReferrals 
                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {showReferrals ? 'View Winners' : 'View Referrals List'}
                                    <svg className={`w-3 h-3 transition-transform ${showReferrals ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {showReferrals ? 'Manage and track your referral network' : 'Recent winners and their prizes'}
                            </p>
                        </div>
                    </div>

                    {/* Filters (Only visible when showing referrals) */}
                    {showReferrals && (
                        <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-right-4">
                            {/* Type Filter */}
                            <div className="relative group">
                                <select
                                    value={referralTypeFilter}
                                    onChange={(e) => {
                                        setReferralTypeFilter(e.target.value as any);
                                        setPackageFilter('all'); 
                                    }}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-white text-xs font-bold focus:outline-none focus:border-white/30 appearance-none cursor-pointer hover:bg-white/5 transition-all"
                                >
                                    <option value="all">All Types</option>
                                    <option value="retail">Retail Referrals</option>
                                    <option value="vip">VIP Referrals</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            {/* Package Filter */}
                            {(referralTypeFilter !== 'all') && (
                                <div className="relative group">
                                    <select
                                        value={packageFilter}
                                        onChange={(e) => setPackageFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-white text-xs font-bold focus:outline-none focus:border-white/30 appearance-none cursor-pointer hover:bg-white/5 transition-all"
                                    >
                                        <option value="all">All Packages</option>
                                        {Array.from(new Set(referrals
                                            .filter(r => {
                                                if (referralTypeFilter === 'retail') return r.vipStatus === 'none' || !r.vipStatus;
                                                if (referralTypeFilter === 'vip') return r.vipStatus === 'vip' || r.vipStatus === 'vvip';
                                                return true;
                                            })
                                            .map(r => r.package || 0)))
                                            .sort((a,b) => a-b)
                                            .filter(p => p > 0)
                                            .map(pkg => (
                                                <option key={pkg} value={pkg}>₹{pkg.toLocaleString()}</option>
                                            ))
                                        }
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-[300px]">
                    {showReferrals ? (
                        // Referrals Table
                        <div className="animate-in fade-in fill-mode-forwards">
                            {referrals.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 text-sm">No referrals found based on current filters.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</th>
                                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Package</th>
                                        <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                    {referrals
                                        .filter(r => {
                                            if (referralTypeFilter === 'retail' && (r.vipStatus === 'vip' || r.vipStatus === 'vvip')) return false;
                                            if (referralTypeFilter === 'vip' && (r.vipStatus !== 'vip' && r.vipStatus !== 'vvip')) return false;
                                            if (packageFilter !== 'all' && r.package !== packageFilter) return false;
                                            return true;
                                        })
                                        .map((ref) => (
                                        <tr key={ref._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-white font-bold text-sm">{ref.name}</td>
                                        <td className="p-4 text-slate-400 text-sm font-mono">{ref.phoneNumber}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                            ref.vipStatus === 'vvip' 
                                                ? 'bg-purple-500/20 text-purple-400' 
                                                : ref.vipStatus === 'vip'
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {ref.vipStatus === 'vvip' ? 'VVIP' : ref.vipStatus === 'vip' ? 'VIP' : 'Retail'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white font-bold text-sm">
                                            {ref.package ? `₹${ref.package}` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-slate-500 text-xs">
                                            {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short'
                                            })}
                                        </td>
                                        </tr>
                                    ))}
                                    {referrals.filter(r => {
                                            if (referralTypeFilter === 'retail' && (r.vipStatus === 'vip' || r.vipStatus === 'vvip')) return false;
                                            if (referralTypeFilter === 'vip' && (r.vipStatus !== 'vip' && r.vipStatus !== 'vvip')) return false;
                                            if (packageFilter !== 'all' && r.package !== packageFilter) return false;
                                            return true;
                                    }).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                                                No referrals match the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Winners Table
                        <div className="overflow-x-auto animate-in fade-in fill-mode-forwards">
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
                    )}
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

      {/* Manual Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className={`relative bg-[#0f172a] border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-300 ${registerFormType === 'vip' ? 'border-yellow-500/50 shadow-yellow-900/20' : 'border-emerald-500/50 shadow-emerald-900/20'}`}>
                
                {/* Header with gradient background */}
                <div className={`p-6 bg-gradient-to-r ${registerFormType === 'vip' ? 'from-yellow-500/10 to-transparent' : 'from-emerald-500/10 to-transparent'}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`p-1.5 rounded-lg ${registerFormType === 'vip' ? 'bg-yellow-500 text-black' : 'bg-emerald-500 text-white'}`}>
                                    {registerFormType === 'vip' ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    )}
                                </span>
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    {registerFormType === 'vip' ? 'New VIP Member' : 'New Retail Champion'}
                                </h2>
                            </div>
                            <p className="text-slate-400 text-xs font-medium pl-1">
                                Will deduct <span className="text-white font-bold">1 Form</span> from your balance
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowRegisterModal(false)} 
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-slate-400 hover:text-white transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleRegisterReferral} className="p-6 space-y-5">
                    
                    {/* Image Upload */}
                    <div className="flex justify-center">
                        <label className="relative group cursor-pointer">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all ${
                                registerData.image 
                                ? 'border-emerald-500' // Uploaded state
                                : registerFormType === 'vip' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-emerald-500/30 bg-emerald-500/5'
                            }`}>
                                {registerData.image ? (
                                    <img 
                                        src={URL.createObjectURL(registerData.image)} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <svg className="w-8 h-8 mx-auto mb-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-[10px] uppercase font-bold text-slate-500">Add Photo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setRegisterData({...registerData, image: e.target.files ? e.target.files[0] : null})}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="space-y-4">
                        {/* Name Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-500 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <input 
                                type="text" 
                                required
                                value={registerData.name}
                                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-white/30 focus:bg-white/5 focus:outline-none transition-all"
                                placeholder="Full Name"
                            />
                        </div>

                        {/* Phone Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-500 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <input 
                                type="tel" 
                                required
                                pattern="[0-9]{10}"
                                title="10 digit phone number"
                                value={registerData.phoneNumber}
                                onChange={(e) => setRegisterData({...registerData, phoneNumber: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-white/30 focus:bg-white/5 focus:outline-none transition-all"
                                placeholder="Phone Number"
                            />
                        </div>

                        {/* ID Number Input (Optional) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-500 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z" /></svg>
                            </div>
                            <input 
                                type="text" 
                                value={registerData.idNumber}
                                onChange={(e) => setRegisterData({...registerData, idNumber: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-white/30 focus:bg-white/5 focus:outline-none transition-all"
                                placeholder="ID Number (Optional)"
                            />
                        </div>

                        {/* Bill Image Upload (Optional) */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Bill Image (Optional)</label>
                            <label className={`flex items-center justify-center w-full p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all ${registerData.billImage ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/20'}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setRegisterData({...registerData, billImage: e.target.files ? e.target.files[0] : null})}
                                    className="hidden"
                                />
                                {registerData.billImage ? (
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        <span className="text-sm font-bold truncate max-w-[200px]">{registerData.billImage.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        <span className="text-sm font-bold">Upload Bill Image</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Package Selection (VIP Only) */}
                        {registerFormType === 'vip' && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <select
                                    value={registerData.packageAmount}
                                    onChange={(e) => setRegisterData({...registerData, packageAmount: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-white/30 focus:bg-white/5 focus:outline-none appearance-none transition-all cursor-pointer"
                                    style={{ backgroundImage: 'none' }}
                                >
                                    <option value="" className="bg-[#1e293b]">Select Package Amount</option>
                                    <option value="1000" className="bg-[#1e293b]">Basic (₹1,000)</option>
                                    <option value="4500" className="bg-[#1e293b]">Advance (₹4,500)</option>
                                    <option value="8000" className="bg-[#1e293b]">Premium (₹8,000)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={(registerFormType === 'vip' ? user?.vipReferralFormsLeft : user?.retailReferralFormsLeft) as number <= 0}
                            className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group ${
                                (registerFormType === 'vip' ? (user?.vipReferralFormsLeft || 0) : (user?.retailReferralFormsLeft || 0)) <= 0 
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-white/5'
                                    : registerFormType === 'vip'
                                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black shadow-yellow-500/25 hover:shadow-yellow-500/40'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40'
                            }`}
                        >
                            {(registerFormType === 'vip' ? (user?.vipReferralFormsLeft || 0) : (user?.retailReferralFormsLeft || 0)) <= 0 ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    No Forms Left
                                </>
                            ) : (
                                <>
                                    <span>Register Member</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </>
                            )}
                        </button>
                        
                        {(registerFormType === 'vip' ? (user?.vipReferralFormsLeft || 0) : (user?.retailReferralFormsLeft || 0)) <= 0 && (
                            <p className="text-red-400 text-xs text-center mt-3 font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                Please recharge your account to continue.
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* KYC Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black text-white">KYC & Banking Details</h3>
              <button 
                onClick={() => setShowKYCModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateKYC} className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Phone Number</label>
                        <input
                            type="text"
                            value={kycData.phoneNumber}
                            onChange={(e) => setKycData({...kycData, phoneNumber: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all font-mono"
                            placeholder="Primary Phone Number"
                        />
                    </div>
                    
                    {/* Aadhaar */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Aadhaar Number</label>
                        <input
                            type="text"
                            value={kycData.aadhaarNumber}
                            onChange={(e) => setKycData({...kycData, aadhaarNumber: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all font-mono"
                            placeholder="12-digit Aadhaar"
                        />
                    </div>

                    {/* PAN Card */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">PAN Number</label>
                        <input
                            type="text"
                            value={kycData.panNumber}
                            onChange={(e) => setKycData({...kycData, panNumber: e.target.value.toUpperCase()})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all font-mono uppercase"
                            placeholder="PAN Number"
                        />
                    </div>
                    
                    {/* Bank Name */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Bank Name</label>
                        <input
                            type="text"
                            value={kycData.bankName}
                            onChange={(e) => setKycData({...kycData, bankName: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all"
                            placeholder="e.g. SBI, HDFC"
                        />
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Bank Account Number</label>
                        <input
                            type="text"
                            value={kycData.bankAccountNumber}
                            onChange={(e) => setKycData({...kycData, bankAccountNumber: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all font-mono"
                            placeholder="Account Number"
                        />
                    </div>

                    {/* IFSC Code */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">IFSC Code</label>
                        <input
                            type="text"
                            value={kycData.ifscCode}
                            onChange={(e) => setKycData({...kycData, ifscCode: e.target.value.toUpperCase()})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 transition-all font-mono uppercase"
                            placeholder="IFSC Code"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                    <button
                        type="button"
                        onClick={() => setShowKYCModal(false)}
                        className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 transition-all"
                    >
                        Save Details
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {registeredUserCode && (
           <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                <div className="bg-[#1e293b] border border-emerald-500/30 rounded-3xl max-w-sm w-full p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Registration Successful!</h2>
                    <p className="text-slate-400 mb-6">The new member has been registered. Share this login code with them.</p>
                    
                    <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Login Code</p>
                        <div className="flex items-center justify-center gap-2">
                             <span className="text-2xl font-mono font-black text-emerald-400">{registeredUserCode}</span>
                             <button onClick={() => copyToClipboard(registeredUserCode)} className="text-slate-400 hover:text-white">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setRegisteredUserCode(null)}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
           </div>
      )}
    </div>
  );
}
