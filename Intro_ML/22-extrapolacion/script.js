// Peligros de la Extrapolación - Visualización interactiva

// Estado global
let predictionRange = 10;  // Hasta dónde extender la predicción
let showTrueFunction = false;
let currentScenario = 'quadratic';

// Rango de datos de entrenamiento
const trainXMin = 2;
const trainXMax = 10;
const numTrainPoints = 15;

// Canvas
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const rangeSlider = document.getElementById('rangeSlider');
const rangeValue = document.getElementById('rangeValue');
const showTrueToggle = document.getElementById('showTrueToggle');
const errorTrain = document.getElementById('errorTrain');
const errorExtrap = document.getElementById('errorExtrap');
const modelEquation = document.getElementById('modelEquation');

// Colores
const COLORS = {
    trainData: '#0073bb',
    linearModel: '#0073bb',
    trueFunction: '#7b68ee',
    safeZone: 'rgba(29, 129, 2, 0.15)',
    dangerZone: 'rgba(209, 50, 18, 0.15)',
    grid: '#e8e8e8',
    axis: '#999'
};

// Escenarios con diferentes funciones verdaderas
const scenarios = {
    quadratic: {
        name: 'Cuadrática',
        // Función verdadera: y = 5 + 2x + 0.15x²
        trueFunc: (x) => 5 + 2 * x + 0.15 * x * x,
        description: 'La relación real tiene un componente cuadrático que se hace evidente fuera del rango de entrenamiento.'
    },
    logarithmic: {
        name: 'Logarítmica',
        // Función verdadera: y = 10 + 8*log(x)
        trueFunc: (x) => 10 + 8 * Math.log(x),
        description: 'La relación verdadera es logarítmica: crece rápido al inicio pero se desacelera.'
    },
    saturation: {
        name: 'Saturación',
        // Función verdadera: y = 35 * (1 - e^(-0.3x))
        trueFunc: (x) => 35 * (1 - Math.exp(-0.3 * x)),
        description: 'La relación real tiene un límite superior (saturación) que el modelo lineal no puede capturar.'
    },
    sinusoidal: {
        name: 'Sinusoidal',
        // Función verdadera: y = 15 + 3*sin(0.5x) + 1.5x
        trueFunc: (x) => 15 + 3 * Math.sin(0.5 * x) + 1.5 * x,
        description: 'La relación tiene una componente cíclica que parece lineal en un rango limitado.'
    }
};

// Datos de entrenamiento y modelo
let trainData = [];
let linearModel = { intercept: 0, slope: 0 };

// Generador de ruido
function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generar datos de entrenamiento
function generateTrainData() {
    trainData = [];
    const trueFunc = scenarios[currentScenario].trueFunc;
    
    for (let i = 0; i < numTrainPoints; i++) {
        const x = trainXMin + (trainXMax - trainXMin) * (i / (numTrainPoints - 1));
        // Agregar ruido
        const noise = randn() * 1.5;
        const y = trueFunc(x) + noise;
        trainData.push({ x, y });
    }
    
    // Ajustar modelo lineal por OLS
    fitLinearModel();
}

// Ajustar modelo lineal
function fitLinearModel() {
    const n = trainData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (const p of trainData) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    linearModel = { intercept, slope };
    
    // Actualizar ecuación mostrada
    const sign = intercept >= 0 ? '+' : '';
    modelEquation.textContent = `ŷ = ${intercept.toFixed(2)} ${sign} ${slope.toFixed(2)}·x`;
}

// Predicción del modelo lineal
function linearPredict(x) {
    return linearModel.intercept + linearModel.slope * x;
}

