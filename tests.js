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
  tableBody.innerHTML = "";

  // Group and sort products
  const grouped = {};
  products.forEach(product => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  });

  const sortedCategories = Object.keys(grouped).sort();

  sortedCategories.forEach(category => {
    // Category header row
    const categoryRow = document.createElement("tr");
    categoryRow.innerHTML = `
      <td colspan="${4 + sizeLabels.length}" style="font-weight:bold; background-color:#f0f0f0;">
        ${category}
      </td>
    `;
    tableBody.appendChild(categoryRow);

    // Sort products within category
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));

    // Product rows
    grouped[category].forEach((product, index) => {
      const row = document.createElement("tr");

      if (product.hasSizes === "Yes") {
        row.innerHTML = `
          <td class="name"><span>${product.name}</span></td>
          <td class="unisex"><span>${product.unisex}</span></td>
          ${sizeLabels.map(size => `<td><span>${product.sizes[size]}</span></td>`).join('')}
          <td>
            <div class="actions">
              <button class="edit">✏️</button>
              <button class="delete">🗑️</button>
            </div>
          </td>
        `;
      } else {
        row.innerHTML = `
          <td class="name"><span>${product.name}</span></td>
          <td class="unisex"><span>${product.unisex}</span></td>
          ${sizeLabels.map(() => `<td>-</td>`).join('')}
          <td>
            <div class="actions">
              <button class="edit">✏️</button>
              <button class="delete">🗑️</button>
            </div>
          </td>
        `;
      }

      tableBody.appendChild(row);
    });
  });
}

// Cancel editing on all rows
function cancelAllEdits() {
  document.querySelectorAll("tr.editing").forEach(row => {
    row.classList.remove("editing");
    renderTable();
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

// Initial render calls
renderTable();
renderDiscounts();
switchTab("inventory");

.table-scroll {
  overflow-x: auto;
  padding-right: 16px; /* Adjust this value if you want more/less space */
  background-color: white; /* Ensures the space is white if needed */
}