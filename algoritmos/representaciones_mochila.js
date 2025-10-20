// Datos del problema
const knapsackCapacity = 50;
let currentRepresentation = 'binary';

// Objetos disponibles (más objetos para hacer el problema más complejo)
const items = [
    { id: 0, name: '💎 Diamante', weight: 10, value: 60, emoji: '💎' },
    { id: 1, name: '📱 Teléfono', weight: 5, value: 40, emoji: '📱' },
    { id: 2, name: '💻 Laptop', weight: 15, value: 100, emoji: '💻' },
    { id: 3, name: '📷 Cámara', weight: 8, value: 50, emoji: '📷' },
    { id: 4, name: '🎧 Audífonos', weight: 3, value: 20, emoji: '🎧' },
    { id: 5, name: '⌚ Reloj', weight: 2, value: 30, emoji: '⌚' },
    { id: 6, name: '📚 Libro', weight: 4, value: 15, emoji: '📚' },
    { id: 7, name: '🎮 Consola', weight: 12, value: 80, emoji: '🎮' },
    { id: 8, name: '🎸 Guitarra', weight: 9, value: 55, emoji: '🎸' },
    { id: 9, name: '🔦 Linterna', weight: 2, value: 10, emoji: '🔦' },
    { id: 10, name: '🎒 Mochila', weight: 6, value: 35, emoji: '🎒' },
    { id: 11, name: '🧳 Maleta', weight: 18, value: 90, emoji: '🧳' },
    { id: 12, name: '🎹 Teclado', weight: 7, value: 45, emoji: '🎹' },
    { id: 13, name: '🖥️ Monitor', weight: 11, value: 70, emoji: '🖥️' },
    { id: 14, name: '🎨 Paleta', weight: 3, value: 25, emoji: '🎨' }
];

// Solución actual (para cada representación)
let solution = {
    binary: Array(items.length).fill(0),
    integer: [], // Array of indices
    continuous: Array.from({length: items.length}, () => Math.random()), // Random keys
    permutation: Array.from({length: items.length}, (_, i) => i) // Permutation of indices
};

// Referencias DOM
const itemsGrid = document.getElementById('items-grid');
const knapsackItems = document.getElementById('knapsack-items');
const solutionCode = document.getElementById('solution-code');
const weightDisplay = document.getElementById('weight-display');
const valueDisplay = document.getElementById('value-display');
const statusDisplay = document.getElementById('status-display');
const capacityFill = document.getElementById('capacity-fill');
const capacityText = document.getElementById('capacity-text');
const capacityPercentage = document.getElementById('capacity-percentage');
const currentRepName = document.getElementById('current-rep-name');
const repDescription = document.getElementById('rep-description');
const advantagesList = document.getElementById('advantages-list');
const disadvantagesList = document.getElementById('disadvantages-list');
const educationalText = document.getElementById('educational-text');
const overweightModal = document.getElementById('overweight-modal');
const modalClose = document.getElementById('modal-close');
const modalOk = document.getElementById('modal-ok');
const modalCurrentWeight = document.getElementById('modal-current-weight');

let lastWeight = 0;

