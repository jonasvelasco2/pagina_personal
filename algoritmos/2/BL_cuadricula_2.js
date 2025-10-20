const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const messageBox = document.getElementById('message-box');

let gridData = [];
let currentRow = -1;
let currentCol = -1;
let intervalId = null;

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
        cell.classList.remove('current', 'visited');
    });
    
    // Set the new starting point
    currentRow = parseInt(event.target.dataset.row);
    currentCol = parseInt(event.target.dataset.col);
    event.target.classList.add('current');
    
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

// Find the best diagonal neighbor
function findBestNeighbor() {
    const neighbors = [
        { r: currentRow - 1, c: currentCol - 1, order: 1 }, // Diagonal superior-izquierda
        { r: currentRow - 1, c: currentCol + 1, order: 2 }, // Diagonal superior-derecha
        { r: currentRow + 1, c: currentCol - 1, order: 3 }, // Diagonal inferior-izquierda
        { r: currentRow + 1, c: currentCol + 1, order: 4 }  // Diagonal inferior-derecha
    ];

    let bestNeighbor = null;
    let minVal = gridData[currentRow][currentCol];
    
    // Highlight all potential neighbors first
    neighbors.forEach(n => {
        const neighborCell = document.querySelector(`[data-row='${n.r}'][data-col='${n.c}']`);
        if (neighborCell && !neighborCell.classList.contains('visited')) {
            neighborCell.classList.add('neighbor');
        }
    });

    // Find the best one after a delay
    setTimeout(() => {
        // Remove neighbor highlight
        document.querySelectorAll('.neighbor').forEach(cell => cell.classList.remove('neighbor'));

        for (const neighbor of neighbors) {
            const val = getValue(neighbor.r, neighbor.c);
            if (val < minVal) {
                minVal = val;
                bestNeighbor = neighbor;
            }
        }
        
        if (bestNeighbor) {
            // Move to the new position
            const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            currentCell.classList.remove('current');
            currentCell.classList.add('visited');
            currentRow = bestNeighbor.r;
            currentCol = bestNeighbor.c;
            const newCurrentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCurrentCell.classList.add('current');
            showMessage(`Moviéndose a (${currentCol + 1}, ${10 - currentRow}) con valor ${gridData[currentRow][currentCol]}`);
        } else {
            // No better neighbor found, animation stops
            clearInterval(intervalId);
            intervalId = null;
            showMessage(`Óptimo local encontrado en (${currentCol + 1}, ${10 - currentRow}) con valor ${gridData[currentRow][currentCol]}`, 'success');
            startBtn.disabled = true;
            resetBtn.disabled = false;
        }
    }, 1000); // 1 second delay
}

// Animation step
function animateStep() {
    findBestNeighbor();
}

// Start animation
function startAnimation() {
    startBtn.disabled = true;
    generateBtn.disabled = true;
    document.querySelectorAll('.selectable').forEach(cell => {
        cell.classList.remove('selectable');
        cell.removeEventListener('click', handleCellClick);
    });
    showMessage('Comenzando la animación...');
    intervalId = setInterval(animateStep, 2000); // 2 seconds delay between steps
}

// Reset the animation
function resetAnimation() {
    clearInterval(intervalId);
    intervalId = null;
    currentRow = -1;
    currentCol = -1;
    createGrid(); // Re-create grid with click listeners
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = false;
    showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
}

// Function to download the grid data as a text file
function downloadGridData() {
    const dataString = gridData.map(row => row.join(', ')).join('\n');
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid_data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data.txt', 'success');
}

// Event listeners
startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);
generateBtn.addEventListener('click', () => {
    gridData = generateGridData().reverse();
    resetAnimation();
});
downloadBtn.addEventListener('click', downloadGridData);

// Initial setup
gridData = generateGridData().reverse();
createGrid();
showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
