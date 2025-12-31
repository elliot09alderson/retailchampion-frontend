import React from 'react';

const OperationalGuidelines: React.FC = () => {
  return (
    <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
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
  );
};

export default OperationalGuidelines;
