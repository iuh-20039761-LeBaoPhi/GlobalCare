(function () {
    'use strict';

    var store = window.ThoNhaOrderStore;
    if (!store) return;

    var STATUS_CLASS_MAP = {
        new: 'status-new',
        confirmed: 'status-confirmed',
        doing: 'status-doing',
        done: 'status-done',
        cancel: 'status-cancel'
    };

    var currencyFormatter = new Intl.NumberFormat('vi-VN');

    var provider = store.getProviderProfile();

    var state = {
        selectedOrderId: null
    };

    var elements = {
        providerName: document.getElementById('providerName'),
        providerCompany: document.getElementById('providerCompany'),
        providerPhone: document.getElementById('providerPhone'),
        statOpen: document.getElementById('statOpen'),
        statAssigned: document.getElementById('statAssigned'),
        statDoing: document.getElementById('statDoing'),
        statDone: document.getElementById('statDone'),
        openBody: document.getElementById('openRequestBody'),
        openMobileList: document.getElementById('openMobileList'),
        openEmpty: document.getElementById('openEmptyState'),
        assignedBody: document.getElementById('assignedOrderBody'),
        assignedMobileList: document.getElementById('assignedMobileList'),
        assignedEmpty: document.getElementById('assignedEmptyState'),
        refreshBtn: document.getElementById('refreshProviderBtn'),
        detailModal: document.getElementById('providerDetailModal'),
        detailBody: document.getElementById('providerDetailBody'),
        detailCode: document.getElementById('providerDetailCode')
    };

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDateTime(value) {
        if (!value) return 'N/A';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        var dd = String(date.getDate()).padStart(2, '0');
        var mm = String(date.getMonth() + 1).padStart(2, '0');
        var yyyy = date.getFullYear();
        var hh = String(date.getHours()).padStart(2, '0');
        var min = String(date.getMinutes()).padStart(2, '0');
        return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min;
    }

    function statusBadge(status) {
        var meta = store.statusMeta[status] || { label: status };
        var cls = STATUS_CLASS_MAP[status] || 'status-new';
        return '<span class="status-badge ' + cls + '">' + escapeHtml(meta.label) + '</span>';
    }

    function formatCurrency(value) {
        var amount = Number(value);
        if (!Number.isFinite(amount)) amount = 0;
        return currencyFormatter.format(Math.round(amount)) + ' đ';
    }

    function moneyOrFree(value) {
        var amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return 'Miễn phí';
        return formatCurrency(amount);
    }

    function getBookingPricing(order) {
        if (typeof store.getBookingPricing !== 'function') return null;
        return store.getBookingPricing(order);
    }

    function getTravelFeeText(bookingPricing) {
        if (!bookingPricing || !bookingPricing.travel) return 'Không phát sinh';

        var travel = bookingPricing.travel;
        if (travel.mode === 'per_km') {
            if (travel.status === 'ok' && Number.isFinite(Number(travel.amount))) {
                var text = moneyOrFree(travel.amount);
                if (Number.isFinite(Number(travel.distanceKm))) {
                    text += ' (~' + Number(travel.distanceKm).toFixed(1) + ' km)';
                }
                return text;
            }
            if (travel.status === 'loading') return 'Đang tính';
            if (travel.status === 'error') return 'Không tính được';
            return 'Chưa xác định';
        }

        var hasMin = Number.isFinite(Number(travel.min));
        var hasMax = Number.isFinite(Number(travel.max));
        var hasAmount = Number.isFinite(Number(travel.amount));

        if (hasMin && hasMax && Number(travel.min) !== Number(travel.max)) {
            return formatCurrency(travel.min) + ' - ' + formatCurrency(travel.max);
        }
        if (hasAmount) return moneyOrFree(travel.amount);
        if (hasMin) return moneyOrFree(travel.min);
        if (hasMax) return moneyOrFree(travel.max);
        return 'Không phát sinh';
    }

    function bookingLine(label, value, extraClass) {
        var rowClass = extraClass ? 'booking-line ' + extraClass : 'booking-line';
        return '<div class="' + rowClass + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
    }

    function bookingCostSummary(order) {
        var bookingPricing = getBookingPricing(order);
        if (!bookingPricing) {
            return '<span class="booking-missing">Chưa có dữ liệu chi phí từ modal đặt lịch.</span>';
        }

        var survey = bookingPricing.survey || { required: false, amount: 0 };
        var serviceText = bookingPricing.hasServicePrice
            ? moneyOrFree(bookingPricing.servicePrice)
            : 'Chưa cập nhật';
        var travelText = getTravelFeeText(bookingPricing);
        var surveyText = survey.required && Number(survey.amount) > 0
            ? formatCurrency(survey.amount) + ' (nếu không sửa)'
            : 'Không phát sinh';

        var totalText = 'Chưa cập nhật';
        if (bookingPricing.totalPending) {
            totalText = 'Giá dịch vụ + phí di chuyển';
        } else if (Number.isFinite(Number(bookingPricing.totalEstimate))) {
            totalText = moneyOrFree(bookingPricing.totalEstimate);
        }

        var noteHtml = bookingPricing.note
            ? '<p class="booking-note-inline">' + escapeHtml(bookingPricing.note) + '</p>'
            : '';

        return '<div class="booking-breakdown">' +
            bookingLine('Giá dịch vụ', serviceText) +
            bookingLine('Phí di chuyển', travelText) +
            bookingLine('Phí khảo sát', surveyText) +
            bookingLine('Tổng tạm tính', totalText, 'booking-total') +
            noteHtml +
            '</div>';
    }

    function bookingCostCell(order) {
        return bookingCostSummary(order);
    }

    function bookingCostMobile(order) {
        return '<div class="booking-mobile-block">' +
            '<p class="booking-mobile-title">Chi phí theo đặt lịch</p>' +
            bookingCostSummary(order) +
            '</div>';
    }

    function detailActionButton(order) {
        return '<button class="btn-detail" type="button" data-action="view-detail" data-id="' + escapeHtml(order.id) + '">Xem chi tiết</button>';
    }

    function detailRow(label, value) {
        return '<div class="detail-row"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || 'N/A') + '</strong></div>';
    }

    function getOrderActionButton(order) {
        if (order.status === 'new' && !order.provider) {
            return '<button class="btn-action btn-accept" data-action="accept" data-id="' + escapeHtml(order.id) + '">Nhận thực hiện</button>';
        }

        if (!order.provider || order.provider.id !== provider.id) {
            return '<span class="action-done">Đơn đang được nhà cung cấp khác xử lý</span>';
        }

        if (order.status === 'confirmed') {
            return '<button class="btn-action btn-start" data-action="start" data-id="' + escapeHtml(order.id) + '">Bắt đầu làm</button>';
        }

        if (order.status === 'doing') {
            return '<button class="btn-action btn-done" data-action="done" data-id="' + escapeHtml(order.id) + '">Xác nhận xong</button>';
        }

        if (order.status === 'done') {
            return '<span class="action-done">Đơn đã hoàn thành</span>';
        }

        if (order.status === 'cancel') {
            return '<span class="action-done">Đơn đã hủy</span>';
        }

        return '<span class="action-done">Không có thao tác khả dụng</span>';
    }

    function getOrderById(orderId) {
        var openOrders = store.getOpenRequests();
        for (var i = 0; i < openOrders.length; i += 1) {
            if (openOrders[i].id === orderId) return openOrders[i];
        }

        var assignedOrders = store.getProviderOrders(provider.id);
        for (var j = 0; j < assignedOrders.length; j += 1) {
            if (assignedOrders[j].id === orderId) return assignedOrders[j];
        }

        return null;
    }

    function renderProviderInfo(order) {
        if (!order.provider) {
            return '<p class="detail-note">Đơn chưa có nhà cung cấp nhận thực hiện.</p>';
        }

        return '<div class="detail-grid">' +
            detailRow('Tên đơn vị', order.provider.company || order.provider.name || 'Nhà cung cấp') +
            detailRow('Người phụ trách', order.provider.name || 'N/A') +
            detailRow('Số điện thoại', order.provider.phone || 'N/A') +
            '</div>';
    }

    function renderOrderDetail(order) {
        if (!elements.detailBody || !elements.detailCode) return;

        var customerName = order.customer && order.customer.name ? order.customer.name : 'Khách hàng';
        var customerPhone = order.customer && order.customer.phone ? order.customer.phone : 'N/A';
        var updatedAt = order.updatedAt || order.createdAt;
        var noteText = order.note || 'Không có ghi chú';

        elements.detailCode.textContent = order.orderCode || 'Đơn hàng';
        elements.detailBody.innerHTML = '' +
            '<section class="detail-section">' +
                '<h4>Thông tin đơn hàng</h4>' +
                '<div class="detail-grid">' +
                    detailRow('Mã đơn', order.orderCode || 'N/A') +
                    detailRow('Tên khách hàng', customerName) +
                    detailRow('Số điện thoại', customerPhone) +
                    detailRow('Dịch vụ yêu cầu', order.service || 'N/A') +
                    detailRow('Địa chỉ', order.address || 'N/A') +
                    detailRow('Ngày đặt', formatDateTime(order.createdAt)) +
                    detailRow('Cập nhật gần nhất', formatDateTime(updatedAt)) +
                    '<div class="detail-row detail-status-row"><span>Trạng thái</span>' + statusBadge(order.status) + '</div>' +
                '</div>' +
                '<p class="detail-note">Ghi chú: ' + escapeHtml(noteText) + '</p>' +
            '</section>' +
            '<section class="detail-section">' +
                '<h4>Chi phí theo modal đặt lịch</h4>' +
                bookingCostSummary(order) +
            '</section>' +
            '<section class="detail-section">' +
                '<h4>Nhà cung cấp thực hiện</h4>' +
                renderProviderInfo(order) +
            '</section>' +
            '<section class="detail-section">' +
                '<h4>Thao tác xử lý đơn</h4>' +
                '<div class="detail-actions">' + getOrderActionButton(order) + '</div>' +
            '</section>';
    }

    function openOrderDetail(orderId) {
        if (!elements.detailModal) return;
        var order = getOrderById(orderId);
        if (!order) {
            alert('Không tìm thấy đơn hàng. Vui lòng tải lại danh sách.');
            return;
        }

        state.selectedOrderId = orderId;
        renderOrderDetail(order);
        elements.detailModal.hidden = false;
        document.body.classList.add('detail-modal-open');
    }

    function closeOrderDetail() {
        if (!elements.detailModal) return;
        state.selectedOrderId = null;
        elements.detailModal.hidden = true;
        document.body.classList.remove('detail-modal-open');
    }

    function updateStats(openOrders, assignedOrders) {
        var doing = assignedOrders.filter(function (item) {
            return item.status === 'doing' || item.status === 'confirmed';
        }).length;
        var done = assignedOrders.filter(function (item) {
            return item.status === 'done';
        }).length;

        elements.statOpen.textContent = String(openOrders.length);
        elements.statAssigned.textContent = String(assignedOrders.length);
        elements.statDoing.textContent = String(doing);
        elements.statDone.textContent = String(done);
    }

    function renderOpenOrders(openOrders) {
        if (!openOrders.length) {
            elements.openBody.innerHTML = '';
            elements.openMobileList.innerHTML = '';
            elements.openEmpty.hidden = false;
            return;
        }

        elements.openEmpty.hidden = true;
        elements.openBody.innerHTML = openOrders.map(function (order) {
            return '<tr>' +
                '<td class="mono">' + escapeHtml(order.orderCode) + '</td>' +
                '<td><strong>' + escapeHtml(order.customer && order.customer.name) + '</strong><span class="sub-note">' + escapeHtml(order.customer && order.customer.phone) + '</span></td>' +
                '<td><strong>' + escapeHtml(order.service) + '</strong><span class="sub-note">' + escapeHtml(order.address || 'N/A') + '</span></td>' +
                '<td>' + formatDateTime(order.createdAt) + '</td>' +
                '<td>' + statusBadge(order.status) + '</td>' +
                '<td class="detail-cell">' + detailActionButton(order) + '</td>' +
                '</tr>';
        }).join('');

        elements.openMobileList.innerHTML = openOrders.map(function (order) {
            return '' +
                '<article class="mobile-card">' +
                    '<div class="mobile-card-head">' +
                        '<div>' +
                            '<h4 class="mobile-title">' + escapeHtml(order.customer && order.customer.name) + '</h4>' +
                            '<p class="mobile-code">' + escapeHtml(order.orderCode) + '</p>' +
                        '</div>' +
                        statusBadge(order.status) +
                    '</div>' +
                    '<div class="mobile-row"><span>Số điện thoại</span><strong>' + escapeHtml(order.customer && order.customer.phone) + '</strong></div>' +
                    '<div class="mobile-row"><span>Dịch vụ</span><strong>' + escapeHtml(order.service) + '</strong></div>' +
                    '<div class="mobile-row"><span>Ngày đặt</span><strong>' + formatDateTime(order.createdAt) + '</strong></div>' +
                    '<div class="mobile-actions">' + detailActionButton(order) + '</div>' +
                '</article>';
        }).join('');
    }

    function renderAssignedOrders(assignedOrders) {
        if (!assignedOrders.length) {
            elements.assignedBody.innerHTML = '';
            elements.assignedMobileList.innerHTML = '';
            elements.assignedEmpty.hidden = false;
            return;
        }

        elements.assignedEmpty.hidden = true;
        elements.assignedBody.innerHTML = assignedOrders.map(function (order) {
            return '<tr>' +
                '<td class="mono">' + escapeHtml(order.orderCode) + '</td>' +
                '<td><strong>' + escapeHtml(order.customer && order.customer.name) + '</strong><span class="sub-note">' + escapeHtml(order.customer && order.customer.phone) + '</span></td>' +
                '<td>' + escapeHtml(order.service) + '</td>' +
                '<td>' + statusBadge(order.status) + '</td>' +
                '<td class="detail-cell">' + detailActionButton(order) + '</td>' +
                '</tr>';
        }).join('');

        elements.assignedMobileList.innerHTML = assignedOrders.map(function (order) {
            return '' +
                '<article class="mobile-card">' +
                    '<div class="mobile-card-head">' +
                        '<div>' +
                            '<h4 class="mobile-title">' + escapeHtml(order.customer && order.customer.name) + '</h4>' +
                            '<p class="mobile-code">' + escapeHtml(order.orderCode) + '</p>' +
                        '</div>' +
                        statusBadge(order.status) +
                    '</div>' +
                    '<div class="mobile-row"><span>Dịch vụ</span><strong>' + escapeHtml(order.service) + '</strong></div>' +
                    '<div class="mobile-row"><span>SĐT khách</span><strong>' + escapeHtml(order.customer && order.customer.phone) + '</strong></div>' +
                    '<div class="mobile-actions">' + detailActionButton(order) + '</div>' +
                '</article>';
        }).join('');
    }

    function render() {
        var openOrders = store.getOpenRequests();
        var assignedOrders = store.getProviderOrders(provider.id);

        updateStats(openOrders, assignedOrders);
        renderOpenOrders(openOrders);
        renderAssignedOrders(assignedOrders);

        if (state.selectedOrderId) {
            var selectedOrder = getOrderById(state.selectedOrderId);
            if (!selectedOrder) {
                closeOrderDetail();
            } else {
                renderOrderDetail(selectedOrder);
            }
        }
    }

    function handleAction(action, orderId) {
        var result = { ok: false };
        if (action === 'accept') {
            result = store.assignOrder(orderId, provider);
        } else if (action === 'start') {
            result = store.updateOrderStatus(orderId, 'doing', provider.id);
        } else if (action === 'done') {
            result = store.updateOrderStatus(orderId, 'done', provider.id);
        }

        if (!result.ok) {
            alert('Không thể cập nhật đơn. Vui lòng thử lại.');
            return;
        }

        render();
    }

    function bindTableActions() {
        document.addEventListener('click', function (event) {
            var detailTrigger = event.target.closest('button[data-action="view-detail"][data-id]');
            if (detailTrigger) {
                openOrderDetail(detailTrigger.getAttribute('data-id'));
                return;
            }

            var closeTrigger = event.target.closest('button[data-action="close-detail"]');
            if (closeTrigger) {
                closeOrderDetail();
                return;
            }

            var button = event.target.closest('button[data-action][data-id]');
            if (!button) return;

            var action = button.getAttribute('data-action');
            if (action === 'view-detail') return;
            var orderId = button.getAttribute('data-id');
            handleAction(action, orderId);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && elements.detailModal && !elements.detailModal.hidden) {
                closeOrderDetail();
            }
        });
    }

    function bindProviderProfile() {
        elements.providerName.textContent = provider.name || 'Nhà cung cấp';
        elements.providerCompany.textContent = provider.company || 'Đối tác Thợ Nhà';
        elements.providerPhone.textContent = provider.phone || 'Chưa cập nhật';
    }

    function bindEvents() {
        elements.refreshBtn.addEventListener('click', function () {
            render();
        });

        window.addEventListener('thonha:orders-changed', render);
        window.addEventListener('storage', function (event) {
            if (event.key === store.changeKey) render();
        });
    }

    bindProviderProfile();
    bindTableActions();
    bindEvents();
    render();
})();