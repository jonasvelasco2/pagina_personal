/**
 * Bias-Variance Tradeoff Visualizer
 * Demuestra cómo la complejidad del modelo afecta el balance entre sesgo y varianza
 */

// ============================================
// Utilidades incluidas directamente para evitar problemas de carga
// ============================================

// Colores inspirados en MLU Explain
const COLORS = {
    train: '#0073bb',      // Azul AWS
    test: '#ff9900',       // Naranja AWS
    prediction: '#1e8e8e', // Teal
    gray: '#879596'        // Gris suave
};

function randomNormal(mean = 0, std = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}

function generateData(n, trueFn, noise, xMin, xMax) {
    const data = [];
    for (let i = 0; i < n; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const yTrue = trueFn(x);
        const y = yTrue + randomNormal(0, noise);
        data.push({ x, y, yTrue });
    }
    return data.sort((a, b) => a.x - b.x);
}

function linspace(start, end, n) {
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
}

function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function trainTestSplit(data, trainRatio) {
    const shuffled = shuffle(data);
    const splitIdx = Math.floor(shuffled.length * trainRatio);
    return {
        train: shuffled.slice(0, splitIdx).sort((a, b) => a.x - b.x),
        test: shuffled.slice(splitIdx).sort((a, b) => a.x - b.x)
    };
}

function polynomialFit(data, degree) {
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
    
    // X'X
    const XtX = [];
    for (let i = 0; i < m; i++) {
        XtX[i] = [];
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += X[k][i] * X[k][j];
            }
            // Regularización para estabilidad numérica
            XtX[i][j] = sum + (i === j ? 0.0001 : 0);
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
    
    return solveLinearSystem(XtX, XtY);
}

function solveLinearSystem(A, b) {
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

function evaluatePolynomial(coeffs, x) {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
        result += coeffs[i] * Math.pow(x, i);
    }
    return result;
}

function polynomialCurve(coeffs, xMin, xMax, nPoints) {
    const xs = linspace(xMin, xMax, nPoints);
    return xs.map(x => ({
        x,
        y: evaluatePolynomial(coeffs, x)
    }));
}

function mse(yTrue, yPred) {
    const n = yTrue.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += Math.pow(yTrue[i] - yPred[i], 2);
    }
    return sum / n;
}

function r2Score(yTrue, yPred) {
    const n = yTrue.length;
    const yMean = yTrue.reduce((a, b) => a + b, 0) / n;
    
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
        ssRes += Math.pow(yTrue[i] - yPred[i], 2);
        ssTot += Math.pow(yTrue[i] - yMean, 2);
    }
    
    if (ssTot === 0) return 0;
    return 1 - (ssRes / ssTot);
}

function formatNumber(num, decimals = 3) {
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
}

// ============================================
// Configuración del visualizador
// ============================================

// Función verdadera subyacente (sinusoidal con tendencia)
const trueFn = (x) => Math.sin(2 * Math.PI * x) * 0.5 + 0.5 * x + 0.3;

// Estado de la aplicación
let state = {
    degree: 1,
    noise: 0.3,
    sampleSize: 30,
    trainData: [],
    testData: [],
    allData: [],
    errorHistory: [],
    isAnimating: false
};

// Referencias a los gráficos
let dataChart = null;
let errorChart = null;

// ============================================
// Inicialización
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando visualizador...');
    try {
        initCharts();
        generateNewData();
        setupEventListeners();
        console.log('Visualizador iniciado correctamente');
    } catch (error) {
        console.error('Error al iniciar:', error);
        alert('Error al iniciar el visualizador: ' + error.message);
    }
});

