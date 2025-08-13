/***********************
 * Band Inventory (localStorage only)
 * - Category grouping
 * - Inline size qty inputs in table rows
 * - Top Add Product form retained
 * - Image compression + preview
 * - Discounts: add/edit/delete (no regressions)
 ***********************/

// Storage keys
const PRODUCTS_KEY = "inventory_products";
const DISCOUNTS_KEY = "inventory_discounts";

// Sizes when "Has Sizes" is checked
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Elements (match your HTML)
const addProductForm = document.getElementById("addProductForm");
const productTableBody = document.getElementById("productTableBody");
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

const discountForm = document.getElementById("discountForm");
const discountTableBody = document.getElementById("discountTableBody");

// State
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
let discounts = JSON.parse(localStorage.getItem(DISCOUNTS_KEY)) || [];
let currentCompressedImage = "";
let editIndex = -1; // -1 => add mode; otherwise editing that product

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}
function saveDiscounts() {
  localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
}

/* ---------- Image compression + preview ---------- */
productImageInput?.addEventListener("change", function () {
  const file = this.files?.[0];
  if (!file) {
    currentCompressedImage = "";
    imagePreview.src = "";
    imagePreview.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 600;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      currentCompressedImage = canvas.toDataURL("image/jpeg", 0.75);
      imagePreview.src = currentCompressedImage;
      imagePreview.style.display = "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- Helpers ---------- */

// ensure a product has the right size structure
function normalizeSizes(product) {
  if (product.hasSizes === "Yes") {
    product.sizes = product.sizes || {};
    DEFAULT_SIZES.forEach((sz) => {
      if (typeof product.sizes[sz] !== "number") product.sizes[sz] = 0;
    });
    // Remove OneSize if it exists
    if ("OneSize" in product.sizes) delete product.sizes.OneSize;
  } else {
    const existing =
      product.sizes && typeof product.sizes.OneSize === "number"
        ? product.sizes.OneSize
        : 0;
    product.sizes = { OneSize: existing };
    // Remove size map keys if any leaked in
    Object.keys(product.sizes).forEach((k) => {
      if (k !== "OneSize") delete product.sizes[k];
    });
  }
  return product;
}

function qtyInput(name, idx, sizeKey, value) {
  // data attrs used to update localStorage on change
  return `<label style="display:inline-flex;align-items:center;gap:.35rem;margin:.15rem .35rem;">
    <span style="min-width:2.5rem;display:inline-block">${name}</span>
    <input class="size-qty" type="number" min="0" step="1"
      data-index="${idx}" data-size="${sizeKey}" value="${Number(value) || 0}" style="max-width:90px" />
  </label>`;
}

/* ---------- Render Products (with category grouping + inline qty inputs) ---------- */
function renderProducts() {
  productTableBody.innerHTML = "";

  // If no products, show friendly row
  if (!products.length) {
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
    const cat = p.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...p, _index: index });
  });

  // For every category render a header row then each product
  Object.keys(grouped).forEach((category) => {
    // category header
    const hdr = document.createElement("tr");
    hdr.innerHTML = `<td colspan="6" class="category-header"><strong>${category}</strong></td>`;
    productTableBody.appendChild(hdr);

    grouped[category].forEach((product) => {
      // make sure its size structure is sane
      normalizeSizes(product);

      // Build sizes cell HTML
      let sizesHTML = "";
      if (product.hasSizes === "Yes") {
        sizesHTML = DEFAULT_SIZES.map((sz) =>
          qtyInput(sz, product._index, sz, product.sizes?.[sz] ?? 0)
        ).join("");
      } else {
        sizesHTML = qtyInput("Qty", product._index, "OneSize", product.sizes?.OneSize ?? 0);
      }

      const priceText = isNaN(product.price) ? "" : `$${Number(product.price).toFixed(2)}`;
      const imgHTML = product.image
        ? `<img src="${product.image}" class="product-thumb" style="max-width:60px;max-height:60px;border-radius:4px;"/>`
        : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${imgHTML}</td>
        <td>${product.name || ""}</td>
        <td>${priceText}</td>
        <td>${product.gender || ""}</td>
        <td>${sizesHTML}</td>
        <td class="actions">
          <button class="edit-btn" data-index="${product._index}">Edit</button>
          <button class="delete-btn" data-index="${product._index}">Delete</button>
        </td>
      `;
      productTableBody.appendChild(tr);
    });
  });

  // Wire up qty changes (inline)
  document.querySelectorAll("input.size-qty").forEach((inp) => {
    inp.addEventListener("input", onQtyChange);
  });

  // Wire up edit/delete
  document.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", handleEditProduct)
  );
  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", handleDeleteProduct)
  );
}

function onQtyChange(e) {
  const idx = Number(e.target.dataset.index);
  const sizeKey = e.target.dataset.size;
  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
  if (!products[idx]) return;
  products[idx].sizes = products[idx].sizes || {};
  products[idx].sizes[sizeKey] = val;
  saveProducts();
}

/* ---------- Add / Edit Products using top form ---------- */
addProductForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const hasSizes = document.getElementById("productHasSizes").checked ? "Yes" : "No";
  const genderRadio = document.querySelector('input[name="productGender"]:checked');
  const gender = genderRadio ? genderRadio.value : "";

  if (!name || !category || !gender || isNaN(price)) {
    alert("Please fill in all product fields correctly.");
    return;
  }

  if (editIndex === -1) {
    // ADD
    const newProd = {
      name,
      category,
      price,
      gender,
      hasSizes,
      sizes: {},
      image: currentCompressedImage || ""
    };
    if (hasSizes === "Yes") {
      DEFAULT_SIZES.forEach((sz) => (newProd.sizes[sz] = 0));
    } else {
      newProd.sizes.OneSize = 0;
    }
    products.push(newProd);
  } else {
    // SAVE EDIT
    const existing = products[editIndex] || {};
    const updated = {
      ...existing,
      name,
      category,
      price,
      gender,
      hasSizes,
      image: currentCompressedImage || existing.image || ""
    };

    // If hasSizes changed, reshape sizes
    if (hasSizes === "Yes") {
      const prev = existing.sizes || {};
      const reshaped = {};
      DEFAULT_SIZES.forEach((sz) => {
        reshaped[sz] = typeof prev[sz] === "number" ? prev[sz] : 0;
      });
      updated.sizes = reshaped;
    } else {
      // merge all sizes into OneSize (sum) or keep existing OneSize
      const prev = existing.sizes || {};
      let sum = 0;
      Object.keys(prev).forEach((k) => (sum += Number(prev[k]) || 0));
      updated.sizes = { OneSize: sum };
    }

    products[editIndex] = updated;
  }

  saveProducts();
  renderProducts();
  resetProductForm();
});

function resetProductForm() {
  editIndex = -1;
  addProductForm.reset();
  // Clear image preview state
  currentCompressedImage = "";
  imagePreview.src = "";
  imagePreview.style.display = "none";

  const submitBtn = addProductForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Add Product";
    submitBtn.style.backgroundColor = "";
  }
}

function handleDeleteProduct(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (!products[idx]) return;
  if (confirm("Are you sure you want to delete this product?")) {
    products.splice(idx, 1);
    saveProducts();
    renderProducts();
    // If you were editing this one, reset form
    if (editIndex === idx) resetProductForm();
  }
}

function handleEditProduct(e) {
  const idx = Number(e.currentTarget.dataset.index);
  const p = products[idx];
  if (!p) return;
  editIndex = idx;

  document.getElementById("productName").value = p.name || "";
  document.getElementById("productCategory").value = p.category || "";
  document.getElementById("productPrice").value = typeof p.price === "number" ? p.price : "";
  document.getElementById("productHasSizes").checked = p.hasSizes === "Yes";

  // gender radios
  const male = document.querySelector('input[name="productGender"][value="M"]');
  const female = document.querySelector('input[name="productGender"][value="F"]');
  if (male) male.checked = p.gender === "M";
  if (female) female.checked = p.gender === "F";

  // image preview
  if (p.image) {
    imagePreview.src = p.image;
    imagePreview.style.display = "block";
    currentCompressedImage = p.image;
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none";
    currentCompressedImage = "";
  }

  const submitBtn = addProductForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Save Changes";
    submitBtn.style.backgroundColor = "#ff9800";
  }

  // Scroll to top so the form is visible
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Discounts (unchanged behaviors) ---------- */

function renderDiscounts() {
  discountTableBody.innerHTML = "";

  if (!discounts.length) {
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

  // wire up buttons
  discountTableBody.querySelectorAll(".delete-discount").forEach((btn) =>
    btn.addEventListener("click", handleDeleteDiscount)
  );
  discountTableBody.querySelectorAll(".edit-discount").forEach((btn) =>
    btn.addEventListener("click", handleEditDiscount)
  );
}

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

  const submitBtn = discountForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Add/Update Discount";
    submitBtn.style.backgroundColor = "";
  }
}

function handleDeleteDiscount(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (!discounts[idx]) return;
  if (confirm("Are you sure you want to delete this discount?")) {
    discounts.splice(idx, 1);
    saveDiscounts();
    renderDiscounts();
  }
}

function handleEditDiscount(e) {
  const idx = Number(e.currentTarget.dataset.index);
  const d = discounts[idx];
  if (!d) return;

  document.getElementById("discountName").value = d.reason;
  document.getElementById("discountType").value = d.type;
  document.getElementById("discountValue").value = d.value;

  const submitBtn = discountForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Save Changes";
    submitBtn.style.backgroundColor = "#ff9800";
  }

  discountForm.onsubmit = function (ev) {
    ev.preventDefault();

    const updatedReason = document.getElementById("discountName").value.trim();
    const updatedType = document.getElementById("discountType").value;
    const updatedValue = parseFloat(document.getElementById("discountValue").value);

    if (!updatedReason || isNaN(updatedValue)) {
      alert("Please fill in discount reason and a valid value.");
      return;
    }

    discounts[idx] = { reason: updatedReason, type: updatedType, value: updatedValue };
    saveDiscounts();
    renderDiscounts();
    discountForm.reset();

    // restore add mode
    if (submitBtn) {
      submitBtn.textContent = "Add/Update Discount";
      submitBtn.style.backgroundColor = "";
    }
    discountForm.onsubmit = defaultDiscountSubmit;
  };
}

// attach default submit for discounts
discountForm.addEventListener("submit", defaultDiscountSubmit);

/* ---------- Init ---------- */
window.addEventListener("resize", renderProducts);
window.addEventListener("DOMContentLoaded", () => {
  // Normalize any previously-saved products to the new size schema
  products = products.map(normalizeSizes);
  saveProducts();

  renderProducts();
  renderDiscounts();
});