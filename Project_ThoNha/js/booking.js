/**
 * Booking JavaScript - Xử lý đặt lịch dịch vụ
 */

// Khởi tạo modal
const bookingModal = new bootstrap.Modal(document.getElementById("bookingModal"));
const mainService = document.getElementById("mainService");
const subService = document.getElementById("subService");
const servicePrice = document.getElementById("servicePrice");

// Load danh sách danh mục dịch vụ
fetch("api/get_categories.php")
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Categories loaded:', data);
        
        if (!Array.isArray(data)) {
            console.error('Data is not an array:', data);
            return;
        }
        
        data.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name;
            mainService.appendChild(opt);
        });
    })
    .catch(err => {
        console.error('Lỗi load danh mục:', err);
        alert('Không thể tải danh sách dịch vụ. Vui lòng kiểm tra kết nối!');
    });

// Khi chọn danh mục, load dịch vụ con
mainService.addEventListener("change", () => {
    subService.innerHTML = '<option value="">-- Chọn dịch vụ chi tiết --</option>';
    subService.disabled = true;
    servicePrice.value = "";

    if (!mainService.value) return;

    console.log('Loading services for category:', mainService.value);

    fetch(`api/get_services.php?category_id=${mainService.value}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('Services loaded:', data);
            
            if (!Array.isArray(data)) {
                console.error('Data is not an array:', data);
                return;
            }
            
            if (data.length === 0) {
                alert('Không có dịch vụ nào trong danh mục này!');
                return;
            }
            
            data.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.name;
                opt.textContent = s.name;
                opt.dataset.price = s.price;
                subService.appendChild(opt);
            });
            subService.disabled = false;
        })
        .catch(err => {
            console.error('Lỗi load dịch vụ:', err);
            alert('Không thể tải danh sách dịch vụ chi tiết!');
        });
});

// Hiển thị giá khi chọn dịch vụ
subService.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    const price = selectedOption.dataset.price;
    
    console.log('Price selected:', price);
    
    servicePrice.value = price
        ? Number(price).toLocaleString("vi-VN") + " VNĐ"
        : "";
});

// Xử lý submit form đặt lịch
document.getElementById("bookingForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        service_id: document.getElementById("subService").value,
        address: document.getElementById("address").value.trim(),
        note: document.getElementById("note").value.trim()
    };

    console.log("Booking data:", data);

    // Validate
    if (!data.name || !data.phone || !data.service_id || !data.address) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
        return;
    }

    // Validate số điện thoại
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    if (!phoneRegex.test(data.phone)) {
        alert("Số điện thoại không hợp lệ!");
        return;
    }

    // Gửi request
    fetch("api/book.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(res => {
            console.log('Booking response:', res);
            
            if (res.status === "success") {
                alert("✅ Đặt lịch thành công! Mã đơn: " + res.order_code);
                bookingModal.hide();
                document.getElementById("bookingForm").reset();
                subService.disabled = true;
                servicePrice.value = "";
            } else {
                alert("❌ " + (res.message || "Có lỗi xảy ra"));
            }
        })
        .catch(err => {
            console.error('Lỗi:', err);
            alert("❌ Không thể kết nối server!");
        });
});

// Hàm chuẩn hóa chuỗi để so sánh
function normalizeString(str) {
    return str.toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // Thay nhiều space thành 1 space
}

// Xử lý click vào nút "Đặt lịch" trên các card dịch vụ
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".booking-btn");
    if (!btn) return;

    // Tìm card chứa nút
    const card = btn.closest(".service-item");
    if (!card) {
        console.error('Không tìm thấy card chứa nút');
        return;
    }

    // Lấy tên danh mục từ data-category
    const categoryName = card.getAttribute("data-category");
    if (!categoryName) {
        console.error('Card không có thuộc tính data-category');
        alert('Lỗi: Không xác định được danh mục dịch vụ!');
        return;
    }

    console.log('Category from card:', categoryName);
    console.log('Available options in select:');
    
    // Chuẩn hóa tên danh mục từ card
    const normalizedCardCategory = normalizeString(categoryName);
    
    // Tìm option tương ứng trong select (so sánh không phân biệt hoa thường và khoảng trắng)
    let found = false;
    let matchedOptionValue = null;
    
    for (let option of mainService.options) {
        const optionText = option.textContent;
        const normalizedOptionText = normalizeString(optionText);
        
        console.log(`  - "${optionText}" (normalized: "${normalizedOptionText}")`);
        
        // So sánh sau khi chuẩn hóa
        if (normalizedOptionText === normalizedCardCategory) {
            matchedOptionValue = option.value;
            found = true;
            console.log(`✓ Matched! Value: ${matchedOptionValue}`);
            break;
        }
    }

    if (!found) {
        console.error(`Không tìm thấy danh mục: "${categoryName}"`);
        console.error(`Normalized: "${normalizedCardCategory}"`);
        alert(`Không tìm thấy dịch vụ tương ứng: "${categoryName}"\n\nVui lòng kiểm tra:\n1. Tên danh mục trong HTML (data-category)\n2. Tên danh mục trong database (bảng categories)\n\nChúng phải giống nhau!`);
        return;
    }

    // Set giá trị cho select
    mainService.value = matchedOptionValue;

    // Load dịch vụ con
    mainService.dispatchEvent(new Event("change"));

    // Reset form
    subService.selectedIndex = 0;
    servicePrice.value = "";

    // Mở modal
    bookingModal.show();
});