let pdfDoc = null;
let currentPage = 1;
let scale = 1.5;

// ================================
// OBTENER NOMBRE DEL PDF
// ================================
const params = new URLSearchParams(window.location.search);
const pdfName = params.get("pdf");
const decodedName = pdfName ? decodeURIComponent(pdfName) : null;

// ================================
// BOTONES PRINCIPALES DEL VISOR
// ================================
document.getElementById("btn-back").addEventListener("click", () => {
  window.history.back();
});

document.getElementById("btn-zoom-in").addEventListener("click", () => {
  scale += 0.25;
  renderPage(currentPage);
});

document.getElementById("btn-zoom-out").addEventListener("click", () => {
  if (scale > 0.5) scale -= 0.25;
  renderPage(currentPage);
});

document.getElementById("btn-prev-page").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPage(currentPage);
    updatePageInfo();
  }
});

document.getElementById("btn-next-page").addEventListener("click", () => {
  if (currentPage < pdfDoc.numPages) {
    currentPage++;
    renderPage(currentPage);
    updatePageInfo();
  }
});

// ================================
// CARGAR EL PDF
// ================================
async function initPDF() {
  if (!decodedName) {
    document.getElementById("doc-title").textContent = "PDF no indicado";
    return;
  }

  try {
    const filePath = `./${decodedName}`;
    pdfDoc = await pdfjsLib.getDocument(filePath).promise;
    document.getElementById("doc-title").textContent = decodedName;
    updatePageInfo();
    renderPage(currentPage);
  } catch (err) {
    alert("No se pudo cargar el PDF: " + err.message);
  }
}

async function renderPage(pageNumber) {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(pageNumber);
  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d");

  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;
  updatePageInfo();
}

function updatePageInfo() {
  const info = document.getElementById("pageInfo");
  if (pdfDoc) {
    info.textContent = `Página ${currentPage} / ${pdfDoc.numPages}`;
    document.getElementById("doc-page-current").textContent =
      `Página ${currentPage}`;
  }
}

window.addEventListener("DOMContentLoaded", initPDF);

// ================================
// BOTÓN: LEER DOCUMENTO EN VOZ ALTA
// ================================
document.getElementById("btn-read-pdf").addEventListener("click", async () => {
  if (!pdfDoc) {
    alert("No se ha cargado el documento.");
    return;
  }

  const fullText = await extractPDFText(pdfDoc);
  speak(fullText);
});

document.getElementById("btn-stop-reading").addEventListener("click", () => {
  speechSynthesis.cancel();
});

// Extraer TODO el texto del PDF
async function extractPDFText(pdf) {
  let textContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    const strings = text.items.map(item => item.str).join(" ");
    textContent += strings + "\n\n";
  }

  return textContent;
}

// Leer en voz alta
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Detener micrófono mientras habla
  utterance.onstart = () => {
    try { recognition.stop(); } catch {}
  };

  // Reanudar micrófono
  utterance.onend = () => {
    if (micActivo) {
      try { recognition.start(); } catch {}
    }
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// ============================
// GESTOS CON MEDIAPIPE HANDS
// ============================

// ---- Referencias ----
const cameraToggleBtn = document.getElementById("camera-toggle");
const cameraStatusText = document.getElementById("camera-status-text");
const cameraDot = document.getElementById("camera-dot");

const videoElement = document.getElementById("camera-stream");
const canvasElement = document.getElementById("hand-canvas");
const canvasCtx = canvasElement ? canvasElement.getContext("2d") : null;

const btnNextPage = document.getElementById("btn-next-page");
const btnPrevPage = document.getElementById("btn-prev-page");
const btnZoomIn = document.getElementById("btn-zoom-in");
const btnZoomOut = document.getElementById("btn-zoom-out");

const modalOverlay = document.getElementById("simple-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalClose = document.getElementById("modal-close");

// ---- Estado ----
let mpCamera = null;
let mediaStream = null;
let gesturesEnabled = false;

let lastX = null;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 800;

let readingPaused = false;
let wasHandOpenPrev = false;
let wasFistPrev = false;
let wasPinchPrev = false;
let pinchZoomToggle = true;

function nowMs() { return performance.now(); }

function showSimpleModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalOverlay.style.display = "flex";

  modalClose.onclick = () => {
    modalOverlay.style.display = "none";
  };
}

function goToNextPage() { btnNextPage.click(); }
function goToPrevPage() { btnPrevPage.click(); }
function zoomIn() { btnZoomIn.click(); }
function zoomOut() { btnZoomOut.click(); }

// ----------------------------------
// DETECCIÓN DE GESTOS
// ----------------------------------
function isHandOpen(landmarks) {
  const fingers = [
    { tip: 8, pip: 6 },
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 }
  ];
  let extended = 0;
  fingers.forEach(f => {
    if (landmarks[f.tip].y < landmarks[f.pip].y) extended++;
  });
  return extended >= 3;
}

function isFist(landmarks) {
  const fingers = [
    { tip: 8, pip: 6 },
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 }
  ];
  let folded = 0;
  fingers.forEach(f => {
    if (landmarks[f.tip].y > landmarks[f.pip].y) folded++;
  });
  return folded >= 3;
}

function isPinch(landmarks) {
  const dx = landmarks[4].x - landmarks[8].x;
  const dy = landmarks[4].y - landmarks[8].y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < 0.05;
}

