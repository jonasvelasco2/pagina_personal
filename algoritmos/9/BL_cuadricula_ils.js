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
const perturbationCountDisplay = document.getElementById('perturbation-count');
const phaseIndicator = document.getElementById('phase-indicator');
const iterationsInput = document.getElementById('iterations-input');
const iterationsDisplay = document.getElementById('iterations-display');
const perturbationInput = document.getElementById('perturbation-input');
const perturbationDisplay = document.getElementById('perturbation-display');

let gridData = [];
let currentRow = -1;
let currentCol = -1;
let bestRow = -1;
let bestCol = -1;
let bestValue = Infinity;
let currentLocalOptimum = Infinity;
let iteration = 0;
let maxIterations = 15;
let perturbationStrength = 2;
let perturbationCount = 0;
let phase = 'idle';
let isRunning = false;

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
    if (isRunning) return;
    
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('current', 'visited', 'best');
    });
    
    currentRow = parseInt(event.target.dataset.row);
    currentCol = parseInt(event.target.dataset.col);
    bestRow = currentRow;
    bestCol = currentCol;
    bestValue = gridData[currentRow][currentCol];
    currentLocalOptimum = bestValue;
    event.target.classList.add('current');
    
    iteration = 0;
    perturbationCount = 0;
    phase = 'ready';
    updateStats();
    
    startBtn.disabled = false;
    resetBtn.disabled = false;
    showMessage(`Punto de inicio seleccionado en (${currentCol + 1}, ${10 - currentRow}). Presione "Comenzar ILS" para iniciar.`, 'info');
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
    phaseValue.textContent = phase === 'local' ? 'Local' : phase === 'perturbation' ? 'Perturb' : phase === 'acceptance' ? 'Accept' : '-';
    currentValueDisplay.textContent = (currentRow >= 0 && currentCol >= 0) ? gridData[currentRow][currentCol] : '-';
    bestValueDisplay.textContent = bestValue !== Infinity ? bestValue : '-';
    perturbationCountDisplay.textContent = perturbationCount;
    
    let phaseText = 'Fase actual: ';
    if (phase === 'local') phaseText += 'Búsqueda Local';
    else if (phase === 'perturbation') phaseText += 'Perturbación';
    else if (phase === 'acceptance') phaseText += 'Criterio de Aceptación';
    else phaseText += 'Selección de inicio';
    phaseIndicator.textContent = phaseText;
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

