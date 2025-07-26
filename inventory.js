// add-product.js

const dbName = "ProductDB"; const dbVersion = 1; let db;

window.onload = function () { let request = indexedDB.open(dbName, dbVersion);

request.onerror = function (event) { console.error("Database error:", event.target.errorCode); };

request.onsuccess = function (event) { db = event.target.result; console.log("Database initialized"); displayProducts(); };

request.onupgradeneeded = function (event) { db = event.target.result; if (!db.objectStoreNames.contains("products")) { const objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true, }); objectStore.createIndex("name", "name", { unique: false }); objectStore.createIndex("category", "category", { unique: false }); } };

document .getElementById("product-form") .addEventListener("submit", function (e) { e.preventDefault(); addProduct(); }); };

function addProduct() { const name = document.getElementById("product-name").value.trim(); const category = document.getElementById("product-category").value.trim(); const quantity = parseInt( document.getElementById("product-quantity").value.trim() );

if (!name || !category || isNaN(quantity) || quantity < 1) { alert("Please fill in all fields with valid data."); return; }

const transaction = db.transaction(["products"], "readwrite"); const objectStore = transaction.objectStore("products");

const index = objectStore.index("name"); const request = index.getAll();

request.onsuccess = function (event) { let updated = false; for (let item of event.target.result) { if (item.name === name && item.category === category) { item.quantity += quantity; const updateRequest = objectStore.put(item); updateRequest.onsuccess = function () { alert("Product quantity updated."); displayProducts(); }; updated = true; break; } } if (!updated) { const newProduct = { name, category, quantity }; const addRequest = objectStore.add(newProduct); addRequest.onsuccess = function () { alert("Product added successfully!"); displayProducts(); }; } document.getElementById("product-form").reset(); }; }

function displayProducts() { const transaction = db.transaction(["products"], "readonly"); const objectStore = transaction.objectStore("products"); const request = objectStore.getAll();

request.onsuccess = function (event) { const products = event.target.result; const table = document.getElementById("product-table"); table.innerHTML = "";

// Group by category
const grouped = {};
for (let product of products) {
  if (!grouped[product.category]) grouped[product.category] = [];
  grouped[product.category].push(product);
}

for (let category in grouped) {
  const catHeader = document.createElement("tr");
  catHeader.innerHTML = `<th colspan="4">${category}</th>`;
  table.appendChild(catHeader);

  for (let product of grouped[category]) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.quantity}</td>
      <td><button onclick="editProduct(${product.id})">Edit</button></td>
    `;
    table.appendChild(row);
  }
}

}; }

function editProduct(id) { const newQty = prompt("Enter additional quantity to add:"); const qty = parseInt(newQty); if (isNaN(qty) || qty < 1) { alert("Please enter a valid number."); return; } const transaction = db.transaction(["products"], "readwrite"); const objectStore = transaction.objectStore("products"); const getRequest = objectStore.get(id);

getRequest.onsuccess = function () { const product = getRequest.result; product.quantity += qty; const updateRequest = objectStore.put(product); updateRequest.onsuccess = function () { alert("Product updated."); displayProducts(); }; }; }



window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;