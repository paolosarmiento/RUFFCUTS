# DATA PERSISTENCE AUDIT
**Date:** 2026-07-08
**Purpose:** Complete analysis of all data storage, reads, and writes to identify persistence failures
**Objective:** Ensure NO data loss under any circumstances

---

## EXECUTIVE SUMMARY

**CRITICAL FINDINGS:**
1. ❌ **TWO SEPARATE FIREBASE COLLECTIONS FOR SCHEDULES** - potential conflict source
2. ⚠️ **React state initialized BEFORE Firebase loads** - race condition risk
3. ⚠️ **Multi-device sync can overwrite data** - confirmed cause of July 8 data loss
4. ⚠️ **No localStorage/IndexedDB** - good, but offline persistence was recently disabled
5. ⚠️ **Some data protection code was removed** (line 3749-3763, commit 774dc35)

---

## 1. STORAGE MECHANISMS INVENTORY

### 1.1 React State (Temporary - In-Memory Only)
**Location:** Lines 3384-3444 in index.html

**Critical Business Data:**
```javascript
Line 3384: const [clients, setClients] = useState([]);
Line 3385: const [schedules, setSchedules] = useState({});
Line 3386: const [expenses, setExpenses] = useState({});
Line 3387: const [services, setServices] = useState(DEF_SVC);
Line 3388: const [staffByDate, setStaffByDate] = useState({});
Line 3389: const [staffMembers, setStaffMembers] = useState([]);
Line 3390: const [paymentStatus, setPaymentStatus] = useState({});
Line 3444: const [balances, setBalances] = useState(DEF_BAL);
```

**RISK:** All initialize to empty/default values BEFORE Firebase data loads
**PROBLEM:** If these values are saved before Firebase loads, they overwrite real data

### 1.2 Firebase Firestore (Persistent - Source of Truth)

**Collection Structure:**
```
ruffcuts/ (collection)
  ├─ clients (document) → { data: [...] }
  ├─ schedules (document) → { data: {...} } ⚠️ POTENTIALLY UNUSED?
  ├─ expenses (document) → { data: {...} }
  ├─ services (document) → { data: [...] }
  ├─ staffByDate (document) → { data: {...} }
  ├─ staffMembers (document) → { data: [...] }
  ├─ paymentStatus (document) → { data: {...} }
  ├─ cashbox (document) → { data: {...} }
  ├─ cashAdvances (document) → { data: [...] }
  ├─ balances (document) → { data: {...} }
  ├─ ownerFinances (document) → { data: {...} }
  ├─ passwords (document) → { data: {...} }
  ├─ transactionLog (document) → { data: [...] }
  └─ recurringSchedules (document) → { data: [...] }

ruffcuts_schedules/ (collection)
  ├─ 2026-07 (document) → { data: { "2026-07-01": [...], "2026-07-02": [...] } }
  ├─ 2026-06 (document) → { data: { ... } }
  └─ ... (one doc per month)
```

**⚠️ CRITICAL ISSUE IDENTIFIED:**
**TWO LOCATIONS FOR SCHEDULE DATA:**
1. `ruffcuts/schedules` (document) - Line 207
2. `ruffcuts_schedules/{month}` (collection) - Line 211

**QUESTION:** Which one is authoritative? Are they synced? Can they conflict?

### 1.3 Local Storage
**Status:** NOT USED ✅
**Evidence:** No `localStorage` calls found in codebase

### 1.4 IndexedDB / Offline Persistence
**Status:** DISABLED ✅
**Evidence:** Line 204-205 comment states offline persistence was intentionally disabled
```javascript
// Line 204-205:
// Offline persistence disabled - always fetch fresh data from server
// Prevents stale cache causing data loss/conflicts across devices
```

**History:** Was previously enabled with `synchronizeTabs: true`, caused multi-device conflicts

---

## 2. DATA FLOW ANALYSIS

### 2.1 Application Initialization Sequence

