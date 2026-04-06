# Cart-Checkout-Approval Flow Fix - TODO

## Approved Plan Steps (User Confirmed)

### Backend Fixes (Priority 1)
- [x] **Step 1**: Update controllers/orderController.js - ✅ Added approvePendingPayment(), checkout validation.
- [x] **Step 2**: ✅ paymentController.js calls approvePendingPayment() post-upload.

### Frontend Admin UI (Priority 2)
- [ ] **Step 5**: frontend/js/admin-dashboard.js - Add approve/reject buttons per row.
- [ ] **Step 3**: Enhance orderController.updateStatus with validation transitions + emails.
- [ ] **Step 4**: models/Order.js - Add pre-save middleware for status logic.

### Frontend Admin UI (Priority 2)
- [ ] **Step 5**: frontend/js/admin-dashboard.js - Add approve/reject buttons per row, status dropdown, call updateOrderStatus.
- [ ] **Step 6**: Update admin-dashboard.html if needed for modals/buttons.

### Frontend User Flows (Priority 3)
- [ ] **Step 7**: frontend/js/checkout-page.js - Post-upload polling for status, live updates.
- [ ] **Step 8**: frontend/js/dashboard.js - Add order status polling every 30s.

### Testing & Completion
- [ ] **Step 9**: Test full flow end-to-end.
- [ ] **Step 10**: attempt_completion.

**Current Progress: Starting Step 1**

