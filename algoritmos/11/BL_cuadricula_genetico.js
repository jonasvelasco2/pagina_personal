const gridContainer = document.getElementById('grid-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const messageBox = document.getElementById('message-box');
const generationValue = document.getElementById('generation-value');
const phaseValue = document.getElementById('phase-value');
const bestFitnessDisplay = document.getElementById('best-fitness');
const avgFitnessDisplay = document.getElementById('avg-fitness');
const diversityDisplay = document.getElementById('diversity-value');
const phaseIndicator = document.getElementById('phase-indicator');
const populationList = document.getElementById('population-list');
const populationInput = document.getElementById('population-input');
const populationDisplayValue = document.getElementById('population-display-value');
const mutationInput = document.getElementById('mutation-input');
const mutationDisplay = document.getElementById('mutation-display');
const generationsInput = document.getElementById('generations-input');
const generationsDisplay = document.getElementById('generations-display');

let gridData = [];
let population = [];
let generation = 0;
let maxGenerations = 10;
let populationSize = 10;
let mutationRate = 0.1;
let bestIndividual = null;
let bestFitness = Infinity;
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
    const typeClass = type === 'success' ? 'message-success' : type === 'warning' ? 'message-warning' : 'message-info';
    messageBox.className = `message-box show ${typeClass}`;
}

function fitness(individual) {
    return gridData[individual.row][individual.col];
}

function initializePopulation() {
    population = [];
    for (let i = 0; i < populationSize; i++) {
        const individual = {
            row: Math.floor(Math.random() * 10),
            col: Math.floor(Math.random() * 10)
        };
        individual.fitness = fitness(individual);
        population.push(individual);
    }
    population.sort((a, b) => a.fitness - b.fitness);
    bestIndividual = {...population[0]};
    bestFitness = bestIndividual.fitness;
}

function updateStats() {
    generationValue.textContent = generation;
    phaseValue.textContent = phase === 'selection' ? 'Selección' : 
                             phase === 'crossover' ? 'Cruce' : 
                             phase === 'mutation' ? 'Mutación' : 
                             phase === 'evaluation' ? 'Evaluación' : '-';
    bestFitnessDisplay.textContent = bestFitness !== Infinity ? bestFitness : '-';
    
    if (population.length > 0) {
        const avgFit = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
        avgFitnessDisplay.textContent = avgFit.toFixed(1);
        
        const uniquePositions = new Set(population.map(ind => `${ind.row},${ind.col}`));
        diversityDisplay.textContent = uniquePositions.size;
    }
    
    let phaseText = 'Fase actual: ';
    if (phase === 'selection') phaseText += 'Selección por Torneo';
    else if (phase === 'crossover') phaseText += 'Cruce (Crossover)';
    else if (phase === 'mutation') phaseText += 'Mutación';
    else if (phase === 'evaluation') phaseText += 'Evaluación de Fitness';
    else phaseText += 'Inicialización';
    phaseIndicator.textContent = phaseText;
    
    populationList.innerHTML = population.map((ind, idx) => 
        `<span class="individual" style="${idx === 0 ? 'border-color: #9f7aea; border-width: 2px;' : ''}">
            (${ind.col + 1},${10 - ind.row}): ${ind.fitness}
        </span>`
    ).join('');
}

function visualizePopulation() {
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('population', 'elite', 'parent', 'offspring', 'mutation', 'best');
    });
    
    population.forEach((ind, idx) => {
        const cell = document.querySelector(`[data-row='${ind.row}'][data-col='${ind.col}']`);
        if (cell) {
            if (idx === 0) {
                cell.classList.add('elite');
            } else {
                cell.classList.add('population');
            }
        }
    });
    
    if (bestIndividual) {
        const bestCell = document.querySelector(`[data-row='${bestIndividual.row}'][data-col='${bestIndividual.col}']`);
        if (bestCell) bestCell.classList.add('best');
    }
}

function tournamentSelection() {
    const tournamentSize = 3;
    let best = null;
    for (let i = 0; i < tournamentSize; i++) {
        const candidate = population[Math.floor(Math.random() * population.length)];
        if (!best || candidate.fitness < best.fitness) {
            best = candidate;
        }
    }
    return {...best};
}

function crossover(parent1, parent2) {
    if (Math.random() < 0.7) {
        const offspring = {
            row: Math.random() < 0.5 ? parent1.row : parent2.row,
            col: Math.random() < 0.5 ? parent1.col : parent2.col
        };
        return offspring;
    }
    return Math.random() < 0.5 ? {...parent1} : {...parent2};
}

function mutate(individual) {
    if (Math.random() < mutationRate) {
        if (Math.random() < 0.5) {
            individual.row = Math.max(0, Math.min(9, individual.row + (Math.random() < 0.5 ? -1 : 1)));
        } else {
            individual.col = Math.max(0, Math.min(9, individual.col + (Math.random() < 0.5 ? -1 : 1)));
        }
        return true;
    }
    return false;
}

