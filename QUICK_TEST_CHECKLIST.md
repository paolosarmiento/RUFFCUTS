# ⚡ QUICK TEST CHECKLIST - Critical Fixes Only
**Time Needed:** 10 minutes  
**App:** https://ruffcuts.app (on iPhone)

---

## 🎯 THE 4 CRITICAL TESTS

### ✅ **TEST 1: Cancel Reverses Balance** (2 min)

1. Create appointment: ₱1,000, Cash, any client/pet
2. Mark as **Completed** → Cash should increase by **₱1,000** ✓
3. Tap again to **Cancel** → Cash should decrease by **₱1,000** ✓

**PASS:** Balance goes back to starting amount  
**FAIL:** Balance stays at +₱1,000 (old bug!)

```
Starting Cash: ₱__________
After Complete: ₱__________  (+₱1,000 expected)
After Cancel: ₱__________    (back to starting expected)

☐ PASS / ☐ FAIL
```

---

### ✅ **TEST 2: Delete Reverses Balance** (2 min)

1. Use same appointment from Test 1
2. Mark as **Completed** again → Cash +₱1,000 ✓
3. Tap **X** to delete → Cash should decrease by **₱1,000** ✓
4. Tap **UNDO** (in toast) → Cash should increase by **₱1,000** ✓

**PASS:** Delete removes money, Undo restores it  
**FAIL:** Money stays after delete (old bug!)

```
After Complete: ₱__________  (+₱1,000)
After Delete: ₱__________    (-₱1,000 expected)
After Undo: ₱__________      (+₱1,000 expected)

☐ PASS / ☐ FAIL
```

---

### ✅ **TEST 3: Edit Updates Atomically** (3 min)

1. Edit the appointment
2. Change cost from **₱1,000** to **₱500**
3. Save

**PASS:** Cash decreases by **₱500** (removed ₱1k, added ₱500)  
**FAIL:** Cash stays at +₱1,000 OR goes to +₱1,500 (old bug!)

```
Before Edit: ₱__________ (+₱1,000 from complete)
After Edit (₱1,000→₱500): ₱__________ 
Expected: -₱500 change

☐ PASS / ☐ FAIL
```

---

### ✅ **TEST 4: No Horizontal Scrolling** (3 min)

1. Go to **Schedule** tab
2. Scroll down to **"Cashbox Balance"** card
3. Try to scroll the card left/right

**PASS:** Card does NOT scroll horizontally, amounts show fully  
**FAIL:** Card scrolls, amounts show as "₱1,0..." (old bug!)

```
Opening Balance shows: ☐ Full amount / ☐ "₱1,0..."
Cash Received shows: ☐ Full amount / ☐ "₱2,3..."
Can scroll horizontally: ☐ NO / ☐ YES

☐ PASS / ☐ FAIL
```

---

## 📊 QUICK RESULTS

```
┌─────────────────────────────────┬──────────┐
│ TEST 1: Cancel reverses         │ ☐ Pass   │
│ TEST 2: Delete reverses         │ ☐ Pass   │
│ TEST 3: Edit atomic             │ ☐ Pass   │
│ TEST 4: No horizontal scroll    │ ☐ Pass   │
├─────────────────────────────────┼──────────┤
│ TOTAL                           │ __ / 4   │
└─────────────────────────────────┴──────────┘

All 4 Pass? ☐ YES - FIXES WORKING! ☐ NO - Issues found
```

---

## 🚨 IF ANY FAIL

**Take screenshot and send to me:**
1. Show the balance before/after
2. Show what you did (which button clicked)
3. Note what you expected vs what happened

---

**For detailed tests, see:** MANUAL_TEST_GUIDE.md
