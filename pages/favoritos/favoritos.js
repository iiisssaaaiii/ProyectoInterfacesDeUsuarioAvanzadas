// ======================
// Cargar favoritos
// ======================
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

const grid = document.getElementById("fav-grid");
const emptyMsg = document.getElementById("fav-empty");

function renderFavoritos() {
    grid.innerHTML = "";

    if (favoritos.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }

    emptyMsg.style.display = "none";

    favoritos.forEach(libro => {
        const card = document.createElement("div");
        card.className = "fav-card";

        card.innerHTML = `
            <div class="fav-thumb" style="background-image:url('${libro.imagen}')"></div>
            <div class="fav-title">${libro.titulo}</div>

            <button class="btn-remove" onclick="removeFav(${libro.id})">
                Quitar de favoritos
            </button>
        `;

        grid.appendChild(card);
    });
}

function removeFav(id) {
    favoritos = favoritos.filter(l => l.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    renderFavoritos();
}

renderFavoritos();

// Navbar global
document.addEventListener("click", e => {
    if (e.target.closest("#btn-back")) history.back();
    if (e.target.closest("#btn-home")) location.href = "../biblioteca/biblioteca.html";
});
