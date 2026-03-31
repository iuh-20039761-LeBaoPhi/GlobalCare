(function (global) {
    'use strict';

    var ORDER_KEY = 'thonha_orders_v1';
    var CUSTOMER_KEY = 'thonha_customer_profile_v1';
    var PROVIDER_KEY = 'thonha_provider_profile_v1';
    var CHANGE_KEY = 'thonha_orders_changed_at';
    var SUBSIDY_RATE = 0.05;

    var STATUS_META = {
        new: { label: 'Chờ xác nhận' },
        confirmed: { label: 'Đã tiếp nhận' },
        doing: { label: 'Đang thực hiện' },
        done: { label: 'Hoàn thành' },
        cancel: { label: 'Đã hủy' }
    };

    var BOOKING_PRICING_PRESETS = {
        'Sửa máy giặt tại nhà': {
            servicePrice: 420000,
            travel: { mode: 'fixed', status: 'ok', amount: 30000, min: 30000, max: 30000, distanceKm: null },
            survey: { required: false, amount: 0 },
            totalEstimate: 450000,
            totalPending: false,
            note: ''
        },
        'Vệ sinh máy lạnh': {
            servicePrice: 0,
            travel: { mode: 'per_km', status: 'pending', amount: null, min: null, max: null, distanceKm: null },
            survey: { required: true, amount: 120000 },
            totalEstimate: null,
            totalPending: true,
            note: 'Phí khảo sát được miễn nếu đồng ý sửa chữa.'
        },
        'Thông tắc bồn rửa': {
            servicePrice: 250000,
            travel: { mode: 'fixed', status: 'ok', amount: 20000, min: 20000, max: 20000, distanceKm: null },
            survey: { required: false, amount: 0 },
            totalEstimate: 270000,
            totalPending: false,
            note: ''
        },
        'Sửa ổ điện âm tường': {
            servicePrice: 180000,
            travel: { mode: 'per_km', status: 'ok', amount: 40000, min: 40000, max: 40000, distanceKm: 6.3 },
            survey: { required: false, amount: 0 },
            totalEstimate: 220000,
            totalPending: false,
            note: ''
        },
        'Lắp quạt trần': {
            servicePrice: 350000,
            travel: { mode: 'fixed', status: 'ok', amount: 25000, min: 25000, max: 25000, distanceKm: null },
            survey: { required: false, amount: 0 },
            totalEstimate: 375000,
            totalPending: false,
            note: ''
        },
        'Sơn lại phòng ngủ': {
            servicePrice: 1800000,
            travel: { mode: 'fixed', status: 'ok', amount: 50000, min: 50000, max: 50000, distanceKm: null },
            survey: { required: true, amount: 150000 },
            totalEstimate: 1850000,
            totalPending: false,
            note: 'Phí khảo sát được miễn nếu đồng ý sửa chữa.'
        }
    };

    function getPresetBookingPricing(order) {
        var serviceName = String(order && order.service || '').trim();
        if (!serviceName || !BOOKING_PRICING_PRESETS[serviceName]) return null;

        var preset = BOOKING_PRICING_PRESETS[serviceName];
        var travel = preset.travel ? {
            mode: preset.travel.mode,
            status: preset.travel.status,
            amount: preset.travel.amount,
            min: preset.travel.min,
            max: preset.travel.max,
            distanceKm: preset.travel.distanceKm
        } : null;

        return {
            servicePrice: preset.servicePrice,
            hasServicePrice: true,
            travel: travel,
            survey: {
                required: !!(preset.survey && preset.survey.required),
                amount: preset.survey && Number.isFinite(Number(preset.survey.amount)) ? Number(preset.survey.amount) : 0
            },
            totalEstimate: Number.isFinite(Number(preset.totalEstimate)) ? Number(preset.totalEstimate) : null,
            totalPending: !!preset.totalPending,
            note: preset.note || ''
        };
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function toDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function toMoneyNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return Math.round(value);
        }

        var digits = String(value || '').replace(/\D/g, '');
        if (!digits) return 0;
        return Number(digits);
    }

    function toOptionalMoneyNumber(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
            return Math.round(value);
        }

        var digits = String(value).replace(/\D/g, '');
        if (!digits) return null;
        return Number(digits);
    }

    function pickFirstDefined(source, keys) {
        if (!source) return null;
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
                return source[key];
            }
        }
        return null;
    }

    function normalizeTravelPricing(order, bookingPricing) {
        var travelObj = bookingPricing && bookingPricing.travelFee && typeof bookingPricing.travelFee === 'object'
            ? bookingPricing.travelFee
            : null;

        var mode = pickFirstDefined(bookingPricing, ['travelFeeMode', 'travelMode']);
        if (!mode && travelObj) mode = travelObj.mode;
        if (!mode) mode = pickFirstDefined(order, ['travel_fee_mode', 'travelFeeMode', 'travel_mode']);

        var status = pickFirstDefined(bookingPricing, ['travelFeeStatus', 'travelStatus']);
        if (!status && travelObj) status = travelObj.status;
        if (!status) status = pickFirstDefined(order, ['travel_fee_status', 'travelFeeStatus']);

        var amount = toOptionalMoneyNumber(pickFirstDefined(bookingPricing, ['travelFeeAmount', 'travelAmount']));
        if (amount === null && travelObj) amount = toOptionalMoneyNumber(pickFirstDefined(travelObj, ['amount', 'fixedAmount']));
        if (amount === null) amount = toOptionalMoneyNumber(pickFirstDefined(order, ['travel_fee', 'travelFee']));

        var min = toOptionalMoneyNumber(pickFirstDefined(bookingPricing, ['travelFeeMin', 'travelMin']));
        if (min === null && travelObj) min = toOptionalMoneyNumber(pickFirstDefined(travelObj, ['min', 'fixedAmount']));

        var max = toOptionalMoneyNumber(pickFirstDefined(bookingPricing, ['travelFeeMax', 'travelMax']));
        if (max === null && travelObj) max = toOptionalMoneyNumber(pickFirstDefined(travelObj, ['max', 'fixedAmount']));

        if (amount === null && min !== null) amount = min;
        if (min === null && amount !== null) min = amount;
        if (max === null && amount !== null) max = amount;

        var distanceRaw = pickFirstDefined(bookingPricing, ['travelDistanceKm', 'distanceKm']);
        if (distanceRaw === null && travelObj) distanceRaw = pickFirstDefined(travelObj, ['distanceKm']);
        if (distanceRaw === null) distanceRaw = pickFirstDefined(order, ['travel_distance_km', 'travelDistanceKm']);
        var distanceKm = distanceRaw === null ? null : Number(distanceRaw);
        if (!Number.isFinite(distanceKm)) distanceKm = null;

        if (!mode && amount !== null) mode = 'fixed';
        if (!mode && status) mode = 'per_km';
        if (!mode && amount === null && min === null && max === null) {
            return null;
        }

        mode = String(mode || '').toLowerCase() === 'per_km' ? 'per_km' : 'fixed';

        if (!status) {
            status = mode === 'per_km'
                ? (amount !== null ? 'ok' : 'pending')
                : 'ok';
        }

        return {
            mode: mode,
            status: String(status),
            amount: amount,
            min: min,
            max: max,
            distanceKm: distanceKm
        };
    }

    function getBookingPricing(order) {
        if (!order || typeof order !== 'object') return null;

        var bookingPricing = order.bookingPricing && typeof order.bookingPricing === 'object'
            ? order.bookingPricing
            : null;

        var servicePrice = toOptionalMoneyNumber(pickFirstDefined(bookingPricing, ['servicePrice', 'estimatedPrice']));
        if (servicePrice === null) {
            servicePrice = toOptionalMoneyNumber(pickFirstDefined(order, ['estimated_price', 'estimatedPrice']));
        }

        var travel = normalizeTravelPricing(order, bookingPricing);

        var surveyAmount = toOptionalMoneyNumber(pickFirstDefined(bookingPricing, ['surveyFeeAmount', 'inspectionFee']));
        if (surveyAmount === null && bookingPricing && bookingPricing.surveyFee && typeof bookingPricing.surveyFee === 'object') {
            surveyAmount = toOptionalMoneyNumber(bookingPricing.surveyFee.amount);
        }
        if (surveyAmount === null) {
            surveyAmount = toOptionalMoneyNumber(pickFirstDefined(order, ['inspection_fee', 'inspectionFee']));
        }
        if (surveyAmount === null) surveyAmount = 0;

        var surveyRequired = !!(
            pickFirstDefined(bookingPricing, ['surveyRequired']) ||
            (bookingPricing && bookingPricing.surveyFee && bookingPricing.surveyFee.required) ||
            pickFirstDefined(order, ['survey_required']) ||
            surveyAmount > 0
        );

        var totalEstimate = toOptionalMoneyNumber(pickFirstDefined(bookingPricing, ['totalEstimate', 'totalPrice']));
        if (totalEstimate === null) {
            totalEstimate = toOptionalMoneyNumber(pickFirstDefined(order, ['total_price', 'totalPrice']));
        }

        var totalPending = false;
        if (totalEstimate === null) {
            var baseValue = servicePrice === null ? 0 : servicePrice;
            if (travel && travel.mode === 'per_km' && travel.status !== 'ok') {
                if (servicePrice !== null || travel.amount !== null) {
                    totalPending = true;
                }
            } else if (servicePrice !== null || (travel && travel.amount !== null)) {
                totalEstimate = baseValue + (travel && travel.amount !== null ? travel.amount : 0);
            }
        }

        var hasData = servicePrice !== null || !!travel || surveyRequired || surveyAmount > 0 || totalEstimate !== null || totalPending;
        if (!hasData) {
            return getPresetBookingPricing(order);
        }

        var note = pickFirstDefined(bookingPricing, ['note']);
        if (!note && surveyRequired && surveyAmount > 0) {
            note = 'Phí khảo sát được miễn nếu đồng ý sửa chữa.';
        }

        return {
            servicePrice: servicePrice,
            hasServicePrice: servicePrice !== null,
            travel: travel,
            survey: {
                required: surveyRequired,
                amount: surveyAmount
            },
            totalEstimate: totalEstimate,
            totalPending: totalPending,
            note: note || ''
        };
    }

    function safeParse(raw, fallback) {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch (_err) {
            return fallback;
        }
    }

    function sortByDateDesc(items) {
        return items.slice().sort(function (a, b) {
            return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
        });
    }

    function emitChange() {
        localStorage.setItem(CHANGE_KEY, String(Date.now()));
        global.dispatchEvent(new CustomEvent('thonha:orders-changed'));
    }

    function seedDataIfNeeded() {
        var existing = safeParse(localStorage.getItem(ORDER_KEY), null);
        if (Array.isArray(existing) && existing.length > 0) {
            return;
        }

        var defaultProvider = {
            id: 'provider-001',
            name: 'Trần Quang Huy',
            phone: '0912 334 455',
            company: 'Thợ Nhà - Kỹ thuật nhanh'
        };

        var demoOrders = [
            {
                id: 'ord-001',
                orderCode: 'THN-260401-001',
                customer: { name: 'Nguyễn Thị Lan', phone: '0903 456 789' },
                address: '12 Nguyễn Văn Đậu, Phường 5, Bình Thạnh, TP.HCM',
                service: 'Sửa máy giặt tại nhà',
                note: 'Máy không vắt, cần kiểm tra gấp buổi tối.',
                estimated_price: 420000,
                travel_fee: 30000,
                inspection_fee: 0,
                total_price: 450000,
                status: 'new',
                provider: null,
                createdAt: '2026-03-30T08:20:00',
                updatedAt: '2026-03-30T08:20:00'
            },
            {
                id: 'ord-002',
                orderCode: 'THN-260401-002',
                customer: { name: 'Lê Minh Khang', phone: '0938 776 553' },
                address: '89 Trường Chinh, Tân Bình, TP.HCM',
                service: 'Vệ sinh máy lạnh',
                note: 'Nhà có 2 máy lạnh cần vệ sinh.',
                estimated_price: 0,
                travel_fee_mode: 'per_km',
                travel_fee_status: 'pending',
                travel_fee: 0,
                inspection_fee: 120000,
                total_price: null,
                status: 'new',
                provider: null,
                createdAt: '2026-03-31T10:00:00',
                updatedAt: '2026-03-31T10:00:00'
            },
            {
                id: 'ord-003',
                orderCode: 'THN-260401-003',
                customer: { name: 'Nguyễn Thị Lan', phone: '0903 456 789' },
                address: '12 Nguyễn Văn Đậu, Phường 5, Bình Thạnh, TP.HCM',
                service: 'Thông tắc bồn rửa',
                note: 'Ưu tiên xử lý trước 18h.',
                estimated_price: 250000,
                travel_fee: 20000,
                inspection_fee: 0,
                total_price: 270000,
                status: 'confirmed',
                provider: defaultProvider,
                assignedAt: '2026-03-29T09:10:00',
                createdAt: '2026-03-29T08:45:00',
                updatedAt: '2026-03-29T09:10:00'
            },
            {
                id: 'ord-004',
                orderCode: 'THN-260401-004',
                customer: { name: 'Nguyễn Thị Lan', phone: '0903 456 789' },
                address: '12 Nguyễn Văn Đậu, Phường 5, Bình Thạnh, TP.HCM',
                service: 'Sửa ổ điện âm tường',
                note: 'Ổ cắm phát tia lửa khi cắm thiết bị.',
                estimated_price: 180000,
                travel_fee_mode: 'per_km',
                travel_fee_status: 'ok',
                travel_fee: 40000,
                travel_distance_km: 6.3,
                inspection_fee: 0,
                total_price: 220000,
                status: 'doing',
                provider: defaultProvider,
                assignedAt: '2026-03-28T14:25:00',
                createdAt: '2026-03-28T13:50:00',
                updatedAt: '2026-03-28T15:30:00'
            },
            {
                id: 'ord-005',
                orderCode: 'THN-260401-005',
                customer: { name: 'Nguyễn Thị Lan', phone: '0903 456 789' },
                address: '12 Nguyễn Văn Đậu, Phường 5, Bình Thạnh, TP.HCM',
                service: 'Lắp quạt trần',
                note: 'Đã có quạt, cần mang thêm thang cao.',
                estimated_price: 350000,
                travel_fee: 25000,
                inspection_fee: 0,
                total_price: 375000,
                status: 'done',
                provider: defaultProvider,
                assignedAt: '2026-03-25T08:10:00',
                createdAt: '2026-03-25T07:45:00',
                updatedAt: '2026-03-25T10:00:00'
            },
            {
                id: 'ord-006',
                orderCode: 'THN-260401-006',
                customer: { name: 'Phạm Thu Hằng', phone: '0911 222 333' },
                address: '44 Tô Hiến Thành, Quận 10, TP.HCM',
                service: 'Sơn lại phòng ngủ',
                note: 'Sơn màu sáng, thi công cuối tuần.',
                estimated_price: 1800000,
                travel_fee: 50000,
                inspection_fee: 150000,
                total_price: 1850000,
                status: 'cancel',
                provider: null,
                createdAt: '2026-03-22T09:20:00',
                updatedAt: '2026-03-22T11:00:00'
            }
        ];

        localStorage.setItem(ORDER_KEY, JSON.stringify(demoOrders));

        if (!localStorage.getItem(CUSTOMER_KEY)) {
            localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
                name: 'Nguyễn Thị Lan',
                phone: '0903 456 789',
                address: '12 Nguyễn Văn Đậu, Phường 5, Bình Thạnh, TP.HCM'
            }));
        }

        if (!localStorage.getItem(PROVIDER_KEY)) {
            localStorage.setItem(PROVIDER_KEY, JSON.stringify(defaultProvider));
        }

        emitChange();
    }

    function readOrders() {
        seedDataIfNeeded();
        var parsed = safeParse(localStorage.getItem(ORDER_KEY), []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function writeOrders(orders) {
        localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
        emitChange();
    }

    function getOrders() {
        return sortByDateDesc(readOrders());
    }

    function getCustomerProfile() {
        seedDataIfNeeded();
        var profile = safeParse(localStorage.getItem(CUSTOMER_KEY), null);
        if (profile && profile.name && profile.phone) {
            return profile;
        }

        var fallbackOrder = getOrders().find(function (item) {
            return item.customer && item.customer.phone;
        });

        return fallbackOrder
            ? {
                name: fallbackOrder.customer.name,
                phone: fallbackOrder.customer.phone,
                address: fallbackOrder.address || ''
            }
            : { name: 'Khách hàng', phone: '', address: '' };
    }

    function getProviderProfile() {
        seedDataIfNeeded();
        var profile = safeParse(localStorage.getItem(PROVIDER_KEY), null);
        if (profile && profile.id) {
            return profile;
        }
        return {
            id: 'provider-001',
            name: 'Trần Quang Huy',
            phone: '0912 334 455',
            company: 'Thợ Nhà - Kỹ thuật nhanh'
        };
    }

    function setProviderProfile(profile) {
        if (!profile || !profile.id) return;
        localStorage.setItem(PROVIDER_KEY, JSON.stringify(profile));
    }

    function getCustomerOrders(phone) {
        var phoneDigits = toDigits(phone);
        if (!phoneDigits) return getOrders();
        return getOrders().filter(function (order) {
            return toDigits(order.customer && order.customer.phone) === phoneDigits;
        });
    }

    function getOpenRequests() {
        return getOrders().filter(function (order) {
            return order.status === 'new' && !order.provider;
        });
    }

    function getProviderOrders(providerId) {
        return getOrders().filter(function (order) {
            return order.provider && order.provider.id === providerId;
        });
    }

    function updateOrder(orderId, updater) {
        var orders = readOrders();
        var index = orders.findIndex(function (item) { return item.id === orderId; });
        if (index < 0) {
            return { ok: false, message: 'Không tìm thấy đơn hàng.' };
        }

        var nextOrder = updater(orders[index]);
        if (!nextOrder) {
            return { ok: false, message: 'Không thể cập nhật đơn hàng.' };
        }

        orders[index] = nextOrder;
        writeOrders(orders);
        return { ok: true, order: nextOrder };
    }

    function assignOrder(orderId, provider) {
        return updateOrder(orderId, function (order) {
            if (order.status === 'done' || order.status === 'cancel') return null;
            if (order.provider && order.provider.id && order.provider.id !== provider.id) return null;

            return Object.assign({}, order, {
                status: order.status === 'new' ? 'confirmed' : order.status,
                provider: {
                    id: provider.id,
                    name: provider.name,
                    phone: provider.phone,
                    company: provider.company
                },
                assignedAt: order.assignedAt || nowIso(),
                updatedAt: nowIso()
            });
        });
    }

    function updateOrderStatus(orderId, nextStatus, providerId) {
        if (!STATUS_META[nextStatus]) {
            return { ok: false, message: 'Trạng thái không hợp lệ.' };
        }

        return updateOrder(orderId, function (order) {
            if (providerId && (!order.provider || order.provider.id !== providerId)) return null;
            if (order.status === 'done' || order.status === 'cancel') return null;
            return Object.assign({}, order, {
                status: nextStatus,
                updatedAt: nowIso()
            });
        });
    }

    function updateOrderPricing(orderId, quotedCost, customerPhone) {
        var amount = toMoneyNumber(quotedCost);
        if (!amount || amount <= 0) {
            return { ok: false, message: 'Chi phí không hợp lệ.' };
        }

        var phoneDigits = toDigits(customerPhone);
        var orders = readOrders();
        var index = orders.findIndex(function (item) { return item.id === orderId; });
        if (index < 0) {
            return { ok: false, message: 'Không tìm thấy đơn hàng.' };
        }

        var order = orders[index];
        if (order.status !== 'done') {
            return { ok: false, message: 'Chỉ nhập chi phí khi đơn đã hoàn thành.' };
        }

        if (phoneDigits && toDigits(order.customer && order.customer.phone) !== phoneDigits) {
            return { ok: false, message: 'Bạn không có quyền cập nhật đơn này.' };
        }

        var subsidyAmount = Math.round(amount * SUBSIDY_RATE);
        var finalCost = Math.max(amount - subsidyAmount, 0);

        orders[index] = Object.assign({}, order, {
            pricing: {
                quotedCost: amount,
                subsidyRate: SUBSIDY_RATE,
                subsidyAmount: subsidyAmount,
                finalCost: finalCost,
                updatedAt: nowIso()
            },
            updatedAt: nowIso()
        });

        writeOrders(orders);
        return { ok: true, order: orders[index] };
    }

    seedDataIfNeeded();

    global.ThoNhaOrderStore = {
        changeKey: CHANGE_KEY,
        statusMeta: STATUS_META,
        getOrders: getOrders,
        getBookingPricing: getBookingPricing,
        getCustomerProfile: getCustomerProfile,
        getProviderProfile: getProviderProfile,
        setProviderProfile: setProviderProfile,
        getCustomerOrders: getCustomerOrders,
        getOpenRequests: getOpenRequests,
        getProviderOrders: getProviderOrders,
        assignOrder: assignOrder,
        updateOrderStatus: updateOrderStatus,
        updateOrderPricing: updateOrderPricing
    };
})(window);