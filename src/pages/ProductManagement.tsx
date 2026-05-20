import { useState, useEffect, useRef } from 'react';
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
  isActive: boolean;
  createdByRole: 'admin' | 'superadmin';
  createdAt: string;
}

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const PRESET_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#F9FAFB' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Gray', hex: '#6B7280' },
];

export default function ProductManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adminRole, setAdminRole] = useState<'admin' | 'superadmin'>('admin');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    sizes: [] as string[],
    colors: [] as string[],
    image: null as File | null,
    imagePreview: '',
  });

  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/admin/login'); return; }
    void fetchMe(token);
    fetchProducts(token);
  }, []);

  const fetchMe = async (token: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.ME, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAdminRole(data.data.role);
    } catch {}
  };

  const fetchProducts = async (token: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTS.LIST_ADMIN, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', price: '', sizes: [], colors: [], image: null, imagePreview: '' });
    setEditingProduct(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      title: p.title,
      description: p.description,
      price: String(p.price),
      sizes: [...p.sizes],
      colors: [...p.colors],
      image: null,
      imagePreview: p.imageUrl,
    });
    setShowForm(true);
  };

  const toggleSize = (s: string) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
    }));
  };

  const toggleColor = (hex: string) => {
    setForm(f => ({
      ...f,
      colors: f.colors.includes(hex) ? f.colors.filter(x => x !== hex) : [...f.colors, hex],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.price) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    const token = getToken();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('sizes', JSON.stringify(form.sizes));
    formData.append('colors', JSON.stringify(form.colors));
    if (form.image) formData.append('image', form.image);

    try {
      const url = editingProduct
        ? API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct._id)
        : API_ENDPOINTS.PRODUCTS.CREATE;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();

      if (data.success) {
        toast.success(editingProduct ? 'Product updated!' : 'Product created!');
        resetForm();
        setShowForm(false);
        fetchProducts(token);
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const token = getToken();
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTS.DELETE(id), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted');
        setProducts(prev => prev.filter(p => p._id !== id));
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const colorName = (hex: string) => PRESET_COLORS.find(c => c.hex === hex)?.name || hex;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(adminRole === 'superadmin' ? '/superadmin/dashboard' : '/admin/lottery')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Product Management</h1>
          {adminRole === 'superadmin' && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
              Super Admin
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition"
          >
            View Orders
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Add / Edit Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product Image</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition flex flex-col items-center justify-center min-h-[140px]"
                  >
                    {form.imagePreview ? (
                      <img src={form.imagePreview} alt="preview" className="max-h-32 rounded-lg object-cover" />
                    ) : (
                      <div className="text-center text-gray-500">
                        <div className="text-3xl mb-1">📷</div>
                        <p className="text-sm">Click to upload image</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="Product title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Product description"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                          form.sizes.includes(s)
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Colors</label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => toggleColor(c.hex)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition ${
                          form.colors.includes(c.hex)
                            ? 'border-white bg-gray-700'
                            : 'border-gray-600 bg-gray-800 hover:border-gray-400'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-500 inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex-1 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-lg">No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div
                key={p._id}
                className={`rounded-2xl border overflow-hidden transition ${
                  p.createdByRole === 'superadmin'
                    ? 'border-yellow-500/50 bg-gray-900 shadow-lg shadow-yellow-500/10'
                    : 'border-gray-700 bg-gray-900'
                }`}
              >
                {p.createdByRole === 'superadmin' && (
                  <div className="bg-gradient-to-r from-yellow-600/30 to-yellow-400/20 px-3 py-1.5 text-yellow-300 text-xs font-semibold flex items-center gap-1">
                    ★ Super Admin Product
                  </div>
                )}
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-800 flex items-center justify-center text-4xl text-gray-600">📦</div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-white text-base leading-snug">{p.title}</h3>
                    <span className="text-lg font-bold text-indigo-400 whitespace-nowrap">₹{p.price.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{p.description}</p>

                  {p.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.sizes.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs border border-gray-700">{s}</span>
                      ))}
                    </div>
                  )}
                  {p.colors.length > 0 && (
                    <div className="flex gap-1.5 mb-3">
                      {p.colors.map(c => (
                        <span
                          key={c}
                          title={colorName(c)}
                          className="w-5 h-5 rounded-full border border-gray-500"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
