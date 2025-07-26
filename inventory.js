document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-product-form");
  const dbName = "ProductDatabase";
  const dbVersion = 1;
  let db;

  // Open the database
  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = (event) => {
    alert("Error opening database.");
    console.error(event);
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("DB opened successfully");
    displayProducts(); // Display existing products on load
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });

    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("price", "price", { unique: false });
    objectStore.createIndex("quantity", "quantity", { unique: false });

    console.log("Object store created");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value.trim());
    const quantity = parseInt(document.getElementById("product-quantity").value.trim());

    if (!name || isNaN(price) || isNaN(quantity)) {
      alert("Please fill out all fields correctly.");
      return;
    }

    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");
    const product = { name, price, quantity };

    const addRequest = store.add(product);

    addRequest.onsuccess = () => {
      alert("Product added successfully!");
      form.reset();
      displayProducts();
    };

    addRequest.onerror = () => {
      alert("Failed to add product.");
    };
  });

  function displayProducts() {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");

    const tableBody = document.getElementById("product-table-body");
    tableBody.innerHTML = "";

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const product = cursor.value;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.name}</td>
          <td>$${product.price.toFixed(2)}</td>
          <td>${product.quantity}</td>
          <td>
            <button onclick="editProduct(${product.id})">Edit</button>
            <button onclick="deleteProduct(${product.id})">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
        cursor.continue();
      }
    };
  }

  window.editProduct = function (id) {
    const newQty = prompt("Enter the new quantity:");
    if (newQty === null) return;

    const qty = parseInt(newQty);
    if (isNaN(qty)) {
      alert("Invalid quantity.");
      return;
    }

    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const product = getRequest.result;
      product.quantity = qty;

      const updateRequest = store.put(product);
      updateRequest.onsuccess = () => {
        alert("Quantity updated.");
        displayProducts();
      };
    };
  };

  window.deleteProduct = function (id) {
    if (!confirm("Delete this product?")) return;

    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");
    const deleteRequest = store.delete(id);

    deleteRequest.onsuccess = () => {
      alert("Product deleted.");
      displayProducts();
    };
  };
});
// --- Make sure these functions are global if needed ---
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

