import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Edit3, Trash2, Eye, EyeOff, LogOut, Menu,
  ShoppingBag, Tag, BarChart2, Upload, X, Check,
  Clock, AlertCircle, RefreshCw, Sparkles, Users, MessageCircle, Mail, Send
} from 'lucide-react';
import API, { adminLogin, getAdminToken } from '../api';
import AiAssistantTab from './AiAssistantTab';
import './AdminPage.css';

// ─── Auth ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await adminLogin(password);
      sessionStorage.setItem('bh_admin_token', data.token);
      onLogin();
    } catch {
      setError('Incorrect password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <h1>Bel's Haven</h1>
          <p>Store Management</p>
        </div>
        <div className="admin-login__form">
          <label>Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Enter your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
          />
          {error && <p className="admin-login__error"><AlertCircle size={14} />{error}</p>}
          <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={submit} disabled={loading}>
            {loading ? <><div className="spinner" /><span>Verifying...</span></> : <span>Enter Dashboard</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!getAdminToken());
  const [tab, setTab] = useState('products');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [tab]);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="admin-page">
      {menuOpen && <button className="admin-mobile-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close admin menu" />}
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-mobile-bar">
          <button
            className="admin-mobile-bar__toggle"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-mobile-bar__title">
            <p>Admin Dashboard</p>
            <h2>Bel's Haven</h2>
          </div>
        </div>
        <div className="admin-sidebar__logo">
          <h2>Bel's Haven</h2>
          <p>Admin Dashboard</p>
        </div>
        <div className="admin-sidebar__panel">
          <nav className="admin-nav">
            {[
              { id: 'products', icon: Package, label: 'Products' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders' },
              { id: 'customers', icon: Users, label: 'Customers' },
              { id: 'categories', icon: Tag, label: 'Categories' },
              { id: 'stats', icon: BarChart2, label: 'Overview' },
              { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`admin-nav__item ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <button className="admin-nav__logout" onClick={() => { sessionStorage.removeItem('bh_admin_token'); setAuthed(false); }}>
            <LogOut size={16} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'customers' && <CustomersTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'ai' && <AiAssistantTab />}
      </main>
    </div>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    API.get('/stats/').then(r => setStats(r.data)).catch(() => {});
    API.get('/orders/all/').then(r => setOrders(r.data.results || r.data || [])).catch(() => {});
  }, []);

  const revenue = orders.filter(o => o.payment_verified).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const paid = orders.filter(o => o.payment_verified).length;

  return (
    <div className="admin-section">
      <h2 className="admin-section__title">Overview</h2>
      <div className="stats-grid">
        {[
          { label: 'Total Products', value: stats?.total_products ?? '…', color: 'gold' },
          { label: 'Available', value: stats?.available_products ?? '…', color: 'green' },
          { label: 'Pre-orders', value: stats?.preorder_products ?? '…', color: 'blue' },
          { label: 'Paid Orders', value: paid, color: 'gold' },
          { label: 'Total Revenue', value: `GH₵${revenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, color: 'green' },
          { label: 'Categories', value: stats?.categories ?? '…', color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`stat-card stat-card--${color}`}>
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const load = useCallback(() => {
    API.get('/categories/').then(r => setCategories(r.data.results || r.data || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = k => e => {
    const val = e.target.value;
    setForm(f => ({
      ...f,
      [k]: val,
      ...(k === 'name' && !editId ? { slug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
    }));
  };

  const save = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      if (editId) await API.put(`/categories/${editId}/`, form);
      else await API.post('/categories/', form);
      setForm({ name: '', slug: '', description: '' });
      setShowForm(false);
      setEditId(null);
      load();
    } catch (e) {
      alert('Error saving category');
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await API.delete(`/categories/${id}/`);
    load();
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
    setEditId(cat.id);
    setShowForm(true);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2 className="admin-section__title">Categories</h2>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', slug: '', description: '' }); }}>
          <Plus size={15} /><span>{showForm ? 'Cancel' : 'Add Category'}</span>
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editId ? 'Edit Category' : 'New Category'}</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Name *</label>
              <input className="input-field" value={form.name} onChange={set('name')} placeholder="e.g. Fashion" />
            </div>
            <div className="form-group">
              <label>Slug *</label>
              <input className="input-field" value={form.slug} onChange={set('slug')} placeholder="e.g. fashion" />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={set('description')} />
          </div>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <><div className="spinner" /><span>Saving…</span></> : <><Check size={15} /><span>Save Category</span></>}
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td><code>{cat.slug}</code></td>
                <td>{cat.product_count}</td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => startEdit(cat)}><Edit3 size={15} /></button>
                    <button onClick={() => del(cat.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={4} className="table-empty">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      API.get('/products/'),
      API.get('/categories/'),
    ]).then(([p, c]) => {
      setProducts(p.data.results || p.data || []);
      setCategories(c.data.results || c.data || []);
    }).catch(() => {
      setLoadError('Failed to load products. Check that REACT_APP_API_URL is set correctly.');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (product) => {
    await API.patch(`/products/${product.slug}/`, {
      status: product.status === 'active' ? 'inactive' : 'active'
    });
    load();
  };

  const del = async (slug) => {
    if (!window.confirm('Delete this product?')) return;
    await API.delete(`/products/${slug}/`);
    load();
  };

  const filtered = products.filter(p =>
    filter === 'all' ? true :
    filter === 'available' ? p.product_type === 'available' :
    filter === 'preorder' ? p.product_type === 'preorder' :
    filter === 'inactive' ? p.status === 'inactive' : true
  );

  if (showForm) return (
    <ProductForm
      product={editProduct}
      categories={categories}
      onDone={() => { setShowForm(false); setEditProduct(null); load(); }}
      onCancel={() => { setShowForm(false); setEditProduct(null); }}
    />
  );

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2 className="admin-section__title">Products</h2>
        <button className="btn-primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
          <Plus size={15} /><span>Add Product</span>
        </button>
      </div>

      <div className="filter-pills" style={{ marginBottom: 24 }}>
        {['all','available','preorder','inactive'].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loadError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: 16 }}>{loadError}</p>}

      {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
        <div className="product-admin-grid">
          {filtered.map(p => (
            <div key={p.id} className={`product-admin-card ${p.status === 'inactive' ? 'inactive' : ''}`}>
              <div className="product-admin-card__image">
                {p.primary_image
                  ? <img src={p.primary_image} alt={p.name} />
                  : <Package size={28} />
                }
                <div className="product-admin-card__badges">
                  <span className={`badge ${p.product_type === 'preorder' ? 'badge-preorder' : 'badge-available'}`}>
                    {p.product_type === 'preorder' ? 'Pre-order' : 'In Stock'}
                  </span>
                  {p.status === 'inactive' && <span className="badge badge-sold-out">Hidden</span>}
                </div>
              </div>
              <div className="product-admin-card__body">
                <p className="product-admin-card__name">{p.name}</p>
                <p className="product-admin-card__price">GH₵{parseFloat(p.price).toLocaleString('en-GH')}</p>
                <p className="product-admin-card__stock">
                  {p.product_type === 'preorder' ? `${p.stock_quantity} slots` : `${p.stock_quantity} in stock`}
                </p>
                {p.product_type === 'preorder' && p.preorder_eta && (
                  <p className="product-admin-card__eta"><Clock size={11} /> {p.preorder_eta}</p>
                )}
              </div>
              <div className="product-admin-card__actions">
                <button title="Edit" onClick={() => { setEditProduct(p); setShowForm(true); }}><Edit3 size={15} /></button>
                <button title={p.status === 'active' ? 'Hide' : 'Show'} onClick={() => toggle(p)}>
                  {p.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button title="Delete" onClick={() => del(p.slug)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="admin-empty">No products found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ product, categories, onDone, onCancel }) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState(product?.images_list || []);
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    category: product?.category?.id || '',
    price: product?.price || '',
    shipping_fee: product?.shipping_fee || '0',
    product_type: product?.product_type || 'available',
    status: product?.status || 'active',
    stock_quantity: product?.stock_quantity || '',
    delivery_timeframe: product?.delivery_timeframe || '',
    preorder_eta: product?.preorder_eta || '',
    preorder_shipping_fee: product?.preorder_shipping_fee || '0',
    preorder_shipped: product?.preorder_shipped || false,
    is_featured: product?.is_featured || false,
  });

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({
      ...f,
      [k]: val,
      ...(k === 'name' && !isEdit ? { slug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
    }));
  };

  const handleImages = e => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeNewImage = i => setImages(prev => prev.filter((_, idx) => idx !== i));
  const removeExisting = id => setExistingImages(prev => prev.filter(img => img.id !== id));

  const save = async () => {
    if (!form.name || !form.price || !form.stock_quantity) {
      alert('Please fill in name, price, and stock quantity.');
      return;
    }
    setSaving(true);
    try {
      let imageIds = existingImages.map(i => i.id);

      // Upload new images first
      for (const file of images) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('is_primary', imageIds.length === 0 ? 'true' : 'false');
        const res = await API.post('/product-images/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageIds.push(res.data.id);
      }

      const payload = { ...form, images: imageIds };

      if (isEdit) {
        await API.put(`/products/${product.slug}/`, payload);
      } else {
        await API.post('/products/', payload);
      }
      onDone();
    } catch (e) {
      console.error(e);
      alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving product');
    } finally { setSaving(false); }
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2 className="admin-section__title">{isEdit ? 'Edit Product' : 'New Product'}</h2>
        <button className="btn-ghost" onClick={onCancel}><X size={16} /> Cancel</button>
      </div>

      <div className="admin-form-card">
        {/* Basic */}
        <div className="form-section-label">Basic Information</div>
        <div className="admin-form-grid admin-form-grid--2">
          <div className="form-group">
            <label>Product Name *</label>
            <input className="input-field" value={form.name} onChange={set('name')} placeholder="e.g. Silk Wrap Dress" />
          </div>
          <div className="form-group">
            <label>Slug (URL name)</label>
            <input className="input-field" value={form.slug} onChange={set('slug')} placeholder="silk-wrap-dress" />
          </div>
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea className="input-field" rows={4} value={form.description} onChange={set('description')} placeholder="Describe the product in detail…" />
        </div>
        <div className="admin-form-grid admin-form-grid--3">
          <div className="form-group">
            <label>Category</label>
            <select className="input-field" value={form.category} onChange={set('category')}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Price (GH₵) *</label>
            <input className="input-field" type="number" value={form.price} onChange={set('price')} placeholder="5000" />
          </div>
          <div className="form-group">
            <label>Stock Quantity *</label>
            <input className="input-field" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} placeholder="10" />
          </div>
        </div>

        {/* Type */}
        <div className="form-section-label">Product Type</div>
        <div className="type-toggle">
          <button
            className={`type-btn ${form.product_type === 'available' ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, product_type: 'available' }))}
          >
            <Package size={16} /> In Stock / Available
          </button>
          <button
            className={`type-btn ${form.product_type === 'preorder' ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, product_type: 'preorder' }))}
          >
            <Clock size={16} /> Pre-order
          </button>
        </div>

        {form.product_type === 'available' && (
          <div className="admin-form-grid admin-form-grid--2">
            <div className="form-group">
              <label>Shipping Fee (GH₵)</label>
              <input className="input-field" type="number" value={form.shipping_fee} onChange={set('shipping_fee')} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Delivery Timeframe</label>
              <input className="input-field" value={form.delivery_timeframe} onChange={set('delivery_timeframe')} placeholder="e.g. 3–5 business days" />
            </div>
          </div>
        )}

        {form.product_type === 'preorder' && (
          <div className="preorder-fields">
            <div className="admin-form-grid admin-form-grid--2">
              <div className="form-group">
                <label>Estimated Arrival</label>
                <input className="input-field" value={form.preorder_eta} onChange={set('preorder_eta')} placeholder="e.g. 4–6 weeks" />
              </div>
              <div className="form-group">
                <label>Shipping Fee when Ready (GH₵)</label>
                <input className="input-field" type="number" value={form.preorder_shipping_fee} onChange={set('preorder_shipping_fee')} placeholder="0" />
              </div>
            </div>
            <div className="toggle-row">
              <label className="toggle-label">
                <input type="checkbox" checked={form.preorder_shipped} onChange={set('preorder_shipped')} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
                Mark as Shipped — customers will be notified to pay shipping fee
              </label>
            </div>
          </div>
        )}

        {/* Visibility */}
        <div className="form-section-label">Visibility & Display</div>
        <div className="toggles-row">
          <label className="toggle-label">
            <input type="checkbox" checked={form.status === 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'active' : 'inactive' }))} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            Show on store
          </label>
          <label className="toggle-label">
            <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            Featured on homepage
          </label>
        </div>

        {/* Images */}
        <div className="form-section-label">Product Images</div>
        <div className="image-upload-area">
          <label className="image-upload-btn">
            <Upload size={20} />
            <span>Click to upload images</span>
            <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
          </label>
        </div>

        {existingImages.length > 0 && (
          <div className="image-previews">
            {existingImages.map(img => (
              <div key={img.id} className="image-preview">
                <img src={img.url} alt="" />
                {img.is_primary && <span className="image-primary-badge">Main</span>}
                <button className="image-remove" onClick={() => removeExisting(img.id)}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="image-previews">
            {images.map((file, i) => (
              <div key={i} className="image-preview">
                <img src={URL.createObjectURL(file)} alt="" />
                {i === 0 && existingImages.length === 0 && <span className="image-primary-badge">Main</span>}
                <button className="image-remove" onClick={() => removeNewImage(i)}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" style={{ marginTop: 24, minWidth: 180 }} onClick={save} disabled={saving}>
          {saving ? <><div className="spinner" /><span>Saving…</span></> : <><Check size={16} /><span>{isEdit ? 'Update Product' : 'Publish Product'}</span></>}
        </button>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    API.get('/orders/all/').then(r => setOrders(r.data.results || r.data || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (ref, status) => {
    await API.patch(`/orders/${ref}/`, { status });
    load();
    if (selected?.reference === ref) setSelected(prev => ({ ...prev, status }));
  };

  const STATUS_COLORS = {
    pending: '#9a9080', paid: '#c9a84c', processing: '#4a90d9',
    shipped: '#9b59b6', delivered: '#4caf7d', cancelled: '#e05a5a'
  };

  const filtered = orders.filter(o =>
    filter === 'all' ? true :
    filter === 'unpaid' ? !o.payment_verified :
    o.status === filter
  );

  if (selected) return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2 className="admin-section__title">Order #{selected.reference}</h2>
        <button className="btn-ghost" onClick={() => setSelected(null)}><X size={16} /> Back</button>
      </div>
      <div className="order-detail-grid">
        <div className="order-detail-card">
          <h4>Customer</h4>
          <p><strong>{selected.customer_name}</strong></p>
          <p>{selected.customer_email}</p>
          <p>{selected.customer_phone}</p>
          <hr className="divider" style={{ margin: '12px 0' }} />
          <h4>Delivery Address</h4>
          <p>{selected.delivery_address}</p>
          <p>{selected.city}, {selected.state}</p>
          {selected.notes && <><hr className="divider" style={{ margin: '12px 0' }} /><h4>Notes</h4><p>{selected.notes}</p></>}
        </div>
        <div className="order-detail-card">
          <h4>Items</h4>
          {selected.items?.map(item => (
            <div key={item.id} className="order-item-row">
              <span>{item.product_name} x{item.quantity}</span>
              <span>GH₵{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-GH')}</span>
            </div>
          ))}
          <hr className="divider" style={{ margin: '12px 0' }} />
          <div className="order-item-row"><span>Shipping</span><span>GH₵{parseFloat(selected.shipping_fee).toLocaleString('en-GH')}</span></div>
          <div className="order-item-row order-item-row--total"><span>Total</span><span>GH₵{parseFloat(selected.total_amount).toLocaleString('en-GH')}</span></div>
        </div>
        <div className="order-detail-card">
          <h4>Update Status</h4>
          <div className="status-buttons">
            {['pending','paid','processing','shipped','delivered','cancelled'].map(s => (
              <button
                key={s}
                className={`status-btn ${selected.status === s ? 'active' : ''}`}
                style={{ '--color': STATUS_COLORS[s] }}
                onClick={() => updateStatus(selected.reference, s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="order-payment-info">
            <p>Payment: <strong style={{ color: selected.payment_verified ? '#4caf7d' : '#e05a5a' }}>{selected.payment_verified ? '✓ Verified' : '✗ Not Paid'}</strong></p>
            {selected.payment_date && <p>Paid on: {new Date(selected.payment_date).toLocaleString()}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2 className="admin-section__title">Orders</h2>
        <button className="btn-ghost" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="filter-pills" style={{ marginBottom: 24 }}>
        {['all','unpaid','paid','processing','shipped','delivered'].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Reference</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><code>{o.reference}</code></td>
                  <td>
                    <div>{o.customer_name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{o.customer_email}</small>
                  </td>
                  <td>GH₵{parseFloat(o.total_amount).toLocaleString('en-GH')}</td>
                  <td>
                    <span className="order-status-badge" style={{ color: STATUS_COLORS[o.status] }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: o.payment_verified ? '#4caf7d' : '#e05a5a', fontSize: '0.75rem' }}>
                      {o.payment_verified ? '✓ Paid' : '✗ Pending'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setSelected(o)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="table-empty">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Message Modal ────────────────────────────────────────────────────────────
function MessageModal({ customer, onClose }) {
  const [subject, setSubject] = useState(`Your order at Bel's Haven`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const whatsappNumber = customer.phone?.replace(/\D/g, '');
  const hasWhatsapp = whatsappNumber && whatsappNumber.length >= 9;
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message || `Hello ${customer.name}, we're reaching out from Bel's Haven.`)}`;

  const sendEmail = async () => {
    if (!message.trim()) { setErr('Please enter a message.'); return; }
    setSending(true);
    setErr('');
    try {
      await API.post('/send-message/', { email: customer.email, subject, message });
      setSent(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Message Customer</h3>
          <button className="btn-ghost modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-customer-info">
          <strong>{customer.name}</strong>
          <span>{customer.email}</span>
          {customer.phone && <span>{customer.phone}</span>}
        </div>
        {sent ? (
          <div className="modal-sent">
            <Check size={24} style={{ color: '#4caf7d' }} />
            <p>Email sent to {customer.email}</p>
            <button className="btn-outline" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Subject</label>
              <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Message</label>
              <textarea
                className="input-field"
                rows={5}
                placeholder="Type your message here..."
                value={message}
                onChange={e => { setMessage(e.target.value); setErr(''); }}
                style={{ resize: 'vertical' }}
              />
            </div>
            {err && <p style={{ color: 'var(--error, #e05a5a)', fontSize: '0.8rem', marginBottom: 12 }}>{err}</p>}
            <div className="modal-actions">
              {hasWhatsapp && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-flex', gap: 8, background: '#25D366', borderColor: '#25D366' }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </a>
              )}
              <button className="btn-primary" onClick={sendEmail} disabled={sending} style={{ display: 'inline-flex', gap: 8 }}>
                {sending ? <><div className="spinner" /><span>Sending...</span></> : <><Mail size={15} /><span>Send Email</span></>}
              </button>
            </div>
            {!hasWhatsapp && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
                No phone number on file — email only.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────
function CustomersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/orders/all/')
      .then(r => setOrders(r.data.results || r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const customers = Object.values(
    orders.reduce((acc, order) => {
      const key = order.customer_email;
      if (!acc[key]) {
        acc[key] = {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          orders: 0,
          spent: 0,
          lastOrder: order.created_at,
        };
      }
      acc[key].orders += 1;
      if (order.payment_verified) acc[key].spent += parseFloat(order.total_amount || 0);
      if (order.created_at > acc[key].lastOrder) acc[key].lastOrder = order.created_at;
      return acc;
    }, {})
  ).sort((a, b) => b.spent - a.spent);

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.spent, 0);
  const repeatCustomers = customers.filter(c => c.orders > 1).length;

  return (
    <div className="admin-section">
      <h2 className="admin-section__title">Customers</h2>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Customers', value: totalCustomers, color: 'gold' },
          { label: 'Repeat Customers', value: repeatCustomers, color: 'green' },
          { label: 'Total Revenue', value: `GHS ${totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`stat-card stat-card--${color}`}>
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{value}</p>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <input
          className="input-field admin-search-input"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.email}>
                  <td>
                    <div>{c.name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{c.email}</small>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{c.orders}</td>
                  <td style={{ color: c.spent > 0 ? '#4caf7d' : 'var(--text-muted)' }}>
                    {c.spent > 0 ? `GHS ${c.spent.toLocaleString('en-GH', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(c.lastOrder).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'inline-flex', gap: 6 }}
                      onClick={() => setMessaging(c)}
                    >
                      <Send size={12} /> Message
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="table-empty">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {messaging && <MessageModal customer={messaging} onClose={() => setMessaging(null)} />}
    </div>
  );
}
