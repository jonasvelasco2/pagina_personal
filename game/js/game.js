// ============================================
// GAME.JS - Lógica principal del juego
// ============================================

let game;
let currentLevelId;

document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

function initGame() {
    // Obtener el nivel actual desde sessionStorage
    currentLevelId = parseInt(sessionStorage.getItem('currentLevel')) || 1;
    
    // Cargar datos del nivel
    const levelData = LEVELS_DATA[currentLevelId];
    
    if (!levelData) {
        showNotification('Error: Nivel no encontrado', 'danger');
        setTimeout(() => window.location.href = 'levels.html', 2000);
        return;
    }
    
    // Actualizar título del nivel
    document.getElementById('levelTitle').textContent = `Nivel ${levelData.id}: ${levelData.title}`;
    
    // Inicializar el motor del juego
    game = new GameEngine(levelData);
    game.initialize();
    
    // Cargar mejor puntuación si existe
    const levelProgress = PlayerData.getLevelData(currentLevelId);
    if (levelProgress) {
        document.getElementById('bestScore').textContent = levelProgress.score;
    }
}

function resetGame() {
    if (confirm('¿Estás seguro de que quieres reiniciar? Perderás tu progreso actual.')) {
        location.reload();
    }
}

function submitSolution() {
    console.log('=== SUBMIT SOLUTION INICIADO ===');
    
    let result, solution, time, levelData;
    
    try {
        game.stopTimer();
        game.incrementAttempts();
        
        solution = game.getSolution();
        time = game.getTime();
        levelData = LEVELS_DATA[currentLevelId];
        
        console.log('Solution obtenida:', solution);
        console.log('LevelData:', levelData);
        console.log('Level type:', levelData.type);
        
        // Validar y calcular resultados
        result = validateSolution(solution, levelData);
        
        console.log('Resultado de validación completa:', result);
        console.log('Valid:', result.valid);
        console.log('Message:', result.message);
        
        if (!result.valid) {
            console.log('❌ Solución NO válida - mostrando notificación');
            console.log('Mensaje a mostrar:', result.message);
            showNotification(result.message, 'warning');
            game.startTimer(); // Reiniciar timer si la solución no es válida
            return;
        }
        
        console.log('✅ Solución válida, calculando eficiencia...');
        
        // Calcular eficiencia y estrellas
        const efficiency = calculateEfficiency(result.value, result.optimal);
        const stars = calculateStars(efficiency);
        const score = calculateScore(stars, time, game.attempts);
        
        console.log('Efficiency:', efficiency, 'Stars:', stars, 'Score:', score);
        
        // Guardar progreso
        const saveResult = PlayerData.updateLevel(currentLevelId, score, stars, time);
        
        console.log('Progreso guardado:', saveResult);
        console.log('Mostrando modal...');
        
        // Mostrar resultados
        showResultModal(result, efficiency, stars, score, saveResult);
        
        console.log('=== SUBMIT SOLUTION COMPLETADO ===');
        
    } catch (error) {
        console.error('ERROR en submitSolution:', error);
        showNotification('Error al validar la solución: ' + error.message, 'danger');
        if (game) game.startTimer();
    }
}

function validateSolution(solution, levelData) {
    switch(levelData.type) {
        case 'knapsack':
            return validateKnapsack(solution, levelData);
        case 'production':
            return validateProduction(solution, levelData);
        case 'tsp':
            return validateTSP(solution, levelData);
        case 'assignment':
            return validateAssignment(solution, levelData);
        case 'transport':
            return validateTransport(solution, levelData);
        case 'scheduling':
            return validateScheduling(solution, levelData);
        case 'facility':
            return validateFacility(solution, levelData);
        case 'network':
            return validateNetwork(solution, levelData);
        case 'integrated':
            return validateIntegrated(solution, levelData);
        default:
            return { valid: true, value: 0, optimal: 1, message: 'OK' };
    }
}

function validateKnapsack(solution, levelData) {
    if (solution.totalWeight > levelData.capacity) {
        return {
            valid: false,
            message: 'Has excedido la capacidad de la mochila'
        };
    }
    
    if (solution.items.length === 0) {
        return {
            valid: false,
            message: 'Debes seleccionar al menos un objeto'
        };
    }
    
    return {
        valid: true,
        value: solution.totalValue,
        optimal: levelData.optimalSolution.value,
        message: 'Solución válida'
    };
}

