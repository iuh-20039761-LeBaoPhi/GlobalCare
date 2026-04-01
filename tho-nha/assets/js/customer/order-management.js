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

    var SUBSIDY_RATE = 0.05;
    var currencyFormatter = new Intl.NumberFormat('vi-VN');

    var state = {
        filter: 'all',
        keyword: '',
        selectedOrderId: null
    };

    var profile = store.getCustomerProfile();

    var elements = {
        customerName: document.getElementById('customerName'),
        customerPhone: document.getElementById('customerPhone'),
        customerAddress: document.getElementById('customerAddress'),
        statTotal: document.getElementById('statTotal'),
        statNew: document.getElementById('statNew'),
        statProgress: document.getElementById('statProgress'),
        statDone: document.getElementById('statDone'),
        searchInput: document.getElementById('searchInput'),
        orderBody: document.getElementById('customerOrderBody'),
        mobileList: document.getElementById('customerMobileList'),
        emptyState: document.getElementById('customerEmptyState'),
        refreshBtn: document.getElementById('refreshOrdersBtn'),
        filterButtons: Array.prototype.slice.call(document.querySelectorAll('[data-filter]')),
        detailModal: document.getElementById('orderDetailModal'),
        detailBody: document.getElementById('orderDetailBody'),
        detailCode: document.getElementById('orderDetailCode')
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

    function formatCurrency(value) {
        var amount = Number(value);
        if (!Number.isFinite(amount)) amount = 0;
        return currencyFormatter.format(Math.round(amount)) + ' đ';
    }

    function statusBadge(status) {
        var meta = store.statusMeta[status] || { label: status };
        var cls = STATUS_CLASS_MAP[status] || 'status-new';
        return '<span class="status-badge ' + cls + '">' + escapeHtml(meta.label) + '</span>';
    }

    function providerCell(order) {
        if (!order.provider) {
            return '<span class="provider-pending">Chưa có nhà cung cấp nhận đơn</span>';
        }
        var providerName = order.provider.company || order.provider.name || 'Nhà cung cấp';
        var providerPhone = order.provider.phone ? '<span>' + escapeHtml(order.provider.phone) + '</span>' : '';
        return '<div class="provider-info"><strong>' + escapeHtml(providerName) + '</strong>' + providerPhone + '</div>';
    }

    function providerText(order) {
        if (!order.provider) return 'Chưa có nhà cung cấp nhận đơn';
        var providerName = order.provider.company || order.provider.name || 'Nhà cung cấp';
        var providerPhone = order.provider.phone ? ' - ' + order.provider.phone : '';
        return providerName + providerPhone;
    }

    function getBookingPricing(order) {
        if (typeof store.getBookingPricing !== 'function') return null;
        return store.getBookingPricing(order);
    }

    function moneyOrFree(value) {
        var amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return 'Miễn phí';
        return formatCurrency(amount);
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

    function getPricing(order) {
        if (!order || !order.pricing) return null;

        var quotedCost = Number(order.pricing.quotedCost);
        if (!Number.isFinite(quotedCost) || quotedCost <= 0) return null;

        var subsidyAmount = Number(order.pricing.subsidyAmount);
        if (!Number.isFinite(subsidyAmount) || subsidyAmount < 0) {
            subsidyAmount = Math.round(quotedCost * SUBSIDY_RATE);
        }

        var finalCost = Number(order.pricing.finalCost);
        if (!Number.isFinite(finalCost) || finalCost < 0) {
            finalCost = Math.max(quotedCost - subsidyAmount, 0);
        }

        return {
            quotedCost: quotedCost,
            subsidyAmount: subsidyAmount,
            finalCost: finalCost
        };
    }

    function getPricingSummaryHtml(pricing) {
        return '<div class="pricing-summary">' +
            '<div class="pricing-line"><span>Chi phí báo giá</span><strong>' + formatCurrency(pricing.quotedCost) + '</strong></div>' +
            '<div class="pricing-line pricing-saving"><span>Trợ giá 5%</span><strong>- ' + formatCurrency(pricing.subsidyAmount) + '</strong></div>' +
            '<div class="pricing-line pricing-final"><span>Khách thanh toán</span><strong>' + formatCurrency(pricing.finalCost) + '</strong></div>' +
            '</div>';
    }

    function pricingCell(order) {
        if (order.status !== 'done') {
            return '<span class="pricing-wait">Áp dụng sau khi đơn hoàn thành</span>';
        }

        var pricing = getPricing(order);
        var actionLabel = pricing ? 'Cập nhật chi phí' : 'Nhập chi phí';
        var summary = pricing
            ? getPricingSummaryHtml(pricing)
            : '<span class="pricing-note">Nhập chi phí thợ báo để nhận trợ giá giảm 5%.</span>';

        return '<div class="pricing-box">' +
            summary +
            '<button class="btn-price" type="button" data-action="input-cost" data-id="' + escapeHtml(order.id) + '">' + actionLabel + '</button>' +
            '</div>';
    }

    function pricingMobile(order) {
        if (order.status !== 'done') {
            return '<p class="pricing-wait">Trợ giá sẽ mở khi đơn hoàn thành.</p>';
        }

        var pricing = getPricing(order);
        var actionLabel = pricing ? 'Cập nhật chi phí' : 'Nhập chi phí nhận trợ giá';
        var summary = pricing
            ? getPricingSummaryHtml(pricing)
            : '<span class="pricing-note">Nhập chi phí thợ báo để giảm ngay 5%.</span>';

        return '<div class="pricing-box">' +
            summary +
            '<button class="btn-price" type="button" data-action="input-cost" data-id="' + escapeHtml(order.id) + '">' + actionLabel + '</button>' +
            '</div>';
    }

    function detailRow(label, value) {
        return '<div class="detail-row"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || 'N/A') + '</strong></div>';
    }

    function renderProviderDetail(order) {
        if (!order.provider) {
            return '<p class="detail-note">Chưa có nhà cung cấp nhận thực hiện.</p>';
        }

        return '<div class="detail-grid">' +
            detailRow('Tên đơn vị', order.provider.company || order.provider.name || 'Nhà cung cấp') +
            detailRow('Người phụ trách', order.provider.name || 'N/A') +
            detailRow('Số điện thoại', order.provider.phone || 'N/A') +
            '</div>';
    }

    function getOrderById(orderId) {
        var orders = store.getCustomerOrders(profile.phone);
        return orders.find(function (item) { return item.id === orderId; }) || null;
    }

    function renderOrderDetail(order) {
        if (!elements.detailBody || !elements.detailCode) return;

        var customerName = (order.customer && order.customer.name) || profile.name || 'Khách hàng';
        var customerPhone = (order.customer && order.customer.phone) || profile.phone || 'N/A';
        var updatedAt = order.updatedAt || order.createdAt;
        var noteText = order.note || 'Không có ghi chú';

        elements.detailCode.textContent = order.orderCode || 'Đơn hàng';
        elements.detailBody.innerHTML = '' +
            '<section class="detail-section">' +
                '<h4>Thông tin đơn hàng</h4>' +
                '<div class="detail-grid">' +
                    detailRow('Mã đơn', order.orderCode || 'N/A') +
                    detailRow('Dịch vụ', order.service || 'N/A') +
                    detailRow('Khách hàng', customerName) +
                    detailRow('Số điện thoại', customerPhone) +
                    detailRow('Địa chỉ', order.address || 'N/A') +
                    detailRow('Ngày đặt', formatDateTime(order.createdAt)) +
                    detailRow('Cập nhật gần nhất', formatDateTime(updatedAt)) +
                    '<div class="detail-row detail-status-row"><span>Trạng thái</span>' + statusBadge(order.status) + '</div>' +
                '</div>' +
                '<p class="detail-note">Ghi chú: ' + escapeHtml(noteText) + '</p>' +
            '</section>' +
            '<section class="detail-section">' +
                '<h4>Nhà cung cấp thực hiện</h4>' +
                renderProviderDetail(order) +
            '</section>' +
            '<section class="detail-section">' +
                '<h4>Chi phí theo modal đặt lịch</h4>' +
                bookingCostSummary(order) +
            '</section>' +
            '<section class="detail-section">' +
                '<h4>Trợ giá cho khách hàng</h4>' +
                pricingMobile(order) +
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

    function updateStats(orders) {
        var total = orders.length;
        var waiting = orders.filter(function (item) { return item.status === 'new'; }).length;
        var progress = orders.filter(function (item) { return item.status === 'confirmed' || item.status === 'doing'; }).length;
        var done = orders.filter(function (item) { return item.status === 'done'; }).length;

        elements.statTotal.textContent = String(total);
        elements.statNew.textContent = String(waiting);
        elements.statProgress.textContent = String(progress);
        elements.statDone.textContent = String(done);
    }

    function getFilteredOrders(orders) {
        return orders.filter(function (order) {
            var matchFilter = state.filter === 'all' || order.status === state.filter;
            if (!matchFilter) return false;

            if (!state.keyword) return true;
            var kw = state.keyword.toLowerCase();
            return (
                String(order.orderCode || '').toLowerCase().indexOf(kw) !== -1 ||
                String(order.service || '').toLowerCase().indexOf(kw) !== -1 ||
                String(order.address || '').toLowerCase().indexOf(kw) !== -1
            );
        });
    }

    function renderTable(orders) {
        if (!orders.length) {
            elements.orderBody.innerHTML = '';
            elements.mobileList.innerHTML = '';
            elements.emptyState.hidden = false;
            return;
        }

        elements.emptyState.hidden = true;
        elements.orderBody.innerHTML = orders.map(function (order) {
            return '<tr>' +
                '<td class="mono">' + escapeHtml(order.orderCode) + '</td>' +
                '<td><strong>' + escapeHtml(order.service) + '</strong><span class="sub-note">' + escapeHtml(order.note || 'Không có ghi chú') + '</span></td>' +
                '<td>' + formatDateTime(order.createdAt) + '</td>' +
                '<td>' + statusBadge(order.status) + '</td>' +
                '<td class="detail-cell">' + detailActionButton(order) + '</td>' +
                '</tr>';
        }).join('');

        elements.mobileList.innerHTML = orders.map(function (order) {
            return '' +
                '<article class="mobile-card">' +
                    '<div class="mobile-card-head">' +
                        '<div>' +
                            '<h4 class="mobile-title">' + escapeHtml(order.service) + '</h4>' +
                            '<p class="mobile-code">' + escapeHtml(order.orderCode) + '</p>' +
                        '</div>' +
                        statusBadge(order.status) +
                    '</div>' +
                    '<div class="mobile-row"><span>Ngày đặt</span><strong>' + formatDateTime(order.createdAt) + '</strong></div>' +
                    '<div class="mobile-row"><span>Trạng thái xử lý</span><strong>' + escapeHtml((store.statusMeta[order.status] || {}).label || 'N/A') + '</strong></div>' +
                    '<div class="mobile-actions">' + detailActionButton(order) + '</div>' +
                '</article>';
        }).join('');
    }

    function requestCostInput(orderId) {
        var orders = store.getCustomerOrders(profile.phone);
        var order = orders.find(function (item) { return item.id === orderId; });
        if (!order) {
            alert('Không tìm thấy đơn hàng để cập nhật chi phí.');
            return;
        }

        if (order.status !== 'done') {
            alert('Đơn chưa hoàn thành nên chưa thể nhập chi phí trợ giá.');
            return;
        }

        var currentPricing = getPricing(order);
        var defaultValue = currentPricing ? String(currentPricing.quotedCost) : '';
        var inputValue = window.prompt('Nhập chi phí thợ đã báo giá (VNĐ):', defaultValue);
        if (inputValue === null) return;

        var amountDigits = String(inputValue || '').replace(/\D/g, '');
        if (!amountDigits) {
            alert('Vui lòng nhập chi phí hợp lệ.');
            return;
        }

        var result = store.updateOrderPricing(orderId, Number(amountDigits), profile.phone);
        if (!result.ok) {
            alert(result.message || 'Không thể cập nhật chi phí. Vui lòng thử lại.');
            return;
        }

        render();
    }

    function render() {
        var orders = store.getCustomerOrders(profile.phone);
        updateStats(orders);
        renderTable(getFilteredOrders(orders));

        if (state.selectedOrderId) {
            var selectedOrder = orders.find(function (item) { return item.id === state.selectedOrderId; });
            if (!selectedOrder) {
                closeOrderDetail();
            } else {
                renderOrderDetail(selectedOrder);
            }
        }
    }

    function applyFilterButtonStyles() {
        elements.filterButtons.forEach(function (button) {
            var active = button.getAttribute('data-filter') === state.filter;
            button.classList.toggle('active', active);
        });
    }

    function bindEvents() {
        elements.searchInput.addEventListener('input', function (event) {
            state.keyword = event.target.value.trim();
            render();
        });

        elements.filterButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                state.filter = button.getAttribute('data-filter') || 'all';
                applyFilterButtonStyles();
                render();
            });
        });

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

            var trigger = event.target.closest('button[data-action="input-cost"][data-id]');
            if (!trigger) return;
            requestCostInput(trigger.getAttribute('data-id'));
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && elements.detailModal && !elements.detailModal.hidden) {
                closeOrderDetail();
            }
        });

        elements.refreshBtn.addEventListener('click', function () {
            render();
        });

        window.addEventListener('thonha:orders-changed', render);
        window.addEventListener('storage', function (event) {
            if (event.key === store.changeKey) render();
        });
    }

    function bindProfile() {
        elements.customerName.textContent = profile.name || 'Khách hàng';
        elements.customerPhone.textContent = profile.phone || 'Chưa cập nhật';
        elements.customerAddress.textContent = profile.address || 'Địa chỉ sẽ hiển thị theo từng đơn hàng';
    }

    bindProfile();
    applyFilterButtonStyles();
    bindEvents();
    render();
})();