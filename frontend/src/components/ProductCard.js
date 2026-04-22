import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Package } from 'lucide-react';
import { useCart } from '../CartContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const isPreorder = product.product_type === 'preorder';
  const isSoldOut = product.stock_quantity === 0;
  const canAdd = !isSoldOut;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!canAdd) return;
    addItem(product, 1);
    toast.success(`${product.name} added to bag`);
  };

  const primaryImage = product.primary_image;

  return (
    <Link to={`/shop/${product.slug}`} className="product-card">
      <div className="product-card__image-wrap">
        {primaryImage
          ? <img src={primaryImage} alt={product.name} className="product-card__image" />
          : <div className="product-card__placeholder"><Package size={32} /></div>
        }
        <div className="product-card__badges">
          {isPreorder && <span className="badge badge-preorder">Pre-order</span>}
          {!isPreorder && !isSoldOut && <span className="badge badge-available">In Stock</span>}
          {isSoldOut && <span className="badge badge-sold-out">Sold Out</span>}
        </div>
        {canAdd && (
          <button className="product-card__quick-add" onClick={handleAdd}>
            <ShoppingBag size={14} />
            <span>{isPreorder ? 'Pre-order' : 'Add to Bag'}</span>
          </button>
        )}
      </div>

      <div className="product-card__info">
        <p className="product-card__category">{product.category_name}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__footer">
          <span className="product-card__price price">GH₵{parseFloat(product.price).toLocaleString('en-GH')}</span>
          {isPreorder && product.preorder_eta && (
            <span className="product-card__eta">
              <Clock size={11} />
              {product.preorder_eta}
            </span>
          )}
          {!isPreorder && product.delivery_timeframe && (
            <span className="product-card__eta">
              <Package size={11} />
              {product.delivery_timeframe}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
