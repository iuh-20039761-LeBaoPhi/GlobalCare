let SHIPPING_DATA = {};
let QUOTE_SHIPPING_DATA = {};

function resolvePricingDataUrl() {
  if (typeof window === "undefined") return "assets/data/pricing-data.json";
  const inPublicDir = window.location.pathname
    .toLowerCase()
    .includes("/public/");
  const basePath =
    typeof window.apiBasePath === "string"
      ? window.apiBasePath
      : inPublicDir
        ? ""
        : "public/";
  return `${basePath}assets/data/pricing-data.json`;
}

function loadPricingDataSync() {
  if (typeof XMLHttpRequest === "undefined") return;
  const url = resolvePricingDataUrl();
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
      const parsed = JSON.parse(xhr.responseText);
      if (parsed && typeof parsed === "object") {
        if (parsed.SHIPPING_DATA && typeof parsed.SHIPPING_DATA === "object") {
          SHIPPING_DATA = parsed.SHIPPING_DATA;
        }
        if (
          parsed.QUOTE_SHIPPING_DATA &&
          typeof parsed.QUOTE_SHIPPING_DATA === "object"
        ) {
          QUOTE_SHIPPING_DATA = parsed.QUOTE_SHIPPING_DATA;
        }
      }
      return;
    }
    console.error("Không thể tải dữ liệu bảng giá:", url, xhr.status);
  } catch (err) {
    console.error("Không thể tải dữ liệu bảng giá:", url, err);
  }
}

loadPricingDataSync();

function toPositiveNumber(value) {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function roundCurrency(value) {
  return Math.round(value / 1000) * 1000;
}

function getVolumetricWeight(length, width, height, divisor) {
  const l = toPositiveNumber(length);
  const w = toPositiveNumber(width);
  const h = toPositiveNumber(height);
  if (!l || !w || !h || !divisor) return 0;
  return (l * w * h) / divisor;
}

function determineDomesticZone(fromCity, fromDistrict, toCity, toDistrict) {
  const fCity = String(fromCity || "")
    .trim()
    .toLowerCase();
  const tCity = String(toCity || "")
    .trim()
    .toLowerCase();
  const fDistrict = String(fromDistrict || "")
    .trim()
    .toLowerCase();
  const tDistrict = String(toDistrict || "")
    .trim()
    .toLowerCase();

  if (fCity && tCity && fCity === tCity) {
    if (fDistrict && tDistrict && fDistrict === tDistrict)
      return "same_district";
    return "same_city";
  }
  return "inter_city";
}

function parseEstimateRangeToHours(estimateText) {
  const text = String(estimateText || "")
    .trim()
    .toLowerCase();
  if (!text) return { minHours: 24, maxHours: 48 };

  const rangeMatch = text.match(
    /(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*(giờ|gio|h|ngày|ngay|d)/i,
  );
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(",", "."));
    const max = parseFloat(rangeMatch[2].replace(",", "."));
    const unit = rangeMatch[3];
    const multiplier = /ngày|ngay|d/i.test(unit) ? 24 : 1;
    return {
      minHours: Math.max(1, Math.round(min * multiplier)),
      maxHours: Math.max(1, Math.round(max * multiplier)),
    };
  }

  const singleMatch = text.match(
    /(\d+(?:[.,]\d+)?)\s*(giờ|gio|h|ngày|ngay|d)/i,
  );
  if (singleMatch) {
    const value = parseFloat(singleMatch[1].replace(",", "."));
    const unit = singleMatch[2];
    const multiplier = /ngày|ngay|d/i.test(unit) ? 24 : 1;
    const hours = Math.max(1, Math.round(value * multiplier));
    return { minHours: hours, maxHours: hours };
  }

  return { minHours: 24, maxHours: 48 };
}

function formatEstimateFromHours(minHours, maxHours) {
  const minH = Math.max(1, Math.round(minHours));
  const maxH = Math.max(minH, Math.round(maxHours));

  if (maxH <= 24) {
    if (minH === maxH) return `${minH} giờ`;
    return `${minH}-${maxH} giờ`;
  }

  const minDay = Math.max(1, Math.ceil(minH / 24));
  const maxDay = Math.max(minDay, Math.ceil(maxH / 24));
  if (minDay === maxDay) return `${minDay} ngày`;
  return `${minDay}-${maxDay} ngày`;
}

