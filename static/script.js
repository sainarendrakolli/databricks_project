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
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

function resizeCharts() {
  setTimeout(() => charts.forEach(c => c.resize()), 150);
}

function tooltipConfig() {
  return {
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
        stacked,
        title: { display: true, text: xLabel },
        ticks: { color: "#e5e7eb", autoSkip: true }
      },
      y: {
        stacked,
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

  const dataRows = rawData.filter(r => r.path_id !== null);
  const paths = dataRows.map(r => `Path ${r.path_id}`);

  /* ================= DATA PATH ================= */

  // 1. Data Delay
  charts.push(new Chart(dataDelayChart, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label:"Min", backgroundColor:"#0ea5e9", data:dataRows.map(r=>r.data_delay_min) },
        { label:"Max", backgroundColor:"#ef4444", data:dataRows.map(r=>r.data_delay_max) },
        { label:"Avg", backgroundColor:"#22c55e", data:dataRows.map(r=>r.data_delay_avg) }
      ]
    },
    options: baseOptions("Path", "Delay (ns)")
  }));

  // 2. Path Contribution
  charts.push(new Chart(dataPathContribution, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label:"Data Path %", backgroundColor:"#6366f1", data:dataRows.map(r=>r.datapath_contri) },
        { label:"Clock Path %", backgroundColor:"#ec4899", data:dataRows.map(r=>r.clkpath_contri) }
      ]
    },
    options: baseOptions("Path", "Contribution (%)", true)
  }));

  // 3. Fanout
  charts.push(new Chart(fanoutChart, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label:"Fanout", backgroundColor:"#14b8a6", data:dataRows.map(r=>r.data_fanout_max) }
      ]
    },
    options: baseOptions("Path", "Fanout Count")
  }));

  // 4. Data Slew
  charts.push(new Chart(dataSlewChart, {
    type: "line",
    data: {
      labels: paths,
      datasets: [{
        label:"Avg Slew",
        borderColor:"#f97316",
        backgroundColor:"rgba(249,115,22,0.15)",
        data:dataRows.map(r=>r.data_slew_avg),
        tension:0.3,
        pointRadius:4
      }]
    },
    options: baseOptions("Path", "Slew (ns)")
  }));

  // 5. Arrival vs Required
  charts.push(new Chart(arrivalReqChart, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label:"Arrival", backgroundColor:"#8b5cf6", data:dataRows.map(r=>r.arrival_time) },
        { label:"Required", backgroundColor:"#f59e0b", data:dataRows.map(r=>r.required_time) }
      ]
    },
    options: baseOptions("Path", "Time (ns)")
  }));

  // 6. Data Load
  charts.push(new Chart(dataLoadChart, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label:"Avg Load", backgroundColor:"#06b6d4", data:dataRows.map(r=>r.data_load_avg) }
      ]
    },
    options: baseOptions("Path", "Load")
  }));

  /* ================= CLOCK PATH ================= */

  // 7. Clock Path Contribution
  charts.push(new Chart(clockPathContribution, {
    type: "doughnut",
    data: {
      labels:["Clock Contribution","Data Contribution"],
      datasets:[{
        data:[
          avg(dataRows.map(r=>r.clkpath_contri)),
          avg(dataRows.map(r=>r.datapath_contri))
        ],
        backgroundColor:["#ec4899","#6366f1"]
      }]
    },
    options:{ plugins:{ tooltip:tooltipConfig() } }
  }));

  // 8. Skew
  charts.push(new Chart(skewChart, {
    type: "line",
    data: {
      labels: paths,
      datasets:[{
        label:"Skew",
        borderColor:"#38bdf8",
        backgroundColor:"rgba(56,189,248,0.15)",
        data:dataRows.map(r=>r.skew),
        tension:0.3,
        pointRadius:4
      }]
    },
    options: baseOptions("Path", "Skew (ns)")
  }));

  // 9. Clock Slew
  charts.push(new Chart(clockSlewChart, {
    type: "bar",
    data: {
      labels: paths,
      datasets:[
        { label:"Min", backgroundColor:"#0ea5e9", data:dataRows.map(r=>r.clk_slew_min) },
        { label:"Max", backgroundColor:"#ef4444", data:dataRows.map(r=>r.clk_slew_max) }
      ]
    },
    options: baseOptions("Path", "Clock Slew (ns)")
  }));

  // ❌ REMOVED latencyChart completely
}

/* ================= LOAD ================= */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

window.onload = loadData;
setInterval(loadData, 60000);
