# ParkEase — Frontend

> Smart parking platform frontend built with Angular 21 and Tailwind CSS, deployed on Vercel.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](https://vercel.com/)

**Live App:** [parkease-frontend-zeta.vercel.app](https://parkease-frontend-zeta.vercel.app)  
**Backend API:** [parkease-api-gateway.onrender.com](https://parkease-api-gateway.onrender.com)  
**Backend Repo:** [github.com/VaidikPandey/ParkEase](https://github.com/VaidikPandey/ParkEase)

---

## Features

### Driver
- Register / login with email+password or Google OAuth2
- Search parking lots by city or current GPS location
- Browse available spots with real-time availability
- Book a spot with date/time selection and vehicle plate
- Pay securely via Razorpay
- Check-in, check-out, extend or cancel bookings
- In-app notifications for every booking event
- Personal booking history and analytics dashboard

### Manager
- Submit new parking lots for admin review
- Manage lot details, spot configuration and pricing
- View occupancy, utilisation and hourly traffic charts
- Receive capacity threshold alerts

### Admin
- Approve or reject pending parking lot submissions
- Manage all users
- Send bulk notifications
- Platform-wide analytics and revenue reporting

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Angular 21 (standalone components, lazy-loaded routes) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js 4 + ng2-charts |
| Testing | Jest + jest-preset-angular |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Run Locally

```bash
git clone https://github.com/VaidikPandey/ParkEase-Frontend.git
cd ParkEase-Frontend
npm install --legacy-peer-deps
npm start
```

App runs at `http://localhost:4200` and proxies all `/api` requests to `http://localhost:8080` (the API gateway). Make sure the backend is running locally or point the proxy to the live API.

### Point to Live API

To use the deployed backend while running the frontend locally, update `proxy.conf.json`:

```json
{
  "/api": {
    "target": "https://parkease-api-gateway.onrender.com",
    "secure": true,
    "changeOrigin": true
  }
}
```

### Run Tests

```bash
npm test
```

---

## Project Structure

```
src/app/
├── core/
│   ├── interceptors/      # JWT auth interceptor, refresh token interceptor
│   ├── models/            # TypeScript interfaces for all API types
│   └── services/          # auth, booking, parking, payment, notification,
│                          #   analytics, vehicle, toast, theme, loading
├── features/
│   ├── landing/           # Public home page
│   ├── login/             # Login + registration form
│   ├── oauth-callback/    # Google OAuth2 callback handler
│   ├── choose-role/       # Role selection after OAuth signup
│   ├── dashboard/         # Role-aware dashboard
│   ├── slots/             # Parking lot search and spot booking
│   ├── bookings/          # Booking history and management
│   ├── vehicle-panel/     # Saved vehicles management
│   ├── analytics/         # Charts (occupancy, utilisation, revenue)
│   ├── notifications/     # In-app notification feed
│   ├── profile/           # User profile and settings
│   ├── users/             # Admin user management
│   └── send-notification/ # Admin bulk notification panel
├── layout/
│   └── shell/             # Authenticated shell (sidebar + navbar)
└── shared/
    ├── components/        # Reusable UI components
    └── directives/        # Custom Angular directives
```

---

## Auth Flow

```
Email/Password ──► POST /api/v1/auth/login ──► JWT stored in localStorage
                                                       │
Google OAuth2 ──► GET /oauth2/authorization/google     │
                       │                               │
                  Backend handles Google callback       │
                       │                               ▼
                  Redirect to /oauth-callback ──► Token extracted ──► Dashboard
```

JWT is attached to every request via an `HttpInterceptor`. A refresh interceptor automatically retries failed requests after obtaining a new access token.

---

## Deployment

Deployed on **Vercel** with automatic deploys on push to `main`.

Build configuration (`vercel.json`):
- Build: `ng build --configuration production`
- Output: `dist/parkease-frontend/browser`
- SPA rewrites: all routes fall back to `index.html`

The production API URL is configured via Vercel environment variables.

---

## Author

**Vaidik Pandey**  
[GitHub](https://github.com/VaidikPandey)
