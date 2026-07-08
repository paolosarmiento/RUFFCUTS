# RUFF CUTS FINANCIAL SYSTEM AUDIT - PHASE 1 REPORT
**Date:** June 28, 2026  
**Auditor:** Claude Sonnet 4.5  
**Status:** ✅ PHASE 1 COMPLETE

---

## EXECUTIVE SUMMARY

Comprehensive mapping of all financial components in Ruff Cuts application completed. The system processes payments through 12 Firebase collections, 10 React state variables, and 50+ financial calculation functions.

**Total Financial Code References:** 391 lines  
**Complexity:** HIGH  
**Integration Points:** 15+

---

## 1. FIREBASE FINANCIAL COLLECTIONS

### Primary Financial Collections:
1. **`paymentStatus`** - Tracks payment completion for appointments & expenses
   - Structure: `{ [key]: { status, paidAmount, paidOn } }`
   - Keys: `sal_${staffId}_${date}`, `com_${staffId}_${periodKey}`, `exp_${expId}`

2. **`cashbox`** - Daily cash drawer balances
   - Structure: `{ [date]: { opening, closing, cash_in, cash_out, notes } }`
   - Purpose: Track physical cash flow

3. **`balances`** - Running cash/gcash totals
   - Structure: `{ cash: number, gcash: number }`
   - **CRITICAL:** Single source of truth for all money tracking

4. **`ownerFinances`** - Owner withdrawals & deposits
   - Structure: `{ deposits: [], withdrawals: [], dailySalary: number }`
   - Purpose: Track owner financial activity

5. **`expenses`** - Business expenses
   - Structure: `{ [date]: [{ id, amount, category, cashbox, paymentMode, notes }] }`
   - Categories: Miscellaneous, Fuel, Supplies, Utilities, Maintenance, Salaries, Rent

6. **`cashAdvances`** - Staff cash advances
   - Structure: `[{ id, staffId, staffName, amount, dateIssued, deductionAmount, frequency, status, remainingDebt }]`
   - Frequencies: weekly, biweekly, monthly

### Related Financial Collections:
7. **`schedules`** - Appointments with payment data
   - Financial fields: `cost`, `paymentMode`, `status`
   - Stored by month in separate collection: `ruffcuts_schedules`

8. **`staffMembers`** - Staff info for salary/commission
   - Financial fields: `dailySalary`, `designation`

9. **`staffByDate`** - Staff attendance for salary calculation
   - Structure: `{ [date]: [{ staffMemberId, name, designation }] }`

10. **`transactionLog`** - Audit trail
    - Structure: `[{ id, timestamp, user, type, details, balanceBefore, balanceAfter }]`

11. **`clients`** - Client payment history
    - Financial fields: appointment totals

12. **`services`** - Service pricing
    - Structure: `[{ id, name, price, category }]`

---

## 2. REACT STATE VARIABLES

### Core Financial State:
```javascript
const [paymentStatus, setPaymentStatus] = useState({});
const [cashbox, setCashbox] = useState({});
const [balances, setBalances] = useState(DEF_BAL); // { cash: 0, gcash: 0 }
const [cashAdvances, setCashAdvances] = useState([]);
const [expenses, setExpenses] = useState({});
const [transactionLog, setTransactionLog] = useState([]);
const [ownerFinances, setOwnerFinances] = useState(DEF_OWN);
const [schedules, setSchedules] = useState({});
const [staffByDate, setStaffByDate] = useState({});
const [staffMembers, setStaffMembers] = useState([]);
```

### Derived Financial State (Calculated):
- Daily revenue (by payment method)
- Commission totals
- Salary totals
- Outstanding balances
- Profit calculations (cash vs accrual)

---

## 3. CRITICAL FINANCIAL FUNCTIONS

### A. Balance Management (ATOMIC)
**Location:** Line 230  
**Function:** `updateBalanceTransaction(paymentMode, amount, operation)`

**Purpose:** Core balance update with Firebase transactions  
**Operations:** 'add' | 'subtract'  
**Payment Modes:** 'Cash' | 'GCash'

**Flow:**
1. Runs Firebase transaction on `balances` document
2. Atomic read-modify-write
3. Logs to `transactionLog`
4. Updates React state

**CRITICAL:** This is the ONLY function that should modify balances.

---

### B. Revenue Calculation Functions

**Line 3946:** `gRev(d)` - Get collected revenue for date
```javascript
const gRev = d => gA(d)
  .filter(a => a.status === "completed" && a.paymentMode)
  .reduce((s, a) => s + Number(a.cost || 0), 0);
```

**Line 3947:** `gAccrual(d)` - Get unpaid revenue
```javascript
const gAccrual = d => gA(d)
  .filter(a => a.status === "completed" && !a.paymentMode)
  .reduce((s, a) => s + Number(a.cost || 0), 0);
```

