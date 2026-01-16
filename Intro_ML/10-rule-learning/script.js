// Rule Learning Playground
// Constructor de reglas para clasificar viviendas SF vs NY

// Colores
const COLORS = {
    sf: '#0073bb',
    ny: '#ff9900',
    sfLight: 'rgba(0, 115, 187, 0.3)',
    nyLight: 'rgba(255, 153, 0, 0.3)',
    correct: '#1d8102',
    incorrect: '#d13212',
    unclassified: '#879596',
    grid: '#e8e8e8'
};

// Estado global
let rules = [];
let ruleIdCounter = 0;
let hoverPoint = null;

// Rangos de datos
const DATA_RANGES = {
    elevation: { min: 0, max: 250 },
    price_per_sqft: { min: 0, max: 5000 }
};

// Canvas config
const PADDING = 60;

// Elementos del DOM
const canvas = document.getElementById('scatterCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const rulesList = document.getElementById('rulesList');
const rulesCount = document.getElementById('rulesCount');
const dataCount = document.getElementById('dataCount');

const addRuleBtn = document.getElementById('addRuleBtn');
const exampleSimpleBtn = document.getElementById('exampleSimpleBtn');
const exampleComplexBtn = document.getElementById('exampleComplexBtn');
const clearRulesBtn = document.getElementById('clearRulesBtn');

const metricCorrect = document.getElementById('metricCorrect');
const metricIncorrect = document.getElementById('metricIncorrect');
const metricUnclassified = document.getElementById('metricUnclassified');
const metricAccuracy = document.getElementById('metricAccuracy');

const cmTP = document.getElementById('cmTP');
const cmFN = document.getElementById('cmFN');
const cmFP = document.getElementById('cmFP');
const cmTN = document.getElementById('cmTN');

const progressCorrect = document.getElementById('progressCorrect');
const progressIncorrect = document.getElementById('progressIncorrect');
const progressUnclassified = document.getElementById('progressUnclassified');

const infoText = document.getElementById('infoText');

// Convertir coordenadas de datos a canvas
function dataToCanvas(elevation, price) {
    const scaleX = (canvas.width - 2 * PADDING) / (DATA_RANGES.elevation.max - DATA_RANGES.elevation.min);
    const scaleY = (canvas.height - 2 * PADDING) / (DATA_RANGES.price_per_sqft.max - DATA_RANGES.price_per_sqft.min);
    
    return {
        x: PADDING + (elevation - DATA_RANGES.elevation.min) * scaleX,
        y: canvas.height - PADDING - (price - DATA_RANGES.price_per_sqft.min) * scaleY
    };
}

// Convertir coordenadas de canvas a datos
function canvasToData(cx, cy) {
    const scaleX = (canvas.width - 2 * PADDING) / (DATA_RANGES.elevation.max - DATA_RANGES.elevation.min);
    const scaleY = (canvas.height - 2 * PADDING) / (DATA_RANGES.price_per_sqft.max - DATA_RANGES.price_per_sqft.min);
    
    return {
        elevation: DATA_RANGES.elevation.min + (cx - PADDING) / scaleX,
        price_per_sqft: DATA_RANGES.price_per_sqft.min + (canvas.height - PADDING - cy) / scaleY
    };
}

// Evaluar una condición
function evaluateCondition(point, condition) {
    const value = point[condition.attribute];
    const threshold = condition.value;
    
    switch (condition.operator) {
        case '>': return value > threshold;
        case '<': return value < threshold;
        case '>=': return value >= threshold;
        case '<=': return value <= threshold;
        case '==': return value === threshold;
        default: return false;
    }
}

// Evaluar una regla completa
function evaluateRule(point, rule) {
    if (!rule.active || rule.conditions.length === 0) return null;
    
    let result = evaluateCondition(point, rule.conditions[0]);
    
    for (let i = 1; i < rule.conditions.length; i++) {
        const cond = rule.conditions[i];
        const condResult = evaluateCondition(point, cond);
        
        if (cond.connector === 'AND') {
            result = result && condResult;
        } else {
            result = result || condResult;
        }
    }
    
    return result ? rule.prediction : null;
}

// Clasificar un punto usando todas las reglas (primera que coincida)
function classifyPoint(point) {
    for (const rule of rules) {
        const prediction = evaluateRule(point, rule);
        if (prediction !== null) {
            return prediction;
        }
    }
    return null;
}

// Calcular métricas
function calculateMetrics() {
    let tp = 0, tn = 0, fp = 0, fn = 0;
    let correct = 0, incorrect = 0, unclassified = 0;
    
    for (const point of HOUSING_DATA) {
        const actual = point.in_sf === 1 ? 'SF' : 'NY';
        const predicted = classifyPoint(point);
        
        if (predicted === null) {
            unclassified++;
        } else if (predicted === actual) {
            correct++;
            if (actual === 'SF') tp++;
            else tn++;
        } else {
            incorrect++;
            if (actual === 'SF') fn++;
            else fp++;
        }
    }
    
    const total = HOUSING_DATA.length;
    const classified = correct + incorrect;
    const accuracy = classified > 0 ? correct / classified : 0;
    
    return {
        tp, tn, fp, fn,
        correct, incorrect, unclassified, total,
        accuracy
    };
}

// Actualizar métricas en UI
function updateMetrics() {
    const m = calculateMetrics();
    
    metricCorrect.textContent = ((m.correct / m.total) * 100).toFixed(1) + '%';
    metricIncorrect.textContent = ((m.incorrect / m.total) * 100).toFixed(1) + '%';
    metricUnclassified.textContent = ((m.unclassified / m.total) * 100).toFixed(1) + '%';
    metricAccuracy.textContent = m.correct + m.incorrect > 0 ? m.accuracy.toFixed(3) : '—';
    
    cmTP.textContent = m.tp;
    cmFN.textContent = m.fn;
    cmFP.textContent = m.fp;
    cmTN.textContent = m.tn;
    
    // Progress bar
    const correctPct = (m.correct / m.total) * 100;
    const incorrectPct = (m.incorrect / m.total) * 100;
    const unclassifiedPct = (m.unclassified / m.total) * 100;
    
    progressCorrect.style.width = correctPct + '%';
    progressCorrect.textContent = correctPct > 8 ? Math.round(correctPct) + '%' : '';
    
    progressIncorrect.style.width = incorrectPct + '%';
    progressIncorrect.textContent = incorrectPct > 8 ? Math.round(incorrectPct) + '%' : '';
    
    progressUnclassified.style.width = unclassifiedPct + '%';
    progressUnclassified.textContent = unclassifiedPct > 8 ? Math.round(unclassifiedPct) + '%' : '';
    
    // Actualizar consejos
    updateTips(m);
}

// Actualizar consejos
function updateTips(m) {
    if (rules.length === 0) {
        infoText.innerHTML = 'Observa el scatter plot: San Francisco tiende a tener elevaciones más altas. ' +
            'Empieza con una regla simple como <code>elevation > 50 → SF</code>.';
    } else if (m.accuracy >= 0.85 && m.unclassified / m.total < 0.1) {
        infoText.innerHTML = '🎉 <strong>¡Excelente!</strong> Has alcanzado >85% de accuracy con buena cobertura. ' +
            '¿Puedes mejorarlo aún más o con menos reglas?';
    } else if (m.unclassified / m.total > 0.5) {
        infoText.innerHTML = 'Tienes muchos puntos sin clasificar. Intenta ampliar tus reglas ' +
            'o añadir nuevas reglas para cubrir más casos.';
    } else if (m.incorrect > m.correct) {
        infoText.innerHTML = 'Tienes más errores que aciertos. Revisa los umbrales de tus reglas ' +
            'observando dónde están los puntos en el gráfico.';
    } else {
        infoText.innerHTML = 'Buen progreso. Accuracy: ' + (m.accuracy * 100).toFixed(1) + '%. ' +
            'Observa los puntos mal clasificados (borde rojo) y ajusta tus reglas.';
    }
}

// Renderizar scatter plot
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar regiones de reglas
    drawRuleRegions();
    
    // Dibujar grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    for (let e = 0; e <= 250; e += 50) {
        const p = dataToCanvas(e, 0);
        ctx.beginPath();
        ctx.moveTo(p.x, PADDING);
        ctx.lineTo(p.x, canvas.height - PADDING);
        ctx.stroke();
    }
    
    for (let price = 0; price <= 5000; price += 1000) {
        const p = dataToCanvas(0, price);
        ctx.beginPath();
        ctx.moveTo(PADDING, p.y);
        ctx.lineTo(canvas.width - PADDING, p.y);
        ctx.stroke();
    }
    
    // Dibujar ejes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(PADDING, canvas.height - PADDING);
    ctx.lineTo(canvas.width - PADDING, canvas.height - PADDING);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING);
    ctx.lineTo(PADDING, canvas.height - PADDING);
    ctx.stroke();
    
    // Etiquetas
    ctx.fillStyle = '#666';
    ctx.font = '12px Source Sans Pro';
    ctx.textAlign = 'center';
    
    for (let e = 0; e <= 250; e += 50) {
        const p = dataToCanvas(e, 0);
        ctx.fillText(e.toString(), p.x, canvas.height - PADDING + 20);
    }
    
    ctx.textAlign = 'right';
    for (let price = 0; price <= 5000; price += 1000) {
        const p = dataToCanvas(0, price);
        ctx.fillText(price.toString(), PADDING - 10, p.y + 4);
    }
    
    // Etiquetas de ejes
    ctx.font = 'bold 13px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('Elevation', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Price per sqft', 0, 0);
    ctx.restore();
    
    // Dibujar puntos
    for (let i = 0; i < HOUSING_DATA.length; i++) {
        const point = HOUSING_DATA[i];
        const pos = dataToCanvas(point.elevation, point.price_per_sqft);
        
        const actual = point.in_sf === 1 ? 'SF' : 'NY';
        const predicted = classifyPoint(point);
        
        // Color base
        const baseColor = point.in_sf === 1 ? COLORS.sf : COLORS.ny;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        // Borde según clasificación
        if (predicted !== null) {
            if (predicted === actual) {
                ctx.strokeStyle = COLORS.correct;
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = COLORS.incorrect;
                ctx.lineWidth = 2.5;
            }
            ctx.stroke();
        }
        
        // Hover
        if (hoverPoint === i) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Dibujar regiones de reglas
function drawRuleRegions() {
    for (const rule of rules) {
        if (!rule.active) continue;
        
        const color = rule.prediction === 'SF' ? COLORS.sfLight : COLORS.nyLight;
        
        // Calcular región
        let xMin = PADDING;
        let xMax = canvas.width - PADDING;
        let yMin = PADDING;
        let yMax = canvas.height - PADDING;
        
        for (const cond of rule.conditions) {
            const threshold = cond.value;
            
            if (cond.attribute === 'elevation') {
                const px = dataToCanvas(threshold, 0).x;
                if (cond.operator === '>' || cond.operator === '>=') {
                    xMin = Math.max(xMin, px);
                } else if (cond.operator === '<' || cond.operator === '<=') {
                    xMax = Math.min(xMax, px);
                }
            } else if (cond.attribute === 'price_per_sqft') {
                const py = dataToCanvas(0, threshold).y;
                if (cond.operator === '>' || cond.operator === '>=') {
                    yMax = Math.min(yMax, py);
                } else if (cond.operator === '<' || cond.operator === '<=') {
                    yMin = Math.max(yMin, py);
                }
            }
        }
        
        if (xMin < xMax && yMin < yMax) {
            ctx.fillStyle = color;
            ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);
            
            // Borde
            ctx.strokeStyle = rule.prediction === 'SF' ? COLORS.sf : COLORS.ny;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
            ctx.setLineDash([]);
        }
    }
}

