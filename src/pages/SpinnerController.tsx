import { useState, useEffect } from 'react';
import SpinnerDisplay from '../components/SpinnerDisplay';
import { API_ENDPOINTS } from '../config/api';

export default function SpinnerController() {
  const [lotteryId, setLotteryId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [winnerImage, setWinnerImage] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [message, setMessage] = useState(''); // Used in handleExecuteSpin error handling
  const [availableContests, setAvailableContests] = useState<any[]>([]);

  useEffect(() => {
    fetchSelectableLotteries();
  }, []);

  // Lock scroll when spinning
  useEffect(() => {
    if (isSpinning) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isSpinning]);

  const fetchSelectableLotteries = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_ENDPOINTS.LOTTERY.SELECTABLE, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            setAvailableContests(data.data);
            // Optionally auto-select if only one active? 
            // User requested dropdown specifically, so let's show list
        }
    } catch(err) { console.error(err); }
  };

  const handleSelectContest = (contest: any) => {
    setLotteryId(contest._id);
    setEventName(contest.eventName);
    fetchParticipants(contest._id);
  };

  const fetchParticipants = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.PARTICIPANTS(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const active = data.data.filter((p: any) => p.status === 'active' || p.status === 'winner');
        setParticipants(active);
        
        // Check for multiple winners first
        const winnersList = data.data.filter((p: any) => p.status === 'winner');
        if (winnersList.length > 0) {
            setWinners(winnersList.map((w: any) => ({
                name: w.userId.name,
                selfieUrl: w.userId.selfieUrl,
                participantId: w._id
            })));
            
            // Backwards compatibility for single winner display
            if (winnersList.length === 1) {
                setWinnerName(winnersList[0].userId.name);
                setWinnerImage(winnersList[0].userId.selfieUrl);
            }
        } else {
             setWinners([]);
             setWinnerName(null);
             setWinnerImage(null);
        }

        }
      } catch(err) {}
  };

  // Removed handleCreateLottery



  const handleReset = () => {
    setLotteryId(null);
    setParticipants([]);
    setWinnerName(null);
    setWinners([]);
    setEventName('');
    fetchSelectableLotteries(); // Refresh list
  };

  const handleExecuteSpin = async () => {
    if (!lotteryId) return;
    setIsSpinning(true);
    setWinnerName(null);
    setWinnerImage(null);
    setWinners([]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.SPIN(lotteryId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        // If it's a manual spin, we expect result
        // If scheduled, backend handles it? But here we are manually triggering.
        if (data.data.isComplete) {
            if (data.data.winners && data.data.winners.length > 0) {
                 setWinners(data.data.winners);
            } else if (data.data.winner) {
                // Fallback for single winner
                setWinnerName(data.data.winner.name);
                setWinnerImage(data.data.winner.selfieUrl);
            }
        }
      } else {
         setIsSpinning(false);
         setMessage(data.message);
      }
    } catch(err) { setIsSpinning(false); }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    if (lotteryId) fetchParticipants(lotteryId);
  };
  
  // Mobile-optimized Full Screen UI
  if (!lotteryId) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                 <h1 className="text-4xl font-black tracking-tighter mb-2">Spinner<span className="text-blue-500">Controller</span></h1>
                 <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Select Event to Spin</p>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {availableContests.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
                        <p className="text-slate-400 font-bold mb-4">No active contests found</p>
                        <a href="/admin/lottery" className="inline-block px-6 py-3 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">Create Contest</a>
                    </div>
                ) : (
                    availableContests.map(contest => (
                        <button
                            key={contest._id}
                            onClick={() => handleSelectContest(contest)}
                            className="w-full bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-white/10 p-4 rounded-2xl transition-all group flex items-center justify-between"
                        >
                            <div className="text-left">
                                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{contest.eventName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{contest.type || 'Scheduled'}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">₹{contest.package}</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600 transition-colors text-blue-400 group-hover:text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </div>
                        </button>
                    ))
                )}
            </div>
            
            <div className="text-center pt-4 border-t border-white/5">
                <a href="/admin/lottery" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Return to Dashboard</a>
            </div>
        </div>
      </div>
    );
  }

  // Active Controller UI
  return (
    <div className="bg-[#0f172a] text-white">
       {/* Spinner Section with Video Background - 100vh */}
       <div className="h-screen w-full relative overflow-hidden">
         {/* Background Video */}
         <video
           autoPlay
           muted
           loop
           playsInline
           className="absolute inset-0 w-full h-full object-cover z-0"
         >
           <source src="/bg/bg.mp4" type="video/mp4" />
         </video>
         
         {/* Background overlay effect */}
         <div className="absolute inset-0 bg-[#0f172a]/60 z-[1]" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent z-[1]" />
         
         {/* Header */}
         <div className="relative z-10 flex items-center justify-between p-6">
             <div className="flex items-center gap-4">
                 <a href="/admin/lottery" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors" title="Back to Dashboard">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                     </svg>
                 </a>
                 <div>
                     <h2 className="font-black text-xl tracking-tight">{eventName}</h2>
                     <div className="flex items-center gap-2 mt-1">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live Controller</span>
                     </div>
                 </div>
             </div>
             <button onClick={handleReset} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
         </div>

         {/* Main Spinner */}
         <div className="relative z-10 flex-1 flex flex-col items-center justify-center h-[calc(100vh-120px)]">
             <SpinnerDisplay 
                lotteryId={lotteryId}
                participants={participants.length}
                isSpinning={isSpinning}
                onExecuteSpin={handleExecuteSpin}
                onSpinComplete={handleSpinComplete}
                winnerName={winnerName}
                winnerImage={winnerImage}
                winners={winners}
                remainingParticipantsList={participants.map((p: any) => ({
                  name: p.userId?.name || 'Unknown',
                  selfieUrl: p.userId?.selfieUrl || null
                }))}
             />
         </div>

         {/* Bottom Controls */}
         {(winnerName || winners.length > 0) && (
             <div className="fixed bottom-10 left-0 right-0 p-6 flex justify-center z-20 animate-in slide-in-from-bottom-10 fade-in duration-500">
                 <button onClick={handleReset} className="px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-widest text-xs rounded-full shadow-2xl hover:scale-105 transition-transform">
                     End Contest & Reset
                 </button>
             </div>
         )}
         {/* Error Message Toast */}
         {message && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                {message}
                <button onClick={() => setMessage('')} className="ml-3 hover:text-white/80">✕</button>
            </div>
         )}
       </div>
    </div>
  );
}
