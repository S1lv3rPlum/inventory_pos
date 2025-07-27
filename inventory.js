let db;
const request = indexedDB.open("BandPOSDB", 2);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("products"))
    db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  if (!db.objectStoreNames.contains("discounts"))
    db.createObjectStore("discounts", { keyPath: "name" });
};

request.onsuccess = function (event) {
  db = event.target.result;
  displayInventory();
  loadDiscounts();
};

document.getElementById("addProductForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const hasSizes = document.getElementById("productHasSizes").checked;
  const gender = document.getElementById("productGenderMale").checked ? "M" :
                 document.getElementById("productGenderFemale").checked ? "F" : "";

  const imageInput = document.getElementById("productImage");
  const imageFile = imageInput.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const imageData = reader.result;
    const defaultSizes = ["S", "M", "L", "XL", "2XL"];
    const variants = hasSizes ? defaultSizes.map(size => ({ size, stock: 0 })) : [{ size: "One Size", stock: 0 }];

    const newProduct = { name, category, price, gender, variants, image: imageData };
    const tx = db.transaction("products", "readwrite");
    const store = tx.objectStore("products");
    store.add(newProduct);
    tx.oncomplete = () => {
      document.getElementById("addProductForm").reset();
      displayInventory();
    };
  };

  if (imageFile) reader.readAsDataURL(imageFile);
  else reader.onload(); // trigger with no image
});

function displayInventory() {
  const container = document.getElementById("inventoryList");
  container.innerHTML = "";

  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");

  const products = [];
  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      products.push(cursor.value);
      cursor.continue();
    } else {
      products.sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));

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

        if (product.category !== lastCategory) {
          if (categoryStartRowIndex !== null) {
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

        // Name
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

        // Image + file input & preview
        const imgCell = document.createElement("td");
        const imgPreview = document.createElement("img");
        imgPreview.style.maxWidth = "60px";
        imgPreview.style.maxHeight = "60px";
        imgPreview.style.borderRadius = "6px";
        imgPreview.style.display = product.image ? "inline-block" : "none";
        if (product.image) imgPreview.src = product.image;
        imgCell.appendChild(imgPreview);

        const imgInput = document.createElement("input");
        imgInput.type = "file";
        imgInput.accept = "image/*";
        imgInput.style.display = "none"; // hidden until edit mode
        imgCell.appendChild(imgInput);

        row.appendChild(imgCell);

        // Sizes & quantities
        const sizeCell = document.createElement("td");
        product.variants.forEach(v => {
          const label = document.createElement("label");
          label.style.marginRight = "10px";

          const span = document.createElement("span");
          span.textContent = v.size + ": ";

          const qtyInput = document.createElement("input");
          qtyInput.type = "number";
          qtyInput.value = v.stock;
          qtyInput.disabled = true;
          qtyInput.style.width = "50px";

          label.appendChild(span);
          label.appendChild(qtyInput);
          sizeCell.appendChild(label);
        });
        row.appendChild(sizeCell);

        // Actions
        const actionCell = document.createElement("td");
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.display = "none";
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";

        editBtn.onclick = () => {
          nameInput.disabled = false;
          priceInput.disabled = false;
          genderInput.disabled = false;
          imgInput.style.display = "inline-block"; // show file input
          sizeCell.querySelectorAll("input").forEach(i => i.disabled = false);
          editBtn.style.display = "none";
          saveBtn.style.display = "inline";
        };

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

        saveBtn.onclick = () => {
          const updatedName = nameInput.value.trim();
          const updatedPrice = parseFloat(priceInput.value);
          const updatedGender = genderInput.value.trim();

          if (imgInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = e => {
              const updatedImage = e.target.result;
              saveProduct(updatedName, updatedPrice, updatedGender, updatedImage);
            };
            reader.readAsDataURL(imgInput.files[0]);
          } else {
            saveProduct(updatedName, updatedPrice, updatedGender, product.image);
          }
        };

        function saveProduct(name, price, gender, image) {
          const updatedVariants = Array.from(sizeCell.querySelectorAll("label")).map(label => {
            const size = label.querySelector("span").textContent.replace(":", "").trim();
            const qty = parseInt(label.querySelector("input").value) || 0;
            return { size, stock: qty };
          });

          const tx = db.transaction("products", "readwrite");
          const store = tx.objectStore("products");
          store.put({ ...product, name, price, gender, image, variants: updatedVariants });
          tx.oncomplete = displayInventory;
        }

        deleteBtn.onclick = () => {
          if (confirm(`Delete "${product.name}"?`)) {
            const tx = db.transaction("products", "readwrite");
            const store = tx.objectStore("products");
            store.delete(product.id);
            tx.oncomplete = displayInventory;
          }
        };

        actionCell.appendChild(editBtn);
        actionCell.appendChild(saveBtn);
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);

        tbody.appendChild(row);
      });

      if (categoryStartRowIndex !== null) {
        tbody.rows[categoryStartRowIndex].cells[0].rowSpan = categoryRowCount;
      }

      table.appendChild(tbody);
      container.appendChild(table);
    }
  };
}

