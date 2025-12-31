import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  aadhaarNumber: string;
  panNumber?: string;
  imageUrl: string;
  couponCode?: string;
  createdAt: string;

}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter and search states
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState(10);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Delete all confirmation state
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');



  // Fetch users
  const fetchUsers = async (page: number = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`${API_ENDPOINTS.USERS.GET_ALL}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to load users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete all users
  const handleDeleteAll = async () => {
    if (deleteInput !== 'DELETE') return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.USERS.DELETE_ALL, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDeleteAllConfirm(false);
        setDeleteInput('');
        fetchUsers(1);
      } else {
        setError(data.message || 'Failed to delete all users');
      }
    } catch (err) {
      setError('Failed to delete all users');
    } finally {
      setLoading(false);
    }
  };


  // Delete user
  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.USERS.DELETE(userId), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDeleteConfirm(null);
        fetchUsers(pagination.currentPage);
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error('Delete user error:', err);
    }
  };

  const fetchAllUsersForExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Fetch a large number for export
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`${API_ENDPOINTS.USERS.GET_ALL}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Server error');
      }
      return data.data || [];
    } catch (err: any) {
      console.error('Export fetch error:', err);
      setError(err.message || 'Failed to fetch users for export');
      return [];
    }
  };


  const exportCSV = async () => {
    try {
      setLoading(true);
      const allUsers = await fetchAllUsersForExport();
      setLoading(false);

      if (allUsers.length === 0) {
        setError('No users found to export');
        return;
      }

      const headers = ['Name', 'Phone Number', 'Aadhaar Number', 'PAN Number', 'Coupon Code', 'Registered At'];
      const csvContent = [
        headers.join(','),
        ...allUsers.map((u: User) => [
          `"${u.name?.replace(/"/g, '""') || ''}"`,
          `"${u.phoneNumber || ''}"`,
          `"${u.aadhaarNumber || ''}"`,
          `"${u.panNumber || 'N/A'}"`,
          `"${u.couponCode || 'N/A'}"`,
          `"${new Date(u.createdAt).toLocaleString()}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `retail_champions_users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setLoading(false);
      setError('Failed to export CSV');
    }
  };

  const exportPDF = async () => {
    try {
      setLoading(true);
      const allUsers = await fetchAllUsersForExport();
      setLoading(false);

      if (allUsers.length === 0) {
        setError('No users found to export');
        return;
      }

      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text('RETAIL CHAMPIONS', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('Complete Participant Registry', 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Total Records: ${allUsers.length}`, 14, 46);
      
      const tableData = allUsers.map((u: User, index: number) => [
        index + 1,
        u.name,
        u.phoneNumber,
        u.aadhaarNumber,
        u.panNumber || 'N/A',
        u.couponCode || 'N/A',
        new Date(u.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [['#', 'Name', 'Phone', 'Aadhaar', 'PAN', 'Coupon', 'Registered']],

        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: { 
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          2: { font: 'courier' },
          3: { font: 'courier' },
          4: { font: 'courier' }
        }
      });

      doc.save(`retail_champions_users_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      setLoading(false);
      setError('Failed to export PDF');
    }
  };



  // Initial load and when filters change
  useEffect(() => {
    fetchUsers(1);
  }, [search, sortBy, sortOrder, limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-slate-300 mt-1">View and manage registered participants</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportCSV}
            disabled={loading || users.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <span>📊</span> {loading ? 'PREPARING...' : 'EXPORT CSV'}
          </button>
          <button
            onClick={exportPDF}
            disabled={loading || users.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <span>📄</span> {loading ? 'GENERATING...' : 'EXPORT PDF'}
          </button>
          
          <button
            onClick={() => setDeleteAllConfirm(true)}
            disabled={loading || users.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <span>🗑️</span> DELETE ALL
          </button>

          <div className="text-right bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl px-8 shadow-2xl">
            <p className="text-3xl font-black text-white">{pagination.totalCount}</p>
            <p className="text-blue-500/50 text-[10px] font-black uppercase tracking-widest mt-1">Total Users</p>
          </div>
        </div>


      </div>

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Search */}
          <div>
            <label className="block text-slate-300 font-bold mb-2 text-xs uppercase tracking-widest">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, phone, or document..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-slate-300 font-bold mb-2 text-xs uppercase tracking-widest">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="createdAt" className="bg-slate-900">Created Date</option>
              <option value="name" className="bg-slate-900">Name</option>
              <option value="phoneNumber" className="bg-slate-900">Phone Number</option>
              <option value="aadhaarNumber" className="bg-slate-900">Aadhaar Number</option>
            </select>
          </div>

          {/* Sort Order & Limit */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-slate-300 font-bold mb-2 text-xs uppercase tracking-widest">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="desc" className="bg-slate-900">Desc</option>
                <option value="asc" className="bg-slate-900">Asc</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-slate-300 font-bold mb-2 text-xs uppercase tracking-widest">Per Page</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="5" className="bg-slate-900">5</option>
                <option value="10" className="bg-slate-900">10</option>
                <option value="20" className="bg-slate-900">20</option>
                <option value="50" className="bg-slate-900">50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#fef2f2] border border-[#ef4444] rounded-lg p-4 text-center">
          <p className="text-[#dc2626] font-medium">{error}</p>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-12">
        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-slate-300 mt-6 font-bold tracking-widest uppercase text-sm">Synchronizing Database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-white text-2xl font-black">NO PARTICIPANTS FOUND</p>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest">Adjust your search parameters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Participant</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Identity Docs</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Coupon Code</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Registered At</th>

                    <th className="px-8 py-5 text-right text-xs font-black text-slate-300 uppercase tracking-widest">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-white/5 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.imageUrl}
                            alt={user.name}
                            onClick={() => setPreviewImage(user.imageUrl)}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg cursor-pointer hover:scale-110 hover:border-blue-500/50 transition-all duration-300"
                          />
                          <div className="flex flex-col">
                            <p className="text-white font-bold text-lg">{user.name}</p>
                            <p className="text-blue-400 text-sm font-medium">{user.phoneNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div>
                            <span className="text-xs text-[#64748b] uppercase tracking-wide">Aadhaar</span>
                            <p className="text-[#334155] text-sm font-mono">{user.aadhaarNumber}</p>
                          </div>
                          {user.panNumber && (
                            <div className="mt-2">
                              <span className="text-xs text-[#64748b] uppercase tracking-wide">PAN</span>
                              <p className="text-[#334155] text-sm font-mono">{user.panNumber}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1.5 inline-block">
                          <p className="text-blue-400 font-mono font-black text-sm tracking-widest">{user.couponCode || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#64748b] text-sm">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          className="px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium rounded-md transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {users.map((user) => (
                <div key={user._id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      onClick={() => setPreviewImage(user.imageUrl)}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
                    />

                    <div className="flex-1">
                      <p className="text-white font-black text-xl tracking-tight">{user.name}</p>
                      <p className="text-blue-400 font-bold text-sm tracking-wide">{user.phoneNumber}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                      <span className="text-blue-500/50 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Aadhaar Document</span>
                      <p className="text-slate-300 text-sm font-mono tracking-widest">{user.aadhaarNumber}</p>
                    </div>
                    {user.panNumber && (
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-blue-500/50 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">PAN Document</span>
                        <p className="text-slate-300 text-sm font-mono tracking-widest">{user.panNumber}</p>
                      </div>
                    )}
                    {user.couponCode && (
                      <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl">
                        <span className="text-blue-500/50 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Coupon Code</span>
                        <p className="text-blue-400 text-sm font-mono tracking-[0.2em] font-black">{user.couponCode}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-1">

                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    className="w-full py-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    Terminate Record
                  </button>
                </div>
              ))}
            </div>

          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <button
            onClick={() => fetchUsers(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || loading}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border border-white/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            PREVIOUS
          </button>
          
          <div className="flex items-center gap-4">
            <div className="h-10 px-6 flex items-center bg-blue-600/20 border border-blue-500/30 rounded-xl">
              <span className="text-blue-400 font-black text-sm uppercase tracking-tighter">
                PAGE {pagination.currentPage} <span className="text-blue-500/50 mx-1">/</span> {pagination.totalPages}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => fetchUsers(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || loading}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border border-white/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            NEXT
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 text-center tracking-tight">TERMINATE RECORD?</h3>
            <p className="text-slate-400 mb-8 text-center font-bold text-sm leading-relaxed">
              This action is permanent and will remove the participant from all active contests.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] border border-white/10 rounded-xl transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-rose-600/20"
              >
                CONFIRM DELETE
              </button>
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
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
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
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Wipe Entire Database?</h3>
            <p className="text-slate-400 mb-8 font-bold text-sm leading-relaxed">
              This will permanently delete <span className="text-red-400">{pagination.totalCount} participants</span> and all their document records. This cannot be undone.
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
                    setDeleteAllConfirm(false);
                    setDeleteInput('');
                  }}
                  className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] border border-white/10 rounded-xl transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteInput !== 'DELETE' || loading}
                  className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-20 disabled:grayscale"
                >
                  PURGE ALL RECORDS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


