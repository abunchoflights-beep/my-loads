---
id: S6-01
title: "ADR: payment provider"
sprint: 6
milestone: "Sprint 6 · Payments"
labels: [spec, sprint-6, payments, adr]
status: todo
---

# S6-01 · ADR: payment provider

**Status:** Not started

## Requirement

As the business, we pick a provider that supports PSE, Nequi and cards in Colombia, holds or splits funds, and pays out to farmers and carriers.

## Behavior

- Given the comparison (Wompi, Mercado Pago, ePayco), then an ADR records fees, split/hold support, payout methods, KYC requirements and integration effort.

## Invariants

- We never store card data (PCI scope stays with the provider).

## Acceptance criteria

- [ ] ADR in docs/ARCHITECTURE.md
- [ ] Sandbox account created
