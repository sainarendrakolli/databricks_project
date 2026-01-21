let chart;

async function loadData() {
    const response = await fetch("/timing-data");
    const data = await response.json();

    // -------- TABLE --------
    const tableBody = document.getElementById("data-body");
    tableBody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.begin_clock}</td>
            <td>${row.end_clock}</td>
            <td>${row.slack}</td>
            <td>${row.timing_status}</td>
            <td>${row.ingestion_ts}</td>
        `;
        tableBody.appendChild(tr);
    });

    // -------- CHART --------
    const labels = data.map(r => r.id);
    const slacks = data.map(r => r.slack);

    if (chart) chart.destroy();

    const ctx = document.getElementById("slackChart");
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Slack",
                data: slacks,
                borderColor: "blue",
                fill: false
            }]
        }
    });
}

function showTable() {
    document.getElementById("tableView").classList.remove("hidden");
    document.getElementById("chartView").classList.add("hidden");
}

function showChart() {
    document.getElementById("chartView").classList.remove("hidden");
    document.getElementById("tableView").classList.add("hidden");
}

loadData();
setInterval(loadData, 30000);
