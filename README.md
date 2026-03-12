# Belleful - Real-Time Food Ordering Platform

## Backend (Node.js/Express/MongoDB/Socket.io)
Professional backend with real-time order updates via Socket.io.

### Setup\n1. `npm install`\n2. Copy `.env.example` to `.env` & configure **all required vars**:\n   ```bash\n   # Database & Auth (REQUIRED)\n   MONGO_URI=your_mongodb_uri\n   JWT_SECRET=your_super_secret_key_32chars_min\n   \n   # Google OAuth (REQUIRED for social login)\n   GOOGLE_CLIENT_ID=xxx.googleusercontent.com\n   GOOGLE_CLIENT_SECRET=xxx\n   GOOGLE_REDIRECT_URI=https://your-vercel-url.vercel.app/api/auth/google/callback\n   \n   # Email (OPTIONAL but recommended for OTP)\n   EMAIL_HOST=smtp.gmail.com\n   EMAIL_PORT=587\n   EMAIL_USER=yourapp@gmail.com\n   EMAIL_PASS=your_app_password\n   ```\n   \n   **Google OAuth Setup:**\n   1. Google Cloud Console → New OAuth 2.0 Client ID\n   2. Authorized redirect: `https://your-vercel-app.vercel.app/api/auth/google/callback`\n   3. Copy Client ID/Secret to .env\n   \n3. `npm run dev` → http://localhost:3500

**API Docs**: See original README section.

## Frontend Dashboard (Vite + Vanilla JS)
**How to Open** (novice-friendly):
1. Terminal 1 (backend): `npm run dev`
2. Terminal 2 (frontend): `cd frontend && npm install && npm run dev`
3. Browser opens http://localhost:3000 automatically.
4. Register/login (customer/admin).
5. **Test Real-Time**:
   - User tab: Place order via API (Postman/curl), see live status.
   - Admin tab: Update status → user sees instantly!

**No React** - Pure HTML/JS + dynamic import for Socket.io.

## Real-Time Features Added
- Live order status updates (user/admin rooms).
- New order notifications (admin).
- Secure token auth on sockets (next).

## Test Flow
```
1. Start backend
2. Frontend dev server
3. Register customer → login
4. Use Postman POST /api/orders/checkout (auth header)
5. Admin login → see new order live
6. Admin change status → customer sees update instantly!
```

Fully functional real-time app! 🎉

**Next**: Socket auth, chat. Run frontend to test now: `cd frontend && npm run dev`
