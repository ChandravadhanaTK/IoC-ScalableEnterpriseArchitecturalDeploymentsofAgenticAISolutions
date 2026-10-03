export const SAMPLE_POLICY = `REFUND & SHIPPING POLICY (Acme Store)
1. Full refunds are available within 30 days of delivery for unused items.
2. Duplicate or erroneous charges are refunded in full within 5 business days.
3. Subscription cancellations take effect at the end of the current billing cycle; partial-month refunds are not offered, except for service outages over 24 hours (prorated credit).
4. Standard shipping: 3-7 business days. If an order is more than 5 business days late, the customer may request a free reship or a full refund.
5. Damaged or lost items: free replacement or full refund; photo evidence required for damage.
6. Goodwill credits may not exceed $25 without manager approval.
7. We never ask customers for full card numbers or passwords.`;

export const SAMPLES: Record<string, { label: string; text: string }> = {
  billing: {
    label: "Billing — double charge",
    text: "I was charged TWICE for my $79 annual plan this month (two identical charges on Sept 28). I only have one account. This is ridiculous, I want my money back immediately and honestly I'm thinking of cancelling altogether.",
  },
  technical: {
    label: "Technical — app crash",
    text: "Since your update yesterday the app crashes every time I open the reports page. I have a client presentation tomorrow morning and can't export anything. I've already reinstalled twice. Please help ASAP.",
  },
  delivery: {
    label: "Delivery — late order",
    text: "My order #48213 was supposed to arrive 9 days ago. Tracking hasn't updated in a week. It was a birthday gift and the birthday has passed. Where is my package?",
  },
};
