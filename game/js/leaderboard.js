// ============================================
// LEADERBOARD.JS - Sistema de ranking
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    loadPlayerPosition();
    setupFilters();
});

// Datos de ejemplo del leaderboard (en producción vendría de un servidor)
const MOCK_LEADERBOARD_DATA = [
    { rank: 1, name: 'Juan Pérez', initial: 'J', score: 9280, levels: 9, stars: 27, avgTime: 420, color: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
    { rank: 2, name: 'María García', initial: 'M', score: 8450, levels: 9, stars: 26, avgTime: 485, color: 'linear-gradient(135deg, #a78bfa, #c084fc)' },
    { rank: 3, name: 'Carlos López', initial: 'C', score: 7920, levels: 9, stars: 24, avgTime: 520, color: 'linear-gradient(135deg, #fb923c, #f97316)' },
    { rank: 4, name: 'Ana Martínez', initial: 'A', score: 7650, levels: 8, stars: 24, avgTime: 540, color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { rank: 5, name: 'Luis Rodríguez', initial: 'L', score: 7320, levels: 8, stars: 23, avgTime: 600, color: 'linear-gradient(135deg, #14b8a6, #06b6d4)' },
    { rank: 6, name: 'Elena Fernández', initial: 'E', score: 6890, levels: 8, stars: 22, avgTime: 615, color: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { rank: 7, name: 'Diego Torres', initial: 'D', score: 6540, levels: 7, stars: 21, avgTime: 660, color: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
    { rank: 8, name: 'Sofia Ramírez', initial: 'S', score: 6120, levels: 7, stars: 20, avgTime: 720, color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { rank: 9, name: 'Miguel Sánchez', initial: 'M', score: 5870, levels: 7, stars: 19, avgTime: 750, color: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { rank: 10, name: 'Laura Jiménez', initial: 'L', score: 5650, levels: 6, stars: 18, avgTime: 780, color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { rank: 11, name: 'Pedro Morales', initial: 'P', score: 5430, levels: 6, stars: 18, avgTime: 810, color: 'linear-gradient(135deg, #ef4444, #f87171)' },
    { rank: 12, name: 'Carmen Ruiz', initial: 'C', score: 5210, levels: 6, stars: 17, avgTime: 840, color: 'linear-gradient(135deg, #84cc16, #a3e635)' },
    { rank: 13, name: 'Javier Díaz', initial: 'J', score: 4990, levels: 6, stars: 17, avgTime: 870, color: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { rank: 14, name: 'Isabel Castro', initial: 'I', score: 4780, levels: 5, stars: 16, avgTime: 900, color: 'linear-gradient(135deg, #a855f7, #c026d3)' },
    { rank: 15, name: 'Roberto Vargas', initial: 'R', score: 4560, levels: 5, stars: 15, avgTime: 930, color: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { rank: 16, name: 'Patricia Herrera', initial: 'P', score: 4340, levels: 5, stars: 15, avgTime: 960, color: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { rank: 17, name: 'Francisco Ortiz', initial: 'F', score: 4120, levels: 5, stars: 14, avgTime: 990, color: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' },
    { rank: 18, name: 'Lucía Ramos', initial: 'L', score: 3900, levels: 4, stars: 13, avgTime: 1020, color: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { rank: 19, name: 'Antonio Flores', initial: 'A', score: 3680, levels: 4, stars: 12, avgTime: 1050, color: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
    { rank: 20, name: 'Rosa Mendoza', initial: 'R', score: 3460, levels: 4, stars: 12, avgTime: 1080, color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }
];

function loadLeaderboard() {
    const tableBody = document.getElementById('leaderboardTable');
    const stats = PlayerData.getPlayerStats();
    
    // Calcular tiempo promedio del jugador
    const data = PlayerData.get();
    let totalTime = 0;
    let completedCount = 0;
    Object.values(data.levels).forEach(level => {
        if (level.completed && level.time) {
            totalTime += level.time;
            completedCount++;
        }
    });
    const avgTime = completedCount > 0 ? Math.round(totalTime / completedCount) : 0;
    
    // Crear entrada del jugador
    const playerEntry = {
        rank: 0, // Se calculará
        name: stats.name || 'Tú',
        initial: (stats.name || 'T')[0].toUpperCase(),
        score: stats.totalScore,
        levels: stats.completedLevels,
        stars: stats.totalStars,
        avgTime: avgTime,
        color: 'linear-gradient(135deg, #1a759f, #52b69a)',
        isCurrentPlayer: true
    };
    
    // Combinar datos mock con el jugador real
    let allPlayers = [...MOCK_LEADERBOARD_DATA];
    
    // Encontrar posición del jugador
    let insertIndex = allPlayers.findIndex(p => p.score < stats.totalScore);
    if (insertIndex === -1) insertIndex = allPlayers.length;
    
    // Insertar jugador en su posición correcta
    allPlayers.splice(insertIndex, 0, playerEntry);
    
    // Recalcular rankings
    allPlayers = allPlayers.map((player, index) => ({
        ...player,
        rank: index + 1
    }));
    
    // Mostrar del puesto 4 en adelante (los 3 primeros están en el podio)
    const rowsToDisplay = allPlayers.slice(3, 20);
    
    tableBody.innerHTML = rowsToDisplay.map(player => `
        <div class="table-row ${player.isCurrentPlayer ? 'current-player-row' : ''}">
            <div class="col-rank">
                <span class="rank-number">${player.rank}</span>
            </div>
            <div class="col-player">
                <div class="player-info">
                    <div class="avatar" style="background: ${player.color}; width: 40px; height: 40px;">
                        ${player.initial}
                    </div>
                    <span class="player-name">${player.name}${player.isCurrentPlayer ? ' (Tú)' : ''}</span>
                </div>
            </div>
            <div class="col-levels">${player.levels}/9</div>
            <div class="col-score">${player.score.toLocaleString()}</div>
            <div class="col-time">${formatTime(player.avgTime || 0)}</div>
            <div class="col-stars row-stars">${'⭐'.repeat(Math.min(3, Math.ceil(player.stars / 3)))}</div>
        </div>
    `).join('');
}

function loadPlayerPosition() {
    const stats = PlayerData.getPlayerStats();
    const data = PlayerData.get();
    
    // Calcular tiempo promedio
    let totalTime = 0;
    let completedCount = 0;
    Object.values(data.levels).forEach(level => {
        if (level.completed && level.time) {
            totalTime += level.time;
            completedCount++;
        }
    });
    const avgTime = completedCount > 0 ? Math.round(totalTime / completedCount) : 0;
    
    // Actualizar estadísticas del jugador
    document.getElementById('userTotalScore').textContent = stats.totalScore.toLocaleString();
    document.getElementById('userCompletedLevels').textContent = `${stats.completedLevels}/9`;
    document.getElementById('userTotalStars').textContent = stats.totalStars;
    document.getElementById('userAvgTime').textContent = avgTime > 0 ? formatTime(avgTime) : '--:--';
    
    // Calcular posición real basada en la puntuación
    let rank = MOCK_LEADERBOARD_DATA.filter(p => p.score > stats.totalScore).length + 1;
    
    document.getElementById('userRank').textContent = rank;
    
    // Actualizar podio si el jugador está en top 3
    updatePodiumIfNeeded(rank, stats);
    
    // Guardar tiempo promedio para el leaderboard
    stats.avgTime = avgTime;
}

function updatePodiumIfNeeded(rank, stats) {
    if (rank <= 3) {
        // Si el jugador está en top 3, mostrar en el podio
        const podiumPositions = ['second', 'first', 'third'];
        const podiumIndex = rank === 1 ? 1 : rank === 2 ? 0 : 2;
        
        const podiumPlace = document.querySelector(`.podium-place.${podiumPositions[podiumIndex]}`);
        if (podiumPlace) {
            const nameElement = podiumPlace.querySelector('.podium-name');
            const scoreElement = podiumPlace.querySelector('.podium-score');
            const avatarElement = podiumPlace.querySelector('.avatar');
            
            if (nameElement) nameElement.textContent = `${stats.name || 'Tú'} (Tú)`;
            if (scoreElement) scoreElement.textContent = `${stats.totalScore.toLocaleString()} pts`;
            if (avatarElement) {
                avatarElement.textContent = (stats.name || 'T')[0].toUpperCase();
                avatarElement.style.background = 'linear-gradient(135deg, #1a759f, #52b69a)';
            }
        }
    }
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            btn.classList.add('active');
            
            // Aquí se podría filtrar los datos según el filtro seleccionado
            const filter = btn.dataset.filter;
            console.log('Filtro seleccionado:', filter);
            
            // En producción, aquí se cargarían los datos filtrados desde el servidor
            showNotification(`Mostrando ranking: ${filter}`, 'info');
        });
    });
}

// Agregar estilos para las notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
        max-width: 300px;
    }
    
    .notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .notification-info {
        border-left: 4px solid #3b82f6;
    }
    
    .notification-success {
        border-left: 4px solid #10b981;
    }
    
    .notification-warning {
        border-left: 4px solid #f59e0b;
    }
    
    .notification-danger {
        border-left: 4px solid #ef4444;
    }
`;
document.head.appendChild(notificationStyles);

