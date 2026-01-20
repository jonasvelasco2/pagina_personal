// SVM: Margen Suave y Parámetro C

// Estado global
let data = [];
let C = 1.0;  // Parámetro de regularización
let beta0 = 0, beta1 = 1, beta2 = 1;
let slackVariables = [];  // ξᵢ para cada punto
let supportVectors = [];
let pointStatus = [];  // 'correct', 'in-margin', 'error'

// Canvas
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const cSlider = document.getElementById('cSlider');
const cValueEl = document.getElementById('cValue');
const cExplanation = document.getElementById('cExplanation');

const metricAccuracy = document.getElementById('metricAccuracy');
const metricMargin = document.getElementById('metricMargin');
const metricViolations = document.getElementById('metricViolations');
const metricSV = document.getElementById('metricSV');
const sumSlack = document.getElementById('sumSlack');

const resetBtn = document.getElementById('resetBtn');

// Colores
const COLORS = {
    classNeg: '#0073bb',
    classPos: '#ff9900',
    hyperplane: '#333333',
    marginLine: '#888888',
    correct: '#1d8102',
    inMargin: '#ff9900',
    error: '#d13212',
    supportVector: '#7b68ee',
    slack: 'rgba(209, 50, 18, 0.6)'
};

// Conversión de coordenadas
const padding = 50;
const plotWidth = canvas.width - 2 * padding;
const plotHeight = canvas.height - 2 * padding;

function dataToCanvas(x1, x2) {
    return {
        x: padding + x1 * plotWidth,
        y: canvas.height - padding - x2 * plotHeight
    };
}

function canvasToData(px, py) {
    return {
        x1: (px - padding) / plotWidth,
        x2: (canvas.height - padding - py) / plotHeight
    };
}

// Valor del hiperplano
function hyperplaneValue(x1, x2) {
    return beta0 + beta1 * x1 + beta2 * x2;
}

// Norma de β
function betaNorm() {
    return Math.sqrt(beta1 * beta1 + beta2 * beta2);
}

// Margen geométrico
function computeMargin() {
    const norm = betaNorm();
    if (norm < 0.001) return Infinity;
    return 1 / norm;
}

// Calcular variables de holgura y estados
function computeSlackAndStatus() {
    slackVariables = [];
    pointStatus = [];
    supportVectors = [];
    
    const norm = betaNorm();
    
    for (const p of data) {
        const funcMargin = p.label * hyperplaneValue(p.x1, p.x2);
        
        // ξᵢ = max(0, 1 - yᵢ(β₀ + β·xᵢ))
        const xi = Math.max(0, 1 - funcMargin);
        slackVariables.push(xi);
        
        // Determinar estado del punto
        if (xi === 0) {
            // Fuera del margen, correctamente clasificado
            pointStatus.push('correct');
        } else if (xi < 1) {
            // Dentro del margen pero correctamente clasificado
            pointStatus.push('in-margin');
            supportVectors.push(p);
        } else {
            // Mal clasificado
            pointStatus.push('error');
            supportVectors.push(p);
        }
        
        // También considerar vectores de soporte exactamente en el margen
        if (Math.abs(funcMargin - 1) < 0.1 && xi < 0.1) {
            if (!supportVectors.includes(p)) {
                supportVectors.push(p);
            }
        }
    }
}

// Encontrar hiperplano óptimo con soft margin (aproximación)
function findOptimalHyperplane() {
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
    
    if (len < 0.001) {
        beta1 = 1;
        beta2 = 0;
    } else {
        beta1 = dx / len;
        beta2 = dy / len;
    }
    
    const midX = (negCentroid.x1 + posCentroid.x1) / 2;
    const midY = (negCentroid.x2 + posCentroid.x2) / 2;
    beta0 = -(beta1 * midX + beta2 * midY);
    
    // Optimización con soft margin
    // min ½||β||² + C·Σξᵢ
    // s.t. yᵢ(β₀ + β·xᵢ) ≥ 1 - ξᵢ
    
    const lr = 0.005;
    const iterations = 1000;
    
    for (let iter = 0; iter < iterations; iter++) {
        // Calcular gradientes
        let db0 = 0, db1 = 0, db2 = 0;
        
        // Gradiente de ½||β||² (regularización)
        const regStrength = 1 / (C + 0.001);
        db1 += regStrength * beta1;
        db2 += regStrength * beta2;
        
        // Gradiente de C·Σmax(0, 1 - yᵢf(xᵢ))
        for (const p of data) {
            const funcMargin = p.label * hyperplaneValue(p.x1, p.x2);
            
            if (funcMargin < 1) {
                // Violación: gradiente = -yᵢ * xᵢ
                db0 -= p.label * C * 0.1;
                db1 -= p.label * p.x1 * C * 0.1;
                db2 -= p.label * p.x2 * C * 0.1;
            }
        }
        
        // Actualizar parámetros
        beta0 -= lr * db0;
        beta1 -= lr * db1;
        beta2 -= lr * db2;
    }
    
    // Normalizar para interpretación del margen
    normalizeHyperplane();
    
    // Calcular estados
    computeSlackAndStatus();
    
    // Actualizar UI
    updateMetrics();
}

