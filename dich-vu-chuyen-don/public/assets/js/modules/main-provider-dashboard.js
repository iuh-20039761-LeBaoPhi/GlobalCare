(function (window, document) {
  if (window.__fastGoProviderDashboardLoaded) return;
  window.__fastGoProviderDashboardLoaded = true;

  const core = window.FastGoCore || {};
  const store = window.FastGoCustomerPortalStore || null;
  const body = document.body;

  if (!body || body.getAttribute("data-page") !== "provider-dashboard") {
    return;
  }

  const root = document.getElementById("provider-dashboard-root");
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

  function getProjectUrl(path) {
    return typeof core.toProjectUrl === "function" ? core.toProjectUrl(path) : path;
  }

  function renderProviderDashboard() {
    const role = store.getSavedRole();
    if (role && role !== "doi-tac") {
      window.location.href = getProjectUrl("dang-nhap.html?vai-tro=doi-tac");
      return;
    }

    const identity = store.readIdentity();
    const displayName = store.getDisplayName(identity);
    const phone = String(identity.phone || "").trim();
    const email = String(identity.email || "").trim();
    const contact = String(identity.contact_person || identity.contactPerson || "").trim();

    root.innerHTML = `
      <div class="customer-portal-shell">
        <section class="customer-panel customer-dashboard-hero">
          <div class="customer-dashboard-hero-copy">
            <p class="customer-section-kicker">Portal đối tác</p>
            <h2>${escapeHtml(displayName)}, đây là khu vực làm việc dành cho đối tác cung ứng chuyển dọn.</h2>
            <p class="customer-dashboard-hero-text">
              Giao diện đã được kéo về cùng ngôn ngữ với portal bên giao hàng để thống nhất trải nghiệm
              trước khi nối thêm các màn điều phối, nhận việc và xác nhận triển khai.
            </p>
            <div class="customer-dashboard-hero-actions">
              <a class="customer-btn customer-btn-primary" href="${escapeHtml(getProjectUrl("bang-gia-chuyen-don.html"))}">
                <i class="fas fa-file-invoice-dollar"></i>
                Xem bảng giá minh bạch
              </a>
              <a class="customer-btn customer-btn-ghost" href="${escapeHtml(getProjectUrl("dat-lich.html"))}">
                <i class="fas fa-calendar-check"></i>
                Xem luồng đặt lịch
              </a>
            </div>
          </div>
          <div class="customer-dashboard-hero-summary">
            <div class="customer-dashboard-highlight-list">
              <article class="customer-dashboard-highlight">
                <span>Vai trò đang đăng nhập</span>
                <strong>Đối tác</strong>
              </article>
              <article class="customer-dashboard-highlight">
                <span>Email vận hành</span>
                <strong>${escapeHtml(email || "--")}</strong>
              </article>
              <article class="customer-dashboard-highlight">
                <span>Số điện thoại</span>
                <strong>${escapeHtml(phone || "--")}</strong>
              </article>
            </div>
          </div>
        </section>

        <div class="customer-grid-two customer-grid-dashboard">
          <div class="customer-portal-main">
            <section class="customer-panel">
              <div class="customer-panel-head">
                <div>
                  <p class="customer-section-kicker">Tài khoản</p>
                  <h2>Thông tin phiên hiện tại</h2>
                  <p class="customer-panel-subtext">Đây là dữ liệu được giữ lại sau bước đăng nhập chung cho đối tác cung ứng.</p>
                </div>
              </div>
              <div class="customer-kpi-grid">
                <article class="customer-kpi-card">
                  <span>Tên hiển thị</span>
                  <strong>${escapeHtml(displayName)}</strong>
                </article>
                <article class="customer-kpi-card">
                  <span>Người phụ trách</span>
                  <strong>${escapeHtml(contact || displayName)}</strong>
                </article>
                <article class="customer-kpi-card">
                  <span>Email</span>
                  <strong>${escapeHtml(email || "--")}</strong>
                </article>
                <article class="customer-kpi-card">
                  <span>Số điện thoại</span>
                  <strong>${escapeHtml(phone || "--")}</strong>
                </article>
              </div>
            </section>

            <section class="customer-panel">
              <div class="customer-panel-head">
                <div>
                  <p class="customer-section-kicker">Bước kế tiếp</p>
                  <h2>Các khối sẽ nối tiếp ở phase sau</h2>
                </div>
              </div>
              <div class="customer-list">
                <article class="customer-todo info">
                  <p>Màn nhận yêu cầu, chốt năng lực đội xe và phân bổ nhân sự sẽ đi vào portal này thay vì dựng UI tách riêng.</p>
                </article>
                <article class="customer-todo warning">
                  <p>Hiện chưa có danh sách việc của đối tác, nên dashboard mới đang đóng vai trò điểm vào và nơi giữ session đúng role.</p>
                </article>
                <article class="customer-todo success">
                  <p>User menu trên header đã nhận diện đúng role đối tác và trỏ về trang này sau khi đăng nhập.</p>
                </article>
              </div>
            </section>
          </div>

          <aside class="customer-portal-sidebar">
            <section class="customer-panel">
              <div class="customer-panel-head">
                <div>
                  <p class="customer-section-kicker">Lối tắt</p>
                  <h2>Đi nhanh</h2>
                </div>
              </div>
              <div class="customer-quicklinks-strip">
                <a class="customer-quicklink-item" href="${escapeHtml(getProjectUrl("bang-gia-chuyen-don.html"))}">
                  <strong>Bảng giá</strong>
                  <span>Xem lại cấu trúc giá minh bạch của dịch vụ chuyển dọn.</span>
                </a>
                <a class="customer-quicklink-item" href="${escapeHtml(getProjectUrl("cam-nang.html"))}">
                  <strong>Cẩm nang</strong>
                  <span>Đối chiếu nội dung truyền thông và hướng dẫn gửi cho khách hàng.</span>
                </a>
                <a class="customer-quicklink-item" href="${escapeHtml(getProjectUrl("dang-nhap.html"))}" data-provider-logout>
                  <strong>Đăng xuất</strong>
                  <span>Kết thúc phiên hiện tại và quay về màn đăng nhập chung.</span>
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `;

    root.querySelector("[data-provider-logout]")?.addEventListener("click", function (event) {
      event.preventDefault();
      store.clearAuthSession();
      window.location.href = getProjectUrl("dang-nhap.html");
    });
  }

  renderProviderDashboard();
})(window, document);
