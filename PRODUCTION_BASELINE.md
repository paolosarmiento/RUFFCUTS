# RUFF CUTS - COMPLETE SYSTEM BASELINE
**Date:** June 28, 2026, 10:00 PM  
**Purpose:** Production recovery & financial audit  
**Status:** 📋 BASELINE DOCUMENTATION (NO CODE CHANGES)

---

## EXECUTIVE SUMMARY

**Application Type:** Single-page React application (SPA)  
**Deployment:** Static HTML on GitHub Pages (https://ruffcuts.app)  
**Database:** Firebase Firestore  
**Architecture:** Monolithic single-file application (391KB)  
**Build Process:** None (runs directly in browser)

**CRITICAL FINDING:** Authentication password loading blocks entire app startup. If Firebase slow, app appears broken to user.

---

## 1. TECHNOLOGY STACK

### Core Technologies
- **React:** 18.2.0 (production build via CDN)
- **Firebase:** 9.23.0 (compat mode via CDN)
- **Deployment:** GitHub Pages
- **Domain:** ruffcuts.app (custom domain)

### CDN Dependencies
```html
<script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
```

**RISK:** If CDN slow/unavailable, app cannot start

---

## 2. STARTUP SEQUENCE

### Complete Initialization Flow

```
[BROWSER LOAD]
  ↓
[1] index.html downloaded (391KB)
    Time: Variable (75s observed during GitHub Pages slowdown)
    ↓
[2] React CDN loaded from unpkg.com
    Blocking: Yes
    Timeout: Browser default (~30s)
    ↓
[3] Firebase CDN loaded from gstatic.com
    Blocking: Yes
    Timeout: Browser default (~30s)
    ↓
[4] JavaScript execution begins
    ↓
[5] Firebase Initialize (Line 202-214)
    - firebase.initializeApp(config)
    - firebase.firestore(app)
    - db.enablePersistence({synchronizeTabs: true})  ← Async, doesn't block
    - Setup 14 document references
    - console.log("[Firebase] Initialized")
    ↓
[6] React Component Mount
    ↓
[7] Password Loading (Line 10420-10442) ⚠️ BLOCKING
    if (!db || !DOCS.passwords):
      → setPasswordsLoaded(true) immediately
    else:
      → getDoc(DOCS.passwords)  ← Firebase read
      → Wait for response
      → setPasswordsLoaded(true)
    ↓
[8] Render Check (Line 10464)
    if (!passwordsLoaded):
      → return <LoadingScreen>  ← USER SEES THIS
      → APP BLOCKED UNTIL PASSWORDS LOADED
    ↓
[9] Show LoginScreen or App
    ↓
[10] User Login
    ↓
[11] Main App Component Mount (Line 3650-3702)
    ↓
[12] Firebase Listeners Setup (Line 3676-3701)
    - onSnapshot for 12 collections (clients, schedules, expenses, etc.)
    - Each listener fires when data arrives
    - loadedCount increments
    - When loadedCount >= totalDocs: setDataLoaded(true)
    ↓
[13] Application Ready
    ↓
[14] Dashboard Rendered
```

---

## 3. BLOCKING DEPENDENCIES

### Primary Blocking Points

**CRITICAL BLOCKER #1: CDN Loading**
- **Location:** HTML <script> tags
- **Impact:** App cannot start until React + Firebase loaded
- **Timeout Risk:** HIGH if unpkg.com or gstatic.com slow
- **Observed:** GitHub Pages itself was 75s response time
- **Mitigation:** None currently (no offline fallback)

**CRITICAL BLOCKER #2: Password Loading**
- **Location:** Lines 10420-10442, 10464-10477
- **Behavior:** Blocks entire app until getDoc(DOCS.passwords) completes
- **Impact:** If Firebase slow, user sees loading screen indefinitely
- **Timeout Risk:** VERY HIGH (no timeout implemented)
- **Fallback:** Sets passwordsLoaded=true if Firebase not ready
- **Issue:** If Firebase IS ready but SLOW, no fallback triggers

**SECONDARY BLOCKER #3: Data Loading**
- **Location:** Lines 3676-3701
- **Behavior:** Sets dataLoaded=true after all listeners fire
- **Impact:** Doesn't block render, but blocks saves
- **Timeout Risk:** MEDIUM (eventual consistency)

---

## 4. FIREBASE ARCHITECTURE

### Collections Structure

**Primary Document:** `ruffcuts` (parent document)

**Sub-collections (as fields in main doc):**
1. clients - Client records
2. schedules - Appointments (by month in separate collection)
3. expenses - Daily expenses
4. services - Service pricing
5. staffByDate - Staff attendance
6. staffMembers - Staff info
7. paymentStatus - Payment tracking
8. cashbox - Cash drawer
9. cashAdvances - Staff advances
10. balances - Cash/GCash totals
11. ownerFinances - Owner withdrawals/deposits
12. passwords - Authentication
13. transactionLog - Audit trail
14. recurringSchedules - Recurring appointments

**Separate Collection:**
- `ruffcuts_schedules` - Monthly appointment data (sharded by month)

### Persistence Configuration

```javascript
db.enablePersistence({synchronizeTabs: true})
```

**Purpose:** Offline support + multi-tab synchronization  
**Risk:** Multi-device conflicts (documented in earlier incidents)  
**Error Handling:** Silent catch (`.catch(() => {})`)

---

## 5. STATE MANAGEMENT

### Global State (React useState)

**Authentication:**
- `role` - "owner" | "staff" | null
- `loggedInStaff` - Staff account if logged in as staff
- `ownerPass` - Owner password
- `staffAccounts` - Staff login accounts
- `passwordsLoaded` - ⚠️ BLOCKS APP if false

**Data:**
- `clients` - Client array
- `schedules` - Appointment object by date
- `expenses` - Expense object by date
- `services` - Service pricing array
- `staffByDate` - Staff attendance object
- `staffMembers` - Staff array ⚠️ CURRENTLY BROKEN (known issue)
- `paymentStatus` - Payment tracking object
- `cashbox` - Cash drawer object by date
- `cashAdvances` - Cash advance array
- `balances` - {cash, gcash} object
- `transactionLog` - Audit log array
- `ownerFinances` - Owner financial records
- `recurringSchedules` - Recurring appointment templates

**UI State:**
- `mainTab` - Current main tab
- `subTab` - Sub-tab selections
- `menuOpen` - Mobile menu state
- `selDate` - Selected date
- `dataLoaded` - Firebase data ready flag
- ~50 more UI state variables

### State Synchronization

**Firebase → React (onSnapshot):**
```javascript
const setters = {
  staffMembers: v => { 
    lastR.current.staffMembers = v; 
    setStaffMembers(v || []); 
  },
  // ... 11 more setters
};

onSnapshot(DOCS[name], snap => {
  setter(snap.exists ? snap.data().data : null);
  loadedCount++;
  if (loadedCount >= totalDocs) setDataLoaded(true);
});
```

**React → Firebase (useEffect + debounce):**
```javascript
useEffect(() => {
  const t = setTimeout(() => 
    sf("staffMembers", staffMembers, lastR.current.staffMembers), 
    300
  );
  return () => clearTimeout(t);
}, [staffMembers]);
```

**RISK:** Circular updates possible if not careful

---

## 6. FINANCIAL SYSTEM OVERVIEW

### Revenue Flow

```
Appointment Created
  ↓
Price from services
  ↓
Appointment Completed
  ↓
Payment Mode Selected (Cash/GCash)
  ↓
updateBalanceTransaction(mode, amount, 'add')  ← ATOMIC
  ↓
Firebase Transaction on balances doc
  ↓
balances.cash += amount (if Cash)
balances.gcash += amount (if GCash)
  ↓
Transaction logged
  ↓
Dashboard auto-updates (reactive calculations)
```

### Financial State

**Balances (Single Source of Truth):**
```javascript
balances: {
  cash: number,
  gcash: number
}
```

**Payment Tracking:**
```javascript
paymentStatus: {
  [key]: {
    status: "paid" | "unpaid",
    paidAmount: number,
    paidOn: date
  }
}
```

**Key Formats:**
- Salary: `sal_${staffId}_${startDate}`
- Commission: `com_${staffId}_${periodKey}`
- Expense: `exp_${expenseId}`

### Financial Calculations (Reactive)

**Daily Revenue:**
```javascript
const gRev = d => gA(d)
  .filter(a => a.status === "completed" && a.paymentMode)
  .reduce((s, a) => s + Number(a.cost || 0), 0);
```

**Commission (10%):**
```javascript
const COMMISSION_RATE = 0.10;
const gComm = d => gA(d)
  .filter(a => a.groomerId && a.status === "completed" && a.paymentMode)
  .reduce((s, a) => s + Number(a.cost || 0) * COMMISSION_RATE, 0);
```

**Salary:**
```javascript
const salByStaff = {};
trkDates.forEach(d => {
  gSt(d).forEach(s => {
    const member = staffMembers.find(m => m.id === s.staffMemberId);
    const rate = member?.dailySalary || DEFAULT_DAILY_SALARY;
    salByStaff[s.staffMemberId].total += rate;
  });
});
```

---

## 7. AUTHENTICATION SYSTEM

### Password Storage

**Location:** Firebase `passwords` document

**Structure:**
```javascript
{
  data: {
    ownerPass: string,
    staffAccounts: [{
      id: number,
      name: string,
      password: string
    }]
  }
}
```

**Defaults:**
```javascript
const OWN_PASS = "owner123";
const STF_PASS = "staff123";
```

### Login Flow

```
User enters password
  ↓
tryLogin() (Line 3239)
  ↓
if (pass === ownerPass):
  → onLogin("owner", null)
else:
  → Find in staffAccounts by password
  → if found: onLogin("staff", account)
  → else: setErr("Incorrect password")
  ↓
handleLogin(role, account) (Line 10458)
  ↓
setRole(role)
setLoggedInStaff(account)
  ↓
App re-renders with authenticated state
  ↓
Main App Component shown
```

### Role-Based Access

**Owner:** Full access to all tabs  
**Staff:** Limited to Today + Schedule tabs only

---

## 8. KNOWN ISSUES

### ACTIVE BUGS

**BUG #1: Staff Not Loading in UI**
- **Status:** ACTIVE (High Priority)
- **Symptom:** UI shows "No staff members yet"
- **Evidence:** Firebase has Francis & Bobby data
- **Root Cause:** Under investigation (likely browser cache or state desync)
- **Impact:** Cannot manage staff, calculate salaries, assign groomers
- **Data Safe:** Yes (data intact in Firebase)

**BUG #2: 75-Second Load Time**
- **Status:** ACTIVE (Critical)
- **Symptom:** GitHub Pages responding in 75 seconds
- **Evidence:** curl test showed 75s for HTTP 200
- **Root Cause:** GitHub Pages performance issue or large file size
- **Impact:** User browsers may timeout, perceive app as down
- **Workaround:** Test local file directly

### RECENTLY FIXED

**FIXED #1: Duplicate Staff in Salary Tracker**
- **Fixed:** Commit f89a497
- **Cause:** staffId vs staffMemberId field mismatch
- **Status:** Resolved

**FIXED #2: Syntax Error Breaking App**
- **Fixed:** Commit 965dca9
- **Cause:** Extra closing parenthesis
- **Status:** Resolved

**FIXED #3: Data Protection Blocking Deletions**
- **Fixed:** Commit 0bdb3ed
- **Cause:** Overly strict data protection
- **Status:** Resolved

---

## 9. PERFORMANCE CHARACTERISTICS

### File Size
- **index.html:** 391KB (entire app in one file)
- **React UMD:** ~130KB (from CDN)
- **Firebase SDK:** ~250KB (from CDN)
- **Total Initial Load:** ~771KB

### Render Performance

**Financial Calculations:** Run on EVERY render
- Daily revenue totals
- Commission by groomer
- Salary by staff
- Outstanding balances
- Profit calculations

**OPTIMIZATION OPPORTUNITY:** Use `useMemo` for expensive calculations

### Network Requests

**On Startup:**
- 1x HTML file (391KB)
- 2x React CDN
- 2x Firebase CDN
- 1x Password doc read
- 12x onSnapshot listeners (continuous)
- 1x Monthly schedules query

**Total:** ~16-18 requests on cold start

---

## 10. DATA PROTECTION MECHANISMS

### Save Function Protection (Lines 3703-3760)

**Protection #1: Pre-Load Block**
```javascript
if (!dataLoaded && ["clients", "staffMembers"].includes(name)) {
  console.warn(`Delayed save: waiting for Firebase to load`);
  return;
}
```

**Protection #2: Empty Array Block**
```javascript
if (Array.isArray(v) && v.length === 0 && 
    ["clients", "staffMembers"].includes(name)) {
  alert("BLOCKED: Cannot save empty list");
  return;
}
```

**Protection #3: Mass Deletion Block**
```javascript
if (reduction > 3 || reductionPct > 25) {
  alert("BLOCKED: Would delete too many items");
  return;
}
```

**Purpose:** Prevent accidental data loss from multi-tab sync conflicts

**Risk:** Can create deadlock if state gets out of sync with Firebase

---

## 11. DEPLOYMENT ARCHITECTURE

### GitHub Pages Setup

**Repository:** https://github.com/paolosarmiento/RUFFCUTS  
**Branch:** main  
**Deploy Directory:** Root  
**Custom Domain:** ruffcuts.app  
**DNS:** Configured via GitHub Pages

### Cache Configuration (netlify.toml)

```toml
[build.processing]
  skip_processing = true

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

**Purpose:** Force fresh content on every load  
**Issue:** Netlify config file present but app deployed on GitHub Pages (config not used)

### Deployment Flow

```
git push origin main
  ↓
GitHub Actions (if configured)
  ↓
GitHub Pages builds
  ↓
Content deployed to ruffcuts.app
  ↓
Cache-Control headers set
  ↓
Propagation time: 1-2 minutes
```

---

## 12. DEPENDENCIES

### External Services
- **unpkg.com** - React CDN
- **gstatic.com** - Firebase CDN
- **GitHub Pages** - Hosting
- **Firebase Firestore** - Database
- **Cloudflare DNS** (assumed) - Domain resolution

**SINGLE POINT OF FAILURE:** Any of these services down = app down

### Internal Dependencies

**Authentication depends on:**
- Firebase init
- passwords doc read
- passwordsLoaded state

**Staff Management depends on:**
- staffMembers state
- staffByDate state
- Firebase sync

**Financial Calculations depend on:**
- schedules
- expenses
- staffMembers
- paymentStatus
- balances

---

## 13. OFFLINE CAPABILITIES

### Offline Persistence Enabled

```javascript
db.enablePersistence({synchronizeTabs: true})
```

**Features:**
- Local cache of Firestore data
- Sync across browser tabs
- Offline read/write queue

**Risks:**
- Multi-device conflicts
- Stale cache serving old data
- Tab sync overwriting current data

**Evidence:** This caused Francis & Bobby data loss earlier

---

## 14. SECURITY CONSIDERATIONS

### Authentication
- **Method:** Password-only (no email/phone)
- **Storage:** Firebase Firestore (passwords document)
- **Encryption:** None (plain text in Firebase)
- **Session:** React state only (lost on refresh)

**SECURITY RISK:** ⚠️ Passwords stored in plain text

### Firebase Rules
- **Not documented in codebase**
- **Assumed:** Based on role (owner/staff)
- **TODO:** Verify Firebase security rules

---

## 15. MONITORING & LOGGING

### Console Logging

**Firebase:**
- `[Firebase] Initialized`
- `[Passwords] Loading from Firebase...`
- `[Passwords] Loaded: {...}`
- `[FIREBASE] All data loaded - saves now enabled`

**Data Protection:**
- `[DATA PROTECTION] Delayed save to X`
- `[DATA PROTECTION] Blocked save to X`
- `[DATA PROTECTION] Allowed deletion of X items`

**No error tracking service** (Sentry, LogRocket, etc.)

---

## 16. TESTING

### Current Test Coverage
- **Unit Tests:** 0
- **Integration Tests:** 0
- **E2E Tests:** 0
- **Manual Testing:** Only

**Test Dependencies:** `@playwright/test` in package.json (not used)

---

## 17. PRODUCTION HEALTH INDICATORS

### Healthy State Checklist

✅ **Should be true in healthy state:**
- [ ] HTML loads in <5 seconds
- [ ] CDN assets load in <2 seconds
- [ ] Firebase initializes in <1 second
- [ ] Passwords load in <2 seconds
- [ ] Login screen appears in <3 seconds total
- [ ] After login, dashboard loads in <2 seconds
- [ ] All data loaded in <5 seconds
- [ ] No console errors
- [ ] Staff data appears in UI
- [ ] Financial calculations accurate
- [ ] All CRUD operations work

❌ **Current Status (Unhealthy):**
- [ ] ❌ HTML loading in 75 seconds (GitHub Pages slow)
- [ ] ⚠️ Staff data not appearing in UI
- [ ] ⚠️ User experience: appears broken/timeout

---

## 18. CRITICAL PATHS

### Must-Work Workflows

**For Business Operations:**
1. Login (owner/staff)
2. View Today's schedule
3. Add new appointment
4. Mark appointment complete
5. Select payment mode (Cash/GCash)
6. View daily revenue
7. Record expenses
8. End of day summary

**If ANY of these fail:** Business operations blocked

**Current Status:** Login and data loading potentially blocking all operations

---

## BASELINE COMPLETION STATUS

✅ **Documented:**
- Technology stack
- Startup sequence
- Blocking dependencies
- Firebase architecture
- State management
- Financial system overview
- Authentication system
- Known issues
- Performance characteristics
- Data protection
- Deployment
- Dependencies
- Security
- Monitoring
- Health indicators
- Critical paths

---

## NEXT PHASE

**PHASE 2:** Production Health Check & Outage Investigation

**Focus Areas:**
1. Why is GitHub Pages responding in 75 seconds?
2. Why does password loading block app startup?
3. Why is staff data not loading into UI?
4. Are there other blocking issues?

**Approach:** Evidence-based investigation, no code changes yet

---

**BASELINE STATUS:** ✅ COMPLETE  
**READY FOR:** Phase 2 - Production Health Check
