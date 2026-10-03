import React from 'react';
import { Package, Calendar, IndianRupee, Truck, CheckCircle, Clock } from 'lucide-react';

export const OrderCard = ({ order }) => {
  if (!order) {
    return (
      <div className="order-info-card empty">
        <Package size={24} className="text-muted" />
        <p>No associated order record or general inquiry.</p>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="order-info-card">
      <div className="order-card-header">
        <div className="order-title-box">
          <Package size={18} className="text-primary" />
          <h4>Verified Order Details</h4>
        </div>
        <span className={`badge-order-status status-${(order.status || '').toLowerCase()}`}>
          {order.status || 'UNKNOWN'}
        </span>
      </div>

      <div className="order-grid">
        <div className="order-field">
          <span className="field-label">Order Reference</span>
          <span className="field-value font-mono">{order.order_id || order.id}</span>
        </div>

        <div className="order-field">
          <span className="field-label">Product Item</span>
          <span className="field-value font-medium">{order.product || 'Standard Merchandise'}</span>
        </div>

        <div className="order-field">
          <span className="field-label">Transaction Value</span>
          <span className="field-value font-semibold text-primary">
            {formatCurrency(order.amount)}
          </span>
        </div>

        <div className="order-field">
          <span className="field-label">Delivery Date</span>
          <span className="field-value">
            {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Pending Dispatch'}
          </span>
        </div>
      </div>
    </div>
  );
};
