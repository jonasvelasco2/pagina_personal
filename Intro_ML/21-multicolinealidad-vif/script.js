// Multicolinealidad y VIF - Visualización interactiva

// Estado global
let corr12 = 0, corr13 = 0, corr23 = 0;
let n = 100;
let simulationResults = [];

// Coeficientes verdaderos
const trueBeta = [2.0, -1.5, 1.0];

// DOM Elements
const corr12Slider = document.getElementById('corr12Slider');
const corr13Slider = document.getElementById('corr13Slider');
const corr23Slider = document.getElementById('corr23Slider');
const nSlider = document.getElementById('nSlider');

const corr12Value = document.getElementById('corr12Value');
const corr13Value = document.getElementById('corr13Value');
const corr23Value = document.getElementById('corr23Value');
const nValue = document.getElementById('nValue');

const histogramCanvas = document.getElementById('histogramCanvas');
const histCtx = histogramCanvas.getContext('2d');

const simulateBtn = document.getElementById('simulateBtn');
const newSampleBtn = document.getElementById('newSampleBtn');
const warningBox = document.getElementById('warningBox');
const warningText = document.getElementById('warningText');

// Colores
const COLORS = {
    positive: '#d13212',
    negative: '#0073bb',
    neutral: '#e8e8e8',
    green: '#1d8102',
    orange: '#ff9900',
    red: '#d13212',
    blue: '#0073bb'
};

// Funciones de utilidad matemática

// Generador de números aleatorios normales (Box-Muller)
function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generar datos multivariados con correlaciones especificadas
function generateCorrelatedData(n, r12, r13, r23) {
    // Matriz de correlación
    const R = [
        [1, r12, r13],
        [r12, 1, r23],
        [r13, r23, 1]
    ];
    
    // Verificar que la matriz sea semidefinida positiva
    // Descomposición de Cholesky (simplificada)
    const L = choleskyDecomposition(R);
    if (!L) {
        // Si la matriz no es válida, ajustar las correlaciones
        return null;
    }
    
    // Generar datos
    const X1 = [], X2 = [], X3 = [], Y = [];
    
    for (let i = 0; i < n; i++) {
        // Variables independientes estándar
        const z1 = randn();
        const z2 = randn();
        const z3 = randn();
        
        // Aplicar Cholesky para correlacionar
        const x1 = L[0][0] * z1;
        const x2 = L[1][0] * z1 + L[1][1] * z2;
        const x3 = L[2][0] * z1 + L[2][1] * z2 + L[2][2] * z3;
        
        X1.push(x1);
        X2.push(x2);
        X3.push(x3);
        
        // Y = β₀ + β₁X₁ + β₂X₂ + β₃X₃ + ε
        const y = trueBeta[0] * x1 + trueBeta[1] * x2 + trueBeta[2] * x3 + randn() * 0.5;
        Y.push(y);
    }
    
    return { X1, X2, X3, Y };
}

// Descomposición de Cholesky
function choleskyDecomposition(A) {
    const n = A.length;
    const L = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            
            if (j === i) {
                for (let k = 0; k < j; k++) {
                    sum += L[j][k] * L[j][k];
                }
                const val = A[i][i] - sum;
                if (val <= 0) return null;  // Matriz no es definida positiva
                L[i][j] = Math.sqrt(val);
            } else {
                for (let k = 0; k < j; k++) {
                    sum += L[i][k] * L[j][k];
                }
                L[i][j] = (A[i][j] - sum) / L[j][j];
            }
        }
    }
    
    return L;
}