**Step 1: Firebase Initialize (Lines 193-215)**
```javascript
Line 193: try {
Line 202:   const app = firebase.initializeApp(cfg);
Line 203:   db = firebase.firestore(app);
Line 207-209: Create DOCS references for all collections
Line 211:   SCHED_COL = db.collection("ruffcuts_schedules");
```

**Step 2: React State Initialize (Lines 3384-3444)**
```javascript
Line 3384: const [clients, setClients] = useState([]);  // EMPTY ARRAY
Line 3385: const [schedules, setSchedules] = useState({}); // EMPTY OBJECT
// ... all start empty
```

**Step 3: Firebase Listeners Attach (Lines 3676-3702)**
```javascript
Line 3677-3686: Attach onSnapshot listeners to all DOCS
Line 3689-3701: Attach onSnapshot listener to SCHED_COL (schedules collection)
```

**Step 4: Data Loads from Firebase**
```javascript
Line 3679: setter(snap.exists ? snap.data().data : null);
Line 3699: setSchedules(merged); // Loads schedule data from ruffcuts_schedules
```

**⚠️ RACE CONDITION IDENTIFIED:**
- React state starts empty (Step 2)
- Firebase listeners attach (Step 3)  
- Firebase data loads asynchronously (Step 4)
- **PROBLEM:** If anything triggers a save between Step 2 and Step 4, empty data overwrites Firebase

---

## 3. READ OPERATIONS

### 3.1 Initial Load (Firebase → React State)

**Pattern for all data types:**
```javascript
// Line 3677-3686
onSnapshot(DOCS[name], snap => {
  setter(snap.exists ? snap.data().data : null);
  loadedCount++;
  if (loadedCount >= totalDocs) {
    setDataLoaded(true); // <-- This flag enables saves
  }
})
```

**Schedules Special Case:**
```javascript
// Line 3689-3701
onSnapshot(SCHED_COL, snap => {
  const merged = {};
  snap.docs.forEach(doc => {
    const data = doc.data().data || {};
    Object.assign(merged, data); // Merges all month docs
  });
  lastR.current.schedules = merged;
  setSchedules(merged);
})
```

**✅ GOOD:** Uses `lastR.current` to track last known Firebase value
**⚠️ RISK:** `Object.assign(merged, data)` - if one month doc is empty, does it clear that month's data?

---

## 4. WRITE OPERATIONS

### 4.1 Save Function `sf()` (Lines 3704-3812)

**Entry Point:** Line 3704
```javascript
const sf = (name, v, r) => {
```

**Parameters:**
- `name`: data type (e.g., "clients", "schedules")
- `v`: new value (from React state)
- `r`: reference value (from `lastR.current` - last known Firebase value)

**Protection Checks:**

**Check 1 - Line 3705:** Skip if no changes
```javascript
if (!DOCS[name] || JSON.stringify(v) === JSON.stringify(r)) return;
```

**Check 2 - Lines 3708-3711:** Delay saves until Firebase loads
```javascript
if (!dataLoaded && ["clients", "staffMembers"].includes(name)) {
  console.warn(`[DATA PROTECTION] Delayed save to ${name}: waiting for Firebase to load`);
  return;
}
```
**⚠️ PROBLEM:** Only protects `clients` and `staffMembers`!
**NOT PROTECTED:** schedules, balances, expenses, staffByDate, etc.

**Check 3 - Lines 3718-3725:** Prevent empty array saves
```javascript
if (Array.isArray(v) && v.length === 0 && ["clients", "staffMembers"].includes(name)) {
  console.error(`[DATA PROTECTION] BLOCKED: Attempted to save empty ${name} array`);
  alert(msg);
  return;
}
```
**⚠️ PROBLEM:** Only protects `clients` and `staffMembers`!

**Check 4 - Lines 3733-3741:** Prevent mass deletions
```javascript
if ((reduction > 3 || reductionPct > 25) && r.length > 5) {
  console.error(`[DATA PROTECTION] Blocked save to ${name}: would delete ${reduction} items`);
  alert(msg);
  return;
}
```
**⚠️ PROBLEM:** Only applies to arrays, not objects (schedules, balances are objects!)

