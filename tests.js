// Inject styles directly into the page
const style = document.createElement("style");
style.textContent = `
  body {
    font-family: sans-serif;
    padding: 20px;
    max-width: 600px;
    margin: auto;
  }

  form {
    margin-bottom: 20px;
  }

  input {
    margin-right: 10px;
    padding: 5px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background-color: #f0f0f0;
  }

  td, th {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  .editing input, .editing select {
    width: 100%;
    box-sizing: border-box;
  }

  button.edit {
    background-color: #fff7a8;
    border: none;
    padding: 5px 8px;
    cursor: pointer;
  }

  button.delete {
    background-color: #ffb3b3;
    border: none;
    padding: 5px 8px;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.8;
  }
`;
document.head.appendChild(style);

// Sizes labels for later usage if hasSizes is "Yes"
const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Store products in memory for now
let products = [];

// Abstracted data access layer
const dataService = {
  getProducts() {
    return [...products]; // return a shallow copy
  },

  addProduct(product) {
    products.push(product);
    renderTable();
  },

  updateProduct(index, updatedProduct) {
    products[index] = updatedProduct;
    renderTable();
  },

  deleteProduct(index) {
    products.splice(index, 1);
    renderTable();
  }
};

// DOM elements
const addForm = document.getElementById("addProductForm");
const tableBody = document.querySelector("#inventoryTable tbody");

// Handle form submission
addForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Build product from form values
  const product = {
    name: addForm.name.value.trim(),
    price: parseFloat(addForm.price.value),
    quantity: parseInt(addForm.quantity.value),
    category: addForm.category.value.trim(),
    unisex: addForm.unisex.value,
    hasSizes: addForm.hasSizes.value
  };

  // If hasSizes === "Yes", initialize sizes object with zeros
  if (product.hasSizes === "Yes") {
    product.sizes = sizeLabels.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
  } else {
    product.sizes = null;
  }

  dataService.addProduct(product);
  addForm.reset();
});

// Render inventory table
function renderTable() {
  const products = dataService.getProducts();
  tableBody.innerHTML = "";

  products.forEach((product, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><span class="name">${product.name}</span></td>
      <td><span class="price">${product.price.toFixed(2)}</span></td>
      <td><span class="quantity">${product.quantity}</span></td>
      <td><span class="category">${product.category}</span></td>
      <td><span class="unisex">${product.unisex}</span></td>
      <td><span class="hasSizes">${product.hasSizes}</span></td>
      <td>
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
      </td>
    `;

    // Edit button
    row.querySelector(".edit").addEventListener("click", () => {
      toggleEditRow(row, index);
    });

    // Delete button
    row.querySelector(".delete").addEventListener("click", () => {
      dataService.deleteProduct(index);
    });

    tableBody.appendChild(row);
  });
}

// Toggle edit mode for a row
function toggleEditRow(row, index) {
  const isEditing = row.classList.contains("editing");

  if (isEditing) {
    // Save edits
    const newName = row.querySelector("input.name").value.trim();
    const newPrice = parseFloat(row.querySelector("input.price").value);
    const newQty = parseInt(row.querySelector("input.quantity").value);
    const newCategory = row.querySelector("input.category").value.trim();
    const newUnisex = row.querySelector("select.unisex").value;
    const newHasSizes = row.querySelector("select.hasSizes").value;

    // If hasSizes is now "Yes" and sizes is null, initialize sizes object
    if (newHasSizes === "Yes" && (!products[index].sizes || Object.keys(products[index].sizes).length === 0)) {
      products[index].sizes = sizeLabels.reduce((acc, size) => {
        acc[size] = 0;
        return acc;
      }, {});
    } else if (newHasSizes === "No") {
      products[index].sizes = null;
    }

    const updatedProduct = {
      ...products[index], // keep sizes if they exist
      name: newName,
      price: newPrice,
      quantity: newQty,
      category: newCategory,
      unisex: newUnisex,
      hasSizes: newHasSizes
    };

    dataService.updateProduct(index, updatedProduct);
    row.classList.remove("editing");
  } else {
    // Exit edit mode for any other rows
    document.querySelectorAll("tr.editing").forEach(r => r.classList.remove("editing"));

    // Enter edit mode - replace spans with inputs/selects
    const name = row.querySelector(".name").textContent;
    const price = row.querySelector(".price").textContent;
    const quantity = row.querySelector(".quantity").textContent;
    const category = row.querySelector(".category").textContent;
    const unisex = row.querySelector(".unisex").textContent;
    const hasSizes = row.querySelector(".hasSizes").textContent;

    row.classList.add("editing");

    row.querySelector(".name").innerHTML = `<input class="name" value="${name}" />`;
    row.querySelector(".price").innerHTML = `<input class="price" type="number" step="0.01" value="${price}" />`;
    row.querySelector(".quantity").innerHTML = `<input class="quantity" type="number" value="${quantity}" />`;
    row.querySelector(".category").innerHTML = `<input class="category" value="${category}" />`;
    row.querySelector(".unisex").innerHTML = `
      <select class="unisex">
        <option value="Yes" ${unisex === "Yes" ? "selected" : ""}>Yes</option>
        <option value="No" ${unisex === "No" ? "selected" : ""}>No</option>
      </select>`;
    row.querySelector(".hasSizes").innerHTML = `
      <select class="hasSizes">
        <option value="Yes" ${hasSizes === "Yes" ? "selected" : ""}>Yes</option>
        <option value="No" ${hasSizes === "No" ? "selected" : ""}>No</option>
      </select>`;
  }
}

// Initial render
renderTable();