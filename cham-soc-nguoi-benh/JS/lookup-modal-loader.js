(function () {
  function getProjectBase() {
    var script = document.currentScript;
    if (!script || !script.src) return window.location.origin + '/';

    var url = new URL(script.src, window.location.href);
    return url.href.replace(/JS\/lookup-modal-loader\.js(?:\?.*)?$/, '');
  }

  var projectBase = getProjectBase();
  var modalPromise = null;
  var coreScriptPromise = null;

  function hasAllLookupModals() {
    return Boolean(
      document.getElementById('lookupModal') &&
      document.getElementById('lookupEmployeeDetailModal') &&
      document.getElementById('lookupInvoiceDetailModal')
    );
  }

  function appendLookupModalsFromDoc(doc) {
    var modalIds = ['lookupModal', 'lookupEmployeeDetailModal', 'lookupInvoiceDetailModal'];
    var lookupModal = document.getElementById('lookupModal') || null;

    modalIds.forEach(function (id) {
      if (document.getElementById(id)) return;

      var modalEl = doc.getElementById(id);
      if (!modalEl) return;

      document.body.appendChild(modalEl);
      if (id === 'lookupModal') {
        lookupModal = modalEl;
      }
    });

    return lookupModal || document.getElementById('lookupModal');
  }

  function findTrigger(target) {
    return target.closest('[data-lookup-modal]');
  }

  function ensureCoreScript() {
    if (typeof window.initLookupModal === 'function') {
      return Promise.resolve();
    }

    if (coreScriptPromise) return coreScriptPromise;

    coreScriptPromise = new Promise(function (resolve, reject) {
      var src = new URL('JS/lookup-modal-core.js', projectBase).href;
      if (document.querySelector('script[src="' + src + '"]')) {
        setTimeout(resolve, 0);
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('Khong tai duoc lookup-modal-core.js')); };
      document.body.appendChild(script);
    });

    return coreScriptPromise;
  }

  async function ensureLookupModal(src) {
    await ensureCoreScript();

    var modal = document.getElementById('lookupModal');
    if (modal && hasAllLookupModals()) {
      if (typeof window.initLookupModal === 'function') {
        window.initLookupModal(modal);
      }
      return modal;
    }

    if (!modalPromise) {
      var absoluteSrc = new URL(src, projectBase).href;
      modalPromise = fetch(absoluteSrc)
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var fetchedModal = appendLookupModalsFromDoc(doc);
          if (!fetchedModal) throw new Error('Khong tim thay #lookupModal');
          return fetchedModal;
        });
    }

    modal = await modalPromise;

    if (typeof window.initLookupModal === 'function') {
      window.initLookupModal(modal);
    }

    return modal;
  }

  document.addEventListener('click', async function (e) {
    var trigger = findTrigger(e.target);
    if (!trigger) return;

    e.preventDefault();

    var src = trigger.getAttribute('data-lookup-modal-src') || 'khach_hang/lookup.html';

    try {
      var modal = await ensureLookupModal(src);
      bootstrap.Modal.getOrCreateInstance(modal).show();
    } catch (error) {
      window.location.href = new URL(src, projectBase).href;
    }
  });
})();
