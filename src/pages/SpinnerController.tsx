import { useState, useEffect } from 'react';
import SpinnerDisplay from '../components/SpinnerDisplay';
import { API_ENDPOINTS } from '../config/api';

export default function SpinnerController() {
  const [lotteryId, setLotteryId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winners, setWinners] = useState<any[]>([]);

  const [winnerImage, setWinnerImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [eventName, setEventName] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveLottery();
    fetchPackages();
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

  const fetchPackages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PACKAGES.LIST);
      const data = await response.json();
      if (data.success) {
        setAvailablePackages(data.data);
        if (data.data.length > 0) setSelectedPackage(data.data[0].amount);
      }
    } catch(err) { console.error(err); }
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
    } catch(err) {}
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

        if (totalParticipants === 0) setTotalParticipants(data.data.length);
      }
    } catch(err) {}
  };

  const handleCreateLottery = async () => {
    // ... (existing implementation)
    if (!eventName.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventName, package: selectedPackage }),
      });
      const data = await response.json();
      if (data.success) {
        setLotteryId(data.data._id);
        await handleSeed(data.data._id);
      } else {
        setMessage(data.message);
      }
    } catch(err) { setMessage('Failed to create'); }
    finally { setLoading(false); }
  };

  const handleSeed = async (id: string) => {
    // ... (existing implementation)
    const token = localStorage.getItem('token');
    await fetch(API_ENDPOINTS.LOTTERY.SEED_PARTICIPANTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lotteryId: id }),
    });
    fetchParticipants(id);
  };

  const handleReset = () => {
    setLotteryId(null);
    setParticipants([]);
    setTotalParticipants(0);
    setWinnerName(null);
    setWinners([]);
    setEventName('');
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
                 <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Setup New Event</p>
            </div>
            
            <div className="space-y-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Event Name</label>
                    <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 font-bold text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Enter name..." />
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Package</label>
                    <div className="grid grid-cols-2 gap-3">
                        {availablePackages.map(pkg => (
                            <button 
                              key={pkg._id} 
                              onClick={() => setSelectedPackage(pkg.amount)}
                              className={`p-3 rounded-xl border font-bold text-sm transition-all ${selectedPackage === pkg.amount ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-slate-400'}`}
                            >
                                ₹{pkg.amount}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 <button onClick={handleCreateLottery} disabled={loading || !eventName} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                     {loading ? 'Initializing...' : 'Launch Controller'}
                 </button>

                 {message && <p className="text-red-400 text-xs font-bold text-center mt-2">{message}</p>}
            </div>
            
            <div className="text-center">
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
                totalParticipants={totalParticipants || participants.length}
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
       </div>
    </div>
  );
}
