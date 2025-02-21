const fileHandler = new FileHandler();
const visualizer = new Visualizer();
let isProcessing = false;

// Setup drag and drop
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
        await processFile(file);
    }
});

// File input handler
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
            await processFile(file);
        } else {
            alert('Please select a CSV file');
        }
        // Reset file input
        this.value = '';
    });

    // Add data limit handler
    const dataLimitSelect = document.getElementById('dataLimit');
    const customLimitInput = document.getElementById('customLimit');

    dataLimitSelect.addEventListener('change', function() {
        customLimitInput.style.display = this.value === 'custom' ? 'inline-block' : 'none';
    });

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.querySelector('.light-icon').style.display = 'none';
        themeToggle.querySelector('.dark-icon').style.display = 'block';
    }
});

async function processFile(file) {
    if (isProcessing) return;
    
    isProcessing = true;
    const uploadBtn = document.querySelector('.upload-btn');
    uploadBtn.classList.add('disabled');
    uploadBtn.textContent = 'Processing...';

    try {
        // Clear all previous data
        resetUI();
        
        if (!file) {
            throw new Error('Please select a file');
        }

        const { headers, data } = await fileHandler.handleFile(file);
        
        if (!headers || !data || data.length === 0) {
            throw new Error('Failed to process CSV file');
        }

        // Store the data globally
        fileHandler.csvData = data;
        fileHandler.headers = headers;

        console.log('Processing file:', {
            name: file.name,
            size: file.size,
            headers: headers,
            rowCount: data.length
        });

        // Update all sections
        updateDataOverview(data, headers);
        updateColumnSelect(headers);
        displayDataPreview(data);
        updateStatisticalSummary(data, headers);
        updateDataConclusion(data, headers);

    } catch (error) {
        console.error('Error in processFile:', error);
        alert(`Error processing file: ${error.message}`);
    } finally {
        isProcessing = false;
        uploadBtn.classList.remove('disabled');
        uploadBtn.textContent = 'Choose File';
    }
}

function resetUI() {
    // Clear data preview
    document.getElementById('dataPreview').innerHTML = '';
    
    // Reset column select
    const columnSelect = document.getElementById('columnSelect');
    columnSelect.innerHTML = '<option value="">Select Column</option>';
    
    // Clear statistical summary
    document.getElementById('statisticalSummary').getElementsByTagName('tbody')[0].innerHTML = '';
    
    // Reset data overview
    const overviewRow = document.getElementById('overviewData');
    if (overviewRow) {
        Array.from(overviewRow.cells).forEach(cell => cell.textContent = '-');
    }
    
    // Clear any existing charts
    const chartArea = document.getElementById('chartArea');
    if (chartArea) {
        const ctx = chartArea.getContext('2d');
        ctx.clearRect(0, 0, chartArea.width, chartArea.height);
    }
    
    // Reset to analysis tab
    showTab('analysis');
    
    // Reset conclusion sections
    document.getElementById('dataSummary').innerHTML = '';
    document.getElementById('keyInsights').innerHTML = '';
}

function updateColumnSelect(headers) {
    const columnSelect = document.getElementById('columnSelect');
    columnSelect.innerHTML = '<option value="">Select Column</option>';
    headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        columnSelect.appendChild(option);
    });
}

function displayDataPreview(data) {
    const table = document.getElementById('dataPreview');
    const headers = Object.keys(data[0]);
    
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    table.innerHTML = '';
    table.appendChild(headerRow);

    // Display first 5 rows
    data.slice(0, 5).forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}

