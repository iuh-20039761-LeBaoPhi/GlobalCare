(function () {
  var DEFAULT_LOGIN_MODAL_SRC = 'login.html';

  function findTrigger(target) {
    return target.closest('[data-login-modal]');
  }

  document.addEventListener('click', function (e) {
    var trigger = findTrigger(e.target);
    if (!trigger) return;

    e.preventDefault();

    var src = trigger.getAttribute('data-login-modal-src') || DEFAULT_LOGIN_MODAL_SRC;
    window.location.href = src;
  });
})();
