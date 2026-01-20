// Entropía Cruzada - Visualización interactiva
// Función de pérdida para clasificación binaria

// Colores
const COLORS = {
    ce: '#0073bb',       // Entropía cruzada
    mse: '#7b68ee',      // MSE
    grid: '#e8e8e8',
    axis: '#999',
    marker: '#ff9900',
    markerLine: 'rgba(255, 153, 0, 0.5)'
};

// Estado global
let yhat = 0.5;
let isAnimating = false;
let animationId = null;

// Elementos del DOM
const canvasY1 = document.getElementById('canvasY1');
const canvasY0 = document.getElementById('canvasY0');
const ctxY1 = canvasY1.getContext('2d');
const ctxY0 = canvasY0.getContext('2d');

const yhatSlider = document.getElementById('yhatSlider');
const yhatValue = document.getElementById('yhatValue');

const ceLossY1 = document.getElementById('ceLossY1');
const mseLossY1 = document.getElementById('mseLossY1');
const ceLossY0 = document.getElementById('ceLossY0');
const mseLossY0 = document.getElementById('mseLossY0');

const animateBtn = document.getElementById('animateBtn');
const animStatus = document.getElementById('animStatus');

// Funciones de pérdida
function crossEntropy(y, yhat) {
    // Evitar log(0)
    const eps = 1e-15;
    const yhatClipped = Math.max(eps, Math.min(1 - eps, yhat));
    
    if (y === 1) {
        return -Math.log(yhatClipped);
    } else {
        return -Math.log(1 - yhatClipped);
    }
}

function mse(y, yhat) {
    return Math.pow(y - yhat, 2);
}

