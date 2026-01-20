// Descenso de Gradiente - Visualización 3D interactiva

// Estado global
let w1 = 2.0;
let w2 = 2.0;
let learningRate = 0.1;
let currentSurface = 'quadratic';
let iteration = 0;
let isAnimating = false;
let animationId = null;

// Historial para la trayectoria
let trajectory = [];
let lossHistory = [];

// Three.js objects
let scene, camera, renderer;
let surfaceMesh, pointMesh, trajectoryLine, arrowHelper, minimumMarker;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 4 };
let cameraDistance = 12;

// DOM Elements
const canvas3d = document.getElementById('canvas3d');
const lossChartCanvas = document.getElementById('lossChart');
const lossChartCtx = lossChartCanvas.getContext('2d');

const stepBtn = document.getElementById('stepBtn');
const animateBtn = document.getElementById('animateBtn');
const resetBtn = document.getElementById('resetBtn');

const lrSlider = document.getElementById('lrSlider');
const lrValue = document.getElementById('lrValue');

const metricIter = document.getElementById('metricIter');
const metricLoss = document.getElementById('metricLoss');
const metricW1 = document.getElementById('metricW1');
const metricW2 = document.getElementById('metricW2');
const gradientDisplay = document.getElementById('gradientDisplay');

// Loss functions and gradients
const surfaces = {
    quadratic: {
        name: 'Convexa (cuadrática)',
        equation: 'L(w₁, w₂) = w₁² + w₂²',
        domain: 'w₁, w₂ ∈ [-3, 3]',
        minText: 'Mínimo global: (0, 0)',
        loss: (w1, w2) => w1*w1 + w2*w2,
        gradient: (w1, w2) => [2*w1, 2*w2],
        minimum: [0, 0],
        range: 3
    },
    elongated: {
        name: 'Elongada',
        equation: 'L(w₁, w₂) = 10·w₁² + w₂²',
        domain: 'w₁, w₂ ∈ [-3, 3]',
        minText: 'Mínimo global: (0, 0)',
        loss: (w1, w2) => 10*w1*w1 + w2*w2,
        gradient: (w1, w2) => [20*w1, 2*w2],
        minimum: [0, 0],
        range: 3
    },
    saddle: {
        name: 'Rosenbrock',
        equation: 'L(w₁, w₂) = (1-w₁)² + 5·(w₂-w₁²)²',
        domain: 'w₁, w₂ ∈ [-2.5, 2.5]',
        minText: 'Mínimo global: (1, 1)',
        loss: (w1, w2) => {
            return Math.pow(1 - w1, 2) + 5 * Math.pow(w2 - w1*w1, 2);
        },
        gradient: (w1, w2) => {
            const g1 = 2*(w1 - 1) - 20*w1*(w2 - w1*w1);
            const g2 = 10*(w2 - w1*w1);
            return [g1, g2];
        },
        minimum: [1, 1],
        range: 2.5
    },
    multimodal: {
        name: 'Rastrigin',
        equation: 'L(w₁, w₂) = 2 + Σᵢ(wᵢ² - cos(2πwᵢ))',
        domain: 'w₁, w₂ ∈ [-2, 2]',
        minText: 'Mínimo global: (0, 0)',
        loss: (w1, w2) => {
            return 2 + (w1*w1 - Math.cos(2*Math.PI*w1)) + 
                       (w2*w2 - Math.cos(2*Math.PI*w2));
        },
        gradient: (w1, w2) => {
            const g1 = 2*w1 + 2*Math.PI*Math.sin(2*Math.PI*w1);
            const g2 = 2*w2 + 2*Math.PI*Math.sin(2*Math.PI*w2);
            return [g1, g2];
        },
        minimum: [0, 0],
        range: 2
    }
};

// Initialize Three.js
function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    camera = new THREE.PerspectiveCamera(50, canvas3d.width / canvas3d.height, 0.1, 1000);
    updateCameraPosition();
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
    renderer.setSize(canvas3d.width, canvas3d.height);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Axes
    createAxes();
    
    // Grid
    const grid = new THREE.GridHelper(6, 12, 0xaaaaaa, 0xcccccc);
    grid.position.y = -0.5;
    scene.add(grid);
    
    // Create surface
    createSurface();
    
    // Create point
    createPoint();
    
    // Create minimum marker
    createMinimumMarker();
    
    // Create trajectory line
    trajectoryLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xff9900, linewidth: 2 })
    );
    scene.add(trajectoryLine);
}

