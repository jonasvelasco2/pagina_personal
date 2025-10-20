const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const messageBox = document.getElementById('message-box');
const iterationValue = document.getElementById('iteration-value');
const currentValueDisplay = document.getElementById('current-value');
const bestValueDisplay = document.getElementById('best-value');
const tabuSizeDisplay = document.getElementById('tabu-size');
const tabuListDisplay = document.getElementById('tabu-list-display');
const tabuTenureInput = document.getElementById('tabu-tenure-input');
const tabuTenureDisplay = document.getElementById('tabu-tenure-display');
const iterationsInput = document.getElementById('iterations-input');
const iterationsDisplay = document.getElementById('iterations-display');

let gridData = [];
let currentRow = -1;
let currentCol = -1;
let bestRow = -1;
let bestCol = -1;
let bestValue = Infinity;
let intervalId = null;
let iteration = 0;
let maxIterations = 50;
let tabuTenure = 7; // Tamaño de la lista tabú (ahora variable)
let tabuList = []; // Lista de movimientos tabú: [{row, col, tenure}, ...]

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

    // Crear algunos "valles" aleatorios (zonas con valores más bajos)
    const numValleys = Math.floor(Math.random() * 3) + 2; // Entre 2 y 4 valles
    
    for (let v = 0; v < numValleys; v++) {
        const centerRow = Math.floor(Math.random() * rows);
        const centerCol = Math.floor(Math.random() * cols);
        const valleySize = Math.floor(Math.random() * 2) + 1;
        const baseValue = Math.floor(Math.random() * 30) + 1;
        
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

    // Crear algunas "montañas" aleatorias
    const numMountains = Math.floor(Math.random() * 2) + 1;
    
    for (let m = 0; m < numMountains; m++) {
        const centerRow = Math.floor(Math.random() * rows);
        const centerCol = Math.floor(Math.random() * cols);
        const mountainSize = Math.floor(Math.random() * 2) + 1;
        const baseValue = Math.floor(Math.random() * 20) + 80;
        
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
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('current', 'visited', 'best');
    });
    
    currentRow = parseInt(event.target.dataset.row);
    currentCol = parseInt(event.target.dataset.col);
    bestRow = currentRow;
    bestCol = currentCol;
    bestValue = gridData[currentRow][currentCol];
    event.target.classList.add('current');
    
    // Reset stats
    iteration = 0;
    tabuList = [];
    updateStats();
    updateTabuListDisplay();
    
    startBtn.disabled = false;
    resetBtn.disabled = false;
    showMessage(`Punto de inicio seleccionado en (${currentCol + 1}, ${10 - currentRow}). Presione "Comenzar" para iniciar.`, 'info');
}

// Show a message in the message box
function showMessage(text, type = 'info') {
    messageBox.textContent = text;
    const typeClass = type === 'success' ? 'message-success' : type === 'warning' ? 'message-warning' : 'message-info';
    messageBox.className = `message-box show ${typeClass}`;
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
    iterationValue.textContent = iteration;
    currentValueDisplay.textContent = (currentRow >= 0 && currentCol >= 0) ? gridData[currentRow][currentCol] : '-';
    bestValueDisplay.textContent = bestValue !== Infinity ? bestValue : '-';
    tabuSizeDisplay.textContent = tabuList.length;
}

// Update tabu list display
function updateTabuListDisplay() {
    if (tabuList.length === 0) {
        tabuListDisplay.innerHTML = '<span style="color: #718096; font-size: 0.875rem;">Vacía</span>';
    } else {
        tabuListDisplay.innerHTML = tabuList.map(item => 
            `<span class="tabu-item">(${item.col + 1},${10 - item.row}) [${item.tenure}]</span>`
        ).join('');
    }
}

// Check if a move is tabu
function isTabu(row, col) {
    return tabuList.some(item => item.row === row && item.col === col);
}

// Add a move to the tabu list
function addToTabuList(row, col) {
    // Remove if already exists
    tabuList = tabuList.filter(item => !(item.row === row && item.col === col));
    
    // Add with initial tenure equal to tabuTenure
    tabuList.push({ row, col, tenure: tabuTenure, iteration: iteration });
    
    // Keep only the most recent tabuTenure moves (FIFO)
    while (tabuList.length > tabuTenure) {
        tabuList.shift();
    }
}

// Decrease tenure of all tabu moves (for display purposes)
function decreaseTabuTenure() {
    // Update tenure for display (shows remaining iterations)
    tabuList = tabuList.map(item => ({
        ...item,
        tenure: tabuTenure - (iteration - item.iteration)
    })).filter(item => item.tenure > 0);
}

// Get all neighbors (8-connectivity)
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

    return neighbors.filter(n => 
        n.r >= 0 && n.r < 10 && n.c >= 0 && n.c < 10
    );
}

