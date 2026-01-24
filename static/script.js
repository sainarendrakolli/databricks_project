let slackChart, statusChart, avgSlackChart, violationTrendChart;
let rawData = [];

/* ---------- HELPERS ---------- */
function normalizeStatus(status) {
  return status ? status.trim().toUpperCase() : "";
}

/* ---------- TABS ---------- */
function showDashboard() {
  toggleTabs(0);
  dashboard.classList.remove("hidden");
  tableView.classList.add("hidden");
}

function showTable() {
  toggleTabs(1);
  dashboard.classList.add("hidden");
  tableView.classList.remove("hidden");
}

function toggleTabs(i) {
  document.querySelectorAll(".tab").forEach((t, idx) =>
    t.classList.toggle("active", idx === i)
  );
}

/* ---------- DATA LOAD ---------- */
async function loadData() {
  rawData = await (await fetch("/timing-data")).json();
  updateKPIs();
  renderTable();
  renderCharts();
}

/* ---------- KPI ---------- */
function updateKPIs() {
  totalPaths.innerText = rawData.length;
  violations.innerText = rawData.filter(d => d.slack < 0).length;
  avgSlack.innerText = rawData.length
    ? (rawData.reduce((s, d) => s + Number(d.slack), 0) / rawData.length).toFixed(2)
    : 0;
}

/* ---------- TABLE ---------- */
function renderTable() {
  dataBody.innerHTML = "";
  tableHead.innerHTML = "";

  if (!rawData.length) return;

  const cols = Object.keys(rawData[0]);
  tableHead.innerHTML = "<tr>" + cols.map(c => `<th>${c}</th>`).join("") + "</tr>";

  rawData.forEach(r => {
    let row = "<tr>";
    cols.forEach(c => {
      let v = r[c] ?? "";
      if (c === "timing_status") {
        v = `<span class="status ${normalizeStatus(v)}">${normalizeStatus(v)}</span>`;
      }
      row += `<td>${v}</td>`;
    });
    row += "</tr>";
    dataBody.innerHTML += row;
  });
}

/* ---------- CHARTS ---------- */
function renderCharts() {
  [slackChart, statusChart, avgSlackChart, violationTrendChart]
    .forEach(c => c && c.destroy());

  /* Slack Trend */
  slackChart = new Chart(slackChartCanvas, {
    type: "line",
    data: {
      labels: rawData.map(d => d.id),
      datasets: [{
        data: rawData.map(d => d.slack),
        borderColor: "#4f46e5",
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
  const map = {};
  rawData.forEach(d => {
    map[d.id] = map[d.id] || [];
    map[d.id].push(Number(d.slack));
  });

  const avgByPath = Object.entries(map)
    .map(([k, v]) => ({ path: k, avg: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => a.avg - b.avg);

  avgSlackChart = new Chart(avgSlackChartCanvas, {
    type: "line",
    data: {
      labels: avgByPath.map(d => d.path),
      datasets: [{
        data: avgByPath.map(d => d.avg),
        borderColor: "#06b6d4",
        fill: true,
        tension: 0.4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  /* Violation Trend */
  const byTime = {};
  rawData.forEach(d => {
    byTime[d.ingestion_ts] = byTime[d.ingestion_ts] || [];
    byTime[d.ingestion_ts].push(Number(d.slack));
  });

  const times = Object.keys(byTime).sort();

  violationTrendChart = new Chart(violationTrendChartCanvas, {
    type: "line",
    data: {
      labels: times,
      datasets: [{
        data: times.map(t => byTime[t].filter(v => v < 0).length),
        borderColor: "#dc2626",
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