function validateProduction(solution, levelData) {
    let usedTime = 0;
    let usedMaterial = 0;
    let profit = 0;
    
    levelData.products.forEach(product => {
        const quantity = solution[product.id] || 0;
        usedTime += quantity * product.time;
        usedMaterial += quantity * product.material;
        profit += quantity * product.profit;
    });
    
    if (usedTime > levelData.resources.time) {
        return {
            valid: false,
            message: 'Has excedido el tiempo disponible'
        };
    }
    
    if (usedMaterial > levelData.resources.material) {
        return {
            valid: false,
            message: 'Has excedido el material disponible'
        };
    }
    
    if (profit === 0) {
        return {
            valid: false,
            message: 'Debes producir al menos una unidad'
        };
    }
    
    return {
        valid: true,
        value: profit,
        optimal: levelData.optimalSolution.profit,
        message: 'Solución válida'
    };
}

function validateTSP(solution, levelData) {
    // Debe visitar todas las ubicaciones
    const allLocations = levelData.locations.map(l => l.id);
    const visitedSet = new Set(solution.route);
    
    if (visitedSet.size !== allLocations.length) {
        return {
            valid: false,
            message: 'Debes visitar todas las ubicaciones'
        };
    }
    
    // Debe empezar y terminar en el restaurante
    if (solution.route[0] !== 0) {
        return {
            valid: false,
            message: 'La ruta debe comenzar en el restaurante'
        };
    }
    
    // Agregar regreso si no está
    let route = [...solution.route];
    if (route[route.length - 1] !== 0) {
        route.push(0);
    }
    
    // Calcular distancia total
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        const from = levelData.locations[route[i]];
        const to = levelData.locations[route[i + 1]];
        distance += Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    }
    
    distance = Math.round(distance * 10) / 10;
    
    return {
        valid: true,
        value: -distance, // Negativo porque queremos minimizar
        optimal: -levelData.optimalSolution.distance,
        message: 'Solución válida',
        distance: distance
    };
}

function validateAssignment(solution, levelData) {
    const assignments = solution.assignments;
    
    // Verificar que todos los empleados estén asignados
    if (Object.keys(assignments).length !== levelData.employees.length) {
        return {
            valid: false,
            message: 'Debes asignar todos los empleados a proyectos'
        };
    }
    
    // Verificar que no haya proyectos duplicados
    const usedProjects = new Set(Object.values(assignments));
    if (usedProjects.size !== Object.values(assignments).length) {
        return {
            valid: false,
            message: 'Cada proyecto debe tener solo un empleado asignado'
        };
    }
    
    return {
        valid: true,
        value: -solution.totalTime, // Negativo porque queremos minimizar
        optimal: -levelData.optimalSolution.totalTime,
        message: 'Solución válida'
    };
}

function validateTransport(solution, levelData) {
    const shipments = solution.shipments;
    
    // Verificar que se satisfaga toda la demanda
    const received = {};
    levelData.stores.forEach(store => {
        received[store.id] = 0;
    });
    
    Object.keys(shipments).forEach(key => {
        const [warehouseId, storeId] = key.split('-');
        received[storeId] = (received[storeId] || 0) + shipments[key];
    });
    
    for (const store of levelData.stores) {
        if (received[store.id] !== store.demand) {
            return {
                valid: false,
                message: `La tienda ${store.name} no tiene su demanda satisfecha`
            };
        }
    }
    
    // Verificar que no se exceda la capacidad de los almacenes
    const shipped = {};
    levelData.warehouses.forEach(warehouse => {
        shipped[warehouse.id] = 0;
    });
    
    Object.keys(shipments).forEach(key => {
        const [warehouseId, storeId] = key.split('-');
        shipped[warehouseId] = (shipped[warehouseId] || 0) + shipments[key];
    });
    
    for (const warehouse of levelData.warehouses) {
        if (shipped[warehouse.id] > warehouse.supply) {
            return {
                valid: false,
                message: `El ${warehouse.name} excede su capacidad`
            };
        }
    }
    
    return {
        valid: true,
        value: -solution.totalCost, // Negativo porque queremos minimizar
        optimal: -levelData.optimalSolution.totalCost,
        message: 'Solución válida'
    };
}

