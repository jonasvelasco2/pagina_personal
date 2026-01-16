/**
 * Train-Test Split Visualizer
 * Visualiza la importancia de dividir datos en entrenamiento y prueba
 */

// Colores
const COLORS = {
    train: '#0073bb',
    test: '#ff9900',
    model: '#1e8e8e',
    grid: '#f0f0f0'
};

// Estado
let state = {
    dataSize: 50,
    splitRatio: 0.7,
    noise: 0.3,
    allData: [],
    trainData: [],
    testData: [],
    modelCoeffs: null
};

// Charts
let dataChart = null;
let learningCurve = null;

// Función verdadera
const trueFn = (x) => 0.5 * Math.sin(2 * Math.PI * x) + 0.5;

// ============================================
// Inicialización
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    generateData();
    setupEventListeners();
    console.log('Train-Test Split iniciado');
});

function setupEventListeners() {
    // Slider de tamaño
    document.getElementById('sizeSlider').addEventListener('input', function(e) {
        state.dataSize = parseInt(e.target.value);
        document.getElementById('sizeValue').textContent = state.dataSize;
        generateData();
    });
    
    // Slider de split
    document.getElementById('splitSlider').addEventListener('input', function(e) {
        state.splitRatio = parseInt(e.target.value) / 100;
        document.getElementById('splitValue').textContent = e.target.value + '%';
        splitData();
        updateVisuals();
        trainAndEvaluate();
    });
    
    // Slider de ruido
    document.getElementById('noiseSlider').addEventListener('input', function(e) {
        state.noise = parseInt(e.target.value) / 100;
        document.getElementById('noiseValue').textContent = state.noise.toFixed(2);
        generateData();
    });
    
    // Botón barajar
    document.getElementById('shuffleBtn').addEventListener('click', function() {
        shuffleAndAnimate();
    });
    
    // Botón nuevo dataset
    document.getElementById('newDataBtn').addEventListener('click', function() {
        generateData();
    });
}

function initCharts() {
    Chart.defaults.color = '#545b64';
    Chart.defaults.borderColor = '#e8e8e8';
    Chart.defaults.font.family = "'Source Sans Pro', sans-serif";
    
    // Data chart
    const dataCtx = document.getElementById('dataChart').getContext('2d');
    dataChart = new Chart(dataCtx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Entrenamiento',
                    data: [],
                    backgroundColor: COLORS.train,
                    pointRadius: 6,
                    order: 2
                },
                {
                    label: 'Prueba',
                    data: [],
                    backgroundColor: COLORS.test,
                    pointRadius: 6,
                    order: 3
                },
                {
                    label: 'Modelo',
                    data: [],
                    type: 'line',
                    borderColor: COLORS.model,
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: 0,
                    max: 1,
                    title: { display: true, text: 'X' },
                    grid: { color: '#f0f0f0' }
                },
                y: {
                    min: -0.2,
                    max: 1.2,
                    title: { display: true, text: 'Y' },
                    grid: { color: '#f0f0f0' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Learning curve
    const lcCtx = document.getElementById('learningCurve').getContext('2d');
    learningCurve = new Chart(lcCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Error entrenamiento',
                    data: [],
                    borderColor: COLORS.train,
                    backgroundColor: COLORS.train + '33',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Error prueba',
                    data: [],
                    borderColor: COLORS.test,
                    backgroundColor: COLORS.test + '33',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: '% datos de entrenamiento' },
                    grid: { color: '#f0f0f0' }
                },
                y: {
                    min: 0,
                    title: { display: true, text: 'MSE' },
                    grid: { color: '#f0f0f0' }
                }
            },
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// ============================================
// Datos
// ============================================

function generateData() {
    state.allData = [];
    
    for (let i = 0; i < state.dataSize; i++) {
        const x = Math.random();
        const yTrue = trueFn(x);
        const y = yTrue + randomNormal(0, state.noise);
        state.allData.push({ x, y, yTrue });
    }
    
    state.allData.sort((a, b) => a.x - b.x);
    
    splitData();
    updateVisuals();
    trainAndEvaluate();
    calculateLearningCurve();
}

function splitData() {
    const shuffled = [...state.allData].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * state.splitRatio);
    
    state.trainData = shuffled.slice(0, splitIdx).sort((a, b) => a.x - b.x);
    state.testData = shuffled.slice(splitIdx).sort((a, b) => a.x - b.x);
}