// Regresión lineal múltiple por OLS
function linearRegression(Y, X1, X2, X3) {
    const n = Y.length;
    
    // Construir matriz de diseño X = [1, X1, X2, X3] (incluyendo intercepto)
    // Pero solo estimamos β₁, β₂, β₃ (asumiendo datos centrados)
    
    // Centrar datos
    const meanY = Y.reduce((a, b) => a + b, 0) / n;
    const meanX1 = X1.reduce((a, b) => a + b, 0) / n;
    const meanX2 = X2.reduce((a, b) => a + b, 0) / n;
    const meanX3 = X3.reduce((a, b) => a + b, 0) / n;
    
    const y = Y.map(v => v - meanY);
    const x1 = X1.map(v => v - meanX1);
    const x2 = X2.map(v => v - meanX2);
    const x3 = X3.map(v => v - meanX3);
    
    // X'X
    const XX = [
        [dot(x1, x1), dot(x1, x2), dot(x1, x3)],
        [dot(x2, x1), dot(x2, x2), dot(x2, x3)],
        [dot(x3, x1), dot(x3, x2), dot(x3, x3)]
    ];
    
    // X'Y
    const XY = [dot(x1, y), dot(x2, y), dot(x3, y)];
    
    // β = (X'X)^(-1) X'Y
    const XXinv = invert3x3(XX);
    if (!XXinv) return null;
    
    const beta = [
        XXinv[0][0] * XY[0] + XXinv[0][1] * XY[1] + XXinv[0][2] * XY[2],
        XXinv[1][0] * XY[0] + XXinv[1][1] * XY[1] + XXinv[1][2] * XY[2],
        XXinv[2][0] * XY[0] + XXinv[2][1] * XY[1] + XXinv[2][2] * XY[2]
    ];
    
    // Calcular residuos y varianza del error
    let sse = 0;
    for (let i = 0; i < n; i++) {
        const yhat = beta[0] * x1[i] + beta[1] * x2[i] + beta[2] * x3[i];
        sse += (y[i] - yhat) ** 2;
    }
    const sigma2 = sse / (n - 3);
    
    // Errores estándar: sqrt(sigma² * diag((X'X)^(-1)))
    const se = [
        Math.sqrt(sigma2 * XXinv[0][0]),
        Math.sqrt(sigma2 * XXinv[1][1]),
        Math.sqrt(sigma2 * XXinv[2][2])
    ];
    
    return { beta, se };
}

// Producto punto
function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

// Inversión de matriz 3x3
function invert3x3(A) {
    const det = 
        A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
        A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
        A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    
    if (Math.abs(det) < 1e-10) return null;
    
    const invDet = 1 / det;
    
    return [
        [
            (A[1][1] * A[2][2] - A[1][2] * A[2][1]) * invDet,
            (A[0][2] * A[2][1] - A[0][1] * A[2][2]) * invDet,
            (A[0][1] * A[1][2] - A[0][2] * A[1][1]) * invDet
        ],
        [
            (A[1][2] * A[2][0] - A[1][0] * A[2][2]) * invDet,
            (A[0][0] * A[2][2] - A[0][2] * A[2][0]) * invDet,
            (A[0][2] * A[1][0] - A[0][0] * A[1][2]) * invDet
        ],
        [
            (A[1][0] * A[2][1] - A[1][1] * A[2][0]) * invDet,
            (A[0][1] * A[2][0] - A[0][0] * A[2][1]) * invDet,
            (A[0][0] * A[1][1] - A[0][1] * A[1][0]) * invDet
        ]
    ];
}

