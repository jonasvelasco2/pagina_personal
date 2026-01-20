// Regresión Lineal Simple Interactiva
// Visualización del método de mínimos cuadrados

// Colores
const COLORS = {
    dataPoint: '#0073bb',
    regressionLine: '#ff9900',
    optimalLine: '#1d8102',
    residualLine: '#d13212',
    grid: '#e8e8e8',
    axis: '#999'
};

// Estado global
let points = [];
let beta0 = 0;
let beta1 = 1;
let isAutoMode = false;
let isAnimating = false;
let animationId = null;

// Rango de datos
const DATA_RANGE = {
    x: { min: 0, max: 10 },
    y: { min: -5, max: 10 }
};

const PADDING = 60;

// Elementos del DOM
const canvas = document.getElementById('regressionCanvas');
const ctx = canvas.getContext('2d');

const beta0Slider = document.getElementById('beta0Slider');
const beta1Slider = document.getElementById('beta1Slider');
const beta0Value = document.getElementById('beta0Value');
const beta1Value = document.getElementById('beta1Value');

const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');

const metricRSS = document.getElementById('metricRSS');
const metricR2 = document.getElementById('metricR2');
const eqBeta0 = document.getElementById('eqBeta0');
const eqBeta1 = document.getElementById('eqBeta1');
const pointCount = document.getElementById('pointCount');
const optimalLegend = document.getElementById('optimalLegend');
const tipText = document.getElementById('tipText');

const animateBtn = document.getElementById('animateBtn');
const clearBtn = document.getElementById('clearBtn');

// Convertir coordenadas de datos a canvas
function dataToCanvas(x, y) {
    const scaleX = (canvas.width - 2 * PADDING) / (DATA_RANGE.x.max - DATA_RANGE.x.min);
    const scaleY = (canvas.height - 2 * PADDING) / (DATA_RANGE.y.max - DATA_RANGE.y.min);
    
    return {
        cx: PADDING + (x - DATA_RANGE.x.min) * scaleX,
        cy: canvas.height - PADDING - (y - DATA_RANGE.y.min) * scaleY
    };
}

// Convertir coordenadas de canvas a datos
function canvasToData(cx, cy) {
    const scaleX = (canvas.width - 2 * PADDING) / (DATA_RANGE.x.max - DATA_RANGE.x.min);
    const scaleY = (canvas.height - 2 * PADDING) / (DATA_RANGE.y.max - DATA_RANGE.y.min);
    
    return {
        x: DATA_RANGE.x.min + (cx - PADDING) / scaleX,
        y: DATA_RANGE.y.min + (canvas.height - PADDING - cy) / scaleY
    };
}

// Calcular regresión por mínimos cuadrados
function calculateOLS() {
    if (points.length < 2) {
        return { b0: 0, b1: 1 };
    }
    
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const numerator = sumXY - n * meanX * meanY;
    const denominator = sumX2 - n * meanX * meanX;
    
    if (Math.abs(denominator) < 0.0001) {
        return { b0: meanY, b1: 0 };
    }
    
    const b1 = numerator / denominator;
    const b0 = meanY - b1 * meanX;
    
    return { b0, b1 };
}

// Calcular RSS
function calculateRSS(b0, b1) {
    let rss = 0;
    for (const p of points) {
        const yHat = b0 + b1 * p.x;
        const residual = p.y - yHat;
        rss += residual * residual;
    }
    return rss;
}

// Calcular R²
function calculateR2(b0, b1) {
    if (points.length < 2) return null;
    
    const n = points.length;
    let sumY = 0;
    for (const p of points) {
        sumY += p.y;
    }
    const meanY = sumY / n;
    
    let ssTot = 0;
    let ssRes = 0;
    
    for (const p of points) {
        ssTot += (p.y - meanY) ** 2;
        const yHat = b0 + b1 * p.x;
        ssRes += (p.y - yHat) ** 2;
    }
    
    if (ssTot < 0.0001) return 1;
    
    return 1 - (ssRes / ssTot);
}

// Actualizar métricas
function updateMetrics() {
    const rss = calculateRSS(beta0, beta1);
    const r2 = calculateR2(beta0, beta1);
    
    metricRSS.textContent = rss.toFixed(2);
    metricR2.textContent = r2 !== null ? r2.toFixed(4) : '—';
    
    eqBeta0.textContent = beta0.toFixed(2);
    eqBeta1.textContent = beta1.toFixed(2);
    
    pointCount.textContent = points.length + ' punto' + (points.length !== 1 ? 's' : '');
    
    // Tips dinámicos
    if (points.length === 0) {
        tipText.textContent = 'Haz clic en el canvas para añadir puntos de datos.';
    } else if (points.length < 2) {
        tipText.textContent = 'Añade al menos 2 puntos para ver la regresión.';
    } else if (!isAutoMode) {
        const ols = calculateOLS();
        const optRSS = calculateRSS(ols.b0, ols.b1);
        if (rss > optRSS * 1.5) {
            tipText.textContent = `Tu RSS es ${(rss/optRSS).toFixed(1)}x mayor que el óptimo. ¡Ajusta los sliders!`;
        } else if (rss > optRSS * 1.1) {
            tipText.textContent = '¡Casi! Estás cerca del ajuste óptimo.';
        } else {
            tipText.textContent = '🎉 ¡Excelente! Has encontrado un ajuste muy cercano al óptimo.';
        }
    } else {
        tipText.textContent = 'El algoritmo de mínimos cuadrados minimiza la suma de residuales al cuadrado.';
    }
}

