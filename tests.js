// Inject styles directly into the page
const style = document.createElement("style");
style.textContent = `
/* Remove spinners in Chrome, Safari, Edge, Opera */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Remove spinners in Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

  body {
    font-family: sans-serif;
    padding: 20px;
    max-width: 900px;
    margin: auto;
  }

  form {
    margin-bottom: 20px;
  }

  input, select {
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

  button.edit, button.save {
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

// Size labels
const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Store products in memory
let products = [];

// DOM elements
const addForm = document.getElementById("addProductForm");
const tableBody = document.querySelector("#inventoryTable tbody");

// Handle form submission to add product
addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const product = {
    category: addForm.category.value.trim(),
    name: addForm.name.value.trim(),
    unisex: addForm.unisex.value,
    hasSizes: addForm.hasSizes.value,
    sizes: null,
  };

  if (product.hasSizes === "Yes") {
    product.sizes = sizeLabels.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
  }

  products.push(product);
  addForm.reset();
  renderTable();
});

// Render the entire inventory table
function renderTable() {
  tableBody.innerHTML = "";

  products.forEach((product, index) => {
    const row = document.createElement("tr");

    if (product.hasSizes === "Yes") {
      // With sizes
      row.innerHTML = `
        <td class="category"><span>${product.category}</span></td>
        <td class="name"><span>${product.name}</span></td>
        <td class="unisex"><span>${product.unisex}</span></td>
        ${sizeLabels.map(size => `<td class="size-${size}"><span>${product.sizes[size]}</span></td>`).join('')}
        <td class="actions">
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </td>
      `;
    } else {
      // Without sizes - show dashes for sizes columns
      row.innerHTML = `
        <td class="category"><span>${product.category}</span></td>
        <td class="name"><span>${product.name}</span></td>
        <td class="unisex"><span>${product.unisex}</span></td>
        ${sizeLabels.map(() => `<td>-</td>`).join('')}
        <td class="actions">
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </td>
      `;
    }

    // Delete button
    row.querySelector(".delete").addEventListener("click", () => {
      products.splice(index, 1);
      renderTable();
    });

    // Edit / Save button
    const editBtn = row.querySelector(".edit");
    editBtn.addEventListener("click", () => {
      if (row.classList.contains("editing")) {
        // Save changes
        saveRow(row, index);
      } else {
        // If another row is editing, cancel it first
        cancelAllEdits();
        makeRowEditable(row, product);
      }
    });

    tableBody.appendChild(row);
  });
}

// Cancel edits on all rows
function cancelAllEdits() {
  document.querySelectorAll("tr.editing").forEach(row => {
    row.classList.remove("editing");
    // Re-render the table to reset all rows
    renderTable();
  });
}

// Make the given row editable (replace spans with inputs/selects)
function makeRowEditable(row, product) {
  row.classList.add("editing");

  // Category
  const categoryCell = row.querySelector(".category");
  const categoryText = categoryCell.querySelector("span").textContent;
  categoryCell.innerHTML = `<input type="text" class="edit-category" value="${categoryText}" />`;

  // Name
  const nameCell = row.querySelector(".name");
  const nameText = nameCell.querySelector("span").textContent;
  nameCell.innerHTML = `<input type="text" class="edit-name" value="${nameText}" />`;

  // Unisex select
  const unisexCell = row.querySelector(".unisex");
  const unisexText = unisexCell.querySelector("span").textContent;
  unisexCell.innerHTML = `
    <select class="edit-unisex">
      <option value="Yes" ${unisexText === "Yes" ? "selected" : ""}>Yes</option>
      <option value="No" ${unisexText === "No" ? "selected" : ""}>No</option>
    </select>
  `;

  // Sizes or dashes cells
  sizeLabels.forEach(size => {
    const cell = row.querySelector(`.size-${size}`);
    if (product.hasSizes === "Yes") {
      const val = product.sizes[size];
      cell.innerHTML = `<input type="number" min="0" class="edit-size" data-size="${size}" value="${val}" />`;
    } else {
      cell.textContent = "-";
    }
  });

  // Change Edit button to Save
  const editBtn = row.querySelector(".edit");
  editBtn.textContent = "✅ Save";
  editBtn.classList.add("save");
  editBtn.classList.remove("edit");
}

// Save edited row values back to products array
function saveRow(row, index) {
  // Grab edited values
  const newCategory = row.querySelector(".edit-category").value.trim();
  const newName = row.querySelector(".edit-name").value.trim();
  const newUnisex = row.querySelector(".edit-unisex").value;
  let newHasSizes = "No"; // default

  // Sizes inputs
  let newSizes = null;
  // Check if any size inputs present
  const sizeInputs = row.querySelectorAll(".edit-size");
  if (sizeInputs.length) {
    newHasSizes = "Yes";
    newSizes = {};
    sizeInputs.forEach(input => {
      const sizeKey = input.dataset.size;
      const val = parseInt(input.value);
      newSizes[sizeKey] = isNaN(val) || val < 0 ? 0 : val;
    });
  }

  // Update product in array
  products[index] = {
    category: newCategory,
    name: newName,
    unisex: newUnisex,
    hasSizes: newHasSizes,
    sizes: newSizes,
  };

  renderTable();
}

// Initial render
renderTable();