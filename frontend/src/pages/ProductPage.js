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
  const [selectedVariant, setSelectedVariant] = useState(null);

  const loadProduct = useCallback(() => {
    getProduct(slug)
      .then(res => {
        setProduct(res.data);
        setSelectedVariant(prev => {
          const variants = res.data.variants || [];
          if (variants.length > 0 && !prev) return variants[0];
          return prev;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setSelectedVariant(null);
    loadProduct();
  }, [slug, loadProduct]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Bel's Haven`;
      return () => { document.title = "Bel's Haven"; };
    }
  }, [product]);

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

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const active = hasVariants ? (selectedVariant || variants[0]) : product;

  const isPreorder = (hasVariants ? active.product_type : product.product_type) === 'preorder';
  const variantStock = hasVariants ? active.stock_quantity : null;
  const totalVariantStock = hasVariants ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) : null;
  const stock = hasVariants ? (variantStock ?? 0) : product.stock_quantity;
  const isSoldOut = hasVariants ? totalVariantStock === 0 : stock === 0;
  const isVariantSoldOut = hasVariants && stock === 0;
  const price = parseFloat(hasVariants ? active.price : product.price);
  const shippingFee = parseFloat(hasVariants ? active.shipping_fee : product.shipping_fee);
  const images = hasVariants && active.images?.length > 0 ? active.images : (product.images_list || []);
  const currentImg = images[imgIdx]?.url;
  const deliveryTimeframe = hasVariants ? (active.delivery_timeframe || product.delivery_timeframe) : product.delivery_timeframe;
  const preorderEta = hasVariants ? (active.preorder_eta || product.preorder_eta) : product.preorder_eta;
  const preorderShippingFee = parseFloat(hasVariants ? (active.preorder_shipping_fee || product.preorder_shipping_fee) : product.preorder_shipping_fee);

  const selectVariant = (v) => {
    setSelectedVariant(v);
    setImgIdx(0);
    setQty(1);
  };

  const handleAdd = () => {
    if (isSoldOut || isVariantSoldOut) return;
    const cartItem = {
      id: hasVariants ? active.id : product.id,
      name: hasVariants && active.variant_label ? `${product.name} (${active.variant_label})` : product.name,
      slug: hasVariants ? active.slug : product.slug,
      price: price,
      shipping_fee: shippingFee,
      stock_quantity: stock,
      product_type: isPreorder ? 'preorder' : 'available',
      primary_image: currentImg || active.primary_image,
    };
    addItem(cartItem, qty);
    toast.success(`${cartItem.name} added to bag`);
  };

  const handleShare = async () => {
    const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
    const shareSlug = hasVariants ? active.slug : product.slug;
    const shareUrl = `${backendBase}/share/${shareSlug}/`;
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

  const totalPrice = price * qty;

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
              {isSoldOut && <span className="badge badge-sold-out">All Sold Out</span>}
              {!isSoldOut && isVariantSoldOut && <span className="badge badge-sold-out">This option sold out</span>}
              {product.category && <span className="product-info__category">{product.category.name}</span>}
            </div>

            <div className="product-info__name-row">
              <h1 className="product-info__name">{product.name}</h1>
              <button className="product-share-btn" onClick={handleShare} title="Share product">
                <Share2 size={16} />
              </button>
            </div>

            {/* Variant selector */}
            {hasVariants && (
              <div className="variant-picker">
                {variants.map(v => (
                  <button
                    key={v.id}
                    className={`variant-pill ${selectedVariant?.id === v.id ? 'active' : ''} ${v.stock_quantity === 0 ? 'sold-out' : ''}`}
                    onClick={() => selectVariant(v)}
                  >
                    {v.variant_label}
                  </button>
                ))}
              </div>
            )}

            <div className="product-info__price-row">
              <span className="product-info__price price">GH₵{price.toLocaleString('en-GH')}</span>
              {!isPreorder && shippingFee > 0 && (
                <span className="product-info__shipping">+ GH₵{shippingFee.toLocaleString('en-GH')} shipping</span>
              )}
            </div>

            <div className="gold-line" style={{ margin: '24px 0' }} />

            <p className="product-info__description">{product.description}</p>

            {/* Delivery info */}
            <div className="product-info__meta">
              {isPreorder ? (
                <>
                  {preorderEta && (
                    <div className="meta-item">
                      <Clock size={15} className="meta-item__icon" />
                      <div>
                        <span className="meta-item__label">Estimated Arrival</span>
                        <span className="meta-item__value">{preorderEta}</span>
                      </div>
                    </div>
                  )}
                  {preorderShippingFee > 0 && (
                    <div className="meta-item">
                      <Truck size={15} className="meta-item__icon" />
                      <div>
                        <span className="meta-item__label">Shipping fee (when ready)</span>
                        <span className="meta-item__value">GH₵{preorderShippingFee.toLocaleString('en-GH')}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {deliveryTimeframe && (
                    <div className="meta-item">
                      <Truck size={15} className="meta-item__icon" />
                      <div>
                        <span className="meta-item__label">Delivery</span>
                        <span className="meta-item__value">{deliveryTimeframe}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="meta-item">
                <Package size={15} className="meta-item__icon" />
                <div>
                  <span className="meta-item__label">{isPreorder ? 'Slots available' : 'In stock'}</span>
                  <span className="meta-item__value">{stock}</span>
                </div>
              </div>
            </div>

            {/* Quantity & Add */}
            {!isVariantSoldOut && !isSoldOut && (
              <div className="product-info__actions">
                <div className="qty-selector">
                  <button onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(stock, q+1))}>+</button>
                </div>
                <button className="btn-primary product-info__add-btn" onClick={handleAdd}>
                  <ShoppingBag size={16} />
                  <span>{isPreorder ? `Pre-order — GH₵${totalPrice.toLocaleString('en-GH')}` : `Add to Bag — GH₵${totalPrice.toLocaleString('en-GH')}`}</span>
                </button>
              </div>
            )}

            {isVariantSoldOut && !isSoldOut && (
              <div className="product-info__sold-out">
                <p>"{active.variant_label}" is currently sold out. Try another option above.</p>
              </div>
            )}

            {isSoldOut && (
              <div className="product-info__sold-out">
                <p>This item is currently sold out.</p>
              </div>
            )}

            {isPreorder && (
              <div className="product-info__preorder-note">
                <p><strong>Pre-order Notice:</strong> You will pay for shipping separately when your item is ready to ship. We'll email you with the payment link.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
