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
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

// Load data from localStorage or start empty
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
let discounts = JSON.parse(localStorage.getItem(DISCOUNTS_KEY)) || [];

// Save helpers
function saveProducts() { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }
function saveDiscounts() { localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts)); }

// --- NEW: Handle image preview + compression ---
let currentCompressedImage = "";
productImageInput?.addEventListener("change", function() {
  const file = this.files[0];
  if (!file) { currentCompressedImage = ""; imagePreview.src = ""; return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const maxWidth = 500;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      currentCompressedImage = canvas.toDataURL("image/jpeg", 0.7);
      imagePreview.src = currentCompressedImage;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Render products
function renderProducts() {
  productTableBody.innerHTML = "";
  if (products.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6; // reduced because no category column now
    td.style.textAlign = "center";
    td.textContent = "No products found.";
    tr.appendChild(td);
    productTableBody.appendChild(tr);
    return;
  }

  // Group products by category
  const grouped = {};
  products.forEach((p, index) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push({ ...p, index });
  });

  // Render based on screen size
  if (window.innerWidth < 768) {
    // Mobile: cards grouped by category
    productTableBody.parentElement.style.display = "block";
    Object.keys(grouped).forEach(category => {
      // Category header row
      let trHeader = document.createElement("tr");
      trHeader.innerHTML = `<td colspan="6" class="category-header"><strong>${category}</strong></td>`;
      productTableBody.appendChild(trHeader);

      grouped[category].forEach(product => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td colspan="6">
            <div class="product-card">
              ${product.image ? `<img src="${product.image}" class="product-thumb">` : ""}
              <div><strong>${product.name}</strong></div>
              <div>$${parseFloat(product.price).toFixed(2)} - ${product.gender}</div>
              <div>${product.hasSizes === "Yes" ? DEFAULT_SIZES.map(size => `${size}: ${product.sizes[size] || 0}`).join(", ") : `One Size: ${product.sizes.OneSize || 0}`}</div>
              <div class="actions">
                <button class="edit-btn" data-index="${product.index}">Edit</button>
                <button class="delete-btn" data-index="${product.index}">Delete</button>
              </div>
            </div>
          </td>
        `;
        productTableBody.appendChild(tr);
      });
    });
  } else {
    // Desktop: table layout grouped by category
    Object.keys(grouped).forEach(category => {
      // Category header row
      let trHeader = document.createElement("tr");
      trHeader.innerHTML = `<td colspan="6" class="category-header"><strong>${category}</strong></td>`;
      productTableBody.appendChild(trHeader);

      grouped[category].forEach(product => {
        let sizesText = product.hasSizes === "Yes"
          ? DEFAULT_SIZES.map(size => `${size}: ${product.sizes?.[size] ?? 0}`).join(", ")
          : `One Size: ${product.sizes?.OneSize || 0}`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${product.image ? `<img src="${product.image}" class="product-thumb">` : ""}</td>
          <td>${product.name}</td>
          <td>$${parseFloat(product.price).toFixed(2)}</td>
          <td>${product.gender}</td>
          <td>${sizesText}</td>
          <td class="actions">
            <button class="edit-btn" data-index="${product.index}">Edit</button>
            <button class="delete-btn" data-index="${product.index}">Delete</button>
          </td>
        `;
        productTableBody.appendChild(tr);
      });
    });
  }

  // Reattach event listeners
  document.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", handleEditProduct));
  document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", handleDeleteProduct));
}

// Add product
addProductForm.addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);

  // Get checked gender radio value
  const genderInput = document.querySelector('input[name="productGender"]:checked');
  const gender = genderInput ? genderInput.value : "";

  // Checkbox checked returns true/false
  const hasSizes = document.getElementById("productHasSizes").checked ? "Yes" : "No";

  if (!name || !category || isNaN(price) || !gender) {
    alert("Please fill in all product fields correctly.");
    return;
  }

  let sizes = {};
  if (hasSizes === "Yes") {
    DEFAULT_SIZES.forEach(size => sizes[size] = 0);
  } else {
    sizes.OneSize = 0;
  }

  products.push({
    name, category, price, gender, hasSizes, sizes,
    image: currentCompressedImage || ""
  });

  saveProducts();
  renderProducts();
  addProductForm.reset();
  imagePreview.src = "";
  currentCompressedImage = "";
  document.getElementById("productName").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
