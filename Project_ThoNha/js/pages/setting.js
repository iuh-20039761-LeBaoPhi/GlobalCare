// Settings Page Script

loadSettings();
setupSettingsEvents();

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    
    document.getElementById('companyName').value = settings.companyName || '';
    document.getElementById('contactEmail').value = settings.contactEmail || '';
    document.getElementById('contactPhone').value = settings.contactPhone || '';
    document.getElementById('companyAddress').value = settings.companyAddress || '';
    document.getElementById('companyDescription').value = settings.companyDescription || '';
    document.getElementById('serviceFeePct').value = settings.serviceFeePct || '0';
    document.getElementById('processingDays').value = settings.processingDays || '1';
    document.getElementById('enableAutoConfirm').checked = settings.enableAutoConfirm || false;
    document.getElementById('emailNotif').checked = settings.emailNotif !== false;
    document.getElementById('smsNotif').checked = settings.smsNotif || false;
    document.getElementById('newOrderNotif').checked = settings.newOrderNotif !== false;
}

function setupSettingsEvents() {
    // General Settings Form
    document.getElementById('generalSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        settings.companyName = document.getElementById('companyName').value;
        settings.contactEmail = document.getElementById('contactEmail').value;
        settings.contactPhone = document.getElementById('contactPhone').value;
        settings.companyAddress = document.getElementById('companyAddress').value;
        settings.companyDescription = document.getElementById('companyDescription').value;
        
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        alert('Cài đặt đã được lưu!');
    });

    // Service Settings Form
    document.getElementById('serviceSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        settings.serviceFeePct = document.getElementById('serviceFeePct').value;
        settings.processingDays = document.getElementById('processingDays').value;
        settings.enableAutoConfirm = document.getElementById('enableAutoConfirm').checked;
        
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        alert('Cài đặt dịch vụ đã được lưu!');
    });

    // Notification Settings Form
    document.getElementById('notificationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        settings.emailNotif = document.getElementById('emailNotif').checked;
        settings.smsNotif = document.getElementById('smsNotif').checked;
        settings.newOrderNotif = document.getElementById('newOrderNotif').checked;
        
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        alert('Cài đặt thông báo đã được lưu!');
    });

    // Security Form
    document.getElementById('securityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!currentPassword || !newPassword) {
            alert('Vui lòng nhập đủ thông tin!');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới không khớp!');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }
        
        fetch('api/admin/change_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        })
        .then(res => res.json())
        .then(res => {
            alert(res.message);
            if (res.status === 'success') {
                document.getElementById('securityForm').reset();
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert('Lỗi kết nối server');
        });
    });

    // Clear Data Button
    document.getElementById('clearDataBtn').addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
            if (confirm('Xác nhận lần nữa - điều này sẽ xóa tất cả đơn hàng, yêu cầu hủy, v.v.')) {
                fetch('api/admin/clear_all_data.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(res => res.json())
                .then(res => {
                    alert(res.message);
                    if (res.status === 'success') {
                        loadAllOrders();
                        loadAllCancelRequests();
                    }
                })
                .catch(err => {
                    console.error('Error:', err);
                    alert('Lỗi kết nối server');
                });
            }
        }
    });
}