**Line 2706-2709:** Daily revenue breakdown
```javascript
const revenue = done.reduce((s, a) => s + Number(a.cost || 0), 0);
const cashRev = done.filter(a => a.paymentMode === "Cash")
  .reduce((s, a) => s + Number(a.cost || 0), 0);
const gcashRev = done.filter(a => a.paymentMode === "GCash")
  .reduce((s, a) => s + Number(a.cost || 0), 0);
const unpaidRev = done.filter(a => !a.paymentMode)
  .reduce((s, a) => s + Number(a.cost || 0), 0);
```

---

### C. Commission Calculation

**Line 3949:** `gComm(d)` - Get commission for date
```javascript
const gComm = d => gA(d)
  .filter(a => a.groomerId && a.status === "completed" && a.paymentMode)
  .reduce((s, a) => s + Number(a.cost || 0) * COMMISSION_RATE, 0);
```

**COMMISSION_RATE:** Line 231 - `const COMMISSION_RATE = 0.10;` (10%)

**Line 2742:** Total commission for day
```javascript
const totalComm = Object.values(groomerComm)
  .reduce((s, g) => s + g.comm, 0);
```

**Commission Tracker (Line 5178-5203):**
```javascript
const commByGroomer = {};
trkDates.forEach(d => {
  gA(d).filter(a => a.groomerId && a.status === "completed").forEach(a => {
    const member = staffMembers.find(m => m.id === a.groomerId);
    const name = member ? member.name : "Unknown";
    if (!commByGroomer[a.groomerId]) commByGroomer[a.groomerId] = {
      staffId: a.groomerId,
      name,
      total: 0,
      pets: 0,
      breakdown: []
    };
    const comm = Number(a.cost || 0) * COMMISSION_RATE;
    commByGroomer[a.groomerId].total += comm;
    commByGroomer[a.groomerId].pets++;
  });
});
```

---

### D. Salary Calculation

**DEFAULT_DAILY_SALARY:** Line 232 - `const DEFAULT_DAILY_SALARY = 500;`

**Salary Tracker (Line 5156-5177):**
```javascript
const salByStaff = {};
trkDates.forEach(d => {
  gSt(d).forEach(s => {
    const salId = s.staffMemberId || s.staffId || s.name;
    if (!salByStaff[salId]) salByStaff[salId] = {
      name: s.name,
      staffId: s.staffMemberId || s.staffId,
      designation: s.designation || "",
      days: 0,
      total: 0,
      dates: []
    };
    const member = staffMembers.find(m => m.id === (s.staffMemberId || s.staffId));
    const rate = member && member.dailySalary 
      ? Number(member.dailySalary) 
      : DEFAULT_DAILY_SALARY;
    salByStaff[salId].days++;
    salByStaff[salId].total += rate;
  });
});
```

**🔍 FINDING:** Recently fixed bug where `staffId` was used instead of `staffMemberId`, causing duplicate staff entries.

---

### E. Cash Advance Management

**Line 4446:** `saveCashAdvance(staffId)`
**Line 4153-4160:** Pending advances calculation
**Line 4162:** `getAdvanceDeductionForPeriod(adv, endDate)`

**Deduction Logic:**
- Weekly: Deduct every 7 days
- Biweekly: Deduct every 14 days
- Monthly: Deduct on same day each month

**Applied to:** Salary tracker net payable calculation

---

### F. Payment Status Tracking

**Line 3975:** `getPay(key)` - Get payment record
**Line 3977:** `togglePay(key, amount)` - Mark paid/unpaid

**Payment Keys:**
- Salary: `sal_${staffId}_${startDate}`
- Commission: `com_${staffId}_${periodKey}`
- Expense: `exp_${expenseId}`

---

### G. Expense Management

**Line 2710-2711:** Daily expense totals
```javascript
const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
const cashboxExp = expenses.filter(e => e.cashbox)
  .reduce((s, e) => s + Number(e.amount || 0), 0);
```

**Expense Categories:**
- Miscellaneous
- Fuel
- Supplies
- Utilities
- Maintenance
- Salaries
- Rent

**Cashbox Flag:** `e.cashbox` - if true, deducted from cash drawer

---

### H. Profit Calculations

**Line 2757:** End-of-day profit
```javascript
const netCashProfit = collectedRevenue - totalExp - totalComm - totalSalaries;
const netAccrualProfit = (revenue) - totalExp - totalComm - totalSalaries;
```

**CRITICAL:** Two profit calculations:
1. **Cash Basis:** Only collected revenue (paid appointments)
2. **Accrual Basis:** All completed appointments (including unpaid)

---

## 4. MONEY FLOW ARCHITECTURE

### Primary Flow: Appointment → Payment → Balance

