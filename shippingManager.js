// shippingManager.js
// Minimal replacement: read sales from localStorage (BandPOSDB_sales) and render them.
// No IndexedDB. No other changes beyond localStorage usage.

let sales = [];

const toggleShipped = document.getElementById("toggleShipped");
const tableContainer = document.getElementById("salesTableContainer");
const STORAGE_SALES_KEY = "BandPOSDB_sales";

function loadSales() {
  try {
    const raw = localStorage.getItem(STORAGE_SALES_KEY);
    sales = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error parsing sales from localStorage:", err);
    sales = [];
  }
  renderSales();
}

function saveSalesToStorage() {
  try {
    localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(sales));
  } catch (err) {
    console.error("Error saving sales to localStorage:", err);
  }
}

function renderSales() {
  const showShipped = toggleShipped && toggleShipped.checked;
  if (!Array.isArray(sales) || sales.length === 0) {
    tableContainer.innerHTML = `<p>No ${showShipped ? "sales" : "unshipped sales"} to show.</p>`;
    return;
  }

  // Build rows using original sales array indices so markAsShipped can update correctly
  const rows = [];
  rows.push(`<table><thead>
    <tr><th>Sale #</th><th>Date</th><th>Contact</th><th>Items</th><th>Status</th><th>Action</th></tr>
  </thead><tbody>`);

  let anyShown = false;

  sales.forEach((s, idx) => {
    const shipped = !!s.shipped;
    if (!showShipped && shipped) return; // skip shipped when toggle off

    anyShown = true;
    const dateStr = s.date ? new Date(s.date).toLocaleString() : "";
    const contactStr = s.contact
      ? `${s.contact.method || ""}: ${s.contact.detail || ""}`.trim()
      : "N/A";

    const itemList = Array.isArray(s.items) && s.items.length
      ? s.items.map(it => `${it.qty}x ${it.name} (${it.size || ""})`).join("<br>")
      : "(no items)";

    rows.push(`<tr class="${shipped ? "shipped" : ""}">
      <td>${idx + 1}</td>
      <td>${dateStr}</td>
      <td>${escapeHtml(contactStr)}</td>
      <td>${itemList}</td>
      <td>${shipped ? "Shipped" : "Pending"}</td>
      <td>
        ${shipped ? "✓" : `<button onclick="markAsShipped(${idx})">Mark Shipped</button>`}
      </td>
    </tr>`);
  });

  rows.push("</tbody></table>");

  if (!anyShown) {
    tableContainer.innerHTML = `<p>No ${showShipped ? "sales" : "unshipped sales"} to show.</p>`;
  } else {
    tableContainer.innerHTML = rows.join("");
  }
}

function markAsShipped(index) {
  if (!sales[index]) return alert("Sale not found.");
  sales[index].shipped = true;
  saveSalesToStorage();
  alert("Sale marked as shipped.");
  renderSales();

  // Optional: prompt to notify customer (simulated)
  if (sales[index].contact && confirm("Send confirmation to customer?")) {
    const { method, detail } = sales[index].contact;
    alert(`(Simulated) Sending ${method} to ${detail}`);
  }
}

function escapeHtml(t) {
  return (!t) ? "" : String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Wire toggle (if present)
if (toggleShipped) toggleShipped.addEventListener("change", renderSales);

// Load on DOM ready
document.addEventListener("DOMContentLoaded", loadSales);