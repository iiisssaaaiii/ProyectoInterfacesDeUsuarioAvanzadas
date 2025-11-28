// Cargar configuraciones al abrir la página
document.addEventListener("DOMContentLoaded", () => {
    cargarConfiguraciones();

    document.getElementById("btn-guardar-config").addEventListener("click", guardarConfiguraciones);
});

function cargarConfiguraciones() {
    document.getElementById("toggle-tema").checked = localStorage.getItem("temaOscuro") === "true";
    document.getElementById("toggle-fullscreen").checked = localStorage.getItem("autoFull") === "true";
    document.getElementById("toggle-fechas").checked = localStorage.getItem("mostrarFechas") === "true";
    document.getElementById("toggle-compacta").checked = localStorage.getItem("vistaCompacta") === "true";
}

function guardarConfiguraciones() {
    localStorage.setItem("temaOscuro", document.getElementById("toggle-tema").checked);
    localStorage.setItem("autoFull", document.getElementById("toggle-fullscreen").checked);
    localStorage.setItem("mostrarFechas", document.getElementById("toggle-fechas").checked);
    localStorage.setItem("vistaCompacta", document.getElementById("toggle-compacta").checked);

    alert("✔ Configuración guardada");
}
