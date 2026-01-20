// Comparación: Regresión Logística vs SVM

// Estado global
let data = [];
let selectedClass = 0;
let showProbs = true;
let C = 1.0;

// Parámetros de los modelos
let lrW1 = 0, lrW2 = 0, lrB = 0;  // Regresión Logística
let svmB0 = 0, svmB1 = 1, svmB2 = 1;  // SVM
let supportVectors = [];

// Canvas
const canvasLR = document.getElementById('canvasLR');
const canvasSVM = document.getElementById('canvasSVM');
const ctxLR = canvasLR.getContext('2d');
const ctxSVM = canvasSVM.getContext('2d');

// DOM Elements
const cSlider = document.getElementById('cSlider');
const cValueEl = document.getElementById('cValue');
const showProbsToggle = document.getElementById('showProbs');
const clearBtn = document.getElementById('clearBtn');

// Colores
const COLORS = {
    classNeg: '#0073bb',
    classPos: '#ff9900',
    boundary: '#333333',
    margin: '#888888',
    supportVector: '#7b68ee'
};

// Conversión de coordenadas
const padding = 35;

function getPlotDimensions(canvas) {
    return {
        width: canvas.width - 2 * padding,
        height: canvas.height - 2 * padding
    };
}

function dataToCanvas(canvas, x1, x2) {
    const dim = getPlotDimensions(canvas);
    return {
        x: padding + x1 * dim.width,
        y: canvas.height - padding - x2 * dim.height
    };
}

function canvasToData(canvas, px, py) {
    const dim = getPlotDimensions(canvas);
    return {
        x1: (px - padding) / dim.width,
        x2: (canvas.height - padding - py) / dim.height
    };
}

// ========== REGRESIÓN LOGÍSTICA ==========

function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

function lrPredict(x1, x2) {
    const z = lrW1 * x1 + lrW2 * x2 + lrB;
    return sigmoid(z);
}

function trainLogisticRegression() {
    if (data.length < 2) return;
    
    const hasNeg = data.some(p => p.label === -1);
    const hasPos = data.some(p => p.label === +1);
    if (!hasNeg || !hasPos) return;
    
    // Inicializar
    lrW1 = 0.1;
    lrW2 = 0.1;
    lrB = 0;
    
    const lr = 0.5;
    const iterations = 500;
    
    for (let iter = 0; iter < iterations; iter++) {
        let dw1 = 0, dw2 = 0, db = 0;
        
        for (const p of data) {
            const y = p.label === 1 ? 1 : 0;  // Convertir a 0/1
            const pred = lrPredict(p.x1, p.x2);
            const error = pred - y;
            
            dw1 += error * p.x1;
            dw2 += error * p.x2;
            db += error;
        }
        
        const n = data.length;
        lrW1 -= lr * dw1 / n;
        lrW2 -= lr * dw2 / n;
        lrB -= lr * db / n;
    }
}

function renderLR() {
    const canvas = canvasLR;
    const ctx = ctxLR;
    const dim = getPlotDimensions(canvas);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo de probabilidades
    if (showProbs && data.length >= 2) {
        const resolution = 6;
        for (let px = padding; px < canvas.width - padding; px += resolution) {
            for (let py = padding; py < canvas.height - padding; py += resolution) {
                const coord = canvasToData(canvas, px, py);
                const p = lrPredict(coord.x1, coord.x2);
                
                const r = Math.round(0 * (1 - p) + 255 * p);
                const g = Math.round(115 * (1 - p) + 153 * p);
                const b = Math.round(187 * (1 - p) + 0 * p);
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
                ctx.fillRect(px, py, resolution, resolution);
            }
        }
    }
    
    // Grid y ejes
    drawAxes(ctx, canvas);
    
    // Frontera de decisión (P = 0.5)
    if (data.length >= 2 && (Math.abs(lrW1) > 0.001 || Math.abs(lrW2) > 0.001)) {
        drawBoundary(ctx, canvas, lrW1, lrW2, lrB, COLORS.boundary, false);
    }
    
    // Puntos
    for (const p of data) {
        const pos = dataToCanvas(canvas, p.x1, p.x2);
        drawPoint(ctx, pos.x, pos.y, p.label, false);
    }
}

// ========== SVM ==========

function svmHyperplaneValue(x1, x2) {
    return svmB0 + svmB1 * x1 + svmB2 * x2;
}

function svmBetaNorm() {
    return Math.sqrt(svmB1 * svmB1 + svmB2 * svmB2);
}

