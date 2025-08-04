console.log("JS is running");

// Size labels
const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Load from localStorage if available
let products = JSON.parse(localStorage.getItem("products")) || [];
let discounts = JSON.parse(localStorage.getItem("discounts")) || [];

// Save to localStorage whenever products or discounts change
function saveToLocalStorage() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("discounts", JSON.stringify(discounts));
}

// DOM elements
const addForm = document.getElementById("addProductForm");
const tableBody = document.querySelector("#inventoryTable tbody");

// Form submit handler for adding a product
addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Build product object with values from form inputs
  const product = {
    category: addForm.category.value.trim(),
    name: addForm.name.value.trim(),
    unisex: addForm.unisex.value,
    hasSizes: addForm.hasSizes.value,
    sizes: null,
  };

  // Initialize sizes counts to zero if product has sizes
  if (product.hasSizes === "Yes") {
    product.sizes = sizeLabels.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
  }

  products.push(product);       // Add new product to products array
  saveToLocalStorage();         // Save updated data
  addForm.reset();              // Clear the form inputs
  renderTable();                // Re-render the product table
});

// Render the inventory table with categories and products
function renderTable() {
  tableBody.innerHTML = "";
  const grouped = {};

  // Group products by category
  products.forEach(product => {
    if (!grouped[product.category]) grouped[product.category] = [];
    grouped[product.category].push(product);
  });

  for (const [category, items] of Object.entries(grouped)) {
    // Category header row
    const categoryRow = document.createElement("tr");
    categoryRow.classList.add("category-row");
    categoryRow.innerHTML = `
      <td colspan="${4 + sizeLabels.length + 1}"><strong>${category}</strong></td>
    `;
    tableBody.appendChild(categoryRow);

    items.forEach(product => {
      const row = document.createElement("tr");

      const productIndex = products.findIndex(p =>
        p.name === product.name &&
        p.category === product.category &&
        p.unisex === product.unisex
      );

      if (product.hasSizes === "Yes") {
        row.innerHTML = `
          <td class="name"><span>${product.name}</span></td>
          <td class="unisex"><span>${product.unisex}</span></td>
          ${sizeLabels.map(size => `<td class="size-${size}"><span>${product.sizes[size]}</span></td>`).join('')}
          <td>
            <div class="actions">
              <button class="edit">✏️</button>
              <button class="delete">🗑️</button>
            </div>
          </td>
        `;
      } else {
        row.innerHTML = `
          <td class="name"><span>${product.name}</span></td>
          <td class="unisex"><span>${product.unisex}</span></td>
          ${sizeLabels.map(() => `<td>-</td>`).join('')}
          <td>
            <div class="actions">
              <button class="edit">✏️</button>
              <button class="delete">🗑️</button>
            </div>
          </td>
        `;
      }

      tableBody.appendChild(row);

      // Wire up the buttons
      const editBtn = row.querySelector(".edit");
      const deleteBtn = row.querySelector(".delete");

      if (editBtn) {
        editBtn.addEventListener("click", () => handleEdit(productIndex));
      }
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => handleDelete(productIndex));
      }
    });
  }
}

// Handle editing a product
function handleEdit(productIndex) {
  const product = products[productIndex];
  console.log("Edit product:", product);
  // Implement the edit functionality as needed
}

// Handle deleting a product
function handleDelete(productIndex) {
  products.splice(productIndex, 1);
  saveToLocalStorage();
  renderTable();
}

// Initial render call
renderTable();