**Save Methods:**

**Transactional Save (Lines 3756-3808):**
```javascript
// Used for: balances, staffMembers, clients, expenses
runTransaction(async (transaction) => {
  // Read current, merge, write
})
```

**Simple Save (Line 3810):**
```javascript
// Used for: everything else
setDoc(DOCS[name], {data: v})
```

**⚠️ CRITICAL:** Schedules use simple save, no transaction protection!

### 4.2 Schedule Save (Lines 3818-3840)

**Special handling for schedules:**
```javascript
// Line 3818-3840
useEffect(() => {
  const byMonth = {};
  // Splits schedules object by month
  Object.entries(schedules).forEach(([date, appts]) => {
    const m = date.substring(0, 7); // "2026-07"
    if (!byMonth[m]) byMonth[m] = {};
    byMonth[m][date] = appts;
  });
  
  // Save each month
  Object.entries(byMonth).forEach(([m, data]) => {
    if (JSON.stringify(data) !== JSON.stringify(prev[m])) {
      setDoc(doc(SCHED_COL, m), {data}); // OVERWRITES entire month doc!
    }
  });
  
  // DELETE months that are now empty
  Object.keys(prev).forEach(m => {
    if (!byMonth[m]) deleteDoc(doc(SCHED_COL, m));
  });
}, [schedules]);
```

**🔴 CRITICAL BUGS IDENTIFIED:**

1. **Line 3829:** `setDoc(doc(SCHED_COL, m), {data})` - OVERWRITES entire month
   - If React state has empty data for July, this DELETES all July appointments
   - No safety check like other data types
   - No transaction protection

2. **Line 3834:** `deleteDoc(doc(SCHED_COL, m))` - DELETES empty months
   - If schedules temporarily becomes `{}` due to race condition, ALL months deleted
   - This explains the July 8 data loss!

3. **No `dataLoaded` check** - Can run before Firebase finishes loading
   - Race condition: page loads → schedules=`{}` → useEffect fires → deletes all data

4. **No empty data protection** - Unlike clients/staffMembers, schedules has no guard
   
---

## 5. CONFLICT SCENARIOS

### 5.1 Multi-Device Sync Conflict (CONFIRMED ROOT CAUSE)

**Scenario:**
1. Device A: Opens app, schedules loads from Firebase → has data
2. Device B: Opens app with stale cache → schedules starts empty `{}`
3. Device B: useEffect fires (line 3818) → saves empty `{}`
4. Device B: Line 3834 executes → `deleteDoc` for all months
5. Device A: Receives Firebase update → all schedules now empty
6. **RESULT:** All appointment data deleted

**Evidence:** This happened on July 8, 2026 at 12:00 AM

### 5.2 Page Refresh Race Condition

**Scenario:**
1. Page refreshes
2. React state initializes to `schedules = {}`
3. useEffect (line 3818) fires BEFORE Firebase listener (line 3689) loads data
4. Line 3834: `deleteDoc` runs for all months
5. Firebase finally loads → but data already deleted
6. **RESULT:** All schedules lost

### 5.3 Logout/Login Cycle

**Scenario:**
1. User logs out
2. React state clears (may not be explicit, but components unmount)
3. User logs in
4. React state re-initializes to empty
5. If save triggers before load completes → empty data wins
6. **RESULT:** Data loss

---

## 6. DATA PROTECTION GAPS

### 6.1 Protected Data Types
✅ `clients` - empty array blocked, deletion % limited, dataLoaded check
✅ `staffMembers` - empty array blocked, deletion % limited, dataLoaded check

### 6.2 UNPROTECTED Data Types
❌ `schedules` - NO empty check, NO dataLoaded check, NO deletion limit
❌ `balances` - object type, not covered by array protection
❌ `expenses` - object type, not covered by empty check  
❌ `staffByDate` - object type, not covered by empty check
❌ `services` - only deletion % check
❌ `paymentStatus` - no protection
❌ `cashbox` - no protection
❌ `cashAdvances` - no protection
❌ `ownerFinances` - no protection

