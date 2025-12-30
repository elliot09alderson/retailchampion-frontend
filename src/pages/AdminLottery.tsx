import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import SpinnerDisplay from '../components/SpinnerDisplay';
import UsersManagement from '../components/UsersManagement';
import Confetti from '../components/Confetti';

type ViewType = 'spinner' | 'users';

export default function AdminLottery() {
  const [activeView, setActiveView] = useState<ViewType>('spinner');
  const [lotteryId, setLotteryId] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [spinResult, setSpinResult] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [requestedParticipantCount, setRequestedParticipantCount] = useState('');

  // Fetch active lottery on mount
  useEffect(() => {
    fetchActiveLottery();
  }, []);

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
      console.error('Failed to fetch active lottery:', err);
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
        } else {
          setWinnerName(null);
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

  const handleCreateLottery = async () => {
    if (!eventName.trim()) {
      setMessage('Please enter an event name');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventName }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newLotteryId = data.data._id;
        setLotteryId(newLotteryId);
        setEventName(data.data.eventName);
        setWinnerName(null);
        setSpinResult(null);
        setShowConfetti(false);
        setTotalParticipants(0);
        
        // Automatically seed participants from database
        setMessage('Contest created! Loading participants...');
        
        try {
          const seedResponse = await fetch(API_ENDPOINTS.LOTTERY.SEED_PARTICIPANTS, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              lotteryId: newLotteryId,
              count: requestedParticipantCount || undefined
            }),
          });
          
          const seedData = await seedResponse.json();
          
          if (seedData.success) {
            setMessage(`Contest created with ${seedData.data.totalParticipants} participants!`);
            fetchParticipants(newLotteryId);
          } else {
            setMessage('Contest created but failed to load participants');
          }
        } catch (seedErr) {
          setMessage('Contest created but failed to load participants');
        }
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage('Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSpin = async () => {
    if (!lotteryId) {
      setMessage('No active contest');
      return;
    }

    // Start the spinning animation immediately
    setIsSpinning(true);
    setLoading(true);
    setSpinResult(null);
    setWinnerName(null); // Reset winner
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
        setSpinResult(data.data);
        
        // If lottery is complete, get the winner
        if (data.data.isComplete && data.data.winner) {
          setWinnerName(data.data.winner.name);
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
            <span className="text-xl">🎯</span>
            {!isSidebarCollapsed && <span className="tracking-wide">SPINNER CONTROL</span>}
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
            <span className="text-xl">👥</span>
            {!isSidebarCollapsed && <span className="tracking-wide">USER MANAGEMENT</span>}
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
                {activeView === 'spinner' ? (eventName || 'Contest Control') : 'User Management'}
              </h1>
              <p className="text-slate-400 mt-2 font-bold tracking-widest uppercase text-[10px] relative z-10">
                {activeView === 'spinner' 
                  ? 'Manage contest spins and view participants' 
                  : 'View and manage registered users'}
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
                />
              </div>

              {/* Create Lottery Section */}
              {!lotteryId && (
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 p-10 rounded-3xl shadow-2xl mb-8">
                  <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase">Create New Contest</h2>
                  
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
                      {loading ? 'Initializing contest...' : 'Create Contest'}
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
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-black border border-emerald-500/30">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="text-white font-bold text-sm">
                                        {participant.userId?.name || 'Unknown User'}
                                      </p>
                                      <p className="text-slate-400 text-[10px] font-bold tracking-tight uppercase">
                                        {participant.userId?.phoneNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={`px-3 py-1.5 rounded-lg border font-black uppercase text-[10px] tracking-widest shadow-lg ${
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
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold border border-white/10">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="text-slate-200 font-bold text-sm">
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
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-10 shadow-2xl">
                <h3 className="text-xl font-black text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Operational Guidelines
                </h3>
                <ul className="space-y-5">
                  {[
                    "Create a new contest event to begin the engagement",
                    "Users can register through the designated registration form",
                    "Click 'Execute Spin' to run consecutive rounds (1-4)",
                    "Intelligent Elimination: R1-R3 filters pool, R4 selects the Grand Winner",
                    "Participants view real-time result updates on their dashboard",
                    "Access restricted to authorized Administrative Personnel"
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-wider group">
                      <span className="w-2 h-2 rounded-full bg-blue-500/40 mt-1 transition-all group-hover:bg-blue-400 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            /* Users Management View */
            <UsersManagement />
          )}
        </div>
      </div>
    </div>
  );
}
