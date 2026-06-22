# Ruff Cuts App - Comprehensive Test Plan
**Date:** June 11, 2026  
**App Version:** Latest (with critical financial fixes)  
**Test Environment:** Local (http://localhost:8080) + Production (ruffcuts.app)

---

## 🔐 TEST 1: Authentication & Login System

### Test Cases:
- [ ] **1.1** Open app → verify loading screen shows → passwords load from Firebase
- [ ] **1.2** Login with owner password → verify access to all features
- [ ] **1.3** Logout → login with staff password → verify limited access
- [ ] **1.4** Change password → logout → login with NEW password → should work
- [ ] **1.5** Refresh page → verify password persists (no revert to old password)

### Expected Results:
✅ No "Can't login with passwords" error  
✅ Password changes persist across sessions  
✅ Loading screen prevents race condition  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 📱 TEST 2: Schedule Tab Mobile Responsiveness (iPhone 375px)

### Test Cases:
- [ ] **2.1** Open DevTools → Toggle device toolbar → Select iPhone 12 Pro (375px)
- [ ] **2.2** Navigate to Schedule tab → Day view
- [ ] **2.3** Add 3+ groomers on duty → calendar grid should be ~502px wide
- [ ] **2.4** Try scrolling calendar grid horizontally → should scroll ✓
- [ ] **2.5** Scroll down to Day Summary section
- [ ] **2.6** Try scrolling Day Summary horizontally → should NOT scroll ✗
- [ ] **2.7** Check Payment Collection cards → should fit within 375px
- [ ] **2.8** Check Commission Breakdown cards → should fit within 375px
- [ ] **2.9** Check Cashbox Balance card → amounts should display fully
  - Opening Balance: "₱1,000.00" (not "₱1,0...")
  - Cash Received: "₱2,300.00" (not "₱2,3...")
  - Expected Closing: "₱2,800.00" (not "₱2,80...")

### Expected Results:
✅ html has overflow-x: hidden  
✅ .cal-wrap has maxWidth: 100vw on mobile  
✅ Calendar grid scrolls independently  
✅ Day Summary cards locked to viewport (no horizontal scroll)  
✅ All amounts display fully without clipping  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 💰 TEST 3: Appointment Lifecycle with Financial Integration

### Setup:
- Starting cashbox balance: ₱0
- Create appointment: ₱1,000, Cash payment

### Test Cases:
- [ ] **3.1** Create appointment → status: "en-route" → cashbox: ₱0 (no change)
- [ ] **3.2** Cycle status to "ongoing" → cashbox: ₱0 (no change)
- [ ] **3.3** Cycle status to "completed" → cashbox: ₱1,000 (+₱1,000) ✓
- [ ] **3.4** Cycle status to "cancelled" → cashbox: ₱0 (-₱1,000) ✓
- [ ] **3.5** Cycle status back to "completed" → cashbox: ₱1,000 (+₱1,000) ✓
- [ ] **3.6** Delete appointment → cashbox: ₱0 (-₱1,000) ✓
- [ ] **3.7** Undo delete (from toast) → cashbox: ₱1,000 (+₱1,000) ✓

### Expected Results:
✅ Balance updates atomically (reverse old effect, apply new effect)  
✅ Cancelled appointments don't inflate balance  
✅ Deleted appointments reverse balance  
✅ Undo delete restores balance  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## ✏️ TEST 4: Appointment Editing with Atomic Balance Updates

### Setup:
- Create appointment: ₱1,000, Cash, completed
- Starting cashbox: ₱1,000

### Test Cases:
- [ ] **4.1** Edit cost from ₱1,000 to ₱500 → cashbox: ₱500 (reverse ₱1k, add ₱500)
- [ ] **4.2** Edit payment mode from Cash to GCash → cashbox: ₱0, GCash: ₱500
- [ ] **4.3** Edit status from completed to pending → GCash: ₱0 (reverse ₱500)
- [ ] **4.4** Edit status back to completed → GCash: ₱500 (add ₱500)
- [ ] **4.5** Edit multiple fields at once → balances accurate

### Expected Results:
✅ Old appointment's balance effect reversed  
✅ New appointment's balance effect applied  
✅ No balance drift over time  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 💵 TEST 5: Expense and Cashbox Operations

### Setup:
- Starting cashbox: ₱5,000

### Test Cases:
- [ ] **5.1** Add expense: ₱500 (Utilities, cashbox) → cashbox: ₱4,500 (-₱500)
- [ ] **5.2** Edit expense to ₱300 → cashbox: ₱4,700 (reverse ₱500, deduct ₱300)
- [ ] **5.3** Delete expense → cashbox: ₱5,000 (restore ₱300)
- [ ] **5.4** Add non-cashbox expense → cashbox: ₱5,000 (no change)
- [ ] **5.5** Quick expense from Schedule tab → deducts from cashbox immediately

### Expected Results:
✅ Cashbox expenses auto-deduct from cash balance  
✅ Editing expenses updates balance atomically  
✅ Deleting expenses restores balance  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 🏦 TEST 6: Deposits/Withdrawals and Cash Advances

### Setup:
- Starting balances: Cash ₱5,000, GCash ₱2,000, Bank ₱10,000

### Test Cases:
- [ ] **6.1** Add deposit: ₱1,000 to Bank → Bank: ₱11,000 (+₱1,000)
- [ ] **6.2** Edit deposit to ₱500 → Bank: ₱10,500 (reverse ₱1k, add ₱500)
- [ ] **6.3** Add withdrawal: ₱2,000 from GCash → GCash: ₱0 (-₱2,000)
- [ ] **6.4** Give cash advance: ₱500 to staff → Cash: ₱4,500 (-₱500)
- [ ] **6.5** Edit cash advance to ₱300 → Cash: ₱4,700 (reverse ₱500, deduct ₱300)
- [ ] **6.6** Delete cash advance → Cash: ₱5,000 (restore ₱300)

### Expected Results:
✅ All entries editable and removable  
✅ Balance updates atomic  
✅ Deposits increase, withdrawals decrease  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 📊 TEST 7: Commission Calculations

### Setup:
- Create 3 appointments for Groomer "Rhian":
  - Appt 1: ₱1,000, completed, Cash payment → commission ₱100
  - Appt 2: ₱500, completed, NO payment → commission ₱0
  - Appt 3: ₱800, pending, Cash payment → commission ₱0

### Test Cases:
- [ ] **7.1** Check Today tab commission breakdown → Rhian: ₱100 (only Appt 1)
- [ ] **7.2** Mark Appt 2 payment as Cash → commission: ₱150 (₱100 + ₱50)
- [ ] **7.3** Check Schedule tab commission → matches Today tab
- [ ] **7.4** Cancel Appt 1 → commission: ₱50 (only Appt 2)
- [ ] **7.5** Total commissions match sum of individual groomers

### Expected Results:
✅ Commission only calculated for completed AND paid appointments  
✅ Unpaid appointments excluded  
✅ Pending appointments excluded  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 📈 TEST 8: Profit Reporting (Cash vs Accrual)

### Setup:
- Revenue: ₱10,000
  - Paid (Cash + GCash): ₱7,000
  - Unpaid: ₱3,000
- Expenses: ₱2,000
- Commission: ₱700
- Salaries: ₱1,500
- Owner salary: ₱500

### Test Cases:
- [ ] **8.1** Today tab → check "Net Cash Profit"
  - Should be: ₱7,000 - ₱2,000 - ₱700 - ₱1,500 - ₱500 = ₱2,300
- [ ] **8.2** End of Day modal → check "Net Accrual Profit"
  - Should be: ₱10,000 - ₱2,000 - ₱700 - ₱1,500 - ₱500 = ₱5,300
- [ ] **8.3** Mark unpaid appointment as paid → cash profit increases
- [ ] **8.4** Verify revenue breakdown matches payment collection

### Expected Results:
✅ Cash profit uses collected revenue only (₱7,000)  
✅ Accrual profit includes unpaid appointments (₱10,000)  
✅ Both calculations accurate  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 🎨 TEST 9: UI/UX Elements

### Test Cases:
- [ ] **9.1** Schedule tab → click magnifying glass → filter popup shows (dark background)
- [ ] **9.2** Filter popup → shows groomers on duty, cashbox info, date
- [ ] **9.3** Bottom nav → Services icon is scissors (not old icon)
- [ ] **9.4** Today tab → no orange FAB peeking from bottom
- [ ] **9.5** Today tab → no black bar at bottom
- [ ] **9.6** All modals → display correctly on mobile (no clipping)
- [ ] **9.7** End of Day modal → cashbox card fits screen

### Expected Results:
✅ All UI fixes from past 48 hours working  
✅ No visual regressions  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 💾 TEST 10: Data Persistence (NO DATA LOSS)

### Test Cases:
- [ ] **10.1** Create test appointment → refresh page → appointment still there
- [ ] **10.2** Add client → refresh → client persists
- [ ] **10.3** Add staff member → refresh → staff persists
- [ ] **10.4** Add expense → refresh → expense persists
- [ ] **10.5** Update cashbox balance → refresh → balance persists
- [ ] **10.6** Change password → refresh → password persists
- [ ] **10.7** Check Firebase console → all data synced
- [ ] **10.8** Close tab → reopen after 1 hour → all data intact

### Expected Results:
✅ All data persists to Firebase  
✅ No data loss on refresh  
✅ "Synced" indicator shows after changes  
✅ Firebase debounce working (1000ms timeout)  

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Passed | ⬜ Failed

---

## 📋 Test Summary

| Test | Status | Pass/Fail | Notes |
|------|--------|-----------|-------|
| 1. Authentication | ⬜ | ⬜ | |
| 2. Mobile Responsiveness | ⬜ | ⬜ | |
| 3. Appointment Lifecycle | ⬜ | ⬜ | |
| 4. Appointment Editing | ⬜ | ⬜ | |
| 5. Expenses | ⬜ | ⬜ | |
| 6. Deposits/Advances | ⬜ | ⬜ | |
| 7. Commissions | ⬜ | ⬜ | |
| 8. Profit Reporting | ⬜ | ⬜ | |
| 9. UI/UX | ⬜ | ⬜ | |
| 10. Data Persistence | ⬜ | ⬜ | |

---

## 🐛 Issues Found

*(Document any bugs or issues discovered during testing)*

### Issue Template:
```
**Issue #:** 
**Severity:** Critical | High | Medium | Low
**Component:** 
**Description:** 
**Steps to Reproduce:**
1. 
2. 
3. 
**Expected:** 
**Actual:** 
**Screenshot/Evidence:** 
```

---

## ✅ Sign-Off

**Tested By:** Claude Sonnet 4.5  
**Date:** June 11, 2026  
**Overall Status:** ⬜ All Tests Passed | ⬜ Issues Found | ⬜ Blocked  
**Production Ready:** ⬜ Yes | ⬜ No | ⬜ With Conditions  

**Notes:**