function shuffleAndAnimate() {
    const container = document.getElementById('pointsContainer');
    const points = container.querySelectorAll('.data-point');
    
    // Animación
    points.forEach((p, i) => {
        setTimeout(() => {
            p.classList.add('shuffling');
            setTimeout(() => p.classList.remove('shuffling'), 500);
        }, i * 20);
    });
    
    // Después de la animación, barajar
    setTimeout(() => {
        splitData();
        updateVisuals();
        trainAndEvaluate();
    }, points.length * 20 + 300);
}

function randomNormal(mean, std) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}

// ============================================
// Modelo (Regresión polinomial grado 3)
// ============================================

function trainModel(data) {
    if (data.length < 4) return null;
    
    const degree = 3;
    const n = data.length;
    const m = degree + 1;
    
    const X = [];
    const Y = [];
    
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(Math.pow(data[i].x, j));
        }
        X.push(row);
        Y.push(data[i].y);
    }
    
    // X'X con regularización
    const XtX = [];
    for (let i = 0; i < m; i++) {
        XtX[i] = [];
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += X[k][i] * X[k][j];
            }
            XtX[i][j] = sum + (i === j ? 0.001 : 0);
        }
    }
    
    // X'Y
    const XtY = [];
    for (let i = 0; i < m; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += X[k][i] * Y[k];
        }
        XtY[i] = sum;
    }
    
    return solveSystem(XtX, XtY);
}

function solveSystem(A, b) {
    const n = b.length;
    const aug = A.map((row, i) => [...row, b[i]]);
    
    for (let col = 0; col < n; col++) {
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
                maxRow = row;
            }
        }
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
        
        if (Math.abs(aug[col][col]) < 1e-10) continue;
        
        for (let row = col + 1; row < n; row++) {
            const factor = aug[row][col] / aug[col][col];
            for (let j = col; j <= n; j++) {
                aug[row][j] -= factor * aug[col][j];
            }
        }
    }
    
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        if (Math.abs(aug[i][i]) < 1e-10) continue;
        x[i] = aug[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= aug[i][j] * x[j];
        }
        x[i] /= aug[i][i];
    }
    
    return x;
}

function predict(coeffs, x) {
    if (!coeffs) return 0;
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
        result += coeffs[i] * Math.pow(x, i);
    }
    return result;
}

function calculateMSE(data, coeffs) {
    if (!coeffs || data.length === 0) return null;
    
    let sum = 0;
    for (const p of data) {
        const pred = predict(coeffs, p.x);
        sum += Math.pow(p.y - pred, 2);
    }
    return sum / data.length;
}

function trainAndEvaluate() {
    state.modelCoeffs = trainModel(state.trainData);
    
    const trainMSE = calculateMSE(state.trainData, state.modelCoeffs);
    const testMSE = calculateMSE(state.testData, state.modelCoeffs);
    
    // Actualizar métricas
    document.getElementById('trainMSE').textContent = trainMSE ? trainMSE.toFixed(4) : '—';
    document.getElementById('testMSE').textContent = testMSE ? testMSE.toFixed(4) : '—';
    
    // Colorear
    if (trainMSE !== null && testMSE !== null) {
        const trainEl = document.getElementById('trainMSE');
        const testEl = document.getElementById('testMSE');
        
        trainEl.style.color = trainMSE < 0.1 ? '#2e7d32' : (trainMSE > 0.3 ? '#c62828' : '#232f3e');
        testEl.style.color = testMSE < 0.15 ? '#2e7d32' : (testMSE > 0.4 ? '#c62828' : '#232f3e');
    }
    
    updateDataChart();
    updateExplanation(trainMSE, testMSE);
}