function createAxes() {
    const axisLength = 3.5;
    const axisRadius = 0.02;
    
    // W1 axis (X - teal)
    const w1Geometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const w1Material = new THREE.MeshBasicMaterial({ color: 0x1e8e8e });
    const w1Axis = new THREE.Mesh(w1Geometry, w1Material);
    w1Axis.rotation.z = Math.PI / 2;
    scene.add(w1Axis);
    
    // W2 axis (Z - orange)
    const w2Geometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const w2Material = new THREE.MeshBasicMaterial({ color: 0xff9900 });
    const w2Axis = new THREE.Mesh(w2Geometry, w2Material);
    w2Axis.rotation.x = Math.PI / 2;
    scene.add(w2Axis);
    
    // L axis (Y - red)
    const lGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, 6, 8);
    const lMaterial = new THREE.MeshBasicMaterial({ color: 0xd13212 });
    const lAxis = new THREE.Mesh(lGeometry, lMaterial);
    lAxis.position.y = 2.5;
    scene.add(lAxis);
}

function createSurface() {
    if (surfaceMesh) scene.remove(surfaceMesh);
    
    const surface = surfaces[currentSurface];
    const range = surface.range;
    const segments = 50;
    
    const vertices = [];
    const indices = [];
    const colors = [];
    
    // Generate vertices
    for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= segments; j++) {
            const w1 = -range + (2 * range * i / segments);
            const w2 = -range + (2 * range * j / segments);
            const loss = surface.loss(w1, w2);
            const clampedLoss = Math.min(Math.max(loss, -2), 5);
            
            vertices.push(w1, clampedLoss, w2);
            
            // Color based on height
            const t = (clampedLoss + 2) / 7;
            const r = 0.2 + 0.6 * t;
            const g = 0.4 - 0.2 * t;
            const b = 0.8 - 0.6 * t;
            colors.push(r, g, b);
        }
    }
    
    // Generate indices
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const a = i * (segments + 1) + j;
            const b = a + 1;
            const c = a + (segments + 1);
            const d = c + 1;
            
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        flatShading: false
    });
    
    surfaceMesh = new THREE.Mesh(geometry, material);
    scene.add(surfaceMesh);
}

function createPoint() {
    if (pointMesh) scene.remove(pointMesh);
    
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0xd13212, emissive: 0x441008 });
    pointMesh = new THREE.Mesh(geometry, material);
    updatePointPosition();
    scene.add(pointMesh);
}

function createMinimumMarker() {
    if (minimumMarker) scene.remove(minimumMarker);
    
    const surface = surfaces[currentSurface];
    const minW1 = surface.minimum[0];
    const minW2 = surface.minimum[1];
    const minLoss = surface.loss(minW1, minW2);
    
    const geometry = new THREE.SphereGeometry(0.12, 16, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0x1d8102, emissive: 0x0a3301 });
    minimumMarker = new THREE.Mesh(geometry, material);
    minimumMarker.position.set(minW1, minLoss + 0.1, minW2);
    scene.add(minimumMarker);
}

function updatePointPosition() {
    const surface = surfaces[currentSurface];
    const loss = surface.loss(w1, w2);
    const clampedLoss = Math.min(Math.max(loss, -2), 5);
    pointMesh.position.set(w1, clampedLoss + 0.15, w2);
    
    // Update arrow (gradient direction)
    if (arrowHelper) scene.remove(arrowHelper);
    
    const gradient = surface.gradient(w1, w2);
    const gradMag = Math.sqrt(gradient[0]*gradient[0] + gradient[1]*gradient[1]);
    
    if (gradMag > 0.01) {
        // Negative gradient direction (downhill)
        const dir = new THREE.Vector3(-gradient[0]/gradMag, 0, -gradient[1]/gradMag);
        const origin = new THREE.Vector3(w1, clampedLoss + 0.3, w2);
        const length = Math.min(gradMag * 0.3, 1);
        
        arrowHelper = new THREE.ArrowHelper(dir, origin, length, 0x0073bb, 0.15, 0.1);
        scene.add(arrowHelper);
    }
}

function updateTrajectory() {
    const points = trajectory.map(p => {
        const surface = surfaces[currentSurface];
        const loss = surface.loss(p.w1, p.w2);
        const clampedLoss = Math.min(Math.max(loss, -2), 5);
        return new THREE.Vector3(p.w1, clampedLoss + 0.05, p.w2);
    });
    
    if (points.length > 1) {
        trajectoryLine.geometry.dispose();
        trajectoryLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    }
}

function updateCameraPosition() {
    camera.position.x = cameraDistance * Math.sin(cameraAngle.theta) * Math.cos(cameraAngle.phi);
    camera.position.y = cameraDistance * Math.sin(cameraAngle.phi);
    camera.position.z = cameraDistance * Math.cos(cameraAngle.theta) * Math.cos(cameraAngle.phi);
    camera.lookAt(0, 1, 0);
}

