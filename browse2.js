function loadProducts() {
  const gallery = document.getElementById("productGallery");
  gallery.innerHTML = ""; // clear current content
  const PRODUCTS_KEY = "inventory_products";
  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
  // Group products by category
  const groupedProducts = products.reduce((groups, product) => {
    const cat = product.category || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(product);
    return groups;
  }, {});
  Object.keys(groupedProducts).forEach(category => {
    // Create container for category section
    const categorySection = document.createElement("div");
    categorySection.className = "category-section";
    categorySection.style.marginBottom = "2rem"; // spacing between categories
    // Create and append category header
    const categoryHeader = document.createElement("h2");
    categoryHeader.textContent = category;
    categoryHeader.style.marginBottom = "0.75rem";
    categorySection.appendChild(categoryHeader);
    // Create gallery div to hold product cards
    const categoryGallery = document.createElement("div");
    categoryGallery.className = "gallery";
    // Create product cards inside this gallery
    groupedProducts[category].forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      const img = document.createElement("img");
      img.src = product.image || "product-images/default.jpg";
      img.alt = product.name;
      img.className = "product-image";
      const label = document.createElement("div");
      label.textContent = product.name;
      label.className = "product-label";
      card.appendChild(img);
      card.appendChild(label);
      // Add event listeners as before
      card.addEventListener("mousedown", e => startLongPress(e, product));
      card.addEventListener("touchstart", e => startLongPress(e, product));
      card.addEventListener("mouseup", clearLongPress);
      card.addEventListener("mouseleave", clearLongPress);
      card.addEventListener("touchend", clearLongPress);
      categoryGallery.appendChild(card);
    });
    categorySection.appendChild(categoryGallery);  
    gallery.appendChild(categorySection);
  });
}

function clearLongPress() {
  clearTimeout(longPressTimer);
}

let longPressTimer = null;

function startLongPress(event, product) {
  event.preventDefault(); // <- this blocks the image popup menu

  longPressTimer = setTimeout(() => {
    openAddToCartModal(product); // use your existing modal logic
  }, 500);
}

function openAddToCartModal(product) {
  const modal = document.getElementById("productModal");
  modal.style.display = "flex";
  document.getElementById("modalProductName").textContent = product.name;
  const priceElem = document.getElementById("modalProductPrice");
  const priceFormatted = (product.price ?? 0).toFixed(2);
  priceElem.textContent = `Price: $${priceFormatted}`;
  const sizeSelect = document.getElementById("productSize");
  const sizeRow = document.getElementById("sizeRow");
  sizeSelect.innerHTML = "";
  // Remove any previous single quantity message if it exists
  const oldSingleQtyMsg = document.getElementById("singleQtyMessage");
  if (oldSingleQtyMsg) {
    oldSingleQtyMsg.remove();
  }
  if (product.hasSizes) {
    sizeRow.style.display = "block";
    Object.entries(product.sizes).forEach(([size, qty]) => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = `${size} (Qty: ${qty})`;
      sizeSelect.appendChild(option);
    });
    sizeSelect.disabled = false;
  } else {
    // Hide size selector row
    sizeRow.style.display = "none";
    // Show available quantity for single size products
    const oneSizeQty = product.sizes.OneSize || 0;
    const singleQtyMsg = document.createElement("div");
    singleQtyMsg.id = "singleQtyMessage";
    singleQtyMsg.style.marginBottom = "1rem";
    singleQtyMsg.style.fontWeight = "bold";
    singleQtyMsg.textContent = `Available quantity: ${oneSizeQty}`;
    sizeRow.parentNode.insertBefore(singleQtyMsg, sizeRow);
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
  let size;
  const sizeRow = document.getElementById("sizeRow");
  if (sizeRow.style.display === "none") {
    size = "OneSize";
  } else {
    size = document.getElementById("productSize").value;
  }
  const qty = parseInt(document.getElementById("productQty").value);
  if (!size || isNaN(qty) || qty <= 0) return alert("Please enter a valid quantity.");
  let cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  // Find existing item in cart matching product and size
  const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size);
  // Get stock from product.sizes object
  const stock = product.sizes[size] ?? 0;
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

function saveShippingInfo() {
  const name = document.getElementById("customerName").value.trim();
  const method = document.getElementById("shippingMethod").value;
  const details = document.getElementById("shippingDetail").value.trim();
  const address = document.getElementById("shippingAddress").value.trim();
  const city = document.getElementById("shippingCity").value.trim();
  const state = document.getElementById("shippingState").value.trim();
  const zip = document.getElementById("shippingZip").value.trim();

  if (!name || !method || !details || !address || !city || !state || !zip) {
    return alert("Please fill out all shipping fields.");
  }

  const info = { name, method, details, address, city, state, zip };

  localStorage.setItem("shippingInfo", JSON.stringify(info));
  localStorage.setItem("shoppingCart", localStorage.getItem("shoppingCart") || "[]");
  localStorage.setItem("customerCheckoutInfo", localStorage.getItem("shippingInfo"));

  window.location.href = "POS.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartIcon();

  const cartIcon = document.getElementById("cartIcon");
  if (cartIcon) {
    cartIcon.addEventListener("click", openCart);
  }
});

function closeShippingModal() {
  const shippingModal = document.getElementById("shippingModal");
  if (shippingModal) {
    shippingModal.style.display = "none";
  }
  window.location.href = "BrowseProducts.html";
}

