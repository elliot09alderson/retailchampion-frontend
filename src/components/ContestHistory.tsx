import { useState, useEffect, useMemo } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

interface Winner {
  _id: string;
  name: string;
  phoneNumber: string;
  selfieUrl: string;
}

interface Contest {
  _id: string;
  eventName: string;
  package: number;
  totalParticipants: number;
  status: string;
  createdAt: string;
  completedAt: string;
  startDate?: string;
  endDate?: string;
  winnerId: Winner;
}

interface ContestHistoryProps {
  onNavigateWinners?: (contestName: string, packageAmount: string) => void;
}

export default function ContestHistory({ onNavigateWinners }: ContestHistoryProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPackage, setFilterPackage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.HISTORY, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setContests(data.data);
      }
    } catch (err) {
      toast.error('Failed to load contest history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const uniquePackages = useMemo(() => {
    const packages = [...new Set(contests.map((c) => c.package).filter(Boolean))];
    return (packages as number[]).sort((a, b) => a - b);
  }, [contests]);

  const filteredContests = useMemo(() => {
    return contests.filter((c) => {
      const matchesPackage = filterPackage ? c.package?.toString() === filterPackage : true;
      const matchesSearch = searchQuery
        ? c.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.winnerId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesPackage && matchesSearch;
    });
  }, [contests, filterPackage, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-white tracking-tight">Contest History</h2>
          <p className="text-slate-300 mt-1">Detailed log of all completed battle events</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Delete All Button */}
          {contests.length > 0 && (
              <button
                onClick={async () => {
                    if (!confirm('WARNING: This will delete ALL completed contest history records. This action cannot be undone!')) return;
                    if (!confirm('Are you absolutely sure? This will wipe all history data.')) return;
                    
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(API_ENDPOINTS.LOTTERY.DELETE_ALL, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.success) {
                            toast.success('All history deleted successfully');
                            setContests([]);
                        } else {
                            toast.error(data.message || 'Failed to delete history');
                        }
                    } catch (err) {
                        toast.error('Error deleting history');
                    }
                }}
                className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-sm font-bold border border-red-600/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete All
              </button>
          )}
          {/* Package Filter */}
          <select
            value={filterPackage}
            onChange={(e) => setFilterPackage(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer min-w-[150px]"
          >
            <option value="" className="bg-slate-900">All Packs</option>
            {uniquePackages.map((pkg) => (
              <option key={pkg} value={pkg.toString()} className="bg-slate-900">
                ₹{pkg.toLocaleString()} Pack
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 md:flex-none">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contest or winner..."
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && contests.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-block w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="py-20 bg-white/5 rounded-3xl border border-white/10 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest italic">No matching contests found</p>
          </div>
        ) : (
          filteredContests.map((contest) => (
            <div
              key={contest._id}
              onClick={() => {
                if (contest.status === 'completed') {
                  onNavigateWinners?.(contest.eventName, contest.package?.toString());
                } else {
                  toast('Results available after contest completion', {
                    icon: '⏳',
                    style: {
                      borderRadius: '10px',
                      background: '#333',
                      color: '#fff',
                    },
                  });
                }
              }}
              className={`group bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl transition-all duration-300 relative overflow-hidden ${
                contest.status === 'completed' ? 'hover:border-blue-500/30 cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Decorative side bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                contest.status === 'completed' ? 'bg-blue-600/50 group-hover:bg-blue-500' : 
                contest.status === 'active' ? 'bg-emerald-500/50' : 'bg-amber-500/50'
              }`} />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                {/* Contest Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-500/20">
                      ₹{contest.package?.toLocaleString() || '0'} PACK
                    </span>
                    {contest.status === 'completed' && contest.completedAt ? (
                      <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        {new Date(contest.completedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        contest.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {contest.status === 'active' ? 'LIVE NOW' : 'SCHEDULED'}
                      </span>
                    )}
                  </div>
                  
                  {/* Date Range */}
                  {(contest.startDate && contest.endDate) && (
                      <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="text-slate-500">Event:</span>
                          <span className="text-white">{new Date(contest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="text-slate-600">-</span>
                          <span className="text-white">{new Date(contest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                  )}
                  <h3 className={`text-2xl font-black text-white uppercase tracking-tight transition-colors ${
                    contest.status === 'completed' ? 'group-hover:text-blue-400' : ''
                  }`}>
                    {contest.eventName}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 font-bold">
                    TOTAL PARTICIPANTS: <span className="text-white">{contest.totalParticipants}</span>
                  </p>
                </div>

                {/* Winner Card */}
                {contest.winnerId && (
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 w-full lg:w-auto">
                    <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewImage(contest.winnerId.selfieUrl); }}>
                      <img
                        src={contest.winnerId.selfieUrl}
                        alt={contest.winnerId.name}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-yellow-500/50 group-hover:border-yellow-500 transition-all"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-[#0f172a]">
                        <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Champion</p>
                      <p className="text-white font-black text-base">{contest.winnerId.name}</p>
                      <p className="text-slate-400 font-bold text-[10px]">{contest.winnerId.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>

                {/* Delete Button */}
                <button
                   onClick={(e) => {
                     e.stopPropagation();
                     const deleteContest = async () => {
                        if (!confirm(`Are you sure you want to delete "${contest.eventName}"? Data cannot be recovered.`)) return;
                        
                        try {
                           const token = localStorage.getItem('token');
                           const res = await fetch(API_ENDPOINTS.LOTTERY.DELETE(contest._id), {
                               method: 'DELETE',
                               headers: { Authorization: `Bearer ${token}` }
                           });
                           const data = await res.json();
                           if (data.success) {
                               toast.success('Contest deleted successfully');
                               setContests(contests.filter(c => c._id !== contest._id));
                           } else {
                               toast.error(data.message || 'Failed to delete contest');
                           }
                        } catch (err) {
                           toast.error('Error deleting contest');
                        }
                     };
                     deleteContest();
                   }}
                   className="absolute top-6 right-6 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 z-20 opacity-0 group-hover:opacity-100"
                   title="Delete Contest"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[120] p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-3xl border-4 border-yellow-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
