// --- LÓGICA DE PROTECCIÓN ---

// 1. Deshabilitar el clic derecho en toda la página
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// 2. Bloquear atajos de teclado comunes
document.addEventListener('keydown', function(e) {
    // Bloquear F12 para dificultar el acceso a las herramientas de desarrollador
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
    }

    // Bloquear combinaciones con la tecla Ctrl
    if (e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (['c', 'x', 'u', 's', 'p'].includes(key)) {
            e.preventDefault();
        }
    }
});
