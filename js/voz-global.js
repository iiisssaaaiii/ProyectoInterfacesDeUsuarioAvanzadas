// ================================================
//  SISTEMA GLOBAL DE VOZ — COMPLETO Y REPARADO
//  Mi pequeño Sarmiento ❤️
// ================================================

(function () {
    const VoiceRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!VoiceRecognition) {
        console.warn("Reconocimiento de voz no soportado.");
        return;
    }

    let voiceBtn = null;
    let voiceHUD = null;
    let recognition = null;
    let escuchando = false;
    let yaInicializado = false;
    let reiniciando = false; // ⭐ NUEVO FIX

    // =======================================================
    //  HUD FLOTANTE
    // =======================================================
    function asegurarHUD() {
        voiceHUD = document.getElementById("voice-feedback");
        if (!voiceHUD) {
            voiceHUD = document.createElement("div");
            voiceHUD.id = "voice-feedback";
            document.body.appendChild(voiceHUD);
        }
    }

    function mostrarFeedback(texto) {
        if (!voiceHUD) return;
        voiceHUD.textContent = texto;
        voiceHUD.classList.add("show");
        setTimeout(() => voiceHUD.classList.remove("show"), 5000);
    }

    // =======================================================
    //  MENÚ DE COMANDOS
    // =======================================================
    function asegurarMenu() {
        let m = document.getElementById("voice-menu");
        if (!m) {
            m = document.createElement("div");
            m.id = "voice-menu";
            document.body.appendChild(m);
        }
        return m;
    }

    function mostrarMenuComandos() {
        const menu = asegurarMenu();
        const page = document.body.dataset.page;
        let lista = [];

        // ---- COMANDOS GLOBALES ----
        lista.push(
            "Inicio",
            "Biblioteca",
            "Subir / Bajar",
            "Hasta arriba / Hasta abajo",
            "Atrás / Adelante",
            "Desactivar voz"
        );

        // ---- COMANDOS POR PÁGINA ----
        if (page === "Inicio") {
            lista.push(
                "Buscar [texto]",
                "Abrir primer / segundo / tercer documento",
                "Abrir último documento",
                "Seguir leyendo",
                "Bajar recientes",
                "Subir al inicio"
            );
        }

        if (page === "Biblioteca") {
            lista.push(
                "Buscar [texto]",
                "Limpiar búsqueda",
                "Abrir primer / segundo / tercer documento",
                "Abrir documento número [n]",
                "Abrir documento [nombre]",
                "Abrir último documento",
                "Agregar documento",
                "Bajar documentos",
                "Subir documentos",
                "Ir al inicio de la biblioteca",
                "Ir al final de la biblioteca"
            );
        }

        menu.innerHTML = `
            <h3>🎤 Comandos disponibles</h3>
            <ul>${lista.map(cmd => `<li>• ${cmd}</li>`).join("")}</ul>
        `;
        menu.style.display = "block";
    }

    function ocultarMenuComandos() {
        const menu = document.getElementById("voice-menu");
        if (menu) menu.style.display = "none";
    }

    // =======================================================
    //  BOTÓN VISUAL
    // =======================================================
    function setListeningState(isOn) {
        escuchando = isOn;
        if (!voiceBtn) return;
        if (isOn) {
            voiceBtn.classList.add("active", "listening");
            voiceBtn.textContent = "🎙️";
        } else {
            voiceBtn.classList.remove("active", "listening");
            voiceBtn.textContent = "🎤";
        }
    }

    // =======================================================
    //  NAVEGACIÓN GLOBAL
    // =======================================================
    function irASeccion(pageKey) {
        const link = document.querySelector(
            `.top-nav-link[data-page="${pageKey}"]`
        );
        if (link) return link.click();

        switch (pageKey) {
            case "inicio":
                window.location.href = "/pages/home/home.html";
                break;
            case "biblioteca":
                window.location.href = "/pages/biblioteca/biblioteca.html";
                break;
        }
    }

    // =======================================================
    //  COMANDOS GLOBALES
    // =======================================================
    function procesarComandoGlobal(textoCrudo) {
        if (!textoCrudo) return false;
        const texto = textoCrudo.toLowerCase().trim();

        // --- DESACTIVAR VOZ ---
        if (
            texto.includes("desactivar voz") ||
            texto.includes("deja de escuchar") ||
            texto.includes("para de escuchar")
        ) {
            mostrarFeedback("🛑 Voz desactivada");
            escuchando = false;
            recognition.stop();
            setListeningState(false);
            ocultarMenuComandos();
            return true;
        }

        // --- NAVEGACIÓN ---
        if (texto.includes("inicio")) {
            localStorage.setItem("autoVoice", "true");
            irASeccion("inicio");
            return true;
        }

        if (texto.includes("biblioteca")) {
            localStorage.setItem("autoVoice", "true");
            irASeccion("biblioteca");
            return true;
        }

        // --- HISTORIAL ---
        if (texto.includes("atrás") || texto.includes("regresar")) {
            window.history.back();
            return true;
        }

        if (texto.includes("adelante")) {
            window.history.forward();
            return true;
        }

        // --- SCROLL ---
        if (texto.includes("subir") || texto.includes("arriba")) {
            window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
            return true;
        }

        if (texto.includes("bajar") || texto.includes("abajo")) {
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
            return true;
        }

        if (texto.includes("hasta arriba")) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return true;
        }

        if (texto.includes("hasta abajo")) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
            return true;
        }

        return false;
    }

    window.procesarComandoGlobal = procesarComandoGlobal;

    // =======================================================
    //  INICIALIZACIÓN FINAL
    // =======================================================
    function initVoice() {
        if (yaInicializado) return;

        voiceBtn = document.getElementById("btn-voz-global");
        if (!voiceBtn) return;

        yaInicializado = true;
        asegurarHUD();

        recognition = new VoiceRecognition();
        recognition.lang = "es-MX";
        recognition.continuous = true;    // ⭐ MODO CONTINUO FIRE
        recognition.interimResults = false;

        // ------------------- EVENTOS -------------------
        recognition.onstart = () => {
            setListeningState(true);
            mostrarFeedback("🎤 Escuchando…");
            mostrarMenuComandos();
        };

        recognition.onend = () => {
            // ⭐ si venimos de reinicio, no usar reinicio automático
            if (reiniciando) {
                reiniciando = false;
                return;
            }

            // si escucha activa, reiniciar ciclo
            if (escuchando) {
                setTimeout(() => recognition.start(), 200);
            } else {
                setListeningState(false);
            }
        };

        recognition.onerror = (event) => {
            mostrarFeedback(`Error: ${event.error}`);
        };

        // =======================================================
        //  PROCESAMIENTO DE VOZ
        // =======================================================
        recognition.onresult = (event) => {
            const texto = event.results[0][0].transcript?.trim();

            if (texto) mostrarFeedback(`📄 "${texto}"`);
            else mostrarFeedback("No se escuchó nada 😶");

            // --- Comandos globales ---
            if (procesarComandoGlobal(texto)) return;

            // --- Comandos de Inicio ---
            if (
                document.body.dataset.page === "Inicio" &&
                window.procesarComandoHome &&
                window.procesarComandoHome(texto)
            ) return;

            if (document.body.dataset.page === "Inicio" &&
                window.procesarComandoHome &&
                window.procesarComandoHome(texto)
            ) return;

            // --- NO COINCIDIÓ NADA ---
            mostrarFeedback("🤔 No entendí eso");

            // ⭐ FIX REAL: reiniciar el ciclo de reconocimiento
            reiniciando = true;
            recognition.stop(); // obligar a cerrar ciclo
            setTimeout(() => {
                if (escuchando) recognition.start();
            }, 600);
        };

        // ------------------- BOTÓN -------------------
        voiceBtn.addEventListener("click", () => {
            if (!escuchando) {
                escuchando = true;
                reiniciando = false;
                recognition.start();
                mostrarMenuComandos();
            } else {
                escuchando = false;
                recognition.stop();
                ocultarMenuComandos();
            }
        });

        // ======================================================
        // 🔥 PERSISTENCIA ENTRE PÁGINAS
        // ======================================================
        if (localStorage.getItem("autoVoice") === "true") {
            localStorage.removeItem("autoVoice");
            escuchando = true;
            reiniciando = false;
            recognition.start();
            mostrarMenuComandos();
        }
    }

    // iniciar según navbar
    document.addEventListener("navbar:loaded", initVoice);

    if (document.readyState === "interactive" || document.readyState === "complete") {
        setTimeout(initVoice, 0);
    } else {
        document.addEventListener("DOMContentLoaded", initVoice);
    }
})();
