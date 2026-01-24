let slackChart, statusChart;
let rawData = [];

/* ---------- HELPERS ---------- */
function normalizeStatus(status) {
  return status ? status.trim().toUpperCase() : "";
}

/* ---------- TAB HANDLING ---------- */
function showDashboard() {
  toggleTabs(0);
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("tableView").classList.add("hidden");
}

function showTable() {
  toggleTabs(1);
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("tableView").classList.remove("hidden");
}

function toggleTabs(index) {
  document.querySelectorAll(".tab").forEach((tab, i) =>
    tab.classList.toggle("active", i === index)
  );
}

/* ---------- DATA LOAD ---------- */
async function loadData() {
  const res = await fetch("/timing-data");
  rawData = await res.json();

  updateKPIs();
  renderTable();
  renderCharts();
}

/* ---------- KPI UPDATE ---------- */
function updateKPIs() {
  document.getElementById("totalPaths").innerText = rawData.length;

  const violations = rawData.filter(
    d => normalizeStatus(d.timing_status) === "VIOLATED"
  ).length;

  document.getElementById("violations").innerText = violations;

  const avgSlack = rawData.length
    ? (
        rawData.reduce((sum, d) => sum + Number(d.slack || 0), 0) / rawData.length
      ).toFixed(2)
    : 0;

  document.getElementById("avgSlack").innerText = avgSlack;
}

/* ---------- TABLE (ALL GOLD COLUMNS) ---------- */
function renderTable() {
  const body = document.getElementById("data-body");
  const head = document.getElementById("tableHead");

  body.innerHTML = "";
  head.innerHTML = "";

  if (!rawData.length) return;

  const columns = Object.keys(rawData[0]);

  // Header
  let headerRow = "<tr>";
  columns.forEach(col => {
    headerRow += `<th>${col}</th>`;
  });
  headerRow += "</tr>";
  head.innerHTML = headerRow;

  // Rows
  rawData.forEach(d => {
    let rowHtml = "<tr>";

    columns.forEach(col => {
      let value = d[col] ?? "";

      if (col === "timing_status") {
        const status = normalizeStatus(value);
        value = `<span class="status ${status}">${status}</span>`;
      }

      rowHtml += `<td>${value}</td>`;
    });

    rowHtml += "</tr>";
    body.innerHTML += rowHtml;
  });
}

/* ---------- CHARTS ---------- */
function renderCharts() {
  if (slackChart) slackChart.destroy();
  if (statusChart) statusChart.destroy();

  slackChart = new Chart(document.getElementById("slackChart"), {
    type: "line",
    data: {
      labels: rawData.map(d => d.id),
      datasets: [{
        data: rawData.map(d => d.slack),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.12)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  const statusCount = {};
  rawData.forEach(d => {
    const s = normalizeStatus(d.timing_status);
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  statusChart = new Chart(document.getElementById("statusChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });
}

/* ---------- AUTO REFRESH ---------- */
loadData();
setInterval(loadData, 30000);
