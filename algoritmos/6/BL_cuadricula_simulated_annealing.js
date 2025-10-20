const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const messageBox = document.getElementById('message-box');
const temperatureValue = document.getElementById('temperature-value');
const iterationValue = document.getElementById('iteration-value');
const currentValueDisplay = document.getElementById('current-value');
const bestValueDisplay = document.getElementById('best-value');
const temperatureInput = document.getElementById('temperature-input');
const temperatureDisplay = document.getElementById('temperature-display');
const iterationsInput = document.getElementById('iterations-input');
const iterationsDisplay = document.getElementById('iterations-display');
const coolingInput = document.getElementById('cooling-input');
const coolingDisplay = document.getElementById('cooling-display');

let gridData = [];
let currentRow = -1;
let currentCol = -1;
let bestRow = -1;
let bestCol = -1;
let bestValue = Infinity;
let intervalId = null;
let temperature = 100.0;
let initialTemperature = 100.0;
let iteration = 0;
let maxIterations = 100;
let coolingRate = 0.95;
const minTemperature = 0.1;

// Genera datos completamente aleatorios y retadores
function generateGridData() {
    const data = [];
    const rows = 10;
    const cols = 10;

    // Inicializa toda la cuadrícula con valores completamente aleatorios
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(Math.floor(Math.random() * 100) + 1); // Valores entre 1 y 100
        }
        data.push(row);
    }

    // Crear algunos "valles" aleatorios (zonas con valores más bajos) para hacer más retador
    const numValleys = Math.floor(Math.random() * 3) + 2; // Entre 2 y 4 valles
    
    for (let v = 0; v < numValleys; v++) {
        const centerRow = Math.floor(Math.random() * rows);
        const centerCol = Math.floor(Math.random() * cols);
        const valleySize = Math.floor(Math.random() * 2) + 1; // Radio de 1-2 celdas (más pequeño para 10x10)
        const baseValue = Math.floor(Math.random() * 30) + 1; // Valores bajos entre 1-30
        
        // Crear el valle con valores decrecientes hacia el centro
        for (let i = Math.max(0, centerRow - valleySize); i <= Math.min(rows - 1, centerRow + valleySize); i++) {
            for (let j = Math.max(0, centerCol - valleySize); j <= Math.min(cols - 1, centerCol + valleySize); j++) {
                const distance = Math.abs(i - centerRow) + Math.abs(j - centerCol);
                if (distance <= valleySize) {
                    const valleyValue = baseValue + distance * Math.floor(Math.random() * 5);
                    if (valleyValue < data[i][j]) {
                        data[i][j] = valleyValue;
                    }
                }
            }
        }
    }

    // Crear algunas "montañas" aleatorias (zonas con valores más altos) para obstáculos
    const numMountains = Math.floor(Math.random() * 2) + 1; // Entre 1 y 2 montañas
    
    for (let m = 0; m < numMountains; m++) {
        const centerRow = Math.floor(Math.random() * rows);
        const centerCol = Math.floor(Math.random() * cols);
        const mountainSize = Math.floor(Math.random() * 2) + 1; // Radio de 1-2 celdas
        const baseValue = Math.floor(Math.random() * 20) + 80; // Valores altos entre 80-99
        
        // Crear la montaña con valores crecientes hacia el centro
        for (let i = Math.max(0, centerRow - mountainSize); i <= Math.min(rows - 1, centerRow + mountainSize); i++) {
            for (let j = Math.max(0, centerCol - mountainSize); j <= Math.min(cols - 1, centerCol + mountainSize); j++) {
                const distance = Math.abs(i - centerRow) + Math.abs(j - centerCol);
                if (distance <= mountainSize) {
                    const mountainValue = baseValue + (mountainSize - distance) * Math.floor(Math.random() * 5);
                    if (mountainValue > data[i][j]) {
                        data[i][j] = mountainValue;
                    }
                }
            }
        }
    }

    return data;
}


// Create the grid from data
function createGrid() {
    gridContainer.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell selectable';
            cell.textContent = gridData[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            gridContainer.appendChild(cell);
            cell.addEventListener('click', handleCellClick);
        }
    }
}

