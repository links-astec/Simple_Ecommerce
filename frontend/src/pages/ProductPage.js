import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Clock, Package, Truck, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { getProduct } from '../api';
import { useCart } from '../CartContext';
import useLiveRefresh from '../useLiveRefresh';
import toast from 'react-hot-toast';
import './ProductPage.css';

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const loadProduct = useCallback(() => {
    getProduct(slug)
      .then(res => setProduct(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    loadProduct();
  }, [slug, loadProduct]);

  useLiveRefresh(loadProduct, 30000);

  if (loading) return (
    <div className="product-page product-page--loading">
      <div className="container">
        <div className="product-page__skeleton" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="product-page">
      <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>Product not found</h2>
        <Link to="/shop" className="btn-outline" style={{ marginTop: '24px', display: 'inline-flex' }}>Back to Shop</Link>
      </div>
    </div>
  );

  const isPreorder = product.product_type === 'preorder';
  const isSoldOut = product.stock_quantity === 0;
  const images = product.images_list || [];
  const currentImg = images[imgIdx]?.url;

  const handleAdd = () => {
    if (isSoldOut) return;
    addItem({ ...product, primary_image: currentImg }, qty);
    toast.success(`${product.name} added to bag`);
  };

  const handleShare = async () => {
    const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
    const shareUrl = `${backendBase}/share/${product.slug}/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: shareUrl });
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied!');
      } catch (_) {
        toast.error('Could not copy link');
      }
    }
  };

  const totalPrice = parseFloat(product.price) * qty;


  return (
    <div className="product-page">
      <div className="container">
        <div className="product-page__breadcrumb">
          <Link to="/shop"><ArrowLeft size={14} /> Shop</Link>
          <span>/</span>
          <span>{product.category?.name}</span>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-page__grid">
          {/* Images */}
          <div className="product-images">
            <div className="product-images__main">
              {currentImg
                ? <img src={currentImg} alt={product.name} />
                : <div className="product-images__placeholder"><Package size={48} /></div>
              }
              {images.length > 1 && (
                <>
                  <button className="product-images__nav product-images__nav--prev" onClick={() => setImgIdx(i => Math.max(0, i-1))}><ChevronLeft size={18} /></button>
                  <button className="product-images__nav product-images__nav--next" onClick={() => setImgIdx(i => Math.min(images.length-1, i+1))}><ChevronRight size={18} /></button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="product-images__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    className={`product-images__thumb ${i === imgIdx ? 'active' : ''}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <div className="product-info__badges">
              {isPreorder && <span className="badge badge-preorder">Pre-order</span>}
              {!isPreorder && !isSoldOut && <span className="badge badge-available">In Stock</span>}
              {isSoldOut && <span className="badge badge-sold-out">Sold Out</span>}
              {product.category && <span className="product-info__category">{product.category.name}</span>}
            </div>

            <div className="product-info__name-row">
              <h1 className="product-info__name">{product.name}</h1>
              <button className="product-share-btn" onClick={handleShare} title="Share product">
                <Share2 size={16} />
              </button>
            </div>

            <div className="product-info__price-row">
              <span className="product-info__price price">GH₵{parseFloat(product.price).toLocaleString('en-GH')}</span>
              {!isPreorder && product.shipping_fee > 0 && (
                <span className="product-info__shipping">+ GH₵{parseFloat(product.shipping_fee).toLocaleString('en-GH')} shipping</span>
              )}
            </div>

            <div className="gold-line" style={{ margin: '24px 0' }} />

            <p className="product-info__description">{product.description}</p>

            {/* Delivery info */}
            <div className="product-info__meta">
              {isPreorder ? (
                <>
                  {product.preorder_eta && (
                    <div className="meta-item">
                      <Clock size={15} className="meta-item__icon" />
                      <div>
                        <span className="meta-item__label">Estimated Arrival</span>
                        <span className="meta-item__value">{product.preorder_eta}</span>
                      </div>
                    </div>
                  )}
                  {product.preorder_shipping_fee > 0 && (
                    <div className="meta-item">
                      <Truck size={15} className="meta-item__icon" />
                      <div>
                        <span className="meta-item__label">Shipping fee (when ready)</span>
                        <span className="meta-item__value">GH₵{parseFloat(product.preorder_shipping_fee).toLocaleString('en-GH')}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {product.delivery_timeframe && (
                    <div className="meta-item">
                      <Truck size={15} className="meta-item__icon" />
                      <div>
                        <span className="meta-item__label">Delivery</span>
                        <span className="meta-item__value">{product.delivery_timeframe}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="meta-item">
                <Package size={15} className="meta-item__icon" />
                <div>
                  <span className="meta-item__label">{isPreorder ? 'Slots available' : 'In stock'}</span>
                  <span className="meta-item__value">{product.stock_quantity}</span>
                </div>
              </div>
            </div>

            {/* Quantity & Add */}
            {!isSoldOut && (
              <div className="product-info__actions">
                <div className="qty-selector">
                  <button onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_quantity, q+1))}>+</button>
                </div>
                <button className="btn-primary product-info__add-btn" onClick={handleAdd}>
                  <ShoppingBag size={16} />
                  <span>{isPreorder ? `Pre-order — GH₵${totalPrice.toLocaleString('en-GH')}` : `Add to Bag — GH₵${totalPrice.toLocaleString('en-GH')}`}</span>
                </button>
              </div>
            )}

            {isSoldOut && (
              <div className="product-info__sold-out">
                <p>This item is currently sold out.</p>
              </div>
            )}

            {isPreorder && (
              <div className="product-info__preorder-note">
                <p>🛍️ <strong>Pre-order Notice:</strong> You will pay for shipping separately when your item is ready to ship. We'll email you with the payment link.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
