let db;

const request = indexedDB.open("ProductDatabase", 1);

request.onupgradeneeded = function(event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("products")) {
    db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  }
};

request.onerror = function() {
  showMessage("Error opening database.", true);
};

request.onsuccess = function(event) {
  db = event.target.result;
  displayInventory();

  // Setup form submit handler
  document.getElementById("addProductForm").addEventListener("submit", addProduct);
};

function addProduct(e) {
  e.preventDefault();

  const form = e.target;

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const hasSizes = document.getElementById("productHasSizes").checked;
  const gender = document.getElementById("productGenderMale").checked ? "M" :
                 document.getElementById("productGenderFemale").checked ? "F" : "";

  const imageInput = document.getElementById("productImage");
  const imageFile = imageInput.files[0];

  if (!name || isNaN(price)) {
    showMessage("Please enter valid product name and price.", true);
    return;
  }

  const reader = new FileReader();

  reader.onload = function() {
    const imageData = reader.result || null;
    const defaultSizes = ["S", "M", "L", "XL", "2XL"];
    const variants = hasSizes ? defaultSizes.map(size => ({ size, stock: 0 })) : [{ size: "One Size", stock: 0 }];

    const newProduct = { name, category, price, gender, variants, image: imageData };

    const tx = db.transaction("products", "readwrite");
    const store = tx.objectStore("products");
    const addRequest = store.add(newProduct);

    addRequest.onsuccess = function() {
      showMessage("Product added successfully!");
      form.reset();
      displayInventory();
    };

    addRequest.onerror = function(e) {
      console.error("Add product error:", e.target.error);
      showMessage("Failed to add product.", true);
    };
  };

  if (imageFile) {
    reader.readAsDataURL(imageFile);
  } else {
    // Trigger onload with null image
    reader.onload();
  }
}

function displayInventory() {
  if (!db) return;

  const container = document.getElementById("inventoryList");
  container.innerHTML = "";

  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const products = [];

  store.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      products.push(cursor.value);
      cursor.continue();
    } else {
      if (products.length === 0) {
        container.textContent = "No products in inventory.";
        return;
      }

      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>Category</th>
          <th>Product Name</th>
          <th>Price ($)</th>
          <th>Gender</th>
          <th>Image</th>
          <th>Sizes & Qty</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      products.forEach(product => {
        const row = document.createElement("tr");

        const categoryCell = document.createElement("td");
        categoryCell.textContent = product.category || "(No Category)";
        row.appendChild(categoryCell);

        const nameCell = document.createElement("td");
        nameCell.textContent = product.name;
        row.appendChild(nameCell);

        const priceCell = document.createElement("td");
        priceCell.textContent = product.price.toFixed(2);
        row.appendChild(priceCell);

        const genderCell = document.createElement("td");
        genderCell.textContent = product.gender || "";
        row.appendChild(genderCell);

        const imgCell = document.createElement("td");
        if (product.image) {
          const img = document.createElement("img");
          img.src = product.image;
          img.style.maxWidth = "60px";
          img.style.maxHeight = "60px";
          imgCell.appendChild(img);
        } else {
          imgCell.textContent = "-";
        }
        row.appendChild(imgCell);

        const sizeCell = document.createElement("td");
        product.variants.forEach(v => {
          const span = document.createElement("span");
          span.textContent = `${v.size}: ${v.stock} `;
          sizeCell.appendChild(span);
        });
        row.appendChild(sizeCell);

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      container.appendChild(table);
    }
  };
}

// Utility function to show temporary message (success or error)
function showMessage(msg, isError = false) {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.textContent = msg;
  statusDiv.style.color = isError ? "red" : "green";

  setTimeout(() => {
    statusDiv.textContent = "";
  }, 3000);
}
// --- Make sure these functions are global if needed ---
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