// Crear nueva regla
function createRule(prediction = 'SF', conditions = null) {
    const rule = {
        id: ++ruleIdCounter,
        active: true,
        prediction: prediction,
        conditions: conditions || [
            { attribute: 'elevation', operator: '>', value: 50 }
        ]
    };
    
    rules.push(rule);
    renderRules();
    updateMetrics();
    render();
}

// Renderizar lista de reglas
function renderRules() {
    if (rules.length === 0) {
        rulesList.innerHTML = `
            <div class="empty-rules">
                <p>No hay reglas definidas</p>
                <p style="font-size: 0.85rem;">Añade reglas para clasificar los datos</p>
            </div>
        `;
        rulesCount.textContent = '0 reglas';
        return;
    }
    
    rulesCount.textContent = rules.length + ' regla' + (rules.length !== 1 ? 's' : '');
    
    rulesList.innerHTML = rules.map((rule, idx) => `
        <div class="rule-item ${rule.prediction.toLowerCase()}" data-id="${rule.id}">
            <div class="rule-header">
                <span class="rule-number">Regla ${idx + 1}</span>
                <div class="rule-actions">
                    <button class="rule-btn toggle" title="${rule.active ? 'Desactivar' : 'Activar'}">
                        ${rule.active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="rule-btn add-condition" title="Añadir condición">➕</button>
                    <button class="rule-btn delete" title="Eliminar">🗑️</button>
                </div>
            </div>
            
            ${rule.conditions.map((cond, condIdx) => `
                <div class="rule-condition" data-cond-idx="${condIdx}">
                    ${condIdx > 0 ? `
                        <select class="connector" ${!rule.active ? 'disabled' : ''}>
                            <option value="AND" ${cond.connector === 'AND' ? 'selected' : ''}>Y</option>
                            <option value="OR" ${cond.connector === 'OR' ? 'selected' : ''}>O</option>
                        </select>
                    ` : '<span class="rule-keyword">Si</span>'}
                    
                    <select class="attribute" ${!rule.active ? 'disabled' : ''}>
                        <option value="elevation" ${cond.attribute === 'elevation' ? 'selected' : ''}>elevation</option>
                        <option value="price_per_sqft" ${cond.attribute === 'price_per_sqft' ? 'selected' : ''}>price_per_sqft</option>
                    </select>
                    
                    <select class="operator" ${!rule.active ? 'disabled' : ''}>
                        <option value=">" ${cond.operator === '>' ? 'selected' : ''}>&gt;</option>
                        <option value="<" ${cond.operator === '<' ? 'selected' : ''}>&lt;</option>
                        <option value=">=" ${cond.operator === '>=' ? 'selected' : ''}>≥</option>
                        <option value="<=" ${cond.operator === '<=' ? 'selected' : ''}>≤</option>
                    </select>
                    
                    <input type="number" class="value" value="${cond.value}" 
                        min="0" max="${cond.attribute === 'elevation' ? 250 : 5000}"
                        ${!rule.active ? 'disabled' : ''}>
                    
                    ${condIdx > 0 ? `<button class="rule-btn remove-cond" title="Quitar condición">✕</button>` : ''}
                </div>
            `).join('')}
            
            <div class="rule-prediction">
                <span class="rule-keyword">Entonces</span>
                <select class="prediction" ${!rule.active ? 'disabled' : ''}>
                    <option value="SF" ${rule.prediction === 'SF' ? 'selected' : ''}>San Francisco</option>
                    <option value="NY" ${rule.prediction === 'NY' ? 'selected' : ''}>Nueva York</option>
                </select>
                <span class="prediction-badge ${rule.prediction.toLowerCase()}">${rule.prediction}</span>
            </div>
        </div>
    `).join('');
    
    // Añadir event listeners
    attachRuleListeners();
}

