/**
 * booking-detail-shared.js
 * Shared logic for booking flow: pricing, travel fee, media, confirmation, submit, validation.
 */

'use strict';

// true chỉ khi chạy trên XAMPP (port 80), không phải Live Server (5500/5501)
const _BD_IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    && (window.location.port === '' || window.location.port === '80');
// Base path cho fetch — trang pages/public/ dùng '../../', partials/ dùng '../'
const _BD_BASE = window.BD_BASE || '../../';

// Google Apps Script Web App URL — thay bằng URL thật sau khi deploy
const _BD_GSHEET_URL = window.GSHEET_URL || 'https://script.google.com/macros/s/AKfycbx8J5infIIqf-VOFCNq89L7W1xRfluTU0Dt4R8Vijl81zhid59aql3vURdT01dwaaKgPQ/exec';

// ===================================================================
// GOOGLE SHEETS — fire-and-forget
// ===================================================================
function _bdSendToSheet(pendingData, orderCode) {
    if (!_BD_GSHEET_URL) return;
    const now = new Date();
    const created_at = now.toLocaleString('vi-VN', { hour12: false });
    const surveyAmt = (_bdCurSurvey && _bdCurSurvey.required) ? (_bdCurSurvey.amount || 0) : 0;
    const travelAmt = _bdTravelAmt || 0;
    const basePrice = _bdCurPrice  || 0;
    const payload = {
        order_code:       orderCode || '',
        name:             pendingData.name            || '',
        phone:            pendingData.phone           || '',
        service:          pendingData.service_id      || '',
        address:          pendingData.address         || '',
        note:             pendingData.note            || '',
        selected_brand:   pendingData.selected_brand  || '',
        estimated_price:  basePrice,
        travel_fee:       travelAmt,
        inspection_fee:   surveyAmt,
        total_price:      basePrice + travelAmt,
        status:           'new',
        created_at,
    };
    fetch(_BD_GSHEET_URL, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload),
    }).catch(() => {}); // bỏ qua lỗi, không ảnh hưởng UX
}

// ===================================================================
// SHARED: FORMAT + PRICING
// ===================================================================
function _bdFmt(n) {
    return Number(n).toLocaleString('vi-VN') + 'đ';
}

function _bdCalcPricing(basePrice, travelAmt, surveyFee) {
    const t    = travelAmt || 0;
    const survey = (surveyFee && surveyFee.required) ? (surveyFee.amount || 0) : 0;
    return {
        travel: t, survey,
        total:       basePrice + t,
        noRepair:    t + survey,
        hasFees: t > 0 || survey > 0
    };
}

// ===================================================================
// TRAVEL FEE — PER KM (OSRM + Nominatim)
// ===================================================================
let _bdTravelCfg      = null;   // per_km config từ services.json
let _bdTravelStatus   = 'na';   // 'na'|'idle'|'loading'|'ok'|'error'
let _bdTravelAmt      = 0;      // phí đã tính (VNĐ)
let _bdTravelDistKm   = 0;      // quãng đường (km)
let _bdTravelTimer    = null;   // debounce handle
let _bdCurPrice       = 0;      // giá dịch vụ hiện tại (để refresh)
let _bdCurSurvey      = null;   // survey fee hiện tại (để refresh)
let _bdPendingCoords  = null;   // tọa độ chờ nếu user chọn map trước khi chọn dịch vụ

async function _bdGeocode(address) {
    const url = 'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({ q: address + ', TP.HCM, Việt Nam', format: 'json', limit: 1, countrycodes: 'vn' });
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
    const arr = await res.json();
    if (!arr.length) return null;
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
}

