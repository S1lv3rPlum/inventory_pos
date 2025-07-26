let db;

window.onload = function () {
  const request = indexedDB.open("ProductDB", 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("category", "category", { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayInventory();
  };

  request.onerror = function (event) {
    console.error("Database error: ", event.target.errorCode);
  };

  document.getElementById("add-product").addEventListener("click", function () {
    const name = document.getElementById("product-name").value.trim();
    const category = document.getElementById("product-category").value.trim();
    const quantity = parseInt(document.getElementById("product-quantity").value.trim(), 10);
    const expiry = document.getElementById("product-expiry").value.trim();
    const location = document.getElementById("product-location").value.trim();
    const notes = document.getElementById("product-notes").value.trim();

    if (!name || isNaN(quantity)) {
      alert("Please enter valid product name and quantity.");
      return;
    }

    const transaction = db.transaction(["products"], "readwrite");
    const objectStore = transaction.objectStore("products");

    const newProduct = { name, category, quantity, expiry, location, notes };
    const request = objectStore.add(newProduct);

    request.onsuccess = function () {
      displayInventory(); // Refresh the table
      document.getElementById("product-form").reset(); // Clear form if you want
    };

    request.onerror = function (event) {
      console.error("Add error:", event.target.error);
    };
  });
};

function displayInventory() {
  const tbody = document.querySelector("#product-table tbody");
  tbody.innerHTML = "";

  const transaction = db.transaction(["products"], "readonly");
  const objectStore = transaction.objectStore("products");

  const products = [];

  objectStore.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      products.push(cursor.value);
      cursor.continue();
    } else {
      // Once all products are collected
      products.sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return a.category.localeCompare(b.category);
      });

      let currentCategory = null;

      products.forEach(product => {
        if (product.category !== currentCategory) {
          currentCategory = product.category;

          const categoryRow = document.createElement("tr");
          const categoryCell = document.createElement("td");
          categoryCell.colSpan = 7;
          categoryCell.textContent = currentCategory || "(No Category)";
          categoryCell.style.fontWeight = "bold";
          categoryCell.style.backgroundColor = "#eee";
          categoryRow.appendChild(categoryCell);
          tbody.appendChild(categoryRow);
        }

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.quantity}</td>
          <td>${product.expiry}</td>
          <td>${product.location}</td>
          <td>${product.notes}</td>
          <td>
            <button data-id="${product.id}" class="edit-btn">Edit</button>
            <button data-id="${product.id}" class="delete-btn">Delete</button>
          </td>
        `;

        tbody.appendChild(row);
      });

      // You can wire up edit/delete functionality here if desired
    }
  };
}



// --- Make sure these functions are global if needed ---
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