// Información de cada representación
const representationInfo = {
    binary: {
        name: 'Binaria',
        description: 'Cada posición representa si un objeto está incluido (1) o no (0) en la mochila. Es la representación más simple y directa.',
        advantages: [
            'Simple y fácil de entender',
            'Implementación directa',
            'Espacio de búsqueda bien definido (2^n soluciones)',
            'Ideal para mochila 0/1 clásica'
        ],
        disadvantages: [
            'No permite cantidades múltiples',
            'Puede generar soluciones inválidas (sobrepeso)',
            'Requiere reparación de soluciones inválidas'
        ],
        educational: 'La representación binaria es perfecta para el problema de la mochila 0/1, donde cada objeto se toma completamente o no se toma. Cada gen es 0 o 1.',
        pseudocode: `función evaluar_solución(solución, items, capacidad):
    peso_total = 0
    valor_total = 0
    
    para i desde 0 hasta longitud(solución) - 1:
        si solución[i] == 1:
            peso_total += items[i].peso
            valor_total += items[i].valor
    
    si peso_total > capacidad:
        retornar INVÁLIDA  // o penalizar
    
    retornar valor_total`
    },
    integer: {
        name: 'Entera (Índices)',
        description: 'Cada posición contiene el índice de un objeto a incluir. La longitud del vector determina cuántos objetos se incluyen.',
        advantages: [
            'Codifica directamente qué objetos incluir',
            'Longitud variable permite flexibilidad',
            'Fácil de interpretar',
            'Útil para construcción de soluciones'
        ],
        disadvantages: [
            'Puede tener índices duplicados',
            'Puede generar soluciones inválidas',
            'Requiere validación de índices',
            'Longitud fija puede limitar soluciones'
        ],
        educational: 'La representación entera usa índices de objetos. Ejemplo: [2, 0, 4] significa incluir los objetos en las posiciones 2, 0 y 4. Se agregan en ese orden hasta llenar la mochila.',
        pseudocode: `función evaluar_solución(solución, items, capacidad):
    peso_total = 0
    valor_total = 0
    incluidos = conjunto_vacío()
    
    para cada índice en solución:
        si índice válido Y índice no en incluidos:
            si peso_total + items[índice].peso <= capacidad:
                peso_total += items[índice].peso
                valor_total += items[índice].valor
                incluidos.agregar(índice)
    
    retornar valor_total`
    },
    continuous: {
        name: 'Random Keys',
        description: 'Vector de valores continuos aleatorios. El orden de los valores determina la prioridad de los objetos (codificación Random Keys).',
        advantages: [
            'Compatible con operadores continuos',
            'Siempre genera soluciones válidas',
            'No requiere reparación',
            'Fácil de usar con algoritmos evolutivos'
        ],
        disadvantages: [
            'Requiere decodificación (ordenamiento)',
            'Menos intuitiva que otras representaciones',
            'Overhead computacional del ordenamiento',
            'No todos los subconjuntos son alcanzables'
        ],
        educational: 'Random Keys asigna un valor aleatorio a cada objeto. Los objetos se ordenan de mayor a menor según su valor asignado, y se agregan en ese orden hasta llenar la mochila. Ejemplo: si tenemos [0.7, 0.2, 0.9, 0.1, 0.5], el objeto 2 tiene el valor más alto (0.9), luego el objeto 0 (0.7), después el 4 (0.5), el 1 (0.2) y finalmente el 3 (0.1). Por lo tanto, se intentará agregar primero el objeto 2, luego el 0, y así sucesivamente.',
        pseudocode: `función evaluar_solución(random_keys, items, capacidad):
    // Crear pares (índice, valor) y ordenar por valor
    pares = []
    para i desde 0 hasta longitud(random_keys) - 1:
        pares.agregar((i, random_keys[i]))
    
    ordenar(pares, por valor descendente)
    
    peso_total = 0
    valor_total = 0
    
    // Decodificación greedy según prioridad
    para cada (índice, _) en pares:
        si peso_total + items[índice].peso <= capacidad:
            peso_total += items[índice].peso
            valor_total += items[índice].valor
    
    retornar valor_total  // Siempre válida`
    },
    permutation: {
        name: 'Permutación',
        description: 'Una permutación de los índices de objetos. Se agregan objetos en ese orden hasta llenar la mochila.',
        advantages: [
            'Siempre genera soluciones válidas',
            'No requiere reparación',
            'Útil con operadores de permutación',
            'Codifica prioridad de objetos'
        ],
        disadvantages: [
            'Espacio de búsqueda diferente (n! permutaciones)',
            'No todos los subconjuntos son alcanzables',
            'Requiere decodificación greedy',
            'Menos intuitiva'
        ],
        educational: 'La representación por permutación ordena los objetos por prioridad. Se agregan en ese orden hasta que no quepan más. Ejemplo: [2, 0, 4, 1, 3] significa intentar agregar primero el objeto 2, luego el 0, etc.',
        pseudocode: `función evaluar_solución(permutación, items, capacidad):
    peso_total = 0
    valor_total = 0
    
    // Decodificación greedy
    para i desde 0 hasta longitud(permutación) - 1:
        índice_objeto = permutación[i]
        
        si peso_total + items[índice_objeto].peso <= capacidad:
            peso_total += items[índice_objeto].peso
            valor_total += items[índice_objeto].valor
    
    retornar valor_total  // Siempre válida`
    }
};

