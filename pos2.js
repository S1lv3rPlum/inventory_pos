let products = [];
let discounts = [];
let cart = [];

const productSelect = document.getElementById("productSelect");
const sizeSelect = document.getElementById("sizeSelect");
const discountSelect = document.getElementById("discountSelect");
const cartContents = document.getElementById("cartContents");
const cartTotal = document.getElementById("cartTotal");
const completeSaleBtn = document.getElementById("completeSaleBtn");
const eventNameDiv = document.getElementById("eventName");
const contactForm = document.getElementById("customerContactForm");
const contactMethodSelect = document.getElementById("contactMethod");
const contactDetailsField = document.getElementById("contactDetailsField");
const contactDetailLabel = document.getElementById("contactDetailLabel");
const contactDetailsInput = document.getElementById("contactDetails");
const saveContactBtn = document.getElementById("saveContactBtn");

const STORAGE_PRODUCTS_KEY = "inventory_products";
const STORAGE_DISCOUNTS_KEY = "BandPOSDB_discounts";
const STORAGE_SALES_KEY = "BandPOSDB_sales";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function displayEventDate() {
  const todayStr = getTodayDate();
  eventNameDiv.textContent = todayStr;
}

function loadProducts() {
  const data = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  if (!data) {
    products = [];
    return;
  }
  try {
    products = JSON.parse(data);
  } catch {
    products = [];
  }
}

