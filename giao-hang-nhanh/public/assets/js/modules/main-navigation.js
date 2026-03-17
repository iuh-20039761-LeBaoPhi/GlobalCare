(function (window, document) {
  if (window.__giaoHangNhanhNavInitDone) return;
  window.__giaoHangNhanhNavInitDone = true;

  const core = window.GiaoHangNhanhCore;
  if (!core) return;

  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navMenu = document.getElementById("nav-menu");

  const closeAllDropdowns = () => {
    // Legacy support & Submenus
    document.querySelectorAll(".has-submenu").forEach((item) => {
      item.classList.remove("open");
    });
    
    // Header actions
    document.querySelectorAll(".profile-dropdown-wrapper, .notification-wrapper").forEach((item) => {
        item.classList.remove("open");
    });

    document.querySelectorAll(".header-dropdown, .profile-menu").forEach((menu) => {
        menu.classList.remove("open");
    });
  };

  // Hamburger Toggle
  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      hamburgerBtn.classList.toggle("active");
      navMenu.classList.toggle("active");
    });
  }

  // Submenu Toggle (Mobile & Desktop Click)
  document.querySelectorAll(".submenu-toggle, .has-submenu > a").forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      const isMobile = window.innerWidth <= 1024;
      const parentLi = this.closest(".has-submenu");
      if (!parentLi) return;

      // Trên mobile hoặc nếu thẻ a có href='#' thì ngăn chặn chuyển trang
      if (isMobile || this.getAttribute('href') === '#') {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = parentLi.classList.contains("open");
        
        // Close other submenus/dropdowns
        if (!isOpen) closeAllDropdowns();

        parentLi.classList.toggle("open");
      }
    });
  });

  // Profile Dropdown
  const profileToggle = document.getElementById("profile-toggle");
  const profileWrapper = document.querySelector(".profile-dropdown-wrapper");
  const profileMenu = document.querySelector(".profile-menu");
  
  if (profileToggle && profileMenu && profileWrapper) {
    profileToggle.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = profileWrapper.classList.contains("open");
        closeAllDropdowns();
        if (!isOpen) {
            profileWrapper.classList.add("open");
            profileMenu.classList.add("open");
        }
    });
  }

  // Admin Notification Bell
  const adminNotifyBell = document.getElementById("admin-notification-bell");
  const adminNotifyWrapper = document.querySelector(".notification-wrapper");
  const adminNotifyDropdown = document.getElementById("admin-notification-dropdown");
  
  if (adminNotifyBell && adminNotifyDropdown && adminNotifyWrapper) {
    adminNotifyBell.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = adminNotifyWrapper.classList.contains("open");
        closeAllDropdowns();
        
        if (!isOpen) {
            adminNotifyWrapper.classList.add("open");
            adminNotifyDropdown.classList.add("open");
            
            const dropdownBody = adminNotifyDropdown.querySelector(".dropdown-body");
            if (dropdownBody && dropdownBody.querySelector(".empty-state")) {
                 fetch(core.toApiUrl("get_notifications_ajax.php"))
                  .then((res) => res.text())
                  .then((html) => {
                    if (html.trim()) dropdownBody.innerHTML = html;
                  })
                  .catch(() => {});
            }
        }
    });
  }

  // Global click to close
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-submenu") && !e.target.closest(".profile-dropdown-wrapper") && !e.target.closest(".notification-wrapper")) {
        closeAllDropdowns();
    }
    
    // Close mobile menu if clicked outside
    if (navMenu && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        hamburgerBtn.classList.remove("active");
        navMenu.classList.remove("active");
    }
  });

})(window, document);
