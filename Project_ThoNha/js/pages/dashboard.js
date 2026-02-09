// Dashboard Page Script

function getStatusBadge(status) {
    const statusMap = {
        'new': '<span class="badge bg-primary">Chờ xác nhận</span>',
        'confirmed': '<span class="badge bg-info">Đã xác nhận</span>',
        'done': '<span class="badge bg-success">Hoàn thành</span>',
        'cancel': '<span class="badge bg-danger">Đã hủy</span>'
    };
    return statusMap[status] || '<span class="badge bg-secondary">Không xác định</span>';
}

function initDashboard() {
    // Chỉ initialize một lần
    if (window.dashboardInitialized) return;
    window.dashboardInitialized = true;
    
    loadAllOrders().then(orders => {
        updateDashboardStats(orders);
    });

    loadAllCancelRequests();
    loadAllServices();
}

function updateDashboardStats(orders) {
    const totalOrders = document.getElementById('dashTotalOrders');
    const pendingOrders = document.getElementById('dashPendingOrders');
    const completeOrders = document.getElementById('dashCompleteOrders');
    
    if (totalOrders) totalOrders.textContent = orders.length;
    if (pendingOrders) pendingOrders.textContent = orders.filter(o => o.status === 'new').length;;
    if (completeOrders) completeOrders.textContent = orders.filter(o => o.status === 'done').length;
    
    displayRecentOrders(orders.slice(0, 5));
    displayStatusStatsChart(orders);
    loadDashboardStats();
}

function displayRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Không có đơn hàng nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong class="text-primary">${order.order_code}</strong></td>
            <td>${order.customer_name}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>${formatDate(order.created_at)}</td>
        </tr>
    `).join('');
}

function displayStatusStatsChart(orders) {
    const container = document.getElementById('statusStatsChart');
    if (!container) return;
    
    const stats = {
        new: orders.filter(o => o.status === 'new').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        done: orders.filter(o => o.status === 'done').length,
        cancel: orders.filter(o => o.status === 'cancel').length
    };
    
    container.innerHTML = `
        <div class="list-group">
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div><span class="badge bg-primary rounded-pill">Chờ xác nhận</span></div>
                <span class="fw-bold">${stats.new} đơn</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div><span class="badge bg-info rounded-pill">Xác nhận</span></div>
                <span class="fw-bold">${stats.confirmed} đơn</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div><span class="badge bg-success rounded-pill">Hoàn thành</span></div>
                <span class="fw-bold">${stats.done} đơn</span>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div><span class="badge bg-danger rounded-pill">Hủy</span></div>
                <span class="fw-bold">${stats.cancel} đơn</span>
            </div>
        </div>
    `;
}

function loadDashboardStats() {
    // Load cancel requests count
    if (cancelRequests.length > 0) {
        const pending = cancelRequests.filter(r => r.cancel_status === 'pending').length;
        const el = document.getElementById('dashCancelRequests');
        if (el) el.textContent = pending;
    }

    // Load services count
    if (allCategories.length > 0) {
        const totalServices = allCategories.reduce((sum, cat) => sum + cat.services.length, 0);
        const el = document.getElementById('dashTotalServices');
        if (el) el.textContent = totalServices;
    }

    // Load total customers
    if (allOrders.length > 0) {
        const uniqueCustomers = new Set(allOrders.map(o => o.phone)).size;
        const el = document.getElementById('dashTotalCustomers');
        if (el) el.textContent = uniqueCustomers;
    }
}