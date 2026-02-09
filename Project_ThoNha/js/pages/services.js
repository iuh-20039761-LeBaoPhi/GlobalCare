// Services Page Script

let categoryModal = null;
let serviceModal = null;
let servicesData = []; // ⭐ Biến local để lưu dữ liệu

function initServices() {
    // Chỉ initialize một lần
    if (window.servicesInitialized) return;
    window.servicesInitialized = true;
    
    console.log('=== INIT SERVICES PAGE ===');
    
    try {
        const categoryModalEl = document.getElementById('categoryModal');
        const serviceModalEl = document.getElementById('serviceModal');
        
        if (categoryModalEl && serviceModalEl) {
            categoryModal = new bootstrap.Modal(categoryModalEl);
            serviceModal = new bootstrap.Modal(serviceModalEl);
        }
        
        loadAllServices().then(categories => {
            servicesData = categories; // ⭐ Lưu vào biến local
            console.log('📦 Services data loaded:', servicesData);
            displayServices(categories);
            loadCategoryOptions(categories);
            setupServicesEvents();
        });
    } catch(e) {
        console.error('Services init error:', e);
    }
}

function displayServices(categories) {
    const container = document.getElementById('servicesContainer');
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Chưa có danh mục nào</div>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="table-container mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    <i class="fas fa-folder"></i> ${cat.name}
                    ${cat.description ? `<small class="text-muted"> - ${cat.description}</small>` : ''}
                </h5>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="editCategory(${cat.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${cat.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th>Tên dịch vụ</th>
                            <th style="width: 150px;">Giá</th>
                            <th>Mô tả</th>
                            <th style="width: 100px;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cat.services && cat.services.length > 0 ? cat.services.map(s => `
                            <tr>
                                <td>${s.id}</td>
                                <td><strong>${s.name}</strong></td>
                                <td><span class="text-success fw-bold">${formatCurrency(s.price)}</span></td>
                                <td>${s.description || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editService(${s.id})" title="Sửa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteService(${s.id})" title="Xóa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" class="text-center">Chưa có dịch vụ nào</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');
}

function loadCategoryOptions(categories) {
    const select = document.getElementById('serviceCategoryId');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function setupServicesEvents() {
    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.onclick = function() {
            openAddCategoryModal();
        };
    }

    // Add service button
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.onclick = function() {
            openAddServiceModal();
        };
    }

    // Category form submit
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.onsubmit = function(e) {
            e.preventDefault();
            saveCategoryHandler();
        };
    }

    // Service form submit
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
        serviceForm.onsubmit = function(e) {
            e.preventDefault();
            saveServiceHandler();
        };
    }
}

// ==================== CATEGORY FUNCTIONS ====================

function openAddCategoryModal() {
    const title = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    const idInput = document.getElementById('categoryId');
    
    if (title && form && idInput) {
        title.textContent = 'Thêm Danh Mục';
        form.reset();
        idInput.value = '';
        if (categoryModal) categoryModal.show();
    }
}

window.editCategory = function(id) {
    console.log('=== EDIT CATEGORY ===');
    console.log('Looking for category ID:', id, 'Type:', typeof id);
    console.log('Available servicesData:', servicesData);
    
    // Chuyển id sang số để so sánh
    const numId = Number(id);
    
    const category = servicesData.find(c => {
        console.log('Checking category:', c.id, 'Type:', typeof c.id, 'Match:', Number(c.id) === numId);
        return Number(c.id) === numId;
    });
    
    if (!category) {
        alert('❌ Không tìm thấy danh mục với ID: ' + id);
        console.error('Category not found!');
        console.log('All category IDs:', servicesData.map(c => c.id));
        return;
    }
    
    console.log('✅ Found category:', category);
    
    const title = document.getElementById('categoryModalTitle');
    const idInput = document.getElementById('categoryId');
    const nameInput = document.getElementById('categoryName');
    const descInput = document.getElementById('categoryDescription');
    
    if (title && idInput && nameInput && descInput) {
        title.textContent = 'Sửa Danh Mục';
        idInput.value = category.id;
        nameInput.value = category.name;
        descInput.value = category.description || '';
        if (categoryModal) categoryModal.show();
    } else {
        console.error('Missing form elements');
    }
}

function saveCategoryHandler() {
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    
    if (!name) {
        alert('Vui lòng nhập tên danh mục');
        return;
    }
    
    const action = id ? 'update_category' : 'add_category';
    const data = {
        action: action,
        name: name,
        description: description
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    fetch('api/admin/manage_services.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if (res.status === 'success') {
            if (categoryModal) categoryModal.hide();
            // Reload data
            loadAllServices().then(categories => {
                servicesData = categories; // ⭐ Cập nhật servicesData
                displayServices(categories);
                loadCategoryOptions(categories);
            });
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Lỗi kết nối server');
    });
}

