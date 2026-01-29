let charts = [];
let rawData = [];

/* ================= NAV ================= */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
}

/* ================= HELPERS ================= */
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

/* PowerBI-like tooltip */
function tooltipConfig() {
  return {
    enabled: true,
    backgroundColor: "#020617",
    titleColor: "#38bdf8",
    bodyColor: "#e5e7eb",
    borderColor: "#38bdf8",
    borderWidth: 1,
    padding: 10,
    displayColors: true
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
        ticks: { color: "#e5e7eb", maxRotation: 0, autoSkip: true }
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

  /* ---------- DATA PATH DOM ---------- */
  const dataDelayChartEl = document.getElementById("dataDelayChart");
  const dataPathContributionEl = document.getElementById("dataPathContribution");
  const fanoutChartEl = document.getElementById("fanoutChart");
  const dataSlewChartEl = document.getElementById("dataSlewChart");
  const arrivalReqChartEl = document.getElementById("arrivalReqChart");
  const dataLoadChartEl = document.getElementById("dataLoadChart");

  const paths = [...new Set(rawData.map(d => d.path_id))];

  /* ===== 1. DATA DELAY ===== */
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

  /* ===== 2. PATH CONTRIBUTION ===== */
  const groupCount = {};
  rawData.forEach(d => groupCount[d.path_group] = (groupCount[d.path_group] || 0) + 1);

  charts.push(new Chart(dataPathContributionEl, {
    type: "doughnut",
    data: {
      labels: Object.keys(groupCount),
      datasets: [{
        data: Object.values(groupCount),
        backgroundColor: ["#38bdf8", "#22c55e", "#facc15", "#f97316"]
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: tooltipConfig()
      }
    }
  }));

  /* ===== 3. FANOUT ===== */
  charts.push(new Chart(fanoutChartEl, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_fanout_min))), backgroundColor: "#38bdf8" },
        { label: "Max", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_fanout_max))), backgroundColor: "#22c55e" },
        { label: "Avg", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_fanout_avg))), backgroundColor: "#facc15" }
      ]
    },
    options: baseOptions("Path", "Fanout")
  }));

  /* ===== 4. DATA SLEW ===== */
  charts.push(new Chart(dataSlewChartEl, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_slew_min))), backgroundColor: "#38bdf8" },
        { label: "Max", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_slew_max))), backgroundColor: "#22c55e" },
        { label: "Avg", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_slew_avg))), backgroundColor: "#facc15" }
      ]
    },
    options: baseOptions("Path", "Slew (ns)")
  }));

  /* ===== 5. ARRIVAL vs REQUIRED ===== */
  charts.push(new Chart(arrivalReqChartEl, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Arrival", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.arrival_time))), backgroundColor: "#38bdf8" },
        { label: "Required", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.required_time))), backgroundColor: "#f97316" }
      ]
    },
    options: baseOptions("Path", "Time (ns)")
  }));

  /* ===== 6. LOAD ===== */
  charts.push(new Chart(dataLoadChartEl, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_load_min))), backgroundColor: "#38bdf8" },
        { label: "Max", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_load_max))), backgroundColor: "#22c55e" },
        { label: "Avg", data: paths.map(p => avg(rawData.filter(d => d.path_id === p).map(d => d.data_load_avg))), backgroundColor: "#facc15" }
      ]
    },
    options: baseOptions("Path", "Load")
  }));

  /* ================= CLOCK PATH ================= */

  const clockPathContributionEl = document.getElementById("clockPathContribution");
  const skewChartEl = document.getElementById("skewChart");
  const clockSlewChartEl = document.getElementById("clockSlewChart");
  const avgSlackChartEl = document.getElementById("avgSlackChart");

  const clockData = rawData.filter(d =>
    d.clk_slew_min !== null &&
    d.clk_slew_max !== null &&
    d.clk_slew_avg !== null
  );

  const idx = clockData.map((_, i) => i + 1);

  /* Clock Contribution */
  charts.push(new Chart(clockPathContributionEl, {
    type: "doughnut",
    data: {
      labels: ["Clock Paths"],
      datasets: [{ data: [clockData.length], backgroundColor: ["#38bdf8"] }]
    },
    options: { plugins: { legend: { display: false }, tooltip: tooltipConfig() } }
  }));

  /* Skew */
  charts.push(new Chart(skewChartEl, {
    type: "line",
    data: {
      labels: idx,
      datasets: [{
        label: "Skew",
        data: clockData.map(d => d.skew),
        borderColor: "#38bdf8",
        tension: 0.25,
        pointRadius: 2
      }]
    },
    options: baseOptions("Clock Index", "Skew (ns)")
  }));

  /* Clock Slew */
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
    options: baseOptions("Clock Index", "Clock Slew (ns)")
  }));

  /* Avg Slack */
  charts.push(new Chart(avgSlackChartEl, {
    type: "line",
    data: {
      labels: idx,
      datasets: [{
        label: "Slack",
        data: clockData.map(d => d.slack),
        borderColor: "#22c55e",
        tension: 0.25,
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
  render();
}

loadData();
setInterval(loadData, 30000);
