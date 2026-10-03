---
doc_id: SOP-OPS-014
title: Standard Operating Procedure for Shipment Re-routing
access: internal
owner: Network Control Centre
version: 2.0
---

# 1. When to re-route

A shipment may be re-routed to an alternate carrier or lane when any of the following holds:

- The assigned carrier has declared a service disruption on the lane.
- The shipment is at risk under the SLA Policy and an alternate lane can still deliver inside the window.
- The destination hub has raised a capacity alert.

Re-routing is not permitted for shipments flagged as hazardous goods or for shipments already out for delivery.

# 2. Procedure

1. Confirm the current location and status of the shipment from the tracking system.
2. Identify an alternate carrier that is active on the lane and not on performance review.
3. Estimate the new delivery time and confirm it is inside the remaining SLA window.
4. Raise a re-route request with the shipment id, the new carrier, the reason code and the expected delivery time.
5. Obtain approval as described in section 3.
6. On approval, the tracking system issues the re-route command to the carrier. The command carries an idempotency key so that a retried request cannot create a second booking.
7. Record the outcome. The system publishes a ShipmentRerouted event that downstream billing and customer notification services consume.

# 3. Approval matrix

| Condition | Approver |
|---|---|
| Re-route within the same carrier group | Automatic, no approval |
| Re-route to a different carrier, declared value below 50,000 INR | Shift supervisor |
| Re-route to a different carrier, declared value 50,000 INR or above | Operations manager |
| Re-route of a cold-chain shipment | Operations manager and quality lead |

# 4. Reason codes

| Code | Meaning |
|---|---|
| RR-01 | Carrier disruption |
| RR-02 | SLA at risk |
| RR-03 | Hub capacity |
| RR-04 | Customer request |

# 5. Compensation on failure

If the re-route command is accepted by the carrier but the shipment is later reported as not collected, the shift supervisor raises a compensating cancellation with the original carrier and re-opens the request. The original request id is retained for audit.
