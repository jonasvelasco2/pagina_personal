// Regresión Lineal Múltiple 3D
// Visualización con Three.js

// Parámetros
let beta0 = 1.0;
let beta1 = 0.5;
let beta2 = 0.5;
let isAutoMode = false;
let showResiduals = true;
let showPlane = true;

// Datos
let points = [];

// Three.js objects
let scene, camera, renderer;
let pointsMesh, planeMesh, residualLines;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3 };
let cameraDistance = 15;

// DOM Elements
const canvas = document.getElementById('canvas3d');
const beta0Slider = document.getElementById('beta0Slider');
const beta1Slider = document.getElementById('beta1Slider');
const beta2Slider = document.getElementById('beta2Slider');
const beta0Value = document.getElementById('beta0Value');
const beta1Value = document.getElementById('beta1Value');
const beta2Value = document.getElementById('beta2Value');
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');
const eqBeta0 = document.getElementById('eqBeta0');
const eqBeta1 = document.getElementById('eqBeta1');
const eqBeta2 = document.getElementById('eqBeta2');
const metricRSS = document.getElementById('metricRSS');
const metricR2 = document.getElementById('metricR2');
const showResidualsCheck = document.getElementById('showResiduals');
const showPlaneCheck = document.getElementById('showPlane');
const resetViewBtn = document.getElementById('resetViewBtn');

// Initialize Three.js
function initThree() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);  // Fondo claro
    
    // Camera
    camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 1000);
    updateCameraPosition();
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Axes
    createAxes();
    
    // Grid
    createGrid();
    
    // Initial data
    loadDataset('linear');
}

// Create coordinate axes
function createAxes() {
    const axisLength = 6;
    const axisRadius = 0.03;
    
    // X1 axis (red)
    const x1Geometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const x1Material = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    const x1Axis = new THREE.Mesh(x1Geometry, x1Material);
    x1Axis.rotation.z = Math.PI / 2;
    scene.add(x1Axis);
    
    // X2 axis (green)
    const x2Geometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const x2Material = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
    const x2Axis = new THREE.Mesh(x2Geometry, x2Material);
    x2Axis.rotation.x = Math.PI / 2;
    scene.add(x2Axis);
    
    // Y axis (blue)
    const yGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    scene.add(yAxis);
    
    // Arrow heads
    const arrowSize = 0.15;
    
    // X1 arrow
    const x1Arrow = new THREE.Mesh(
        new THREE.ConeGeometry(arrowSize, arrowSize * 2, 8),
        x1Material
    );
    x1Arrow.position.set(axisLength, 0, 0);
    x1Arrow.rotation.z = -Math.PI / 2;
    scene.add(x1Arrow);
    
    // X2 arrow
    const x2Arrow = new THREE.Mesh(
        new THREE.ConeGeometry(arrowSize, arrowSize * 2, 8),
        x2Material
    );
    x2Arrow.position.set(0, 0, axisLength);
    x2Arrow.rotation.x = Math.PI / 2;
    scene.add(x2Arrow);
    
    // Y arrow
    const yArrow = new THREE.Mesh(
        new THREE.ConeGeometry(arrowSize, arrowSize * 2, 8),
        yMaterial
    );
    yArrow.position.set(0, axisLength, 0);
    scene.add(yArrow);
}

// Create grid
function createGrid() {
    const gridSize = 10;
    const gridDivisions = 10;
    const gridColor = 0xcccccc;  // Color gris para fondo claro
    
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0xaaaaaa, gridColor);
    grid.position.y = -5;
    scene.add(grid);
}

// Update camera position based on angles
function updateCameraPosition() {
    camera.position.x = cameraDistance * Math.sin(cameraAngle.theta) * Math.cos(cameraAngle.phi);
    camera.position.y = cameraDistance * Math.sin(cameraAngle.phi);
    camera.position.z = cameraDistance * Math.cos(cameraAngle.theta) * Math.cos(cameraAngle.phi);
    camera.lookAt(0, 0, 0);
}

