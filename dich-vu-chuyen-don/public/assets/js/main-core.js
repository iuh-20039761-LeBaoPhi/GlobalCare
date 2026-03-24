(function (window) {
  if (window.FastGoCore) return;

  const currentPath = String(window.location.pathname || "").replace(/\\/g, "/");
  const currentPathLower = currentPath.toLowerCase();
  const inPublicDir = currentPathLower.includes("/public/");
  const projectMarker = "/dich-vu-chuyen-don/";
  const projectMarkerIndex = currentPathLower.lastIndexOf(projectMarker);
  const projectBase =
    projectMarkerIndex !== -1
      ? currentPath.slice(0, projectMarkerIndex + projectMarker.length)
      : "./";
  const publicBase = `${projectBase}public/`;
  const assetsBase = `${publicBase}assets/`;
  const apiBasePath = projectBase;

  function joinUrl(base, path) {
    if (!path) return base;
    return `${base}${String(path).replace(/^\.?\//, "")}`;
  }

  function toProjectUrl(path) {
    if (!path) return path;
    if (/^(?:[a-z]+:)?\/\//i.test(path) || String(path).startsWith("/")) return path;
    return joinUrl(projectBase, path);
  }

  function toPublicUrl(path) {
    if (!path) return path;
    if (/^(?:[a-z]+:)?\/\//i.test(path) || String(path).startsWith("/")) return path;
    return joinUrl(publicBase, path);
  }

  function toAssetsUrl(path) {
    if (!path) return path;
    if (/^(?:[a-z]+:)?\/\//i.test(path) || String(path).startsWith("/")) return path;
    const cleanedPath = String(path).replace(/^\.?\//, "").replace(/^assets\//, "");
    return joinUrl(assetsBase, cleanedPath);
  }

  function toApiUrl(path) {
    if (!path) return path;
    if (/^(?:[a-z]+:)?\/\//i.test(path) || String(path).startsWith("/")) return path;
    return joinUrl(apiBasePath, path);
  }

  function showFieldError(input, message) {
    if (!input) return;
    input.classList.add("input-error");
    let errorSpan = input.parentNode.querySelector(".field-error-msg");
    if (!errorSpan) {
      errorSpan = document.createElement("span");
      errorSpan.className = "field-error-msg";
      input.parentNode.appendChild(errorSpan);
    }
    errorSpan.innerText = message;
  }

  function clearFieldError(input) {
    if (!input) return;
    input.classList.remove("input-error");
    const errorSpan = input.parentNode.querySelector(".field-error-msg");
    if (errorSpan) {
      errorSpan.remove();
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.FastGoCore = {
    inPublicDir,
    projectBase,
    publicBase,
    assetsBase,
    apiBasePath,
    toProjectUrl,
    toPublicUrl,
    toAssetsUrl,
    toApiUrl,
    showFieldError,
    clearFieldError,
    escapeHtml,
  };
})(window);