function calculateLearningCurve() {
    const labels = [];
    const trainErrors = [];
    const testErrors = [];
    
    for (let pct = 50; pct <= 90; pct += 5) {
        const ratio = pct / 100;
        const splitIdx = Math.floor(state.allData.length * ratio);
        
        const shuffled = [...state.allData].sort(() => Math.random() - 0.5);
        const trainSubset = shuffled.slice(0, splitIdx);
        const testSubset = shuffled.slice(splitIdx);
        
        const coeffs = trainModel(trainSubset);
        const trainMSE = calculateMSE(trainSubset, coeffs);
        const testMSE = calculateMSE(testSubset, coeffs);
        
        labels.push(pct + '%');
        trainErrors.push(trainMSE || 0);
        testErrors.push(testMSE || 0);
    }
    
    learningCurve.data.labels = labels;
    learningCurve.data.datasets[0].data = trainErrors;
    learningCurve.data.datasets[1].data = testErrors;
    learningCurve.update();
}

// ============================================
// Visualización
// ============================================

function updateVisuals() {
    // Actualizar barra de split
    const trainPct = Math.round(state.splitRatio * 100);
    const testPct = 100 - trainPct;
    
    document.getElementById('splitTrainBar').style.width = trainPct + '%';
    document.getElementById('splitTrainBar').textContent = `Entrenamiento (${trainPct}%)`;
    document.getElementById('splitTestBar').style.width = testPct + '%';
    document.getElementById('splitTestBar').textContent = `Prueba (${testPct}%)`;
    
    // Actualizar contadores
    document.getElementById('trainCount').textContent = state.trainData.length;
    document.getElementById('testCount').textContent = state.testData.length;
    
    // Actualizar puntos visuales
    updatePointsVisual();
}

function updatePointsVisual() {
    const container = document.getElementById('pointsContainer');
    container.innerHTML = '';
    
    // Crear set de índices de train
    const trainIndices = new Set();
    for (const tp of state.trainData) {
        const idx = state.allData.findIndex(d => d.x === tp.x && d.y === tp.y);
        if (idx >= 0) trainIndices.add(idx);
    }
    
    // Crear puntos
    for (let i = 0; i < state.allData.length; i++) {
        const point = document.createElement('div');
        point.className = 'data-point ' + (trainIndices.has(i) ? 'train' : 'test');
        container.appendChild(point);
    }
}

function updateDataChart() {
    // Datos de entrenamiento
    dataChart.data.datasets[0].data = state.trainData.map(d => ({ x: d.x, y: d.y }));
    
    // Datos de prueba
    dataChart.data.datasets[1].data = state.testData.map(d => ({ x: d.x, y: d.y }));
    
    // Curva del modelo
    if (state.modelCoeffs) {
        const curve = [];
        for (let x = 0; x <= 1; x += 0.02) {
            curve.push({ x, y: predict(state.modelCoeffs, x) });
        }
        dataChart.data.datasets[2].data = curve;
    }
    
    dataChart.update();
}

function updateExplanation(trainMSE, testMSE) {
    const el = document.getElementById('explanationText');
    
    if (!trainMSE || !testMSE) {
        el.innerHTML = 'Divide los datos y entrena el modelo para ver los resultados.';
        return;
    }
    
    const diff = testMSE - trainMSE;
    const ratio = testMSE / trainMSE;
    
    if (state.trainData.length < 10) {
        el.innerHTML = `Con solo <strong>${state.trainData.length} puntos</strong> de entrenamiento, 
            el modelo tiene muy poca información para aprender. Aumenta el tamaño del dataset 
            o la proporción de entrenamiento.`;
    } else if (ratio > 2) {
        el.innerHTML = `El error de prueba es <strong>${ratio.toFixed(1)}x mayor</strong> que el de entrenamiento. 
            Esto puede indicar <strong>sobreajuste</strong> o que el conjunto de prueba es muy pequeño 
            y tiene puntos difíciles.`;
    } else if (ratio < 1.3) {
        el.innerHTML = `Los errores de entrenamiento y prueba son <strong>similares</strong>. 
            Esto indica que el modelo generaliza bien y la división de datos es adecuada.`;
    } else {
        el.innerHTML = `El error de prueba es moderadamente mayor que el de entrenamiento. 
            Esta diferencia es <strong>normal</strong> y esperada: siempre generalizamos 
            un poco peor a datos no vistos.`;
    }
}

console.log('Script cargado');