// Calcular errores
function calculateErrors() {
    const trueFunc = scenarios[currentScenario].trueFunc;
    
    // Error en zona de entrenamiento (RMSE)
    let sumSqTrain = 0;
    for (const p of trainData) {
        const pred = linearPredict(p.x);
        sumSqTrain += (pred - p.y) ** 2;
    }
    const rmseTrain = Math.sqrt(sumSqTrain / trainData.length);
    
    // Error en zona de extrapolación
    let rmseExtrap = null;
    if (predictionRange > trainXMax) {
        let sumSqExtrap = 0;
        let countExtrap = 0;
        
        for (let x = trainXMax + 0.5; x <= predictionRange; x += 0.5) {
            const pred = linearPredict(x);
            const trueY = trueFunc(x);
            sumSqExtrap += (pred - trueY) ** 2;
            countExtrap++;
        }
        
        if (countExtrap > 0) {
            rmseExtrap = Math.sqrt(sumSqExtrap / countExtrap);
        }
    }
    
    // Actualizar display
    errorTrain.textContent = rmseTrain.toFixed(2);
    errorTrain.className = 'error-value good';
    
    if (rmseExtrap !== null) {
        errorExtrap.textContent = rmseExtrap.toFixed(2);
        
        // Colorear según gravedad
        if (rmseExtrap < rmseTrain * 2) {
            errorExtrap.className = 'error-value good';
        } else if (rmseExtrap < rmseTrain * 5) {
            errorExtrap.className = 'error-value warning';
        } else {
            errorExtrap.className = 'error-value danger';
        }
    } else {
        errorExtrap.textContent = '—';
        errorExtrap.className = 'error-value';
    }
}

