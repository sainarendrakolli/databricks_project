let charts = [];
let rawData = [];

/* NAV */
function showDataPath() {
  document.getElementById("dataPathView").classList.remove("hidden");
  document.getElementById("clockPathView").classList.add("hidden");
  setMenu(0);
}

function showClockPath() {
  document.getElementById("dataPathView").classList.add("hidden");
  document.getElementById("clockPathView").classList.remove("hidden");
  setMenu(1);
}

function setMenu(i) {
  document.querySelectorAll(".menu").forEach((m, idx) =>
    m.classList.toggle("active", idx === i)
  );
}

/* HELPERS */
const uniq = arr => [...new Set(arr)];
const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

/* CHART CONFIG */
function baseOptions(xLabel, yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#e5e7eb" } } },
    scales: {
      x: { title: { display: true, text: xLabel }, ticks: { color: "#e5e7eb" } },
      y: { title: { display: true, text: yLabel }, ticks: { color: "#e5e7eb" }, beginAtZero: true }
    }
  };
}

/* RENDER */
function render() {
  charts.forEach(c => c.destroy());
  charts = [];

  const paths = uniq(rawData.map(d => d.path_id));
  const groups = uniq(rawData.map(d => d.path_group));

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

  charts.push(new Chart(dataPathContribution, {
    type: "doughnut",
    data: {
      labels: groups,
      datasets: [{ data: groups.map(g=>rawData.filter(d=>d.path_group===g).length) }]
    },
    options: { plugins:{ legend:{ display:false } } }
  }));

  charts.push(new Chart(fanoutChart,{
    type:"bar",
    data:{
      labels:paths,
      datasets:[
        {label:"Min",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_fanout_min))),backgroundColor:"#38bdf8"},
        {label:"Max",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_fanout_max))),backgroundColor:"#22c55e"},
        {label:"Avg",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_fanout_avg))),backgroundColor:"#facc15"}
      ]
    },
    options: baseOptions("Path","Fanout")
  }));

  charts.push(new Chart(dataSlewChart,{
    type:"bar",
    data:{
      labels:paths,
      datasets:[
        {label:"Min",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_slew_min))),backgroundColor:"#38bdf8"},
        {label:"Max",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_slew_max))),backgroundColor:"#22c55e"},
        {label:"Avg",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_slew_avg))),backgroundColor:"#facc15"}
      ]
    },
    options: baseOptions("Path","Slew (ns)")
  }));

  charts.push(new Chart(arrivalReqChart,{
    type:"bar",
    data:{
      labels:paths,
      datasets:[
        {label:"Arrival",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.arrival_time))),backgroundColor:"#38bdf8"},
        {label:"Required",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.required_time))),backgroundColor:"#f97316"}
      ]
    },
    options: baseOptions("Path","Time (ns)")
  }));

  charts.push(new Chart(dataLoadChart,{
    type:"bar",
    data:{
      labels:paths,
      datasets:[
        {label:"Min",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_load_min))),backgroundColor:"#38bdf8"},
        {label:"Max",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_load_max))),backgroundColor:"#22c55e"},
        {label:"Avg",data:paths.map(p=>avg(rawData.filter(d=>d.path_id===p).map(d=>d.data_load_avg))),backgroundColor:"#facc15"}
      ]
    },
    options: baseOptions("Path","Load")
  }));

  charts.push(new Chart(clockPathContribution,{
    type:"doughnut",
    data:{ labels:groups, datasets:[{data:groups.map(g=>rawData.filter(d=>d.path_group===g).length)}] },
    options:{ plugins:{ legend:{ display:false } } }
  }));

  charts.push(new Chart(skewChart,{
    type:"line",
    data:{ labels:groups, datasets:[{data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.skew))), borderColor:"#38bdf8"}]},
    options: baseOptions("Path Group","Skew (ns)")
  }));

  charts.push(new Chart(clockSlewChart,{
    type:"bar",
    data:{
      labels:groups,
      datasets:[
        {label:"Min",data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.clk_slew_min))),backgroundColor:"#38bdf8"},
        {label:"Max",data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.clk_slew_max))),backgroundColor:"#22c55e"},
        {label:"Avg",data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.clk_slew_avg))),backgroundColor:"#facc15"}
      ]
    },
    options: baseOptions("Path Group","Clock Slew (ns)")
  }));

  charts.push(new Chart(avgSlackChart,{
    type:"line",
    data:{ labels:groups, datasets:[{data:groups.map(g=>avg(rawData.filter(d=>d.path_group===g).map(d=>d.slack))), borderColor:"#22c55e"}]},
    options: baseOptions("Path Group","Slack (ns)")
  }));
}

/* LOAD */
async function loadData(){
  const r = await fetch("/timing-data");
  rawData = await r.json();
  render();
}

loadData();
setInterval(loadData, 30000);
