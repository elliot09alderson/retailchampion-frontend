import { motion } from 'framer-motion';

interface SpinWheelProps {
  isSpinning: boolean;
}

export default function SpinWheel({ isSpinning }: SpinWheelProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Subtle outer glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#334155] via-[#64748b] to-[#334155] rounded-full blur-xl opacity-20" />
        
        {/* Spinning wheel */}
        <motion.div
          className={`relative w-full h-full rounded-full shadow-2xl border-4 border-[#e2e8f0] ${
            isSpinning ? 'spin-animation' : ''
          }`}
          style={{
            background: 'conic-gradient(from 0deg, #f8fafc 0deg, #e2e8f0 45deg, #cbd5e1 90deg, #94a3b8 135deg, #64748b 180deg, #94a3b8 225deg, #cbd5e1 270deg, #e2e8f0 315deg, #f8fafc 360deg)',
          }}
        >
          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#334155] to-[#475569] flex items-center justify-center shadow-xl border-4 border-white">
              <span className="text-3xl md:text-4xl font-semibold text-white tracking-tight">RC</span>
            </div>
          </div>

          {/* Decorative segments */}
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1 h-20 md:h-24 bg-[#64748b]/30 origin-top"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
              }}
            />
          ))}
        </motion.div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#334155] drop-shadow-lg" />
        </div>
      </div>
    </div>
  );
}
