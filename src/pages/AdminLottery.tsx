import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import SpinnerDisplay from '../components/SpinnerDisplay';
import UsersManagement from '../components/UsersManagement';
import Confetti from '../components/Confetti';
import OperationalGuidelines from '../components/OperationalGuidelines';
import WinnersHistory from '../components/WinnersHistory.tsx';
import PackagesManagement from '../components/PackagesManagement';
import ContestHistory from '../components/ContestHistory';

type ViewType = 'spinner' | 'users' | 'winners' | 'history' | 'packages' | 'info';

export default function AdminLottery() {
  const [activeView, setActiveView] = useState<ViewType>('spinner');
  const [lotteryId, setLotteryId] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerImage, setWinnerImage] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [requestedParticipantCount, setRequestedParticipantCount] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Fetch active lottery and packages on mount
  useEffect(() => {
    fetchActiveLottery();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PACKAGES.LIST);
      const data = await response.json();
      if (data.success) {
        setAvailablePackages(data.data);
        if (data.data.length > 0) {
          setSelectedPackage(data.data[0].amount);
        }
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchActiveLottery = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.LOTTERY.ACTIVE);
      const data = await response.json();
      
      if (data.success) {
        setLotteryId(data.data._id);
        setEventName(data.data.eventName);
        fetchParticipants(data.data._id);
      }
    } catch (err) {
      // Silence expected 404 when no active lottery exists
    }
  };

  const fetchParticipants = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.PARTICIPANTS(id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.data);
        
        // Find if there is a winner to set the winner name state
        const winner = data.data.find((p: any) => p.status === 'winner');
        if (winner && winner.userId) {
          setWinnerName(winner.userId.name);
          setWinnerImage(winner.userId.selfieUrl);
        } else {
          setWinnerName(null);
          setWinnerImage(null);
        }

        // Set total participants on first load (when it hasn't been set yet)
        if (totalParticipants === 0) {
          setTotalParticipants(data.data.length);
        }
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  };

  const handleSeedOnly = async (id: string) => {
    const token = localStorage.getItem('token');
    setMessage('Initializing contest participants...');
    try {
      const seedResponse = await fetch(API_ENDPOINTS.LOTTERY.SEED_PARTICIPANTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          lotteryId: id,
          count: requestedParticipantCount || undefined
        }),
      });
      
      const seedData = await seedResponse.json();
      
      if (seedData.success) {
        setMessage(`Success! Loaded ${seedData.data.totalParticipants} participants.`);
        fetchParticipants(id);
      } else {
        setMessage('Failed to load participants: ' + seedData.message);
      }
    } catch (err) {
      setMessage('Network error while loading participants');
    }
  };

  const handleCreateLottery = async () => {
    if (!eventName.trim()) {
      setMessage('Please enter an event name');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // If we already have a lotteryId but 0 participants, just seed it
      if (lotteryId) {
        await handleSeedOnly(lotteryId);
        return;
      }

      const response = await fetch(API_ENDPOINTS.LOTTERY.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventName, package: selectedPackage }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newLotteryId = data.data._id;
        setLotteryId(newLotteryId);
        setEventName(data.data.eventName);
        setWinnerName(null);
        setShowConfetti(false);
        setTotalParticipants(0);
        
        await handleSeedOnly(newLotteryId);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage('Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLotteryId(null);
    setEventName('');
    setParticipants([]);
    setTotalParticipants(0);
    setWinnerName(null);
    setWinnerImage(null);
    setShowConfetti(false);
    setMessage('Prepare for the next champion cycle.');
  };

  const handleExecuteSpin = async () => {
    if (!lotteryId) {
      setMessage('No active contest');
      return;
    }

    // Start the spinning animation immediately
    setIsSpinning(true);
    setLoading(true);
    setWinnerName(null); // Reset winner
    setWinnerImage(null);
    setShowConfetti(false); // Reset confetti before spin
    
    // Make the API call in the background
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.SPIN(lotteryId), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`Round ${data.data.round} completed!`);
        
        // If lottery is complete, get the winner
        if (data.data.isComplete && data.data.winner) {
          setWinnerName(data.data.winner.name);
          setWinnerImage(data.data.winner.selfieUrl || (data.data.winner.userId ? data.data.winner.userId.selfieUrl : null));
        }
      } else {
        setMessage(data.message);
        setLoading(false); 
        setIsSpinning(false); 
      }
    } catch (err) {
      setMessage('Failed to execute spin');
      setLoading(false);
      setIsSpinning(false);
    }
    // Note: Success state is handled by SpinnerDisplay's onSpinComplete
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setLoading(false);
    setShowConfetti(true); // Trigger confetti when spin completes
    if (lotteryId) {
      fetchParticipants(lotteryId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/bg/bg.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      {/* Confetti Effect */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Sidebar - Fixed Position */}
      <div 
        className={`fixed left-0 top-0 h-screen bg-[#0f172a]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-2xl z-40 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-6 border-b border-white/5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter">Admin <span className="text-blue-500">Dashboard</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{user.name || 'Admin'}</p>
            </div>
          )}


          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300"
          >
            {isSidebarCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setActiveView('spinner')}
            className={`w-full px-4 py-3.5 rounded-xl text-left font-bold transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-4'
            } ${
              activeView === 'spinner'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Spinner"
          >
            <span className="text-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            {!isSidebarCollapsed && <span className="tracking-wide uppercase">SPINNER CONTROL</span>}
          </button>

          <button
            onClick={() => setActiveView('users')}
            className={`w-full px-4 py-3.5 rounded-xl text-left font-bold transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-4'
            } ${
              activeView === 'users'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Users"
          >
            <span className="text-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            {!isSidebarCollapsed && <span className="tracking-wide uppercase">USER MANAGEMENT</span>}
          </button>

          <button
            onClick={() => setActiveView('winners')}
            className={`w-full px-4 py-3.5 rounded-xl text-left font-bold transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-4'
            } ${
              activeView === 'winners'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Winners"
          >
            <span className="text-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            {!isSidebarCollapsed && <span className="tracking-wide uppercase">WINNERS CIRCLE</span>}
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`w-full px-4 py-3.5 rounded-xl text-left font-bold transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-4'
            } ${
              activeView === 'history'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Contest History"
          >
            <span className="text-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            {!isSidebarCollapsed && <span className="tracking-wide uppercase">CONTEST HISTORY</span>}
          </button>

          <button
            onClick={() => setActiveView('packages')}
            className={`w-full px-4 py-3.5 rounded-xl text-left font-bold transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-4'
            } ${
              activeView === 'packages'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Registration Packs"
          >
            <span className="text-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            {!isSidebarCollapsed && <span className="tracking-wide uppercase">REGISTRATION PACKS</span>}
          </button>

          <button
            onClick={() => setActiveView('info')}
            className={`w-full px-4 py-3.5 rounded-xl text-left font-bold transition-all flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'gap-4'
            } ${
              activeView === 'info'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Info"
          >
            <span className="text-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            {!isSidebarCollapsed && <span className="tracking-wide uppercase">INFO</span>}
          </button>



        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full px-4 py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium rounded-lg transition-all flex items-center justify-center ${
              isSidebarCollapsed ? '' : 'gap-2'
            }`}
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content - Dynamic offset */}
      <div 
        className={`flex-1 overflow-auto transition-all duration-300 relative z-10 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl mb-8 overflow-hidden">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase relative z-10">
                {activeView === 'spinner' ? (eventName || 'Contest Control') : 
                 activeView === 'users' ? 'User Management' : 
                 activeView === 'winners' ? 'Winners Circle' : 
                 activeView === 'history' ? 'Contest History' :
                 activeView === 'packages' ? 'Registration Packs' : 'Information Center'}
              </h1>
              <p className="text-slate-400 mt-2 font-bold tracking-widest uppercase text-[10px] relative z-10">
                {activeView === 'spinner' 
                  ? 'Manage contest spins and view participants' 
                  : activeView === 'users'
                  ? 'View and manage registered users'
                  : activeView === 'winners'
                  ? 'The Hall of Fame for Retail Champions'
                  : activeView === 'history'
                  ? 'Complete Battle Log and Historical Data'
                  : activeView === 'packages'
                  ? 'Create and manage contest registration tiers'
                  : 'System configuration and operational guidelines'}
              </p>


            </div>
          </div>

          {/* Message Display - TRANSMISSION LOG */}
          {message && (
            <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-5 mb-8 text-center shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
              <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-base md:text-lg relative z-10 flex items-center justify-center gap-4">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                SYSTEM TRANSMISSION: {message}
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              </p>
            </div>
          )}

          {/* Content based on active view */}
          {activeView === 'spinner' ? (
            <>
              {/* Spinner Display */}
              <div className="bg-[#0f172a]/10 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl mb-8 p-10 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -ml-32 -mb-32" />
                <SpinnerDisplay 
                  lotteryId={lotteryId}
                  participants={participants.filter(p => p.status === 'active' || p.status === 'winner').length}
                  totalParticipants={totalParticipants}
                  isSpinning={isSpinning}
                  onExecuteSpin={handleExecuteSpin}
                  onSpinComplete={handleSpinComplete}
                  winnerName={winnerName}
                  winnerImage={winnerImage}
                />
              </div>

              {/* Create Lottery Section - Show if no lottery OR if lottery is empty */}
              {(!lotteryId || participants.filter(p => p.status === 'active' || p.status === 'winner').length === 0) && (
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 p-10 rounded-3xl shadow-2xl mb-8">
                  <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase">
                    {lotteryId ? 'Initialize Empty Contest' : 'Create New Contest'}
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-slate-400 font-black mb-3 text-[10px] uppercase tracking-[0.2em]">Event Name</label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="E.G. Annual Gala 2024"
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold tracking-wide"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-slate-400 font-black mb-3 text-[10px] uppercase tracking-[0.2em]">Select Package</label>
                      <div className="grid grid-cols-2 gap-4">
                        {loadingPackages ? (
                          <div className="col-span-2 text-center py-4 text-slate-500 font-medium">Loading packages...</div>
                        ) : availablePackages.length === 0 ? (
                          <div className="col-span-2 text-center py-4 text-rose-500 font-bold uppercase tracking-widest text-[10px]">No active packages available</div>
                        ) : (
                          availablePackages.map((pkg) => (
                            <button
                              key={pkg._id}
                              onClick={() => setSelectedPackage(pkg.amount)}
                              className={`p-4 rounded-2xl border-2 transition-all font-black text-lg relative group ${
                                selectedPackage === pkg.amount
                                  ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span>₹{pkg.amount.toLocaleString()}</span>
                                <span className={`text-[10px] uppercase tracking-tighter mt-1 font-bold ${selectedPackage === pkg.amount ? 'text-blue-400' : 'text-slate-500'}`}>
                                  {pkg.userCount || 0} Registered Users
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-black mb-3 text-[10px] uppercase tracking-[0.2em]">Participant Count (Optional)</label>
                      <input
                        type="number"
                        value={requestedParticipantCount}
                        onChange={(e) => setRequestedParticipantCount(e.target.value)}
                        placeholder="E.G. 200 (Leave empty for all)"
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold tracking-wide"
                      />
                    </div>

                    <button
                      onClick={handleCreateLottery}
                      disabled={loading || !eventName}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-2xl ${
                        loading || !eventName
                          ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                          : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white border border-white/10 hover:scale-[1.02] hover:shadow-slate-500/25 active:scale-95'
                      }`}
                    >
                      {loading ? (lotteryId ? 'Initializing contestant pool...' : 'Initializing contest...') : (lotteryId ? 'Seed Participants' : 'Create Contest')}
                    </button>
                  </div>
                </div>
              )}

              {/* Active Lottery Controls */}
              {lotteryId && (
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 p-10 rounded-3xl shadow-2xl">
                  <h2 className="text-3xl font-black text-white mb-10 tracking-tighter flex items-center gap-4 uppercase relative">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                    Live Battle Statistics
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Active Side */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                          🏆 Active Contenders
                        </h3>
                        <span className="bg-emerald-500/30 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-black border border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.2)] uppercase tracking-wider">
                          {participants.filter(p => p.status === 'active' || p.status === 'winner').length} Still In
                        </span>
                      </div>
                      <div className="bg-white/5 border border-emerald-500/10 p-4 rounded-2xl h-[500px] overflow-y-auto custom-scrollbar space-y-3">
                        {participants.filter(p => p.status === 'active' || p.status === 'winner').length === 0 ? (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Waiting for entrants...</p>
                          </div>
                        ) : (
                            participants
                            .filter(p => p.status === 'active' || p.status === 'winner')
                            .map((participant, index) => (
                              <div
                                key={participant._id}
                                className={`p-4 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
                                  participant.status === 'winner'
                                    ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-black border border-emerald-500/30 shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="relative group cursor-pointer" onClick={() => setPreviewImage(participant.userId?.selfieUrl)}>
                                      <img 
                                        src={participant.userId?.selfieUrl || 'https://via.placeholder.com/150?text=HP'} 
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:border-blue-400 transition-all"
                                        alt=""
                                      />
                                      <div className="absolute inset-0 bg-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-white font-bold text-sm leading-tight">
                                        {participant.userId?.name || 'Unknown User'}
                                      </p>
                                      <p className="text-slate-400 text-[10px] font-bold tracking-tight uppercase">
                                        {participant.userId?.phoneNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded-md border font-black uppercase text-[8px] tracking-widest ${
                                    participant.status === 'winner' 
                                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' 
                                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  }`}>
                                    {participant.status}
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Flushed Out Side */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-rose-500 font-black uppercase tracking-widest text-sm flex items-center gap-2 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                          💀 Flushed Out
                        </h3>
                        <span className="bg-rose-500/30 text-rose-300 px-4 py-1.5 rounded-full text-xs font-black border border-rose-400/40 shadow-[0_0_15px_rgba(244,63,94,0.2)] uppercase tracking-wider">
                          {participants.filter(p => p.status === 'eliminated').length} Eliminated
                        </span>
                      </div>
                      <div className="bg-white/5 border border-rose-500/10 p-4 rounded-2xl h-[500px] overflow-y-auto custom-scrollbar space-y-3">
                        {participants.filter(p => p.status === 'eliminated').length === 0 ? (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">No one eliminated yet</p>
                          </div>
                        ) : (
                          participants
                            .filter(p => p.status === 'eliminated')
                            .map((participant, index) => (
                              <div
                                key={participant._id}
                                className="p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 backdrop-blur-sm grayscale-[0.3] opacity-90"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold border border-white/10 shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="relative group cursor-pointer" onClick={() => setPreviewImage(participant.userId?.selfieUrl)}>
                                      <img 
                                        src={participant.userId?.selfieUrl || 'https://via.placeholder.com/150?text=HP'} 
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white/10 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100"
                                        alt=""
                                      />
                                    </div>
                                    <div>
                                      <p className="text-slate-200 font-bold text-sm leading-tight">
                                        {participant.userId?.name || 'Unknown User'}
                                      </p>
                                      <p className="text-rose-500/80 text-[10px] font-black uppercase tracking-tighter">
                                        Killed in Round {participant.eliminatedInRound || '?' }
                                      </p>
                                    </div>
                                  </div>
                                  <div className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg shadow-lg">
                                    <p className="text-rose-500 font-black uppercase text-[10px] tracking-widest">
                                      ELIMINATED
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reset/New Contest Button - Show when finished OR when stuck with 0 participants */}
                  {(winnerName || (lotteryId && participants.filter(p => p.status === 'active' || p.status === 'winner').length === 0)) && (
                    <div className="mt-10 pt-10 border-t border-white/5 flex justify-center">
                      <button
                        onClick={handleReset}
                        className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 border border-white/10"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {winnerName ? 'Start Next Contest' : 'Reset Empty Contest'}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </>
          ) : activeView === 'users' ? (
            /* Users Management View */
            <UsersManagement />
          ) : activeView === 'winners' ? (
            /* Winners Circle View */
            <WinnersHistory />
          ) : activeView === 'history' ? (
            <ContestHistory />
          ) : activeView === 'packages' ? (
            <PackagesManagement />
          ) : (
            /* Info View */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2 relative z-10">System Status</p>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    <p className="text-2xl font-black text-white tracking-tight">OPERATIONAL</p>
                  </div>
                </div>
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-16 -mt-16" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2 relative z-10">API Latency</p>
                  <p className="text-2xl font-black text-white tracking-tight relative z-10">14ms <span className="text-blue-400 text-xs ml-1">AVG</span></p>
                </div>
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] -mr-16 -mt-16" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2 relative z-10">Security Tier</p>
                  <p className="text-2xl font-black text-white tracking-tight relative z-10">ENCRYPTED</p>
                </div>
              </div>
              <OperationalGuidelines />
            </div>
          )}        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
            <button 
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors p-2"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl border-4 border-white/10 shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
