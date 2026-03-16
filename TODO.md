# Vercel Deployment Fix: Direct Cloudinary Uploads (No Multer)

Status: Completed Backend Changes

## Completed Steps
- [x] Update `config/cloudinary.js`: Add `getUploadUrl()`
- [x] Add upload-url routes in routes/menu.js and routes/payments.js 
- [x] Delete `middleware/multerConfig.js`
- [x] Update `routes/menu.js`: Remove `upload.single()`
- [x] Update `controllers/menuController.js`: Use `req.body.imageUrl`
- [x] Update `controllers/paymentController.js`: Use `req.body.receiptUrl`

## Next Steps
7. [ ] **Test locally**:
   ```
   npm install
   npm start
   ```
   - Test `/api/menu/upload-url` GET → expect {url, fields}
   - Test `/api/payments/receipt-upload-url` GET
   - POST /api/menu (admin auth) with {..., \"imageUrl\": \"https://res.cloudinary.com/...\" }

8. [ ] Create Cloudinary unsigned preset 'belleful-uploads'

9. [ ] `vercel --prod` deploy

10. [ ] Update frontend forms for direct upload

## Production Ready
✅ No disk writes, no Multer, no EROFS errors
✅ Upload URLs ready for frontend
✅ Controllers validate Cloudinary URLs + delete old images
