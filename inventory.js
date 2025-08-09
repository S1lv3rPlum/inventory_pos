// Helper: flatten products for export (split variants into separate rows)
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
          size: variant.size,
          qty: variant.stock
        });
      });
    } else {
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

function exportInventory() {
  const dataStr = localStorage.getItem("BandPOSDB_products");
  if (!dataStr) {
    alert("No inventory to export.");
    return;
  }

  const products = JSON.parse(dataStr);
  const flatData = flattenProducts(products);
  const ws = XLSX.utils.json_to_sheet(flatData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  XLSX.writeFile(wb, "inventory.xlsx");
}

function importInventory(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const importedRows = XLSX.utils.sheet_to_json(sheet);

      // Group rows by product id to rebuild variants
      const productMap = {};
      let maxId = 0;

      importedRows.forEach(row => {
        const { id, name, category, price, gender, size, qty } = row;
        if (typeof id !== "number") {
          throw new Error("Each row must have a numeric 'id' field.");
        }
        if (id > maxId) maxId = id;

        if (!productMap[id]) {
          productMap[id] = {
            id,
            name: name || "",
            category: category || "",
            price: typeof price === "number" ? price : 0,
            gender: gender || "",
            variants: []
          };
        }

        productMap[id].variants.push({
          size: size || "",
          stock: typeof qty === "number" ? qty : 0
        });
      });

      const products = Object.values(productMap);
      localStorage.setItem("BandPOSDB_products", JSON.stringify(products));
      localStorage.setItem("BandPOSDB_productIdCounter", (maxId + 1).toString());

      alert("✅ Inventory imported successfully!");
      displayInventory();
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import inventory: " + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
}

function exportInventory() {
  console.log("Export inventory triggered");
  // ... rest of your existing exportInventory function here
}

// Expose functions globally for buttons etc.
window.exportInventory = exportInventory;
window.importInventory = importInventory;