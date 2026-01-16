// K-Fold Cross-Validation Animator
// Visualiza cómo funciona la validación cruzada

// Colores para cada fold (estilo MLU Explain)
const FOLD_COLORS = [
    '#0073bb', // azul
    '#ff9900', // naranja
    '#1e8e8e', // teal
    '#7b68ee', // púrpura
    '#e74c3c', // rojo
    '#2ecc71', // verde
    '#9b59b6', // violeta
    '#f39c12', // amarillo oscuro
    '#1abc9c', // turquesa
    '#e91e63'  // rosa
];

// Estado global
let data = [];
let K = 5;
let currentFold = -1;
let foldResults = [];
let isAnimating = false;
let chart = null;

// Elementos del DOM
const kSlider = document.getElementById('kSlider');
const kValue = document.getElementById('kValue');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const noiseSlider = document.getElementById('noiseSlider');
const noiseValue = document.getElementById('noiseValue');
const nextFoldBtn = document.getElementById('nextFoldBtn');
const animateBtn = document.getElementById('animateBtn');
const resetBtn = document.getElementById('resetBtn');
const foldsContainer = document.getElementById('foldsContainer');
const resultsBody = document.getElementById('resultsBody');
const currentFoldNum = document.getElementById('currentFoldNum');
const currentFoldDesc = document.getElementById('currentFoldDesc');
const avgMSE = document.getElementById('avgMSE');
const stdMSE = document.getElementById('stdMSE');
const completedFolds = document.getElementById('completedFolds');
const explanationText = document.getElementById('explanationText');

// Función verdadera para generar datos
function trueFn(x) {
    return 0.5 * Math.sin(2 * Math.PI * x) + 0.3 * x;
}

// Generar datos con ruido
function generateData(n, noise) {
    const result = [];
    for (let i = 0; i < n; i++) {
        const x = Math.random();
        const y = trueFn(x) + (Math.random() - 0.5) * noise * 2;
        result.push({ x, y, foldIndex: -1 });
    }
    // Ordenar por x para mejor visualización
    result.sort((a, b) => a.x - b.x);
    return result;
}

