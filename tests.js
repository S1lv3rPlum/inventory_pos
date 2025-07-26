// add-product.js
const dbName = "product-database";
let db;

window.onload = function () {
  let request = indexedDB.open(dbName, 1);

  request.onerror = function (event) {
    console.error("Database error:", event.target.error);
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Database loaded");
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    let objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("category", "category", { unique: false });
    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("quantity", "quantity", { unique: false });
  };

  document.getElementById("product-form").addEventListener("submit", function (e) {
    e.preventDefault();

    let category = document.getElementById("category").value.trim();
    let name = document.getElementById("name").value.trim();
    let quantity = parseInt(document.getElementById("quantity").value);

    if (!category || !name || isNaN(quantity)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    let transaction = db.transaction(["products"], "readwrite");
    let store = transaction.objectStore("products");
    let product = { category, name, quantity };
    let addRequest = store.add(product);

    addRequest.onsuccess = function () {
      alert("Product added successfully!");
      document.getElementById("product-form").reset();
    };

    addRequest.onerror = function () {
      alert("Failed to add product.");
    };
  });
};