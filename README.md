# The Wooden Tone — Online Store

Next.js 15 + PostgreSQL (Drizzle ORM) storefront with a full admin panel.

- Storefront: home, shop (filters), categories, product, cart, checkout, order tracking, custom orders, contact, account, wishlist
- Payments: Razorpay (UPI / cards / netbanking / wallets incl. Paytm & PhonePe), PhonePe PG, Cash on Delivery
- Admin (`/admin`): orders, products, categories & rooms, coupons, banners, reviews, custom-order requests, messages, subscribers, customers, FAQ & pages, settings (store info, payment keys, shipping/COD, homepage)

## Environment
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Long random string for sessions |
| `SITE_URL` | Public URL, e.g. https://thewoodentone.com |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin account (created on first boot) |

Payment keys can be set in Admin → Settings → Payments (or via `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_ENV`).

## Run
```
npm install
npm run build
npm start   # runs migrations + seed, then starts the server
```
