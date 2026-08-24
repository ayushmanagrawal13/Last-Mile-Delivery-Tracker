# Last-Mile Delivery Tracker

**🚀 Live (Vercel — after deploy):** Frontend: https://vercel.com/ayushman9/last-mile-delivery-tracker

Production-grade, role-based platform (Customer / Delivery Agent / Admin) with admin-configurable zones & rate cards, isolated rate engine (zero hardcode), load-balanced auto-assignment, immutable tracking timeline, and queued email retry — including failed→reschedule flow.

## Features
- **Admin:** zone CRUD + area→zone bulk mapping, rate cards B2B/B2C intra/inter (per kg, admin edits, zero hardcode), COD surcharge flat/percent per order type, create orders on behalf of customer, view all orders filtered by status/zone/agent, manual & auto-assign, status override logged, agent management (status, zone, load)
- **Customer:** register/login, place order (pickup/drop, dims L×B×H, actual weight, B2B/B2C, Prepaid/COD) → see **computed charge breakdown before confirm** (zones, volumetric/billable, rate, base, COD, total), live status + full immutable timeline, failed → notification → pick reschedule date → reassign, order history
- **Agent:** login (created by admin), view assigned (today/upcoming), update `Picked Up → In Transit → Out for Delivery → Delivered` / `Failed` (requires reason), set availability + current zone
- **Guarantees:** Rate engine isolated testable, assignment load-balanced, lifecycle validated server-side, history append-only, email queued never blocks

## Tech Stack
- **Backend:** Node+TS Express, Prisma PostgreSQL (Neon/Supabase free, mock fallback `USE_MOCK_DB=true`), JWT+bcrypt RBAC, Zod, Pino
- **Frontend:** React+TS Vite, React Router role dashboards, Axios
- **Jobs:** node-cron (email retry sweep), BullMQ interface ready
- **Email:** Nodemailer adapter (Ethereal/SendGrid via `SMTP_*`), `notification_log` pending/sent/failed, 3× backoff
- **SMS:** Stub/log-only provider `services/sms.ts` (Twilio swap via env, documented)
- **Deploy:** Vercel free (frontend Vite static + backend `api/index.ts` serverless), Neon PG

## Quick Start
```bash
git clone <repo>
cd last-mile-delivery-tracker
cp .env.example backend/.env  # edit if you have Neon URL, else keep USE_MOCK_DB=true
cd backend && npm install && npx prisma generate && npm run dev  # http://localhost:4001
# new terminal
cd ../frontend && npm install && npm run dev  # http://localhost:5175
```
Seeded: `admin@delivery.local/admin123`, `customer@delivery.local/customer123`, `agent1@delivery.local/agent123` (North, zone 100001/100002), `agent2@delivery.local/agent123` (South 200001/200002), zones North/South + 4 rate cards (B2C intra 50, inter 80, B2B intra 40, inter 70) + COD B2C 10% / B2B flat 50

## Env (.env.example)
| Variable | Description |
|---|---|
| DATABASE_URL | Postgres (Neon) or empty → mock |
| JWT_SECRET, JWT_EXPIRES_IN | Auth |
| SMTP_HOST/PORT/USER/PASS/FROM/SECURE | Nodemailer; empty → jsonTransport stub |
| FRONTEND_URL | CORS origin (localhost:5175 or Vercel frontend) |
| VITE_API_URL | Frontend build env → backend URL |
| PORT | 4001 |
| USE_MOCK_DB | true → in-memory mock (no PG needed) |

