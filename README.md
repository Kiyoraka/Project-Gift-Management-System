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
| `index.html` | Everyone | Foundation hub: three tenant card templates (tap to flip), palette, type scale, component sheet, links into each app |
| `login.html` | Everyone | Demo sign in for Admin, Client (pick a tenant) or Customer |
| `admin.html` | Platform admin | Main dashboard, Analysis tabs and ranges, User table with filters, invite drawer, Setting with suspend-client confirmation |
| `client.html` | Merchant | Main dashboard, Payment QR popup (Static or Amount QR with 5-minute timer), Analysis, Customer List, Setting (profile, card design studio, payment gateways with Add Gateway drawer, staff, notifications) |
| `customer.html` | Customer | Wallet with tap-to-flip cards, gift inbox (accept or decline), Send a gift, Scan and Pay (fixed, open value with top-up, voucher), Buy a card, Profile and history |

Switch between apps with the dark demo switcher in the bottom-right corner. On the Client console its coloured dots
switch between Senja Coffee, Lumi Spa and Page & Ink.

## Demo login

**Any email and any password works.** The form is pre-filled for each role, so one tap on **Sign in** is enough.

| Role | Pre-filled email |
|------|------------------|
| Admin | `alice@giftwell.my` |
| Client | `farid@senjacoffee.my`, `clara@lumispa.my` or `jonas@pageandink.my` (follows the tenant) |
| Customer | `aisyah.r@gmail.com` |

Opening an app page without signing in redirects to the login page for that role. Each role keeps its own demo
session in the browser's localStorage; **Sign out** clears it.

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
index.html  login.html  admin.html  client.html  customer.html
assets/css/  tokens.css  base.css  gift-card.css  login.css  console.css  demo-switch.css  customer.css
assets/js/   ui.js  auth.js  login.js  admin.js
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
