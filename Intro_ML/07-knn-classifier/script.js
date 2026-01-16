// K-NN Classifier Visual
// Visualiza cómo funciona el algoritmo K-Nearest Neighbors

// Colores
const COLORS = {
    classA: '#0073bb',
    classB: '#ff9900',
    classC: '#1d8102',
    query: '#d13212',
    neighbor: 'rgba(0,0,0,0.3)',
    boundary: {
        A: 'rgba(0, 115, 187, 0.3)',
        B: 'rgba(255, 153, 0, 0.3)',
        C: 'rgba(29, 129, 2, 0.3)'
    }
};

// Estado global
let trainingPoints = [];
let queryPoint = null;
let neighbors = [];
let K = 3;
let currentClass = 'A';
let mode = 'classify'; // 'draw' or 'classify'
let showBoundary = false;
let isAnimating = false;
let boundaryImageData = null;

// Elementos del DOM
const canvas = document.getElementById('knnCanvas');
const ctx = canvas.getContext('2d');
const kSlider = document.getElementById('kSlider');
const kValue = document.getElementById('kValue');
const modeDrawBtn = document.getElementById('modeDrawBtn');
const modeClassifyBtn = document.getElementById('modeClassifyBtn');
const showBoundaryToggle = document.getElementById('showBoundary');
const animateBtn = document.getElementById('animateBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const canvasHint = document.getElementById('canvasHint');

const predictionResult = document.getElementById('predictionResult');
const voteBarA = document.getElementById('voteBarA');
const voteBarB = document.getElementById('voteBarB');
const voteBarC = document.getElementById('voteBarC');
const voteCountA = document.getElementById('voteCountA');
const voteCountB = document.getElementById('voteCountB');
const voteCountC = document.getElementById('voteCountC');
const neighborsList = document.getElementById('neighborsList');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');

const classBtns = document.querySelectorAll('.class-btn');

// Distancia euclidiana
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Obtener K vecinos más cercanos
function getKNeighbors(point, k) {
    const distances = trainingPoints.map((tp, idx) => ({
        point: tp,
        index: idx,
        dist: distance(point, tp)
    }));
    
    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, k);
}

// Clasificar un punto
function classify(point, k) {
    if (trainingPoints.length === 0) return null;
    
    const nearestNeighbors = getKNeighbors(point, Math.min(k, trainingPoints.length));
    
    // Contar votos
    const votes = { A: 0, B: 0, C: 0 };
    for (const n of nearestNeighbors) {
        votes[n.point.class]++;
    }
    
    // Encontrar clase ganadora
    let maxVotes = 0;
    let winner = null;
    for (const cls of ['A', 'B', 'C']) {
        if (votes[cls] > maxVotes) {
            maxVotes = votes[cls];
            winner = cls;
        }
    }
    
    return { prediction: winner, votes, neighbors: nearestNeighbors };
}

