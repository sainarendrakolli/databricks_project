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
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

function resizeCharts() {
  setTimeout(() => charts.forEach(c => c.resize()), 120);
}

/* ================= CHART OPTIONS ================= */
function tooltipConfig() {
  return {
    enabled: true,
    backgroundColor: "#111827",
    titleColor: "#ffffff",
    bodyColor: "#ffffff",
    borderColor: "#000000",
    borderWidth: 1,
    padding: 10
  };
}

function baseOptions(xLabel, yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#000000" } },
      tooltip: tooltipConfig()
    },
    scales: {
      x: {
        title: { display: true, text: xLabel, color: "#000000" },
        ticks: { color: "#000000", autoSkip: true }
      },
      y: {
        title: { display: true, text: yLabel, color: "#000000" },
        ticks: { color: "#000000" },
        beginAtZero: true
      }
    }
  };
}

/* ================= RENDER ================= */
function render() {
  if (!rawData.length) return;
  destroyCharts();

  /* -------- VALID DATA ONLY -------- */
  const rows = rawData.filter(r => r.path_id !== null);
  if (!rows.length) return;

  const labels = rows.map(r => `Path ${r.path_id}`);

  /* ================= DATA PATH ================= */

  charts.push(new Chart(dataDelayChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Min", data: rows.map(r => r.data_delay_min), backgroundColor: "#2563eb" },
        { label: "Max", data: rows.map(r => r.data_delay_max), backgroundColor: "#dc2626" },
        { label: "Avg", data: rows.map(r => r.data_delay_avg), backgroundColor: "#16a34a" }
      ]
    },
    options: baseOptions("Path", "Delay (ns)")
  }));

  charts.push(new Chart(dataPathContribution, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Data Path %", data: rows.map(r => r.datapath_contri), backgroundColor: "#0ea5e9" },
        { label: "Clock Path %", data: rows.map(r => r.clkpath_contri), backgroundColor: "#f97316" }
      ]
    },
    options: baseOptions("Path", "Contribution %")
  }));

  charts.push(new Chart(fanoutChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Fanout", data: rows.map(r => r.data_fanout_max), backgroundColor: "#7c3aed" }
      ]
    },
    options: baseOptions("Path", "Fanout")
  }));

  charts.push(new Chart(dataSlewChart, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Avg Slew",
          data: rows.map(r => r.data_slew_avg),
          borderColor: "#db2777",
          tension: 0.3,
          pointRadius: 3
        }
      ]
    },
    options: baseOptions("Path", "Slew (ns)")
  }));

  charts.push(new Chart(arrivalReqChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Arrival", data: rows.map(r => r.arrival_time), backgroundColor: "#22c55e" },
        { label: "Required", data: rows.map(r => r.required_time), backgroundColor: "#64748b" }
      ]
    },
    options: baseOptions("Path", "Time (ns)")
  }));

  charts.push(new Chart(dataLoadChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Load", data: rows.map(r => r.data_load_avg), backgroundColor: "#0891b2" }
      ]
    },
    options: baseOptions("Path", "Load (fF)")
  }));

  /* ================= CLOCK PATH ================= */

  const clkRows = rows.filter(r =>
    typeof r.clk_slew_min === "number" &&
    typeof r.clk_slew_max === "number" &&
    typeof r.skew === "number"
  );

  // ❗ If no valid clock data → hide whole section
  if (!clkRows.length) {
    document.getElementById("clockPathView").classList.add("hidden");
    return;
  }

  charts.push(new Chart(clockPathContribution, {
    type: "doughnut",
    data: {
      labels: ["Clock %", "Data %"],
      datasets: [{
        data: [
          avg(clkRows.map(r => r.clkpath_contri)),
          avg(clkRows.map(r => r.datapath_contri))
        ],
        backgroundColor: ["#2563eb", "#9ca3af"]
      }]
    },
    options: { plugins: { tooltip: tooltipConfig() } }
  }));

  charts.push(new Chart(skewChart, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Skew",
          data: clkRows.map(r => r.skew),
          borderColor: "#ef4444",
          tension: 0.3,
          pointRadius: 3
        }
      ]
    },
    options: baseOptions("Path", "Skew (ns)")
  }));

  charts.push(new Chart(clockSlewChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Min", data: clkRows.map(r => r.clk_slew_min), backgroundColor: "#0ea5e9" },
        { label: "Max", data: clkRows.map(r => r.clk_slew_max), backgroundColor: "#f97316" }
      ]
    },
    options: baseOptions("Path", "Clock Slew (ns)")
  }));
}

/* ================= LOAD ================= */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

window.onload = loadData;
setInterval(loadData, 60000);