function processGestures(landmarks) {
  const t = nowMs();
  const x = landmarks[0].x;

  // Swipe izquierda / derecha
  if (lastX !== null) {
    const deltaX = x - lastX;
    if (Math.abs(deltaX) > 0.10 && t - lastGestureTime > GESTURE_COOLDOWN) {
      if (deltaX > 0) {
        goToPrevPage();
        showSimpleModal("Página anterior", "Swipe a la derecha");
      } else {
        goToNextPage();
        showSimpleModal("Página siguiente", "Swipe a la izquierda");
      }
      lastGestureTime = t;
    }
  }
  lastX = x;

  const handOpen = isHandOpen(landmarks);
  const handFist = isFist(landmarks);
  const pinch = isPinch(landmarks);

  if (handOpen && !wasHandOpenPrev && t - lastGestureTime > GESTURE_COOLDOWN) {
    readingPaused = true;
    showSimpleModal("Pausa", "Mano abierta detectada");
    lastGestureTime = t;
  }

  if (handFist && !wasFistPrev && t - lastGestureTime > GESTURE_COOLDOWN) {
    readingPaused = false;
    showSimpleModal("Reanudar", "Puño detectado");
    lastGestureTime = t;
  }

  if (pinch && !wasPinchPrev && t - lastGestureTime > GESTURE_COOLDOWN) {
    if (pinchZoomToggle) zoomIn(); else zoomOut();
    pinchZoomToggle = !pinchZoomToggle;
    showSimpleModal("Zoom", "Pinch detectado");
    lastGestureTime = t;
  }

  wasHandOpenPrev = handOpen;
  wasFistPrev = handFist;
  wasPinchPrev = pinch;
}

function onHandsResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const lm of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, lm, HAND_CONNECTIONS);
      drawLandmarks(canvasCtx, lm);
      processGestures(lm);
    }
  }

  canvasCtx.restore();
}

async function startCameraAndHands() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 }
    });

    videoElement.srcObject = mediaStream;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onHandsResults);

    mpCamera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 320,
      height: 240
    });

    mpCamera.start();

    gesturesEnabled = true;
    cameraStatusText.textContent = "Encendida";
    cameraDot.classList.add("on");

  } catch (err) {
    alert("No se pudo acceder a la cámara.");
    console.error(err);
  }
}

function stopCameraAndHands() {
  gesturesEnabled = false;

  if (mpCamera) {
    mpCamera.stop();
    mpCamera = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }

  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  cameraStatusText.textContent = "Apagado";
  cameraDot.classList.remove("on");

  lastX = null;
}

cameraToggleBtn.addEventListener("click", () => {
  if (!gesturesEnabled) startCameraAndHands();
  else stopCameraAndHands();
});

// ==========================================================
// COMANDOS DE VOZ COMPLETOS Y FUNCIONALES
// ==========================================================
function procesarComandoVoz(texto) {
  console.log("Procesando comando:", texto);

  // ---------------- NAVAGACIÓN ----------------
  if (texto.includes("siguiente página") || texto.includes("avanzar")) {
    goToNextPage();
    speak("Página siguiente");
    return;
  }

  if (texto.includes("página anterior") || texto.includes("regresar")) {
    goToPrevPage();
    speak("Página anterior");
    return;
  }

  if (texto.includes("ir a la página")) {
    const num = parseInt(texto.replace(/\D/g, ""));
    if (!isNaN(num) && num >= 1 && num <= pdfDoc.numPages) {
      currentPage = num;
      renderPage(currentPage);
      speak(`Yendo a la página ${num}`);
    } else {
      speak("Esa página no existe");
    }
    return;
  }

  // ---------------- ZOOM ----------------
  if (
    texto.includes("acercar") || 
    texto.includes("zoom más") || 
    texto.includes("aumentar zoom")
  ) {
    zoomIn();
    speak("Acercando");
    return;
  }

  if (
    texto.includes("alejar") || 
    texto.includes("zoom menos") || 
    texto.includes("disminuir zoom")
  ) {
    zoomOut();
    speak("Alejando");
    return;
  }

  // ---------------- LECTURA ----------------
  if (
    (texto.includes("leer") && texto.includes("documento")) ||
    (texto.includes("iniciar") && texto.includes("lectura"))
  ) {
    document.getElementById("btn-read-pdf").click();
    speak("Iniciando lectura del documento");
    return;
  }

  if (
    texto.includes("detener lectura") || 
    texto.includes("parar lectura")
  ) {
    speechSynthesis.cancel();
    speak("Lectura detenida");
    return;
  }

  // ---------------- NO ENTENDIÓ ----------------
  speak("No entendí ese comando");
}

// ==========================================================
// MICROFONO PERMANENTE
// ==========================================================
// ==========================================================
// MICRÓFONO PUSH-TO-TALK (SE CIERRA DESPUÉS DE CADA COMANDO)
// ==========================================================

let recognition;
let micActivo = false;
const voiceBtn = document.getElementById("btn-voice");

if (!("webkitSpeechRecognition" in window)) {
  alert("Tu navegador no soporta reconocimiento de voz.");
} else {

  recognition = new webkitSpeechRecognition();
  recognition.lang = "es-ES";
  recognition.continuous = false;   // ❗ Solo escucha una frase
  recognition.interimResults = false;

  recognition.onstart = () => {
    micActivo = true;
    voiceBtn.textContent = "🎤 Escuchando...";
    voiceBtn.style.background = "#ff7675";
  };

  recognition.onend = () => {
    micActivo = false;
    voiceBtn.textContent = "🎤 Hablar";
    voiceBtn.style.background = "";
  };

  recognition.onerror = () => {
    micActivo = false;
    voiceBtn.textContent = "🎤 Hablar";
    voiceBtn.style.background = "";
  };

  recognition.onresult = (event) => {
    const texto = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
    console.log("Detectado:", texto);

    // Procesar el comando
    procesarComandoVoz(texto);

    // 🔥 Cerrar micrófono después del comando
    recognition.stop();
  };
}

// Activar el micrófono SOLO cuando se toque el botón
voiceBtn.addEventListener("click", () => {
  if (!micActivo) {
    recognition.start();
  }
});
