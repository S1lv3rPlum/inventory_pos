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

  async function importZip() {
  try {
    // Prompt user to pick a .zip file
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'ZIP Backup',
        accept: { 'application/zip': ['.zip'] },
      }],
      multiple: false
    });

    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();

    const zip = await JSZip.loadAsync(arrayBuffer);

    // Validate required files exist
    if (!zip.file("stock.json") || !zip.file("logs.json") || !zip.file("settings.json")) {
      alert("Invalid backup file. One or more expected files are missing.");
      return;
    }

    // Parse JSON content
    const stockData = JSON.parse(await zip.file("stock.json").async("string"));
    const logsData = JSON.parse(await zip.file("logs.json").async("string"));
    const settingsData = JSON.parse(await zip.file("settings.json").async("string"));

    // Open the DB
    const db = await openDB("inventory", 1);

    // Clear existing tables
    await db.clear("stock");
    await db.clear("logs");
    await db.clear("settings");

    // Insert new data
    const tx = db.transaction(["stock", "logs", "settings"], "readwrite");

    for (const item of stockData) {
      await tx.objectStore("stock").put(item);
    }

    for (const log of logsData) {
      await tx.objectStore("logs").put(log);
    }

    for (const setting of settingsData) {
      await tx.objectStore("settings").put(setting);
    }

    await tx.done;

    alert("Backup restored successfully. The app will now reload.");
    location.reload();
    
  } catch (error) {
    console.error("Error during import:", error);
    alert("An error occurred while importing the backup. See console for details.");
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
