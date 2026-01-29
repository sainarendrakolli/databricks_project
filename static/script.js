let charts = [];
let rawData = [];

/* ================= NAV ================= */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");

  destroyCharts();
  setTimeout(renderDataPath, 50);
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");

  destroyCharts();
  setTimeout(renderClockPath, 50);
}

/* ================= HELPERS ================= */
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

function tooltipConfig() {
  return {
    enabled: true,
    backgroundColor: "#020617",
    titleColor: "#38bdf8",
    bodyColor: "#e5e7eb",
    borderColor: "#38bdf8",
    borderWidth: 1,
    padding: 10
  };
}

function baseOptions(xLabel, yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#e5e7eb" } },
      tooltip: tooltipConfig()
    },
    scales: {
      x: {
        title: { display: true, text: xLabel, color: "#94a3b8" },
        ticks: { color: "#e5e7eb", autoSkip: true }
      },
      y: {
        title: { display: true, text: yLabel, color: "#94a3b8" },
        ticks: { color: "#e5e7eb" },
        beginAtZero: true
      }
    }
  };
}

/* ================= DATA PATH ================= */
function renderDataPath() {
  if (!rawData.length) return;

  const paths = [...new Set(rawData.map(d => d.path_id))];

  charts.push(new Chart(document.getElementById("dataDelayChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_delay_min))), backgroundColor: "#38bdf8" },
        { label: "Max", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_delay_max))), backgroundColor: "#22c55e" },
        { label: "Avg", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_delay_avg))), backgroundColor: "#facc15" }
      ]
    },
    options: baseOptions("Path", "Delay (ns)")
  }));
}

/* ================= CLOCK PATH ================= */
function renderClockPath() {
  if (!rawData.length) return;

  const clockData = rawData.filter(d =>
    d.clk_slew_min !== null &&
    d.clk_slew_max !== null &&
    d.clk_slew_avg !== null
  );

  if (!clockData.length) return;

  const idx = clockData.map((_, i) => i + 1);

  charts.push(new Chart(document.getElementById("clockPathContribution"), {
    type: "doughnut",
    data: {
      labels: ["Clock Paths"],
      datasets: [{ data: [clockData.length], backgroundColor: ["#38bdf8"] }]
    },
    options: { plugins: { legend: { display: false }, tooltip: tooltipConfig() } }
  }));

  charts.push(new Chart(document.getElementById("skewChart"), {
    type: "line",
    data: {
      labels: idx,
      datasets: [{
        label: "Skew",
        data: clockData.map(d => d.skew),
        borderColor: "#38bdf8",
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: baseOptions("Clock Index", "Skew (ns)")
  }));

  charts.push(new Chart(document.getElementById("clockSlewChart"), {
    type: "bar",
    data: {
      labels: idx,
      datasets: [
        { label: "Min", data: clockData.map(d => d.clk_slew_min), backgroundColor: "#38bdf8" },
        { label: "Max", data: clockData.map(d => d.clk_slew_max), backgroundColor: "#22c55e" },
        { label: "Avg", data: clockData.map(d => d.clk_slew_avg), backgroundColor: "#facc15" }
      ]
    },
    options: baseOptions("Clock Index", "Clock Slew (ns)")
  }));

  charts.push(new Chart(document.getElementById("avgSlackChart"), {
    type: "line",
    data: {
      labels: idx,
      datasets: [{
        label: "Slack",
        data: clockData.map(d => d.slack),
        borderColor: "#22c55e",
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: baseOptions("Clock Index", "Slack (ns)")
  }));
}

/* ================= LOAD ================= */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  renderDataPath(); // default view
}

loadData();
setInterval(loadData, 30000);
