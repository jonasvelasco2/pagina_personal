const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const messageBox = document.getElementById('message-box');
const iterationValue = document.getElementById('iteration-value');
const neighborhoodValue = document.getElementById('neighborhood-value');
const currentValueDisplay = document.getElementById('current-value');
const bestValueDisplay = document.getElementById('best-value');
const neighborhoodIndicator = document.getElementById('neighborhood-indicator');

let gridData = [];
let currentRow = -1;
let currentCol = -1;
let bestRow = -1;
let bestCol = -1;
let bestValue = Infinity;
let intervalId = null;
let iteration = 0;
const maxIterations = 100;
let currentNeighborhood = 1;
const maxNeighborhoods = 4;

const neighborhoodNames = {
    1: 'N1 (Cruz - 4 vecinos)',
    2: 'N2 (Diagonales - 4 vecinos)',
    3: 'N3 (Conectividad-8 - 8 vecinos)',
    4: 'N4 (Cruz extendida - 12 vecinos)'
};

function generateGridData() {
    const data = [];
    for (let i = 0; i < 10; i++) {
        const row = [];
        for (let j = 0; j < 10; j++) {
            row.push(Math.floor(Math.random() * 100) + 1);
        }
        data.push(row);
    }
    const numValleys = Math.floor(Math.random() * 3) + 2;
    for (let v = 0; v < numValleys; v++) {
        const centerRow = Math.floor(Math.random() * 10);
        const centerCol = Math.floor(Math.random() * 10);
        const valleySize = Math.floor(Math.random() * 2) + 1;
        const baseValue = Math.floor(Math.random() * 30) + 1;
        for (let i = Math.max(0, centerRow - valleySize); i <= Math.min(9, centerRow + valleySize); i++) {
            for (let j = Math.max(0, centerCol - valleySize); j <= Math.min(9, centerCol + valleySize); j++) {
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
    return data;
}

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
    
    iteration = 0;
    currentNeighborhood = 1;
    updateStats();
    
    startBtn.disabled = false;
    resetBtn.disabled = false;
    showMessage(`Punto de inicio seleccionado en (${currentCol + 1}, ${10 - currentRow}). Presione "Comenzar VNS" para iniciar.`, 'info');
}

function showMessage(text, type = 'info') {
    messageBox.textContent = text;
    const typeClass = type === 'success' ? 'message-success' : type === 'warning' ? 'message-warning' : 'message-info';
    messageBox.className = `message-box show ${typeClass}`;
}

function getValue(row, col) {
    if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        return gridData[row][col];
    }
    return Infinity;
}

function updateStats() {
    iterationValue.textContent = iteration;
    neighborhoodValue.textContent = `N${currentNeighborhood}`;
    currentValueDisplay.textContent = (currentRow >= 0 && currentCol >= 0) ? gridData[currentRow][currentCol] : '-';
    bestValueDisplay.textContent = bestValue !== Infinity ? bestValue : '-';
    neighborhoodIndicator.textContent = `Vecindario actual: ${neighborhoodNames[currentNeighborhood]}`;
}

function getNeighbors(neighborhoodType) {
    let neighbors = [];
    
    if (neighborhoodType === 1) {
        // N1: Cruz (4 vecinos)
        neighbors = [
            { r: currentRow - 1, c: currentCol },
            { r: currentRow + 1, c: currentCol },
            { r: currentRow, c: currentCol - 1 },
            { r: currentRow, c: currentCol + 1 }
        ];
    } else if (neighborhoodType === 2) {
        // N2: Diagonales (4 vecinos)
        neighbors = [
            { r: currentRow - 1, c: currentCol - 1 },
            { r: currentRow - 1, c: currentCol + 1 },
            { r: currentRow + 1, c: currentCol - 1 },
            { r: currentRow + 1, c: currentCol + 1 }
        ];
    } else if (neighborhoodType === 3) {
        // N3: Conectividad-8 (8 vecinos)
        neighbors = [
            { r: currentRow - 1, c: currentCol },
            { r: currentRow + 1, c: currentCol },
            { r: currentRow, c: currentCol - 1 },
            { r: currentRow, c: currentCol + 1 },
            { r: currentRow - 1, c: currentCol - 1 },
            { r: currentRow - 1, c: currentCol + 1 },
            { r: currentRow + 1, c: currentCol - 1 },
            { r: currentRow + 1, c: currentCol + 1 }
        ];
    } else if (neighborhoodType === 4) {
        // N4: Cruz extendida (12 vecinos)
        neighbors = [
            { r: currentRow - 1, c: currentCol },
            { r: currentRow + 1, c: currentCol },
            { r: currentRow, c: currentCol - 1 },
            { r: currentRow, c: currentCol + 1 },
            { r: currentRow - 2, c: currentCol },
            { r: currentRow + 2, c: currentCol },
            { r: currentRow, c: currentCol - 2 },
            { r: currentRow, c: currentCol + 2 },
            { r: currentRow - 1, c: currentCol - 1 },
            { r: currentRow - 1, c: currentCol + 1 },
            { r: currentRow + 1, c: currentCol - 1 },
            { r: currentRow + 1, c: currentCol + 1 }
        ];
    }
    
    return neighbors.filter(n => n.r >= 0 && n.r < 10 && n.c >= 0 && n.c < 10);
}

function vnsStep() {
    if (iteration >= maxIterations) {
        clearInterval(intervalId);
        intervalId = null;
        
        const bestCell = document.querySelector(`[data-row='${bestRow}'][data-col='${bestCol}']`);
        bestCell.classList.add('best');
        
        showMessage(`VNS completado. Mejor solución: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})`, 'success');
        startBtn.disabled = true;
        resetBtn.disabled = false;
        generateBtn.disabled = false;
        return;
    }

    const neighbors = getNeighbors(currentNeighborhood);
    
    neighbors.forEach(n => {
        const neighborCell = document.querySelector(`[data-row='${n.r}'][data-col='${n.c}']`);
        if (neighborCell) {
            neighborCell.classList.add('neighbor');
        }
    });

    setTimeout(() => {
        document.querySelectorAll('.neighbor').forEach(cell => cell.classList.remove('neighbor'));

        let bestNeighbor = null;
        let bestNeighborValue = gridData[currentRow][currentCol];

        for (const neighbor of neighbors) {
            const value = getValue(neighbor.r, neighbor.c);
            if (value < bestNeighborValue) {
                bestNeighbor = neighbor;
                bestNeighborValue = value;
            }
        }

        if (bestNeighbor) {
            // Mejora encontrada
            const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            currentCell.classList.remove('current');
            currentCell.classList.add('visited');
            
            currentRow = bestNeighbor.r;
            currentCol = bestNeighbor.c;
            
            const newCurrentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCurrentCell.classList.add('current');

            if (bestNeighborValue < bestValue) {
                document.querySelectorAll('.best').forEach(cell => cell.classList.remove('best'));
                bestValue = bestNeighborValue;
                bestRow = currentRow;
                bestCol = currentCol;
                showMessage(`¡Mejora! Valor: ${bestValue} en (${bestCol + 1}, ${10 - bestRow}) con ${neighborhoodNames[currentNeighborhood]}`, 'success');
            }
            
            // Volver al vecindario más pequeño
            currentNeighborhood = 1;
            showMessage(`Mejora encontrada. Volviendo a ${neighborhoodNames[1]}`, 'info');
        } else {
            // No hay mejora, cambiar a siguiente vecindario
            if (currentNeighborhood < maxNeighborhoods) {
                currentNeighborhood++;
                showMessage(`Sin mejora en N${currentNeighborhood - 1}. Cambiando a ${neighborhoodNames[currentNeighborhood]}`, 'warning');
            } else {
                // Shake: movimiento aleatorio
                const allNeighbors = getNeighbors(4);
                if (allNeighbors.length > 0) {
                    const randomNeighbor = allNeighbors[Math.floor(Math.random() * allNeighbors.length)];
                    
                    const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
                    currentCell.classList.remove('current');
                    currentCell.classList.add('visited');
                    
                    currentRow = randomNeighbor.r;
                    currentCol = randomNeighbor.c;
                    
                    const newCurrentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
                    newCurrentCell.classList.add('current');
                    newCurrentCell.classList.add('shake');
                    setTimeout(() => newCurrentCell.classList.remove('shake'), 1000);
                    
                    currentNeighborhood = 1;
                    showMessage(`Shake aplicado. Movimiento aleatorio a (${currentCol + 1}, ${10 - currentRow})`, 'warning');
                }
            }
        }

        iteration++;
        updateStats();
    }, 800);
}

function startAnimation() {
    startBtn.disabled = true;
    generateBtn.disabled = true;
    document.querySelectorAll('.selectable').forEach(cell => {
        cell.classList.remove('selectable');
        cell.removeEventListener('click', handleCellClick);
    });
    showMessage('Comenzando VNS...');
    intervalId = setInterval(vnsStep, 1600);
}

function resetAnimation() {
    clearInterval(intervalId);
    intervalId = null;
    currentRow = -1;
    currentCol = -1;
    bestRow = -1;
    bestCol = -1;
    bestValue = Infinity;
    iteration = 0;
    currentNeighborhood = 1;
    updateStats();
    createGrid();
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = false;
    showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
}

function downloadGridData() {
    const dataString = gridData.map(row => row.join(', ')).join('\n');
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid_data_vns.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data_vns.txt', 'success');
}

startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);
generateBtn.addEventListener('click', () => {
    gridData = generateGridData().reverse();
    resetAnimation();
});
downloadBtn.addEventListener('click', downloadGridData);

gridData = generateGridData().reverse();
createGrid();
updateStats();
showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
