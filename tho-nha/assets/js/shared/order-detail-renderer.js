/** ==========================================================================
   THO NHA - PREMIUM ORDER DETAIL RENDERER (v4.0)
   Encapsulates rendering logic for the premium order detail partial.
   Follows Giặt Ủi Nhanh premium style data-binding.
   ========================================================================= */

const ThoNhaOrderDetailRenderer = (() => {
    'use strict';

    const utils = window.ThoNhaOrderViewUtils;
    if (!utils) return console.error('[DetailRenderer] ThoNhaOrderViewUtils missing!');

    /**
     * Map Thợ Nhà order object to Premium View.
     */
    function render(order, role, container) {
        if (!container) return;

        // 1. Binder Map: Tự động điền dữ liệu theo ID
        const bindings = {
            heroOrderCode: '#' + order.orderCode,
            heroServiceName: order.service,
            heroBookingDate: utils.formatDateTime(order.dates.ordered),
            heroServiceFee: utils.formatCurrencyVn(order.estimated_price),
            heroTransportFee: utils.formatCurrencyVn(order._raw.phidichuyen || 0),
            heroPaymentStatus: order.actualCost > 0 ? 'Đã báo giá' : 'Chưa báo giá',
            heroTotalAmount: utils.formatCurrencyVn(order.total_price),
            heroAddress: order.address,
            detailCreatedAt: utils.formatDateTime(order.dates.ordered),
            detailExecutionStart: utils.formatDateTime(order.dates.accepted),
            detailExecutionEnd: utils.formatDateTime(order.dates.completed),
            detailNote: order.note || 'Không có ghi chú.',
            detailCustomerName: order.customer.name,
            detailCustomerPhone: order.customer.phone,
            detailProviderName: order.provider.company || order.provider.name || 'Chưa nhận đơn',
            detailProviderPhone: order.provider.phone || '---'
        };
        Object.entries(bindings).forEach(([id, val]) => setText(container, id, val));

        // 2. Status & Progress Sync
        const badgeNode = container.querySelector('#heroStatusBadge');
        if (badgeNode) badgeNode.innerHTML = utils.buildStatusBadge(order.status);

        const progress = order.progress || 0;
        const progressStr = progress.toFixed(0) + '%';
        ['heroProgressPercent', 'detailProgressText'].forEach(id => setText(container, id, progressStr));
        
        const ring = container.querySelector('#heroProgressRing');
        if (ring) ring.style.background = `conic-gradient(var(--detail-primary) ${progress}%, #e2e8f0 ${progress}%)`;
        
        const bar = container.querySelector('#detailProgressBar');
        if (bar) bar.style.width = progressStr;

        // 3. Render sub-sections
        renderTasks(container, order);
        renderReviews(container, order, role);
        renderActions(container, order, role);
    }

    function renderReviews(container, order, role) {
        const raw = order._raw || {};
        
        // --- Feedback Khách hàng ---
        const custTextEl = container.querySelector('#reviewCustomerText');
        const custHeadEl = container.querySelector('#reviewCustomerText')?.closest('.review-card')?.querySelector('.review-card-head');
        if (custTextEl) {
            if (raw.danhgiakhachhang) {
                custTextEl.innerHTML = `<div>${raw.danhgiakhachhang}</div>`;
                if (raw.hinhanhminhchung_kh) {
                    custTextEl.innerHTML += `<div class="mt-2"><img src="../../uploads/evidence/${raw.hinhanhminhchung_kh}" style="max-width:100%; border-radius:8px; border:1px solid #eee;"></div>`;
                }
                if (custHeadEl) custHeadEl.querySelector('.panel-chip').outerHTML = '<span class="panel-chip success">Đã đánh giá</span>';
            } else if (role === 'customer' && order.status === 'done') {
                custTextEl.innerHTML = `
                    <textarea class="form-control mb-2" id="inputCustFeedback" placeholder="Nhập cảm nhận của bạn về dịch vụ..." rows="3"></textarea>
                    <div class="d-flex gap-2">
                        <input type="file" id="fileCustEvidence" class="form-control form-control-sm" accept="image/*">
                        <button class="btn btn-primary btn-sm" data-action="submit-customer-feedback" data-id="${order.id}">Gửi</button>
                    </div>
                `;
            }
        }

        // --- Feedback NCC ---
        const nccTextEl = container.querySelector('#reviewProviderText');
        const nccHeadEl = container.querySelector('#reviewProviderText')?.closest('.review-card')?.querySelector('.review-card-head');
        if (nccTextEl) {
            if (raw.danhgiancc) {
                nccTextEl.innerHTML = `<div>${raw.danhgiancc}</div>`;
                if (raw.hinhanhminhchung_ncc) {
                    nccTextEl.innerHTML += `<div class="mt-2"><img src="../../uploads/evidence/${raw.hinhanhminhchung_ncc}" style="max-width:100%; border-radius:8px; border:1px solid #eee;"></div>`;
                }
                if (nccHeadEl) nccHeadEl.querySelector('.panel-chip').outerHTML = '<span class="panel-chip success">Đã báo cáo</span>';
            } else if (role === 'provider' && order.status === 'done') {
                nccTextEl.innerHTML = `
                    <textarea class="form-control mb-2" id="inputProviderFeedback" placeholder="Mô tả công việc đã hoàn thành hoặc sự cố..." rows="3"></textarea>
                    <div class="d-flex gap-2">
                        <input type="file" id="fileProviderEvidence" class="form-control form-control-sm" accept="image/*">
                        <button class="btn btn-primary btn-sm" data-action="submit-provider-feedback" data-id="${order.id}">Báo cáo</button>
                    </div>
                `;
            }
        }
    }

    function setText(container, id, value) {
        const node = container.querySelector('#' + id);
        if (node) node.textContent = value || '---';
    }

    function calculateProgress(status) {
        if (status === 'done' || status === 'completed') return 100;
        if (status === 'doing' || status === 'working') return 75;
        if (status === 'confirmed' || status === 'assigned') return 40;
        if (status === 'new') return 10;
        return 0;
    }

    function renderTasks(container, order) {
        const list = container.querySelector('#detailTasksList');
        if (!list) return;

        // Tách dịch vụ từ chuỗi text (ví dụ: "Lát nền gạch - 6.000.000đ + Sơn nhà...")
        const tasks = order.service.split(' + ').map(t => t.trim());
        list.innerHTML = tasks.map((task, idx) => `
            <li class="task-item">
                <span class="task-index">${idx + 1}</span>
                <p class="task-text">${task}</p>
            </li>
        `).join('');
    }

    function renderActions(container, order, role) {
        const area = container.querySelector('#actionArea');
        if (!area) return;

        let html = '';
        if (role === 'customer') {
            // Khách chỉ được hủy khi đơn chưa có thợ nhận
            if (!order.provider.id && order.status === 'new') {
                html = `<button class="btn-cancel" data-action="cancel-order" data-id="${order.id}" data-code="${order.orderCode}">Hủy đơn ngay</button>`;
            } else if (order.status === 'done' && (!order.actualCost || order.actualCost === 0)) {
                html = `
                <div class="pricing-input-box">
                    <div class="pricing-title">
                        <i class="fas fa-gift"></i> NHẬP GIÁ & NHẬN TRỢ GIÁ
                    </div>
                    <div class="pricing-group">
                        <input type="number" id="inputActualPrice" class="pricing-field" placeholder="Giá thực tế đã trả...">
                        <button class="pricing-submit" data-action="submit-actual-price" data-id="${order.id}">Gửi</button>
                    </div>
                    <div class="pricing-tip">
                        Nhận ngay <b>cấp trợ giá 5%</b> cứu cánh túi tiền!
                    </div>
                </div>`;
            }
        } else if (role === 'provider') {
            // Nhà cung cấp: Nhận -> Bắt đầu -> Hoàn thành
            if (!order.provider.id && order.status === 'new') {
                html = `<button class="btn-emerald" data-action="accept-order" data-id="${order.id}"><i class="fas fa-handshake me-2"></i>NHẬN ĐƠN NGAY</button>`;
            } else if (order.status === 'confirmed' || order.status === 'pending') {
                html = `<button class="btn-emerald" style="background:#f59e0b;" data-action="start-order" data-id="${order.id}"><i class="fas fa-play me-2"></i>BẮT ĐẦU LÀM</button>`;
            } else if (order.status === 'doing' || order.status === 'working') {
                html = `<button class="btn-emerald" data-action="complete-order" data-id="${order.id}"><i class="fas fa-check-double me-2"></i>XÁC NHẬN XONG</button>`;
            }
        } else if (role === 'admin') {
            html = `<span class="invoice-status-chip">CHẾ ĐỘ XEM (ADMIN)</span>`;
        }

        area.innerHTML = html;
    }

    return { render };
})();

window.ThoNhaOrderDetailRenderer = ThoNhaOrderDetailRenderer;
