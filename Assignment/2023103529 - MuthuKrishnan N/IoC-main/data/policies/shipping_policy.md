# Enterprise Shipping and Delivery Policy

**Policy Document ID:** POL-SHP-2026-v1  
**Effective Date:** January 1, 2026  
**Applicability:** Domestic and International Fulfillment

---

## 1. Delivery Timelines and Service Levels
- **Standard Shipping:** Estimated delivery time is **3 to 5 business days** from order confirmation.
- **Express Shipping:** Estimated delivery time is **1 to 2 business days**.
- **Real-Time Tracking:** Customers may query current status (`ORDER_STATUS`) at any time using their unique Order ID (`ORD-xxxx`).

---

## 2. Order Status Inquiries & Automated Handling
- When a customer submits an inquiry regarding order status, location, or expected arrival date:
  1. The Order Agent connects to the logistics database to fetch the latest tracking milestone.
  2. The system delivers an immediate status summary (e.g., Confirmed, Processing, Dispatched, In Transit, Out for Delivery, Delivered).
  3. No financial action or human intervention is required for standard status queries.

---

## 3. Delayed Shipments & Lost in Transit
- **Delayed Delivery:** If an order has not arrived within **4 business days** past the estimated delivery date, an automated Tier-1 inquiry ticket is created.
- **Lost in Transit:** If the courier marks a package as lost, or if there has been zero tracking update for **7 consecutive days**, the customer is immediately offered either a priority replacement or full refund.