function validateScheduling(solution, levelData) {
    const schedule = solution.schedule || {};
    
    // Debug: mostrar lo que llegó
    console.log('Schedule recibido:', schedule);
    console.log('SlotsUsed:', solution.slotsUsed);
    
    // 1. Verificar que todos los cursos estén asignados
    if (Object.keys(schedule).length !== levelData.courses.length) {
        const missing = levelData.courses.length - Object.keys(schedule).length;
        const unassigned = levelData.courses
            .filter(c => !schedule[c.id])
            .map(c => `${c.emoji} ${c.name}`)
            .join(', ');
        return {
            valid: false,
            message: `📋 REGLA VIOLADA: Cursos sin asignar\n\nDebes asignar TODOS los cursos (faltan ${missing}):\n${unassigned}`
        };
    }
    
    // 2. Verificar duración de cursos vs franjas
    for (const [courseId, slotId] of Object.entries(schedule)) {
        const course = levelData.courses.find(c => c.id === courseId);
        const slot = levelData.timeSlots.find(s => s.id === slotId);
        
        if (slot && slot.duration && course.duration > slot.duration) {
            return {
                valid: false,
                message: `⏱️ REGLA VIOLADA: Duración incompatible\n\n${course.emoji} ${course.name} dura ${course.duration}h pero la franja ${slot.time} solo tiene ${slot.duration}h`
            };
        }
    }

    // 3. Verificar disponibilidad de profesores
    for (const [courseId, slotId] of Object.entries(schedule)) {
        const course = levelData.courses.find(c => c.id === courseId);
        
        if (course.professor && Array.isArray(levelData.professors)) {
            const prof = levelData.professors.find(p => p.id === course.professor);
            const slot = levelData.timeSlots.find(s => s.id === slotId);
            
            if (prof && Array.isArray(prof.unavailableSlots) && prof.unavailableSlots.includes(slotId)) {
                return {
                    valid: false,
                    message: `👨‍🏫 REGLA VIOLADA: Profesor no disponible\n\n${prof.name} (profesor de ${course.emoji} ${course.name}) NO está disponible en la franja ${slot.time}`
                };
            }
        }
    }
    
    // 4. Verificar conflictos entre cursos
    console.log('Verificando conflictos...');
    console.log('Conflicts array:', levelData.conflicts);
    
    for (const [course1, course2] of levelData.conflicts) {
        const slot1 = schedule[course1];
        const slot2 = schedule[course2];
        
        console.log(`Verificando conflicto: ${course1} (slot ${slot1}) vs ${course2} (slot ${slot2})`);
        
        if (slot1 === slot2) {
            const c1 = levelData.courses.find(c => c.id === course1);
            const c2 = levelData.courses.find(c => c.id === course2);
            const slot = levelData.timeSlots.find(s => s.id === slot1);
            const reason = levelData.conflictReasons?.[`${course1}-${course2}`] || 
                          levelData.conflictReasons?.[`${course2}-${course1}`] || 
                          'tienen conflicto';
            
            console.log(`❌ CONFLICTO DETECTADO: ${course1} y ${course2} en franja ${slot1}`);
            
            return {
                valid: false,
                message: `⚠️ REGLA VIOLADA: Conflicto de horario\n\n${c1.emoji} ${c1.name} y ${c2.emoji} ${c2.name} NO pueden estar en la misma franja ${slot.time}\n\nMotivo: ${reason}`
            };
        }
    }
    
    console.log('✅ No se encontraron conflictos');
    
    // 5. Verificar capacidad de aulas y laboratorios por franja
    const bySlot = {};
    for (const [cId, sId] of Object.entries(schedule)) {
        bySlot[sId] = bySlot[sId] || { total: 0, labs: 0, courses: [] };
        bySlot[sId].total += 1;
        const c = levelData.courses.find(cc => cc.id === cId);
        bySlot[sId].courses.push(c);
        if (c?.requiresLab) bySlot[sId].labs += 1;
    }

    for (const sIdStr of Object.keys(bySlot)) {
        const sId = parseInt(sIdStr);
        const slot = levelData.timeSlots.find(s => s.id === sId);
        if (!slot) continue;
        const usage = bySlot[sIdStr];

        // Verificar capacidad de aulas
        if (typeof slot.rooms === 'number' && usage.total > slot.rooms) {
            const courseList = usage.courses.map(c => `${c.emoji} ${c.name}`).join(', ');
            return {
                valid: false,
                message: `🏫 REGLA VIOLADA: Capacidad de aulas excedida\n\nFranja ${slot.time} tiene ${usage.total} cursos pero solo ${slot.rooms} aulas disponibles\n\nCursos asignados: ${courseList}`
            };
        }
        
        // Verificar capacidad de laboratorios
        if (typeof slot.labs === 'number' && usage.labs > slot.labs) {
            const labCourses = usage.courses.filter(c => c.requiresLab).map(c => `${c.emoji} ${c.name}`).join(', ');
            const labInfo = slot.labs === 0 ? 'NO tiene laboratorios' : `solo tiene ${slot.labs} laboratorio(s)`;
            return {
                valid: false,
                message: `🔬 REGLA VIOLADA: Capacidad de laboratorios excedida\n\nFranja ${slot.time} ${labInfo} pero tienes ${usage.labs} curso(s) que requieren laboratorio\n\nCursos con lab: ${labCourses}`
            };
        }
    }
    
    // Contar franjas usadas (queremos minimizar)
    const slotsUsed = new Set(Object.values(schedule)).size;
    
    return {
        valid: true,
        value: -slotsUsed, // Negativo porque queremos minimizar
        optimal: -levelData.optimalSolution.slotsUsed,
        message: '✅ ¡Solución válida! Todas las reglas se cumplen'
    };
}