// Rest of your edit/save/delete discount logic remains unchanged...
// (Keep your handleEditProduct, handleSaveProduct, handleDeleteProduct, renderDiscounts, etc.)
// Get discount form element
const discountForm = document.getElementById("discountForm");

// Handle discount form submit
discountForm.addEventListener("submit", e => {
  e.preventDefault();

  const reason = document.getElementById("discountName").value.trim();
  const type = document.getElementById("discountType").value;
  const value = parseFloat(document.getElementById("discountValue").value);

  if (!reason || isNaN(value)) {
    alert("Please fill in discount reason and a valid value.");
    return;
  }

  discounts.push({ reason, type, value });
  saveDiscounts();
  renderDiscounts();

  discountForm.reset();
});

// Render discounts table
function renderDiscounts() {
  const discountTableBody = document.getElementById("discountTableBody");
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
      <td>${discount.reason}</td>
      <td>${discount.type}</td>
      <td>${discount.value}</td>
      <td>
        <button class="edit-discount" data-index="${index}">Edit</button>
        <button class="delete-discount" data-index="${index}">Delete</button>
      </td>
    `;
    discountTableBody.appendChild(tr);
  });

  // Attach handlers after rendering
  document.querySelectorAll(".delete-discount").forEach(btn => {
    btn.addEventListener("click", handleDeleteDiscount);
  });

  document.querySelectorAll(".edit-discount").forEach(btn => {
    btn.addEventListener("click", handleEditDiscount);
  });
}

  // Add edit/delete handlers if you want, or leave blank for now
}
// discount saveDiscountsfunction

function handleDeleteDiscount(e) {
  const index = e.target.getAttribute("data-index");
  if (confirm("Are you sure you want to delete this discount?")) {
    discounts.splice(index, 1);
    saveDiscounts();
    renderDiscounts();
  }
}

function handleEditDiscount(e) {
  const index = e.target.getAttribute("data-index");
  const discount = discounts[index];
  const discountForm = document.getElementById("discountForm");
  const submitBtn = discountForm.querySelector("button[type='submit']");

  // Fill form with existing values
  document.getElementById("discountName").value = discount.reason;
  document.getElementById("discountType").value = discount.type;
  document.getElementById("discountValue").value = discount.value;

  // Change button text to indicate edit mode
  submitBtn.textContent = "Save Changes";
  submitBtn.style.backgroundColor = "#ff9800"; // orange to stand out

  // Change submit behavior to save changes
  discountForm.onsubmit = function(ev) {
    ev.preventDefault();

    const updatedReason = document.getElementById("discountName").value.trim();
    const updatedType = document.getElementById("discountType").value;
    const updatedValue = parseFloat(document.getElementById("discountValue").value);

    if (!updatedReason || isNaN(updatedValue)) {
      alert("Please fill in discount reason and a valid value.");
      return;
    }

    // Save updated discount
    discounts[index] = { reason: updatedReason, type: updatedType, value: updatedValue };
    saveDiscounts();
    renderDiscounts();
    discountForm.reset();

    // Restore normal add mode
    submitBtn.textContent = "Add Discount";
    submitBtn.style.backgroundColor = "";
    discountForm.onsubmit = defaultDiscountSubmit;
  };
}

defaultDiscountSubmit(e) {
  e.preventDefault();

  const reason = document.getElementById("discountName").value.trim();
  const type = document.getElementById("discountType").value;
  const value = parseFloat(document.getElementById("discountValue").value);

  if (!reason || isNaN(value)) {
    alert("Please fill in discount reason and a valid value.");
    return;
  }

  discounts.push({ reason, type, value });
  saveDiscounts();
  renderDiscounts();
  discountForm.reset();
}

discountForm.addEventListener("submit", defaultDiscountSubmit);

// Responsive re-render on resize
window.addEventListener("resize", renderProducts);

// Init
window.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderDiscounts();
});