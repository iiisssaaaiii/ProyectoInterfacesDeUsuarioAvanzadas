const body = document.querySelector("body.pdf-viewer-body");
const btnModeToggle = document.getElementById("btn-mode-toggle");
const btnOptions = document.getElementById("btn-options");
const optionsMenu = document.getElementById("options-menu");

// Modo lectura / modo noche
btnModeToggle.addEventListener("click", () => {
  const isReadingMode = body.classList.toggle("reading-mode");
  btnModeToggle.textContent = isReadingMode ? "Modo noche" : "Modo lectura";
});

// Menú de opciones (Descargar, índice, etc.)
btnOptions.addEventListener("click", (event) => {
  event.stopPropagation();
  optionsMenu.classList.toggle("open");
});

// Cerrar menú al hacer click fuera
document.addEventListener("click", () => {
  optionsMenu.classList.remove("open");
});

// Evitar que el click dentro del menú lo cierre inmediatamente
optionsMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});

// Botón atrás (por ahora solo simulación)
const btnBack = document.getElementById("btn-back");
btnBack.addEventListener("click", () => {
  // Aquí luego puedes hacer window.location.href = "biblioteca.html" o similar
  console.log("Volver a la pantalla anterior");
});
