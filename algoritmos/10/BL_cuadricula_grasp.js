const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const messageBox = document.getElementById('message-box');
const iterationValue = document.getElementById('iteration-value');
const phaseValue = document.getElementById('phase-value');
const currentValueDisplay = document.getElementById('current-value');
const bestValueDisplay = document.getElementById('best-value');
const iterationsInput = document.getElementById('iterations-input');
const iterationsDisplay = document.getElementById('iterations-display');
const alphaInput = document.getElementById('alpha-input');
const alphaDisplay = document.getElementById('alpha-display');

let gridData = [];
let currentRow = -1;
let currentCol = -1;
let bestRow = -1;
let bestCol = -1;
let bestValue = Infinity;
let intervalId = null;
let iteration = 0;
let maxIterations = 10;
let alpha = 0.3;
let phase = 'idle';

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
            cell.className = 'grid-cell';
            cell.textContent = gridData[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            gridContainer.appendChild(cell);
        }
    }
}

function showMessage(text, type = 'info') {
    messageBox.textContent = text;
    messageBox.className = `message-box show ${type === 'success' ? 'message-success' : 'message-info'}`;
}

function getValue(row, col) {
    if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        return gridData[row][col];
    }
    return Infinity;
}

function updateStats() {
    iterationValue.textContent = iteration;
    phaseValue.textContent = phase === 'construction' ? 'Construcción' : phase === 'local' ? 'Búsqueda Local' : '-';
    currentValueDisplay.textContent = (currentRow >= 0 && currentCol >= 0) ? gridData[currentRow][currentCol] : '-';
    bestValueDisplay.textContent = bestValue !== Infinity ? bestValue : '-';
}

function getNeighbors() {
    const neighbors = [
        { r: currentRow - 1, c: currentCol },
        { r: currentRow + 1, c: currentCol },
        { r: currentRow, c: currentCol - 1 },
        { r: currentRow, c: currentCol + 1 },
        { r: currentRow - 1, c: currentCol - 1 },
        { r: currentRow - 1, c: currentCol + 1 },
        { r: currentRow + 1, c: currentCol - 1 },
        { r: currentRow + 1, c: currentCol + 1 }
    ];
    return neighbors.filter(n => n.r >= 0 && n.r < 10 && n.c >= 0 && n.c < 10);
}

function buildRCL() {
    const neighbors = getNeighbors();
    const values = neighbors.map(n => ({ ...n, value: getValue(n.r, n.c) }));
    values.sort((a, b) => a.value - b.value);
    const minValue = values[0].value;
    const maxValue = values[values.length - 1].value;
    const threshold = minValue + alpha * (maxValue - minValue);
    return values.filter(v => v.value <= threshold);
}

async function graspConstruction() {
    currentRow = Math.floor(Math.random() * 10);
    currentCol = Math.floor(Math.random() * 10);
    
    const cell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
    cell.classList.add('construction');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return { row: currentRow, col: currentCol };
}

async function localSearch() {
    let improved = true;
    while (improved) {
        improved = false;
        const neighbors = getNeighbors();
        
        neighbors.forEach(n => {
            const cell = document.querySelector(`[data-row='${n.r}'][data-col='${n.c}']`);
            cell.classList.add('rcl');
        });
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        let bestNeighbor = null;
        let bestNeighborValue = gridData[currentRow][currentCol];
        
        for (const neighbor of neighbors) {
            const value = getValue(neighbor.r, neighbor.c);
            if (value < bestNeighborValue) {
                bestNeighbor = neighbor;
                bestNeighborValue = value;
            }
        }
        
        document.querySelectorAll('.rcl').forEach(cell => cell.classList.remove('rcl'));
        
        if (bestNeighbor) {
            const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            currentCell.classList.remove('construction');
            currentCell.classList.add('visited');
            
            currentRow = bestNeighbor.r;
            currentCol = bestNeighbor.c;
            
            const newCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCell.classList.add('construction');
            
            improved = true;
            updateStats();
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }
}

async function graspIteration() {
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('construction', 'visited', 'rcl');
    });
    
    phase = 'construction';
    updateStats();
    showMessage(`Iteración ${iteration + 1}/${maxIterations}: Fase de construcción`, 'info');
    await graspConstruction();
    
    phase = 'local';
    updateStats();
    showMessage(`Iteración ${iteration + 1}/${maxIterations}: Búsqueda local`, 'info');
    await localSearch();
    
    const currentValue = gridData[currentRow][currentCol];
    if (currentValue < bestValue) {
        document.querySelectorAll('.best').forEach(cell => cell.classList.remove('best'));
        bestValue = currentValue;
        bestRow = currentRow;
        bestCol = currentCol;
        const bestCell = document.querySelector(`[data-row='${bestRow}'][data-col='${bestCol}']`);
        bestCell.classList.add('best');
        showMessage(`¡Nueva mejor solución! Valor: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})`, 'success');
    }
    
    iteration++;
    updateStats();
    
    if (iteration < maxIterations) {
        setTimeout(graspIteration, 1000);
    } else {
        finishGRASP();
    }
}

function finishGRASP() {
    phase = 'idle';
    updateStats();
    showMessage(`GRASP completado. Mejor solución: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})`, 'success');
    startBtn.disabled = false;
    resetBtn.disabled = false;
    generateBtn.disabled = false;
    iterationsInput.disabled = false;
    alphaInput.disabled = false;
}

function startGRASP() {
    iteration = 0;
    bestValue = Infinity;
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = true;
    iterationsInput.disabled = true;
    alphaInput.disabled = true;
    updateStats();
    graspIteration();
}

function resetAnimation() {
    iteration = 0;
    currentRow = -1;
    currentCol = -1;
    bestRow = -1;
    bestCol = -1;
    bestValue = Infinity;
    phase = 'idle';
    updateStats();
    createGrid();
    startBtn.disabled = false;
    resetBtn.disabled = true;
    generateBtn.disabled = false;
    iterationsInput.disabled = false;
    alphaInput.disabled = false;
    showMessage('Presione "Comenzar GRASP" para iniciar.', 'info');
}

function downloadGridData() {
    const dataString = gridData.map(row => row.join(', ')).join('\n');
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid_data_grasp.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data_grasp.txt', 'success');
}

startBtn.addEventListener('click', startGRASP);
resetBtn.addEventListener('click', resetAnimation);
generateBtn.addEventListener('click', () => {
    gridData = generateGridData().reverse();
    resetAnimation();
});
downloadBtn.addEventListener('click', downloadGridData);

iterationsInput.addEventListener('input', (e) => {
    maxIterations = parseInt(e.target.value);
    iterationsDisplay.textContent = maxIterations;
});

alphaInput.addEventListener('input', (e) => {
    alpha = parseInt(e.target.value) / 100;
    alphaDisplay.textContent = alpha.toFixed(2);
});

gridData = generateGridData().reverse();
createGrid();
updateStats();
showMessage('Presione "Comenzar GRASP" para iniciar.', 'info');
