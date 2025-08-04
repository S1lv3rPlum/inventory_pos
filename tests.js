document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }

    h1 {
      text-align: center;
    }

    form {
      margin-bottom: 20px;
    }

    input, select, button {
      margin: 5px;
      padding: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: center;
    }

    th {
      background-color: #f4f4f4;
    }

    .delete-btn {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
    }

    .delete-btn:hover {
      background-color: #c0392b;
    }
  </style>`
);

// JavaScript logic
document.getElementById("addProductForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const name = form.name.value.trim();
  const price = parseFloat(form.price.value);
  const quantity = parseInt(form.quantity.value);
  const category = form.category.value.trim();
  const unisex = form.unisex.value;
  const hasSizes = form.hasSizes.value;

  if (!name || isNaN(price) || isNaN(quantity) || !category || !unisex || !hasSizes) {
    alert("Please fill in all fields.");
    return;
  }

  const tableBody = document.querySelector("#inventoryTable tbody");
  const row = document.createElement("tr");

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  const sizeCells = sizes
    .map(size => `<td>${hasSizes === "Yes" ? "0" : "–"}</td>`)
    .join("");

  row.innerHTML = `
    <td>${category}</td>
    <td>${name}</td>
    <td>${unisex}</td>
    ${sizeCells}
    <td><button class="delete-btn">Delete</button></td>
  `;

  // Add delete functionality
  row.querySelector(".delete-btn").addEventListener("click", () => {
    row.remove();
  });

  tableBody.appendChild(row);
  form.reset();
});