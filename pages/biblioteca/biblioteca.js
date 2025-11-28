// =======================================================
//   🎤 COMANDOS DE VOZ ESPECÍFICOS — BIBLIOTECA
// =======================================================

window.procesarComandoBiblioteca = function (texto) {
    if (!texto) return false;
    texto = texto.toLowerCase().trim();

    const buscador = document.getElementById("buscadorBiblioteca");
    const tarjetas = document.querySelectorAll(".pdf-card, .doc-card, .book-card, .item");
    // Ajustar según tu HTML real: doc-card o lo que uses.

    const addBtn = document.querySelector(".add-btn");

    // =======================================================
    // 🔍 BUSQUEDA
    // =======================================================
    if (texto.startsWith("buscar ")) {
        const termino = texto.replace("buscar ", "").trim();

        if (buscador) {
            buscador.value = termino;
            buscador.dispatchEvent(new Event("input"));
            mostrarFeedback?.(`🔎 Buscando: "${termino}"`);
        }
        return true;
    }

    if (texto.includes("limpiar búsqueda") || texto.includes("quitar búsqueda")) {
        if (buscador) buscador.value = "";
        buscador.dispatchEvent(new Event("input"));
        mostrarFeedback?.("❌ Búsqueda limpiada");
        return true;
    }

    // =======================================================
    // 📄 ABRIR DOCUMENTOS POR POSICIÓN
    // =======================================================
    if (texto.includes("primer documento")) {
        if (tarjetas[0]) tarjetas[0].click();
        return true;
    }

    if (texto.includes("segundo documento")) {
        if (tarjetas[1]) tarjetas[1].click();
        return true;
    }

    if (texto.includes("tercer documento")) {
        if (tarjetas[2]) tarjetas[2].click();
        return true;
    }

    if (texto.includes("cuarto documento")) {
        if (tarjetas[3]) tarjetas[3].click();
        return true;
    }

    if (texto.includes("último documento") || texto.includes("ultimo documento")) {
        if (tarjetas.length > 0) tarjetas[tarjetas.length - 1].click();
        return true;
    }

    // =======================================================
    // 📄 ABRIR DOCUMENTO POR NÚMERO
    // "Abrir documento número 7"
    // =======================================================
    const numeroMatch = texto.match(/documento número (\d+)/);
    if (numeroMatch) {
        const index = parseInt(numeroMatch[1], 10) - 1;
        if (tarjetas[index]) tarjetas[index].click();
        return true;
    }

    // =======================================================
    // 🧠 ABRIR DOCUMENTO POR NOMBRE (muy PRO)
    // =======================================================
    if (texto.startsWith("abrir documento ")) {
        const nombre = texto.replace("abrir documento ", "").trim();

        for (let card of tarjetas) {
            const titulo = card.textContent.toLowerCase();
            if (titulo.includes(nombre)) {
                card.click();
                return true;
            }
        }

        mostrarFeedback?.("❌ No encontré un documento con ese nombre");
        return true;
    }

    // =======================================================
    // ➕ AGREGAR DOCUMENTO
    // =======================================================
    if (texto.includes("agregar documento")) {
        if (addBtn) addBtn.click();
        return true;
    }

    // =======================================================
    // 🧭 SCROLL INTERNO
    // =======================================================
    if (texto.includes("bajar documentos")) {
        window.scrollBy({ top: 500, behavior: "smooth" });
        return true;
    }

    if (texto.includes("subir documentos")) {
        window.scrollBy({ top: -500, behavior: "smooth" });
        return true;
    }

    if (texto.includes("inicio de la biblioteca")) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return true;
    }

    if (texto.includes("final de la biblioteca")) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        return true;
    }

    // No coincidió ningún comando propio
    return false;
};

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
