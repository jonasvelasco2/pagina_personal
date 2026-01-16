// Regression Metrics Calculator
// Visualiza y compara diferentes métricas de regresión

// Colores
const COLORS = {
    point: '#0073bb',
    pointHover: '#005a94',
    outlier: '#ff9900',
    line: '#1e8e8e',
    residual: 'rgba(209, 50, 18, 0.6)',
    grid: '#e8e8e8'
};

// Estado global
let points = [];
let slope = 1;
let intercept = 0;
let showResiduals = true;
let autoFit = true;
let dragIndex = -1;
let hoverIndex = -1;

// Coordenadas del canvas
const PADDING = 50;
const AXIS_MIN = 0;
const AXIS_MAX = 100;

// Elementos del DOM
const canvas = document.getElementById('regressionCanvas');
const ctx = canvas.getContext('2d');

const showResidualsToggle = document.getElementById('showResiduals');
const autoFitToggle = document.getElementById('autoFit');
const addOutlierBtn = document.getElementById('addOutlierBtn');
const resetBtn = document.getElementById('resetBtn');
const sampleBtn = document.getElementById('sampleBtn');

const slopeSlider = document.getElementById('slopeSlider');
const slopeValue = document.getElementById('slopeValue');
const interceptSlider = document.getElementById('interceptSlider');
const interceptValue = document.getElementById('interceptValue');

const equationSlope = document.getElementById('equationSlope');
const equationIntercept = document.getElementById('equationIntercept');

const metricCards = document.querySelectorAll('.metric-card');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');

// Convertir coordenadas de datos a canvas
function dataToCanvas(x, y) {
    const scaleX = (canvas.width - 2 * PADDING) / (AXIS_MAX - AXIS_MIN);
    const scaleY = (canvas.height - 2 * PADDING) / (AXIS_MAX - AXIS_MIN);
    
    return {
        x: PADDING + (x - AXIS_MIN) * scaleX,
        y: canvas.height - PADDING - (y - AXIS_MIN) * scaleY
    };
}

// Convertir coordenadas de canvas a datos
function canvasToData(cx, cy) {
    const scaleX = (canvas.width - 2 * PADDING) / (AXIS_MAX - AXIS_MIN);
    const scaleY = (canvas.height - 2 * PADDING) / (AXIS_MAX - AXIS_MIN);
    
    return {
        x: AXIS_MIN + (cx - PADDING) / scaleX,
        y: AXIS_MIN + (canvas.height - PADDING - cy) / scaleY
    };
}

// Ajuste por mínimos cuadrados
function leastSquaresFit() {
    if (points.length < 2) {
        slope = 1;
        intercept = 0;
        return;
    }
    
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
    }
    
    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 0.0001) {
        slope = 0;
        intercept = sumY / n;
        return;
    }
    
    slope = (n * sumXY - sumX * sumY) / denom;
    intercept = (sumY - slope * sumX) / n;
}

// Predicción
function predict(x) {
    return slope * x + intercept;
}

// Calcular métricas
function calculateMetrics() {
    if (points.length === 0) {
        return { mae: 0, mse: 0, rmse: 0, mape: 0, r2: 0, r2adj: 0 };
    }
    
    const n = points.length;
    let sumAbsError = 0;
    let sumSquaredError = 0;
    let sumAbsPercentError = 0;
    let validMapeCount = 0;
    
    // Media de Y
    const meanY = points.reduce((s, p) => s + p.y, 0) / n;
    let ssTot = 0;
    let ssRes = 0;
    
    for (const p of points) {
        const yPred = predict(p.x);
        const error = p.y - yPred;
        
        sumAbsError += Math.abs(error);
        sumSquaredError += error * error;
        
        if (Math.abs(p.y) > 0.01) {
            sumAbsPercentError += Math.abs(error / p.y);
            validMapeCount++;
        }
        
        ssTot += Math.pow(p.y - meanY, 2);
        ssRes += Math.pow(error, 2);
    }
    
    const mae = sumAbsError / n;
    const mse = sumSquaredError / n;
    const rmse = Math.sqrt(mse);
    const mape = validMapeCount > 0 ? (sumAbsPercentError / validMapeCount) * 100 : 0;
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    
    // R² ajustado (p = 1 para regresión simple)
    const p = 1;
    const r2adj = n > p + 1 ? 1 - (1 - r2) * (n - 1) / (n - p - 1) : r2;
    
    return { mae, mse, rmse, mape, r2, r2adj };
}

