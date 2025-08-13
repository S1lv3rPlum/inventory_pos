// Storage keys
const PRODUCTS_KEY = "inventory_products";
const DISCOUNTS_KEY = "inventory_discounts";
// Sizes for products with sizes
const SIZES_LIST = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Elements
const addProductForm = document.getElementById("addProductForm");
const productTableBody = document.getElementById("productTableBody");
const discountForm = document.getElementById("discountForm");
const discountTableBody = document.getElementById("discountTableBody");
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const sizesContainer = document.createElement("div"); // We'll insert this into form dynamically

// Insert sizesContainer just below the Has Sizes checkbox in form
const hasSizesCheckbox = document.getElementById("productHasSizes");
hasSizesCheckbox.parentNode.insertBefore(sizesContainer, hasSizesCheckbox.nextSibling);

// Load data from localStorage or empty
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
let discounts = JSON.parse(localStorage.getItem(DISCOUNTS_KEY)) || [];

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function saveDiscounts() {
  localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
}

// Image compression and preview
let currentCompressedImage = "";
productImageInput?.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) {
    currentCompressedImage = "";
    imagePreview.src = "";
    imagePreview.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const maxWidth = 500;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      currentCompressedImage = canvas.toDataURL("image/jpeg", 0.7);
      imagePreview.src = currentCompressedImage;
      imagePreview.style.display = "inline-block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Generate size inputs dynamically when editing
function generateSizeInputs(hasSizes, sizesData = {}) {
  sizesContainer.innerHTML = ""; // Clear previous inputs

  if (hasSizes === "Yes") {
    SIZES_LIST.forEach((size) => {
      const div = document.createElement("div");
      div.className = "form-row";
      div.innerHTML = `
        <label for="size-${size}">${size} Quantity:</label>
        <input type="number" id="size-${size}" name="size-${size}" min="0" value="${sizesData[size] || 0}" />
      `;
      sizesContainer.appendChild(div);
    });
  } else {
    const div = document.createElement("div");
    div.className = "form-row";
    div.innerHTML = `
      <label for="size-OneSize">Quantity:</label>
      <input type="number" id="size-OneSize" name="size-OneSize" min="0" value="${sizesData.OneSize || 0}" />
    `;
    sizesContainer.appendChild(div);
  }
}

// Clear size inputs container when resetting the form (add mode)
function clearSizeInputs() {
  sizesContainer.innerHTML = "";
}

// Render products grouped by category
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

  // Group by category
  const grouped = {};
  products.forEach((p, index) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push({ ...p, index });
  });

  Object.keys(grouped).forEach((category) => {
    // Category header row
    const trHeader = document.createElement("tr");
    trHeader.innerHTML = `<td colspan="6" class="category-header"><strong>${category}</strong></td>`;
    productTableBody.appendChild(trHeader);

    grouped[category].forEach((product) => {
      let sizesText = "";
      if (product.hasSizes === "Yes") {
        sizesText = SIZES_LIST.map((size) => `${size}: ${product.sizes?.[size] || 0}`).join(", ");
      } else {
        sizesText = `Qty: ${product.sizes?.OneSize || 0}`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${product.image ? `<img src="${product.image}" class="product-thumb" style="max-width:50px; max-height:50px;">` : ""}</td>
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

  // Attach event listeners for edit/delete buttons
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", handleEditProduct);
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", handleDeleteProduct);
  });
}

// Default submit handler for adding a new product
function defaultAddProductSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const genderInput = document.querySelector('input[name="productGender"]:checked');
  const gender = genderInput ? genderInput.value : "";
  const hasSizes = document.getElementById("productHasSizes").checked ? "Yes" : "No";

  if (!name || !category || isNaN(price) || !gender) {
    alert("Please fill in all product fields correctly.");
    return;
  }

  let sizes = {};
  if (hasSizes === "Yes") {
    SIZES_LIST.forEach((size) => (sizes[size] = 0));
  } else {
    sizes.OneSize = 0;
  }

  products.push({
    name,
    category,
    price,
    gender,
    hasSizes,
    sizes,
    image: currentCompressedImage || "",
  });

  saveProducts();
  renderProducts();
  addProductForm.reset();
  clearSizeInputs();
  imagePreview.src = "";
  imagePreview.style.display = "none";
  currentCompressedImage = "";
  document.getElementById("productName").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Edit product handler
function handleEditProduct(e) {
  const index = e.target.getAttribute("data-index");
  const product = products[index];

  // Fill form fields
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;

  document.querySelectorAll('input[name="productGender"]').forEach((radio) => {
    radio.checked = radio.value === product.gender;
  });

  document.getElementById("productHasSizes").checked = product.hasSizes === "Yes";

  // Show image preview
  if (product.image) {
    imagePreview.src = product.image;
    imagePreview.style.display = "inline-block";
    currentCompressedImage = product.image;
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none";
    currentCompressedImage = "";
  }

  // Generate size inputs dynamically
  generateSizeInputs(product.hasSizes, product.sizes);

  // Change submit button to "Save Changes"
  const submitBtn = addProductForm.querySelector("button[type='submit']");
  submitBtn.textContent = "Save Changes";
  submitBtn.style.backgroundColor = "#ff9800";

  // Temporarily replace form submit for edit
  addProductForm.onsubmit = function (ev) {
    ev.preventDefault();

    const updatedName = document.getElementById("productName").value.trim();
    const updatedCategory = document.getElementById("productCategory").value.trim();
    const updatedPrice = parseFloat(document.getElementById("productPrice").value);
    const updatedGenderInput = document.querySelector('input[name="productGender"]:checked');
    const updatedGender = updatedGenderInput ? updatedGenderInput.value : "";
    const updatedHasSizes = document.getElementById("productHasSizes").checked ? "Yes" : "No";

    if (!updatedName || !updatedCategory || isNaN(updatedPrice) || !updatedGender) {
      alert("Please fill in all product fields correctly.");
      return;
    }

    // Collect size quantities from inputs
    let updatedSizes = {};
    if (updatedHasSizes === "Yes") {
      SIZES_LIST.forEach((size) => {
        const val = parseInt(document.getElementById(`size-${size}`).value);
        updatedSizes[size] = isNaN(val) ? 0 : val;
      });
    } else {
      const val = parseInt(document.getElementById("size-OneSize").value);
      updatedSizes.OneSize = isNaN(val) ? 0 : val;
    }

    // Use existing image (or updatedCompressedImage if you want to implement image change on edit)
    const updatedImage = currentCompressedImage || product.image || "";

    // Update product
    products[index] = {
      name: updatedName,
      category: updatedCategory,
      price: updatedPrice,
      gender: updatedGender,
      hasSizes: updatedHasSizes,
      sizes: updatedSizes,
      image: updatedImage,
    };

    saveProducts();
    renderProducts();
    addProductForm.reset();
    clearSizeInputs();
    imagePreview.src = "";
    imagePreview.style.display = "none";
    currentCompressedImage = "";

    // Restore form submit to default add behavior
    submitBtn.textContent = "Add Product";
    submitBtn.style.backgroundColor = "";
    addProductForm.onsubmit = defaultAddProductSubmit;
  };
}

// Delete product handler
function handleDeleteProduct(e) {
  const index = e.target.getAttribute("data-index");
  if (confirm("Are you sure you want to delete this product?")) {
    products.splice(index, 1);
    saveProducts();
    renderProducts();
  }
}

// DISCOUNT LOGIC

// Default submit handler for discount add
function defaultDiscountSubmit(e) {
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

  // Reset submit button appearance
  const submitBtn = discountForm.querySelector("button[type='submit']");
  submitBtn.textContent = "Add Discount";
  submitBtn.style.backgroundColor = "";
}

// Render discounts table
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

  // Attach edit/delete handlers
  document.querySelectorAll(".delete-discount").forEach((btn) => {
    btn.addEventListener("click", handleDeleteDiscount);
  });
  document.querySelectorAll(".edit-discount").forEach((btn) => {
    btn.addEventListener("click", handleEditDiscount);
  });
}

// Delete discount handler
function handleDeleteDiscount(e) {
  const index = e.target.getAttribute("data-index");
  if (confirm("Are you sure you want to delete this discount?")) {
    discounts.splice(index, 1);
    saveDiscounts();
    renderDiscounts();
  }
}

// Edit discount handler
function handleEditDiscount(e) {
  const index = e.target.getAttribute("data-index");
  const discount = discounts[index];
  const submitBtn = discountForm.querySelector("button[type='submit']");

  document.getElementById("discountName").value = discount.reason;
  document.getElementById("discountType").value = discount.type;
  document.getElementById("discountValue").value = discount.value;

  submitBtn.textContent = "Save Changes";
  submitBtn.style.backgroundColor = "#ff9800";

  discountForm.onsubmit = function (ev) {
    ev.preventDefault();

    const updatedReason = document.getElementById("discountName").value.trim();
    const updatedType = document.getElementById("discountType").value;
    const updatedValue = parseFloat(document.getElementById("discountValue").value);

    if (!updatedReason || isNaN(updatedValue)) {
      alert("Please fill in discount reason and a valid value.");
      return;
    }

    discounts[index] = { reason: updatedReason, type: updatedType, value: updatedValue };
    saveDiscounts();
    renderDiscounts();
    discountForm.reset();

    submitBtn.textContent = "Add Discount";
    submitBtn.style.backgroundColor = "";
    discountForm.onsubmit = defaultDiscountSubmit;
  };
}

// Attach default discount form submit listener
discountForm.addEventListener("submit", defaultDiscountSubmit);

// Responsive re-render on resize
window.addEventListener("resize", renderProducts);

// Initialize on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderDiscounts();
  addProductForm.onsubmit = defaultAddProductSubmit;
});