class Visualizer {
    constructor() {
        this.chart = null;
        this.colors = [
            'rgba(33, 150, 243, 0.5)',   // blue
            'rgba(255, 87, 34, 0.5)',    // orange
            'rgba(76, 175, 80, 0.5)',    // green
            'rgba(156, 39, 176, 0.5)',   // purple
            'rgba(255, 193, 7, 0.5)',    // amber
            'rgba(233, 30, 99, 0.5)'     // pink
        ];
    }

    createChart(type, data, labels, title) {
        const ctx = document.getElementById('chartArea').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const config = this.getChartConfig(type, data, labels, title);
        this.chart = new Chart(ctx, config);
    }

    getChartConfig(type, data, labels, title) {
        const baseConfig = {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: this.colors,
                    borderColor: this.colors.map(color => color.replace('0.5', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        display: ['pie', 'doughnut'].includes(type)
                    }
                }
            }
        };

        // Add specific configurations based on chart type
        switch(type) {
            case 'bar':
            case 'line':
                baseConfig.options.scales = {
                    y: {
                        beginAtZero: true
                    }
                };
                break;
            
            case 'scatter':
                baseConfig.data.datasets[0].showLine = false;
                baseConfig.options.scales = {
                    x: {
                        type: 'linear',
                        position: 'bottom'
                    },
                    y: {
                        beginAtZero: true
                    }
                };
                break;

            case 'pie':
            case 'doughnut':
                baseConfig.options.plugins.legend.position = 'top';
                break;
        }

        return baseConfig;
    }

    createHistogram(data, title, limit = Infinity) {
        const values = data.map(Number)
            .filter(n => !isNaN(n))
            .slice(0, limit);
            
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(Math.ceil(Math.sqrt(values.length)), limit);
        const binWidth = (max - min) / binCount;

        const bins = Array(binCount).fill(0);
        values.forEach(value => {
            const binIndex = Math.min(
                Math.floor((value - min) / binWidth),
                binCount - 1
            );
            bins[binIndex]++;
        });

        const labels = Array(binCount).fill(0).map((_, i) => 
            `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`
        );

        this.createChart('bar', bins, labels, 
            `Histogram of ${title} (${limit === Infinity ? 'All Data' : `Top ${limit}`})`);
    }

    createScatterPlot(xData, yData, xLabel, yLabel, limit = Infinity) {
        const data = xData
            .map((x, i) => ({
                x: Number(x),
                y: Number(yData[i])
            }))
            .filter(point => !isNaN(point.x) && !isNaN(point.y))
            .slice(0, limit);

        this.createChart('scatter', data, null, 
            `${yLabel} vs ${xLabel} (${limit === Infinity ? 'All Data' : `Top ${limit}`})`);
    }
} 