// Renderizar canvas
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= 10; x += 2) {
        const p = dataToCanvas(x, 0);
        ctx.beginPath();
        ctx.moveTo(p.cx, PADDING);
        ctx.lineTo(p.cx, canvas.height - PADDING);
        ctx.stroke();
    }
    
    for (let y = DATA_RANGE.y.min; y <= DATA_RANGE.y.max; y += 2) {
        const p = dataToCanvas(0, y);
        ctx.beginPath();
        ctx.moveTo(PADDING, p.cy);
        ctx.lineTo(canvas.width - PADDING, p.cy);
        ctx.stroke();
    }
    
    // Ejes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    
    // Eje X
    const origin = dataToCanvas(0, 0);
    ctx.beginPath();
    ctx.moveTo(PADDING, origin.cy);
    ctx.lineTo(canvas.width - PADDING, origin.cy);
    ctx.stroke();
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(origin.cx, PADDING);
    ctx.lineTo(origin.cx, canvas.height - PADDING);
    ctx.stroke();
    
    // Etiquetas
    ctx.fillStyle = '#666';
    ctx.font = '12px Source Sans Pro';
    ctx.textAlign = 'center';
    
    for (let x = 0; x <= 10; x += 2) {
        const p = dataToCanvas(x, DATA_RANGE.y.min);
        ctx.fillText(x.toString(), p.cx, canvas.height - PADDING + 20);
    }
    
    ctx.textAlign = 'right';
    for (let y = DATA_RANGE.y.min; y <= DATA_RANGE.y.max; y += 2) {
        const p = dataToCanvas(DATA_RANGE.x.min, y);
        ctx.fillText(y.toString(), PADDING - 10, p.cy + 4);
    }
    
    // Etiquetas de ejes
    ctx.font = 'bold 13px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('x', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y', 0, 0);
    ctx.restore();
    
    // Si hay puntos, dibujar residuales primero
    if (points.length > 0) {
        ctx.strokeStyle = COLORS.residualLine;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        
        for (const p of points) {
            const yHat = beta0 + beta1 * p.x;
            const pCanvas = dataToCanvas(p.x, p.y);
            const yHatCanvas = dataToCanvas(p.x, yHat);
            
            ctx.beginPath();
            ctx.moveTo(pCanvas.cx, pCanvas.cy);
            ctx.lineTo(yHatCanvas.cx, yHatCanvas.cy);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    
    // Línea óptima (si está en modo auto o para comparar)
    if (points.length >= 2 && isAutoMode) {
        const ols = calculateOLS();
        drawLine(ols.b0, ols.b1, COLORS.optimalLine, 3);
    }
    
    // Línea de regresión manual
    drawLine(beta0, beta1, COLORS.regressionLine, 3);
    
    // Puntos
    for (const p of points) {
        const pCanvas = dataToCanvas(p.x, p.y);
        
        ctx.beginPath();
        ctx.arc(pCanvas.cx, pCanvas.cy, 7, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.dataPoint;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Dibujar línea de regresión
function drawLine(b0, b1, color, width) {
    const x1 = DATA_RANGE.x.min;
    const x2 = DATA_RANGE.x.max;
    const y1 = b0 + b1 * x1;
    const y2 = b0 + b1 * x2;
    
    const p1 = dataToCanvas(x1, y1);
    const p2 = dataToCanvas(x2, y2);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p1.cx, p1.cy);
    ctx.lineTo(p2.cx, p2.cy);
    ctx.stroke();
}

// Añadir punto
function addPoint(cx, cy) {
    const data = canvasToData(cx, cy);
    
    // Validar que esté dentro del rango
    if (data.x < DATA_RANGE.x.min || data.x > DATA_RANGE.x.max ||
        data.y < DATA_RANGE.y.min || data.y > DATA_RANGE.y.max) {
        return;
    }
    
    points.push({ x: data.x, y: data.y });
    
    if (isAutoMode) {
        const ols = calculateOLS();
        beta0 = ols.b0;
        beta1 = ols.b1;
        updateSliders();
    }
    
    updateMetrics();
    render();
}

// Eliminar punto cercano
function removeNearbyPoint(cx, cy) {
    let minDist = Infinity;
    let minIdx = -1;
    
    for (let i = 0; i < points.length; i++) {
        const p = dataToCanvas(points[i].x, points[i].y);
        const dist = Math.sqrt((p.cx - cx) ** 2 + (p.cy - cy) ** 2);
        if (dist < minDist && dist < 20) {
            minDist = dist;
            minIdx = i;
        }
    }
    
    if (minIdx >= 0) {
        points.splice(minIdx, 1);
        
        if (isAutoMode && points.length >= 2) {
            const ols = calculateOLS();
            beta0 = ols.b0;
            beta1 = ols.b1;
            updateSliders();
        }
        
        updateMetrics();
        render();
    }
}

// Actualizar sliders desde valores
function updateSliders() {
    beta0Slider.value = beta0;
    beta1Slider.value = beta1;
    beta0Value.textContent = beta0.toFixed(2);
    beta1Value.textContent = beta1.toFixed(2);
}

// Cargar dataset
function loadDataset(name) {
    points = [];
    
    switch (name) {
        case 'linear':
            // Relación lineal clara
            for (let x = 1; x <= 9; x++) {
                points.push({ x, y: 0.8 * x + 1 + (Math.random() - 0.5) * 0.8 });
            }
            break;
            
        case 'noisy':
            // Lineal con mucho ruido
            for (let x = 1; x <= 9; x++) {
                points.push({ x, y: 0.5 * x + 2 + (Math.random() - 0.5) * 4 });
            }
            break;
            
        case 'negative':
            // Pendiente negativa
            for (let x = 1; x <= 9; x++) {
                points.push({ x, y: -0.6 * x + 8 + (Math.random() - 0.5) * 1.5 });
            }
            break;
            
        case 'cluster':
            // Dos grupos
            for (let i = 0; i < 5; i++) {
                points.push({ x: 2 + Math.random(), y: 2 + Math.random() });
            }
            for (let i = 0; i < 5; i++) {
                points.push({ x: 7 + Math.random(), y: 6 + Math.random() });
            }
            break;
    }
    
    if (isAutoMode && points.length >= 2) {
        const ols = calculateOLS();
        beta0 = ols.b0;
        beta1 = ols.b1;
        updateSliders();
    }
    
    updateMetrics();
    render();
}

// Animar hacia óptimo
function animateToOptimal() {
    if (points.length < 2) {
        alert('Añade al menos 2 puntos para animar.');
        return;
    }
    
    if (isAnimating) {
        stopAnimation();
        return;
    }
    
    const ols = calculateOLS();
    const targetB0 = ols.b0;
    const targetB1 = ols.b1;
    
    const startB0 = beta0;
    const startB1 = beta1;
    
    const duration = 1500;
    const startTime = performance.now();
    
    isAnimating = true;
    animateBtn.textContent = '⏹️ Detener';
    document.body.classList.add('animating');
    
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing
        const eased = 1 - Math.pow(1 - progress, 3);
        
        beta0 = startB0 + (targetB0 - startB0) * eased;
        beta1 = startB1 + (targetB1 - startB1) * eased;
        
        updateSliders();
        updateMetrics();
        render();
        
        if (progress < 1) {
            animationId = requestAnimationFrame(step);
        } else {
            stopAnimation();
        }
    }
    
    animationId = requestAnimationFrame(step);
}

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    isAnimating = false;
    animateBtn.textContent = '▶️ Animar hacia óptimo';
    document.body.classList.remove('animating');
}

// Event listeners

// Canvas - añadir puntos
canvas.addEventListener('click', (e) => {
    if (isAnimating) return;
    
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    addPoint(cx, cy);
});

// Canvas - eliminar puntos
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isAnimating) return;
    
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    removeNearbyPoint(cx, cy);
});

