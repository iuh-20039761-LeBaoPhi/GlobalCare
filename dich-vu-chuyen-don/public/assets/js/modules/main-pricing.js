(function (window, document) {
  if (window.__fastGoPricingInitDone) return;
  window.__fastGoPricingInitDone = true;

  const core = window.FastGoCore;
  if (!core) return;

  function getServiceType() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("chuyen-nha")) return "moving_house";
    if (path.includes("chuyen-van-phong")) return "moving_office";
    if (path.includes("chuyen-kho-bai")) return "moving_warehouse";
    return null;
  }

  async function loadPricing() {
    const serviceType = getServiceType();
    if (!serviceType) return;

    const grid = document.getElementById("pricing-grid");
    if (!grid) return;

    try {
      const resp = await fetch("assets/js/data/pricing-reference.json");
      if (!resp.ok) throw new Error("Thất bại khi tải file JSON");
      const data = await resp.json();

      const serviceData = data.find((s) => s.id === serviceType);
      if (!serviceData) return;

      renderPricing(grid, serviceData);
    } catch (err) {
      console.error("Lỗi load bảng giá:", err);
    }
  }

  function renderPricing(container, data) {
    container.innerHTML = "";
    
    data.pricing_items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "group flex flex-col bg-white rounded-twelve overflow-hidden border border-slate-200 soft-shadow hover:-translate-y-1 transition-all duration-300";
      
      const iconPath = item.icon_d || "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
      const imageSrc = item.image || "assets/images/hero.png";

      card.innerHTML = `
        <div class="relative h-56 w-full overflow-hidden">
          <img alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${imageSrc}">
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div class="absolute bottom-4 left-4 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="${iconPath}" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
            </svg>
          </div>
        </div>
        <div class="p-6">
          <h3 class="text-slate-900 text-xl font-bold mb-2">${item.name}</h3>
          <p class="text-slate-600 text-sm leading-relaxed">${item.note}</p>
          <div class="mt-4 pt-4 border-t border-slate-100">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Giá tham khảo</p>
            <p class="text-accent font-bold text-lg mt-1">
              ${item.price_range}
              <span class="text-sm font-medium text-slate-500">/ ${item.unit}</span>
            </p>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPricing);
  } else {
    loadPricing();
  }
})(window, document);
