/**
 * registration.js – Logic xử lý đăng ký tài khoản dùng chung cho Dịch Vụ Quanh Ta.
 * 
 * Chức năng:
 * - Multi-step form navigation (3 bước)
 * - Validate đầy đủ (SĐT, email, mật khẩu, trùng tài khoản)
 * - Upload ảnh (Avatar, CCCD mặt trước/sau) qua krud-helper
 * - Chọn dịch vụ → xác định role (khách hàng / nhà cung cấp)
 * - Lưu vào các bảng tương ứng qua DVQTKrud
 */
'use strict';

/* ================================================================
   CẤU HÌNH DỊCH VỤ
   Thêm/bớt dịch vụ tại đây – hệ thống tự render giao diện.
   ================================================================ */
const REG_SERVICES = [
    { id: 1, key: 'mevabe',       name: 'Chăm sóc mẹ và bé',   icon: 'fas fa-baby',         color: '#ec4899' },
    { id: 2, key: 'nguoibenh',    name: 'Chăm sóc người bệnh',  icon: 'fas fa-hospital-user', color: '#ef4444' },
    { id: 3, key: 'nguoigia',     name: 'Chăm sóc người già',    icon: 'fas fa-person-cane',   color: '#f97316' },
    { id: 4, key: 'vuonnha',      name: 'Làm vườn',              icon: 'fas fa-leaf',          color: '#22c55e' },
    { id: 5, key: 'donvesinh',    name: 'Dọn vệ sinh',           icon: 'fas fa-broom',         color: '#14b8a6' },
    { id: 6, key: 'laixeho',      name: 'Lái xe hộ',             icon: 'fas fa-car',           color: '#3b82f6' },
    { id: 7, key: 'giaohangnhanh',name: 'Giao hàng nhanh',       icon: 'fas fa-truck-fast',    color: '#6366f1' },
    { id: 8, key: 'suaxe',        name: 'Sửa xe',                icon: 'fas fa-motorcycle',    color: '#8b5cf6' },
    { id: 9, key: 'thonha',       name: 'Thợ nhà',               icon: 'fas fa-tools',         color: '#11998e' },
    { id: 10,key: 'thuexe',       name: 'Thuê xe',               icon: 'fas fa-key',           color: '#0ea5e9' },
    { id: 11,key: 'giatuinhanh',  name: 'Giặt ủi nhanh',        icon: 'fas fa-tshirt',        color: '#f43f5e' },
];

/* ================================================================
   STATE
   ================================================================ */
let _regCoords = { lat: null, lng: null };
let _selectedServices = new Set();

/* ================================================================
   STEPPER NAVIGATION
   ================================================================ */
const regNav = {
    current: 1,

    goPage(n) {
        // Validate trước khi tiến
        if (n > this.current && !this._validatePage(this.current)) return;

        // Ẩn trang hiện tại
        document.getElementById(`regPage${this.current}`).classList.remove('active');
        // Hiện trang mới
        document.getElementById(`regPage${n}`).classList.add('active');

        // Cập nhật stepper
        document.querySelectorAll('.reg-step').forEach(el => {
            const s = Number(el.dataset.step);
            el.classList.remove('active', 'done');
            if (s < n) el.classList.add('done');
            if (s === n) el.classList.add('active');
        });

        this.current = n;
        // Scroll lên đầu card
        document.querySelector('.auth-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _validatePage(page) {
        const msg = document.getElementById('msg');
        msg.innerHTML = '';

        if (page === 1) {
            const name = document.getElementById('reg_name').value.trim();
            const phone = document.getElementById('reg_phone').value.replace(/\s+/g, '');
            const addr = document.getElementById('diachi').value.trim();
            const pwd = document.getElementById('reg_password').value;
            const confirm = document.getElementById('reg_confirm').value;
            const email = document.getElementById('reg_email').value.trim();

            if (!name) return this._err('Vui lòng nhập họ và tên.');
            if (!phone) return this._err('Vui lòng nhập số điện thoại.');
            if (!/^(0|\+84)[0-9]{9}$/.test(phone)) return this._err('SĐT không hợp lệ (VD: 0901234567).');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this._err('Email không hợp lệ.');
            if (!addr) return this._err('Vui lòng nhập địa chỉ.');
            if (!pwd) return this._err('Vui lòng nhập mật khẩu.');
            if (pwd.length < 6) return this._err('Mật khẩu phải có ít nhất 6 ký tự.');
            if (pwd !== confirm) return this._err('Mật khẩu xác nhận không khớp.');
            return true;
        }

        // Page 2 & 3: không bắt buộc, cho qua
        return true;
    },

    _err(text) {
        const msg = document.getElementById('msg');
        msg.innerHTML = `<span class="text-danger small"><i class="fas fa-exclamation-circle me-1"></i>${text}</span>`;
        return false;
    }
};

/* ================================================================
   UPLOAD HANDLERS
   ================================================================ */
const regUpload = {
    init() {
        // Avatar
        document.getElementById('avatarInput').addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const zone = document.getElementById('avatarZone');
            const preview = document.getElementById('avatarPreview');
            preview.src = URL.createObjectURL(file);
            zone.classList.add('has-file');
        });

        // CCCD Front
        document.getElementById('cccdFrontInput').addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const zone = document.getElementById('cccdFrontZone');
            const preview = document.getElementById('cccdFrontPreview');
            preview.src = URL.createObjectURL(file);
            zone.classList.add('has-file');
        });

        // CCCD Back
        document.getElementById('cccdBackInput').addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const zone = document.getElementById('cccdBackZone');
            const preview = document.getElementById('cccdBackPreview');
            preview.src = URL.createObjectURL(file);
            zone.classList.add('has-file');
        });
    },

    removeCccd(side) {
        const prefix = side === 'front' ? 'cccdFront' : 'cccdBack';
        const zone = document.getElementById(prefix + 'Zone');
        const preview = document.getElementById(prefix + 'Preview');
        const input = document.getElementById(prefix + 'Input');
        preview.src = '';
        zone.classList.remove('has-file');
        input.value = '';
    }
};

