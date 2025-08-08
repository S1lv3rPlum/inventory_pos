// shippingManager.js

document.addEventListener("DOMContentLoaded", () => {
    const salesTableBody = document.getElementById("salesTableBody");

    // Load sales from localStorage instead of IndexedDB
    function loadSales() {
        try {
            const salesData = localStorage.getItem("BandPOSDB_sales");
            if (!salesData) return;

            const sales = JSON.parse(salesData);
            sales.forEach(sale => addSaleRow(sale));
        } catch (err) {
            console.error("Error loading sales from localStorage:", err);
        }
    }

    // Add a row to the table
    function addSaleRow(sale) {
        const row = document.createElement("tr");

        // Assuming sale has these properties — adjust if your object keys differ
        const dateCell = document.createElement("td");
        dateCell.textContent = sale.date || "";
        row.appendChild(dateCell);

        const customerCell = document.createElement("td");
        customerCell.textContent = sale.customer || "";
        row.appendChild(customerCell);

        const itemsCell = document.createElement("td");
        itemsCell.textContent = (sale.items || []).map(i => `${i.name} (x${i.quantity})`).join(", ");
        row.appendChild(itemsCell);

        const totalCell = document.createElement("td");
        totalCell.textContent = sale.total ? `$${sale.total.toFixed(2)}` : "";
        row.appendChild(totalCell);

        const statusCell = document.createElement("td");
        statusCell.textContent = sale.status || "";
        row.appendChild(statusCell);

        salesTableBody.appendChild(row);
    }

    loadSales();
});    }
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
