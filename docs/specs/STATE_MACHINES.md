# State machines

Every transition below is one RPC in `supabase/migrations`. Anything not listed is rejected by the database. Tests: `supabase/tests/database/02_order_to_delivery.test.sql`.

## Order

```mermaid
stateDiagram-v2
  [*] --> pending: place_order (buyer)
  pending --> accepted: respond_to_order(accept) (farmer)
  pending --> rejected: respond_to_order(reject, reason) (farmer)
  pending --> cancelled: cancel_order (buyer)
  pending --> expired: 24 h without answer (system)
  accepted --> cancelled: cancel_order(reason) (buyer or farmer, before pickup)
  accepted --> in_transit: confirm_pickup (carrier, platform) / mark_order_dispatched (farmer, other modes)
  in_transit --> delivered: confirm_delivery (carrier, platform)
  delivered --> completed: confirm_receipt (buyer) / auto after 48 h (S6-03)
  in_transit --> completed: confirm_receipt (buyer, non-platform)
  delivered --> disputed: open_dispute (buyer, within 48 h) (S7-02)
  disputed --> completed: admin resolves (S7-02)
```

| Transition | Actor | Guard | Side effects |
|---|---|---|---|
| place | verified buyer | listing published and in window; `min_order_kg ≤ qty ≤ available_kg`; own delivery location unless buyer picks up; one pending order per buyer per listing | price snapshot, `subtotal_cop` computed, `expires_at = now() + 24h` |
| accept | the order's farmer | pending, not expired, stock still available (row lock on listing), pickup date for platform | `available_kg -= qty`; listing `sold_out` when what's left is under the minimum; platform: load posted with fresh codes |
| reject | the order's farmer | pending, reason required | none |
| cancel (pending) | the buyer | pending | none |
| cancel (accepted) | buyer or farmer | load not picked up yet, reason required | stock returned (listing back to `published` if it was sold out and still in window), load cancelled, bids rejected |
| dispatch | the farmer | accepted, not platform | none |
| receipt | the buyer | `delivered`, or `in_transit` for non-platform | `completed_at` |

## Listing

```mermaid
stateDiagram-v2
  [*] --> draft
  [*] --> published: verified farmer
  draft --> published: verified farmer, window not past
  published --> draft
  draft --> withdrawn
  published --> withdrawn
  published --> sold_out: stock under minimum (system)
  sold_out --> published: an accepted order is cancelled (system)
  published --> expired: available_until passed (system)
```

Invariants: `0 ≤ available_kg ≤ quantity_kg`; editing `quantity_kg` moves `available_kg` by the same delta and can't go below what's sold; `municipality_code` always equals the farm's; only drafts that were never published can be deleted.

## Load (freight)

```mermaid
stateDiagram-v2
  [*] --> posted: order accepted with platform freight
  posted --> booked: accept_bid (shipper = buyer)
  booked --> posted: carrier_unbook(reason) (carrier), new codes
  booked --> picked_up: confirm_pickup(code from farmer) (carrier)
  picked_up --> delivered: confirm_delivery(code from buyer) (carrier)
  posted --> cancelled: order cancelled
  booked --> cancelled: order cancelled
```

Invariants: `carrier_id`, `vehicle_id`, `agreed_rate_cop` are set exactly when status is booked, picked_up or delivered; one load per order; codes regenerate on unbook; 5 wrong codes lock the load until an admin steps in.

## Bid

```mermaid
stateDiagram-v2
  [*] --> active: place_bid (verified carrier, eligible vehicle)
  active --> active: place_bid again replaces amount
  active --> withdrawn: withdraw_bid (carrier)
  active --> accepted: accept_bid (shipper)
  active --> rejected: another bid accepted / load cancelled
  accepted --> withdrawn: carrier_unbook
```

Vehicle eligibility: owned by the bidder, active, verified, capacity ≥ load weight, body type matches when the load requires one, SOAT valid through `deliver_by`.

## Verification (people)

```mermaid
stateDiagram-v2
  [*] --> unverified: signup
  unverified --> pending: submit_verification (owner, all fields and files present)
  rejected --> pending: submit_verification
  pending --> verified: admin_review_verification(approve) (MFA admin, not self)
  pending --> rejected: admin_review_verification(reject, note)
  verified --> suspended: admin_set_suspended(note)
  suspended --> verified: admin_set_suspended(false, note)
```

PII in `profile_private` and files in `kyc/{uid}/` are editable only while `unverified` or `rejected`. `submit_verification()` needs legal name, document type and number, phone, a `document` file and, for carriers, a `license` file; otherwise `VERIFICATION_INCOMPLETE` with the missing fields in `DETAIL` (S1-02).