// ... rest of your code (discounts, import/export, etc.) unchanged
// --------- Discounts -----------

function loadDiscounts() {
  const container = document.getElementById("discountList");
  if (!container) return; // skip if no UI for discounts

  container.innerHTML = "";

  const tx = db.transaction("discounts", "readonly");
  const store = tx.objectStore("discounts");

  store.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      const discount = cursor.value;
      const div = document.createElement("div");
      div.textContent = `${discount.name}: ${discount.amount}% off`;
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => {
        if (confirm(`Delete discount "${discount.name}"?`)) {
          const txDel = db.transaction("discounts", "readwrite");
          const storeDel = txDel.objectStore("discounts");
          storeDel.delete(discount.name);
          txDel.oncomplete = loadDiscounts;
        }
      };
      div.appendChild(deleteBtn);
      container.appendChild(div);

      cursor.continue();
    }
  };
}

document.getElementById("addDiscountForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const nameInput = document.getElementById("discountName");
  const amountInput = document.getElementById("discountAmount");

  if (!nameInput || !amountInput) return;

  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!name || isNaN(amount)) {
    alert("Please enter a valid discount name and amount.");
    return;
  }

  const tx = db.transaction("discounts", "readwrite");
  const store = tx.objectStore("discounts");
  store.put({ name, amount });

  tx.oncomplete = () => {
    nameInput.value = "";
    amountInput.value = "";
    loadDiscounts();
  };
});

// --------- Import / Export -----------

function exportData() {
  const exportObj = {};
  const tx = db.transaction(["products", "discounts"], "readonly");

  const productsStore = tx.objectStore("products");
  const discountsStore = tx.objectStore("discounts");

  exportObj.products = [];
  exportObj.discounts = [];

  productsStore.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      exportObj.products.push(cursor.value);
      cursor.continue();
    }
  };

  discountsStore.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      exportObj.discounts.push(cursor.value);
      cursor.continue();
    }
  };

  tx.oncomplete = function() {
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bandpos_export.json";
    a.click();

    URL.revokeObjectURL(url);
  };
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.products || !data.discounts) throw new Error("Invalid file format");

      const tx = db.transaction(["products", "discounts"], "readwrite");
      const productsStore = tx.objectStore("products");
      const discountsStore = tx.objectStore("discounts");

      productsStore.clear();
      discountsStore.clear();

      data.products.forEach(p => productsStore.add(p));
      data.discounts.forEach(d => discountsStore.put(d));

      tx.oncomplete = () => {
        displayInventory();
        loadDiscounts();
        alert("Import successful!");
      };
    } catch(err) {
      alert("Failed to import data: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Hook import/export buttons if they exist

document.getElementById("exportBtn")?.addEventListener("click", exportData);

document.getElementById("importFile")?.addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (file) {
    importData(file);
    e.target.value = ""; // reset input
  }
});

// --- Discounts Management ---

function loadDiscounts() {
  const list = document.getElementById("discountList");
  list.innerHTML = "";

  if (!db) return;

  const tx = db.transaction("discounts", "readonly");
  const store = tx.objectStore("discounts");

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const discount = cursor.value;
      const li = document.createElement("li");
      li.textContent = `${discount.name} — ${discount.type === "percent" ? discount.value + "%" : "$" + discount.value.toFixed(2)}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (confirm(`Delete discount "${discount.name}"?`)) {
          const txDel = db.transaction("discounts", "readwrite");
          txDel.objectStore("discounts").delete(discount.name).onsuccess = () => loadDiscounts();
        }
      };
      li.appendChild(delBtn);
      list.appendChild(li);
      cursor.continue();
    }
  };
}

document.getElementById("discountForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("discountName").value.trim();
  const type = document.getElementById("discountType").value;
  const value = parseFloat(document.getElementById("discountValue").value);

  if (!name || isNaN(value)) {
    alert("Please enter valid discount name and value.");
    return;
  }

  const tx = db.transaction("discounts", "readwrite");
  const store = tx.objectStore("discounts");
  store.put({ name, type, value });
  tx.oncomplete = () => {
    loadDiscounts();
    document.getElementById("discountForm").reset();
  };
});

// --- Export / Import Functions ---

// Helper: Convert products and discounts arrays to XLSX worksheet
function jsonToWorksheet(dataArray) {
  return XLSX.utils.json_to_sheet(dataArray);
}

// Export Inventory to Excel
function exportInventory() {
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const products = [];
  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
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

// Import Inventory from Excel
function handleInventoryImport(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
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

// Export Discounts to Excel
function exportDiscounts() {
  const tx = db.transaction("discounts", "readonly");
  const store = tx.objectStore("discounts");
  const discounts = [];
  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
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

// Import Discounts from Excel
function handleDiscountImport(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
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

// --- Make sure these functions are global if needed ---
window.exportInventory = exportInventory;
window.handleInventoryImport = handleInventoryImport;
window.exportDiscounts = exportDiscounts;
window.handleDiscountImport = handleDiscountImport;
window.loadDiscounts = loadDiscounts;

