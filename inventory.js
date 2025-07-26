// Ensure DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  const dbName = "productDatabase";
  const dbVersion = 1;
  let db;

  const form = document.getElementById("add-product-form");
  const tableBody = document.getElementById("product-table-body");

  // Open IndexedDB
  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = function () {
    alert("Error opening database.");
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayProducts();
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("products")) {
      const store = db.createObjectStore("products", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("category", "category", { unique: false });
    }
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = form.productName.value.trim();
    const category = form.productCategory.value.trim();
    const qty = parseInt(form.productQty.value.trim(), 10);

    if (!name || !category || isNaN(qty)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const tx = db.transaction(["products"], "readwrite");
    const store = tx.objectStore("products");

    const newProduct = { name, category, qty };

    const addRequest = store.add(newProduct);

    addRequest.onsuccess = function () {
      alert("Product added successfully!");
      form.reset();
      displayProducts();
    };

    addRequest.onerror = function () {
      alert("Failed to add product.");
    };
  });

  function displayProducts() {
    const tx = db.transaction(["products"], "readonly");
    const store = tx.objectStore("products");

    const allProducts = store.getAll();

    allProducts.onsuccess = function () {
      const grouped = {};

      allProducts.result.forEach((product) => {
        if (!grouped[product.category]) {
          grouped[product.category] = [];
        }
        grouped[product.category].push(product);
      });

      tableBody.innerHTML = "";

      for (const [category, items] of Object.entries(grouped)) {
        const categoryRow = document.createElement("tr");
        categoryRow.innerHTML = `<td colspan="4"><strong>${category}</strong></td>`;
        tableBody.appendChild(categoryRow);

        items.forEach((product) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.qty}</td>
            <td>
              <button onclick="editQty(${product.id})">+ Add Qty</button>
              <button onclick="deleteProduct(${product.id})">Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });
      }
    };
  }

  // Expose to global so buttons can access
  window.editQty = function (id) {
    const qtyToAdd = parseInt(prompt("How many more to add?"), 10);
    if (isNaN(qtyToAdd)) return;

    const tx = db.transaction(["products"], "readwrite");
    const store = tx.objectStore("products");

    const getRequest = store.get(id);
    getRequest.onsuccess = function () {
      const product = getRequest.result;
      product.qty += qtyToAdd;
      store.put(product).onsuccess = displayProducts;
    };
  };

  window.deleteProduct = function (id) {
    const tx = db.transaction(["products"], "readwrite");
    const store = tx.objectStore("products");
    store.delete(id).onsuccess = displayProducts;
  };
});

window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;