async function loadData() {
  const statusBox = document.getElementById("statusBox");

  try {
    const response = await fetch("/timing-data");

    if (!response.ok) {
      statusBox.textContent =
        "❌ Backend error while fetching /timing-data";
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      statusBox.textContent =
        "⚠️ Invalid data format received from backend";
      renderEmptyTable("Invalid data format");
      return;
    }

    if (data.length === 0) {
      statusBox.textContent =
        "ℹ️ No records returned from Gold layer (table is empty)";
      renderEmptyTable("No data available");
      return;
    }

    statusBox.textContent =
      `✅ Loaded ${data.length} records from Gold layer`;
    renderTable(data);

  } catch (error) {
    console.error(error);
    statusBox.textContent =
      "❌ Failed to connect to backend API";
    renderEmptyTable("API not reachable");
  }
}

function renderEmptyTable(message) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableHead.innerHTML = "<tr><th>Status</th></tr>";
  tableBody.innerHTML = `<tr><td class="empty">${message}</td></tr>`;
}

function renderTable(data) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  // 🔹 Dynamically get ALL Gold columns
  const columns = Object.keys(data[0]);

  // 🔹 Header
  const headerRow = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.replaceAll("_", " ").toUpperCase();
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // 🔹 Rows
  data.forEach(row => {
    const tr = document.createElement("tr");

    columns.forEach(col => {
      const td = document.createElement("td");
      const value = row[col];

      if (col === "timing_status") {
        td.innerHTML =
          value === "VIOLATED"
            ? `<span class="badge badge-red">VIOLATED</span>`
            : `<span class="badge badge-green">OK</span>`;
      } else {
        td.textContent =
          value !== null && value !== undefined ? value : "-";
      }

      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

// Initial load
loadData();

// Auto refresh every 30 seconds
setInterval(loadData, 30000);