// Inicializar
function init() {
    renderItems();
    updateRepresentationButtons();
    updateDisplay();
    attachEventListeners();
}

// Renderizar objetos disponibles
function renderItems() {
    itemsGrid.innerHTML = '';
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.index = index;
        
        let quantityDisplay = '';
        if (currentRepresentation === 'binary') {
            quantityDisplay = solution.binary[index] === 1 ? '✓' : '';
        } else if (currentRepresentation === 'integer') {
            // Show checkmark if this index appears in the solution
            quantityDisplay = solution.integer.includes(index) ? '✓' : '';
        } else if (currentRepresentation === 'continuous') {
            // Show priority value (Random Keys)
            const priority = solution.continuous[index];
            if (priority !== undefined) {
                quantityDisplay = `${priority.toFixed(2)}`;
            }
        } else if (currentRepresentation === 'permutation') {
            // Show position in permutation
            const position = solution.permutation.indexOf(index);
            if (position !== -1) {
                quantityDisplay = `#${position + 1}`;
            }
        }
        
        card.innerHTML = `
            <div class="text-3xl mb-2">${item.emoji}</div>
            <div class="font-bold text-sm">${item.name}</div>
            <div class="text-xs opacity-90 mt-1">Peso: ${item.weight}kg</div>
            <div class="text-xs opacity-90">Valor: $${item.value}</div>
            ${quantityDisplay ? `<div class="text-lg font-bold mt-2">${quantityDisplay}</div>` : ''}
        `;
        
        if (isItemSelected(index)) {
            card.classList.add('selected');
        }
        
        if (currentRepresentation === 'continuous' && solution.continuous[index] > 0 && solution.continuous[index] < 1) {
            card.classList.add('partial');
        }
        
        card.addEventListener('click', () => toggleItem(index));
        itemsGrid.appendChild(card);
    });
}

// Verificar si un objeto está seleccionado
function isItemSelected(index) {
    if (currentRepresentation === 'binary') {
        return solution.binary[index] === 1;
    } else if (currentRepresentation === 'integer') {
        return solution.integer.includes(index);
    } else if (currentRepresentation === 'continuous') {
        // In random keys, all items have a priority value
        return solution.continuous[index] > 0.5; // Highlight high priority items
    } else if (currentRepresentation === 'permutation') {
        // All items are in the permutation
        return true;
    }
    return false;
}

// Toggle item selection
function toggleItem(index) {
    if (currentRepresentation === 'binary') {
        solution.binary[index] = solution.binary[index] === 1 ? 0 : 1;
    } else if (currentRepresentation === 'integer') {
        // Toggle: add or remove index from the list
        const idx = solution.integer.indexOf(index);
        if (idx > -1) {
            solution.integer.splice(idx, 1); // Remove
        } else {
            solution.integer.push(index); // Add
        }
    } else if (currentRepresentation === 'continuous') {
        // Cycle through priority values (Random Keys)
        const values = [0.1, 0.3, 0.5, 0.7, 0.9];
        const currentValue = solution.continuous[index] || 0.5;
        const currentIndex = values.findIndex(v => Math.abs(v - currentValue) < 0.15);
        solution.continuous[index] = values[(currentIndex + 1) % values.length];
    } else if (currentRepresentation === 'permutation') {
        // For permutation, clicking doesn't make sense in the same way
        // We'll just shuffle when clicking
        return;
    }
    
    updateDisplay();
}

