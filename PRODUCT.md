# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Prospective gym members visiting the public home page to understand the gym, services, and membership options before contacting or joining.
- Gym administrators and staff using the management application to operate users, clients, memberships, payments, inventory, schedules, and routines.

## Product Purpose

Olimpo is a web-based gym management system. Its public home page introduces the Olimpo gym to prospective members; its authenticated application supports day-to-day gym operations.

## Positioning

Olimpo helps people train in a familiar, practical, and professional environment, with high-quality machines, support from professionals, and well-managed service.

## Operating Context

Prospective members discover Olimpo on the web, scan information about the gym, services, and membership options, and choose whether to contact or join. Staff use the authenticated application for operational workflows.

## Capabilities and Constraints

- The existing backend provides management capabilities for authentication, users, clients, memberships, payments, inventory, machines, trainer schedules, and routines.
- The public home is `/`; the authenticated management dashboard is `/dashboard`; login is `/login`.
- The existing API contract under `/api/v1` must not change as part of frontend work.
- Public services, membership prices, terms, location, hours, and contact details have not been supplied as verified business facts.
- Sample content may be used during implementation only when clearly identified as illustrative and not presented as a current offer.
- No history, staff biographies, testimonials, facilities, promotions, or results have been verified for publication.

## Brand Commitments

- The public home keeps the established Olimpo “negro editorial” identity in `docs/FRONTEND_BASE.md`.
- The user describes Olimpo as familiar, practical, professional, and well-managed, with high-quality machines and professional support.
- The public-facing experience and copy are in Spanish.

## Evidence on Hand

- The repository documents the gym-management capabilities and API contract.
- `front/public/` contains `favicon.svg` and `icons.svg`; no approved gym photography, testimonials, or current pricing sheet has been provided.
- Any prices or service details used before receiving verified data must be visibly labeled as sample content.

## Product Principles

- Help prospective members understand the real offer and decide on a next step.
- Keep public claims factual; never turn sample content into an implied guarantee or live price.
- Make the management application reliable for staff through role-aware operational workflows.
- Treat motion as enhancement; all content and actions remain available without animation.

## Accessibility & Inclusion

- The animated home must respect `prefers-reduced-motion` and preserve the same content and functionality.
- Navigation and calls to action must be operable by keyboard with visible focus.
