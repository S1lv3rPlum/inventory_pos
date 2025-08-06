// inventory.js
// Storage keys
const PRODUCTS_KEY = "inventory_products";
const DISCOUNTS_KEY = "inventory_discounts";
// Default sizes if hasSizes = Yes
const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL"];
// Elements
const productSection = document.getElementById("productSection");
const discountSection = document.getElementById("discountSection");
const showProductsBtn = document.getElementById("showProducts");
const showDiscountsBtn = document.getElementById("showDiscounts");
const addProductForm = document.getElementById("addProductForm");
const productTableBody = document.querySelector("#productTable tbody");
const addDiscountForm = document.getElementById("addDiscountForm");
const discountTableBody = document.querySelector("#discountTable tbody");
// Load data from localStorage or start empty
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
let discounts = JSON.parse(localStorage.getItem(DISCOUNTS_KEY)) || [];
// Save to localStorage helpers
function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}
function saveDiscounts() {
  localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
}
// Render products table rows
function renderProducts() {
  productTableBody.innerHTML = "";
  if (products.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.style.textAlign = "center";
    td.textContent = "No products found.";
    tr.appendChild(td);
    productTableBody.appendChild(tr);
    return;
  }
  products.forEach((product, index) => {
    const tr = document.createElement("tr");
    // Sizes display string
    let sizesText = "";
    if (product.hasSizes === "Yes") {
      sizesText = DEFAULT_SIZES.map(size => {
        return `${size}: ${product.sizes?.[size] ?? 0}`;
      }).join(", ");
    } else {
      sizesText = `One Size: ${product.sizes?.OneSize || 0}`;
    }
    tr.innerHTML = `
      <td>${product.category}</td>
      <td>${product.name}</td>
      <td>$${parseFloat(product.price).toFixed(2)}</td>
      <td>${product.gender}</td>
      <td>${sizesText}</td>
      <td class="actions">
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </td>
    `;
    productTableBody.appendChild(tr);
  });
  // Attach event listeners for edit and delete buttons
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", handleEditProduct);
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", handleDeleteProduct);
  });
}
// Render discounts table rows
function renderDiscounts() {
  discountTableBody.innerHTML = "";
  if (discounts.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.style.textAlign = "center";
    td.textContent = "No discounts found.";
    tr.appendChild(td);
    discountTableBody.appendChild(tr);
    return;
  }
  discounts.forEach((discount, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${discount.name}</td>
      <td>${discount.type === "percent" ? "% off" : "$ off"}</td>
      <td>${discount.type === "percent" ? discount.value + "%" : "$" + parseFloat(discount.value).toFixed(2)}</td>
      <td class="actions">
        <button class="delete-discount-btn" data-index="${index}">Delete</button>
      </td>
    `;
    discountTableBody.appendChild(tr);
  });
  // Attach event listeners to delete discount buttons
  document.querySelectorAll(".delete-discount-btn").forEach(btn => {
    btn.addEventListener("click", handleDeleteDiscount);
  });
}
// Handlers
// Add product form submit
addProductForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const gender = document.getElementById("productGender").value;
  const hasSizes = document.getElementById("productHasSizes").value;
  if (!name || !category || isNaN(price) || !gender || !hasSizes) {
    alert("Please fill in all product fields correctly.");
    return;
  }
  // Set default sizes object
  let sizes = {};
  if (hasSizes === "Yes") {
    DEFAULT_SIZES.forEach(size => {
      sizes[size] = 0;
    });
  } else {
    sizes.OneSize = 0;
  }
  // Add new product
  products.push({
    name,
    category,
    price,
    gender,
    hasSizes,
    sizes,
  });
  saveProducts();
  renderProducts();
  addProductForm.reset();
});
// Edit product click handler - switches row content to editable inputs
function handleEditProduct(event) {
  const index = parseInt(event.target.dataset.index);
  const product = products[index];
  if (!product) return;
  // Replace the row with editable inputs
  const tr = event.target.closest("tr");
  tr.innerHTML = `
    <td><input type="text" id="editCategory" value="${product.category}"></td>
    <td><input type="text" id="editName" value="${product.name}"></td>
    <td><input type="number" id="editPrice" step="0.01" min="0" value="${product.price}"></td>
    <td>
      <select id="editGender">
        <option value="M" ${product.gender === "M" ? "selected" : ""}>Male</option>
        <option value="F" ${product.gender === "F" ? "selected" : ""}>Female</option>
        <option value="U" ${product.gender === "U" ? "selected" : ""}>Unisex</option>
      </select>
    </td>
    <td>
      ${product.hasSizes === "Yes"
        ? DEFAULT_SIZES.map(size => `<label>${size}: <input type="number" min="0" data-size="${size}" class="edit-size" value="${product.sizes[size] || 0}"></label><br>`).join("")
        : `<label>One Size: <input type="number" min="0" id="editOneSize" value="${product.sizes.OneSize || 0}"></label>`
      }
    </td>
    <td class="actions">
      <button class="save-btn" data-index="${index}">Save</button>
      <button class="cancel-btn" data-index="${index}">Cancel</button>
    </td>
  `;
  // Attach listeners for save & cancel
  tr.querySelector(".save-btn").addEventListener("click", handleSaveProduct);
  tr.querySelector(".cancel-btn").addEventListener("click", () => {
    renderProducts(); // discard edits, re-render table
  });
}
// Save product after edit
function handleSaveProduct(event) {
  const index = parseInt(event.target.dataset.index);
  const tr = event.target.closest("tr");
  const category = tr.querySelector("#editCategory").value.trim();
  const name = tr.querySelector("#editName").value.trim();
  const price = parseFloat(tr.querySelector("#editPrice").value);
  const gender = tr.querySelector("#editGender").value;
  if (!category || !name || isNaN(price) || !gender) {
    alert("Please fill all product fields correctly.");
    return;
  }
  // Update sizes
  let sizes = {};
  const product = products[index];
  if (product.hasSizes === "Yes") {
    tr.querySelectorAll(".edit-size").forEach(input => {
      const size = input.dataset.size;
      const val = parseInt(input.value);
      sizes[size] = isNaN(val) || val < 0 ? 0 : val;
    });
  } else {
    const val = parseInt(tr.querySelector("#editOneSize").value);
    sizes.OneSize = isNaN(val) || val < 0 ? 0 : val;
  }
  // Update product data
  products[index] = {
    ...products[index],
    category,
    name,
    price,
    gender,
    sizes,
  };
  saveProducts();
  renderProducts();
}
// Delete product
function handleDeleteProduct(event) {
  const index = parseInt(event.target.dataset.index);
  if (confirm(`Delete product "${products[index].name}"? This cannot be undone.`)) {
    products.splice(index, 1);
    saveProducts();
    renderProducts();
  }
}
// Add discount form submit
addDiscountForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("discountName").value.trim();
  const type = document.getElementById("discountType").value;
  const value = parseFloat(document.getElementById("discountValue").value);
  if (!name || !type || isNaN(value)) {
    alert("Please fill all discount fields correctly.");
    return;
  }
  // Check for existing discount duplicate by name
  if (discounts.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    alert("Discount name must be unique.");
    return;
  }
  discounts.push({ name, type, value });
  saveDiscounts();
  renderDiscounts();
  addDiscountForm.reset();
});
// Delete discount
function handleDeleteDiscount(event) {
  const index = parseInt(event.target.dataset.index);
  if (confirm(`Delete discount "${discounts[index].name}"? This cannot be undone.`)) {
    discounts.splice(index, 1);
    saveDiscounts();
    renderDiscounts();
  }
}
// Toggle sections show/hide on buttons
showProductsBtn.addEventListener("click", () => {
  productSection.style.display = "block";
  discountSection.style.display = "none";
  showProductsBtn.classList.add("active-button");
  showDiscountsBtn.classList.remove("active-button");
});
showDiscountsBtn.addEventListener("click", () => {
  productSection.style.display = "none";
  discountSection.style.display = "block";
  showProductsBtn.classList.remove("active-button");
  showDiscountsBtn.classList.add("active-button");
});
// Initialize render on page load
window.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderDiscounts();
});
