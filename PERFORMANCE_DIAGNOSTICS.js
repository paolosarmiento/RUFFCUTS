// RUFF CUTS - PRODUCTION PERFORMANCE DIAGNOSTICS
// Run this in browser console to collect startup timing evidence
// NO CODE CHANGES - Diagnostics only

console.log("=== RUFF CUTS PERFORMANCE DIAGNOSTICS ===");
console.log("Starting performance measurement...\n");

// Create global timing object
window.RUFF_PERF = {
  startTime: performance.now(),
  marks: {},
  measures: {}
};

// Helper to mark timing points
window.markTime = (label) => {
  const now = performance.now();
  const elapsed = now - window.RUFF_PERF.startTime;
  window.RUFF_PERF.marks[label] = {
    timestamp: now,
    elapsed: elapsed
  };
  console.log(`[${elapsed.toFixed(0)}ms] ${label}`);
};

// Helper to measure between two points
window.measureTime = (label, startMark, endMark) => {
  const start = window.RUFF_PERF.marks[startMark];
  const end = window.RUFF_PERF.marks[endMark];
  if (start && end) {
    const duration = end.elapsed - start.elapsed;
    window.RUFF_PERF.measures[label] = duration;
    console.log(`📊 ${label}: ${duration.toFixed(0)}ms`);
    return duration;
  }
};

// Monitor Network Requests
console.log("\n=== NETWORK MONITORING ===");

const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const startTime = performance.now();
  console.log(`🌐 Fetch START: ${url}`);

  return originalFetch.apply(this, args).then(response => {
    const duration = performance.now() - startTime;
    console.log(`✅ Fetch COMPLETE (${duration.toFixed(0)}ms): ${url}`);
    return response;
  }).catch(error => {
    const duration = performance.now() - startTime;
    console.log(`❌ Fetch FAILED (${duration.toFixed(0)}ms): ${url}`, error);
    throw error;
  });
};

// Monitor Firebase Operations
if (typeof firebase !== 'undefined') {
  console.log("\n=== FIREBASE MONITORING ===");

  // Wrap getDoc
  const originalGetDoc = window.getDoc;
  if (originalGetDoc) {
    window.getDoc = function(docRef) {
      const startTime = performance.now();
      const path = docRef.path || 'unknown';
      console.log(`🔥 Firebase GET START: ${path}`);

      return originalGetDoc(docRef).then(result => {
        const duration = performance.now() - startTime;
        console.log(`✅ Firebase GET COMPLETE (${duration.toFixed(0)}ms): ${path}`);
        return result;
      }).catch(error => {
        const duration = performance.now() - startTime;
        console.log(`❌ Firebase GET FAILED (${duration.toFixed(0)}ms): ${path}`, error);
        throw error;
      });
    };
  }
}

// Monitor Main Thread Blocking
let lastCheck = performance.now();
setInterval(() => {
  const now = performance.now();
  const gap = now - lastCheck;
  if (gap > 100) {  // More than 100ms gap = blocked
    console.warn(`⚠️ Main thread blocked for ${gap.toFixed(0)}ms`);
  }
  lastCheck = now;
}, 50);

// Monitor Memory
setInterval(() => {
  if (performance.memory) {
    const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
    const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(1);
    console.log(`💾 Memory: ${used}MB / ${total}MB`);
  }
}, 5000);

// Monitor Long Tasks (if supported)
if ('PerformanceObserver' in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`⚠️ Long Task: ${entry.duration.toFixed(0)}ms - ${entry.name}`);
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
    console.log("✅ Long task monitoring enabled");
  } catch (e) {
    console.log("ℹ️ Long task monitoring not supported");
  }
}

// Monitor Navigation Timing
window.addEventListener('load', () => {
  setTimeout(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      console.log("\n=== NAVIGATION TIMING ===");
      console.log(`DNS Lookup: ${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)}ms`);
      console.log(`TCP Connection: ${(nav.connectEnd - nav.connectStart).toFixed(0)}ms`);
      console.log(`Request: ${(nav.responseStart - nav.requestStart).toFixed(0)}ms`);
      console.log(`Response Download: ${(nav.responseEnd - nav.responseStart).toFixed(0)}ms`);
      console.log(`DOM Processing: ${(nav.domComplete - nav.domLoading).toFixed(0)}ms`);
      console.log(`Total Page Load: ${(nav.loadEventEnd - nav.fetchStart).toFixed(0)}ms`);
    }

    // Resource timing
    const resources = performance.getEntriesByType('resource');
    console.log(`\n=== RESOURCE TIMING (${resources.length} resources) ===`);

    resources.forEach(r => {
      if (r.duration > 100) {  // Only show slow resources
        console.log(`🐌 SLOW (${r.duration.toFixed(0)}ms): ${r.name}`);
      }
    });

    // Find slowest resource
    const slowest = resources.reduce((max, r) =>
      r.duration > max.duration ? r : max,
      {duration: 0, name: 'none'}
    );
    console.log(`\n🐌 SLOWEST RESOURCE (${slowest.duration.toFixed(0)}ms): ${slowest.name}`);

  }, 1000);
});

// Monitor React Renders (if DevTools available)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  let renderCount = 0;
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (hook.onCommitFiberRoot) {
    const originalOnCommitFiberRoot = hook.onCommitFiberRoot.bind(hook);
    hook.onCommitFiberRoot = function(...args) {
      renderCount++;
      const now = performance.now();
      console.log(`⚛️ React Render #${renderCount} at ${now.toFixed(0)}ms`);
      return originalOnCommitFiberRoot(...args);
    };
    console.log("✅ React render monitoring enabled");
  }
}

// Final Report
window.RUFF_PERF.generateReport = () => {
  console.log("\n");
  console.log("════════════════════════════════════════");
  console.log("   PERFORMANCE DIAGNOSTIC REPORT");
  console.log("════════════════════════════════════════\n");

  console.log("=== TIMING MARKS ===");
  const sortedMarks = Object.entries(window.RUFF_PERF.marks)
    .sort((a, b) => a[1].elapsed - b[1].elapsed);

  sortedMarks.forEach(([label, data]) => {
    console.log(`${data.elapsed.toFixed(0).padStart(6)}ms: ${label}`);
  });

  console.log("\n=== MEASURES ===");
  Object.entries(window.RUFF_PERF.measures).forEach(([label, duration]) => {
    console.log(`${duration.toFixed(0).padStart(6)}ms: ${label}`);
  });

  console.log("\n=== PERFORMANCE ENTRIES ===");
  const entries = performance.getEntriesByType('measure');
  entries.forEach(e => {
    console.log(`${e.duration.toFixed(0).padStart(6)}ms: ${e.name}`);
  });

  console.log("\n════════════════════════════════════════");
  console.log("To copy this report:");
  console.log("1. Right-click in console");
  console.log("2. Select 'Save as...'");
  console.log("Or manually copy the output above");
  console.log("════════════════════════════════════════\n");
};

console.log("\n✅ Performance diagnostics initialized");
console.log("ℹ️ Monitoring network, Firebase, renders, and blocking");
console.log("ℹ️ After app loads, run: RUFF_PERF.generateReport()");
console.log("\n");

// Auto-generate report after 30 seconds
setTimeout(() => {
  console.log("\n⏱️ Auto-generating performance report...");
  window.RUFF_PERF.generateReport();
}, 30000);
