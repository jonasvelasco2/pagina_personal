// K-Means Clustering Playground
// Visualiza el algoritmo K-Means paso a paso

// Colores para clusters
const CLUSTER_COLORS = [
    '#0073bb', // azul
    '#ff9900', // naranja
    '#1d8102', // verde
    '#d13212', // rojo
    '#7b68ee', // púrpura
    '#1abc9c', // turquesa
    '#e91e63', // rosa
    '#795548'  // marrón
];

// Estado global
let points = [];
let centroids = [];
let assignments = [];
let K = 3;
let iteration = 0;
let isConverged = false;
let isAnimating = false;
let inertiaHistory = [];
let currentDataset = 'blobs';
let algorithmStep = 'init'; // 'init', 'assign', 'update'

// Charts
let inertiaChart = null;

// Elementos del DOM
const canvas = document.getElementById('clusterCanvas');
const ctx = canvas.getContext('2d');
const kSlider = document.getElementById('kSlider');
const kValueEl = document.getElementById('kValue');
const stepBtn = document.getElementById('stepBtn');
const animateBtn = document.getElementById('animateBtn');
const resetBtn = document.getElementById('resetBtn');
const newDataBtn = document.getElementById('newDataBtn');
const datasetBtns = document.querySelectorAll('.dataset-btn');

const iterationCount = document.getElementById('iterationCount');
const inertiaValue = document.getElementById('inertiaValue');
const statusText = document.getElementById('statusText');
const clusterInfo = document.getElementById('clusterInfo');
const stepDescription = document.getElementById('stepDescription');
const infoText = document.getElementById('infoText');

// Distancia euclidiana
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Generar número aleatorio con distribución normal (Box-Muller)
function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generar datasets
function generateBlobs(n = 150) {
    const pts = [];
    const centers = [
        { x: 150, y: 120 },
        { x: 450, y: 150 },
        { x: 300, y: 350 }
    ];
    
    for (let i = 0; i < n; i++) {
        const center = centers[i % centers.length];
        pts.push({
            x: center.x + randn() * 50,
            y: center.y + randn() * 50
        });
    }
    return pts;
}

function generateCircles(n = 150) {
    const pts = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Círculo interior
    for (let i = 0; i < n / 2; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const r = 60 + randn() * 15;
        pts.push({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });
    }
    
    // Círculo exterior
    for (let i = 0; i < n / 2; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const r = 150 + randn() * 15;
        pts.push({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });
    }
    
    return pts;
}

function generateMoons(n = 150) {
    const pts = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Luna superior
    for (let i = 0; i < n / 2; i++) {
        const angle = Math.PI * Math.random();
        const r = 120 + randn() * 15;
        pts.push({
            x: cx - 50 + r * Math.cos(angle),
            y: cy - 30 + r * Math.sin(angle)
        });
    }
    
    // Luna inferior (invertida)
    for (let i = 0; i < n / 2; i++) {
        const angle = Math.PI + Math.PI * Math.random();
        const r = 120 + randn() * 15;
        pts.push({
            x: cx + 50 + r * Math.cos(angle),
            y: cy + 30 + r * Math.sin(angle)
        });
    }
    
    return pts;
}

function generateRandom(n = 150) {
    const pts = [];
    const padding = 50;
    
    for (let i = 0; i < n; i++) {
        pts.push({
            x: padding + Math.random() * (canvas.width - 2 * padding),
            y: padding + Math.random() * (canvas.height - 2 * padding)
        });
    }
    
    return pts;
}

function generateDataset(type) {
    switch (type) {
        case 'blobs': return generateBlobs();
        case 'circles': return generateCircles();
        case 'moons': return generateMoons();
        case 'random': return generateRandom();
        default: return generateBlobs();
    }
}

