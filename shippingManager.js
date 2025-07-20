let db;
let sales = [];

const toggleShipped = document.getElementById("toggleShipped");
const tableContainer = document.getElementById("salesTableContainer");

const request = indexedDB.open("BandPOSDB", 2);
request.onerror = () => alert("Database error loading sales.");
request.onsuccess = e => {
  db = e.target.result;
  loadSales();
};

function loadSales() {
  const tx = db.transaction("sales", "readonly");
  const store = tx.objectStore("sales");
  const all = [];

  store.openCursor().onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      const sale = cursor.value;
      if (sale.contact) all.push({ ...sale, saleId: cursor.key });
      cursor.continue();
    } else {
      sales = all;
      renderSales();
    }
  };
}

function renderSales() {
  const showShipped = toggleShipped.checked;
  const html = [];

  const filtered = sales.filter(s => showShipped || !s.shipped);

  if (!filtered.length) {
    tableContainer.innerHTML = `<p>No ${showShipped ? "sales" : "unshipped sales"} to show.</p>`;
    return;
  }

  html.push(`<table><thead>
    <tr><th>Sale ID</th><th>Date</th><th>Contact</th><th>Items</th><th>Status</th><th>Action</th></tr>
  </thead><tbody>`);

  for (const s of filtered) {
    const itemList = s.items.map(it =>
      `${it.qty}x ${it.name} (${it.size})`
    ).join("<br>");

    html.push(`<tr class="${s.shipped ? "shipped" : ""}">
      <td>${s.saleId}</td>
      <td>${new Date(s.date).toLocaleString()}</td>
      <td>${s.contact.method}: ${s.contact.detail}</td>
      <td>${itemList}</td>
      <td>${s.shipped ? "Shipped" : "Pending"}</td>
      <td>
        ${s.shipped
          ? "✓"
          : `<button onclick="markAsShipped(${s.saleId})">Mark Shipped</button>`}
      </td>
    </tr>`);
  }

  html.push("</tbody></table>");
  tableContainer.innerHTML = html.join("");
}

toggleShipped.addEventListener("change", renderSales);

function markAsShipped(saleId) {
  const tx = db.transaction("sales", "readwrite");
  const store = tx.objectStore("sales");
  const request = store.get(saleId);

  request.onsuccess = () => {
    const sale = request.result;
    sale.shipped = true;

    store.put(sale);
    tx.oncomplete = () => {
      alert("Sale marked as shipped.");
      loadSales();

      // Optional: Notify customer
      if (confirm("Send confirmation to customer?")) {
        const { method, detail } = sale.contact;
        alert(`(Simulated) Sending ${method} to ${detail}`);
        // For real app, this is where you'd queue a request to your backend
      }
    };
  };
}

// Main row
const row = document.createElement("tr");
row.classList.add("clickable-row");
row.innerHTML = `
  <td>${sale.date.toLocaleDateString()}</td>
  <td>${sale.contact?.name || "N/A"}</td>
  <td>${sale.contact?.detail || "N/A"}</td>
  <td>${sale.items.length} items</td>
`;

// Expandable detail row
const detailRow = document.createElement("tr");
detailRow.classList.add("details-row");
detailRow.style.display = "none";
detailRow.innerHTML = `
  <td colspan="4">
    <strong>Shipping Address:</strong><br>
    ${sale.contact?.address || ""}<br>
    ${sale.contact?.city || ""}, ${sale.contact?.state || ""} ${sale.contact?.zip || ""}
  </td>
`;

row.addEventListener("click", () => {
  detailRow.style.display = detailRow.style.display === "none" ? "table-row" : "none";
});

tbody.appendChild(row);
tbody.appendChild(detailRow);
