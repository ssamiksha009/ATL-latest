document.addEventListener('DOMContentLoaded', function () {
    console.log('Loading project history...');
    loadProjectHistory();

    // Add search functionality with debugging
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        console.log('Search input found, adding listener');
        searchInput.addEventListener('input', function (e) {
            console.log('Search input changed:', e.target.value);
            applyFilters();
        });
    } else {
        console.error('Search input element not found');
    }

    // Add filter button functionality - with null check
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }

    // Add new request button functionality - with null check
    const newRequestBtn = document.getElementById('newRequestBtn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', function () {
            window.location.href = '/index.html';
        });
    }
});

function loadProjectHistory() {
    const tableBody = document.getElementById('historyTableBody');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const noDataMessage = document.getElementById('noDataMessage');

    // Ensure elements exist
    if (!tableBody || !loadingSpinner || !errorMessage || !noDataMessage) {
        console.error('Required elements not found');
        return;
    }

    // Get auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
        errorMessage.textContent = 'Authentication required. Please login.';
        errorMessage.style.display = 'block';
        loadingSpinner.style.display = 'none';
        return;
    }

    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';
    noDataMessage.style.display = 'none';

    fetch('/api/project-history', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(async response => {
            const text = await response.text();
            console.log('Response status:', response.status);
            console.log('Response body:', text);

            try {
                const data = JSON.parse(text);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${data.message}`);
                }
                return data;
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text}`);
            }
        })
        .then(data => {
            loadingSpinner.style.display = 'none';

            if (!Array.isArray(data) || data.length === 0) {
                noDataMessage.style.display = 'block';
                return;
            }

            tableBody.innerHTML = '';
            data.forEach(project => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${escapeHtml(project.project_name)}</td>
                <td>${escapeHtml(project.region)}</td>
                <td>${escapeHtml(project.department)}</td>
                <td>${escapeHtml(project.tyre_size)}</td>
                <td>${escapeHtml(project.protocol)}</td>
                <td>${new Date(project.created_at).toLocaleDateString()}</td>
                <td class="status-${project.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(project.status)}</td>
                <td>${project.completed_at ? new Date(project.completed_at).toLocaleDateString() : '-'}</td>
            `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error loading project history:', error);
            loadingSpinner.style.display = 'none';
            errorMessage.textContent = `Failed to load project history: ${error.message}`;
            errorMessage.style.display = 'block';
        });
}

// Utility function to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function applyFilters() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('historyTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    console.log('Applying search filter with text:', searchText);

    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length === 0) return; // Skip header row

        const rowText = Array.from(cells)
            .map(cell => cell.textContent.toLowerCase())
            .join(' ');

        const show = searchText === '' || rowText.includes(searchText);
        row.style.display = show ? '' : 'none';

        console.log('Row text:', rowText, 'Visible:', show);
    });

    updateNoResultsMessage();
}

function applySearchFilter() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('historyTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length === 0) return; // Skip header row

        // Get text content of all cells for searching
        const rowText = Array.from(cells)
            .map(cell => cell.textContent.toLowerCase())
            .join(' ');

        // Show/hide based on search
        const show = searchText === '' || rowText.includes(searchText);
        row.style.display = show ? '' : 'none';
    });

    updateNoResultsMessage();
}

function applyDateFilters() {
    const dateCreated = document.getElementById('dateCreated').value;
    const dateCompleted = document.getElementById('dateCompleted').value;
    const tableBody = document.getElementById('historyTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells.length === 0) return; // Skip header row

        let show = true;

        // Apply date created filter
        if (dateCreated) {
            const createdDateText = cells[5].textContent; // Date Created column
            const createdDate = new Date(createdDateText);
            const filterDate = new Date(dateCreated);

            // Compare only the date parts
            const createdDay = createdDate.toDateString();
            const filterDay = filterDate.toDateString();

            show = createdDay === filterDay;
        }

        // Apply date completed filter independently
        if (dateCompleted) {
            const completedDateText = cells[7].textContent; // Date Completed column
            if (completedDateText !== '-') {
                const completedDate = new Date(completedDateText);
                const filterDate = new Date(dateCompleted);

                // Compare only the date parts
                const completedDay = completedDate.toDateString();
                const filterDay = filterDate.toDateString();

                // Only apply completed filter if created filter passed or isn't set
                show = show && (completedDay === filterDay);
            } else {
                // Hide row if filtering by completion date and row has no completion date
                show = false;
            }
        }

        row.style.display = show ? '' : 'none';
    });

    updateNoResultsMessage();
}

function updateNoResultsMessage() {
    const tableBody = document.getElementById('historyTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    const visibleRows = Array.from(tableBody.getElementsByTagName('tr'))
        .filter(row => row.style.display !== 'none').length;

    if (visibleRows === 0) {
        noDataMessage.textContent = 'No matching projects found';
        noDataMessage.style.display = 'block';
    } else {
        noDataMessage.style.display = 'none';
    }
}