// Handle cell selection
function handleCellClick(event) {
    // Remove 'current' and 'visited' class from all cells
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('current', 'visited', 'best');
    });
    
    // Set the new starting point
    currentRow = parseInt(event.target.dataset.row);
    currentCol = parseInt(event.target.dataset.col);
    bestRow = currentRow;
    bestCol = currentCol;
    bestValue = gridData[currentRow][currentCol];
    event.target.classList.add('current');
    
    // Reset stats
    temperature = initialTemperature;
    iteration = 0;
    updateStats();
    
    startBtn.disabled = false;
    resetBtn.disabled = false;
    showMessage(`Punto de inicio seleccionado en (${currentCol + 1}, ${10 - currentRow}). Presione "Comenzar" para iniciar.`, 'info');
}

// Show a message in the message box
function showMessage(text, type = 'info') {
    messageBox.textContent = text;
    messageBox.className = `message-box show ${type === 'success' ? 'message-success' : 'message-info'}`;
}

// Get the value of a cell
function getValue(row, col) {
    if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        return gridData[row][col];
    }
    return Infinity;
}

// Update statistics display
function updateStats() {
    temperatureValue.textContent = temperature.toFixed(2);
    iterationValue.textContent = iteration;
    currentValueDisplay.textContent = (currentRow >= 0 && currentCol >= 0) ? gridData[currentRow][currentCol] : '-';
    bestValueDisplay.textContent = bestValue !== Infinity ? bestValue : '-';
}

// Calculate acceptance probability
function acceptanceProbability(currentEnergy, newEnergy, temp) {
    if (newEnergy < currentEnergy) {
        return 1.0; // Always accept better solutions
    }
    // Accept worse solutions with probability that decreases with temperature
    return Math.exp((currentEnergy - newEnergy) / temp);
}

// Get all valid neighbors (8-connectivity)
function getNeighbors() {
    const neighbors = [
        { r: currentRow - 1, c: currentCol },     // Arriba
        { r: currentRow + 1, c: currentCol },     // Abajo
        { r: currentRow, c: currentCol - 1 },     // Izquierda
        { r: currentRow, c: currentCol + 1 },     // Derecha
        { r: currentRow - 1, c: currentCol - 1 }, // Diagonal superior-izquierda
        { r: currentRow - 1, c: currentCol + 1 }, // Diagonal superior-derecha
        { r: currentRow + 1, c: currentCol - 1 }, // Diagonal inferior-izquierda
        { r: currentRow + 1, c: currentCol + 1 }  // Diagonal inferior-derecha
    ];

    // Filter valid neighbors
    return neighbors.filter(n => 
        n.r >= 0 && n.r < 10 && n.c >= 0 && n.c < 10
    );
}

// Get a random neighbor from valid neighbors
function getRandomNeighbor(neighbors) {
    return neighbors[Math.floor(Math.random() * neighbors.length)];
}

