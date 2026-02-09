// ==================== CORE FUNCTIONS ====================

// Check login
fetch('api/admin/check_login.php')
    .then(res => res.json())
    .then(res => {
        if (res.status !== 'logged_in') {
            localStorage.clear();
            window.location.href = 'login.html';
        } else {
            document.querySelector('.top-bar .text-muted').textContent = res.username;
        }
    });

// Global data
let allOrders = [];
let cancelRequests = [];
let allCategories = [];
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadPage('dashboard');
});

// ==================== NAVIGATION ====================

function setupNavigation() {
    document.getElementById('dashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('dashboard');
    });

    document.getElementById('ordersLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('orders');
    });

    document.getElementById('cancelRequestsLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('cancelRequests');
    });

    document.getElementById('servicesLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('services');
    });

    document.getElementById('settingsLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('settings');
    });

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('admin_logged_in');
            localStorage.removeItem('admin_username');
            
            fetch('api/admin/logout.php')
                .then(() => window.location.href = 'login.html')
                .catch(() => window.location.href = 'login.html');
        }
    });
}

function loadPage(page) {
    currentPage = page;
    
    // Reset tất cả initialization flags
    window.dashboardInitialized = false;
    window.ordersInitialized = false;
    window.cancelRequestsInitialized = false;
    window.servicesInitialized = false;
    window.settingsInitialized = false;
    
    // Update active menu
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    document.getElementById(page + 'Link').classList.add('active');

    // Load content based on page
    switch(page) {
        case 'dashboard':
            document.getElementById('pageTitle').textContent = 'Tổng Quan';
            loadDashboardPage();
            break;
        case 'orders':
            document.getElementById('pageTitle').textContent = 'Quản Lý Đơn Hàng';
            loadOrdersPage();
            break;
        case 'cancelRequests':
            document.getElementById('pageTitle').textContent = 'Yêu Cầu Hủy Đơn';
            loadCancelRequestsPage();
            break;
        case 'services':
            document.getElementById('pageTitle').textContent = 'Quản Lý Dịch Vụ';
            loadServicesPage();
            break;
        case 'settings':
            document.getElementById('pageTitle').textContent = 'Cài Đặt';
            loadSettingsPage();
            break;
    }
}

// ==================== PAGE LOADERS ====================

function loadDashboardPage() {
    Promise.all([
        fetch('js/pages/dashboard.html').then(res => res.text()),
        fetch('js/pages/dashboard.js').then(res => res.text())
    ]).then(([html, script]) => {
        document.getElementById('pageContent').innerHTML = html;
        eval(script);
        if (typeof initDashboard === 'function') initDashboard();
    });
}

function loadOrdersPage() {
    Promise.all([
        fetch('js/pages/orders.html').then(res => res.text()),
        fetch('js/pages/orders.js').then(res => res.text())
    ]).then(([html, script]) => {
        document.getElementById('pageContent').innerHTML = html;
        eval(script);
        if (typeof initOrders === 'function') initOrders();
    });
}

function loadCancelRequestsPage() {
    Promise.all([
        fetch('js/pages/cancel_request.html').then(res => res.text()),
        fetch('js/pages/cancel_request.js').then(res => res.text())
    ]).then(([html, script]) => {
        document.getElementById('pageContent').innerHTML = html;
        eval(script);
        if (typeof initCancelRequests === 'function') initCancelRequests();
    });
}

function loadServicesPage() {
    Promise.all([
        fetch('js/pages/services.html').then(res => res.text()),
        fetch('js/pages/services.js').then(res => res.text())
    ]).then(([html, script]) => {
        document.getElementById('pageContent').innerHTML = html;
        eval(script);
        if (typeof initServices === 'function') initServices();
    });
}

function loadSettingsPage() {
    Promise.all([
        fetch('js/pages/settings.html').then(res => res.text()),
        fetch('js/pages/settings.js').then(res => res.text())
    ]).then(([html, script]) => {
        document.getElementById('pageContent').innerHTML = html;
        eval(script);
        if (typeof initSettings === 'function') initSettings();
    });
}

// ==================== SHARED UTILITIES ====================

// Format currency
function formatCurrency(value) {
    return Number(value).toLocaleString('vi-VN') + ' đ';
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Format datetime
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('vi-VN');
}

// Status map
const statusMap = {
    'new': { text: 'Mới', class: 'bg-primary' },
    'confirmed': { text: 'Đã xác nhận', class: 'bg-info' },
    'doing': { text: 'Đang thực hiện', class: 'bg-warning' },
    'done': { text: 'Hoàn thành', class: 'bg-success' },
    'cancel': { text: 'Đã hủy', class: 'bg-danger' }
};

// Get status text and class
function getStatusBadge(status) {
    const s = statusMap[status] || { text: status, class: 'bg-secondary' };
    return `<span class="status-badge ${s.class}">${s.text}</span>`;
}

// Load orders
function loadAllOrders() {
    return fetch('api/admin/get_all_orders.php')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                allOrders = res.data;
            }
            return allOrders;
        });
}

// Load cancel requests
function loadAllCancelRequests() {
    return fetch('api/admin/get_cancel_requests.php')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                cancelRequests = res.data;
                updateCancelBadge();
            }
            return cancelRequests;
        });
}

// Load services
function loadAllServices() {
    return fetch('api/admin/manage_services.php?action=get_all')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                allCategories = res.data;
            }
            return allCategories;
        });
}

// Update cancel badge
function updateCancelBadge() {
    const pending = cancelRequests.filter(r => r.cancel_status === 'pending').length;
    document.getElementById('cancelBadge').textContent = pending;
}