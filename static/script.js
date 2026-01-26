let charts = [];
let rawData = [];

/* ---------------- NAV ---------------- */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
  toggleMenu(0);
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
  toggleMenu(1);
}

function toggleMenu(i) {
  document.querySelectorAll(".menu").forEach((m, idx) =>
    m.classList.toggle("active", idx === i)
  );
}

/* ---------------- HELPERS ---------------- */
const avg = (col, path) => {
  const v = rawData.filter(d => d.path_id === path).map(d => +d[col] || 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

const avgGroup = (col, g) => {
  const v = rawData.filter(d => d.path_group === g).map(d => +d[col] || 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

/* ---------------- CHART FACTORIES ---------------- */
function barChart(id, labels, datasets, xLabel, yLabel) {
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels, datasets },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e5e7eb" } }
      },
      scales: {
        x: {
          title: { display: true, text: xLabel, color: "#94a3b8" },
          ticks: { color: "#e5e7eb" },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: yLabel, color: "#94a3b8" },
          ticks: { color: "#e5e7eb" }
        }
      }
    }
  });
}

function lineChart(id, labels, data, xLabel, yLabel) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderColor: "#38bdf8",
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: false
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: xLabel, color: "#94a3b8" } },
        y: { title: { display: true, text: yLabel, color: "#94a3b8" } }
      }
    }
  });
}

function donutChart(id, labels, data) {
  return new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#38bdf8", "#22c55e", "#facc15", "#f97316", "#a855f7"]
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#e5e7eb" } } }
    }
  });
}

/* ---------------- RENDER ---------------- */
function render() {
  charts.forEach(c => c.destroy());
  charts = [];

  const paths = [...new Set(rawData.map(d => d.path_id))];
  const groups = [...new Set(rawData.map(d => d.path_group))];

  charts.push(barChart("dataDelayChart", paths, [
    { label: "Min", data: paths.map(p => avg("data_delay_min", p)), backgroundColor: "#38bdf8" },
    { label: "Max", data: paths.map(p => avg("data_delay_max", p)), backgroundColor: "#22c55e" },
    { label: "Avg", data: paths.map(p => avg("data_delay_avg", p)), backgroundColor: "#facc15" }
  ], "Path", "Data Delay (ns)"));

  charts.push(donutChart("dataPathContribution", groups,
    groups.map(g => rawData.filter(d => d.path_group === g).length)
  ));

  charts.push(barChart("fanoutChart", paths, [
    { label: "Min", data: paths.map(p => avg("data_fanout_min", p)), backgroundColor: "#38bdf8" },
    { label: "Max", data: paths.map(p => avg("data_fanout_max", p)), backgroundColor: "#22c55e" },
    { label: "Avg", data: paths.map(p => avg("data_fanout_avg", p)), backgroundColor: "#facc15" }
  ], "Path", "Fanout"));

  charts.push(barChart("dataSlewChart", paths, [
    { label: "Min", data: paths.map(p => avg("data_slew_min", p)), backgroundColor: "#38bdf8" },
    { label: "Max", data: paths.map(p => avg("data_slew_max", p)), backgroundColor: "#22c55e" },
    { label: "Avg", data: paths.map(p => avg("data_slew_avg", p)), backgroundColor: "#facc15" }
  ], "Path", "Data Slew (ns)"));

  charts.push(barChart("arrivalReqChart", paths, [
    { label: "Arrival", data: paths.map(p => avg("arrival_time", p)), backgroundColor: "#38bdf8" },
    { label: "Required", data: paths.map(p => avg("required_time", p)), backgroundColor: "#f97316" }
  ], "Path", "Time (ns)"));

  charts.push(barChart("dataLoadChart", paths, [
    { label: "Min", data: paths.map(p => avg("data_load_min", p)), backgroundColor: "#38bdf8" },
    { label: "Max", data: paths.map(p => avg("data_load_max", p)), backgroundColor: "#22c55e" },
    { label: "Avg", data: paths.map(p => avg("data_load_avg", p)), backgroundColor: "#facc15" }
  ], "Path", "Load"));

  charts.push(donutChart("clockPathContribution", groups,
    groups.map(g => rawData.filter(d => d.path_group === g).length)
  ));

  charts.push(lineChart("skewChart", groups,
    groups.map(g => avgGroup("skew", g)),
    "Path Group", "Skew (ns)"
  ));

  charts.push(barChart("clockSlewChart", groups, [
    { label: "Min", data: groups.map(g => avgGroup("clk_slew_min", g)), backgroundColor: "#38bdf8" },
    { label: "Max", data: groups.map(g => avgGroup("clk_slew_max", g)), backgroundColor: "#22c55e" },
    { label: "Avg", data: groups.map(g => avgGroup("clk_slew_avg", g)), backgroundColor: "#facc15" }
  ], "Path Group", "Clock Slew (ns)"));

  charts.push(lineChart("avgSlackChart", groups,
    groups.map(g => avgGroup("slack", g)),
    "Path Group", "Slack (ns)"
  ));
}

/* ---------------- LOAD ---------------- */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

loadData();
setInterval(loadData, 30000);
