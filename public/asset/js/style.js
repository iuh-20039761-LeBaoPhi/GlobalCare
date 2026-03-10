lucide.createIcons();

const navbar = document.getElementById("mainNavbar");
const logoIcon = document.querySelector(".logo-icon");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

document.querySelectorAll(".service-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {});
});

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll("#navbarNav .nav-link");
  const navbarCollapse = document.getElementById("navbarNav");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
        toggle: false,
      });
      bsCollapse.hide();
    });
  });
});
