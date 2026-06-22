yes# 🧹 How to Delete Test Staff Members Completely

You have 2 test staff members stuck in the system:
- **Rhian** (Groomer)
- **Test** (Groomer)

They appear in:
1. Staff tab (salary tracker)
2. Schedule tab (column headers)

---

## ⚡ QUICK FIX - Use Browser Console

### **Steps:**

1. **Open your app on desktop/laptop:**
   - Go to https://ruffcuts.app
   - Login with owner password

2. **Open Browser Console:**
   - Chrome/Safari: Press `Cmd + Option + J` (Mac) or `F12` (Windows)
   - Or right-click → "Inspect" → "Console" tab

3. **Copy and paste this code into the console:**

```javascript
// Delete test staff members
(async function deleteTestStaff() {
  console.log('🗑️ Deleting test staff members...');
  
  // Get current staff members
  const staffRef = firebase.firestore().collection('data').doc('staffMembers');
  const doc = await staffRef.get();
  
  if (!doc.exists) {
    console.log('❌ No staff data found');
    return;
  }
  
  const data = doc.data();
  const staffMembers = data.data || [];
  
  console.log('📋 Current staff:', staffMembers.map(s => s.name));
  
  // Filter out test staff
  const cleaned = staffMembers.filter(s => 
    s.name !== 'Rhian' && 
    s.name !== 'Test'
  );
  
  console.log('✨ After cleanup:', cleaned.map(s => s.name));
  
  // Save back to Firebase
  await staffRef.set({ data: cleaned });
  
  console.log('✅ Test staff deleted! Refresh the page.');
  
  // Also clean staffByDate
  const staffByDateRef = firebase.firestore().collection('data').doc('staffByDate');
  const staffByDateDoc = await staffByDateRef.get();
  
  if (staffByDateDoc.exists) {
    const staffByDate = staffByDateDoc.data().data || {};
    let changed = false;
    
    // Remove test staff from all dates
    Object.keys(staffByDate).forEach(date => {
      const original = staffByDate[date] || [];
      staffByDate[date] = original.filter(s => 
        s.name !== 'Rhian' && 
        s.name !== 'Test'
      );
      if (original.length !== staffByDate[date].length) {
        changed = true;
      }
    });
    
    if (changed) {
      await staffByDateRef.set({ data: staffByDate });
      console.log('✅ Removed from schedule assignments');
    }
  }
  
  console.log('🎉 ALL DONE! Refresh the page now.');
})();
```

4. **Press Enter** to run the code

5. **You should see in console:**
   ```
   🗑️ Deleting test staff members...
   📋 Current staff: ["Rhian", "Test"]
   ✨ After cleanup: []
   ✅ Test staff deleted! Refresh the page.
   ✅ Removed from schedule assignments
   🎉 ALL DONE! Refresh the page now.
   ```

6. **Refresh the page** (Cmd+R or F5)

7. **Verify:**
   - Go to Staff tab → Should be empty
   - Go to Schedule tab → Rhian and Test columns should be gone

---

## 🔍 Alternative: Manual Firebase Cleanup

If the console method doesn't work, you can use Firebase Console:

1. Go to https://console.firebase.google.com/
2. Select your Ruff Cuts project
3. Go to **Firestore Database**
4. Navigate to: `data → staffMembers`
5. Click "Edit"
6. Find the test staff in the array
7. Delete them manually
8. Save
9. Do the same for: `data → staffByDate`

---

## 🐛 Why This Happened

The delete button in the app removes staff from the local state and Firebase saves it. **This part worked!**

But the test staff were also assigned to dates in the Schedule (stored in `staffByDate`), which is why they still show up.

The cleanup script removes them from:
1. `staffMembers` (main staff list)
2. `staffByDate` (schedule assignments)

---

## ✅ After Cleanup

Once deleted, test staff will:
- ❌ NOT appear in Staff tab
- ❌ NOT appear in Schedule tab columns
- ❌ NOT show in salary tracker
- ❌ NOT show in commission breakdown

They'll be completely gone! 🎉

---

## 🚨 If You Need Help

If the console script doesn't work:
1. Take a screenshot of the console output
2. Send it to me
3. I'll help you troubleshoot

Or I can add a "Delete All Staff" button to the app if you prefer.
