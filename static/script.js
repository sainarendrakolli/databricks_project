let charts = [];
let rawData = [];

/* ================= NAV ================= */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
  resizeCharts();
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
  resizeCharts();
}

/* ================= UTIL ================= */
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

/* Chart.js cannot render inside hidden divs */
function resizeCharts() {
  setTimeout(() => charts.forEach(c => c.resize()), 150);
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

/* ================= RENDER ================= */
function render() {
  if (!rawData.length) return;
  destroyCharts();

  /* ---------- SPLIT DATA CORRECTLY ---------- */
  const dataRows = rawData.filter(r => r.path_id !== null);
  const clockRows = rawData.filter(r =>
    r.clk_slew_min !== null ||
    r.clk_slew_max !== null ||
    r.skew !== null
  );

  console.log("DataPath rows:", dataRows.length);
  console.log("ClockPath rows:", clockRows.length);

  /* ================= DATA PATH ================= */
  const paths = [...new Set(dataRows.map(r => r.path_id))];

  charts.push(new Chart(
    document.getElementById("dataDelayChart"), {
      type: "bar",
      data: {
        labels: paths,
        datasets: [
          { label:"Min", backgroundColor:"#38bdf8",
            data: paths.map(p => avg(dataRows.filter(r=>r.path_id===p).map(r=>r.data_delay_min))) },
          { label:"Max", backgroundColor:"#22c55e",
            data: paths.map(p => avg(dataRows.filter(r=>r.path_id===p).map(r=>r.data_delay_max))) },
          { label:"Avg", backgroundColor:"#facc15",
            data: paths.map(p => avg(dataRows.filter(r=>r.path_id===p).map(r=>r.data_delay_avg))) }
        ]
      },
      options: baseOptions("Path", "Delay (ns)")
    }
  ));

  /* ================= CLOCK PATH ================= */
  if (!clockRows.length) return;   // 🔥 prevents empty charts

  const idx = clockRows.map((_, i) => i + 1);

  charts.push(new Chart(
    document.getElementById("clockPathContribution"), {
      type: "doughnut",
      data: {
        labels: ["Clock Paths"],
        datasets: [{
          data: [clockRows.length],
          backgroundColor: ["#38bdf8"]
        }]
      },
      options: { plugins: { legend: { display:false }, tooltip: tooltipConfig() } }
    }
  ));

  charts.push(new Chart(
    document.getElementById("skewChart"), {
      type: "line",
      data: {
        labels: idx,
        datasets: [{
          label: "Skew",
          data: clockRows.map(r => r.skew),
          borderColor: "#38bdf8",
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: baseOptions("Clock Index", "Skew (ns)")
    }
  ));

  charts.push(new Chart(
    document.getElementById("clockSlewChart"), {
      type: "bar",
      data: {
        labels: idx,
        datasets: [
          { label:"Min", backgroundColor:"#38bdf8", data: clockRows.map(r=>r.clk_slew_min) },
          { label:"Max", backgroundColor:"#22c55e", data: clockRows.map(r=>r.clk_slew_max) },
          { label:"Avg", backgroundColor:"#facc15", data: clockRows.map(r=>r.clk_slew_avg) }
        ]
      },
      options: baseOptions("Clock Index", "Clock Slew (ns)")
    }
  ));

  charts.push(new Chart(
    document.getElementById("avgSlackChart"), {
      type: "line",
      data: {
        labels: idx,
        datasets: [{
          label: "Slack",
          data: clockRows.map(r => r.slack),
          borderColor: "#22c55e",
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: baseOptions("Clock Index", "Slack (ns)")
    }
  ));
}

/* ================= LOAD ================= */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

loadData();
setInterval(loadData, 30000);
