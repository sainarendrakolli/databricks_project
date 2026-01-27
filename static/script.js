let charts = [];
let rawData = [];

/* ---------- NAV ---------- */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
  setActive(0);
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
  setActive(1);
}

function setActive(i) {
  document.querySelectorAll(".menu").forEach((m, idx) =>
    m.classList.toggle("active", idx === i)
  );
}

/* ---------- HELPERS ---------- */
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

function baseOptions(xLabel, yLabel, showX=true) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#e5e7eb" } }
    },
    scales: {
      x: {
        title: { display: showX, text: xLabel },
        ticks: { display: showX, color: "#e5e7eb" }
      },
      y: {
        title: { display: true, text: yLabel },
        ticks: { color: "#e5e7eb" },
        beginAtZero: true
      }
    }
  };
}

/* ---------- RENDER ---------- */
function render() {
  charts.forEach(c => c.destroy());
  charts = [];

  /* ===== DATA PATH ===== */
  const paths = [...new Set(rawData.map(d => d.path_id))];

  charts.push(new Chart(dataDelayChart, {
    type: "bar",
    data: {
      labels: paths,
      datasets: [
        { label:"Min", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_delay_min))), backgroundColor:"#38bdf8" },
        { label:"Max", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_delay_max))), backgroundColor:"#22c55e" },
        { label:"Avg", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_delay_avg))), backgroundColor:"#facc15" }
      ]
    },
    options: baseOptions("Path","Delay (ns)")
  }));

  const groupCounts = {};
  rawData.forEach(d => groupCounts[d.path_group] = (groupCounts[d.path_group] || 0) + 1);

  charts.push(new Chart(dataPathContribution, {
    type:"doughnut",
    data:{
      labels:Object.keys(groupCounts),
      datasets:[{
        data:Object.values(groupCounts),
        backgroundColor:["#38bdf8","#22c55e","#facc15","#f97316"]
      }]
    },
    options:{ plugins:{ legend:{ display:false } } }
  }));

  /* ===== CLOCK PATH ===== */
  const clockData = rawData.filter(d => d.clk_slew_max != null);
  const idx = clockData.map((_,i)=>i+1);

  charts.push(new Chart(clockPathContribution,{
    type:"doughnut",
    data:{
      labels:["Clock Paths"],
      datasets:[{ data:[clockData.length], backgroundColor:["#38bdf8"] }]
    },
    options:{ plugins:{ legend:{ display:false } } }
  }));

  charts.push(new Chart(skewChart,{
    type:"line",
    data:{
      labels: idx,
      datasets:[{
        data: clockData.map(d=>d.skew),
        borderColor:"#38bdf8",
        pointRadius:1,
        tension:0.25
      }]
    },
    options: baseOptions("", "Skew (ns)", false)
  }));

  charts.push(new Chart(clockSlewChart,{
    type:"bar",
    data:{
      labels: idx,
      datasets:[
        { label:"Min", data: clockData.map(d=>d.clk_slew_min), backgroundColor:"#38bdf8" },
        { label:"Max", data: clockData.map(d=>d.clk_slew_max), backgroundColor:"#22c55e" },
        { label:"Avg", data: clockData.map(d=>d.clk_slew_avg), backgroundColor:"#facc15" }
      ]
    },
    options: baseOptions("", "Clock Slew (ns)", false)
  }));

  charts.push(new Chart(avgSlackChart,{
    type:"line",
    data:{
      labels: idx,
      datasets:[{
        data: clockData.map(d=>d.slack),
        borderColor:"#22c55e",
        pointRadius:1,
        tension:0.25
      }]
    },
    options: baseOptions("", "Slack (ns)", false)
  }));
}

/* ---------- LOAD ---------- */
async function loadData() {
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

loadData();
setInterval(loadData, 30000);