// Renderizar gráfico para y=1
function renderY1() {
    const width = canvasY1.width;
    const height = canvasY1.height;
    const padding = 50;
    
    ctxY1.clearRect(0, 0, width, height);
    
    // Rangos
    const xMin = 0;
    const xMax = 1;
    const yMin = 0;
    const yMax = 5;  // Limitar visualización de pérdida
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    
    // Grid
    ctxY1.strokeStyle = COLORS.grid;
    ctxY1.lineWidth = 1;
    
    for (let x = 0; x <= 1; x += 0.2) {
        const px = padding + x * scaleX;
        ctxY1.beginPath();
        ctxY1.moveTo(px, padding);
        ctxY1.lineTo(px, height - padding);
        ctxY1.stroke();
    }
    
    for (let y = 0; y <= yMax; y += 1) {
        const py = height - padding - y * scaleY;
        ctxY1.beginPath();
        ctxY1.moveTo(padding, py);
        ctxY1.lineTo(width - padding, py);
        ctxY1.stroke();
    }
    
    // Ejes
    ctxY1.strokeStyle = COLORS.axis;
    ctxY1.lineWidth = 2;
    
    ctxY1.beginPath();
    ctxY1.moveTo(padding, height - padding);
    ctxY1.lineTo(width - padding, height - padding);
    ctxY1.stroke();
    
    ctxY1.beginPath();
    ctxY1.moveTo(padding, height - padding);
    ctxY1.lineTo(padding, padding);
    ctxY1.stroke();
    
    // Curva de Entropía Cruzada: -log(ŷ)
    ctxY1.strokeStyle = COLORS.ce;
    ctxY1.lineWidth = 3;
    ctxY1.beginPath();
    
    for (let px = padding; px <= width - padding; px++) {
        const x = xMin + (px - padding) / scaleX;
        if (x <= 0.001) continue;  // Evitar log(0)
        
        const loss = -Math.log(x);
        const clampedLoss = Math.min(loss, yMax);
        const py = height - padding - clampedLoss * scaleY;
        
        if (px === padding + 1) {
            ctxY1.moveTo(px, py);
        } else {
            ctxY1.lineTo(px, py);
        }
    }
    ctxY1.stroke();
    
    // Curva de MSE: (1 - ŷ)²
    ctxY1.strokeStyle = COLORS.mse;
    ctxY1.lineWidth = 3;
    ctxY1.beginPath();
    
    for (let px = padding; px <= width - padding; px++) {
        const x = xMin + (px - padding) / scaleX;
        const loss = Math.pow(1 - x, 2);
        const py = height - padding - loss * scaleY;
        
        if (px === padding) {
            ctxY1.moveTo(px, py);
        } else {
            ctxY1.lineTo(px, py);
        }
    }
    ctxY1.stroke();
    
    // Marcador vertical en ŷ actual
    const markerX = padding + yhat * scaleX;
    
    ctxY1.strokeStyle = COLORS.markerLine;
    ctxY1.lineWidth = 2;
    ctxY1.setLineDash([5, 5]);
    ctxY1.beginPath();
    ctxY1.moveTo(markerX, padding);
    ctxY1.lineTo(markerX, height - padding);
    ctxY1.stroke();
    ctxY1.setLineDash([]);
    
    // Puntos en las curvas
    const ceLoss = crossEntropy(1, yhat);
    const mseLoss = mse(1, yhat);
    
    // Punto CE
    const ceLossY = Math.min(ceLoss, yMax);
    const ceY = height - padding - ceLossY * scaleY;
    
    ctxY1.fillStyle = COLORS.ce;
    ctxY1.beginPath();
    ctxY1.arc(markerX, ceY, 8, 0, 2 * Math.PI);
    ctxY1.fill();
    
    ctxY1.fillStyle = 'white';
    ctxY1.beginPath();
    ctxY1.arc(markerX, ceY, 4, 0, 2 * Math.PI);
    ctxY1.fill();
    
    // Punto MSE
    const mseY = height - padding - mseLoss * scaleY;
    
    ctxY1.fillStyle = COLORS.mse;
    ctxY1.beginPath();
    ctxY1.arc(markerX, mseY, 8, 0, 2 * Math.PI);
    ctxY1.fill();
    
    ctxY1.fillStyle = 'white';
    ctxY1.beginPath();
    ctxY1.arc(markerX, mseY, 4, 0, 2 * Math.PI);
    ctxY1.fill();
    
    // Etiquetas
    ctxY1.fillStyle = '#666';
    ctxY1.font = 'bold 12px Source Sans Pro';
    ctxY1.textAlign = 'center';
    
    // Eje X
    for (let x = 0; x <= 1; x += 0.2) {
        const px = padding + x * scaleX;
        ctxY1.fillText(x.toFixed(1), px, height - padding + 18);
    }
    ctxY1.fillText('ŷ (predicción)', width / 2, height - 10);
    
    // Eje Y
    ctxY1.textAlign = 'right';
    for (let y = 0; y <= yMax; y += 1) {
        const py = height - padding - y * scaleY;
        ctxY1.fillText(y.toString(), padding - 8, py + 4);
    }
    
    ctxY1.save();
    ctxY1.translate(15, height / 2);
    ctxY1.rotate(-Math.PI / 2);
    ctxY1.textAlign = 'center';
    ctxY1.fillText('Pérdida L', 0, 0);
    ctxY1.restore();
    
    // Indicador de "óptimo" en ŷ=1
    ctxY1.fillStyle = '#1d8102';
    ctxY1.font = '11px Source Sans Pro';
    ctxY1.textAlign = 'center';
    ctxY1.fillText('Óptimo', width - padding, height - padding + 25);
    ctxY1.fillText('(ŷ→1)', width - padding, height - padding + 38);
}