function getDomesticEstimateAdjustmentHours(zoneKey, billableWeight, itemType) {
  let adjust = 0;

  if (zoneKey === "inter_city") {
    if (billableWeight > 40) adjust += 48;
    else if (billableWeight > 20) adjust += 24;
    else if (billableWeight > 10) adjust += 12;
    else if (billableWeight > 5) adjust += 6;
  } else {
    if (billableWeight > 20) adjust += 10;
    else if (billableWeight > 10) adjust += 6;
    else if (billableWeight > 5) adjust += 3;
    else if (billableWeight > 2) adjust += 1;
  }

  const itemAdjustByType = {
    "gia-tri-cao": 0,
    "de-vo": zoneKey === "inter_city" ? 8 : 2,
    "chat-long": zoneKey === "inter_city" ? 6 : 1,
    "pin-lithium": zoneKey === "inter_city" ? 12 : 3,
    "dong-lanh": zoneKey === "inter_city" ? -4 : -1,
    "cong-kenh": zoneKey === "inter_city" ? 12 : 4,
  };
  adjust += itemAdjustByType[itemType] || 0;

  return adjust;
}

function buildDomesticEstimate(
  serviceConfig,
  zoneKey,
  billableWeight,
  itemType,
) {
  const estimateText = serviceConfig.estimate[zoneKey] || "";
  const parsed = parseEstimateRangeToHours(estimateText);
  const adjust = getDomesticEstimateAdjustmentHours(
    zoneKey,
    billableWeight,
    itemType,
  );
  const minHours = Math.max(1, parsed.minHours + adjust);
  const maxHours = Math.max(minHours, parsed.maxHours + adjust);
  return formatEstimateFromHours(minHours, maxHours);
}

  function getDomesticVehicleSuggestion(
  serviceType,
  zoneKey,
  billableWeight,
  itemType,
) {
  if (itemType === "cong-kenh" || billableWeight >= 40) {
    return zoneKey === "inter_city"
      ? "Xe tải liên tỉnh (2-5 tấn)"
      : "Xe tải nhẹ (1-2 tấn)";
  }
  if (itemType === "dong-lanh") return "Xe tải lạnh/xe van lạnh";
  if (itemType === "de-vo" || billableWeight >= 15) return "Xe van/xe tải nhẹ";
  if (itemType === "pin-lithium" && zoneKey === "inter_city")
    return "Xe tải liên tỉnh (hạn chế hàng không)";

  if (serviceType === "slow") {
    return zoneKey === "inter_city"
      ? "Xe tải ghép liên tỉnh"
      : "Xe tải nhẹ ghép tuyến";
  }
  if (
    serviceType === "fast" &&
    zoneKey !== "inter_city" &&
    billableWeight <= 15
  ) {
    return "Xe máy/xe van nhanh";
  }
  if (
    serviceType === "express" &&
    zoneKey !== "inter_city" &&
    billableWeight <= 10
  ) {
    return "Xe máy";
  }
  if (zoneKey === "inter_city") return "Xe tải liên tỉnh + trung chuyển";
  return "Xe máy";
}

function getInternationalEstimateAdjustmentDays(
  zoneKey,
  billableWeight,
  itemType,
) {
  let adjustDays = 0;

  if (billableWeight > 50) adjustDays += 5;
  else if (billableWeight > 30) adjustDays += 3;
  else if (billableWeight > 15) adjustDays += 2;
  else if (billableWeight > 5) adjustDays += 1;

  const itemAdjustByType = {
    "de-vo": 1,
    "chat-long": 1,
    "pin-lithium": 2,
    "dong-lanh": 1,
    "cong-kenh": 2,
  };
  adjustDays += itemAdjustByType[itemType] || 0;

  const zoneAdjustByKey = {
    asia: 0,
    europe: 0,
    america: 1,
    oceania: 1,
    africa: 1,
    other: 1,
  };
  adjustDays += zoneAdjustByKey[zoneKey] || 0;

  return adjustDays;
}

function buildInternationalEstimate(
  serviceConfig,
  zoneKey,
  billableWeight,
  itemType,
) {
  const estimateText =
    serviceConfig.estimate[zoneKey] || serviceConfig.estimate.other || "";
  const parsed = parseEstimateRangeToHours(estimateText);
  const adjustDays = getInternationalEstimateAdjustmentDays(
    zoneKey,
    billableWeight,
    itemType,
  );
  const adjustHours = adjustDays * 24;
  const minHours = Math.max(24, parsed.minHours + adjustHours);
  const maxHours = Math.max(minHours, parsed.maxHours + adjustHours);
  return formatEstimateFromHours(minHours, maxHours);
}

