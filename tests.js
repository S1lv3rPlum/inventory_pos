let db;

window.onload = function () {
  let request = indexedDB.open("ProductDB", 1);

  request.onerror = function () {
    console.error("Database failed to open");
  };

  request.onsuccess = function () {
    db = request.result;
    console.log("Database opened successfully");
    displayProducts();
  };

  request.onupgradeneeded = function (e) {
    let db = e.target.result;
    let store = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    store.createIndex("name", "name", { unique: false });
    store.createIndex("qty", "qty", { unique: false });
    store.createIndex("price", "price", { unique: false });
    console.log("Database setup complete");
  };

  document.getElementById("addProductForm").onsubmit = function (e) {
    e.preventDefault();
    addProduct();
  };
};

function addProduct() {
  const name = document.getElementById("productName").value.trim();
  const qty = parseInt(document.getElementById("productQty").value);
  const price = parseFloat(document.getElementById("productPrice").value);

  if (!name || isNaN(qty) || isNaN(price)) {
    alert("Please fill all fields correctly.");
    return;
  }

  let newItem = { name, qty, price };

  let transaction = db.transaction(["products"], "readwrite");
  let store = transaction.objectStore("products");
  store.add(newItem);

  transaction.oncomplete = function () {
    console.log("Product added");
    document.getElementById("addProductForm").reset();
    displayProducts();
  };

  transaction.onerror = function () {
    console.error("Error adding product");
  };
}

function displayProducts() {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";

  let transaction = db.transaction("products", "readonly");
  let store = transaction.objectStore("products");

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;
    if (cursor) {
      let row = document.createElement("tr");
      row.innerHTML = `
        <td>${cursor.value.name}</td>
        <td>${cursor.value.qty}</td>
        <td>${cursor.value.price.toFixed(2)}</td>`;
      tbody.appendChild(row);
      cursor.continue();
    }
  };
}
function loadProductsFromLocalStorage() {
  const products = JSON.parse(localStorage.getItem("products")) || [];

  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = ""; // Clear any previous rows

  products.forEach(product => {
    const row = tableBody.insertRow();
    row.insertCell(0).innerText = product.name;
    row.insertCell(1).innerText = product.qty;
    row.insertCell(2).innerText = "$" + Number(product.price).toFixed(2);
  });
}

window.onload = loadProductsFromLocalStorage;

// Call it when the page loads
window.onload = loadProductsFromLocalStorage;