// Actualizar métricas mostradas
function updateMetrics() {
    const metrics = calculateMetrics();
    
    document.getElementById('metricMAE').textContent = metrics.mae.toFixed(2);
    document.getElementById('metricMSE').textContent = metrics.mse.toFixed(2);
    document.getElementById('metricRMSE').textContent = metrics.rmse.toFixed(2);
    document.getElementById('metricMAPE').textContent = metrics.mape.toFixed(1) + '%';
    document.getElementById('metricR2').textContent = metrics.r2.toFixed(3);
    document.getElementById('metricR2Adj').textContent = metrics.r2adj.toFixed(3);
    
    // Colorear R² según valor
    const r2El = document.getElementById('metricR2');
    if (metrics.r2 >= 0.8) {
        r2El.style.color = '#1d8102';
    } else if (metrics.r2 >= 0.5) {
        r2El.style.color = '#ff9900';
    } else {
        r2El.style.color = '#d13212';
    }
    
    // Estadísticas
    document.getElementById('statPoints').textContent = points.length;
    document.getElementById('statOutliers').textContent = points.filter(p => p.isOutlier).length;
    
    if (points.length > 0) {
        const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
        const stdY = Math.sqrt(points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0) / points.length);
        document.getElementById('statMeanY').textContent = meanY.toFixed(1);
        document.getElementById('statStdY').textContent = stdY.toFixed(1);
    } else {
        document.getElementById('statMeanY').textContent = '—';
        document.getElementById('statStdY').textContent = '—';
    }
}

// Actualizar sliders y ecuación
function updateLineControls() {
    // Mapear slope a slider (rango visual)
    const slopeSliderVal = Math.round(slope * 100);
    slopeSlider.value = Math.max(-200, Math.min(200, slopeSliderVal));
    slopeValue.textContent = slope.toFixed(2);
    
    const interceptSliderVal = Math.round(intercept);
    interceptSlider.value = Math.max(-200, Math.min(200, interceptSliderVal));
    interceptValue.textContent = intercept.toFixed(2);
    
    equationSlope.textContent = slope.toFixed(2);
    equationIntercept.textContent = intercept.toFixed(2);
}