// Generate dataset
function loadDataset(name) {
    points = [];
    const n = 30;
    
    switch (name) {
        case 'linear':
            for (let i = 0; i < n; i++) {
                const x1 = (Math.random() - 0.5) * 8;
                const x2 = (Math.random() - 0.5) * 8;
                const y = 1 + 0.5 * x1 + 0.5 * x2 + (Math.random() - 0.5) * 1;
                points.push({ x1, x2, y });
            }
            break;
            
        case 'noisy':
            for (let i = 0; i < n; i++) {
                const x1 = (Math.random() - 0.5) * 8;
                const x2 = (Math.random() - 0.5) * 8;
                const y = 0.5 + 0.4 * x1 + 0.6 * x2 + (Math.random() - 0.5) * 4;
                points.push({ x1, x2, y });
            }
            break;
            
        case 'interaction':
            for (let i = 0; i < n; i++) {
                const x1 = (Math.random() - 0.5) * 8;
                const x2 = (Math.random() - 0.5) * 8;
                const y = 0.5 * x1 + 0.5 * x2 + 0.1 * x1 * x2 + (Math.random() - 0.5) * 1;
                points.push({ x1, x2, y });
            }
            break;
            
        case 'clusters':
            // Cluster 1
            for (let i = 0; i < n / 2; i++) {
                const x1 = -3 + (Math.random() - 0.5) * 2;
                const x2 = -3 + (Math.random() - 0.5) * 2;
                const y = -2 + (Math.random() - 0.5) * 1;
                points.push({ x1, x2, y });
            }
            // Cluster 2
            for (let i = 0; i < n / 2; i++) {
                const x1 = 3 + (Math.random() - 0.5) * 2;
                const x2 = 3 + (Math.random() - 0.5) * 2;
                const y = 4 + (Math.random() - 0.5) * 1;
                points.push({ x1, x2, y });
            }
            break;
    }
    
    if (isAutoMode) {
        calculateOLS();
    }
    
    updateScene();
    updateMetrics();
}

// Calculate OLS for multiple regression
function calculateOLS() {
    const n = points.length;
    if (n < 3) return;
    
    // Calculate means
    let sumX1 = 0, sumX2 = 0, sumY = 0;
    for (const p of points) {
        sumX1 += p.x1;
        sumX2 += p.x2;
        sumY += p.y;
    }
    const meanX1 = sumX1 / n;
    const meanX2 = sumX2 / n;
    const meanY = sumY / n;
    
    // Calculate sums of squares and cross products
    let ss11 = 0, ss22 = 0, ss12 = 0, sp1y = 0, sp2y = 0;
    for (const p of points) {
        const dx1 = p.x1 - meanX1;
        const dx2 = p.x2 - meanX2;
        const dy = p.y - meanY;
        
        ss11 += dx1 * dx1;
        ss22 += dx2 * dx2;
        ss12 += dx1 * dx2;
        sp1y += dx1 * dy;
        sp2y += dx2 * dy;
    }
    
    // Solve normal equations
    const det = ss11 * ss22 - ss12 * ss12;
    if (Math.abs(det) < 0.0001) return;
    
    beta1 = (ss22 * sp1y - ss12 * sp2y) / det;
    beta2 = (ss11 * sp2y - ss12 * sp1y) / det;
    beta0 = meanY - beta1 * meanX1 - beta2 * meanX2;
    
    // Clamp to slider ranges
    beta0 = Math.max(-5, Math.min(5, beta0));
    beta1 = Math.max(-2, Math.min(2, beta1));
    beta2 = Math.max(-2, Math.min(2, beta2));
    
    updateSliders();
}

// Calculate metrics
function calculateRSS() {
    let rss = 0;
    for (const p of points) {
        const yHat = beta0 + beta1 * p.x1 + beta2 * p.x2;
        rss += (p.y - yHat) ** 2;
    }
    return rss;
}

function calculateR2() {
    const n = points.length;
    if (n < 2) return 0;
    
    let sumY = 0;
    for (const p of points) sumY += p.y;
    const meanY = sumY / n;
    
    let ssTot = 0, ssRes = 0;
    for (const p of points) {
        ssTot += (p.y - meanY) ** 2;
        const yHat = beta0 + beta1 * p.x1 + beta2 * p.x2;
        ssRes += (p.y - yHat) ** 2;
    }
    
    if (ssTot < 0.0001) return 1;
    return 1 - (ssRes / ssTot);
}

// Update metrics display
function updateMetrics() {
    const rss = calculateRSS();
    const r2 = calculateR2();
    
    metricRSS.textContent = rss.toFixed(2);
    metricR2.textContent = r2.toFixed(3);
    
    eqBeta0.textContent = beta0.toFixed(2);
    eqBeta1.textContent = beta1.toFixed(2);
    eqBeta2.textContent = beta2.toFixed(2);
}

// Update sliders from values
function updateSliders() {
    beta0Slider.value = beta0;
    beta1Slider.value = beta1;
    beta2Slider.value = beta2;
    beta0Value.textContent = beta0.toFixed(2);
    beta1Value.textContent = beta1.toFixed(2);
    beta2Value.textContent = beta2.toFixed(2);
}

