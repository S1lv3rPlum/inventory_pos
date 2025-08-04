<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Inventory Manager</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: auto; }
  h1 { text-align: center; }
  label { margin-right: 15px; display: inline-block; margin-bottom: 10px; }
  input, select { padding: 5px; font-size: 14px; }
  button { margin-top: 10px; padding: 8px 15px; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #aaa; padding: 8px; text-align: left; }
</style>
</head>
<body>

<h1>Inventory Manager</h1>

<form id="productForm">
  <label>Category: <input type="text" id="category" required /></label>
  <label>Product Name: <input type="text" id="productName" required /></label>
  <label>Price: <input type="number" id="price" step="0.01" min="0" required /></label>
  <label>
    Unisex:
    <select id="unisex" required>
      <option value="">-- Select --</option>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  </label>
  <label>
    Has Sizes:
    <select id="hasSizes" required>
      <option value="">-- Select --</option>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  </label>
  <br />
  <button type="submit">Add Product</button>
</form>

<table id="productTable" aria-label="Inventory product list">
  <thead>
    <tr>
      <th>Category</th>
      <th>Name</th>
      <th>Price</th>
      <th>Unisex</th>
      <th>Sizes</th>
    </tr>
  </thead>
  <tbody></tbody>
</table>

<script>
  const products = [];
  const sizeLabels = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

  document.getElementById("productForm").addEventListener("submit", e => {
    e.preventDefault();

    const category = document.getElementById("category").value.trim();
    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("price").value);
    const unisex = document.getElementById("unisex").value;
    const hasSizes = document.getElementById("hasSizes").value;

    if (!category || !name || isNaN(price) || !unisex || !hasSizes) {
      alert("Please fill in all required fields.");
      return;
    }

    const sizes = hasSizes === "Yes" ? sizeLabels.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {}) : null;

    products.push({ category, name, price, unisex, sizes });

    renderTable();

    document.getElementById("productForm").reset();
  });

  function renderTable() {
    const tbody = document.querySelector("#productTable tbody");
    tbody.innerHTML = "";

    products.forEach(prod => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${prod.category}</td>
        <td>${prod.name}</td>
        <td>${prod.price.toFixed(2)}</td>
        <td>${prod.unisex}</td>
        <td>${prod.sizes ? Object.keys(prod.sizes).join(", ") : "-"}</td>
      `;

      tbody.appendChild(tr);
    });
  }
</script>

</body>
</html>