# Belleful Vercel 500 Fix - TODO

## Progress Tracker
- [x] **Step 1**: Create this TODO.md (current)
- [x] **Step 2**: Edit server.js - Add global error handler & env var validation
- [x] **Step 3**: Edit config/database.js - Add DB connection retry logic
- [x] **Step 4**: Skipped - async errors already handled well
- [x] **Step 5**: Test locally: npm start successful (server running, no crash)
- [ ] **Step 6**: Instructions for Vercel env vars & redeploy
- [ ] **Step 7**: attempt_completion with results

**Next**: Step 2 - Edit server.js

**Instructions**: 
- Add required env vars to Vercel: MONGO_URI (Atlas connection string), JWT_SECRET (random 32+ chars), CLOUDINARY_CLOUD_NAME/API_KEY/SECRET, etc.
- Redeploy after changes: `vercel --prod`

