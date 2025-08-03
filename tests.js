document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("BandPOSDB", 2);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains("products")) {
      db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    showMessage("IndexedDB opened successfully");

    const addForm = document.getElementById("addProductForm");
    if (!addForm) {
      showMessage("❌ Form not found in DOM.");
      return;
    }

    showMessage("✅ Form found. Attaching submit listener.");

    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showMessage("🟢 Add product form submitted");

      const name = document.getElementById("productName").value.trim();
      const price = parseFloat(document.getElementById("productPrice").value);
      const quantity = parseInt(document.getElementById("productQuantity").value);

      if (!name || isNaN(price) || isNaN(quantity)) {
        showMessage("⚠️ Please fill in all fields correctly.");
        return;
      }

      const transaction = db.transaction(["products"], "readwrite");
      const store = transaction.objectStore("products");

      const newProduct = { name, price, quantity };
      const addRequest = store.add(newProduct);

      addRequest.onsuccess = () => {
        showMessage("✅ Product added successfully.");
        addForm.reset();
      };

      addRequest.onerror = () => {
        showMessage("❌ Error adding product.");
      };
    });
  };

  request.onerror = (event) => {
    showMessage("❌ Database error: " + event.target.errorCode);
  };
});

// Utility to show messages on screen
function showMessage(msg) {
  let log = document.getElementById("debugLog");
  if (!log) {
    log = document.createElement("div");
    log.id = "debugLog";
    log.style.border = "1px solid #aaa";
    log.style.padding = "10px";
    log.style.marginTop = "20px";
    log.style.background = "#f9f9f9";
    log.style.fontSize = "14px";
    document.body.appendChild(log);
  }

  const p = document.createElement("p");
  p.textContent = msg;
  log.appendChild(p);
}