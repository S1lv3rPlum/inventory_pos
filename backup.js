(() => {
  // Keys in localStorage to backup — add/remove as needed
  const STORAGE_KEYS = [
    "BandPOSDB_products",
    "BandPOSDB_discounts",
    "BandPOSDB_productIdCounter",
    "BandPOSDB_sales"  // add your sales key here if you have one
  ];

  // Backup version or timestamp (for filename)
  const backupVersion = new Date().toISOString().slice(0,19).replace(/:/g,"-");

  async function exportBackup() {
    try {
      const zip = new JSZip();

      for (const key of STORAGE_KEYS) {
        const jsonStr = localStorage.getItem(key) || "[]"; // fallback to empty array
        zip.file(`${key}.json`, jsonStr);

        // Create XLSX sheet if JSON is an array of objects
        let items;
        try {
          items = JSON.parse(jsonStr);
          if (!Array.isArray(items)) items = [];
        } catch {
          items = [];
        }

        if (items.length) {
          const keys = Object.keys(items[0]);
          const wsData = [keys];
          for (const item of items) {
            wsData.push(keys.map(k => item[k]));
          }
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, key);
          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          zip.file(`${key}.xlsx`, wbout);
        }
      }

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

  function setupBackupUI(exportBtnId, importBtnId, importInputId) {
    document.getElementById(exportBtnId).addEventListener("click", exportBackup);
    document.getElementById(importBtnId).addEventListener("click", () => {
      document.getElementById(importInputId).click();
    });
    document.getElementById(importInputId).addEventListener("change", e => {
      if (e.target.files.length) importBackup(e.target.files[0]);
    });
  }

  // Expose globally
  window.setupBackupUI = setupBackupUI;
})();