function trainSVM() {
    if (data.length < 2) return;
    
    const hasNeg = data.some(p => p.label === -1);
    const hasPos = data.some(p => p.label === +1);
    if (!hasNeg || !hasPos) return;
    
    // Inicializar desde centroides
    const negPoints = data.filter(p => p.label === -1);
    const posPoints = data.filter(p => p.label === +1);
    
    const negCentroid = {
        x1: negPoints.reduce((s, p) => s + p.x1, 0) / negPoints.length,
        x2: negPoints.reduce((s, p) => s + p.x2, 0) / negPoints.length
    };
    const posCentroid = {
        x1: posPoints.reduce((s, p) => s + p.x1, 0) / posPoints.length,
        x2: posPoints.reduce((s, p) => s + p.x2, 0) / posPoints.length
    };
    
    let dx = posCentroid.x1 - negCentroid.x1;
    let dy = posCentroid.x2 - negCentroid.x2;
    const len = Math.sqrt(dx*dx + dy*dy);
    
    if (len > 0.001) {
        svmB1 = dx / len;
        svmB2 = dy / len;
    } else {
        svmB1 = 1;
        svmB2 = 0;
    }
    
    const midX = (negCentroid.x1 + posCentroid.x1) / 2;
    const midY = (negCentroid.x2 + posCentroid.x2) / 2;
    svmB0 = -(svmB1 * midX + svmB2 * midY);
    
    // Optimización con soft margin
    const lr = 0.005;
    const iterations = 1000;
    
    for (let iter = 0; iter < iterations; iter++) {
        let db0 = 0, db1 = 0, db2 = 0;
        
        const regStrength = 1 / (C + 0.001);
        db1 += regStrength * svmB1;
        db2 += regStrength * svmB2;
        
        for (const p of data) {
            const funcMargin = p.label * svmHyperplaneValue(p.x1, p.x2);
            
            if (funcMargin < 1) {
                db0 -= p.label * C * 0.1;
                db1 -= p.label * p.x1 * C * 0.1;
                db2 -= p.label * p.x2 * C * 0.1;
            }
        }
        
        svmB0 -= lr * db0;
        svmB1 -= lr * db1;
        svmB2 -= lr * db2;
    }
    
    // Normalizar
    const norm = svmBetaNorm();
    if (norm > 0.001) {
        let minPosMargin = Infinity;
        for (const p of data) {
            const funcMargin = p.label * svmHyperplaneValue(p.x1, p.x2);
            if (funcMargin > 0 && funcMargin < minPosMargin) {
                minPosMargin = funcMargin;
            }
        }
        
        if (minPosMargin > 0.01 && minPosMargin < Infinity) {
            const scale = 1 / minPosMargin;
            svmB0 *= scale;
            svmB1 *= scale;
            svmB2 *= scale;
        }
    }
    
    // Encontrar vectores de soporte
    findSupportVectors();
}

function findSupportVectors() {
    supportVectors = [];
    const norm = svmBetaNorm();
    if (norm < 0.001) return;
    
    for (const p of data) {
        const funcMargin = p.label * svmHyperplaneValue(p.x1, p.x2);
        // Puntos en el margen o violando
        if (funcMargin <= 1.1) {
            supportVectors.push(p);
        }
    }
}

function renderSVM() {
    const canvas = canvasSVM;
    const ctx = ctxSVM;
    const dim = getPlotDimensions(canvas);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Regiones coloreadas
    if (data.length >= 2) {
        const resolution = 6;
        for (let px = padding; px < canvas.width - padding; px += resolution) {
            for (let py = padding; py < canvas.height - padding; py += resolution) {
                const coord = canvasToData(canvas, px, py);
                const val = svmHyperplaneValue(coord.x1, coord.x2);
                
                if (val < 0) {
                    ctx.fillStyle = 'rgba(0, 115, 187, 0.1)';
                } else {
                    ctx.fillStyle = 'rgba(255, 153, 0, 0.1)';
                }
                ctx.fillRect(px, py, resolution, resolution);
            }
        }
    }
    
    // Grid y ejes
    drawAxes(ctx, canvas);
    
    // Márgenes y frontera
    if (data.length >= 2 && svmBetaNorm() > 0.001) {
        // Márgenes
        drawBoundary(ctx, canvas, svmB1, svmB2, svmB0 + 1, COLORS.margin, true);
        drawBoundary(ctx, canvas, svmB1, svmB2, svmB0 - 1, COLORS.margin, true);
        
        // Frontera principal
        drawBoundary(ctx, canvas, svmB1, svmB2, svmB0, COLORS.boundary, false);
    }
    
    // Puntos
    for (const p of data) {
        const pos = dataToCanvas(canvas, p.x1, p.x2);
        const isSV = supportVectors.includes(p);
        drawPoint(ctx, pos.x, pos.y, p.label, isSV);
    }
}

// ========== FUNCIONES COMUNES ==========