/* ================================================================
   SERVICE GRID RENDER
   ================================================================ */
function renderServiceGrid() {
    const grid = document.getElementById('svcGrid');
    grid.innerHTML = '';

    REG_SERVICES.forEach(svc => {
        const label = document.createElement('label');
        label.className = 'svc-check';
        label.innerHTML = `
            <input type="checkbox" value="${svc.id}" data-key="${svc.key}">
            <span class="svc-icon" style="background:${svc.color};">
                <i class="${svc.icon}"></i>
            </span>
            <span class="svc-label">${svc.name}</span>
            <span class="svc-checkmark"><i class="fas fa-check"></i></span>
        `;

        const cb = label.querySelector('input[type="checkbox"]');
        cb.addEventListener('change', () => {
            if (cb.checked) {
                label.classList.add('checked');
                _selectedServices.add(svc.id);
            } else {
                label.classList.remove('checked');
                _selectedServices.delete(svc.id);
            }
            _updateServiceCount();
        });

        grid.appendChild(label);
    });
}

function _updateServiceCount() {
    const el = document.getElementById('svcSelectedCount');
    const n = _selectedServices.size;
    if (n === 0) {
        el.innerHTML = `<i class="fas fa-info-circle me-1"></i> Chưa chọn dịch vụ nào – Đăng ký là <strong>Khách hàng</strong>`;
    } else {
        el.innerHTML = `<i class="fas fa-briefcase me-1" style="color:var(--auth-primary);"></i> Đã chọn <strong>${n}</strong> dịch vụ – Đăng ký là <strong style="color:var(--auth-primary);">Nhà cung cấp</strong>`;
    }
}

/* ================================================================
   PASSWORD UTILITIES
   ================================================================ */
function initPasswordUtils() {
    const pwdInput = document.getElementById('reg_password');
    const confirmInput = document.getElementById('reg_confirm');
    const strengthFill = document.getElementById('strengthFill');
    const toggleBtn = document.getElementById('togglePwd');

    // Toggle show/hide
    toggleBtn.addEventListener('click', () => {
        const icon = document.getElementById('eyeIcon');
        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            pwdInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });

    // Strength indicator
    pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
        let score = 0;
        const rules = {
            len: val.length >= 6,
            upper: /[A-Z]/.test(val),
            num: /\d/.test(val),
        };

        Object.entries(rules).forEach(([key, pass]) => {
            const el = document.querySelector(`.pwd-rule[data-rule="${key}"]`);
            if (el) el.classList.toggle('pass', pass);
            if (pass) score++;
        });

        const pct = (score / 3) * 100;
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
        strengthFill.style.width = pct + '%';
        strengthFill.style.background = colors[score] || colors[0];
    });

    // Confirm match
    confirmInput.addEventListener('input', () => {
        const el = document.getElementById('confirmMatch');
        if (!confirmInput.value) { el.innerHTML = ''; return; }
        if (confirmInput.value === pwdInput.value) {
            el.innerHTML = '<span class="text-success"><i class="fas fa-check-circle me-1"></i>Mật khẩu khớp</span>';
        } else {
            el.innerHTML = '<span class="text-danger"><i class="fas fa-times-circle me-1"></i>Chưa khớp</span>';
        }
    });
}

/* ================================================================
   MAP / COORDINATES HOOK
   ================================================================ */