async function localSearch() {
    phase = 'local';
    updateStats();
    
    let improved = true;
    while (improved) {
        improved = false;
        const neighbors = getNeighbors();
        
        neighbors.forEach(n => {
            const cell = document.querySelector(`[data-row='${n.r}'][data-col='${n.c}']`);
            cell.classList.add('neighbor');
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
        
        document.querySelectorAll('.neighbor').forEach(cell => cell.classList.remove('neighbor'));
        
        if (bestNeighbor) {
            const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            currentCell.classList.remove('current');
            currentCell.classList.add('visited');
            
            currentRow = bestNeighbor.r;
            currentCol = bestNeighbor.c;
            
            const newCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCell.classList.add('current');
            
            improved = true;
            updateStats();
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }
    
    currentLocalOptimum = gridData[currentRow][currentCol];
    showMessage(`Óptimo local encontrado: ${currentLocalOptimum} en (${currentCol + 1}, ${10 - currentRow})`, 'info');
}

async function perturbation() {
    phase = 'perturbation';
    updateStats();
    perturbationCount++;
    
    showMessage(`Aplicando perturbación (intensidad: ${perturbationStrength})...`, 'warning');
    
    const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
    currentCell.classList.remove('current');
    currentCell.classList.add('visited');
    
    for (let i = 0; i < perturbationStrength; i++) {
        const neighbors = getNeighbors();
        if (neighbors.length > 0) {
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            currentRow = randomNeighbor.r;
            currentCol = randomNeighbor.c;
            
            const newCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
            newCell.classList.add('perturbation');
            await new Promise(resolve => setTimeout(resolve, 300));
            newCell.classList.remove('perturbation');
        }
    }
    
    const newCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
    newCell.classList.add('current');
    
    updateStats();
    await new Promise(resolve => setTimeout(resolve, 500));
}

async function acceptanceCriterion(newValue) {
    phase = 'acceptance';
    updateStats();
    
    const currentCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`);
    currentCell.classList.add('acceptance');
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    currentCell.classList.remove('acceptance');
    
    if (newValue <= currentLocalOptimum) {
        showMessage(`Solución aceptada: ${newValue} ≤ ${currentLocalOptimum}`, 'success');
        currentLocalOptimum = newValue;
        return true;
    } else {
        showMessage(`Solución rechazada: ${newValue} > ${currentLocalOptimum}. Volviendo a óptimo anterior.`, 'warning');
        return false;
    }
}

async function ilsIteration() {
    if (iteration >= maxIterations) {
        finishILS();
        return;
    }
    
    iteration++;
    
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('visited', 'neighbor', 'perturbation', 'acceptance');
    });
    
    showMessage(`Iteración ${iteration}/${maxIterations}: Iniciando búsqueda local...`, 'info');
    await localSearch();
    
    const localOptValue = gridData[currentRow][currentCol];
    
    if (localOptValue < bestValue) {
        document.querySelectorAll('.best').forEach(cell => cell.classList.remove('best'));
        bestValue = localOptValue;
        bestRow = currentRow;
        bestCol = currentCol;
        const bestCell = document.querySelector(`[data-row='${bestRow}'][data-col='${bestCol}']`);
        bestCell.classList.add('best');
        showMessage(`¡Nueva mejor solución global! Valor: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})`, 'success');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (iteration < maxIterations) {
        const beforePerturbRow = currentRow;
        const beforePerturbCol = currentCol;
        const beforePerturbValue = currentLocalOptimum;
        
        await perturbation();
        await localSearch();
        
        const newValue = gridData[currentRow][currentCol];
        const accepted = await acceptanceCriterion(newValue);
        
        if (!accepted) {
            document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`).classList.remove('current');
            currentRow = beforePerturbRow;
            currentCol = beforePerturbCol;
            document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol}']`).classList.add('current');
            updateStats();
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setTimeout(ilsIteration, 500);
    } else {
        finishILS();
    }
}

function finishILS() {
    isRunning = false;
    phase = 'idle';
    updateStats();
    
    const bestCell = document.querySelector(`[data-row='${bestRow}'][data-col='${bestCol}']`);
    if (bestCell) bestCell.classList.add('best');
    
    showMessage(`ILS completado. Mejor solución: ${bestValue} en (${bestCol + 1}, ${10 - bestRow})`, 'success');
    startBtn.disabled = false;
    resetBtn.disabled = false;
    generateBtn.disabled = false;
    iterationsInput.disabled = false;
    perturbationInput.disabled = false;
}

function startILS() {
    isRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = true;
    iterationsInput.disabled = true;
    perturbationInput.disabled = true;
    
    document.querySelectorAll('.selectable').forEach(cell => {
        cell.classList.remove('selectable');
        cell.removeEventListener('click', handleCellClick);
    });
    
    iteration = 0;
    perturbationCount = 0;
    updateStats();
    ilsIteration();
}

function resetAnimation() {
    isRunning = false;
    iteration = 0;
    currentRow = -1;
    currentCol = -1;
    bestRow = -1;
    bestCol = -1;
    bestValue = Infinity;
    currentLocalOptimum = Infinity;
    perturbationCount = 0;
    phase = 'idle';
    updateStats();
    createGrid();
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = false;
    iterationsInput.disabled = false;
    perturbationInput.disabled = false;
    showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
}

function downloadGridData() {
    const dataString = gridData.map(row => row.join(', ')).join('\n');
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid_data_ils.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data_ils.txt', 'success');
}

startBtn.addEventListener('click', startILS);
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

perturbationInput.addEventListener('input', (e) => {
    perturbationStrength = parseInt(e.target.value);
    perturbationDisplay.textContent = perturbationStrength;
});

gridData = generateGridData().reverse();
createGrid();
updateStats();
showMessage('Seleccione un punto de inicio en la cuadrícula.', 'info');
