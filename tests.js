let db;

window.onload = function () {
  let request = indexedDB.open("ProductDatabase", 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("category", "category", { unique: false });
    objectStore.createIndex("name", "name", { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayProducts();
  };

  request.onerror = function (event) {
    alert("Database error: " + event.target.errorCode);
  };

  document.getElementById("product-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const category = document.getElementById("product-category").value.trim();
    const name = document.getElementById("product-name").value.trim();
    const quantity = parseInt(document.getElementById("product-quantity").value.trim());

    if (!category || !name || isNaN(quantity)) {
      alert("Please fill in all fields.");
      return;
    }

    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");

    let existingMatch = false;

    const allProducts = store.getAll();

    allProducts.onsuccess = function () {
      const products = allProducts.result;
      for (let product of products) {
        if (product.category === category && product.name === name) {
          product.quantity += quantity;
          store.put(product);
          existingMatch = true;
          break;
        }
      }

      if (!existingMatch) {
        const newProduct = { category, name, quantity };
        store.add(newProduct);
      }

      transaction.oncomplete = function () {
        document.getElementById("result-message").textContent = "Product added or updated!";
        document.getElementById("product-form").reset();
        displayProducts();
      };
    };
  });
};

function displayProducts() {
  const tbody = document.getElementById("product-list");
  tbody.innerHTML = "";

  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");

  const all = store.getAll();
  all.onsuccess = function () {
    const sorted = all.result.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    for (let product of sorted) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${product.category}</td>
        <td>${product.name}</td>
        <td>${product.quantity}</td>
        <td>
          <button onclick="editProduct(${product.id})">Edit</button>
        </td>
      `;

      tbody.appendChild(row);
    }
  };
}

function editProduct(id) {
  const transaction = db.transaction(["products"], "readwrite");
  const store = transaction.objectStore("products");
  const request = store.get(id);

  request.onsuccess = function () {
    const product = request.result;
    const newQty = prompt(`Update quantity for ${product.name}`, product.quantity);
    const parsedQty = parseInt(newQty);

    if (!isNaN(parsedQty)) {
      product.quantity = parsedQty;
      store.put(product).onsuccess = displayProducts;
    }
  };
}