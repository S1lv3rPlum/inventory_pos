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

  input, select, button {
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
const dataService = (function () {
  let products = [];
  let editingIndex = null;

  function addProduct(product) {
    if (editingIndex !== null) {
      products[editingIndex] = product;
      editingIndex = null;
    } else {
      products.push(product);
    }
    renderTable();
  }

  function deleteProduct(index) {
    products.splice(index, 1);
    renderTable();
  }

  function editProduct(index) {
    const product = products[index];
    addForm.name.value = product.name;
    addForm.price.value = product.price;
    addForm.quantity.value = product.quantity;
    addForm.category.value = product.category;
    addForm.unisex.value = product.unisex;
    addForm.hasSizes.value = product.hasSizes;
    editingIndex = index;
  }

  function getProducts() {
    return products;
  }

  return { addProduct, deleteProduct, editProduct, getProducts };
})();

const addForm = document.getElementById("addProductForm");
const tableBody = document.querySelector("#inventoryTable tbody");

// Handle form submission
addForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // Collect the form data
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
      <td><span class="category">${product.category}</span></td>
      <td><span class="name">${product.name}</span></td>
      <td><span class="gender">${product.unisex}</span></td>
      ${sizeLabels.map(size => 
        `<td><span class="size-${size}">${product.sizes ? product.sizes[size] : "-"}</span></td>`
      ).join('')}
      <td>
        <button class="delete-btn">🗑️ Delete</button>
      </td>
    `;

    row.querySelector(".delete-btn").addEventListener("click", () => {
      dataService.deleteProduct(index);
    });

    tableBody.appendChild(row);
  });
}

// Initial render
renderTable();