// Calcular VIF
function computeVIF(r12, r13, r23) {
    // VIF(X₁) = 1 / (1 - R²₁)
    // donde R²₁ es R² de regresionar X₁ sobre X₂ y X₃
    
    // Para el caso de 3 variables, el R² de X₁ ~ X₂ + X₃ se puede calcular
    // usando la fórmula de regresión múltiple con correlaciones
    
    // R²₁ = (r₁₂² + r₁₃² - 2*r₁₂*r₁₃*r₂₃) / (1 - r₂₃²)
    const denom23 = 1 - r23 * r23;
    
    let R2_1, R2_2, R2_3;
    
    if (Math.abs(denom23) < 1e-10) {
        R2_1 = Math.max(r12 * r12, r13 * r13);
    } else {
        R2_1 = (r12 * r12 + r13 * r13 - 2 * r12 * r13 * r23) / denom23;
    }
    
    const denom13 = 1 - r13 * r13;
    if (Math.abs(denom13) < 1e-10) {
        R2_2 = Math.max(r12 * r12, r23 * r23);
    } else {
        R2_2 = (r12 * r12 + r23 * r23 - 2 * r12 * r23 * r13) / denom13;
    }
    
    const denom12 = 1 - r12 * r12;
    if (Math.abs(denom12) < 1e-10) {
        R2_3 = Math.max(r13 * r13, r23 * r23);
    } else {
        R2_3 = (r13 * r13 + r23 * r23 - 2 * r13 * r23 * r12) / denom12;
    }
    
    // Limitar R² a [0, 0.9999]
    R2_1 = Math.max(0, Math.min(0.9999, R2_1));
    R2_2 = Math.max(0, Math.min(0.9999, R2_2));
    R2_3 = Math.max(0, Math.min(0.9999, R2_3));
    
    const VIF1 = 1 / (1 - R2_1);
    const VIF2 = 1 / (1 - R2_2);
    const VIF3 = 1 / (1 - R2_3);
    
    return [VIF1, VIF2, VIF3];
}

// Renderizar heatmap de correlación
function renderHeatmap() {
    const heatmap = document.getElementById('heatmap');
    
    const correlations = [
        [1, corr12, corr13],
        [corr12, 1, corr23],
        [corr13, corr23, 1]
    ];
    
    const labels = ['X₁', 'X₂', 'X₃'];
    
    let html = '';
    
    // Header row
    html += '<div class="heatmap-cell heatmap-header"></div>';
    for (const label of labels) {
        html += `<div class="heatmap-cell heatmap-header">${label}</div>`;
    }
    
    // Data rows
    for (let i = 0; i < 3; i++) {
        html += `<div class="heatmap-cell heatmap-row-header">${labels[i]}</div>`;
        for (let j = 0; j < 3; j++) {
            const val = correlations[i][j];
            const color = getCorrelationColor(val);
            const textColor = Math.abs(val) > 0.5 ? 'white' : 'var(--text-primary)';
            html += `<div class="heatmap-cell" style="background: ${color}; color: ${textColor};">${val.toFixed(2)}</div>`;
        }
    }
    
    heatmap.innerHTML = html;
}

function getCorrelationColor(r) {
    if (r >= 0) {
        // Positivo: blanco a rojo
        const intensity = Math.abs(r);
        const red = 209;
        const green = Math.round(50 + (1 - intensity) * 200);
        const blue = Math.round(18 + (1 - intensity) * 230);
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // Negativo: blanco a azul
        const intensity = Math.abs(r);
        const red = Math.round((1 - intensity) * 255);
        const green = Math.round(115 + (1 - intensity) * 140);
        const blue = 187;
        return `rgb(${red}, ${green}, ${blue})`;
    }
}

// Actualizar VIF display
function updateVIF() {
    const [vif1, vif2, vif3] = computeVIF(corr12, corr13, corr23);
    
    updateVIFCard('vif1', 'vif1Card', 'vif1Interp', vif1);
    updateVIFCard('vif2', 'vif2Card', 'vif2Interp', vif2);
    updateVIFCard('vif3', 'vif3Card', 'vif3Interp', vif3);
    
    // Mostrar warning si hay multicolinealidad
    const maxVIF = Math.max(vif1, vif2, vif3);
    if (maxVIF >= 10) {
        warningBox.style.display = 'block';
        warningText.textContent = `VIF muy alto (${maxVIF.toFixed(1)}). Los coeficientes serán muy inestables y los errores estándar inflados.`;
    } else if (maxVIF >= 5) {
        warningBox.style.display = 'block';
        warningText.textContent = `VIF moderado (${maxVIF.toFixed(1)}). Puede haber cierta inestabilidad en las estimaciones.`;
    } else {
        warningBox.style.display = 'none';
    }
}

