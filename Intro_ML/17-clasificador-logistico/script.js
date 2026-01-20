// Clasificador de Regresión Logística Interactivo

// Estado global
let data = [];  // Array de {x1, x2, label}
let w1 = 0, w2 = 0, b = 0;  // Pesos del modelo
let learningRate = 0.5;
let animationSpeed = 50;
let iteration = 0;
let isTraining = false;
let trainingId = null;
let selectedClass = 0;
let lossHistory = [];

// Elementos del DOM
const mainCanvas = document.getElementById('mainCanvas');
const ctx = mainCanvas.getContext('2d');
const lossChart = document.getElementById('lossChart');
const lossCtx = lossChart.getContext('2d');

const trainBtn = document.getElementById('trainBtn');
const stepBtn = document.getElementById('stepBtn');
const resetWeightsBtn = document.getElementById('resetWeightsBtn');
const clearDataBtn = document.getElementById('clearDataBtn');

const lrSlider = document.getElementById('lrSlider');
const lrValue = document.getElementById('lrValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

const metricIter = document.getElementById('metricIter');
const metricAccuracy = document.getElementById('metricAccuracy');
const metricLoss = document.getElementById('metricLoss');
const w1Value = document.getElementById('w1Value');
const w2Value = document.getElementById('w2Value');
const bValue = document.getElementById('bValue');

const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Colores
const COLORS = {
    class0: '#0073bb',
    class1: '#ff9900',
    boundary: '#333333',
    probLow: 'rgba(0, 115, 187, 0.3)',
    probHigh: 'rgba(255, 153, 0, 0.3)'
};

// Sigmoid function
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

// Predict probability for a point
function predict(x1, x2) {
    const z = w1 * x1 + w2 * x2 + b;
    return sigmoid(z);
}

// Cross-entropy loss
function computeLoss() {
    if (data.length === 0) return 0;
    
    let loss = 0;
    const eps = 1e-15;
    
    for (const point of data) {
        const p = predict(point.x1, point.x2);
        const pClipped = Math.max(eps, Math.min(1 - eps, p));
        
        if (point.label === 1) {
            loss -= Math.log(pClipped);
        } else {
            loss -= Math.log(1 - pClipped);
        }
    }
    
    return loss / data.length;
}

// Compute accuracy
function computeAccuracy() {
    if (data.length === 0) return 0;
    
    let correct = 0;
    for (const point of data) {
        const p = predict(point.x1, point.x2);
        const predicted = p >= 0.5 ? 1 : 0;
        if (predicted === point.label) correct++;
    }
    
    return correct / data.length;
}

// Gradient descent step
function gradientStep() {
    if (data.length === 0) return;
    
    let dw1 = 0, dw2 = 0, db = 0;
    
    for (const point of data) {
        const p = predict(point.x1, point.x2);
        const error = p - point.label;
        
        dw1 += error * point.x1;
        dw2 += error * point.x2;
        db += error;
    }
    
    // Promedio
    const n = data.length;
    dw1 /= n;
    dw2 /= n;
    db /= n;
    
    // Actualizar pesos
    w1 -= learningRate * dw1;
    w2 -= learningRate * dw2;
    b -= learningRate * db;
    
    iteration++;
    
    // Guardar historial de pérdida
    lossHistory.push(computeLoss());
    
    // Actualizar UI
    updateMetrics();
    render();
    renderLossChart();
}

// Render main canvas
function render() {
    const width = mainCanvas.width;
    const height = mainCanvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Rango de datos (normalizado a [0, 1])
    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    // Dibujar gradiente de probabilidades
    if (data.length > 0) {
        const resolution = 10;
        for (let i = 0; i < plotWidth; i += resolution) {
            for (let j = 0; j < plotHeight; j += resolution) {
                const x1 = i / plotWidth;
                const x2 = 1 - j / plotHeight;
                const p = predict(x1, x2);
                
                // Interpolate color based on probability
                const r = Math.round(0 * (1 - p) + 255 * p);
                const g = Math.round(115 * (1 - p) + 153 * p);
                const b = Math.round(187 * (1 - p) + 0 * p);
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
                ctx.fillRect(padding + i, padding + j, resolution, resolution);
            }
        }
    }
    
    // Grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
        const x = padding + (plotWidth * i / 10);
        const y = padding + (plotHeight * i / 10);
        
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#666';
    ctx.font = 'bold 12px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('x₁', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂', 0, 0);
    ctx.restore();
    
    // Decision boundary
    if (data.length > 0 && (w1 !== 0 || w2 !== 0)) {
        ctx.strokeStyle = COLORS.boundary;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        // La frontera es: w1*x1 + w2*x2 + b = 0
        // => x2 = -(w1*x1 + b) / w2  (si w2 != 0)
        // => x1 = -(w2*x2 + b) / w1  (si w1 != 0)
        
        if (Math.abs(w2) > 0.001) {
            // Dibujar como función de x1
            for (let px = padding; px <= width - padding; px++) {
                const x1 = (px - padding) / plotWidth;
                const x2 = -(w1 * x1 + b) / w2;
                const py = height - padding - x2 * plotHeight;
                
                if (py >= padding && py <= height - padding) {
                    if (px === padding) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
            }
        } else if (Math.abs(w1) > 0.001) {
            // Línea vertical
            const x1 = -b / w1;
            const px = padding + x1 * plotWidth;
            ctx.moveTo(px, padding);
            ctx.lineTo(px, height - padding);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Draw data points
    for (const point of data) {
        const px = padding + point.x1 * plotWidth;
        const py = height - padding - point.x2 * plotHeight;
        
        // Border
        ctx.fillStyle = point.label === 0 ? COLORS.class0 : COLORS.class1;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner white circle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Show probability on hover (optional visual)
        const p = predict(point.x1, point.x2);
        const correct = (p >= 0.5 ? 1 : 0) === point.label;
        
        if (!correct && data.length > 0 && iteration > 0) {
            // Mark misclassified with X
            ctx.strokeStyle = '#d13212';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px - 5, py - 5);
            ctx.lineTo(px + 5, py + 5);
            ctx.moveTo(px + 5, py - 5);
            ctx.lineTo(px - 5, py + 5);
            ctx.stroke();
        }
    }
    
    // Tick labels
    ctx.fillStyle = '#999';
    ctx.font = '10px Source Sans Pro';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 10; i += 2) {
        const val = (i / 10).toFixed(1);
        const x = padding + (plotWidth * i / 10);
        const y = height - padding + 15;
        ctx.fillText(val, x, y);
    }
    
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i += 2) {
        const val = (i / 10).toFixed(1);
        const x = padding - 5;
        const y = height - padding - (plotHeight * i / 10) + 4;
        ctx.fillText(val, x, y);
    }
}

