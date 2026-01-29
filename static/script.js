let charts = [];
let rawData = [];

/* ================= NAV ================= */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
  redrawCharts();
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
  redrawCharts();
}

/* ================= HELPERS ================= */
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

/* 🔥 REQUIRED: resize after visibility change */
function redrawCharts() {
  setTimeout(() => {
    charts.forEach(c => c.resize());
  }, 120);
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
        title: { display: true, text: xLabel },
        ticks: { color: "#e5e7eb", autoSkip: true }
      },
      y: {
        title: { display: true, text: yLabel },
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

  /* 🔥 EXPLICIT DOM BINDINGS (THIS FIXES IT) */
  const dataDelayChartEl = document.getElementById("dataDelayChart");
  const dataPathContributionEl = document.getElementById("dataPathContribution");
  const fanoutChartEl = document.getElementById("fanoutChart");
  const dataSlewChartEl = document.getElementById("dataSlewChart");
  const arrivalReqChartEl = document.getElementById("arrivalReqChart");
  const dataLoadChartEl = document.getElementById("dataLoadChart");

  const clockPathContributionEl = document.getElementById("clockPathContribution");
  const skewChartEl = document.getElementById("skewChart");
  const clockSlewChartEl = document.getElementById("clockSlewChart");
  const avgSlackChartEl = document.getElementById("avgSlackChart");

  const paths = [...new Set(rawData.map(d => d.path_id))];

  /* ========= DATA PATH ========= */
  charts.push(new Chart(dataDelayChartEl, {
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

  /* ========= CLOCK PATH ========= */
  const clockData = rawData.filter(d =>
    d.clk_slew_min !== null &&
    d.clk_slew_max !== null &&
    d.clk_slew_avg !== null
  );

  const idx = clockData.map((_, i) => i + 1);

  charts.push(new Chart(clockPathContributionEl, {
    type: "doughnut",
    data: {
      labels: ["Clock Paths"],
      datasets: [{ data: [clockData.length], backgroundColor: ["#38bdf8"] }]
    },
    options: { plugins: { legend: { display: false }, tooltip: tooltipConfig() } }
  }));

  charts.push(new Chart(skewChartEl, {
    type: "line",
    data: {
      labels: idx,
      datasets: [{
        data: clockData.map(d => d.skew),
        borderColor: "#38bdf8",
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: baseOptions("Index", "Skew (ns)")
  }));

  charts.push(new Chart(clockSlewChartEl, {
    type: "bar",
    data: {
      labels: idx,
      datasets: [
        { label: "Min", data: clockData.map(d => d.clk_slew_min), backgroundColor: "#38bdf8" },
        { label: "Max", data: clockData.map(d => d.clk_slew_max), backgroundColor: "#22c55e" },
        { label: "Avg", data: clockData.map(d => d.clk_slew_avg), backgroundColor: "#facc15" }
      ]
    },
    options: baseOptions("Index", "Clock Slew (ns)")
  }));

  charts.push(new Chart(avgSlackChartEl, {
    type: "line",
    data: {
      labels: idx,
      datasets: [{
        data: clockData.map(d => d.slack),
        borderColor: "#22c55e",
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: baseOptions("Index", "Slack (ns)")
  }));
}

/* ================= LOAD ================= */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

loadData();
setInterval(loadData, 30000);
