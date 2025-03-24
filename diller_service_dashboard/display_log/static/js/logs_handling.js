let currentPage = 1;
let pageSize = 20;
let totalPages = 1;
let searchQuery = "";
let startDate = "";
let endDate = "";

function searchLogs() {
    searchQuery = document.getElementById("searchQuery").value;
    startDate = document.getElementById("startDate").value;
    endDate = document.getElementById("endDate").value;
    currentPage = 1;
    loadLogs(currentPage);
}

function loadLogs(page) {
    const logType = document.getElementById("logType").value;
    const loadingIndicator = document.getElementById("loading");
    const searchQuery = document.getElementById("searchQuery").value;
    const startDateInput = document.getElementById("startDate").value;
    const endDateInput = document.getElementById("endDate").value;

    loadingIndicator.style.display = "block";

    let url = `/fetch-logs/?page=${page}&page_size=${pageSize}&collection_name=${logType}`;

    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    if (startDateInput) {
        const formattedStartDate = formatDateToISOWithOffset(new Date(startDateInput));
        url += `&start_date=${encodeURIComponent(formattedStartDate)}`;
    }
    if (endDateInput) {
        const formattedEndDate = formatDateToISOWithOffset(new Date(endDateInput));
        url += `&end_date=${encodeURIComponent(formattedEndDate)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.logs && Array.isArray(data.logs)) {
                updateTable(data.logs); // Update the table with fetched logs
                updatePagination(page, data.total_logs); // Update pagination info
            } else {
                console.error("Unexpected response format:", data);
            }
        })
        .catch(error => console.error("Error fetching logs:", error))
        .finally(() => {
            loadingIndicator.style.display = "none"; // Hide loading indicator after fetch
        });
}

function updateTable(logs) {
    let tableBody = document.querySelector("table tbody");
    tableBody.innerHTML = "";
    logs.forEach(log => {
        let row = document.createElement("tr");

        let cellTime = document.createElement("td");
        let rawDate = log.time?.["$date"];
        cellTime.textContent = rawDate ? new Date(rawDate).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }) : "No Time Data";
        row.appendChild(cellTime);

        let cellId = document.createElement("td");
        cellId.textContent = log["_id"];
        row.appendChild(cellId);

        row.addEventListener("click", function () {
            toggleDetails(log, row);
        });

        tableBody.appendChild(row);
    });
}

function toggleDetails(log, row) {
    let existingDetails = row.nextElementSibling;
    if (existingDetails && existingDetails.classList.contains("log-details")) {
        existingDetails.remove();
        return;
    }
    let detailsRow = document.createElement("tr");
    detailsRow.classList.add("log-details");
    let detailsCell = document.createElement("td");
    detailsCell.colSpan = 2;
    let detailsDiv = document.createElement("div");
    detailsDiv.classList.add("log-detail-content");
    let logDetails = "<ul>";
    for (let key in log) {
        if (key !== "_id" && key !== "time") {
            logDetails += `<li><strong>${key}:</strong> ${log[key]}</li>`;
        }
    }
    logDetails += "</ul>";
    detailsDiv.innerHTML = logDetails;
    detailsCell.appendChild(detailsDiv);
    detailsRow.appendChild(detailsCell);
    row.parentNode.insertBefore(detailsRow, row.nextElementSibling);
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
            loadLogs(currentPage);
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
            loadLogs(currentPage);
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
        loadLogs(currentPage);
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

function formatDateToISOWithOffset(dateString) {
    const date = new Date(dateString);
    const offset = "+07:00";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = "00";

    // Correctly format the date-time string without the space
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

function clearFilters() {
    console.log("Clear Filters button clicked!");

    document.getElementById("searchQuery").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";

}

function toggleAdvancedSearch() {
    var advancedSearchSection = document.getElementById("advancedSearchSection");

    // Toggle the visibility of the advanced search section
    if (advancedSearchSection.style.display === "none") {
        advancedSearchSection.style.display = "block"; // Show the advanced search
    } else {
        advancedSearchSection.style.display = "none"; // Hide the advanced search
    }
}
