let db;
let products = [];
let discounts = [];
let cart = [];

const productSelect = document.getElementById("productSelect");
const sizeSelect = document.getElementById("sizeSelect");
const discountSelect = document.getElementById("discountSelect");
const cartContents = document.getElementById("cartContents");
const cartTotal = document.getElementById("cartTotal");
const completeSaleBtn = document.getElementById("completeSaleBtn");
const eventNameDiv = document.getElementById("eventName"); // now a div, not input
const contactForm = document.getElementById("customerContactForm");
const contactMethodSelect = document.getElementById("contactMethod");
const contactDetailsField = document.getElementById("contactDetailsField");
const contactDetailLabel = document.getElementById("contactDetailLabel");
const contactDetailsInput = document.getElementById("contactDetails");
const saveContactBtn = document.getElementById("saveContactBtn");

// Get today's date in YYYY-MM-DD format for event
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

// Display the event date (readonly)
function displayEventDate() {
  const todayStr = getTodayDate();
  eventNameDiv.textContent = todayStr;
}

// Setup IndexedDB
const request = indexedDB.open("BandPOSDB", 2);
request.onupgradeneeded = event => {
  db = event.target.result;
  if (!db.objectStoreNames.contains("products"))
    db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
  if (!db.objectStoreNames.contains("discounts"))
    db.createObjectStore("discounts", { keyPath: "name" });
  if (!db.objectStoreNames.contains("sales"))
    db.createObjectStore("sales", { keyPath: "saleId", autoIncrement: true });
};

request.onsuccess = event => {
  db = event.target.result;
  loadProducts();
  loadDiscounts();

  // Load cart from shared "shoppingCart" localStorage (unified with Browse)
  try {
    cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  } catch {
    cart = [];
  }
  updateCartDisplay();
};

request.onerror = () => alert("Database error");

function loadProducts() {
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const temp = [];

  store.openCursor().onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      temp.push(cursor.value);
      cursor.continue();
    } else {
      const grouped = {};
      temp.forEach(p => {
        const key = `${p.name}||${p.category || ""}`;
        if (!grouped[key]) grouped[key] = { ...p };
        else {
          p.variants.forEach(v => {
            const e = grouped[key].variants.find(x => x.size === v.size);
            if (e) e.stock += v.stock;
            else grouped[key].variants.push({ ...v });
          });
        }
      });
      products = Object.values(grouped);

      // Link prices to cart items missing price
      cart.forEach(item => {
        if (!item.price) {
          const prod = products.find(p => p.name === item.name);
          if (prod) item.price = prod.price;
        }
      });

      populateProductSelect();
      updateCartDisplay();
    }
  };
}

function populateProductSelect() {
  productSelect.innerHTML = `<option value="">-- Choose a product --</option>`;
  products.forEach(p => {
    const key = `${p.name}||${p.category || ""}`;
    productSelect.innerHTML += `<option value="${key}">${p.name}</option>`;
  });
  sizeSelect.innerHTML = `<option value="">-- Choose size --</option>`;
  sizeSelect.disabled = true;
  discountSelect.value = "none";
}

productSelect.addEventListener("change", () => {
  const [name, category] = productSelect.value.split("||");
  const p = products.find(x => x.name === name && (x.category || "") === category);
  sizeSelect.disabled = !p;
  if (p) {
    sizeSelect.innerHTML = `<option value="">-- Choose size --</option>`;
    p.variants.forEach(v => {
      sizeSelect.innerHTML += `<option value="${v.size}">${v.size} (${v.stock} in stock)</option>`;
    });
  } else {
    sizeSelect.innerHTML = `<option value="">-- Choose size --</option>`;
  }
});

function loadDiscounts() {
  const tx = db.transaction("discounts", "readonly");
  const store = tx.objectStore("discounts");
  discounts = [];
  store.openCursor().onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      discounts.push(cursor.value);
      cursor.continue();
    } else populateDiscountSelect();
  };
}

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
  const [name, category] = productSelect.value.split("||");
  const product = products.find(p => p.name === name && (p.category || "") === (category || ""));
  const size = sizeSelect.value;
  const discName = discountSelect.value;

  if (!product || !size) return alert("Select product & size.");
  const variant = product.variants.find(v => v.size === size);
  if (!variant || variant.stock < 1) return alert("Out of stock!");

  const existing = cart.find(item => item.name === product.name && item.size === size);
  if (existing) {
    if (existing.qty + 1 > variant.stock) return alert("Not enough stock!");
    existing.qty++;
  } else {
    cart.push({
      name: product.name,
      size,
      price: product.price,
      qty: 1,
      discountName: discName === "none" ? null : discName
    });
  }

  discountSelect.value = "none";
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
    // Calculate discounted price for display, but discount selection editable below
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

    // Create discount options HTML for dropdown
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

  localStorage.setItem("posCart", JSON.stringify(cart));
}

// Add this function to update discount for a cart line and refresh display
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
  if (!db || !cart.length) return alert("Nothing to sell.");

  const contactInfo = JSON.parse(localStorage.getItem("customerCheckoutInfo") || "null");

  const sale = {
    date: new Date(),
    event: getTodayDate(), // event is always today’s date
    items: JSON.parse(JSON.stringify(cart)),
    contact: contactInfo || null
  };

  const tx = db.transaction(["sales", "products"], "readwrite");
  const sStore = tx.objectStore("sales");
  const pStore = tx.objectStore("products");

  sStore.add(sale);

  cart.forEach(it => {
    const prod = products.find(p => p.name === it.name);
    if (!prod) return;
    const variant = prod.variants.find(v => v.size === it.size);
    if (!variant) return;
    variant.stock -= it.qty;

    const tx2 = db.transaction("products", "readwrite");
    const store2 = tx2.objectStore("products");
    store2.openCursor().onsuccess = function (event) {
      const cursor = event.target.result;
      if (cursor) {
        const item = cursor.value;
        if (item.name === prod.name && (item.category || "") === (prod.category || "")) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        store2.add(prod);
      }
    };
  });

  tx.oncomplete = () => {
    alert("Sale completed!");
    cart = [];
    updateCartDisplay();
    loadProducts();
    localStorage.removeItem("shoppingCart");
    localStorage.removeItem("customerCheckoutInfo");
  };
});

function escapeHtml(t) {
  return (!t) ? "" : t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Contact Info handling
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

// Show saved contact info if any on load
document.addEventListener("DOMContentLoaded", () => {
  displayEventDate();

  const savedContact = JSON.parse(localStorage.getItem("customerCheckoutInfo") || "null");
  if (savedContact) {
    contactForm.style.display = "block";
    contactMethodSelect.value = savedContact.method || "";
    contactDetailsInput.value = savedContact.detail || "";
    contactDetailsField.style.display = savedContact.method ? "block" : "none";
  } else {
    contactForm.style.display = "block"; // always visible
  }
});