function initCharts() {
    // Configuración común de Chart.js (estilo MLU Explain)
    Chart.defaults.color = '#545b64';
    Chart.defaults.borderColor = '#e8e8e8';
    Chart.defaults.font.family = "'Source Sans Pro', sans-serif";
    
    // Gráfico de datos
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
                    pointHoverRadius: 8,
                    order: 2
                },
                {
                    label: 'Prueba',
                    data: [],
                    backgroundColor: COLORS.test,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    order: 3
                },
                {
                    label: 'Modelo',
                    data: [],
                    type: 'line',
                    borderColor: COLORS.prediction,
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false,
                    order: 1
                },
                {
                    label: 'Función Verdadera',
                    data: [],
                    type: 'line',
                    borderColor: COLORS.gray,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false,
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'X'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                y: {
                    min: -0.5,
                    max: 1.5,
                    title: {
                        display: true,
                        text: 'Y'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Gráfico de errores
    const errorCtx = document.getElementById('errorChart').getContext('2d');
    errorChart = new Chart(errorCtx, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            datasets: [
                {
                    label: 'Error Entrenamiento',
                    data: [],
                    borderColor: COLORS.train,
                    backgroundColor: COLORS.train + '33',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Error Prueba',
                    data: [],
                    borderColor: COLORS.test,
                    backgroundColor: COLORS.test + '33',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Grado del polinomio'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                y: {
                    min: 0,
                    max: 0.5,
                    title: {
                        display: true,
                        text: 'MSE'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    console.log('Gráficos inicializados');
}

function setupEventListeners() {
    // Slider de grado
    const degreeSlider = document.getElementById('degreeSlider');
    degreeSlider.addEventListener('input', function(e) {
        state.degree = parseInt(e.target.value);
        document.getElementById('degreeValue').textContent = state.degree;
        updateModel();
    });
    
    // Slider de ruido
    const noiseSlider = document.getElementById('noiseSlider');
    noiseSlider.addEventListener('input', function(e) {
        state.noise = parseInt(e.target.value) / 100;
        document.getElementById('noiseValue').textContent = state.noise.toFixed(2);
        generateNewData();
    });
    
    // Slider de tamaño de muestra
    const sampleSlider = document.getElementById('sampleSlider');
    sampleSlider.addEventListener('input', function(e) {
        state.sampleSize = parseInt(e.target.value);
        document.getElementById('sampleValue').textContent = state.sampleSize;
        generateNewData();
    });
    
    // Botón regenerar
    document.getElementById('regenerateBtn').addEventListener('click', function() {
        generateNewData();
    });
    
    // Botón animar
    document.getElementById('animateBtn').addEventListener('click', function() {
        animateDegrees();
    });
    
    console.log('Event listeners configurados');
}

// ============================================
// Generación y actualización de datos
// ============================================

function generateNewData() {
    console.log('Generando nuevos datos...');
    
    // Generar datos
    state.allData = generateData(state.sampleSize, trueFn, state.noise, 0, 1);
    
    // Dividir en train/test (70/30)
    const split = trainTestSplit(state.allData, 0.7);
    state.trainData = split.train;
    state.testData = split.test;
    
    console.log('Train:', state.trainData.length, 'Test:', state.testData.length);
    
    // Calcular errores para todos los grados
    calculateAllErrors();
    
    // Actualizar gráficos
    updateModel();
}

function calculateAllErrors() {
    state.errorHistory = [];
    
    for (let deg = 1; deg <= 15; deg++) {
        try {
            const coeffs = polynomialFit(state.trainData, deg);
            
            const trainPreds = state.trainData.map(d => evaluatePolynomial(coeffs, d.x));
            const testPreds = state.testData.map(d => evaluatePolynomial(coeffs, d.x));
            
            const trainActual = state.trainData.map(d => d.y);
            const testActual = state.testData.map(d => d.y);
            
            const trainMSE = mse(trainActual, trainPreds);
            const testMSE = mse(testActual, testPreds);
            
            state.errorHistory.push({
                degree: deg,
                trainMSE: Math.min(trainMSE, 2),
                testMSE: Math.min(testMSE, 2)
            });
        } catch (e) {
            state.errorHistory.push({
                degree: deg,
                trainMSE: 0.5,
                testMSE: 0.5
            });
        }
    }
    
    updateErrorChart();
}

function updateModel() {
    try {
        // Ajustar polinomio
        const coeffs = polynomialFit(state.trainData, state.degree);
        
        // Generar curva del modelo
        const curve = polynomialCurve(coeffs, 0, 1, 100);
        
        // Generar curva de la función verdadera
        const trueCurve = linspace(0, 1, 100).map(x => ({ x, y: trueFn(x) }));
        
        // Calcular métricas
        const trainPreds = state.trainData.map(d => evaluatePolynomial(coeffs, d.x));
        const testPreds = state.testData.map(d => evaluatePolynomial(coeffs, d.x));
        const trainActual = state.trainData.map(d => d.y);
        const testActual = state.testData.map(d => d.y);
        
        const trainMSE = mse(trainActual, trainPreds);
        const testMSE = mse(testActual, testPreds);
        const trainR2 = r2Score(trainActual, trainPreds);
        const testR2 = r2Score(testActual, testPreds);
        
        // Actualizar gráfico de datos
        dataChart.data.datasets[0].data = state.trainData.map(d => ({ x: d.x, y: d.y }));
        dataChart.data.datasets[1].data = state.testData.map(d => ({ x: d.x, y: d.y }));
        dataChart.data.datasets[2].data = curve;
        dataChart.data.datasets[3].data = trueCurve;
        dataChart.update();
        
        // Actualizar métricas
        document.getElementById('trainMSE').textContent = formatNumber(trainMSE);
        document.getElementById('testMSE').textContent = formatNumber(testMSE);
        document.getElementById('trainR2').textContent = formatNumber(trainR2);
        document.getElementById('testR2').textContent = formatNumber(testR2);
        document.getElementById('numParams').textContent = state.degree + 1;
        
        // Colorear métricas
        colorMetric('testMSE', testMSE, 0.1, 0.5, true);
        colorMetric('testR2', testR2, 0.7, 0.3, false);
        
        // Actualizar indicador de complejidad
        updateComplexityIndicator();
        
        // Resaltar punto actual en gráfico de errores
        highlightCurrentDegree();
        
    } catch (e) {
        console.error('Error al actualizar modelo:', e);
    }
}

function updateErrorChart() {
    errorChart.data.datasets[0].data = state.errorHistory.map(e => e.trainMSE);
    errorChart.data.datasets[1].data = state.errorHistory.map(e => e.testMSE);
    
    // Ajustar escala Y automáticamente
    const maxError = Math.max(
        ...state.errorHistory.map(e => Math.max(e.trainMSE, e.testMSE))
    );
    errorChart.options.scales.y.max = Math.min(maxError * 1.2, 1);
    
    errorChart.update();
}

function highlightCurrentDegree() {
    const trainPointRadius = state.errorHistory.map((_, i) => 
        i + 1 === state.degree ? 10 : 4
    );
    const testPointRadius = state.errorHistory.map((_, i) => 
        i + 1 === state.degree ? 10 : 4
    );
    
    errorChart.data.datasets[0].pointRadius = trainPointRadius;
    errorChart.data.datasets[1].pointRadius = testPointRadius;
    errorChart.update();
}

function updateComplexityIndicator() {
    const fillPercent = (state.degree / 15) * 100;
    document.getElementById('complexityFill').style.width = fillPercent + '%';
    
    const badge = document.getElementById('statusBadge');
    const explanation = document.getElementById('explanationText');
    
    if (state.degree <= 2) {
        badge.className = 'status-badge status-underfit';
        badge.textContent = 'Subajuste';
        explanation.innerHTML = 'Con un polinomio de grado ' + state.degree + ', el modelo es muy simple y no puede capturar la complejidad de los datos. Esto se llama <strong>subajuste</strong> (underfitting): el modelo tiene <strong>alto sesgo</strong> y bajo poder predictivo.';
    } else if (state.degree <= 5) {
        badge.className = 'status-badge status-optimal';
        badge.textContent = 'Óptimo';
        explanation.innerHTML = 'Con un polinomio de grado ' + state.degree + ', el modelo tiene un buen balance entre sesgo y varianza. Este es el <strong>punto óptimo</strong> donde el error de prueba alcanza su valor mínimo.';
    } else if (state.degree <= 9) {
        badge.className = 'status-badge status-overfit';
        badge.textContent = 'Sobreajuste';
        explanation.innerHTML = 'Con un polinomio de grado ' + state.degree + ', el modelo comienza a ajustarse al ruido en los datos. El <strong>error de prueba comienza a subir</strong> mientras el de entrenamiento sigue bajando. Esto indica <strong>sobreajuste</strong> (overfitting).';
    } else {
        badge.className = 'status-badge status-overfit';
        badge.textContent = 'Sobreajuste severo';
        explanation.innerHTML = 'Con un polinomio de grado ' + state.degree + ', el modelo memoriza los datos de entrenamiento incluyendo el ruido. Tiene <strong>alta varianza</strong>: pequeños cambios en los datos producen modelos muy diferentes.';
    }
}

function colorMetric(id, value, goodThreshold, badThreshold, lowerIsBetter) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (lowerIsBetter) {
        if (value < goodThreshold) {
            el.className = 'metric-value positive';
        } else if (value > badThreshold) {
            el.className = 'metric-value negative';
        } else {
            el.className = 'metric-value neutral';
        }
    } else {
        if (value > goodThreshold) {
            el.className = 'metric-value positive';
        } else if (value < badThreshold) {
            el.className = 'metric-value negative';
        } else {
            el.className = 'metric-value neutral';
        }
    }
}

// ============================================
// Animación
// ============================================

function animateDegrees() {
    if (state.isAnimating) {
        state.isAnimating = false;
        document.getElementById('animateBtn').textContent = '▶️ Animar';
        return;
    }
    
    state.isAnimating = true;
    document.getElementById('animateBtn').textContent = '⏸️ Detener';
    
    const slider = document.getElementById('degreeSlider');
    let currentDeg = 1;
    
    function step() {
        if (!state.isAnimating || currentDeg > 15) {
            state.isAnimating = false;
            document.getElementById('animateBtn').textContent = '▶️ Animar';
            return;
        }
        
        state.degree = currentDeg;
        slider.value = currentDeg;
        document.getElementById('degreeValue').textContent = currentDeg;
        updateModel();
        
        currentDeg++;
        setTimeout(step, 600);
    }
    
    step();
}

// Permitir detener con Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state.isAnimating) {
        state.isAnimating = false;
        document.getElementById('animateBtn').textContent = '▶️ Animar';
    }
});

console.log('Script cargado correctamente');
