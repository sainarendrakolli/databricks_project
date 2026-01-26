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
function avg(col, path) {
  const v = rawData.filter(d => d.path_id === path).map(d => Number(d[col] || 0));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function avgGroup(col, g) {
  const v = rawData.filter(d => d.path_group === g).map(d => Number(d[col] || 0));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function ds(label, data, color) {
  return { label, data, backgroundColor: color };
}

/* ---------------- CHART FACTORY ---------------- */
function bar(id, labels, datasets, xLabel, yLabel) {
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e5e7eb" } } },
      scales: {
        x: {
          title: { display: true, text: xLabel, color: "#94a3b8" },
          ticks: { color: "#e5e7eb" }
        },
        y: {
          title: { display: true, text: yLabel, color: "#94a3b8" },
          ticks: { color: "#e5e7eb" }
        }
      }
    }
  });
}

function line(id, labels, data, xLabel, yLabel) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderColor: "#38bdf8",
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: xLabel, color: "#94a3b8" } },
        y: { title: { display: true, text: yLabel, color: "#94a3b8" } }
      }
    }
  });
}

function donut(id, labels, data) {
  return new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#38bdf8", "#22c55e", "#facc15", "#f97316"]
      }]
    },
    options: {
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

  charts.push(bar(
    "dataDelayChart",
    paths,
    [
      ds("Min", paths.map(p => avg("data_delay_min", p)), "#38bdf8"),
      ds("Max", paths.map(p => avg("data_delay_max", p)), "#22c55e"),
      ds("Avg", paths.map(p => avg("data_delay_avg", p)), "#facc15")
    ],
    "Path",
    "Data Delay (ns)"
  ));

  charts.push(donut(
    "dataPathContribution",
    groups,
    groups.map(g => rawData.filter(d => d.path_group === g).length)
  ));

  charts.push(bar(
    "fanoutChart",
    paths,
    [
      ds("Min", paths.map(p => avg("data_fanout_min", p)), "#38bdf8"),
      ds("Max", paths.map(p => avg("data_fanout_max", p)), "#22c55e"),
      ds("Avg", paths.map(p => avg("data_fanout_avg", p)), "#facc15")
    ],
    "Path",
    "Fanout"
  ));

  charts.push(bar(
    "dataSlewChart",
    paths,
    [
      ds("Min", paths.map(p => avg("data_slew_min", p)), "#38bdf8"),
      ds("Max", paths.map(p => avg("data_slew_max", p)), "#22c55e"),
      ds("Avg", paths.map(p => avg("data_slew_avg", p)), "#facc15")
    ],
    "Path",
    "Data Slew (ns)"
  ));

  charts.push(bar(
    "arrivalReqChart",
    paths,
    [
      ds("Arrival", paths.map(p => avg("arrival_time", p)), "#38bdf8"),
      ds("Required", paths.map(p => avg("required_time", p)), "#f97316")
    ],
    "Path",
    "Time (ns)"
  ));

  charts.push(bar(
    "dataLoadChart",
    paths,
    [
      ds("Min", paths.map(p => avg("data_load_min", p)), "#38bdf8"),
      ds("Max", paths.map(p => avg("data_load_max", p)), "#22c55e"),
      ds("Avg", paths.map(p => avg("data_load_avg", p)), "#facc15")
    ],
    "Path",
    "Load"
  ));

  charts.push(donut(
    "clockPathContribution",
    groups,
    groups.map(g => rawData.filter(d => d.path_group === g).length)
  ));

  charts.push(line(
    "skewChart",
    groups,
    groups.map(g => avgGroup("skew", g)),
    "Path Group",
    "Skew (ns)"
  ));

  charts.push(bar(
    "clockSlewChart",
    groups,
    [
      ds("Min", groups.map(g => avgGroup("clk_slew_min", g)), "#38bdf8"),
      ds("Max", groups.map(g => avgGroup("clk_slew_max", g)), "#22c55e"),
      ds("Avg", groups.map(g => avgGroup("clk_slew_avg", g)), "#facc15")
    ],
    "Path Group",
    "Clock Slew (ns)"
  ));

  charts.push(line(
    "avgSlackChart",
    groups,
    groups.map(g => avgGroup("slack", g)),
    "Path Group",
    "Slack (ns)"
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
