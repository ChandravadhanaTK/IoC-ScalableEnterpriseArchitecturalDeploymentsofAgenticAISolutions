---
doc_id: SLA-POL-001
title: Shipment Service Level Agreement Policy
access: internal
owner: Head of Operations
version: 3.2
---

# 1. Purpose

This policy defines the delivery service levels that Meridian Logistics commits to for each service tier, how a breach is measured, and what remedies apply. It is the source of truth for any question about whether a shipment is "at risk" or "breached".

# 2. Service tiers and delivery windows

| Tier | Delivery window | Measured from |
|---|---|---|
| Express | 24 hours | Pickup scan |
| Priority | 48 hours | Pickup scan |
| Standard | 5 business days | Pickup scan |
| Economy | 10 business days | Pickup scan |

Business days exclude Sundays and the public holidays published in the annual operations calendar.

# 3. At-risk definition

A shipment is classified as **at risk** when less than 25 percent of its delivery window remains and it has not reached the destination hub. A shipment is **breached** when the delivery window has elapsed without a delivery scan. Both classifications are computed from the pickup scan timestamp, never from the order creation time.

# 4. Remedies for a breach

| Tier | Customer remedy | Approval required |
|---|---|---|
| Express | Full shipping fee credit | Operations manager |
| Priority | 50 percent shipping fee credit | Operations manager |
| Standard | 25 percent shipping fee credit | Team lead |
| Economy | Apology notice, no credit | None |

Any credit above 5,000 INR requires a second approval from the finance controller regardless of tier.

# 5. Exclusions

The SLA does not apply when the delay is caused by a customs hold, a force majeure event declared by the operations director, an incorrect address supplied by the customer, or a consignee who was unavailable at two documented delivery attempts.

# 6. Reporting

At-risk and breached counts are reported daily per lane and per carrier. A carrier whose breach rate exceeds 8 percent over a rolling 30 day window is placed on performance review under the Carrier Management Policy.
