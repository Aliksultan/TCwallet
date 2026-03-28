# Tulga Community - Telegram Mini App Product Specification

## Section A — Product Vision
The **Tulga Community Mini App** is a centralized, digital ecosystem built directly inside Telegram to engage, reward, and manage community members seamlessly. By blending event participation with a localized gamified economy driven by **Tulga Coins (TC)**, the app transforms standard community interactions into trackable, rewarding experiences. The **modern Liquid Glass** design ensures the platform feels premium, trustworthy, and native to the mobile environment, elevating the brand identity of Tulga Community. It effectively bridges the gap between organizers' administrative operations and users' desire for a fast, polished, and convenient internal marketplace (T-Market).

## Section B — Role System
The system employs strict Role-Based Access Control (RBAC) to enforce authority boundaries:
1. **Member:** The core user. Accounts are automatically provisioned via Telegram identity. Members can earn/spend TC, view personal transaction history, browse the T-Market, and track their orders. They have zero financial mutation capabilities and cannot view other users' wallets or a global leaderboard.
2. **Organiser:** Operational agents for community events (e.g., Reading Club, Tulga Talks). They can explicitly issue and deduct TC by recording transactions for participation, achievements, or penalties. They use predefined templates or manual entries but cannot directly manipulate raw balances, view the T-Market management panel, or alter historical transactions.
3. **T-Market Manager:** Commercial operators responsible for marketplace fulfillment. They receive dedicated notifications for new orders, review purchases, accept/decline transactions (triggering auto-refunds on decline), and manage product catalogs.
4. **Super Admin:** The system owner. Has absolute visibility and override capabilities. Can audit all user transactions, perform ledger corrections, extract system analytics, manage product listings, and configure user permissions (assigning Organisers and T-Market Managers).

## Section C — Core User Flows
### 1. Member Wallet Usage
- **Entry:** User opens the Mini App via Telegram inline button or menu. Auth is silent and instant.
- **Home/Wallet:** The default view features a large, glassmorphic card displaying the current TC balance.
- **Transactions:** Scrolling down reveals an elegant, chronologically grouped transaction list (Earned, Spent, Refund). Tapping an entry opens a detailed bottom sheet with metadata (Reason, Activity, Organiser, Date).

### 2. Organiser Coin Assignment & Deduction
- **Initiation:** Organiser opens the "Admin" tab -> "Give/Remove Coins".
- **Selection:** Searches for a member via Telegram username or display name.
- **Assignment:** Selects an Activity (e.g., "Kemenger Games"). Chooses a predefined template (e.g., "1st Place - 50 TC") or inputs a custom manual amount. Appends an optional note.
- **Confirmation:** Confirms the action. The system writes an immutable transaction to the ledger; the Member's balance updates instantly, and they receive a Telegram bot notification.

### 3. T-Market Purchase
- **Browsing:** Member navigates to the "T-Market" tab. Users can filter by price range and sort by newest/cheapest/expensive.
- **Selection:** Taps a product to view the Liquid Glass details modal. Taps "Buy for X TC".
- **Execution:** System validates the balance concurrently. If sufficient, it deducts TC instantly, logs a "Pending" order, creates a "Purchase" transaction in the wallet, and pings the assigned T-Market Manager.

### 4. T-Market Order Review (Manager Flow)
- **Notification:** T-Market Manager receives a Telegram bot ping detailing a new pending order.
- **Action:** Manager opens the app -> navigates to "Orders Inbox". Reviews the requested item and the buyer's details.
- **Outcome Options:** 
  - *Accept:* Order status changes to "Accepted". Member is notified to expect fulfillment.
  - *Decline:* Order status changes to "Declined". The system executes a compensating "Refund" transaction (restoring absolute balance). Member is notified.
  - *Fulfill:* Manager later marks an "Accepted" order as "Completed" once the physical exchange occurs.

### 5. Super Admin Ledger Correction
- **Initiation:** Super Admin navigates to the "Users List" and selects a profile.
- **Correction:** Taps "Adjust Balance". Enters the delta amount (positive or negative) and an explicit reason for the audit log.
- **Execution:** The system writes a "Correction" transaction. The ledger remains intact, establishing absolute traceability.

## Section D — Information Architecture
The app layout utilizes a sleek Bottom Navigation Bar (for Members) and conditional Admin tabs based on roles.

**Primary Navigation (Members):**
1. **Wallet (Home):** Balance Card, Quick Stats, Transaction History Feed.
2. **T-Market:** Catalog grid, Filter/Sort controls, Range Slider.
3. **Profile:** User settings, active orders ("My Orders"), Language Switcher (KK/RU).

**Admin Navigation (Conditional):**
- **Organiser Dashboard:** Search Bar, Quick Templates, Recent Assignments overview.
- **Manager Dashboard:** Orders Inbox (segmented by Pending/Accepted/Completed), Product Management list.
- **Super Admin Dashboard:** System Analytics, Role Assignment UI, Global Ledger Search.

