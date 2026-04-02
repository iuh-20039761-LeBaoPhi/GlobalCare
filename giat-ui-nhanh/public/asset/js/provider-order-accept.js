(function () {
  var BOOKING_TABLE = "datlich_giatuinhanh";
  var SUPPLIER_TABLE = "nhacungcap_giatuinhanh";

  function extractKrudRows(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    if (result && Array.isArray(result.items)) return result.items;
    if (result && Array.isArray(result.rows)) return result.rows;
    if (result && Array.isArray(result.result)) return result.result;
    return [];
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    var text = String(value || "")
      .replace(/[^\d,-.]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(/,/g, ".");
    var parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizePhone(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.length >= 9 && digits[0] !== "0") {
      return "0" + digits;
    }
    return digits;
  }

  function isSupplierActive(status) {
    var normalized = String(status || "")
      .trim()
      .toLowerCase();
    return (
      normalized === "active" ||
      normalized === "approved" ||
      normalized === "duyet"
    );
  }

  function parseWeight(order) {
    var fromWeight = toNumber(order.khoiluong || order.weight || order.cannang);
    if (fromWeight > 0) return fromWeight;

    var fromQuantity = toNumber(order.soluong || order.quantity);
    return fromQuantity > 0 ? fromQuantity : 1;
  }

  function cleanAddress(address) {
    return String(address || "")
      .replace(/\d+\/\d+(\/\d+)?/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/\b(hẻm|hem|ngõ|ngach|kiệt|kiet)\b/gi, "")
      .replace(/\b(phường|p\.?|quận|q\.?|tp\.?|thành phố)\b/gi, "")
      .replace(/[0-9]{4,6}/g, "")
      .replace(/[.]/g, ",")
      .replace(/[-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function getLatLon(address) {
    async function fetchGeo(query) {
      var url =
        "https://nominatim.openstreetmap.org/search?q=" +
        encodeURIComponent(query) +
        "&format=json&limit=1&countrycodes=vn";

      var res = await fetch(url, {
        headers: { "User-Agent": "distance-app", "Accept-Language": "vi" },
      });

      if (!res.ok) return null;

      var data = await res.json();
      if (!Array.isArray(data) || !data.length) return null;

      var lat = Number(data[0].lat);
      var lon = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

      return { lat: lat, lon: lon };
    }

    var cleaned = cleanAddress(address);
    if (!cleaned) {
      throw new Error("Dia chi khong hop le");
    }

    var attempts = [
      cleaned + ", Vietnam",
      cleaned.split(",").slice(0, 2).join(",") + ", Vietnam",
      cleaned.split(",").slice(-2).join(",") + ", Vietnam",
      cleaned.split(" ").slice(0, 4).join(" ") + ", Vietnam",
      cleaned,
    ];

    for (var i = 0; i < attempts.length; i += 1) {
      var query = String(attempts[i] || "").trim();
      if (!query) continue;

      var data = await fetchGeo(query);
      if (data) return data;
    }

    throw new Error("Khong tim thay dia chi: " + address);
  }

  async function getDistance(lat1, lon1, lat2, lon2) {
    var url =
      "https://router.project-osrm.org/route/v1/driving/" +
      lon1 +
      "," +
      lat1 +
      ";" +
      lon2 +
      "," +
      lat2 +
      "?overview=false";

    var res = await fetch(url);
    if (!res.ok) {
      throw new Error("Khong the tinh khoang cach");
    }

    var data = await res.json();
    if (!data.routes || !data.routes.length) {
      throw new Error("Khong tinh duoc khoang cach");
    }

    return Number((data.routes[0].distance / 1000).toFixed(2));
  }

  async function getSessionUser() {
    var response = await fetch("public/asset/login-page.php", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    var result = await response.json().catch(function () {
      return null;
    });

    if (!response.ok || !result || result.loggedIn !== true) {
      throw new Error("Phien dang nhap khong hop le");
    }

    return result.user || {};
  }

  async function findSupplierByPhone(phone) {
    var direct = await Promise.resolve(
      window.krudList({
        table: SUPPLIER_TABLE,
        where: [{ field: "sodienthoai", operator: "=", value: phone }],
        limit: 1,
      }),
    );

    var directRows = extractKrudRows(direct);
    if (directRows.length) return directRows[0];

    var fallback = await Promise.resolve(
      window.krudList({ table: SUPPLIER_TABLE, page: 1, limit: 200 }),
    );

    var rows = extractKrudRows(fallback);
    for (var i = 0; i < rows.length; i += 1) {
      var candidate = rows[i];
      if (normalizePhone(candidate.sodienthoai || candidate.sdt) === phone) {
        return candidate;
      }
    }

    return null;
  }

  async function getCurrentSupplier() {
    var user = await getSessionUser();
    var sessionPhone = normalizePhone(
      user.user_tel || user.sodienthoai || user.phone,
    );

    if (!sessionPhone) {
      throw new Error(
        "Khong tim thay so dien thoai nha cung cap trong session",
      );
    }

    var supplier = await findSupplierByPhone(sessionPhone);
    if (!supplier) throw new Error("Khong tim thay nha cung cap");

    if (!isSupplierActive(supplier.trangthai || supplier.status)) {
      throw new Error("Tai khoan nha cung cap chua duoc duyet");
    }

    return supplier;
  }

  async function getOrderById(orderId) {
    var result = await Promise.resolve(
      window.krudList({
        table: BOOKING_TABLE,
        where: [{ field: "id", operator: "=", value: orderId }],
        limit: 1,
      }),
    );

    var rows = extractKrudRows(result);
    if (!rows.length) throw new Error("Khong tim thay don hang");
    return rows[0];
  }

  function calculatePricing(order, distanceKm) {
    var totalWeight = parseWeight(order);
    var baseTransportFee = toNumber(order.tiendichuyen);
    var serviceAmount = Math.round(toNumber(order.giadichvu));

    var transportName = String(order.hinhthucnhangiao || "")
      .toLowerCase()
      .trim();
    var isSelfPickup =
      transportName.indexOf("tu lay") !== -1 ||
      transportName.indexOf("t\u1ef1 l\u1ea5y") !== -1;
    var extraTransportFee = totalWeight >= 50 && !isSelfPickup ? 5000 : 0;
    var effectiveTransportFee = baseTransportFee + extraTransportFee;

    var surcharge =
      distanceKm > 0
        ? (distanceKm * effectiveTransportFee * (totalWeight / 20)) / 4
        : 0;
    var shippingSurcharge = Math.round(surcharge);

    return {
      distanceKm: distanceKm,
      shippingSurcharge: shippingSurcharge,
      totalAmount: serviceAmount + effectiveTransportFee + shippingSurcharge,
      effectiveTransportFee: effectiveTransportFee,
    };
  }

  async function updateBookingAfterAccept(orderId, supplier, pricing) {
    var supplierId = supplier.id;
    var payload = {
      trangthaidon: "Processing",
      phuphigiaonhan: pricing.shippingSurcharge,
      tongtien: pricing.totalAmount,
      tiendichuyen: pricing.effectiveTransportFee,
      khoangcachgiaonhan: pricing.distanceKm,
      idnhacungcap: supplierId,
    };

    var result = await Promise.resolve(
      window.krud("update", BOOKING_TABLE, payload, orderId),
    );

    if (!result || result.success === false || result.error) {
      throw new Error(
        (result && (result.error || result.message)) || "Cap nhat don that bai",
      );
    }
  }

  async function handleAcceptOrder(orderId) {
    if (
      typeof window.krudList !== "function" ||
      typeof window.krud !== "function"
    ) {
      throw new Error("KRUD chua san sang");
    }

    var supplier = await getCurrentSupplier();
    var order = await getOrderById(orderId);

    var customerAddress = String(order.diachi || "").trim();
    var supplierAddress = String(supplier.diachi || "").trim();

    if (!customerAddress) {
      throw new Error("Don dat chua co dia chi khach hang");
    }
    if (!supplierAddress) {
      throw new Error("Nha cung cap chua co dia chi");
    }

    var supplierLoc = await getLatLon(supplierAddress);
    var customerLoc = await getLatLon(customerAddress);
    var distanceKm = await getDistance(
      supplierLoc.lat,
      supplierLoc.lon,
      customerLoc.lat,
      customerLoc.lon,
    );

    var pricing = calculatePricing(order, distanceKm);
    await updateBookingAfterAccept(orderId, supplier, pricing);

    return {
      supplierName: supplier.hovaten || supplier.hoten || "Nha cung cap",
      distanceKm: pricing.distanceKm,
      surcharge: pricing.shippingSurcharge,
      total: pricing.totalAmount,
    };
  }

  function setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent || "Nhan don";
      }
      button.disabled = true;
      button.textContent = "Dang nhan...";
      return;
    }

    button.disabled = false;
    button.textContent = button.dataset.originalText || "Nhan don";
  }

  function extractOrderIdFromButton(button) {
    var fromData = Number(button && button.getAttribute("data-order-id"));
    if (Number.isFinite(fromData) && fromData > 0) return fromData;

    var row = button ? button.closest("tr") : null;
    var codeText =
      row && row.children && row.children[0] ? row.children[0].textContent : "";
    var match = String(codeText || "").match(/GU-(\d+)/i);
    var parsed = match ? Number(match[1]) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function bindAcceptOrderAction() {
    var tbody = document.getElementById("newOrdersBody");
    if (!tbody) return;

    tbody.addEventListener("click", async function (event) {
      var button = event.target.closest(".btn-accept-order");
      if (!button) return;

      var orderId = extractOrderIdFromButton(button);
      if (!orderId) {
        window.alert("Khong xac dinh duoc ma don hang.");
        return;
      }

      setButtonLoading(button, true);

      try {
        await handleAcceptOrder(orderId);

        if (
          window.ProviderDashboard &&
          typeof window.ProviderDashboard.refreshDashboardData === "function"
        ) {
          await window.ProviderDashboard.refreshDashboardData();
        }
      } catch (error) {
        console.error("Accept order failed:", error);
        window.alert(
          error && error.message ? error.message : "Khong the nhan don.",
        );
      } finally {
        setButtonLoading(button, false);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindAcceptOrderAction();
  });
})();
