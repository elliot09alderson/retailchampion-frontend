import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

interface Order {
  _id: string;
  productTitle: string;
  productPrice: number;
  customerName: string;
  customerPhone: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  status: 'pending' | 'delivered';
  productAdminRole: 'admin' | 'superadmin';
  product?: { imageUrl?: string; title?: string };
  user?: { vipStatus?: string };
  createdAt: string;
}

const COLOR_NAMES: Record<string, string> = {
  '#EF4444': 'Red',
  '#3B82F6': 'Blue',
  '#22C55E': 'Green',
  '#EAB308': 'Yellow',
  '#111827': 'Black',
  '#F9FAFB': 'White',
  '#EC4899': 'Pink',
  '#A855F7': 'Purple',
  '#F97316': 'Orange',
  '#6B7280': 'Gray',
};

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<'admin' | 'superadmin'>('admin');

  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/admin/login'); return; }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role) setAdminRole(user.role);
    } catch {}
    fetchOrders(token);
  }, []);

  const fetchOrders = async (token: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.ORDERS.LIST, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setOrders(data.data);
      else toast.error('Failed to load orders');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (order: Order) => {
    setTogglingId(order._id);
    const newStatus = order.status === 'pending' ? 'delivered' : 'pending';
    const token = getToken();
    try {
      const res = await fetch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(order._id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: newStatus } : o));
        toast.success(`Marked as ${newStatus}`);
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(adminRole === 'superadmin' ? '/superadmin/dashboard' : '/admin/products')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Order Management</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-medium">
            Pending: {pendingCount}
          </span>
          <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 font-medium">
            Delivered: {deliveredCount}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'delivered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {f} {f === 'all' ? `(${orders.length})` : f === 'pending' ? `(${pendingCount})` : `(${deliveredCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">#</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Product</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Customer</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Size</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Color</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Qty</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Total</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">VIP</th>
                  <th className="px-4 py-3.5 text-left text-gray-400 font-medium">Date</th>
                  <th className="px-4 py-3.5 text-center text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((order, idx) => (
                  <tr
                    key={order._id}
                    className={`transition hover:bg-gray-900/50 ${
                      order.productAdminRole === 'superadmin' ? 'bg-yellow-900/5' : 'bg-transparent'
                    }`}
                  >
                    <td className="px-4 py-4 text-gray-500 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {order.product?.imageUrl ? (
                          <img src={order.product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg">📦</div>
                        )}
                        <div>
                          <p className={`font-medium leading-snug ${
                            order.productAdminRole === 'superadmin' ? 'text-yellow-200' : 'text-white'
                          }`}>
                            {order.productTitle}
                          </p>
                          {order.productAdminRole === 'superadmin' && (
                            <span className="text-yellow-400 text-xs">★ Super Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-medium">{order.customerName}</p>
                      <p className="text-gray-500 text-xs">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700 text-xs font-medium">
                        {order.selectedSize}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {order.selectedColor && order.selectedColor !== 'N/A' && (
                          <span
                            className="w-4 h-4 rounded-full border border-gray-500 inline-block flex-shrink-0"
                            style={{ backgroundColor: order.selectedColor }}
                          />
                        )}
                        <span className="text-gray-300 text-xs">{COLOR_NAMES[order.selectedColor] || order.selectedColor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white font-semibold">{order.quantity}</td>
                    <td className="px-4 py-4 text-white font-semibold">
                      ₹{(order.productPrice * order.quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        order.user?.vipStatus === 'vvip'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {(order.user?.vipStatus || 'vip').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(order)}
                        disabled={togglingId === order._id}
                        className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                          order.status === 'delivered'
                            ? 'bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30'
                            : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
                        }`}
                      >
                        {togglingId === order._id ? (
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                        ) : order.status === 'delivered' ? (
                          <>✓ Delivered</>
                        ) : (
                          <>⏳ Pending</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
