import { useState, useEffect, useRef } from 'react';
import Confetti from './Confetti';

interface SpinnerDisplayProps {
  lotteryId?: string | null;
  participants?: number;
  isSpinning?: boolean;
  onSpinComplete?: () => void;
  winnerName?: string | null;
  winnerImage?: string | null;
  winners?: { name: string; selfieUrl?: string }[];
  onExecuteSpin?: () => void;
  remainingParticipantsList?: { name: string; selfieUrl?: string }[];
}

export default function SpinnerDisplay({ 
  lotteryId, 
  participants = 0,
  isSpinning = false,
  onSpinComplete,
  winnerName = null,
  winnerImage = null,
  winners = [],
  onExecuteSpin,
  remainingParticipantsList = []
}: SpinnerDisplayProps) {
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const winnerAudioRef = useRef<HTMLAudioElement>(null);
  const confettiAudioRef = useRef<HTMLAudioElement>(null);
  const onSpinCompleteRef = useRef(onSpinComplete);

  // Determine if we have single or multiple winners
  const activeWinners = winners.length > 0 ? winners : (winnerName ? [{ name: winnerName, selfieUrl: winnerImage }] : []);
  const hasWinners = activeWinners.length > 0;

  // Keep ref up to date
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  // Lock body scroll when animating
  useEffect(() => {
    if (animating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [animating]);

  useEffect(() => {
    if (isSpinning) {
      const startSpin = () => {
        setAnimating(true);
        setShowWinner(false);
        
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        if (winnerAudioRef.current) {
          winnerAudioRef.current.pause();
          winnerAudioRef.current.currentTime = 0;
        }
        if (confettiAudioRef.current) {
          confettiAudioRef.current.pause();
          confettiAudioRef.current.currentTime = 0;
        }
        
        const fullSpins = 80 + Math.floor(Math.random() * 20); 
        const randomDegree = Math.floor(Math.random() * 360);
        const nextRotation = rotation + (fullSpins * 360) + randomDegree;
        
        setRotation(nextRotation);

        setTimeout(() => {
          setAnimating(false);
          setShowWinner(true);
          
          if (audioRef.current) {
            audioRef.current.pause();
          }

          if (confettiAudioRef.current) {
            confettiAudioRef.current.currentTime = 0;
            confettiAudioRef.current.play().catch(err => console.log('Confetti audio play failed:', err));
          }

          if ((winnerName || winners.length > 0) && winnerAudioRef.current) {
            winnerAudioRef.current.play().catch(err => console.log('Winner audio play failed:', err));
          }

          onSpinCompleteRef.current?.();
        }, 8000);
      };

      const timeoutId = setTimeout(startSpin, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpinning, winnerName, winners.length]);

  useEffect(() => {
    setShowWinner(false);
  }, [lotteryId]);

  const toggleMute = () => {
    const muted = !isMuted;
    if (audioRef.current) audioRef.current.muted = muted;
    if (winnerAudioRef.current) winnerAudioRef.current.muted = muted;
    if (confettiAudioRef.current) confettiAudioRef.current.muted = muted;
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-start py-4 relative w-full h-full overflow-auto">
      {/* Background is now provided by parent SpinnerController */}

      {showWinner && hasWinners && <Confetti trigger={showWinner} />}

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
      
       {/* Lottery Information - TOP */}
      <div className="w-full max-w-md space-y-4 mb-16">
        {lotteryId ? (
          <div className="space-y-4">
            <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-end relative z-10 w-full">
                <div className="w-full text-center">
                  <p className="text-blue-300/80 text-xs mb-1 font-bold uppercase tracking-widest">Active Warriors</p>
                  <p className="text-white text-6xl font-black tracking-tight">
                    {participants}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center shadow-xl">
            <p className="text-blue-400/60 font-bold tracking-wide uppercase text-sm">Waiting for Connection</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">Ready to receive battle data</p>
          </div>
        )}
      </div>

      {/* Spinning Wheel - MIDDLE */}
      <div className="relative w-64 h-64 md:w-96 md:h-96 mb-6 group">
        {/* Outer neon radiation */}
        <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute inset-0 bg-rose-600/10 rounded-full blur-[60px] animate-pulse delay-700" />
        
        {/* Outer ring glow */}
        <div className="absolute -inset-4 rounded-full border border-white/5 bg-gradient-to-br from-blue-500/10 to-rose-500/10 backdrop-blur-sm shadow-2xl" />

        {/* Spinning wheel */}
        <div
          className="relative w-full h-full rounded-full shadow-[0_0_60px_rgba(0,0,0,0.5)] border-[12px] border-[#0f172a] overflow-hidden"
          style={{
            background: 'conic-gradient(from 0deg, #1e293b 0deg, #3b82f6 30deg, #1e293b 60deg, #f43f5e 90deg, #1e293b 120deg, #6366f1 150deg, #1e293b 180deg, #06b6d4 210deg, #1e293b 240deg, #ec4899 270deg, #1e293b 300deg, #8b5cf6 330deg, #1e293b 360deg)',
            transform: `rotate(${rotation}deg)`,
            transition: animating ? 'transform 8s cubic-bezier(0.15, 0, 0, 1)' : 'none',
          }}
        >
          {/* Internal Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10" />

          {/* Precision Star lines */}
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 bg-gradient-to-b from-white/40 via-white/5 to-transparent"
              style={{
                height: '50%',
                left: '50%',
                top: '50%',
                transformOrigin: 'top center',
                transform: `translateX(-50%) rotate(${i * 15}deg)`,
              }}
            />
          ))}

          {/* Center Command Pod */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-[#0f172a] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.8)] border-4 border-white/10 backdrop-blur-2xl relative z-20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full animate-pulse" />
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter relative z-10 italic">RC</span>
              <div className="w-8 h-1 bg-blue-500 rounded-full mt-1 relative z-10 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            </div>
          </div>
        </div>

        {/* Precision Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-30">
          <div className="relative group/pointer">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 group-hover/pointer:opacity-100 transition-opacity" />
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-white relative drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform hover:scale-110 transition-transform cursor-crosshair">
              <div className="absolute top-[-25px] left-[-2px] w-1 h-4 bg-blue-500/50 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Execute Spin Button - Directly below spinner */}
      {lotteryId && !hasWinners && (
        <div className="w-full max-w-md mt-4 mb-8">
          <button
            onClick={onExecuteSpin}
            disabled={animating || participants === 0}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-xl group/btn relative ${
              animating || participants === 0
                ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                : 'bg-blue-900/40 text-blue-100 border border-blue-500/30 hover:bg-blue-800/60 hover:border-blue-400/50 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] active:scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-2xl" />
            <svg className="w-6 h-6 text-blue-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="relative z-10 tracking-[0.2em] uppercase text-xs">
              {animating ? 'Synchronizing Spin...' : '⚡ Execute Champion Spin'}
            </span>
          </button>
        </div>
      )}

      {/* Winner Announcement - Multiple Winners Support */}
      {showWinner && hasWinners && (
        <div className="w-full max-w-5xl mb-12 fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-center items-center">
               {activeWinners.map((winner, idx) => (
                  <div key={idx} className="relative bg-gradient-to-b from-yellow-500/20 to-black/40 rounded-2xl p-4 border border-yellow-500/30 flex flex-col items-center animate-in zoom-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                      <div className="relative mb-3">
                          <img 
                            src={winner.selfieUrl || '/placeholder.png'} 
                            alt={winner.name} 
                            className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                          />
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shadow-lg">#{idx+1}</div>
                      </div>
                      <h3 className="text-white font-bold text-lg text-center leading-tight mb-1">{winner.name}</h3>
                      <p className="text-yellow-400/80 text-[10px] uppercase tracking-widest font-bold">Champion</p>
                  </div>
               ))}
             </div>
             <div className="text-center mt-8">
                <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent animate-gradient-x mb-2">
                    CONGRATULATIONS!
                </h1>
                <p className="text-white/60 text-lg font-medium">Retail Champions {new Date().getFullYear()}</p>
             </div>
        </div>
      )}

      {/* Remaining Participants List - Show after spinner stops (when not animating) */}
      {!animating && remainingParticipantsList.length > 0 && (
         <div className="w-full max-w-6xl mt-8 px-4">
             <div className="flex items-center gap-3 mb-4">
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                 <span className="text-blue-400 font-bold uppercase tracking-widest text-xs">
                   {showWinner ? 'Remaining Contenders' : 'Active Contenders'}
                 </span>
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
             </div>
             
             <div className="flex flex-wrap justify-center gap-3">
                 {remainingParticipantsList.map((p, i) => (
                     <div key={i} className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/10 transition-colors">
                         {p.selfieUrl ? (
                           <img 
                             src={p.selfieUrl} 
                             alt={p.name} 
                             className="w-6 h-6 rounded-full object-cover border border-emerald-500/50"
                           />
                         ) : (
                           <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-300 font-bold">
                             {p.name?.charAt(0)?.toUpperCase() || '?'}
                           </div>
                         )}
                         <span className="text-slate-200 text-xs font-medium">{p.name}</span>
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     </div>
                 ))}
             </div>
         </div>
      )}

      
      </div>

      {/* Audio elements */}
      <audio ref={audioRef} src="/mp3/kbc_4.mp3" preload="auto" />
      <audio ref={winnerAudioRef} src="/mp3/finalwinner.mp3" preload="auto" />
      <audio ref={confettiAudioRef} src="/mp3/confetti.mp3" preload="auto" />
      
      {/* Mute toggle button */}
      <button 
        onClick={toggleMute}
        className="fixed bottom-6 right-6 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/20 transition-all z-50 text-white"
      >
        {isMuted ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    </div>
  );
}