// Asignar puntos a folds
function assignFolds(data, k) {
    // Barajar índices
    const indices = [...Array(data.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Asignar folds
    const foldSize = Math.floor(data.length / k);
    const remainder = data.length % k;
    
    let currentIndex = 0;
    for (let fold = 0; fold < k; fold++) {
        const size = foldSize + (fold < remainder ? 1 : 0);
        for (let i = 0; i < size; i++) {
            data[indices[currentIndex]].foldIndex = fold;
            currentIndex++;
        }
    }
    
    return data;
}

// Ajuste polinomial (grado 3 para simplicidad)
function polynomialFit(points, degree = 3) {
    const n = points.length;
    if (n < degree + 1) return null;
    
    // Construir matriz de Vandermonde
    const X = [];
    const y = [];
    
    for (const p of points) {
        const row = [];
        for (let j = 0; j <= degree; j++) {
            row.push(Math.pow(p.x, j));
        }
        X.push(row);
        y.push(p.y);
    }
    
    // Resolver X^T * X * coeffs = X^T * y
    const Xt = transpose(X);
    const XtX = multiply(Xt, X);
    const Xty = multiplyVec(Xt, y);
    
    // Regularización para estabilidad numérica
    for (let i = 0; i < XtX.length; i++) {
        XtX[i][i] += 0.001;
    }
    
    const coeffs = solve(XtX, Xty);
    return coeffs;
}

// Funciones de álgebra lineal
function transpose(A) {
    return A[0].map((_, i) => A.map(row => row[i]));
}

function multiply(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < B[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < B.length; k++) {
                sum += A[i][k] * B[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function multiplyVec(A, v) {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
}

function solve(A, b) {
    // Eliminación gaussiana con pivoteo parcial
    const n = A.length;
    const M = A.map((row, i) => [...row, b[i]]);
    
    for (let col = 0; col < n; col++) {
        // Encontrar pivote
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) {
                maxRow = row;
            }
        }
        [M[col], M[maxRow]] = [M[maxRow], M[col]];
        
        if (Math.abs(M[col][col]) < 1e-10) continue;
        
        // Eliminar
        for (let row = col + 1; row < n; row++) {
            const factor = M[row][col] / M[col][col];
            for (let j = col; j <= n; j++) {
                M[row][j] -= factor * M[col][j];
            }
        }
    }
    
    // Sustitución hacia atrás
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = M[i][n];
        for (let j = i + 1; j < n; j++) {
            sum -= M[i][j] * x[j];
        }
        x[i] = Math.abs(M[i][i]) > 1e-10 ? sum / M[i][i] : 0;
    }
    
    return x;
}

// Evaluar polinomio
function evaluatePoly(coeffs, x) {
    return coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
}

// Calcular MSE
function calculateMSE(points, coeffs) {
    if (!coeffs || coeffs.length === 0) return Infinity;
    let sum = 0;
    for (const p of points) {
        const pred = evaluatePoly(coeffs, p.x);
        sum += Math.pow(p.y - pred, 2);
    }
    return sum / points.length;
}

// Renderizar visualización de folds
function renderFolds() {
    foldsContainer.innerHTML = '';
    
    for (let fold = 0; fold < K; fold++) {
        const row = document.createElement('div');
        row.className = 'fold-row';
        row.id = `fold-row-${fold}`;
        
        // Label
        const label = document.createElement('span');
        label.className = 'fold-label';
        label.textContent = `Fold ${fold + 1}`;
        row.appendChild(label);
        
        // Barra de folds
        const bar = document.createElement('div');
        bar.className = 'fold-bar';
        
        for (let i = 0; i < K; i++) {
            const segment = document.createElement('div');
            segment.className = 'fold-segment train';
            segment.style.backgroundColor = FOLD_COLORS[i];
            segment.style.flex = '1';
            segment.textContent = i + 1;
            
            if (i === fold) {
                segment.className = 'fold-segment validation';
                segment.textContent = 'Val';
            }
            
            bar.appendChild(segment);
        }
        
        row.appendChild(bar);
        
        // MSE
        const mseSpan = document.createElement('span');
        mseSpan.className = 'fold-mse';
        mseSpan.id = `fold-mse-${fold}`;
        mseSpan.textContent = '—';
        row.appendChild(mseSpan);
        
        foldsContainer.appendChild(row);
    }
}

// Renderizar tabla de resultados
function renderResultsTable() {
    resultsBody.innerHTML = '';
    
    for (let fold = 0; fold < K; fold++) {
        const tr = document.createElement('tr');
        tr.id = `result-row-${fold}`;
        
        const tdFold = document.createElement('td');
        tdFold.textContent = `Fold ${fold + 1}`;
        tr.appendChild(tdFold);
        
        const tdMSE = document.createElement('td');
        tdMSE.id = `result-mse-${fold}`;
        tdMSE.textContent = '—';
        tr.appendChild(tdMSE);
        
        const tdStatus = document.createElement('td');
        tdStatus.id = `result-status-${fold}`;
        tdStatus.textContent = 'Pendiente';
        tr.appendChild(tdStatus);
        
        resultsBody.appendChild(tr);
    }
}

// Inicializar gráfico
function initChart() {
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Entrenamiento',
                    data: [],
                    backgroundColor: '#0073bb',
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Validación',
                    data: [],
                    backgroundColor: '#ff9900',
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Modelo',
                    data: [],
                    type: 'line',
                    borderColor: '#1e8e8e',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: { family: "'Source Sans Pro'" }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'X',
                        font: { family: "'Source Sans Pro'", weight: 'bold' }
                    },
                    min: 0,
                    max: 1
                },
                y: {
                    title: {
                        display: true,
                        text: 'Y',
                        font: { family: "'Source Sans Pro'", weight: 'bold' }
                    }
                }
            }
        }
    });
}