// Evaluar solución según representación
function evaluateSolution() {
    let totalWeight = 0;
    let totalValue = 0;
    
    if (currentRepresentation === 'binary') {
        solution.binary.forEach((included, i) => {
            if (included === 1) {
                totalWeight += items[i].weight;
                totalValue += items[i].value;
            }
        });
    } else if (currentRepresentation === 'integer') {
        // Integer representation: indices of items to include
        const included = new Set();
        solution.integer.forEach(index => {
            const idx = index || 0;
            if (idx >= 0 && idx < items.length && !included.has(idx)) {
                if (totalWeight + items[idx].weight <= knapsackCapacity) {
                    totalWeight += items[idx].weight;
                    totalValue += items[idx].value;
                    included.add(idx);
                }
            }
        });
    } else if (currentRepresentation === 'continuous') {
        // Random Keys: sort by value and add items in that order
        const pairs = solution.continuous.map((value, index) => ({ index, value }));
        pairs.sort((a, b) => b.value - a.value); // Sort descending by value
        
        totalWeight = 0;
        totalValue = 0;
        for (let i = 0; i < pairs.length; i++) {
            const itemIndex = pairs[i].index;
            if (totalWeight + items[itemIndex].weight <= knapsackCapacity) {
                totalWeight += items[itemIndex].weight;
                totalValue += items[itemIndex].value;
            }
        }
    } else if (currentRepresentation === 'permutation') {
        // Greedy decoding: add items in order until capacity is reached
        totalWeight = 0;
        totalValue = 0;
        for (let i = 0; i < solution.permutation.length; i++) {
            const itemIndex = solution.permutation[i];
            if (totalWeight + items[itemIndex].weight <= knapsackCapacity) {
                totalWeight += items[itemIndex].weight;
                totalValue += items[itemIndex].value;
            }
        }
    }
    
    return { totalWeight, totalValue };
}

// Actualizar visualización
function updateDisplay() {
    const { totalWeight, totalValue } = evaluateSolution();
    
    // Update stats
    weightDisplay.textContent = `${totalWeight.toFixed(1)} kg`;
    valueDisplay.textContent = `$${totalValue}`;
    
    // Update capacity bar
    const percentage = Math.min((totalWeight / knapsackCapacity) * 100, 100);
    capacityFill.style.width = `${percentage}%`;
    capacityPercentage.textContent = `${percentage.toFixed(0)}%`;
    capacityText.textContent = `${totalWeight.toFixed(1)} / ${knapsackCapacity} kg`;
    
    // Update status and check for overweight
    if (totalWeight > knapsackCapacity) {
        statusDisplay.innerHTML = '<span class="badge badge-error">Sobrepeso</span>';
        capacityFill.classList.add('overload');
        
        // Show modal if weight just exceeded capacity
        if (lastWeight <= knapsackCapacity) {
            showOverweightModal(totalWeight);
        }
    } else if (totalWeight === 0) {
        statusDisplay.innerHTML = '<span class="badge badge-info">Vacía</span>';
        capacityFill.classList.remove('overload');
    } else {
        statusDisplay.innerHTML = '<span class="badge badge-success">Válida</span>';
        capacityFill.classList.remove('overload');
    }
    
    lastWeight = totalWeight;
    
    // Update solution code
    updateSolutionCode();
    
    // Update knapsack visual
    updateKnapsackVisual();
    
    // Update items grid
    renderItems();
}

// Show overweight modal
function showOverweightModal(weight) {
    modalCurrentWeight.textContent = `${weight.toFixed(1)} kg`;
    overweightModal.classList.add('show');
}