// Dibujar punto
function drawPoint(x, y, cls, isQuery = false, isNeighbor = false, animationProgress = 1) {
    const radius = isQuery ? 10 : 7;
    
    ctx.beginPath();
    ctx.arc(x, y, radius * animationProgress, 0, 2 * Math.PI);
    
    if (isQuery) {
        ctx.fillStyle = COLORS.query;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dibujar X
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        const s = 4 * animationProgress;
        ctx.moveTo(x - s, y - s);
        ctx.lineTo(x + s, y + s);
        ctx.moveTo(x + s, y - s);
        ctx.lineTo(x - s, y + s);
        ctx.stroke();
    } else {
        const color = cls === 'A' ? COLORS.classA : cls === 'B' ? COLORS.classB : COLORS.classC;
        ctx.fillStyle = color;
        ctx.fill();
        
        if (isNeighbor) {
            ctx.strokeStyle = COLORS.query;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// Dibujar línea de conexión a vecino
function drawNeighborLine(query, neighbor, alpha = 1) {
    ctx.beginPath();
    ctx.moveTo(query.x, query.y);
    ctx.lineTo(neighbor.x, neighbor.y);
    ctx.strokeStyle = `rgba(209, 50, 18, ${0.3 * alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Calcular frontera de decisión
function calculateBoundary() {
    if (trainingPoints.length < K) return null;
    
    const resolution = 4;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    
    for (let x = 0; x < canvas.width; x += resolution) {
        for (let y = 0; y < canvas.height; y += resolution) {
            const result = classify({ x, y }, K);
            
            let r, g, b, a;
            if (result && result.prediction) {
                if (result.prediction === 'A') {
                    r = 0; g = 115; b = 187; a = 60;
                } else if (result.prediction === 'B') {
                    r = 255; g = 153; b = 0; a = 60;
                } else {
                    r = 29; g = 129; b = 2; a = 60;
                }
            } else {
                r = 200; g = 200; b = 200; a = 30;
            }
            
            // Fill resolution x resolution block
            for (let dx = 0; dx < resolution && x + dx < canvas.width; dx++) {
                for (let dy = 0; dy < resolution && y + dy < canvas.height; dy++) {
                    const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
                    imageData.data[idx] = r;
                    imageData.data[idx + 1] = g;
                    imageData.data[idx + 2] = b;
                    imageData.data[idx + 3] = a;
                }
            }
        }
    }
    
    return imageData;
}

// Renderizar todo
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar frontera de decisión
    if (showBoundary && boundaryImageData) {
        ctx.putImageData(boundaryImageData, 0, 0);
    }
    
    // Dibujar líneas a vecinos
    if (queryPoint && neighbors.length > 0) {
        for (const n of neighbors) {
            drawNeighborLine(queryPoint, n.point);
        }
    }
    
    // Dibujar puntos de entrenamiento
    for (let i = 0; i < trainingPoints.length; i++) {
        const p = trainingPoints[i];
        const isNeighbor = neighbors.some(n => n.index === i);
        drawPoint(p.x, p.y, p.class, false, isNeighbor);
    }
    
    // Dibujar punto de consulta
    if (queryPoint) {
        drawPoint(queryPoint.x, queryPoint.y, null, true);
    }
}

// Actualizar panel de resultados
function updateResults() {
    if (!queryPoint || trainingPoints.length === 0) {
        predictionResult.textContent = '—';
        predictionResult.className = 'prediction-result none';
        voteBarA.style.width = '0%';
        voteBarB.style.width = '0%';
        voteBarC.style.width = '0%';
        voteCountA.textContent = '0';
        voteCountB.textContent = '0';
        voteCountC.textContent = '0';
        neighborsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem;">Haz clic en el canvas para clasificar un punto</p>';
        return;
    }
    
    const result = classify(queryPoint, K);
    neighbors = result.neighbors;
    
    // Predicción
    predictionResult.textContent = `Clase ${result.prediction}`;
    predictionResult.className = `prediction-result class-${result.prediction.toLowerCase()}`;
    
    // Votos
    const maxVote = Math.max(result.votes.A, result.votes.B, result.votes.C);
    const total = result.votes.A + result.votes.B + result.votes.C;
    
    voteBarA.style.width = total > 0 ? `${(result.votes.A / total) * 100}%` : '0%';
    voteBarB.style.width = total > 0 ? `${(result.votes.B / total) * 100}%` : '0%';
    voteBarC.style.width = total > 0 ? `${(result.votes.C / total) * 100}%` : '0%';
    
    voteCountA.textContent = result.votes.A;
    voteCountB.textContent = result.votes.B;
    voteCountC.textContent = result.votes.C;
    
    // Lista de vecinos
    neighborsList.innerHTML = '';
    for (let i = 0; i < neighbors.length; i++) {
        const n = neighbors[i];
        const item = document.createElement('div');
        item.className = 'neighbor-item';
        item.innerHTML = `
            <span class="neighbor-rank">${i + 1}.</span>
            <span class="neighbor-dot class-${n.point.class.toLowerCase()}"></span>
            <span>Clase ${n.point.class}</span>
            <span class="neighbor-dist">d = ${n.dist.toFixed(1)}</span>
        `;
        neighborsList.appendChild(item);
    }
    
    render();
}

// Animar búsqueda de vecinos
async function animateSearch() {
    if (!queryPoint || trainingPoints.length === 0 || isAnimating) return;
    
    isAnimating = true;
    animateBtn.textContent = '⏳ Animando...';
    
    // Calcular todas las distancias
    const allDistances = trainingPoints.map((tp, idx) => ({
        point: tp,
        index: idx,
        dist: distance(queryPoint, tp)
    }));
    allDistances.sort((a, b) => a.dist - b.dist);
    
    // Animar uno por uno
    neighbors = [];
    for (let i = 0; i < Math.min(K, allDistances.length); i++) {
        neighbors.push(allDistances[i]);
        
        // Actualizar votos parciales
        const votes = { A: 0, B: 0, C: 0 };
        for (const n of neighbors) {
            votes[n.point.class]++;
        }
        
        const total = neighbors.length;
        voteBarA.style.width = `${(votes.A / K) * 100}%`;
        voteBarB.style.width = `${(votes.B / K) * 100}%`;
        voteBarC.style.width = `${(votes.C / K) * 100}%`;
        voteCountA.textContent = votes.A;
        voteCountB.textContent = votes.B;
        voteCountC.textContent = votes.C;
        
        // Actualizar lista
        neighborsList.innerHTML = '';
        for (let j = 0; j <= i; j++) {
            const n = neighbors[j];
            const item = document.createElement('div');
            item.className = 'neighbor-item';
            item.innerHTML = `
                <span class="neighbor-rank">${j + 1}.</span>
                <span class="neighbor-dot class-${n.point.class.toLowerCase()}"></span>
                <span>Clase ${n.point.class}</span>
                <span class="neighbor-dist">d = ${n.dist.toFixed(1)}</span>
            `;
            neighborsList.appendChild(item);
        }
        
        render();
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    // Mostrar resultado final
    const finalResult = classify(queryPoint, K);
    predictionResult.textContent = `Clase ${finalResult.prediction}`;
    predictionResult.className = `prediction-result class-${finalResult.prediction.toLowerCase()}`;
    
    isAnimating = false;
    animateBtn.textContent = '▶ Animar búsqueda';
}

// Generar datos de ejemplo
function generateSampleData() {
    trainingPoints = [];
    
    // Cluster A (arriba izquierda)
    for (let i = 0; i < 15; i++) {
        trainingPoints.push({
            x: 100 + Math.random() * 150,
            y: 80 + Math.random() * 120,
            class: 'A'
        });
    }
    
    // Cluster B (abajo derecha)
    for (let i = 0; i < 15; i++) {
        trainingPoints.push({
            x: 350 + Math.random() * 150,
            y: 280 + Math.random() * 120,
            class: 'B'
        });
    }
    
    // Cluster C (centro)
    for (let i = 0; i < 12; i++) {
        trainingPoints.push({
            x: 250 + Math.random() * 100,
            y: 180 + Math.random() * 100,
            class: 'C'
        });
    }
    
    queryPoint = null;
    neighbors = [];
    
    if (showBoundary) {
        boundaryImageData = calculateBoundary();
    }
    
    updateResults();
    render();
}

// Actualizar frontera
function updateBoundary() {
    if (showBoundary && trainingPoints.length >= K) {
        boundaryImageData = calculateBoundary();
    } else {
        boundaryImageData = null;
    }
    render();
}

// Manejar clic en canvas
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (mode === 'draw') {
        trainingPoints.push({ x, y, class: currentClass });
        updateBoundary();
        updateResults();
    } else {
        queryPoint = { x, y };
        updateResults();
    }
});

// Event listeners
kSlider.addEventListener('input', () => {
    K = parseInt(kSlider.value);
    kValue.textContent = K;
    updateBoundary();
    updateResults();
    
    // Actualizar info
    if (K === 1) {
        infoText.textContent = 'Con K=1, cada punto se clasifica según su vecino más cercano. ' +
            'Esto puede causar overfitting ya que es muy sensible al ruido.';
    } else if (K <= 3) {
        infoText.textContent = 'Con un K pequeño, el modelo captura patrones locales pero puede ' +
            'ser sensible a puntos atípicos (outliers).';
    } else if (K <= 7) {
        infoText.textContent = 'Un K moderado suele dar buen balance entre capturar ' +
            'la estructura local y suavizar el ruido.';
    } else {
        infoText.textContent = 'Con un K grande, las fronteras de decisión se vuelven más suaves, ' +
            'pero podemos perder detalles importantes de la distribución local.';
    }
});

classBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        classBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentClass = btn.dataset.class;
    });
});

modeDrawBtn.addEventListener('click', () => {
    mode = 'draw';
    modeDrawBtn.classList.remove('btn-secondary');
    modeDrawBtn.classList.add('btn-primary');
    modeClassifyBtn.classList.remove('btn-primary');
    modeClassifyBtn.classList.add('btn-secondary');
    canvasHint.textContent = 'Clic para añadir puntos de clase ' + currentClass;
});

modeClassifyBtn.addEventListener('click', () => {
    mode = 'classify';
    modeClassifyBtn.classList.remove('btn-secondary');
    modeClassifyBtn.classList.add('btn-primary');
    modeDrawBtn.classList.remove('btn-primary');
    modeDrawBtn.classList.add('btn-secondary');
    canvasHint.textContent = 'Clic para clasificar un punto';
});

showBoundaryToggle.addEventListener('change', () => {
    showBoundary = showBoundaryToggle.checked;
    updateBoundary();
});

animateBtn.addEventListener('click', animateSearch);

clearBtn.addEventListener('click', () => {
    trainingPoints = [];
    queryPoint = null;
    neighbors = [];
    boundaryImageData = null;
    updateResults();
    render();
});

sampleBtn.addEventListener('click', generateSampleData);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    render();
});
