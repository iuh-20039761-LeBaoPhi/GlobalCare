'use strict';
/**
 * booking-panel.js
 * Mở Bootstrap Modal chứa form đặt lịch (jQuery .load từ partials/dat-lich.html).
 *
 * - Tạo modal HTML vào DOM tự động
 * - Intercept click .booking-btn (capture phase) → jQuery load form → show modal
 * - Modal to + fullscreen trên mobile
 * - Bỏ qua khi đang ở trang dat-lich-standalone
 * - Tự load jQuery nếu chưa có
 */
(function () {

    if (document.body.classList.contains('dat-lich-standalone')) return;

    /* ------------------------------------------------------------------ */
    /*  State                                                               */
    /* ------------------------------------------------------------------ */
    var _ready        = false;
    var _loaded       = false;
    var _initialized  = false;
    var _pendingClick = null;
    var _services     = null; // cache services.json

    /* ------------------------------------------------------------------ */
    /*  CSS bổ sung                                                         */
    /* ------------------------------------------------------------------ */
    var CSS = [
        /* Modal body: padding 0, scroll trong modal */
        '#bpModal .modal-body{padding:0;overflow-x:hidden}',

        /* Loading spinner */
        '#bpLoading{display:flex;flex-direction:column;align-items:center;',
        'justify-content:center;padding:48px 24px;gap:14px;color:#11998e}',
        '#bpLoading span{font-size:.88rem;color:#64748b}',

        /* Bo góc modal content */
        '#bpModal .modal-content{border-radius:18px!important;overflow:hidden}',

        /* Mobile: modal nhỏ gọn, không fullscreen */
        '@media(max-width:575.98px){',
        '#bpModal .modal-dialog{',
        'margin:16px auto!important;',
        'max-width:92vw!important;width:92vw!important;',
        'max-height:82dvh!important}',
        '#bpModal .modal-content{',
        'max-height:82dvh!important;border-radius:18px!important}',
        '#bpModal .modal-body{',
        'max-height:calc(82dvh - 58px)!important;overflow-y:auto!important}',
        '}',

        /* Desktop */
        '@media(min-width:576px){',
        '#bpModal .modal-dialog{max-width:min(680px,94vw)}',
        '}'
    ].join('');

    /* ------------------------------------------------------------------ */
    /*  Tạo Bootstrap Modal HTML                                            */
    /* ------------------------------------------------------------------ */
    function _createModal() {
        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var base = window.BD_BASE || '../../';
        var logoL = base + 'assets/images/logo-dich-vu-quanh-ta.jpg';
        var logoR = base + 'assets/images/tho-nha-logo-thuong-hieu-cropped.jpg';

        var wrapper = document.createElement('div');
        wrapper.innerHTML = [
            '<div class="modal fade" id="bpModal" tabindex="-1" aria-labelledby="bpModalTitle" aria-hidden="true">',
            '  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">',
            '    <div class="modal-content">',
            '      <div class="modal-header bk-modal-header">',
            '        <div class="bk-header-spacer"></div>',
            '        <div class="bk-header-center">',
            '          <img src="' + logoL + '" alt="Dịch Vụ Quanh Ta" class="bk-header-logo">',
            '          <h5 class="modal-title fw-bold mb-0" id="bpModalTitle">',
            '            <i class="fas fa-calendar-check me-1" style="color:var(--primary);"></i>',
            '            Đặt Lịch Dịch Vụ',
            '          </h5>',
            '          <img src="' + logoR + '" alt="Thợ Nhà" class="bk-header-logo">',
            '        </div>',
            '        <button type="button" class="btn-close bk-header-close" data-bs-dismiss="modal" aria-label="Đóng"></button>',
            '      </div>',
            '      <div class="modal-body" id="bpModalBody"></div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(wrapper.firstElementChild);

        _ready = true;

        if (_pendingClick !== null) {
            _openModal(_pendingClick);
            _pendingClick = null;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Mở modal                                                           */
    /* ------------------------------------------------------------------ */
    function _openModal(serviceName) {
        var modalEl = document.getElementById('bpModal');
        if (!modalEl) return;

        // Show Bootstrap Modal
        var bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl, { backdrop: true, keyboard: true });
        bsModal.show();

        if (!_loaded) {
            _loadContent(serviceName);
        } else {
            _initForm(serviceName); // prefill nếu đã loaded
        }
    }

    /* ------------------------------------------------------------------ */
    /*  jQuery .load() nội dung form từ dat-lich.html                      */
    /* ------------------------------------------------------------------ */
    function _loadContent(serviceName) {
        var base = window.BD_BASE || '../../';
        var url  = base + 'partials/dat-lich.html';
        var $body = jQuery('#bpModalBody');

        $body.html(
            '<div id="bpLoading">' +
            '<div class="spinner-border" style="color:#11998e;width:2.2rem;height:2.2rem;"></div>' +
            '<span>Đang tải form đặt lịch...</span>' +
            '</div>'
        );

        // Load chỉ phần .modal-body của dat-lich.html (form + confirm, không header/footer)
        $body.load(url + ' #bookingModal .modal-body', function (_response, status) {
            if (status === 'error') {
                $body.html(
                    '<p class="text-danger p-4">' +
                    '<i class="fas fa-exclamation-triangle me-2"></i>' +
                    'Không thể tải form đặt lịch. Vui lòng thử lại.' +
                    '</p>'
                );
                return;
            }
            _loaded = true;
            _ensureMap(function () {
                _initForm(serviceName);
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Đảm bảo Leaflet + mapPicker đã load                               */
    /* ------------------------------------------------------------------ */
    function _ensureMap(callback) {
        var base = window.BD_BASE || '../../';

        function tryMapPicker() {
            if (window.mapPicker) { callback(); return; }
            var s = document.createElement('script');
            s.src = base + 'assets/js/public/map-picker.js';
            s.onload  = callback;
            s.onerror = callback;
            document.head.appendChild(s);
        }

        if (!window.L) {
            if (!document.querySelector('link[href*="leaflet"]')) {
                var lnk = document.createElement('link');
                lnk.rel  = 'stylesheet';
                lnk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(lnk);
            }
            var s = document.createElement('script');
            s.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s.onload  = tryMapPicker;
            s.onerror = callback;
            document.head.appendChild(s);
        } else {
            tryMapPicker();
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Prefill dịch vụ vào form                                           */
    /* ------------------------------------------------------------------ */
    function _prefillServiceInForm(name) {
        if (!name) return;
        var base = window.BD_BASE || '../../';

        function doFetch(cb) {
            if (_services) { cb(_services); return; }
            fetch(base + 'data/services.json')
                .then(function (r) { return r.json(); })
                .then(function (data) { _services = data; cb(data); })
                .catch(function () {});
        }

        // Đợi dropdown #mainService được populate (polling tối đa 2s)
        var attempts = 0;
        var timer = setInterval(function () {
            var mainSel = document.getElementById('mainService');
            if (!mainSel || (mainSel.options.length <= 1 && attempts++ < 20)) return;
            clearInterval(timer);
            if (!mainSel || mainSel.options.length <= 1) return;

            doFetch(function (services) {
                var nameLower = name.toLowerCase();

                // 1) Khớp tên CATEGORY (case-insensitive) → chọn category, không chọn sub
                for (var i = 0; i < services.length; i++) {
                    if (services[i].name.toLowerCase() === nameLower) {
                        mainSel.value = services[i].id;
                        mainSel.dispatchEvent(new Event('change'));
                        return;
                    }
                }

                // 2) Khớp tên SUB-SERVICE → chọn category + click sub-service button
                for (var i = 0; i < services.length; i++) {
                    var cat = services[i];
                    for (var j = 0; j < cat.items.length; j++) {
                        if (cat.items[j].name.toLowerCase() === nameLower) {
                            mainSel.value = cat.id;
                            mainSel.dispatchEvent(new Event('change'));
                            var itemName = cat.items[j].name;
                            setTimeout(function () {
                                var subBtns = document.getElementById('subServiceBtns');
                                if (!subBtns) return;
                                var btns = subBtns.querySelectorAll('.sub-service-btn');
                                for (var k = 0; k < btns.length; k++) {
                                    if (btns[k].textContent.trim().startsWith(itemName)) {
                                        btns[k].click();
                                        break;
                                    }
                                }
                            }, 80);
                            return;
                        }
                    }
                }
            });
        }, 100);
    }

    /* ------------------------------------------------------------------ */
    /*  Khởi tạo form (gọi booking-detail.js standalone handler)           */
    /* ------------------------------------------------------------------ */
    function _initForm(serviceName) {
        if (_initialized) {
            // Form đã init, chỉ prefill lại nếu có service
            if (serviceName) _prefillServiceInForm(serviceName);
            return;
        }
        _initialized = true;

        if (typeof _bdInitStandalone === 'function') {
            _bdInitStandalone();
        }

        // Prefill sau khi _bdLoadStandaloneServices chạy xong
        if (serviceName) _prefillServiceInForm(serviceName);

        // Khi modal đóng: reset form về trạng thái ban đầu
        var modalEl = document.getElementById('bpModal');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', function () {
                var form = document.getElementById('bookingForm');
                var confirm = document.getElementById('bookingConfirm');
                if (form) { form.reset(); form.style.display = ''; }
                if (confirm) confirm.style.display = 'none';
                if (typeof _bdHideBreakdown === 'function') _bdHideBreakdown(true);
                if (typeof _bdClearMedia === 'function') _bdClearMedia();
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Intercept .booking-btn click — CAPTURE PHASE                       */
    /* ------------------------------------------------------------------ */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.booking-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopImmediatePropagation(); // ngăn booking-detail.js mở modal cũ

        var serviceName = btn.getAttribute('data-service-name') || '';

        if (_ready) {
            _openModal(serviceName);
        } else {
            _pendingClick = serviceName;
        }
    }, true /* capture phase */);

    /* ------------------------------------------------------------------ */
    /*  Bootstrap: load jQuery nếu chưa có, rồi tạo modal                 */
    /* ------------------------------------------------------------------ */
    function _boot() {
        if (typeof jQuery !== 'undefined') {
            _createModal();
        } else {
            var jq = document.createElement('script');
            jq.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
            jq.onload = _createModal;
            document.head.appendChild(jq);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _boot);
    } else {
        _boot();
    }

})();
