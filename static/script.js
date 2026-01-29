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

/* ================= HELPERS ================= */
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
    enabled: true,
    backgroundColor: "#020617",
    titleColor: "#38bdf8",
    bodyColor: "#e5e7eb",
    borderColor: "#38bdf8",
    borderWidth: 1
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
      x: { title: { display: true, text: xLabel }, ticks:{color:"#e5e7eb"} },
      y: { title: { display: true, text: yLabel }, ticks:{color:"#e5e7eb"}, beginAtZero:true }
    }
  };
}

/* ================= RENDER ================= */
function render() {
  if (!rawData.length) return;
  destroyCharts();

  /* ================= DATA PATH ================= */
  const paths = [...new Set(rawData.map(d => d.path_id))];

  charts.push(new Chart(dataDelayChart, {
    type:"bar",
    data:{
      labels: paths,
      datasets:[
        {label:"Min", data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_delay_min))), backgroundColor:"#38bdf8"},
        {label:"Max", data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_delay_max))), backgroundColor:"#22c55e"},
        {label:"Avg", data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_delay_avg))), backgroundColor:"#facc15"}
      ]
    },
    options: baseOptions("Path","Delay (ns)")
  }));

  /* ================= CLOCK PATH (FIXED) ================= */
  const groups = [...new Set(rawData.map(d => d.path_group))];

  charts.push(new Chart(clockPathContribution, {
    type:"doughnut",
    data:{
      labels: groups,
      datasets:[{
        data: groups.map(g => rawData.filter(d=>d.path_group===g).length),
        backgroundColor:["#38bdf8","#22c55e","#facc15","#f97316"]
      }]
    },
    options:{ plugins:{ legend:{display:false}, tooltip:tooltipConfig() } }
  }));

  charts.push(new Chart(skewChart, {
    type:"line",
    data:{
      labels: groups,
      datasets:[{
        label:"Avg Skew",
        data: groups.map(g => avg(rawData.filter(d=>d.path_group===g).map(d=>d.skew))),
        borderColor:"#38bdf8",
        tension:0.35,
        pointRadius:3
      }]
    },
    options: baseOptions("Path Group","Skew (ns)")
  }));

  charts.push(new Chart(clockSlewChart, {
    type:"bar",
    data:{
      labels: groups,
      datasets:[
        {label:"Min", data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.clk_slew_min))), backgroundColor:"#38bdf8"},
        {label:"Max", data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.clk_slew_max))), backgroundColor:"#22c55e"},
        {label:"Avg", data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.clk_slew_avg))), backgroundColor:"#facc15"}
      ]
    },
    options: baseOptions("Path Group","Clock Slew (ns)")
  }));

  charts.push(new Chart(avgSlackChart, {
    type:"line",
    data:{
      labels: groups,
      datasets:[{
        label:"Avg Slack",
        data: groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.slack))),
        borderColor:"#22c55e",
        tension:0.35,
        pointRadius:3
      }]
    },
    options: baseOptions("Path Group","Slack (ns)")
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