// Update 3D scene
function updateScene() {
    // Remove old objects
    if (pointsMesh) scene.remove(pointsMesh);
    if (planeMesh) scene.remove(planeMesh);
    if (residualLines) scene.remove(residualLines);
    
    // Create points
    const pointsGroup = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const pointMaterial = new THREE.MeshPhongMaterial({ color: 0x0073bb });
    
    for (const p of points) {
        const sphere = new THREE.Mesh(sphereGeometry, pointMaterial);
        sphere.position.set(p.x1, p.y, p.x2);
        pointsGroup.add(sphere);
    }
    pointsMesh = pointsGroup;
    scene.add(pointsMesh);
    
    // Create plane using BufferGeometry for precise control
    // Plane equation: y = beta0 + beta1*x1 + beta2*x2
    // In 3D space: X = x1, Y = y, Z = x2
    if (showPlane) {
        const planeSize = 6;
        const segments = 20;
        const vertices = [];
        const indices = [];
        
        // Generate vertices for the plane
        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                const x1 = -planeSize + (2 * planeSize * i / segments);
                const x2 = -planeSize + (2 * planeSize * j / segments);
                const y = beta0 + beta1 * x1 + beta2 * x2;
                vertices.push(x1, y, x2);
            }
        }
        
        // Generate indices for triangles
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
        
        const planeGeometry = new THREE.BufferGeometry();
        planeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        planeGeometry.setIndex(indices);
        planeGeometry.computeVertexNormals();
        
        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(planeMesh);
    }
    
    // Create residual lines - vertical lines from data point to plane
    if (showResiduals) {
        const linesGroup = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xd13212,
            linewidth: 2
        });
        
        for (const p of points) {
            // Calculate predicted value on the plane
            const yHat = beta0 + beta1 * p.x1 + beta2 * p.x2;
            
            // Line from actual point (x1, y, x2) to projected point (x1, yHat, x2)
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(p.x1, p.y, p.x2),      // Actual point
                new THREE.Vector3(p.x1, yHat, p.x2)      // Projection on plane
            ]);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            linesGroup.add(line);
            
            // Add small sphere at projection point on plane for clarity
            const projSphereGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const projSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xd13212 });
            const projSphere = new THREE.Mesh(projSphereGeometry, projSphereMaterial);
            projSphere.position.set(p.x1, yHat, p.x2);
            linesGroup.add(projSphere);
        }
        residualLines = linesGroup;
        scene.add(residualLines);
    }
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Event Listeners

// Mouse drag for rotation
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    cameraAngle.theta -= deltaX * 0.01;
    cameraAngle.phi += deltaY * 0.01;
    
    // Clamp phi to avoid gimbal lock
    cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngle.phi));
    
    updateCameraPosition();
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Scroll for zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(5, Math.min(30, cameraDistance));
    updateCameraPosition();
});

// Sliders
beta0Slider.addEventListener('input', () => {
    if (isAutoMode) return;
    beta0 = parseFloat(beta0Slider.value);
    beta0Value.textContent = beta0.toFixed(2);
    updateScene();
    updateMetrics();
});

beta1Slider.addEventListener('input', () => {
    if (isAutoMode) return;
    beta1 = parseFloat(beta1Slider.value);
    beta1Value.textContent = beta1.toFixed(2);
    updateScene();
    updateMetrics();
});

beta2Slider.addEventListener('input', () => {
    if (isAutoMode) return;
    beta2 = parseFloat(beta2Slider.value);
    beta2Value.textContent = beta2.toFixed(2);
    updateScene();
    updateMetrics();
});

// Mode toggle
modeToggle.addEventListener('click', () => {
    isAutoMode = !isAutoMode;
    modeToggle.classList.toggle('active', isAutoMode);
    
    if (isAutoMode) {
        modeLabel.textContent = 'Mínimos cuadrados';
        beta0Slider.disabled = true;
        beta1Slider.disabled = true;
        beta2Slider.disabled = true;
        calculateOLS();
        updateScene();
        updateMetrics();
    } else {
        modeLabel.textContent = 'Modo manual';
        beta0Slider.disabled = false;
        beta1Slider.disabled = false;
        beta2Slider.disabled = false;
    }
});

// Checkboxes
showResidualsCheck.addEventListener('change', () => {
    showResiduals = showResidualsCheck.checked;
    updateScene();
});

showPlaneCheck.addEventListener('change', () => {
    showPlane = showPlaneCheck.checked;
    updateScene();
});

// Reset view
resetViewBtn.addEventListener('click', () => {
    cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3 };
    cameraDistance = 15;
    updateCameraPosition();
});

// Dataset buttons
document.querySelectorAll('.dataset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        loadDataset(btn.dataset.dataset);
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initThree();
    updateSliders();
    updateMetrics();
    animate();
});
