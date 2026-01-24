async function loadData() {
  try {
    const response = await fetch("/timing-data");
    const data = await response.json();

    if (!data || data.length === 0) {
      console.log("No data returned from /timing-data");
      return;
    }

    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Get ALL column names dynamically from Gold layer
    const columns = Object.keys(data[0]);

    // Build table header
    let headerRow = "<tr>";
    columns.forEach(col => {
      headerRow += `<th>${col}</th>`;
    });
    headerRow += "</tr>";
    tableHead.innerHTML = headerRow;

    // Build table rows
    data.forEach(row => {
      let rowHtml = "<tr>";
      columns.forEach(col => {
        rowHtml += `<td>${row[col] !== null && row[col] !== undefined ? row[col] : ""}</td>`;
      });
      rowHtml += "</tr>";
      tableBody.innerHTML += rowHtml;
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Initial load
loadData();

// Refresh every 30 seconds
setInterval(loadData, 30000);
