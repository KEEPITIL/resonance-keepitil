# RESONANCE — Local Testing Guide

## Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier works)
- Stripe account (test mode)

---

## 1. Set Up MongoDB

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. **Database Access** → Add user → username + password
4. **Network Access** → Add IP → Allow from anywhere (`0.0.0.0/0`) for dev
5. **Connect** → Drivers → Node.js → copy the connection string
6. Paste into `backend/.env` as `MONGODB_URI`

---

## 2. Set Up Stripe (Test Mode)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure **Test mode** is toggled ON
3. **Developers → API Keys** → copy both keys
4. Paste `sk_test_...` as `STRIPE_SECRET_KEY` in `backend/.env`
5. Paste `pk_test_...` as `REACT_APP_STRIPE_PUBLISHABLE_KEY` in both env files

For webhook testing (optional):
```bash
npm install -g stripe
stripe login
stripe listen --forward-to localhost:5000/api/tickets/webhook
# Copy the whsec_... key into backend/.env as STRIPE_WEBHOOK_SECRET
```

---

## 3. Install Dependencies

```bash
# Terminal 1 — Backend
cd resonance/backend
npm install

# Terminal 2 — Frontend  
cd resonance/frontend
npm install
```

---

## 4. Start the App

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd resonance/backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd resonance/frontend
npm start
```

Open **http://localhost:3000**

---

## 5. Test Checklist

### Auth
- [ ] Register as **attendee** → verify you land on Discover
- [ ] Register as **organizer** → verify Dashboard link appears in nav
- [ ] Register as **dj** → verify DJ Profile Editor appears
- [ ] Register as **admin** → verify ◈ Admin: External Events appears

To create an admin, register normally then update the user in MongoDB Atlas:
```
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

### Events
- [ ] Login as organizer → Create Event → fill all fields → Publish
- [ ] Verify event appears on Discover page
- [ ] Click event → EventDetail page loads
- [ ] Click "Get Tickets" → Checkout page loads

### Ticketing (Stripe Test)
- [ ] On Checkout, use test card: `4242 4242 4242 4242`, any exp, any CVC
- [ ] Verify ticket created → redirects to My Tickets
- [ ] Click ticket → QR code displays

### External Events (Admin)
- [ ] Login as admin
- [ ] Nav → ◈ Admin: External Events
- [ ] Create tab → add an event with lat/lng for LA: `34.0522 / -118.2437`
- [ ] Verify event appears on Discover (All Events) and Explore map

### Explore Map
- [ ] Navigate to /explore
- [ ] Verify California map loads with dark CartoDB tiles
- [ ] External events show as colored neon dots by source platform
- [ ] Click a dot → popup with "View on [Platform]" button

### DJ Marketplace
- [ ] /djs page loads DJ cards
- [ ] Login as DJ → /dj/profile-editor → save profile
- [ ] Verify DJ appears in marketplace

### Seasonal Theme
- [ ] Verify Pride theme active (June = `--magenta: #FF2D78`, rainbow accents)
- [ ] Test URL override: add `?theme=halloween` to any URL
- [ ] Dismiss banner → refresh → banner stays dismissed
- [ ] New month override: `?theme=newyear`

---

## 6. Known Skippable Services (for initial test)

- **AWS S3** — Image uploads will fail but everything else works
- **SendGrid** — Emails won't send but no crashes (errors are caught)
- Both are gracefully handled and won't break the UI

---

## 7. Useful Test Data

**Stripe test cards:**
| Card | Description |
|------|-------------|
| `4242 4242 4242 4242` | Visa — succeeds |
| `4000 0000 0000 9995` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

**Test DJ embed URLs (for DJ profile widgets):**
- SoundCloud: any `soundcloud.com/tracks/...` URL
- YouTube: any `youtube.com/watch?v=...` URL

---

## 8. Backend Health Check

With the backend running, verify at:
```
http://localhost:5000/health
```
Should return: `{ "status": "ok", "service": "RESONANCE API", ... }`
