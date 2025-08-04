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
    console.log("IndexedDB opened successfully.");
    displayInventory();
  };

  request.onerror = function (event) {
    console.error("Error opening IndexedDB:", event.target.error);
  };

  const addForm = document.getElementById("addProductForm");
  if (addForm) {
    addForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("productName").value.trim();
      const category = document.getElementById("productCategory").value.trim();
      const price = parseFloat(document.getElementById("productPrice").value);
      const hasSizes = document.getElementById("productHasSizes")?.checked || false;
      const gender = document.getElementById("productGenderMale")?.checked
        ? "M"
        : document.getElementById("productGenderFemale")?.checked
        ? "F"
        : "";

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
          console.log("✅ Product added successfully.");
          addForm.reset();
          displayInventory();
        };

        addRequest.onerror = (event) => {
          console.error("❌ Error adding product:", event.target.error);
        };
      };

      if (imageFile) {
        reader.readAsDataURL(imageFile);
      } else {
        reader.onload();
      }
    });
  }
});

function displayInventory() {
  const table = document.getElementById("inventoryTable");
  if (!table) return;

  // Clear existing rows
  table.innerHTML = "";

  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const request = store.openCursor();

  request.onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const product = cursor.value;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>${product.gender}</td>
        <td>${product.variants.map(v => v.size).join(", ")}</td>
        <td>${product.image ? `<img src="${product.image}" width="50">` : "No Image"}</td>
      `;

      table.appendChild(row);
      cursor.continue();
    }
  };

  request.onerror = function (event) {
    console.error("Error displaying inventory:", event.target.error);
  };
}