// Renderizar gráfico para y=0
function renderY0() {
    const width = canvasY0.width;
    const height = canvasY0.height;
    const padding = 50;
    
    ctxY0.clearRect(0, 0, width, height);
    
    // Rangos
    const xMin = 0;
    const xMax = 1;
    const yMin = 0;
    const yMax = 5;
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    
    // Grid
    ctxY0.strokeStyle = COLORS.grid;
    ctxY0.lineWidth = 1;
    
    for (let x = 0; x <= 1; x += 0.2) {
        const px = padding + x * scaleX;
        ctxY0.beginPath();
        ctxY0.moveTo(px, padding);
        ctxY0.lineTo(px, height - padding);
        ctxY0.stroke();
    }
    
    for (let y = 0; y <= yMax; y += 1) {
        const py = height - padding - y * scaleY;
        ctxY0.beginPath();
        ctxY0.moveTo(padding, py);
        ctxY0.lineTo(width - padding, py);
        ctxY0.stroke();
    }
    
    // Ejes
    ctxY0.strokeStyle = COLORS.axis;
    ctxY0.lineWidth = 2;
    
    ctxY0.beginPath();
    ctxY0.moveTo(padding, height - padding);
    ctxY0.lineTo(width - padding, height - padding);
    ctxY0.stroke();
    
    ctxY0.beginPath();
    ctxY0.moveTo(padding, height - padding);
    ctxY0.lineTo(padding, padding);
    ctxY0.stroke();
    
    // Curva de Entropía Cruzada: -log(1 - ŷ)
    ctxY0.strokeStyle = COLORS.ce;
    ctxY0.lineWidth = 3;
    ctxY0.beginPath();
    
    for (let px = padding; px <= width - padding; px++) {
        const x = xMin + (px - padding) / scaleX;
        if (x >= 0.999) continue;  // Evitar log(0)
        
        const loss = -Math.log(1 - x);
        const clampedLoss = Math.min(loss, yMax);
        const py = height - padding - clampedLoss * scaleY;
        
        if (px === padding) {
            ctxY0.moveTo(px, py);
        } else {
            ctxY0.lineTo(px, py);
        }
    }
    ctxY0.stroke();
    
    // Curva de MSE: ŷ²
    ctxY0.strokeStyle = COLORS.mse;
    ctxY0.lineWidth = 3;
    ctxY0.beginPath();
    
    for (let px = padding; px <= width - padding; px++) {
        const x = xMin + (px - padding) / scaleX;
        const loss = Math.pow(x, 2);
        const py = height - padding - loss * scaleY;
        
        if (px === padding) {
            ctxY0.moveTo(px, py);
        } else {
            ctxY0.lineTo(px, py);
        }
    }
    ctxY0.stroke();
    
    // Marcador vertical en ŷ actual
    const markerX = padding + yhat * scaleX;
    
    ctxY0.strokeStyle = COLORS.markerLine;
    ctxY0.lineWidth = 2;
    ctxY0.setLineDash([5, 5]);
    ctxY0.beginPath();
    ctxY0.moveTo(markerX, padding);
    ctxY0.lineTo(markerX, height - padding);
    ctxY0.stroke();
    ctxY0.setLineDash([]);
    
    // Puntos en las curvas
    const ceLoss = crossEntropy(0, yhat);
    const mseLoss = mse(0, yhat);
    
    // Punto CE
    const ceLossY = Math.min(ceLoss, yMax);
    const ceY = height - padding - ceLossY * scaleY;
    
    ctxY0.fillStyle = COLORS.ce;
    ctxY0.beginPath();
    ctxY0.arc(markerX, ceY, 8, 0, 2 * Math.PI);
    ctxY0.fill();
    
    ctxY0.fillStyle = 'white';
    ctxY0.beginPath();
    ctxY0.arc(markerX, ceY, 4, 0, 2 * Math.PI);
    ctxY0.fill();
    
    // Punto MSE
    const mseY = height - padding - mseLoss * scaleY;
    
    ctxY0.fillStyle = COLORS.mse;
    ctxY0.beginPath();
    ctxY0.arc(markerX, mseY, 8, 0, 2 * Math.PI);
    ctxY0.fill();
    
    ctxY0.fillStyle = 'white';
    ctxY0.beginPath();
    ctxY0.arc(markerX, mseY, 4, 0, 2 * Math.PI);
    ctxY0.fill();
    
    // Etiquetas
    ctxY0.fillStyle = '#666';
    ctxY0.font = 'bold 12px Source Sans Pro';
    ctxY0.textAlign = 'center';
    
    // Eje X
    for (let x = 0; x <= 1; x += 0.2) {
        const px = padding + x * scaleX;
        ctxY0.fillText(x.toFixed(1), px, height - padding + 18);
    }
    ctxY0.fillText('ŷ (predicción)', width / 2, height - 10);
    
    // Eje Y
    ctxY0.textAlign = 'right';
    for (let y = 0; y <= yMax; y += 1) {
        const py = height - padding - y * scaleY;
        ctxY0.fillText(y.toString(), padding - 8, py + 4);
    }
    
    ctxY0.save();
    ctxY0.translate(15, height / 2);
    ctxY0.rotate(-Math.PI / 2);
    ctxY0.textAlign = 'center';
    ctxY0.fillText('Pérdida L', 0, 0);
    ctxY0.restore();
    
    // Indicador de "óptimo" en ŷ=0
    ctxY0.fillStyle = '#1d8102';
    ctxY0.font = '11px Source Sans Pro';
    ctxY0.textAlign = 'center';
    ctxY0.fillText('Óptimo', padding, height - padding + 25);
    ctxY0.fillText('(ŷ→0)', padding, height - padding + 38);
}