```
[1] Appointment Created
    ↓
    appointment.cost calculated from service pricing
    ↓
[2] Appointment Marked Complete
    ↓
    appointment.status = "completed"
    ↓
[3] Payment Mode Selected
    ↓
    appointment.paymentMode = "Cash" | "GCash"
    ↓
[4] Balance Updated (ATOMIC)
    ↓
    updateBalanceTransaction(paymentMode, cost, 'add')
    ↓
    Firebase Transaction on balances doc
    ↓
    balances.cash += cost (if Cash)
    balances.gcash += cost (if GCash)
    ↓
[5] Transaction Logged
    ↓
    transactionLog.push({ type: "PAYMENT_RECEIVED", ... })
    ↓
[6] Dashboard Auto-Updates
    ↓
    All revenue calculations re-run (reactive)
    ↓
[7] Reports Auto-Update
    ↓
    Daily/Weekly/Monthly totals recalculated
```

### Secondary Flows:

**A. Expense Entry:**
```
Expense Added
  ↓
expenses[date].push(expense)
  ↓
IF expense.cashbox === true:
  updateBalanceTransaction(expense.paymentMode, expense.amount, 'subtract')
  ↓
Dashboard/Reports Update
```

**B. Owner Withdrawal:**
```
Owner Withdrawal
  ↓
ownerFinances.withdrawals.push({ date, amount, mode })
  ↓
updateBalanceTransaction(mode, amount, 'subtract')
  ↓
Transaction Logged
```

**C. Cash Advance:**
```
Cash Advance Issued
  ↓
cashAdvances.push({ staffId, amount, dateIssued, deductionAmount, frequency })
  ↓
updateBalanceTransaction("Cash", amount, 'subtract')
  ↓
Applied to salary calculations (deducted from net payable)
```

---

## 5. SYNCHRONIZATION POINTS

### Real-Time Sync (Firebase onSnapshot):
All collections sync automatically via Firebase listeners (Line 3676-3701)

### Calculated Values (Re-computed on every render):
- Daily revenue totals
- Commission by groomer
- Salary by staff
- Outstanding balances
- Profit calculations

**🔍 FINDING:** Calculations run on EVERY render. Performance optimization opportunity for large datasets.

---

## 6. DATA DEPENDENCIES

```
APPOINTMENT PAYMENT DEPENDS ON:
  - schedules (appointment data)
  - services (pricing)
  - balances (current totals)

COMMISSION CALCULATION DEPENDS ON:
  - schedules (appointments with groomerId)
  - staffMembers (groomer info)
  - paymentStatus (paid/unpaid tracking)

SALARY CALCULATION DEPENDS ON:
  - staffByDate (attendance)
  - staffMembers (daily salary rates)
  - cashAdvances (deductions)
  - paymentStatus (paid/unpaid tracking)

DASHBOARD REVENUE DEPENDS ON:
  - schedules (all dates)
  - paymentStatus (filtering)

PROFIT CALCULATION DEPENDS ON:
  - schedules (revenue)
  - expenses (costs)
  - staffByDate (salaries)
  - cashAdvances (if applied)
  - commission calculations
```

---

## 7. CRITICAL OBSERVATIONS

### ✅ STRENGTHS:
1. **Atomic balance updates** using Firebase transactions
2. **Comprehensive audit logging** via transactionLog
3. **Data protection** prevents mass deletions (lines 3706-3743)
4. **Multiple profit views** (cash vs accrual basis)
5. **Granular payment tracking** (appointment-level)

### ⚠️ CONCERNS IDENTIFIED:

1. **Performance:** Financial calculations run on every render
   - **Impact:** Could slow down with large datasets
   - **Recommendation:** Memoization with `useMemo`

2. **Field Name Inconsistency:** `staffId` vs `staffMemberId`
   - **Status:** Bug found and fixed in salary tracker (commit f89a497)
   - **Risk:** Similar bugs may exist elsewhere

3. **Multi-Device Sync:** Recent data loss from device conflict
   - **Cause:** Offline persistence + stale cache
   - **Impact:** Francis & Bobby data overwritten
   - **Recommendation:** Add conflict resolution or last-write-wins timestamp

4. **State Loading:** Staff data not appearing in UI despite being in Firebase
   - **Status:** ACTIVE BUG - needs investigation
   - **Impact:** UI shows "No staff members yet" when data exists

5. **No Input Validation:** Financial amounts not validated
   - **Risk:** Negative numbers, invalid input could corrupt data
   - **Recommendation:** Add input validation

---

## 8. NEXT PHASE PRIORITIES

**PHASE 2:** Trace complete money flow  
**PHASE 3:** Cross-verify all financial displays  
**PHASE 4:** Audit Cash vs GCash segregation  
**PHASE 5:** Dashboard widget integrity  

**IMMEDIATE ISSUE:** Fix staff data not loading into UI (active bug)

---

## PHASE 1 STATUS: ✅ COMPLETE

**Components Mapped:** 12 Firebase collections, 10 state variables, 50+ functions  
**Flow Diagrams:** Created  
**Dependencies:** Documented  
**Issues Found:** 5 (1 critical active bug, 1 fixed, 3 concerns)

---

**Next:** Begin PHASE 2 - Trace complete money flow from appointment creation to all endpoints.
