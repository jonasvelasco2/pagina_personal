// SVM: Margen Máximo y Vectores de Soporte

// Estado global
let data = [];  // Array de {x1, x2, label} donde label es -1 o +1
let beta0 = 0, beta1 = 1, beta2 = 1;  // Parámetros del hiperplano
let mode = 'optimal';  // 'optimal' o 'manual'
let supportVectors = [];
let draggingPoint = null;

// Canvas y contexto
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const b0Slider = document.getElementById('b0Slider');
const b1Slider = document.getElementById('b1Slider');
const b2Slider = document.getElementById('b2Slider');
const b0Value = document.getElementById('b0Value');
const b1Value = document.getElementById('b1Value');
const b2Value = document.getElementById('b2Value');

const marginValue = document.getElementById('marginValue');
const equationBox = document.getElementById('equationBox');
const svCount = document.getElementById('svCount');

const optimizeBtn = document.getElementById('optimizeBtn');
const resetBtn = document.getElementById('resetBtn');

// Colores
const COLORS = {
    classNeg: '#0073bb',
    classPos: '#ff9900',
    hyperplane: '#333333',
    margin: '#888888',
    supportVector: '#7b68ee',
    regionNeg: 'rgba(0, 115, 187, 0.1)',
    regionPos: 'rgba(255, 153, 0, 0.1)'
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

// Calcular el valor del hiperplano: β₀ + β₁x₁ + β₂x₂
function hyperplaneValue(x1, x2) {
    return beta0 + beta1 * x1 + beta2 * x2;
}

// Calcular la norma de β (||β||)
function betaNorm() {
    return Math.sqrt(beta1 * beta1 + beta2 * beta2);
}

// Calcular el margen M = 1/||β||
function computeMargin() {
    const norm = betaNorm();
    if (norm < 0.001) return Infinity;
    return 1 / norm;
}

// Calcular distancia de un punto al hiperplano
function distanceToHyperplane(x1, x2) {
    const norm = betaNorm();
    if (norm < 0.001) return Infinity;
    return Math.abs(hyperplaneValue(x1, x2)) / norm;
}

// Encontrar el hiperplano óptimo (simplificado)
// Usamos un algoritmo de búsqueda por gradiente para maximizar el margen
function findOptimalHyperplane() {
    if (data.length < 2) return;
    
    // Verificar que hay puntos de ambas clases
    const hasNeg = data.some(p => p.label === -1);
    const hasPos = data.some(p => p.label === +1);
    if (!hasNeg || !hasPos) return;
    
    // Inicializar con la línea que conecta los centroides
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
    
    // Vector perpendicular a la línea entre centroides
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
    
    // Punto medio entre centroides
    const midX = (negCentroid.x1 + posCentroid.x1) / 2;
    const midY = (negCentroid.x2 + posCentroid.x2) / 2;
    beta0 = -(beta1 * midX + beta2 * midY);
    
    // Optimizar usando descenso de gradiente para SVM (hard margin simplificado)
    // Maximizar el margen mientras clasifica correctamente
    const lr = 0.01;
    const iterations = 500;
    
    for (let iter = 0; iter < iterations; iter++) {
        // Encontrar el punto más cercano al hiperplano de cada clase
        let minDistNeg = Infinity, minDistPos = Infinity;
        let closestNeg = null, closestPos = null;
        
        for (const p of data) {
            const dist = distanceToHyperplane(p.x1, p.x2);
            const side = hyperplaneValue(p.x1, p.x2);
            
            if (p.label === -1 && dist < minDistNeg) {
                minDistNeg = dist;
                closestNeg = p;
            }
            if (p.label === +1 && dist < minDistPos) {
                minDistPos = dist;
                closestPos = p;
            }
        }
        
        if (!closestNeg || !closestPos) break;
        
        // Verificar clasificación correcta
        let allCorrect = true;
        for (const p of data) {
            const pred = hyperplaneValue(p.x1, p.x2);
            if (p.label === -1 && pred > 0) allCorrect = false;
            if (p.label === +1 && pred < 0) allCorrect = false;
        }
        
        if (!allCorrect) {
            // Ajustar para clasificar correctamente
            for (const p of data) {
                const pred = hyperplaneValue(p.x1, p.x2);
                if (p.label === -1 && pred > -0.01) {
                    beta0 -= lr * 2;
                    beta1 -= lr * 2 * p.x1;
                    beta2 -= lr * 2 * p.x2;
                }
                if (p.label === +1 && pred < 0.01) {
                    beta0 += lr * 2;
                    beta1 += lr * 2 * p.x1;
                    beta2 += lr * 2 * p.x2;
                }
            }
        } else {
            // Maximizar margen (reducir ||β||)
            const norm = betaNorm();
            if (norm > 0.1) {
                // Gradiente de ||β||² es 2*β
                beta1 -= lr * 0.1 * beta1 / norm;
                beta2 -= lr * 0.1 * beta2 / norm;
            }
        }
    }
    
    // Normalizar para que el margen funcional sea 1
    normalizeHyperplane();
    
    // Encontrar vectores de soporte
    findSupportVectors();
    
    // Actualizar UI
    updateSliders();
    updateDisplay();
}

// Normalizar hiperplano para que los puntos más cercanos tengan |f(x)| = 1
function normalizeHyperplane() {
    if (data.length === 0) return;
    
    let minAbsValue = Infinity;
    for (const p of data) {
        const val = Math.abs(hyperplaneValue(p.x1, p.x2));
        if (val < minAbsValue && val > 0.001) {
            minAbsValue = val;
        }
    }
    
    if (minAbsValue > 0.001 && minAbsValue < Infinity) {
        beta0 /= minAbsValue;
        beta1 /= minAbsValue;
        beta2 /= minAbsValue;
    }
}

// Encontrar vectores de soporte (puntos en el margen)
function findSupportVectors() {
    supportVectors = [];
    const margin = computeMargin();
    const tolerance = margin * 0.1 + 0.05;
    
    for (const p of data) {
        const dist = distanceToHyperplane(p.x1, p.x2);
        if (Math.abs(dist - margin) < tolerance) {
            supportVectors.push(p);
        }
    }
    
    // Si no encontramos ninguno, tomar los más cercanos
    if (supportVectors.length === 0 && data.length > 0) {
        const sorted = [...data].sort((a, b) => 
            distanceToHyperplane(a.x1, a.x2) - distanceToHyperplane(b.x1, b.x2)
        );
        supportVectors = sorted.slice(0, Math.min(3, sorted.length));
    }
}

// Renderizar
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar regiones coloreadas
    if (betaNorm() > 0.001) {
        drawRegions();
    }
    
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
    
    // Axes
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
    
    // Axis labels
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
    
    // Dibujar hiperplano y márgenes
    if (betaNorm() > 0.001) {
        drawHyperplaneAndMargins();
    }
    
    // Dibujar puntos
    for (const p of data) {
        const pos = dataToCanvas(p.x1, p.x2);
        const isSV = supportVectors.includes(p);
        
        // Anillo exterior para vectores de soporte (morado)
        if (isSV) {
            ctx.strokeStyle = COLORS.supportVector;  // #7b68ee (morado)
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Borde blanco para contraste
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Punto principal
        ctx.fillStyle = p.label === -1 ? COLORS.classNeg : COLORS.classPos;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Centro blanco
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Etiqueta
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Source Sans Pro';
        ctx.textAlign = 'center';
        ctx.fillText(p.label === -1 ? '-1' : '+1', pos.x, pos.y + 25);
    }
}

function drawRegions() {
    const resolution = 5;
    
    for (let px = padding; px < canvas.width - padding; px += resolution) {
        for (let py = padding; py < canvas.height - padding; py += resolution) {
            const coord = canvasToData(px, py);
            const val = hyperplaneValue(coord.x1, coord.x2);
            
            if (val < 0) {
                ctx.fillStyle = COLORS.regionNeg;
            } else {
                ctx.fillStyle = COLORS.regionPos;
            }
            ctx.fillRect(px, py, resolution, resolution);
        }
    }
}

function drawHyperplaneAndMargins() {
    const norm = betaNorm();
    const margin = 1 / norm;
    
    // Función para obtener x2 dado x1 y un offset
    // β₀ + β₁x₁ + β₂x₂ = offset => x₂ = (offset - β₀ - β₁x₁) / β₂
    
    function drawLine(offset, color, dashed) {
        ctx.strokeStyle = color;
        ctx.lineWidth = dashed ? 2 : 3;
        ctx.setLineDash(dashed ? [5, 5] : []);
        ctx.beginPath();
        
        let started = false;
        
        if (Math.abs(beta2) > 0.001) {
            // Dibujar como función de x1
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
            // Línea vertical: x1 = (offset - β₀) / β₁
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
    
    // Márgenes (β₀ + β₁x₁ + β₂x₂ = ±1)
    drawLine(1, COLORS.margin, true);   // Margen positivo
    drawLine(-1, COLORS.margin, true);  // Margen negativo
    
    // Hiperplano principal (β₀ + β₁x₁ + β₂x₂ = 0)
    drawLine(0, COLORS.hyperplane, false);
    
    // Dibujar el ancho del margen
    if (data.length > 0) {
        // Encontrar un punto en el hiperplano
        let x1_mid, x2_mid;
        if (Math.abs(beta2) > 0.001) {
            x1_mid = 0.5;
            x2_mid = (-beta0 - beta1 * x1_mid) / beta2;
        } else {
            x1_mid = -beta0 / beta1;
            x2_mid = 0.5;
        }
        
        // Solo dibujar si está en rango
        if (x1_mid >= 0 && x1_mid <= 1 && x2_mid >= 0 && x2_mid <= 1) {
            const midPos = dataToCanvas(x1_mid, x2_mid);
            
            // Dirección perpendicular al hiperplano (normalizada)
            const perpX = beta1 / norm;
            const perpY = beta2 / norm;
            
            // Puntos en los márgenes
            const margin_px = margin * plotWidth;  // Aproximación visual
            
            ctx.strokeStyle = COLORS.supportVector;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            
            // Línea perpendicular mostrando el margen
            const p1 = dataToCanvas(x1_mid + perpX * margin, x2_mid + perpY * margin);
            const p2 = dataToCanvas(x1_mid - perpX * margin, x2_mid - perpY * margin);
            
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Etiqueta "M"
            ctx.fillStyle = COLORS.supportVector;
            ctx.font = 'bold 14px Source Sans Pro';
            ctx.textAlign = 'center';
            ctx.fillText('M', midPos.x + 20, midPos.y);
        }
    }
}

// Actualizar display
function updateDisplay() {
    const margin = computeMargin();
    marginValue.textContent = isFinite(margin) ? margin.toFixed(3) : '∞';
    
    // Ecuación del hiperplano
    const b0Str = beta0 >= 0 ? beta0.toFixed(2) : `(${beta0.toFixed(2)})`;
    const b1Str = beta1 >= 0 ? `+ ${beta1.toFixed(2)}` : `- ${Math.abs(beta1).toFixed(2)}`;
    const b2Str = beta2 >= 0 ? `+ ${beta2.toFixed(2)}` : `- ${Math.abs(beta2).toFixed(2)}`;
    equationBox.textContent = `${b0Str} ${b1Str}·x₁ ${b2Str}·x₂ = 0`;
    
    // Vectores de soporte
    svCount.textContent = supportVectors.length;
}

function updateSliders() {
    b0Slider.value = beta0;
    b1Slider.value = beta1;
    b2Slider.value = beta2;
    
    b0Value.textContent = beta0.toFixed(2);
    b1Value.textContent = beta1.toFixed(2);
    b2Value.textContent = beta2.toFixed(2);
}

// Drag and drop puntos
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    // Buscar punto cercano
    for (const p of data) {
        const pos = dataToCanvas(p.x1, p.x2);
        const dist = Math.sqrt((px - pos.x)**2 + (py - pos.y)**2);
        if (dist < 15) {
            draggingPoint = p;
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!draggingPoint) return;
    
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const coord = canvasToData(px, py);
    
    // Limitar al área de ploteo
    draggingPoint.x1 = Math.max(0.05, Math.min(0.95, coord.x1));
    draggingPoint.x2 = Math.max(0.05, Math.min(0.95, coord.x2));
    
    if (mode === 'optimal') {
        findOptimalHyperplane();
    } else {
        findSupportVectors();
        updateDisplay();
    }
    
    render();
});

canvas.addEventListener('mouseup', () => {
    draggingPoint = null;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
    draggingPoint = null;
    canvas.style.cursor = 'grab';
});

// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        
        // Habilitar/deshabilitar sliders
        const disabled = mode === 'optimal';
        b0Slider.disabled = disabled;
        b1Slider.disabled = disabled;
        b2Slider.disabled = disabled;
        
        if (mode === 'optimal') {
            findOptimalHyperplane();
        }
        
        render();
    });
});