function normalizeHyperplane() {
    // Normalizar para que los vectores de soporte estén aproximadamente en |f(x)| ≈ 1
    const norm = betaNorm();
    if (norm > 0.001) {
        // Encontrar el punto con menor margen funcional positivo (entre las clases)
        let minPosMargin = Infinity;
        for (const p of data) {
            const funcMargin = p.label * hyperplaneValue(p.x1, p.x2);
            if (funcMargin > 0 && funcMargin < minPosMargin) {
                minPosMargin = funcMargin;
            }
        }
        
        // Solo normalizar si hay puntos correctamente clasificados
        if (minPosMargin > 0.01 && minPosMargin < Infinity) {
            const scale = 1 / minPosMargin;
            beta0 *= scale;
            beta1 *= scale;
            beta2 *= scale;
        }
    }
}

// Renderizar
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Regiones coloreadas
    drawRegions();
    
    // Grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
        const x = padding + (plotWidth * i / 10);
        const y = padding + (plotHeight * i / 10);
        
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
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    
    // Labels de ejes
    ctx.fillStyle = '#666';
    ctx.font = 'bold 12px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('x₁', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂', 0, 0);
    ctx.restore();
    
    // Tick labels
    ctx.fillStyle = '#999';
    ctx.font = '10px Source Sans Pro';
    
    for (let i = 0; i <= 10; i += 2) {
        const val = (i / 10).toFixed(1);
        ctx.textAlign = 'center';
        ctx.fillText(val, padding + (plotWidth * i / 10), canvas.height - padding + 15);
        
        ctx.textAlign = 'right';
        ctx.fillText(val, padding - 5, canvas.height - padding - (plotHeight * i / 10) + 4);
    }
    
    // Hiperplano y márgenes
    if (betaNorm() > 0.001) {
        drawHyperplaneAndMargins();
    }
    
    // Dibujar líneas de slack (ξᵢ)
    drawSlackLines();
    
    // Puntos
    for (let i = 0; i < data.length; i++) {
        const p = data[i];
        const pos = dataToCanvas(p.x1, p.x2);
        const status = pointStatus[i];
        const isSV = supportVectors.includes(p);
        
        // Anillo exterior para vectores de soporte (morado)
        if (isSV) {
            // Anillo morado grueso
            ctx.strokeStyle = COLORS.supportVector;  // #7b68ee (morado)
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 17, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Borde interior blanco para contraste
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 14, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Color base según clase
        let baseColor = p.label === -1 ? COLORS.classNeg : COLORS.classPos;
        
        // Punto principal
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Indicador de estado en el centro
        let statusColor;
        switch(status) {
            case 'correct':
                statusColor = COLORS.correct;
                break;
            case 'in-margin':
                statusColor = COLORS.inMargin;
                break;
            case 'error':
                statusColor = COLORS.error;
                break;
            default:
                statusColor = 'white';
        }
        
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Etiqueta de clase
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px Source Sans Pro';
        ctx.textAlign = 'center';
        ctx.fillText(p.label === -1 ? '-1' : '+1', pos.x, pos.y + 3);
    }
}

function drawRegions() {
    const resolution = 8;
    
    for (let px = padding; px < canvas.width - padding; px += resolution) {
        for (let py = padding; py < canvas.height - padding; py += resolution) {
            const coord = canvasToData(px, py);
            const val = hyperplaneValue(coord.x1, coord.x2);
            
            if (val < 0) {
                ctx.fillStyle = 'rgba(0, 115, 187, 0.08)';
            } else {
                ctx.fillStyle = 'rgba(255, 153, 0, 0.08)';
            }
            ctx.fillRect(px, py, resolution, resolution);
        }
    }
}

