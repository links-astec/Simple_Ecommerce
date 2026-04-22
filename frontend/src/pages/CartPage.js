import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../CartContext';
import './CartPage.css';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalShipping, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page cart-page--empty">
        <div className="container">
          <div className="cart-empty">
            <ShoppingBag size={48} />
            <h2>Your bag is empty</h2>
            <p>Discover something beautiful</p>
            <Link to="/shop" className="btn-primary"><span>Explore Collection</span></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Bag</h1>
          <p className="cart-header__count">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="cart-grid">
          {/* Items */}
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__image">
                  {item.primary_image
                    ? <img src={item.primary_image} alt={item.name} />
                    : <div className="cart-item__placeholder"><Package size={24} /></div>
                  }
                </div>
                <div className="cart-item__info">
                  <div className="cart-item__header">
                    <div>
                      <p className="cart-item__category">{item.category_name}</p>
                      <h3 className="cart-item__name">{item.name}</h3>
                      {item.product_type === 'preorder' && (
                        <span className="badge badge-preorder" style={{ marginTop: '6px' }}>Pre-order</span>
                      )}
                    </div>
                    <button className="cart-item__remove" onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="cart-item__footer">
                    <div className="qty-selector cart-qty">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item__prices">
                      <span className="cart-item__price price">GH₵{(parseFloat(item.price) * item.quantity).toLocaleString('en-GH')}</span>
                      {item.product_type === 'available' && parseFloat(item.shipping_fee) > 0 && (
                        <span className="cart-item__shipping">+GH₵{(parseFloat(item.shipping_fee) * item.quantity).toLocaleString('en-GH')} shipping</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <div className="cart-summary__inner">
              <h3>Order Summary</h3>
              <div className="gold-line" style={{ margin: '16px 0' }} />

              <div className="cart-summary__rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span className="price">GH₵{subtotal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="price">GH₵{totalShipping.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
                {totalShipping === 0 && (
                  <p className="summary-note">Preorder shipping is billed separately when items are ready.</p>
                )}
              </div>

              <div className="cart-summary__total">
                <span>Total</span>
                <span className="price">GH₵{total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
              </div>

              <Link to="/checkout" className="btn-primary cart-summary__checkout-btn">
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/shop" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
