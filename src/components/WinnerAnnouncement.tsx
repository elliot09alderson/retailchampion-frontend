import { motion } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface WinnerAnnouncementProps {
  winnerName: string;
  winnerImage?: string;
}

export default function WinnerAnnouncement({ winnerName, winnerImage }: WinnerAnnouncementProps) {
  useEffect(() => {
    // Trigger dramatic confetti burst
    const end = Date.now() + 8 * 1000; // 8 seconds of confetti
    const colors = ['#334155', '#64748b', '#10b981', '#f59e0b', '#ef4444'];

    // Initial burst
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.6 },
      colors,
      scalar: 1.2,
    });

    // Continuous confetti
    const interval = setInterval(() => {
      const timeLeft = end - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 5;
      
      confetti({
        particleCount,
        angle: 60,
        spread: 80,
        origin: { x: 0 },
        colors,
      });
      
      confetti({
        particleCount,
        angle: 120,
        spread: 80,
        origin: { x: 1 },
        colors,
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white border border-[#e2e8f0] p-1 rounded-2xl shadow-xl">
          <div className="bg-gradient-to-br from-[#fafbfc] to-white p-8 md:p-12 rounded-2xl">
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-semibold text-[#0f172a] mb-2 uppercase tracking-tight">
                🏆 Winner 🏆
              </h1>
              
              <div className="my-8">
                {winnerImage ? (
                  <img
                    src={winnerImage}
                    alt={winnerName}
                    className="w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full border-4 border-[#10b981] shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full border-4 border-[#10b981] bg-gradient-to-br from-[#334155] to-[#475569] flex items-center justify-center shadow-xl">
                    <span className="text-6xl md:text-8xl">🏆</span>
                  </div>
                )}
              </div>

              <h2 className="text-4xl md:text-6xl font-semibold text-[#0f172a] mb-4">
                {winnerName}
              </h2>

              <p className="text-[#10b981] text-xl md:text-2xl font-medium uppercase tracking-wide">
                Congratulations!
              </p>

              <p className="text-[#64748b] text-base md:text-lg mt-4">
                You've won the Retail Champions Contest!
              </p>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-8"
              >
                <div className="inline-block bg-gradient-to-r from-[#10b981] to-[#059669] text-white px-8 py-4 rounded-full font-semibold text-xl shadow-lg">
                  🌟 CHAMPION 🌟
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
