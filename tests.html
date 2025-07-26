let db;
const dbName = "product-database";

const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const store = db.createObjectStore("products", {
    keyPath: "id",
    autoIncrement: true,
  });
  store.createIndex("name", "name", { unique: false });
  store.createIndex("category", "category", { unique: false });
};

request.onsuccess = function (event) {
  db = event.target.result;
  displayProducts(); // Display all products at startup
};

request.onerror = function () {
  alert("Error opening database.");
};

document.getElementById("product-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("product-name").value.trim();
  const category = document.getElementById("product-category").value.trim();
  const quantity = parseInt(document.getElementById("product-quantity").value);

  if (!name || !category || isNaN(quantity)) {
    alert("Please fill out all fields correctly.");
    return;
  }

  const tx = db.transaction("products", "readwrite");
  const store = tx.objectStore("products");
  const allProducts = store.getAll();

  allProducts.onsuccess = function () {
    const existing = allProducts.result.find(
      (item) => item.name === name && item.category === category
    );

    if (existing) {
      existing.quantity += quantity;
      store.put(existing);
    } else {
      store.add({ name, category, quantity });
    }

    tx.oncomplete = function () {
      document.getElementById("product-form").reset();
      document.getElementById("result-message").textContent = "Product added!";
      displayProducts();
    };
  };
});

function displayProducts() {
  const tbody = document.querySelector("#product-table tbody");
  tbody.innerHTML = "";

  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const all = store.getAll();

  all.onsuccess = function () {
    const grouped = {};

    all.result.forEach((item) => {
      const key = item.category + "|" + item.name;
      if (grouped[key]) {
        grouped[key].quantity += item.quantity;
      } else {
        grouped[key] = { ...item };
      }
    });

    Object.values(grouped).forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.category}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
      `;
      tbody.appendChild(row);
    });
  };
}