// Sliders
b0Slider.addEventListener('input', () => {
    if (mode === 'manual') {
        beta0 = parseFloat(b0Slider.value);
        b0Value.textContent = beta0.toFixed(2);
        findSupportVectors();
        updateDisplay();
        render();
    }
});

b1Slider.addEventListener('input', () => {
    if (mode === 'manual') {
        beta1 = parseFloat(b1Slider.value);
        b1Value.textContent = beta1.toFixed(2);
        findSupportVectors();
        updateDisplay();
        render();
    }
});

b2Slider.addEventListener('input', () => {
    if (mode === 'manual') {
        beta2 = parseFloat(b2Slider.value);
        b2Value.textContent = beta2.toFixed(2);
        findSupportVectors();
        updateDisplay();
        render();
    }
});

// Optimize button
optimizeBtn.addEventListener('click', () => {
    // Cambiar a modo óptimo
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.mode-btn[data-mode="optimal"]').classList.add('active');
    mode = 'optimal';
    
    b0Slider.disabled = true;
    b1Slider.disabled = true;
    b2Slider.disabled = true;
    
    findOptimalHyperplane();
    render();
});

// Presets
const presets = {
    simple: () => {
        data = [
            { x1: 0.2, x2: 0.3, label: -1 },
            { x1: 0.25, x2: 0.5, label: -1 },
            { x1: 0.3, x2: 0.2, label: -1 },
            { x1: 0.15, x2: 0.4, label: -1 },
            { x1: 0.7, x2: 0.6, label: +1 },
            { x1: 0.75, x2: 0.8, label: +1 },
            { x1: 0.8, x2: 0.7, label: +1 },
            { x1: 0.85, x2: 0.5, label: +1 }
        ];
    },
    diagonal: () => {
        data = [
            { x1: 0.1, x2: 0.2, label: -1 },
            { x1: 0.2, x2: 0.3, label: -1 },
            { x1: 0.3, x2: 0.15, label: -1 },
            { x1: 0.25, x2: 0.1, label: -1 },
            { x1: 0.6, x2: 0.85, label: +1 },
            { x1: 0.7, x2: 0.9, label: +1 },
            { x1: 0.8, x2: 0.75, label: +1 },
            { x1: 0.85, x2: 0.8, label: +1 }
        ];
    },
    close: () => {
        data = [
            { x1: 0.35, x2: 0.4, label: -1 },
            { x1: 0.3, x2: 0.5, label: -1 },
            { x1: 0.4, x2: 0.35, label: -1 },
            { x1: 0.25, x2: 0.45, label: -1 },
            { x1: 0.55, x2: 0.6, label: +1 },
            { x1: 0.6, x2: 0.55, label: +1 },
            { x1: 0.65, x2: 0.65, label: +1 },
            { x1: 0.7, x2: 0.5, label: +1 }
        ];
    },
    spread: () => {
        data = [
            { x1: 0.1, x2: 0.1, label: -1 },
            { x1: 0.15, x2: 0.8, label: -1 },
            { x1: 0.2, x2: 0.4, label: -1 },
            { x1: 0.3, x2: 0.6, label: -1 },
            { x1: 0.7, x2: 0.3, label: +1 },
            { x1: 0.8, x2: 0.7, label: +1 },
            { x1: 0.85, x2: 0.2, label: +1 },
            { x1: 0.9, x2: 0.9, label: +1 }
        ];
    }
};

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (presets[preset]) {
            presets[preset]();
            
            if (mode === 'optimal') {
                findOptimalHyperplane();
            } else {
                findSupportVectors();
                updateDisplay();
            }
            
            render();
        }
    });
});

// Reset
resetBtn.addEventListener('click', () => {
    presets.simple();
    
    if (mode === 'optimal') {
        findOptimalHyperplane();
    } else {
        beta0 = 0;
        beta1 = 1;
        beta2 = 1;
        updateSliders();
        findSupportVectors();
        updateDisplay();
    }
    
    render();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    presets.simple();
    findOptimalHyperplane();
    render();
});
