console.log("JS is running");

// Inject styles directly into the page
const style = document.createElement("style");
style.textContent = `
/* Remove spinners in Chrome, Safari, Edge, Opera */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Remove spinners in Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

body {
  font-family: sans-serif;
  padding: 20px;
  max-width: 900px;
  margin: auto;
}

form {
  margin-bottom: 20px;
}

input, select {
  margin-right: 10px;
  padding: 5px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f0f0f0;
}

td, th {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.editing input, .editing select {
  width: 100%;
  box-sizing: border-box;
}

button.edit, button.save {
  background-color: #fff7a8;
  border: none;
  padding: 5px 8px;
  cursor: pointer;
}

button.delete {
  background-color: #ffb3b3;
  border: none;
  padding: 5px 8px;
  cursor: pointer;
}

button:hover {
  opacity: 0.8;
}
#tabs button {
  margin-right: 10px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.edit-btn,
.delete-btn {
  padding: 4px 8px;
  font-size: 0.9rem;
  cursor: pointer;
}
.category-header {
  background-color: #f0f0f0;
  font-weight: bold;
}
`;
document.head.appendChild(style);

// Size labels
const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Load from localStorage if available
let products = JSON.parse(localStorage.getItem("products")) || [];
let discounts = JSON.parse(localStorage.getItem("discounts")) || [];

// Save to localStorage whenever products or discounts change
function saveToLocalStorage() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("discounts", JSON.stringify(discounts));
}

// DOM elements
const addForm = document.getElementById("addProductForm");
const tableBody = document.querySelector("#inventoryTable tbody");

// Form submit handler for adding a product
addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Build product object with values from form inputs
  const product = {
    category: addForm.category.value.trim(),
    name: addForm.name.value.trim(),
    unisex: addForm.unisex.value,
    hasSizes: addForm.hasSizes.value,
    sizes: null,
  };

  // Initialize sizes counts to zero if product has sizes
  if (product.hasSizes === "Yes") {
    product.sizes = sizeLabels.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
  }

  products.push(product);       // Add new product to products array
  saveToLocalStorage();         // Save updated data
  addForm.reset();              // Clear the form inputs
  renderTable();                // Re-render the product table
});

