let db;
document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("BandPOSDB", 2);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("products"))
      db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    if (!db.objectStoreNames.contains("discounts"))
      db.createObjectStore("discounts", { keyPath: "name" });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayInventory();
    loadDiscounts();
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
  }
});