function visualizeData() {
    const isDarkMode = document.body.classList.contains('dark-theme');
    const chartOptions = updateChartOptions(chartType.value, isDarkMode);
    
    const columnSelect = document.getElementById('columnSelect');
    const dataLimit = document.getElementById('dataLimit');
    const customLimit = document.getElementById('customLimit');
    const column = columnSelect.value;
    
    if (!column) {
        alert('Please select a column to visualize');
        return;
    }

    let data = fileHandler.csvData.map(row => row[column]);
    let limit = dataLimit.value;

    // Handle data limiting
    if (limit !== 'all') {
        const numLimit = limit === 'custom' ? 
            parseInt(customLimit.value) : 
            parseInt(limit);

        if (isNaN(numLimit) || numLimit < 1) {
            alert('Please enter a valid number');
            return;
        }

        // Get frequency count
        const counts = data.reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});

        // Sort by frequency and limit
        const sortedEntries = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, numLimit);

        // Reconstruct data
        const limitedLabels = sortedEntries.map(entry => entry[0]);
        const limitedData = sortedEntries.map(entry => entry[1]);

        switch(chartType.value) {
            case 'histogram':
                visualizer.createHistogram(data.slice(0, numLimit), column);
                break;
            default:
                visualizer.createChart(
                    chartType.value,
                    limitedData,
                    limitedLabels,
                    column
                );
        }
    } else {
        // Original visualization logic for all data
        switch(chartType.value) {
            case 'histogram':
                visualizer.createHistogram(data, column);
                break;
            default:
                const counts = data.reduce((acc, value) => {
                    acc[value] = (acc[value] || 0) + 1;
                    return acc;
                }, {});
                
                visualizer.createChart(
                    chartType.value,
                    Object.values(counts),
                    Object.keys(counts),
                    column
                );
        }
    }
}

function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
    
    // Add active class to clicked button
    const activeButton = document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function calculateStatistics(data, column) {
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
    const missingCount = data.filter(row => !row[column] || row[column].trim() === '').length;
    
    if (values.length === 0) return null;

    values.sort((a, b) => a - b);
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = values.length % 2 === 0 
        ? (values[values.length/2 - 1] + values[values.length/2]) / 2
        : values[Math.floor(values.length/2)];
    
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);

    return {
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        stdDev: stdDev.toFixed(2),
        missingValues: missingCount
    };
}

function updateStatisticalSummary(data, headers) {
    const summaryTable = document.getElementById('statisticalSummary').getElementsByTagName('tbody')[0];
    summaryTable.innerHTML = '';

    headers.forEach(header => {
        const stats = calculateStatistics(data, header);
        const row = document.createElement('tr');
        
        // Add column name
        const nameCell = document.createElement('td');
        nameCell.textContent = header;
        row.appendChild(nameCell);

        if (stats) {
            // Add numerical statistics
            row.appendChild(createCell(stats.mean));
            row.appendChild(createCell(stats.median));
            row.appendChild(createCell(stats.min));
            row.appendChild(createCell(stats.max));
            row.appendChild(createCell(stats.stdDev));
            row.appendChild(createCell(stats.missingValues));
        } else {
            // For non-numeric columns
            row.appendChild(createCell('N/A', 6));
        }

        summaryTable.appendChild(row);
    });
}

function createCell(content, colspan = 1) {
    const cell = document.createElement('td');
    cell.textContent = content;
    if (colspan > 1) {
        cell.setAttribute('colspan', colspan);
    }
    return cell;
}

function updateDataOverview(data, headers) {
    const numericColumns = headers.filter(header => {
        const values = data.map(row => row[header]);
        const numericValues = values.map(Number).filter(n => !isNaN(n));
        return numericValues.length > 0;
    });

    const overview = {
        totalRows: data.length,
        totalColumns: headers.length,
        numericColumns: numericColumns.length,
        categoricalColumns: headers.length - numericColumns.length
    };

    const overviewRow = document.getElementById('overviewData');
    overviewRow.cells[0].textContent = overview.totalRows;
    overviewRow.cells[1].textContent = overview.totalColumns;
    overviewRow.cells[2].textContent = overview.numericColumns;
    overviewRow.cells[3].textContent = overview.categoricalColumns;

    return overview;
}

function updateDataConclusion(data, headers) {
    console.log('Updating data conclusion with:', { dataLength: data.length, headers });
    
    try {
        // Generate summary
        const summaryHTML = generateDatasetSummary(data, headers);
        const dataSummary = document.getElementById('dataSummary');
        if (!dataSummary) {
            console.error('dataSummary element not found');
            return;
        }
        dataSummary.innerHTML = summaryHTML;
        console.log('Summary updated:', summaryHTML);

        // Generate insights
        const insightsHTML = generateKeyInsights(data, headers);
        const keyInsights = document.getElementById('keyInsights');
        if (!keyInsights) {
            console.error('keyInsights element not found');
            return;
        }
        keyInsights.innerHTML = insightsHTML;
        console.log('Insights updated:', insightsHTML);
    } catch (error) {
        console.error('Error updating data conclusion:', error);
    }
}

