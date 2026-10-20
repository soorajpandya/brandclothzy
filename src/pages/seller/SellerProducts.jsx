import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, Eye, CheckCircle, XCircle, Image, Upload, X, AlertCircle, FileSpreadsheet, Download, Pencil, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SEO from '../../components/SEO';
import { formatPrice } from '../../utils/helpers';

const PRODUCT_STATUS_COLORS = {
  approved: 'bg-emerald-100 text-emerald-700',
  disabled: 'bg-neutral-200 text-neutral-500',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'];
const COLORS = ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown', 'Red', 'Blue', 'Green', 'Pink', 'Yellow', 'Maroon'];
const CATEGORIES = [
  'Men - Shirts', 'Men - T-Shirts', 'Men - Trousers', 'Men - Jeans',
  'Men - Blazers', 'Men - Ethnic', 'Men - Activewear', 'Men - Accessories',
  'Women - Dresses', 'Women - Tops', 'Women - Sarees', 'Women - Kurtas',
  'Women - Jeans', 'Women - Ethnic', 'Women - Activewear', 'Women - Accessories',
  'Unisex - Footwear', 'Unisex - Bags', 'Unisex - Watches', 'Unisex - Sunglasses'
];

export default function SellerProducts({ embedded }) {
  const { user } = useAuth();
  const { sellerProfile, sellerLoading } = useSeller();
  const { fetchSellerProducts, addProduct, addProducts, updateProduct, disableProduct, enableProduct } = useMarketplace();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const csvInputRef = useRef(null);

  useEffect(() => {
    if (!sellerLoading && !user && !embedded) navigate('/account');
    if (!sellerLoading && user && !sellerProfile && !embedded) navigate('/dashboard#seller-apply');
  }, [sellerLoading, user, sellerProfile, embedded, navigate]);

  useEffect(() => {
    if (user && sellerProfile) {
      loadProducts();
    }
  }, [user, sellerProfile]);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchSellerProducts(user.uid);
    setProducts(data);
    setLoading(false);
  };

  const isApproved = sellerProfile && ['approved', 'onboarding_complete', 'live'].includes(sellerProfile.status);

  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['name', 'category', 'price'];
    for (const r of required) {
      if (!headers.includes(r)) throw new Error(`Missing required column: ${r}`);
    }
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim());
      if (vals.length < headers.length) continue;
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      if (!row.name || !row.category || !row.price) continue;
      rows.push({
        name: row.name,
        description: row.description || '',
        category: row.category,
        price: row.price,
        originalPrice: row.mrp || row.original_price || '',
        sizes: row.sizes ? row.sizes.split('|').map(s => s.trim()).filter(Boolean) : [],
        colors: row.colors ? row.colors.split('|').map(c => c.trim()).filter(Boolean) : [],
        images: row.images ? row.images.split('|').map(u => u.trim()).filter(Boolean) : [],
        brandName: sellerProfile.brand_name,
      });
    }
    if (rows.length === 0) throw new Error('No valid product rows found in CSV');
    return rows;
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCsvResult(null);
    setCsvUploading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const results = await addProducts(parsed);
      setCsvResult({ success: results.length, error: 0 });
      await loadProducts();
    } catch (err) {
      setCsvResult({ success: 0, error: 0, message: err.message });
    }
    setCsvUploading(false);
  };

  const downloadTemplate = () => {
    const header = 'name,description,category,price,mrp,sizes,colors,images';
    const sample = 'Classic Oxford Shirt,Premium cotton formal shirt,Men - Shirts,1499,2999,S|M|L|XL,White|Blue,';
    const blob = new Blob([header + '\n' + sample + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (sellerLoading || !sellerProfile) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto px-4">
        <AlertCircle size={40} className="mx-auto text-amber-400 mb-4" />
        <h2 className="font-serif text-xl text-luxury-charcoal mb-2">Seller Approval Required</h2>
        <p className="text-xs text-neutral-400">Your seller account must be approved before you can upload products.</p>
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="My Products" path="/seller/products" noindex />
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">My Products</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Manage your product listings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download size={14} /> Template
            </Button>
            <Button size="sm" variant="outline" onClick={() => csvInputRef.current?.click()} loading={csvUploading}>
              <FileSpreadsheet size={14} /> CSV Upload
            </Button>
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus size={14} /> Add Product
            </Button>
          </div>
        </div>

        {/* CSV Result Banner */}
        {csvResult && (
          <div className={`p-4 mb-6 border flex items-center gap-2 text-sm ${csvResult.message ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {csvResult.message ? <XCircle size={16} /> : <CheckCircle size={16} />}
            {csvResult.message || `${csvResult.success} product${csvResult.success > 1 ? 's' : ''} uploaded successfully!`}
            <button onClick={() => setCsvResult(null)} className="ml-auto p-1 hover:opacity-70"><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Total" value={products.length} />
          <StatCard label="Live" value={products.filter(p => p.status === 'approved').length} color="bg-emerald-50" />
          <StatCard label="Disabled" value={products.filter(p => p.status === 'disabled').length} color="bg-neutral-100" />
        </div>

        {/* Products List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="font-serif text-lg text-luxury-charcoal mb-2">No products yet</h3>
            <p className="text-xs text-neutral-400 mb-4">Upload your first product to start selling</p>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus size={14} /> Add Product
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <ProductRow key={product.id} product={product} onEdit={() => setEditingProduct(product)}
                onToggle={async () => {
                  if (product.status === 'disabled') await enableProduct(product.id);
                  else await disableProduct(product.id);
                  await loadProducts();
                }} />
            ))}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddForm && (
          <AddProductForm
            brandName={sellerProfile.brand_name}
            onClose={() => setShowAddForm(false)}
            onSubmit={async (data, files) => {
              await addProduct(data, files);
              setShowAddForm(false);
              await loadProducts();
            }}
          />
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <EditProductForm
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSubmit={async (data, newFiles, existingImages) => {
              await updateProduct(editingProduct.id, data, newFiles, existingImages);
              setEditingProduct(null);
              await loadProducts();
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'bg-neutral-50' }) {
  return (
    <div className={`p-4 ${color} border border-neutral-100`}>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="text-xl font-medium text-luxury-charcoal">{value}</p>
    </div>
  );
}

function ProductRow({ product, onEdit, onToggle }) {
  const statusClass = PRODUCT_STATUS_COLORS[product.status] || 'bg-neutral-100 text-neutral-600';
  const isDisabled = product.status === 'disabled';

  return (
    <div className="border border-neutral-200 p-4 flex items-center gap-4">
      <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-neutral-300" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-luxury-charcoal truncate">{product.name}</h3>
          <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 flex-shrink-0 ${statusClass}`}>
            {product.status?.replace('_', ' ')}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
          <span>{product.category}</span>
          <span>{formatPrice(product.price)}</span>
          <span>{product.images?.length || 0} images</span>
          <span>{new Date(product.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} title="Edit product"
          className="p-2 text-neutral-400 hover:text-luxury-charcoal transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={onToggle} title={isDisabled ? 'Re-enable product' : 'Disable product'}
          className={`p-2 transition-colors ${isDisabled ? 'text-emerald-400 hover:text-emerald-600' : 'text-neutral-400 hover:text-red-500'}`}>
          {isDisabled ? <CheckCircle size={15} /> : <XCircle size={15} />}
        </button>
      </div>
    </div>
  );
}

function AddProductForm({ brandName, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', originalPrice: '',
    sizes: [], colors: [],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const toggleArray = (key, val) => {
    setForm(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val],
    }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) {
      alert('Maximum 8 images allowed');
      return;
    }
    for (const f of files) {
      if (!f.type.startsWith('image/')) { alert('Only image files allowed'); return; }
      if (f.size > 5 * 1024 * 1024) { alert('Each image must be under 5MB'); return; }
    }
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.category) e.category = 'Required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price required';
    if (images.length < 1) e.images = 'At least 1 image required';
    if (form.sizes.length === 0) e.sizes = 'Select at least one size';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...form, brandName }, images);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl mx-4 p-6 sm:p-8 shadow-xl z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-luxury-charcoal">Add New Product</h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700"><X size={20} /></button>
        </div>

        <div className="space-y-5">
          <Input label="Product Name *" id="pName" value={form.name}
            onChange={e => set('name', e.target.value)} error={errors.name}
            placeholder="e.g., Classic Oxford Shirt" />

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal h-24 resize-none"
              placeholder="Detailed product description..." />
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Selling Price (₹) *" id="pPrice" type="number" value={form.price}
              onChange={e => set('price', e.target.value)} error={errors.price} placeholder="e.g., 1499" />
            <Input label="MRP (₹)" id="pOriginal" type="number" value={form.originalPrice}
              onChange={e => set('originalPrice', e.target.value)} placeholder="e.g., 2999" />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Sizes *</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button key={s} type="button" onClick={() => toggleArray('sizes', s)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    form.sizes.includes(s) ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                  }`}>{s}</button>
              ))}
            </div>
            {errors.sizes && <p className="text-[10px] text-red-500 mt-1">{errors.sizes}</p>}
          </div>

          {/* Colors */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Colors</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => toggleArray('colors', c)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    form.colors.includes(c) ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
              Product Images * ({images.length}/8)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square border border-neutral-200 overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="aspect-square border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-luxury-gold transition-colors">
                  <Upload size={18} className="text-neutral-400 mb-1" />
                  <span className="text-[10px] text-neutral-400">Upload</span>
                  <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>
            {errors.images && <p className="text-[10px] text-red-500 mt-1">{errors.images}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={submitting} className="flex-1">
              <Package size={14} /> Add Product
            </Button>
            <Button variant="outline" onClick={onClose} className="px-6">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProductForm({ product, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    category: product.category || '',
    price: product.price?.toString() || '',
    originalPrice: (product.original_price || product.originalPrice || '')?.toString(),
    sizes: product.sizes || [],
    colors: product.colors || [],
  });
  const [existingImages, setExistingImages] = useState(product.images || []);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const totalImages = existingImages.length + newImages.length;

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const toggleArray = (key, val) => {
    setForm(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val],
    }));
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (totalImages + files.length > 8) {
      alert('Maximum 8 images allowed');
      return;
    }
    for (const f of files) {
      if (!f.type.startsWith('image/')) { alert('Only image files allowed'); return; }
      if (f.size > 5 * 1024 * 1024) { alert('Each image must be under 5MB'); return; }
    }
    setNewImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeNewImage = (idx) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.category) e.category = 'Required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price required';
    if (totalImages < 1) e.images = 'At least 1 image required';
    if (form.sizes.length === 0) e.sizes = 'Select at least one size';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(form, newImages, existingImages);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl mx-4 p-6 sm:p-8 shadow-xl z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-luxury-charcoal">Edit Product</h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700"><X size={20} /></button>
        </div>

        <div className="space-y-5">
          <Input label="Product Name *" id="eName" value={form.name}
            onChange={e => set('name', e.target.value)} error={errors.name}
            placeholder="e.g., Classic Oxford Shirt" />

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal h-24 resize-none"
              placeholder="Detailed product description..." />
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Selling Price (₹) *" id="ePrice" type="number" value={form.price}
              onChange={e => set('price', e.target.value)} error={errors.price} placeholder="e.g., 1499" />
            <Input label="MRP (₹)" id="eOriginal" type="number" value={form.originalPrice}
              onChange={e => set('originalPrice', e.target.value)} placeholder="e.g., 2999" />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Sizes *</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button key={s} type="button" onClick={() => toggleArray('sizes', s)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    form.sizes.includes(s) ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                  }`}>{s}</button>
              ))}
            </div>
            {errors.sizes && <p className="text-[10px] text-red-500 mt-1">{errors.sizes}</p>}
          </div>

          {/* Colors */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Colors</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => toggleArray('colors', c)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    form.colors.includes(c) ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
              Product Images * ({totalImages}/8)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {/* Existing images */}
              {existingImages.map((src, i) => (
                <div key={'ex-' + i} className="relative aspect-square border border-neutral-200 overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeExistingImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {/* New images */}
              {newPreviews.map((src, i) => (
                <div key={'nw-' + i} className="relative aspect-square border border-emerald-300 overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 text-[8px] bg-emerald-500 text-white px-1 rounded">NEW</span>
                  <button onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {totalImages < 8 && (
                <label className="aspect-square border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-luxury-gold transition-colors">
                  <Upload size={18} className="text-neutral-400 mb-1" />
                  <span className="text-[10px] text-neutral-400">Upload</span>
                  <input type="file" multiple accept="image/*" onChange={handleNewImages} className="hidden" />
                </label>
              )}
            </div>
            {errors.images && <p className="text-[10px] text-red-500 mt-1">{errors.images}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={submitting} className="flex-1">
              <Pencil size={14} /> Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="px-6">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
