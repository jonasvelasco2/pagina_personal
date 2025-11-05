// ============================================
// MAIN.JS - Funcionalidad general del sitio
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Inicializar localStorage si no existe
    if (!localStorage.getItem('optimizaGameData')) {
        const initialData = {
            player: {
                name: '',
                totalScore: 0,
                totalStars: 0,
                completedLevels: 0
            },
            levels: {},
            achievements: [],
            settings: {
                soundEnabled: true,
                musicEnabled: true
            }
        };
        localStorage.setItem('optimizaGameData', JSON.stringify(initialData));
    }
    
    // Mostrar modal de bienvenida si no hay nombre
    checkPlayerName();
    
    // Animaciones de scroll
    setupScrollAnimations();
    
    // Mobile menu toggle
    setupMobileMenu();
}

function checkPlayerName() {
    const data = JSON.parse(localStorage.getItem('optimizaGameData'));
    
    // Si no hay nombre o está vacío, mostrar modal de bienvenida
    if (!data.player.name || data.player.name === '' || data.player.name === 'Jugador') {
        // Solo mostrar en la página principal
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            showWelcomeModal();
        }
    } else {
        // Actualizar saludo en la página si existe
        updatePlayerGreeting(data.player.name);
    }
}

function showWelcomeModal() {
    // Crear modal si no existe
    if (!document.getElementById('welcomeModal')) {
        const modalHTML = `
            <div id="welcomeModal" class="welcome-modal active">
                <div class="welcome-content">
                    <div class="welcome-icon">👋</div>
                    <h2>¡Bienvenido a OptimizaGame!</h2>
                    <p>Para comenzar, ¿cómo te gustaría que te llamemos?</p>
                    <input type="text" 
                           id="playerNameInput" 
                           class="welcome-input" 
                           placeholder="Tu nombre"
                           maxlength="20"
                           autocomplete="off">
                    <button class="btn btn-primary btn-large" onclick="savePlayerName()">
                        <span>Comenzar a Jugar</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 4L13 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus en el input
        setTimeout(() => {
            document.getElementById('playerNameInput').focus();
        }, 300);
        
        // Enter para enviar
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                savePlayerName();
            }
        });
    }
}

function savePlayerName() {
    const nameInput = document.getElementById('playerNameInput');
    const name = nameInput.value.trim();
    
    if (name === '') {
        nameInput.style.borderColor = '#ef4444';
        nameInput.placeholder = 'Por favor ingresa tu nombre';
        return;
    }
    
    // Guardar nombre
    const data = JSON.parse(localStorage.getItem('optimizaGameData'));
    data.player.name = name;
    localStorage.setItem('optimizaGameData', JSON.stringify(data));
    
    // Cerrar modal con animación
    const modal = document.getElementById('welcomeModal');
    modal.classList.remove('active');
    
    // Actualizar saludo
    updatePlayerGreeting(name);
    
    // Mostrar notificación
    showNotification(`¡Hola ${name}! 🎉 Bienvenido a OptimizaGame`, 'success');
}

function updatePlayerGreeting(name) {
    // Actualizar elementos que muestren el nombre del jugador
    const greetingElements = document.querySelectorAll('.player-greeting');
    greetingElements.forEach(el => {
        el.textContent = `Hola, ${name}`;
    });
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.feature-card, .level-card').forEach(el => {
        observer.observe(el);
    });
}

function setupMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Utilidades para manejar datos del jugador
const PlayerData = {
    get() {
        return JSON.parse(localStorage.getItem('optimizaGameData'));
    },
    
    save(data) {
        localStorage.setItem('optimizaGameData', JSON.stringify(data));
    },
    
    updateLevel(levelId, score, stars, time) {
        const data = this.get();
        
        if (!data.levels[levelId] || score > data.levels[levelId].score) {
            const isNewCompletion = !data.levels[levelId];
            
            data.levels[levelId] = {
                score: score,
                stars: stars,
                time: time,
                completed: true,
                attempts: (data.levels[levelId]?.attempts || 0) + 1,
                bestTime: Math.min(time, data.levels[levelId]?.bestTime || Infinity)
            };
            
            // Actualizar estadísticas globales
            this.recalculateStats(data);
            
            this.save(data);
            
            return {
                isNewRecord: true,
                isNewCompletion: isNewCompletion
            };
        } else {
            // Solo incrementar intentos
            data.levels[levelId].attempts += 1;
            this.save(data);
            return { isNewRecord: false };
        }
    },
    
    recalculateStats(data) {
        let totalScore = 0;
        let totalStars = 0;
        let completedLevels = 0;
        
        Object.values(data.levels).forEach(level => {
            if (level.completed) {
                totalScore += level.score;
                totalStars += level.stars;
                completedLevels++;
            }
        });
        
        data.player.totalScore = totalScore;
        data.player.totalStars = totalStars;
        data.player.completedLevels = completedLevels;
    },
    
    getLevelData(levelId) {
        const data = this.get();
        return data.levels[levelId] || null;
    },
    
    getPlayerStats() {
        const data = this.get();
        return data.player;
    }
};

// Utilidades generales
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function calculateStars(efficiency) {
    if (efficiency >= 95) return 3;
    if (efficiency >= 80) return 2;
    if (efficiency >= 60) return 1;
    return 0;
}

function calculateScore(stars, time, attempts) {
    let baseScore = stars * 300;
    
    // Bonus de tiempo
    if (time < 300) baseScore += 100; // Menos de 5 minutos
    if (time < 180) baseScore += 100; // Menos de 3 minutos
    
    // Bonus de primer intento
    if (attempts === 1 && stars === 3) baseScore += 200;
    
    return baseScore;
}

// Exportar funciones globales
window.PlayerData = PlayerData;
window.showNotification = showNotification;
window.formatTime = formatTime;
window.calculateStars = calculateStars;
window.calculateScore = calculateScore;
window.savePlayerName = savePlayerName;
window.updatePlayerGreeting = updatePlayerGreeting;

