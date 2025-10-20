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

// Genera un conjunto de datos estructurado con un camino de descenso claro
function generateGridData() {
    const data = [];
    const rows = 10;
    const cols = 10;

    // Inicializa la cuadrícula con valores altos aleatorios para crear "terreno"
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(Math.floor(Math.random() * 50) + 51); // Valores entre 51 y 100
        }
        data.push(row);
    }

    // Define un camino de valores decrecientes
    const path = [
        { r: 0, c: 5 }, { r: 1, c: 5 }, { r: 2, c: 5 }, { r: 3, c: 5 },
        { r: 3, c: 4 }, { r: 3, c: 3 }, { r: 4, c: 3 }, { r: 5, c: 3 },
        { r: 6, c: 3 }, { r: 7, c: 3 }, { r: 7, c: 2 }, { r: 7, c: 1 },
        { r: 8, c: 1 }, { r: 9, c: 1 }
    ];

    // Asigna valores decrecientes a lo largo del camino
    let value = 90;
    for (let i = 0; i < path.length; i++) {
        const { r, c } = path[i];
        data[r][c] = value;
        // Reduce el valor para el siguiente paso
        value -= (Math.floor(Math.random() * 5) + 1);
    }

    // Asegura que el punto final tenga el valor más bajo
    data[9][1] = 5;

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

// Find the best adjacent neighbor
function findBestNeighbor() {
    const neighbors = [
        { r: currentRow, c: currentCol + 1, order: 1 }, // Right
        { r: currentRow, c: currentCol - 1, order: 2 }, // Left
        { r: currentRow + 1, c: currentCol, order: 3 }, // Down
        { r: currentRow - 1, c: currentCol, order: 4 }  // Up
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
