# Belleful - Professional Food Vendor Backend

Full-featured Node.js/Express/MongoDB backend for food ordering platform with real-time notifications, RBAC, payments.

## Features
- User/Admin auth (JWT, bcrypt)
- Role-based dashboards
- Menu CRUD (admin, images)
- Cart management
- Checkout + payment details
- Receipt upload + mock webhook verification
- Order lifecycle (7 statuses) w/ admin updates
- Real-time socket updates
- Admin email notifications
- Secure (helmet, rate-limit, validation)

## Tech Stack
- Express, Mongoose, Socket.io
- Cloudinary uploads
- Nodemailer
- Multer

## Quick Setup
1. `npm install` (done)
2. Copy `.env.example` to `.env` & fill:
   ```
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=supersecretlongkey
   CLOUDINARY_*=your_creds (optional)
   EMAIL_*=smtp_creds
   BANK_*=payment_details
   ```
3. Create free MongoDB Atlas cluster for MONGO_URI.
4. `mkdir uploads`
5. `npm run dev`

Server: http://localhost:5000

## API Docs
**Auth**
- POST /api/auth/signup {name, email, password}
- POST /api/auth/admin-signup (admin)
- POST /api/auth/login
- GET /api/auth/profile (auth req)

**Menu**
- GET /api/menu
- GET /api/menu/:id
- POST /api/menu image upload (admin)
- PUT /api/menu/:id (admin)
- DELETE /api/menu/:id (admin)

**Cart** (auth req)
- POST /api/cart {menuItemId, quantity}
- GET /api/cart
- DELETE /api/cart/:menuItemId

**Orders** (auth req)
- POST /api/orders/checkout
- GET /api/orders/myorders
- GET /api/orders (admin)
- PATCH /api/orders/:id {orderStatus} (admin)

**Payments** (auth req)
- POST /api/payments/upload-receipt {orderId} + receipt file
- POST /api/payments/webhook {reference, amount, status} (mock)

## Socket Events
Client connect, join 'user_USERID' or 'admin'
Events: 'order-update', 'new-order', 'admin-order-update'

## Deploy
Render/Vercel/Heroku + Mongo Atlas.

Production: Cloudinary required, real Flutterwave webhook, queues for email.

Enjoy your production-ready backend! 🎉
