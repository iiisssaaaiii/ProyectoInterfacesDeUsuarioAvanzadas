// navbar.js
document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("navbar-root");
    if (!root) return;

    // Carga el HTML del navbar global
    fetch("navbar.html")
        .then(res => res.text())
        .then(html => {
            root.innerHTML = html;

            // Marcar como activo según data-page del <body>
            const currentPage = document.body.dataset.page; // ej: "inicio"
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