// Close modal
function closeModal() {
    overweightModal.classList.remove('show');
}

// Actualizar código de solución
function updateSolutionCode() {
    let code = '';
    if (currentRepresentation === 'binary') {
        code = `[${solution.binary.map(v => v || 0).join(', ')}]`;
    } else if (currentRepresentation === 'integer') {
        code = `[${solution.integer.map(v => v || 0).join(', ')}]`;
    } else if (currentRepresentation === 'continuous') {
        code = `[${solution.continuous.map(v => (v || 0).toFixed(2)).join(', ')}]`;
    } else if (currentRepresentation === 'permutation') {
        code = `[${solution.permutation.join(', ')}]`;
    }
    solutionCode.textContent = code;
}

// Actualizar visualización de mochila
function updateKnapsackVisual() {
    knapsackItems.innerHTML = '';
    
    if (currentRepresentation === 'integer') {
        // Integer: show items based on indices in the list
        let currentWeight = 0;
        const included = new Set();
        solution.integer.forEach(idx => {
            if (idx >= 0 && idx < items.length && !included.has(idx)) {
                if (currentWeight + items[idx].weight <= knapsackCapacity) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'text-4xl';
                    itemDiv.textContent = items[idx].emoji;
                    itemDiv.title = items[idx].name;
                    knapsackItems.appendChild(itemDiv);
                    currentWeight += items[idx].weight;
                    included.add(idx);
                }
            }
        });
    } else if (currentRepresentation === 'continuous') {
        // Random Keys: sort by value and show items in that order
        const pairs = solution.continuous.map((value, index) => ({ index, value }));
        pairs.sort((a, b) => b.value - a.value);
        
        let currentWeight = 0;
        pairs.forEach(pair => {
            const itemIndex = pair.index;
            if (currentWeight + items[itemIndex].weight <= knapsackCapacity) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'text-4xl';
                itemDiv.textContent = items[itemIndex].emoji;
                itemDiv.title = items[itemIndex].name;
                knapsackItems.appendChild(itemDiv);
                currentWeight += items[itemIndex].weight;
            }
        });
    } else if (currentRepresentation === 'permutation') {
        // Show items in order until capacity is reached
        let currentWeight = 0;
        solution.permutation.forEach(itemIndex => {
            if (currentWeight + items[itemIndex].weight <= knapsackCapacity) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'text-4xl';
                itemDiv.textContent = items[itemIndex].emoji;
                itemDiv.title = items[itemIndex].name;
                knapsackItems.appendChild(itemDiv);
                currentWeight += items[itemIndex].weight;
            }
        });
    } else if (currentRepresentation === 'binary') {
        // Binary: show selected items
        items.forEach((item, index) => {
            if (solution.binary[index] === 1) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'text-4xl';
                itemDiv.textContent = item.emoji;
                itemDiv.title = item.name;
                knapsackItems.appendChild(itemDiv);
            }
        });
    }
    
    if (knapsackItems.children.length === 0) {
        knapsackItems.innerHTML = '<div class="text-white opacity-50 text-center w-full">Mochila vacía</div>';
    }
}

// Cambiar representación
function changeRepresentation(rep) {
    currentRepresentation = rep;
    updateRepresentationButtons();
    updateRepresentationInfo();
    updateDisplay();
}

// Actualizar botones de representación
function updateRepresentationButtons() {
    document.querySelectorAll('.rep-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.rep === currentRepresentation) {
            btn.classList.add('active');
        }
    });
}

// Actualizar información de representación
function updateRepresentationInfo() {
    const info = representationInfo[currentRepresentation];
    currentRepName.textContent = info.name;
    repDescription.textContent = info.description;
    educationalText.textContent = info.educational;
    
    advantagesList.innerHTML = info.advantages.map(adv => `<li>${adv}</li>`).join('');
    disadvantagesList.innerHTML = info.disadvantages.map(dis => `<li>${dis}</li>`).join('');
    
    // Update pseudocode
    const pseudocodeDisplay = document.getElementById('pseudocode-display');
    if (pseudocodeDisplay) {
        pseudocodeDisplay.innerHTML = `<pre style="margin: 0;">${info.pseudocode}</pre>`;
    }
}