// Renderizar
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 100; i += 20) {
        const p1 = dataToCanvas(i, 0);
        const p2 = dataToCanvas(i, 100);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        
        const p3 = dataToCanvas(0, i);
        const p4 = dataToCanvas(100, i);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
    }
    
    // Dibujar ejes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    
    const origin = dataToCanvas(0, 0);
    const xEnd = dataToCanvas(100, 0);
    const yEnd = dataToCanvas(0, 100);
    
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();
    
    // Etiquetas de ejes
    ctx.fillStyle = '#666';
    ctx.font = '12px Source Sans Pro';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 100; i += 20) {
        const p = dataToCanvas(i, 0);
        ctx.fillText(i.toString(), p.x, p.y + 20);
        
        const p2 = dataToCanvas(0, i);
        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), p2.x - 10, p2.y + 4);
        ctx.textAlign = 'center';
    }
    
    // Dibujar línea de regresión
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    
    const lineStart = dataToCanvas(0, predict(0));
    const lineEnd = dataToCanvas(100, predict(100));
    
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.stroke();
    
    // Dibujar residuos
    if (showResiduals && points.length > 0) {
        ctx.strokeStyle = COLORS.residual;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        
        for (const p of points) {
            const pointCanvas = dataToCanvas(p.x, p.y);
            const predCanvas = dataToCanvas(p.x, predict(p.x));
            
            ctx.beginPath();
            ctx.moveTo(pointCanvas.x, pointCanvas.y);
            ctx.lineTo(predCanvas.x, predCanvas.y);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }
    
    // Dibujar puntos
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const canvasPos = dataToCanvas(p.x, p.y);
        
        ctx.beginPath();
        ctx.arc(canvasPos.x, canvasPos.y, i === hoverIndex ? 10 : 8, 0, 2 * Math.PI);
        
        if (p.isOutlier) {
            ctx.fillStyle = COLORS.outlier;
        } else {
            ctx.fillStyle = i === hoverIndex ? COLORS.pointHover : COLORS.point;
        }
        
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Encontrar punto cercano
function findNearPoint(cx, cy, threshold = 15) {
    for (let i = 0; i < points.length; i++) {
        const canvasPos = dataToCanvas(points[i].x, points[i].y);
        const dist = Math.sqrt(Math.pow(cx - canvasPos.x, 2) + Math.pow(cy - canvasPos.y, 2));
        if (dist < threshold) {
            return i;
        }
    }
    return -1;
}

// Generar datos de ejemplo
function generateSampleData() {
    points = [];
    
    // Generar puntos con tendencia lineal + ruido
    for (let i = 0; i < 20; i++) {
        const x = 10 + Math.random() * 80;
        const y = 0.8 * x + 10 + (Math.random() - 0.5) * 20;
        points.push({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            isOutlier: false
        });
    }
    
    if (autoFit) {
        leastSquaresFit();
        updateLineControls();
    }
    
    updateMetrics();
    render();
}

// Añadir outlier
function addOutlier() {
    const x = 20 + Math.random() * 60;
    const baseY = predict(x);
    // Outlier alejado de la línea
    const y = baseY > 50 ? baseY - 30 - Math.random() * 20 : baseY + 30 + Math.random() * 20;
    
    points.push({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        isOutlier: true
    });
    
    if (autoFit) {
        leastSquaresFit();
        updateLineControls();
    }
    
    updateMetrics();
    render();
    
    // Mostrar info sobre impacto de outliers
    infoTitle.textContent = 'Impacto de outliers';
    infoText.innerHTML = 'Los outliers afectan más a <strong>MSE/RMSE</strong> (penalizan errores grandes al cuadrado) ' +
        'que a <strong>MAE</strong> (error absoluto lineal). Observa cómo cambia cada métrica al añadir más outliers.';
}

// Event listeners para canvas
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    const nearIndex = findNearPoint(cx, cy);
    if (nearIndex >= 0) {
        dragIndex = nearIndex;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    if (dragIndex >= 0) {
        // Arrastrando punto
        const data = canvasToData(cx, cy);
        points[dragIndex].x = Math.max(0, Math.min(100, data.x));
        points[dragIndex].y = Math.max(0, Math.min(100, data.y));
        
        if (autoFit) {
            leastSquaresFit();
            updateLineControls();
        }
        
        updateMetrics();
        render();
    } else {
        // Hover
        const newHover = findNearPoint(cx, cy);
        if (newHover !== hoverIndex) {
            hoverIndex = newHover;
            canvas.style.cursor = hoverIndex >= 0 ? 'grab' : 'crosshair';
            render();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    dragIndex = -1;
    canvas.style.cursor = hoverIndex >= 0 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    dragIndex = -1;
    hoverIndex = -1;
    render();
});

canvas.addEventListener('click', (e) => {
    if (dragIndex >= 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    const nearIndex = findNearPoint(cx, cy);
    if (nearIndex < 0) {
        // Añadir nuevo punto
        const data = canvasToData(cx, cy);
        if (data.x >= 0 && data.x <= 100 && data.y >= 0 && data.y <= 100) {
            points.push({
                x: data.x,
                y: data.y,
                isOutlier: false
            });
            
            if (autoFit) {
                leastSquaresFit();
                updateLineControls();
            }
            
            updateMetrics();
            render();
        }
    }
});

canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    const nearIndex = findNearPoint(cx, cy);
    if (nearIndex >= 0) {
        points.splice(nearIndex, 1);
        hoverIndex = -1;
        
        if (autoFit) {
            leastSquaresFit();
            updateLineControls();
        }
        
        updateMetrics();
        render();
    }
});

// Sliders
slopeSlider.addEventListener('input', () => {
    if (!autoFit) {
        slope = parseFloat(slopeSlider.value) / 100;
        slopeValue.textContent = slope.toFixed(2);
        equationSlope.textContent = slope.toFixed(2);
        updateMetrics();
        render();
    }
});

interceptSlider.addEventListener('input', () => {
    if (!autoFit) {
        intercept = parseFloat(interceptSlider.value);
        interceptValue.textContent = intercept.toFixed(2);
        equationIntercept.textContent = intercept.toFixed(2);
        updateMetrics();
        render();
    }
});

// Toggles
showResidualsToggle.addEventListener('change', () => {
    showResiduals = showResidualsToggle.checked;
    render();
});

autoFitToggle.addEventListener('change', () => {
    autoFit = autoFitToggle.checked;
    slopeSlider.disabled = autoFit;
    interceptSlider.disabled = autoFit;
    
    if (autoFit && points.length >= 2) {
        leastSquaresFit();
        updateLineControls();
        updateMetrics();
        render();
    }
});

// Buttons
addOutlierBtn.addEventListener('click', addOutlier);

resetBtn.addEventListener('click', () => {
    points = [];
    slope = 1;
    intercept = 0;
    updateLineControls();
    updateMetrics();
    render();
});

sampleBtn.addEventListener('click', generateSampleData);

// Metric cards info
metricCards.forEach(card => {
    card.addEventListener('click', () => {
        metricCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const metric = card.dataset.metric;
        
        const descriptions = {
            mae: {
                title: 'MAE - Error absoluto medio',
                text: 'Promedio de los valores absolutos de los errores. <strong>Robusto a outliers</strong> porque no eleva al cuadrado. Interpretable: mismo unidades que Y.'
            },
            mse: {
                title: 'MSE - Error cuadrático medio',
                text: 'Promedio de los errores al cuadrado. <strong>Penaliza errores grandes</strong> más que pequeños. Unidades: Y². Muy sensible a outliers.'
            },
            rmse: {
                title: 'RMSE - Raíz del error cuadrático medio',
                text: 'Raíz cuadrada del MSE. <strong>Mismas unidades que Y</strong>, lo que facilita la interpretación. Sigue siendo sensible a outliers.'
            },
            mape: {
                title: 'MAPE - Error porcentual absoluto medio',
                text: 'Error como porcentaje del valor real. <strong>Fácil de interpretar</strong> (ej: "5% de error"). Problema: indefinido cuando Y = 0.'
            },
            r2: {
                title: 'R² - Coeficiente de determinación',
                text: 'Proporción de varianza explicada por el modelo. <strong>1 = perfecto</strong>, 0 = igual que predecir la media. Puede ser negativo si el modelo es peor que la media.'
            },
            r2adj: {
                title: 'R² ajustado',
                text: 'R² penalizado por número de predictores. <strong>Evita sobre-ajuste</strong>: añadir variables inútiles reduce R² ajustado. Importante en regresión múltiple.'
            }
        };
        
        if (descriptions[metric]) {
            infoTitle.textContent = descriptions[metric].title;
            infoText.innerHTML = descriptions[metric].text;
        }
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    slopeSlider.disabled = autoFit;
    interceptSlider.disabled = autoFit;
    generateSampleData();
});