// Simulated annealing step
function simulatedAnnealingStep() {
    if (iteration >= maxIterations || temperature < minTemperature) {
        // Algorithm finished
        clearInterval(intervalId);
        intervalId = null;
        
        // Highlight the best solution found
        document.querySelectorAll('.grid-cell').forEach(cell => {
            if (parseInt(cell.dataset.row) === bestRow && parseInt(cell.dataset.col) === bestCol) {
                cell.classList.add('best');
            }
        });
        
        showMessage(`Búsqueda completada. Mejor solución encontrada en (${bestCol + 1}, ${10 - bestRow}) con valor ${bestValue}`, 'success');
        startBtn.disabled = true;
        resetBtn.disabled = false;
        generateBtn.disabled = false;
        enableInputs();
        return;
    }

    const currentEnergy = gridData[currentRow][currentCol];
    
    // Get all valid neighbors
    const neighbors = getNeighbors();
    
    // Highlight all neighbors first
    neighbors.forEach(n => {
        const cell = document.querySelector(`[data-row='${n.r}'][data-col='${n.c}']`);
        if (cell) {
            cell.classList.add('neighbor');
        }
    });

    // Wait a moment to show all neighbors
    setTimeout(() => {
        // Select a random neighbor
        const neighbor = getRandomNeighbor(neighbors);
        const newEnergy = gridData[neighbor.r][neighbor.c];
        
        // Remove all neighbor highlights
        document.querySelectorAll('.neighbor').forEach(cell => {
            cell.classList.remove('neighbor');
        });

        const acceptProb = acceptanceProbability(currentEnergy, newEnergy, temperature);
        const random = Math.random();

        if (random < acceptProb) {
            // Accept the move
            const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            currentCell.classList.remove('current');
            currentCell.classList.add('visited');
            
            currentRow = neighbor.r;
            currentCol = neighbor.c;
            
            const newCurrentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCurrentCell.classList.add('current');
            newCurrentCell.classList.remove('rejected');

            // Update best solution if this is better
            if (newEnergy < bestValue) {
                // Remove best class from previous best
                document.querySelectorAll('.best').forEach(cell => cell.classList.remove('best'));
                
                bestValue = newEnergy;
                bestRow = currentRow;
                bestCol = currentCol;
                showMessage(`¡Nueva mejor solución! Valor: ${bestValue} en (${bestCol + 1}, ${10 - bestRow}). Temp: ${temperature.toFixed(2)}`);
            } else {
                showMessage(`Movimiento aceptado a (${currentCol + 1}, ${10 - currentRow}) con valor ${newEnergy}. Prob: ${(acceptProb * 100).toFixed(1)}%`);
            }
        } else {
            // Reject the move
            const neighborCell = document.querySelector(`[data-row='${neighbor.r}'][data-col='${neighbor.c}']`);
            if (neighborCell) {
                neighborCell.classList.add('rejected');
                setTimeout(() => {
                    neighborCell.classList.remove('rejected');
                }, 500);
            }
            showMessage(`Movimiento rechazado. Permaneciendo en (${currentCol + 1}, ${10 - currentRow}). Prob: ${(acceptProb * 100).toFixed(1)}%`);
        }

        // Cool down the temperature
        temperature *= coolingRate;
        iteration++;
        updateStats();
    }, 800);
}

// Animation step
function animateStep() {
    simulatedAnnealingStep();
}

// Start animation
function startAnimation() {
    startBtn.disabled = true;
    generateBtn.disabled = true;
    disableInputs();
    document.querySelectorAll('.selectable').forEach(cell => {
        cell.classList.remove('selectable');
        cell.removeEventListener('click', handleCellClick);
    });
    showMessage('Comenzando Simulated Annealing...');
    intervalId = setInterval(animateStep, 1600); // 1.6 seconds delay between steps
}

// Reset the animation
function resetAnimation() {
    clearInterval(intervalId);
    intervalId = null;
    currentRow = -1;
    currentCol = -1;
    bestRow = -1;
    bestCol = -1;
    bestValue = Infinity;
    temperature = initialTemperature;
    iteration = 0;
    updateStats();
    createGrid(); // Re-create grid with click listeners
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = false;
    enableInputs();
    showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
}

// Function to download the grid data as a text file
function downloadGridData() {
    const dataString = gridData.map(row => row.join(', ')).join('\n');
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid_data_simulated_annealing.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data_simulated_annealing.txt', 'success');
}

// Event listeners
startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);
generateBtn.addEventListener('click', () => {
    gridData = generateGridData().reverse();
    resetAnimation();
});
downloadBtn.addEventListener('click', downloadGridData);

// Temperature input listener
temperatureInput.addEventListener('input', (e) => {
    initialTemperature = parseFloat(e.target.value);
    temperatureDisplay.textContent = initialTemperature;
    temperature = initialTemperature;
    updateStats();
});

// Iterations input listener
iterationsInput.addEventListener('input', (e) => {
    maxIterations = parseInt(e.target.value);
    iterationsDisplay.textContent = maxIterations;
});

// Cooling rate input listener
coolingInput.addEventListener('input', (e) => {
    // Convert slider value (80-99) to decimal (0.80-0.99)
    coolingRate = parseInt(e.target.value) / 100;
    coolingDisplay.textContent = coolingRate.toFixed(2);
});

// Disable inputs during animation
function disableInputs() {
    temperatureInput.disabled = true;
    iterationsInput.disabled = true;
    coolingInput.disabled = true;
}

function enableInputs() {
    temperatureInput.disabled = false;
    iterationsInput.disabled = false;
    coolingInput.disabled = false;
}

// Initial setup
gridData = generateGridData().reverse();
createGrid();
updateStats();
showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
