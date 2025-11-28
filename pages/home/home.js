// =======================================================
//   🔥 LOGICA PARA MOSTRAR PDFs DEL BACKEND EN INICIO
// =======================================================

// Contenedor para los documentos recientes
const recentContainer = document.getElementById("recentDocs");

// =========================
//   Cargar PDFs del backend
// =========================
async function cargarPdfsBackend() {
    try {
        const response = await fetch("http://localhost:8080/api/pdfs");
        const data = await response.json();

        console.log("📡 PDFs cargados en Inicio:", data);

        // Convertimos al mismo formato que Biblioteca
        const pdfs = data.map(pdf => ({
            id: pdf.id,
            titulo: pdf.name,
            archivoURL: pdf.url,
            fecha: new Date().toLocaleDateString()
        }));

        renderRecientes(pdfs);

    } catch (error) {
        console.error("❌ Error al cargar PDFs en Inicio:", error);
    }
}

// =========================
//   Renderizar tarjetas
// =========================
function renderRecientes(lista) {
    recentContainer.innerHTML = "";

    if (lista.length === 0) {
        recentContainer.innerHTML = "<p>No hay documentos aún.</p>";
        return;
    }

    lista.forEach(pdf => {
        const card = document.createElement("div");
        card.classList.add("doc-card");

        card.innerHTML = `
            <div class="thumb"></div>
            <p class="doc-title">${pdf.titulo}</p>
            <p class="doc-meta">${pdf.fecha}</p>
        `;

        // Click → abrir PDF en el lector
        card.addEventListener("click", () => {
            verPdf(pdf.archivoURL, pdf.titulo);
        });

        recentContainer.appendChild(card);
    });
}

// =========================
//   Abrir PDF en lector
// =========================
function verPdf(file, title) {
    if (!file) {
        alert("Este PDF no tiene una URL válida.");
        return;
    }

    window.location.href =
        `../lector/lector.html?file=${encodeURIComponent(file)}&title=${encodeURIComponent(title)}`;
}

// =======================================================
//   🎤 COMANDOS DE VOZ ESPECÍFICOS DE LA PÁGINA INICIO
// =======================================================

window.procesarComandoHome = function (texto) {
    if (!texto) return false;
    texto = texto.toLowerCase().trim();

    const buscador = document.getElementById("buscador");
    const recientes = document.querySelectorAll("#recentDocs .doc-card");
    const addBtn = document.querySelector(".add-btn");

    // ===================================================
    // 🔍 COMANDOS DE BÚSQUEDA
    // ===================================================
    if (texto.startsWith("buscar ")) {
        const termino = texto.replace("buscar ", "");
        if (buscador) {
            buscador.value = termino;
            mostrarFeedback?.(`🔎 Buscando: "${termino}"`);
            buscador.dispatchEvent(new Event("input"));
        }
        return true;
    }

    if (texto.includes("limpiar búsqueda") || texto.includes("limpiar busqueda")) {
        if (buscador) buscador.value = "";
        mostrarFeedback?.("❌ Búsqueda limpiada");
        return true;
    }

    // ===================================================
    // 📄 ABRIR DOCUMENTOS
    // ===================================================
    if (texto.includes("abrir primer")) {
        if (recientes[0]) recientes[0].click();
        return true;
    }

    if (texto.includes("abrir segundo")) {
        if (recientes[1]) recientes[1].click();
        return true;
    }

    if (texto.includes("abrir tercero")) {
        if (recientes[2]) recientes[2].click();
        return true;
    }

    if (texto.includes("abrir cuarto")) {
        if (recientes[3]) recientes[3].click();
        return true;
    }

    if (texto.includes("abrir último") || texto.includes("abrir ultimo")) {
        if (recientes.length > 0) recientes[recientes.length - 1].click();
        return true;
    }

    if (
        texto.includes("seguir leyendo") ||
        texto.includes("continuar lectura")
    ) {
        if (recientes[0]) recientes[0].click();
        return true;
    }

    // ===================================================
    // 🧭 NAVEGACIÓN PROPIA DE LA PÁGINA
    // ===================================================
    if (texto.includes("bajar recientes")) {
        const seccion = document.querySelector(".section");
        if (seccion) seccion.scrollIntoView({ behavior: "smooth" });
        return true;
    }

    if (
        texto.includes("bajar agregar") ||
        texto.includes("ir a agregar")
    ) {
        const seccion = document.querySelector(".add-section");
        if (seccion) seccion.scrollIntoView({ behavior: "smooth" });
        return true;
    }

    if (
        texto.includes("subir al inicio") ||
        texto.includes("ir arriba")
    ) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return true;
    }

    // No se manejó nada
    return false;
};

// =======================================================
//   Mantener tu lógica original (micrófono del home)
// =======================================================

const btnMic = document.getElementById("btnMic");
const micStatus = document.getElementById("micStatus");
let micActivo = false;

if (btnMic) {
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
}

// =======================================================
//   Iniciar
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarPdfsBackend();
});
