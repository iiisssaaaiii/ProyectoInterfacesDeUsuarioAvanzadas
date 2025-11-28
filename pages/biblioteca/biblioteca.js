// ======================= COLECCIÓN (con localStorage + backend) =======================

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

// Colección real
let coleccion = [];
let libroActivo = null;
let etiquetasDetalle = [];

// ========= Elementos del DOM =========
const grid = document.querySelector(".grid-container");
const inputBusqueda = document.querySelector(".search");

// Modal detalle
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

function cargarColeccionLocal() {
  const raw = localStorage.getItem("coleccion");
  if (!raw) {
    coleccion = [...coleccionPorDefecto];
    guardarColeccion();
    return;
  }

  try {
    coleccion = JSON.parse(raw);
  } catch (err) {
    console.error("Error al parsear coleccion:", err);
    coleccion = [...coleccionPorDefecto];
    guardarColeccion();
  }
}



// ======================================================================
//   🚀 NUEVO: Cargar PDFs desde el BACKEND y fusionarlos con localStorage
// ======================================================================
async function cargarDesdeBackend() {
  try {
    const response = await fetch("http://localhost:8080/api/pdfs");
    const data = await response.json();

    console.log("📡 PDFs del backend:", data);

    // Convertir al formato correcto para tu UI
    const pdfsBackend = data.map(pdf => ({
      id: pdf.id,            // UUID del backend
      titulo: pdf.name,      // nombre del archivo
      archivoURL: pdf.url,   // URL DIRECTA del backend
      fecha: new Date().toLocaleDateString(),
      imagen: "img/pdf-icon.png",
      etiquetas: []
    }));

    // Mezclar backend + localStorage
    coleccion = [...pdfsBackend, ...coleccion];

    guardarColeccion();
    mostrarColeccion(coleccion);

  } catch (error) {
    console.error("❌ Error cargando PDFs del backend:", error);
  }
}



// ======================================================================
//   🚀 Render de tarjetas (PDFs locales + backend)
// ======================================================================
function mostrarColeccion(lista) {
  grid.innerHTML = "";

  lista.forEach((pdf) => {
    console.log("📄 archivoURL:", pdf.archivoURL);

    const card = document.createElement("div");
    card.classList.add("card");

    const portada = pdf.portada || pdf.imagen;

    card.innerHTML = `
        <div class="thumb"
             style="background-image: url('${portada}');
                    background-size: cover;
                    background-position: center;">
        </div>

        <button class="view-pdf-btn">Ver PDF</button>
        <button class="detail-btn">Ver detalles</button>

        <h3>${pdf.titulo}</h3>
        <span class="meta">Agregado: ${pdf.fecha}</span>
    `;

    // --- Botón Ver PDF ---
    card.querySelector(".view-pdf-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      if (pdf.archivoURL) {
        verPdf(pdf.archivoURL, pdf.titulo);
      } else {
        alert("Este PDF no tiene archivo asociado.");
      }
    });

    // --- Botón Ver detalles ---
    card.querySelector(".detail-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      abrirDetalleLibro(pdf);
    });

    // --- Doble click → ver PDF ---
    card.addEventListener("dblclick", () => {
      if (pdf.archivoURL) {
        verPdf(pdf.archivoURL, pdf.titulo);
      }
    });

    grid.appendChild(card);
  });
}



// ======================================================================
//   🚀 Enviar PDF al lector
// ======================================================================
function verPdf(file, title) {
  window.location.href =
    `../lector/lector.html?file=${encodeURIComponent(file)}&title=${encodeURIComponent(title)}`;
}



// ======================================================================
//   Modal Detalle
// ======================================================================
function renderDetallePortada() {
  const placeholder = detalleCoverPreview.querySelector(".cover-placeholder");
  const portada = libroActivo && (libroActivo.portada || libroActivo.imagen);

  if (portada) {
    detalleCoverPreview.style.backgroundImage = `url('${portada}')`;
    if (placeholder) placeholder.style.display = "none";
  } else {
    detalleCoverPreview.style.backgroundImage = "";
    if (placeholder) placeholder.style.display = "inline-flex";
  }
}

function renderDetalleEtiquetas() {
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

  detalleTagsContainer.querySelectorAll(".tag-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      etiquetasDetalle.splice(btn.dataset.index, 1);
      renderDetalleEtiquetas();
    });
  });
}

function abrirDetalleLibro(pdf) {
  libroActivo = pdf;
  etiquetasDetalle = pdf.etiquetas ? [...pdf.etiquetas] : [];

  detalleTitleInput.value = pdf.titulo;
  detalleFechaSpan.textContent = pdf.fecha;
  detalleIdSpan.textContent = pdf.id;

  renderDetallePortada();
  renderDetalleEtiquetas();

  detalleModal.classList.add("is-open");
}

function cerrarDetalleModal() {
  detalleModal.classList.remove("is-open");
  libroActivo = null;
  etiquetasDetalle = [];
}

detalleCloseBtn.addEventListener("click", cerrarDetalleModal);


// ======================================================================
// Guardar cambios desde el modal
// ======================================================================
detalleSaveBtn.addEventListener("click", () => {
  if (!libroActivo) return;

  libroActivo.titulo = detalleTitleInput.value;
  libroActivo.etiquetas = etiquetasDetalle;

  const i = coleccion.findIndex((x) => x.id === libroActivo.id);
  if (i !== -1) coleccion[i] = libroActivo;

  guardarColeccion();
  mostrarColeccion(coleccion);
  cerrarDetalleModal();
});



// ======================================================================
//  Búsqueda
// ======================================================================
inputBusqueda.addEventListener("input", () => {
  const texto = inputBusqueda.value.toLowerCase();
  mostrarColeccion(
    coleccion.filter((pdf) => pdf.titulo.toLowerCase().includes(texto))
  );
});



// ======================================================================
//  🚀 Subir PDF local (blob)
// ======================================================================
const botonAgregar = document.getElementById("agregarPDF");
const inputArchivoReal = document.getElementById("inputArchivoPdfReal");

botonAgregar.addEventListener("click", () => {
  inputArchivoReal.click();
});

inputArchivoReal.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("Solo se permiten archivos PDF.");
    return;
  }

  const blobUrl = URL.createObjectURL(file);

  const nuevo = {
    id: Date.now(),
    titulo: file.name,
    fecha: new Date().toLocaleDateString(),
    imagen: "img/pdf-icon.png",
    archivoURL: blobUrl,
    etiquetas: [],
  };

  coleccion.push(nuevo);
  guardarColeccion();
  mostrarColeccion(coleccion);

  alert("PDF agregado ❤️");
});



// ======================================================================
//  🚀 INICIO DEL PROGRAMA
// ======================================================================
async function iniciar() {
  cargarColeccionLocal();     // PDFs guardados en localStorage
  await cargarDesdeBackend(); // PDFs del backend
  mostrarColeccion(coleccion);
}

iniciar();