// Gradient descent step
function gradientDescentStep() {
    const surface = surfaces[currentSurface];
    const gradient = surface.gradient(w1, w2);
    
    // Update weights
    w1 = w1 - learningRate * gradient[0];
    w2 = w2 - learningRate * gradient[1];
    
    // Clamp to range
    const range = surface.range;
    w1 = Math.max(-range, Math.min(range, w1));
    w2 = Math.max(-range, Math.min(range, w2));
    
    // Record trajectory
    trajectory.push({ w1, w2 });
    
    // Record loss
    const loss = surface.loss(w1, w2);
    lossHistory.push(loss);
    
    iteration++;
    
    // Update display
    updatePointPosition();
    updateTrajectory();
    updateMetrics();
    renderLossChart();
}

function updateMetrics() {
    const surface = surfaces[currentSurface];
    const loss = surface.loss(w1, w2);
    const gradient = surface.gradient(w1, w2);
    
    metricIter.textContent = iteration;
    metricLoss.textContent = loss.toFixed(4);
    metricW1.textContent = w1.toFixed(3);
    metricW2.textContent = w2.toFixed(3);
    gradientDisplay.textContent = `[${gradient[0].toFixed(3)}, ${gradient[1].toFixed(3)}]`;
}

function renderLossChart() {
    const width = lossChartCanvas.width;
    const height = lossChartCanvas.height;
    const padding = 30;
    
    lossChartCtx.clearRect(0, 0, width, height);
    
    // Background
    lossChartCtx.fillStyle = '#f5f5f5';
    lossChartCtx.fillRect(0, 0, width, height);
    
    if (lossHistory.length < 2) {
        lossChartCtx.fillStyle = '#999';
        lossChartCtx.font = '12px Source Sans Pro';
        lossChartCtx.textAlign = 'center';
        lossChartCtx.fillText('Ejecuta pasos para ver el historial de pérdida', width/2, height/2);
        return;
    }
    
    // Ranges
    const maxLoss = Math.max(...lossHistory, 0.1);
    const minLoss = Math.min(...lossHistory, 0);
    const maxIter = lossHistory.length - 1;
    
    const scaleX = (width - 2 * padding) / Math.max(maxIter, 1);
    const scaleY = (height - 2 * padding) / Math.max(maxLoss - minLoss, 0.1);
    
    // Grid
    lossChartCtx.strokeStyle = '#ddd';
    lossChartCtx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + i * (height - 2 * padding) / 5;
        lossChartCtx.beginPath();
        lossChartCtx.moveTo(padding, y);
        lossChartCtx.lineTo(width - padding, y);
        lossChartCtx.stroke();
    }
    
    // Axes
    lossChartCtx.strokeStyle = '#999';
    lossChartCtx.lineWidth = 1;
    lossChartCtx.beginPath();
    lossChartCtx.moveTo(padding, padding);
    lossChartCtx.lineTo(padding, height - padding);
    lossChartCtx.lineTo(width - padding, height - padding);
    lossChartCtx.stroke();
    
    // Loss curve
    lossChartCtx.strokeStyle = '#d13212';
    lossChartCtx.lineWidth = 2;
    lossChartCtx.beginPath();
    
    for (let i = 0; i < lossHistory.length; i++) {
        const x = padding + i * scaleX;
        const y = height - padding - (lossHistory[i] - minLoss) * scaleY;
        
        if (i === 0) {
            lossChartCtx.moveTo(x, y);
        } else {
            lossChartCtx.lineTo(x, y);
        }
    }
    lossChartCtx.stroke();
    
    // Current point
    const lastX = padding + (lossHistory.length - 1) * scaleX;
    const lastY = height - padding - (lossHistory[lossHistory.length - 1] - minLoss) * scaleY;
    
    lossChartCtx.fillStyle = '#d13212';
    lossChartCtx.beginPath();
    lossChartCtx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
    lossChartCtx.fill();
    
    // Labels
    lossChartCtx.fillStyle = '#666';
    lossChartCtx.font = '10px Source Sans Pro';
    lossChartCtx.textAlign = 'center';
    lossChartCtx.fillText('Iteración', width / 2, height - 5);
    
    lossChartCtx.save();
    lossChartCtx.translate(10, height / 2);
    lossChartCtx.rotate(-Math.PI / 2);
    lossChartCtx.fillText('Pérdida', 0, 0);
    lossChartCtx.restore();
}

function clearTrajectory() {
    // Limpiar geometría de la trayectoria
    if (trajectoryLine && trajectoryLine.geometry) {
        trajectoryLine.geometry.dispose();
        trajectoryLine.geometry = new THREE.BufferGeometry();
    }
}