function validateFacility(solution, levelData) {
    const facilities = solution.facilities || [];
    
    // Verificar que se hayan colocado todos los centros
    if (facilities.length !== levelData.numFacilities) {
        return {
            valid: false,
            message: `Debes colocar exactamente ${levelData.numFacilities} centros de distribución (tienes ${facilities.length})`
        };
    }
    
    // Calcular distancia total
    let totalDistance = 0;
    
    levelData.cities.forEach(city => {
        // Encontrar el centro más cercano
        let minDist = Infinity;
        
        facilities.forEach(facility => {
            const dx = facility.x - city.x;
            const dy = facility.y - city.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
            }
        });
        
        totalDistance += minDist;
    });
    
    totalDistance = Math.round(totalDistance * 10) / 10;
    
    return {
        valid: true,
        value: -totalDistance, // Negativo porque queremos minimizar
        optimal: -levelData.optimalSolution.totalDistance,
        message: 'Solución válida',
        distance: totalDistance
    };
}

function validateNetwork(solution, levelData) {
    const flow = solution.flow || {};
    
    // Verificar que se satisfaga toda la demanda
    const received = {};
    levelData.consumers.forEach(consumer => {
        received[consumer.id] = 0;
    });
    
    Object.keys(flow).forEach(key => {
        const [genId, consumerId] = key.split('-');
        received[consumerId] = (received[consumerId] || 0) + flow[key];
    });
    
    // Verificar cada consumidor
    for (const consumer of levelData.consumers) {
        if (received[consumer.id] < consumer.demand) {
            return {
                valid: false,
                message: `${consumer.name} no tiene su demanda satisfecha (falta ${consumer.demand - received[consumer.id]} MW)`
            };
        }
        if (received[consumer.id] > consumer.demand) {
            return {
                valid: false,
                message: `${consumer.name} recibe más energía de la necesaria (sobran ${received[consumer.id] - consumer.demand} MW)`
            };
        }
    }
    
    // Verificar que no se exceda la capacidad de generadores
    const generated = {};
    levelData.generators.forEach(gen => {
        generated[gen.id] = 0;
    });
    
    Object.keys(flow).forEach(key => {
        const [genId, consumerId] = key.split('-');
        generated[genId] = (generated[genId] || 0) + flow[key];
    });
    
    for (const gen of levelData.generators) {
        if (generated[gen.id] > gen.capacity) {
            return {
                valid: false,
                message: `${gen.name} excede su capacidad (genera ${generated[gen.id]} MW de ${gen.capacity} MW)`
            };
        }
    }
    
    // Calcular costo total
    let totalCost = 0;
    Object.keys(flow).forEach(key => {
        const [genId, consumerId] = key.split('-');
        const generator = levelData.generators.find(g => g.id === genId);
        totalCost += flow[key] * generator.cost;
    });
    
    return {
        valid: true,
        value: -totalCost, // Negativo porque queremos minimizar
        optimal: -levelData.optimalSolution.totalCost,
        message: 'Solución válida'
    };
}