// Generar solución aleatoria
function generateRandomSolution() {
    if (currentRepresentation === 'binary') {
        solution.binary = items.map(() => Math.random() > 0.5 ? 1 : 0);
    } else if (currentRepresentation === 'integer') {
        // Generate random list of indices
        const numItems = Math.floor(Math.random() * items.length);
        solution.integer = [];
        for (let i = 0; i < numItems; i++) {
            solution.integer.push(Math.floor(Math.random() * items.length));
        }
    } else if (currentRepresentation === 'continuous') {
        // Generate random keys (random values for each item)
        solution.continuous = items.map(() => Math.random());
    } else if (currentRepresentation === 'permutation') {
        // Fisher-Yates shuffle
        solution.permutation = Array.from({length: items.length}, (_, i) => i);
        for (let i = solution.permutation.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [solution.permutation[i], solution.permutation[j]] = [solution.permutation[j], solution.permutation[i]];
        }
    }
    updateDisplay();
}

// Generar solución greedy (mejor relación valor/peso)
function generateGreedySolution() {
    // Calculate value/weight ratio
    const ratios = items.map((item, index) => ({
        index,
        ratio: item.value / item.weight
    }));
    
    // Sort by ratio (descending)
    ratios.sort((a, b) => b.ratio - a.ratio);
    
    if (currentRepresentation === 'binary') {
        solution.binary = Array(items.length).fill(0);
        let currentWeight = 0;
        for (let i = 0; i < ratios.length; i++) {
            const itemIndex = ratios[i].index;
            if (currentWeight + items[itemIndex].weight <= knapsackCapacity) {
                solution.binary[itemIndex] = 1;
                currentWeight += items[itemIndex].weight;
            }
        }
    } else if (currentRepresentation === 'integer') {
        // Build list of indices in greedy order
        solution.integer = [];
        let currentWeight = 0;
        for (let i = 0; i < ratios.length; i++) {
            const itemIndex = ratios[i].index;
            if (currentWeight + items[itemIndex].weight <= knapsackCapacity) {
                solution.integer.push(itemIndex);
                currentWeight += items[itemIndex].weight;
            }
        }
    } else if (currentRepresentation === 'continuous') {
        // Assign high priority to best items (Random Keys)
        solution.continuous = Array(items.length).fill(0);
        ratios.forEach((r, i) => {
            solution.continuous[r.index] = 1.0 - (i / items.length);
        });
    } else if (currentRepresentation === 'permutation') {
        solution.permutation = ratios.map(r => r.index);
    }
    
    updateDisplay();
}

// Limpiar solución
function clearSolution() {
    solution.binary = Array(items.length).fill(0);
    solution.integer = [];
    solution.continuous = Array.from({length: items.length}, () => Math.random());
    solution.permutation = Array.from({length: items.length}, (_, i) => i);
    updateDisplay();
}

// Attach event listeners
function attachEventListeners() {
    document.querySelectorAll('.rep-btn').forEach(btn => {
        btn.addEventListener('click', () => changeRepresentation(btn.dataset.rep));
    });
    
    document.getElementById('random-btn').addEventListener('click', generateRandomSolution);
    document.getElementById('greedy-btn').addEventListener('click', generateGreedySolution);
    document.getElementById('clear-btn').addEventListener('click', clearSolution);
    
    // Modal event listeners
    modalClose.addEventListener('click', closeModal);
    modalOk.addEventListener('click', closeModal);
    overweightModal.addEventListener('click', (e) => {
        if (e.target === overweightModal) {
            closeModal();
        }
    });
}

// Initialize on load
init();
