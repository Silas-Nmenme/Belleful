# Belleful - Real-Time Food Ordering Platform 🚀

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB-brightgreen)](https://belleful-fphf.vercel.app)
[![Real-time](https://img.shields.io/badge/Real--time-Socket.io-blueviolet)](https://socket.io/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20HTML%2FJS-orange)](https://vitejs.dev/)

Professional real-time food ordering app with customer dashboard, admin panel, payments, and live order updates.

## 🎯 Features
- **Customer Flow**: Browse menu → Add to cart → Checkout → Live order tracking
- **Admin Panel**: Manage menu/orders/users, live notifications, stats
- **Real-time**: Socket.io order status updates (customer ↔ admin)
- **Auth**: Email/OTP + Google OAuth
- **Payments**: Stripe-ready (webhook + receipt upload)
- **Secure**: JWT auth, role middleware (admin/user)

## 📋 Table of Contents
- [Backend Setup](#backend)
- [Frontend Dashboard](#frontend)
- [API Reference](#api)
- [Socket.io Real-time](#socketio)
- [Testing Flow](#testing)
- [Environment Variables](#env)
- [Deployment](#deployment)

## 🖥️ Backend (Node.js/Express/MongoDB/Socket.io)

### Setup
```bash
1. npm install
2. cp .env.example .env  # Configure below
npm run dev  # http://localhost:1000 | Live: https://belleful-fphf.vercel.app
```

### Environment Variables {#env}
```bash
# Database & Auth (REQUIRED)
MONGO_URI=mongodb://...  # or MongoDB Atlas
JWT_SECRET=your_super_secret_key_32chars_min

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=xxx.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3500/api/auth/google/callback (dev) \| https://belleful-fphf.vercel.app/api/auth/google/callback (prod)
# or https://your-app.vercel.app/api/auth/google/callback (prod)

# Email (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourapp@gmail.com
EMAIL_PASS=app_password

# Payments (Stripe webhook verify)
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:3000 (dev) \| https://bellefulchop.netlify.app (prod)
```

**Google OAuth Setup**:
1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 Client ID
2. Redirect URI: `https://belleful-fphf.vercel.app` 
3. Copy ID/Secret to `.env`


Auto-opens tabs: **Customer** | **Admin**. Real-time order sync!

## 📚 API Reference {#api}
**Base URL** (dev): `http://localhost:1000/api` | **Production**: `https://belleful-fphf.vercel.app/api`

All endpoints use JSON. **Auth**: `Authorization: Bearer <token>` (from login).

### Authentication `/auth`
| Method | Endpoint | Auth | Description | Example Request | Example Response |
|--------|----------|------|-------------|-----------------|------------------|
| POST | `/signup` | Public | Register customer | `{"name":"John","email":"john@example.com","password":"123456"}` | `{"message":"OTP sent","user":{...}}` |
| POST | `/admin-signup` | Public | Register admin | Same as signup | Same |
| POST | `/verify-otp` | Public | Verify signup OTP | `{"email":"...","otp":"123456"}` | `{"token":"jwt...","user":{...}}` |
| GET | `/google` | Public | Google login init | - | Redirect to Google |
| GET | `/google/callback` | Public | Google callback | - | `{"token":"jwt..."}` |
| POST | `/login` | Public | Email login | `{"email":"...","password":"..."}` | `{"token":"jwt...","user":{...}}` |
| GET | `/profile` | Auth | Get profile | - | `{"user":{...}}` |

### Menu `/menu` (Public browse)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List all items |
| GET | `/:id` | Public | Single item |
| POST | `/` | Admin | Create item |
| PUT | `/:id` | Admin | Update |
| DELETE | `/:id` | Admin | Delete |

**Ex**: `GET /api/menu` → `[{"_id":"...","name":"Burger","price":12.99,...}]`

### Cart `/cart`
| Method | Endpoint | Auth | Description | Body |
|--------|----------|------|-------------|------|
| POST | `/` | Auth | Add item | `{"menuItemId":"...","quantity":2}` |
| GET | `/` | Auth | Get cart | - |
| DELETE | `/:menuItemId` | Auth | Remove | - |

### Orders `/orders`
| Method | Endpoint | Auth | Description | Body |
|--------|----------|------|-------------|------|
| POST | `/checkout` | Auth | Create order | `{"items":[{id, qty}],"address":"..."}` |
| GET | `/myorders` | Auth | User orders | - |
| GET | `/` | Admin | All orders | - |
| PATCH | `/:id` | Admin | Update status | `{"status":"preparing"}` |

### Payments `/payments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload-receipt` | Auth | Upload payment proof | Multipart form: `receipt` file |
| POST | `/webhook` | Public | Stripe webhook | Stripe sig header |

### Dashboard `/dashboard`
**Admin**:
- GET `/admin/stats` → Revenue/users/orders
- GET `/admin/users` → User list
- GET `/admin/orders` → Orders

**User**:
- GET `/user/stats` → Personal stats
- GET `/user/orders`
- GET `/user/profile`
- GET `/user/cart`
- GET `/user/payments`

**Errors**: `{ "error": "Message", "code": 400 }` (validation), 401 Unauthorized, 403 Forbidden, 404 Not Found.

## 🔌 Socket.io Real-time {#socketio}
**Connect** (dev): `io("ws://localhost:3500", { auth: { token: "jwt..." } })` \| (prod): `io("wss://belleful-fphf.vercel.app", { auth: { token: "jwt..." } })`

**Rooms**: `user_123` (customer), `admin`  
**Events**:
- `order:updated` → `{order: {...}, status: "delivered"}`
- `order:new` (admin) → New order notification

Live sync between tabs!

## 🧪 Test Flow {#testing}
1. Backend: `npm run dev`
2. Frontend: `cd frontend && npm run dev`
3. **Customer** tab → Signup/Login → Browse → Checkout
4. **Admin** tab → See new order **live** → Update status
5. Customer sees **instant** update! 🎉

**Postman**: Import endpoints above, use token from login.

## 🚀 Deployment {#deployment}
**Backend (Vercel)**:
```bash
npm i -g vercel
vercel --prod
# Update GOOGLE_REDIRECT_URI + FRONTEND_URL
```

**Frontend (Netlify/Vercel)**:
- Build: `npm run build`
- Proxy API calls to backend URL

**MongoDB**: Use Atlas free tier.

Fully production-ready! Run now: `npm run dev` → Test real-time magic.

**Next**: Push notifications, inventory mgmt. Questions? Open issue! 👨‍💻
