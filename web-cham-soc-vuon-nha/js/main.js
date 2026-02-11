document.addEventListener("DOMContentLoaded", () => {
    console.log("Green Care Website Loaded");

    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất.");
            form.reset();
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {

    /* ===== SLIDER ===== */
    const slides = document.querySelectorAll(".slide");
    const nextBtn = document.querySelector(".next");
    const prevBtn = document.querySelector(".prev");

    if (slides.length > 0) {
        let current = 0;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove("active"));
            slides[index].classList.add("active");
        }

        if (nextBtn && prevBtn) {
            nextBtn.addEventListener("click", () => {
                current = (current + 1) % slides.length;
                showSlide(current);
            });

            prevBtn.addEventListener("click", () => {
                current = (current - 1 + slides.length) % slides.length;
                showSlide(current);
            });
        }

        setInterval(() => {
            current = (current + 1) % slides.length;
            showSlide(current);
        }, 5000);
    }

    /* ===== CONTACT FORM ===== */
    const form = document.querySelector(".contact-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Cảm ơn bạn đã liên hệ! Green Care sẽ gọi lại sớm.");
            form.reset();
        });
    }

});
