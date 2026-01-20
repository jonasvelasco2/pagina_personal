// Función Sigmoide y Frontera de Decisión
// Visualización interactiva para regresión logística

// Colores
const COLORS = {
    class0: '#3498db',
    class1: '#e74c3c',
    class0Light: 'rgba(52, 152, 219, 0.15)',
    class1Light: 'rgba(231, 76, 60, 0.15)',
    sigmoid: '#ff9900',
    frontier: '#232f3e',
    grid: '#e8e8e8',
    axis: '#999',
    zLine: '#0073bb'
};

// Estado global
let w1 = 1.0;
let w2 = 1.0;
let bias = 0.0;
let currentZ = 0;
let points = [];
let currentDataset = 'separable';

// Elementos del DOM
const sigmoidCanvas = document.getElementById('sigmoidCanvas');
const decisionCanvas = document.getElementById('decisionCanvas');
const sigmoidCtx = sigmoidCanvas.getContext('2d');
const decisionCtx = decisionCanvas.getContext('2d');

const w1Slider = document.getElementById('w1Slider');
const w2Slider = document.getElementById('w2Slider');
const biasSlider = document.getElementById('biasSlider');
const w1Value = document.getElementById('w1Value');
const w2Value = document.getElementById('w2Value');
const biasValue = document.getElementById('biasValue');

const eqW1 = document.getElementById('eqW1');
const eqW2 = document.getElementById('eqW2');
const eqBias = document.getElementById('eqBias');
const eqW1b = document.getElementById('eqW1b');
const eqW2b = document.getElementById('eqW2b');
const eqBiasb = document.getElementById('eqBiasb');

const zMarker = document.getElementById('zMarker');
const probDisplay = document.getElementById('probDisplay');

// Función sigmoide
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

// Generar datasets
function generateDataset(name) {
    points = [];
    const n = 40;
    
    switch (name) {
        case 'separable':
            // Clase 0: parte inferior izquierda
            for (let i = 0; i < n / 2; i++) {
                points.push({
                    x1: -2 + Math.random() * 2 - 0.5,
                    x2: -2 + Math.random() * 2 - 0.5,
                    label: 0
                });
            }
            // Clase 1: parte superior derecha
            for (let i = 0; i < n / 2; i++) {
                points.push({
                    x1: 1 + Math.random() * 2 - 0.5,
                    x2: 1 + Math.random() * 2 - 0.5,
                    label: 1
                });
            }
            break;
            
        case 'overlap':
            // Clases con solapamiento
            for (let i = 0; i < n / 2; i++) {
                points.push({
                    x1: -1 + Math.random() * 3 - 1,
                    x2: -1 + Math.random() * 3 - 1,
                    label: 0
                });
            }
            for (let i = 0; i < n / 2; i++) {
                points.push({
                    x1: 0 + Math.random() * 3 - 1,
                    x2: 0 + Math.random() * 3 - 1,
                    label: 1
                });
            }
            break;
            
        case 'diagonal':
            // Separación diagonal
            for (let i = 0; i < n; i++) {
                const x1 = (Math.random() - 0.5) * 6;
                const x2 = (Math.random() - 0.5) * 6;
                const label = (x1 + x2 + (Math.random() - 0.5) * 1.5) > 0 ? 1 : 0;
                points.push({ x1, x2, label });
            }
            break;
    }
    
    currentDataset = name;
}

// Calcular z para un punto
function calculateZ(x1, x2) {
    return w1 * x1 + w2 * x2 + bias;
}

