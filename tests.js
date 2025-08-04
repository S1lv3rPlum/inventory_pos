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
const dataService = (function () { let products = []; let editingIndex = null;

function addProduct(product) { if (editingIndex !== null) { products[editingIndex] = product; editingIndex = null; } else { products.push(product); } renderTable(); }

function deleteProduct(index) { products.splice(index, 1); renderTable(); }

function editProduct(index) { const product = products[index]; addForm.name.value = product.name; addForm.price.value = product.price; addForm.quantity.value = product.quantity; addForm.category.value = product.category; addForm.unisex.value = product.unisex; addForm.hasSizes.value = product.hasSizes; editingIndex = index; }

function getProducts() { return products; }

return { addProduct, deleteProduct, editProduct, getProducts, }; })();

const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"]; const addForm = document.getElementById("addForm"); const tableBody = document.querySelector("#productTable tbody");

addForm.addEventListener("submit", (event) => { event.preventDefault();

const product = { name: addForm.name.value.trim(), price: parseFloat(addForm.price.value), quantity: parseInt(addForm.quantity.value), category: addForm.category.value.trim(), unisex: addForm.unisex.value, hasSizes: addForm.hasSizes.value, };

if (product.hasSizes === "Yes") { product.sizes = sizeLabels.reduce((acc, size) => { acc[size] = 0; return acc; }, {}); } else { product.sizes = null; }

dataService.addProduct(product); addForm.reset(); });

function renderTable() { tableBody.innerHTML = ""; const products = dataService.getProducts();

products.forEach((product, index) => { const row = document.createElement("tr"); row.innerHTML = <td><span class="name">${product.name}</span></td> <td><span class="price">${product.price.toFixed(2)}</span></td> <td><span class="quantity">${product.quantity}</span></td> <td><span class="category">${product.category}</span></td> <td><span class="unisex">${product.unisex}</span></td> <td><span class="hasSizes">${product.hasSizes}</span></td>;

if (product.hasSizes === "Yes") {
  sizeLabels.forEach(size => {
    const sizeCell = document.createElement("td");
    sizeCell.innerHTML = `<span class="size-${size}">${product.sizes?.[size] ?? 0}</span>`;
    row.appendChild(sizeCell);
  });
}

const actions = document.createElement("td");
actions.innerHTML = `
  <button class="edit">✏️</button>
  <button class="delete">🗑️</button>
`;
row.appendChild(actions);

row.querySelector(".edit").addEventListener("click", () => dataService.editProduct(index));
row.querySelector(".delete").addEventListener("click", () => dataService.deleteProduct(index));

tableBody.appendChild(row);

}); }

renderTable();

