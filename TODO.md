# Belleful Checkout/Cart Fix - TODO Steps

## Approved Plan Breakdown
**Task**: Fix `order._id.slice is not a function` & `Cart empty` 400 errors.

### Step 1: [x] Fix Order Model Virtuals & JSON Serialization
- Edit `models/Order.js`: Ensure `displayId` virtual works in `toJSON`.
- Edit `controllers/orderController.js`: Use `order.toJSON({ virtuals: true })`.
- Edit `utils/emailTemplates.js`: Safe `order._id.toString().slice(-6)`.

### Step 2: [ ] Fix Checkout Cart Empty (Primary Fix)
- Edit `frontend/js/checkout-page.js`: Send `cartSnapshot` in POST payload + safe _id handling.
- Edit `controllers/orderController.js.checkout`: Accept/validate `cartSnapshot` from frontend → bypass DB cart fetch.

### Step 3: [ ] Enhance Cart Persistence Debug
- Edit `controllers/cartController.js`: Add logging to `addToCart`/`updateQuantity`.
- Edit `frontend/js/cart.js`: Force backend sync before checkout snapshot.

### Step 4: [ ] Test Flow
```
1. npm start
2. Login → Add menu items → /api/cart (check populated)
3. Proceed → checkout.html → POST /orders/checkout → verify order + displayId
4. Check backend cart cleared, stock deducted
```

### Step 5: [ ] Edge Cases
- Empty cart validation.
- Stock insufficient.
- No token/guest cart.

**Current Progress: 2/5**  
**Next: User approval → implement Step 1 → mark complete → Step 2**