// Renderizar gráfico de sigmoide
function renderSigmoid() {
    const width = sigmoidCanvas.width;
    const height = sigmoidCanvas.height;
    const padding = 50;
    
    sigmoidCtx.clearRect(0, 0, width, height);
    
    // Rango de z
    const zMin = -6;
    const zMax = 6;
    
    // Escala
    const scaleX = (width - 2 * padding) / (zMax - zMin);
    const scaleY = (height - 2 * padding);
    
    // Grid
    sigmoidCtx.strokeStyle = COLORS.grid;
    sigmoidCtx.lineWidth = 1;
    
    // Grid vertical
    for (let z = -6; z <= 6; z += 2) {
        const x = padding + (z - zMin) * scaleX;
        sigmoidCtx.beginPath();
        sigmoidCtx.moveTo(x, padding);
        sigmoidCtx.lineTo(x, height - padding);
        sigmoidCtx.stroke();
    }
    
    // Grid horizontal
    for (let s = 0; s <= 1; s += 0.25) {
        const y = height - padding - s * scaleY;
        sigmoidCtx.beginPath();
        sigmoidCtx.moveTo(padding, y);
        sigmoidCtx.lineTo(width - padding, y);
        sigmoidCtx.stroke();
    }
    
    // Ejes
    sigmoidCtx.strokeStyle = COLORS.axis;
    sigmoidCtx.lineWidth = 2;
    
    // Eje X
    sigmoidCtx.beginPath();
    sigmoidCtx.moveTo(padding, height - padding);
    sigmoidCtx.lineTo(width - padding, height - padding);
    sigmoidCtx.stroke();
    
    // Eje Y
    sigmoidCtx.beginPath();
    sigmoidCtx.moveTo(padding, height - padding);
    sigmoidCtx.lineTo(padding, padding);
    sigmoidCtx.stroke();
    
    // Líneas de referencia en z=0 y σ=0.5
    sigmoidCtx.strokeStyle = COLORS.grid;
    sigmoidCtx.lineWidth = 1;
    sigmoidCtx.setLineDash([5, 5]);
    
    // Línea vertical en z=0
    const x0 = padding + (0 - zMin) * scaleX;
    sigmoidCtx.beginPath();
    sigmoidCtx.moveTo(x0, padding);
    sigmoidCtx.lineTo(x0, height - padding);
    sigmoidCtx.stroke();
    
    // Línea horizontal en σ=0.5
    const y05 = height - padding - 0.5 * scaleY;
    sigmoidCtx.beginPath();
    sigmoidCtx.moveTo(padding, y05);
    sigmoidCtx.lineTo(width - padding, y05);
    sigmoidCtx.stroke();
    
    sigmoidCtx.setLineDash([]);
    
    // Curva sigmoide
    sigmoidCtx.strokeStyle = COLORS.sigmoid;
    sigmoidCtx.lineWidth = 3;
    sigmoidCtx.beginPath();
    
    for (let px = padding; px <= width - padding; px++) {
        const z = zMin + (px - padding) / scaleX;
        const s = sigmoid(z);
        const py = height - padding - s * scaleY;
        
        if (px === padding) {
            sigmoidCtx.moveTo(px, py);
        } else {
            sigmoidCtx.lineTo(px, py);
        }
    }
    sigmoidCtx.stroke();
    
    // Marcador de z actual
    const zX = padding + (currentZ - zMin) * scaleX;
    const zS = sigmoid(currentZ);
    const zY = height - padding - zS * scaleY;
    
    // Línea vertical desde z hasta la curva
    sigmoidCtx.strokeStyle = COLORS.zLine;
    sigmoidCtx.lineWidth = 2;
    sigmoidCtx.setLineDash([3, 3]);
    sigmoidCtx.beginPath();
    sigmoidCtx.moveTo(zX, height - padding);
    sigmoidCtx.lineTo(zX, zY);
    sigmoidCtx.stroke();
    
    // Línea horizontal desde la curva hasta el eje
    sigmoidCtx.beginPath();
    sigmoidCtx.moveTo(zX, zY);
    sigmoidCtx.lineTo(padding, zY);
    sigmoidCtx.stroke();
    sigmoidCtx.setLineDash([]);
    
    // Punto en la curva
    sigmoidCtx.fillStyle = COLORS.zLine;
    sigmoidCtx.beginPath();
    sigmoidCtx.arc(zX, zY, 8, 0, 2 * Math.PI);
    sigmoidCtx.fill();
    
    sigmoidCtx.fillStyle = 'white';
    sigmoidCtx.beginPath();
    sigmoidCtx.arc(zX, zY, 4, 0, 2 * Math.PI);
    sigmoidCtx.fill();
    
    // Etiquetas de ejes
    sigmoidCtx.fillStyle = '#666';
    sigmoidCtx.font = 'bold 12px Source Sans Pro';
    sigmoidCtx.textAlign = 'center';
    
    // Etiquetas eje X
    for (let z = -6; z <= 6; z += 2) {
        const x = padding + (z - zMin) * scaleX;
        sigmoidCtx.fillText(z.toString(), x, height - padding + 18);
    }
    sigmoidCtx.fillText('z', width - padding + 15, height - padding + 5);
    
    // Etiquetas eje Y
    sigmoidCtx.textAlign = 'right';
    sigmoidCtx.fillText('0', padding - 8, height - padding + 4);
    sigmoidCtx.fillText('0.5', padding - 8, y05 + 4);
    sigmoidCtx.fillText('1', padding - 8, padding + 4);
    
    sigmoidCtx.save();
    sigmoidCtx.translate(15, height / 2);
    sigmoidCtx.rotate(-Math.PI / 2);
    sigmoidCtx.textAlign = 'center';
    sigmoidCtx.fillText('σ(z)', 0, 0);
    sigmoidCtx.restore();
    
    // Actualizar marcador
    zMarker.textContent = `z = ${currentZ.toFixed(2)} → σ(z) = ${zS.toFixed(3)}`;
}

