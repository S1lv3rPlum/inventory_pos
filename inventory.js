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

function exportInventoryBtn() {
  const dataStr = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  if (!dataStr) {
    alert("No inventory data found.");
    return;
  }
  const products = JSON.parse(dataStr);
  const flatData = flattenProducts(products);

  const ws = XLSX.utils.json_to_sheet(flatData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");

  XLSX.writeFile(wb, "inventory.xlsx");
}

function handleInventoryImport(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const importedRows = XLSX.utils.sheet_to_json(sheet);

      // Group by product id and rebuild variants
      const productMap = {};
      importedRows.forEach(row => {
        const {
          id,
          name = "",
          category = "",
          price = 0,
          gender = "",
          size = "",
          qty = 0
        } = row;

        if (!productMap[id]) {
          productMap[id] = {
            id: typeof id === "number" ? id : getNextProductId(),
            name,
            category,
            price: typeof price === "number" ? price : 0,
            gender,
            variants: []
          };
        }
        // Add variant if size is present
        if (size !== "") {
          productMap[id].variants.push({
            size,
            stock: typeof qty === "number" ? qty : 0
          });
        } else if (productMap[id].variants.length === 0) {
          // If no size at all, add a default variant
          productMap[id].variants.push({ size: "One Size", stock: 0 });
        }
      });

      const products = Object.values(productMap);
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
      updateDebugStatus("Imported inventory products.");
      displayInventory();
      alert("Inventory imported successfully!");
    } catch (err) {
      alert("Failed to import inventory: " + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}

function exportInventory() {
  console.log("Export inventory triggered");
  // ... rest of your existing exportInventory function here
}

function flattenProducts(products) {
  const rows = [];
  products.forEach(product => {
    if (product.variants && product.variants.length) {
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




// Expose functions globally for buttons etc.
window.exportInventory = exportInventory;
window.importInventory = importInventory

window.exportInventoryBtn = exportInventoryBtn;
window.handleInventoryImport = handleInventoryImport;