// Sliders
beta0Slider.addEventListener('input', () => {
    if (isAutoMode) return;
    beta0 = parseFloat(beta0Slider.value);
    beta0Value.textContent = beta0.toFixed(2);
    updateMetrics();
    render();
});

beta1Slider.addEventListener('input', () => {
    if (isAutoMode) return;
    beta1 = parseFloat(beta1Slider.value);
    beta1Value.textContent = beta1.toFixed(2);
    updateMetrics();
    render();
});

// Toggle modo
modeToggle.addEventListener('click', () => {
    isAutoMode = !isAutoMode;
    modeToggle.classList.toggle('active', isAutoMode);
    
    if (isAutoMode) {
        modeLabel.textContent = 'Mínimos cuadrados';
        beta0Slider.disabled = true;
        beta1Slider.disabled = true;
        optimalLegend.style.display = 'none';
        
        if (points.length >= 2) {
            const ols = calculateOLS();
            beta0 = ols.b0;
            beta1 = ols.b1;
            updateSliders();
        }
    } else {
        modeLabel.textContent = 'Modo manual';
        beta0Slider.disabled = false;
        beta1Slider.disabled = false;
        optimalLegend.style.display = 'flex';
    }
    
    updateMetrics();
    render();
});

// Botones
animateBtn.addEventListener('click', animateToOptimal);

clearBtn.addEventListener('click', () => {
    stopAnimation();
    points = [];
    beta0 = 0;
    beta1 = 1;
    updateSliders();
    updateMetrics();
    render();
});

// Dataset buttons
document.querySelectorAll('.dataset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        stopAnimation();
        loadDataset(btn.dataset.dataset);
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateSliders();
    updateMetrics();
    render();
});
