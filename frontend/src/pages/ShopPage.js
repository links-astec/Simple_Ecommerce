import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import useLiveRefresh from '../useLiveRefresh';
import './ShopPage.css';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const typeFilter = searchParams.get('type') || '';
  const categoryFilter = searchParams.get('category') || '';

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (search) params.search = search;
    getProducts(params)
      .then(res => setProducts(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [typeFilter, categoryFilter, search]);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data.results || res.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useLiveRefresh(fetchProducts, 30000);

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    setSearchParams(p);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearch('');
  };

  const activeFilters = [typeFilter, categoryFilter].filter(Boolean).length;

  return (
    <div className="shop-page">
      <div className="shop-page__header">
        <div className="container">
          <p className="section-eyebrow">The Collection</p>
          <h1 className="shop-page__title">
            {typeFilter === 'preorder' ? 'Pre-order' :
             typeFilter === 'available' ? 'Available Now' : 'All Products'}
          </h1>
          <div className="gold-line" style={{ margin: '16px auto 0' }} />
        </div>
      </div>

      <div className="container">
        {/* Toolbar */}
        <div className="shop-toolbar">
          <div className="shop-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="shop-search__input"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
          </div>

          <div className="shop-filters">
            <button
              className={`btn-ghost ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
            </button>
          </div>

          <p className="shop-count">
            {loading ? '...' : `${products.length} item${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Type</label>
              <div className="filter-pills">
                <button
                  className={`filter-pill ${!typeFilter ? 'active' : ''}`}
                  onClick={() => setFilter('type', '')}
                >All</button>
                <button
                  className={`filter-pill ${typeFilter === 'available' ? 'active' : ''}`}
                  onClick={() => setFilter('type', 'available')}
                >Available</button>
                <button
                  className={`filter-pill ${typeFilter === 'preorder' ? 'active' : ''}`}
                  onClick={() => setFilter('type', 'preorder')}
                >Pre-order</button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="filter-group">
                <label>Category</label>
                <div className="filter-pills">
                  <button
                    className={`filter-pill ${!categoryFilter ? 'active' : ''}`}
                    onClick={() => setFilter('category', '')}
                  >All</button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      className={`filter-pill ${categoryFilter === c.slug ? 'active' : ''}`}
                      onClick={() => setFilter('category', c.slug)}
                    >{c.name}</button>
                  ))}
                </div>
              </div>
            )}

            {activeFilters > 0 && (
              <button className="btn-ghost" onClick={clearFilters}>
                <X size={14} /> Clear All
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="products-loading" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-skeleton" style={{ aspectRatio: '3/4', background: '#141414', border: '1px solid #1e1e1e', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty">
            <p>No products found</p>
            <button className="btn-outline" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="shop-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