window.deleteCategory = function(id) {
    if (!confirm('Xác nhận xóa danh mục này?\n\nLưu ý: Chỉ có thể xóa danh mục không có dịch vụ.')) return;
    
    fetch('api/admin/manage_services.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'delete_category', 
            id: parseInt(id) 
        })
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if (res.status === 'success') {
            loadAllServices().then(categories => {
                servicesData = categories; // ⭐ Cập nhật servicesData
                displayServices(categories);
                loadCategoryOptions(categories);
            });
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Lỗi kết nối server');
    });
}

// ==================== SERVICE FUNCTIONS ====================

function openAddServiceModal() {
    const title = document.getElementById('serviceModalTitle');
    const form = document.getElementById('serviceForm');
    const idInput = document.getElementById('serviceId');
    
    if (title && form && idInput) {
        title.textContent = 'Thêm Dịch Vụ';
        form.reset();
        idInput.value = '';
        if (serviceModal) serviceModal.show();
    }
}

window.editService = function(id) {
    console.log('=== EDIT SERVICE ===');
    console.log('Looking for service ID:', id, 'Type:', typeof id);
    console.log('Available servicesData:', servicesData);
    
    let service = null;
    let categoryId = null;
    
    // Chuyển id sang số để so sánh
    const numId = Number(id);
    
    // Tìm dịch vụ trong tất cả danh mục
    for (let cat of servicesData) {
        if (cat.services && cat.services.length > 0) {
            service = cat.services.find(s => {
                console.log('Checking service:', s.id, 'Type:', typeof s.id, 'Match:', Number(s.id) === numId);
                return Number(s.id) === numId;
            });
            if (service) {
                categoryId = cat.id;
                console.log('✅ Found service in category:', cat.name, 'Category ID:', categoryId);
                break;
            }
        }
    }
    
    if (!service) {
        alert('❌ Không tìm thấy dịch vụ với ID: ' + id);
        console.error('Service not found!');
        // In ra tất cả service IDs để debug
        servicesData.forEach(cat => {
            if (cat.services) {
                console.log(`Category "${cat.name}" services:`, cat.services.map(s => s.id));
            }
        });
        return;
    }
    
    console.log('✅ Found service:', service);
    
    const title = document.getElementById('serviceModalTitle');
    const idInput = document.getElementById('serviceId');
    const catSelect = document.getElementById('serviceCategoryId');
    const nameInput = document.getElementById('serviceName');
    const priceInput = document.getElementById('servicePrice');
    const descInput = document.getElementById('serviceDescription');
    
    if (title && idInput && catSelect && nameInput && priceInput && descInput) {
        title.textContent = 'Sửa Dịch Vụ';
        idInput.value = service.id;
        catSelect.value = categoryId;
        nameInput.value = service.name;
        priceInput.value = service.price;
        descInput.value = service.description || '';
        if (serviceModal) serviceModal.show();
    } else {
        console.error('Missing form elements');
    }
}

function saveServiceHandler() {
    const id = document.getElementById('serviceId').value;
    const category_id = document.getElementById('serviceCategoryId').value;
    const name = document.getElementById('serviceName').value.trim();
    const price = document.getElementById('servicePrice').value;
    const description = document.getElementById('serviceDescription').value.trim();
    
    // Validate
    if (!category_id) {
        alert('Vui lòng chọn danh mục');
        return;
    }
    
    if (!name) {
        alert('Vui lòng nhập tên dịch vụ');
        return;
    }
    
    if (!price || parseFloat(price) <= 0) {
        alert('Vui lòng nhập giá hợp lệ');
        return;
    }
    
    const action = id ? 'update_service' : 'add_service';
    const data = {
        action: action,
        category_id: parseInt(category_id),
        name: name,
        price: parseFloat(price),
        description: description
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    fetch('api/admin/manage_services.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if (res.status === 'success') {
            if (serviceModal) serviceModal.hide();
            // Reload data
            loadAllServices().then(categories => {
                servicesData = categories; // ⭐ Cập nhật servicesData
                displayServices(categories);
                loadCategoryOptions(categories);
            });
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Lỗi kết nối server');
    });
}

window.deleteService = function(id) {
    if (!confirm('Xác nhận xóa dịch vụ này?')) return;
    
    fetch('api/admin/manage_services.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'delete_service', 
            id: parseInt(id) 
        })
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if (res.status === 'success') {
            loadAllServices().then(categories => {
                servicesData = categories; // ⭐ Cập nhật servicesData
                displayServices(categories);
                loadCategoryOptions(categories);
            });
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Lỗi kết nối server');
    });
}