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

function redrawCharts() {
  setTimeout(() => charts.forEach(c => c.resize()), 150);
}

/* ================= VISUAL CONFIG ================= */
function tooltipConfig() {
  return {
    backgroundColor: "#ffffff",
    titleColor: "#000000",
    bodyColor: "#000000",
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
      legend: {
        labels: {
          color: "#000000",
          font: { weight: "600" }
        }
      },
      tooltip: tooltipConfig()
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xLabel,
          color: "#000000",
          font: { weight: "600" }
        },
        ticks: {
          color: "#000000"
        },
        grid: { color: "#e5e7eb" }
      },
      y: {
        title: {
          display: true,
          text: yLabel,
          color: "#000000",
          font: { weight: "600" }
        },
        ticks: {
          color: "#000000"
        },
        beginAtZero: true,
        grid: { color: "#e5e7eb" }
      }
    }
  };
}

/* ================= RENDER ================= */
function render() {
  if (!rawData.length) return;
  destroyCharts();

  const rows = rawData.filter(r => r.path_id !== null);
  const paths = rows.map(r => `Path ${r.path_id}`);

  /* ================= DATA PATH ================= */

  // 1. Data Delay (Min / Max / Avg)
  charts.push(new Chart(document.getElementById("dataDelayChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min Delay", backgroundColor: "#2563eb", data: rows.map(r => r.data_delay_min) },
        { label: "Max Delay", backgroundColor: "#dc2626", data: rows.map(r => r.data_delay_max) },
        { label: "Avg Delay", backgroundColor: "#16a34a", data: rows.map(r => r.data_delay_avg) }
      ]
    },
    options: baseOptions("Path", "Delay (ns)")
  }));

  // 2. Path Contribution (Data vs Clock)
  charts.push(new Chart(document.getElementById("dataPathContribution"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Data Path %", backgroundColor: "#0ea5e9", data: rows.map(r => r.datapath_contri) },
        { label: "Clock Path %", backgroundColor: "#f97316", data: rows.map(r => r.clkpath_contri) }
      ]
    },
    options: baseOptions("Path", "Contribution (%)")
  }));

  // 3. Fanout
  charts.push(new Chart(document.getElementById("fanoutChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Max Fanout", backgroundColor: "#7c3aed", data: rows.map(r => r.data_fanout_max) }
      ]
    },
    options: baseOptions("Path", "Fanout")
  }));

  // 4. Data Slew
  charts.push(new Chart(document.getElementById("dataSlewChart"), {
    type: "line",
    data: {
      labels: paths,
      datasets: [{
        label: "Avg Data Slew",
        data: rows.map(r => r.data_slew_avg),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220,38,38,0.1)",
        tension: 0.3,
        fill: true
      }]
    },
    options: baseOptions("Path", "Slew (ns)")
  }));

  // 5. Arrival vs Required
  charts.push(new Chart(document.getElementById("arrivalReqChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Arrival Time", backgroundColor: "#2563eb", data: rows.map(r => r.arrival_time) },
        { label: "Required Time", backgroundColor: "#16a34a", data: rows.map(r => r.required_time) }
      ]
    },
    options: baseOptions("Path", "Time (ns)")
  }));

  // 6. Data Load
  charts.push(new Chart(document.getElementById("dataLoadChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Avg Load", backgroundColor: "#0891b2", data: rows.map(r => r.data_load_avg) }
      ]
    },
    options: baseOptions("Path", "Load")
  }));

  /* ================= CLOCK PATH ================= */

  // 7. Clock Contribution (Donut)
  charts.push(new Chart(document.getElementById("clockPathContribution"), {
    type: "doughnut",
    data: {
      labels: ["Clock Contribution", "Data Contribution"],
      datasets: [{
        data: [
          avg(rows.map(r => r.clkpath_contri)),
          avg(rows.map(r => r.datapath_contri))
        ],
        backgroundColor: ["#f97316", "#0ea5e9"]
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "#000000" } },
        tooltip: tooltipConfig()
      }
    }
  }));

  // 8. Skew
  charts.push(new Chart(document.getElementById("skewChart"), {
    type: "line",
    data: {
      labels: paths,
      datasets: [{
        label: "Skew",
        data: rows.map(r => r.skew),
        borderColor: "#7c3aed",
        tension: 0.3
      }]
    },
    options: baseOptions("Path", "Skew (ns)")
  }));

  // 9. Clock Slew (Min / Max)
  charts.push(new Chart(document.getElementById("clockSlewChart"), {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label: "Min Clock Slew", backgroundColor: "#2563eb", data: rows.map(r => r.clk_slew_min) },
        { label: "Max Clock Slew", backgroundColor: "#dc2626", data: rows.map(r => r.clk_slew_max) }
      ]
    },
    options: baseOptions("Path", "Clock Slew (ns)")
  }));
}

/* ================= LOAD ================= */
async function loadData() {
  try {
    const res = await fetch("/timing-data");
    rawData = await res.json();
    render();
  } catch (e) {
    console.error("Failed to load timing data", e);
  }
}

window.onload = loadData;
setInterval(loadData, 60000);
