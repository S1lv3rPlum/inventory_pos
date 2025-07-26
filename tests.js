let db;
const request = indexedDB.open("productDB", 1);

request.onupgradeneeded = function (e) {
  db = e.target.result;
  const store = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  store.createIndex("name", "name", { unique: false });
  store.createIndex("category", "category", { unique: false });
};

request.onsuccess = function (e) {
  db = e.target.result;
  displayProducts();
};

request.onerror = function () {
  alert("Error opening database.");
};

document.getElementById("product-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const category = document.getElementById("category").value.trim();
  const name = document.getElementById("name").value.trim();
  const quantity = parseInt(document.getElementById("quantity").value.trim(), 10);

  if (!category || !name || isNaN(quantity) || quantity < 1) {
    alert("Please fill out all fields correctly.");
    return;
  }

  const tx = db.transaction("products", "readwrite");
  const store = tx.objectStore("products");
  const index = store.index("name");

  // See if product with same name exists
  let found = false;
  index.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const item = cursor.value;
      if (item.name.toLowerCase() === name.toLowerCase() && item.category === category) {
        item.quantity += quantity;
        store.put(item);
        found = true;
      }
      cursor.continue();
    } else {
      if (!found) {
        store.add({ name, category, quantity });
      }
      tx.oncomplete = () => {
        displayProducts();
        document.getElementById("product-form").reset();
      };
    }
  };
});

function displayProducts() {
  const container = document.getElementById("table-container");
  container.innerHTML = "";

  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");

  const allItems = {};
  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const { category, name, quantity, id } = cursor.value;
      if (!allItems[category]) {
        allItems[category] = [];
      }
      allItems[category].push({ id, name, quantity });
      cursor.continue();
    } else {
      // Build table per category
      for (const category in allItems) {
        const section = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = category;
        section.appendChild(title);

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        thead.innerHTML = "<tr><th>Name</th><th>Quantity</th><th>Actions</th></tr>";
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        allItems[category].forEach(item => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>
              <button onclick="editQuantity(${item.id})">+ Add Qty</button>
            </td>
          `;
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
      }
    }
  };
}

window.editQuantity = function (id) {
  const qty = parseInt(prompt("How many more?"), 10);
  if (!isNaN(qty) && qty > 0) {
    const tx = db.transaction("products", "readwrite");
    const store = tx.objectStore("products");
    const request = store.get(id);

    request.onsuccess = function () {
      const item = request.result;
      item.quantity += qty;
      store.put(item);
      tx.oncomplete = displayProducts;
    };
  }
};