// Añadir listeners a reglas
function attachRuleListeners() {
    rulesList.querySelectorAll('.rule-item').forEach(item => {
        const ruleId = parseInt(item.dataset.id);
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return;
        
        // Toggle
        item.querySelector('.toggle').addEventListener('click', () => {
            rule.active = !rule.active;
            renderRules();
            updateMetrics();
            render();
        });
        
        // Delete
        item.querySelector('.delete').addEventListener('click', () => {
            rules = rules.filter(r => r.id !== ruleId);
            renderRules();
            updateMetrics();
            render();
        });
        
        // Add condition
        item.querySelector('.add-condition').addEventListener('click', () => {
            rule.conditions.push({
                attribute: 'price_per_sqft',
                operator: '<',
                value: 1000,
                connector: 'AND'
            });
            renderRules();
            updateMetrics();
            render();
        });
        
        // Remove condition
        item.querySelectorAll('.remove-cond').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const condIdx = parseInt(e.target.closest('.rule-condition').dataset.condIdx);
                rule.conditions.splice(condIdx, 1);
                renderRules();
                updateMetrics();
                render();
            });
        });
        
        // Condition changes
        item.querySelectorAll('.rule-condition').forEach(condEl => {
            const condIdx = parseInt(condEl.dataset.condIdx);
            const cond = rule.conditions[condIdx];
            
            const attrSelect = condEl.querySelector('.attribute');
            const opSelect = condEl.querySelector('.operator');
            const valueInput = condEl.querySelector('.value');
            const connectorSelect = condEl.querySelector('.connector');
            
            if (attrSelect) {
                attrSelect.addEventListener('change', () => {
                    cond.attribute = attrSelect.value;
                    // Ajustar valor por defecto
                    if (cond.attribute === 'elevation') {
                        valueInput.max = 250;
                        if (cond.value > 250) valueInput.value = cond.value = 50;
                    } else {
                        valueInput.max = 5000;
                    }
                    updateMetrics();
                    render();
                });
            }
            
            if (opSelect) {
                opSelect.addEventListener('change', () => {
                    cond.operator = opSelect.value;
                    updateMetrics();
                    render();
                });
            }
            
            if (valueInput) {
                valueInput.addEventListener('input', () => {
                    cond.value = parseFloat(valueInput.value) || 0;
                    updateMetrics();
                    render();
                });
            }
            
            if (connectorSelect) {
                connectorSelect.addEventListener('change', () => {
                    cond.connector = connectorSelect.value;
                    updateMetrics();
                    render();
                });
            }
        });
        
        // Prediction change
        const predSelect = item.querySelector('.prediction');
        if (predSelect) {
            predSelect.addEventListener('change', () => {
                rule.prediction = predSelect.value;
                renderRules();
                updateMetrics();
                render();
            });
        }
    });
}