// Renderizar
function render() {
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    
    ctx.clearRect(0, 0, width, height);
    
    // Rangos para el gráfico
    const xMin = 0;
    const xMax = Math.max(predictionRange + 2, 12);
    
    // Calcular rango Y basado en los datos y predicciones
    const trueFunc = scenarios[currentScenario].trueFunc;
    let yMin = Infinity, yMax = -Infinity;
    
    for (const p of trainData) {
        yMin = Math.min(yMin, p.y);
        yMax = Math.max(yMax, p.y);
    }
    
    // Considerar predicciones y función verdadera
    // Empezar desde 0.5 para evitar log(0) = -Infinity
    for (let x = 0.5; x <= xMax; x += 0.5) {
        const predY = linearPredict(x);
        const trueY = trueFunc(x);
        
        // Solo considerar valores finitos
        if (isFinite(predY)) {
            yMin = Math.min(yMin, predY);
            yMax = Math.max(yMax, predY);
        }
        if (isFinite(trueY)) {
            yMin = Math.min(yMin, trueY);
            yMax = Math.max(yMax, trueY);
        }
    }
    
    // Agregar margen
    const yRange = yMax - yMin;
    yMin -= yRange * 0.1;
    yMax += yRange * 0.1;
    
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    function toCanvasX(x) {
        return padding + ((x - xMin) / (xMax - xMin)) * plotWidth;
    }
    
    function toCanvasY(y) {
        return height - padding - ((y - yMin) / (yMax - yMin)) * plotHeight;
    }
    
    // Dibujar zonas
    // Zona segura (entrenamiento)
    ctx.fillStyle = COLORS.safeZone;
    ctx.fillRect(
        toCanvasX(trainXMin),
        padding,
        toCanvasX(trainXMax) - toCanvasX(trainXMin),
        plotHeight
    );
    
    // Zona de extrapolación (derecha)
    if (predictionRange > trainXMax) {
        ctx.fillStyle = COLORS.dangerZone;
        ctx.fillRect(
            toCanvasX(trainXMax),
            padding,
            toCanvasX(predictionRange) - toCanvasX(trainXMax),
            plotHeight
        );
    }
    
    // Zona de extrapolación (izquierda)
    ctx.fillStyle = COLORS.dangerZone;
    ctx.fillRect(
        padding,
        padding,
        toCanvasX(trainXMin) - padding,
        plotHeight
    );
    
    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    const xStep = (xMax - xMin) / 10;
    for (let x = xMin; x <= xMax; x += xStep) {
        const px = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
    }
    
    const yStep = (yMax - yMin) / 8;
    for (let y = yMin; y <= yMax; y += yStep) {
        const py = toCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(padding, py);
        ctx.lineTo(width - padding, py);
        ctx.stroke();
    }
    
    // Ejes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    
    // Labels de ejes
    ctx.fillStyle = '#666';
    ctx.font = 'bold 12px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('X', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y', 0, 0);
    ctx.restore();
    
    // Tick labels
    ctx.font = '10px Source Sans Pro';
    for (let x = Math.ceil(xMin); x <= xMax; x += 2) {
        const px = toCanvasX(x);
        ctx.textAlign = 'center';
        ctx.fillText(x.toString(), px, height - padding + 15);
    }
    
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin / 5) * 5; y <= yMax; y += Math.ceil((yMax - yMin) / 6)) {
        const py = toCanvasY(y);
        if (py > padding && py < height - padding) {
            ctx.fillText(y.toFixed(0), padding - 8, py + 4);
        }
    }
    
    // Dibujar función verdadera (si está activada)
    if (showTrueFunction) {
        ctx.strokeStyle = COLORS.trueFunction;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        
        let started = false;
        // Empezar desde 0.1 para evitar log(0) = -Infinity
        for (let x = 0.1; x <= xMax; x += 0.1) {
            const y = trueFunc(x);
            
            // Saltar valores inválidos (NaN, Infinity)
            if (!isFinite(y)) continue;
            
            const px = toCanvasX(x);
            const py = toCanvasY(y);
            
            if (py >= padding && py <= height - padding) {
                if (!started) {
                    ctx.moveTo(px, py);
                    started = true;
                } else {
                    ctx.lineTo(px, py);
                }
            } else {
                // Si salimos del rango, reiniciar el trazo
                started = false;
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Dibujar modelo lineal
    ctx.strokeStyle = COLORS.linearModel;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    const startX = xMin;
    const endX = Math.max(predictionRange, trainXMax);
    
    ctx.moveTo(toCanvasX(startX), toCanvasY(linearPredict(startX)));
    ctx.lineTo(toCanvasX(endX), toCanvasY(linearPredict(endX)));
    ctx.stroke();
    
    // Dibujar puntos de entrenamiento
    for (const p of trainData) {
        const px = toCanvasX(p.x);
        const py = toCanvasY(p.y);
        
        // Punto exterior
        ctx.fillStyle = COLORS.trainData;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Centro blanco
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Etiquetas de zonas
    ctx.font = 'bold 11px Source Sans Pro';
    ctx.textAlign = 'center';
    
    // Zona segura
    ctx.fillStyle = 'rgba(29, 129, 2, 0.8)';
    ctx.fillText('INTERPOLACIÓN', (toCanvasX(trainXMin) + toCanvasX(trainXMax)) / 2, padding + 20);
    ctx.font = '10px Source Sans Pro';
    ctx.fillText('(zona segura)', (toCanvasX(trainXMin) + toCanvasX(trainXMax)) / 2, padding + 35);
    
    // Zona de extrapolación derecha
    if (predictionRange > trainXMax) {
        ctx.font = 'bold 11px Source Sans Pro';
        ctx.fillStyle = 'rgba(209, 50, 18, 0.8)';
        ctx.fillText('EXTRAPOLACIÓN', (toCanvasX(trainXMax) + toCanvasX(predictionRange)) / 2, padding + 20);
        ctx.font = '10px Source Sans Pro';
        ctx.fillText('(zona peligrosa)', (toCanvasX(trainXMax) + toCanvasX(predictionRange)) / 2, padding + 35);
    }
    
    // Líneas de límite del rango de entrenamiento
    ctx.strokeStyle = '#1d8102';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    
    ctx.beginPath();
    ctx.moveTo(toCanvasX(trainXMin), padding);
    ctx.lineTo(toCanvasX(trainXMin), height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toCanvasX(trainXMax), padding);
    ctx.lineTo(toCanvasX(trainXMax), height - padding);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Calcular errores
    calculateErrors();
}

// Event Listeners
rangeSlider.addEventListener('input', () => {
    predictionRange = parseInt(rangeSlider.value);
    rangeValue.textContent = predictionRange;
    render();
});

showTrueToggle.addEventListener('change', () => {
    showTrueFunction = showTrueToggle.checked;
    render();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Actualizar botones activos
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Cambiar escenario
        currentScenario = btn.dataset.scenario;
        generateTrainData();
        render();
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    generateTrainData();
    render();
});