function loadDiscounts() {
  const data = localStorage.getItem(STORAGE_DISCOUNTS_KEY);
  if (!data) {
    discounts = [];
    return;
  }
  try {
    discounts = JSON.parse(data);
  } catch {
    discounts = [];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

function saveSales(sale) {
  let sales = [];
  const data = localStorage.getItem(STORAGE_SALES_KEY);
  if (data) {
    try {
      sales = JSON.parse(data);
    } catch {
      sales = [];
    }
  }
  sales.push(sale);
  localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(sales));
}

function populateProductSelect() {
  productSelect.innerHTML = `<option value="">-- Choose a product --</option>`;
  products.forEach((p, i) => {
    productSelect.innerHTML += `<option value="${i}">${p.name}</option>`;
  });
  sizeSelect.innerHTML = `<option value="">-- Choose size --</option>`;
  sizeSelect.disabled = true;
  if (discountSelect) {
  discountSelect.value = "none";
}
}

productSelect.addEventListener("change", () => {
  const index = parseInt(productSelect.value);
  const p = products[index];
  sizeSelect.disabled = !p;
  if (p) {
    sizeSelect.innerHTML = `<option value="">-- Choose size --</option>`;
    if (p.hasSizes) {
      // Use keys from sizes object for sizes with stock
      Object.keys(p.sizes).forEach(size => {
        const stock = p.sizes[size];
        sizeSelect.innerHTML += `<option value="${size}">${size} (${stock} in stock)</option>`;
      });
    } else {
      // Only one size
      const stock = p.sizes.OneSize || 0;
      sizeSelect.innerHTML += `<option value="OneSize">One Size (${stock} in stock)</option>`;
    }
  } else {
    sizeSelect.innerHTML = `<option value="">-- Choose size --</option>`;
  }
});

function populateDiscountSelect() {
  discountSelect.innerHTML = `<option value="none">None</option>`;
  discounts.forEach(d => {
    const label = d.type === "flat"
      ? `$${d.value} off - ${d.name}`
      : `${d.value}% off - ${d.name}`;
    discountSelect.innerHTML += `<option value="${d.name}">${label}</option>`;
  });
}

document.getElementById("posForm").addEventListener("submit", e => {
  e.preventDefault();
  const productIndex = parseInt(productSelect.value);
  const size = sizeSelect.value;
  if (isNaN(productIndex) || productIndex < 0 || !size) {
    return alert("Select product & size.");
  }
  const product = products[productIndex];
  if (!product) {
    return alert("Select a valid product.");
  }
  const availableStock = product.sizes[size] || 0;
  if (availableStock < 1) {
    return alert("Out of stock!");
  }
  const existing = cart.find(item => item.name === product.name && item.size === size);
  if (existing) {
    const newQty = existing.qty + 1;
    if (newQty > availableStock) {
      return alert("Not enough stock!");
    }
    existing.qty = newQty;
  } else {
    cart.push({
      name: product.name,
      size,
      price: product.price,
      qty: 1,
      discountName: null // no discount applied when adding to cart now
    });
  }
  updateCartDisplay();
});

function updateCartDisplay() {
  if (!cart.length) {
    cartContents.innerHTML = "<p>Cart is empty.</p>";
    cartTotal.textContent = "0.00";
    completeSaleBtn.disabled = true;
    return;
  }

  let html = `<table><thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th><th>Action</th></tr></thead><tbody>`;
  let total = 0;

  cart.forEach((it, i) => {
    let dp = it.price;
    if (it.discountName) {
      const d = discounts.find(x => x.name === it.discountName);
      if (d) {
        if (d.type === "flat") {
          dp = Math.max(0, dp - d.value);
        } else {
          dp = dp * (1 - d.value / 100);
        }
      }
    }

    const line = dp * it.qty;
    total += line;

    let discountOptions = `<option value="none"${!it.discountName ? " selected" : ""}>None</option>`;
    discounts.forEach(d => {
      const selected = it.discountName === d.name ? " selected" : "";
      const label = d.type === "flat" ? `$${d.value} off - ${d.name}` : `${d.value}% off - ${d.name}`;
      discountOptions += `<option value="${d.name}"${selected}>${label}</option>`;
    });

    html += `<tr>
      <td>${escapeHtml(it.name)}</td>
      <td>${escapeHtml(it.size)}</td>
      <td>${it.qty}</td>
      <td>$${it.price?.toFixed(2) ?? "?"}</td>
      <td>
        <select onchange="changeLineDiscount(${i}, this.value)">
          ${discountOptions}
        </select>
      </td>
      <td>$${line.toFixed(2)}</td>
      <td><button onclick="removeFromCart(${i})">Remove</button></td>
    </tr>`;
  });

  html += `</tbody></table>`;
  cartContents.innerHTML = html;
  cartTotal.textContent = total.toFixed(2);
  completeSaleBtn.disabled = false;

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
}

function changeLineDiscount(index, discountName) {
  if (!cart[index]) return;
  if (discountName === "none") {
    cart[index].discountName = null;
  } else {
    cart[index].discountName = discountName;
  }
  updateCartDisplay();
}

function removeFromCart(i) {
  cart.splice(i, 1);
  updateCartDisplay();
}

completeSaleBtn.addEventListener("click", () => {
  if (!cart.length) return alert("Nothing to sell.");

  const contactInfo = JSON.parse(localStorage.getItem("customerCheckoutInfo") || "null");

  const sale = {
    date: new Date().toISOString(),
    event: getTodayDate(),
    items: JSON.parse(JSON.stringify(cart)),
    contact: contactInfo || null
  };

  // Update stock for products
cart.forEach(it => {
  const prodIndex = products.findIndex(p => p.name === it.name);
  if (prodIndex === -1) return;
  const sizeKey = it.size;
  if (products[prodIndex].sizes[sizeKey] !== undefined) {
    products[prodIndex].sizes[sizeKey] -= it.qty;
    if (products[prodIndex].sizes[sizeKey] < 0) {
      products[prodIndex].sizes[sizeKey] = 0; // safeguard
    }
  }
});

  // Save updated products back to localStorage
  saveProducts();

  // Save sale record
  saveSales(sale);

  alert("Sale completed!");

  // Clear cart and update display
  cart = [];
  updateCartDisplay();
  populateProductSelect();

  localStorage.removeItem("shoppingCart");
  localStorage.removeItem("customerCheckoutInfo");
});

// Escape HTML helper
function escapeHtml(t) {
  return (!t) ? "" : t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Contact info handling
contactMethodSelect.addEventListener("change", () => {
  const method = contactMethodSelect.value;
  if (method === "email") {
    contactDetailLabel.textContent = "Email Address:";
    contactDetailsInput.placeholder = "Enter email";
    contactDetailsField.style.display = "block";
  } else if (method === "text") {
    contactDetailLabel.textContent = "Phone Number:";
    contactDetailsInput.placeholder = "Enter phone number";
    contactDetailsField.style.display = "block";
  } else {
    contactDetailsField.style.display = "none";
  }
});

saveContactBtn.addEventListener("click", () => {
  const method = contactMethodSelect.value;
  const detail = contactDetailsInput.value.trim();

  if (!method) {
    alert("Please select a contact method.");
    return;
  }

  if (!detail) {
    alert(`Please enter your ${method === "email" ? "email address" : "phone number"}.`);
    return;
  }

  const contactInfo = { method, detail };
  localStorage.setItem("customerCheckoutInfo", JSON.stringify(contactInfo));
  alert("Contact info saved.");
  contactForm.style.display = "block";
});

// On DOM ready
document.addEventListener("DOMContentLoaded", () => {
  displayEventDate();
  loadProducts();
  loadDiscounts();
  populateProductSelect();

  try {
    cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  } catch {
    cart = [];
  }
  updateCartDisplay();

const savedContact = JSON.parse(localStorage.getItem("customerCheckoutInfo") || "null");
if (savedContact) {
  contactMethodSelect.value = savedContact.method || "";
  contactDetailsInput.value = savedContact.details || "";  // <--- use 'details' plural here
  contactDetailsField.style.display = savedContact.method ? "block" : "none";
} else {
  contactForm.style.display = "block";
}
});
