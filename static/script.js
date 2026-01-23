let slackChart, statusChart;
let rawData = [];

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
  document.querySelectorAll(".tab").forEach((t, i) =>
    t.classList.toggle("active", i === index)
  );
}

async function loadData() {
  const res = await fetch("/timing-data");
  rawData = await res.json();

  updateKPIs();
  renderTable();
  renderCharts();
}

function updateKPIs() {
  document.getElementById("totalPaths").innerText = rawData.length;

  const violations = rawData.filter(d => d.timing_status === "VIOLATED").length;
  document.getElementById("violations").innerText = violations;

  const avgSlack = (
    rawData.reduce((s, d) => s + d.slack, 0) / rawData.length
  ).toFixed(2);

  document.getElementById("avgSlack").innerText = avgSlack;
}

function renderTable() {
  const body = document.getElementById("data-body");
  body.innerHTML = "";

  rawData.forEach(d => {
    body.innerHTML += `
      <tr>
        <td>${d.id}</td>
        <td>${d.begin_clock}</td>
        <td>${d.end_clock}</td>
        <td>${d.slack}</td>
        <td><span class="status ${d.timing_status}">${d.timing_status}</span></td>
        <td>${d.ingestion_ts}</td>
      </tr>
    `;
  });
}

function renderCharts() {
  if (slackChart) slackChart.destroy();
  if (statusChart) statusChart.destroy();

  slackChart = new Chart(slackChartCanvas(), {
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
    statusCount[d.timing_status] = (statusCount[d.timing_status] || 0) + 1;
  });

  statusChart = new Chart(statusChartCanvas(), {
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

function slackChartCanvas() {
  return document.getElementById("slackChart");
}

function statusChartCanvas() {
  return document.getElementById("statusChart");
}

loadData();
setInterval(loadData, 30000);
