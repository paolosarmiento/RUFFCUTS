# 🧪 MANUAL TESTING GUIDE - Financial Systems
**App:** Ruff Cuts (https://ruffcuts.app)  
**Date:** June 11, 2026  
**Tester:** You (Owner)  
**Critical Fixes Being Tested:** Atomic balance management for appointments

---

## 📱 SETUP

**Before Starting:**
1. Open https://ruffcuts.app on your iPhone
2. Login with your owner password
3. Have a notepad ready to record balance changes
4. Today's date should be visible
5. Navigate to **Today** tab

---

# TEST SUITE 1: APPOINTMENT LIFECYCLE WITH BALANCES

## 🎯 **Objective:** Verify balances update correctly when appointment status changes

### **📊 Starting State**
Record your current balances BEFORE starting:

```
Starting Balances (Record these):
┌─────────────────────┬─────────────┐
│ Cash on Hand        │ ₱__________ │
│ GCash Balance       │ ₱__________ │
│ Bank Balance        │ ₱__________ │
└─────────────────────┴─────────────┘
```

---

### **TEST 1.1: Create Appointment (No Balance Change Expected)**

**Steps:**
1. ✅ Tap **"+"** button (Add Appointment)
2. ✅ Fill in appointment details:
   ```
   Client: Test Client 1
   Pet: Test Dog
   Service: Full Groom
   Cost: ₱1,000
   Payment Mode: Cash
   Time: 10:00 AM
   Groomer: (Select any groomer)
   ```
3. ✅ Save appointment
4. ✅ Check appointment status: Should be **"En-route"**

**Expected Result:**
- ✅ Appointment created
- ✅ Cash balance: **NO CHANGE** (₱0 change)
- ❌ Should NOT add ₱1,000 yet (not completed)

**Record:**
```
After Create:
Cash Balance: ₱__________ (Expected: Same as starting)
Change: ₱__________ (Expected: ₱0)
✅ Pass / ❌ Fail
```

---

### **TEST 1.2: Mark as Completed (Balance Should Increase)**

**Steps:**
1. ✅ Find the appointment you just created
2. ✅ Tap on the appointment to cycle status
3. ✅ Cycle through: En-route → Ongoing → **Completed**
4. ✅ Check status shows **"Completed"** ✓

**Expected Result:**
- ✅ Status changed to "Completed"
- ✅ Cash balance: **+₱1,000** (increased)

**Record:**
```
After Marking Completed:
Cash Balance: ₱__________ 
Change: ₱__________ (Expected: +₱1,000)
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** The ₱1,000 should NOW appear in your cashbox!

---

### **TEST 1.3: Cancel Appointment (Balance Should Reverse)**

**Steps:**
1. ✅ Tap the same appointment again to cycle status
2. ✅ Cycle to **"Cancelled"**
3. ✅ Watch the cash balance

**Expected Result:**
- ✅ Status changed to "Cancelled"
- ✅ Cash balance: **-₱1,000** (reversed/decreased)
- ✅ Balance returns to starting amount

**Record:**
```
After Cancelling:
Cash Balance: ₱__________ 
Change: ₱__________ (Expected: -₱1,000 from previous)
Back to starting? ✅ Yes / ❌ No
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** This is the BIG FIX! Before, cancelled appointments would KEEP the money in cashbox. Now it should REMOVE it!

---

### **TEST 1.4: Mark Completed Again (Balance Should Increase Again)**

**Steps:**
1. ✅ Tap appointment again
2. ✅ Cycle back to **"Completed"**

**Expected Result:**
- ✅ Cash balance: **+₱1,000** (increased again)

**Record:**
```
After Re-Completing:
Cash Balance: ₱__________ 
Change: ₱__________ (Expected: +₱1,000)
✅ Pass / ❌ Fail
```

---

### **TEST 1.5: Delete Appointment (Balance Should Reverse)**

**Steps:**
1. ✅ Find the appointment
2. ✅ Tap the **X** button (delete)
3. ✅ Watch the toast message appear: "Test Dog deleted"
4. ✅ Check cash balance

**Expected Result:**
- ✅ Appointment deleted
- ✅ Cash balance: **-₱1,000** (reversed)
- ✅ Toast shows "Test Dog deleted" with UNDO button

**Record:**
```
After Deleting:
Cash Balance: ₱__________ 
Change: ₱__________ (Expected: -₱1,000)
Back to starting? ✅ Yes / ❌ No
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** This is another BIG FIX! Deleting should REMOVE money from cashbox.

---

### **TEST 1.6: Undo Delete (Balance Should Restore)**

**Steps:**
1. ✅ Quickly tap **"UNDO"** in the toast (before it disappears)
2. ✅ Appointment should reappear
3. ✅ Check cash balance

**Expected Result:**
- ✅ Appointment restored
- ✅ Status still "Completed"
- ✅ Cash balance: **+₱1,000** (restored)

**Record:**
```
After Undo:
Cash Balance: ₱__________ 
Change: ₱__________ (Expected: +₱1,000)
Appointment visible? ✅ Yes / ❌ No
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** Undo should restore BOTH appointment AND balance!

---

### **✅ TEST 1 SUMMARY**

```
TEST 1: APPOINTMENT LIFECYCLE
┌────────────────────────────────┬──────────────────┬──────────┐
│ Action                         │ Expected Change  │ Result   │
├────────────────────────────────┼──────────────────┼──────────┤
│ 1.1 Create appointment         │ ₱0               │ ☐ Pass   │
│ 1.2 Mark completed             │ +₱1,000          │ ☐ Pass   │
│ 1.3 Cancel                     │ -₱1,000          │ ☐ Pass   │
│ 1.4 Complete again             │ +₱1,000          │ ☐ Pass   │
│ 1.5 Delete                     │ -₱1,000          │ ☐ Pass   │
│ 1.6 Undo delete                │ +₱1,000          │ ☐ Pass   │
└────────────────────────────────┴──────────────────┴──────────┘

Final Balance: ₱__________
Expected: Starting + ₱1,000 (one completed appointment)
Match? ✅ Yes / ❌ No
```

---

# TEST SUITE 2: APPOINTMENT EDITING WITH ATOMIC UPDATES

## 🎯 **Objective:** Verify editing appointments updates balances correctly

### **📊 Starting State**
Use the appointment from Test 1 (should be completed with ₱1,000)

```
Current Balance:
Cash: ₱__________ (Should have +₱1,000 from Test 1)
```

---

### **TEST 2.1: Edit Appointment Cost (Atomic Update)**

**Steps:**
1. ✅ Tap on the completed appointment
2. ✅ Tap **"Edit"** or open the appointment form
3. ✅ Change cost from **₱1,000** to **₱500**
4. ✅ Save changes
5. ✅ Check cash balance

**Expected Result:**
- ✅ Old ₱1,000 **removed** from cashbox
- ✅ New ₱500 **added** to cashbox
- ✅ Net change: **-₱500** (₱1,000 - ₱500)

**Record:**
```
After Editing Cost (₱1,000 → ₱500):
Cash Balance: ₱__________ 
Change: ₱__________ (Expected: -₱500)
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** This is the ATOMIC UPDATE! It should reverse the old ₱1,000 then apply the new ₱500.

---

### **TEST 2.2: Edit Payment Mode (Cash → GCash)**

**Steps:**
1. ✅ Edit the same appointment
2. ✅ Change payment mode from **Cash** to **GCash**
3. ✅ Keep cost at ₱500
4. ✅ Save changes
5. ✅ Check BOTH balances

**Expected Result:**
- ✅ ₱500 **removed** from Cash
- ✅ ₱500 **added** to GCash
- ✅ Cash: **-₱500**
- ✅ GCash: **+₱500**

**Record:**
```
After Changing Payment (Cash → GCash):
Cash Balance: ₱__________ (Expected: -₱500)
GCash Balance: ₱__________ (Expected: +₱500)
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** Money should move from one account to another!

---

### **TEST 2.3: Edit Status to Pending (Balance Should Reverse)**

**Steps:**
1. ✅ Edit the same appointment
2. ✅ Change status from **"Completed"** to **"Pending"**
3. ✅ Payment mode still GCash, cost still ₱500
4. ✅ Save changes
5. ✅ Check GCash balance

**Expected Result:**
- ✅ GCash: **-₱500** (removed because no longer completed)

**Record:**
```
After Changing Status (Completed → Pending):
GCash Balance: ₱__________ (Expected: -₱500)
✅ Pass / ❌ Fail
```

**🔍 CRITICAL TEST:** Pending appointments shouldn't add to balance!

---

### **✅ TEST 2 SUMMARY**

```
TEST 2: APPOINTMENT EDITING
┌────────────────────────────────┬──────────────────┬──────────┐
│ Edit Action                    │ Expected Change  │ Result   │
├────────────────────────────────┼──────────────────┼──────────┤
│ 2.1 Cost ₱1,000 → ₱500         │ Cash: -₱500      │ ☐ Pass   │
│ 2.2 Cash → GCash               │ Cash:-₱500       │ ☐ Pass   │
│                                │ GCash:+₱500      │          │
│ 2.3 Completed → Pending        │ GCash: -₱500     │ ☐ Pass   │
└────────────────────────────────┴──────────────────┴──────────┘

Final Balances: 
Cash: ₱__________ (Expected: Back to original starting)
GCash: ₱__________ (Expected: Back to original starting)
Match? ✅ Yes / ❌ No
```

---

# TEST SUITE 3: GCASH PAYMENTS

## 🎯 **Objective:** Verify GCash payments work same as Cash

### **TEST 3.1: Create GCash Appointment**

**Steps:**
1. ✅ Create new appointment:
   ```
   Client: Test Client 2
   Pet: Test Cat
   Service: Basic Groom
   Cost: ₱800
   Payment Mode: GCash  ← Important!
   Groomer: (any)
   ```
2. ✅ Save appointment
3. ✅ Cycle status to **"Completed"**
4. ✅ Check GCash balance

**Expected Result:**
- ✅ GCash balance: **+₱800**

**Record:**
```
GCash Appointment Completed:
GCash Balance: ₱__________ 
Change: ₱__________ (Expected: +₱800)
✅ Pass / ❌ Fail
```

---

# TEST SUITE 4: SCHEDULE TAB - END OF DAY

## 🎯 **Objective:** Verify Schedule tab shows correct balances

### **TEST 4.1: Check Schedule Tab Day Summary**

**Steps:**
1. ✅ Navigate to **Schedule** tab
2. ✅ Select today's date
3. ✅ Scroll down to **"Day Summary"** section
4. ✅ Look at **"Cashbox Balance"** card

**Expected to See:**
```
CASHBOX BALANCE
┌─────────────────────────────────────────┐
│ Opening Balance          ₱________      │ ← Your starting cashbox
│ + Cash Received          ₱________      │ ← From completed cash appointments
│ − Cash Expenses          ₱________      │ ← Any expenses you logged
│ ────────────────────────────────────    │
│ Expected Closing         ₱________      │ ← Calculated total
└─────────────────────────────────────────┘
```

**Check:**
- ✅ Amounts display FULLY (not "₱1,0..." clipped)
- ✅ Can you scroll the Cashbox card horizontally?
  - ✅ **Should NOT scroll** (this was the bug we fixed!)
  - ❌ If it scrolls → Bug still exists

**Record:**
```
Schedule Tab Cashbox Card:
Amounts fully visible? ✅ Yes / ❌ No
Card scrolls horizontally? ✅ No / ❌ Yes (SHOULD BE NO!)
Fits iPhone screen? ✅ Yes / ❌ No
✅ Pass / ❌ Fail
```

---

# TEST SUITE 5: COMMISSION CALCULATIONS

## 🎯 **Objective:** Verify commissions only calculated for PAID appointments

### **TEST 5.1: Create Unpaid Appointment**

**Steps:**
1. ✅ Create appointment:
   ```
   Client: Test Client 3
   Pet: Test Dog 2
   Service: Full Groom
   Cost: ₱1,200
   Payment Mode: (LEAVE EMPTY - No payment)  ← Important!
   Groomer: Rhian (or any groomer)
   ```
2. ✅ Save and mark as **"Completed"**
3. ✅ Go to **Today** tab
4. ✅ Look at **"Commission Breakdown"** section

**Expected Result:**
- ✅ Groomer "Rhian" should show **₱0 commission** (because no payment)
- ❌ Should NOT calculate ₱120 commission (10% of ₱1,200)

**Record:**
```
Unpaid Appointment Commission:
Groomer commission shown: ₱__________
Expected: ₱0 (no payment mode set)
✅ Pass / ❌ Fail
```

---

### **TEST 5.2: Set Payment Mode (Commission Should Appear)**

**Steps:**
1. ✅ Edit the appointment
2. ✅ Set payment mode to **"Cash"**
3. ✅ Save
4. ✅ Check commission breakdown again

**Expected Result:**
- ✅ Groomer commission now shows **₱120** (10% of ₱1,200)

**Record:**
```
After Setting Payment:
Groomer commission shown: ₱__________
Expected: ₱120
✅ Pass / ❌ Fail
```

---

# TEST SUITE 6: MOBILE OVERFLOW (VISUAL TEST)

## 🎯 **Objective:** Verify NO horizontal scrolling on iPhone

### **TEST 6.1: Schedule Tab - Mobile Overflow Check**

**On your iPhone:**

1. ✅ Go to **Schedule** tab
2. ✅ Scroll down to see all sections:
   - Day Summary cards
   - Payment Collection
   - Commission Breakdown
   - Cashbox Balance

**For EACH section, check:**

```
Day Summary Cards:
Can scroll horizontally? ✅ No / ❌ Yes
Amounts fully visible? ✅ Yes / ❌ No
Cards fit screen? ✅ Yes / ❌ No

Payment Collection Cards:
Can scroll horizontally? ✅ No / ❌ Yes
Amounts fully visible? ✅ Yes / ❌ No
Cards fit screen? ✅ Yes / ❌ No

Commission Breakdown:
Can scroll horizontally? ✅ No / ❌ Yes
Amounts fully visible? ✅ Yes / ❌ No
Cards fit screen? ✅ Yes / ❌ No

Cashbox Balance Card:
Can scroll horizontally? ✅ No / ❌ Yes
"Opening Balance" shows: ✅ Full amount / ❌ "₱1,0..."
"+ Cash Received" shows: ✅ Full amount / ❌ "₱2,3..."
"Expected Closing" shows: ✅ Full amount / ❌ "₱2,80..."
```

**Expected Result:**
- ✅ NOTHING scrolls horizontally
- ✅ ALL amounts visible fully
- ✅ Everything fits iPhone screen (375px width)

---

# 📊 FINAL TEST REPORT

## **Overall Test Results**

```
CRITICAL FINANCIAL FIXES - TEST RESULTS
═══════════════════════════════════════════════════════════

TEST 1: APPOINTMENT LIFECYCLE
├─ 1.1 Create (no balance change)      ☐ Pass / ☐ Fail
├─ 1.2 Mark completed (+balance)       ☐ Pass / ☐ Fail
├─ 1.3 Cancel (reverse balance)        ☐ Pass / ☐ Fail ← CRITICAL
├─ 1.4 Complete again (+balance)       ☐ Pass / ☐ Fail
├─ 1.5 Delete (reverse balance)        ☐ Pass / ☐ Fail ← CRITICAL
└─ 1.6 Undo delete (restore balance)   ☐ Pass / ☐ Fail ← CRITICAL

TEST 2: APPOINTMENT EDITING
├─ 2.1 Edit cost (atomic update)       ☐ Pass / ☐ Fail ← CRITICAL
├─ 2.2 Change payment mode             ☐ Pass / ☐ Fail ← CRITICAL
└─ 2.3 Change status                   ☐ Pass / ☐ Fail ← CRITICAL

TEST 3: GCASH PAYMENTS
└─ 3.1 GCash appointment               ☐ Pass / ☐ Fail

TEST 4: SCHEDULE TAB
└─ 4.1 Day Summary display             ☐ Pass / ☐ Fail

TEST 5: COMMISSIONS
├─ 5.1 Unpaid appointment (₱0)         ☐ Pass / ☐ Fail ← CRITICAL
└─ 5.2 Paid appointment (₱120)         ☐ Pass / ☐ Fail ← CRITICAL

TEST 6: MOBILE OVERFLOW
└─ 6.1 No horizontal scrolling         ☐ Pass / ☐ Fail ← CRITICAL

═══════════════════════════════════════════════════════════
TOTAL TESTS: 13
PASSED: _____ / 13
FAILED: _____ / 13

OVERALL STATUS: ☐ All Pass / ☐ Issues Found
PRODUCTION READY: ☐ Yes / ☐ No
```

---

## 🐛 **Issues Found** (if any)

If any test FAILS, document here:

```
Issue #1:
Test: _________________
Expected: _________________
Actual: _________________
Screenshot: (attach if possible)

Issue #2:
Test: _________________
Expected: _________________
Actual: _________________
Screenshot: (attach if possible)
```

---

## ✅ **Sign-Off**

```
Tested By: ___________________
Date: ___________________
Device: iPhone ___________________
iOS Version: ___________________
App URL: https://ruffcuts.app

Signature: ___________________
```

---

**🎯 CRITICAL TESTS TO FOCUS ON:**

1. **Test 1.3** - Cancel should reverse balance (was broken before)
2. **Test 1.5** - Delete should reverse balance (was broken before)
3. **Test 2.1** - Edit should update atomically (was broken before)
4. **Test 6.1** - No horizontal scrolling (was broken before)

If these 4 pass, the critical fixes are working! 🎉