function drawAxes(ctx, canvas) {
    const dim = getPlotDimensions(canvas);
    
    // Grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const x = padding + (dim.width * i / 5);
        const y = padding + (dim.height * i / 5);
        
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvas.height - padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Ejes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#666';
    ctx.font = 'bold 10px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('x₁', canvas.width / 2, canvas.height - 8);
    
    ctx.save();
    ctx.translate(10, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂', 0, 0);
    ctx.restore();
}

function drawBoundary(ctx, canvas, w1, w2, b, color, dashed) {
    const dim = getPlotDimensions(canvas);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = dashed ? 2 : 2.5;
    ctx.setLineDash(dashed ? [4, 4] : []);
    ctx.beginPath();
    
    let started = false;
    
    if (Math.abs(w2) > 0.001) {
        for (let px = padding; px <= canvas.width - padding; px += 2) {
            const coord = canvasToData(canvas, px, 0);
            const x1 = coord.x1;
            const x2 = (-b - w1 * x1) / w2;
            
            if (x2 >= 0 && x2 <= 1) {
                const pos = dataToCanvas(canvas, x1, x2);
                if (!started) {
                    ctx.moveTo(pos.x, pos.y);
                    started = true;
                } else {
                    ctx.lineTo(pos.x, pos.y);
                }
            }
        }
    } else if (Math.abs(w1) > 0.001) {
        const x1 = -b / w1;
        if (x1 >= 0 && x1 <= 1) {
            const top = dataToCanvas(canvas, x1, 1);
            const bottom = dataToCanvas(canvas, x1, 0);
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(bottom.x, bottom.y);
        }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPoint(ctx, x, y, label, isSV) {
    // Anillo de vector de soporte
    if (isSV) {
        ctx.strokeStyle = COLORS.supportVector;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Punto principal
    ctx.fillStyle = label === -1 ? COLORS.classNeg : COLORS.classPos;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Centro blanco
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
}

// ========== MÉTRICAS ==========

function computeMetrics(predictFn) {
    if (data.length === 0) {
        return { accuracy: 1, precision: 1, recall: 1, f1: 1, tp: 0, tn: 0, fp: 0, fn: 0 };
    }
    
    let tp = 0, tn = 0, fp = 0, fn = 0;
    
    for (const p of data) {
        const pred = predictFn(p.x1, p.x2);
        const predLabel = pred >= 0.5 ? 1 : -1;
        
        if (p.label === 1 && predLabel === 1) tp++;
        else if (p.label === -1 && predLabel === -1) tn++;
        else if (p.label === -1 && predLabel === 1) fp++;
        else if (p.label === 1 && predLabel === -1) fn++;
    }
    
    const accuracy = (tp + tn) / data.length;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 1;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 1;
    const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
    
    return { accuracy, precision, recall, f1, tp, tn, fp, fn };
}

function updateMetrics() {
    // LR metrics
    const lrMetrics = computeMetrics((x1, x2) => lrPredict(x1, x2));
    document.getElementById('lrAccuracy').textContent = (lrMetrics.accuracy * 100).toFixed(0) + '%';
    document.getElementById('lrPrecision').textContent = (lrMetrics.precision * 100).toFixed(0) + '%';
    document.getElementById('lrRecall').textContent = (lrMetrics.recall * 100).toFixed(0) + '%';
    document.getElementById('lrF1').textContent = (lrMetrics.f1 * 100).toFixed(0) + '%';
    document.getElementById('lrTP').textContent = lrMetrics.tp;
    document.getElementById('lrTN').textContent = lrMetrics.tn;
    document.getElementById('lrFP').textContent = lrMetrics.fp;
    document.getElementById('lrFN').textContent = lrMetrics.fn;
    
    // SVM metrics
    const svmMetrics = computeMetrics((x1, x2) => {
        return svmHyperplaneValue(x1, x2) >= 0 ? 1 : 0;
    });
    document.getElementById('svmAccuracy').textContent = (svmMetrics.accuracy * 100).toFixed(0) + '%';
    document.getElementById('svmPrecision').textContent = (svmMetrics.precision * 100).toFixed(0) + '%';
    document.getElementById('svmRecall').textContent = (svmMetrics.recall * 100).toFixed(0) + '%';
    document.getElementById('svmF1').textContent = (svmMetrics.f1 * 100).toFixed(0) + '%';
    document.getElementById('svmTP').textContent = svmMetrics.tp;
    document.getElementById('svmTN').textContent = svmMetrics.tn;
    document.getElementById('svmFP').textContent = svmMetrics.fp;
    document.getElementById('svmFN').textContent = svmMetrics.fn;
}

// ========== INTERACTIVIDAD ==========

function addPoint(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const coord = canvasToData(canvas, px, py);
    
    if (coord.x1 < 0 || coord.x1 > 1 || coord.x2 < 0 || coord.x2 > 1) return;
    
    data.push({
        x1: coord.x1,
        x2: coord.x2,
        label: selectedClass === 0 ? -1 : 1
    });
    
    trainAndRender();
}

function trainAndRender() {
    trainLogisticRegression();
    trainSVM();
    renderLR();
    renderSVM();
    updateMetrics();
}

// Presets
const presets = {
    separable: () => {
        data = [
            { x1: 0.15, x2: 0.2, label: -1 },
            { x1: 0.2, x2: 0.4, label: -1 },
            { x1: 0.25, x2: 0.15, label: -1 },
            { x1: 0.3, x2: 0.35, label: -1 },
            { x1: 0.18, x2: 0.55, label: -1 },
            { x1: 0.7, x2: 0.65, label: +1 },
            { x1: 0.75, x2: 0.5, label: +1 },
            { x1: 0.8, x2: 0.8, label: +1 },
            { x1: 0.85, x2: 0.6, label: +1 },
            { x1: 0.72, x2: 0.85, label: +1 }
        ];
    },
    overlap: () => {
        data = [
            { x1: 0.25, x2: 0.3, label: -1 },
            { x1: 0.3, x2: 0.5, label: -1 },
            { x1: 0.35, x2: 0.25, label: -1 },
            { x1: 0.4, x2: 0.45, label: -1 },
            { x1: 0.45, x2: 0.55, label: -1 },
            { x1: 0.5, x2: 0.5, label: +1 },
            { x1: 0.55, x2: 0.6, label: +1 },
            { x1: 0.6, x2: 0.55, label: +1 },
            { x1: 0.65, x2: 0.7, label: +1 },
            { x1: 0.7, x2: 0.65, label: +1 }
        ];
    },
    outlier: () => {
        data = [
            { x1: 0.15, x2: 0.2, label: -1 },
            { x1: 0.2, x2: 0.4, label: -1 },
            { x1: 0.25, x2: 0.15, label: -1 },
            { x1: 0.3, x2: 0.35, label: -1 },
            { x1: 0.75, x2: 0.7, label: -1 },  // Outlier!
            { x1: 0.65, x2: 0.6, label: +1 },
            { x1: 0.7, x2: 0.5, label: +1 },
            { x1: 0.75, x2: 0.8, label: +1 },
            { x1: 0.8, x2: 0.65, label: +1 },
            { x1: 0.85, x2: 0.75, label: +1 }
        ];
    },
    diagonal: () => {
        data = [
            { x1: 0.1, x2: 0.15, label: -1 },
            { x1: 0.2, x2: 0.25, label: -1 },
            { x1: 0.3, x2: 0.2, label: -1 },
            { x1: 0.25, x2: 0.1, label: -1 },
            { x1: 0.15, x2: 0.3, label: -1 },
            { x1: 0.7, x2: 0.85, label: +1 },
            { x1: 0.75, x2: 0.9, label: +1 },
            { x1: 0.8, x2: 0.75, label: +1 },
            { x1: 0.85, x2: 0.8, label: +1 },
            { x1: 0.9, x2: 0.7, label: +1 }
        ];
    },
    clusters: () => {
        data = [
            // Cluster negativo abajo izquierda
            { x1: 0.2, x2: 0.25, label: -1 },
            { x1: 0.25, x2: 0.3, label: -1 },
            { x1: 0.3, x2: 0.2, label: -1 },
            { x1: 0.22, x2: 0.18, label: -1 },
            // Cluster negativo arriba izquierda
            { x1: 0.15, x2: 0.75, label: -1 },
            { x1: 0.2, x2: 0.8, label: -1 },
            { x1: 0.25, x2: 0.7, label: -1 },
            // Cluster positivo centro derecha
            { x1: 0.7, x2: 0.5, label: +1 },
            { x1: 0.75, x2: 0.55, label: +1 },
            { x1: 0.8, x2: 0.45, label: +1 },
            { x1: 0.72, x2: 0.6, label: +1 },
            { x1: 0.78, x2: 0.52, label: +1 }
        ];
    }
};

// Event Listeners
canvasLR.addEventListener('click', (e) => addPoint(canvasLR, e));
canvasSVM.addEventListener('click', (e) => addPoint(canvasSVM, e));

document.querySelectorAll('.class-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedClass = parseInt(btn.dataset.class);
    });
});

cSlider.addEventListener('input', () => {
    C = Math.pow(10, parseFloat(cSlider.value));
    cValueEl.textContent = C.toFixed(2);
    trainSVM();
    renderSVM();
    updateMetrics();
});

showProbsToggle.addEventListener('change', () => {
    showProbs = showProbsToggle.checked;
    renderLR();
});

clearBtn.addEventListener('click', () => {
    data = [];
    lrW1 = 0; lrW2 = 0; lrB = 0;
    svmB0 = 0; svmB1 = 1; svmB2 = 1;
    supportVectors = [];
    trainAndRender();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (presets[preset]) {
            presets[preset]();
            trainAndRender();
        }
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    presets.separable();
    trainAndRender();
});
