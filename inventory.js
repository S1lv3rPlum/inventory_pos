const STORAGE_KEYS = [
  "BandPOSDB_products",
  "BandPOSDB_discounts",
  "BandPOSDB_productIdCounter"
];

// Helper: flatten products for export
function flattenProducts(products) {
  const rows = [];
  products.forEach(product => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.variants.forEach(variant => {
        rows.push({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          gender: product.gender,
          // Exclude image to reduce file size
          size: variant.size,
          qty: variant.stock
        });
      });
    } else {
      // No variants, just export product as is (without image)
      rows.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        gender: product.gender,
        size: "",
        qty: ""
      });
    }
  });
  return rows;
}

async function exportBackup() {
  try {
    const zip = new JSZip();

    for (const key of STORAGE_KEYS) {
      const dataStr = localStorage.getItem(key);
      if (!dataStr) continue;

      if (key === "BandPOSDB_products") {
        const products = JSON.parse(dataStr);
        const flatData = flattenProducts(products);
        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BandPOSDB_products");
        const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        zip.file(`${key}.xlsx`, xlsxData);
      } else {
        // For discounts and counter just save as JSON text files
        zip.file(`${key}.json`, dataStr);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `BandPOSDB_backup_${now}.zip`;

    if (window.showSaveFilePicker) {
      // Optional: If File System Access API available, ask folder and save
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: "ZIP Files",
          accept: { "application/zip": [".zip"] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      alert(`Backup saved to: ${handle.name}`);
    } else {
      // fallback download
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      alert("Backup ZIP file downloaded.");
    }
  } catch (err) {
    console.error("Error exporting backup:", err);
    alert("Failed to export backup. See console.");
  }
}

async function importBackup(file) {
  try {
    const zip = await JSZip.loadAsync(file);

    for (const key of STORAGE_KEYS) {
      // Try XLSX file first (only for products)
      if (key === "BandPOSDB_products") {
        const xlsxFile = zip.file(`${key}.xlsx`);
        if (xlsxFile) {
          const data = new Uint8Array(await xlsxFile.async("arraybuffer"));
          const workbook = XLSX.read(data, { type: "array" });
          if (!workbook.SheetNames.includes(key)) continue;
          const sheet = workbook.Sheets[key];
          const importedData = XLSX.utils.sheet_to_json(sheet);

          // Rebuild products with variants grouped by id
          const productMap = {};

          importedData.forEach(row => {
            const { size, qty, id, name, category, price, gender } = row;
            if (!productMap[id]) {
              productMap[id] = {
                id,
                name: name || "",
                category: category || "",
                price: typeof price === "number" ? price : 0,
                gender: gender || "",
                variants: []
                // image is omitted because we excluded it on export
              };
            }
            if (size !== undefined || qty !== undefined) {
              productMap[id].variants.push({
                size: size || "",
                stock: typeof qty === "number" ? qty : 0
              });
            }
          });

          const products = Object.values(productMap);
          localStorage.setItem(key, JSON.stringify(products));
          continue;
        }
      }

      // Try JSON file
      const jsonFile = zip.file(`${key}.json`);
      if (jsonFile) {
        const content = await jsonFile.async("string");
        try {
          JSON.parse(content);
          localStorage.setItem(key, content);
          continue;
        } catch {
          console.warn(`Invalid JSON for key ${key}, skipping`);
        }
      }

      // Try TXT file fallback
      const txtFile = zip.file(`${key}.txt`);
      if (txtFile) {
        const content = await txtFile.async("string");
        localStorage.setItem(key, content);
      }
    }

    alert("✅ Backup imported successfully! Reloading...");
    location.reload();
  } catch (err) {
    console.error("Error importing backup:", err);
    alert("❌ Error importing backup. See console.");
  }
}

// Expose the functions globally for buttons etc.
window.exportBackup = exportBackup;
window.importBackup = importBackup;