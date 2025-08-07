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

  function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function exportBackup() {
    const db = await openDB();
    const zip = new JSZip();
    const tx = db.transaction(Array.from(db.objectStoreNames), "readonly");

    for (const storeName of db.objectStoreNames) {
      const store = tx.objectStore(storeName);
      const items = await getAllFromStore(store);

      const jsonStr = JSON.stringify(items, null, 2);
      zip.file(`${storeName}.json`, jsonStr);

      const wsData = [];
      if (items.length) {
        const keys = Object.keys(items[0]);
        wsData.push(keys);
        for (const item of items) {
          wsData.push(keys.map(k => item[k]));
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, storeName);
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      zip.file(`${storeName}.xlsx`, wbout);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bandpos_backup.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function importBackup(file) {
    try {
      const zip = await JSZip.loadAsync(file);
      const db = await openDB();

      const storeNames = Array.from(db.objectStoreNames);

      for (const storeName of storeNames) {
        const jsonFile = zip.file(`${storeName}.json`);
        if (!jsonFile) continue;

        const content = await jsonFile.async("string");
        const items = JSON.parse(content);

        await new Promise((resolve, reject) => {
          const tx = db.transaction([storeName], "readwrite");
          const store = tx.objectStore(storeName);
          store.clear(); // Clear existing data

          for (const item of items) {
            store.add(item);
          }

          tx.oncomplete = () => resolve();
          tx.onerror = e => reject(e.target.error);
        });
      }

      alert("✅ Backup successfully imported. The app will now reload.");
      location.reload();

    } catch (error) {
      console.error("Error during import:", error);
      alert("❌ An error occurred while importing the backup. See console for details.");
    }
  }

  function setupBackupUI(exportBtnId, importBtnId, importInputId) {
    document.getElementById(exportBtnId).addEventListener("click", exportBackup);
    document.getElementById(importBtnId).addEventListener("click", () => {
      document.getElementById(importInputId).click();
    });
    document.getElementById(importInputId).addEventListener("change", e => {
      if (e.target.files.length) importBackup(e.target.files[0]);
    });
  }

  // Expose the setup function globally
  window.setupBackupUI = setupBackupUI;
})();