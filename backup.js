(() => {
  const dbName = "BandPOSDB";
  const dbVersion = 2; 
  let db;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const request = indexedDB.open(dbName, dbVersion);
      request.onsuccess = e => {
        db = e.target.result;
        resolve(db);
      };
      request.onerror = e => reject(e.target.error);
    });
  }

  async function exportBackup() {
    const db = await openDB();
    const zip = new JSZip();

    const tx = db.transaction(Array.from(db.objectStoreNames), "readonly");

    for (const storeName of db.objectStoreNames) {
      const store = tx.objectStore(storeName);
      const items = await getAllFromStore(store);

      // Convert items to worksheet data array
      const wsData = [];

      if (items.length) {
        // Get all keys once, for header row
        const keys = Object.keys(items[0]);
        wsData.push(keys); // header row

        for (const item of items) {
          wsData.push(keys.map(k => item[k]));
        }
      }

      // Create worksheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, storeName);

      // Generate XLSX file binary
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Add XLSX file to zip
      zip.file(`${storeName}.xlsx`, wbout);
    }

    // Generate zip file blob
    const content = await zip.generateAsync({ type: "blob" });

    // Download zip file
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bandpos_backup.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function importBackup(file) {
    const userPassword = prompt("Enter password to restore backup:");
    const correctPassword = "admin"; // Change this

    if (userPassword !== correctPassword) {
      alert("Incorrect password. Restore cancelled.");
      return;
    }

    const zip = await JSZip.loadAsync(file);
    const db = await openDB();

    const tx = db.transaction(db.objectStoreNames, "readwrite");

    tx.oncomplete = () => alert("Backup restored successfully");
    tx.onerror = e => alert("Error restoring backup: " + e.target.error);

    for (const storeName of db.objectStoreNames) {
      const store = tx.objectStore(storeName);
      store.clear();

      const fileInZip = zip.file(`${storeName}.xlsx`);
      if (!fileInZip) continue;

      const content = await fileInZip.async("arraybuffer");
      const workbook = XLSX.read(content, { type: "array" });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      for (const item of data) {
        store.add(item);
      }
    }
  }

  // Utility functions to wire up buttons/input on any page
  function setupBackupUI(exportBtnId, importBtnId, importInputId) {
    document.getElementById(exportBtnId).addEventListener("click", exportBackup);
    document.getElementById(importBtnId).addEventListener("click", () => {
      document.getElementById(importInputId).click();
    });
    document.getElementById(importInputId).addEventListener("change", e => {
      if (e.target.files.length) importBackup(e.target.files[0]);
    });
  }

  // Expose the setup function globally for your HTML script to call it
  window.setupBackupUI = setupBackupUI;
})();