## API (/api/v1, {success,data,error})
| Method | Route | Auth | Body/Query | Response |
|---|---|---|---|---|
| POST | /auth/register | - | {email,password,name,role?} | {user,token} 201 |
| POST | /auth/login | - | {email,password} | {user,token} |
| GET | /auth/me | any | - | {user} |
| POST | /zones | ADMIN | {name} | Zone 201 |
| GET | /zones | any | - | Zone[] with areas |
| POST | /zones/areas | ADMIN | {zoneId, areas:[...]} | ZoneArea[] 201 |
| GET | /zones/areas | any | - | ZoneArea[] |
| GET | /rate-cards | any | - | RateCard[] |
| POST | /rate-cards | ADMIN | {orderType B2B/B2C, zoneRel INTRA/INTER, rate} | 201 |
| PUT | /rate-cards/:id | ADMIN | {rate} | RateCard |
| GET/POST | /cod-config | any/ADMIN | {orderType,surchargeType FLAT/PERCENT,value} | CodConfig |
| GET | /agents | ADMIN | - | Agent[] with user/zone |
| POST | /agents | ADMIN | {name,email,password,currentZoneId?,status?} | Agent 201 |
| PUT | /agents/:id | ADMIN/AGENT | {status,currentZoneId} | Agent |
| GET | /agents/me | AGENT | - | Agent |
| POST | /orders/preview | CUSTOMER/ADMIN | {pickupAddress,dropAddress,l,b,h,actualWeight,orderType,paymentType} | Breakdown 200 or 400 zone not mapped |
| POST | /orders | CUSTOMER/ADMIN | same + customerId? + autoAssign? | Order 201 (CREATED→CONFIRMED→ASSIGNED if auto) |
| GET | /orders | any filtered | ?status=&zone=&agent= | Order[] |
| GET | /orders/:id | owner/agent/admin | - | Order + tracking[] |
| POST | /orders/:id/assign | ADMIN | {agentId} | Order |
| POST | /orders/:id/auto-assign | ADMIN | - | {assigned, agentId, reason} |
| POST | /orders/:id/status | AGENT/ADMIN | {toStatus, notes, override?} | Order (validates transitions) |
| POST | /orders/:id/override | ADMIN | {toStatus, notes} | Order (logged) |
| POST | /orders/:id/reschedule | CUSTOMER/ADMIN | {rescheduleDate} | Order (FAILED→RESCHEDULED→ASSIGNED + reassign) |

## DB Schema & ERD
Enums: Role CUSTOMER/DELIVERY_AGENT/ADMIN, OrderType B2B/B2C, PaymentType PREPAID/COD, OrderStatus CREATED/CONFIRMED/ASSIGNED/PICKED_UP/IN_TRANSIT/OUT_FOR_DELIVERY/DELIVERED/FAILED/RESCHEDULED, ZoneRel INTRA/INTER, AgentStatus AVAILABLE/UNAVAILABLE/ON_DELIVERY, SurchargeType FLAT/PERCENT, NotificationStatus PENDING/SENT/FAILED, Channel EMAIL/SMS

Tables: users(id, email UNIQUE, password, name, role), zones(id, name UNIQUE), zone_areas(id, zoneId FK, area UNIQUE), rate_cards(id, orderType, zoneRel, rate), cod_configs(id, orderType UNIQUE, surchargeType, value), agents(id, userId UNIQUE FK, status, currentZoneId FK, activeOrderCount), orders(id, customerId FK, pickup/drop, pickupZoneId, dropZoneId, l,b,h, actualWeight, volumetricWeight, billableWeight, orderType, paymentType, chargeBreakdown JSON, totalCharge, currentStatus, assignedAgentId FK, rescheduleDate), tracking_events(id, orderId FK, fromStatus, toStatus, actorId FK, actorRole, notes, createdAt) INDEX orderId, notification_log(id, type, recipient, channel, status, retryCount, relatedOrderId FK) INDEX status

ERD: users 1──1 agents; zones 1──* zone_areas; zones 1──* agents (currentZone); users 1──* orders (customer); agents 1──* orders; orders 1──* tracking_events; orders 1──* notification_log; users 1──* tracking_events (actor)

## Rate Calculation Logic (isolated, zero hardcode)
**File:** `backend/src/services/rateEngine.ts` — pure function `calculateRate(input)` where input includes resolved pickup/drop zone IDs plus DB-fetched `rateCards` and `codConfigs`.

