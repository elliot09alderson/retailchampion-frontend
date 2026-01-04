import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface Winner {
  _id: string;
  name: string;
  phoneNumber: string;
  selfieUrl: string;
}

interface Contest {
  _id: string;
  eventName: string;
  completedAt: string;
  winnerId: Winner;
}

export default function WinnersHistory() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Delete states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
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
      } else {
        setError(data.message || 'Failed to fetch winners history');
      }
    } catch (err) {
      setError('Failed to load history');
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE' || !deleteConfirmId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.DELETE(deleteConfirmId), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDeleteConfirmId(null);
        setDeleteInput('');
        fetchHistory();
      } else {
        setError(data.message || 'Failed to delete record');
      }
    } catch (err) {
      setError('Network error while deleting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Winners Circle</h2>
          <p className="text-slate-300 mt-1">Hall of fame for all past champions</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-12">
        {loading && contests.length === 0 ? (
          <div className="p-20 text-center">
            <div className="inline-block w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-slate-300 mt-6 font-bold tracking-widest uppercase text-sm">Retrieving Legends...</p>
          </div>
        ) : contests.length === 0 ? (
          <div className="p-20 text-center">
            {error ? (
              <p className="text-rose-400 font-bold uppercase tracking-widest">{error}</p>
            ) : (
              <>
                <p className="text-white text-2xl font-black uppercase">No Champions Recorded Yet</p>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest">Winners will appear here after contest completion</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Champion</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Contest Event</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Victory Date</th>
                  <th className="px-8 py-5 text-right text-xs font-black text-slate-300 uppercase tracking-widest">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contests.map((contest) => (
                  <tr key={contest._id} className="hover:bg-white/5 transition-all duration-300 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative cursor-pointer" onClick={() => setPreviewImage(contest.winnerId?.selfieUrl)}>
                          <img
                            src={contest.winnerId?.selfieUrl || 'https://via.placeholder.com/150?text=HP'}
                            alt={contest.winnerId?.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-yellow-500/50 group-hover:border-yellow-500 transition-all shadow-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-[#0f172a]">
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-white font-black text-lg tracking-tight uppercase italic">{contest.winnerId?.name || 'N/A'}</p>
                          <p className="text-blue-400 font-bold text-xs tracking-widest">{contest.winnerId?.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className="text-slate-200 font-bold text-base">{contest.eventName}</p>
                        <span className="text-blue-500/50 text-[10px] font-black uppercase tracking-widest mt-1">Official Contest</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-white font-mono text-sm leading-tight">
                        {new Date(contest.completedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-slate-500 font-mono text-[10px] mt-1">
                         {new Date(contest.completedAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => setDeleteConfirmId(contest._id)}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        Purge Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Delete Contest Record?</h3>
            <p className="text-slate-400 mb-8 font-bold text-sm leading-relaxed">
              This will permanently delete the contest history and its associated winner data from the archive.
            </p>

            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  Type <span className="text-white">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-black text-center focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-white/10"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteInput('');
                  }}
                  className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] border border-white/10 rounded-xl transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== 'DELETE' || loading}
                  className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-20 disabled:grayscale"
                >
                  CONFIRM PURGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
            <button 
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors p-2"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl border-4 border-yellow-500 shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