// Inicializar centroides aleatorios
function initializeCentroids() {
    centroids = [];
    const padding = 50;
    
    // K-means++ inicialización
    if (points.length > 0) {
        // Primer centroide aleatorio
        const firstIdx = Math.floor(Math.random() * points.length);
        centroids.push({ ...points[firstIdx] });
        
        // Resto de centroides con probabilidad proporcional a distancia²
        while (centroids.length < K) {
            const distances = points.map(p => {
                const minDist = Math.min(...centroids.map(c => distance(p, c)));
                return minDist * minDist;
            });
            
            const totalDist = distances.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalDist;
            
            for (let i = 0; i < points.length; i++) {
                random -= distances[i];
                if (random <= 0) {
                    centroids.push({ ...points[i] });
                    break;
                }
            }
        }
    } else {
        // Si no hay puntos, centroides aleatorios
        for (let i = 0; i < K; i++) {
            centroids.push({
                x: padding + Math.random() * (canvas.width - 2 * padding),
                y: padding + Math.random() * (canvas.height - 2 * padding)
            });
        }
    }
    
    assignments = new Array(points.length).fill(-1);
    iteration = 0;
    isConverged = false;
    inertiaHistory = [];
    algorithmStep = 'init';
    
    updateStatus();
    render();
}

// Asignar puntos a clusters
function assignPoints() {
    let changed = false;
    
    for (let i = 0; i < points.length; i++) {
        let minDist = Infinity;
        let minCluster = 0;
        
        for (let j = 0; j < centroids.length; j++) {
            const d = distance(points[i], centroids[j]);
            if (d < minDist) {
                minDist = d;
                minCluster = j;
            }
        }
        
        if (assignments[i] !== minCluster) {
            changed = true;
            assignments[i] = minCluster;
        }
    }
    
    return changed;
}

// Actualizar centroides
function updateCentroids() {
    const newCentroids = [];
    let totalMoved = 0;
    
    for (let k = 0; k < K; k++) {
        const clusterPoints = points.filter((_, i) => assignments[i] === k);
        
        if (clusterPoints.length > 0) {
            const newX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
            const newY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
            
            if (centroids[k]) {
                totalMoved += distance(centroids[k], { x: newX, y: newY });
            }
            
            newCentroids.push({ x: newX, y: newY });
        } else {
            // Cluster vacío: reinicializar aleatoriamente
            const randomPoint = points[Math.floor(Math.random() * points.length)];
            newCentroids.push({ ...randomPoint });
        }
    }
    
    centroids = newCentroids;
    return totalMoved;
}

// Calcular inercia (suma de distancias² a centroides)
function calculateInertia() {
    let inertia = 0;
    for (let i = 0; i < points.length; i++) {
        if (assignments[i] >= 0 && centroids[assignments[i]]) {
            const d = distance(points[i], centroids[assignments[i]]);
            inertia += d * d;
        }
    }
    return inertia;
}

// Ejecutar un paso del algoritmo
function step() {
    if (isConverged || points.length === 0) return;
    
    if (algorithmStep === 'init' || algorithmStep === 'update') {
        // Paso 1: Asignar puntos
        const changed = assignPoints();
        algorithmStep = 'assign';
        
        stepDescription.textContent = 'Paso 1: Asignar cada punto al centroide más cercano.';
        stepDescription.style.borderColor = CLUSTER_COLORS[0];
        
        if (!changed && iteration > 0) {
            isConverged = true;
            statusText.textContent = '✓ Convergido';
            statusText.classList.add('converged');
            stepDescription.textContent = '¡Algoritmo convergió! Los centroides ya no cambian.';
            stepDescription.style.borderColor = '#1d8102';
            infoText.textContent = `El algoritmo convergió en ${iteration} iteraciones. ` +
                `La inercia final es ${calculateInertia().toFixed(0)}. ` +
                'Prueba a reiniciar los centroides para ver si encuentra una mejor solución.';
        }
    } else if (algorithmStep === 'assign') {
        // Paso 2: Actualizar centroides
        const moved = updateCentroids();
        iteration++;
        algorithmStep = 'update';
        
        const inertia = calculateInertia();
        inertiaHistory.push(inertia);
        updateInertiaChart();
        
        stepDescription.textContent = 'Paso 2: Recalcular centroides como el promedio de sus puntos.';
        stepDescription.style.borderColor = CLUSTER_COLORS[1];
        
        if (moved < 0.1) {
            isConverged = true;
            statusText.textContent = '✓ Convergido';
            statusText.classList.add('converged');
            stepDescription.textContent = '¡Algoritmo convergió! Los centroides ya no cambian.';
            stepDescription.style.borderColor = '#1d8102';
        }
    }
    
    updateStatus();
    updateClusterInfo();
    render();
}

