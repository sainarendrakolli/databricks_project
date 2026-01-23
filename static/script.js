let slackChart;
let statusChart;

async function loadData() {
  const res = await fetch("/timing-data");
  const data = await res.json();

  // -------- TABLE --------
  const body = document.getElementById("data-body");
  body.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.begin_clock}</td>
      <td>${row.end_clock}</td>
      <td>${row.slack}</td>
      <td>
        <span class="status ${row.timing_status}">
          ${row.timing_status}
        </span>
      </td>
      <td>${row.ingestion_ts}</td>
    `;
    body.appendChild(tr);
  });

  // -------- SLACK TREND --------
  const labels = data.map(d => d.id);
  const slackValues = data.map(d => d.slack);

  if (slackChart) slackChart.destroy();

  slackChart = new Chart(document.getElementById("slackChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Slack",
        data: slackValues,
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  // -------- STATUS DISTRIBUTION --------
  const statusCount = {};
  data.forEach(d => {
    statusCount[d.timing_status] = (statusCount[d.timing_status] || 0) + 1;
  });

  if (statusChart) statusChart.destroy();

  statusChart = new Chart(document.getElementById("statusChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });
}

// Auto refresh
loadData();
setInterval(loadData, 30000);