// Update tabu markers on grid
function updateTabuMarkers() {
    document.querySelectorAll('.tabu-marker').forEach(marker => marker.remove());
    
    tabuList.forEach(item => {
        const cell = document.querySelector(`[data-row='${item.row}'][data-col='${item.col}']`);
        if (cell) {
            const marker = document.createElement('div');
            marker.className = 'tabu-marker';
            cell.appendChild(marker);
        }
    });
}

// Tabu search step
function tabuSearchStep() {
    if (iteration >= maxIterations) {
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

    const neighbors = getNeighbors();
    
    // Highlight all neighbors
    neighbors.forEach(n => {
        const neighborCell = document.querySelector(`[data-row='${n.r}'][data-col='${n.c}']`);
        if (neighborCell) {
            if (isTabu(n.r, n.c)) {
                neighborCell.classList.add('tabu');
            } else {
                neighborCell.classList.add('neighbor');
            }
        }
    });

    setTimeout(() => {
        // Remove highlights
        document.querySelectorAll('.neighbor, .tabu, .aspiration').forEach(cell => {
            cell.classList.remove('neighbor', 'tabu', 'aspiration');
        });

        // Find best non-tabu neighbor
        let bestNeighbor = null;
        let bestNeighborValue = Infinity;
        let aspirationUsed = false;

        for (const neighbor of neighbors) {
            const value = getValue(neighbor.r, neighbor.c);
            const isTabuMove = isTabu(neighbor.r, neighbor.c);
            
            // Aspiration criterion: accept tabu move if it improves best solution
            if (isTabuMove && value < bestValue) {
                bestNeighbor = neighbor;
                bestNeighborValue = value;
                aspirationUsed = true;
                break;
            }
            
            // Select best non-tabu neighbor
            if (!isTabuMove && value < bestNeighborValue) {
                bestNeighbor = neighbor;
                bestNeighborValue = value;
            }
        }

        if (bestNeighbor) {
            // Move to the new position
            const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            currentCell.classList.remove('current');
            currentCell.classList.add('visited');
            
            // Add current position to tabu list
            addToTabuList(currentRow, currentCol);
            
            currentRow = bestNeighbor.r;
            currentCol = bestNeighbor.c;
            
            const newCurrentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCurrentCell.classList.add('current');

            if (aspirationUsed) {
                newCurrentCell.classList.add('aspiration');
                setTimeout(() => newCurrentCell.classList.remove('aspiration'), 1000);
            }

            // Update best solution if this is better
            if (bestNeighborValue < bestValue) {
                document.querySelectorAll('.best').forEach(cell => cell.classList.remove('best'));
                
                bestValue = bestNeighborValue;
                bestRow = currentRow;
                bestCol = currentCol;
                showMessage(`¡Nueva mejor solución! Valor: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})${aspirationUsed ? ' (Criterio de aspiración)' : ''}`, 'success');
            } else {
                showMessage(`Movimiento a (${currentCol + 1}, ${10 - currentRow}) con valor ${bestNeighborValue}${aspirationUsed ? ' (Criterio de aspiración)' : ''}`, 'info');
            }
        } else {
            // No valid moves available
            clearInterval(intervalId);
            intervalId = null;
            showMessage(`No hay movimientos válidos disponibles. Mejor solución: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})`, 'warning');
            startBtn.disabled = true;
            resetBtn.disabled = false;
            generateBtn.disabled = false;
            tabuTenureInput.disabled = false;
            return;
        }

        // Decrease tenure of tabu moves
        decreaseTabuTenure();
        
        iteration++;
        updateStats();
        updateTabuListDisplay();
        updateTabuMarkers();
    }, 800);
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
    showMessage('Comenzando Búsqueda Tabú...');
    intervalId = setInterval(tabuSearchStep, 1600);
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
    iteration = 0;
    tabuList = [];
    updateStats();
    updateTabuListDisplay();
    createGrid();
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
    a.download = 'grid_data_tabu_search.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data_tabu_search.txt', 'success');
}

// Event listeners
startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);
generateBtn.addEventListener('click', () => {
    gridData = generateGridData().reverse();
    resetAnimation();
});
downloadBtn.addEventListener('click', downloadGridData);

// Tabu tenure slider listener
tabuTenureInput.addEventListener('input', (e) => {
    tabuTenure = parseInt(e.target.value);
    tabuTenureDisplay.textContent = tabuTenure;
    
    // If algorithm is not running, update the display
    if (!intervalId) {
        updateStats();
    }
});

// Iterations input listener
iterationsInput.addEventListener('input', (e) => {
    maxIterations = parseInt(e.target.value);
    iterationsDisplay.textContent = maxIterations;
});

// Disable inputs during animation
function disableInputs() {
    tabuTenureInput.disabled = true;
    iterationsInput.disabled = true;
}

function enableInputs() {
    tabuTenureInput.disabled = false;
    iterationsInput.disabled = false;
}

// Initial setup
gridData = generateGridData().reverse();
createGrid();
updateStats();
updateTabuListDisplay();
showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
