import { useState, useEffect, useRef } from 'react';

interface SpinnerDisplayProps {
  lotteryId?: string | null;
  participants?: number; // Active participants
  totalParticipants?: number; // Total started with
  isSpinning?: boolean;
  onSpinComplete?: () => void;
  winnerName?: string | null;
  onExecuteSpin?: () => void;
}

export default function SpinnerDisplay({ 
  lotteryId, 
  participants = 0,
  totalParticipants = 0,
  isSpinning = false,
  onSpinComplete,
  winnerName = null,
  onExecuteSpin
}: SpinnerDisplayProps) {
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const winnerAudioRef = useRef<HTMLAudioElement>(null);
  const confettiAudioRef = useRef<HTMLAudioElement>(null);
  const onSpinCompleteRef = useRef(onSpinComplete);

  // Keep ref up to date
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  useEffect(() => {
    if (isSpinning) {
      // Small delay to ensure state transitions are clean
      const startSpin = () => {
        setAnimating(true);
        setShowWinner(false);
        
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        // Stop winner/confetti music if they were playing
        if (winnerAudioRef.current) {
          winnerAudioRef.current.pause();
          winnerAudioRef.current.currentTime = 0;
        }
        if (confettiAudioRef.current) {
          confettiAudioRef.current.pause();
          confettiAudioRef.current.currentTime = 0;
        }
        
        // Huge rotation for high-speed effect (80-100 full spins)
        const fullSpins = 80 + Math.floor(Math.random() * 20); 
        const randomDegree = Math.floor(Math.random() * 360);
        const nextRotation = rotation + (fullSpins * 360) + randomDegree;
        
        setRotation(nextRotation);

        // Match the 8s transition in CSS
        setTimeout(() => {
          setAnimating(false);
          setShowWinner(true);
          
          if (audioRef.current) {
            audioRef.current.pause();
          }

          // Play confetti sound whenever spin completes (for rounds 1-3)
          if (confettiAudioRef.current) {
            confettiAudioRef.current.currentTime = 0;
            confettiAudioRef.current.play().catch(err => console.log('Confetti audio play failed:', err));
          }

          // Play winner music if it's the final round (winner exists)
          if (winnerName && winnerAudioRef.current) {
            winnerAudioRef.current.play().catch(err => console.log('Winner audio play failed:', err));
          }

          // Use the stable ref
          onSpinCompleteRef.current?.();
        }, 8000);
      };

      // Ensure browser sees the change
      const timeoutId = setTimeout(startSpin, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpinning, winnerName]); 

  // Reset winner visibility when lotteryId changes
  useEffect(() => {
    setShowWinner(false);
    // Optional: Reset rotation to 0 on new lottery if desired
    // setRotation(0);
  }, [lotteryId]);

  const toggleMute = () => {
    const muted = !isMuted;
    if (audioRef.current) audioRef.current.muted = muted;
    if (winnerAudioRef.current) winnerAudioRef.current.muted = muted;
    if (confettiAudioRef.current) confettiAudioRef.current.muted = muted;
    setIsMuted(muted);
  };

  const eliminated = (totalParticipants || participants) - participants;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Lottery Information - TOP */}
      <div className="w-full max-w-md space-y-4 mb-16">
        {lotteryId ? (
          <div className="space-y-4">
            <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <p className="text-blue-300/80 text-xs mb-1 font-bold uppercase tracking-widest">Participants</p>
                  <p className="text-white text-4xl font-black tracking-tight flex items-baseline">
                    {participants}
                    {totalParticipants > 0 && totalParticipants !== participants && (
                      <span className="text-xl text-blue-400/40 font-bold ml-1">/{totalParticipants}</span>
                    )}
                  </p>
                </div>
                {eliminated > 0 && (
                  <div className="text-right pb-1 group/elim">
                    <p className="text-rose-400 text-3xl md:text-4xl font-black italic tracking-tighter uppercase animate-pulse drop-shadow-[0_0_20px_rgba(244,63,94,0.8)] [text-shadow:0_0_10px_rgba(244,63,94,0.5)]">
                      {eliminated} <span className="text-base md:text-lg border-l border-white/20 ml-2 pl-2 opacity-80 not-italic tracking-widest leading-none">FLUSHED OUT</span>
                    </p>
                  </div>
                )}
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
      <div className="relative w-64 h-64 md:w-96 md:h-96 mb-16 group">
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

      {/* Winner Announcement - RGB GRADIENT */}
      {showWinner && winnerName && (
        <div className="w-full max-w-2xl mb-6 fade-in">
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-1 shadow-2xl animate-pulse">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 md:p-12 text-center">
              {/* Trophy Icon */}
              <div className="flex items-center justify-center mb-6">
                <svg className="w-20 h-20 md:w-24 md:h-24 text-yellow-400 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              
              {/* Winner Label */}
              <p className="text-gray-400 text-lg md:text-xl font-medium uppercase tracking-widest mb-4">
                🎉 Grand Winner 🎉
              </p>
              
              {/* Winner Name with RGB Gradient */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x leading-tight">
                {winnerName}
              </h1>
              
              {/* Congratulations */}
              <p className="text-white text-xl md:text-2xl font-semibold mt-6">
                Congratulations! 🎊
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Execute Spin Button - BOTTOM */}
      {lotteryId && (
        <div className="w-full max-w-md mt-6">
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
