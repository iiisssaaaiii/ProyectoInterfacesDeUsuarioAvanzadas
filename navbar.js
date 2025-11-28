document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("navbar-root");
    if (!root) return;

    const navbarPath = window.NAVBAR_PATH || "../navbar.html";

    fetch(navbarPath)
        .then(res => res.text())
        .then(html => {
            root.innerHTML = html;

            const currentPage = document.body.dataset.page;
            if (!currentPage) return;

            const links = root.querySelectorAll(".top-nav-link");
            links.forEach(link => {
                if (link.dataset.page === currentPage.toLowerCase()) {
                    link.classList.add("active");
                }
            });
        })
        .catch(err => console.error("Error al cargar navbar:", err));
});