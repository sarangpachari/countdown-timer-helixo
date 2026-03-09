# Countdown Timer — Shopify App

A Shopify app that lets merchants create and display countdown timers for promotions on their product pages.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Admin UI | React 18 + Shopify Polaris 12 + Vite |
| Backend | Node.js + Express + Shopify App Express |
| Database | MongoDB (Mongoose) + MongoDBSessionStorage |
| Storefront | Theme App Extension (Liquid block + vanilla JS widget) |
| CLI | Shopify CLI 3.0 |

---

## Prerequisites

- Node.js >= 18.20
- npm >= 9
- [Shopify CLI 3.0](https://shopify.dev/docs/apps/tools/cli) installed: `npm install -g @shopify/cli`
- A [Shopify Partners](https://www.shopify.com/partners) account
- A Shopify app created in the Partner Dashboard
- MongoDB Atlas cluster (or local MongoDB)

---

## Project Structure

```
helixo_task/
├── shopify.app.toml              # Shopify app config
├── package.json                  # Root workspace (npm workspaces)
├── .env.example                  # Environment variable template
│
├── web/                          # Web workspace
│   ├── shopify.web.toml          # Marks this as the backend web
│   ├── package.json
│   ├── backend/
│   │   ├── index.js              # Express server entry point
│   │   ├── shopify.js            # Shopify app auth + session config
│   │   ├── models/
│   │   │   └── Timer.js          # Mongoose Timer model
│   │   └── routes/
│   │       ├── timers.js         # Authenticated CRUD routes
│   │       └── widget.js         # Public widget endpoint
│   └── frontend/
│       ├── vite.config.js
│       ├── index.html
│       ├── package.json
│       └── src/
│           ├── main.jsx           # React + Polaris entry
│           ├── App.jsx            # Router
│           ├── hooks/
│           │   └── useTimers.js   # CRUD API hooks
│           ├── pages/
│           │   └── TimerManagerPage.jsx
│           └── components/
│               └── TimerModal.jsx
│
└── extensions/
    └── countdown-timer-widget/
        ├── shopify.extension.toml
        ├── blocks/
        │   └── countdown-timer.liquid  # App block
        └── assets/
            ├── countdown-timer.js      # Widget JS
            └── countdown-timer.css     # Widget styles
```

---

## Setup

### 1. Clone and install

```bash
cd helixo_task
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=read_products,write_script_tags
HOST=https://your-tunnel-url.trycloudflare.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/countdown_timer_db
PORT=3000
```

### 3. Link your Shopify app

```bash
shopify auth login --store your-dev-store.myshopify.com
shopify app config link
```

### 4. Start development server

```bash
npm run dev
```

This starts the backend Express server and the Shopify CLI tunnel. Install the app on your development store when prompted.

### 5. Add the widget to your theme

1. Go to your Shopify store → **Online Store → Themes → Customize**
2. Navigate to a **Product page** section
3. Click **Add block** → find **Countdown Timer**
4. Place it below the "Add to cart" button

> **Important**: You must set the app's API URL as a shop metafield so the widget can reach your server:
> ```
> Namespace: countdown_timer
> Key:       api_base_url
> Value:     https://your-app-url.com
> ```

---

## API Reference

### Authenticated (Shopify session required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timers` | List all timers for the authenticated shop |
| POST | `/api/timers` | Create a new timer |
| PUT | `/api/timers/:id` | Update a timer |
| DELETE | `/api/timers/:id` | Delete a timer |

### Public (no auth, used by widget)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/widget/timers?shop=my-store.myshopify.com` | Get the currently active timer for a shop |

### Timer Object Schema

```json
{
  "_id": "...",
  "shopDomain": "my-store.myshopify.com",
  "name": "Black Friday Sale",
  "startDate": "2026-11-29T00:00:00.000Z",
  "endDate": "2026-11-30T23:59:59.000Z",
  "description": "50% off all products!",
  "color": "#FF5733",
  "size": "medium",
  "position": "bottom",
  "urgencyType": "color_pulse",
  "urgencyThresholdMinutes": 5,
  "status": "active",
  "isActive": true
}
```

---

## Deployment

```bash
# Build frontend
cd web/frontend && npm run build && cd ../..

# Deploy extension to Shopify
npm run deploy
```

---

## Features

- ✅ **Multi-store** — timers are scoped by `shopDomain`; each store only sees its own data
- ✅ **Scheduled timers** — start/end dates automatically determine Active/Scheduled/Expired status
- ✅ **Live countdown** — widget ticks every second: `DD : HH : MM : SS`
- ✅ **Urgency notifications** — color pulse animation or notification banner when timer is within 5 min of expiry
- ✅ **Customizable** — per-timer color, size, position
- ✅ **No performance impact** — widget fetches JSON asynchronously after page load