// Ejecutar fold
function runFold(foldIndex) {
    if (foldIndex < 0 || foldIndex >= K) return null;
    
    // Separar train y validation
    const trainData = data.filter(p => p.foldIndex !== foldIndex);
    const valData = data.filter(p => p.foldIndex === foldIndex);
    
    // Ajustar modelo
    const coeffs = polynomialFit(trainData, 3);
    
    // Calcular MSE en validación
    const mse = calculateMSE(valData, coeffs);
    
    return { trainData, valData, coeffs, mse };
}

// Actualizar visualización del fold actual
function updateVisualization(foldIndex, result) {
    // Actualizar indicador
    currentFoldNum.textContent = foldIndex + 1;
    currentFoldDesc.textContent = `Usando fold ${foldIndex + 1} como validación, folds ${[...Array(K).keys()].filter(i => i !== foldIndex).map(i => i + 1).join(', ')} como entrenamiento`;
    
    // Actualizar gráfico
    chart.data.datasets[0].data = result.trainData.map(p => ({ x: p.x, y: p.y }));
    chart.data.datasets[1].data = result.valData.map(p => ({ x: p.x, y: p.y }));
    
    // Línea del modelo
    const lineData = [];
    for (let x = 0; x <= 1; x += 0.01) {
        lineData.push({ x, y: evaluatePoly(result.coeffs, x) });
    }
    chart.data.datasets[2].data = lineData;
    
    chart.update();
    
    // Actualizar MSE en la visualización de folds
    document.getElementById(`fold-mse-${foldIndex}`).textContent = result.mse.toFixed(4);
    
    // Actualizar tabla de resultados
    document.getElementById(`result-mse-${foldIndex}`).textContent = result.mse.toFixed(4);
    document.getElementById(`result-status-${foldIndex}`).textContent = '✓ Completado';
    
    // Marcar fila como activa
    for (let i = 0; i < K; i++) {
        const row = document.getElementById(`result-row-${i}`);
        row.classList.remove('active');
        if (foldResults[i] !== undefined) {
            row.classList.add('completed');
        }
    }
    document.getElementById(`result-row-${foldIndex}`).classList.add('active');
    
    // Resaltar fold actual en la visualización
    const foldRows = foldsContainer.querySelectorAll('.fold-row');
    foldRows.forEach((row, i) => {
        row.style.opacity = i === foldIndex ? '1' : '0.5';
        row.style.transform = i === foldIndex ? 'scale(1.02)' : 'scale(1)';
        row.style.transition = 'all 0.3s ease';
    });
    
    // Actualizar resumen
    updateSummary();
}

// Actualizar resumen
function updateSummary() {
    const completedCount = foldResults.filter(r => r !== undefined).length;
    completedFolds.textContent = `${completedCount} / ${K}`;
    
    if (completedCount > 0) {
        const validResults = foldResults.filter(r => r !== undefined);
        const mseValues = validResults.map(r => r.mse);
        
        const mean = mseValues.reduce((a, b) => a + b, 0) / mseValues.length;
        avgMSE.textContent = mean.toFixed(4);
        
        if (completedCount > 1) {
            const variance = mseValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / mseValues.length;
            stdMSE.textContent = Math.sqrt(variance).toFixed(4);
        } else {
            stdMSE.textContent = '—';
        }
    } else {
        avgMSE.textContent = '—';
        stdMSE.textContent = '—';
    }
    
    // Actualizar texto explicativo
    if (completedCount === K) {
        explanationText.textContent = `¡Validación cruzada completada! Con K=${K}, cada punto fue usado exactamente una vez para validación. ` +
            `El MSE promedio (${avgMSE.textContent}) es una estimación más robusta del error de generalización que usar un solo split train/test.`;
    }
}

// Siguiente fold
function nextFold() {
    if (isAnimating) return;
    
    currentFold++;
    if (currentFold >= K) {
        currentFold = 0;
    }
    
    const result = runFold(currentFold);
    if (result) {
        foldResults[currentFold] = result;
        updateVisualization(currentFold, result);
    }
}