Steps:
1. Zone detect via `resolveZone(area, zoneAreas)` — exact pincode/area match against `zone_areas` table; if not found throw `400 Area not mapped to any zone: <area>` (never silent default).
2. Volumetric: `(L*B*H)/5000`
3. Billable: `max(actualWeight, volumetricWeight)`
4. Zone rel: `pickupZoneId === dropZoneId ? INTRA : INTER`
5. Rate lookup: find `rateCards` where `orderType` and `zoneRel` match → `rate`; if missing throw `Rate card not configured`.
6. Base: `billableWeight * rate`
7. COD: if `paymentType===COD`, find `codConfigs` for orderType → if FLAT add value, if PERCENT add `base*value/100`
8. Return breakdown: `{pickupZone, dropZone, actualWeight, volumetricWeight, billableWeight, zoneRel, rateApplied, baseCharge, codSurcharge, total}` — frontend shows before confirm.

**Worked Example:** Order B2C, COD, 100001→200001 (North→South = INTER), L20 B15 H20, actual 2kg. RateCards: B2C INTER = ₹80/kg. COD B2C = 10% PERCENT. Volumetric = (20*15*20)/5000 = 1.2kg. Billable = max(2,1.2)=2kg. Base=2*80=₹160. COD=160*10%=₹16. Total=₹176. Same order Prepaid → ₹160. If dims 10×10×10 (vol 0.2) actual 0.5kg → billable 0.5 → inter 0.5*80=₹40. If B2B inter 70 → 0.5*70=₹35 + flat 50 COD =85.

Unit tests in `backend/tests/rateEngine.test.js` cover all branches: intra/inter, vol>actual, actual>vol, B2B/B2C rates, COD flat vs percent vs prepaid, unmapped error, worked example.

## Deployment (Vercel)
Frontend: import repo → Root `frontend` → Framework Vite → Build `npm run build` → Output `dist` → Env `VITE_API_URL=https://<backend>.vercel.app`
Backend: import same repo → Root `backend` → Framework Other → Build `npm install && npx prisma generate && npm run build` → Output `dist` → Routes via `api/index.ts` (`vercel.json` builds `@vercel/node` for `api/index.ts`) → Env `DATABASE_URL` (Neon), `JWT_SECRET`, `SMTP_*`, `FRONTEND_URL=https://<frontend>.vercel.app`, `USE_MOCK_DB=false` for real DB else true.

## Demo Walkthrough
1. Admin login `admin@delivery.local/admin123` → Zones: North (100001,100002), South (200001,200002) → Rate Cards: B2C intra 50/inter 80, B2B intra 40/inter 70 → COD: B2C 10% / B2B flat 50 → Create agents.
2. Customer login `customer@delivery.local/customer123` → Place order 100001→200001 B2C COD 20×15×20 2kg → Preview shows ₹176 breakdown → Confirm → auto-assigned to Agent One (North, load 0).
3. Agent login `agent1@delivery.local/agent123` → sees assigned → PICKED_UP → FAILED (reason) → customer gets email.
4. Customer → sees FAILED → picks reschedule date → RESCHEDULED → auto-reassigned (may be different agent) → timeline shows 7 events.
5. Admin can manual assign/reassign or override status (logged).

## Self-Check 10/10
- [x] Rate engine breakdown + unit tests
- [x] Zone unmapped fails, intra/inter distinguished
- [x] Auto-assignment available + load-balanced + fallback manual + both auto & manual trigger
- [x] Lifecycle validated, override logged
- [x] Immutable append-only tracking_events source of truth
- [x] Failed→reschedule→reassign with notification
- [x] Notifications queued 3× retry, never blocks
- [x] DB normalized Indexed (pickup_zone, assigned_agent+status, order_id)
- [x] API versioned validated RBAC documented
- [x] Docs README + system-design ≤800w match code

## License MIT
