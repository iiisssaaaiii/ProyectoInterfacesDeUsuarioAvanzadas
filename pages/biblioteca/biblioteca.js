// ======================= COLECCIÓN (con localStorage) =======================

// Libros de prueba con miniaturas (colección por defecto)
const coleccionPorDefecto = [
  {
    id: 1,
    titulo: "Estructuras de Datos en Java.pdf",
    fecha: "12/10/2024",
    imagen: "img/descarga1.jpg",
  },
  {
    id: 2,
    titulo: "Fundamentos de Ingeniería de Software.pdf",
    fecha: "05/09/2024",
    imagen: "img/descarga2.jpg",
  },
  {
    id: 3,
    titulo: "Arquitectura de Computadoras.pdf",
    fecha: "20/08/2024",
    imagen: "img/descarga3.jpg",
  },
  {
    id: 4,
    titulo: "Compiladores: Principios y Práctica.pdf",
    fecha: "02/09/2024",
    imagen: "img/descarga4.jpg",
  },
  {
    id: 5,
    titulo: "Matemáticas Discretas II.pdf",
    fecha: "18/11/2024",
    imagen: "img/descarga5.jpg",
  },
];

// Colección que realmente se usa en la página
let coleccion = [];
let libroActivo = null;
let etiquetasDetalle = [];

// ========= Elementos del DOM =========
const grid = document.querySelector(".grid-container");
const inputBusqueda = document.querySelector(".search");

// Elementos del modal de detalle
const detalleModal = document.getElementById("detalleModal");
const detalleTitleInput = document.getElementById("detalleTitleInput");
const detalleFechaSpan = document.getElementById("detalleFechaSpan");
const detalleIdSpan = document.getElementById("detalleIdSpan");
const detalleTagInput = document.getElementById("detalleTagInput");
const detalleAddTagBtn = document.getElementById("detalleAddTagBtn");
const detalleTagsContainer = document.getElementById("detalleTagsContainer");
const detalleCoverPreview = document.getElementById("detalleCoverPreview");
const detalleCoverInput = document.getElementById("detalleCoverInput");
const detalleChangeCoverBtn = document.getElementById("detalleChangeCoverBtn");
const detalleSaveBtn = document.getElementById("detalleSaveBtn");
const detalleCloseBtn = document.getElementById("detalleCloseBtn");

// ========= Utilidades localStorage =========
function guardarColeccion() {
  localStorage.setItem("coleccion", JSON.stringify(coleccion));
}

function cargarColeccion() {
  const raw = localStorage.getItem("coleccion");
  if (!raw) {
    // Si no hay nada guardado, usamos la colección por defecto
    coleccion = [...coleccionPorDefecto];
    guardarColeccion();
    return;
  }

  try {
    coleccion = JSON.parse(raw);
  } catch (err) {
    console.error("Error al parsear coleccion desde localStorage:", err);
    coleccion = [...coleccionPorDefecto];
    guardarColeccion();
  }
}

// ========= Render de tarjetas =========
function mostrarColeccion(lista) {
  grid.innerHTML = ""; // limpiar antes de renderizar

  lista.forEach((pdf) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const portada = pdf.portada || pdf.imagen;

    card.innerHTML = `
        <div class="thumb" style="background-image: url('${portada}'); background-size: cover; background-position: center;"></div>
        <button class="detail-btn">Ver detalles</button>
        <h3>${pdf.titulo}</h3>
        <span class="meta">Agregado: ${pdf.fecha}</span>
    `;

    const detailBtn = card.querySelector(".detail-btn");
    detailBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirDetalleLibro(pdf);
    });

    grid.appendChild(card);
  });
}

// ========= Modal Detalle: helpers =========
function renderDetallePortada() {
  if (!detalleCoverPreview) return;
  const placeholder = detalleCoverPreview.querySelector(".cover-placeholder");

  const portada = libroActivo && (libroActivo.portada || libroActivo.imagen);
  if (portada) {
    detalleCoverPreview.style.backgroundImage = `url('${portada}')`;
    detalleCoverPreview.style.backgroundSize = "cover";
    detalleCoverPreview.style.backgroundPosition = "center";
    if (placeholder) placeholder.style.display = "none";
  } else {
    detalleCoverPreview.style.backgroundImage = "";
    if (placeholder) placeholder.style.display = "inline-flex";
  }
}

function renderDetalleEtiquetas() {
  if (!detalleTagsContainer) return;
  detalleTagsContainer.innerHTML = "";

  etiquetasDetalle.forEach((tag, index) => {
    const chip = document.createElement("div");
    chip.classList.add("tag-chip");
    chip.innerHTML = `
      <span>${tag}</span>
      <button class="tag-remove" data-index="${index}">&times;</button>
    `;
    detalleTagsContainer.appendChild(chip);
  });

  const removeButtons = detalleTagsContainer.querySelectorAll(".tag-remove");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      etiquetasDetalle.splice(idx, 1);
      renderDetalleEtiquetas();
    });
  });
}

function abrirDetalleLibro(pdf) {
  if (!detalleModal) return;

  libroActivo = pdf;
  etiquetasDetalle = Array.isArray(pdf.etiquetas) ? [...pdf.etiquetas] : [];

  if (detalleTitleInput) detalleTitleInput.value = pdf.titulo || "";
  if (detalleFechaSpan) detalleFechaSpan.textContent = pdf.fecha || "—";
  if (detalleIdSpan) detalleIdSpan.textContent = pdf.id || "—";

  renderDetallePortada();
  renderDetalleEtiquetas();

  detalleModal.classList.add("is-open");
}

function cerrarDetalleModal() {
  if (!detalleModal) return;
  detalleModal.classList.remove("is-open");
  libroActivo = null;
  etiquetasDetalle = [];
}