function initMapHook() {
    // Hook vào map-picker: khi chọn vị trí, lưu tọa độ ngầm
    const origPick = window.mapPicker?.pick;
    if (!origPick) return;

    // Lắng nghe khi vị trí được chọn thông qua _bdTravelFromCoords
    window._bdTravelFromCoords = function(lat, lng) {
        _regCoords.lat = lat;
        _regCoords.lng = lng;
        document.getElementById('reg_lat').value = lat;
        document.getElementById('reg_lng').value = lng;

        // Hiện tọa độ nhỏ
        const info = document.getElementById('coordInfo');
        if (info) {
            info.style.display = 'flex';
            document.getElementById('coordLat').textContent = `Lat: ${Number(lat).toFixed(6)}`;
            document.getElementById('coordLng').textContent = `Lng: ${Number(lng).toFixed(6)}`;
        }
    };
}

/* ================================================================
   UPLOAD FILE TO KRUD (Base64)
   ================================================================ */
async function uploadFileToKrud(file, table, columnName, rowId) {
    if (!file) return null;
    // Convert to base64
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            // For now, store filename metadata. Actual file upload depends on server capability.
            resolve(file.name);
        };
        reader.readAsDataURL(file);
    });
}

/* ================================================================
   SUBMIT ĐĂNG KÝ
   ================================================================ */
async function regSubmit() {
    const msg = document.getElementById('msg');
    const btn = document.getElementById('btnSubmit');
    msg.innerHTML = '';

    // Thu thập dữ liệu
    const name = document.getElementById('reg_name').value.trim();
    const phone = document.getElementById('reg_phone').value.replace(/\s+/g, '');
    const email = document.getElementById('reg_email').value.trim();
    const addr = document.getElementById('diachi').value.trim();
    const pwd = document.getElementById('reg_password').value;
    const lat = document.getElementById('reg_lat').value || '';
    const lng = document.getElementById('reg_lng').value || '';

    // File inputs
    const avatarFile = document.getElementById('avatarInput').files[0] || null;
    const cccdFront = document.getElementById('cccdFrontInput').files[0] || null;
    const cccdBack = document.getElementById('cccdBackInput').files[0] || null;

    // Kiểm tra lần cuối
    if (!name || !phone || !pwd || !addr) {
        msg.innerHTML = '<span class="text-danger small"><i class="fas fa-exclamation-circle me-1"></i>Thiếu thông tin bắt buộc. Vui lòng quay lại kiểm tra.</span>';
        return;
    }

    // Disable button
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

    try {
        const idDichvuStr = _selectedServices.size > 0 
            ? Array.from(_selectedServices).sort((a,b) => a-b).join(',') 
            : '0';

        // 1. Chuẩn bị dữ liệu (Dọn dẹp các field dư thừa)
        const userData = {
            hovaten: name,
            sodienthoai: phone,
            email: email,
            diachi: addr,
            matkhau: pwd,
            maplat: lat,
            maplng: lng,
            avatartenfile: avatarFile ? avatarFile.name : '',
            cccdmattruoctenfile: cccdFront ? cccdFront.name : '',
            cccdmatsautenfile: cccdBack ? cccdBack.name : '',
            id_dichvu: idDichvuStr
        };

        // 2. Gọi bộ xử lý Đăng ký tập trung từ DVQTApp (Tự động kiểm tra trùng & tạo đơn)
        await DVQTApp.register(userData);

        const isProvider = idDichvuStr !== '0';

        if (!isProvider) {
            // === KHÁCH HÀNG ===
            msg.innerHTML = '<span class="text-success small"><i class="fas fa-check-circle me-1"></i>Đăng ký khách hàng thành công! Đang chuyển hướng...</span>';
            setTimeout(() => window.location.href = '../../public/dang-nhap.html', 1200);

        } else {
            // === NHÀ CUNG CẤP ===
            const selectedNames = Array.from(_selectedServices).map(id => {
                const s = REG_SERVICES.find(r => r.id === id);
                return s ? s.name : id;
            });

            msg.innerHTML = `
                <div class="info-box" style="margin-top:16px; text-align:center;">
                    <i class="fas fa-check-circle" style="color:var(--auth-success); font-size:1.5rem; display:block; margin-bottom:8px;"></i>
                    <strong>Đăng ký nhà cung cấp thành công!</strong><br>
                    <span style="font-size:0.82rem;">Tài khoản của bạn đã sẵn sàng.<br>
                    Bạn đã đăng ký ${selectedNames.length} dịch vụ: <strong>${selectedNames.join(', ')}</strong></span>
                </div>
            `;

            // Ẩn form, chỉ hiện thông báo
            document.getElementById('regPage3').querySelector('.reg-nav').style.display = 'none';
            document.querySelector('.reg-stepper').style.display = 'none';
            setTimeout(() => window.location.href = '../../public/dang-nhap.html', 2500);
        }

    } catch (err) {
        console.error('Registration error:', err);
        msg.innerHTML = `<span class="text-danger small"><i class="fas fa-exclamation-circle me-1"></i>${err.message || 'Đăng ký thất bại. Vui lòng thử lại.'}</span>`;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle me-2"></i> Hoàn tất đăng ký';
    }
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderServiceGrid();
    regUpload.init();
    initPasswordUtils();
    initMapHook();
});