// Render loss chart
function renderLossChart() {
    const width = lossChart.width;
    const height = lossChart.height;
    
    lossCtx.clearRect(0, 0, width, height);
    
    // Background
    lossCtx.fillStyle = '#f5f5f5';
    lossCtx.fillRect(0, 0, width, height);
    
    if (lossHistory.length < 2) {
        lossCtx.fillStyle = '#999';
        lossCtx.font = '11px Source Sans Pro';
        lossCtx.textAlign = 'center';
        lossCtx.fillText('El historial de pérdida aparecerá aquí durante el entrenamiento', width/2, height/2);
        return;
    }
    
    const padding = 30;
    const maxLoss = Math.max(...lossHistory, 0.1);
    const minLoss = Math.min(...lossHistory, 0);
    
    const scaleX = (width - 2 * padding) / Math.max(lossHistory.length - 1, 1);
    const scaleY = (height - 2 * padding) / Math.max(maxLoss - minLoss, 0.01);
    
    // Grid
    lossCtx.strokeStyle = '#ddd';
    lossCtx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
        const y = padding + i * (height - 2 * padding) / 4;
        lossCtx.beginPath();
        lossCtx.moveTo(padding, y);
        lossCtx.lineTo(width - padding, y);
        lossCtx.stroke();
    }
    
    // Loss curve
    lossCtx.strokeStyle = '#d13212';
    lossCtx.lineWidth = 2;
    lossCtx.beginPath();
    
    for (let i = 0; i < lossHistory.length; i++) {
        const x = padding + i * scaleX;
        const y = height - padding - (lossHistory[i] - minLoss) * scaleY;
        
        if (i === 0) {
            lossCtx.moveTo(x, y);
        } else {
            lossCtx.lineTo(x, y);
        }
    }
    lossCtx.stroke();
    
    // Labels
    lossCtx.fillStyle = '#666';
    lossCtx.font = '10px Source Sans Pro';
    lossCtx.textAlign = 'center';
    lossCtx.fillText('Iteración', width / 2, height - 5);
    
    lossCtx.textAlign = 'right';
    lossCtx.fillText(maxLoss.toFixed(2), padding - 3, padding + 10);
    lossCtx.fillText(minLoss.toFixed(2), padding - 3, height - padding);
}

// Update metrics display
function updateMetrics() {
    const loss = computeLoss();
    const accuracy = computeAccuracy();
    
    metricIter.textContent = iteration;
    metricLoss.textContent = loss.toFixed(4);
    metricAccuracy.textContent = (accuracy * 100).toFixed(1) + '%';
    
    w1Value.textContent = w1.toFixed(4);
    w2Value.textContent = w2.toFixed(4);
    bValue.textContent = b.toFixed(4);
}

// Start training
function startTraining() {
    if (data.length === 0) {
        alert('Añade algunos puntos de datos primero');
        return;
    }
    
    if (isTraining) {
        stopTraining();
        return;
    }
    
    isTraining = true;
    trainBtn.textContent = '⏸ Pausar';
    trainBtn.classList.remove('btn-success');
    trainBtn.classList.add('btn-danger');
    
    statusIndicator.classList.add('training');
    statusIndicator.querySelector('.status-dot').classList.add('training');
    statusText.textContent = 'Entrenando...';
    
    function train() {
        if (!isTraining) return;
        
        gradientStep();
        
        // Check convergence
        if (lossHistory.length > 10) {
            const recent = lossHistory.slice(-10);
            const delta = Math.abs(recent[recent.length - 1] - recent[0]);
            if (delta < 0.0001 || iteration > 1000) {
                stopTraining();
                return;
            }
        }
        
        trainingId = setTimeout(train, animationSpeed);
    }
    
    train();
}

