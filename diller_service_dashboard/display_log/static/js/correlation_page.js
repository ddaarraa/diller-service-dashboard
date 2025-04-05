
document.addEventListener("DOMContentLoaded", function () {
    const detailsPanel = document.getElementById('detailsPanel');
    const panelResizer = detailsPanel.querySelector('.panel-resizer');
    // var elems = document.querySelectorAll('.modal');
    // M.Modal.init(elems);

    let isResizing = false;
    let startX;
    let startWidth;

    // Handle resizing the details panel
    panelResizer.addEventListener('mousedown', function (e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = detailsPanel.offsetWidth;
        document.addEventListener('mousemove', resizePanel);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });

    // Function to resize the details panel
    function resizePanel(e) {
        if (!isResizing) return;

        const widthChange = startX - e.clientX;
        const newWidth = startWidth + widthChange;

        // Restrict width between 200px and 700px
        if (newWidth >= 700 && newWidth <= 1000) {
            detailsPanel.style.width = newWidth + 'px';
        }
        adjustPaginationPosition(); // Adjust pagination after resizing
        adjustTableLayout(); // Adjust table layout dynamically
    }

    // Stop resizing
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resizePanel);
        document.removeEventListener('mouseup', stopResize);
    }

    // Adjust pagination position dynamically based on sidebar and details panel width
    function adjustPaginationPosition() {
        const pagination = document.querySelector('.pagination-container');
        const sidebar = document.querySelector('.sidebar');
        const detailsPanel = document.getElementById('detailsPanel');

        let sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
        let detailsWidth = detailsPanel && detailsPanel.style.display !== 'none' ? detailsPanel.offsetWidth : 0;

        pagination.style.left = `${sidebarWidth}px`; // Position pagination based on sidebar width
        pagination.style.right = `${detailsWidth}px`; // Adjust right margin based on details panel width
    }

    // Adjust table layout based on details panel resizing
    function adjustTableLayout() {
        const table = document.querySelector('table');
        if (table) {
            const detailsPanelWidth = detailsPanel.offsetWidth;

            // Adjust padding-left of table cells based on the details panel width
            const paddingValue = Math.max(100, detailsPanelWidth - 150); // Dynamic padding based on details panel width
            const tableCells = table.querySelectorAll('td');
            tableCells.forEach(cell => {
                cell.style.paddingLeft = `${paddingValue}px`;
            });
        }
    }

    // Recalculate pagination position and table layout on window resize and page load
    window.addEventListener('resize', function () {
        adjustPaginationPosition();
        adjustTableLayout();
    });
    window.addEventListener('load', function () {
        adjustPaginationPosition();
        adjustTableLayout();
    });

    function showDetails(correlationData) {
        const panel = document.getElementById('detailsPanel');
        panel.style.display = 'flex';

        adjustPaginationPosition();
        adjustTableLayout();

        renderCorrelationHeatmap(correlationData); // New heatmap render call
    }

    let heatmapChart = null;

    function renderCorrelationHeatmap(correlationData) {
        const canvas = document.getElementById('correlationHeatmap');
        const ctx = canvas.getContext('2d');

        // Extract unique log ids for axes
        const xLabels = [];
        const yLabels = [];
        const matrixData = [];

        correlationData.forEach(item => {
            const xKey = Object.values(item).find((_, i) => Object.keys(item)[i].startsWith('x_type'));
            const yKey = Object.values(item).find((_, i) => Object.keys(item)[i].startsWith('y_type'));
    
            if (!xLabels.includes(xKey)) xLabels.push(xKey);
            if (!yLabels.includes(yKey)) yLabels.push(yKey);

            matrixData.push({
                x: xKey,
                y: yKey,
                v: item.value
            });
        });

        // Destroy existing chart if it exists
        if (heatmapChart) {
            heatmapChart.destroy();
        }

        Chart.register(ChartDataLabels);

        // Build chart
        heatmapChart = new Chart(ctx, {
            type: 'matrix',
            data: {
                datasets: [{
                    label: 'Correlation Heatmap',
                    data: matrixData,
                    backgroundColor(context) {
                        const value = context.dataset.data[context.dataIndex].v;
                        const alpha = Math.abs(value);
                        if (value > 0) return `rgba(0, 128, 0, ${alpha})`;     // green
                        if (value < 0) return `rgba(255, 0, 0, ${alpha})`;     // red
                        return 'rgba(255, 255, 255, 1)';                        // white
                    },
                    width: ({ chart }) => (chart.chartArea || {}).width / xLabels.length - 1,
                    height: ({ chart }) => (chart.chartArea || {}).height / yLabels.length - 1,
                    datalabels: {
                        color: '#000',
                        font: {
                            weight: 'bold'
                        },
                        formatter: function (value, ctx) {
                            return value.v.toFixed(2);
                        },
                        anchor: 'center',
                        align: 'center'
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (ctx) => `X: ${ctx[0].raw.x}, Y: ${ctx[0].raw.y}`,
                            label: (ctx) => `Correlation: ${ctx.raw.v}`
                        }
                    },
                    datalabels: {
                        display: true
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        labels: xLabels,
                        offset: true,
                        ticks: {
                            callback: function(val, index) {
                                return this.getLabelForValue(val).slice(0, 5);
                            },
                            autoSkip: false
                        }
                    },
                    y: {
                        type: 'category',
                        labels: yLabels,
                        offset: true,
                        ticks: {
                            callback: function(val, index) {
                                return this.getLabelForValue(val).slice(0, 5);
                            },
                            autoSkip: false
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        canvas.addEventListener('click', async function(event) {
            const points = heatmapChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    
            if (points.length) {
                const point = points[0];
                let panelDetail = correlationData[point.index];

                let x_collecion_name = "vpc_logs_collection";
                let y_collecion_name = "vpc_logs_collection";

                if (panelDetail.x_type.includes("Sys")) {
                    x_collecion_name = "sys_logs_collection";
                } else if (panelDetail.x_type.includes("App")) {
                    x_collecion_name = "application_logs_collection";
                }

                if (panelDetail.y_type.includes("Sys")) {
                    y_collecion_name = "sys_logs_collection";
                } else if (panelDetail.y_type.includes("App")) {
                    y_collecion_name = "application_logs_collection";
                }

                try {
                    const x_detail = await fetchLogById(panelDetail.log_id_x, x_collecion_name);
                    const y_detail = await fetchLogById(panelDetail.log_id_y, y_collecion_name);

                    console.log(x_detail, y_detail);

                    // Open Modal and Show Data
                    const modalContent = document.getElementById("logDetailsContent");
                    modalContent.innerHTML = `
                        <p><strong>X Detail:</strong> ${JSON.stringify(x_detail)}</p>
                        <p><strong>Y Detail:</strong> ${JSON.stringify(y_detail)}</p>
                    `;
                    const logDetailsModal = new bootstrap.Modal(document.getElementById('logDetailsModal'));
                    logDetailsModal.show();

                } catch (error) {
                    console.error('Error fetching log details:', error);
                }
            }
        });
        function formatLogDetails(logDetails) {
            if (!logDetails) return "No data available";
        
            // Format the details as needed (example for JSON format)
            return `<pre>${JSON.stringify(logDetails, null, 2)}</pre>`;
        }
    }
    
    function closeDetails() {
        document.querySelectorAll("table tbody tr").forEach(r => {
            r.classList.remove("selected-row");
            r.querySelectorAll("td").forEach(td => {
                td.style.backgroundColor = ""; // Clear background
            });
        });
        document.getElementById('detailsPanel').style.display = 'none';
        adjustPaginationPosition(); // Adjust pagination after closing the details panel
        adjustTableLayout(); // Adjust table layout when the details panel is closed
    }

    // Expose closeDetails and showDetails for external use
    window.showDetails = showDetails;
    window.closeDetails = closeDetails;
    window.adjustPaginationPosition = adjustPaginationPosition
});



window.onload = function () {
    adjustPaginationPosition();
    fetchData();
};
let correlationData = null

async function fetchData() {
    const page = getQueryParameter("page") || 1; // Default to page 1 if not present
    const pageSize = getQueryParameter("page_size") || 10;
    const url = `/fetch-correlation/?page=${page}&page_size=${pageSize}`;
    closeDetails()
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
            correlationData = data.data
            updateTable(correlationData)
        } else {
            console.error("Unexpected response format:", data);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Function to get query parameters from URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function updateTable(datas) {
    let tableBody = document.querySelector("table tbody");
    tableBody.innerHTML = "";

    datas.forEach(data => {
        let row = document.createElement("tr");
        let cellId = document.createElement("td");
        cellId.textContent = data.id;
        row.appendChild(cellId);

        let cellTime = document.createElement("td");
        let rawDate = data.time;
        cellTime.textContent = rawDate ? new Date(rawDate).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }) : "No Time Data";
        row.appendChild(cellTime);
        row.addEventListener("click", function () {
            document.querySelectorAll("table tbody tr").forEach(r => {
                r.classList.remove("selected-row");
                r.querySelectorAll("td").forEach(td => {
                    td.style.backgroundColor = "";
                });
            });
            cellId.style.backgroundColor = "#c3e6cb";
            cellTime.style.backgroundColor = "#c3e6cb";

            row.classList.add("selected-row");
            adjustPaginationPosition();
            showDetails(data.correlation);
            
        });

        tableBody.appendChild(row);
    });
}

logsDetail = []

async function fetchLogById(id, collection_name) {
    const url = `/fetch-log-by-id/?_id=${id}&collection_name=${collection_name}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.log) {
            return data.log
        } else {
            console.error("Unexpected response format:", data);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}


