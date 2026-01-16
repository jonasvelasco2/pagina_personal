// Confusion Matrix Interactive
// Visualiza y calcula métricas de clasificación

// Escenarios predefinidos
const SCENARIOS = {
    balanced: {
        name: 'Balanceado',
        tp: 50, fn: 10, fp: 5, tn: 35,
        description: 'Un modelo con buen balance entre precisión y recall.'
    },
    medical: {
        name: 'Diagnóstico médico',
        tp: 95, fn: 5, fp: 30, tn: 70,
        description: 'En diagnóstico médico, es crítico minimizar falsos negativos (FN). Preferimos alertar de más que perder un caso positivo.'
    },
    spam: {
        name: 'Detección de spam',
        tp: 80, fn: 20, fp: 2, tn: 98,
        description: 'En filtros de spam, queremos minimizar falsos positivos (FP) para no perder correos importantes.'
    },
    fraud: {
        name: 'Detección de fraude',
        tp: 45, fn: 5, fp: 50, tn: 900,
        description: 'En detección de fraude, las clases están muy desbalanceadas. El accuracy puede ser engañoso.'
    },
    'high-precision': {
        name: 'Alta precisión',
        tp: 40, fn: 30, fp: 2, tn: 128,
        description: 'Modelo conservador: solo clasifica como positivo cuando está muy seguro. Alta precisión, bajo recall.'
    },
    'high-recall': {
        name: 'Alto recall',
        tp: 68, fn: 2, fp: 40, tn: 90,
        description: 'Modelo agresivo: clasifica muchos casos como positivos. Alto recall, baja precisión.'
    }
};

// Descripciones de métricas
const METRIC_INFO = {
    accuracy: {
        name: 'Accuracy (Exactitud)',
        description: 'Proporción de predicciones correctas sobre el total. Puede ser engañosa con clases desbalanceadas.',
        formula: '(TP + TN) / (TP + TN + FP + FN)'
    },
    precision: {
        name: 'Precision (Precisión)',
        description: 'De todos los que predijimos como positivos, ¿cuántos realmente lo son? Alta precisión = pocos falsos positivos.',
        formula: 'TP / (TP + FP)'
    },
    recall: {
        name: 'Recall (Sensibilidad)',
        description: 'De todos los positivos reales, ¿cuántos detectamos? Alto recall = pocos falsos negativos.',
        formula: 'TP / (TP + FN)'
    },
    specificity: {
        name: 'Specificity (Especificidad)',
        description: 'De todos los negativos reales, ¿cuántos identificamos correctamente? Es el "recall" de la clase negativa.',
        formula: 'TN / (TN + FP)'
    },
    f1: {
        name: 'F1-Score',
        description: 'Media armónica entre precisión y recall. Útil cuando buscas un balance entre ambas métricas.',
        formula: '2 × (Precision × Recall) / (Precision + Recall)'
    },
    balanced: {
        name: 'Balanced accuracy',
        description: 'Promedio de sensibilidad y especificidad. Más adecuada que accuracy para clases desbalanceadas.',
        formula: '(Sensitivity + Specificity) / 2'
    },
    ppv: {
        name: 'PPV (Positive Predictive Value)',
        description: 'Es equivalente a Precision. Probabilidad de que un resultado positivo sea verdaderamente positivo.',
        formula: 'TP / (TP + FP)'
    },
    npv: {
        name: 'NPV (Negative Predictive Value)',
        description: 'Probabilidad de que un resultado negativo sea verdaderamente negativo.',
        formula: 'TN / (TN + FN)'
    }
};

// Elementos del DOM
const inputTP = document.getElementById('input-tp');
const inputFN = document.getElementById('input-fn');
const inputFP = document.getElementById('input-fp');
const inputTN = document.getElementById('input-tn');

const cellTP = document.getElementById('cell-tp');
const cellFN = document.getElementById('cell-fn');
const cellFP = document.getElementById('cell-fp');
const cellTN = document.getElementById('cell-tn');

const totalSamples = document.getElementById('total-samples');
const totalPositives = document.getElementById('total-positives');
const totalNegatives = document.getElementById('total-negatives');

const showFormulasToggle = document.getElementById('show-formulas');
const metricCards = document.querySelectorAll('.metric-card');
const scenarioBtns = document.querySelectorAll('.scenario-btn');

const infoBox = document.getElementById('info-box');
const infoTitle = document.getElementById('info-title');
const infoDescription = document.getElementById('info-description');
const cellsUsed = document.getElementById('cells-used');

// Obtener valores de la matriz
function getValues() {
    return {
        tp: parseInt(inputTP.value) || 0,
        fn: parseInt(inputFN.value) || 0,
        fp: parseInt(inputFP.value) || 0,
        tn: parseInt(inputTN.value) || 0
    };
}