// Tooltip
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    hoverPoint = null;
    
    for (let i = 0; i < HOUSING_DATA.length; i++) {
        const point = HOUSING_DATA[i];
        const pos = dataToCanvas(point.elevation, point.price_per_sqft);
        
        const dist = Math.sqrt(Math.pow(cx - pos.x, 2) + Math.pow(cy - pos.y, 2));
        if (dist < 10) {
            hoverPoint = i;
            
            const actual = point.in_sf === 1 ? 'San Francisco' : 'Nueva York';
            const predicted = classifyPoint(point);
            const predText = predicted === null ? 'Sin clasificar' : 
                (predicted === 'SF' ? 'San Francisco' : 'Nueva York');
            const status = predicted === null ? '' : 
                (predicted === (point.in_sf === 1 ? 'SF' : 'NY') ? ' ✅' : ' ❌');
            
            tooltip.innerHTML = `
                <strong>${actual}</strong><br>
                Elevation: ${point.elevation}<br>
                Price/sqft: ${point.price_per_sqft}<br>
                Predicción: ${predText}${status}
            `;
            tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
            tooltip.classList.add('visible');
            break;
        }
    }
    
    if (hoverPoint === null) {
        tooltip.classList.remove('visible');
    }
    
    render();
});

canvas.addEventListener('mouseleave', () => {
    hoverPoint = null;
    tooltip.classList.remove('visible');
    render();
});

// Botones
addRuleBtn.addEventListener('click', () => createRule());

exampleSimpleBtn.addEventListener('click', () => {
    createRule('SF', [{ attribute: 'elevation', operator: '>', value: 50 }]);
});

exampleComplexBtn.addEventListener('click', () => {
    createRule('NY', [
        { attribute: 'elevation', operator: '<', value: 15 },
        { attribute: 'price_per_sqft', operator: '>', value: 1200, connector: 'AND' }
    ]);
});

clearRulesBtn.addEventListener('click', () => {
    rules = [];
    ruleIdCounter = 0;
    renderRules();
    updateMetrics();
    render();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    dataCount.textContent = HOUSING_DATA.length + ' puntos';
    renderRules();
    updateMetrics();
    render();
});
