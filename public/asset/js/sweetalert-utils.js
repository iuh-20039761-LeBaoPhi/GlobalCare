/**
 * Shared SweetAlert2 Utility Functions
 */

function showSuccess(message = 'Thành công!', title = 'OK') {
  if (typeof Swal === 'undefined') {
    alert(message);
    return;
  }
  return Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#3085d6'
  });
}

function showError(message = 'Có lỗi xảy ra!', title = 'Lỗi') {
  if (typeof Swal === 'undefined') {
    alert(message);
    return;
  }
  return Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#d33'
  });
}

function showWarning(message = 'Cảnh báo!', title = 'Chú ý') {
  if (typeof Swal === 'undefined') {
    alert(message);
    return;
  }
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonColor: '#f8bb86'
  });
}

function showInfo(message = 'Thông tin', title = 'Info') {
  if (typeof Swal === 'undefined') {
    alert(message);
    return;
  }
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#3fc3ee'
  });
}

function showConfirm(message = 'Bạn có chắc chắn?', callback, options = {}) {
  if (typeof Swal === 'undefined') {
    if (confirm(message)) {
      callback && callback();
    }
    return;
  }
  
  return Swal.fire({
    title: options.title || 'Xác nhận',
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa',
    confirmButtonText: options.confirmText || 'Đồng ý',
    cancelButtonText: options.cancelText || 'Hủy'
  }).then((result) => {
    if (result.isConfirmed) {
      callback && callback();
    }
  });
}
