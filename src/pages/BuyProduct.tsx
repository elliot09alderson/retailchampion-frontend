import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function BuyProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const getToken = () => localStorage.getItem('vip_token') || '';

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/vip/login'); return; }
    if (!id) return;

    fetch(API_ENDPOINTS.PRODUCTS.GET_VIP(id), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProduct(data.data);
          if (data.data.sizes.length === 1) setSelectedSize(data.data.sizes[0]);
          if (data.data.colors.length === 1) setSelectedColor(data.data.colors[0]);
        } else {
          toast.error('Product not found');
          navigate('/vip/products');
        }
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSize && product && product.sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor && product && product.colors.length > 0) {
      toast.error('Please select a color');
      return;
    }

    setSubmitting(true);
    const token = getToken();
    try {
      const res = await fetch(API_ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          selectedSize: selectedSize || 'N/A',
          selectedColor: selectedColor || 'N/A',
          quantity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast.error(data.message || 'Order failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) return null;

  const isSuperAdmin = product.createdByRole === 'superadmin';
  const total = product.price * quantity;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <div className="bg-gray-900 rounded-2xl border border-green-500/40 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
          <p className="text-gray-400 mb-1">Your order for <span className="text-white font-semibold">{product.title}</span> has been received.</p>
          <p className="text-gray-500 text-sm mb-6">Our team will process it and get in touch with you.</p>
          <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 mb-6 space-y-1.5 text-left">
            <div className="flex justify-between"><span className="text-gray-500">Size</span><span>{selectedSize || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Color</span>
              <span className="flex items-center gap-1.5">
                {selectedColor && selectedColor !== 'N/A' && (
                  <span className="w-3 h-3 rounded-full inline-block border border-gray-500" style={{ backgroundColor: selectedColor }} />
                )}
                {COLOR_NAMES[selectedColor] || selectedColor || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span>{quantity}</span></div>
            <div className="flex justify-between font-semibold text-white pt-1 border-t border-gray-700">
              <span>Total</span><span>₹{total.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/vip/products')}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition"
          >
            Browse More Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/vip/products')} className="text-gray-400 hover:text-white transition">
          ← Back
        </button>
        <h1 className="text-xl font-bold">Place Order</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Product Summary */}
        <div className={`rounded-2xl border overflow-hidden mb-8 ${
          isSuperAdmin ? 'border-yellow-400/50 bg-yellow-900/10' : 'border-gray-700 bg-gray-900'
        }`}>
          {isSuperAdmin && (
            <div className="bg-gradient-to-r from-yellow-600/30 to-yellow-300/10 px-4 py-2 text-yellow-300 text-xs font-bold flex items-center gap-1">
              ★ SUPER ADMIN EXCLUSIVE
            </div>
          )}
          <div className="flex gap-4 p-4">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="w-24 h-24 object-cover rounded-xl" />
            ) : (
              <div className="w-24 h-24 bg-gray-800 rounded-xl flex items-center justify-center text-3xl">📦</div>
            )}
            <div className="flex-1">
              <h2 className={`font-bold text-lg ${isSuperAdmin ? 'text-yellow-100' : 'text-white'}`}>{product.title}</h2>
              <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">{product.description}</p>
              <p className={`text-xl font-extrabold mt-2 ${isSuperAdmin ? 'text-yellow-400' : 'text-indigo-400'}`}>
                ₹{product.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Size Selection */}
          {product.sizes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Size *</label>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${
                      selectedSize === s
                        ? isSuperAdmin
                          ? 'bg-yellow-500 border-yellow-400 text-gray-900 font-bold'
                          : 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Color *</label>
              <div className="flex flex-wrap gap-3">
                {product.colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm border transition ${
                      selectedColor === c
                        ? isSuperAdmin
                          ? 'border-yellow-400 bg-yellow-900/30 text-yellow-200'
                          : 'border-indigo-500 bg-indigo-900/30 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 ${selectedColor === c ? 'border-white' : 'border-gray-500'}`}
                      style={{ backgroundColor: c }}
                    />
                    <span>{COLOR_NAMES[c] || c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Quantity *</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 hover:border-gray-400 font-bold text-lg transition flex items-center justify-center"
              >
                −
              </button>
              <span className="text-2xl font-bold w-10 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 hover:border-gray-400 font-bold text-lg transition flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Unit Price</span>
              <span>₹{product.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Quantity</span>
              <span>× {quantity}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-lg pt-2 border-t border-gray-700">
              <span>Total</span>
              <span className={isSuperAdmin ? 'text-yellow-400' : 'text-indigo-400'}>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 ${
              isSuperAdmin
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 hover:from-yellow-400 hover:to-yellow-300 shadow-lg shadow-yellow-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {submitting ? 'Placing Order...' : 'Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
