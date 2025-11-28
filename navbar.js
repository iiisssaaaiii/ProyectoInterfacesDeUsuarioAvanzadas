document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("navbar-root");
    if (!root) return;

    // Desde /pages/home/, /pages/biblioteca/, etc. subir un nivel y buscar navbar.html
    const navbarPath = window.NAVBAR_PATH || "../navbar.html";

    fetch(navbarPath)
        .then(res => res.text())
        .then(html => {
            root.innerHTML = html;

            // Marcar link activo según data-page del body
            const currentPage = (document.body.dataset.page || "").toLowerCase();
            if (!currentPage) return;

            const links = root.querySelectorAll(".top-nav-link");
            links.forEach(link => {
                if (link.dataset.page === currentPage) {
                    link.classList.add("active");
                }
            });
        })
        .catch(err => console.error("Error al cargar navbar:", err));
});