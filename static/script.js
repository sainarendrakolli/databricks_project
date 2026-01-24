let slackChart, statusChart, avgSlackChart, violationTrendChart;
let rawData = [];

/* ---------- DOM BINDINGS (CRITICAL FIX) ---------- */
const dashboard = document.getElementById("dashboard");
const tableView = document.getElementById("tableView");

const slackChartCanvas = document.getElementById("slackChart");
const statusChartCanvas = document.getElementById("statusChart");
const avgSlackChartCanvas = document.getElementById("avgSlackChart");
const violationTrendChartCanvas = document.getElementById("violationTrendChart");

const dataBody = document.getElementById("data-body");
const tableHead = document.getElementById("tableHead");

/* ---------- HELPERS ---------- */
function normalizeStatus(status) {
  return status ? status.trim().toUpperCase() : "";
}

/* ---------- TAB HANDLING ---------- */
function showDashboard() {
  dashboard.classList.remove("hidden");
  tableView.classList.add("hidden");
  toggleTabs(0);
}

function showTable() {
  dashboard.classList.add("hidden");
  tableView.classList.remove("hidden");
  toggleTabs(1);
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

/* ---------- KPI ---------- */
function updateKPIs() {
  document.getElementById("totalPaths").innerText = rawData.length;

  const violations = rawData.filter(d => Number(d.slack) < 0).length;
  document.getElementById("violations").innerText = violations;

  const avgSlack = rawData.length
    ? (rawData.reduce((s, d) => s + Number(d.slack || 0), 0) / rawData.length).toFixed(2)
    : 0;

  document.getElementById("avgSlack").innerText = avgSlack;
}

/* ---------- TABLE (ALL COLUMNS FROM GOLD) ---------- */
function renderTable() {
  dataBody.innerHTML = "";
  tableHead.innerHTML = "";

  if (!rawData.length) return;

  const columns = Object.keys(rawData[0]);

  tableHead.innerHTML =
    "<tr>" + columns.map(c => `<th>${c}</th>`).join("") + "</tr>";

  rawData.forEach(row => {
    let tr = "<tr>";
    columns.forEach(col => {
      let value = row[col] ?? "";
      if (col === "timing_status") {
        value = `<span class="status ${normalizeStatus(value)}">${normalizeStatus(value)}</span>`;
      }
      tr += `<td>${value}</td>`;
    });
    tr += "</tr>";
    dataBody.innerHTML += tr;
  });
}

/* ---------- CHARTS ---------- */
function renderCharts() {
  [slackChart, statusChart, avgSlackChart, violationTrendChart]
    .forEach(c => c && c.destroy());

  /* Slack vs Path */
  slackChart = new Chart(slackChartCanvas, {
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

  /* Status Distribution */
  const statusCount = {};
  rawData.forEach(d => {
    const s = normalizeStatus(d.timing_status);
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  statusChart = new Chart(statusChartCanvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });

  /* Average Slack by Path (SORTED) */
  const pathMap = {};
  rawData.forEach(d => {
    pathMap[d.id] = pathMap[d.id] || [];
    pathMap[d.id].push(Number(d.slack));
  });

  const avgByPath = Object.entries(pathMap)
    .map(([p, v]) => ({
      path: p,
      avg: v.reduce((a, b) => a + b, 0) / v.length
    }))
    .sort((a, b) => a.avg - b.avg);

  avgSlackChart = new Chart(avgSlackChartCanvas, {
    type: "line",
    data: {
      labels: avgByPath.map(d => d.path),
      datasets: [{
        data: avgByPath.map(d => d.avg),
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6,182,212,0.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  /* Violation Trend */
  const timeMap = {};
  rawData.forEach(d => {
    timeMap[d.ingestion_ts] = timeMap[d.ingestion_ts] || 0;
    if (Number(d.slack) < 0) timeMap[d.ingestion_ts]++;
  });

  const times = Object.keys(timeMap).sort();

  violationTrendChart = new Chart(violationTrendChartCanvas, {
    type: "line",
    data: {
      labels: times,
      datasets: [{
        data: times.map(t => timeMap[t]),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220,38,38,0.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

/* ---------- INIT ---------- */
loadData();
setInterval(loadData, 30000);