## Section E — Feature Specification
- **Authentication:** `Telegram.WebApp.initData` validation on the backend ensures cryptographic proof of identity.
- **Wallet Ledger:** An append-only transaction table. Balances are calculated dynamically or cached securely, ensuring `Balance = Sum(Transactions)`.
- **Template Engine:** A configurable table in the database housing standardized rewards (e.g., `id: 1, name: 'Reading Club Winner', amount: 100, type: 'EARN'`).
- **T-Market Filtering:** Real-time client-side array filtering for price ranges (<50 TC, 50-200 TC, etc.) to ensure snappy UX without excessive network requests.
- **Order State Machine:** Defined state transitions: `PENDING -> ACCEPTED -> COMPLETED` or `PENDING -> DECLINED`.
- **Localization:** i18n implementation wrapping all text strings. The user's language preference is stored in their DB profile, defaulting to their Telegram app language if supported.

## Section F — Business Logic & Safety Constraints
- **Zero-Floor Constraint:** Wallet balance must be >= 0. A deduction attempting to drop the balance below zero will throw a `400 Bad Request` and display a localized "Insufficient Funds" error.
- **Immutability:** Transactions, once committed, cannot be edited or deleted by anyone (including Super Admins). Errors require a compensating "Correction" transaction.
- **Refund Automation:** Declining an order programmatically triggers a transaction of type `REFUND`, bypassing manual organizer intervention.
- **Manager Silos:** Only users explicitly assigned `ROLE_MARKET_MANAGER` can fetch the `/orders/pending` endpoint or receive the webhook alerts.
- **Idempotency:** Purchase endpoints must utilize idempotency keys (or lock the user's row sequence) to prevent duplicate spend vulnerabilities from network retries or double-tapping.

## Section G — Data Model
*Relational schema structure (optimized for PostgreSQL):*

**User**
- `id` (PK, UUID)
- `telegram_id` (BigInt, Unique)
- `username` (String, Nullable)
- `display_name` (String)
- `role` (Enum: MEMBER, ORGANISER, MANAGER, SUPER_ADMIN) - *Can be an array if multi-role is supported.*
- `language` (Enum: KK, RU)
- `created_at` (Timestamp)

**Transaction**
- `id` (PK, UUID)
- `user_id` (FK -> User)
- `actor_id` (FK -> User, represents who initiated the tx, can be system)
- `amount` (Int, positive for earn/refund, negative for spend/deduct)
- `type` (Enum: EARN, SPENT, REMOVED, REFUND, ADJUSTMENT, CORRECTION)
- `activity` (String/Enum: 'Reading Club', 'Chess League', etc.)
- `reason` (String, e.g., "Won 1st place in Chess")
- `created_at` (Timestamp)

**Product**
- `id` (PK, UUID)
- `name` (String)
- `description` (Text)
- `price` (Int)
- `image_url` (String)
- `is_active` (Boolean)
- `created_by` (FK -> User)

**Order**
- `id` (PK, UUID)
- `user_id` (FK -> User)
- `product_id` (FK -> Product)
- `transaction_id` (FK -> Transaction, the spend tx)
- `status` (Enum: PENDING, ACCEPTED, DECLINED, COMPLETED)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Section H — Admin and Permission Matrix

| Feature / Action | Member | Organiser | T-Market Manager | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| Access Telegram Mini App | ✅ | ✅ | ✅ | ✅ |
| View Own Balance & History | ✅ | ✅ | ✅ | ✅ |
| Buy items in T-Market | ✅ | ✅ | ✅ | ✅ |
| Issue / Deduct TC | ❌ | ✅ | ❌ | ✅ (via Adjust) |
| View Other Wallets | ❌ | ❌ (Search only) | ❌ | ✅ |
| Accept / Decline Orders | ❌ | ❌ | ✅ | ✅ |
| Manage T-Market Products | ❌ | ❌ | ✅ | ✅ |
| Assign Roles | ❌ | ❌ | ❌ | ✅ |
| View Global Analytics | ❌ | ❌ | ❌ | ✅ |

*(Note: Roles can overlap if Super Admin assigns multiple flags to one user.)*

## Section I — UX/UI Direction (Liquid Glass)
**Design Philosophy:**
The "Liquid Glass" aesthetic leverages depth, translucency, and fluid physics to create a premium, tactile interface.
- **Color Palette:** Deep, rich background tones (e.g., Midnight Blue `#0B0E14` or Deep Emerald `#0A1915`) combined with vibrant, frosted accent gradients.
- **Glassmorphism:** Cards and bottom sheets utilize semitransparent backgrounds (`rgba(255, 255, 255, 0.05)`), intense background blurs (`backdrop-filter: blur(20px)`), and subtle 1px luminous white borders to simulate glass edges.
- **Typography:** Modern, geometric sans-serif (e.g., *Inter*, *Outfit*, or *SF Pro*). High contrast for readability.
- **Animations:** Fluid, spring-physics micro-interactions. Pressing a button slightly scales it down (0.95x); opening a modal slides it up with a smooth dampening effect.
- **Telegram Native Integration:** Ensure the UI scales perfectly within the Telegram webview envelope. Use Telegram Theme parameters (`var(--tg-theme-button-color)`) only for fail-safes; rely mostly on the custom Liquid Glass CSS to maintain brand identity.
- **Status Pills:** Glowing gradient borders for statuses (e.g., Neon Green for "Accepted", Sunset Orange for "Declined").

## Section J — Bilingual Content System
The platform architecture utilizes standardized localization keys via an i18n library.
**Sample Key Structure (`ru.json` / `kk.json`):**
```json
{
  "wallet": {
    "balance_title": "Твой баланс", // Сенің балансың
    "history": "История транзакций", // Транзакциялар тарихы
    "empty_state": "Транзакций пока нет" // Әзірге транзакциялар жоқ
  },
  "market": {
    "buy_button": "Купить за {{amount}} TC", // {{amount}} TC-ға сатып алу
    "insufficient_funds": "Недостаточно монет" // Монеталар жеткіліксіз
  },
  "roles": {
    "organiser": "Организатор" // Ұйымдастырушы
  }
}
```
**Language Selection:** Defaults to Telegram's `initDataUnsafe.user.language_code`. If the code is not `ru` or `kk`, it falls back to `ru`. Users can override this in their Profile settings.

## Section K — Suggested Technical Architecture
- **Frontend:** React.js (Next.js or Vite) with TailwindCSS and Framer Motion for Liquid Glass animations. Integration with `@twa-dev/sdk` for Telegram bridge.
- **Backend:** Node.js (NestJS or Express) or Go, focusing on speed and modularity. 
- **Database:** PostgreSQL (essential for ACID compliance, ledger integrity, and relational data). Prisma ORM for type safety.
- **Authentication:** HMAC SHA-256 validation of the Telegram `initData` string. Issuance of secure JWTs for subsequent API calls.
- **Notification Handling:** A dedicated Telegram Bot server instance (using `node-telegram-bot-api` or `telegraf`) used exclusively to push asynchronous notifications (Orders, Refunds, Receipts) to targeted `telegram_id`s.
- **Hosting:** Vercel (Frontend) + Render/Railway (Backend & DB) for low-maintenance, scalable cloud deployment.

## Section L — API / Backend Modules
**1. Auth Module**
- `POST /auth/telegram` (Validates initData, returns JWT)
**2. Wallet Module**
- `GET /wallet/me` (Returns balance, user profile details)
- `GET /wallet/transactions` (Returns paginated history)
**3. Admin Ledger Module (Organiser + Super Admin)**
- `POST /admin/transactions` (Creates earn/deduct entry, mutates balance)
- `GET /admin/users` (Search users)
**4. Market Module**
- `GET /products` (Visible to all)
- `POST /orders` (Initiates purchase transaction flow)
**5. Manager Module**
- `GET /manager/orders`
- `PATCH /manager/orders/:id/status` (Accept, Decline [auto-refund], Complete)
- `POST /manager/products` (CRUD products)

## Section M — Edge Cases & Safeties
1. **Concurrent Purchases (Double-spend):** Handled via database transaction locks (`SELECT ... FOR UPDATE`) or atomic balance decrements (`UPDATE users SET balance = balance - X WHERE balance >= X`).
2. **Product Deleted while in Cart:** If a manager archives a product just as a user buys it, the `POST /orders` endpoint checks the `is_active` flag and rejects the transaction safely.
3. **Manager Declines an Already Completed Order:** The state machine enforces strictly ordered transitions (`PENDING -> ACCEPTED -> COMPLETED`). You cannot decline a `COMPLETED` order.
4. **Network Drop after Deduction:** Client assumes failure, but backend processed the order. The user will see their updated balance and order in the "My Orders" tab upon reload. Notifications provide ultimate confirmation.

## Section N — Launch Plan
**Phase 1 (MVP - V1):**
- Auth, Wallet, Immutability Ledger, Basic T-Market.
- Manual Coin Assignment + simple Templates.
- Core UX/UI Liquid Glass implementation in KK/RU.
- Super Admin override capabilities.

**Phase 2 (V1.1 - Enhancements):**
- Advanced Analytics Dashboard (charts for "Most Popular Activities").
- Activity-specific budgets.
- Automated onboarding flow for latecomers.

**Phase 3 (V2 - Event Expansion):**
- Built-in Event Calendar.
- QR-code-based attendance check-ins directly awarding default TC amounts.
- Digital event ticketing via T-Market.

## Section O — Final Recommendations
1. **Never Cache Balances Loosely:** Always calculate the wallet balance derived from the single source of truth (the transaction ledger) or use atomic database operations, as financial integrity is paramount even in internal gamified systems.
2. **Prioritize the "Feel":** Telegram Mini Apps live or die by their latency. Optimize the React bundle size. Use skeleton loaders with smooth opacity transitions rather than jarring loading spinners.
3. **Audit Trails:** Ensure every `POST`, `PATCH`, and `DELETE` operation logs the `actor_id` (the person making the change). When disputes inevitably happen ("Where did my 50 TC go?"), the Super Admin needs 100% clarity.
4. **Community Trust:** Since real effort translates to TC, members will treat it like real currency. Over-communicate through bot notifications (e.g., "🎉 You earned 50 TC for Chess League!") to reinforce the reward loop and build platform trust.
