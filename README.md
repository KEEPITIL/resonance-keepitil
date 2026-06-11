# ◈ RESONANCE — EDM Ticketing & DJ Booking Platform

California's underground EDM event ticketing and DJ booking marketplace. 18+ only.

## Stack
- **Frontend**: React 18, React Router v6, TanStack Query, Stripe.js, Leaflet, Recharts
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Auth**: JWT (RS256), bcryptjs, role-based access (attendee / dj / organizer / admin)
- **Payments**: Stripe (PaymentIntents, Connect, Webhooks) — 2.5% platform fee
- **Storage**: AWS S3 (profile photos, banners, event covers, QR codes, gallery)
- **Email**: SendGrid (welcome, ticket confirmation, booking alerts, password reset)
- **Deploy**: Railway (backend) + Vercel (frontend)

## Features
- Event discovery with genre, city, date, type filters
- California map (Leaflet) with neon venue markers
- DJ marketplace with customizable profiles (colors, fonts, banners, social links, music widgets)
- Ticket purchasing with Stripe (age verification gate, QR code generation)
- My Tickets dashboard with scannable QR codes
- DJ booking inquiry system (organizer → DJ, with messaging)
- Organizer analytics dashboard (revenue charts, per-event breakdown)
- Mobile bottom nav (3 tabs) + desktop top nav
- Dark neon EDM design system (Magenta #CC0088, Cyan, Purple, Orange)

## Revenue Model
- 2.5% platform fee on all ticket sales (deducted via Stripe before payout)
- 2.5% platform fee on DJ booking fees

## Setup
See [DEPLOY.md](./DEPLOY.md) for full deployment instructions.

```
resonance/
├── backend/
│   ├── src/
│   │   ├── models/          User, DJProfile, Event, Booking (Ticket + DJBooking), Organization
│   │   ├── controllers/     auth, dj, event, ticket, booking, analytics
│   │   ├── routes/          auth, djs, events, tickets, bookings, analytics
│   │   ├── middleware/       auth (JWT + RBAC), errorHandler
│   │   ├── services/        stripeService, s3Service, emailService
│   │   ├── utils/           logger
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/           Discover, Explore, EventDetail, DJMarketplace, DJProfile,
    │   │                    DJProfileEditor, CheckoutPage, MyTickets, TicketDetail,
    │   │                    Dashboard, CreateEvent, BookingsList, Login, Register, Profile
    │   ├── components/      Layout (DesktopNav + MobileNav), EventCard, DJCard
    │   ├── context/         AuthContext
    │   ├── utils/           api.js (axios client + all API calls)
    │   └── styles/          global.css (design system)
    ├── vercel.json
    └── package.json
```
