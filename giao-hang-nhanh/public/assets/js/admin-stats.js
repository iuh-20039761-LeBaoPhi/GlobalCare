/**
 * Admin Stats Dashboard Charts
 * Uses Chart.js and chartjs-plugin-datalabels
 */

document.addEventListener('DOMContentLoaded', function() {
    if (!window.chartData) {
        console.error('Chart data not found.');
        return;
    }

    // 1. Revenue & Orders Chart (7 Days)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: window.chartData.revenue.labels,
                datasets: [
                    {
                        label: 'Doanh thu (VNĐ)',
                        data: window.chartData.revenue.revenue,
                        borderColor: '#ff7a00',
                        backgroundColor: 'rgba(255, 122, 0, 0.1)',
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Số đơn hàng',
                        data: window.chartData.revenue.orders,
                        borderColor: '#0a2a66',
                        backgroundColor: '#0a2a66',
                        borderWidth: 2,
                        type: 'bar',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Doanh thu (đ)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Số đơn' }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    // 2. Service Distribution Chart
    const serviceCtx = document.getElementById('serviceChart');
    if (serviceCtx) {
        new Chart(serviceCtx, {
            type: 'doughnut',
            data: {
                labels: window.chartData.service.labels,
                datasets: [{
                    data: window.chartData.service.data,
                    backgroundColor: ['#ff7a00', '#0a2a66', '#28a745', '#17a2b8', '#6c757d']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // 3. Package Type Distribution Chart
    const packageCtx = document.getElementById('packageChart');
    if (packageCtx) {
        new Chart(packageCtx, {
            type: 'pie',
            data: {
                labels: window.chartData.package.labels,
                datasets: [{
                    data: window.chartData.package.data,
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
});