**⚠️ CRITICAL:** Most business data is UNPROTECTED from race conditions

---

## 7. KNOWN BUGS FROM INVESTIGATION

### Bug 1: Schedules Delete on Empty State (CRITICAL)
**Location:** Lines 3818-3840
**Impact:** Complete data loss
**Trigger:** Multi-device sync, page refresh, race condition
**Fix Required:** Add protection before deleting month docs

### Bug 2: No dataLoaded Check for Schedules
**Location:** Line 3818 useEffect
**Impact:** Can save before Firebase loads
**Trigger:** Fast page load
**Fix Required:** Add `if (!dataLoaded) return;`

### Bug 3: Staff Data Not Saving to Firebase
**Location:** Unknown - Jhake appeared in UI but not Firebase
**Impact:** Staff changes lost on refresh
**Status:** Partially resolved by manual console fix
**Fix Required:** Find why staffMembers save is failing

### Bug 4: Appointment Cost Sometimes Saves as ₱0
**Location:** Line 4250 or earlier in form
**Impact:** Revenue calculation wrong
**Status:** Inconsistent behavior
**Fix Required:** More investigation needed

---

## 8. SINGLE SOURCE OF TRUTH ASSESSMENT

**CURRENT STATE:**

| Data Type | Firebase | React State | Who Wins? |
|-----------|----------|-------------|-----------|
| clients | ✅ ruffcuts/clients | ✅ In-memory | Last write (conflict risk) |
| schedules | ✅ ruffcuts_schedules/{month} | ✅ In-memory | Last write (conflict risk) |
| staffMembers | ✅ ruffcuts/staffMembers | ✅ In-memory | Last write (conflict risk) |
| balances | ✅ ruffcuts/balances | ✅ In-memory | Last write (conflict risk) |
| expenses | ✅ ruffcuts/expenses | ✅ In-memory | Last write (conflict risk) |
| staffByDate | ✅ ruffcuts/staffByDate | ✅ In-memory | Last write (conflict risk) |

**❌ PROBLEM:** No clear authority. React state and Firebase can disagree.

**SHOULD BE:**
- Firebase = authoritative source
- React state = read-only cache
- Writes go directly to Firebase
- UI updates only after Firebase confirms success

**CURRENT REALITY:**
- React state updated first
- Firebase write attempted
- No rollback if Firebase write fails
- UI shows "saved" even if Firebase failed

---

## 9. CRITICAL RECOMMENDATIONS (NO CODE CHANGES YET)

### Immediate Protection Needed:

1. **BLOCK SCHEDULE DELETES**
   - Line 3834: Add check before `deleteDoc`
   - Never delete month if `!dataLoaded`
   - Never delete if schedules object is empty

2. **ADD EMPTY SCHEDULE PROTECTION**
   - Line 3829: Check if `data` is empty before setDoc
   - If empty and Firebase has data, BLOCK save

3. **EXTEND DATA PROTECTION**
   - Add schedules, balances, expenses to dataLoaded check
   - Add empty object checks (not just arrays)

4. **ADD WRITE CONFIRMATION**
   - Don't update UI until Firebase confirms write
   - Roll back React state if Firebase write fails

### Architecture Changes Needed (Later Phase):

1. Make Firebase reads synchronous on app load (blocking)
2. Add pessimistic locking for multi-device writes
3. Add conflict resolution UI
4. Add audit log for all writes
5. Add automatic backup before destructive operations

---

## 10. NEXT STEPS

**PHASE 2: Risk Assessment**
- Rate each identified issue by severity
- Determine minimum changes needed
- Create fix proposals with risk levels

**PHASE 3: Implementation (After Approval)**
- Start with highest-impact, lowest-risk fixes
- Test each fix in isolation
- Verify no data loss before deploying

---

**END OF AUDIT**
