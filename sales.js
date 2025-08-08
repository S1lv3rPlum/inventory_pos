let allSales = [];

function loadSales() {
  const stored = localStorage.getItem("BandPOSDB_sales");
  const data = stored ? JSON.parse(stored) : [];
  allSales = data.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderSales(allSales);
  prepareAnalytics();
}

function renderSales(sales) {
  if (!sales.length) {
    document.getElementById("salesContainer").innerHTML = "<p>No sales recorded.</p>";
    return;
  }
  let html = `<table><thead><tr><th>Date</th><th>Event</th><th>Items Sold</th></tr></thead><tbody>`;
  for (const s of sales) {
    const date = new Date(s.date).toLocaleString();
    const items = s.items.map(i => `${i.qty}×${i.name} (${i.size})`).join("<br>");
    html += `<tr><td>${date}</td><td>${s.event || ""}</td><td>${items}</td></tr>`;
  }
  html += "</tbody></table>";
  document.getElementById("salesContainer").innerHTML = html;
}

function filterSales() {
  const eFilter = document.getElementById("filterEventInput").value.trim().toLowerCase();
  const start = document.getElementById("startDateInput").value;
  const end = document.getElementById("endDateInput").value;
  let filtered = allSales;

  if (eFilter) filtered = filtered.filter(s => (s.event || "").toLowerCase().includes(eFilter));
  if (start) filtered = filtered.filter(s => new Date(s.date) >= new Date(start));
  if (end) filtered = filtered.filter(s => new Date(s.date) <= new Date(end + "T23:59:59"));

  renderSales(filtered);
  prepareAnalytics(filtered);
}

let chart;
function prepareAnalytics(filtered = allSales) {
  const scope = document.getElementById("analyticsScope").value;
  const counts = {};

  if (scope === "event") {
    for (const s of filtered) {
      const key = s.event || "(No Event)";
      counts[key] = (counts[key] || 0) + s.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    }
  } else {
    for (const s of filtered) {
      const day = new Date(s.date).toISOString().split("T")[0];
      counts[day] = (counts[day] || 0) + s.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    }
  }

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  const ctx = document.getElementById("salesChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, i) => `hsl(${i * 360 / labels.length}, 60%, 70%)`)
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Sales by ' + (scope === 'event' ? 'Event' : 'Date')
        }
      }
    }
  });
}

document.getElementById("analyticsScope").addEventListener("change", () => prepareAnalytics());

function exportSalesToExcel() {
  const wb = XLSX.utils.book_new();
  const wsData = [["Date", "Event", "Product", "Size", "Qty", "Price", "Discount"]];
  allSales.forEach(s => {
    const date = new Date(s.date).toLocaleString();
    s.items.forEach(i => {
      wsData.push([date, s.event || "", i.name, i.size, i.qty, i.price, i.discountName || ""]);
    });
  });
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  XLSX.writeFile(wb, "sales_data.xlsx");
}

function handleSalesImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const workbook = XLSX.read(evt.target.result, { type: "binary" });
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const newSales = rows.map(r => ({
      id: crypto.randomUUID(),
      date: new Date(r.Date).toISOString(),
      event: r.Event || "",
      items: [{
        name: r.Product,
        size: r.Size,
        qty: parseInt(r.Qty) || 0,
        price: parseFloat(r.Price) || 0,
        discountName: r.Discount || ""
      }],
      subtotal: 0, // optional - calculated in POS
      discount: 0,
      total: 0
    }));

    showImportChoice(newSales);
  };
  reader.readAsBinaryString(file);
}

function showImportChoice(importedSales) {
  const popup = document.createElement("div");
  popup.innerHTML = `
    <div style="position:fixed;top:30%;left:35%;background:#fff;padding:20px;border:2px solid #000;z-index:1000;">
      <p>Import sales data: Would you like to <strong>add</strong> to existing records or <strong>replace</strong> them?</p>
      <button onclick="applySalesImport('replace')">Replace</button>
      <button onclick="applySalesImport('add')">Add</button>
      <button onclick="this.parentElement.remove()">Cancel</button>
    </div>
  `;
  document.body.appendChild(popup);

  window.applySalesImport = (mode) => {
    if (mode === "replace") {
      localStorage.setItem("salesRecords", JSON.stringify(importedSales));
    } else {
      const existing = JSON.parse(localStorage.getItem("salesRecords") || "[]");
      localStorage.setItem("salesRecords", JSON.stringify(existing.concat(importedSales)));
    }
    alert("Sales imported.");
    loadSales();
    popup.remove();
  };
}

function printSales() {
  window.print();
}

// Initial load
loadSales();