function reset() {
    stopAnimation();
    
    const surface = surfaces[currentSurface];
    
    // Punto inicial específico para cada superficie para mejor demostración
    switch(currentSurface) {
        case 'quadratic':
            // Punto aleatorio lejos del origen
            w1 = 2 + Math.random();
            w2 = 2 + Math.random();
            break;
        case 'elongated':
            // Punto que muestre el zigzagueo
            w1 = 1.5;
            w2 = 2.5;
            break;
        case 'saddle':
            // Rosenbrock: empezar lejos del mínimo (1,1)
            w1 = -1.5;
            w2 = 2;
            break;
        case 'multimodal':
            // Empezar en una esquina para ver mínimos locales
            w1 = 1.5;
            w2 = 1.5;
            break;
        default:
            w1 = 2;
            w2 = 2;
    }
    
    iteration = 0;
    trajectory = [{ w1, w2 }];
    lossHistory = [surface.loss(w1, w2)];
    
    // Limpiar trayectoria visual
    clearTrajectory();
    
    updatePointPosition();
    updateTrajectory();
    updateMetrics();
    updateFunctionInfo();
    renderLossChart();
}

function updateFunctionInfo() {
    const surface = surfaces[currentSurface];
    const infoEl = document.getElementById('functionInfo');
    if (infoEl) {
        infoEl.innerHTML = `
            <div class="equation">${surface.equation}</div>
            <div class="domain">${surface.domain}</div>
            <div class="min-text">${surface.minText}</div>
        `;
    }
}

function startAnimation() {
    if (isAnimating) {
        stopAnimation();
        return;
    }
    
    isAnimating = true;
    animateBtn.textContent = '⏸ Pausar';
    animateBtn.classList.remove('btn-success');
    animateBtn.classList.add('btn-danger');
    
    function animate() {
        if (!isAnimating) return;
        
        gradientDescentStep();
        
        // Check convergence
        const surface = surfaces[currentSurface];
        const gradient = surface.gradient(w1, w2);
        const gradMag = Math.sqrt(gradient[0]*gradient[0] + gradient[1]*gradient[1]);
        
        if (gradMag < 0.001 || iteration > 500) {
            stopAnimation();
            return;
        }
        
        animationId = setTimeout(animate, 100);
    }
    
    animate();
}

function stopAnimation() {
    isAnimating = false;
    if (animationId) {
        clearTimeout(animationId);
    }
    animateBtn.textContent = '▶ Animar';
    animateBtn.classList.remove('btn-danger');
    animateBtn.classList.add('btn-success');
}

// Render loop for Three.js
function render3D() {
    requestAnimationFrame(render3D);
    renderer.render(scene, camera);
}

// Event Listeners

// Mouse controls for 3D
canvas3d.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvas3d.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    cameraAngle.theta -= deltaX * 0.01;
    cameraAngle.phi += deltaY * 0.01;
    cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngle.phi));
    
    updateCameraPosition();
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvas3d.addEventListener('mouseup', () => isDragging = false);
canvas3d.addEventListener('mouseleave', () => isDragging = false);

canvas3d.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(5, Math.min(25, cameraDistance));
    updateCameraPosition();
});

// Función para generar un nuevo punto inicial aleatorio
function newRandomPoint() {
    stopAnimation();
    
    const surface = surfaces[currentSurface];
    const range = surface.range * 0.8;
    
    // Punto aleatorio dentro del rango
    w1 = (Math.random() - 0.5) * 2 * range;
    w2 = (Math.random() - 0.5) * 2 * range;
    
    iteration = 0;
    trajectory = [{ w1, w2 }];
    lossHistory = [surface.loss(w1, w2)];
    
    // Limpiar trayectoria visual
    clearTrajectory();
    
    updatePointPosition();
    updateTrajectory();
    updateMetrics();
    renderLossChart();
}

// Buttons
stepBtn.addEventListener('click', () => {
    if (isAnimating) stopAnimation();
    gradientDescentStep();
});

animateBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', reset);

// Nuevo punto aleatorio
const newPointBtn = document.getElementById('newPointBtn');
newPointBtn.addEventListener('click', newRandomPoint);

// Learning rate slider
lrSlider.addEventListener('input', () => {
    learningRate = parseFloat(lrSlider.value);
    lrValue.textContent = learningRate.toFixed(2);
});

// Surface buttons
document.querySelectorAll('.surface-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.surface-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSurface = btn.dataset.surface;
        
        // Limpiar trayectoria anterior
        clearTrajectory();
        
        createSurface();
        createMinimumMarker();
        reset();
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initThree();
    updateFunctionInfo();
    reset();
    render3D();
});
