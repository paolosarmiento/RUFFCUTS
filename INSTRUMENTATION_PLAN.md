# PERFORMANCE INSTRUMENTATION PLAN
**Purpose:** Add timing measurements to collect startup evidence  
**Type:** DIAGNOSTIC ONLY - Zero functional changes  
**Reversible:** Yes - all changes are console.log additions

---

## INSTRUMENTATION POINTS

### 1. Firebase Initialization (Lines 193-214)

**BEFORE:**
```javascript
try {
  const cfg = { ... };
  const app = firebase.apps.length === 0 ? firebase.initializeApp(cfg) : firebase.apps[0];
  db = firebase.firestore(app);
  db.enablePersistence({synchronizeTabs: true}).catch(() => {});
  ...
  console.log("[Firebase] Initialized");
}
```

**AFTER (ADD TIMING):**
```javascript
try {
  const t0 = performance.now();
  const cfg = { ... };

  const t1 = performance.now();
  const app = firebase.apps.length === 0 ? firebase.initializeApp(cfg) : firebase.apps[0];

  const t2 = performance.now();
  db = firebase.firestore(app);

  const t3 = performance.now();
  db.enablePersistence({synchronizeTabs: true}).catch(() => {});

  const t4 = performance.now();
  // ... setup DOCS ...

  const t5 = performance.now();
  console.log("[Firebase] Initialized");
  console.log(`[PERF] Firebase init: ${(t1-t0).toFixed(0)}ms`);
  console.log(`[PERF] initializeApp: ${(t2-t1).toFixed(0)}ms`);
  console.log(`[PERF] firestore(): ${(t3-t2).toFixed(0)}ms`);
  console.log(`[PERF] enablePersistence: ${(t4-t3).toFixed(0)}ms`);
  console.log(`[PERF] DOCS setup: ${(t5-t4).toFixed(0)}ms`);
  console.log(`[PERF] Total Firebase init: ${(t5-t0).toFixed(0)}ms`);
}
```

**RISK:** ZERO - Only adds logging  
**Lines Changed:** +10 (all console.log)  
**Functional Impact:** None

---

### 2. Password Loading (Lines 10420-10442)

**BEFORE:**
```javascript
useEffect(() => {
  if (!db || !DOCS.passwords) {
    console.log("[Passwords] Waiting for Firebase init...");
    setPasswordsLoaded(true);
    return;
  }

  console.log("[Passwords] Loading from Firebase...");
  getDoc(DOCS.passwords).then(snap => {
    // ... handle response ...
    setPasswordsLoaded(true);
  }).catch(err => {
    console.error("[Passwords] Load error:", err);
    setPasswordsLoaded(true);
  });
}, []);
```

**AFTER (ADD TIMING):**
```javascript
useEffect(() => {
  const t0 = performance.now();

  if (!db || !DOCS.passwords) {
    console.log("[Passwords] Waiting for Firebase init...");
    console.log(`[PERF] Password check (skipped): ${(performance.now()-t0).toFixed(0)}ms`);
    setPasswordsLoaded(true);
    return;
  }

  console.log("[Passwords] Loading from Firebase...");
  const t1 = performance.now();

  getDoc(DOCS.passwords).then(snap => {
    const t2 = performance.now();
    console.log(`[PERF] getDoc(passwords) network: ${(t2-t1).toFixed(0)}ms`);

    // ... handle response ...

    const t3 = performance.now();
    console.log(`[PERF] Password processing: ${(t3-t2).toFixed(0)}ms`);
    console.log(`[PERF] Total password load: ${(t3-t0).toFixed(0)}ms`);

    setPasswordsLoaded(true);
  }).catch(err => {
    const tErr = performance.now();
    console.error("[Passwords] Load error:", err);
    console.log(`[PERF] Password load FAILED after ${(tErr-t1).toFixed(0)}ms`);
    setPasswordsLoaded(true);
  });
}, []);
```

**RISK:** ZERO - Only adds timing  
**Lines Changed:** +10  
**Functional Impact:** None

---

### 3. Main App Component Mount (Line 3650)

**ADD:**
```javascript
useEffect(() => {
  console.log(`[PERF] Main App mounted at ${performance.now().toFixed(0)}ms`);
}, []);
```

---

### 4. Firebase Listeners Setup (Lines 3676-3701)

**BEFORE:**
```javascript
const unsubs = Object.entries(setters).map(([name, setter]) =>
  onSnapshot(DOCS[name], snap => {
    setter(snap.exists ? snap.data().data : null);
    loadedCount++;
    if (loadedCount >= totalDocs) {
      setDataLoaded(true);
      console.log('[FIREBASE] All data loaded - saves now enabled');
    }
    setSync("Synced");
  }, () => setSync("Offline"))
);
```

