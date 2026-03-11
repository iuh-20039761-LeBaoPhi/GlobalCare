/**
 * Booking JavaScript - Xử lý đặt lịch dịch vụ
 * Dữ liệu dịch vụ load từ data/services.json
 */

// ==================== MODAL ELEMENTS ====================
const bookingModal       = new bootstrap.Modal(document.getElementById('bookingModal'));
const mainService        = document.getElementById('mainService');
const subService         = document.getElementById('subService');
const servicePrice       = document.getElementById('servicePrice');
const brandSelectorWrap  = document.getElementById('brandSelectorWrap');
const brandOptionsContainer = document.getElementById('brandOptionsContainer');

// ==================== LOAD DATA & INIT MODAL ====================
let STATIC_SERVICES = [];

fetch('data/services.json')
    .then(r => r.json())
    .then(data => {
        STATIC_SERVICES = data.map(s => ({
            id:    s.id,
            name:  s.name,
            items: s.items.map(item => ({
                name:        item.name,
                price:       item.price,
                brandPrices: item.brandPrices || null
            }))
        }));

        // Populate categories
        STATIC_SERVICES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value       = cat.id;
            opt.textContent = cat.name;
            mainService.appendChild(opt);
        });
    })
    .catch(() => console.warn('Không thể tải data/services.json'));

// When category changes → populate sub-services
mainService.addEventListener('change', () => {
    subService.innerHTML  = '<option value="">-- Chọn dịch vụ chi tiết --</option>';
    subService.disabled   = true;
    servicePrice.value    = '';
    hideBrandSelector();
    if (!mainService.value) return;

    const cat = STATIC_SERVICES.find(c => c.id == mainService.value);
    if (!cat) return;

    cat.items.forEach(s => {
        const opt = document.createElement('option');
        opt.value           = s.name;
        opt.textContent     = s.name;
        opt.dataset.price   = s.price;
        subService.appendChild(opt);
    });
    subService.disabled = false;
});

// Show price and brand selector when sub-service selected
subService.addEventListener('change', function () {
    const cat  = STATIC_SERVICES.find(c => c.id == mainService.value);
    const item = cat ? cat.items.find(i => i.name === this.value) : null;

    if (item && item.brandPrices && item.brandPrices.length > 1) {
        showBrandSelector(item.brandPrices);
        // Chọn hãng đầu tiên làm mặc định
        const firstPrice = item.brandPrices[0].price;
        servicePrice.value = Number(firstPrice).toLocaleString('vi-VN') + ' VNĐ';
    } else {
        hideBrandSelector();
        const price = this.options[this.selectedIndex].dataset.price;
        servicePrice.value = price ? Number(price).toLocaleString('vi-VN') + ' VNĐ' : '';
    }
});

function showBrandSelector(brandPrices) {
    brandOptionsContainer.innerHTML = '';
    brandPrices.forEach((bp, i) => {
        const btn = document.createElement('button');
        btn.type             = 'button';
        btn.className        = 'brand-option' + (i === 0 ? ' active' : '');
        btn.textContent      = bp.name;
        btn.dataset.brand    = bp.name;
        btn.dataset.price    = bp.price;
        btn.addEventListener('click', function () {
            brandOptionsContainer.querySelectorAll('.brand-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            servicePrice.value = Number(this.dataset.price).toLocaleString('vi-VN') + ' VNĐ';
        });
        brandOptionsContainer.appendChild(btn);
    });
    brandSelectorWrap.style.display = '';
}

function hideBrandSelector() {
    brandSelectorWrap.style.display = 'none';
    brandOptionsContainer.innerHTML = '';
}

// ==================== BOOKING SUBMIT ====================
document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const activeBrand = brandOptionsContainer.querySelector('.brand-option.active');
    const serviceName = subService.value + (activeBrand ? ` (${activeBrand.dataset.brand})` : '');

    const data = {
        name:       document.getElementById('name').value.trim(),
        phone:      document.getElementById('phone').value.trim(),
        service_id: serviceName,
        address:    document.getElementById('address').value.trim(),
        note:       document.getElementById('note').value.trim()
    };

    if (!data.name || !data.phone || !data.service_id || !data.address) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }

    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    if (!phoneRegex.test(data.phone)) {
        alert('Số điện thoại không hợp lệ!');
        return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

    const resetBtn = () => {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i> Xác nhận đặt lịch';
    };

    const onSuccess = (orderCode) => {
        const msg = orderCode
            ? `✅ Đặt lịch thành công! Mã đơn: ${orderCode}`
            : '✅ Đặt lịch thành công!\nChúng tôi sẽ liên hệ lại trong thời gian sớm nhất.';
        alert(msg);
        bookingModal.hide();
        this.reset();
        subService.disabled = true;
        servicePrice.value  = '';
        hideBrandSelector();
        resetBtn();
    };

    fetch('api/book.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success') {
            onSuccess(res.order_code);
        } else {
            onSuccess(null);
        }
    })
    .catch(() => {
        // Demo mode – hiện thị thành công khi chưa có server
        alert('✅ Đặt lịch thành công!\nChúng tôi sẽ liên hệ lại trong thời gian sớm nhất.\n\n📞 Hotline: 0775 472 347');
        bookingModal.hide();
        this.reset();
        subService.disabled = true;
        servicePrice.value  = '';
        hideBrandSelector();
        resetBtn();
    });
});

// ==================== CLICK BOOKING BTN ON CARDS ====================
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.booking-btn');
    if (!btn) return;

    const card = btn.closest('.service-item');
    if (!card) return;

    const categoryName = card.getAttribute('data-category');
    if (!categoryName) return;

    const cat = STATIC_SERVICES.find(c =>
        c.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    if (cat) {
        mainService.value = cat.id;
        mainService.dispatchEvent(new Event('change'));
    } else {
        mainService.value = '';
        subService.innerHTML = '<option value="">-- Chọn dịch vụ chi tiết --</option>';
        subService.disabled  = true;
    }

    subService.selectedIndex = 0;
    servicePrice.value = '';
    hideBrandSelector();
    bookingModal.show();
});
