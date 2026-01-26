let charts = {};
let rawData = [];

/* ---------- LOAD DATA ---------- */
async function loadData() {
  const res = await fetch("/timing-data");
  rawData = await res.json();

  updateKPIs();
  renderDataPathCharts();
  renderClockPathCharts();
}

/* ---------- KPI ---------- */
function updateKPIs() {
  document.getElementById("totalPaths").innerText = rawData.length;

  const violations = rawData.filter(d => Number(d.slack) < 0).length;
  document.getElementById("violations").innerText = violations;

  const avgSlack =
    rawData.reduce((s, d) => s + Number(d.slack || 0), 0) / rawData.length || 0;

  document.getElementById("avgSlack").innerText = avgSlack.toFixed(3);
}

/* ---------- DATA PATH ---------- */
function renderDataPathCharts() {
  destroyCharts();

  charts.dataDelay = new Chart(dataDelayChart, {
    type: "bar",
    data: {
      labels: rawData.map(d => d.path_id),
      datasets: [{
        label: "Slack",
        data: rawData.map(d => d.slack),
        backgroundColor: "#38bdf8"
      }]
    }
  });

  const groupCount = {};
  rawData.forEach(d => {
    groupCount[d.path_group] = (groupCount[d.path_group] || 0) + 1;
  });

  charts.pathContribution = new Chart(pathContributionChart, {
    type: "doughnut",
    data: {
      labels: Object.keys(groupCount),
      datasets: [{
        data: Object.values(groupCount),
        backgroundColor: ["#38bdf8", "#22c55e", "#f97316"]
      }]
    }
  });

  charts.dataFanout = new Chart(dataFanoutChart, {
    type: "bar",
    data: {
      labels: rawData.map(d => d.path_id),
      datasets: [{
        label: "Fanout",
        data: rawData.map(d => d.data_fanout_avg || 0),
        backgroundColor: "#22c55e"
      }]
    }
  });

  charts.arrivalReq = new Chart(arrivalVsRequiredChart, {
    type: "bar",
    data: {
      labels: rawData.map(d => d.path_id),
      datasets: [
        {
          label: "Arrival",
          data: rawData.map(d => d.arrival_time),
          backgroundColor: "#38bdf8"
        },
        {
          label: "Required",
          data: rawData.map(d => d.required_time),
          backgroundColor: "#f97316"
        }
      ]
    }
  });
}

/* ---------- CLOCK PATH ---------- */
function renderClockPathCharts() {
  charts.clockSkew = new Chart(clockSkewChart, {
    type: "line",
    data: {
      labels: rawData.map(d => d.path_id),
      datasets: [{
        label: "Skew",
        data: rawData.map(d => d.skew),
        borderColor: "#38bdf8",
        fill: false,
        tension: 0.4
      }]
    }
  });

  const avgByPath = rawData
    .map(d => ({ id: d.path_id, slack: d.slack }))
    .sort((a, b) => a.slack - b.slack);

  charts.avgSlack = new Chart(avgSlackChart, {
    type: "line",
    data: {
      labels: avgByPath.map(d => d.id),
      datasets: [{
        label: "Avg Slack",
        data: avgByPath.map(d => d.slack),
        borderColor: "#22c55e",
        fill: false,
        tension: 0.4
      }]
    }
  });
}

/* ---------- NAV ---------- */
function showDataPath() {
  document.getElementById("dataPath").classList.remove("hidden");
  document.getElementById("clockPath").classList.add("hidden");
  setActive(0);
}

function showClockPath() {
  document.getElementById("dataPath").classList.add("hidden");
  document.getElementById("clockPath").classList.remove("hidden");
  setActive(1);
}

function setActive(index) {
  document.querySelectorAll(".menu-item").forEach((m, i) =>
    m.classList.toggle("active", i === index)
  );
}

/* ---------- UTIL ---------- */
function destroyCharts() {
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};
}

/* ---------- INIT ---------- */
loadData();
setInterval(loadData, 30000);
