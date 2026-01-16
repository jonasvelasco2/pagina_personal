/**
 * Playground de overfitting
 * Visualización interactiva de clasificación con diferentes niveles de complejidad
 */

// Colores
const COLORS = {
    classA: '#0073bb',
    classB: '#ff9900',
    classALight: 'rgba(0, 115, 187, 0.15)',
    classBLight: 'rgba(255, 153, 0, 0.15)',
    grid: '#f0f0f0',
    border: '#e8e8e8'
};

// Estado de la aplicación
let state = {
    points: [],           // Todos los puntos {x, y, class: 'A' | 'B'}
    trainPoints: [],
    testPoints: [],
    currentClass: 'A',
    complexity: 1,
    splitRatio: 0.7,
    modelTrained: false,
    decisionBoundary: null
};

// Canvas y contexto
let canvas, ctx;
const canvasWidth = 600;
const canvasHeight = 450;

// ============================================
// Inicialización
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('mainCanvas');
    ctx = canvas.getContext('2d');
    
    // Ajustar canvas para pantallas de alta densidad
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(dpr, dpr);
    
    setupEventListeners();
    render();
    
    console.log('Playground iniciado');
});

function setupEventListeners() {
    // Canvas click
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addPoint(x, y);
    });
    
    // Botones de clase
    document.getElementById('classABtn').addEventListener('click', function() {
        state.currentClass = 'A';
        this.classList.add('active');
        document.getElementById('classBBtn').classList.remove('active');
    });
    
    document.getElementById('classBBtn').addEventListener('click', function() {
        state.currentClass = 'B';
        this.classList.add('active');
        document.getElementById('classABtn').classList.remove('active');
    });
    
    // Slider de complejidad
    document.getElementById('complexitySlider').addEventListener('input', function(e) {
        state.complexity = parseInt(e.target.value);
        document.getElementById('complexityValue').textContent = state.complexity;
        if (state.modelTrained) {
            trainModel();
        }
    });
    
    // Slider de split
    document.getElementById('splitSlider').addEventListener('input', function(e) {
        state.splitRatio = parseInt(e.target.value) / 100;
        document.getElementById('splitValue').textContent = e.target.value + '%';
        splitData();
        if (state.modelTrained) {
            trainModel();
        }
    });
    
    // Botón entrenar
    document.getElementById('trainBtn').addEventListener('click', function() {
        trainModel();
    });
    
    // Botón limpiar
    document.getElementById('clearBtn').addEventListener('click', function() {
        clearAll();
    });
}

// ============================================
// Manejo de datos
// ============================================

function addPoint(x, y) {
    state.points.push({
        x: x,
        y: y,
        class: state.currentClass
    });
    
    splitData();
    state.modelTrained = false;
    updateUI();
    render();
}

function splitData() {
    // Shuffle points
    const shuffled = [...state.points].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * state.splitRatio);
    
    state.trainPoints = shuffled.slice(0, splitIdx);
    state.testPoints = shuffled.slice(splitIdx);
    
    updateCounts();
}

function clearAll() {
    state.points = [];
    state.trainPoints = [];
    state.testPoints = [];
    state.modelTrained = false;
    state.decisionBoundary = null;
    
    updateUI();
    render();
}

function updateCounts() {
    const countA = state.points.filter(p => p.class === 'A').length;
    const countB = state.points.filter(p => p.class === 'B').length;
    
    document.getElementById('countA').textContent = countA;
    document.getElementById('countB').textContent = countB;
    document.getElementById('countTrain').textContent = state.trainPoints.length;
    document.getElementById('countTest').textContent = state.testPoints.length;
}

function updateUI() {
    updateCounts();
    
    if (!state.modelTrained) {
        document.getElementById('accTrain').textContent = '—';
        document.getElementById('accTest').textContent = '—';
        document.getElementById('modelStatus').textContent = 'Sin entrenar';
        document.getElementById('modelStatus').className = 'status-value';
    }
}

// ============================================
// Modelo K-NN (K-Nearest Neighbors)
// ============================================

function trainModel() {
    if (state.trainPoints.length < 2) {
        alert('Necesitas al menos 2 puntos de entrenamiento');
        return;
    }
    
    const classA = state.trainPoints.filter(p => p.class === 'A');
    const classB = state.trainPoints.filter(p => p.class === 'B');
    
    if (classA.length === 0 || classB.length === 0) {
        alert('Necesitas puntos de ambas clases');
        return;
    }
    
    state.modelTrained = true;
    
    // Generar frontera de decisión
    generateDecisionBoundary();
    
    // Calcular accuracy
    const trainAcc = calculateAccuracy(state.trainPoints);
    const testAcc = calculateAccuracy(state.testPoints);
    
    // Actualizar UI
    document.getElementById('accTrain').textContent = (trainAcc * 100).toFixed(1) + '%';
    document.getElementById('accTest').textContent = (testAcc * 100).toFixed(1) + '%';
    
    // Colorear según rendimiento
    const accTrainEl = document.getElementById('accTrain');
    const accTestEl = document.getElementById('accTest');
    
    accTrainEl.className = 'metric-value ' + (trainAcc > 0.7 ? 'good' : 'bad');
    accTestEl.className = 'metric-value ' + (testAcc > 0.7 ? 'good' : 'bad');
    
    // Determinar estado
    updateModelStatus(trainAcc, testAcc);
    
    render();
}

