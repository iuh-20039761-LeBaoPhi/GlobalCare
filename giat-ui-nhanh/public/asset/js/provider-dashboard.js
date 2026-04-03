(function () {
  var BOOKING_TABLE = "datlich_giatuinhanh";
  var SUPPLIER_TABLE = "nhacungcap_giatuinhanh";
  var newOrders = [];
  var activeOrders = [];
  var orderDisplayUtils = window.OrderDisplayUtils || {};
  var formatOrderDisplayId =
    typeof orderDisplayUtils.formatOrderDisplayId === "function"
      ? orderDisplayUtils.formatOrderDisplayId
      : function (id) {
          var numeric = Number(id);
          if (!Number.isFinite(numeric) || numeric <= 0) return "-";
          return String(Math.floor(numeric)).padStart(7, "0");
        };
  var resolveOrderDisplayCode =
    typeof orderDisplayUtils.resolveOrderDisplayCode === "function"
      ? orderDisplayUtils.resolveOrderDisplayCode
      : function (row) {
          var fromId = formatOrderDisplayId(row && row.id);
          if (fromId !== "-") return fromId;
          var legacy = String((row && row.madonhang) || "").trim();
          return legacy || "-";
        };

  var statusConfig = {
    pending: { label: "Chờ nhận đơn", className: "status-pending" },
    processing: { label: "Đã nhận đơn", className: "status-received" },
    completed: { label: "Đã hoàn thành", className: "status-done" },
  };

  var cardConfig = [
    {
      key: "pending",
      label: "Đơn mới & Chờ nhận",
      icon: "fas fa-bullhorn",
      iconBg: "#e8f1ff",
      iconColor: "#2f67b6",
    },
    {
      key: "processing",
      label: "Đã nhận đơn",
      icon: "fas fa-clipboard-check",
      iconBg: "#e8f8ff",
      iconColor: "#1689b5",
    },
    {
      key: "completed",
      label: "Đã hoàn thành",
      icon: "fas fa-cogs",
      iconBg: "#fff4dd",
      iconColor: "#bf7d19",
    },
  ];

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

  function textOrDash(value) {
    var text = String(value || "").trim();
    return text || "-";
  }

  function formatMoney(value) {
    return toNumber(value).toLocaleString("vi-VN") + " đ";
  }

  function normalizePaymentStatus(value) {
    return String(value || "")
      .trim()
      .toLowerCase() === "paid"
      ? "Đã thanh toán"
      : "Chưa thanh toán";
  }

  function getOrderStatusFromDates(row) {
    if (row && row.ngayhoanthanh) return "completed";
    if (row && row.ngaynhan) return "processing";
    if (row && row.thoigiandatdichvu) return "pending";
    return "pending";
  }

  function parseDateScore(value) {
    if (!value) return 0;

    var text = String(value).trim();
    var direct = new Date(text).getTime();
    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    var m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;

    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  }

  function formatDate(value) {
    var score = parseDateScore(value);
    if (!score) return "--/--/----";
    return new Date(score).toLocaleDateString("vi-VN");
  }

  function mapBookingRow(row) {
    var rawDate = row.thoigiandatdichvu || row.ngaytao || row.created_at || "";
    var idValue = Number(row.id);
    var orderId = Number.isFinite(idValue) && idValue > 0 ? idValue : null;

    return {
      id: orderId,
      code: resolveOrderDisplayCode(row),
      customer: row.hovaten || row.tenkhachhang || "Khách hàng",
      phone: row.sodienthoai || "",
      service: row.dichvu || row.dichvuquantam || "Chưa rõ dịch vụ",
      date: formatDate(rawDate),
      status: getOrderStatusFromDates(row),
      _sortScore: parseDateScore(rawDate) || Number(row.id) || 0,
      _raw: row,
    };
  }

  function renderNewOrdersLoading() {
    var tbody = document.getElementById("newOrdersBody");
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">Đang tải đơn chờ xử lý...</td></tr>';
  }

  function renderNewOrdersError() {
    var tbody = document.getElementById("newOrdersBody");
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger py-4">Không tải được dữ liệu từ bảng datlich_giatuinhanh.</td></tr>';
  }

  async function loadDashboardOrders() {
    if (typeof window.krudList !== "function") {
      throw new Error("KRUD chưa sẵn sàng.");
    }

    var result = await Promise.resolve(
      window.krudList({
        table: BOOKING_TABLE,
        page: 1,
        limit: 10,
      }),
    );

    var rows = extractKrudRows(result).filter(function (row) {
      return !row.ngayhuy;
    });
    var mappedOrders = rows.map(mapBookingRow).sort(function (a, b) {
      return b._sortScore - a._sortScore;
    });

    newOrders = mappedOrders.filter(function (order) {
      return order.status === "pending";
    });

    activeOrders = mappedOrders.filter(function (order) {
      return order.status === "processing" || order.status === "completed";
    });
  }

  async function refreshDashboardData() {
    renderNewOrdersLoading();

    try {
      await loadDashboardOrders();
      renderSummaryCards();
      renderNewOrders();
      renderActiveOrders();
    } catch (error) {
      console.error("Load pending orders failed:", error);
      newOrders = [];
      renderSummaryCards();
      renderNewOrdersError();
      renderActiveOrders();
    }
  }

  function getCountByStatus(statusKey) {
    var fromNew = newOrders.filter(function (order) {
      return order.status === statusKey;
    }).length;

    var fromActive = activeOrders.filter(function (order) {
      return order.status === statusKey;
    }).length;

    return fromNew + fromActive;
  }

  function renderSummaryCards() {
    var mount = document.getElementById("summaryCards");
    if (!mount) return;

    mount.innerHTML = cardConfig
      .map(function (card) {
        var count = getCountByStatus(card.key);
        return `
          <div class="col-12 col-sm-6 col-xl-3">
            <article class="summary-item">
              <span class="summary-icon" style="background:${card.iconBg};color:${card.iconColor}">
                <i class="${card.icon}" aria-hidden="true"></i>
              </span>
              <div class="summary-meta">
                <p class="summary-label">${card.label}</p>
                <p class="summary-value">${count}</p>
              </div>
            </article>
          </div>
        `;
      })
      .join("");
  }

  function renderNewOrders() {
    var tbody = document.getElementById("newOrdersBody");
    if (!tbody) return;

    if (!newOrders.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fas fa-smile"></i>
              Hiện chưa có đơn mới
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = newOrders
      .map(function (order) {
        var status = statusConfig[order.status] || statusConfig.pending;
        return `
          <tr>
            <td data-label="Mã đơn">${order.code}</td>
            <td data-label="Khách hàng">
              <div class="customer-name">${order.customer}</div>
              <div class="customer-phone">${order.phone}</div>
            </td>
            <td data-label="Dịch vụ yêu cầu">${order.service}</td>
            <td data-label="Ngày đặt">${order.date || "--/--/----"}</td>
            <td data-label="Trạng thái"><span class="status-pill ${status.className}">${status.label}</span></td>
            <td data-label="Thao tác">
              <div class="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-cyan btn-accept-order"
                  data-order-id="${order.id || ""}"
                  ${order.id ? "" : "disabled"}
                >
                  Nhận đơn
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-cyan btn-order-detail"
                  data-order-id="${order.id || ""}"
                  ${order.id ? "" : "disabled"}
                >
                  Xem chi tiết
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function renderActiveOrders() {
    var tbody = document.getElementById("activeOrdersBody");
    if (!tbody) return;

    if (!activeOrders.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có đơn đang xử lý hoặc đã hoàn thành.</td></tr>';
      return;
    }

    tbody.innerHTML = activeOrders
      .map(function (order) {
        var status = statusConfig[order.status] || statusConfig.processing;

        return `
          <tr>
            <td data-label="Mã đơn">${order.code}</td>
            <td data-label="Khách hàng">
              <div class="customer-name">${order.customer}</div>
              <div class="customer-phone">${order.phone}</div>
            </td>
            <td data-label="Dịch vụ">${order.service}</td>
            <td data-label="Trạng thái"><span class="status-pill ${status.className}">${status.label}</span></td>
            <td data-label="Thao tác">
              <button
                type="button"
                class="btn btn-sm btn-outline-cyan btn-order-detail"
                data-order-id="${order.id || ""}"
                ${order.id ? "" : "disabled"}
              >
                Xem chi tiết
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function getBookingById(orderId) {
    var result = await Promise.resolve(
      window.krudList({
        table: BOOKING_TABLE,
        where: [{ field: "id", operator: "=", value: orderId }],
        limit: 1,
      }),
    );

    var rows = extractKrudRows(result);
    if (!rows.length) {
      throw new Error("Không tìm thấy đơn hàng.");
    }

    return rows[0];
  }

  function getSupplierIdFromOrder(order) {
    var supplierId = Number(
      order.idnhacungcap || order.id_ncc || order.manhacungcap,
    );
    return Number.isFinite(supplierId) && supplierId > 0 ? supplierId : null;
  }

  async function getSupplierById(supplierId) {
    if (!supplierId) return null;

    var result = await Promise.resolve(
      window.krudList({
        table: SUPPLIER_TABLE,
        where: [{ field: "id", operator: "=", value: supplierId }],
        limit: 1,
      }),
    );

    var rows = extractKrudRows(result);
    return rows.length ? rows[0] : null;
  }

  function setDetailText(id, value) {
    var node = document.getElementById(id);
    if (!node) return;
    node.textContent = textOrDash(value);
  }

  function setPaymentStatusBadge(value) {
    var node = document.getElementById("detailPaymentStatus");
    if (!node) return;

    var statusText = normalizePaymentStatus(value);
    node.textContent = statusText;
    node.classList.add("payment-status-badge");
    node.classList.remove(
      "payment-status-paid",
      "payment-status-unpaid",
      "payment-status-unknown",
    );

    if (statusText === "Đã thanh toán") {
      node.classList.add("payment-status-paid");
      return;
    }

    if (statusText === "Chưa thanh toán") {
      node.classList.add("payment-status-unpaid");
      return;
    }

    node.classList.add("payment-status-unknown");
  }

  function fillOrderDetailModal(order, supplier) {
    var statusKey = getOrderStatusFromDates(order);
    var orderStatus = (statusConfig[statusKey] || statusConfig.pending).label;
    var orderDate =
      order.thoigiandatdichvu || order.ngaytao || order.created_at || "";

    var quantityValue = textOrDash(
      order.soluong || order.khoiluong || order.quantity,
    );
    if (
      quantityValue !== "-" &&
      String(quantityValue).toLowerCase().indexOf("kg") === -1
    ) {
      quantityValue += " kg";
    }

    var supplierName =
      (supplier && (supplier.hovaten || supplier.hoten)) || order.tennhacungcap;
    var supplierPhone =
      (supplier && (supplier.sodienthoai || supplier.sdt)) || order.sdt_ncc;
    var supplierEmail = (supplier && supplier.email) || order.email_ncc;
    var supplierAddress = (supplier && supplier.diachi) || order.diachi_ncc;

    setDetailText("detailOrderCode", formatOrderDisplayId(order.id));
    setDetailText("detailSubService", order.dichvu || order.dichvuquantam);
    setDetailText("detailWorkItems", order.danhsachcongviec);
    setDetailText("detailChemicals", order.danhsachhoachat);
    setDetailText(
      "detailTransportMethod",
      order.hinhthucnhangiao || order.phuongthucgiaonhan,
    );
    setDetailText("detailQuantity", quantityValue);

    setDetailText("detailBookingDate", formatDate(orderDate));
    setDetailText("detailOrderStatus", orderStatus);
    setPaymentStatusBadge(order.trangthaithanhtoan);
    setDetailText("detailServiceFee", formatMoney(order.giadichvu));
    setDetailText("detailTransportFee", formatMoney(order.tiendichuyen));
    setDetailText("detailSurchargeFee", formatMoney(order.phuphigiaonhan));
    setDetailText("detailTotalFee", formatMoney(order.tongtien));

    setDetailText("detailNote", order.ghichu);

    setDetailText("detailCustomerName", order.hovaten || order.tenkhachhang);
    setDetailText("detailCustomerPhone", order.sodienthoai || order.phone);
    setDetailText("detailCustomerEmail", order.email);
    setDetailText("detailCustomerAddress", order.diachi);

    setDetailText("detailSupplierName", supplierName);
    setDetailText("detailSupplierPhone", supplierPhone);
    setDetailText("detailSupplierEmail", supplierEmail);
    setDetailText("detailSupplierAddress", supplierAddress);
  }

  function syncCompleteButton(orderId, statusKey) {
    var button = document.getElementById("detailCompleteBtn");
    if (!button) return;

    button.dataset.orderId = String(orderId || "");

    if (statusKey === "completed") {
      button.disabled = true;
      button.textContent = "Đã hoàn thành";
      return;
    }

    button.disabled = false;
    button.textContent = "Hoàn thành";
  }

  async function updateOrderStatusToCompleted(orderId) {
    var result = await Promise.resolve(
      window.krud(
        "update",
        BOOKING_TABLE,
        {
          ngayhoanthanh: new Date().toISOString(),
          trangthaithanhtoan: "Paid",
        },
        orderId,
      ),
    );

    if (!result || result.success === false || result.error) {
      throw new Error(
        (result && (result.error || result.message)) ||
          "Không thể cập nhật trạng thái đơn.",
      );
    }
  }

  async function openOrderDetailModal(orderId) {
    var modalElement = document.getElementById("orderDetailModal");
    if (!modalElement) {
      throw new Error("Không tìm thấy modal chi tiết đơn.");
    }

    var order = await getBookingById(orderId);
    var supplierId = getSupplierIdFromOrder(order);

    // Join dữ liệu nhà cung cấp theo id lưu trong đơn đặt.
    var supplier = await getSupplierById(supplierId);

    fillOrderDetailModal(order, supplier);

    var statusKey = getOrderStatusFromDates(order);
    syncCompleteButton(orderId, statusKey);

    if (!window.bootstrap || !window.bootstrap.Modal) {
      throw new Error("Bootstrap Modal chưa sẵn sàng.");
    }

    window.bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  async function handleOrderDetailClick(event) {
    var button = event.target.closest(".btn-order-detail");
    if (!button) return;

    var orderId = Number(button.getAttribute("data-order-id"));
    if (!Number.isFinite(orderId) || orderId <= 0) {
      window.alert("Không xác định được đơn hàng.");
      return;
    }

    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Đang tải...";

    try {
      await openOrderDetailModal(orderId);
    } catch (error) {
      console.error("Open order detail failed:", error);
      window.alert(
        error && error.message
          ? error.message
          : "Không thể tải chi tiết đơn hàng.",
      );
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function bindOrderDetailAction() {
    var newTbody = document.getElementById("newOrdersBody");
    var activeTbody = document.getElementById("activeOrdersBody");

    if (newTbody) {
      newTbody.addEventListener("click", handleOrderDetailClick);
    }
    if (activeTbody) {
      activeTbody.addEventListener("click", handleOrderDetailClick);
    }
  }

  function bindCompleteOrderAction() {
    var button = document.getElementById("detailCompleteBtn");
    var modalElement = document.getElementById("orderDetailModal");
    if (!button || !modalElement) return;

    button.addEventListener("click", async function () {
      var orderId = Number(button.dataset.orderId);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        window.alert("Không xác định được đơn hàng để cập nhật.");
        return;
      }

      var originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Đang cập nhật...";

      try {
        await updateOrderStatusToCompleted(orderId);
        setDetailText("detailOrderStatus", statusConfig.completed.label);
        setPaymentStatusBadge("Paid");
        button.textContent = "Đã hoàn thành";

        await refreshDashboardData();

        if (window.bootstrap && window.bootstrap.Modal) {
          window.bootstrap.Modal.getOrCreateInstance(modalElement).hide();
        }
      } catch (error) {
        console.error("Complete order failed:", error);
        window.alert(
          error && error.message
            ? error.message
            : "Không thể cập nhật đơn hoàn thành.",
        );
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  function bindRefreshAction() {
    var refreshBtn = document.getElementById("btnRefreshDashboard");
    if (!refreshBtn) return;

    refreshBtn.addEventListener("click", async function () {
      refreshBtn.classList.add("is-loading");
      refreshBtn.disabled = true;

      await refreshDashboardData();

      refreshBtn.classList.remove("is-loading");
      refreshBtn.disabled = false;
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    window.ProviderDashboard = {
      refreshDashboardData: refreshDashboardData,
    };

    renderSummaryCards();
    renderNewOrdersLoading();
    renderActiveOrders();
    bindRefreshAction();
    bindOrderDetailAction();
    bindCompleteOrderAction();

    await refreshDashboardData();
  });
})();
