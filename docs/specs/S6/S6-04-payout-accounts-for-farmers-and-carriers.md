---
id: S6-04
title: "Payout accounts for farmers and carriers"
sprint: 6
milestone: "Sprint 6 · Payments"
labels: [spec, sprint-6, payments, onboarding]
status: todo
---

# S6-04 · Payout accounts for farmers and carriers

**Status:** Not started

## Requirement

As a farmer without a bank account, I can get paid to Nequi or Daviplata; as a carrier, to my bank account.

## Behavior

- Given payout setup, then I add an account whose holder document must match my verified document.

## Invariants

- Payout account changes require re-authentication and notify the user by email.
- Account numbers are stored tokenized or masked.

## Acceptance criteria

- [ ] Payout account screen
- [ ] Holder match check
- [ ] 24 h cool-down after changes before payouts
