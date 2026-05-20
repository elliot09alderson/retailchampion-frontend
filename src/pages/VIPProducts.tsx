import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

interface Product {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  sizes: string[];
  colors: string[];
  price: number;
  createdByRole: 'admin' | 'superadmin';
}

const PRESET_COLORS: Record<string, string> = {
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

function ProductCard({ product, onBuy }: { product: Product; onBuy: (p: Product) => void }) {
  const isSuperAdmin = product.createdByRole === 'superadmin';
  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-all duration-200 hover:scale-[1.02] ${
        isSuperAdmin
          ? 'border-yellow-400/60 bg-gradient-to-b from-yellow-900/20 to-gray-900 shadow-xl shadow-yellow-500/10'
          : 'border-gray-700 bg-gray-900'
      }`}
    >
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-yellow-500/40 to-yellow-300/20 px-4 py-2 text-yellow-200 text-xs font-bold flex items-center gap-1.5 tracking-wide">
          <span className="text-yellow-300">★</span> SUPER ADMIN EXCLUSIVE
        </div>
      )}
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-5xl text-gray-600">📦</div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-bold text-lg leading-snug ${isSuperAdmin ? 'text-yellow-100' : 'text-white'}`}>{product.title}</h3>
          <span className={`text-xl font-extrabold whitespace-nowrap ${isSuperAdmin ? 'text-yellow-400' : 'text-indigo-400'}`}>
            ₹{product.price.toLocaleString()}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{product.description}</p>

        {product.sizes.length > 0 && (
          <div className="mb-3">
            <p className="text-gray-500 text-xs mb-1.5 uppercase tracking-wide">Available Sizes</p>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map(s => (
                <span key={s} className={`px-2.5 py-1 rounded text-xs font-medium border ${
                  isSuperAdmin ? 'border-yellow-500/40 bg-yellow-900/20 text-yellow-200' : 'border-gray-600 bg-gray-800 text-gray-300'
                }`}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {product.colors.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-500 text-xs mb-1.5 uppercase tracking-wide">Colors</p>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map(c => (
                <div key={c} className="flex items-center gap-1">
                  <span
                    className="w-5 h-5 rounded-full border-2 border-gray-600 inline-block"
                    style={{ backgroundColor: c }}
                    title={PRESET_COLORS[c] || c}
                  />
                  <span className="text-gray-400 text-xs">{PRESET_COLORS[c] || c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onBuy(product)}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
            isSuperAdmin
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 hover:from-yellow-400 hover:to-yellow-300 shadow-lg shadow-yellow-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

export default function VIPProducts() {
  const navigate = useNavigate();
  const [superAdminProducts, setSuperAdminProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('vipToken') || '';

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/vip/login'); return; }
    fetchProducts(token);
  }, []);

  const fetchProducts = async (token: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTS.LIST_VIP, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuperAdminProducts(data.data.superAdminProducts);
        setAdminProducts(data.data.adminProducts);
      } else if (res.status === 401) {
        navigate('/vip/login');
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (product: Product) => {
    navigate(`/vip/products/${product._id}/buy`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/vip/profile')} className="text-gray-400 hover:text-white transition">
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Exclusive Products</h1>
          <p className="text-gray-500 text-xs">Available only for VIP & VVIP members</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : superAdminProducts.length === 0 && adminProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🛍️</p>
            <p className="text-lg">No products available right now</p>
            <p className="text-sm mt-1">Check back soon for exclusive offers!</p>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Super Admin Products */}
            {superAdminProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent" />
                  <h2 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                    <span>★</span> Products by Super Admin
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-yellow-500/50 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {superAdminProducts.map(p => (
                    <ProductCard key={p._id} product={p} onBuy={handleBuy} />
                  ))}
                </div>
              </section>
            )}

            {/* Admin Products */}
            {adminProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                  <h2 className="text-lg font-bold text-indigo-300">Products by Admin</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-indigo-500/50 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminProducts.map(p => (
                    <ProductCard key={p._id} product={p} onBuy={handleBuy} />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
