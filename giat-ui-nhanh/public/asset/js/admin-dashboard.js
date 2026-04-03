(function () {
  const KRUD_TABLE = "datlich_giatuinhanh";
  let orders = [];

  const statusConfig = {
    pending: { label: "Chờ nhận đơn", className: "status-pending" },
    confirmed: { label: "Đã nhận đơn", className: "status-confirmed" },
    completed: { label: "Đã hoàn thành", className: "status-completed" },
    canceled: { label: "Đã hủy", className: "status-canceled" },
  };

  function extractKrudRows(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    if (result && Array.isArray(result.items)) return result.items;
    if (result && Array.isArray(result.rows)) return result.rows;
    if (result && Array.isArray(result.result)) return result.result;
    return [];
  }

  function getOrderStatusFromDates(row) {
    if (row && row.ngayhuy) return "canceled";
    if (row && row.ngayhoanthanh) return "completed";
    if (row && row.ngaynhan) return "confirmed";
    if (row && row.thoigiandatdichvu) return "pending";
    return "pending";
  }

  function parseTime(value) {
    if (!value) return 0;

    const text = String(value).trim();
    const isoTime = new Date(text).getTime();
    if (Number.isFinite(isoTime)) {
      return isoTime;
    }

    const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;

    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3]);
    return new Date(y, mo, d).getTime();
  }

  function formatDate(value) {
    const time = parseTime(value);
    if (!time) return "--/--/----";
    return new Date(time).toLocaleDateString("vi-VN");
  }

  function formatOrderCode(id) {
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) return "Không có mã";
    return String(Math.floor(num)).padStart(7, "0");
  }

  function mapOrderFromKrud(row) {
    const rawDate =
      row.thoigiandatdichvu || row.ngaytao || row.created_at || "";
    return {
      id: Number(row.id) || 0,
      code: formatOrderCode(row.id),
      customer: row.hovaten || row.tenkhachhang || row.hoten || "Khách hàng",
      service: row.dichvu || row.dichvuquantam || "Chưa cập nhật dịch vụ",
      status: getOrderStatusFromDates(row),
      date: formatDate(rawDate),
      raw: row,
      _sortTime: parseTime(rawDate) || Number(row.id) || 0,
    };
  }

  function getStatusCounters() {
    return {
      pending: orders.filter((order) => order.status === "pending").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      completed: orders.filter((order) => order.status === "completed").length,
      canceled: orders.filter((order) => order.status === "canceled").length,
    };
  }

  function buildCards() {
    const serviceSet = new Set(orders.map((order) => order.service));
    const customerSet = new Set(orders.map((order) => order.customer));
    const statusCounters = getStatusCounters();

    return [
      {
        label: "Tổng đơn hàng",
        value: orders.length,
        icon: "fas fa-shopping-basket",
        color: "linear-gradient(135deg,#10b981,#22c55e)",
      },
      {
        label: "Chờ nhận đơn",
        value: statusCounters.pending,
        icon: "fas fa-hourglass-half",
        color: "linear-gradient(135deg,#f59e0b,#fb7185)",
      },
      {
        label: "Đã nhận đơn",
        value: statusCounters.confirmed,
        icon: "fas fa-check-double",
        color: "linear-gradient(135deg,#0ea5e9,#06b6d4)",
      },
      {
        label: "Đã hoàn thành",
        value: statusCounters.completed,
        icon: "fas fa-check-circle",
        color: "linear-gradient(135deg,#34d399,#10b981)",
      },
      {
        label: "Tổng khách hàng",
        value: customerSet.size,
        icon: "fas fa-users",
        color: "linear-gradient(135deg,#86efac,#fde047)",
      },
      {
        label: "Tổng dịch vụ",
        value: serviceSet.size,
        icon: "fas fa-box-open",
        color: "linear-gradient(135deg,#c084fc,#a78bfa)",
      },
    ];
  }

  async function loadOrders() {
    if (typeof window.krudList !== "function") {
      throw new Error("Chưa tải thư viện KRUD (krud.js).");
    }

    const result = await Promise.resolve(
      window.krudList({
        table: KRUD_TABLE,
        page: 1,
        limit: 200,
      }),
    );

    const rows = extractKrudRows(result);
    orders = rows.map(mapOrderFromKrud).sort(function (a, b) {
      return b._sortTime - a._sortTime;
    });
  }

  function renderStats() {
    const statsGrid = document.getElementById("statsGrid");
    if (!statsGrid) return;

    const cards = buildCards();

    statsGrid.innerHTML = cards
      .map(function (card) {
        return `
          <div class="col-12 col-sm-6 col-xl-3">
            <article class="metric-card h-100">
              <span class="metric-icon" style="background:${card.color}">
                <i class="${card.icon}" aria-hidden="true"></i>
              </span>
              <div>
                <p class="metric-value">${card.value}</p>
                <p class="metric-title">${card.label}</p>
              </div>
            </article>
          </div>
        `;
      })
      .join("");
  }

  function renderRecentOrders() {
    const tbody = document.getElementById("recentOrdersBody");
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có dữ liệu đơn đặt.</td></tr>';
      return;
    }

    const recentOrders = orders.slice(0, 6);

    tbody.innerHTML = recentOrders
      .map(function (order) {
        const status = statusConfig[order.status] || {
          label: "Không rõ",
          className: "status-pending",
        };

        return `
          <tr>
            <td class="order-code">${order.code}</td>
            <td>${order.customer}</td>
            <td>${order.service}</td>
            <td><span class="status-pill ${status.className}">${status.label}</span></td>
            <td>${order.date}</td>
            <td>
              <button type="button" class="btn btn-sm btn-primary btn-order-detail" data-order-id="${order.id}">
                Xem chi tiết
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function bindOrderDetailAction() {
    const tbody = document.getElementById("recentOrdersBody");
    const modalEl = document.getElementById("adminOrderDetailModal");
    if (!tbody || !modalEl || !window.bootstrap) return;

    const modal = new window.bootstrap.Modal(modalEl);
    const setText = function (id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "-";
    };

    tbody.addEventListener("click", function (event) {
      const button = event.target.closest(".btn-order-detail");
      if (!button) return;

      const orderId = Number(button.getAttribute("data-order-id"));
      const order = orders.find(function (item) {
        return Number(item.id) === orderId;
      });
      if (!order) return;

      const row = order.raw || {};
      const status = statusConfig[order.status] || statusConfig.pending;
      const paymentStatus =
        String(row.trangthaithanhtoan || "")
          .trim()
          .toLowerCase() === "paid"
          ? "Đã thanh toán"
          : "Chưa thanh toán";

      setText("adminDetailOrderCode", order.code);
      setText("adminDetailServiceName", row.dichvu || row.dichvuquantam);
      setText("adminDetailWorkItems", row.danhsachcongviec);
      setText("adminDetailChemicals", row.danhsachhoachat);
      setText(
        "adminDetailTransport",
        row.hinhthucnhangiao || row.phuongthucgiaonhan,
      );
      setText(
        "adminDetailQuantity",
        row.soluong || row.khoiluong || row.quantity,
      );

      setText(
        "adminDetailOrderDate",
        row.thoigiandatdichvu || row.ngaytao || row.created_at,
      );
      setText("adminDetailOrderStatus", status.label);
      setText("adminDetailPaymentStatus", paymentStatus);
      setText("adminDetailServicePrice", row.giadichvu);
      setText("adminDetailTransportFee", row.tiendichuyen);
      setText("adminDetailSurchargeFee", row.phuphigiaonhan);
      setText("adminDetailTotal", row.tongtien);
      setText("adminDetailNote", row.ghichu);

      setText("adminDetailCustomerName", row.hovaten || row.tenkhachhang);
      setText("adminDetailCustomerPhone", row.sodienthoai || row.phone);
      setText("adminDetailCustomerEmail", row.email);
      setText("adminDetailCustomerAddress", row.diachi);

      setText("adminDetailSupplierName", row.tennhacungcap);
      setText("adminDetailSupplierPhone", row.sdt_ncc);
      setText("adminDetailSupplierEmail", row.email_ncc);
      setText("adminDetailSupplierAddress", row.diachi_ncc);

      modal.show();
    });
  }

  function renderStatusSummary() {
    const box = document.getElementById("statusSummary");
    if (!box) return;

    const statusCounters = getStatusCounters();
    const total = orders.length || 1;
    const statuses = ["pending", "confirmed", "completed", "canceled"];

    box.innerHTML = statuses
      .map(function (key) {
        const config = statusConfig[key];
        const value = statusCounters[key] || 0;
        const width = Math.round((value / total) * 100);

        return `
          <div class="status-item">
            <div class="status-row">
              <span class="status-name">${config.label}</span>
              <span class="status-count">${value}</span>
            </div>
            <div class="status-bar-track">
              <div class="status-bar c-${key}" style="width:${width}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderLoadingState() {
    const tbody = document.getElementById("recentOrdersBody");
    const box = document.getElementById("statusSummary");

    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-4">Đang tải danh sách đơn đặt...</td></tr>';
    }

    if (box) {
      box.innerHTML = '<p class="text-muted mb-0">Đang tải thống kê...</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindOrderDetailAction();
    renderLoadingState();

    loadOrders()
      .then(function () {
        renderStats();
        renderRecentOrders();
        renderStatusSummary();
      })
      .catch(function (error) {
        console.error("Lỗi tải dashboard admin:", error);
        orders = [];
        renderStats();
        renderRecentOrders();
        renderStatusSummary();
      });
  });
})();