function drawHyperplaneAndMargins() {
    function drawLine(offset, color, dashed, lineWidth) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth || 2;
        ctx.setLineDash(dashed ? [5, 5] : []);
        ctx.beginPath();
        
        let started = false;
        
        if (Math.abs(beta2) > 0.001) {
            for (let px = padding; px <= canvas.width - padding; px += 2) {
                const coord = canvasToData(px, 0);
                const x1 = coord.x1;
                const x2 = (offset - beta0 - beta1 * x1) / beta2;
                
                if (x2 >= 0 && x2 <= 1) {
                    const pos = dataToCanvas(x1, x2);
                    if (!started) {
                        ctx.moveTo(pos.x, pos.y);
                        started = true;
                    } else {
                        ctx.lineTo(pos.x, pos.y);
                    }
                }
            }
        } else if (Math.abs(beta1) > 0.001) {
            const x1 = (offset - beta0) / beta1;
            if (x1 >= 0 && x1 <= 1) {
                const top = dataToCanvas(x1, 1);
                const bottom = dataToCanvas(x1, 0);
                ctx.moveTo(top.x, top.y);
                ctx.lineTo(bottom.x, bottom.y);
            }
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Márgenes
    drawLine(1, COLORS.marginLine, true, 2);
    drawLine(-1, COLORS.marginLine, true, 2);
    
    // Hiperplano
    drawLine(0, COLORS.hyperplane, false, 3);
}

function drawSlackLines() {
    const norm = betaNorm();
    if (norm < 0.001) return;
    
    // Dirección perpendicular al hiperplano
    const perpX = beta1 / norm;
    const perpY = beta2 / norm;
    
    for (let i = 0; i < data.length; i++) {
        const p = data[i];
        const xi = slackVariables[i];
        
        if (xi > 0.01) {
            // Dibujar línea desde el punto hasta donde debería estar
            const pos = dataToCanvas(p.x1, p.x2);
            
            // El punto debería estar en el margen: yᵢ(f(x)) = 1
            // Distancia que falta = ξᵢ / ||β||
            const slackDist = xi / norm;
            
            // Dirección hacia el lado correcto
            const dir = p.label;
            const targetX1 = p.x1 + dir * perpX * slackDist;
            const targetX2 = p.x2 + dir * perpY * slackDist;
            const targetPos = dataToCanvas(targetX1, targetX2);
            
            // Línea de slack
            ctx.strokeStyle = COLORS.slack;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(targetPos.x, targetPos.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Etiqueta ξᵢ
            const midX = (pos.x + targetPos.x) / 2;
            const midY = (pos.y + targetPos.y) / 2;
            
            ctx.fillStyle = COLORS.error;
            ctx.font = 'bold 10px Source Sans Pro';
            ctx.textAlign = 'center';
            ctx.fillText(`ξ=${xi.toFixed(2)}`, midX + 15, midY);
        }
    }
}

// Actualizar métricas
function updateMetrics() {
    // Accuracy
    let correct = 0;
    for (let i = 0; i < data.length; i++) {
        if (pointStatus[i] !== 'error') correct++;
    }
    const accuracy = data.length > 0 ? (correct / data.length * 100) : 100;
    metricAccuracy.textContent = accuracy.toFixed(1) + '%';
    
    // Margen
    const margin = computeMargin();
    metricMargin.textContent = isFinite(margin) ? margin.toFixed(3) : '∞';
    
    // Violaciones
    const violations = pointStatus.filter(s => s !== 'correct').length;
    metricViolations.textContent = violations;
    
    // Vectores de soporte
    metricSV.textContent = supportVectors.length;
    
    // Suma de slack
    const totalSlack = slackVariables.reduce((s, xi) => s + xi, 0);
    sumSlack.textContent = totalSlack.toFixed(3);
}

// Actualizar explicación de C
function updateCExplanation() {
    let text, colorClass;
    
    if (C < 0.1) {
        text = `<span class="highlight c-small">C = ${C.toFixed(2)}:</span> Margen muy grande. Alta tolerancia a errores. Posible underfitting.`;
        colorClass = 'c-small';
    } else if (C < 1) {
        text = `<span class="highlight c-small">C = ${C.toFixed(2)}:</span> Margen grande. Permite algunas violaciones. Buena generalización.`;
        colorClass = 'c-small';
    } else if (C < 10) {
        text = `<span class="highlight">C = ${C.toFixed(2)}:</span> Balance entre margen y errores.`;
        colorClass = '';
    } else if (C < 100) {
        text = `<span class="highlight c-large">C = ${C.toFixed(2)}:</span> Margen pequeño. Pocas violaciones permitidas.`;
        colorClass = 'c-large';
    } else {
        text = `<span class="highlight c-large">C = ${C.toFixed(2)}:</span> Casi hard margin. Muy sensible a outliers. Posible overfitting.`;
        colorClass = 'c-large';
    }
    
    cExplanation.innerHTML = text;
}

// Presets de datos
const presets = {
    overlap: () => {
        data = [
            // Clase -1 (algunos se mezclan)
            { x1: 0.2, x2: 0.3, label: -1 },
            { x1: 0.25, x2: 0.5, label: -1 },
            { x1: 0.3, x2: 0.25, label: -1 },
            { x1: 0.15, x2: 0.4, label: -1 },
            { x1: 0.35, x2: 0.45, label: -1 },  // Cerca del overlap
            { x1: 0.4, x2: 0.35, label: -1 },   // En el overlap
            // Clase +1 (algunos se mezclan)
            { x1: 0.6, x2: 0.55, label: +1 },
            { x1: 0.65, x2: 0.7, label: +1 },
            { x1: 0.7, x2: 0.6, label: +1 },
            { x1: 0.75, x2: 0.75, label: +1 },
            { x1: 0.5, x2: 0.5, label: +1 },    // En el overlap
            { x1: 0.55, x2: 0.45, label: +1 }   // Cerca del overlap
        ];
    },
    outlier: () => {
        data = [
            // Clase -1 bien separada
            { x1: 0.15, x2: 0.2, label: -1 },
            { x1: 0.2, x2: 0.35, label: -1 },
            { x1: 0.25, x2: 0.15, label: -1 },
            { x1: 0.3, x2: 0.3, label: -1 },
            { x1: 0.2, x2: 0.5, label: -1 },
            // Outlier de clase -1 en territorio +1
            { x1: 0.7, x2: 0.65, label: -1 },
            // Clase +1 bien separada
            { x1: 0.7, x2: 0.75, label: +1 },
            { x1: 0.75, x2: 0.6, label: +1 },
            { x1: 0.8, x2: 0.8, label: +1 },
            { x1: 0.85, x2: 0.7, label: +1 },
            { x1: 0.75, x2: 0.85, label: +1 }
        ];
    },
    noisy: () => {
        data = [];
        // Generar puntos ruidosos
        for (let i = 0; i < 8; i++) {
            data.push({
                x1: 0.15 + Math.random() * 0.35,
                x2: 0.15 + Math.random() * 0.35 + (Math.random() < 0.2 ? 0.3 : 0),
                label: -1
            });
        }
        for (let i = 0; i < 8; i++) {
            data.push({
                x1: 0.5 + Math.random() * 0.4,
                x2: 0.5 + Math.random() * 0.4 - (Math.random() < 0.2 ? 0.3 : 0),
                label: +1
            });
        }
    },
    separable: () => {
        data = [
            // Clase -1 perfectamente separable
            { x1: 0.15, x2: 0.2, label: -1 },
            { x1: 0.2, x2: 0.4, label: -1 },
            { x1: 0.25, x2: 0.15, label: -1 },
            { x1: 0.3, x2: 0.35, label: -1 },
            { x1: 0.2, x2: 0.55, label: -1 },
            // Clase +1 perfectamente separable
            { x1: 0.7, x2: 0.65, label: +1 },
            { x1: 0.75, x2: 0.5, label: +1 },
            { x1: 0.8, x2: 0.75, label: +1 },
            { x1: 0.85, x2: 0.6, label: +1 },
            { x1: 0.75, x2: 0.85, label: +1 }
        ];
    }
};

// Event Listeners
cSlider.addEventListener('input', () => {
    // Slider va de -2 a 3 (escala logarítmica)
    const sliderVal = parseFloat(cSlider.value);
    C = Math.pow(10, sliderVal);
    cValueEl.textContent = C.toFixed(2);
    
    updateCExplanation();
    findOptimalHyperplane();
    render();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (presets[preset]) {
            presets[preset]();
            findOptimalHyperplane();
            render();
        }
    });
});

resetBtn.addEventListener('click', () => {
    C = 1.0;
    cSlider.value = 0;
    cValueEl.textContent = '1.00';
    updateCExplanation();
    presets.overlap();
    findOptimalHyperplane();
    render();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    presets.overlap();
    updateCExplanation();
    findOptimalHyperplane();
    render();
});