// Calcular métricas
function calculateMetrics(values) {
    const { tp, fn, fp, tn } = values;
    const total = tp + fn + fp + tn;
    const actualPositives = tp + fn;
    const actualNegatives = fp + tn;
    const predictedPositives = tp + fp;
    const predictedNegatives = fn + tn;
    
    const accuracy = total > 0 ? (tp + tn) / total : 0;
    const precision = predictedPositives > 0 ? tp / predictedPositives : 0;
    const recall = actualPositives > 0 ? tp / actualPositives : 0;
    const specificity = actualNegatives > 0 ? tn / actualNegatives : 0;
    const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const balanced = (recall + specificity) / 2;
    const ppv = precision;
    const npv = predictedNegatives > 0 ? tn / predictedNegatives : 0;
    
    return {
        accuracy,
        precision,
        recall,
        specificity,
        f1,
        balanced,
        ppv,
        npv,
        total,
        actualPositives,
        actualNegatives
    };
}

// Actualizar visualización
function updateDisplay() {
    const values = getValues();
    const metrics = calculateMetrics(values);
    
    // Actualizar totales
    totalSamples.textContent = metrics.total;
    totalPositives.textContent = metrics.actualPositives;
    totalNegatives.textContent = metrics.actualNegatives;
    
    // Actualizar métricas
    document.getElementById('metric-accuracy').textContent = metrics.accuracy.toFixed(2);
    document.getElementById('metric-precision').textContent = metrics.precision.toFixed(2);
    document.getElementById('metric-recall').textContent = metrics.recall.toFixed(2);
    document.getElementById('metric-specificity').textContent = metrics.specificity.toFixed(2);
    document.getElementById('metric-f1').textContent = metrics.f1.toFixed(2);
    document.getElementById('metric-balanced').textContent = metrics.balanced.toFixed(2);
    document.getElementById('metric-ppv').textContent = metrics.ppv.toFixed(2);
    document.getElementById('metric-npv').textContent = metrics.npv.toFixed(2);
    
    // Colorear métricas según valor
    metricCards.forEach(card => {
        const valueEl = card.querySelector('.metric-value');
        const value = parseFloat(valueEl.textContent);
        
        if (value >= 0.8) {
            valueEl.style.color = '#1d8102';
        } else if (value >= 0.6) {
            valueEl.style.color = '#ff9900';
        } else {
            valueEl.style.color = '#d13212';
        }
    });
}

// Resaltar celdas usadas por una métrica
function highlightCells(cells) {
    // Quitar resaltado previo
    [cellTP, cellFN, cellFP, cellTN].forEach(cell => {
        cell.classList.remove('highlight');
    });
    
    // Añadir resaltado
    if (cells.includes('tp')) cellTP.classList.add('highlight');
    if (cells.includes('fn')) cellFN.classList.add('highlight');
    if (cells.includes('fp')) cellFP.classList.add('highlight');
    if (cells.includes('tn')) cellTN.classList.add('highlight');
}

// Mostrar información de una métrica
function showMetricInfo(metricKey, cells) {
    const info = METRIC_INFO[metricKey];
    if (!info) return;
    
    infoTitle.textContent = info.name;
    infoDescription.innerHTML = `
        ${info.description}<br><br>
        <strong>Fórmula:</strong> <code style="background: #eee; padding: 0.2rem 0.5rem; border-radius: 4px;">${info.formula}</code>
    `;
    
    // Mostrar celdas usadas
    cellsUsed.innerHTML = '';
    const cellLabels = {
        tp: 'TP',
        fn: 'FN',
        fp: 'FP',
        tn: 'TN'
    };
    
    cells.forEach(cell => {
        const tag = document.createElement('span');
        tag.className = `cell-tag ${cell}`;
        tag.textContent = cellLabels[cell];
        cellsUsed.appendChild(tag);
    });
    
    highlightCells(cells);
}

// Cargar escenario
function loadScenario(scenarioKey) {
    const scenario = SCENARIOS[scenarioKey];
    if (!scenario) return;
    
    inputTP.value = scenario.tp;
    inputFN.value = scenario.fn;
    inputFP.value = scenario.fp;
    inputTN.value = scenario.tn;
    
    updateDisplay();
    
    // Actualizar info box con descripción del escenario
    infoTitle.textContent = scenario.name;
    infoDescription.textContent = scenario.description;
    cellsUsed.innerHTML = '';
    
    // Quitar resaltado
    highlightCells([]);
    
    // Actualizar botones
    scenarioBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scenario === scenarioKey);
    });
    
    // Quitar selección de métricas
    metricCards.forEach(card => card.classList.remove('active'));
}

// Toggle fórmulas
function toggleFormulas(show) {
    metricCards.forEach(card => {
        card.classList.toggle('show-formula', show);
    });
}

// Event listeners
[inputTP, inputFN, inputFP, inputTN].forEach(input => {
    input.addEventListener('input', () => {
        updateDisplay();
        // Deseleccionar escenario cuando se edita manualmente
        scenarioBtns.forEach(btn => btn.classList.remove('active'));
    });
    
    // Prevenir valores negativos
    input.addEventListener('change', () => {
        if (parseInt(input.value) < 0) {
            input.value = 0;
        }
        updateDisplay();
    });
});

metricCards.forEach(card => {
    card.addEventListener('click', () => {
        // Quitar selección previa
        metricCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const metricKey = card.dataset.metric;
        const cells = card.dataset.cells.split(',');
        showMetricInfo(metricKey, cells);
    });
});

scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loadScenario(btn.dataset.scenario);
    });
});

showFormulasToggle.addEventListener('change', () => {
    toggleFormulas(showFormulasToggle.checked);
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
});