function validateIntegrated(solution, levelData) {
    const production = solution.production || {};
    const shipments = solution.shipments || {};
    
    // Debug
    console.log('Validando Integrado:');
    console.log('Production:', production);
    console.log('Shipments:', shipments);
    console.log('Solution completa:', solution);
    
    // Verificar que haya al menos algo de producción
    if (Object.keys(production).length === 0) {
        return {
            valid: false,
            message: 'Debes definir la producción primero. Ve a la pestaña "Producción".'
        };
    }
    
    // 1. Verificar que se produzca suficiente de cada producto
    const totalProduction = {};
    levelData.products.forEach(prod => {
        totalProduction[prod.id] = 0;
    });
    
    Object.keys(production).forEach(key => {
        const [factoryId, prodId] = key.split('-');
        totalProduction[prodId] += production[key];
    });
    
    const totalDemand = {};
    levelData.products.forEach(prod => {
        totalDemand[prod.id] = levelData.customers.reduce((sum, c) => sum + c.demand[prod.id], 0);
    });
    
    for (const prod of levelData.products) {
        if (totalProduction[prod.id] < totalDemand[prod.id]) {
            return {
                valid: false,
                message: `No produces suficiente ${prod.name} (produces ${totalProduction[prod.id]}, necesitas ${totalDemand[prod.id]}). Ve a Producción.`
            };
        }
    }
    
    // Verificar que haya distribución
    if (Object.keys(shipments).length === 0) {
        return {
            valid: false,
            message: 'Debes distribuir los productos a los clientes. Ve a la pestaña "Distribución".'
        };
    }
    
    // 2. Verificar que cada cliente reciba su demanda exacta
    const received = {};
    levelData.customers.forEach(customer => {
        received[customer.id] = { 'A': 0, 'B': 0 };
    });
    
    Object.keys(shipments).forEach(key => {
        const [factoryId, customerId, prodId] = key.split('-');
        received[customerId][prodId] += shipments[key];
    });
    
    for (const customer of levelData.customers) {
        for (const prod of levelData.products) {
            const receivedQty = received[customer.id][prod.id];
            const demandQty = customer.demand[prod.id];
            
            if (receivedQty < demandQty) {
                return {
                    valid: false,
                    message: `${customer.name} no recibe suficiente ${prod.name} (recibe ${receivedQty}, necesita ${demandQty})`
                };
            }
            if (receivedQty > demandQty) {
                return {
                    valid: false,
                    message: `${customer.name} recibe demasiado ${prod.name} (recibe ${receivedQty}, necesita ${demandQty})`
                };
            }
        }
    }
    
    // 3. Verificar capacidades de producción
    for (const key of Object.keys(production)) {
        const [factoryId, prodId] = key.split('-');
        const factory = levelData.factories.find(f => f.id === factoryId);
        const product = levelData.products.find(p => p.id === prodId);
        
        if (production[key] > factory.production[prodId].capacity) {
            return {
                valid: false,
                message: `${factory.name} excede capacidad de producción de ${product.name} (produce ${production[key]}, máx ${factory.production[prodId].capacity})`
            };
        }
    }
    
    // 4. Calcular costos totales
    let productionCost = 0;
    Object.keys(production).forEach(key => {
        const [factoryId, prodId] = key.split('-');
        const factory = levelData.factories.find(f => f.id === factoryId);
        productionCost += production[key] * factory.production[prodId].cost;
    });
    
    let transportCost = 0;
    Object.keys(shipments).forEach(key => {
        const [factoryId, customerId, prodId] = key.split('-');
        transportCost += shipments[key] * levelData.transportCosts[factoryId][customerId];
    });
    
    const totalCost = productionCost + transportCost;
    
    return {
        valid: true,
        value: -totalCost,
        optimal: -levelData.optimalSolution.totalCost,
        message: 'Solución válida',
        productionCost: productionCost,
        transportCost: transportCost
    };
}