// Renderizar frontera de decisión
function renderDecision() {
    const width = decisionCanvas.width;
    const height = decisionCanvas.height;
    const padding = 50;
    
    decisionCtx.clearRect(0, 0, width, height);
    
    // Rango de datos
    const xMin = -4;
    const xMax = 4;
    const yMin = -4;
    const yMax = 4;
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    
    // Colorear regiones según probabilidad
    const imageData = decisionCtx.createImageData(width, height);
    
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            // Convertir píxel a coordenadas
            const x1 = xMin + (px - padding) / scaleX;
            const x2 = yMax - (py - padding) / scaleY;  // Invertir Y
            
            // Solo dentro del área de graficación
            if (px >= padding && px <= width - padding && py >= padding && py <= height - padding) {
                const z = calculateZ(x1, x2);
                const prob = sigmoid(z);
                
                const idx = (py * width + px) * 4;
                
                if (prob > 0.5) {
                    // Región clase 1 (rojo claro)
                    imageData.data[idx] = 231;
                    imageData.data[idx + 1] = 76;
                    imageData.data[idx + 2] = 60;
                    imageData.data[idx + 3] = Math.floor(30 + (prob - 0.5) * 60);
                } else {
                    // Región clase 0 (azul claro)
                    imageData.data[idx] = 52;
                    imageData.data[idx + 1] = 152;
                    imageData.data[idx + 2] = 219;
                    imageData.data[idx + 3] = Math.floor(30 + (0.5 - prob) * 60);
                }
            }
        }
    }
    
    decisionCtx.putImageData(imageData, 0, 0);
    
    // Dibujar grid
    decisionCtx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    decisionCtx.lineWidth = 1;
    
    for (let x = -4; x <= 4; x += 2) {
        const px = padding + (x - xMin) * scaleX;
        decisionCtx.beginPath();
        decisionCtx.moveTo(px, padding);
        decisionCtx.lineTo(px, height - padding);
        decisionCtx.stroke();
    }
    
    for (let y = -4; y <= 4; y += 2) {
        const py = height - padding - (y - yMin) * scaleY;
        decisionCtx.beginPath();
        decisionCtx.moveTo(padding, py);
        decisionCtx.lineTo(width - padding, py);
        decisionCtx.stroke();
    }
    
    // Ejes
    decisionCtx.strokeStyle = COLORS.axis;
    decisionCtx.lineWidth = 2;
    
    // Eje X
    const yAxisPos = height - padding - (0 - yMin) * scaleY;
    decisionCtx.beginPath();
    decisionCtx.moveTo(padding, yAxisPos);
    decisionCtx.lineTo(width - padding, yAxisPos);
    decisionCtx.stroke();
    
    // Eje Y
    const xAxisPos = padding + (0 - xMin) * scaleX;
    decisionCtx.beginPath();
    decisionCtx.moveTo(xAxisPos, padding);
    decisionCtx.lineTo(xAxisPos, height - padding);
    decisionCtx.stroke();
    
    // Frontera de decisión (donde z = 0)
    // w1*x1 + w2*x2 + bias = 0
    // Si w2 != 0: x2 = -(w1*x1 + bias) / w2
    // Si w2 == 0: x1 = -bias / w1
    
    decisionCtx.strokeStyle = COLORS.frontier;
    decisionCtx.lineWidth = 3;
    decisionCtx.beginPath();
    
    if (Math.abs(w2) > 0.01) {
        // Línea no vertical
        const x1Start = xMin;
        const x1End = xMax;
        const x2Start = -(w1 * x1Start + bias) / w2;
        const x2End = -(w1 * x1End + bias) / w2;
        
        const pxStart = padding + (x1Start - xMin) * scaleX;
        const pyStart = height - padding - (x2Start - yMin) * scaleY;
        const pxEnd = padding + (x1End - xMin) * scaleX;
        const pyEnd = height - padding - (x2End - yMin) * scaleY;
        
        decisionCtx.moveTo(pxStart, pyStart);
        decisionCtx.lineTo(pxEnd, pyEnd);
    } else if (Math.abs(w1) > 0.01) {
        // Línea vertical
        const x1 = -bias / w1;
        const px = padding + (x1 - xMin) * scaleX;
        
        decisionCtx.moveTo(px, padding);
        decisionCtx.lineTo(px, height - padding);
    }
    
    decisionCtx.stroke();
    
    // Dibujar puntos
    for (const p of points) {
        const px = padding + (p.x1 - xMin) * scaleX;
        const py = height - padding - (p.x2 - yMin) * scaleY;
        
        // Verificar que esté dentro del área
        if (px >= padding && px <= width - padding && py >= padding && py <= height - padding) {
            decisionCtx.fillStyle = p.label === 0 ? COLORS.class0 : COLORS.class1;
            decisionCtx.strokeStyle = 'white';
            decisionCtx.lineWidth = 2;
            
            decisionCtx.beginPath();
            decisionCtx.arc(px, py, 7, 0, 2 * Math.PI);
            decisionCtx.fill();
            decisionCtx.stroke();
        }
    }
    
    // Etiquetas de ejes
    decisionCtx.fillStyle = '#666';
    decisionCtx.font = 'bold 12px Source Sans Pro';
    decisionCtx.textAlign = 'center';
    
    decisionCtx.fillText('x₁', width - padding + 15, yAxisPos + 5);
    
    decisionCtx.save();
    decisionCtx.translate(xAxisPos - 10, padding - 10);
    decisionCtx.fillText('x₂', 0, 0);
    decisionCtx.restore();
    
    // Números en ejes
    decisionCtx.font = '11px Source Sans Pro';
    for (let x = -4; x <= 4; x += 2) {
        if (x !== 0) {
            const px = padding + (x - xMin) * scaleX;
            decisionCtx.fillText(x.toString(), px, yAxisPos + 15);
        }
    }
    
    decisionCtx.textAlign = 'right';
    for (let y = -4; y <= 4; y += 2) {
        if (y !== 0) {
            const py = height - padding - (y - yMin) * scaleY;
            decisionCtx.fillText(y.toString(), xAxisPos - 8, py + 4);
        }
    }
}

