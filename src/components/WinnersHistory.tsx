import { useState, useEffect, useMemo } from 'react';
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
  totalParticipants?: number;
}

type SortField = 'name' | 'eventName' | 'completedAt';
type SortOrder = 'asc' | 'desc';

export default function WinnersHistory() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

  // Delete states (single)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState('');

  // Delete all states
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState('');

  // Pagination & Filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('completedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterContest, setFilterContest] = useState('');

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

  const handleDeleteAll = async () => {
    if (deleteAllInput !== 'DELETE') return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.DELETE_ALL, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteAllModal(false);
        setDeleteAllInput('');
        fetchHistory();
      } else {
        setError(data.message || 'Failed to delete all records');
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

  // Get unique contest names for filter dropdown
  const uniqueContests = useMemo(() => {
    const names = [...new Set(contests.map(c => c.eventName))];
    return names.sort();
  }, [contests]);

  // Filter, search, and sort contests
  const filteredContests = useMemo(() => {
    let result = [...contests];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.winnerId?.name?.toLowerCase().includes(query) ||
          c.winnerId?.phoneNumber?.includes(query) ||
          c.eventName?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterContest) {
      result = result.filter((c) => c.eventName === filterContest);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';

      switch (sortField) {
        case 'name':
          valueA = a.winnerId?.name?.toLowerCase() || '';
          valueB = b.winnerId?.name?.toLowerCase() || '';
          break;
        case 'eventName':
          valueA = a.eventName?.toLowerCase() || '';
          valueB = b.eventName?.toLowerCase() || '';
          break;
        case 'completedAt':
          valueA = new Date(a.completedAt).getTime();
          valueB = new Date(b.completedAt).getTime();
          break;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [contests, searchQuery, filterContest, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredContests.length / limit);
  const paginatedContests = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredContests.slice(start, start + limit);
  }, [filteredContests, currentPage, limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterContest, sortField, sortOrder, limit]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const dataToExport = filteredContests;
    if (dataToExport.length === 0) return;

    const headers = ['S.No', 'Winner Name', 'Phone Number', 'Contest Name', 'Victory Date', 'Victory Time'];
    const rows = dataToExport.map((contest, index) => [
      index + 1,
      contest.winnerId?.name || 'N/A',
      contest.winnerId?.phoneNumber || 'N/A',
      contest.eventName,
      new Date(contest.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      new Date(contest.completedAt).toLocaleTimeString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `winners_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPDF = () => {
    const dataToExport = filteredContests;
    if (dataToExport.length === 0) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Winners History Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #fff;
            color: #1e293b;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          .header h1 {
            font-size: 28px;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .header p {
            color: #64748b;
            font-size: 14px;
          }
          .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 30px;
          }
          .stat {
            text-align: center;
          }
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 14px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          tr:hover {
            background: #f1f5f9;
          }
          .winner-name {
            font-weight: 600;
            color: #0f172a;
          }
          .phone {
            color: #3b82f6;
            font-family: monospace;
          }
          .contest {
            color: #7c3aed;
          }
          .date {
            font-family: monospace;
            color: #64748b;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏆 Winners Circle Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${dataToExport.length}</div>
            <div class="stat-label">Total Winners</div>
          </div>
          <div class="stat">
            <div class="stat-value">${uniqueContests.length}</div>
            <div class="stat-label">Contests</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Winner Name</th>
              <th>Phone Number</th>
              <th>Contest Name</th>
              <th>Victory Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map((contest, index) => `
              <tr>
                <td>${index + 1}</td>
                <td class="winner-name">${contest.winnerId?.name || 'N/A'}</td>
                <td class="phone">${contest.winnerId?.phoneNumber || 'N/A'}</td>
                <td class="contest">${contest.eventName}</td>
                <td class="date">${new Date(contest.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td class="date">${new Date(contest.completedAt).toLocaleTimeString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Retail Champions - Winners History Report</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Winners Circle</h2>
          <p className="text-slate-300 mt-1">Hall of fame for all past champions</p>
        </div>
        {contests.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>

            {/* Export PDF Button */}
            <button
              onClick={exportToPDF}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </button>

            {/* Delete All Button */}
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Search
            </label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or phone..."
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Filter by Contest */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Filter by Contest
            </label>
            <select
              value={filterContest}
              onChange={(e) => setFilterContest(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Contests</option>
              {uniqueContests.map((name) => (
                <option key={name} value={name} className="bg-slate-900">
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Items Per Page */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Items Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value={5} className="bg-slate-900">5</option>
              <option value={10} className="bg-slate-900">10</option>
              <option value={25} className="bg-slate-900">25</option>
              <option value={50} className="bg-slate-900">50</option>
              <option value={100} className="bg-slate-900">100</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Sort By
            </label>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field as SortField);
                setSortOrder(order as SortOrder);
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="completedAt-desc" className="bg-slate-900">Date (Newest First)</option>
              <option value="completedAt-asc" className="bg-slate-900">Date (Oldest First)</option>
              <option value="name-asc" className="bg-slate-900">Name (A-Z)</option>
              <option value="name-desc" className="bg-slate-900">Name (Z-A)</option>
              <option value="eventName-asc" className="bg-slate-900">Contest (A-Z)</option>
              <option value="eventName-desc" className="bg-slate-900">Contest (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <span className="text-sm text-slate-400">
            Total: <span className="text-white font-bold">{contests.length}</span> winners
          </span>
          {searchQuery || filterContest ? (
            <span className="text-sm text-slate-400">
              Showing: <span className="text-blue-400 font-bold">{filteredContests.length}</span> results
            </span>
          ) : null}
          {(searchQuery || filterContest) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterContest('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {loading && contests.length === 0 ? (
          <div className="p-20 text-center">
            <div className="inline-block w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-slate-300 mt-6 font-bold tracking-widest uppercase text-sm">Retrieving Legends...</p>
          </div>
        ) : paginatedContests.length === 0 ? (
          <div className="p-20 text-center">
            {error ? (
              <p className="text-rose-400 font-bold uppercase tracking-widest">{error}</p>
            ) : searchQuery || filterContest ? (
              <>
                <p className="text-white text-2xl font-black uppercase">No Results Found</p>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest">Try adjusting your search or filters</p>
              </>
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
                  <th 
                    className="px-6 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Champion
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('eventName')}
                  >
                    <div className="flex items-center gap-2">
                      Contest Event
                      {getSortIcon('eventName')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('completedAt')}
                  >
                    <div className="flex items-center gap-2">
                      Victory Date
                      {getSortIcon('completedAt')}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-black text-slate-300 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedContests.map((contest) => (
                  <tr key={contest._id} className="hover:bg-white/5 transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative cursor-pointer" onClick={() => setPreviewImage(contest.winnerId?.selfieUrl)}>
                          <img
                            src={contest.winnerId?.selfieUrl || 'https://via.placeholder.com/150?text=HP'}
                            alt={contest.winnerId?.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/50 group-hover:border-yellow-500 transition-all shadow-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-[#0f172a]">
                            <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{contest.winnerId?.name || 'N/A'}</p>
                          <p className="text-blue-400 font-medium text-xs">{contest.winnerId?.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <p className="text-slate-200 font-bold text-sm">{contest.eventName}</p>
                        <span className="text-blue-500/50 text-[10px] font-black uppercase tracking-widest mt-1">Official Contest</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-white font-mono text-sm">
                        {new Date(contest.completedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-slate-500 font-mono text-[10px] mt-1">
                        {new Date(contest.completedAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedContest(contest)}
                          className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(contest._id)}
                          className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-400">
              Page <span className="text-white font-bold">{currentPage}</span> of{' '}
              <span className="text-white font-bold">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Winner Details Modal */}
      {selectedContest && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-[0_0_100px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedContest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Winner Photo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src={selectedContest.winnerId?.selfieUrl || 'https://via.placeholder.com/200?text=Winner'}
                  alt={selectedContest.winnerId?.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-yellow-500 shadow-xl cursor-pointer"
                  onClick={() => setPreviewImage(selectedContest.winnerId?.selfieUrl)}
                />
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-xl p-2 border-4 border-[#0f172a]">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Winner Info */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                {selectedContest.winnerId?.name || 'Unknown Winner'}
              </h3>
              <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mt-1">Champion</p>
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</p>
                    <p className="text-white font-bold">{selectedContest.winnerId?.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contest Name</p>
                    <p className="text-white font-bold">{selectedContest.eventName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Victory Date</p>
                    <p className="text-white font-bold">
                      {new Date(selectedContest.completedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedContest(null)}
              className="w-full mt-6 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border border-white/10 rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Single Confirmation Modal */}
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
                  CONFIRM DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-red-600/50">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Delete All Winners?</h3>
            <p className="text-slate-400 mb-4 font-bold text-sm leading-relaxed">
              This action is <span className="text-red-400">IRREVERSIBLE</span>. You are about to permanently delete:
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 font-black text-2xl">{contests.length}</p>
              <p className="text-red-400/70 text-sm font-bold uppercase tracking-widest">Winner Records</p>
            </div>
            <p className="text-slate-500 text-xs mb-6">
              All associated contest data, rounds, and participant history will be permanently erased.
            </p>

            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  Type <span className="text-red-400 font-black">DELETE</span> to confirm permanent deletion
                </label>
                <input
                  type="text"
                  value={deleteAllInput}
                  onChange={(e) => setDeleteAllInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-5 py-4 bg-white/5 border border-red-500/30 rounded-xl text-white font-black text-center focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-white/10 text-xl tracking-widest"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteAllInput('');
                  }}
                  className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] border border-white/10 rounded-xl transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteAllInput !== 'DELETE' || loading}
                  className="flex-1 px-4 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-red-600/50 disabled:opacity-20 disabled:grayscale"
                >
                  {loading ? 'DELETING...' : 'DELETE ALL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[120] p-4 cursor-zoom-out"
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
