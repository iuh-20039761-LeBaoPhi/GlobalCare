(function (window) {
  if (window.FastGoCore) return;

  const inPublicDir = window.location.pathname
    .toLowerCase()
    .includes("/public/");

  const apiBasePath = inPublicDir ? "" : "public/";

  function toApiUrl(path) {
    if (!path) return path;
    if (/^(?:[a-z]+:)?\/\//i.test(path)) return path;
    return `${apiBasePath}${path}`;
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
    apiBasePath,
    toApiUrl,
    showFieldError,
    clearFieldError,
    escapeHtml,
  };
})(window);
