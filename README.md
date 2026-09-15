# Giftwell - Gift Management System (Proposal Demo)

Software Version: 0.1.0 (hardcoded prototype)

## Description

A clickable proposal demo of a multi-tenant gift card platform, prepared for TNEX Malaysia Sdn Bhd.
A platform **Admin** oversees everything, three sample **Clients** (merchants) sell their own branded gift cards
and take payment through their own gateways, and **Customers** buy, send, receive and spend gift cards from a phone.

Everything is plain HTML, CSS and JavaScript: no framework, no build step, no backend. All figures are sample data,
nothing is saved to a server, and refreshing a page resets its demo state.

The screens are a vanilla port of the Claude Design project (Foundation, GiftCard, Admin Console, Client Console
and Customer App artboards) and follow the design brief's palette, type scale, motion and rules.

## Pages

| Page | Who | What you can try |
|------|-----|------------------|
| `index.html` | Everyone | Landing page (desktop and mobile): hero with Log in, the three personas, how it works, card types, sample stats and a Log in call to action |
| `foundation.html` | Everyone | Foundation hub: three tenant card templates (tap to flip), palette, type scale, component sheet, links into each app |
| `login.html` | Everyone | Single sign in with demo account buttons (Admin, Client, Customer 1, Customer 2) or any email and password |
| `admin.html` | Platform admin | Main dashboard, Analysis tabs and ranges, User table with filters, invite drawer, Setting with suspend-client confirmation |
| `client.html` | Merchant | Main dashboard, Payment QR popup (Static or Amount QR with 5-minute timer), Analysis, Customer List, Setting (profile, card design studio, payment gateways with Add Gateway drawer, staff, notifications) |
| `customer.html` | Customer | Wallet with tap-to-flip cards, gift inbox (accept or decline), Send a gift, Scan and Pay (fixed, open value with top-up, voucher), Buy a card, Profile and history |

Switch between apps with the dark demo switcher in the bottom-right corner. On the Client console its coloured dots
switch between Senja Coffee, Lumi Spa and Page & Ink.

## Demo login

There is **one sign-in page** for the whole prototype. Tap a demo account button to sign in instantly:

| Demo button | Email | Opens |
|-------------|-------|-------|
| Admin | `alice@giftwell.my` | Admin console |
| Client | `farid@senjacoffee.my` | Client console for Senja Coffee (the coloured dots still switch merchants) |
| Customer 1 | `aisyah.r@gmail.com` | Customer app with Aisyah's wallet (4 cards, 1 gift waiting) |
| Customer 2 | `weiling.tan@gmail.com` | Customer app with Wei Ling's own wallet, history and sent gifts |

**Any email and any password also works.** The email's domain decides where you land:

| Email ends with | Opens |
|-----------------|-------|
| `@giftwell.my` | Admin console |
| `@senjacoffee.my`, `@lumispa.my`, `@pageandink.my` | That merchant's Client console |
| anything else | Customer app (Customer 1 wallet, or Customer 2 for `weiling.tan@gmail.com`) |

One demo session is kept in the browser's localStorage. Opening an app that does not match the signed-in account
returns you to the sign-in page; **Sign out** clears the session.

## How to open

Serve the folder with any static web server and open `index.html`, for example:

```bash
python -m http.server 5500
```

Then visit `http://127.0.0.1:5500/`. Opening `index.html` directly from disk also works in most browsers.

## Responsive behaviour

| Width | Admin and Client consoles | Customer app |
|-------|---------------------------|--------------|
| 1100px and up | 240px sidebar | App centred in a 390 by 844 phone frame |
| 768px to 1099px | 72px icon rail | App centred in a 390 by 844 phone frame |
| Up to 767px | Top bar with a bottom-sheet menu; drawers and the QR popup become bottom sheets | Full-screen app with a bottom tab bar |

The customer app is mobile-only by design, so it is never stretched across a wide screen.

## Structure

```
index.html  foundation.html  login.html  admin.html  client.html  customer.html
assets/css/  tokens.css  base.css  gift-card.css  landing.css  login.css  console.css  demo-switch.css  customer.css
assets/js/   ui.js  auth.js  landing.js  login.js  admin.js
             client-data.js  client-screens.js  client-overlays.js  client.js
             customer-data.js  customer-screens.js  customer-flows.js  customer.js
```

- `tokens.css` holds the design tokens (palette, tenant brands, type, radii, shadows).
- `ui.js` holds shared helpers: gift card renderer, look-alike QR, toasts, icons and event delegation.
- `auth.js` is the hardcoded demo session and page guard.
- Each app has a data file, screen renderers and a small controller.

## Notes

- The QR codes are visual look-alikes and are not scannable.
- CSV export, PNG download, logo upload and gateway credentials are simulated with toasts.
- Light theme only; dark theme values are kept in `tokens.css` for a later pass.