function predict(x, y) {
    // K-NN con K basado en complejidad (invertido: mayor complejidad = menor K)
    const k = Math.max(1, 11 - state.complexity);
    
    // Calcular distancias a todos los puntos de entrenamiento
    const distances = state.trainPoints.map(p => ({
        distance: Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)),
        class: p.class
    }));
    
    // Ordenar por distancia
    distances.sort((a, b) => a.distance - b.distance);
    
    // Tomar los K más cercanos
    const nearest = distances.slice(0, k);
    
    // Votar
    const countA = nearest.filter(n => n.class === 'A').length;
    const countB = nearest.filter(n => n.class === 'B').length;
    
    return countA >= countB ? 'A' : 'B';
}

function calculateAccuracy(points) {
    if (points.length === 0) return 0;
    
    let correct = 0;
    for (const p of points) {
        const predicted = predict(p.x, p.y);
        if (predicted === p.class) correct++;
    }
    
    return correct / points.length;
}

function generateDecisionBoundary() {
    const resolution = 8; // Píxeles por celda
    const rows = Math.ceil(canvasHeight / resolution);
    const cols = Math.ceil(canvasWidth / resolution);
    
    state.decisionBoundary = [];
    
    for (let row = 0; row < rows; row++) {
        state.decisionBoundary[row] = [];
        for (let col = 0; col < cols; col++) {
            const x = col * resolution + resolution / 2;
            const y = row * resolution + resolution / 2;
            state.decisionBoundary[row][col] = predict(x, y);
        }
    }
}

function updateModelStatus(trainAcc, testAcc) {
    const statusEl = document.getElementById('modelStatus');
    const explanationEl = document.getElementById('explanationText');
    const diff = trainAcc - testAcc;
    
    if (trainAcc < 0.7 && testAcc < 0.7) {
        statusEl.textContent = 'Subajuste';
        statusEl.className = 'status-value status-underfit';
        explanationEl.innerHTML = 'El modelo es <strong>demasiado simple</strong> para capturar los patrones en los datos. Tanto el accuracy de entrenamiento como el de prueba son bajos. Intenta aumentar la complejidad.';
    } else if (diff > 0.15 && trainAcc > 0.85) {
        statusEl.textContent = 'Sobreajuste';
        statusEl.className = 'status-value status-overfit';
        explanationEl.innerHTML = 'El modelo está <strong>memorizando los datos de entrenamiento</strong>. El accuracy de entrenamiento es alto pero el de prueba es significativamente menor. Reduce la complejidad.';
    } else {
        statusEl.textContent = 'Buen ajuste';
        statusEl.className = 'status-value status-optimal';
        explanationEl.innerHTML = 'El modelo tiene un <strong>buen balance</strong> entre sesgo y varianza. Los accuracy de entrenamiento y prueba son similares y razonablemente altos.';
    }
}

// ============================================
// Renderizado
// ============================================

function render() {
    // Limpiar canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Dibujar grilla
    drawGrid();
    
    // Dibujar frontera de decisión
    if (state.modelTrained && state.decisionBoundary) {
        drawDecisionBoundary();
    }
    
    // Dibujar puntos de prueba (más transparentes)
    for (const p of state.testPoints) {
        drawPoint(p.x, p.y, p.class, true);
    }
    
    // Dibujar puntos de entrenamiento
    for (const p of state.trainPoints) {
        drawPoint(p.x, p.y, p.class, false);
    }
}

function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    // Líneas verticales
    for (let x = 0; x <= canvasWidth; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
    
    // Líneas horizontales
    for (let y = 0; y <= canvasHeight; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}

function drawDecisionBoundary() {
    const resolution = 8;
    
    for (let row = 0; row < state.decisionBoundary.length; row++) {
        for (let col = 0; col < state.decisionBoundary[row].length; col++) {
            const predictedClass = state.decisionBoundary[row][col];
            const x = col * resolution;
            const y = row * resolution;
            
            ctx.fillStyle = predictedClass === 'A' ? COLORS.classALight : COLORS.classBLight;
            ctx.fillRect(x, y, resolution, resolution);
        }
    }
}

function drawPoint(x, y, pointClass, isTest) {
    const radius = 8;
    const color = pointClass === 'A' ? COLORS.classA : COLORS.classB;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (isTest) {
        // Puntos de prueba: solo borde
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.stroke();
    } else {
        // Puntos de entrenamiento: rellenos
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

console.log('Script cargado');
