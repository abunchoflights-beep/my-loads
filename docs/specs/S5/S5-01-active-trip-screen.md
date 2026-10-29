---
id: S5-01
title: "Active trip screen"
sprint: 5
milestone: "Sprint 5 · Trips"
labels: [spec, sprint-5, carrier, trips]
status: todo
---

# S5-01 · Active trip screen

**Status:** Not started

## Requirement

As a booked carrier, I have one screen with both stops, directions and the next action.

## Behavior

- Given a booked load, then `/trips/[id]` shows pickup and drop-off from `get_load_stops()` with "Abrir en Waze / Google Maps" links.
- Given status changes, then the primary button changes: Llegué a la finca, Ingresar código de recogida, Ingresar código de entrega.

## Invariants

- Stops are fetched on demand, never cached in the browser after the trip ends.

## Acceptance criteria

- [ ] Trip screen
- [ ] Deep links to Waze and Google Maps
- [ ] Call buttons via `get_order_contacts()`