function getInternationalVehicleSuggestion(zoneKey, billableWeight, itemType) {
  if (itemType === "pin-lithium") {
    return "Đường bộ/biển + xe tải chặng cuối";
  }
  if (itemType === "cong-kenh" || billableWeight >= 30) {
    return "Đường biển/đường bộ + xe tải chặng cuối";
  }
  if (zoneKey === "asia" && billableWeight <= 5) {
    return "Máy bay + xe van chặng cuối";
  }
  return "Máy bay + xe tải chặng cuối";
}

function calculateShipping(
  area,
  level,
  weight,
  l,
  r,
  c,
  codValue = 0, // giá trị thu hộ
  insuranceValue = 0, // giá trị khai giá để tính bảo hiểm
) {
  const dimWeight = (l * r * c) / 6000;
  // Giả sử weight truyền vào đã là tổng weight của đơn hàng
  const finalWeight = Math.max(weight, dimWeight);
  const config = SHIPPING_DATA[area][level];
  let total = config.base;

  if (finalWeight > 0.5) {
    total += Math.ceil((finalWeight - 0.5) / 0.5) * config.next;
  }

  let addonFee = 0;
  if (codValue > SHIPPING_DATA.addons.cod.threshold) {
    addonFee += Math.max(
      codValue * SHIPPING_DATA.addons.cod.fee_rate,
      SHIPPING_DATA.addons.cod.min,
    );
  }
  if (insuranceValue > 0) {
    addonFee += insuranceValue * SHIPPING_DATA.addons.ins.fee_rate;
  }

  return {
    shipFee: total,
    addonFee: addonFee,
    total: total + addonFee,
    weight: finalWeight.toFixed(2),
    estimate: config.time,
  };
}

function calculateDomesticQuote(payload) {
  const config = QUOTE_SHIPPING_DATA.domestic;
  const quantity = Math.max(
    1,
    Math.round(toPositiveNumber(payload.quantity) || 1),
  );
  const zoneKey = determineDomesticZone(
    payload.fromCity,
    payload.fromDistrict,
    payload.toCity,
    payload.toDistrict,
  );
  const billableWeightPerPackage = Math.max(
    toPositiveNumber(payload.weight),
    getVolumetricWeight(
      payload.length,
      payload.width,
      payload.height,
      config.volumeDivisor,
    ),
    0.1,
  );
  const billableWeight = billableWeightPerPackage * quantity;
  const baseIncludedWeight = Math.max(
    toPositiveNumber(config.baseIncludedWeight),
    0.5,
  );
  const extraWeightSteps = Math.max(
    0,
    Math.ceil((billableWeightPerPackage - baseIncludedWeight) / 0.5),
  );
  const goodsFixedFee = config.goodsTypeFee[payload.itemType] || 0;
  const goodsMultiplier =
    (config.goodsTypeMultiplier || {})[payload.itemType] || 1;
  const codValue = toPositiveNumber(payload.codValue);
  const insuranceValue = toPositiveNumber(payload.insuranceValue);
  const codFreeThreshold = toPositiveNumber((config.cod || {}).freeThreshold);
  const codFee =
    codValue > codFreeThreshold
      ? Math.max(codValue * config.cod.rate, config.cod.min)
      : 0;
  const domesticInsurance = config.insurance || {};
  const freeThreshold = toPositiveNumber(domesticInsurance.freeThreshold);
  const insuranceRate = toPositiveNumber(domesticInsurance.rate);
  const insuranceMin = toPositiveNumber(domesticInsurance.minAboveThreshold);
  const insuranceFee =
    insuranceValue > freeThreshold && insuranceRate > 0
      ? Math.max(insuranceValue * insuranceRate, insuranceMin)
      : 0;

  const services = Object.entries(config.services).map(
    ([serviceType, serviceConfig]) => {
      const basePricePerOrder = serviceConfig.base[zoneKey] || 0;
      const weightFeePerOrder =
        extraWeightSteps * (serviceConfig.perHalfKg || 0);
      const basePrice = basePricePerOrder;
      const weightFee = weightFeePerOrder;
      const goodsMultiplierFee =
        (basePricePerOrder + weightFeePerOrder) *
        Math.max(goodsMultiplier - 1, 0);
      const goodsFee = (goodsFixedFee * quantity) + goodsMultiplierFee;
      const total = roundCurrency(
        basePrice + weightFee + goodsFee + codFee + insuranceFee,
      );
      const estimate = buildDomesticEstimate(
        serviceConfig,
        zoneKey,
        billableWeight,
        payload.itemType,
      );
      const vehicleSuggestion = getDomesticVehicleSuggestion(
        serviceType,
        zoneKey,
        billableWeight,
        payload.itemType,
      );
      return {
        serviceType,
        serviceName: serviceConfig.label,
        estimate,
        vehicleSuggestion,
        total,
        breakdown: {
          basePrice,
          weightFee,
          goodsFee: roundCurrency(goodsFee),
          codFee,
          insuranceFee,
        },
      };
    },
  );

  services.sort((a, b) => a.total - b.total);

  return {
    mode: "domestic",
    zoneKey,
    zoneLabel: config.zoneLabels[zoneKey] || "",
    billableWeight: Number(billableWeight.toFixed(2)),
    billableWeightPerPackage: Number(billableWeightPerPackage.toFixed(2)),
    quantity,
    services,
  };
}

