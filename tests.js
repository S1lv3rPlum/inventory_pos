document.addEventListener("DOMContentLoaded", function () {
  const addBtn = document.getElementById("addProductBtn");
  if (addBtn) {
    addBtn.addEventListener("click", addProduct);
    console.log("Script loaded, button hooked");
  } else {
    console.error("Add Product button not found.");
  }
});

function addProduct() {
  const nameInput = document.getElementById("productName");
  const priceInput = document.getElementById("productPrice");

  if (!nameInput || !priceInput) {
    alert("Input fields are missing.");
    return;
  }

  const name = nameInput.value.trim();
  const price = priceInput.value.trim();

  if (!name || !price) {
    alert("Please enter both name and price.");
    return;
  }

  alert(`Product added!\nName: ${name}\nPrice: $${price}`);
}