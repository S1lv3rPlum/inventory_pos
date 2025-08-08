(() => {
  // Keys in localStorage to backup — add/remove as needed
  const STORAGE_KEYS = [
    "BandPOSDB_products",
    "BandPOSDB_discounts",
    "BandPOSDB_productIdCounter",
    "BandPOSDB_sales",
    "shoppingCart",
    "customerCheckoutInfo"
  ];

  // Backup version or timestamp (for filename)
  const backupVersion = new Date().toISOString().slice(0,19).replace(/:/g,"-");

  async function exportBackup() {
    try {
      const zip = new JSZip();

      // Collect data for XLSX sheets
      const sheetsData = {};

      for (const key of STORAGE_KEYS) {
        // Get JSON string from localStorage or fallback to empty array/object
        const jsonStr = localStorage.getItem(key) || "[]";

        // Add JSON file to zip (backup of raw data)
        zip.file(`${key}.json`, jsonStr);

        // Parse JSON for XLSX sheet creation
        let items;
        try {
          items = JSON.parse(jsonStr);
        } catch {
          items = [];
        }

        // Prepare sheet data if JSON is array of objects or object with keys
        if (Array.isArray(items) && items.length) {
          const keys = Object.keys(items[0]);
          const wsData = [keys];
          for (const item of items) {
            wsData.push(keys.map(k => item[k]));
          }
          sheetsData[key] = wsData;
        } else if (typeof items === "object" && items !== null && !Array.isArray(items)) {
          // If object (like customerCheckoutInfo), make one-row sheet
          const keys = Object.keys(items);
          const wsData = [keys, keys.map(k => items[k])];
          sheetsData[key] = wsData;
        }
      }

      // Create single XLSX workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      for (const [key, data] of Object.entries(sheetsData)) {
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, key);
      }

      // Generate XLSX file as array buffer and add to zip
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      zip.file(`BandPOS_backup_${backupVersion}.xlsx`, wbout);

      // Generate zip blob and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bandpos_backup_${backupVersion}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("✅ Backup exported successfully!");
    } catch (err) {
      console.error("Error exporting backup:", err);
      alert("❌ Error exporting backup. See console.");
    }
  }

  async function importBackup(file) {
    try {
      const zip = await JSZip.loadAsync(file);

      for (const key of STORAGE_KEYS) {
        // Look for JSON backup file for each key
        const jsonFile = zip.file(`${key}.json`);
        if (!jsonFile) continue;
        const content = await jsonFile.async("string");

        try {
          JSON.parse(content); // basic validation
          localStorage.setItem(key, content);
        } catch {
          console.warn(`Invalid JSON in backup for key: ${key}, skipping`);
        }
      }

      alert("✅ Backup imported successfully! Reloading app...");
      location.reload();
    } catch (err) {
      console.error("Error importing backup:", err);
      alert("❌ Error importing backup. See console.");
    }
  }

  // Sets up event listeners for export/import buttons and file input
  function setupBackupUI(exportBtnId, importBtnId, importInputId) {
    document.getElementById(exportBtnId).addEventListener("click", exportBackup);
    document.getElementById(importBtnId).addEventListener("click", () => {
      document.getElementById(importInputId).click();
    });
    document.getElementById(importInputId).addEventListener("change", e => {
      if (e.target.files.length) importBackup(e.target.files[0]);
    });
  }

  // Expose globally for settings.html to call
  window.setupBackupUI = setupBackupUI;
})();