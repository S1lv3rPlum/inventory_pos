// Inventory Alert System JS

let db; let editingKey = null; // Track if editing

window.onload = function () { const request = indexedDB.open("product-database", 1);

request.onerror = function () { alert("Database failed to open"); };

request.onsuccess = function () { db = request.result; displayProducts(); };

request.onupgradeneeded = function (e) { db = e.target.result; const objectStore = db.createObjectStore("products", { keyPath: "productId" }); objectStore.createIndex("productName", "productName", { unique: false }); objectStore.createIndex("quantity", "quantity", { unique: false }); objectStore.createIndex("minQuantity", "minQuantity", { unique: false }); objectStore.createIndex("location", "location", { unique: false }); };

document.getElementById("product-form").onsubmit = function (e) { e.preventDefault(); const form = e.target; const productId = form.productId.value.trim(); const productName = form.productName.value.trim(); const quantity = parseInt(form.quantity.value.trim()); const minQuantity = parseInt(form.minQuantity.value.trim()); const location = form.location.value.trim();

if (!productId || !productName || isNaN(quantity) || isNaN(minQuantity) || !location) {
  alert("Please fill out all fields.");
  return;
}

const transaction = db.transaction(["products"], "readwrite");
const store = transaction.objectStore("products");

if (editingKey) {
  const getRequest = store.get(editingKey);
  getRequest.onsuccess = function () {
    const existing = getRequest.result;
    existing.productName = productName;
    existing.quantity += quantity; // Add to quantity
    existing.minQuantity = minQuantity;
    existing.location = location;

    const updateRequest = store.put(existing);
    updateRequest.onsuccess = function () {
      showTempAlert("Product updated successfully!");
      form.reset();
      editingKey = null;
      displayProducts();
    };
  };
} else {
  const newItem = {
    productId,
    productName,
    quantity,
    minQuantity,
    location
  };

  const addRequest = store.add(newItem);
  addRequest.onsuccess = function () {
    showTempAlert("Product added successfully!");
    form.reset();
    displayProducts();
  };

  addRequest.onerror = function () {
    alert("Failed to add product. Product ID might already exist.");
  };
}

}; };

function displayProducts() { const table = document.getElementById("product-table"); table.innerHTML = "<tr><th>ID</th><th>Name</th><th>Qty</th><th>Min</th><th>Location</th><th>Actions</th></tr>";

const transaction = db.transaction(["products"], "readonly"); const store = transaction.objectStore("products");

store.openCursor().onsuccess = function (e) { const cursor = e.target.result; if (cursor) { const item = cursor.value; const row = table.insertRow(); row.innerHTML = <td>${item.productId}</td> <td>${item.productName}</td> <td>${item.quantity}</td> <td>${item.minQuantity}</td> <td>${item.location}</td> <td><button onclick="editProduct('${item.productId}')">Edit</button></td>; cursor.continue(); } }; }

function editProduct(id) { const transaction = db.transaction(["products"], "readonly"); const store = transaction.objectStore("products"); const getRequest = store.get(id);

getRequest.onsuccess = function () { const item = getRequest.result; if (item) { document.getElementById("productId").value = item.productId; document.getElementById("productName").value = item.productName; document.getElementById("quantity").value = ""; // New quantity to add document.getElementById("minQuantity").value = item.minQuantity; document.getElementById("location").value = item.location; editingKey = item.productId; } }; }

function showTempAlert(msg) { const result = document.getElementById("result-message"); result.textContent = msg; setTimeout(() => { result.textContent = ""; }, 3000); }


// --- Make sure these functions are global if needed ---
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

