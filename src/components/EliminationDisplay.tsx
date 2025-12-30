import { motion } from 'framer-motion';

interface EliminatedUser {
  name: string;
  _id: string;
}

interface EliminationDisplayProps {
  users: EliminatedUser[];
  roundNumber: number;
  eliminatedCount: number;
}

export default function EliminationDisplay({ users, roundNumber, eliminatedCount }: EliminationDisplayProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] p-8 rounded-xl shadow-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl md:text-4xl font-semibold text-[#0f172a] text-center mb-4 tracking-tight">
          Round {roundNumber} Complete!
        </h2>
        
        <div className="text-center mb-6">
          <p className="text-2xl text-[#ef4444] font-semibold">
            {eliminatedCount} Users Eliminated
          </p>
        </div>

        <div className="bg-[#fafbfc] border border-[#e2e8f0] rounded-lg p-6">
          <p className="text-[#64748b] text-lg font-medium mb-4 text-center">
            Recently Eliminated Players {users.length > 0 && `(${users.length} shown)`}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {users.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                className="bg-[#fef2f2] border border-[#fecaca] p-3 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#ef4444] text-xl">✕</span>
                  <span className="text-[#0f172a] font-medium">{user.name}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {users.length === 0 && (
            <p className="text-[#94a3b8] text-center italic">No names to display</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