// Animar hasta convergencia
async function animate() {
    if (isAnimating) {
        isAnimating = false;
        animateBtn.textContent = '▶ Animar';
        return;
    }
    
    if (isConverged) {
        initializeCentroids();
    }
    
    isAnimating = true;
    animateBtn.textContent = '⏸ Pausar';
    
    while (!isConverged && isAnimating) {
        step();
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    isAnimating = false;
    animateBtn.textContent = '▶ Animar';
}

// Actualizar estado
function updateStatus() {
    iterationCount.textContent = iteration;
    
    if (points.length > 0 && assignments.some(a => a >= 0)) {
        const inertia = calculateInertia();
        inertiaValue.textContent = inertia.toFixed(0);
    } else {
        inertiaValue.textContent = '—';
    }
    
    if (!isConverged) {
        statusText.textContent = algorithmStep === 'init' ? 'Listo' : 'En progreso';
        statusText.classList.remove('converged');
    }
}

// Actualizar información de clusters
function updateClusterInfo() {
    clusterInfo.innerHTML = '';
    
    for (let k = 0; k < K; k++) {
        const count = assignments.filter(a => a === k).length;
        const centroid = centroids[k];
        
        const item = document.createElement('div');
        item.className = 'cluster-item';
        item.innerHTML = `
            <div class="cluster-dot" style="background: ${CLUSTER_COLORS[k]}">${k + 1}</div>
            <div class="cluster-details">
                <div class="cluster-name">Cluster ${k + 1}</div>
                <div class="cluster-stats">
                    ${count} puntos · Centro: (${centroid ? centroid.x.toFixed(0) : '?'}, ${centroid ? centroid.y.toFixed(0) : '?'})
                </div>
            </div>
        `;
        clusterInfo.appendChild(item);
    }
}

// Inicializar gráfico de inercia
function initInertiaChart() {
    const ctx = document.getElementById('inertiaChart').getContext('2d');
    
    if (inertiaChart) {
        inertiaChart.destroy();
    }
    
    inertiaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Inercia',
                data: [],
                borderColor: CLUSTER_COLORS[0],
                backgroundColor: CLUSTER_COLORS[0] + '20',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: CLUSTER_COLORS[0]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Inercia por iteración',
                    font: { family: "'Source Sans Pro'", size: 12 }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Iteración',
                        font: { family: "'Source Sans Pro'" }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Inercia',
                        font: { family: "'Source Sans Pro'" }
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

// Actualizar gráfico de inercia
function updateInertiaChart() {
    inertiaChart.data.labels = inertiaHistory.map((_, i) => i + 1);
    inertiaChart.data.datasets[0].data = inertiaHistory;
    inertiaChart.update();
}

// Renderizar canvas
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar regiones de Voronoi (opcional, simplificado)
    if (centroids.length > 0 && assignments.some(a => a >= 0)) {
        // Dibujar puntos coloreados por cluster
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const cluster = assignments[i];
            const color = cluster >= 0 ? CLUSTER_COLORS[cluster] : '#ccc';
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = color + '80';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    } else {
        // Puntos sin asignar
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#ccc';
            ctx.fill();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    
    // Dibujar centroides
    for (let k = 0; k < centroids.length; k++) {
        const c = centroids[k];
        const color = CLUSTER_COLORS[k];
        
        // Círculo exterior
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // X en el centro
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2.5;
        const s = 5;
        ctx.moveTo(c.x - s, c.y - s);
        ctx.lineTo(c.x + s, c.y + s);
        ctx.moveTo(c.x + s, c.y - s);
        ctx.lineTo(c.x - s, c.y + s);
        ctx.stroke();
    }
}

// Event listeners
kSlider.addEventListener('input', () => {
    K = parseInt(kSlider.value);
    kValueEl.textContent = K;
    initializeCentroids();
});

datasetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        datasetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDataset = btn.dataset.dataset;
        points = generateDataset(currentDataset);
        initializeCentroids();
    });
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    points.push({ x, y });
    assignments.push(-1);
    render();
});

stepBtn.addEventListener('click', () => {
    if (isConverged) {
        initializeCentroids();
    }
    step();
});

animateBtn.addEventListener('click', animate);

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    animateBtn.textContent = '▶ Animar';
    initializeCentroids();
});

newDataBtn.addEventListener('click', () => {
    isAnimating = false;
    animateBtn.textContent = '▶ Animar';
    points = generateDataset(currentDataset);
    initializeCentroids();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    initInertiaChart();
    points = generateDataset('blobs');
    initializeCentroids();
    updateClusterInfo();
});