// ========= Eventos del modal detalle =========
if (detalleChangeCoverBtn && detalleCoverInput) {
  detalleChangeCoverBtn.addEventListener("click", () => {
    detalleCoverInput.click();
  });

  detalleCoverInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !libroActivo) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      libroActivo.portada = ev.target.result;
      renderDetallePortada();
      guardarColeccion();
      mostrarColeccion(coleccion);
    };
    reader.readAsDataURL(file);
  });
}

function agregarEtiquetaDetalle() {
  if (!detalleTagInput) return;
  const valor = detalleTagInput.value.trim();
  if (!valor) return;

  etiquetasDetalle.push(valor);
  detalleTagInput.value = "";
  renderDetalleEtiquetas();
}

if (detalleAddTagBtn && detalleTagInput) {
  detalleAddTagBtn.addEventListener("click", agregarEtiquetaDetalle);
  detalleTagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarEtiquetaDetalle();
    }
  });
}

if (detalleSaveBtn) {
  detalleSaveBtn.addEventListener("click", () => {
    if (!libroActivo || !detalleTitleInput) return;

    const nuevoTitulo = detalleTitleInput.value.trim();
    if (!nuevoTitulo) {
      alert("El nombre del libro no puede estar vacío.");
      return;
    }

    libroActivo.titulo = nuevoTitulo;
    libroActivo.etiquetas = etiquetasDetalle;

    const idx = coleccion.findIndex(
      (item) => String(item.id) === String(libroActivo.id)
    );
    if (idx !== -1) {
      coleccion[idx] = libroActivo;
      guardarColeccion();
      mostrarColeccion(coleccion);
    }

    cerrarDetalleModal();
  });
}

if (detalleCloseBtn && detalleModal) {
  detalleCloseBtn.addEventListener("click", cerrarDetalleModal);

  detalleModal.addEventListener("click", (e) => {
    if (e.target === detalleModal) {
      cerrarDetalleModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detalleModal.classList.contains("is-open")) {
      cerrarDetalleModal();
    }
  });
}

// ========= Buscar =========
if (inputBusqueda) {
  inputBusqueda.addEventListener("input", () => {
    const texto = inputBusqueda.value.toLowerCase();

    const filtrados = coleccion.filter((pdf) =>
      pdf.titulo.toLowerCase().includes(texto)
    );

    mostrarColeccion(filtrados);
  });
}

// ======================= MODAL AGREGAR LIBRO (si existe en el HTML) =======================
// (si aún no tienes el HTML de este modal, este bloque no rompe nada)
document.addEventListener("DOMContentLoaded", function () {
  const btnAgregarPDF = document.getElementById("agregarPDF");
  const modalOverlay = document.getElementById("modalAgregarLibro");
  const btnCerrar = document.getElementById("modalAgregarLibroClose");
  const btnCancelar = document.getElementById("btnModalCancelar");

  const inputArchivoPdf = document.getElementById("inputArchivoPdf");
  const btnSubirArchivo = document.getElementById("btnSubirArchivo");

  const nombreArchivoSpan = document.getElementById("infoNombreArchivo");
  const tamanioArchivoSpan = document.getElementById("infoTamanioArchivo");
  const formatoArchivoSpan = document.getElementById("infoFormatoArchivo");

  const coverPreview = document.getElementById("previewCover");
  let currentPreviewUrl = null;

  function abrirModal() {
    if (modalOverlay) {
      modalOverlay.classList.add("is-open");
    }
  }

  function cerrarModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove("is-open");
    }
  }

  if (btnAgregarPDF) {
    btnAgregarPDF.addEventListener("click", abrirModal);
  }

  if (btnCerrar) {
    btnCerrar.addEventListener("click", cerrarModal);
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", cerrarModal);
  }

  // Cerrar clicando fuera del cuadro
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) {
        cerrarModal();
      }
    });
  }

  // Cerrar con ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      cerrarModal();
    }
  });

  // Abrir selector de archivo desde el botón "Subir"
  if (btnSubirArchivo && inputArchivoPdf) {
    btnSubirArchivo.addEventListener("click", function () {
      inputArchivoPdf.click();
    });

    // Actualizar información y vista previa al elegir archivo
    inputArchivoPdf.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      // --- Información de texto ---
      if (nombreArchivoSpan) nombreArchivoSpan.textContent = file.name;
      if (tamanioArchivoSpan) {
        const sizeKb = Math.round(file.size / 1024);
        tamanioArchivoSpan.textContent = sizeKb + " kbs";
      }
      if (formatoArchivoSpan) {
        const parts = file.name.split(".");
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : "pdf";
        formatoArchivoSpan.textContent = ext;
      }

      // --- Limpiar preview anterior ---
      if (coverPreview) {
        coverPreview.style.backgroundImage = "";
        coverPreview.innerHTML = "";
      }
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
      }

      // --- Si es imagen, usarla como fondo ---
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          if (coverPreview) {
            coverPreview.style.backgroundImage = `url('${ev.target.result}')`;
            coverPreview.style.backgroundSize = "cover";
            coverPreview.style.backgroundPosition = "center";
          }
        };
        reader.readAsDataURL(file);

        // --- Si es PDF, embeberlo dentro del recuadro ---
      } else if (file.type === "application/pdf") {
        const url = URL.createObjectURL(file);
        currentPreviewUrl = url;

        if (coverPreview) {
          const embed = document.createElement("embed");
          embed.src = url;
          embed.type = "application/pdf";
          embed.style.width = "100%";
          embed.style.height = "100%";
          embed.style.borderRadius = "inherit";
          embed.style.display = "block";

          coverPreview.appendChild(embed);
        }
      }
    });
  }
});

// ======================= INICIALIZAR =======================
cargarColeccion();
mostrarColeccion(coleccion);