function stopTraining() {
    isTraining = false;
    if (trainingId) {
        clearTimeout(trainingId);
    }
    
    trainBtn.textContent = '▶ Entrenar';
    trainBtn.classList.remove('btn-danger');
    trainBtn.classList.add('btn-success');
    
    statusIndicator.classList.remove('training');
    statusIndicator.querySelector('.status-dot').classList.remove('training');
    statusText.textContent = 'Pausado';
}

// Reset weights
function resetWeights() {
    stopTraining();
    w1 = (Math.random() - 0.5) * 0.1;
    w2 = (Math.random() - 0.5) * 0.1;
    b = (Math.random() - 0.5) * 0.1;
    iteration = 0;
    lossHistory = [];
    
    updateMetrics();
    render();
    renderLossChart();
    
    statusText.textContent = 'Pesos reiniciados';
}

// Clear data
function clearData() {
    stopTraining();
    data = [];
    resetWeights();
    statusText.textContent = 'Datos limpiados';
}

// Add point on click
function addPoint(e) {
    const rect = mainCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const padding = 40;
    const plotWidth = mainCanvas.width - 2 * padding;
    const plotHeight = mainCanvas.height - 2 * padding;
    
    // Convert to data coordinates
    const x1 = (px - padding) / plotWidth;
    const x2 = 1 - (py - padding) / plotHeight;
    
    // Check bounds
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return;
    
    data.push({ x1, x2, label: selectedClass });
    
    render();
    updateMetrics();
}

// Preset datasets
const presets = {
    linear: () => {
        data = [];
        // Clase 0: parte inferior izquierda
        for (let i = 0; i < 15; i++) {
            data.push({
                x1: 0.1 + Math.random() * 0.35,
                x2: 0.1 + Math.random() * 0.35,
                label: 0
            });
        }
        // Clase 1: parte superior derecha
        for (let i = 0; i < 15; i++) {
            data.push({
                x1: 0.55 + Math.random() * 0.35,
                x2: 0.55 + Math.random() * 0.35,
                label: 1
            });
        }
    },
    diagonal: () => {
        data = [];
        // Clase 0: debajo de la diagonal
        for (let i = 0; i < 15; i++) {
            const x1 = Math.random() * 0.9 + 0.05;
            const x2 = Math.random() * (x1 - 0.15);
            data.push({ x1, x2: Math.max(0.05, x2), label: 0 });
        }
        // Clase 1: encima de la diagonal
        for (let i = 0; i < 15; i++) {
            const x1 = Math.random() * 0.9 + 0.05;
            const x2 = x1 + 0.15 + Math.random() * (0.95 - x1 - 0.15);
            data.push({ x1, x2: Math.min(0.95, x2), label: 1 });
        }
    },
    overlap: () => {
        data = [];
        // Clase 0: cluster centrado en (0.35, 0.5)
        for (let i = 0; i < 15; i++) {
            data.push({
                x1: 0.35 + (Math.random() - 0.5) * 0.4,
                x2: 0.5 + (Math.random() - 0.5) * 0.4,
                label: 0
            });
        }
        // Clase 1: cluster centrado en (0.65, 0.5) con overlap
        for (let i = 0; i < 15; i++) {
            data.push({
                x1: 0.65 + (Math.random() - 0.5) * 0.4,
                x2: 0.5 + (Math.random() - 0.5) * 0.4,
                label: 1
            });
        }
    }
};

// Event Listeners

// Canvas click
mainCanvas.addEventListener('click', addPoint);

// Class selector
document.querySelectorAll('.class-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedClass = parseInt(btn.dataset.class);
    });
});

// Training buttons
trainBtn.addEventListener('click', startTraining);
stepBtn.addEventListener('click', () => {
    if (data.length === 0) {
        alert('Añade algunos puntos de datos primero');
        return;
    }
    stopTraining();
    gradientStep();
});
resetWeightsBtn.addEventListener('click', resetWeights);
clearDataBtn.addEventListener('click', clearData);

// Parameter sliders
lrSlider.addEventListener('input', () => {
    learningRate = parseFloat(lrSlider.value);
    lrValue.textContent = learningRate.toFixed(2);
});

speedSlider.addEventListener('input', () => {
    animationSpeed = parseInt(speedSlider.value);
    speedValue.textContent = animationSpeed + ' ms';
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (presets[preset]) {
            stopTraining();
            presets[preset]();
            resetWeights();
            render();
            statusText.textContent = `Dataset "${preset}" cargado`;
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    resetWeights();
    render();
    renderLossChart();
});
