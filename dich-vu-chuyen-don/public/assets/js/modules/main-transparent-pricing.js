(function (window, document) {
  if (window.__fastGoTransparentPricingLoaded) return;
  window.__fastGoTransparentPricingLoaded = true;

  const core = window.FastGoCore || {};
  if (!core.toPublicUrl || !core.escapeHtml) return;

  const serviceMeta = {
    chuyen_nha: {
      mo_ta_ngan:
        "Căn hộ, nhà phố, phòng trọ hoặc chung cư cần chuyển đồ sinh hoạt và nội thất gia đình.",
      phu_hop_khi:
        "Phù hợp khi bạn cần xe, nhân công, đóng gói, tháo lắp và sắp xếp lại tại nhà mới.",
      phan_co_ban: ["Xe vận chuyển", "Quãng đường phát sinh"],
      phan_phat_sinh: [
        "Nhân công",
        "Đóng gói",
        "Tháo lắp",
        "Mặt bằng khó",
        "Khung giờ tối/đêm",
        "Thời tiết",
      ],
      luc_nen_khao_sat:
        "Nên khảo sát trước nếu có nhiều tầng, hẻm nhỏ, đồ dễ vỡ, đồ giá trị cao hoặc cần tháo lắp kỹ thuật.",
      trang_dich_vu: "public/trang/dich-vu/chuyen-nha.html",
    },
    chuyen_van_phong: {
      mo_ta_ngan:
        "Văn phòng công ty cần di dời hồ sơ, bàn ghế, máy tính, server và thiết bị vận hành.",
      phu_hop_khi:
        "Phù hợp khi bạn cần di dời có kế hoạch, kiểm soát tài liệu và giữ nhịp vận hành ổn định.",
      phan_co_ban: ["Xe vận chuyển", "Quãng đường phát sinh"],
      phan_phat_sinh: [
        "Đóng gói hồ sơ",
        "Thiết bị IT",
        "Tháo lắp nội thất",
        "Thiết bị nặng",
        "Mặt bằng tòa nhà",
        "Ngoài giờ/cuối tuần",
      ],
      luc_nen_khao_sat:
        "Nên khảo sát trước nếu có server, tài liệu bảo mật, tòa nhà giới hạn giờ ra vào hoặc cần làm ngoài giờ.",
      trang_dich_vu: "public/trang/dich-vu/chuyen-van-phong.html",
    },
    chuyen_kho_bai: {
      mo_ta_ngan:
        "Kho hàng, nhà xưởng hoặc mô hình logistics cần xe tải, xe nâng, xe cẩu và kiểm kê chặt chẽ.",
      phu_hop_khi:
        "Phù hợp khi bạn cần di dời pallet, kiện hàng nặng, máy móc và gia cố hàng hóa trước khi chuyển.",
      phan_co_ban: ["Xe vận chuyển", "Quãng đường phát sinh"],
      phan_phat_sinh: [
        "Pallet",
        "Xe nâng/xe cẩu",
        "Bốc xếp nặng",
        "Gia cố hàng",
        "Đường cấm tải",
        "Kiểm kê",
      ],
      luc_nen_khao_sat:
        "Nên khảo sát trước nếu có máy móc lớn, nhiều pallet, đường cấm tải hoặc cần xe nâng, xe cẩu tại hiện trường.",
      trang_dich_vu: "public/trang/dich-vu/chuyen-kho-bai.html",
    },
  };

  const commonFactors = [
    {
      ten: "Quãng đường di chuyển",
      mo_ta: "Khoảng cách từ điểm đi đến điểm đến là nền tảng để tính xe cơ bản và phần km phát sinh.",
    },
    {
      ten: "Loại xe phù hợp",
      mo_ta: "Mỗi quy mô nhu cầu sẽ cần loại xe khác nhau. Xe càng lớn thì giá mở đầu càng khác.",
    },
    {
      ten: "Nhân công và hạng mục hỗ trợ",
      mo_ta: "Đóng gói, tháo lắp, bốc xếp, xe nâng hoặc xe cẩu đều làm thay đổi chi phí tham khảo.",
    },
    {
      ten: "Điều kiện mặt bằng",
      mo_ta: "Hẻm nhỏ, cầu thang hẹp, xe đỗ xa, đường cấm tải hoặc cần trung chuyển đều có thể phát sinh thêm.",
    },
    {
      ten: "Khung giờ thực hiện",
      mo_ta: "Buổi tối, ban đêm hoặc cuối tuần thường khác với khung giờ tiêu chuẩn ban ngày.",
    },
    {
      ten: "Thời tiết và tình trạng thực tế",
      mo_ta: "Mưa, mặt bằng trơn trượt hoặc điều kiện bốc xếp khó có thể làm chi phí thay đổi so với mức tham khảo.",
    },
  ];

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function formatCurrency(amount) {
    const value = Number(amount || 0);
    if (!Number.isFinite(value)) return "";
    return `${value.toLocaleString("vi-VN")}đ`;
  }

  function loadTransparentPricingData() {
    return fetch(core.toPublicUrl("assets/js/data/bang-gia-minh-bach.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Cannot load transparent pricing data: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Cannot load transparent pricing data:", error);
        return [];
      });
  }

  function getServiceMeta(slug) {
    return serviceMeta[String(slug || "").trim()] || {};
  }

  function collectSurchargeTexts(groups) {
    const items = [];

    if (groups?.khung_gio?.buoi_toi) {
      items.push("Buổi tối");
    }
    if (groups?.khung_gio?.ban_dem) {
      items.push("Ban đêm");
    }
    if (groups?.thoi_tiet?.troi_mua) {
      items.push("Trời mưa");
    }

    ["dieu_kien_tiep_can", "dac_thu"].forEach((groupKey) => {
      const list = groups?.[groupKey];
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        items.push(core.escapeHtml(item.ten_muc || ""));
      });
    });

    return items;
  }

  function buildQuickCompare(data) {
    return `
      <section class="phan-bang-gia-so-sanh">
        <div class="dau-muc-trang">
          <span class="the-thong-tin-nhan">So sánh nhanh</span>
          <h2>Ba nhóm dịch vụ khác nhau ngay từ cách hình thành giá</h2>
          <p>Trang này không lặp lại bảng giá chi tiết của từng dịch vụ. Nó giúp bạn hiểu vì sao giá mở đầu khác nhau và vì sao có phát sinh.</p>
        </div>
        <div class="luoi-so-sanh-dich-vu">
          ${data
            .map((item) => {
              const slug = String(item.slug_dich_vu || "").trim();
              const meta = getServiceMeta(slug);
              const hangMuc = (item.hang_muc_hien_thi || [])
                .slice(0, 3)
                .map((entry) => `<li>${core.escapeHtml(entry.ten_hang_muc || "")}</li>`)
                .join("");
              return `
                <article class="the-so-sanh-dich-vu">
                  <span class="nhan-dich-vu-bang-gia">${core.escapeHtml(item.ten_dich_vu || "")}</span>
                  <strong class="gia-mo-dau-bang-gia">${core.escapeHtml(item.gia_tu || "")}</strong>
                  <p>${core.escapeHtml(meta.mo_ta_ngan || "")}</p>
                  <ul class="danh-sach-tom-tat">
                    ${hangMuc}
                  </ul>
                  <a class="link-phu-bang-gia" href="${core.escapeHtml(meta.trang_dich_vu || "#")}">Xem bảng giá chi tiết ở trang dịch vụ</a>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function buildCommonFormulaSection() {
    return `
      <section class="phan-cach-hinh-thanh-gia">
        <div class="dau-muc-trang">
          <span class="the-thong-tin-nhan">Công thức chung</span>
          <h2>Giá tham khảo được hình thành từ đâu</h2>
          <p>Dù là chuyển nhà, chuyển văn phòng công ty hay chuyển kho bãi, chi phí đều xoay quanh sáu nhóm yếu tố dưới đây.</p>
        </div>
        <div class="luoi-yeu-to-gia">
          ${commonFactors
            .map(
              (item) => `
                <article class="the-yeu-to-gia">
                  <h3>${core.escapeHtml(item.ten)}</h3>
                  <p>${core.escapeHtml(item.mo_ta)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function buildServiceFormulaSection(data) {
    return `
      <section class="phan-cong-thuc-rieng">
        <div class="dau-muc-trang">
          <span class="the-thong-tin-nhan">Công thức riêng</span>
          <h2>Mỗi dịch vụ có một lớp phát sinh khác nhau</h2>
          <p>Phần khác biệt không nằm ở tên dịch vụ, mà nằm ở hạng mục hỗ trợ và phụ phí đặc thù của từng ca chuyển dọn.</p>
        </div>
        <div class="luoi-cong-thuc-rieng">
          ${data
            .map((item) => {
              const slug = String(item.slug_dich_vu || "").trim();
              const meta = getServiceMeta(slug);
              const phanCoBan = Array.isArray(meta.phan_co_ban) ? meta.phan_co_ban : [];
              const phanPhatSinh = Array.isArray(meta.phan_phat_sinh) ? meta.phan_phat_sinh : [];
              return `
                <article class="the-cong-thuc-rieng">
                  <div class="dau-the-cong-thuc">
                    <span class="nhan-dich-vu-bang-gia">${core.escapeHtml(item.ten_dich_vu || "")}</span>
                    <h3>${core.escapeHtml(item.ten_dich_vu || "")}</h3>
                    <p>${core.escapeHtml(meta.phu_hop_khi || "")}</p>
                  </div>

                  <div class="luoi-cau-truc-gia">
                    <section class="khung-cau-truc-gia">
                      <span class="nhan-cau-truc-gia">Phần cơ bản</span>
                      <div class="cum-chip-bang-gia cum-chip-bang-gia-nhat">
                        ${phanCoBan
                          .map((entry) => `<span class="chip-bang-gia">${core.escapeHtml(entry)}</span>`)
                          .join("")}
                      </div>
                    </section>

                    <section class="khung-cau-truc-gia">
                      <span class="nhan-cau-truc-gia">Phần phát sinh nếu có</span>
                      <div class="cum-chip-bang-gia">
                        ${phanPhatSinh
                          .map((entry) => `<span class="chip-bang-gia">${core.escapeHtml(entry)}</span>`)
                          .join("")}
                      </div>
                    </section>
                  </div>

                  <section class="khung-canh-bao-khao-sat">
                    <span class="nhan-canh-bao-khao-sat">Nên khảo sát trước khi</span>
                    <p>${core.escapeHtml(meta.luc_nen_khao_sat || "")}</p>
                  </section>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function buildSurchargeSection(data) {
    return `
      <section class="phan-phu-phi">
        <div class="dau-muc-trang">
          <span class="the-thong-tin-nhan">Phụ phí phát sinh</span>
          <h2>Những yếu tố dễ làm giá thay đổi nhất</h2>
          <p>Trang này chỉ chỉ ra nhóm yếu tố làm giá tăng, không lặp lại mức tiền chi tiết của từng dịch vụ. Bảng giá cụ thể vẫn nằm ở trang dịch vụ tương ứng.</p>
        </div>
        <div class="luoi-phu-phi">
          ${data
            .map((item) => {
              const surchargeTexts = collectSurchargeTexts(item.phu_phi);
              return `
                <article class="the-phu-phi">
                  <h3>${core.escapeHtml(item.ten_dich_vu || "")}</h3>
                  <div class="cum-chip-bang-gia">
                    ${surchargeTexts
                      .map((text) => `<span class="chip-bang-gia">${text}</span>`)
                      .join("")}
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function buildDecisionSection(data) {
    return `
      <section class="phan-ra-quyet-dinh">
        <div class="dau-muc-trang">
          <span class="the-thong-tin-nhan">Ra quyết định</span>
          <h2>Khi nào nên khảo sát, khi nào có thể đặt lịch luôn</h2>
          <p>Nếu bạn chưa chắc về mặt bằng, khối lượng hoặc phụ phí phát sinh, khảo sát trước luôn là lựa chọn an toàn hơn.</p>
        </div>
        <div class="bang-quyet-dinh">
          <div class="dong-bang-quyet-dinh dong-bang-quyet-dinh-tieu-de">
            <div class="o-bang-quyet-dinh o-bang-quyet-dinh-tieu-chi">Tiêu chí</div>
            ${data.map((item) => `<div class="o-bang-quyet-dinh">${core.escapeHtml(item.ten_dich_vu || "")}</div>`).join("")}
          </div>
          <div class="dong-bang-quyet-dinh">
            <div class="o-bang-quyet-dinh o-bang-quyet-dinh-tieu-chi">Có thể đặt lịch luôn khi</div>
            ${data
              .map(
                (item) =>
                  `<div class="o-bang-quyet-dinh">Bạn đã rõ lộ trình, mặt bằng và không có hạng mục đặc biệt ngoài gói cơ bản.</div>`,
              )
              .join("")}
          </div>
          <div class="dong-bang-quyet-dinh">
            <div class="o-bang-quyet-dinh o-bang-quyet-dinh-tieu-chi">Nên khảo sát trước khi</div>
            ${data
              .map(
                (item) =>
                  `<div class="o-bang-quyet-dinh">${core.escapeHtml(
                    getServiceMeta(item.slug_dich_vu).luc_nen_khao_sat || "",
                  )}</div>`,
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderTransparentPricing(root, data) {
    if (!Array.isArray(data) || !data.length) {
      root.innerHTML =
        '<p class="trang-thai-bang-gia">Chưa có dữ liệu để hiển thị phần công thức minh bạch.</p>';
      return;
    }

    root.innerHTML = `
      ${buildQuickCompare(data)}
      ${buildCommonFormulaSection()}
      ${buildServiceFormulaSection(data)}
      ${buildSurchargeSection(data)}
      ${buildDecisionSection(data)}
    `;
  }

  onReady(function () {
    const root = document.querySelector("[data-bang-gia-minh-bach-root]");
    if (!root) return;

    loadTransparentPricingData().then((data) => {
      renderTransparentPricing(root, data);
    });
  });
})(window, document);
