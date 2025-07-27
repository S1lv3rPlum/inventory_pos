let db;

window.onload = function () {
  const request = indexedDB.open("ProductDB", 1);

  request.onerror = function (event) {
    console.error("Database error:", event.target.error);
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayProducts();
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("price", "price", { unique: false });
  };
};

function addProduct() {
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value.trim());

  if (!name || isNaN(price)) {
    alert("Please enter a valid name and price.");
    return;
  }

  const transaction = db.transaction(["products"], "readwrite");
  const store = transaction.objectStore("products");
  const request = store.add({ name, price });

  request.onsuccess = function () {
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    displayProducts();
  };

  request.onerror = function (event) {
    console.error("Add failed:", event.target.error);
  };
}

function displayProducts() {
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");

  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = "";

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${cursor.value.name}</td><td>${cursor.value.price.toFixed(2)}</td>`;
      tableBody.appendChild(row);
      cursor.continue();
    }
  };
}