# Requirements

Two voices wrote this document on purpose. The **client** section is the business owner saying what they need and why. The **PE** (principal engineer) section turns that into constraints the system has to meet. When the two disagree, the open questions at the end are where it gets settled.

## Part 1 · Client

### The problem

A farmer in Urabá harvests plantain. To sell it, they call the same intermediary as always, who sets the price at the farm gate, picks it up and resells it in Medellín or at Corabastos in Bogotá. Between the farm and the city there are often two or three hands, and each one takes a cut. The farmer has no idea what the plantain sells for in the city, so they can't negotiate.

On the other side, the fruver owner in Chapinero or the stall at the plaza buys from a wholesaler who bought from another wholesaler. They pay more and know nothing about where the product came from.

And the trucker who does the actual work finds loads through WhatsApp groups and phone calls, comes back empty half the time, and sometimes gets paid weeks late.

### What we want

One place where:

1. The farmer publishes what they have (product, kilos, price, dates) and sells it straight to a buyer in the city.
2. The buyer sees real farm prices, buys, and gets the freight solved in the same flow.
3. The trucker sees loads from farm to city, offers a price and gets booked. Like DAT in the US, but built for Colombian roads and Colombian trucks.

We start in Colombia. The model should work in any country later (Peru, Ecuador, Central America), so nothing in the product should be hard-wired to Colombia except the data we load.

### Who uses it

| Persona | Reality | What they need from us |
|---|---|---|
| **Doña Rosa, productora** (Apartadó, Antioquia) | Plantain and banana, 4 hectares. Low-end Android, prepaid data, signal comes and goes in the vereda. Uses WhatsApp every day, nothing else. | Publish a load in under 2 minutes. Know she'll get paid. Never have her farm pin on a public map. |
| **Fruver Chapinero, comprador** (Bogotá) | Buys 2 to 5 tons a week of fruit and vegetables. Has a bookkeeper who needs invoices. | Compare farm prices, buy with confidence, track the truck, and pay through a channel that holds the money until the goods arrive. |
| **Don Jairo, transportador** (truck "sencillo", 9 t) | Owns one truck, sometimes drives for others. Runs the Medellín to Urabá route. | Find loads on his route, especially for the trip back. Get paid fast. Not get scammed. |
| **Operaciones, admin** | Our team. | Verify people and trucks, settle disputes, see what's happening. |

### What matters most to us, in order

1. **Trust.** Nobody pays a stranger they found on an app. Verified identities, verified trucks, money held until delivery, ratings.
2. **Safety of people in the field.** Robbery of cargo and extortion are real. Farm locations and phone numbers are private until there is a confirmed deal.
3. **Simple enough for Doña Rosa.** Big buttons, plain Spanish, works on a cheap phone with bad signal.
4. **Fair price.** The farmer sets the price. We show market prices so they can price well.

### Out of scope for the first launch

- Exports and international freight.
- Cold-chain monitoring with sensors.
- Credit or financing for farmers (interesting later).
- Multi-user organizations (cooperatives with several members). The first version is one person, one account.

## Part 2 · Principal engineer

### Functional requirements

| ID | Requirement | Sprint |
|---|---|---|
| FR-01 | Users sign up with exactly one role: farmer, buyer or carrier. Admin is never self-assigned. | S0/S1 |
| FR-02 | Users must be verified (legal name, document, phone, support file) before they can publish, buy, bid or haul. | S1 |
| FR-03 | Farmers register farms; buyers register delivery locations; carriers register vehicles (plate, class, body, capacity, SOAT, tecnomecánica). | S1 |
| FR-04 | Farmers publish listings: product, grade, kilos, minimum order, price per kg in COP, availability window, photos. | S2 |
| FR-05 | Buyers browse and filter the market by product, municipality, grade, price and date. | S2 |
| FR-06 | Buyers place orders against a listing; price is snapshotted server-side. | S3 |
| FR-07 | Farmers accept or reject within 24 h; acceptance reserves stock atomically. Pending orders expire. | S3 |
| FR-08 | Transport mode per order: platform freight, buyer picks up, or farmer delivers. | S3 |
| FR-09 | Platform freight posts a load on the board. Verified carriers bid; the buyer (shipper) books one. | S4 |
| FR-10 | Pickup and delivery are confirmed with one-time 6-digit codes held by farmer and buyer. | S5 |
| FR-11 | Carriers share location while in transit; parties see progress. | S5 |
| FR-12 | Buyer pays when the order is accepted; funds are released when delivery is confirmed (or auto-released after 48 h without dispute). | S6 |
| FR-13 | Parties rate each other after completion; disputes go to admin. | S7 |
| FR-14 | Admin verifies users/vehicles, resolves disputes, reads the audit log. Admin actions require MFA. | S1/S7 |

### Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-01 | Security | Defense in depth: route gate in proxy, role check in server components, RLS + RPC checks in Postgres. The database is the source of truth for authorization. See [SECURITY.md](SECURITY.md). |
| NFR-02 | Privacy | Compliance with Ley 1581 de 2012 (habeas data) and Decreto 1377 de 2013: explicit consent at signup, purpose-limited use, right to access/rectify/delete. Exact locations and phone numbers are need-to-know. |
| NFR-03 | Performance | LCP under 2.5 s on a mid-range Android over 4G. First-load JS under 150 KB gzip for the farmer flows. Server responses p95 under 400 ms for reads. |
| NFR-04 | Connectivity | Core farmer and carrier actions tolerate flaky networks: idempotent writes, retry, and codes that can be read over a phone call. PWA offline shell in S5. |
| NFR-05 | Accessibility | WCAG 2.2 AA. Touch targets at least 44 x 44 px. Plain Spanish (tú), numbers in es-CO format. |
| NFR-06 | Availability | 99.5 % monthly for the MVP. Daily backups with point-in-time recovery once in production. |
| NFR-07 | Data residency | Supabase region closest to Colombia (São Paulo, `sa-east-1`) unless legal says otherwise. |
| NFR-08 | Auditability | Every change to verification, listings, orders, loads, bids and vehicles is written to an append-only audit log without PII. |
| NFR-09 | Portability | Business rules live in plain Postgres (constraints, RLS, plpgsql), so the data layer can move to RDS/Aurora when we outgrow Supabase. |
| NFR-10 | Testability | Every RLS policy and every RPC has a pgTAP test. Every route rule has a unit test. CI blocks merges on failures. |

### Glossary

| Term | Meaning | In code |
|---|---|---|
| Carguita | A lot of product a farmer offers (e.g. 2,000 kg of plantain, primera). | `listings` |
| Pedido | A buyer's purchase of part or all of a carguita. | `orders` |
| Flete | The transport job created when a platform-freight order is accepted. | `loads` |
| Oferta | A carrier's price to haul a flete. | `load_bids` |
| Shipper | Whoever pays the freight. In our model, the buyer. | `loads.shipper_id` |
| Código de recogida / entrega | 6-digit one-time codes that prove the handoff. | `private.load_secrets` |

### Open questions for the client

These block specific issues. Each has a default we will build with if there is no answer in time.

| # | Question | Default if unanswered | Blocks |
|---|---|---|---|
| Q1 | Platform commission: who pays, how much? | 3 % to the buyer on the product subtotal, 5 % to the carrier on freight. | S6-05 |
| Q2 | Who pays the freight? | The buyer (farm-gate price, FOB finca). | S4 |
| Q3 | Can one person be farmer and carrier? | No. One role per account; a second account with another email. | S1 |
| Q4 | Payment provider? | Wompi (Bancolombia), with Nequi and PSE. ADR in S6-01. | S6 |
| Q5 | Do we issue electronic invoices (DIAN) or do the parties? | The parties invoice each other; we invoice our commission. | S6-05 |
| Q6 | Cancellation penalties for carriers who unbook? | No money penalty in MVP, but it shows in their rating. | S4-04 |
| Q7 | Public price index for anonymous visitors? | Only aggregated prices by product and department, no individual listings. | S2 |
