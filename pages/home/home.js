// Micrófono: cambiar estado visualmente
const btnMic = document.getElementById("btnMic");
const micStatus = document.getElementById("micStatus");

let micActivo = false;

btnMic.addEventListener("click", () => {
    micActivo = !micActivo;

    btnMic.classList.toggle("icon-btn--active", micActivo);
    btnMic.setAttribute("aria-pressed", micActivo ? "true" : "false");

    if (micStatus) {
        micStatus.textContent = micActivo
            ? "Escuchando... di, por ejemplo: \"Abrir último documento\""
            : "Micrófono desactivado";
    }
});

// Navegación inferior: resaltar botón activo (sólo visual)
const bottomButtons = document.querySelectorAll(".bottom-btn");

bottomButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        bottomButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});