function getInternationalZone(countryName) {
  const zoneMap = QUOTE_SHIPPING_DATA.international.countryZoneMap;
  return zoneMap[countryName] || "other";
}

function calculateInternationalQuote(payload) {
  const config = QUOTE_SHIPPING_DATA.international;
  const quantity = Math.max(
    1,
    Math.round(toPositiveNumber(payload.quantity) || 1),
  );
  const zoneKey = getInternationalZone(payload.country);
  const goodsMultiplier = config.goodsTypeMultiplier[payload.itemType] || 1;
  const billableWeightPerPackage = Math.max(
    toPositiveNumber(payload.weight),
    getVolumetricWeight(
      payload.length,
      payload.width,
      payload.height,
      config.volumeDivisor,
    ),
    0.1,
  );
  const billableWeight = billableWeightPerPackage * quantity;
  const baseIncludedWeight = Math.max(
    toPositiveNumber(config.baseIncludedWeight),
    0.5,
  );
  const extraWeightSteps = Math.max(
    0,
    Math.ceil((billableWeightPerPackage - baseIncludedWeight) / 0.5),
  );
  const customsFeePerPackage =
    config.customsFee[zoneKey] || config.customsFee.other || 0;
  const customsFee = customsFeePerPackage * quantity;
  const insuranceValue = toPositiveNumber(payload.insuranceValue);
  const intlInsurance = config.insurance || {};
  const intlInsuranceRate = toPositiveNumber(intlInsurance.rate);
  const intlInsuranceMin = toPositiveNumber(intlInsurance.min);
  const insuranceFee =
    insuranceValue > 0 && intlInsuranceRate > 0
      ? Math.max(insuranceValue * intlInsuranceRate, intlInsuranceMin)
      : 0;

  const services = Object.entries(config.services).map(
    ([serviceType, serviceConfig]) => {
      const basePricePerOrder =
        serviceConfig.base[zoneKey] || serviceConfig.base.other || 0;
      const perHalf =
        serviceConfig.perHalfKg[zoneKey] || serviceConfig.perHalfKg.other || 0;
      const weightFeePerOrder = extraWeightSteps * perHalf;
      const basePrice = basePricePerOrder;
      const weightFee = weightFeePerOrder;
      const goodsAdjustedFee =
        (basePricePerOrder + weightFeePerOrder) *
        (goodsMultiplier - 1);
      const fuelFee =
        (basePricePerPackage + weightFeePerPackage) *
        config.fuelRate *
        quantity;
      const securityFee = config.securityFee * quantity;
      const total = roundCurrency(
        basePrice +
          weightFee +
          goodsAdjustedFee +
          fuelFee +
          customsFee +
          securityFee +
          insuranceFee,
      );
      const estimate = buildInternationalEstimate(
        serviceConfig,
        zoneKey,
        billableWeight,
        payload.itemType,
      );
      const vehicleSuggestion = getInternationalVehicleSuggestion(
        zoneKey,
        billableWeight,
        payload.itemType,
      );

      return {
        serviceType,
        serviceName: serviceConfig.label,
        estimate,
        vehicleSuggestion,
        total,
        breakdown: {
          basePrice,
          weightFee,
          goodsAdjustedFee: roundCurrency(goodsAdjustedFee),
          fuelFee: roundCurrency(fuelFee),
          customsFee,
          securityFee,
          insuranceFee,
        },
      };
    },
  );

  services.sort((a, b) => a.total - b.total);

  return {
    mode: "international",
    zoneKey,
    zoneLabel: config.zoneLabels[zoneKey] || "",
    billableWeight: Number(billableWeight.toFixed(2)),
    billableWeightPerPackage: Number(billableWeightPerPackage.toFixed(2)),
    quantity,
    services,
  };
}

if (typeof window !== "undefined") {
  window.SHIPPING_DATA = SHIPPING_DATA;
  window.QUOTE_SHIPPING_DATA = QUOTE_SHIPPING_DATA;
  window.calculateShipping = calculateShipping;
  window.calculateDomesticQuote = calculateDomesticQuote;
  window.calculateInternationalQuote = calculateInternationalQuote;
}