function calculateEfficiency(value, optimal) {
    // Para problemas de minimización, value y optimal son negativos
    if (optimal < 0) {
        // Minimización: mejor eficiencia = menor valor
        return Math.min(100, (optimal / value) * 100);
    } else {
        // Maximización: mejor eficiencia = mayor valor
        return Math.min(100, (value / optimal) * 100);
    }
}

function showResultModal(result, efficiency, stars, score, saveResult) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('resultTitle');
    const content = document.getElementById('resultContent');
    const yourSolution = document.getElementById('yourSolution');
    const optimalSolution = document.getElementById('optimalSolution');
    const efficiencyDisplay = document.getElementById('efficiency');
    const starsDisplay = document.getElementById('stars');
    const feedback = document.getElementById('feedback');
    
    // Título
    if (stars === 3) {
        title.textContent = '🎉 ¡Excelente!';
        title.style.color = '#10b981';
    } else if (stars === 2) {
        title.textContent = '👏 ¡Muy bien!';
        title.style.color = '#f59e0b';
    } else if (stars === 1) {
        title.textContent = '👍 ¡Buen intento!';
        title.style.color = '#6366f1';
    } else {
        title.textContent = '🤔 Sigue intentando';
        title.style.color = '#64748b';
    }
    
    // Valores
    const isMinimization = result.optimal < 0;
    yourSolution.textContent = isMinimization ? 
        Math.abs(result.value).toFixed(1) : 
        result.value;
    optimalSolution.textContent = Math.abs(result.optimal).toFixed(1);
    efficiencyDisplay.textContent = efficiency.toFixed(1) + '%';
    
    // Estrellas
    starsDisplay.innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    
    // Feedback
    let feedbackText = '';
    if (stars === 3) {
        feedbackText = '¡Perfecto! Has encontrado la solución óptima o muy cercana a ella. ';
        if (saveResult.isNewCompletion) {
            feedbackText += '¡Has completado un nuevo nivel!';
        } else if (saveResult.isNewRecord) {
            feedbackText += '¡Nuevo récord personal!';
        }
    } else if (stars === 2) {
        feedbackText = 'Muy buena solución. Estás cerca del óptimo. Intenta optimizar un poco más para obtener las 3 estrellas.';
    } else if (stars === 1) {
        feedbackText = 'Has encontrado una solución válida, pero hay mucho margen de mejora. Revisa las pistas y sigue intentando.';
    } else {
        feedbackText = 'Tu solución es válida pero está lejos del óptimo. Considera usar un enfoque diferente.';
    }
    
    feedback.textContent = feedbackText;
    
    // Actualizar puntuación actual
    document.getElementById('currentScore').textContent = score;
    
    // Mostrar modal
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('resultModal').classList.remove('active');
}

function showHint() {
    const hintModal = document.getElementById('hintModal');
    const advancedHint = document.getElementById('advancedHint');
    const levelData = LEVELS_DATA[currentLevelId];
    
    advancedHint.textContent = levelData.advancedHint;
    hintModal.classList.add('active');
}

function closeHintModal() {
    document.getElementById('hintModal').classList.remove('active');
}

function nextLevel() {
    const nextLevelId = currentLevelId + 1;
    
    if (LEVELS_DATA[nextLevelId]) {
        sessionStorage.setItem('currentLevel', nextLevelId);
        location.reload();
    } else {
        showNotification('🎉 ¡Felicidades! Has completado todos los niveles', 'success');
        setTimeout(() => {
            window.location.href = 'levels.html';
        }, 2000);
    }
}

function backToLevels() {
    window.location.href = 'levels.html';
}

// Exportar funciones para uso global
window.game = game;
window.resetGame = resetGame;
window.submitSolution = submitSolution;
window.showHint = showHint;
window.closeModal = closeModal;
window.closeHintModal = closeHintModal;
window.nextLevel = nextLevel;
window.backToLevels = backToLevels;

