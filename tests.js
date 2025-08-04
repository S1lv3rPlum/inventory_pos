let db;


document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");
  const request = indexedDB.open("BandPOSDB", 2);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("products")) {
      db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("discounts")) {
      db.createObjectStore("discounts", { keyPath: "name" });
    }
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("IndexedDB opened successfully");
    displayInventory();
  };

  request.onerror = function (event) {
    console.error("IndexedDB error:", event.target.errorCode);
  };

  const addForm = document.getElementById("addProductForm");
  if (addForm) {
    console.log("Form found");
    addForm.addEventListener("submit", function (e) {
      e.preventDefault();

      try {
        const name = document.getElementById("productName").value.trim();
        const category = document.getElementById("productCategory").value.trim();
        const price = parseFloat(document.getElementById("productPrice").value);
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
            console.log("✅ Product added successfully.");
            showMessage("✅ Product added successfully.");
            addForm.reset();
            displayInventory();
          };

          addRequest.onerror = (event) => {
            console.error("❌ Error adding product:", event.target.error);
            showMessage("❌ Error adding product: " + event.target.error);
          };
        };

        if (imageFile) {
          reader.readAsDataURL(imageFile);
        } else {
          reader.onload();
        }
      } catch (err) {
        console.error("❌ Exception during add:", err);
        showMessage("❌ Exception during add: " + err.message);
      }
    });
  } else {
    console.error("Form not found!");
  }
});

// Placeholder: show a message on the screen temporarily
function showMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.style.position = "fixed";
  div.style.bottom = "10px";
  div.style.left = "10px";
  div.style.background = "#333";
  div.style.color = "#fff";
  div.style.padding = "10px";
  div.style.zIndex = 1000;
  document.body.appendChild(div);
  setTimeout(() => document.body.removeChild(div), 3000);
}

// Placeholder: replace this with your actual table update logic
function displayInventory() {
  const tx = db.transaction("products", "readonly");
  const store = tx.objectStore("products");
  const request = store.getAll();

  request.onsuccess = function () {
    const products = request.result;
    console.log("Displaying inventory:", products);
    const table = document.getElementById("productTableBody");
    if (table) {
      table.innerHTML = "";
      products.forEach((product) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>$${product.price.toFixed(2)}</td>
          <td>${product.gender}</td>
          <td>${product.variants.map((v) => `${v.size} (${v.stock})`).join(", ")}</td>
        `;
        table.appendChild(row);
      });
    }
  };

  request.onerror = function () {
    console.error("Failed to retrieve inventory");
  };
}