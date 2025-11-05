// ============================================
// LEVELS.JS - Gestión de la página de niveles
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadPlayerStats();
    loadLevelStates();
});

function loadPlayerStats() {
    const stats = PlayerData.getPlayerStats();
    
    document.getElementById('totalStars').textContent = stats.totalStars;
    document.getElementById('totalScore').textContent = stats.totalScore.toLocaleString();
    document.getElementById('completedLevels').textContent = `${stats.completedLevels}/9`;
}

function loadLevelStates() {
    const data = PlayerData.get();
    const levelCards = document.querySelectorAll('.level-card');
    
    levelCards.forEach(card => {
        const levelId = parseInt(card.dataset.level);
        const levelData = data.levels[levelId];
        
        if (levelData && levelData.completed) {
            // Agregar indicador de completado
            const completionBadge = document.createElement('div');
            completionBadge.className = 'completion-badge';
            completionBadge.innerHTML = `
                <div class="level-stars">
                    ${'⭐'.repeat(levelData.stars)}
                </div>
                <div class="level-best-score">
                    Mejor: ${levelData.score} pts
                </div>
            `;
            
            card.querySelector('.level-icon').insertAdjacentElement('afterend', completionBadge);
            card.classList.add('completed');
            
            // Cambiar texto del botón
            const button = card.querySelector('.btn-level');
            button.innerHTML = '🔄 Jugar de Nuevo';
        }
    });
}

function startLevel(levelId) {
    // Guardar el nivel seleccionado en sessionStorage
    sessionStorage.setItem('currentLevel', levelId);
    
    // Redirigir a la página de juego
    window.location.href = 'game.html';
}

// Estilos adicionales para los badges de completado
const style = document.createElement('style');
style.textContent = `
    .completion-badge {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
        text-align: center;
    }
    
    .level-stars {
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
    }
    
    .level-best-score {
        font-size: 0.875rem;
        font-weight: 600;
        color: #6366f1;
    }
    
    .level-card.completed {
        border-left: 4px solid #10b981;
    }
    
    .level-card.completed::before {
        background: linear-gradient(90deg, #10b981, #059669);
    }
`;
document.head.appendChild(style);

// Exportar función para que sea accesible desde HTML
window.startLevel = startLevel;