function updateVIFCard(valueId, cardId, interpId, vif) {
    const valueEl = document.getElementById(valueId);
    const cardEl = document.getElementById(cardId);
    const interpEl = document.getElementById(interpId);
    
    valueEl.textContent = vif.toFixed(2);
    
    // Reset classes
    valueEl.className = 'vif-value';
    cardEl.className = 'vif-card';
    
    if (vif < 5) {
        valueEl.classList.add('ok');
        interpEl.textContent = 'OK';
    } else if (vif < 10) {
        valueEl.classList.add('warning');
        cardEl.classList.add('warning');
        interpEl.textContent = 'Moderado';
    } else {
        valueEl.classList.add('danger');
        cardEl.classList.add('danger');
        interpEl.textContent = 'Problemático';
    }
}

// Actualizar coeficientes estimados
function updateCoefficients() {
    const data = generateCorrelatedData(n, corr12, corr13, corr23);
    
    if (!data) {
        document.getElementById('coef1').textContent = 'N/A';
        document.getElementById('coef2').textContent = 'N/A';
        document.getElementById('coef3').textContent = 'N/A';
        document.getElementById('se1').textContent = 'Matriz no válida';
        document.getElementById('se2').textContent = '';
        document.getElementById('se3').textContent = '';
        return;
    }
    
    const result = linearRegression(data.Y, data.X1, data.X2, data.X3);
    
    if (!result) {
        document.getElementById('coef1').textContent = 'N/A';
        document.getElementById('coef2').textContent = 'N/A';
        document.getElementById('coef3').textContent = 'N/A';
        return;
    }
    
    document.getElementById('coef1').textContent = result.beta[0].toFixed(3);
    document.getElementById('coef2').textContent = result.beta[1].toFixed(3);
    document.getElementById('coef3').textContent = result.beta[2].toFixed(3);
    
    document.getElementById('se1').textContent = `SE: ${result.se[0].toFixed(3)}`;
    document.getElementById('se2').textContent = `SE: ${result.se[1].toFixed(3)}`;
    document.getElementById('se3').textContent = `SE: ${result.se[2].toFixed(3)}`;
}

// Simular múltiples muestras
function runSimulation() {
    simulationResults = [];
    
    for (let i = 0; i < 100; i++) {
        const data = generateCorrelatedData(n, corr12, corr13, corr23);
        if (!data) continue;
        
        const result = linearRegression(data.Y, data.X1, data.X2, data.X3);
        if (result) {
            simulationResults.push(result.beta[0]);  // Guardamos β̂₁
        }
    }
    
    renderHistogram();
}

