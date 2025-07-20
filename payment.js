function openPaymentModal() {
  const cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const modal = document.getElementById("paymentModal");
  modal.style.display = "block";
}

function closePaymentModal() {
  document.getElementById("paymentModal").style.display = "none";
}

function finalizeTransaction() {
  const cart = JSON.parse(localStorage.getItem("shoppingCart") || "[]");
  if (cart.length === 0) return alert("Nothing to sell.");

  const paymentMethod = document.getElementById("paymentMethod").value;
  const timestamp = new Date().toISOString();
  const transactionId = `TXN-${Date.now()}`;

  const transaction = {
    id: transactionId,
    items: cart,
    paymentMethod,
    timestamp
  };

  // Save to IndexedDB
  const tx = db.transaction("sales", "readwrite");
  const store = tx.objectStore("sales");
  store.add(transaction);

  localStorage.removeItem("shoppingCart");
  updateCartIcon?.(); // Optional
  closePaymentModal();
  closeCartModal?.(); // Optional
  alert("Purchase recorded!");
}
