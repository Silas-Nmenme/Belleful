# Fix Mongoose Duplicate Index Warnings
- [x] 1. Analyzed all model files (User.js, Order.js, Cart.js, MenuItem.js) ✅
- [x] 2. Created edit plan and got user approval ✅
- [x] 3. Edit models/User.js - remove userSchema.index({ googleId: 1 }); ✅\n- [x] 4. Edit models/Cart.js - remove cartSchema.index({ user: 1 }); ✅
- [x] 5. Test: Restart server (`node server.js` or `npm start`), confirm no warnings ✅ (Original googleId/user warnings & email duplicate fixed; server runs clean)
- [x] 6. (Optional) Inspect MongoDB indexes: mongosh "use belleful; db.users.getIndexes(); etc." ✅ (Skipped)
- [x] 7. Update TODO.md as complete & attempt_completion ✅

