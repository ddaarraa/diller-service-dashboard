
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
                            weight: 'bold',
                            size: 10
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
                            callback: function (val, index) {
                                return this.getLabelForValue(val).slice(0, 6);
                            },
                            autoSkip: false
                        }
                    },
                    y: {
                        type: 'category',
                        labels: yLabels,
                        offset: true,
                        ticks: {
                            callback: function (val, index) {
                                return this.getLabelForValue(val).slice(0, 6);
                            },
                            autoSkip: false
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        canvas.addEventListener('click', async function (event) {
            const points = heatmapChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

            if (points.length) {
                const point = points[0];
                let panelDetail = correlationData[point.index];

                let x_collecion_name = "application_logs_collection";
                let y_collecion_name = "application_logs_collection";

                if (panelDetail.x_type.includes("Sys")) {
                    x_collecion_name = "sys_logs_collection";
                }

                if (panelDetail.y_type.includes("Sys")) {
                    y_collecion_name = "sys_logs_collection";
                }

                try {
                    const x_detail = await fetchLogById(panelDetail.log_id_x, x_collecion_name);
                    const y_detail = await fetchLogById(panelDetail.log_id_y, y_collecion_name);

                    // Open Modal and Show Data
                    const modalContent = document.getElementById("logDetailsContent");
                    let xRawDate = x_detail.time?.["$date"];
                    let xFormattedDate = xRawDate ? new Date(xRawDate).toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }) : "No Time Data";

                    let yRawDate = y_detail.time?.["$date"];
                    let yFormattedDate = yRawDate ? new Date(yRawDate).toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }) : "No Time Data";

                    // Function to convert log details into bullet points
                    function convertLogToBullets(log) {
                        let details = "<ul style='text-align: left; list-style-position: inside; padding-left: 20px;'>";
                        for (let key in log) {
                            if (log.hasOwnProperty(key) && key !== "_id" && key !== "time") {
                                details += `<li><strong>${key}:</strong> ${log[key]}</li>`;
                            }
                        }
                        details += "</ul>";
                        return details;
                    }


                    modalContent.innerHTML = `
                    <tr class="log-row" data-toggle="collapse" data-target="#logDetails-x" aria-expanded="false">
                        <td></td>
                        <td>${xFormattedDate}</td>
                        <td>${x_detail._id}</td>
                        <td>${x_detail.srcaddr}</td>
                        <td>${x_detail.action}</td>
                    </tr>
                    <tr id="logDetails-x" class="collapse">
                        <td colspan="5" style="width: 100%; padding: 0;">  <!-- Ensure the colspan matches the number of columns in your table -->
                            <div style="width: 100%; padding: 10px; box-sizing: border-box;">
                                <ul style="text-align: left; list-style-position: inside; padding-left: 20px; width: 100%; margin: 0;">
                                    ${convertLogToBullets(x_detail)}
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <tr class="log-row" data-toggle="collapse" data-target="#logDetails-y" aria-expanded="false">
                        <td></td>
                        <td>${yFormattedDate}</td>
                        <td>${y_detail._id}</td>
                        <td>${y_detail.srcaddr}</td>
                        <td>${y_detail.action}</td>
                    </tr>
                    <tr id="logDetails-y" class="collapse">
                        <td colspan="5" style="width: 100%; padding: 0;">
                            <div style="width: 100%; padding: 10px; box-sizing: border-box;">
                                <ul style="text-align: left; list-style-position: inside; padding-left: 20px; width: 100%; margin: 0;">
                                    ${convertLogToBullets(y_detail)}
                                </ul>
                            </div>
                        </td>
                    </tr>
                `;


                    // Add event listeners for each row to toggle the corresponding details
                    const logRows = modalContent.querySelectorAll('.log-row');
                    logRows.forEach(row => {
                        row.addEventListener('click', function () {
                            const target = row.getAttribute('data-target');
                            const targetRow = document.querySelector(target);
                            if (targetRow) {
                                targetRow.classList.toggle('collapse');
                            }
                        });
                    });

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
    fetchData(1);
};
let correlationData = null
let currentPage = 1;
let pageSize = 15;
let totalPages = 1;

async function fetchData(page) {
    const loadingSpinner = document.getElementById("loading");
    loadingSpinner.style.display = "block"; // Show spinner

    const url = `/fetch-correlation/?page=${page}&page_size=${pageSize}`;
    closeDetails();

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
            correlationData = data.data;
            updateTable(correlationData);
            updatePagination(data.page, data.total_data);
        } else {
            console.error("Unexpected response format:", data);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        loadingSpinner.style.display = "none"; // Hide spinner
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

function updatePagination(page, totalItems) {
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = "";

    totalPages = Math.ceil(totalItems / pageSize);

    const prevButton = document.createElement("li");
    prevButton.classList.add("page-item");
    if (page === 1) prevButton.classList.add("disabled");
    const prevLink = document.createElement("span");
    prevLink.classList.add("page-link");
    prevLink.textContent = "Previous";
    prevLink.addEventListener("click", () => {
        if (page > 1) {
            currentPage = page - 1;
            fetchData(currentPage);
        }
    });
    prevButton.appendChild(prevLink);
    pagination.appendChild(prevButton);

    addPageButton(1, page);

    if (page > 3) {
        addEllipsis();
    }

    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(totalPages - 1, page + 1);

    for (let i = startPage; i <= endPage; i++) {
        addPageButton(i, page);
    }

    if (page < totalPages - 2) {
        addEllipsis();
    }

    if (totalPages > 1) {
        addPageButton(totalPages, page);
    }

    const nextButton = document.createElement("li");
    nextButton.classList.add("page-item");
    if (page === totalPages) nextButton.classList.add("disabled");
    const nextLink = document.createElement("span");
    nextLink.classList.add("page-link");
    nextLink.textContent = "Next";
    nextLink.addEventListener("click", () => {
        if (page < totalPages) {
            currentPage = page + 1;
            fetchData(currentPage);
        }
    });
    nextButton.appendChild(nextLink);
    pagination.appendChild(nextButton);
}

function addPageButton(pageNumber, currentPage) {
    const pagination = document.querySelector(".pagination");
    const li = document.createElement("li");
    li.classList.add("page-item");
    if (pageNumber === currentPage) {
        li.classList.add("active");
    }

    const a = document.createElement("span");
    a.classList.add("page-link");
    a.textContent = pageNumber;
    a.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = pageNumber;
        fetchData(currentPage);
    });

    li.appendChild(a);
    pagination.appendChild(li);
}

function addEllipsis() {
    const pagination = document.querySelector(".pagination");
    const li = document.createElement("li");
    li.classList.add("page-item", "disabled");

    const span = document.createElement("span");
    span.classList.add("page-link");
    span.textContent = "...";

    li.appendChild(span);
    pagination.appendChild(li);
}


