// This JS file manages the BandPOS product manager system using IndexedDB

document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("BandPOSDB", 2);
  let db;

  request.onupgradeneeded = (e) => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("products")) {
      const productStore = db.createObjectStore("products", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;
    displayInventory();
  };

  request.onerror = (e) => {
    console.error("Database error:", e.target.error);
  };

  document.getElementById("addProductForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("productName")?.value.trim();
    const category = document.getElementById("productCategory")?.value.trim();
    const price = parseFloat(document.getElementById("productPrice")?.value);
    const hasSizes = document.getElementById("productHasSizes")?.checked || false;
    const gender = document.getElementById("productGenderMale")?.checked
      ? "M"
      : document.getElementById("productGenderFemale")?.checked
      ? "F"
      : "";

    if (!name || isNaN(price)) {
      alert("Please enter a valid product name and price.");
      return;
    }

    const imageInput = document.getElementById("productImage");
    const imageFile = imageInput?.files[0];
    const reader = new FileReader();

    reader.onload = function () {
      const imageData = reader.result || null;

      const defaultSizes = ["S", "M", "L", "XL", "2XL"];
      const variants = hasSizes
        ? defaultSizes.map((size) => ({ size, stock: 0 }))
        : [{ size: "One Size", stock: 0 }];

      const newProduct = {
        name,
        category,
        price,
        gender,
        variants,
        image: imageData,
      };

      const tx = db.transaction("products", "readwrite");
      const store = tx.objectStore("products");
      const addRequest = store.add(newProduct);

      addRequest.onsuccess = () => {
        document.getElementById("addProductForm").reset();
        displayInventory();
      };

      addRequest.onerror = (event) => {
        alert("Failed to add product: " + event.target.error);
      };
    };

    if (imageFile) {
      reader.readAsDataURL(imageFile);
    } else {
      reader.onload();
    }
  });

  function displayInventory() {
    const tx = db.transaction("products", "readonly");
    const store = tx.objectStore("products");
    const request = store.getAll();

    request.onsuccess = function () {
      const products = request.result;
      const tableBody = document.getElementById("inventoryTableBody");
      tableBody.innerHTML = "";

      products.forEach((product) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>$${product.price.toFixed(2)}</td>
          <td>${product.gender}</td>
          <td>${product.variants.map((v) => `${v.size}: ${v.stock}`).join("<br>")}</td>
          <td><img src="${product.image}" alt="Product Image" style="width: 50px; height: auto;"></td>
        `;
        tableBody.appendChild(row);
      });
    };
  }
});