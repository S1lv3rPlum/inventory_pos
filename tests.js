// Size labels
const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

// Load from localStorage if available
let products = JSON.parse(localStorage.getItem("products")) || [];

// Save to localStorage whenever products change
function saveToLocalStorage() {
  localStorage.setItem("products", JSON.stringify(products));
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
    gender: addForm.gender.value,
    hasSizes: addForm.hasSizes.value,
    sizes: null,
  };

  // Initialize sizes counts to zero if product has sizes
  // Initialize sizes
  if (product.hasSizes === "Yes") {
    product.sizes = sizeLabels.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {});
  } else {
    // For products without sizes, default to M size with 0 qty
    product.sizes = { M: 0 };
  }

  products.push(product);
  saveToLocalStorage();
  addForm.reset();
  renderTable();
});

// Render the inventory table with categories and products
function renderTable() {
  tableBody.innerHTML = "";

  // Group products by category
  const grouped = {};
  products.forEach(product => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  });

  const sortedCategories = Object.keys(grouped).sort();

  sortedCategories.forEach(category => {
    // Add a category header row
    const headerRow = document.createElement("tr");
    headerRow.classList.add("category-header");
    headerRow.innerHTML = `
      <td colspan="${2 + sizeLabels.length}">
        <strong>${category}</strong>
      </td>
      <td class="actions">
        <button class="edit-category" data-category="${category}">✏️</button>
        <button class="delete-category" data-category="${category}">🗑️</button>
      </td>
    `;
    tableBody.appendChild(headerRow);

    // Sort products alphabetically by name
    const sortedProducts = grouped[category].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    sortedProducts.forEach((product) => {
      const row = document.createElement("tr");

      if (product.hasSizes === "Yes") {
        row.innerHTML = `
          <td class="name"><span>${product.name}</span></td>
          <td class="gender"><span>${product.gender}</span></td>
          ${sizeLabels.map(size => `<td class="size-${size}"><span>${product.sizes[size] ?? ''}</span></td>`).join('')}
          <td class="actions">
            <button class="edit">✏️</button>
            <button class="delete">🗑️</button>
          </td>
        `;
      } else {
  row.innerHTML = `
    <td class="name"><span>${product.name}</span></td>
    <td class="gender"><span>${product.gender}</span></td>
    ${sizeLabels.map(size => 
      size === "M" ? 
        `<td class="size-M"><span>${product.sizes.M}</span></td>` : 
        `<td>-</td>`).join('')}
    <td class="actions">
      <button class="edit">✏️</button>
      <button class="delete">🗑️</button>
    </td>
  `;
}

      // Add event listener for delete button
      row.querySelector(".delete").addEventListener("click", () => {
        const index = products.indexOf(product);
        if (index > -1) {
          products.splice(index, 1);
          saveToLocalStorage();
          renderTable();
        }
      });

      // Add event listener for edit/save toggle button
      const editBtn = row.querySelector(".edit");
      editBtn.addEventListener("click", () => {
        if (row.classList.contains("editing")) {
          saveRow(row, products.indexOf(product));
        } else {
          cancelAllEdits();
          makeRowEditable(row, product);
        }
      });

      tableBody.appendChild(row);
    });
  });
}

function renderDiscountTable() {
  const discountTableBody = document.querySelector("#discountTable tbody");
  discountTableBody.innerHTML = ""; // Clear existing rows

  discounts.forEach((discount, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${discount.name}</td>
      <td>${discount.type}</td>
      <td>${discount.value}</td>
      <td>
        <button class="delete-discount" data-index="${index}">🗑️</button>
      </td>
    `;
    discountTableBody.appendChild(row);

    row.querySelector(".delete-discount").addEventListener("click", () => {
      discounts.splice(index, 1);
      renderDiscountTable();
    });
  });
}

// Cancel editing on all rows
function cancelAllEdits() {
  document.querySelectorAll("tr.editing").forEach(row => {
    row.classList.remove("editing");
    renderTable();
  });
}

// Make a row editable with inputs/selects
function makeRowEditable(row, product) {
  row.classList.add("editing");

  const categoryCell = row.querySelector(".category");
  const categoryText = categoryCell.querySelector("span").textContent;
  categoryCell.innerHTML = `<input type="text" class="edit-category" value="${categoryText}" />`;

  const nameCell = row.querySelector(".name");
  const nameText = nameCell.querySelector("span").textContent;
  nameCell.innerHTML = `<input type="text" class="edit-name" value="${nameText}" />`;

  const genderCell = row.querySelector(".gender");
  const genderText = genderCell.querySelector("span").textContent;
  genderCell.innerHTML = `
    <select class="edit-gender">
      <option value="M" ${genderText === "M" ? "selected" : ""}>M</option>
      <option value="F" ${genderText === "F" ? "selected" : ""}>F</option>
      <option value="U" ${genderText === "U" ? "selected" : ""}>Unisex</option>
    </select>
  `;

  sizeLabels.forEach(size => {
    const cell = row.querySelector(`.size-${size}`);
    if (product.hasSizes === "Yes") {
      const val = product.sizes[size];
      cell.innerHTML = `<input type="number" min="0" class="edit-size" data-size="${size}" value="${val}" />`;
    } else {
    if (size === "M") {
  const val = product.sizes["M"] ?? 0;
  cell.innerHTML = `<input type="number" min="0" class="edit-size" data-size="M" value="${val}" />`;
} else {
  cell.textContent = "-";
}

window.addEventListener("DOMContentLoaded", function () {
  renderProductTable();
});
  }
});

  nameCell.querySelector("input").focus();

  const editBtn = row.querySelector(".edit");
  editBtn.textContent = "✅ Save";
  editBtn.classList.add("save");
  editBtn.classList.remove("edit");
}

// Save edited row back to products array
function saveRow(row, index) {
  const newCategory = row.querySelector(".edit-category").value.trim();
  const newName = row.querySelector(".edit-name").value.trim();
  const newGender = row.querySelector(".edit-gender").value;
  let newHasSizes = "No";
  let newSizes = null;

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

  products[index] = {
    category: newCategory,
    name: newName,
    gender: newGender,
    hasSizes: newHasSizes,
    sizes: newSizes,
  };

  saveToLocalStorage();
  renderTable();
}

// Initial render call
renderTable();
renderDiscountTable();

  const showProductsBtn = document.getElementById("showProducts");
  const showDiscountsBtn = document.getElementById("showDiscounts");

  const productSection = document.getElementById("productSection");
// Get form element
const discountForm = document.getElementById("addDiscountForm");
const discountTableBody = document.querySelector("#discountTable tbody");
  

// Initialize discounts array
let discounts = [];



discountForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get form values
  const name = discountForm.discountName.value.trim();
  const type = discountForm.discountType.value;
  const value = parseFloat(discountForm.discountValue.value);

  // Check unique name
  if (discounts.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    alert("Discount name must be unique.");
    return;
  }
2
  // Add discount to array
  discounts.push({ name, type, value });
renderDiscountTable();

  // Clear form
  discountForm.reset();

  // Log discounts so far
  console.log("Discounts:", discounts);
});

const discountSection = document.getElementById("discountSection");
// bottom Section
discountSection.style.display = "none";
productSection.style.display = "block";

window.addEventListener("DOMContentLoaded", function () {
  renderProductTable();
});