async function evolveGeneration() {
    if (generation >= maxGenerations) {
        finishGA();
        return;
    }
    
    generation++;
    
    phase = 'selection';
    updateStats();
    showMessage(`Generación ${generation}/${maxGenerations}: Selección por torneo...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPopulation = [];
    
    const eliteCount = Math.max(1, Math.floor(populationSize * 0.1));
    for (let i = 0; i < eliteCount; i++) {
        newPopulation.push({...population[i]});
    }
    
    phase = 'crossover';
    updateStats();
    showMessage(`Generación ${generation}: Cruce de individuos...`, 'info');
    
    while (newPopulation.length < populationSize) {
        const parent1 = tournamentSelection();
        const parent2 = tournamentSelection();
        
        const cell1 = document.querySelector(`[data-row='${parent1.row}'][data-col='${parent1.col}']`);
        const cell2 = document.querySelector(`[data-row='${parent2.row}'][data-col='${parent2.col}']`);
        if (cell1) cell1.classList.add('parent');
        if (cell2) cell2.classList.add('parent');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const offspring = crossover(parent1, parent2);
        
        const offspringCell = document.querySelector(`[data-row='${offspring.row}'][data-col='${offspring.col}']`);
        if (offspringCell) offspringCell.classList.add('offspring');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (cell1) cell1.classList.remove('parent');
        if (cell2) cell2.classList.remove('parent');
        if (offspringCell) offspringCell.classList.remove('offspring');
        
        newPopulation.push(offspring);
    }
    
    phase = 'mutation';
    updateStats();
    showMessage(`Generación ${generation}: Aplicando mutaciones...`, 'warning');
    
    for (let i = eliteCount; i < newPopulation.length; i++) {
        const mutated = mutate(newPopulation[i]);
        
        if (mutated) {
            const cell = document.querySelector(`[data-row='${newPopulation[i].row}'][data-col='${newPopulation[i].col}']`);
            if (cell) {
                cell.classList.add('mutation');
                await new Promise(resolve => setTimeout(resolve, 200));
                cell.classList.remove('mutation');
            }
        }
    }
    
    phase = 'evaluation';
    updateStats();
    showMessage(`Generación ${generation}: Evaluando fitness...`, 'info');
    
    population = newPopulation;
    population.forEach(ind => {
        ind.fitness = fitness(ind);
    });
    population.sort((a, b) => a.fitness - b.fitness);
    
    if (population[0].fitness < bestFitness) {
        bestFitness = population[0].fitness;
        bestIndividual = {...population[0]};
        showMessage(`¡Nueva mejor solución! Fitness: ${bestFitness} en (${bestIndividual.col + 1}, ${10 - bestIndividual.row})`, 'success');
    }
    
    visualizePopulation();
    updateStats();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTimeout(evolveGeneration, 500);
}

function finishGA() {
    isRunning = false;
    phase = 'idle';
    updateStats();
    visualizePopulation();
    
    showMessage(`Algoritmo Genético completado. Mejor solución: ${bestFitness} en (${bestIndividual.col + 1}, ${10 - bestIndividual.row})`, 'success');
    startBtn.disabled = false;
    resetBtn.disabled = false;
    generateBtn.disabled = false;
    populationInput.disabled = false;
    mutationInput.disabled = false;
    generationsInput.disabled = false;
}

function startGA() {
    isRunning = true;
    startBtn.disabled = true;
    resetBtn.disabled = true;
    generateBtn.disabled = true;
    populationInput.disabled = true;
    mutationInput.disabled = true;
    generationsInput.disabled = true;
    
    generation = 0;
    bestFitness = Infinity;
    
    phase = 'evaluation';
    showMessage('Inicializando población...', 'info');
    initializePopulation();
    visualizePopulation();
    updateStats();
    
    setTimeout(() => {
        showMessage('Población inicial creada. Comenzando evolución...', 'success');
        setTimeout(evolveGeneration, 1000);
    }, 1000);
}

function resetAnimation() {
    isRunning = false;
    generation = 0;
    population = [];
    bestIndividual = null;
    bestFitness = Infinity;
    phase = 'idle';
    updateStats();
    createGrid();
    startBtn.disabled = false;
    resetBtn.disabled = true;
    generateBtn.disabled = false;
    populationInput.disabled = false;
    mutationInput.disabled = false;
    generationsInput.disabled = false;
    showMessage('Presione "Comenzar AG" para iniciar el algoritmo genético.', 'info');
}

function downloadGridData() {
    const dataString = gridData.map(row => row.join(', ')).join('\n');
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid_data_genetico.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Cuadrícula descargada como grid_data_genetico.txt', 'success');
}

startBtn.addEventListener('click', startGA);
resetBtn.addEventListener('click', resetAnimation);
generateBtn.addEventListener('click', () => {
    gridData = generateGridData().reverse();
    resetAnimation();
});
downloadBtn.addEventListener('click', downloadGridData);

populationInput.addEventListener('input', (e) => {
    populationSize = parseInt(e.target.value);
    populationDisplayValue.textContent = populationSize;
});

mutationInput.addEventListener('input', (e) => {
    mutationRate = parseInt(e.target.value) / 100;
    mutationDisplay.textContent = `${e.target.value}%`;
});

generationsInput.addEventListener('input', (e) => {
    maxGenerations = parseInt(e.target.value);
    generationsDisplay.textContent = maxGenerations;
});

gridData = generateGridData().reverse();
createGrid();
updateStats();
showMessage('Presione "Comenzar AG" para iniciar el algoritmo genético.', 'info');
