async function loadData() {
  try {
    const response = await fetch("/timing-data");
    const data = await response.json();
    renderTable(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function renderTable(data) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td class="empty">No data available</td></tr>`;
    return;
  }

  // 🔹 Dynamically extract column names from Gold layer
  const columns = Object.keys(data[0]);

  // 🔹 Build table header
  const headerRow = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.replaceAll("_", " ").toUpperCase();
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // 🔹 Build table rows
  data.forEach(row => {
    const tr = document.createElement("tr");

    columns.forEach(col => {
      const td = document.createElement("td");
      let value = row[col];

      if (col === "timing_status") {
        td.innerHTML =
          value === "VIOLATED"
            ? `<span class="badge badge-red">VIOLATED</span>`
            : `<span class="badge badge-green">OK</span>`;
      } else {
        td.textContent = value !== null && value !== undefined ? value : "-";
      }

      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

// 🔁 Initial load
loadData();

// 🔁 Auto refresh every 30 seconds
setInterval(loadData, 30000);