**AFTER:**
```javascript
const listenerStartTime = performance.now();
console.log(`[PERF] Setting up ${totalDocs} Firebase listeners...`);

const unsubs = Object.entries(setters).map(([name, setter]) => {
  const t0 = performance.now();

  return onSnapshot(DOCS[name], snap => {
    const t1 = performance.now();
    console.log(`[PERF] onSnapshot(${name}) fired at ${t1.toFixed(0)}ms (${(t1-t0).toFixed(0)}ms after attach)`);

    setter(snap.exists ? snap.data().data : null);
    loadedCount++;

    if (loadedCount >= totalDocs) {
      const totalTime = performance.now() - listenerStartTime;
      setDataLoaded(true);
      console.log('[FIREBASE] All data loaded - saves now enabled');
      console.log(`[PERF] All listeners loaded in ${totalTime.toFixed(0)}ms`);
    }
    setSync("Synced");
  }, () => setSync("Offline"));
});
```

**RISK:** ZERO - Only adds timing  
**Lines Changed:** +8  
**Functional Impact:** None

---

### 5. Page Load Milestones

**ADD TO <script> SECTION:**
```javascript
// Page load start
if (typeof performance !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const t = performance.now();
    console.log(`[PERF] DOMContentLoaded at ${t.toFixed(0)}ms`);
  });

  window.addEventListener('load', () => {
    const t = performance.now();
    console.log(`[PERF] window.load at ${t.toFixed(0)}ms`);

    // Navigation Timing API
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        console.log("\n=== NAVIGATION TIMING ===");
        console.log(`[PERF] DNS: ${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)}ms`);
        console.log(`[PERF] TCP: ${(nav.connectEnd - nav.connectStart).toFixed(0)}ms`);
        console.log(`[PERF] Request: ${(nav.responseStart - nav.requestStart).toFixed(0)}ms`);
        console.log(`[PERF] Response: ${(nav.responseEnd - nav.responseStart).toFixed(0)}ms`);
        console.log(`[PERF] DOM Processing: ${(nav.domComplete - nav.domLoading).toFixed(0)}ms`);
        console.log(`[PERF] Total Load: ${(nav.loadEventEnd - nav.fetchStart).toFixed(0)}ms\n`);
      }
    }, 100);
  });
}
```

---

## DEPLOYMENT STRATEGY

### Option A: Temporary Instrumentation Branch

1. Create branch `perf-instrumentation`
2. Add all timing code
3. Deploy to GitHub Pages
4. User tests and sends console logs
5. Revert to main (remove instrumentation)

**PRO:** Clean separation, easy rollback  
**CON:** Requires branch management

---

### Option B: Feature Flag

```javascript
const ENABLE_PERF_LOGGING = true;

if (ENABLE_PERF_LOGGING) {
  console.log(`[PERF] ...`);
}
```

**PRO:** Can toggle on/off easily  
**CON:** Adds condition checks everywhere

---

### Option C: User Runs Diagnostic Script

1. User opens https://ruffcuts.app
2. Opens DevTools console
3. Pastes PERFORMANCE_DIAGNOSTICS.js
4. Script instruments runtime behavior
5. User sends console logs

**PRO:** ZERO code changes to production  
**CON:** Requires user to manually run script, may miss early startup

---

## RECOMMENDED APPROACH

**Use Option C first:**
1. Have user run PERFORMANCE_DIAGNOSTICS.js in console
2. Collect initial evidence
3. If inconclusive, proceed to Option A (instrumentation branch)

**REASON:** Option C has zero production code changes and zero risk

---

## EVIDENCE TO COLLECT

### Network Timing
- [ ] DNS lookup time
- [ ] TCP connection time
- [ ] index.html download time
- [ ] React CDN download time
- [ ] Firebase CDN download time
- [ ] getDoc(passwords) network time
- [ ] onSnapshot listener attach time

### JavaScript Execution
- [ ] Firebase.initializeApp() duration
- [ ] firebase.firestore() duration
- [ ] enablePersistence() duration
- [ ] DOCS setup duration
- [ ] React component mount duration
- [ ] Password processing duration

### Blocking Points
- [ ] Time until passwordsLoaded = true
- [ ] Time until dataLoaded = true
- [ ] Time until dashboard rendered
- [ ] Time until app interactive

### Resource Loading
- [ ] Slowest CDN resource
- [ ] Slowest Firebase request
- [ ] Total bytes downloaded
- [ ] Number of requests

---

## SUCCESS CRITERIA

**Evidence is sufficient when we can answer:**

1. **What is the single slowest operation?**
   - Network request? Which one?
   - JavaScript execution? Which function?
   - Firebase operation? Which one?

2. **What percentage of startup time is network vs computation?**
   - Network: X%
   - JavaScript: Y%
   - Idle: Z%

3. **Which operation blocks the critical rendering path?**
   - Password loading?
   - Data loading?
   - Something else?

4. **Is the 75-second delay reproducible?**
   - On first load?
   - On refresh?
   - On all devices?

---

## NEXT STEPS

1. **Present this plan to user**
2. **Get approval for Option C (diagnostic script)**
3. **Have user run script and collect logs**
4. **Analyze evidence**
5. **Only then determine root cause**
6. **Only then propose minimal fix**

---

**STATUS:** ⏸️ AWAITING APPROVAL  
**RISK:** ZERO (diagnostic script has no code changes)  
**READY TO EXECUTE:** Yes
