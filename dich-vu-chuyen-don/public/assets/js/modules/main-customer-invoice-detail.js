(function (window, document) {
  if (window.__fastGoCustomerInvoiceDetailLoaded) return;
  window.__fastGoCustomerInvoiceDetailLoaded = true;

  const core = window.FastGoCore || {};
  const store = window.FastGoCustomerPortalStore || null;
  const body = document.body;

  if (!body || body.getAttribute("data-page") !== "customer-invoice-detail") {
    return;
  }

  const root = document.getElementById("customer-invoice-detail-root");
  if (!root || !store) return;

  function escapeHtml(value) {
    if (typeof core.escapeHtml === "function") {
      return core.escapeHtml(String(value ?? ""));
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getProjectUrl(path) {
    return typeof core.toProjectUrl === "function" ? core.toProjectUrl(path) : path;
  }

  function getCurrentTargetUrl() {
    return `${window.location.pathname}${window.location.search}`;
  }

  function redirectToLogin() {
    const loginUrl = new URL(getProjectUrl("dang-nhap.html"), window.location.href);
    loginUrl.searchParams.set("vai-tro", "khach-hang");
    loginUrl.searchParams.set("redirect", getCurrentTargetUrl());
    window.location.href = loginUrl.toString();
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount <= 0) return "Chờ báo giá chốt";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDateTime(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDistance(value) {
    const distance = Number(value || 0);
    if (!Number.isFinite(distance) || distance <= 0) return "--";
    return `${distance.toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })} km`;
  }

  function getQueryCode() {
    try {
      return String(new URLSearchParams(window.location.search).get("code") || "").trim();
    } catch (error) {
      console.error("Cannot resolve booking invoice code:", error);
      return "";
    }
  }

  function getSourceLabel(invoice) {
    if (invoice?.source === "krud") return "Dữ liệu KRUD";
    return "Dữ liệu hiện có";
  }

  function getWeatherLabel(value) {
    const weather = normalizeText(value).toLowerCase();
    if (!weather) return "Chờ đồng bộ";
    if (weather === "binh_thuong") return "Bình thường";
    if (weather === "troi_mua") return "Trời mưa";
    return value;
  }

  function getStatusTone(statusClass) {
    if (statusClass === "xac-nhan") return "completed";
    if (statusClass === "dang-xu-ly") return "shipping";
    if (statusClass === "da-huy" || statusClass === "huy") return "cancelled";
    return "pending";
  }

  function getProgressMeta(invoice) {
    const tone = getStatusTone(invoice?.status_class);
    if (tone === "completed") {
      return {
        percent: 100,
        label: "Đã xác nhận",
        note: "Yêu cầu đã được ghi nhận và chốt phương án triển khai ở mức hiện tại.",
        tone,
      };
    }
    if (tone === "shipping") {
      return {
        percent: 72,
        label: "Đang xử lý",
        note: "Điều phối đang rà tuyến đường, loại xe và các điều kiện triển khai thực tế.",
        tone,
      };
    }
    if (tone === "cancelled") {
      return {
        percent: 100,
        label: "Đã hủy",
        note: "Yêu cầu này không còn tiếp tục xử lý trong hệ thống hiện tại.",
        tone,
      };
    }
    return {
      percent: 24,
      label: "Mới tiếp nhận",
      note: "Hệ thống đã lưu biểu mẫu và đang chờ bước điều phối tiếp theo.",
      tone,
    };
  }

  function renderStatusBadge(statusClass, label) {
    return `<span class="customer-status-badge status-${escapeHtml(
      getStatusTone(statusClass),
    )}">${escapeHtml(label || "Mới tiếp nhận")}</span>`;
  }

  function renderInfoRow(label, value, options = {}) {
    const safeLabel = escapeHtml(label || "--");
    const safeValue = options.valueHtml
      ? value || "--"
      : escapeHtml(value || "--");
    const valueTag = options.valueTag || "strong";

    return `
      <div class="standalone-order-info-row">
        <span>${safeLabel}</span>
        <${valueTag} class="standalone-order-info-value">${safeValue}</${valueTag}>
      </div>
    `;
  }

  function renderHeroMetric(icon, label, value, hint) {
    return `
      <article class="standalone-order-hero-metric">
        <div class="standalone-order-hero-metric-icon">
          <i class="${escapeHtml(icon)}"></i>
        </div>
        <div class="standalone-order-hero-metric-copy">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "--")}</strong>
          <small>${escapeHtml(hint || "--")}</small>
        </div>
      </article>
    `;
  }

  function renderOverviewStat(icon, label, value, hint) {
    return `
      <article class="standalone-order-overview-stat">
        <div class="standalone-order-overview-stat-icon">
          <i class="${escapeHtml(icon)}"></i>
        </div>
        <div class="standalone-order-overview-stat-copy">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "--")}</strong>
          <small>${escapeHtml(hint || "--")}</small>
        </div>
      </article>
    `;
  }

  function renderChipList(items, emptyText) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) {
      return `<div class="standalone-order-note-panel"><p>${escapeHtml(emptyText)}</p></div>`;
    }

    return `
      <div class="standalone-order-item-meta">
        ${list
          .map((item) => `<span class="standalone-order-chip">${escapeHtml(item)}</span>`)
          .join("")}
      </div>
    `;
  }

  function renderAttachmentGrid(title, items, icon, emptyText) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    return `
      <article class="standalone-order-subcard">
        <div class="standalone-order-subcard-head">
          <strong>${escapeHtml(title)}</strong>
          <span class="standalone-order-chip">${escapeHtml(String(list.length || 0))} tệp</span>
        </div>
        ${
          list.length
            ? `<div class="standalone-order-media-grid">
                ${list
                  .map(
                    (item, index) => `
                      <div class="standalone-order-media-item">
                        <div class="standalone-order-item-icon">
                          <i class="${escapeHtml(icon)}"></i>
                        </div>
                        <strong>${escapeHtml(`Tệp ${index + 1}`)}</strong>
                        <span>${escapeHtml(item)}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>`
            : `<div class="standalone-order-note-panel"><p>${escapeHtml(emptyText)}</p></div>`
        }
      </article>
    `;
  }

  function renderFormRows(rows) {
    const list = Array.isArray(rows) ? rows.filter((item) => item && item.value) : [];
    if (!list.length) {
      return `
        <article class="standalone-order-subcard">
          <div class="standalone-order-subcard-head">
            <strong>Biểu mẫu gốc đã lưu</strong>
            <span class="standalone-order-chip">Chưa có dữ liệu</span>
          </div>
          <div class="standalone-order-note-panel">
            <p>Chưa có dữ liệu biểu mẫu gốc để đối chiếu.</p>
          </div>
        </article>
      `;
    }

    const midpoint = Math.ceil(list.length / 2);
    const groups = [list.slice(0, midpoint), list.slice(midpoint)].filter((group) => group.length);

    return `
      <div class="standalone-order-side-stack standalone-order-review-layout">
        ${groups
          .map(
            (group, index) => `
              <article class="standalone-order-subcard">
                <div class="standalone-order-subcard-head">
                  <strong>${escapeHtml(index === 0 ? "Biểu mẫu gốc đã lưu" : "Thông tin biểu mẫu bổ sung")}</strong>
                  <span class="standalone-order-chip">${escapeHtml(String(group.length))} trường</span>
                </div>
                <div class="standalone-order-info-list">
                  ${group
                    .map((item) => renderInfoRow(item.label || item.key || "--", item.value || "--"))
                    .join("")}
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderPricingRows(invoice) {
    const breakdown = Array.isArray(invoice?.pricing_breakdown)
      ? invoice.pricing_breakdown.filter(Boolean)
      : [];

    if (!breakdown.length) {
      return [
        renderInfoRow("Dịch vụ chuyển dọn", formatCurrency(invoice?.estimated_amount)),
        renderInfoRow("Khoảng cách tham chiếu", formatDistance(invoice?.distance_km)),
        renderInfoRow("Loại xe", invoice?.vehicle_label || "--"),
        renderInfoRow("Tổng tạm tính", formatCurrency(invoice?.estimated_amount), {
          valueHtml: true,
          valueTag: "div",
        }),
      ].join("");
    }

    const rows = breakdown.map((item, index) =>
      renderInfoRow(item.label || `Hạng mục ${index + 1}`, item.amount || formatCurrency(item.amount_value || 0)),
    );

    const hasTotal = breakdown.some((item) => item.is_total);
    if (!hasTotal) {
      rows.push(
        renderInfoRow("Tổng tạm tính", formatCurrency(invoice?.estimated_amount), {
          valueHtml: true,
          valueTag: "div",
        }),
      );
    }

    return rows.join("");
  }

  function buildTimeline(invoice) {
    const entries = [
      {
        time: invoice?.created_at,
        title: "Yêu cầu đã ghi nhận",
        note: "Biểu mẫu đặt lịch đã được lưu và gắn với hồ sơ khách hàng hiện tại.",
      },
    ];

    if (invoice?.schedule_label) {
      entries.push({
        time: invoice.schedule_label,
        title: "Khung triển khai dự kiến",
        note: `Lịch dự kiến hiện đang giữ theo mốc ${invoice.schedule_label}.`,
      });
    }

    if (invoice?.status_class === "xac-nhan") {
      entries.push({
        time: "Đã xác nhận",
        title: "Phương án đã xác nhận",
        note: "Điều phối đã chốt lịch, loại xe và phạm vi công việc cho yêu cầu này.",
      });
    } else if (invoice?.status_class === "dang-xu-ly") {
      entries.push({
        time: "Đang xử lý",
        title: "Điều phối đang rà soát",
        note: "Hệ thống đang rà tuyến đường, điều kiện tiếp cận và phương án xe phù hợp.",
      });
    } else {
      entries.push({
        time: "Mới tiếp nhận",
        title: "Chờ điều phối gọi lại",
        note: "Đội vận hành sẽ xác nhận thêm khối lượng và các phát sinh thực tế trước khi chốt phương án.",
      });
    }

    return entries;
  }

  function renderTimeline(entries) {
    const list = Array.isArray(entries) ? entries.filter(Boolean) : [];
    if (!list.length) {
      return '<div class="standalone-order-note-panel"><p>Chưa có nhật ký xử lý cho yêu cầu này.</p></div>';
    }

    return `
      <div class="standalone-order-timeline">
        ${list
          .map(
            (item, index) => `
              <article class="standalone-order-timeline-item">
                <div class="standalone-order-timeline-dot ${index === list.length - 1 ? "is-active" : ""}"></div>
                <div class="standalone-order-timeline-content">
                  <small>${escapeHtml(item.time ? formatDateTime(item.time) !== "--" ? formatDateTime(item.time) : item.time : "--")}</small>
                  <strong>${escapeHtml(item.title || "--")}</strong>
                  <p>${escapeHtml(item.note || "Không có ghi chú bổ sung.")}</p>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderEmptyState(message) {
    root.innerHTML = `
      <div class="standalone-order-empty">
        <div>
          <i class="fa-solid fa-file-invoice-dollar"></i>
          <h2>Không tìm thấy hóa đơn phù hợp</h2>
          <p>${escapeHtml(
            message ||
              "Mã yêu cầu không hợp lệ, không thuộc tài khoản hiện tại hoặc dữ liệu đặt lịch chưa có trong nguồn đang dùng.",
          )}</p>
          <div class="standalone-order-inline-actions" style="justify-content:center; margin-top:18px;">
            <a class="customer-btn customer-btn-primary" href="${escapeHtml(
              getProjectUrl("khach-hang/lich-su-yeu-cau.html"),
            )}">Quay lại lịch sử</a>
            <a class="customer-btn customer-btn-ghost" href="${escapeHtml(
              getProjectUrl("dat-lich.html"),
            )}">Tạo yêu cầu mới</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderInvoice(data) {
    const role = store.getSavedRole();
    if (!role || role !== "khach-hang") {
      redirectToLogin();
      return;
    }

    const invoice = data?.invoice || null;
    const profile = data?.profile || store.readIdentity();
    if (!invoice) {
      renderEmptyState();
      return;
    }

    const progressMeta = getProgressMeta(invoice);
    const timeline = buildTimeline(invoice);
    const rawJson = escapeHtml(JSON.stringify(invoice.raw_row || invoice.form_payload || {}, null, 2));
    const mainLogo = escapeHtml(getProjectUrl("public/assets/images/logo-dich-vu-quanh-ta.png"));
    const brandLogo = escapeHtml(getProjectUrl("public/assets/images/favicon.png"));

    root.innerHTML = `
      <div class="standalone-order-layout">
        <section class="standalone-order-unified-card">
          <div class="standalone-order-topbar">
            <div class="standalone-order-topbar-logo">
              <img src="${mainLogo}" alt="Logo Dịch Vụ Quanh Ta" />
            </div>
            <div class="standalone-order-topbar-center">
              <h2 class="standalone-order-topbar-title">Chi tiết hóa đơn chuyển dọn</h2>
              <div class="standalone-order-topbar-meta">
                <span><i class="fa-solid fa-file-invoice-dollar"></i> ${escapeHtml(invoice.code || "--")}</span>
                <span><i class="fa-solid fa-layer-group"></i> ${escapeHtml(getSourceLabel(invoice))}</span>
                <span><i class="fa-solid fa-clock"></i> ${escapeHtml(formatDateTime(invoice.created_at))}</span>
              </div>
            </div>
            <div class="standalone-order-topbar-logo">
              <img src="${brandLogo}" alt="Logo Dịch vụ Chuyển Dọn" />
            </div>
          </div>

          <header class="standalone-order-card-header">
            <div class="standalone-order-header-main-content">
              <div class="standalone-order-hero-top-row">
                <div class="standalone-order-card-title">
                  <p class="standalone-order-card-kicker">Mã yêu cầu nội bộ</p>
                  <h1>${escapeHtml(invoice.code || "Chi tiết hóa đơn chuyển dọn")}</h1>
                  <p class="standalone-order-card-subtitle">${escapeHtml(invoice.service_label || "Dịch vụ Chuyển Dọn")}</p>
                  <p class="standalone-order-card-summary">${escapeHtml(
                    invoice.summary ||
                      "Trang này gom toàn bộ dữ liệu đặt lịch, tạm tính và thông tin biểu mẫu để khách hàng đối chiếu như một hóa đơn chi tiết.",
                  )}</p>
                </div>

                <div class="standalone-order-hero-side-progress">
                  <div class="standalone-order-progress-ring status-${escapeHtml(
                    progressMeta.tone,
                  )}" style="--progress:${escapeHtml(String(progressMeta.percent))}%;">
                    <div class="standalone-order-progress-ring-core">
                      <strong>${escapeHtml(String(progressMeta.percent))}%</strong>
                      <span>Tiến độ</span>
                    </div>
                  </div>
                  <div class="standalone-order-progress-info">
                    <span class="standalone-order-progress-label">${escapeHtml(progressMeta.label)}</span>
                    <p>${escapeHtml(progressMeta.note)}</p>
                  </div>
                </div>
              </div>

              <div class="standalone-order-hero-metrics">
                ${renderHeroMetric(
                  "fa-solid fa-calendar-check",
                  "Lịch dự kiến",
                  invoice.schedule_label || "Chờ xác nhận",
                  invoice.schedule_time || "Khung giờ triển khai",
                )}
                ${renderHeroMetric(
                  "fa-solid fa-truck-fast",
                  "Loại xe",
                  invoice.vehicle_label || "--",
                  formatDistance(invoice.distance_km),
                )}
                ${renderHeroMetric(
                  "fa-solid fa-wallet",
                  "Tổng tạm tính",
                  formatCurrency(invoice.estimated_amount),
                  "Mốc tham chiếu hiện tại",
                )}
                ${renderHeroMetric(
                  "fa-solid fa-phone-volume",
                  "Đầu mối liên hệ",
                  invoice.contact_name || store.getDisplayName(profile),
                  invoice.contact_phone || profile.phone || "--",
                )}
              </div>
            </div>

            <div class="standalone-order-header-footer-row">
              <div class="standalone-order-header-status-badge">
                ${renderStatusBadge(invoice.status_class, invoice.status_text)}
              </div>
              <div class="standalone-order-actions-group">
                <button type="button" class="customer-btn customer-btn-primary" data-invoice-print>
                  <i class="fa-solid fa-print"></i> In hóa đơn
                </button>
                <a class="customer-btn customer-btn-ghost" href="${escapeHtml(
                  getProjectUrl("khach-hang/lich-su-yeu-cau.html"),
                )}">Về lịch sử</a>
                <a class="customer-btn customer-btn-ghost" href="${escapeHtml(
                  getProjectUrl("dat-lich.html"),
                )}">Tạo đơn mới</a>
              </div>
            </div>
          </header>

          <div class="standalone-order-grid">
            <section class="standalone-order-block">
              <div class="standalone-order-block-header">
                <p class="standalone-order-block-kicker">Tổng quan</p>
                <h2>Nhận diện hóa đơn và tài chính</h2>
                <p>Khối này gom những trường cần đối chiếu nhanh với lịch sử đơn và bản ghi KRUD.</p>
              </div>
              <div class="standalone-order-overview-stats">
                ${renderOverviewStat(
                  "fa-solid fa-database",
                  "Mã KRUD",
                  invoice.remote_id || "--",
                  getSourceLabel(invoice),
                )}
                ${renderOverviewStat(
                  "fa-solid fa-user",
                  "Khách hàng",
                  invoice.contact_name || store.getDisplayName(profile),
                  invoice.customer_email || profile.email || "--",
                )}
                ${renderOverviewStat(
                  "fa-solid fa-building",
                  "Đơn vị / công ty",
                  invoice.company_name || "--",
                  invoice.contact_phone || profile.phone || "--",
                )}
                ${renderOverviewStat(
                  "fa-solid fa-cloud-sun-rain",
                  "Thời tiết dự kiến",
                  getWeatherLabel(invoice.weather_label),
                  invoice.schedule_label || "Chưa chốt lịch",
                )}
              </div>
              <div class="standalone-order-summary-grid">
                <div class="standalone-order-panel standalone-order-panel-overview">
                  <div class="standalone-order-panel-head">
                    <strong>Thông tin triển khai</strong>
                    <span class="standalone-order-chip">Lộ trình</span>
                  </div>
                  <div class="standalone-order-info-list">
                    ${renderInfoRow("Điểm đi", invoice.from_address || "--")}
                    ${renderInfoRow("Điểm đến", invoice.to_address || "--")}
                    ${renderInfoRow("Ngày thực hiện", invoice.schedule_date || "--")}
                    ${renderInfoRow("Khung giờ", invoice.schedule_time || "--")}
                    ${renderInfoRow("Khoảng cách", formatDistance(invoice.distance_km))}
                    ${renderInfoRow("Trạng thái", invoice.status_text || "--")}
                  </div>
                </div>
                <div class="standalone-order-panel standalone-order-panel-fees" id="order-summary-fees">
                  <div class="standalone-order-panel-head">
                    <strong>Tóm tắt tạm tính</strong>
                    <span class="standalone-order-chip">Tài chính</span>
                  </div>
                  <div class="standalone-order-info-list">
                    ${renderPricingRows(invoice)}
                  </div>
                </div>
              </div>
            </section>

            <section class="standalone-order-block">
              <div class="standalone-order-block-header">
                <p class="standalone-order-block-kicker">Liên hệ</p>
                <h2>Điều phối và phạm vi dịch vụ</h2>
                <p>Các thông tin này phản ánh nội dung khách hàng đã gửi trong biểu mẫu đặt lịch.</p>
              </div>
              <div class="standalone-order-contact-grid">
                <article class="standalone-order-contact-card">
                  <div class="standalone-order-contact-card-head">
                    <div class="standalone-order-contact-card-title">
                      <span class="standalone-order-contact-card-icon">
                        <i class="fa-solid fa-location-dot"></i>
                      </span>
                      <div>
                        <strong>Lộ trình vận chuyển</strong>
                        <p>Đối chiếu địa chỉ, loại xe và lịch dự kiến đang lưu.</p>
                      </div>
                    </div>
                    <span class="standalone-order-chip">${escapeHtml(invoice.service_label || "Chuyển dọn")}</span>
                  </div>
                  <div class="standalone-order-info-list">
                    ${renderInfoRow("Điểm đi", invoice.from_address || "--")}
                    ${renderInfoRow("Điểm đến", invoice.to_address || "--")}
                    ${renderInfoRow("Loại xe", invoice.vehicle_label || "--")}
                    ${renderInfoRow("Lịch triển khai", invoice.schedule_label || "--")}
                  </div>
                </article>

                <article class="standalone-order-contact-card">
                  <div class="standalone-order-contact-card-head">
                    <div class="standalone-order-contact-card-title">
                      <span class="standalone-order-contact-card-icon">
                        <i class="fa-solid fa-address-card"></i>
                      </span>
                      <div>
                        <strong>Thông tin liên hệ</strong>
                        <p>Dữ liệu đầu mối đang được dùng để điều phối và xác nhận lại yêu cầu.</p>
                      </div>
                    </div>
                    <span class="standalone-order-chip">${escapeHtml(invoice.status_text || "Mới tiếp nhận")}</span>
                  </div>
                  <div class="standalone-order-info-list">
                    ${renderInfoRow("Khách hàng", invoice.contact_name || store.getDisplayName(profile))}
                    ${renderInfoRow("Số điện thoại", invoice.contact_phone || profile.phone || "--")}
                    ${renderInfoRow("Email", invoice.customer_email || profile.email || "--")}
                    ${renderInfoRow("Đơn vị", invoice.company_name || "--")}
                  </div>
                </article>

                <div class="standalone-order-contact-note">
                  <article class="standalone-order-contact-note-card">
                    <div class="standalone-order-contact-card-head">
                      <div class="standalone-order-contact-card-title">
                        <span class="standalone-order-contact-card-icon standalone-order-contact-card-icon-note">
                          <i class="fa-solid fa-triangle-exclamation"></i>
                        </span>
                        <div>
                          <strong>Lưu ý từ khách hàng</strong>
                          <p>Phần này giữ lại các điều kiện tiếp cận, hạng mục phụ và ghi chú phát sinh.</p>
                        </div>
                      </div>
                      <span class="standalone-order-chip">Lưu ý</span>
                    </div>
                    <div class="standalone-order-note-panel standalone-order-contact-note-panel">
                      <p>${escapeHtml(invoice.note || invoice.meta || "Chưa có ghi chú bổ sung.")}</p>
                    </div>
                    <div class="standalone-order-side-stack standalone-order-review-layout">
                      <article class="standalone-order-subcard">
                        <div class="standalone-order-subcard-head">
                          <strong>Điều kiện tiếp cận</strong>
                          <span class="standalone-order-chip">${escapeHtml(String((invoice.access_conditions || []).length))} mục</span>
                        </div>
                        ${renderChipList(
                          invoice.access_conditions,
                          "Chưa có điều kiện tiếp cận đặc biệt được ghi nhận.",
                        )}
                      </article>
                      <article class="standalone-order-subcard">
                        <div class="standalone-order-subcard-head">
                          <strong>Chi tiết dịch vụ</strong>
                          <span class="standalone-order-chip">${escapeHtml(String((invoice.service_details || []).length))} mục</span>
                        </div>
                        ${renderChipList(
                          invoice.service_details,
                          "Chưa có hạng mục phụ nào được chọn thêm.",
                        )}
                      </article>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section class="standalone-order-block">
              <div class="standalone-order-block-header">
                <p class="standalone-order-block-kicker">Tệp và lịch sử</p>
                <h2>Tài liệu đính kèm và tiến độ xử lý</h2>
                <p>Hiện hệ thống mới lưu tên tệp để đối chiếu. Khi nối media thật có thể nâng cấp sang preview trực tiếp.</p>
              </div>
              <div class="standalone-order-provider-shell">
                <div class="standalone-order-provider-grid">
                  <article class="standalone-order-timeline-card">
                    <div class="standalone-order-panel-head">
                      <strong>Tiến độ xử lý</strong>
                      <span class="standalone-order-chip">Theo dõi</span>
                    </div>
                    ${renderTimeline(timeline)}
                  </article>
                  <article class="standalone-order-media-card">
                    <div class="standalone-order-panel-head">
                      <strong>Raw payload</strong>
                      <span class="standalone-order-chip">Debug</span>
                    </div>
                    <details class="standalone-order-note-panel">
                      <summary>Mở dữ liệu gốc</summary>
                      <pre>${rawJson}</pre>
                    </details>
                  </article>
                </div>
                <div class="standalone-order-provider-grid">
                  ${renderAttachmentGrid(
                    "Ảnh mặt bằng",
                    invoice.image_attachments,
                    "fa-solid fa-image",
                    "Chưa có ảnh đính kèm.",
                  )}
                  ${renderAttachmentGrid(
                    "Video mặt bằng",
                    invoice.video_attachments,
                    "fa-solid fa-video",
                    "Chưa có video đính kèm.",
                  )}
                </div>
              </div>
            </section>

            <section class="standalone-order-block">
              <div class="standalone-order-block-header">
                <p class="standalone-order-block-kicker">Biểu mẫu</p>
                <h2>Dữ liệu gốc khách hàng đã nhập</h2>
                <p>Khối này giúp đối chiếu lại toàn bộ trường đã gửi ở bước đặt lịch, không cần quay ngược lại form.</p>
              </div>
              ${renderFormRows(invoice.form_rows)}
            </section>
          </div>
        </section>
      </div>
    `;

    root.querySelector("[data-invoice-print]")?.addEventListener("click", function () {
      window.print();
    });
  }

  (async function bootstrapInvoiceDetail() {
    const code = getQueryCode();
    if (!code) {
      renderEmptyState("Thiếu mã yêu cầu để tải chi tiết hóa đơn.");
      return;
    }

    try {
      const result = await store.fetchBookingInvoiceDetail?.(code);
      renderInvoice(result || null);
    } catch (error) {
      console.error("Cannot load booking invoice detail:", error);
      renderEmptyState("Không thể tải dữ liệu hóa đơn từ nguồn hiện tại.");
    }
  })();
})(window, document);