// Actualizar ecuación
function updateEquation() {
    const formatNum = (n) => (n >= 0 ? '+' + n.toFixed(2) : n.toFixed(2));
    
    eqW1.textContent = w1.toFixed(2);
    eqW2.textContent = w2.toFixed(2);
    eqBias.textContent = formatNum(bias);
    
    eqW1b.textContent = w1.toFixed(2);
    eqW2b.textContent = w2.toFixed(2);
    eqBiasb.textContent = formatNum(bias);
}

// Renderizar todo
function render() {
    renderSigmoid();
    renderDecision();
    updateEquation();
}

// Event Listeners

// Sliders
w1Slider.addEventListener('input', () => {
    w1 = parseFloat(w1Slider.value);
    w1Value.textContent = w1.toFixed(2);
    render();
});

w2Slider.addEventListener('input', () => {
    w2 = parseFloat(w2Slider.value);
    w2Value.textContent = w2.toFixed(2);
    render();
});

biasSlider.addEventListener('input', () => {
    bias = parseFloat(biasSlider.value);
    biasValue.textContent = bias.toFixed(2);
    render();
});

// Hover sobre sigmoid para cambiar z
sigmoidCanvas.addEventListener('mousemove', (e) => {
    const rect = sigmoidCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const padding = 50;
    const width = sigmoidCanvas.width;
    
    if (px >= padding && px <= width - padding) {
        const zMin = -6;
        const zMax = 6;
        const scaleX = (width - 2 * padding) / (zMax - zMin);
        currentZ = zMin + (px - padding) / scaleX;
        currentZ = Math.max(-6, Math.min(6, currentZ));
        renderSigmoid();
    }
});

sigmoidCanvas.addEventListener('mouseleave', () => {
    currentZ = 0;
    renderSigmoid();
});

// Hover sobre puntos para ver probabilidad
decisionCanvas.addEventListener('mousemove', (e) => {
    const rect = decisionCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const padding = 50;
    const width = decisionCanvas.width;
    const height = decisionCanvas.height;
    
    const xMin = -4, xMax = 4, yMin = -4, yMax = 4;
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    
    // Convertir a coordenadas
    const x1 = xMin + (mx - padding) / scaleX;
    const x2 = yMax - (my - padding) / scaleY;
    
    if (mx >= padding && mx <= width - padding && my >= padding && my <= height - padding) {
        const z = calculateZ(x1, x2);
        const prob = sigmoid(z);
        
        // Actualizar z en el gráfico de sigmoide
        currentZ = Math.max(-6, Math.min(6, z));
        renderSigmoid();
        
        // Mostrar tooltip
        probDisplay.style.display = 'block';
        probDisplay.style.left = (mx + 10) + 'px';
        probDisplay.style.top = (my - 30) + 'px';
        probDisplay.innerHTML = `
            <div style="font-weight: 600;">P(y=1|x) = ${prob.toFixed(3)}</div>
            <div style="color: #666; font-size: 0.75rem;">z = ${z.toFixed(2)}</div>
            <div style="color: #666; font-size: 0.75rem;">Pred: ${prob >= 0.5 ? 'Clase 1' : 'Clase 0'}</div>
        `;
    }
});

decisionCanvas.addEventListener('mouseleave', () => {
    probDisplay.style.display = 'none';
    currentZ = 0;
    renderSigmoid();
});

// Dataset buttons
document.querySelectorAll('.dataset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.dataset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        generateDataset(btn.dataset.dataset);
        render();
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    generateDataset('separable');
    render();
});