// Render the inventory table with categories and products
function renderTable() {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const tableBody = document.querySelector("#inventoryTable tbody");
  tableBody.innerHTML = ""; // Clear previous rows

  console.log("Rendering table...");
  console.log("Products in localStorage:", products);

  const groupedProducts = {};

  // Group by category
  products.forEach((product) => {
    if (!groupedProducts[product.category]) {
      groupedProducts[product.category] = [];
    }
    groupedProducts[product.category].push(product);
  });

  // For each category
  Object.keys(groupedProducts).forEach((category) => {
    // Add category row
    const categoryRow = document.createElement("tr");
    categoryRow.classList.add("category-row");
    categoryRow.innerHTML = `<td colspan="12" style="font-weight:bold;">${category}</td>`;
    tableBody.appendChild(categoryRow);

    // Add product rows under this category
    groupedProducts[category].forEach((product, index) => {
      const row = document.createElement("tr");

      const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

      row.innerHTML = `
        <td></td> <!-- empty category cell -->
        <td class="name"><span>${product.name}</span></td>
        <td class="unisex"><span>${product.unisex}</span></td>
        ${sizeLabels.map(() => `<td>-</td>`).join("")}
        <td>
          <div class="actions">
            <button class="edit" data-index="${index}">✏️</button>
            <button class="delete" data-index="${index}">🗑️</button>
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });
  });
}

// Make a row editable with inputs/selects
function makeRowEditable(row, product) {
  row.classList.add("editing");

  const categoryCell = row.querySelector(".category");
  const categoryText = categoryCell.querySelector("span").textContent;
  categoryCell.innerHTML = `<input type="text" class="edit-category" value="${categoryText}" />`;

  const nameCell = row.querySelector(".name");
  const nameText = nameCell.querySelector("span").textContent;
  nameCell.innerHTML = `<input type="text" class="edit-name" value="${nameText}" />`;

  const unisexCell = row.querySelector(".unisex");
  const unisexText = unisexCell.querySelector("span").textContent;
  unisexCell.innerHTML = `
    <select class="edit-unisex">
      <option value="Yes" ${unisexText === "Yes" ? "selected" : ""}>Yes</option>
      <option value="No" ${unisexText === "No" ? "selected" : ""}>No</option>
    </select>
  `;

  sizeLabels.forEach(size => {
    const cell = row.querySelector(`.size-${size}`);
    if (product.hasSizes === "Yes") {
      const val = product.sizes[size];
      cell.innerHTML = `<input type="number" min="0" class="edit-size" data-size="${size}" value="${val}" />`;
    } else {
      cell.textContent = "-";
    }
  });

  const editBtn = row.querySelector(".edit");
  editBtn.textContent = "✅ Save";
  editBtn.classList.add("save");
  editBtn.classList.remove("edit");
}

// Save edited row back to products array
function saveRow(row, index) {
  const newCategory = row.querySelector(".edit-category").value.trim();
  const newName = row.querySelector(".edit-name").value.trim();
  const newUnisex = row.querySelector(".edit-unisex").value;
  let newHasSizes = "No";
  let newSizes = null;

  const sizeInputs = row.querySelectorAll(".edit-size");
  if (sizeInputs.length) {
    newHasSizes = "Yes";
    newSizes = {};
    sizeInputs.forEach(input => {
      const sizeKey = input.dataset.size;
      const val = parseInt(input.value);
      newSizes[sizeKey] = isNaN(val) || val < 0 ? 0 : val;
    });
  }

  products[index] = {
    category: newCategory,
    name: newName,
    unisex: newUnisex,
    hasSizes: newHasSizes,
    sizes: newSizes,
  };

  saveToLocalStorage();
  renderTable();
}

// === Section Toggle Logic ===
function switchTab(tab) {
  document.getElementById("inventoryTable").parentElement.style.display = tab === "inventory" ? "block" : "none";
  document.getElementById("discountSection").style.display = tab === "discounts" ? "block" : "none";
  document.getElementById("addProductForm").style.display = tab === "inventory" ? "block" : "none";
  document.getElementById("sectionTitle").textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
}

// === Discount Logic ===
const discountForm = document.getElementById("addDiscountForm");
const discountTable = document.getElementById("discountTable").querySelector("tbody");

// Render discounts in table
function renderDiscounts() {
  discountTable.innerHTML = "";
  discounts.forEach((discount, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td contenteditable="true" oninput="updateDiscountField(${index}, 'name', this.innerText)">${discount.name}</td>
      <td>
        <select onchange="updateDiscountField(${index}, 'type', this.value)">
          <option value="Percentage" ${discount.type === "Percentage" ? "selected" : ""}>Percentage</option>
          <option value="Fixed" ${discount.type === "Fixed" ? "selected" : ""}>Fixed</option>
          <option value="BOGO" ${discount.type === "BOGO" ? "selected" : ""}>BOGO</option>
        </select>
      </td>
      <td contenteditable="true" oninput="updateDiscountField(${index}, 'value', this.innerText)">${discount.value}</td>
      <td><button onclick="deleteDiscount(${index})">Delete</button></td>
    `;
    discountTable.appendChild(row);
  });
}

// Update discount field called from inline handlers
function updateDiscountField(index, field, value) {
  if (field === "value") {
    value = parseFloat(value);
    if (isNaN(value)) return;
  }
  discounts[index][field] = value;
  saveToLocalStorage();
  renderDiscounts();
}

// Delete discount
function deleteDiscount(index) {
  discounts.splice(index, 1);
  saveToLocalStorage();
  renderDiscounts();
}

// Attach update and delete functions to window so inline handlers can access them
window.updateDiscountField = updateDiscountField;
window.deleteDiscount = deleteDiscount;

// Discount form submit handler
discountForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(discountForm);
  const newDiscount = {
    name: formData.get("discountName"),
    type: formData.get("discountType"),
    value: parseFloat(formData.get("discountValue"))
  };
  discounts.push(newDiscount);
  saveToLocalStorage();
  renderDiscounts();
  discountForm.reset();
});



.table-scroll {
  overflow-x: auto;
  padding-right: 16px; /* Adjust this value if you want more/less space */
  background-color: white; /* Ensures the space is white if needed */
}

function handleEdit(rowIndex) {
  const product = products[rowIndex];
  if (!product) return;

  // Populate the form fields with existing product data
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productName").value = product.name;
  document.getElementById("productUnisex").value = product.unisex;
  document.getElementById("productHasSizes").value = product.hasSizes;

  if (product.hasSizes === "Yes") {
    for (let size in product.sizes) {
      document.getElementById(`size-${size}`).value = product.sizes[size];
    }
  } else {
    sizeLabels.forEach(size => {
      document.getElementById(`size-${size}`).value = "";
    });
  }

  // Remove the product from the array so re-submitting updates it
  products.splice(rowIndex, 1);
  saveProducts();
  renderTable();
}

<script>
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded.");

  // Just to test — show what’s in storage
  const saved = localStorage.getItem("products");
  console.log("Stored products:", saved);

  const tableBody = document.querySelector("#inventoryTable tbody");
  tableBody.innerHTML = "";

  if (!saved) {
    tableBody.innerHTML = "<tr><td colspan='12'>No products saved yet.</td></tr>";
    return;
  }

  const products = JSON.parse(saved);
  if (!Array.isArray(products) || products.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='12'>Product list is empty.</td></tr>";
    return;
  }

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.category || ""}</td>
      <td>${product.name || ""}</td>
      <td>${product.unisex || ""}</td>
      <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
      <td>
        <button>✏️</button>
        <button>🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
});
</script>