# Fix Admin Image Upload 500 Error - Approved Plan

## Completed Steps
- [x] Gathered diagnosis from file analysis and search
- [x] User confirmed plan + provided Cloudinary .env (creds valid)

## Steps to Complete

### 1. **Server Restarted** ✓ COMPLETE
✅ Server running port 1500, MongoDB connected, Email ready


### 2. **Enhanced Logging** ✓ COMPLETE
- Added detailed console.log for /upload-url (user/role/cloudinary)
- Server logs now show exact failure (preset/auth/env)

**🚀 LIVE TEST IN PROGRESS** 
1. Login admin → Admin Dashboard → Add menu + image
2. **Copy server logs** here (🔍/💥 lines)
3. Check Network tab → /menu/upload-url status/response


### 3. **Verify/Install Cloudinary Preset**
- Login Cloudinary dashboard (dtwele294)
- Settings → Upload → Unsigned presets → Add 'belleful-uploads' (allow *.*)

### 4. **Restart Server**
```
npm run dev
```

### 5. **Test Admin Role & Full Flow**
- Login admin → Network tab → Add menu with image → Check console

### 6. **Edge Case Fixes**
- Add server health check for Cloudinary
- Fallback image handling

## Commands Ready
```
# Test endpoint (get token first from login)
curl -H "Authorization: Bearer TOKEN" http://localhost:1500/api/menu/upload-url?folder=menu

# Restart
npm run dev
```