// Animar todos los folds
async function animateAllFolds() {
    if (isAnimating) {
        isAnimating = false;
        animateBtn.textContent = '▶ Animar todo';
        return;
    }
    
    isAnimating = true;
    animateBtn.textContent = '⏸ Pausar';
    
    // Reiniciar si ya se completó
    if (foldResults.filter(r => r !== undefined).length === K) {
        resetState();
    }
    
    for (let i = 0; i < K; i++) {
        if (!isAnimating) break;
        
        currentFold = i;
        const result = runFold(i);
        if (result) {
            foldResults[i] = result;
            updateVisualization(i, result);
        }
        
        // Esperar entre folds
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    isAnimating = false;
    animateBtn.textContent = '▶ Animar todo';
}

// Reiniciar estado
function resetState() {
    currentFold = -1;
    foldResults = new Array(K).fill(undefined);
    
    // Reiniciar indicador
    currentFoldNum.textContent = '—';
    currentFoldDesc.textContent = 'Haz clic en "Siguiente fold" o "Animar todo" para comenzar';
    
    // Reiniciar gráfico
    chart.data.datasets[0].data = data.map(p => ({ x: p.x, y: p.y }));
    chart.data.datasets[1].data = [];
    chart.data.datasets[2].data = [];
    chart.data.datasets[0].backgroundColor = data.map(p => FOLD_COLORS[p.foldIndex]);
    chart.update();
    
    // Reiniciar visualización de folds
    renderFolds();
    renderResultsTable();
    
    // Reiniciar resumen
    avgMSE.textContent = '—';
    stdMSE.textContent = '—';
    completedFolds.textContent = `0 / ${K}`;
    
    // Resetear texto explicativo
    explanationText.textContent = 'La validación cruzada permite utilizar todos los datos tanto para entrenar como para evaluar, ' +
        'obteniendo una estimación más robusta del error de generalización. Con K-fold, dividimos ' +
        'los datos en K partes iguales, y en cada iteración usamos K-1 partes para entrenar y ' +
        '1 parte para validar.';
}

// Inicializar todo
function initialize() {
    const n = parseInt(sizeSlider.value);
    const noise = parseInt(noiseSlider.value) / 100;
    K = parseInt(kSlider.value);
    
    // Generar datos
    data = generateData(n, noise);
    data = assignFolds(data, K);
    
    // Inicializar UI
    renderFolds();
    renderResultsTable();
    initChart();
    
    // Mostrar datos iniciales con colores por fold
    chart.data.datasets[0].data = data.map(p => ({ x: p.x, y: p.y }));
    chart.data.datasets[0].backgroundColor = data.map(p => FOLD_COLORS[p.foldIndex]);
    chart.data.datasets[0].label = 'Datos (coloreados por fold)';
    chart.data.datasets[1].data = [];
    chart.data.datasets[2].data = [];
    chart.update();
    
    // Reiniciar estado
    currentFold = -1;
    foldResults = new Array(K).fill(undefined);
    completedFolds.textContent = `0 / ${K}`;
    avgMSE.textContent = '—';
    stdMSE.textContent = '—';
    currentFoldNum.textContent = '—';
    currentFoldDesc.textContent = 'Haz clic en "Siguiente fold" o "Animar todo" para comenzar';
}

// Event listeners
kSlider.addEventListener('input', () => {
    kValue.textContent = kSlider.value;
    initialize();
});

sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value;
    initialize();
});

noiseSlider.addEventListener('input', () => {
    noiseValue.textContent = (parseInt(noiseSlider.value) / 100).toFixed(2);
    initialize();
});

nextFoldBtn.addEventListener('click', nextFold);
animateBtn.addEventListener('click', animateAllFolds);
resetBtn.addEventListener('click', () => {
    isAnimating = false;
    animateBtn.textContent = '▶ Animar todo';
    initialize();
});

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initialize);
