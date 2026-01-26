let rawData = [];
let charts = [];

function showDataPath() {
  toggleNav(0);
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
}

function showClockPath() {
  toggleNav(1);
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
}

function toggleNav(i) {
  document.querySelectorAll(".nav-item").forEach((n, idx) =>
    n.classList.toggle("active", idx === i)
  );
}

async function loadData() {
  const res = await fetch("/timing-data");
  rawData = await res.json();
  renderDataPathCharts();
  renderClockPathCharts();
}

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

/* ================= DATA PATH ================= */

function renderDataPathCharts() {
  destroyCharts();

  const paths = [...new Set(rawData.map(d => d.path_id))];

  const minDelay = paths.map(p => avg("datapath_delay_min", p));
  const maxDelay = paths.map(p => avg("datapath_delay_max", p));
  const avgDelay = paths.map(p => avg("datapath_delay_avg", p));

  charts.push(bar("dataDelayChart", paths, [
    ds("Min", minDelay, "#38bdf8"),
    ds("Max", maxDelay, "#22c55e"),
    ds("Avg", avgDelay, "#facc15")
  ]));

  charts.push(donut("dataPathDonut", rawData.map(d => d.path_group)));

  charts.push(bar("fanoutChart", paths, [
    ds("Min", paths.map(p => avg("data_fanout_min", p)), "#38bdf8"),
    ds("Max", paths.map(p => avg("data_fanout_max", p)), "#22c55e"),
    ds("Avg", paths.map(p => avg("data_fanout_avg", p)), "#facc15")
  ]));

  charts.push(bar("dataSlewChart", paths, [
    ds("Min", paths.map(p => avg("data_slew_min", p)), "#38bdf8"),
    ds("Max", paths.map(p => avg("data_slew_max", p)), "#22c55e"),
    ds("Avg", paths.map(p => avg("data_slew_avg", p)), "#facc15")
  ]));

  charts.push(bar("arrivalReqChart", paths, [
    ds("Arrival", paths.map(p => avg("arrival_time", p)), "#38bdf8"),
    ds("Required", paths.map(p => avg("required_time", p)), "#f97316")
  ]));

  charts.push(bar("dataLoadChart", paths, [
    ds("Min", paths.map(p => avg("data_load_min", p)), "#38bdf8"),
    ds("Max", paths.map(p => avg("data_load_max", p)), "#22c55e"),
    ds("Avg", paths.map(p => avg("data_load_avg", p)), "#facc15")
  ]));
}

/* ================= CLOCK PATH ================= */

function renderClockPathCharts() {
  const groups = [...new Set(rawData.map(d => d.path_group))];

  charts.push(donut("clockDonut", groups));

  charts.push(bar("clockSlewChart", groups, [
    ds("Min", groups.map(g => avgGroup("clk_slew_min", g)), "#38bdf8"),
    ds("Max", groups.map(g => avgGroup("clk_slew_max", g)), "#22c55e"),
    ds("Avg", groups.map(g => avgGroup("clk_slew_avg", g)), "#facc15")
  ]));

  charts.push(line("skewChart", groups.map(g => avgGroup("skew", g))));
  charts.push(line("avgSlackChart", groups.map(g => avgGroup("slack", g))));
}

/* ================= HELPERS ================= */

function avg(col, path) {
  const v = rawData.filter(d => d.path_id === path).map(d => +d[col] || 0);
  return v.reduce((a,b)=>a+b,0) / (v.length || 1);
}

function avgGroup(col, g) {
  const v = rawData.filter(d => d.path_group === g).map(d => +d[col] || 0);
  return v.reduce((a,b)=>a+b,0) / (v.length || 1);
}

function ds(label, data, color) {
  return { label, data, backgroundColor: color };
}

function bar(id, labels, datasets) {
  return new Chart(document.getElementById(id), {
    type:"bar",
    data:{ labels, datasets },
    options:{ responsive:true, plugins:{legend:{labels:{color:"#fff"}}},
      scales:{ x:{ticks:{color:"#fff"}}, y:{ticks:{color:"#fff"}} } }
  });
}

function donut(id, values) {
  const map = {};
  values.forEach(v => map[v] = (map[v] || 0) + 1);
  return new Chart(document.getElementById(id), {
    type:"doughnut",
    data:{ labels:Object.keys(map), datasets:[{ data:Object.values(map) }] }
  });
}

function line(id, data) {
  return new Chart(document.getElementById(id), {
    type:"line",
    data:{ labels:data.map((_,i)=>i+1), datasets:[{ data, borderColor:"#38bdf8", fill:false }] }
  });
}

/* INIT */
loadData();
setInterval(loadData, 30000);
