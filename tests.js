let db;
const request = indexedDB.open("ProductDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const objectStore = db.createObjectStore("products", { keyPath: "name" });
  objectStore.createIndex("category", "category", { unique: false });
  objectStore.createIndex("quantity", "quantity", { unique: false });
};

request.onsuccess = function (event) {
  db = event.target.result;
  displayProducts();
};

request.onerror = function (event) {
  console.error("Database error:", event.target.errorCode);
};

document.getElementById("product-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value.trim();
  const quantity = parseInt(document.getElementById("quantity").value.trim());

  if (!name || !category || isNaN(quantity)) {
    alert("All fields are required.");
    return;
  }

  const transaction = db.transaction(["products"], "readwrite");
  const store = transaction.objectStore("products");

  const getRequest = store.get(name);
  getRequest.onsuccess = function () {
    const existing = getRequest.result;

    if (existing) {
      existing.quantity += quantity;
      store.put(existing);
      showMessage("Product quantity updated!");
    } else {
      store.add({ name, category, quantity });
      showMessage("Product added successfully!");
    }

    transaction.oncomplete = function () {
      document.getElementById("product-form").reset();
      displayProducts();
    };
  };
});

function displayProducts() {
  const tbody = document.querySelector("#product-table tbody");
  tbody.innerHTML = "";

  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const { name, category, quantity } = cursor.value;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${name}</td>
        <td>${category}</td>
        <td>${quantity}</td>
      `;
      tbody.appendChild(row);
      cursor.continue();
    }
  };
}

function showMessage(msg) {
  const messageElem = document.getElementById("result-message");
  messageElem.textContent = msg;
  setTimeout(() => {
    messageElem.textContent = "";
  }, 3000);
}