function generateDatasetSummary(data, headers) {
    const numericColumns = headers.filter(header => {
        const values = data.map(row => row[header]);
        return values.some(val => !isNaN(parseFloat(val)));
    });

    const categoricalColumns = headers.filter(h => !numericColumns.includes(h));
    
    let summary = `
        <p><strong>Dataset Size:</strong> ${data.length} rows × ${headers.length} columns</p>
        <p><strong>Column Types:</strong></p>
        <ul>
            <li>Numeric Columns (${numericColumns.length}): ${numericColumns.join(', ')}</li>
            <li>Categorical Columns (${categoricalColumns.length}): ${categoricalColumns.join(', ')}</li>
        </ul>
        <p><strong>Data Quality:</strong></p>
        <ul>`;

    headers.forEach(header => {
        const missingValues = data.filter(row => !row[header] || row[header].trim() === '').length;
        const missingPercentage = ((missingValues / data.length) * 100).toFixed(1);
        summary += `<li>${header}: ${missingPercentage}% missing values</li>`;
    });

    summary += '</ul>';
    return summary;
}

function generateKeyInsights(data, headers) {
    let insights = '<ul>';

    headers.forEach(header => {
        const values = data.map(row => row[header]);
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));

        if (numericValues.length > 0) {
            // Numeric column insights
            const mean = numericValues.reduce((a, b) => a + b) / numericValues.length;
            const max = Math.max(...numericValues);
            const min = Math.min(...numericValues);

            insights += `
                <li><strong>${header}:</strong>
                    <ul>
                        <li>Range: ${min.toFixed(2)} to ${max.toFixed(2)}</li>
                        <li>Average: ${mean.toFixed(2)}</li>
                    </ul>
                </li>`;
        } else {
            // Categorical column insights
            const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
            const valueCounts = values.reduce((acc, val) => {
                if (val !== null && val !== undefined && val !== '') {
                    acc[val] = (acc[val] || 0) + 1;
                }
                return acc;
            }, {});
            
            const mostCommon = Object.entries(valueCounts)
                .sort((a, b) => b[1] - a[1])[0];

            insights += `
                <li><strong>${header}:</strong>
                    <ul>
                        <li>Unique values: ${uniqueValues.size}</li>
                        <li>Most common: ${mostCommon ? `${mostCommon[0]} (${mostCommon[1]} times)` : 'N/A'}</li>
                    </ul>
                </li>`;
        }
    });

    insights += '</ul>';
    return insights;
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const lightIcon = themeToggle.querySelector('.light-icon');
    const darkIcon = themeToggle.querySelector('.dark-icon');

    body.classList.toggle('dark-theme');
    
    // Toggle icons
    if (body.classList.contains('dark-theme')) {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'block';
        localStorage.setItem('theme', 'dark');
    } else {
        lightIcon.style.display = 'block';
        darkIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
    }
}

// Add these styles to ensure tabs are visible when active
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block !important;
        }
    </style>
`);

// Add CSS to ensure conclusion content is visible
document.head.insertAdjacentHTML('beforeend', `
    <style>
        #conclusionTab {
            padding: 20px;
        }
        .summary-box, .insights-box {
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        #dataSummary, #keyInsights {
            margin-top: 10px;
        }
        #dataSummary ul, #keyInsights ul {
            margin-left: 20px;
            margin-top: 10px;
        }
        #dataSummary li, #keyInsights li {
            margin-bottom: 5px;
        }
    </style>
`);

// Add these functions for export functionality

// Function to export to Excel
function exportToExcel() {
    try {
        const data = fileHandler.getData();
        const headers = fileHandler.getHeaders();
        
        if (!data || !headers) {
            alert('No data available to export');
            return;
        }

        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        data.forEach(row => {
            csvContent += headers.map(header => row[header]).join(',') + '\n';
        });

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'data-analysis.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Failed to export Excel. Please try again.');
    }
}

// Function to save chart as image
function saveChart() {
    try {
        const canvas = document.getElementById('chartArea');
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error saving chart:', error);
        alert('Failed to save chart. Please try again.');
    }
}

// Update the chart options for better visibility in dark mode
function updateChartOptions(chartType, isDarkMode) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: isDarkMode ? '#ffffff' : '#333333'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: isDarkMode ? '#ffffff' : '#333333'
                },
                grid: {
                    color: isDarkMode ? '#444444' : '#e0e0e0'
                }
            },
            y: {
                ticks: {
                    color: isDarkMode ? '#ffffff' : '#333333'
                },
                grid: {
                    color: isDarkMode ? '#444444' : '#e0e0e0'
                }
            }
        }
    };

    return options;
}