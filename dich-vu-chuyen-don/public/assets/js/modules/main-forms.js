(function (window, document) {
  if (window.__fastGoFormsInitDone) return;
  window.__fastGoFormsInitDone = true;

  const core = window.FastGoCore;
  if (!core) return;

  const partialPaths = {
    "khao-sat": core.toPublicUrl("assets/partials/bieu-mau/form-khao-sat.html"),
    "dat-lich": core.toPublicUrl("assets/partials/bieu-mau/form-dat-lich.html"),
  };

  const bookingVehicleOptions = {
    chuyen_nha: {
      note: "Gợi ý mặc định: xe Van 500kg cho nhu cầu nhỏ, xe tải 1.5 tấn hoặc 2.5 tấn cho nhà nhiều phòng và nhiều đồ.",
      defaultValue: "xe_van_500kg",
      options: [
        { value: "xe_van_500kg", label: "Xe Van 500kg" },
        { value: "xe_tai_1_5_tan", label: "Xe Tải 1.5 Tấn" },
        { value: "xe_tai_2_5_tan", label: "Xe Tải 2.5 Tấn" },
      ],
    },
    chuyen_van_phong: {
      note: "Gợi ý mặc định: xe Van 500kg cho văn phòng nhỏ, xe tải 1.5 tấn hoặc 2.5 tấn cho nhiều chỗ ngồi và thiết bị.",
      defaultValue: "xe_van_500kg",
      options: [
        { value: "xe_van_500kg", label: "Xe Van 500kg (VP)" },
        { value: "xe_tai_1_5_tan", label: "Xe Tải 1.5 Tấn (VP)" },
        { value: "xe_tai_2_5_tan", label: "Xe Tải 2.5 Tấn (VP)" },
      ],
    },
    chuyen_kho_bai: {
      note: "Gợi ý mặc định: xe tải 1.5 tấn cho kho nhỏ, xe 2.5 tấn hoặc 5 tấn cho khối lượng lớn và hàng nặng.",
      defaultValue: "xe_tai_1_5_tan",
      options: [
        { value: "xe_tai_1_5_tan", label: "Xe Tải 1.5 Tấn (Kho)" },
        { value: "xe_tai_2_5_tan", label: "Xe Tải 2.5 Tấn (Kho)" },
        { value: "xe_tai_5_tan", label: "Xe Tải 5 Tấn (Kho)" },
      ],
    },
  };

  let pricingReferencePromise = null;

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function loadPartial(url) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        return xhr.responseText.trim();
      }
    } catch (error) {
      console.error("Cannot load form partial:", url, error);
    }
    return "";
  }

  function loadPricingReference() {
    if (!pricingReferencePromise) {
      pricingReferencePromise = fetch(
        core.toPublicUrl("assets/js/data/pricing-reference.json"),
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Cannot load pricing reference: ${response.status}`);
          }
          return response.json();
        })
        .catch((error) => {
          console.error("Cannot load pricing reference:", error);
          return [];
        });
    }

    return pricingReferencePromise;
  }

  function normalizeService(rawValue) {
    const value = String(rawValue || "").trim().toLowerCase();
    const map = {
      chuyen_nha: "chuyen_nha",
      "chuyen-nha": "chuyen_nha",
      moving_house: "chuyen_nha",
      chuyen_van_phong: "chuyen_van_phong",
      "chuyen-van-phong": "chuyen_van_phong",
      moving_office: "chuyen_van_phong",
      chuyen_kho_bai: "chuyen_kho_bai",
      "chuyen-kho-bai": "chuyen_kho_bai",
      moving_warehouse: "chuyen_kho_bai",
    };
    return map[value] || "";
  }

  function getPricingServiceId(rawValue) {
    const normalized = normalizeService(rawValue);
    const map = {
      chuyen_nha: "moving_house",
      chuyen_van_phong: "moving_office",
      chuyen_kho_bai: "moving_warehouse",
    };
    return map[normalized] || "";
  }

  function getSelectedLabel(select) {
    if (!select) return "";
    const option = select.options[select.selectedIndex];
    return option ? String(option.textContent || "").trim() : "";
  }

  function getCheckedLabel(scope, selector) {
    const input = scope.querySelector(`${selector}:checked`);
    if (!input) return "";
    const label = input.closest("label");
    return label ? String(label.textContent || "").trim() : "";
  }

  function getCheckedLabels(scope, selector) {
    return Array.from(scope.querySelectorAll(`${selector}:checked`))
      .map((input) => {
        const label = input.closest("label");
        return label ? String(label.textContent || "").trim() : "";
      })
      .filter(Boolean);
  }

  function countChecked(scope, selector) {
    return scope.querySelectorAll(`${selector}:checked`).length;
  }

  function countFiles(scope, selector) {
    return Array.from(scope.querySelectorAll(selector)).reduce((total, input) => {
      return total + (input.files ? input.files.length : 0);
    }, 0);
  }

  function mapBookingPricingTimeSlot(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) return "";
    if (value === "toi") return "buoi_toi";
    if (value === "dem") return "ban_dem";
    if (value === "linh_dong") return "can_xac_nhan";
    return "binh_thuong";
  }

  function getBookingPricingTimeLabel(rawValue) {
    const mapped = mapBookingPricingTimeSlot(rawValue);
    if (!mapped) return "Chưa chọn";
    if (mapped === "buoi_toi") return "Buổi tối";
    if (mapped === "ban_dem") return "Ban đêm";
    if (mapped === "can_xac_nhan") return "Chờ xác nhận";
    return "Ban ngày";
  }

  function revokePreviewUrl(preview) {
    const currentUrl = preview?.dataset?.objectUrl;
    if (currentUrl) {
      window.URL.revokeObjectURL(currentUrl);
      delete preview.dataset.objectUrl;
    }
  }

  function revokePreviewUrlsIn(container) {
    container?.querySelectorAll("[data-object-url]").forEach((node) => {
      const url = node.getAttribute("data-object-url");
      if (url) {
        window.URL.revokeObjectURL(url);
        node.removeAttribute("data-object-url");
      }
    });
  }

  function calculateDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  function updateFilePreview(scope, input) {
    const previewId = input.getAttribute("data-xem-truoc-tep");
    const preview = previewId ? scope.querySelector(`#${previewId}`) : null;
    if (!preview) return;

    revokePreviewUrl(preview);

    const file = input.files && input.files[0];
    if (!file) {
      if (preview.tagName === "VIDEO") {
        preview.pause();
        preview.removeAttribute("src");
        preview.load();
      } else {
        preview.removeAttribute("src");
      }
      preview.hidden = true;
      return;
    }

    const objectUrl = window.URL.createObjectURL(file);
    preview.dataset.objectUrl = objectUrl;
    preview.src = objectUrl;
    preview.hidden = false;

    if (preview.tagName === "VIDEO") {
      preview.load();
    }
  }

  function updateSpecialItemField(scope) {
    const trigger = scope.querySelector("[data-bat-khac]");
    const target = scope.querySelector("[data-khoi-hang-muc-khac]");
    const input = target ? target.querySelector("input") : null;
    if (!trigger || !target) return;

    const shouldShow = !!trigger.checked;
    target.hidden = !shouldShow;
    target.classList.toggle("is-hidden", !shouldShow);

    if (!shouldShow && input) {
      input.value = "";
    }
  }

  function formatLatLng(lat, lng) {
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return "";
    return `${safeLat.toFixed(6)}, ${safeLng.toFixed(6)}`;
  }

  function renderSurveyMapPreview(scope) {
    const addressInput = scope.querySelector("#dia-chi-khao-sat");
    const destinationInput = scope.querySelector("#dia-chi-diem-den-du-kien");
    const surveyOutput = scope.querySelector(
      "[data-vi-tri-ban-do-da-chon='khao_sat']",
    );
    const destinationOutput = scope.querySelector(
      "[data-vi-tri-ban-do-da-chon='diem_den']",
    );
    const surveyLatInput = scope.querySelector(
      "[data-ban-do-toa-do='khao_sat_lat']",
    );
    const surveyLngInput = scope.querySelector(
      "[data-ban-do-toa-do='khao_sat_lng']",
    );
    const destinationLatInput = scope.querySelector(
      "[data-ban-do-toa-do='diem_den_lat']",
    );
    const destinationLngInput = scope.querySelector(
      "[data-ban-do-toa-do='diem_den_lng']",
    );

    if (!addressInput || !surveyOutput || !destinationOutput) return;

    const surveyText = String(addressInput.value || "").trim();
    const destinationText = String(destinationInput?.value || "").trim();
    const surveyCoordText = formatLatLng(
      surveyLatInput?.value,
      surveyLngInput?.value,
    );
    const destinationCoordText = formatLatLng(
      destinationLatInput?.value,
      destinationLngInput?.value,
    );

    surveyOutput.textContent =
      surveyText || surveyCoordText || "Đang chờ xác nhận vị trí điểm khảo sát.";
    destinationOutput.textContent =
      destinationText ||
      destinationCoordText ||
      "Kéo ghim đỏ hoặc nhập địa chỉ điểm đến.";
  }

  async function reverseGeocodeSurvey(lat, lng) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    const data = await response.json();
    return String(data?.display_name || "").trim();
  }

  async function geocodeSurveyAddress(address) {
    const query = String(address || "").trim();
    if (!query) return null;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=vn&limit=1`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: String(data[0].display_name || "").trim(),
    };
  }

  function initSurveyMap(scope) {
    if (!scope.querySelector(".form-khao-sat") || !window.L) return;

    const mapElement = scope.querySelector("#ban-do-khao-sat");
    const surveyInput = scope.querySelector("#dia-chi-khao-sat");
    const destinationInput = scope.querySelector("#dia-chi-diem-den-du-kien");
    const surveyLatInput = scope.querySelector(
      "[data-ban-do-toa-do='khao_sat_lat']",
    );
    const surveyLngInput = scope.querySelector(
      "[data-ban-do-toa-do='khao_sat_lng']",
    );
    const destinationLatInput = scope.querySelector(
      "[data-ban-do-toa-do='diem_den_lat']",
    );
    const destinationLngInput = scope.querySelector(
      "[data-ban-do-toa-do='diem_den_lng']",
    );
    const statusOutput = scope.querySelector("[data-trang-thai-ban-do-ui]");
    const currentButton = scope.querySelector(
      "[data-ban-do-hanh-dong='vi-tri-hien-tai']",
    );

    if (
      !mapElement ||
      !surveyInput ||
      !destinationInput ||
      !surveyLatInput ||
      !surveyLngInput ||
      !destinationLatInput ||
      !destinationLngInput
    ) {
      return;
    }
    if (mapElement.dataset.mapReady === "true") return;

    mapElement.dataset.mapReady = "true";

    const defaultCenter = [10.762622, 106.660172];
    const map = window.L.map(mapElement).setView(defaultCenter, 12);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    function createPinIcon(fill) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
          <path fill="${fill}" d="M16 1C7.2 1 0 8.2 0 17c0 12.2 13.4 28.4 15.1 30.4.5.6 1.4.6 1.9 0C18.6 45.4 32 29.2 32 17 32 8.2 24.8 1 16 1z"/>
          <circle cx="16" cy="17" r="7.2" fill="#fff"/>
        </svg>
      `.trim();

      return window.L.icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        iconSize: [32, 48],
        iconAnchor: [16, 47],
        tooltipAnchor: [0, -34],
      });
    }

    const surveyIcon = createPinIcon("#1b4332");
    const destinationIcon = createPinIcon("#dc2626");

    const surveyMarker = window.L.marker(defaultCenter, {
      draggable: true,
      icon: surveyIcon,
    })
      .addTo(map)
      .bindTooltip("<div>Khảo sát</div>", {
        permanent: true,
        direction: "top",
        offset: [0, -30],
        className: "map-marker-tooltip map-marker-tooltip--survey",
      });

    const destinationMarker = window.L.marker(
      [defaultCenter[0] - 0.01, defaultCenter[1] - 0.01],
      {
        draggable: true,
        icon: destinationIcon,
      },
    )
      .addTo(map)
      .bindTooltip("<div>Điểm đến</div>", {
        permanent: true,
        direction: "top",
        offset: [0, -30],
        className: "map-marker-tooltip map-marker-tooltip--destination",
      });

    const connectionLine = window.L.polyline([], {
      color: "#1b4332",
      weight: 4,
      opacity: 0.72,
      dashArray: "10 8",
      lineCap: "round",
    }).addTo(map);

    function getPointConfig(point) {
      if (point === "diem_den") {
        return {
          input: destinationInput,
          latInput: destinationLatInput,
          lngInput: destinationLngInput,
          marker: destinationMarker,
          emptyText: "Chưa có vị trí điểm đến.",
          geocodeStatus:
            "Đang cập nhật địa chỉ điểm đến từ vị trí đã chọn...",
          successStatus:
            "Đã cập nhật điểm đến từ vị trí trên bản đồ.",
          fallbackStatus:
            "Đã chọn vị trí điểm đến trên bản đồ, nhưng chưa thể tự động đọc ra địa chỉ.",
        };
      }

      return {
        input: surveyInput,
        latInput: surveyLatInput,
        lngInput: surveyLngInput,
        marker: surveyMarker,
        emptyText: "Chưa có vị trí khảo sát.",
        geocodeStatus:
          "Đang cập nhật địa chỉ khảo sát từ vị trí đã chọn...",
        successStatus:
          "Đã cập nhật địa chỉ khảo sát từ vị trí trên bản đồ.",
        fallbackStatus:
          "Đã chọn vị trí khảo sát trên bản đồ, nhưng chưa thể tự động đọc ra địa chỉ.",
      };
    }

    function setPointCoords(point, lat, lng) {
      const config = getPointConfig(point);
      config.latInput.value = String(lat);
      config.lngInput.value = String(lng);
      renderSurveyMapPreview(scope);
      renderFormSummaries(scope);
    }

    function clearPoint(point) {
      const config = getPointConfig(point);
      config.latInput.value = "";
      config.lngInput.value = "";
      renderSurveyMapPreview(scope);
      renderFormSummaries(scope);
    }

    function updateConnectionLine() {
      connectionLine.setLatLngs([
        surveyMarker.getLatLng(),
        destinationMarker.getLatLng(),
      ]);
    }

    function updateMapBounds() {
      const group = new window.L.featureGroup([surveyMarker, destinationMarker]);
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 16 });
    }

    async function moveMarker(point, lat, lng, options = {}) {
      const shouldReverse = options.shouldReverse !== false;
      const shouldWriteAddress = options.shouldWriteAddress !== false;
      const shouldReframe = options.shouldReframe !== false;
      const config = getPointConfig(point);

      config.marker.setLatLng([lat, lng]);
      setPointCoords(point, lat, lng);
      updateConnectionLine();

      if (shouldReframe) {
        updateMapBounds();
      }

      if (!shouldReverse) return;

      if (statusOutput) {
        statusOutput.textContent = config.geocodeStatus;
      }

      try {
        const label = await reverseGeocodeSurvey(lat, lng);
        if (label && shouldWriteAddress) {
          config.input.value = label;
        }
        renderSurveyMapPreview(scope);
        if (statusOutput) {
          statusOutput.textContent = label
            ? config.successStatus
            : "Đã chọn vị trí trên bản đồ.";
        }
      } catch (error) {
        console.warn("Survey reverse geocode failed:", error);
        if (statusOutput) {
          statusOutput.textContent = config.fallbackStatus;
        }
      }
    }

    surveyMarker.on("dragend", function () {
      const latlng = surveyMarker.getLatLng();
      moveMarker("khao_sat", latlng.lat, latlng.lng, { shouldReverse: true });
    });

    destinationMarker.on("dragend", function () {
      const latlng = destinationMarker.getLatLng();
      moveMarker("diem_den", latlng.lat, latlng.lng, { shouldReverse: true });
    });

    function setCurrentButtonLoading(isLoading) {
      if (!currentButton) return;
      if (!currentButton.dataset.originalLabel) {
        currentButton.dataset.originalLabel = currentButton.textContent || "";
      }

      currentButton.disabled = isLoading;
      currentButton.textContent = isLoading
        ? "Đang lấy vị trí..."
        : currentButton.dataset.originalLabel;
    }

    function requestCurrentLocation(options = {}) {
      const silent = options.silent === true;
      if (!navigator.geolocation) {
        if (!silent && statusOutput) {
          statusOutput.textContent =
            "Thiết bị này không hỗ trợ lấy vị trí hiện tại. Bạn có thể nhập địa chỉ hoặc kéo ghim xanh để chọn.";
        }
        return;
      }

      if (!silent && statusOutput) {
        statusOutput.textContent = "Đang lấy vị trí hiện tại cho điểm khảo sát...";
      }
      setCurrentButtonLoading(true);

      navigator.geolocation.getCurrentPosition(
        function (position) {
          moveMarker("khao_sat", position.coords.latitude, position.coords.longitude, {
            shouldReverse: true,
          }).finally(function () {
            setCurrentButtonLoading(false);
            if (silent && statusOutput) {
              statusOutput.textContent =
                "Đã cập nhật nhanh địa chỉ điểm khảo sát theo vị trí hiện tại.";
            }
          });
        },
        function () {
          setCurrentButtonLoading(false);
          if (!silent && statusOutput) {
            statusOutput.textContent =
              "Không lấy được vị trí hiện tại. Bạn có thể nhập địa chỉ hoặc kéo ghim xanh để chỉnh thủ công.";
          }
        },
        { timeout: 10000 },
      );
    }

    currentButton?.addEventListener("click", function () {
      requestCurrentLocation({ silent: false });
    });

    let surveyTimer = null;
    let destinationTimer = null;

    surveyInput.addEventListener("input", function () {
      clearTimeout(surveyTimer);
      const query = String(surveyInput.value || "").trim();

      if (!query) {
        if (statusOutput) {
          statusOutput.textContent =
            "Bạn có thể nhập lại địa chỉ hoặc kéo ghim xanh để xác định điểm khảo sát.";
        }
        renderSurveyMapPreview(scope);
        return;
      }

      surveyTimer = window.setTimeout(async function () {
        try {
          if (statusOutput) {
            statusOutput.textContent =
              "Đang dò vị trí khảo sát từ địa chỉ bạn vừa nhập...";
          }

          const result = await geocodeSurveyAddress(query);
          if (!result) {
            if (statusOutput) {
              statusOutput.textContent =
                "Chưa tìm thấy vị trí khảo sát khớp hoàn toàn với địa chỉ này. Bạn có thể tinh lại địa chỉ hoặc kéo ghim xanh trên bản đồ.";
            }
            return;
          }

          await moveMarker("khao_sat", result.lat, result.lng, {
            shouldReverse: false,
          });

          if (statusOutput) {
            statusOutput.textContent =
              "Đã ghim vị trí khảo sát theo địa chỉ bạn nhập. Bạn vẫn có thể kéo ghim để chỉnh lại chính xác hơn.";
          }
        } catch (error) {
          console.warn("Survey address geocode failed:", error);
          if (statusOutput) {
            statusOutput.textContent =
              "Chưa thể dò vị trí khảo sát từ địa chỉ. Bạn có thể kéo ghim xanh để chọn thủ công.";
          }
        }
      }, 600);
    });

    destinationInput.addEventListener("input", function () {
      clearTimeout(destinationTimer);
      const query = String(destinationInput.value || "").trim();

      if (!query) {
        if (statusOutput) {
          statusOutput.textContent =
            "Bạn có thể nhập lại địa chỉ điểm đến hoặc kéo ghim đỏ để đối chiếu vị trí.";
        }
        renderSurveyMapPreview(scope);
        return;
      }

      destinationTimer = window.setTimeout(async function () {
        try {
          if (statusOutput) {
            statusOutput.textContent =
              "Đang dò vị trí điểm đến từ địa chỉ bạn vừa nhập...";
          }

          const result = await geocodeSurveyAddress(query);
          if (!result) {
            if (statusOutput) {
              statusOutput.textContent =
                "Chưa tìm thấy vị trí điểm đến khớp hoàn toàn với địa chỉ này. Bạn có thể tinh lại địa chỉ hoặc kéo ghim đỏ trên bản đồ.";
            }
            return;
          }

          await moveMarker("diem_den", result.lat, result.lng, {
            shouldReverse: false,
          });

          if (statusOutput) {
            statusOutput.textContent =
              "Đã ghim điểm đến theo địa chỉ bạn nhập. Bạn vẫn có thể kéo ghim để chỉnh lại chính xác hơn.";
          }
        } catch (error) {
          console.warn("Survey destination geocode failed:", error);
          if (statusOutput) {
            statusOutput.textContent =
              "Chưa thể dò vị trí điểm đến từ địa chỉ. Bạn có thể kéo ghim đỏ để chọn thủ công.";
          }
        }
      }, 600);
    });

    clearPoint("khao_sat");
    clearPoint("diem_den");
    updateConnectionLine();
    updateMapBounds();
    requestCurrentLocation({ silent: true });

    window.setTimeout(function () {
      map.invalidateSize();
    }, 120);
  }

  function renderBookingMapPreview(scope) {
    const fromInput = scope.querySelector("#dia-chi-di-dat-lich");
    const toInput = scope.querySelector("#dia-chi-den-dat-lich");
    const fromOutput = scope.querySelector(
      "[data-vi-tri-ban-do-dat-lich='diem_di']",
    );
    const toOutput = scope.querySelector(
      "[data-vi-tri-ban-do-dat-lich='diem_den']",
    );
    const fromLatInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_di_lat']",
    );
    const fromLngInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_di_lng']",
    );
    const toLatInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_den_lat']",
    );
    const toLngInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_den_lng']",
    );

    if (!fromInput || !toInput || !fromOutput || !toOutput) return;

    const fromText = String(fromInput.value || "").trim();
    const toText = String(toInput.value || "").trim();
    const fromCoordText = formatLatLng(fromLatInput?.value, fromLngInput?.value);
    const toCoordText = formatLatLng(toLatInput?.value, toLngInput?.value);

    fromOutput.textContent =
      fromText || fromCoordText || "Đang chờ xác nhận vị trí điểm đi.";
    toOutput.textContent =
      toText || toCoordText || "Đang chờ xác nhận vị trí điểm đến.";
  }

  function initBookingMap(scope) {
    if (!scope.querySelector(".form-dat-lich") || !window.L) return;

    const mapElement = scope.querySelector("#ban-do-dat-lich");
    const fromInput = scope.querySelector("#dia-chi-di-dat-lich");
    const toInput = scope.querySelector("#dia-chi-den-dat-lich");
    const fromLatInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_di_lat']",
    );
    const fromLngInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_di_lng']",
    );
    const toLatInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_den_lat']",
    );
    const toLngInput = scope.querySelector(
      "[data-ban-do-dat-lich-toa-do='diem_den_lng']",
    );
    const statusOutput = scope.querySelector("[data-trang-thai-ban-do-dat-lich]");
    const distanceBadge = scope.querySelector("[data-khoang-cach-dat-lich]");
    const distanceValue = scope.querySelector(
      "[data-gia-tri-khoang-cach-dat-lich]",
    );
    const currentButton = scope.querySelector(
      "[data-ban-do-dat-lich-hanh-dong='vi-tri-hien-tai']",
    );

    if (
      !mapElement ||
      !fromInput ||
      !toInput ||
      !fromLatInput ||
      !fromLngInput ||
      !toLatInput ||
      !toLngInput
    ) {
      return;
    }
    if (mapElement.dataset.mapReady === "true") return;

    mapElement.dataset.mapReady = "true";

    const defaultCenter = [10.762622, 106.660172];
    const map = window.L.map(mapElement).setView(defaultCenter, 12);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    function createPinIcon(fill) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
          <path fill="${fill}" d="M16 1C7.2 1 0 8.2 0 17c0 12.2 13.4 28.4 15.1 30.4.5.6 1.4.6 1.9 0C18.6 45.4 32 29.2 32 17 32 8.2 24.8 1 16 1z"/>
          <circle cx="16" cy="17" r="7.2" fill="#fff"/>
        </svg>
      `.trim();

      return window.L.icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        iconSize: [32, 48],
        iconAnchor: [16, 47],
        tooltipAnchor: [0, -34],
      });
    }

    const fromMarker = window.L.marker(defaultCenter, {
      draggable: true,
      icon: createPinIcon("#1b4332"),
    })
      .addTo(map)
      .bindTooltip("<div>Điểm đi</div>", {
        permanent: true,
        direction: "top",
        offset: [0, -30],
        className: "map-marker-tooltip map-marker-tooltip--survey",
      });

    const toMarker = window.L.marker(
      [defaultCenter[0] - 0.01, defaultCenter[1] - 0.01],
      {
        draggable: true,
        icon: createPinIcon("#dc2626"),
      },
    )
      .addTo(map)
      .bindTooltip("<div>Điểm đến</div>", {
        permanent: true,
        direction: "top",
        offset: [0, -30],
        className: "map-marker-tooltip map-marker-tooltip--destination",
      });

    const connectionLine = window.L.polyline([], {
      color: "#1b4332",
      weight: 4,
      opacity: 0.72,
      dashArray: "10 8",
      lineCap: "round",
    }).addTo(map);

    function getPointConfig(point) {
      if (point === "diem_den") {
        return {
          input: toInput,
          latInput: toLatInput,
          lngInput: toLngInput,
          marker: toMarker,
          geocodeStatus: "Đang cập nhật địa chỉ điểm đến từ bản đồ...",
          successStatus: "Đã cập nhật điểm đến từ vị trí trên bản đồ.",
          fallbackStatus:
            "Đã chọn vị trí điểm đến trên bản đồ, nhưng chưa thể tự động đọc ra địa chỉ.",
        };
      }

      return {
        input: fromInput,
        latInput: fromLatInput,
        lngInput: fromLngInput,
        marker: fromMarker,
        geocodeStatus: "Đang cập nhật địa chỉ điểm đi từ bản đồ...",
        successStatus: "Đã cập nhật điểm đi từ vị trí trên bản đồ.",
        fallbackStatus:
          "Đã chọn vị trí điểm đi trên bản đồ, nhưng chưa thể tự động đọc ra địa chỉ.",
      };
    }

    function hasPoint(latInput, lngInput) {
      return Boolean(
        String(latInput?.value || "").trim() && String(lngInput?.value || "").trim(),
      );
    }

    function updateDistanceAndRoute() {
      const hasFrom = hasPoint(fromLatInput, fromLngInput);
      const hasTo = hasPoint(toLatInput, toLngInput);

      if (!hasFrom || !hasTo) {
        connectionLine.setLatLngs([]);
        if (distanceBadge) distanceBadge.hidden = true;
        return;
      }

      const fromLatLng = fromMarker.getLatLng();
      const toLatLng = toMarker.getLatLng();
      connectionLine.setLatLngs([fromLatLng, toLatLng]);

      const km = fromLatLng.distanceTo(toLatLng) / 1000;
      if (distanceValue) {
        distanceValue.textContent = km.toFixed(km >= 10 ? 0 : 1);
      }
      if (distanceBadge) distanceBadge.hidden = false;
    }

    function updateMapBounds() {
      const hasFrom = hasPoint(fromLatInput, fromLngInput);
      const hasTo = hasPoint(toLatInput, toLngInput);

      if (hasFrom && hasTo) {
        const group = new window.L.featureGroup([fromMarker, toMarker]);
        map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 16 });
        return;
      }

      if (hasFrom) {
        map.setView(fromMarker.getLatLng(), 15);
        return;
      }

      if (hasTo) {
        map.setView(toMarker.getLatLng(), 15);
        return;
      }

      map.setView(defaultCenter, 12);
    }

    function setPointCoords(point, lat, lng) {
      const config = getPointConfig(point);
      config.latInput.value = String(lat);
      config.lngInput.value = String(lng);
      renderBookingMapPreview(scope);
      renderFormSummaries(scope);
      updateDistanceAndRoute();
    }

    function clearPoint(point) {
      const config = getPointConfig(point);
      config.latInput.value = "";
      config.lngInput.value = "";
      renderBookingMapPreview(scope);
      renderFormSummaries(scope);
      updateDistanceAndRoute();
      updateMapBounds();
    }

    async function moveMarker(point, lat, lng, options = {}) {
      const shouldReverse = options.shouldReverse !== false;
      const shouldWriteAddress = options.shouldWriteAddress !== false;
      const shouldReframe = options.shouldReframe !== false;
      const config = getPointConfig(point);

      config.marker.setLatLng([lat, lng]);
      setPointCoords(point, lat, lng);

      if (shouldReframe) {
        updateMapBounds();
      }

      if (!shouldReverse) return;

      if (statusOutput) {
        statusOutput.textContent = config.geocodeStatus;
      }

      try {
        const label = await reverseGeocodeSurvey(lat, lng);
        if (label && shouldWriteAddress) {
          config.input.value = label;
        }
        renderBookingMapPreview(scope);
        if (statusOutput) {
          statusOutput.textContent = label
            ? config.successStatus
            : "Đã cập nhật vị trí trên bản đồ.";
        }
      } catch (error) {
        console.warn("Booking reverse geocode failed:", error);
        if (statusOutput) {
          statusOutput.textContent = config.fallbackStatus;
        }
      }
    }

    function setCurrentButtonLoading(isLoading) {
      if (!currentButton) return;
      if (!currentButton.dataset.originalLabel) {
        currentButton.dataset.originalLabel = currentButton.textContent || "";
      }

      currentButton.disabled = isLoading;
      currentButton.textContent = isLoading
        ? "Đang lấy vị trí..."
        : currentButton.dataset.originalLabel;
    }

    function requestCurrentLocation(options = {}) {
      const silent = options.silent === true;
      if (!navigator.geolocation) {
        if (!silent && statusOutput) {
          statusOutput.textContent =
            "Thiết bị này không hỗ trợ lấy vị trí hiện tại. Bạn có thể nhập địa chỉ hoặc kéo ghim điểm đi.";
        }
        return;
      }

      if (!silent && statusOutput) {
        statusOutput.textContent = "Đang lấy vị trí hiện tại cho điểm đi...";
      }
      setCurrentButtonLoading(true);

      navigator.geolocation.getCurrentPosition(
        function (position) {
          moveMarker("diem_di", position.coords.latitude, position.coords.longitude, {
            shouldReverse: true,
          }).finally(function () {
            setCurrentButtonLoading(false);
            if (silent && statusOutput) {
              statusOutput.textContent =
                "Đã cập nhật nhanh điểm đi theo vị trí hiện tại.";
            }
          });
        },
        function () {
          setCurrentButtonLoading(false);
          if (!silent && statusOutput) {
            statusOutput.textContent =
              "Không lấy được vị trí hiện tại. Bạn có thể nhập địa chỉ hoặc kéo ghim điểm đi để chỉnh thủ công.";
          }
        },
        { timeout: 10000 },
      );
    }

    currentButton?.addEventListener("click", function () {
      requestCurrentLocation({ silent: false });
    });

    fromMarker.on("dragend", function () {
      const latlng = fromMarker.getLatLng();
      moveMarker("diem_di", latlng.lat, latlng.lng, { shouldReverse: true });
    });

    toMarker.on("dragend", function () {
      const latlng = toMarker.getLatLng();
      moveMarker("diem_den", latlng.lat, latlng.lng, { shouldReverse: true });
    });

    let fromTimer = null;
    let toTimer = null;

    fromInput.addEventListener("input", function () {
      clearTimeout(fromTimer);
      const query = String(fromInput.value || "").trim();

      if (!query) {
        clearPoint("diem_di");
        if (statusOutput) {
          statusOutput.textContent =
            "Bạn có thể nhập lại địa chỉ điểm đi hoặc kéo ghim xanh để xác định vị trí.";
        }
        return;
      }

      fromTimer = window.setTimeout(async function () {
        try {
          if (statusOutput) {
            statusOutput.textContent =
              "Đang dò vị trí điểm đi từ địa chỉ bạn vừa nhập...";
          }

          const result = await geocodeSurveyAddress(query);
          if (!result) {
            if (statusOutput) {
              statusOutput.textContent =
                "Chưa tìm thấy điểm đi khớp hoàn toàn với địa chỉ này. Bạn có thể tinh lại địa chỉ hoặc kéo ghim xanh.";
            }
            return;
          }

          await moveMarker("diem_di", result.lat, result.lng, {
            shouldReverse: false,
          });

          if (statusOutput) {
            statusOutput.textContent =
              "Đã ghim điểm đi theo địa chỉ bạn nhập. Bạn vẫn có thể kéo ghim để chỉnh lại chính xác hơn.";
          }
        } catch (error) {
          console.warn("Booking pickup geocode failed:", error);
          if (statusOutput) {
            statusOutput.textContent =
              "Chưa thể dò vị trí điểm đi từ địa chỉ. Bạn có thể kéo ghim xanh để chọn thủ công.";
          }
        }
      }, 600);
    });

    toInput.addEventListener("input", function () {
      clearTimeout(toTimer);
      const query = String(toInput.value || "").trim();

      if (!query) {
        clearPoint("diem_den");
        if (statusOutput) {
          statusOutput.textContent =
            "Bạn có thể nhập lại địa chỉ điểm đến hoặc kéo ghim đỏ để chỉnh vị trí.";
        }
        return;
      }

      toTimer = window.setTimeout(async function () {
        try {
          if (statusOutput) {
            statusOutput.textContent =
              "Đang dò vị trí điểm đến từ địa chỉ bạn vừa nhập...";
          }

          const result = await geocodeSurveyAddress(query);
          if (!result) {
            if (statusOutput) {
              statusOutput.textContent =
                "Chưa tìm thấy điểm đến khớp hoàn toàn với địa chỉ này. Bạn có thể tinh lại địa chỉ hoặc kéo ghim đỏ.";
            }
            return;
          }

          await moveMarker("diem_den", result.lat, result.lng, {
            shouldReverse: false,
          });

          if (statusOutput) {
            statusOutput.textContent =
              "Đã ghim điểm đến theo địa chỉ bạn nhập. Bạn vẫn có thể kéo ghim để chỉnh lại chính xác hơn.";
          }
        } catch (error) {
          console.warn("Booking delivery geocode failed:", error);
          if (statusOutput) {
            statusOutput.textContent =
              "Chưa thể dò vị trí điểm đến từ địa chỉ. Bạn có thể kéo ghim đỏ để chọn thủ công.";
          }
        }
      }, 600);
    });

    clearPoint("diem_di");
    clearPoint("diem_den");
    updateMapBounds();
    requestCurrentLocation({ silent: true });

    window.setTimeout(function () {
      map.invalidateSize();
    }, 120);
  }

  function formatSurveySchedule(scope) {
    const dateInput = scope.querySelector("#ngay-khao-sat");
    const timeSelect = scope.querySelector("#khung-gio-khao-sat");
    const dateValue = String(dateInput?.value || "").trim();
    const timeLabel = getSelectedLabel(timeSelect);

    if (dateValue && timeSelect?.value) {
      return `${dateValue} • ${timeLabel}`;
    }

    if (dateValue) return dateValue;
    if (timeSelect?.value) return timeLabel;
    return "Chưa chọn";
  }

  function formatBookingSchedule(scope) {
    const dateInput = scope.querySelector("#ngay-thuc-hien-dat-lich");
    const timeSelect = scope.querySelector("#khung-gio-dat-lich");
    const dateValue = String(dateInput?.value || "").trim();
    const timeLabel = getSelectedLabel(timeSelect);

    if (dateValue && timeSelect?.value) {
      return `${dateValue} • ${timeLabel}`;
    }

    if (dateValue) return dateValue;
    if (timeSelect?.value) return timeLabel;
    return "Chưa chọn";
  }

  function syncBookingVehicleOptions(scope, serviceValue) {
    const select = scope.querySelector("#loai-xe-dat-lich");
    const note = scope.querySelector("[data-goi-y-loai-xe-dat-lich]");
    if (!select) return;

    const normalized = normalizeService(serviceValue);
    const config = bookingVehicleOptions[normalized];
    const previousValue = String(select.value || "").trim();

    if (!config) {
      select.innerHTML = '<option value="">Chọn dịch vụ để xem gợi ý loại xe</option>';
      select.value = "";
      if (note) {
        note.textContent =
          "Chọn loại dịch vụ để hệ thống gợi ý nhóm xe phù hợp trước khi tính giá.";
      }
      return;
    }

    select.innerHTML = [
      '<option value="">Chọn loại xe phù hợp</option>',
      ...config.options.map(
        (item) => `<option value="${item.value}">${item.label}</option>`,
      ),
    ].join("");

    if (config.options.some((item) => item.value === previousValue)) {
      select.value = previousValue;
    } else {
      select.value = config.defaultValue;
    }

    if (note) {
      note.textContent = config.note;
    }
  }

  function syncBookingPricingTimeSlot(scope) {
    const timeSelect = scope.querySelector("#khung-gio-dat-lich");
    const hiddenInput = scope.querySelector("[data-khung-gio-tinh-gia]");
    if (!timeSelect || !hiddenInput) return;

    hiddenInput.value = mapBookingPricingTimeSlot(timeSelect.value);
  }

  function joinSurveyParts(parts, fallback) {
    const filtered = parts
      .map((part) => String(part || "").trim())
      .filter(Boolean);
    return filtered.length ? filtered.join(" • ") : fallback;
  }

  function formatBookingDeploymentDetail(scope, serviceValue) {
    const normalized = normalizeService(serviceValue);
    const soTangDiemDi = String(
      scope.querySelector("#so-tang-diem-di-dat-lich")?.value || "",
    ).trim();
    const soTangDiemDen = String(
      scope.querySelector("#so-tang-diem-den-dat-lich")?.value || "",
    ).trim();

    let loaiDiemDi = "";
    let loaiDiemDen = "";

    if (normalized === "chuyen_nha") {
      loaiDiemDi = getSelectedLabel(
        scope.querySelector("#loai-nha-diem-di-dat-lich"),
      );
      loaiDiemDen = getSelectedLabel(
        scope.querySelector("#loai-nha-diem-den-dat-lich"),
      );
    } else if (normalized === "chuyen_van_phong") {
      loaiDiemDi = getSelectedLabel(
        scope.querySelector("#loai-mat-bang-di-van-phong-dat-lich"),
      );
      loaiDiemDen = getSelectedLabel(
        scope.querySelector("#loai-mat-bang-den-van-phong-dat-lich"),
      );
    } else if (normalized === "chuyen_kho_bai") {
      loaiDiemDi = getSelectedLabel(
        scope.querySelector("#loai-kho-diem-di-dat-lich"),
      );
      loaiDiemDen = getSelectedLabel(
        scope.querySelector("#loai-kho-diem-den-dat-lich"),
      );
    }

    return joinSurveyParts(
      [
        loaiDiemDi && `Điểm đi: ${loaiDiemDi}`,
        loaiDiemDen && `Điểm đến: ${loaiDiemDen}`,
        soTangDiemDi && `Điểm đi ${soTangDiemDi} tầng`,
        soTangDiemDen && `Điểm đến ${soTangDiemDen} tầng`,
      ],
      "Chưa có",
    );
  }

  function formatSurveyServiceDetail(scope, serviceValue) {
    const normalized = normalizeService(serviceValue);
    const khoiLuong =
      getCheckedLabel(scope, "input[name='muc_do_khoi_luong']") || "";
    const hoTro = getCheckedLabels(
      scope,
      "input[name='can_dong_goi'], input[name='can_thao_lap'], input[name='co_do_gia_tri_cao']",
    );

    if (normalized === "chuyen_nha") {
      const loaiNha = getSelectedLabel(
        scope.querySelector("#loai-mat-bang-nha-khao-sat"),
      );
      const soTang = String(
        scope.querySelector("#so-tang-khao-sat")?.value || "",
      ).trim();
      const soPhong = String(
        scope.querySelector("#so-phong-khao-sat")?.value || "",
      ).trim();

      return joinSurveyParts(
        [
          khoiLuong && `Khối lượng ${khoiLuong.toLowerCase()}`,
          loaiNha,
          soTang && `${soTang} tầng`,
          soPhong && `${soPhong} phòng`,
          hoTro.slice(0, 2).join(", "),
        ],
        "Chưa có",
      );
    }

    if (normalized === "chuyen_van_phong") {
      const loaiMatBang = getSelectedLabel(
        scope.querySelector("#loai-mat-bang-van-phong-khao-sat"),
      );
      const soNhanSu = String(
        scope.querySelector("#so-nhan-su-khao-sat")?.value || "",
      ).trim();
      const dienTich = String(
        scope.querySelector("#dien-tich-van-phong-khao-sat")?.value || "",
      ).trim();
      const chiTiet = getCheckedLabels(
        scope,
        "[data-nhom-chip='chi_tiet_van_phong'] input[type='checkbox']",
      );

      return joinSurveyParts(
        [
          khoiLuong && `Khối lượng ${khoiLuong.toLowerCase()}`,
          loaiMatBang,
          soNhanSu && `${soNhanSu} nhân sự`,
          dienTich && dienTich,
          chiTiet.slice(0, 2).join(", "),
        ],
        "Chưa có",
      );
    }

    if (normalized === "chuyen_kho_bai") {
      const loaiKho = getSelectedLabel(
        scope.querySelector("#loai-mat-bang-kho-khao-sat"),
      );
      const quyMo = String(
        scope.querySelector("#quy-mo-kho-khao-sat")?.value || "",
      ).trim();
      const chiTiet = getCheckedLabels(
        scope,
        "[data-nhom-chip='chi_tiet_kho_bai'] input[type='checkbox']",
      );

      return joinSurveyParts(
        [
          khoiLuong && `Khối lượng ${khoiLuong.toLowerCase()}`,
          loaiKho,
          quyMo,
          chiTiet.slice(0, 2).join(", "),
        ],
        "Chưa có",
      );
    }

    return joinSurveyParts(
      [khoiLuong && `Khối lượng ${khoiLuong.toLowerCase()}`, hoTro.slice(0, 2).join(", ")],
      "Chưa có",
    );
  }

  function formatBookingServiceDetail(scope, serviceValue) {
    const normalized = normalizeService(serviceValue);

    if (normalized === "chuyen_nha") {
      const dienTich = String(
        scope.querySelector("#dien-tich-nha-dat-lich")?.value || "",
      ).trim();
      const soPhong = String(
        scope.querySelector("#so-phong-dat-lich")?.value || "",
      ).trim();
      const soNhanCong = String(
        scope.querySelector("#so-nhan-cong-dat-lich")?.value || "",
      ).trim();
      const soGoiDongGoi = String(
        scope.querySelector("#so-goi-dong-goi-dat-lich")?.value || "",
      ).trim();
      const soBoThaoLap = String(
        scope.querySelector("#so-bo-thao-lap-dat-lich")?.value || "",
      ).trim();
      const hoTro = getCheckedLabels(
        scope,
        "input[name='can_thao_lap_noi_that'], input[name='can_dong_goi_do_dac'], input[name='co_do_gia_tri_cao'], input[name='co_do_de_vo'], input[name='co_do_cong_kenh']",
      );

      return joinSurveyParts(
        [
          dienTich,
          soPhong && `${soPhong} phòng`,
          soNhanCong && `${soNhanCong} nhân công`,
          soGoiDongGoi && `${soGoiDongGoi} gói đóng gói`,
          soBoThaoLap && `${soBoThaoLap} bộ tháo lắp`,
          hoTro.slice(0, 3).join(", "),
        ],
        "Chưa có",
      );
    }

    if (normalized === "chuyen_van_phong") {
      const soChoNgoi = String(
        scope.querySelector("#so-cho-ngoi-dat-lich")?.value || "",
      ).trim();
      const soPhongBan = String(
        scope.querySelector("#so-phong-ban-dat-lich")?.value || "",
      ).trim();
      const soThungHoSo = String(
        scope.querySelector("#so-thung-ho-so-dat-lich")?.value || "",
      ).trim();
      const soBoMayIt = String(
        scope.querySelector("#so-bo-may-it-dat-lich")?.value || "",
      ).trim();
      const soMonNoiThat = String(
        scope.querySelector("#so-mon-noi-that-van-phong-dat-lich")?.value || "",
      ).trim();
      const soThietBiNang = String(
        scope.querySelector("#so-thiet-bi-nang-dat-lich")?.value || "",
      ).trim();
      const chiTiet = getCheckedLabels(
        scope,
        "input[name='can_bao_mat_tai_lieu'], input[name='can_di_doi_server'], input[name='can_thuc_hien_cuoi_tuan']",
      );

      return joinSurveyParts(
        [
          soChoNgoi && `${soChoNgoi} chỗ ngồi`,
          soPhongBan && `${soPhongBan} phòng ban`,
          soThungHoSo && `${soThungHoSo} thùng hồ sơ`,
          soBoMayIt && `${soBoMayIt} bộ máy IT`,
          soMonNoiThat && `${soMonNoiThat} món nội thất`,
          soThietBiNang && `${soThietBiNang} thiết bị nặng`,
          chiTiet.slice(0, 3).join(", "),
        ],
        "Chưa có",
      );
    }

    if (normalized === "chuyen_kho_bai") {
      const khoiLuong = String(
        scope.querySelector("#khoi-luong-kho-dat-lich")?.value || "",
      ).trim();
      const loaiHang = String(
        scope.querySelector("#loai-hang-dat-lich")?.value || "",
      ).trim();
      const soPallet = String(
        scope.querySelector("#so-pallet-dat-lich")?.value || "",
      ).trim();
      const soCaXeNang = String(
        scope.querySelector("#so-ca-xe-nang-dat-lich")?.value || "",
      ).trim();
      const soCaXeCau = String(
        scope.querySelector("#so-ca-xe-cau-dat-lich")?.value || "",
      ).trim();
      const soNhanSuBocXep = String(
        scope.querySelector("#so-nhan-su-boc-xep-dat-lich")?.value || "",
      ).trim();
      const soDonViGiaCo = String(
        scope.querySelector("#so-don-vi-gia-co-dat-lich")?.value || "",
      ).trim();
      const chiTiet = getCheckedLabels(
        scope,
        "input[name='can_xe_nang_dat_lich'], input[name='can_xe_cau_dat_lich'], input[name='can_kiem_ke_hang_hoa']",
      );

      return joinSurveyParts(
        [
          khoiLuong,
          loaiHang,
          soPallet && `${soPallet} pallet`,
          soCaXeNang && `${soCaXeNang} ca xe nâng`,
          soCaXeCau && `${soCaXeCau} ca xe cẩu`,
          soNhanSuBocXep && `${soNhanSuBocXep} nhân sự bốc xếp`,
          soDonViGiaCo && `${soDonViGiaCo} đơn vị gia cố`,
          chiTiet.slice(0, 3).join(", "),
        ],
        "Chưa có",
      );
    }

    return "Chưa có";
  }

  function formatBookingDistance(scope) {
    const fromLat = Number(
      scope.querySelector("[data-ban-do-dat-lich-toa-do='diem_di_lat']")?.value || 0,
    );
    const fromLng = Number(
      scope.querySelector("[data-ban-do-dat-lich-toa-do='diem_di_lng']")?.value || 0,
    );
    const toLat = Number(
      scope.querySelector("[data-ban-do-dat-lich-toa-do='diem_den_lat']")?.value || 0,
    );
    const toLng = Number(
      scope.querySelector("[data-ban-do-dat-lich-toa-do='diem_den_lng']")?.value || 0,
    );

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return "Chưa xác định";
    }

    const km = calculateDistanceKm(fromLat, fromLng, toLat, toLng);
    return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
  }

  function formatBookingConditionDetail(scope) {
    const labels = getCheckedLabels(
      scope,
      "[data-nhom-chip='dieu_kien_dat_lich'] input[type='checkbox']",
    );
    return labels.length ? labels.join(", ") : "Chưa có";
  }

  function renderBookingMediaReview(scope) {
    const emptyState = scope.querySelector("[data-media-dat-lich-rong]");
    const grid = scope.querySelector("[data-media-dat-lich-luoi]");
    if (!emptyState || !grid) return;

    revokePreviewUrlsIn(grid);
    grid.innerHTML = "";

    const items = [];
    scope
      .querySelectorAll("#tep-anh-dat-lich, #tep-video-dat-lich")
      .forEach((input) => {
        Array.from(input.files || []).forEach((file) => {
          items.push({
            file,
            kind: file.type.startsWith("video/") ? "video" : "image",
          });
        });
      });

    if (!items.length) {
      emptyState.hidden = false;
      grid.hidden = true;
      return;
    }

    emptyState.hidden = true;
    grid.hidden = false;

    grid.innerHTML = items
      .map(({ file, kind }, index) => {
        const objectUrl = window.URL.createObjectURL(file);
        const media =
          kind === "video"
            ? `<video controls preload="metadata" src="${objectUrl}" data-object-url="${objectUrl}"></video>`
            : `<img src="${objectUrl}" alt="${file.name}" data-object-url="${objectUrl}" />`;

        return `
          <article class="the-media-xac-nhan-dat-lich">
            ${media}
            <div class="meta-media-xac-nhan-dat-lich">
              <strong>${file.name}</strong>
              <span>${kind === "video" ? "Video" : "Ảnh"} đính kèm ${index + 1}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function renderBookingPricing(scope) {
    const pricingRoot = scope.querySelector("[data-gia-tham-khao-dat-lich]");
    if (!pricingRoot) return;

    const defaultBlock = pricingRoot.querySelector(
      "[data-gia-tham-khao-dat-lich-mac-dinh]",
    );
    const contentBlock = pricingRoot.querySelector(
      "[data-gia-tham-khao-dat-lich-noi-dung]",
    );
    const title = pricingRoot.querySelector(
      "[data-gia-tham-khao-dat-lich-ten-dich-vu]",
    );
    const description = pricingRoot.querySelector(
      "[data-gia-tham-khao-dat-lich-mo-ta]",
    );
    const list = pricingRoot.querySelector(
      "[data-gia-tham-khao-dat-lich-danh-sach]",
    );
    const confirmEmpty = scope.querySelector("[data-gia-xac-nhan-rong]");
    const confirmGrid = scope.querySelector("[data-gia-xac-nhan-luoi]");
    const confirmNotes = scope.querySelector("[data-luu-y-xac-nhan-dat-lich]");
    const serviceSelect = scope.querySelector("#loai-dich-vu-dat-lich");
    const pricingServiceId = getPricingServiceId(serviceSelect?.value || "");
    const timeValue = String(
      scope.querySelector("#khung-gio-dat-lich")?.value || "",
    ).trim();
    const weatherValue = String(
      scope.querySelector("#thoi-tiet-du-kien-dat-lich")?.value || "",
    ).trim();
    const conditionLabels = getCheckedLabels(
      scope,
      "[data-nhom-chip='dieu_kien_dat_lich'] input[type='checkbox']",
    );

    if (!pricingServiceId) {
      if (defaultBlock) defaultBlock.hidden = false;
      if (contentBlock) {
        contentBlock.hidden = true;
        contentBlock.classList.add("is-hidden");
      }
      if (list) list.innerHTML = "";
      if (confirmEmpty) confirmEmpty.hidden = false;
      if (confirmGrid) {
        confirmGrid.hidden = true;
        confirmGrid.innerHTML = "";
      }
      if (confirmNotes) {
        confirmNotes.innerHTML =
          '<div class="muc-luu-y-xac-nhan">Đội ngũ sẽ xác nhận lại các phát sinh nếu có trước khi chốt lịch.</div>';
      }
      return;
    }

    const pricingData = await loadPricingReference();
    const serviceData = Array.isArray(pricingData)
      ? pricingData.find((item) => item.id === pricingServiceId)
      : null;

    if (!serviceData || !list) {
      if (defaultBlock) defaultBlock.hidden = false;
      if (contentBlock) {
        contentBlock.hidden = true;
        contentBlock.classList.add("is-hidden");
      }
      if (confirmEmpty) confirmEmpty.hidden = false;
      if (confirmGrid) {
        confirmGrid.hidden = true;
        confirmGrid.innerHTML = "";
      }
      return;
    }

    if (defaultBlock) defaultBlock.hidden = true;
    if (contentBlock) {
      contentBlock.hidden = false;
      contentBlock.classList.remove("is-hidden");
    }

    if (title) {
      title.textContent = serviceData.ten_dich_vu || "Giá tham khảo";
    }

    if (description) {
      description.textContent =
        "Hệ thống đang hiển thị đúng nhóm giá tham khảo dành cho dịch vụ bạn đã chọn.";
    }

    const pricingMarkup = Array.isArray(serviceData.hang_muc_bao_gia)
      ? serviceData.hang_muc_bao_gia
          .slice(0, 6)
          .map((item) => {
            const ten = String(item.ten || "").trim();
            const khoangGia = String(item.khoang_gia || "").trim();
            const donVi = String(item.don_vi || "").trim();
            const ghiChu = String(item.ghi_chu || "").trim();

            return `
              <article class="the-gia-tham-khao-dat-lich">
                <h6>${ten}</h6>
                <strong>${khoangGia}${donVi ? ` / ${donVi}` : ""}</strong>
                <span>${ghiChu}</span>
              </article>
            `;
          })
          .join("")
      : "";

    list.innerHTML = pricingMarkup;

    if (confirmEmpty) confirmEmpty.hidden = true;
    if (confirmGrid) {
      confirmGrid.hidden = false;
      confirmGrid.innerHTML = Array.isArray(serviceData.hang_muc_bao_gia)
        ? serviceData.hang_muc_bao_gia
            .map((item) => {
              const ten = String(item.ten || "").trim();
              const khoangGia = String(item.khoang_gia || "").trim();
              const donVi = String(item.don_vi || "").trim();
              const ghiChu = String(item.ghi_chu || "").trim();

              return `
                <article class="the-gia-xac-nhan-dat-lich">
                  <h5>${ten}</h5>
                  <strong>${khoangGia}${donVi ? ` / ${donVi}` : ""}</strong>
                  <span>${ghiChu}</span>
                </article>
              `;
            })
            .join("")
        : "";
    }

    const notes = [
      "Đây là giá tham khảo theo dịch vụ đã chọn, chưa phải báo giá chốt.",
    ];

    if (timeValue === "toi") {
      notes.push("Khung giờ tối có thể phát sinh phụ phí ngoài giờ theo chính sách dịch vụ.");
    } else if (timeValue === "dem") {
      notes.push("Khung giờ ban đêm thường áp dụng phụ phí cao hơn và cần xác nhận nhân sự trước khi chốt lịch.");
    } else if (timeValue === "linh_dong") {
      notes.push("Khung giờ linh động sẽ được đội ngũ xác nhận lại trước khi chốt lịch.");
    }

    if (weatherValue === "troi_mua") {
      notes.push(
        "Nếu thời tiết xấu vào ngày thực hiện, phụ phí thời tiết có thể được áp dụng theo bảng giá tham khảo.",
      );
    }

    if (conditionLabels.length) {
      notes.push(
        `Điều kiện tiếp cận hiện tại gồm: ${conditionLabels.join(
          ", ",
        )}. Các yếu tố này có thể ảnh hưởng đến chi phí triển khai thực tế.`,
      );
    }

    if (confirmNotes) {
      confirmNotes.innerHTML = notes
        .map((note) => `<div class="muc-luu-y-xac-nhan">${note}</div>`)
        .join("");
    }
  }

  function renderSurveySummary(scope) {
    const summaryBox = scope.querySelector("[data-tom-tat-khao-sat]");
    if (!summaryBox) return;

    const serviceSelect = scope.querySelector("#loai-dich-vu-khao-sat");
    const addressInput = scope.querySelector("#dia-chi-khao-sat");
    const destinationInput = scope.querySelector("#dia-chi-diem-den-du-kien");
    const companyInput = scope.querySelector("#ten-don-vi-khao-sat");
    const contactInput = scope.querySelector("#nguoi-lien-he-tai-diem");
    const landmarkInput = scope.querySelector("#moc-nhan-dien-loi-vao-khao-sat");
    const serviceValue = serviceSelect?.value || "";

    const values = {
      dich_vu: serviceValue ? getSelectedLabel(serviceSelect) : "Chưa chọn",
      don_vi: String(companyInput?.value || "").trim() || "Không có",
      nguoi_lien_he: String(contactInput?.value || "").trim() || "Chưa nhập",
      dia_chi: String(addressInput?.value || "").trim() || "Chưa nhập",
      dia_chi_diem_den:
        String(destinationInput?.value || "").trim() || "Chưa có",
      moc_nhan_dien:
        String(landmarkInput?.value || "").trim() || "Chưa nhập",
      lich_khao_sat: formatSurveySchedule(scope),
      hinh_thuc:
        getCheckedLabel(scope, "input[name='hinh_thuc_khao_sat']") ||
        "Chưa chọn",
      muc_do_gap:
        getCheckedLabel(scope, "input[name='muc_do_gap']") || "Chưa chọn",
      dieu_kien: `${countChecked(
        scope,
        "[data-nhom-chip='dieu_kien_tiep_can'] input[type='checkbox']",
      )} mục`,
      hang_muc: `${countChecked(
        scope,
        "[data-nhom-chip='hang_muc_dac_biet'] input[type='checkbox']",
      )} mục`,
      chi_tiet: formatSurveyServiceDetail(scope, serviceValue),
      tep_dinh_kem: `${countFiles(
        scope,
        "#tep-anh-khao-sat, #tep-video-khao-sat",
      )} tệp`,
    };

    Object.entries(values).forEach(([key, value]) => {
      const target = summaryBox.querySelector(`[data-tom-tat='${key}']`);
      if (target) target.textContent = value;
    });
  }

  function renderBookingSummary(scope) {
    const summaryBox = scope.querySelector("[data-tom-tat-dat-lich]");
    if (!summaryBox) return;

    const serviceSelect = scope.querySelector("#loai-dich-vu-dat-lich");
    const contactInput = scope.querySelector("#ho-ten-dat-lich");
    const phoneInput = scope.querySelector("#so-dien-thoai-dat-lich");
    const companyInput = scope.querySelector("#ten-cong-ty-dat-lich");
    const fromInput = scope.querySelector("#dia-chi-di-dat-lich");
    const toInput = scope.querySelector("#dia-chi-den-dat-lich");
    const vehicleSelect = scope.querySelector("#loai-xe-dat-lich");
    const weatherSelect = scope.querySelector("#thoi-tiet-du-kien-dat-lich");
    const noteInput = scope.querySelector("#ghi-chu-dat-lich");
    const pricingTimeInput = scope.querySelector("[data-khung-gio-tinh-gia]");
    const serviceValue = serviceSelect?.value || "";
    const fromText = String(fromInput?.value || "").trim();
    const toText = String(toInput?.value || "").trim();

    const routeText =
      fromText && toText
        ? `${fromText} → ${toText}`
        : fromText || toText || "Chưa nhập";

    const values = {
      nguoi_lien_he: String(contactInput?.value || "").trim() || "Chưa nhập",
      so_dien_thoai: String(phoneInput?.value || "").trim() || "Chưa nhập",
      don_vi: String(companyInput?.value || "").trim() || "Không có",
      dich_vu: serviceSelect?.value
        ? getSelectedLabel(serviceSelect)
        : "Chưa chọn",
      lo_trinh: routeText,
      lich_thuc_hien: formatBookingSchedule(scope),
      khoang_cach: formatBookingDistance(scope),
      loai_xe: getSelectedLabel(vehicleSelect) || "Chưa chọn",
      khung_gio_tinh_gia:
        getBookingPricingTimeLabel(pricingTimeInput?.value || "") || "Chưa chọn",
      thoi_tiet: getSelectedLabel(weatherSelect) || "Chưa chọn",
      trien_khai: formatBookingDeploymentDetail(scope, serviceValue),
      dieu_kien: formatBookingConditionDetail(scope),
      chi_tiet: formatBookingServiceDetail(scope, serviceValue),
      ghi_chu: String(noteInput?.value || "").trim() || "Chưa có",
      tep_dinh_kem: `${countFiles(
        scope,
        "#tep-anh-dat-lich, #tep-video-dat-lich",
      )} tệp`,
    };

    Object.entries(values).forEach(([key, value]) => {
      const target = summaryBox.querySelector(`[data-tom-tat-dat-lich='${key}']`);
      if (target) target.textContent = value;
    });
  }

  function renderFormSummaries(scope) {
    renderSurveySummary(scope);
    renderBookingSummary(scope);
  }

  function resetFieldValue(field) {
    field.querySelectorAll("input, select, textarea").forEach((input) => {
      if (input.matches("input[type='checkbox'], input[type='radio']")) {
        input.checked = false;
        return;
      }

      if (input.tagName === "SELECT") {
        input.selectedIndex = 0;
        return;
      }

      input.value = "";
    });
  }

  function applyServiceState(scope, serviceValue) {
    const normalized = normalizeService(serviceValue);
    const emptyPanel = scope.querySelector("[data-khoi-mac-dinh]");

    scope.querySelectorAll("[data-khoi-dich-vu]").forEach((panel) => {
      const shouldShow =
        normalized && panel.getAttribute("data-khoi-dich-vu") === normalized;
      panel.hidden = !shouldShow;
      panel.classList.toggle("is-hidden", !shouldShow);
    });

    if (emptyPanel) {
      emptyPanel.hidden = !!normalized;
    }

    scope.querySelectorAll("[data-hien-theo-dich-vu]").forEach((field) => {
      const allowed = String(
        field.getAttribute("data-hien-theo-dich-vu") || "",
      )
        .split(",")
        .map((value) => normalizeService(value))
        .filter(Boolean);
      const shouldShow = !!normalized && allowed.includes(normalized);

      field.hidden = !shouldShow;
      field.classList.toggle("is-hidden", !shouldShow);

      if (!shouldShow) {
        resetFieldValue(field);
      }
    });

    syncBookingVehicleOptions(scope, normalized);
    syncBookingPricingTimeSlot(scope);
    renderFormSummaries(scope);
    renderBookingPricing(scope);
  }

  function initServiceSelect(scope) {
    const select = scope.querySelector("[data-truong-dich-vu]");
    if (!select) return;

    const params = new URLSearchParams(window.location.search);
    const initialValue = normalizeService(params.get("dich-vu"));
    if (initialValue) {
      select.value = initialValue;
    }

    applyServiceState(scope, select.value);
    select.addEventListener("change", function () {
      applyServiceState(scope, select.value);
    });
  }

  function initFileInputs(scope) {
    scope
      .querySelectorAll("input[type='file'][data-dich-ten-tep]")
      .forEach((input) => {
        const targetId = input.getAttribute("data-dich-ten-tep");
        const output = targetId ? scope.querySelector(`#${targetId}`) : null;
        const emptyText =
          input.getAttribute("data-van-ban-rong") || "Chưa có tệp nào được chọn";
        if (!output) return;

        input.addEventListener("change", function () {
          const total = input.files ? input.files.length : 0;
          if (!total) {
            output.textContent = emptyText;
            updateFilePreview(scope, input);
            return;
          }

          if (total === 1) {
            output.textContent = input.files[0].name;
            updateFilePreview(scope, input);
            return;
          }

          output.textContent = `${total} tệp đã được chọn`;
          updateFilePreview(scope, input);
        });
      });
  }

  function initInfoToggles(scope) {
    const detailsList = Array.from(scope.querySelectorAll(".goi-y-thong-tin"));
    if (!detailsList.length) return;

    detailsList.forEach((details) => {
      details.addEventListener("toggle", function () {
        if (!details.open) return;

        detailsList.forEach((other) => {
          if (other !== details) {
            other.open = false;
          }
        });
      });
    });
  }

  function initSurveyFormUi(scope) {
    if (!scope.querySelector(".form-khao-sat")) return;

    const specialTrigger = scope.querySelector("[data-bat-khac]");
    if (specialTrigger) {
      specialTrigger.addEventListener("change", function () {
        updateSpecialItemField(scope);
        renderSurveySummary(scope);
      });
    }

    scope.addEventListener("input", function () {
      renderSurveyMapPreview(scope);
      renderFormSummaries(scope);
    });

    scope.addEventListener("change", function () {
      updateSpecialItemField(scope);
      renderSurveyMapPreview(scope);
      renderFormSummaries(scope);
    });

    updateSpecialItemField(scope);
    initSurveyMap(scope);
    renderSurveyMapPreview(scope);
    renderFormSummaries(scope);
  }

  function initBookingFormUi(scope) {
    if (!scope.querySelector(".form-dat-lich")) return;

    scope.addEventListener("input", function () {
      syncBookingPricingTimeSlot(scope);
      renderBookingMapPreview(scope);
      renderFormSummaries(scope);
      renderBookingMediaReview(scope);
      renderBookingPricing(scope);
    });

    scope.addEventListener("change", function () {
      syncBookingPricingTimeSlot(scope);
      renderBookingMapPreview(scope);
      renderFormSummaries(scope);
      renderBookingMediaReview(scope);
      renderBookingPricing(scope);
    });

    initBookingMap(scope);
    syncBookingVehicleOptions(
      scope,
      scope.querySelector("#loai-dich-vu-dat-lich")?.value || "",
    );
    syncBookingPricingTimeSlot(scope);
    renderBookingMapPreview(scope);
    renderFormSummaries(scope);
    renderBookingMediaReview(scope);
    renderBookingPricing(scope);
  }

  function initFormNotice(scope, formType) {
    const form = scope.querySelector("form[data-loai-bieu-mau]");
    const notice = scope.querySelector("[data-thong-bao-bieu-mau]");
    if (!form || !notice) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.reportValidity()) return;

      if (formType === "khao-sat") {
        notice.textContent =
          "Biểu mẫu khảo sát đã sẵn sàng về nội dung và giao diện. Chức năng gửi yêu cầu chính thức đang được hoàn thiện.";
      } else {
        notice.textContent =
          "Biểu mẫu đặt lịch đã sẵn sàng về nội dung và giao diện. Chức năng gửi yêu cầu chính thức đang được hoàn thiện.";
      }

      notice.hidden = false;
      notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function initFormHost(host) {
    const formType = host.getAttribute("data-bieu-mau-trang");
    const partialPath = partialPaths[formType];
    if (!formType || !partialPath) return;

    const html = loadPartial(partialPath);
    if (!html) return;

    host.innerHTML = html;
    initInfoToggles(host);
    initServiceSelect(host);
    initFileInputs(host);
    initSurveyFormUi(host);
    initBookingFormUi(host);
    initFormNotice(host, formType);
  }

  onReady(function () {
    document.querySelectorAll("[data-bieu-mau-trang]").forEach(initFormHost);
  });
})(window, document);
