// Storage keys
const STORAGE_PRODUCTS_KEY = "BandPOSDB_products";
const STORAGE_DISCOUNTS_KEY = "BandPOSDB_discounts";
const STORAGE_PRODUCT_ID_COUNTER = "BandPOSDB_productIdCounter";

// Debug status display helper (same as before)
function updateDebugStatus(message) {
  const debugElem = document.getElementById("debugStatus");
  if (debugElem) {
    debugElem.textContent = message;
  } else {
    console.log("DebugStatus element not found.");
    console.log(message);
  }
}

// Utility: Load array from localStorage or return empty array
function loadArrayFromStorage(key) {
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to parse localStorage key ${key}:`, e);
    return [];
  }
}

// Utility: Save array to localStorage
function saveArrayToStorage(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error(`Failed to save localStorage key ${key}:`, e);
  }
}

// Utility: Get next product ID (auto-increment)
function getNextProductId() {
  let idCounter = parseInt(localStorage.getItem(STORAGE_PRODUCT_ID_COUNTER));
  if (isNaN(idCounter) || idCounter < 1) idCounter = 1;
  localStorage.setItem(STORAGE_PRODUCT_ID_COUNTER, (idCounter + 1).toString());
  return idCounter;
}

// Add Product Form submit handler
document.getElementById("addProductForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const priceRaw = document.getElementById("productPrice").value;
  const price = parseFloat(priceRaw);
  if (!name || isNaN(price)) {
    alert("Please enter valid product name and price.");
    return;
  }
  const hasSizes = document.getElementById("productHasSizes").checked;
  // Gender radio checkboxes (you have toggleGender function to keep only one checked)
  const gender = document.getElementById("productGenderMale").checked ? "M" :
                 document.getElementById("productGenderFemale").checked ? "F" : "";
  // Image file processing
  const imageInput = document.getElementById("productImage");
  const imageFile = imageInput.files[0];
  const reader = new FileReader();
  reader.onload = function() {
    const imageData = reader.result || null;
    const defaultSizes = ["XS","S","M","L","XL","2XL","3XL","4XL"];
    const variants = hasSizes
      ? defaultSizes.map(size => ({ size, stock: 0 }))
      : [{ size: "One Size", stock: 0 }];
    // Get existing products
    const products = loadArrayFromStorage(STORAGE_PRODUCTS_KEY);
    // Create new product with unique id
    const newProduct = {
      id: getNextProductId(),
      name,
      category,
      price,
      gender,
      variants,
      image: imageData,
    };
    products.push(newProduct);
    saveArrayToStorage(STORAGE_PRODUCTS_KEY, products);
    updateDebugStatus("Product added.");
    document.getElementById("addProductForm").reset();
    displayInventory();
  };
  if (imageFile) {
    reader.readAsDataURL(imageFile);
  } else {
    reader.onload();
  }
});

// Display Inventory Table (reads from localStorage)
function displayInventory() {
  const container = document.getElementById("inventoryList");
  container.innerHTML = "";
  updateDebugStatus("Loading inventory...");
  const products = loadArrayFromStorage(STORAGE_PRODUCTS_KEY);
  if (products.length === 0) {
    updateDebugStatus("No products found.");
    container.textContent = "No products found.";
    return;
  }
  // Sort by category then product name
  products.sort((a, b) => {
    const catComp = (a.category || "").localeCompare(b.category || "");
    return catComp !== 0 ? catComp : (a.name || "").localeCompare(b.name || "");
  });
  // Group products by category
  const groupedProducts = products.reduce((groups, product) => {
    const category = product.category || "(No Category)";
    if (!groups[category]) groups[category] = [];
    groups[category].push(product);
    return groups;
  }, {});
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
  for (const [category, categoryProducts] of Object.entries(groupedProducts)) {
    categoryProducts.forEach((product, index) => {
      const row = document.createElement("tr");
      if (index === 0) {
        const catCell = document.createElement("td");
        catCell.textContent = category;
        catCell.style.fontWeight = "bold";
        catCell.rowSpan = categoryProducts.length;
        row.appendChild(catCell);
      }
      // Product Name
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
      const imgInput = document.createElement("input");
      imgInput.type = "file";
      imgInput.accept = "image/*";
      imgInput.style.display = "none";
      imgCell.appendChild(imgInput);
      row.appendChild(imgCell);
      // Sizes & Qty
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
      // Actions
      const actionCell = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.style.display = "none";
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      // Event handlers below:
      editBtn.onclick = () => {
        nameInput.disabled = false;
        priceInput.disabled = false;
        genderInput.disabled = false;
        imgInput.style.display = "inline-block";
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
        const updatedImage = imgPreview.src;
        const updatedVariants = [];
        sizeCell.querySelectorAll("label").forEach(label => {
          const sizeText = label.querySelector("span").textContent || "";
          const size = sizeText.replace(":", "").trim();
          const qty = parseInt(label.querySelector("input").value);
          updatedVariants.push({ size, stock: isNaN(qty) ? 0 : qty });
        });
        const products = loadArrayFromStorage(STORAGE_PRODUCTS_KEY);
        const productIndex = products.findIndex(p => p.id === product.id);
        if (productIndex === -1) {
          alert("Error: Product not found.");
          return;
        }
        products[productIndex] = {
          ...products[productIndex],
          name: updatedName,
          price: updatedPrice,
          gender: updatedGender,
          image: updatedImage,
          variants: updatedVariants
        };
        saveArrayToStorage(STORAGE_PRODUCTS_KEY, products);
        updateDebugStatus("Product saved.");
        displayInventory();
      };
      deleteBtn.onclick = () => {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
          return;
        }
        let products = loadArrayFromStorage(STORAGE_PRODUCTS_KEY);
        products = products.filter(p => p.id !== product.id);
        saveArrayToStorage(STORAGE_PRODUCTS_KEY, products);
        updateDebugStatus("Product deleted.");
        displayInventory();
      };
      actionCell.appendChild(editBtn);
      actionCell.appendChild(saveBtn);
      actionCell.appendChild(deleteBtn);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

// Load Discounts and render discount table, from localStorage
function loadDiscounts() {
  const discountTableBody = document.getElementById("discountTableBody");
  if (!discountTableBody) {
    console.error("ERROR: discountTableBody element not found");
    return;
  }
  discountTableBody.innerHTML = "";
  const discounts = loadArrayFromStorage(STORAGE_DISCOUNTS_KEY);
  if (discounts.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align:center; font-style: italic;">No discounts found.</td>`;
    discountTableBody.appendChild(tr);
    return;
  }
  discounts.forEach(discount => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${discount.name}</td>
      <td>${discount.type === "percent" ? "% off" : "$ off"}</td>
      <td>${discount.type === "percent" ? discount.value + "%" : "$" + discount.value.toFixed(2)}</td>
      <td><button class="delete-discount-btn">Delete</button></td>
    `;
    row.querySelector(".delete-discount-btn").onclick = () => {
      if (confirm(`Delete discount "${discount.name}"?`)) {
        let discounts = loadArrayFromStorage(STORAGE_DISCOUNTS_KEY);
        discounts = discounts.filter(d => d.name !== discount.name);
        saveArrayToStorage(STORAGE_DISCOUNTS_KEY, discounts);
        updateDebugStatus(`Discount "${discount.name}" deleted.`);
        loadDiscounts();
      }
    };
    discountTableBody.appendChild(row);
  });
}

// Discount Form submit handler
document.getElementById("discountForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("discountName").value.trim();
  const type = document.getElementById("discountType").value;
  const valueRaw = document.getElementById("discountValue").value;
  const value = parseFloat(valueRaw);
  if (!name || !type || isNaN(value)) {
    alert("Please enter valid discount name and value.");
    return;
  }
  let discounts = loadArrayFromStorage(STORAGE_DISCOUNTS_KEY);
  // Check for unique discount name
  const existingIndex = discounts.findIndex(d => d.name.toLowerCase() === name.toLowerCase());
  if (existingIndex !== -1) {
    discounts[existingIndex] = { name, type, value };
  } else {
    discounts.push({ name, type, value });
  }
  saveArrayToStorage(STORAGE_DISCOUNTS_KEY, discounts);
  updateDebugStatus(`Discount "${name}" saved successfully.`);
  loadDiscounts();
  document.getElementById("discountForm").reset();
});

// Export Helpers using XLSX lib - unchanged except sourcing from localStorage
function jsonToWorksheet(dataArray) {
  return XLSX.utils.json_to_sheet(dataArray);
}

// Updated exportInventory to flatten variants for export
function exportInventory() {
  const products = loadArrayFromStorage(STORAGE_PRODUCTS_KEY);
  if (products.length === 0) {
    alert("No inventory to export.");
    return;
  }
  // Flatten products by variants
  const flattened = [];
  products.forEach(product => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.variants.forEach(variant => {
        flattened.push({
          Category: product.category || "",
          "Product Name": product.name || "",
          Price: product.price != null ? product.price.toFixed(2) : "",
          Gender: product.gender || "",
          Size: variant.size || "",
          Stock: variant.stock != null ? variant.stock : 0,
          Image: product.image || "",
        });
      });
    } else {
      // If no variants, export a single row with empty variant fields
      flattened.push({
        Category: product.category || "",
        "Product Name": product.name || "",
        Price: product.price != null ? product.price.toFixed(2) : "",
        Gender: product.gender || "",
        Size: "",
        Stock: 0,
        Image: product.image || "",
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(flattened);
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "inventory_export.xlsx");
}

function exportDiscounts() {
  const discounts = loadArrayFromStorage(STORAGE_DISCOUNTS_KEY);
  if (discounts.length === 0) {
    alert("No discounts to export.");
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = jsonToWorksheet(discounts);
  XLSX.utils.book_append_sheet(wb, ws, "Discounts");
  XLSX.writeFile(wb, "discounts_export.xlsx");
}

// Import handlers
function handleInventoryImport(event) {
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
      const importedRows = XLSX.utils.sheet_to_json(sheet);

      const productsMap = new Map();

      importedRows.forEach(row => {
        const id = typeof row.id === "number" ? row.id : getNextProductId();
        if (!productsMap.has(id)) {
          productsMap.set(id, {
            id,
            name: row.name || "",
            category: row.category || "",
            price: typeof row.price === "number" ? row.price : 0,
            gender: row.gender || "",
            image: row.image || null,
            variants: []
          });
        }
        const product = productsMap.get(id);
        const variantSize = row.size || "One Size";
        const variantStock = Number.isInteger(row.stock) ? row.stock : 0;
        const existingVariant = product.variants.find(v => v.size === variantSize);
        if (!existingVariant) {
          product.variants.push({ size: variantSize, stock: variantStock });
        }
      });

      const products = Array.from(productsMap.values());

      saveArrayToStorage(STORAGE_PRODUCTS_KEY, products);
      updateDebugStatus("Inventory imported successfully!");
      displayInventory();
      alert("Inventory imported successfully!");
    } catch (err) {
      updateDebugStatus("Failed to import inventory.");
      alert("Failed to import inventory: " + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}

function handleDiscountImport(event) {
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
      // Validate and fix imported discount data if needed
      const discounts = importedDiscounts.map(item => {
        return {
          name: item.name || "",
          type: item.type || "flat",
          value: typeof item.value === "number" ? item.value : 0
        };
      });
      saveArrayToStorage(STORAGE_DISCOUNTS_KEY, discounts);
      updateDebugStatus("Imported discounts.");
      loadDiscounts();
      alert("Discounts imported successfully!");
    } catch (err) {
      alert("Failed to import discounts: " + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}

// Expose functions