(function (window) {
  if (window.OrderDisplayUtils) {
    return;
  }

  function normalizeOrderId(id) {
    var numeric = Number(id);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }

    return Math.floor(numeric);
  }

  function formatOrderDisplayId(id) {
    var normalized = normalizeOrderId(id);
    if (normalized == null) {
      return "-";
    }

    return String(normalized).padStart(7, "0");
  }

  function resolveOrderDisplayCode(row) {
    var fromId = formatOrderDisplayId(row && row.id);
    if (fromId !== "-") {
      return fromId;
    }

    var legacy = String((row && row.madonhang) || "").trim();
    return legacy || "-";
  }

  function parseOrderIdFromDisplayCode(code) {
    var text = String(code || "").trim();
    if (!text) {
      return null;
    }

    var legacyMatch = text.match(/GU-(\d+)/i);
    if (legacyMatch) {
      return normalizeOrderId(legacyMatch[1]);
    }

    var exactSevenDigits = text.match(/^(\d{7})$/);
    if (exactSevenDigits) {
      return normalizeOrderId(exactSevenDigits[1]);
    }

    var numericOnly = text.replace(/\D/g, "");
    if (!numericOnly) {
      return null;
    }

    return normalizeOrderId(numericOnly);
  }

  window.OrderDisplayUtils = {
    normalizeOrderId: normalizeOrderId,
    formatOrderDisplayId: formatOrderDisplayId,
    resolveOrderDisplayCode: resolveOrderDisplayCode,
    parseOrderIdFromDisplayCode: parseOrderIdFromDisplayCode,
  };
})(window);
