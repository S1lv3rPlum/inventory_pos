let db;
const request = indexedDB.open("BandPOSDB", 2);

request.onsuccess = function (event) {
  db = event.target.result;
  loadProducts();
  updateCartIcon();
};

function loadProducts() {
  const gallery = document.getElementById("productGallery");
  gallery.innerHTML = "";

  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const product = cursor.value;
      const card = document.createElement("div");
      card.className = "product-card";

      const img = document.createElement("img");
      img.src = product.image ? `product-images/${product.image}` : "product-images/default.jpg";
      img.alt = product.name;
      img.className = "product-image";

      const label = document.createElement("div");
      label.textContent = product.name;
      label.className = "product-label";

      card.appendChild(img);
      card.appendChild(label);

      card.addEventListener("mousedown", e => startLongPress(e, product));
      card.addEventListener("touchstart", e => startLongPress(e, product));
      card.addEventListener("mouseup", clearLongPress);
      card.addEventListener("mouseleave", clearLongPress);
      card.addEventListener("touchend", clearLongPress);

      gallery.appendChild(card);
      cursor.continue();
    }
  };
}

let longPressTimer = null;
function startLongPress(e, product) {
  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => openAddToCartModal(product), 600);
}
function clearLongPress() {
  clearTimeout(longPressTimer);
}

function openAddToCartModal(product) {
  const modal = document.getElementById("productModal");
  modal.style.display = "flex";

  document.getElementById("modalProductName").textContent = product.name;
  const sizeSelect = document.getElementById("productSize");
  const sizeRow = document.getElementById("sizeRow");
  sizeSelect.innerHTML = "";
  const variants = product.variants || [];

  if (variants.length > 1) {
    sizeRow.style.display = "block";
    variants.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.size;
      opt.textContent = `${v.size} (Qty: ${v.stock})`;
      sizeSelect.appendChild(opt);
    });
  } else {
    sizeRow.style.display = "none";
    if (variants.length === 1) {
      sizeSelect.innerHTML = `<option value="${variants[0].size}" selected></option>`;
    }
  }

  document.getElementById("productQty").value = 1;
  document.getElementById("addToCartForm").onsubmit = e => {
    e.preventDefault();
    addToCart(product);
  };
}

function changeQty(delta) {
  const qtyInput = document.getElementById("productQty");
  let current = parseInt(qtyInput.value) || 1;
  current = Math.max(1, current + delta);
  qtyInput.value = current;
}

function addToCart(product) {
  const size = document.getElementById("productSize").value;
  const qty = parseInt(document.getElementById("productQty").value);
  if (!size || isNaN(qty) || qty <= 0) return alert("Please enter a valid quantity.");

  let cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size);
  const stock = product.variants.find(v => v.size === size)?.stock ?? 0;

  const inCartQty = existingIndex >= 0 ? cart[existingIndex].qty : 0;
  if (inCartQty + qty > stock) return alert(`Only ${stock - inCartQty} item(s) remaining.`);

  const price = product.price ?? 0;

  if (existingIndex >= 0) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, size, qty, price });
  }

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  updateCartIcon();
  closeModal();
}

function updateCartIcon() {
  const cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const icon = document.getElementById("cartCount");
  if (icon) icon.textContent = total;
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

function openCart() {
  const cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  const list = document.getElementById("cartContents");
  list.innerHTML = "";

  if (!cart.length) {
    list.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    const ul = document.createElement("ul");
    let subtotal = 0;

    cart.forEach(item => {
      const price = item.price ?? 0;
      const lineTotal = price * item.qty;
      subtotal += lineTotal;

      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name} (${item.size}) - Qty: ${item.qty} - $${lineTotal.toFixed(2)}
        <button onclick="changeCartQty(${cart.indexOf(item)}, -1)" class="qty-btn">−</button>
        <button onclick="changeCartQty(${cart.indexOf(item)}, 1)" class="qty-btn">+</button>
      `;
      ul.appendChild(li);
    });

    list.appendChild(ul);

    const subtotalDiv = document.createElement("div");
    subtotalDiv.style.fontWeight = "bold";
    subtotalDiv.style.marginTop = "10px";
    subtotalDiv.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
    list.appendChild(subtotalDiv);
  }

  const actions = document.createElement("div");
  actions.innerHTML = `
    <button onclick="goToCheckout()" class="cart-action-btn">Go to Checkout</button>
    <button onclick="clearCart()" class="cart-action-btn" style="background: darkred;">Clear Cart</button>
    <button onclick="closeCartModal()" class="cart-action-btn">Browse More Products</button>
  `;
  list.appendChild(actions);

  document.getElementById("cartModal").style.display = "flex";
}

function changeCartQty(index, delta) {
  let cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  if (!cart[index]) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  updateCartIcon();
  openCart();
}

function clearCart() {
  if (confirm("Are you sure you want to clear your cart?")) {
    localStorage.removeItem("shoppingCart");
    updateCartIcon();
    closeCartModal();
  }
}

function goToCheckout() {
  closeCartModal();
  document.getElementById("shippingModal").style.display = "flex";
}

function closeCartModal() {
  document.getElementById("cartModal").style.display = "none";
}

// ✅ Restored missing function
function saveShippingInfo() {
  const name = document.getElementById("shippingName").value.trim();
  const method = document.getElementById("shippingMethod").value;
  const details = document.getElementById("shippingDetails").value.trim();

  if (!method || !details) {
    return alert("Please fill out the shipping information.");
  }

  const info = { method, details };
  if (name) info.name = name;

  localStorage.setItem("shippingInfo", JSON.stringify(info));
  document.getElementById("shippingModal").style.display = "none";
  alert("Shipping info saved!");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".cart-icon")?.addEventListener("click", openCart);
  document.getElementById("saveShippingBtn")?.addEventListener("click", saveShippingInfo);
  updateCartIcon();
});
