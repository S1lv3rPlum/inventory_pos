// inventory.js
let db;
// Open IndexedDB Database "BandPOSDB", version 2
const request = indexedDB.open("BandPOSDB", 2);
request.onupgradeneeded = function(event) {
  db = event.target.result;
  // Create products store if missing
  if (!db.objectStoreNames.contains("products"))
    db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  // Create discounts store if missing
  if (!db.objectStoreNames.contains("discounts"))
    db.createObjectStore("discounts", { keyPath: "name" });
};
request.onsuccess = function(event) {
  db = event.target.result;
  updateDebugStatus("Database initialized.");
  displayInventory();
  loadDiscounts();
};
request.onerror = function(event) {
  updateDebugStatus("Database error: " + event.target.error);
  console.error("IndexedDB open error:", event.target.error);
};
// Debug status display helper
function updateDebugStatus(message) {
  const debugElem = document.getElementById("debugStatus");
  if (debugElem) {
    debugElem.textContent = message;
  } else {
    console.log("DebugStatus element not found.");
    console.log(message);
  }
}
// Add Product Form submit handler
document.getElementById("addProductForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!db) {
    alert("Database not initialized yet.");
    return;
  }
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const priceRaw = document.getElementById("productPrice").value;
  const price = parseFloat(priceRaw);
  if (!name || isNaN(price)) {
    alert("Please enter valid product name and price.");
    return;
  }
  const hasSizes = document.getElementById("productHasSizes").checked;
  const gender = document.getElementById("productGenderMale").checked ? "M" :
                 document.getElementById("productGenderFemale").checked ? "F" : "";
  const imageInput = document.getElementById("productImage");
  const imageFile = imageInput.files[0];
  const reader = new FileReader();
  reader.onload = function() {
    const imageData = reader.result || null;
    const defaultSizes = ["S", "M", "L", "XL", "2XL"];
    const variants = hasSizes
      ? defaultSizes.map(size => ({ size, stock: 0 }))
      : [{ size: "One Size", stock: 0 }];
    const newProduct = {
      name,
      category,
      price,
      gender,
      variants,
      image: imageData
    };
    const tx = db.transaction("products", "readwrite");
    const store = tx.objectStore("products");
    store.add(newProduct);
    tx.oncomplete = () => {
      updateDebugStatus("Product added.");
      document.getElementById("addProductForm").reset();
      displayInventory();
    };
    tx.onerror = (event) => {
      updateDebugStatus("Error adding product: " + event.target.error);
      console.error("Add product error:", event.target.error);
    };
  };
  if (imageFile) {
    reader.readAsDataURL(imageFile);
  } else {
    reader.onload();
  }
});
// Display Inventory Table
function displayInventory() {
  const container = document.getElementById("inventoryList");
  container.innerHTML = "";
  if (!db) {
    updateDebugStatus("Database not initialized yet.");
    return;
  }
  updateDebugStatus("Loading inventory...");
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const products = [];
  tx.onerror = event => {
    updateDebugStatus("Transaction error loading products: " + event.target.error);
    console.error("Transaction error:", event.target.error);
  };
  const cursorRequest = store.openCursor();
  cursorRequest.onerror = event => {
    updateDebugStatus("Cursor error loading products: " + event.target.error);
    console.error("Cursor error:", event.target.error);
  };
  cursorRequest.onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      products.push(cursor.value);
      cursor.continue();
    } else {
      updateDebugStatus(`Loaded ${products.length} product${products.length !== 1 ? "s" : ""}`);
      if (products.length === 0) {
        container.textContent = "No products found.";
        return;
      }
      products.sort((a, b) => {
        const catComp = (a.category || "").localeCompare(b.category || "");
        return catComp !== 0 ? catComp : (a.name || "").localeCompare(b.name || "");
      });
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>Category</th>
          <th>Product Name</th>
          <th>Price ($)</th>
          <th>Gender</th>
          <th>Image</th>
          <th>Sizes & Qty</th>
          <th>Actions</th>
        </tr>
      `;
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      let lastCategory = null;
      let categoryStartRowIndex = null;
      let categoryRowCount = 0;
      products.forEach(product => {
        const row = document.createElement("tr");
        // Category row span logic
        if (product.category !== lastCategory) {
          if (categoryStartRowIndex !== null && tbody.rows[categoryStartRowIndex]) {
            tbody.rows[categoryStartRowIndex].cells[0].rowSpan = categoryRowCount;
          }
          lastCategory = product.category;
          categoryStartRowIndex = tbody.rows.length;
          categoryRowCount = 1;
          const catCell = document.createElement("td");
          catCell.textContent = product.category || "(No Category)";
          catCell.style.fontWeight = "bold";
          row.appendChild(catCell);
        } else {
          categoryRowCount++;
        }
        // Product name
        const nameCell = document.createElement("td");
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = product.name;
        nameInput.disabled = true;
        nameCell.appendChild(nameInput);
        row.appendChild(nameCell);
        // Price
        const priceCell = document.createElement("td");
        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.value = product.price.toFixed(2);
        priceInput.step = "0.01";
        priceInput.disabled = true;
        priceCell.appendChild(priceInput);
        row.appendChild(priceCell);
        // Gender
        const genderCell = document.createElement("td");
        const genderInput = document.createElement("input");
        genderInput.type = "text";
        genderInput.value = product.gender || "";
        genderInput.disabled = true;
        genderInput.style.width = "40px";
        genderCell.appendChild(genderInput);
        row.appendChild(genderCell);
        // Image
        const imgCell = document.createElement("td");
        const imgPreview = document.createElement("img");
        imgPreview.style.maxWidth = "60px";
        imgPreview.style.maxHeight = "60px";
        imgPreview.style.borderRadius = "6px";
        imgPreview.style.display = product.image ? "inline-block" : "none";
        if (product.image) imgPreview.src = product.image;
        imgCell.appendChild(imgPreview);
        // File input hidden until edit
        const imgInput = document.createElement("input");
        imgInput.type = "file";
        imgInput.accept = "image/*";
        imgInput.style.display = "none"; 
        imgCell.appendChild(imgInput);
        row.appendChild(imgCell);
        // Sizes & quantity
        const sizeCell = document.createElement("td");
        if (Array.isArray(product.variants)) {
          product.variants.forEach(variant => {
            const label = document.createElement("label");
            label.style.marginRight = "10px";
            const span = document.createElement("span");
            span.textContent = variant.size + ": ";
            const qtyInput = document.createElement("input");
            qtyInput.type = "number";
            qtyInput.value = variant.stock || 0;
            qtyInput.disabled = true;
            qtyInput.style.width = "50px";
            label.appendChild(span);
            label.appendChild(qtyInput);
            sizeCell.appendChild(label);
          });
        }
        row.appendChild(sizeCell);
        // Actions: Edit, Save, Delete buttons
        const actionCell = document.createElement("td");
        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        // Save button
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.display = "none";
        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        // Edit click handler
        editBtn.onclick = () => {
          nameInput.disabled = false;
          priceInput.disabled = false;
          genderInput.disabled = false;
          imgInput.style.display = "inline-block";
          sizeCell.querySelectorAll("input").forEach(i => i.disabled = false);
          editBtn.style.display = "none";
          saveBtn.style.display = "inline";
        };
        // Image change handler
        imgInput.onchange = () => {
          const file = imgInput.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = e => {
              imgPreview.src = e.target.result;
              imgPreview.style.display = "inline-block";
            };
            reader.readAsDataURL(file);
          }
        };
        // Save click handler
        saveBtn.onclick = () => {
          const updatedName = nameInput.value.trim();
          const updatedPrice = parseFloat(priceInput.value);
          const updatedGender = genderInput.value.trim();
          const updatedImage = imgPreview.src;
          const updatedVariants = [];
          sizeCell.querySelectorAll("label").forEach(label => {
            const sizeText = label.querySelector("span").textContent || "";
            const size = sizeText.replace(":", "").trim();
            const qty = parseInt(label.querySelector("input").value);
            updatedVariants.push({ size, stock: isNaN(qty) ? 0 : qty });
          });
          const tx2 = db.transaction("products", "readwrite");
          const store2 = tx2.objectStore("products");
          store2.put({
            ...product,
            name: updatedName,
            price: updatedPrice,
            gender: updatedGender,
            image: updatedImage,
            variants: updatedVariants
          });
          tx2.oncomplete = () => {
            updateDebugStatus("Product saved.");
            displayInventory();
          };
          tx2.onerror = event => {
            updateDebugStatus("Error saving product: " + event.target.error);
            console.error("Save product error:", event.target.error);
          };
        };
        // Delete click handler
        deleteBtn.onclick = () => {
          if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
          const tx3 = db.transaction("products", "readwrite");
          const store3 = tx3.objectStore("products");
          store3.delete(product.id);
          tx3.oncomplete = () => {
            updateDebugStatus("Product deleted.");
            displayInventory();
          };
          tx3.onerror = event => {
            updateDebugStatus("Error deleting product: " + event.target.error);
            console.error("Delete product error:", event.target.error);
          };
        };
        actionCell.appendChild(editBtn);
        actionCell.appendChild(saveBtn);
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);
        tbody.appendChild(row);
      });
      if (categoryStartRowIndex !== null && tbody.rows[categoryStartRowIndex]) {
        tbody.rows[categoryStartRowIndex].cells[0].rowSpan = categoryRowCount;
      }
      table.appendChild(tbody);
      container.appendChild(table);
    }
  };
}
// Load Discounts and render discount table
function loadDiscounts() {
  const discountTableBody = document.getElementById("discountTableBody");
  if (!discountTableBody) {
    console.error("ERROR: discountTableBody element not found");
    return;
  }
  discountTableBody.innerHTML = "";
  if (!db) {
    updateDebugStatus("Database not initialized for discounts.");
    return;
  }
  const tx = db.transaction("discounts", "readonly");
  const store = tx.objectStore("discounts");
  const cursorRequest = store.openCursor();
  let hasDiscounts = false;
  cursorRequest.onerror = event => {
    updateDebugStatus("Cursor error loading discounts: " + event.target.error);
    console.error("Cursor error loading discounts:", event.target.error);
  };
  cursorRequest.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      hasDiscounts = true;
      const discount = cursor.value;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${discount.name}</td>
        <td>${discount.type === "percent" ? "% off" : "$ off"}</td>
        <td>${discount.type === "percent" ? discount.value + "%" : "$" + discount.value.toFixed(2)}</td>
        <td><button class="delete-discount-btn">Delete</button></td>
      `;
      row.querySelector(".delete-discount-btn").onclick = () => {
        if (confirm(`Delete discount "${discount.name}"?`)) {
          const txDel = db.transaction("discounts", "readwrite");
          const storeDel = txDel.objectStore("discounts");
          const deleteRequest = storeDel.delete(discount.name);
          deleteRequest.onsuccess = () => {
            updateDebugStatus(`Discount "${discount.name}" deleted.`);
            loadDiscounts();
          };
          deleteRequest.onerror = e => {
            updateDebugStatus("Error deleting discount: " + e.target.error);
            console.error("Delete discount error:", e.target.error);
          };
        }
      };
      discountTableBody.appendChild(row);
      cursor.continue();
    } else if (!hasDiscounts) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" style="text-align:center; font-style: italic;">No discounts found.</td>`;
      discountTableBody.appendChild(tr);
    }
  };
  tx.onerror = event => {
    updateDebugStatus("Transaction error loading discounts: " + event.target.error);
    console.error("Transaction error loading discounts:", event.target.error);
  };
}
// Discount Form submit handler
document.getElementById("discountForm").addEventListener("submit", function(e) {
  e.preventDefault();
  if (!db) {
    alert("Database not initialized.");
    return;
  }
  const name = document.getElementById("discountName").value.trim();
  const type = document.getElementById("discountType").value;
  const valueRaw = document.getElementById("discountValue").value;
  const value = parseFloat(valueRaw);
  if (!name || isNaN(value)) {
    alert("Please enter valid discount name and value.");
    return;
  }
  const tx = db.transaction("discounts", "readwrite");
  const store = tx.objectStore("discounts");
  tx.onerror = e => {
    updateDebugStatus("Error saving discount transaction: " + e.target.error);
    console.error("Transaction error saving discount:", e.target.error);
  };
  const putRequest = store.put({ name, type, value });
  putRequest.onerror = e => {
    updateDebugStatus("Error saving discount request: " + e.target.error);
    console.error("Put request error saving discount:", e.target.error);
  };
  putRequest.onsuccess = () => {
    updateDebugStatus(`Discount "${name}" saved successfully.`);
    loadDiscounts();
    document.getElementById("discountForm").reset();
  };
});
// Export/Import Helper: Convert JSON to worksheet
function jsonToWorksheet(dataArray) {
  return XLSX.utils.json_to_sheet(dataArray);
}
// Export Inventory to Excel
function exportInventory() {
  if (!db) {
    alert("Database not initialized.");
    return;
  }
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const products = [];
  store.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if(cursor) {
      products.push(cursor.value);
      cursor.continue();
    } else {
      const wb = XLSX.utils.book_new();
      const ws = jsonToWorksheet(products);
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, "inventory_export.xlsx");
    }
  };
}
// Export Discounts to Excel
function exportDiscounts() {
  if (!db) {
    alert("Database not initialized.");
    return;
  }
  const tx = db.transaction("discounts", "readonly");
  const store = tx.objectStore("discounts");
  const discounts = [];
  store.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if(cursor) {
      discounts.push(cursor.value);
      cursor.continue();
    } else {
      const wb = XLSX.utils.book_new();
      const ws = jsonToWorksheet(discounts);
      XLSX.utils.book_append_sheet(wb, ws, "Discounts");
      XLSX.writeFile(wb, "discounts_export.xlsx");
    }
  };
}
// Handle Inventory XLSX Import
function handleInventoryImport(event) {
  if (!db) {
    alert("Database not initialized.");
    return;
  }
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const importedProducts = XLSX.utils.sheet_to_json(sheet);
      const tx = db.transaction("products", "readwrite");
      const store = tx.objectStore("products");
      store.clear().onsuccess = () => {
        importedProducts.forEach(prod => store.add(prod));
        tx.oncomplete = () => {
          displayInventory();
          alert("Inventory imported successfully!");
        };
      };
    } catch (err) {
      alert("Failed to import inventory: " + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}
// Handle Discount XLSX Import
function handleDiscountImport(event) {
  if (!db) {
    alert("Database not initialized.");
    return;
  }
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const importedDiscounts = XLSX.utils.sheet_to_json(sheet);
      const tx = db.transaction("discounts", "readwrite");
      const store = tx.objectStore("discounts");
      store.clear().onsuccess = () => {
        importedDiscounts.forEach(disc => store.put(disc));
        tx.oncomplete = () => {
          loadDiscounts();
          alert("Discounts imported successfully!");
        };
      };
    } catch (err) {
      alert("Failed to import discounts: " + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}
// Expose functions globally for buttons & inputs with inline handlers
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

(function() {
  const logDiv = document.createElement('div');
  logDiv.style.position = 'fixed';
  logDiv.style.bottom = '0';
  logDiv.style.left = '0';
  logDiv.style.width = '100%';
  logDiv.style.maxHeight = '200px';
  logDiv.style.overflowY = 'auto';
  logDiv.style.backgroundColor = 'rgba(0,0,0,0.9)';
  logDiv.style.color = 'white';
  logDiv.style.fontSize = '12px';
  logDiv.style.zIndex = '9999';
  document.body.appendChild(logDiv);
  const log = console.log;
  console.log = function(...args){
    log.apply(console, args);
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const p = document.createElement('div');
    p.textContent = msg;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  };
})();

(function() {
  const logDiv = document.createElement('div');
  logDiv.style.position = 'fixed';
  logDiv.style.bottom = '0';
  logDiv.style.left = '0';
  logDiv.style.width = '100%';
  logDiv.style.maxHeight = '200px';
  logDiv.style.overflowY = 'auto';
  logDiv.style.backgroundColor = 'rgba(0,0,0,0.9)';
  logDiv.style.color = 'white';
  logDiv.style.fontSize = '12px';
  logDiv.style.zIndex = '9999';
  document.body.appendChild(logDiv);
  const log = console.log;
  console.log = function(...args) {
    log.apply(console, args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    const p = document.createElement('div');
    p.textContent = msg;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  };
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMsg = `[Error] ${message} at ${source}:${lineno}:${colno}`;
    console.log(errorMsg);
  };
})();

function deleteDatabase() {
  const deleteRequest = indexedDB.deleteDatabase("BandPOSDB");
  deleteRequest.onsuccess = () => {
    alert("Database deleted! Please reload page.");
  };
  deleteRequest.onerror = (e) => {
    alert("Error deleting database: " + e.target.error);
  };
}
