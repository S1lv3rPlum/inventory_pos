let db;

document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("BandPOSDB", 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("products")) {
      db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("✅ DB opened");
    displayInventory();
  };

  request.onerror = function () {
    alert("❌ Failed to open DB");
  };

  const addForm = document.getElementById("addProductForm");
  addForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const hasSizes = document.getElementById("productHasSizes").checked;
    const gender = document.getElementById("productGenderMale").checked
      ? "M"
      : document.getElementById("productGenderFemale").checked
      ? "F"
      : "";

    const imageFile = document.getElementById("productImage").files[0];
    const reader = new FileReader();

    reader.onload = function () {
      const imageData = reader.result || null;

      const sizes = hasSizes
        ? ["S", "M", "L", "XL", "2XL"].map(size => ({ size, stock: 0 }))
        : [{ size: "One Size", stock: 0 }];

      const newProduct = {
        name,
        category,
        price,
        gender,
        image: imageData,
        variants: sizes
      };

      const tx = db.transaction("products", "readwrite");
      const store = tx.objectStore("products");
      const request = store.add(newProduct);

      request.onsuccess = function () {
        alert("✅ Product added!");
        addForm.reset();
        displayInventory();
      };

      request.onerror = function (e) {
        alert("❌ Error: " + e.target.error);
      };
    };

    if (imageFile) {
      reader.readAsDataURL(imageFile);
    } else {
      reader.onload(); // run with null image
    }
  });
});

function displayInventory() {
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const request = store.getAll();

  request.onsuccess = function () {
    const table = document.querySelector("#inventoryTable tbody");
    table.innerHTML = "";

    request.result.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>${product.variants.map(v => v.size).join(", ")}</td>
      `;
      table.appendChild(row);
    });
  };
}