async function _bdRoadDist(pLat, pLng, cLat, cLng) {
    // OSRM dùng lng,lat (không phải lat,lng)
    const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${cLng},${cLat}?overview=false`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    return data.routes[0].distance / 1000; // meters → km
}

function _bdFeeFromDist(km, cfg) {
    let fee = Math.round(km * cfg.pricePerKm / 1000) * 1000; // làm tròn 1,000đ
    if (cfg.minFee) fee = Math.max(fee, cfg.minFee);
    if (cfg.maxFee) fee = Math.min(fee, cfg.maxFee);
    return fee;
}

function _bdRefreshBreakdown() {
    _bdUpdateBreakdown(_bdCurPrice, _bdTravelCfg, _bdCurSurvey);
}

function _bdStartTravelCalc() {
    if (!_bdTravelCfg || _bdTravelCfg.mode !== 'per_km') return;
    clearTimeout(_bdTravelTimer);
    const addr = document.getElementById('diachi')?.value?.trim();
    if (!addr) {
        _bdTravelStatus = 'idle'; _bdTravelAmt = 0; _bdTravelDistKm = 0;
        _bdRefreshBreakdown(); return;
    }
    _bdTravelStatus = 'loading';
    _bdRefreshBreakdown();
    _bdTravelTimer = setTimeout(_bdDoTravelCalc, 800);
}

async function _bdDoTravelCalc() {
    if (!_bdTravelCfg) return;
    const addr = document.getElementById('diachi')?.value?.trim();
    if (!addr) { _bdTravelStatus = 'idle'; _bdRefreshBreakdown(); return; }
    try {
        const c = await _bdGeocode(addr);
        if (!c) throw new Error('geocode');
        const km = await _bdRoadDist(_bdTravelCfg.providerLat, _bdTravelCfg.providerLng, c.lat, c.lng);
        if (km === null) throw new Error('route');
        _bdTravelDistKm = km;
        _bdTravelAmt    = _bdFeeFromDist(km, _bdTravelCfg);
        _bdTravelStatus = 'ok';
    } catch {
        _bdTravelStatus = 'error';
    }
    _bdRefreshBreakdown();
}

// Gọi trực tiếp từ map-picker khi đã có tọa độ — bỏ qua geocoding
async function _bdTravelFromCoords(lat, lng) {
    // Lưu tọa độ để dùng khi dịch vụ được chọn sau
    _bdPendingCoords = { lat, lng };
    if (!_bdTravelCfg || _bdTravelCfg.mode !== 'per_km') return;
    clearTimeout(_bdTravelTimer); // huỷ debounce đang chờ
    _bdTravelStatus = 'loading';
    _bdRefreshBreakdown();
    try {
        const km = await _bdRoadDist(_bdTravelCfg.providerLat, _bdTravelCfg.providerLng, lat, lng);
        if (km === null) throw new Error('route');
        _bdTravelDistKm = km;
        _bdTravelAmt    = _bdFeeFromDist(km, _bdTravelCfg);
        _bdTravelStatus = 'ok';
    } catch {
        _bdTravelStatus = 'error';
    }
    _bdRefreshBreakdown();
}

// Gọi khi chọn dịch vụ mới — lưu state và render
function _bdSetBreakdown(price, travelFee, surveyFee) {
    _bdCurPrice  = price || 0;
    _bdCurSurvey = surveyFee || null;
    const isPerKm = travelFee && travelFee.mode === 'per_km';
    _bdTravelCfg    = isPerKm ? travelFee : null;
    _bdTravelStatus = isPerKm ? 'idle' : 'na';
    _bdTravelAmt    = 0; _bdTravelDistKm = 0;
    clearTimeout(_bdTravelTimer);
    _bdUpdateBreakdown(price, travelFee, surveyFee);
    // Nếu đã có tọa độ từ map picker → tính ngay (bỏ qua geocode)
    if (isPerKm && _bdPendingCoords) {
        _bdTravelFromCoords(_bdPendingCoords.lat, _bdPendingCoords.lng);
    } else {
        // Nếu đã có địa chỉ nhập tay → tính ngay
        const addr = document.getElementById('diachi')?.value?.trim();
        if (isPerKm && addr) _bdStartTravelCalc();
    }
}

// Gắn listener địa chỉ — gọi 1 lần sau khi form có trong DOM
function _bdSetupAddressListener() {
    const addrEl = document.getElementById('diachi');
    if (!addrEl || addrEl._bdListened) return;
    addrEl._bdListened = true;
    addrEl.addEventListener('input', _bdStartTravelCalc);
}

// Dùng chung cho cả modal và standalone (cùng ID trong DOM)
function _bdUpdateBreakdown(price, travelFee, surveyFee) {
    const wrap = document.getElementById('pricingBreakdownWrap');
    if (!wrap) return;

    const isPerKm = travelFee && travelFee.mode === 'per_km';
    // Với per_km, dùng _bdTravelAmt nếu đã tính xong
    const tAmt = isPerKm ? (_bdTravelStatus === 'ok' ? _bdTravelAmt : 0) : null;
    const effectiveTf = isPerKm ? null : travelFee; // fixed mode: dùng min/max gốc

    // Tính phí fixed
    const tFixed = effectiveTf ? (effectiveTf.min ?? effectiveTf.fixedAmount ?? 0) : 0;
    const survey  = (surveyFee && surveyFee.required) ? (surveyFee.amount || 0) : 0;

    const travelAmt = isPerKm ? tAmt : tFixed;
    const p = _bdCalcPricing(price, travelAmt, surveyFee);

    // Ẩn box nếu fixed và không có phí
    if (!isPerKm && !p.hasFees) { wrap.style.display = 'none'; return; }

    const bdService   = document.getElementById('bd-service');
    const bdTravelRow = document.getElementById('bd-travel-row');
    const bdTravel    = document.getElementById('bd-travel');
    const bdTotal     = document.getElementById('bd-total');

    if (bdService) bdService.textContent = price > 0 ? _bdFmt(price) : 'Miễn phí';

    // Hàng phí di chuyển
    if (isPerKm) {
        if (bdTravelRow) bdTravelRow.style.removeProperty('display');
        if (bdTravel) {
            if (_bdTravelStatus === 'loading') {
                bdTravel.innerHTML = '<span class="spinner-border spinner-border-sm me-1" style="width:11px;height:11px;border-width:2px;vertical-align:middle;"></span><em class="text-muted" style="font-size:0.82rem;">Đang tính...</em>';
            } else if (_bdTravelStatus === 'ok') {
                bdTravel.innerHTML = `${_bdFmt(_bdTravelAmt)} <small class="text-muted">(~${_bdTravelDistKm.toFixed(1)} km)</small>`;
            } else if (_bdTravelStatus === 'error') {
                bdTravel.innerHTML = '<span style="color:#ef4444;font-size:0.82rem;">Không tính được — thử lại sau</span>';
            } else { // idle
                bdTravel.innerHTML = '<em class="text-muted" style="font-size:0.82rem;">Nhập địa chỉ để tính phí</em>';
            }
        }
    } else {
        const tMax = effectiveTf ? (effectiveTf.max ?? effectiveTf.fixedAmount ?? 0) : 0;
        const tMin = effectiveTf ? (effectiveTf.min ?? effectiveTf.fixedAmount ?? 0) : 0;
        if (tMax > 0 && bdTravelRow && bdTravel) {
            bdTravelRow.style.removeProperty('display');
            bdTravel.textContent = tMin === tMax ? _bdFmt(tMin) : `${_bdFmt(tMin)} – ${_bdFmt(tMax)}`;
        } else if (bdTravelRow) {
            bdTravelRow.style.setProperty('display', 'none', 'important');
        }
    }

    // Tổng
    if (bdTotal) {
        if (isPerKm && _bdTravelStatus !== 'ok') {
            const priceLabel = price > 0 ? _bdFmt(price) : 'Miễn phí';
            bdTotal.innerHTML = `${priceLabel} <span style="color:#94a3b8;font-size:0.82rem;">+ phí di chuyển</span>`;
        } else {
            bdTotal.textContent = _bdFmt(p.total);
        }
    }

    // Survey notice
    const bdSurveyNotice   = document.getElementById('bd-survey-notice');
    const bdSurveyTravel   = document.getElementById('bd-survey-travel');
    const bdSurveyAmount   = document.getElementById('bd-survey-amount');
    const bdSurveyNoRepair = document.getElementById('bd-survey-no-repair');

    if (survey > 0 && bdSurveyNotice) {
        const tDisp = isPerKm && _bdTravelStatus === 'ok' ? _bdFmt(_bdTravelAmt) : (isPerKm ? '—' : _bdFmt(tFixed));
        const nr    = isPerKm && _bdTravelStatus === 'ok' ? _bdFmt(_bdTravelAmt + survey) : (isPerKm ? '—' : _bdFmt(tFixed + survey));
        if (bdSurveyTravel)   bdSurveyTravel.textContent   = tDisp;
        if (bdSurveyAmount)   bdSurveyAmount.textContent   = _bdFmt(survey);
        if (bdSurveyNoRepair) bdSurveyNoRepair.textContent = nr;
        bdSurveyNotice.style.display = '';
    } else if (bdSurveyNotice) {
        bdSurveyNotice.style.display = 'none';
    }

    wrap.style.display = '';
}

function _bdHideBreakdown(clearCoords) {
    const wrap = document.getElementById('pricingBreakdownWrap');
    if (wrap) wrap.style.display = 'none';
    _bdTravelCfg = null; _bdTravelStatus = 'na';
    _bdTravelAmt = 0; _bdTravelDistKm = 0;
    if (clearCoords) _bdPendingCoords = null;
    clearTimeout(_bdTravelTimer);
}

function _bdClearBrandSelectorUi() {
    const brandWrap = document.getElementById('brandSelectorWrap');
    const brandBox = document.getElementById('brandOptionsContainer');
    if (brandBox) brandBox.innerHTML = '';
    if (brandWrap) brandWrap.style.display = 'none';
}

// ===================================================================
// SHARED: MEDIA CAPTURE
// ===================================================================
let _bdMediaFiles = [];

function _bdSetupMedia() {
    const photoInput    = document.getElementById('inputhinhanh');
    const videoInput    = document.getElementById('inputvideo');
    const photoBtn      = document.getElementById('btnchuphinh');
    const videoBtn      = document.getElementById('btnquayvideo');
    const photoPreview  = document.getElementById('mediaPhotoPreviewContainer');
    const videoPreview  = document.getElementById('mediaVideoPreviewContainer');
    if (!photoInput || !videoInput) return;

    photoBtn && photoBtn.addEventListener('click', () => photoInput.click());
    videoBtn && videoBtn.addEventListener('click', () => videoInput.click());

    photoInput.addEventListener('change', function () {
        Array.from(this.files).forEach(f => _bdAddMedia(f, photoPreview));
        this.value = '';
    });
    videoInput.addEventListener('change', function () {
        Array.from(this.files).forEach(f => _bdAddMedia(f, videoPreview));
        this.value = '';
    });
}

function _bdAddMedia(file, previewBox) {
    const id = Date.now() + Math.random();
    _bdMediaFiles.push({ id, file });
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid rgba(17,153,142,0.4);';
    wrap.dataset.mediaId = id;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '&times;';
    removeBtn.style.cssText = 'position:absolute;top:2px;right:4px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:12px;line-height:16px;cursor:pointer;padding:0;z-index:1;';
    removeBtn.addEventListener('click', () => { _bdMediaFiles = _bdMediaFiles.filter(m => m.id !== id); wrap.remove(); });
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        img.src = URL.createObjectURL(file);
        wrap.appendChild(img);
    } else {
        const icon = document.createElement('div');
        icon.style.cssText = 'width:100%;height:100%;background:#0f2027;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;';
        icon.innerHTML = `<i class="fas fa-video" style="color:#38ef7d;font-size:1.4rem;"></i><span style="color:#ccc;font-size:0.6rem;text-align:center;padding:0 4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;width:100%;">${file.name}</span>`;
        wrap.appendChild(icon);
    }
    wrap.appendChild(removeBtn);
    if (previewBox) previewBox.appendChild(wrap);
}

function _bdClearMedia() {
    _bdMediaFiles = [];
    const pg = document.getElementById('mediaPhotoPreviewContainer');
    const vg = document.getElementById('mediaVideoPreviewContainer');
    if (pg) pg.innerHTML = '';
    if (vg) vg.innerHTML = '';
}

// ===================================================================
// SHARED: CONFIRM SCREEN — điền dữ liệu vào bảng xác nhận
// ===================================================================
function _bdFillConfirm(name, phone, service, address, noteRaw) {
    // Thông tin khách hàng
    const cfName = document.getElementById('cf-name');
    const cfPhone = document.getElementById('cf-phone');
    const cfAddr = document.getElementById('cf-address');
    const cfSvc = document.getElementById('cf-service');
    const esc = (v) => String(v || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const renderServiceHtml = (raw) => {
        const txt = String(raw || '').trim();
        const m = txt.match(/^(.*)\(([^()]+)\)\s*$/);
        if (!m) return esc(txt);
        const svcName = esc(m[1].trim());
        const brand = esc(m[2].trim());
        return `${svcName} <span class="cfm-svc-brand">${brand}</span>`;
    };
    if (cfName)  cfName.textContent  = name;
    if (cfPhone) cfPhone.textContent = phone;
    if (cfAddr)  cfAddr.textContent  = address;
    if (cfSvc) {
        const parts = service ? service.split(' + ').map(s => s.trim()).filter(Boolean) : [];
        const normalized = parts.length ? parts : (String(service || '').trim() ? [String(service || '').trim()] : []);
        cfSvc.innerHTML = normalized.length
            ? '<ul class="cfm-service-list">' +
                normalized.map((s, i) =>
                    `<li><span class="cfm-svc-num">${i + 1}</span><span>${renderServiceHtml(s)}</span></li>`
                ).join('') + '</ul>'
            : '';
    }

    // Chi phí
    const costSection     = document.getElementById('cf-cost-section');
    const costBaseRow     = document.getElementById('cf-cost-base-row');
    const costTravelRow   = document.getElementById('cf-cost-travel-row');
    const costSurveyRow   = document.getElementById('cf-cost-survey-row');
    const costBase        = document.getElementById('cf-cost-base');
    const costTravel      = document.getElementById('cf-cost-travel');
    const costSurvey      = document.getElementById('cf-cost-survey');
    const costTotal       = document.getElementById('cf-cost-total');
    const costNote        = document.getElementById('cf-cost-note');

    const basePrice = _bdCurPrice || 0;
    const survey    = (_bdCurSurvey && _bdCurSurvey.required) ? (_bdCurSurvey.amount || 0) : 0;
    const isPerKm   = _bdTravelCfg && _bdTravelCfg.mode === 'per_km';
    const travelOk  = isPerKm && _bdTravelStatus === 'ok';

    const shouldShowCostSection = !!costSection && (basePrice > 0 || survey > 0 || isPerKm || (_bdTravelAmt > 0));

    if (shouldShowCostSection && costSection) {
        costSection.style.display = '';

        // Giá dịch vụ
        if (costBase) costBase.textContent = basePrice > 0 ? _bdFmt(basePrice) : 'Miễn phí';

        // Phí di chuyển
        if (costTravelRow && costTravel) {
            if (isPerKm) {
                costTravelRow.style.display = '';
                if (travelOk) {
                    costTravel.innerHTML = `${_bdFmt(_bdTravelAmt)}<span class="cfm-cost-sub">~${_bdTravelDistKm.toFixed(1)} km</span>`;
                } else if (_bdTravelStatus === 'loading') {
                    costTravel.innerHTML = '<em style="color:#94a3b8;font-size:0.82rem;">Đang tính...</em>';
                } else {
                    costTravel.innerHTML = '<em style="color:#94a3b8;font-size:0.82rem;">Chưa xác định</em>';
                }
            } else {
                costTravelRow.style.display = 'none';
            }
        }

        // Phí khảo sát
        if (costSurveyRow && costSurvey) {
            if (survey > 0) {
                costSurveyRow.style.display = '';
                costSurvey.innerHTML = `${_bdFmt(survey)}<span class="cfm-cost-sub">nếu không sửa</span>`;
            } else {
                costSurveyRow.style.display = 'none';
            }
        }

        // Tổng
        if (costTotal) {
            const travel = travelOk ? _bdTravelAmt : 0;
            const total  = basePrice + travel;
            if (isPerKm && !travelOk) {
                const baseLabel = basePrice > 0 ? _bdFmt(basePrice) : 'Miễn phí';
                costTotal.innerHTML = `${baseLabel} <span style="font-size:0.78rem;font-weight:500;color:#94a3b8;">+ phí di chuyển</span>`;
            } else {
                costTotal.textContent = _bdFmt(total);
            }
        }

        // Ghi chú nhỏ
        if (costNote) {
            if (survey > 0) {
                costNote.style.display = '';
                costNote.innerHTML = '<i class="fas fa-info-circle me-1"></i>Phí khảo sát được miễn nếu đồng ý sửa. Giá chính xác xác nhận sau khi thợ khảo sát.';
            } else {
                costNote.style.display = '';
                costNote.innerHTML = '<i class="fas fa-info-circle me-1"></i>Giá chính xác xác nhận sau khi thợ khảo sát thực tế.';
            }
        }
    } else if (costSection) {
        costSection.style.display = 'none';
    }

    // Ghi chú
    const noteRow = document.getElementById('cf-note-row');
    if (noteRaw && noteRow) {
        document.getElementById('cf-note').textContent = noteRaw;
        noteRow.style.display = '';
    } else if (noteRow) {
        noteRow.style.display = 'none';
    }

    // Đính kèm
    const mediaRow = document.getElementById('cf-media-row');
    if (_bdMediaFiles.length > 0 && mediaRow) {
        const imgs  = _bdMediaFiles.filter(m => m.file.type.startsWith('image/')).length;
        const vids  = _bdMediaFiles.filter(m => m.file.type.startsWith('video/')).length;
        const parts = [];
        if (imgs > 0) parts.push(`${imgs} ảnh`);
        if (vids > 0) parts.push(`${vids} video`);
        document.getElementById('cf-media').textContent = parts.join(', ');
        mediaRow.style.display = '';
    } else if (mediaRow) {
        mediaRow.style.display = 'none';
    }
}

// ===================================================================
// SHARED: API SUBMIT
// ===================================================================
async function _bdSubmitApi(pendingData, submitBtn, onSuccess) {
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';
    const resetBtn = () => {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i> Xác nhận';
    };

    try {
        const res  = await fetch(_BD_BASE + 'api/public/book.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingData)
        });
        const data = await res.json();
        if (data.status === 'success') {
            _bdSendToSheet(pendingData, data.order_code);
            onSuccess(data.order_code || null);
        } else {
            if (_BD_IS_LOCAL) {
                alert('❌ ' + (data.message || 'Có lỗi xảy ra, vui lòng thử lại!'));
                resetBtn();
            } else {
                onSuccess(null);
            }
        }
    } catch {
        if (_BD_IS_LOCAL) {
            alert('❌ Không thể kết nối server. Vui lòng thử lại sau!');
            resetBtn();
        } else {
            _bdSendToSheet(pendingData, 'TN' + Date.now());
            alert('✅ Đặt lịch thành công!\nChúng tôi sẽ liên hệ lại trong thời gian sớm nhất.\n\n📞 Hotline: 0775 472 347');
            onSuccess(null);
        }
    }
}

// ===================================================================
// SHARED: BUILD PENDING DATA từ form
// ===================================================================
function _bdBuildPendingData(service) {
    let noteVal = (document.getElementById('ghichu')?.value || '').trim();
    if (_bdMediaFiles.length > 0) {
        const imgs  = _bdMediaFiles.filter(m => m.file.type.startsWith('image/')).length;
        const vids  = _bdMediaFiles.filter(m => m.file.type.startsWith('video/')).length;
        const parts = [];
        if (imgs > 0) parts.push(`${imgs} ảnh`);
        if (vids > 0) parts.push(`${vids} video`);
        noteVal = (noteVal ? noteVal + '\n' : '') + `[Đính kèm: ${parts.join(', ')}]`;
    }
    const priceRaw = Number((document.getElementById('giadichvu')?.value || '').replace(/[^\d]/g, '')) || 0;

    const brandSelections = (service || '')
        .split(' + ')
        .map(s => s.trim())
        .filter(Boolean)
        .map((s) => {
            const m = s.match(/^(.*)\(([^()]+)\)\s*$/);
            if (!m) return null;
            return { service: m[1].trim(), brand: m[2].trim() };
        })
        .filter(Boolean);

    let selectedBrandPayload = null;
    if (brandSelections.length === 1) {
        selectedBrandPayload = brandSelections[0].brand;
    } else if (brandSelections.length > 1) {
        selectedBrandPayload = brandSelections
            .map(b => `${b.service}: ${b.brand}`)
            .join(' | ');
    }

    if (!selectedBrandPayload) {
        const activeBrand = document.querySelector('#bookingModal .brand-option.active, .booking-form-section .brand-option.active');
        selectedBrandPayload = activeBrand ? activeBrand.dataset.brand : null;
    }

    return {
        name:            (document.getElementById('hoten')?.value  || '').trim(),
        phone:           (document.getElementById('sodienthoai')?.value || '').trim(),
        service_id:      service,
        address:         (document.getElementById('diachi')?.value || '').trim(),
        note:            noteVal,
        selected_brand:  selectedBrandPayload,
        estimated_price: priceRaw
    };
}

// ===================================================================
// SHARED: VALIDATE COMMON FIELDS (name, phone, address)
// ===================================================================
function _bdValidateCommon(data) {
    if (!data.name || !data.phone || !data.service_id || !data.address) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return false;
    }
    if (!/^(0|\+84)[0-9]{9}$/.test(data.phone)) {
        alert('Số điện thoại không hợp lệ!');
        return false;
    }
    return true;
}


// ===================================================================
// SHARED: BUILD MULTI-SELECT SUB-SERVICE BUTTONS
// container   — DOM element để render buttons vào
// hiddenEl    — input[type=hidden] lưu giá trị đã chọn (joined bởi " + ")
// items       — mảng items từ services.json
// catData     — category object (để lấy travelFee fallback)
// countEl     — (tuỳ chọn) badge hiển thị số lượng đã chọn
// priceEl     — (tuỳ chọn) input hiển thị giá tham khảo
// ===================================================================
function _bdBuildSubBtns(container, hiddenEl, items, catData, countEl, priceEl) {
    container.innerHTML = '';
    if (hiddenEl) hiddenEl.value = '';
    if (countEl)  { countEl.textContent = ''; countEl.style.display = 'none'; }
    if (priceEl)  priceEl.value = '';
    _bdHideBreakdown();
    _bdClearBrandSelectorUi();

    const brandWrap = document.getElementById('brandSelectorWrap');
    const brandBox = document.getElementById('brandOptionsContainer');

    let selectedItems = [];
    let selectedBrands = Object.create(null);

    function _trimRemovedBrandSelections() {
        const selectedNames = new Set(selectedItems.map(i => i.name));
        Object.keys(selectedBrands).forEach((svcName) => {
            if (!selectedNames.has(svcName)) delete selectedBrands[svcName];
        });
    }

    function _serviceLabel(item) {
        const brand = selectedBrands[item.name];
        if (brand && brand.name) return `${item.name} (${brand.name})`;
        return item.name;
    }

    function _effectiveItemPrice(item) {
        const selected = selectedBrands[item.name];
        if (selected && Number.isFinite(selected.price)) return selected.price;
        return item.price || 0;
    }

    function _renderBrandSelectors() {
        if (!brandWrap || !brandBox) return;

        _trimRemovedBrandSelections();
        brandBox.innerHTML = '';

        const brandedItems = selectedItems.filter(item => Array.isArray(item.brandPrices) && item.brandPrices.length > 0);
        if (brandedItems.length === 0) {
            brandWrap.style.display = 'none';
            return;
        }

        const frag = document.createDocumentFragment();

        brandedItems.forEach((item) => {
            if (!selectedBrands[item.name] && item.brandPrices.length > 0) {
                const firstBrand = item.brandPrices[0];
                const firstPrice = Number(firstBrand.price);
                selectedBrands[item.name] = {
                    name: firstBrand.name || '',
                    price: Number.isFinite(firstPrice) ? firstPrice : (item.price || 0)
                };
            }

            const group = document.createElement('div');
            group.className = 'brand-service-group';

            const title = document.createElement('div');
            title.className = 'brand-service-title';
            title.textContent = item.name;
            group.appendChild(title);

            const options = document.createElement('div');
            options.className = 'brand-options';

            const activeBrand = selectedBrands[item.name]?.name || '';

            item.brandPrices.forEach((brand) => {
                const brandPrice = Number(brand.price);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'brand-option';
                btn.dataset.serviceName = item.name;
                btn.dataset.brand = brand.name || '';
                if (Number.isFinite(brandPrice)) btn.dataset.price = String(brandPrice);

                if (activeBrand && activeBrand === (brand.name || '')) {
                    btn.classList.add('active');
                }

                btn.textContent = brand.name || 'Khác';
                if (Number.isFinite(brandPrice)) {
                    const priceTag = document.createElement('small');
                    priceTag.className = 'brand-option-price';
                    priceTag.textContent = ' - ' + brandPrice.toLocaleString('vi-VN') + 'đ';
                    btn.appendChild(priceTag);
                }

                btn.addEventListener('click', () => {
                    selectedBrands[item.name] = {
                        name: brand.name || '',
                        price: Number.isFinite(brandPrice) ? brandPrice : (item.price || 0)
                    };
                    _sync();
                });

                options.appendChild(btn);
            });

            group.appendChild(options);
            frag.appendChild(group);
        });

        brandBox.appendChild(frag);
        brandWrap.style.display = '';
    }

    function _sync() {
        _renderBrandSelectors();

        // Cập nhật hidden input
        if (hiddenEl) hiddenEl.value = selectedItems.map(_serviceLabel).join(' + ');

        // Cập nhật badge đếm
        if (countEl) {
            if (selectedItems.length > 0) {
                countEl.textContent = selectedItems.length + ' đã chọn';
                countEl.style.display = '';
            } else {
                countEl.style.display = 'none';
            }
        }

        // Cập nhật giá + breakdown
        if (selectedItems.length === 0) {
            if (priceEl) priceEl.value = '';
            _bdHideBreakdown();
            return;
        }

        const totalPrice = selectedItems.reduce((s, i) => s + _effectiveItemPrice(i), 0);
        if (priceEl) {
            if (totalPrice === 0) {
                priceEl.value = 'Miễn phí dịch vụ (chỉ tính phí di chuyển)';
            } else {
                priceEl.value = Number(totalPrice).toLocaleString('vi-VN') + 'đ';
            }
        }
        const travelFee  = selectedItems[0].travelFee || catData.travelFee || null;
        const surveyItem = selectedItems.find(i => i.surveyFee);
        const surveyFee  = surveyItem ? surveyItem.surveyFee : null;
        _bdSetBreakdown(totalPrice, travelFee, surveyFee);
    }

    items.forEach(item => {
        const isSurvey = !!item.isSurveyOnly;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sub-service-btn' + (isSurvey ? ' sub-service-btn--survey' : '');
        btn.dataset.itemName = item.name;

        if (isSurvey) {
            btn.innerHTML = `${item.name} <small style="opacity:0.75;font-size:0.78em;">(phí di chuyển + khảo sát)</small>`;
        } else {
            btn.textContent = item.name + (item.price ? ` – ${Number(item.price).toLocaleString('vi-VN')}đ` : '');
        }

        btn.addEventListener('click', () => {
            if (selectedItems.includes(item)) {
                selectedItems = selectedItems.filter(i => i !== item);
                btn.classList.remove('active');
            } else {
                selectedItems.push(item);
                btn.classList.add('active');
            }
            _sync();
        });

        container.appendChild(btn);
    });
}

