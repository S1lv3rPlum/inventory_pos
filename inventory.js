document.addEventListener("DOMContentLoaded", function () {
  console.log("Script loaded");
  const form = document.getElementById("addProductForm");

  let db;
  const request = indexedDB.open("ProductDatabase", 1);

  request.onerror = function (event) {
    console.error("Database error:", event.target.errorCode);
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Database opened successfully");
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("category", "category", { unique: false });
    objectStore.createIndex("price", "price", { unique: false });
    objectStore.createIndex("quantity", "quantity", { unique: false });
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = form.elements["productName"].value.trim();
    const category = form.elements["productCategory"].value.trim();
    const price = parseFloat(form.elements["productPrice"].value);
    const quantity = parseInt(form.elements["productQuantity"].value);

    if (!name || !category || isNaN(price) || isNaN(quantity)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const transaction = db.transaction(["products"], "readwrite");
    const objectStore = transaction.objectStore("products");

    const newProduct = { name, category, price, quantity };
    const addRequest = objectStore.add(newProduct);

    addRequest.onsuccess = function () {
      alert("Product added successfully!");
      form.reset();
    };

    addRequest.onerror = function (event) {
      console.error("Error adding product:", event.target.error);
    };
  });
});
// --- Make sure these functions are global if needed ---
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

