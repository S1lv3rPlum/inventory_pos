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

  const product = {
    name: addForm.name.value,
    price: parseFloat(addForm.price.value),
    quantity: parseInt(addForm.quantity.value),
  };

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
    const newName = row.querySelector("input.name").value;
    const newPrice = parseFloat(row.querySelector("input.price").value);
    const newQty = parseInt(row.querySelector("input.quantity").value);

    const updatedProduct = { name: newName, price: newPrice, quantity: newQty };
    dataService.updateProduct(index, updatedProduct);
    row.classList.remove("editing");
  } else {
    // Exit edit mode for any other rows
    document.querySelectorAll("tr.editing").forEach(r => r.classList.remove("editing"));

    // Enter edit mode
    const name = row.querySelector(".name").textContent;
    const price = row.querySelector(".price").textContent;
    const quantity = row.querySelector(".quantity").textContent;

    row.classList.add("editing");
    row.querySelector(".name").innerHTML = `<input class="name" value="${name}" />`;
    row.querySelector(".price").innerHTML = `<input class="price" type="number" step="0.01" value="${price}" />`;
    row.querySelector(".quantity").innerHTML = `<input class="quantity" type="number" value="${quantity}" />`;
  }
}