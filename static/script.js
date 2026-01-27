let charts = [];
let rawData = [];

/* ---------------- NAV ---------------- */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
}

/* ---------------- HELPERS ---------------- */
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

function tooltip() {
  return {
    enabled: true,
    backgroundColor: "#020617",
    titleColor: "#38bdf8",
    bodyColor: "#e5e7eb",
    borderColor: "#38bdf8",
    borderWidth: 1,
    padding: 10,
    callbacks: {
      label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}`
    }
  };
}

function baseOptions(xLabel, yLabel, showX=true) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#e5e7eb" } },
      tooltip: tooltip()
    },
    scales: {
      x: {
        title: { display: showX, text: xLabel, color:"#94a3b8" },
        ticks: { color: "#e5e7eb" }
      },
      y: {
        title: { display: true, text: yLabel, color:"#94a3b8" },
        ticks: { color: "#e5e7eb" },
        beginAtZero: true
      }
    }
  };
}

/* ---------------- RENDER ---------------- */
function render() {
  destroyCharts();

  /* ========= DATA PATH ========= */
  const paths = [...new Set(rawData.map(d => d.path_id))];

  // 1. Data Delay
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

  // 2. Path Contribution (FIXED)
  const groupCounts = {};
  rawData.forEach(d => {
    groupCounts[d.path_group] = (groupCounts[d.path_group] || 0) + 1;
  });

  charts.push(new Chart(dataPathContribution, {
    type:"doughnut",
    data:{
      labels:Object.keys(groupCounts),
      datasets:[{
        data:Object.values(groupCounts),
        backgroundColor:["#38bdf8","#22c55e","#facc15","#f97316"]
      }]
    },
    options:{
      plugins:{
        legend:{ display:false },
        tooltip: tooltip()
      }
    }
  }));

  // 3. Fanout
  charts.push(new Chart(fanoutChart,{
    type:"bar",
    data:{
      labels: paths,
      datasets:[
        { label:"Min", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_fanout_min))), backgroundColor:"#38bdf8" },
        { label:"Max", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_fanout_max))), backgroundColor:"#22c55e" },
        { label:"Avg", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_fanout_avg))), backgroundColor:"#facc15" }
      ]
    },
    options: baseOptions("Path","Fanout")
  }));

  // 4. Slew
  charts.push(new Chart(dataSlewChart,{
    type:"bar",
    data:{
      labels: paths,
      datasets:[
        { label:"Min", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_slew_min))), backgroundColor:"#38bdf8" },
        { label:"Max", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_slew_max))), backgroundColor:"#22c55e" },
        { label:"Avg", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_slew_avg))), backgroundColor:"#facc15" }
      ]
    },
    options: baseOptions("Path","Slew (ns)")
  }));

  // 5. Arrival vs Required
  charts.push(new Chart(arrivalReqChart,{
    type:"bar",
    data:{
      labels: paths,
      datasets:[
        { label:"Arrival", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.arrival_time))), backgroundColor:"#38bdf8" },
        { label:"Required", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.required_time))), backgroundColor:"#f97316" }
      ]
    },
    options: baseOptions("Path","Time (ns)")
  }));

  // 6. Load
  charts.push(new Chart(dataLoadChart,{
    type:"bar",
    data:{
      labels: paths,
      datasets:[
        { label:"Min", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_load_min))), backgroundColor:"#38bdf8" },
        { label:"Max", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_load_max))), backgroundColor:"#22c55e" },
        { label:"Avg", data: paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_load_avg))), backgroundColor:"#facc15" }
      ]
    },
    options: baseOptions("Path","Load")
  }));
}

/* ---------------- LOAD ---------------- */
async function loadData(){
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

loadData();
setInterval(loadData, 30000);
