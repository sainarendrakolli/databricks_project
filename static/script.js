let charts = [];
let rawData = [];

/* ================= NAV ================= */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
  document.getElementById("btn-data").classList.add("active");
  document.getElementById("btn-clock").classList.remove("active");
  resizeCharts();
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
  document.getElementById("btn-clock").classList.add("active");
  document.getElementById("btn-data").classList.remove("active");
  resizeCharts();
}

/* ================= UTIL ================= */
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

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

function baseOptions(xLabel, yLabel, stacked = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#e5e7eb" } },
      tooltip: tooltipConfig()
    },
    scales: {
      x: {
        stacked: stacked,
        title: { display: true, text: xLabel, color: "#94a3b8" },
        ticks: { color: "#e5e7eb", autoSkip: true }
      },
      y: {
        stacked: stacked,
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

  // Validating and filtering data based on CSV structure 
  const dataRows = rawData.filter(r => r.path_id !== null);
  const paths = dataRows.map(r => `Path ${r.path_id}`);

  /* ================= DATA PATH VIEW ================= */

  // 1. Data Delay (Min/Max/Avg) 
  charts.push(new Chart(document.getElementById("dataDelayChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min", backgroundColor: "#38bdf8", data: dataRows.map(r => r.data_delay_min) },
        { label: "Max", backgroundColor: "#22c55e", data: dataRows.map(r => r.data_delay_max) },
        { label: "Avg", backgroundColor: "#facc15", data: dataRows.map(r => r.data_delay_avg) }
      ]
    },
    options: baseOptions("Path ID", "Delay (ns)")
  }));

  // 2. Path Contribution (Stacked Bar) 
  charts.push(new Chart(document.getElementById("dataPathContribution"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Data Path %", backgroundColor: "#6366f1", data: dataRows.map(r => r.datapath_contri) },
        { label: "Clock Path %", backgroundColor: "#f43f5e", data: dataRows.map(r => r.clkpath_contri) }
      ]
    },
    options: baseOptions("Path ID", "Contribution %", true)
  }));

  // 3. Data Fanout 
  charts.push(new Chart(document.getElementById("fanoutChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [{ label: "Max Fanout", backgroundColor: "#10b981", data: dataRows.map(r => r.data_fanout_max) }]
    },
    options: baseOptions("Path ID", "Fanout Count")
  }));

  // 4. Data Slew 
  charts.push(new Chart(document.getElementById("dataSlewChart"), {
    type: "line",
    data: {
      labels: paths,
      datasets: [{ label: "Avg Slew", borderColor: "#f43f5e", data: dataRows.map(r => r.data_slew_avg), tension: 0.3 }]
    },
    options: baseOptions("Path ID", "Slew (ns)")
  }));

  // 5. Arrival vs Required 
  charts.push(new Chart(document.getElementById("arrivalReqChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Arrival", backgroundColor: "#8b5cf6", data: dataRows.map(r => r.arrival_time) },
        { label: "Required", backgroundColor: "#cbd5e1", data: dataRows.map(r => r.required_time) }
      ]
    },
    options: baseOptions("Path ID", "Time (ns)")
  }));

  // 6. Data Load 
  charts.push(new Chart(document.getElementById("dataLoadChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [{ label: "Avg Load", backgroundColor: "#06b6d4", data: dataRows.map(r => r.data_load_avg) }]
    },
    options: baseOptions("Path ID", "Load (fF)")
  }));

  /* ================= CLOCK PATH VIEW ================= */

  // 7. Clock Path Contribution 
  charts.push(new Chart(document.getElementById("clockPathContribution"), {
    type: "doughnut",
    data: {
      labels: ["Clock Contri", "Data Contri"],
      datasets: [{
        data: [avg(dataRows.map(r => r.clkpath_contri)), avg(dataRows.map(r => r.datapath_contri))],
        backgroundColor: ["#38bdf8", "#1e293b"]
      }]
    },
    options: { maintainAspectRatio: false, plugins: { tooltip: tooltipConfig() } }
  }));

  // 8. Skew Chart 
  charts.push(new Chart(document.getElementById("skewChart"), {
    type: "line",
    data: {
      labels: paths,
      datasets: [{ label: "Skew", borderColor: "#38bdf8", data: dataRows.map(r => r.skew), tension: 0.3 }]
    },
    options: baseOptions("Path ID", "Skew (ns)")
  }));

  // 9. Clock Slew (Min/Max/Avg) 
  charts.push(new Chart(document.getElementById("clockSlewChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min", backgroundColor: "#38bdf8", data: dataRows.map(r => r.clk_slew_min) },
        { label: "Max", backgroundColor: "#22c55e", data: dataRows.map(r => r.clk_slew_max) }
      ]
    },
    options: baseOptions("Path ID", "Clock Slew (ns)")
  }));

  // 10. Slack Chart 
  charts.push(new Chart(document.getElementById("avgSlackChart"), {
    type: "line",
    data: {
      labels: paths,
      datasets: [{ label: "Slack", borderColor: "#22c55e", data: dataRows.map(r => r.slack), tension: 0.3, fill: true, backgroundColor: "rgba(34, 197, 94, 0.1)" }]
    },
    options: baseOptions("Path ID", "Slack (ns)")
  }));
}

/* ================= LOAD ================= */
async function loadData() {
  try {
    const r = await fetch("/timing-data");
    rawData = await r.json();
    render();
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}

window.onload = loadData;
setInterval(loadData, 60000);