// Renderizar histograma
function renderHistogram() {
    const width = histogramCanvas.width;
    const height = histogramCanvas.height;
    const padding = 30;
    
    histCtx.clearRect(0, 0, width, height);
    
    // Fondo
    histCtx.fillStyle = '#f5f5f5';
    histCtx.fillRect(0, 0, width, height);
    
    if (simulationResults.length === 0) {
        histCtx.fillStyle = '#999';
        histCtx.font = '11px Source Sans Pro';
        histCtx.textAlign = 'center';
        histCtx.fillText('Haz clic en "Simular 100 muestras" para ver la variabilidad', width / 2, height / 2);
        return;
    }
    
    // Calcular bins
    const min = Math.min(...simulationResults);
    const max = Math.max(...simulationResults);
    const range = max - min || 1;
    const numBins = 15;
    const binWidth = range / numBins;
    
    const bins = Array(numBins).fill(0);
    for (const val of simulationResults) {
        const binIndex = Math.min(Math.floor((val - min) / binWidth), numBins - 1);
        bins[binIndex]++;
    }
    
    const maxCount = Math.max(...bins);
    
    // Dibujar barras
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    const barWidth = plotWidth / numBins - 2;
    
    for (let i = 0; i < numBins; i++) {
        const barHeight = (bins[i] / maxCount) * plotHeight;
        const x = padding + i * (plotWidth / numBins) + 1;
        const y = height - padding - barHeight;
        
        histCtx.fillStyle = COLORS.blue;
        histCtx.fillRect(x, y, barWidth, barHeight);
    }
    
    // Línea vertical en el valor verdadero
    const trueX = padding + ((trueBeta[0] - min) / range) * plotWidth;
    histCtx.strokeStyle = COLORS.green;
    histCtx.lineWidth = 2;
    histCtx.setLineDash([5, 3]);
    histCtx.beginPath();
    histCtx.moveTo(trueX, padding);
    histCtx.lineTo(trueX, height - padding);
    histCtx.stroke();
    histCtx.setLineDash([]);
    
    // Eje X
    histCtx.strokeStyle = '#999';
    histCtx.lineWidth = 1;
    histCtx.beginPath();
    histCtx.moveTo(padding, height - padding);
    histCtx.lineTo(width - padding, height - padding);
    histCtx.stroke();
    
    // Labels
    histCtx.fillStyle = '#666';
    histCtx.font = '9px Source Sans Pro';
    histCtx.textAlign = 'center';
    
    for (let i = 0; i <= 4; i++) {
        const val = min + (range * i / 4);
        const x = padding + (plotWidth * i / 4);
        histCtx.fillText(val.toFixed(2), x, height - padding + 12);
    }
    
    // Media y SD
    const mean = simulationResults.reduce((a, b) => a + b, 0) / simulationResults.length;
    const sd = Math.sqrt(simulationResults.reduce((a, b) => a + (b - mean) ** 2, 0) / simulationResults.length);
    
    histCtx.fillStyle = '#333';
    histCtx.font = 'bold 10px Source Sans Pro';
    histCtx.textAlign = 'left';
    histCtx.fillText(`Media: ${mean.toFixed(3)}, SD: ${sd.toFixed(3)}`, padding, 15);
    
    histCtx.fillStyle = COLORS.green;
    histCtx.textAlign = 'right';
    histCtx.fillText(`β₁ verdadero = ${trueBeta[0]}`, width - padding, 15);
}

// Presets
const presets = {
    none: { r12: 0, r13: 0, r23: 0 },
    moderate: { r12: 0.5, r13: 0.3, r23: 0.2 },
    high: { r12: 0.9, r13: 0.1, r23: 0.1 },
    perfect: { r12: 0.95, r13: 0.85, r23: 0.8 }
};

// Event Listeners
corr12Slider.addEventListener('input', () => {
    corr12 = parseFloat(corr12Slider.value);
    corr12Value.textContent = corr12.toFixed(2);
    update();
});

corr13Slider.addEventListener('input', () => {
    corr13 = parseFloat(corr13Slider.value);
    corr13Value.textContent = corr13.toFixed(2);
    update();
});

corr23Slider.addEventListener('input', () => {
    corr23 = parseFloat(corr23Slider.value);
    corr23Value.textContent = corr23.toFixed(2);
    update();
});

nSlider.addEventListener('input', () => {
    n = parseInt(nSlider.value);
    nValue.textContent = n;
    updateCoefficients();
});

simulateBtn.addEventListener('click', () => {
    runSimulation();
});

newSampleBtn.addEventListener('click', () => {
    updateCoefficients();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = presets[btn.dataset.preset];
        if (preset) {
            corr12 = preset.r12;
            corr13 = preset.r13;
            corr23 = preset.r23;
            
            corr12Slider.value = corr12;
            corr13Slider.value = corr13;
            corr23Slider.value = corr23;
            
            corr12Value.textContent = corr12.toFixed(2);
            corr13Value.textContent = corr13.toFixed(2);
            corr23Value.textContent = corr23.toFixed(2);
            
            update();
        }
    });
});

function update() {
    renderHeatmap();
    updateVIF();
    updateCoefficients();
    simulationResults = [];
    renderHistogram();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    update();
});
