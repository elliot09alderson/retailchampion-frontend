import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  aadhaarNumber: string;
  panNumber?: string;
  imageUrl: string;
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
        <div className="text-right bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl px-8 shadow-2xl">
          <p className="text-3xl font-black text-white">{pagination.totalCount}</p>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Total Users</p>
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
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Contact Info</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-300 uppercase tracking-widest">Identity Docs</th>
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
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
                          />
                          <div>
                            <p className="text-white font-bold text-lg">{user.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-slate-300 font-medium">{user.phoneNumber}</p>
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
            <div className="md:hidden divide-y divide-[#e2e8f0]">
              {users.map((user) => (
                <div key={user._id} className="p-4 hover:bg-[#f8fafc] transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#e2e8f0]"
                    />
                    <div className="flex-1">
                      <p className="text-[#0f172a] font-medium text-lg">{user.name}</p>
                      <p className="text-[#64748b] text-sm">{user.phoneNumber}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div>
                      <span className="text-[#64748b] text-xs uppercase tracking-wide">Aadhaar Number</span>
                      <p className="text-[#334155] text-sm font-mono mt-1">{user.aadhaarNumber}</p>
                    </div>
                    {user.panNumber && (
                      <div>
                        <span className="text-[#64748b] text-xs uppercase tracking-wide">PAN Number</span>
                        <p className="text-[#334155] text-sm font-mono mt-1">{user.panNumber}</p>
                      </div>
                    )}
                    <p className="text-[#64748b] text-xs mt-2">
                      Registered: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    className="w-full px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium rounded-md transition-all"
                  >
                    Delete User
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
          <button
            onClick={() => fetchUsers(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[#64748b]">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>
          
          <button
            onClick={() => fetchUsers(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-[#0f172a] mb-3">Confirm Delete</h3>
            <p className="text-[#64748b] mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] font-medium rounded-md transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium rounded-md transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
