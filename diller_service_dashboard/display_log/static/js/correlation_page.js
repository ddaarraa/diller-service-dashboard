document.addEventListener("DOMContentLoaded", function () {
    const detailsPanel = document.getElementById('detailsPanel');
    const panelResizer = detailsPanel.querySelector('.panel-resizer');

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
        if (newWidth >= 200 && newWidth <= 700) {
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

    // Function to show the details panel and adjust pagination position
    function showDetails(correlationId, logIdX, logIdY, value) {
        const panel = document.getElementById('detailsPanel');
        panel.style.display = 'flex'; // Make the details panel visible
        document.getElementById('detailsCorrelationId').innerText = correlationId;
        document.getElementById('detailsLogIdX').innerText = logIdX;
        document.getElementById('detailsLogIdY').innerText = logIdY;
        document.getElementById('detailsValue').innerText = value;

        adjustPaginationPosition(); // Adjust pagination after opening the details panel
        adjustTableLayout(); // Adjust table layout when the details panel is opened
    }

    // Close the details panel and adjust pagination position
    function closeDetails() {
        document.getElementById('detailsPanel').style.display = 'none';
        adjustPaginationPosition(); // Adjust pagination after closing the details panel
        adjustTableLayout(); // Adjust table layout when the details panel is closed
    }

    // Expose closeDetails and showDetails for external use
    window.showDetails = showDetails;
    window.closeDetails = closeDetails;
});