// Actualizar valores de pérdida
function updateLossValues() {
    const ceY1 = crossEntropy(1, yhat);
    const mseY1 = mse(1, yhat);
    const ceY0 = crossEntropy(0, yhat);
    const mseY0 = mse(0, yhat);
    
    ceLossY1.textContent = ceY1 > 10 ? ceY1.toFixed(1) : ceY1.toFixed(3);
    mseLossY1.textContent = mseY1.toFixed(3);
    ceLossY0.textContent = ceY0 > 10 ? ceY0.toFixed(1) : ceY0.toFixed(3);
    mseLossY0.textContent = mseY0.toFixed(3);
}

// Renderizar todo
function render() {
    renderY1();
    renderY0();
    updateLossValues();
}

// Animación de convergencia
function startAnimation() {
    if (isAnimating) {
        stopAnimation();
        return;
    }
    
    isAnimating = true;
    animateBtn.textContent = '⏸ Pausar';
    animStatus.textContent = 'Animando...';
    animStatus.className = 'animation-status running';
    
    // Alternar entre casos y=1 y y=0
    let targetY = 1;  // Empezar buscando óptimo para y=1
    let phase = 0;    // 0: hacia y=1, 1: hacia y=0
    
    function animate() {
        if (!isAnimating) return;
        
        if (phase === 0) {
            // Convergencia hacia ŷ=1 (para y=1)
            yhat += (0.99 - yhat) * 0.03;
            if (yhat > 0.98) {
                phase = 1;
                setTimeout(() => {
                    if (isAnimating) animationId = requestAnimationFrame(animate);
                }, 1000);
                return;
            }
        } else {
            // Convergencia hacia ŷ=0 (para y=0)
            yhat -= yhat * 0.03;
            if (yhat < 0.02) {
                phase = 0;
                setTimeout(() => {
                    if (isAnimating) animationId = requestAnimationFrame(animate);
                }, 1000);
                return;
            }
        }
        
        yhatSlider.value = yhat;
        yhatValue.textContent = yhat.toFixed(2);
        render();
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Empezar desde el medio
    yhat = 0.5;
    yhatSlider.value = yhat;
    yhatValue.textContent = yhat.toFixed(2);
    
    animate();
}

function stopAnimation() {
    isAnimating = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animateBtn.textContent = '▶ Animar convergencia';
    animStatus.textContent = '';
    animStatus.className = 'animation-status';
}

// Event Listeners
yhatSlider.addEventListener('input', () => {
    if (isAnimating) stopAnimation();
    yhat = parseFloat(yhatSlider.value);
    yhatValue.textContent = yhat.toFixed(2);
    render();
});

animateBtn.addEventListener('click', startAnimation);

// Hover en los canvas para actualizar ŷ
canvasY1.addEventListener('mousemove', (e) => {
    if (isAnimating) return;
    
    const rect = canvasY1.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const padding = 50;
    const width = canvasY1.width;
    
    if (px >= padding && px <= width - padding) {
        yhat = (px - padding) / (width - 2 * padding);
        yhat = Math.max(0.01, Math.min(0.99, yhat));
        yhatSlider.value = yhat;
        yhatValue.textContent = yhat.toFixed(2);
        render();
    }
});

canvasY0.addEventListener('mousemove', (e) => {
    if (isAnimating) return;
    
    const rect = canvasY0.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const padding = 50;
    const width = canvasY0.width;
    
    if (px >= padding && px <= width - padding) {
        yhat = (px - padding) / (width - 2 * padding);
        yhat = Math.max(0.01, Math.min(0.99, yhat));
        yhatSlider.value = yhat;
        yhatValue.textContent = yhat.toFixed(2);
        render();
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    render();
});
