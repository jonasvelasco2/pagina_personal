// ============================================
// GAME-ENGINE.JS - Motor del juego y renderizado
// ============================================

class GameEngine {
    constructor(levelData) {
        this.levelData = levelData;
        this.currentSolution = {};
        this.timer = 0;
        this.timerInterval = null;
        this.attempts = 0;
    }
    
    initialize() {
        this.renderObjective();
        this.renderConstraints();
        this.renderHint();
        this.startTimer();
        this.renderGameCanvas();
        this.updateVisualization();
    }
    
    renderObjective() {
        document.getElementById('objective').textContent = this.levelData.objective;
    }
    
    renderConstraints() {
        const constraintsContainer = document.getElementById('constraints');
        constraintsContainer.innerHTML = this.levelData.constraints
            .map(c => `<div class="constraint-item">${c}</div>`)
            .join('');
    }
    
    renderHint() {
        document.getElementById('hint').textContent = this.levelData.hint;
    }
    
    renderGameCanvas() {
        const canvas = document.getElementById('gameCanvas');
        
        switch(this.levelData.type) {
            case 'knapsack':
                this.renderKnapsackGame(canvas);
                break;
            case 'production':
                this.renderProductionGame(canvas);
                break;
            case 'tsp':
                this.renderTSPGame(canvas);
                break;
            case 'assignment':
                this.renderAssignmentGame(canvas);
                break;
            case 'transport':
                this.renderTransportGame(canvas);
                break;
            case 'scheduling':
                this.renderSchedulingGame(canvas);
                break;
            case 'facility':
                this.renderFacilityGame(canvas);
                break;
            case 'network':
                this.renderNetworkGame(canvas);
                break;
            case 'integrated':
                this.renderIntegratedGame(canvas);
                break;
            default:
                canvas.innerHTML = '<p>Juego en construcción...</p>';
        }
    }
    
    // ========================================
    // PROBLEMA DE LA MOCHILA
    // ========================================
    renderKnapsackGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">
                    Selecciona los objetos para tu mochila
                </h3>
                <div style="font-size: 1.25rem; color: #6366f1; font-weight: 600;">
                    <span id="currentWeight">0</span> / ${this.levelData.capacity} kg
                </div>
                <div style="margin-top: 0.5rem; font-size: 1.125rem;">
                    Valor total: <strong id="currentValue" style="color: #10b981;">0</strong>
                </div>
            </div>
            <div class="item-selector" id="itemSelector"></div>
        `;
        
        const selector = document.getElementById('itemSelector');
        this.levelData.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.dataset.itemId = item.id;
            card.innerHTML = `
                <div class="item-emoji">${item.emoji}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-stats">
                    💰 ${item.value} | ⚖️ ${item.weight}kg
                </div>
            `;
            
            card.addEventListener('click', () => this.toggleKnapsackItem(item, card));
            selector.appendChild(card);
        });
        
        this.currentSolution = { items: [], totalValue: 0, totalWeight: 0 };
    }
    
    toggleKnapsackItem(item, card) {
        const index = this.currentSolution.items.findIndex(i => i.id === item.id);
        
        if (index >= 0) {
            // Remover item
            this.currentSolution.items.splice(index, 1);
            this.currentSolution.totalValue -= item.value;
            this.currentSolution.totalWeight -= item.weight;
            card.classList.remove('selected');
        } else {
            // Agregar item si hay capacidad
            if (this.currentSolution.totalWeight + item.weight <= this.levelData.capacity) {
                this.currentSolution.items.push(item);
                this.currentSolution.totalValue += item.value;
                this.currentSolution.totalWeight += item.weight;
                card.classList.add('selected');
            } else {
                showNotification('⚠️ No hay suficiente capacidad en la mochila', 'warning');
                return;
            }
        }
        
        // Actualizar UI
        document.getElementById('currentWeight').textContent = this.currentSolution.totalWeight;
        document.getElementById('currentValue').textContent = this.currentSolution.totalValue;
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    // ========================================
    // PROBLEMA DE PRODUCCIÓN
    // ========================================
    renderProductionGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">
                    Decide cuántas unidades producir
                </h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
                ${this.levelData.products.map(product => `
                    <div style="background: #f8fafc; padding: 1.5rem; border-radius: 1rem;">
                        <div style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">${product.emoji}</div>
                        <h4 style="text-align: center; margin-bottom: 1rem;">${product.name}</h4>
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
                            <div>⏱️ Tiempo: ${product.time}h</div>
                            <div>📦 Material: ${product.material} unidades</div>
                            <div>💰 Ganancia: $${product.profit}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                            <button onclick="game.changeProduction('${product.id}', -10)" class="btn btn-secondary btn-small">-10</button>
                            <button onclick="game.changeProduction('${product.id}', -1)" class="btn btn-secondary btn-small">-1</button>
                            <input type="number" id="prod_${product.id}" value="0" min="0" 
                                   style="width: 80px; text-align: center; padding: 0.5rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem; font-weight: 600;"
                                   oninput="game.updateProduction()"
                                   onchange="game.updateProduction()">
                            <button onclick="game.changeProduction('${product.id}', 1)" class="btn btn-secondary btn-small">+1</button>
                            <button onclick="game.changeProduction('${product.id}', 10)" class="btn btn-secondary btn-small">+10</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 2rem; padding: 1.5rem; background: #f1f5f9; border-radius: 1rem;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b;">Tiempo Usado</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #6366f1;">
                            <span id="usedTime">0</span> / ${this.levelData.resources.time}h
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b;">Material Usado</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6;">
                            <span id="usedMaterial">0</span> / ${this.levelData.resources.material}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b;">Ganancia Total</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">
                            $<span id="totalProfit">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.currentSolution = {};
        this.levelData.products.forEach(p => {
            this.currentSolution[p.id] = 0;
        });
        
        // Actualizar visualización inicial
        setTimeout(() => {
            this.updateProduction();
        }, 100);
    }
    
    changeProduction(productId, delta) {
        const input = document.getElementById(`prod_${productId}`);
        const newValue = Math.max(0, parseInt(input.value) + delta);
        input.value = newValue;
        this.updateProduction();
    }
    
    updateProduction() {
        let usedTime = 0;
        let usedMaterial = 0;
        let totalProfit = 0;
        
        this.levelData.products.forEach(product => {
            const quantity = parseInt(document.getElementById(`prod_${product.id}`).value) || 0;
            this.currentSolution[product.id] = quantity;
            
            usedTime += quantity * product.time;
            usedMaterial += quantity * product.material;
            totalProfit += quantity * product.profit;
        });
        
        document.getElementById('usedTime').textContent = usedTime;
        document.getElementById('usedMaterial').textContent = usedMaterial;
        document.getElementById('totalProfit').textContent = totalProfit;
        
        // Colorear según restricciones
        const timeElement = document.getElementById('usedTime').parentElement;
        const materialElement = document.getElementById('usedMaterial').parentElement;
        
        if (usedTime > this.levelData.resources.time) {
            timeElement.style.color = '#ef4444';
        } else {
            timeElement.style.color = '#1a759f';
        }
        
        if (usedMaterial > this.levelData.resources.material) {
            materialElement.style.color = '#ef4444';
        } else {
            materialElement.style.color = '#52b69a';
        }
        
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    // ========================================
    // PROBLEMA DEL VIAJANTE (TSP)
    // ========================================
    renderTSPGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">
                    Crea tu ruta de entrega
                </h3>
                <p style="color: #64748b;">Haz clic en las casas en el orden que deseas visitarlas</p>
            </div>
            <div style="display: flex; gap: 2rem;">
                <div style="flex: 1;">
                    <canvas id="tspCanvas" width="400" height="400" 
                            style="border: 2px solid #e2e8f0; border-radius: 0.5rem; cursor: crosshair;">
                    </canvas>
                </div>
                <div style="width: 200px;">
                    <h4 style="margin-bottom: 1rem;">Ruta Actual</h4>
                    <div id="routeList" style="font-size: 0.875rem;"></div>
                    <button onclick="game.clearRoute()" class="btn btn-secondary" style="width: 100%; margin-top: 1rem;">
                        Limpiar Ruta
                    </button>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 0.5rem;">
                        <div style="font-size: 0.875rem; color: #64748b;">Distancia Total</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #6366f1;">
                            <span id="totalDistance">0</span> km
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.currentSolution = { route: [0], distance: 0 };
        this.drawTSPCanvas();
    }
    
    drawTSPCanvas() {
        const canvas = document.getElementById('tspCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const locations = this.levelData.locations;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Escalar coordenadas
        const scale = 3.5;
        const offsetX = 20;
        const offsetY = 20;
        
        // Dibujar conexiones de la ruta actual
        if (this.currentSolution.route.length > 1) {
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            for (let i = 0; i < this.currentSolution.route.length - 1; i++) {
                const from = locations[this.currentSolution.route[i]];
                const to = locations[this.currentSolution.route[i + 1]];
                
                const x1 = from.x * scale + offsetX;
                const y1 = from.y * scale + offsetY;
                const x2 = to.x * scale + offsetX;
                const y2 = to.y * scale + offsetY;
                
                if (i === 0) {
                    ctx.moveTo(x1, y1);
                }
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
        
        // Dibujar ubicaciones
        locations.forEach((loc, idx) => {
            const x = loc.x * scale + offsetX;
            const y = loc.y * scale + offsetY;
            
            // Círculo
            ctx.beginPath();
            ctx.arc(x, y, idx === 0 ? 15 : 12, 0, 2 * Math.PI);
            
            if (idx === 0) {
                ctx.fillStyle = '#10b981';
            } else if (this.currentSolution.route.includes(idx)) {
                ctx.fillStyle = '#6366f1';
            } else {
                ctx.fillStyle = '#e2e8f0';
            }
            ctx.fill();
            
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Texto
            ctx.fillStyle = idx === 0 || this.currentSolution.route.includes(idx) ? '#ffffff' : '#64748b';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(idx === 0 ? '🏪' : idx, x, y);
        });
        
        // Agregar evento de clic
        canvas.onclick = (e) => this.handleTSPClick(e, canvas, locations, scale, offsetX, offsetY);
    }
    
    handleTSPClick(e, canvas, locations, scale, offsetX, offsetY) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Encontrar ubicación más cercana
        let closestIdx = -1;
        let minDist = Infinity;
        
        locations.forEach((loc, idx) => {
            const locX = loc.x * scale + offsetX;
            const locY = loc.y * scale + offsetY;
            const dist = Math.sqrt((x - locX) ** 2 + (y - locY) ** 2);
            
            if (dist < minDist && dist < 20) {
                minDist = dist;
                closestIdx = idx;
            }
        });
        
        if (closestIdx >= 0 && closestIdx !== 0) {
            if (!this.currentSolution.route.includes(closestIdx)) {
                this.currentSolution.route.push(closestIdx);
                this.calculateTSPDistance();
                this.drawTSPCanvas();
                this.updateRouteList();
            }
        }
    }
    
    calculateTSPDistance() {
        let distance = 0;
        const locations = this.levelData.locations;
        
        for (let i = 0; i < this.currentSolution.route.length - 1; i++) {
            const from = locations[this.currentSolution.route[i]];
            const to = locations[this.currentSolution.route[i + 1]];
            distance += Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
        }
        
        this.currentSolution.distance = Math.round(distance * 10) / 10;
        document.getElementById('totalDistance').textContent = this.currentSolution.distance;
    }
    
    updateRouteList() {
        const routeList = document.getElementById('routeList');
        const locations = this.levelData.locations;
        
        routeList.innerHTML = this.currentSolution.route
            .map((idx, i) => `
                <div style="padding: 0.5rem; background: ${i === 0 ? '#10b98120' : '#6366f120'}; 
                            margin-bottom: 0.25rem; border-radius: 0.25rem;">
                    ${i + 1}. ${locations[idx].name}
                </div>
            `).join('');
    }
    
    clearRoute() {
        this.currentSolution = { route: [0], distance: 0 };
        this.drawTSPCanvas();
        this.updateRouteList();
        document.getElementById('totalDistance').textContent = '0';
    }
    
    // ========================================
    // PROBLEMA DE ASIGNACIÓN
    // ========================================
    renderAssignmentGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">
                    Asigna empleados a proyectos
                </h3>
                <p style="color: #64748b;">Arrastra empleados a proyectos o usa los menús desplegables</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h4 style="margin-bottom: 1rem;">Empleados</h4>
                    ${this.levelData.employees.map(emp => `
                        <div style="padding: 1rem; background: #f8fafc; margin-bottom: 0.5rem; border-radius: 0.5rem;">
                            <div style="font-size: 1.5rem; display: inline-block; margin-right: 0.5rem;">${emp.emoji}</div>
                            <strong>${emp.name}</strong>
                            <select id="assign_${emp.id}" onchange="game.updateAssignment()" 
                                    style="float: right; padding: 0.25rem 0.5rem; border-radius: 0.25rem; border: 2px solid #e2e8f0;">
                                <option value="">Sin asignar</option>
                                ${this.levelData.projects.map(proj => 
                                    `<option value="${proj.id}">${proj.name} (${this.levelData.costMatrix[emp.id][proj.id]}h)</option>`
                                ).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <h4 style="margin-bottom: 1rem;">Proyectos</h4>
                    ${this.levelData.projects.map(proj => `
                        <div style="padding: 1rem; background: #f1f5f9; margin-bottom: 0.5rem; border-radius: 0.5rem;">
                            <div style="font-size: 1.5rem; display: inline-block; margin-right: 0.5rem;">${proj.emoji}</div>
                            <strong>${proj.name}</strong>
                            <div id="project_${proj.id}" style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">
                                Sin asignar
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 0.875rem; color: #64748b;">Tiempo Total</div>
                <div style="font-size: 2rem; font-weight: 700; color: #6366f1;">
                    <span id="totalTime">0</span> horas
                </div>
            </div>
        `;
        
        this.currentSolution = { assignments: {}, totalTime: 0 };
    }
    
    updateAssignment() {
        this.currentSolution.assignments = {};
        let totalTime = 0;
        const usedProjects = new Set();
        
        this.levelData.employees.forEach(emp => {
            const select = document.getElementById(`assign_${emp.id}`);
            const projectId = select.value;
            
            if (projectId) {
                this.currentSolution.assignments[emp.id] = projectId;
                totalTime += this.levelData.costMatrix[emp.id][projectId];
                usedProjects.add(projectId);
            }
        });
        
        // Actualizar visualización de proyectos
        this.levelData.projects.forEach(proj => {
            const projDiv = document.getElementById(`project_${proj.id}`);
            const assignedEmp = this.levelData.employees.find(e => 
                this.currentSolution.assignments[e.id] === proj.id
            );
            
            if (assignedEmp) {
                projDiv.innerHTML = `${assignedEmp.emoji} ${assignedEmp.name} - ${this.levelData.costMatrix[assignedEmp.id][proj.id]}h`;
                projDiv.style.color = '#10b981';
            } else {
                projDiv.innerHTML = 'Sin asignar';
                projDiv.style.color = '#64748b';
            }
        });
        
        this.currentSolution.totalTime = totalTime;
        document.getElementById('totalTime').textContent = totalTime;
        
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    // ========================================
    // PROBLEMA DE TRANSPORTE
    // ========================================
    renderTransportGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">
                    Define los envíos desde almacenes a tiendas
                </h3>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0;"></th>
                            ${this.levelData.stores.map(store => `
                                <th style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0;">
                                    ${store.emoji}<br>${store.name}<br>
                                    <span style="font-size: 0.875rem; color: #64748b;">Demanda: ${store.demand}</span>
                                </th>
                            `).join('')}
                            <th style="padding: 1rem; background: #e0e7ff; border: 1px solid #e2e8f0;">Capacidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.levelData.warehouses.map(warehouse => `
                            <tr>
                                <td style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 600;">
                                    ${warehouse.emoji} ${warehouse.name}
                                </td>
                                ${this.levelData.stores.map(store => `
                                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center;">
                                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">
                                            Costo: $${this.levelData.costs[warehouse.id][store.id]}
                                        </div>
                                        <input type="number" id="ship_${warehouse.id}_${store.id}" 
                                               value="0" min="0" max="${warehouse.supply}"
                                               onchange="game.updateTransport()"
                                               style="width: 70px; padding: 0.25rem; text-align: center; border: 2px solid #e2e8f0; border-radius: 0.25rem;">
                                    </td>
                                `).join('')}
                                <td style="padding: 1rem; background: #e0e7ff; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                    ${warehouse.supply}
                                </td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td style="padding: 1rem; background: #dcfce7; border: 1px solid #e2e8f0; font-weight: 600;">
                                Recibido
                            </td>
                            ${this.levelData.stores.map(store => `
                                <td id="received_${store.id}" style="padding: 1rem; background: #dcfce7; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                    0 / ${store.demand}
                                </td>
                            `).join('')}
                            <td style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 0.875rem; color: #64748b;">Costo Total</div>
                <div style="font-size: 2rem; font-weight: 700; color: #6366f1;">
                    $<span id="totalCost">0</span>
                </div>
            </div>
        `;
        
        this.currentSolution = { shipments: {}, totalCost: 0 };
    }
    
    updateTransport() {
        this.currentSolution.shipments = {};
        let totalCost = 0;
        
        // Calcular envíos y costo
        this.levelData.warehouses.forEach(warehouse => {
            this.levelData.stores.forEach(store => {
                const inputId = `ship_${warehouse.id}_${store.id}`;
                const quantity = parseInt(document.getElementById(inputId).value) || 0;
                
                if (quantity > 0) {
                    const key = `${warehouse.id}-${store.id}`;
                    this.currentSolution.shipments[key] = quantity;
                    totalCost += quantity * this.levelData.costs[warehouse.id][store.id];
                }
            });
        });
        
        // Actualizar cantidad recibida por tienda
        this.levelData.stores.forEach(store => {
            let received = 0;
            this.levelData.warehouses.forEach(warehouse => {
                const inputId = `ship_${warehouse.id}_${store.id}`;
                received += parseInt(document.getElementById(inputId).value) || 0;
            });
            
            const receivedCell = document.getElementById(`received_${store.id}`);
            receivedCell.textContent = `${received} / ${store.demand}`;
            
            if (received === store.demand) {
                receivedCell.style.color = '#10b981';
            } else if (received > store.demand) {
                receivedCell.style.color = '#ef4444';
            } else {
                receivedCell.style.color = '#f59e0b';
            }
        });
        
        this.currentSolution.totalCost = totalCost;
        document.getElementById('totalCost').textContent = totalCost;
        
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    // ========================================
    // PROBLEMA DE PLANIFICACIÓN DE HORARIOS
    // ========================================
    renderSchedulingGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                    Asigna cursos a franjas horarias
                </h3>
                <p style="color: #64748b; font-size: 0.9375rem;">
                    Los cursos pueden darse en paralelo (aulas diferentes) en la misma franja
                </p>
                <p style="color: #d97706; font-size: 0.875rem; font-weight: 600; margin-top: 0.5rem;">
                    ⚠️ Evita poner cursos en conflicto en la misma franja
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <!-- Lista de Cursos -->
                <div>
                    <h4 style="margin-bottom: 1rem; font-weight: 600;">📚 Cursos</h4>
                    ${this.levelData.courses.map(course => {
                        const prof = this.levelData.professors?.find(p => p.id === course.professor);
                        const labBadge = course.requiresLab ? '<span style="background:#fbbf24;color:#78350f;font-size:0.6875rem;padding:0.2rem 0.5rem;border-radius:0.25rem;font-weight:600;">🔬 Lab</span>' : '';
                        return `
                        <div class="course-card" data-course="${course.id}" 
                             style="padding: 1rem; background: #f8fafc; margin-bottom: 0.75rem; border-radius: 0.5rem; border: 2px solid #e2e8f0; cursor: grab;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                                <span style="font-size: 1.5rem;">${course.emoji}</span>
                                <strong>${course.name}</strong>
                                ${labBadge}
                            </div>
                            <div style="font-size: 0.875rem; color: #64748b;">
                                <div>⏱️ Duración: ${course.duration}h</div>
                                <div>👥 Estudiantes: ${course.students}</div>
                                ${prof ? `<div style="font-size: 0.8125rem;">👨‍🏫 ${prof.name}</div>` : ''}
                            </div>
                        </div>
                        `;
                    }).join('')}
                    
                    <!-- Restricciones de Conflicto -->
                    <div style="margin-top: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 0.5rem; border-left: 4px solid #f59e0b;">
                        <strong style="color: #92400e; font-size: 0.875rem;">⚠️ Restricciones de Conflicto:</strong>
                        <p style="margin-top: 0.5rem; font-size: 0.8125rem; color: #78350f;">
                            Los siguientes cursos NO pueden estar en la misma franja:
                        </p>
                        <ul style="margin-top: 0.5rem; padding-left: 1.25rem; font-size: 0.875rem; color: #78350f;">
                            ${this.levelData.conflicts.map(conflict => {
                                const course1 = this.levelData.courses.find(c => c.id === conflict[0]);
                                const course2 = this.levelData.courses.find(c => c.id === conflict[1]);
                                const key = `${conflict[0]}-${conflict[1]}`;
                                const reason = this.levelData.conflictReasons?.[key] || 'tienen conflicto';
                                return `<li><strong>${course1.emoji} ${course1.name}</strong> y <strong>${course2.emoji} ${course2.name}</strong><br><span style="font-size: 0.8125rem; opacity: 0.9;">→ ${reason}</span></li>`;
                            }).join('')}
                        </ul>
                    </div>
                    
                    <!-- Restricciones de Profesores -->
                    ${Array.isArray(this.levelData.professors) && this.levelData.professors.some(p => p.unavailableSlots?.length > 0) ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #dbeafe; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
                        <strong style="color: #1e40af; font-size: 0.875rem;">👨‍🏫 Disponibilidad de Profesores:</strong>
                        <ul style="margin-top: 0.5rem; padding-left: 1.25rem; font-size: 0.8125rem; color: #1e3a8a;">
                            ${this.levelData.professors
                                .filter(p => p.unavailableSlots?.length > 0)
                                .map(prof => {
                                    const course = this.levelData.courses.find(c => c.professor === prof.id);
                                    const unavailableNames = prof.unavailableSlots
                                        .map(sid => this.levelData.timeSlots.find(s => s.id === sid)?.time)
                                        .filter(Boolean)
                                        .join(', ');
                                    return `<li><strong>${prof.name}</strong> (${course?.emoji} ${course?.name}) NO disponible: ${unavailableNames}</li>`;
                                }).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <!-- Resumen de Reglas -->
                    <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 0.5rem;">
                        <strong style="color: #334155; font-size: 0.875rem;">📋 Reglas a Cumplir:</strong>
                        <ul style="margin-top: 0.5rem; padding-left: 1.25rem; font-size: 0.8125rem; color: #475569; line-height: 1.5;">
                            <li>✅ Asignar todos los cursos</li>
                            <li>🏫 Respetar capacidad de aulas por franja</li>
                            <li>🔬 Respetar capacidad de laboratorios</li>
                            <li>👨‍🏫 Respetar disponibilidad de profesores</li>
                            <li>⚠️ No poner cursos en conflicto juntos</li>
                            <li>🎯 Minimizar franjas horarias usadas</li>
                        </ul>
                    </div>
                </div>
                
                <!-- Horario -->
                <div>
                    <h4 style="margin-bottom: 1rem; font-weight: 600;">🕐 Franjas Horarias</h4>
                    ${this.levelData.timeSlots.map(slot => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="font-weight: 600; color: #1a759f;">Franja ${slot.id}:</span>
                                <span style="color: #64748b;">${slot.time}</span>
                                <span style="color: #94a3b8; font-size: 0.8125rem; margin-left: auto;">
                                    Aulas: <strong id="rooms_used_${slot.id}">0</strong>/${slot.rooms}
                                    ${typeof slot.labs === 'number' ? ` | Labs: <strong id="labs_used_${slot.id}">0</strong>/${slot.labs}` : ''}
                                </span>
                            </div>
                            <div class="time-slot" data-slot="${slot.id}" 
                                 style="min-height: 80px; padding: 1rem; background: white; border: 2px dashed #cbd5e1; border-radius: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                                <span style="color: #94a3b8; font-size: 0.875rem;">Arrastra cursos aquí (paralelos)</span>
                            </div>
                            <select id="slot_${slot.id}" onchange="game.assignCourseToSlot(${slot.id}, this.value)" 
                                    style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.9375rem;">
                                <option value="">-- Asignar curso --</option>
                                ${this.levelData.courses.map(course => 
                                    `<option value="${course.id}">${course.emoji} ${course.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b;">Cursos Asignados</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: #1a759f;">
                            <span id="assignedCourses">0</span> / ${this.levelData.courses.length}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #64748b;">Franjas Usadas</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: #76c893;">
                            <span id="slotsUsed">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.currentSolution = { schedule: {}, slotsUsed: 0 };
        
        // Habilitar drag & drop
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const courseCards = document.querySelectorAll('.course-card');
        const timeSlots = document.querySelectorAll('.time-slot');
        
        courseCards.forEach(card => {
            card.draggable = true;
            
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('courseId', card.dataset.course);
                card.style.opacity = '0.5';
            });
            
            card.addEventListener('dragend', (e) => {
                card.style.opacity = '1';
            });
        });
        
        timeSlots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.style.borderColor = '#1a759f';
                slot.style.background = '#f0f9ff';
            });
            
            slot.addEventListener('dragleave', (e) => {
                slot.style.borderColor = '#cbd5e1';
                slot.style.background = 'white';
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                const courseId = e.dataTransfer.getData('courseId');
                const slotId = parseInt(slot.dataset.slot);
                
                this.assignCourseToSlot(slotId, courseId);
                
                slot.style.borderColor = '#cbd5e1';
                slot.style.background = 'white';
            });
        });
    }
    
    assignCourseToSlot(slotId, courseId) {
        if (!courseId) return;
        
        // Verificar si el curso ya está asignado
        const existingSlot = Object.entries(this.currentSolution.schedule)
            .find(([course, slot]) => course === courseId);
        
        if (existingSlot) {
            // Remover de la posición anterior
            const oldSlotId = existingSlot[1];
            delete this.currentSolution.schedule[courseId];
            this.updateSlotDisplay(oldSlotId);
        }
        
        // Asignar a la nueva franja
        this.currentSolution.schedule[courseId] = slotId;
        
        // Actualizar display
        this.updateSlotDisplay(slotId);
        this.updateSchedulingStats();
        this.checkConflicts();
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    updateSlotDisplay(slotId) {
        const slotDiv = document.querySelector(`.time-slot[data-slot="${slotId}"]`);
        const coursesInSlot = Object.entries(this.currentSolution.schedule)
            .filter(([course, slot]) => slot === slotId)
            .map(([courseId]) => courseId);
        
        const slot = this.levelData.timeSlots.find(s => s.id === slotId);
        const labUsed = coursesInSlot.filter(cid => {
            const c = this.levelData.courses.find(cc => cc.id === cid);
            return c?.requiresLab;
        }).length;

        // Actualizar header de capacidad si existe
        const roomsCounter = document.getElementById(`rooms_used_${slotId}`);
        const labsCounter = document.getElementById(`labs_used_${slotId}`);
        if (roomsCounter) roomsCounter.textContent = String(coursesInSlot.length);
        if (labsCounter) labsCounter.textContent = String(labUsed);

        if (coursesInSlot.length === 0) {
            slotDiv.innerHTML = '<span style="color: #94a3b8; font-size: 0.875rem;">Arrastra cursos aquí (paralelos)</span>';
            return;
        }

        const courseTags = coursesInSlot.map(courseId => {
            const course = this.levelData.courses.find(c => c.id === courseId);
            const labBadge = course?.requiresLab ? '<span style="background:#fde68a;color:#92400e;font-size:0.6875rem;padding:0.1rem 0.4rem;border-radius:0.25rem;">Lab</span>' : '';
            return `
                <div style="padding: 0.5rem 0.75rem; background: #e0f2fe; border: 2px solid #1a759f; border-radius: 0.5rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <span>${course.emoji}</span>
                    <strong style="font-size: 0.9375rem;">${course.name}</strong>
                    ${labBadge}
                    <button onclick="game.removeCourseFromSchedule('${courseId}')" 
                            style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.25rem; line-height: 1;">&times;</button>
                </div>
            `;
        }).join('');

        let capacityNote = '';
        if (typeof slot?.rooms === 'number') {
            const overRooms = coursesInSlot.length > slot.rooms;
            const overLabs = typeof slot.labs === 'number' && labUsed > slot.labs;
            if (overRooms || overLabs) {
                capacityNote = `<div style="width:100%;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;padding:0.25rem 0.5rem;border-radius:0.375rem;">Capacidad excedida: ${overRooms ? 'aulas' : ''} ${overRooms && overLabs ? 'y' : ''} ${overLabs ? 'labs' : ''}</div>`;
            }
        }

        slotDiv.innerHTML = capacityNote + courseTags;
    }
    
    removeCourseFromSchedule(courseId) {
        const slotId = this.currentSolution.schedule[courseId];
        delete this.currentSolution.schedule[courseId];
        
        this.updateSlotDisplay(slotId);
        this.updateSchedulingStats();
        this.checkConflicts();
        this.updateVisualization();
        this.updateCurrentSolution();
        
        // Limpiar select
        document.getElementById(`slot_${slotId}`).value = '';
    }
    
    updateSchedulingStats() {
        const assigned = Object.keys(this.currentSolution.schedule).length;
        const slotsUsed = new Set(Object.values(this.currentSolution.schedule)).size;
        
        document.getElementById('assignedCourses').textContent = assigned;
        document.getElementById('slotsUsed').textContent = slotsUsed;
        
        this.currentSolution.slotsUsed = slotsUsed;
    }
    
    checkConflicts() {
        // Verificar conflictos
        let hasConflicts = false;
        
        this.levelData.conflicts.forEach(([course1, course2]) => {
            const slot1 = this.currentSolution.schedule[course1];
            const slot2 = this.currentSolution.schedule[course2];
            
            if (slot1 && slot2 && slot1 === slot2) {
                hasConflicts = true;
                // Marcar conflicto visualmente
                const slotDiv = document.querySelector(`.time-slot[data-slot="${slot1}"]`);
                slotDiv.style.borderColor = '#ef4444';
                slotDiv.style.background = '#fef2f2';
            }
        });
        
        return !hasConflicts;
    }
    
    // ========================================
    // PROBLEMA DE LOCALIZACIÓN DE INSTALACIONES
    // ========================================
    renderFacilityGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                    Ubica los Centros de Distribución
                </h3>
                <p style="color: #64748b; font-size: 0.9375rem;">
                    Haz clic en el mapa para colocar ${this.levelData.numFacilities} centros
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                <div>
                    <canvas id="facilityCanvas" width="500" height="400" 
                            style="border: 2px solid #e2e8f0; border-radius: 0.5rem; cursor: crosshair; background: #f8fafc;">
                    </canvas>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
                        <button onclick="game.clearLastFacility()" class="btn btn-secondary btn-small">
                            ↶ Deshacer Último
                        </button>
                        <button onclick="game.clearAllFacilities()" class="btn btn-secondary btn-small">
                            🗑️ Limpiar Todo
                        </button>
                        <button onclick="game.autoPlaceFacilities()" class="btn btn-secondary btn-small">
                            🎲 Colocar Aleatorio
                        </button>
                    </div>
                </div>
                
                <div>
                    <h4 style="margin-bottom: 1rem; font-weight: 600;">📍 Leyenda</h4>
                    <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <div style="width: 12px; height: 12px; background: #1a759f; border-radius: 50%;"></div>
                            <span style="font-size: 0.875rem;">Ciudades (10)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <div style="width: 16px; height: 16px; background: #76c893; border-radius: 50%;"></div>
                            <span style="font-size: 0.875rem;">Centros (${this.levelData.numFacilities})</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 20px; height: 2px; background: #cbd5e1;"></div>
                            <span style="font-size: 0.875rem;">Asignaciones</span>
                        </div>
                    </div>
                    
                    <div style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem;">
                        <div style="margin-bottom: 0.75rem;">
                            <div style="font-size: 0.75rem; color: #64748b;">Centros Colocados</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #1a759f;">
                                <span id="facilitiesPlaced">0</span> / ${this.levelData.numFacilities}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b;">Distancia Total</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #76c893;">
                                <span id="totalDistance">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <div id="facilityList" style="margin-top: 1rem; font-size: 0.875rem;">
                        <h4 style="margin-bottom: 0.5rem; font-weight: 600;">Centros:</h4>
                        <div style="color: #64748b;">Haz clic en el mapa para colocar centros</div>
                    </div>
                </div>
            </div>
        `;
        
        this.currentSolution = { facilities: [], totalDistance: 0, assignments: {} };
        this.drawFacilityCanvas();
        this.setupFacilityClick();
    }
    
    setupFacilityClick() {
        const canvas = document.getElementById('facilityCanvas');
        if (!canvas) return;
        
        canvas.onclick = (e) => {
            if (this.currentSolution.facilities.length >= this.levelData.numFacilities) {
                showNotification(`Ya colocaste ${this.levelData.numFacilities} centros. Usa "Deshacer" para modificar.`, 'warning');
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            this.currentSolution.facilities.push({ x: Math.round(x), y: Math.round(y) });
            this.updateFacilityDisplay();
        };
    }
    
    drawFacilityCanvas() {
        const canvas = document.getElementById('facilityCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const scaleX = canvas.width / 100;
        const scaleY = canvas.height / 100;
        
        // Dibujar asignaciones (líneas)
        if (this.currentSolution.facilities.length > 0) {
            this.levelData.cities.forEach((city, idx) => {
                const nearestFacility = this.findNearestFacility(city);
                if (nearestFacility) {
                    ctx.beginPath();
                    ctx.moveTo(city.x * scaleX, city.y * scaleY);
                    ctx.lineTo(nearestFacility.x * scaleX, nearestFacility.y * scaleY);
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }
        
        // Dibujar ciudades
        this.levelData.cities.forEach(city => {
            const x = city.x * scaleX;
            const y = city.y * scaleY;
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#1a759f';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Nombre
            ctx.fillStyle = '#1e293b';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(city.name.split(' ')[1], x, y - 10);
        });
        
        // Dibujar centros de distribución
        this.currentSolution.facilities.forEach((facility, idx) => {
            const x = facility.x * scaleX;
            const y = facility.y * scaleY;
            
            // Círculo exterior
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, 2 * Math.PI);
            ctx.fillStyle = '#76c893';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Número
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((idx + 1).toString(), x, y);
            
            // Label
            ctx.fillStyle = '#76c893';
            ctx.font = 'bold 11px Inter';
            ctx.fillText(`Centro ${idx + 1}`, x, y + 20);
        });
    }
    
    findNearestFacility(city) {
        if (this.currentSolution.facilities.length === 0) return null;
        
        let nearest = this.currentSolution.facilities[0];
        let minDist = this.calculateDistance(city, nearest);
        
        this.currentSolution.facilities.forEach(facility => {
            const dist = this.calculateDistance(city, facility);
            if (dist < minDist) {
                minDist = dist;
                nearest = facility;
            }
        });
        
        return nearest;
    }
    
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    updateFacilityDisplay() {
        // Actualizar contador
        document.getElementById('facilitiesPlaced').textContent = this.currentSolution.facilities.length;
        
        // Calcular distancia total
        if (this.currentSolution.facilities.length > 0) {
            let totalDistance = 0;
            const assignments = {};
            
            this.levelData.cities.forEach((city, idx) => {
                const nearest = this.findNearestFacility(city);
                if (nearest) {
                    const dist = this.calculateDistance(city, nearest);
                    totalDistance += dist;
                    
                    const facilityIdx = this.currentSolution.facilities.indexOf(nearest);
                    assignments[city.id] = facilityIdx;
                }
            });
            
            this.currentSolution.totalDistance = Math.round(totalDistance * 10) / 10;
            this.currentSolution.assignments = assignments;
            
            document.getElementById('totalDistance').textContent = this.currentSolution.totalDistance.toFixed(1);
        } else {
            document.getElementById('totalDistance').textContent = '--';
        }
        
        // Actualizar lista
        const listDiv = document.getElementById('facilityList');
        if (this.currentSolution.facilities.length > 0) {
            listDiv.innerHTML = '<h4 style="margin-bottom: 0.5rem; font-weight: 600;">Centros:</h4>' +
                this.currentSolution.facilities.map((f, idx) => 
                    `<div style="padding: 0.5rem; background: #e0f2fe; border-radius: 0.25rem; margin-bottom: 0.25rem;">
                        Centro ${idx + 1}: (${f.x}, ${f.y})
                    </div>`
                ).join('');
        }
        
        // Redibujar canvas
        this.drawFacilityCanvas();
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    clearLastFacility() {
        if (this.currentSolution.facilities.length > 0) {
            this.currentSolution.facilities.pop();
            this.updateFacilityDisplay();
        }
    }
    
    clearAllFacilities() {
        this.currentSolution.facilities = [];
        this.updateFacilityDisplay();
    }
    
    autoPlaceFacilities() {
        // Colocar centros de forma aleatoria pero razonable
        this.currentSolution.facilities = [];
        
        // Dividir el espacio en regiones
        const regions = [
            { x: 25, y: 35 },  // Noroeste
            { x: 50, y: 70 },  // Sur
            { x: 75, y: 35 }   // Este
        ];
        
        for (let i = 0; i < this.levelData.numFacilities; i++) {
            const region = regions[i];
            const x = region.x + (Math.random() * 20 - 10);
            const y = region.y + (Math.random() * 20 - 10);
            this.currentSolution.facilities.push({ 
                x: Math.max(5, Math.min(95, Math.round(x))), 
                y: Math.max(5, Math.min(95, Math.round(y))) 
            });
        }
        
        this.updateFacilityDisplay();
    }
    
    // ========================================
    // PROBLEMA DE RED ELÉCTRICA
    // ========================================
    renderNetworkGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                    Optimiza el Flujo de Energía
                </h3>
                <p style="color: #64748b; font-size: 0.9375rem;">
                    Define cuánta energía enviar desde cada planta a cada zona
                </p>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: left;">
                                Generador
                            </th>
                            ${this.levelData.consumers.map(consumer => `
                                <th style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: center;">
                                    ${consumer.emoji}<br>
                                    <span style="font-size: 0.875rem; font-weight: normal;">${consumer.name}</span><br>
                                    <span style="font-size: 0.75rem; color: #64748b;">Demanda: ${consumer.demand} MW</span>
                                </th>
                            `).join('')}
                            <th style="padding: 1rem; background: #e0e7ff; border: 1px solid #e2e8f0;">
                                Capacidad
                            </th>
                            <th style="padding: 1rem; background: #fef3c7; border: 1px solid #e2e8f0;">
                                Generado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.levelData.generators.map(gen => `
                            <tr>
                                <td style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 1.5rem;">${gen.emoji}</span>
                                        <div>
                                            <strong>${gen.name}</strong><br>
                                            <span style="font-size: 0.75rem; color: #64748b;">
                                                Costo: $${gen.cost}/MW
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                ${this.levelData.consumers.map(consumer => `
                                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center;">
                                        <input type="number" 
                                               id="flow_${gen.id}_${consumer.id}" 
                                               value="0" 
                                               min="0" 
                                               max="${gen.capacity}"
                                               placeholder="MW"
                                               oninput="game.updateNetwork()"
                                               style="width: 80px; padding: 0.5rem; text-align: center; border: 2px solid #e2e8f0; border-radius: 0.25rem; font-weight: 600;">
                                    </td>
                                `).join('')}
                                <td style="padding: 1rem; background: #e0e7ff; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                    ${gen.capacity} MW
                                </td>
                                <td id="generated_${gen.id}" style="padding: 1rem; background: #fef3c7; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                    0
                                </td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td style="padding: 1rem; background: #dcfce7; border: 1px solid #e2e8f0; font-weight: 600;">
                                Recibido
                            </td>
                            ${this.levelData.consumers.map(consumer => `
                                <td id="received_${consumer.id}_network" style="padding: 1rem; background: #dcfce7; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                    0 / ${consumer.demand}
                                </td>
                            `).join('')}
                            <td colspan="2" style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div style="padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                    <div style="font-size: 0.75rem; color: #64748b;">Demanda Total</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #1a759f;">
                        ${this.levelData.consumers.reduce((sum, c) => sum + c.demand, 0)} MW
                    </div>
                </div>
                <div style="padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                    <div style="font-size: 0.75rem; color: #64748b;">Energía Suministrada</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #76c893;">
                        <span id="totalSupplied">0</span> MW
                    </div>
                </div>
                <div style="padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                    <div style="font-size: 0.75rem; color: #64748b;">Costo Total</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #1a759f;">
                        $<span id="totalNetworkCost">0</span>
                    </div>
                </div>
            </div>
        `;
        
        this.currentSolution = { flow: {}, totalCost: 0 };
    }
    
    updateNetwork() {
        this.currentSolution.flow = {};
        let totalCost = 0;
        let totalSupplied = 0;
        
        // Calcular flujos y costos
        this.levelData.generators.forEach(gen => {
            let genTotal = 0;
            
            this.levelData.consumers.forEach(consumer => {
                const inputId = `flow_${gen.id}_${consumer.id}`;
                const flow = parseInt(document.getElementById(inputId).value) || 0;
                
                if (flow > 0) {
                    const key = `${gen.id}-${consumer.id}`;
                    this.currentSolution.flow[key] = flow;
                    totalCost += flow * gen.cost;
                    genTotal += flow;
                }
            });
            
            // Actualizar generado por planta
            const generatedCell = document.getElementById(`generated_${gen.id}`);
            generatedCell.textContent = genTotal;
            
            if (genTotal > gen.capacity) {
                generatedCell.style.color = '#ef4444';
                generatedCell.style.fontWeight = '700';
            } else {
                generatedCell.style.color = '#78350f';
                generatedCell.style.fontWeight = '600';
            }
        });
        
        // Calcular recibido por zona
        this.levelData.consumers.forEach(consumer => {
            let received = 0;
            
            this.levelData.generators.forEach(gen => {
                const inputId = `flow_${gen.id}_${consumer.id}`;
                received += parseInt(document.getElementById(inputId).value) || 0;
            });
            
            totalSupplied += received;
            
            const receivedCell = document.getElementById(`received_${consumer.id}_network`);
            receivedCell.textContent = `${received} / ${consumer.demand}`;
            
            if (received === consumer.demand) {
                receivedCell.style.color = '#10b981';
            } else if (received > consumer.demand) {
                receivedCell.style.color = '#ef4444';
            } else {
                receivedCell.style.color = '#f59e0b';
            }
        });
        
        this.currentSolution.totalCost = totalCost;
        document.getElementById('totalNetworkCost').textContent = totalCost.toLocaleString();
        document.getElementById('totalSupplied').textContent = totalSupplied;
        
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    // ========================================
    // PROBLEMA INTEGRADO
    // ========================================
    renderIntegratedGame(canvas) {
        canvas.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                    🎯 Cadena de Suministro Completa
                </h3>
                <p style="color: #64748b; font-size: 0.9375rem;">
                    Optimiza producción y distribución simultáneamente
                </p>
            </div>
            
            <!-- Tabs -->
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0;">
                <button class="tab-btn active" data-tab="production" onclick="game.switchTab('production')"
                        style="padding: 0.75rem 1.5rem; background: none; border: none; border-bottom: 3px solid #1a759f; font-weight: 600; color: #1a759f; cursor: pointer;">
                    🏭 Producción
                </button>
                <button class="tab-btn" data-tab="distribution" onclick="game.switchTab('distribution')"
                        style="padding: 0.75rem 1.5rem; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 600; color: #64748b; cursor: pointer;">
                    🚚 Distribución
                </button>
                <button class="tab-btn" data-tab="summary" onclick="game.switchTab('summary')"
                        style="padding: 0.75rem 1.5rem; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 600; color: #64748b; cursor: pointer;">
                    📊 Resumen
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="tabContent"></div>
        `;
        
        this.currentSolution = {
            production: {},
            shipments: {},
            totalCost: 0,
            productionCost: 0,
            transportCost: 0
        };
        
        this.currentTab = 'production';
        this.renderTabContent();
    }
    
    switchTab(tabName) {
        // Guardar datos actuales antes de cambiar
        this.saveCurrentTabData();
        
        this.currentTab = tabName;
        
        // Actualizar estilos de tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.style.borderBottomColor = '#1a759f';
                btn.style.color = '#1a759f';
                btn.classList.add('active');
            } else {
                btn.style.borderBottomColor = 'transparent';
                btn.style.color = '#64748b';
                btn.classList.remove('active');
            }
        });
        
        this.renderTabContent();
        
        // Restaurar datos después de renderizar
        setTimeout(() => {
            this.restoreTabData();
        }, 50);
    }
    
    saveCurrentTabData() {
        // Los datos ya se guardan automáticamente en updateIntegratedProduction y updateIntegratedDistribution
        // Esta función es para asegurar que se capture todo
    }
    
    restoreTabData() {
        if (this.currentTab === 'production') {
            // Restaurar valores de producción
            Object.keys(this.currentSolution.production || {}).forEach(key => {
                const [factoryId, prodId] = key.split('-');
                const inputId = `prod_${factoryId}_${prodId}`;
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = this.currentSolution.production[key];
                }
            });
            
            // Actualizar displays
            if (Object.keys(this.currentSolution.production).length > 0) {
                this.updateIntegratedProduction();
            }
        } else if (this.currentTab === 'distribution') {
            // Restaurar valores de distribución
            Object.keys(this.currentSolution.shipments || {}).forEach(key => {
                const [factoryId, customerId, prodId] = key.split('-');
                const inputId = `ship_${factoryId}_${customerId}_${prodId}`;
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = this.currentSolution.shipments[key];
                }
            });
            
            // Actualizar displays
            if (Object.keys(this.currentSolution.shipments).length > 0) {
                this.updateIntegratedDistribution();
            }
        }
    }
    
    renderTabContent() {
        const container = document.getElementById('tabContent');
        
        switch(this.currentTab) {
            case 'production':
                this.renderProductionTab(container);
                break;
            case 'distribution':
                this.renderDistributionTab(container);
                break;
            case 'summary':
                this.renderSummaryTab(container);
                break;
        }
    }
    
    renderProductionTab(container) {
        container.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="font-weight: 600; margin-bottom: 1rem;">Decide cuánto producir en cada fábrica</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: left;">
                                Fábrica
                            </th>
                            ${this.levelData.products.map(prod => `
                                <th colspan="3" style="padding: 1rem; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: center;">
                                    ${prod.emoji} ${prod.name}
                                </th>
                            `).join('')}
                        </tr>
                        <tr>
                            <th style="padding: 0.5rem; background: #fafafa; border: 1px solid #e2e8f0;"></th>
                            ${this.levelData.products.map(() => `
                                <th style="padding: 0.5rem; background: #fafafa; border: 1px solid #e2e8f0; font-size: 0.75rem; color: #64748b;">
                                    Cantidad
                                </th>
                                <th style="padding: 0.5rem; background: #fafafa; border: 1px solid #e2e8f0; font-size: 0.75rem; color: #64748b;">
                                    Cap. Máx
                                </th>
                                <th style="padding: 0.5rem; background: #fafafa; border: 1px solid #e2e8f0; font-size: 0.75rem; color: #64748b;">
                                    Costo/u
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.levelData.factories.map(factory => `
                            <tr>
                                <td style="padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">
                                    ${factory.emoji} ${factory.name}
                                </td>
                                ${this.levelData.products.map(prod => {
                                    const key = `${factory.id}-${prod.id}`;
                                    const savedValue = this.currentSolution.production?.[key] || 0;
                                    const maxCapacity = factory.production[prod.id].capacity;
                                    const isExceeded = savedValue > maxCapacity;
                                    return `
                                        <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center;">
                                            <input type="number" 
                                                   id="prod_${factory.id}_${prod.id}" 
                                                   value="${savedValue}" 
                                                   min="0" 
                                                   max="${maxCapacity}"
                                                   oninput="game.updateIntegratedProduction()"
                                                   style="width: 80px; padding: 0.5rem; text-align: center; border: 2px solid ${isExceeded ? '#ef4444' : '#e2e8f0'}; border-radius: 0.25rem; font-weight: 600;">
                                        </td>
                                        <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center; font-size: 0.875rem; color: #1a759f; font-weight: 600;">
                                            ${maxCapacity}
                                        </td>
                                        <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center; font-size: 0.875rem; color: #64748b;">
                                            $${factory.production[prod.id].cost}
                                        </td>
                                    `;
                                }).join('')}
                            </tr>
                        `).join('')}
                        <tr>
                            <td style="padding: 1rem; background: #dcfce7; border: 1px solid #e2e8f0; font-weight: 600;">
                                Total Producido
                            </td>
                            ${this.levelData.products.map(prod => {
                                const totalDemand = this.levelData.customers.reduce((sum, c) => sum + c.demand[prod.id], 0);
                                return `
                                    <td id="totalProd_${prod.id}" colspan="3" style="padding: 1rem; background: #dcfce7; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                        0 / ${totalDemand}
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Costo de Producción</div>
                <div style="font-size: 2rem; font-weight: 700; color: #1a759f;">
                    $<span id="productionCostDisplay">0</span>
                </div>
            </div>
        `;
        
        // Actualizar displays si hay datos guardados
        if (Object.keys(this.currentSolution.production || {}).length > 0) {
            setTimeout(() => this.updateIntegratedProduction(), 10);
        }
    }
    
    renderDistributionTab(container) {
        const hasProduction = Object.keys(this.currentSolution.production).some(key => 
            this.currentSolution.production[key] > 0
        );
        
        if (!hasProduction) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #64748b;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">
                        Primero define la producción
                    </p>
                    <p style="font-size: 0.9375rem;">
                        Ve a la pestaña "Producción" y decide qué producir en cada fábrica
                    </p>
                    <button onclick="game.switchTab('production')" class="btn btn-primary" style="margin-top: 1.5rem;">
                        Ir a Producción
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="font-weight: 600; margin-bottom: 1rem;">Distribuye los productos a los clientes</h4>
                
                ${this.levelData.products.map(prod => `
                    <div style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 0.75rem;">
                        <h5 style="margin-bottom: 1rem; color: #1a759f;">
                            ${prod.emoji} ${prod.name}
                        </h5>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr>
                                    <th style="padding: 0.75rem; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: left;">
                                        Fábrica
                                    </th>
                                    ${this.levelData.customers.map(customer => `
                                        <th style="padding: 0.75rem; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: center;">
                                            ${customer.emoji} ${customer.name.split(' ')[1]}<br>
                                            <span style="font-size: 0.7rem; color: #64748b;">Necesita: ${customer.demand[prod.id]}</span>
                                        </th>
                                    `).join('')}
                                    <th style="padding: 0.75rem; background: #e0e7ff; border: 1px solid #e2e8f0;">
                                        Disponible
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.levelData.factories.map(factory => {
                                    const produced = this.currentSolution.production[`${factory.id}-${prod.id}`] || 0;
                                    return `
                                        <tr>
                                            <td style="padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">
                                                ${factory.emoji} ${factory.name.split(' ')[1]}
                                            </td>
                                            ${this.levelData.customers.map(customer => {
                                                const shipKey = `${factory.id}-${customer.id}-${prod.id}`;
                                                const savedShipValue = this.currentSolution.shipments?.[shipKey] || 0;
                                                return `
                                                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center;">
                                                        <input type="number" 
                                                               id="ship_${factory.id}_${customer.id}_${prod.id}" 
                                                               value="${savedShipValue}" 
                                                               min="0" 
                                                               max="${produced}"
                                                               oninput="game.updateIntegratedDistribution()"
                                                               style="width: 60px; padding: 0.25rem; text-align: center; border: 2px solid #e2e8f0; border-radius: 0.25rem; font-size: 0.875rem;">
                                                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 0.25rem;">
                                                            $${this.levelData.transportCosts[factory.id][customer.id]}/u
                                                        </div>
                                                    </td>
                                                `;
                                            }).join('')}
                                            <td style="padding: 0.75rem; background: #e0e7ff; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                                ${produced}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                                <tr>
                                    <td style="padding: 0.75rem; background: #dcfce7; border: 1px solid #e2e8f0; font-weight: 600;">
                                        Recibido
                                    </td>
                                    ${this.levelData.customers.map(customer => `
                                        <td id="received_${customer.id}_${prod.id}" style="padding: 0.75rem; background: #dcfce7; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                                            0 / ${customer.demand[prod.id]}
                                        </td>
                                    `).join('')}
                                    <td style="background: #f1f5f9; border: 1px solid #e2e8f0;"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `).join('')}
                
                <div style="padding: 1rem; background: #f1f5f9; border-radius: 0.5rem; text-align: center;">
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Costo de Transporte</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #52b69a;">
                        $<span id="transportCostDisplay">0</span>
                    </div>
                </div>
            </div>
        `;
        
        // Actualizar displays si hay datos guardados
        if (Object.keys(this.currentSolution.shipments || {}).length > 0) {
            setTimeout(() => this.updateIntegratedDistribution(), 10);
        }
    }
    
    renderSummaryTab(container) {
        const productionCost = this.currentSolution.productionCost || 0;
        const transportCost = this.currentSolution.transportCost || 0;
        const totalCost = productionCost + transportCost;
        
        container.innerHTML = `
            <div style="padding: 2rem; background: #f8fafc; border-radius: 0.75rem;">
                <h4 style="text-align: center; margin-bottom: 2rem; font-size: 1.5rem;">
                    Resumen de la Solución
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="padding: 1.5rem; background: white; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Costo de Producción</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: #1a759f;">
                            $${productionCost.toLocaleString()}
                        </div>
                    </div>
                    <div style="padding: 1.5rem; background: white; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Costo de Transporte</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: #52b69a;">
                            $${transportCost.toLocaleString()}
                        </div>
                    </div>
                    <div style="padding: 1.5rem; background: white; border-radius: 0.5rem; text-align: center; border: 3px solid #76c893;">
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Costo Total</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: #76c893;">
                            $${totalCost.toLocaleString()}
                        </div>
                    </div>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <h5 style="margin-bottom: 1rem;">📦 Producción por Producto</h5>
                    ${this.levelData.products.map(prod => {
                        let totalProduced = 0;
                        this.levelData.factories.forEach(factory => {
                            const key = `${factory.id}-${prod.id}`;
                            totalProduced += this.currentSolution.production[key] || 0;
                        });
                        const totalDemand = this.levelData.customers.reduce((sum, c) => sum + c.demand[prod.id], 0);
                        
                        return `
                            <div style="margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span>${prod.emoji} ${prod.name}</span>
                                    <strong>${totalProduced} / ${totalDemand}</strong>
                                </div>
                                <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #1a759f, #52b69a); width: ${Math.min(100, (totalProduced / totalDemand) * 100)}%;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem;">
                    <h5 style="margin-bottom: 1rem;">🏪 Demanda por Cliente</h5>
                    ${this.levelData.customers.map(customer => {
                        let statusA = 0, statusB = 0;
                        
                        this.levelData.factories.forEach(factory => {
                            const keyA = `${factory.id}-${customer.id}-A`;
                            const keyB = `${factory.id}-${customer.id}-B`;
                            statusA += this.currentSolution.shipments[keyA] || 0;
                            statusB += this.currentSolution.shipments[keyB] || 0;
                        });
                        
                        const demandA = customer.demand['A'];
                        const demandB = customer.demand['B'];
                        const satisfiedA = statusA === demandA;
                        const satisfiedB = statusB === demandB;
                        
                        return `
                            <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; margin-bottom: 0.5rem;">
                                    ${customer.emoji} ${customer.name}
                                </div>
                                <div style="display: flex; gap: 1rem; font-size: 0.875rem;">
                                    <div style="flex: 1;">
                                        <span style="color: ${satisfiedA ? '#10b981' : '#f59e0b'};">
                                            📦 A: ${statusA}/${demandA} ${satisfiedA ? '✅' : '❌'}
                                        </span>
                                    </div>
                                    <div style="flex: 1;">
                                        <span style="color: ${satisfiedB ? '#10b981' : '#f59e0b'};">
                                            📦 B: ${statusB}/${demandB} ${satisfiedB ? '✅' : '❌'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    updateIntegratedProduction() {
        this.currentSolution.production = {};
        let productionCost = 0;
        
        // Recoger datos de producción
        this.levelData.factories.forEach(factory => {
            this.levelData.products.forEach(prod => {
                const inputId = `prod_${factory.id}_${prod.id}`;
                const quantity = parseInt(document.getElementById(inputId).value) || 0;
                const key = `${factory.id}-${prod.id}`;
                
                if (quantity > 0) {
                    this.currentSolution.production[key] = quantity;
                    productionCost += quantity * factory.production[prod.id].cost;
                }
            });
        });
        
        // Actualizar totales por producto
        this.levelData.products.forEach(prod => {
            let total = 0;
            this.levelData.factories.forEach(factory => {
                const key = `${factory.id}-${prod.id}`;
                total += this.currentSolution.production[key] || 0;
            });
            
            const totalDemand = this.levelData.customers.reduce((sum, c) => sum + c.demand[prod.id], 0);
            const totalCell = document.getElementById(`totalProd_${prod.id}`);
            if (totalCell) {
                totalCell.textContent = `${total} / ${totalDemand}`;
                totalCell.style.color = total === totalDemand ? '#10b981' : total > totalDemand ? '#ef4444' : '#f59e0b';
            }
        });
        
        this.currentSolution.productionCost = productionCost;
        const displayEl = document.getElementById('productionCostDisplay');
        if (displayEl) displayEl.textContent = productionCost.toLocaleString();
        
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    updateIntegratedDistribution() {
        this.currentSolution.shipments = {};
        let transportCost = 0;
        
        // Recoger datos de envíos
        this.levelData.factories.forEach(factory => {
            this.levelData.customers.forEach(customer => {
                this.levelData.products.forEach(prod => {
                    const inputId = `ship_${factory.id}_${customer.id}_${prod.id}`;
                    const input = document.getElementById(inputId);
                    if (input) {
                        const quantity = parseInt(input.value) || 0;
                        const key = `${factory.id}-${customer.id}-${prod.id}`;
                        
                        if (quantity > 0) {
                            this.currentSolution.shipments[key] = quantity;
                            transportCost += quantity * this.levelData.transportCosts[factory.id][customer.id];
                        }
                    }
                });
            });
        });
        
        // Actualizar recibido por cliente y producto
        this.levelData.customers.forEach(customer => {
            this.levelData.products.forEach(prod => {
                let received = 0;
                
                this.levelData.factories.forEach(factory => {
                    const key = `${factory.id}-${customer.id}-${prod.id}`;
                    received += this.currentSolution.shipments[key] || 0;
                });
                
                const receivedCell = document.getElementById(`received_${customer.id}_${prod.id}`);
                if (receivedCell) {
                    receivedCell.textContent = `${received} / ${customer.demand[prod.id]}`;
                    receivedCell.style.color = received === customer.demand[prod.id] ? '#10b981' : 
                                              received > customer.demand[prod.id] ? '#ef4444' : '#f59e0b';
                }
            });
        });
        
        this.currentSolution.transportCost = transportCost;
        this.currentSolution.totalCost = this.currentSolution.productionCost + transportCost;
        
        const displayEl = document.getElementById('transportCostDisplay');
        if (displayEl) displayEl.textContent = transportCost.toLocaleString();
        
        this.updateVisualization();
        this.updateCurrentSolution();
    }
    
    // ========================================
    // UTILIDADES
    // ========================================
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = formatTime(this.timer);
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    
    updateVisualization() {
        // Aquí se puede agregar lógica para actualizar gráficas
        this.drawChart();
    }
    
    drawChart() {
        const canvas = document.getElementById('chartCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar gráfica según el tipo de problema
        switch(this.levelData.type) {
            case 'knapsack':
                this.drawKnapsackChart(ctx, canvas);
                break;
            case 'production':
                this.drawProductionChart(ctx, canvas);
                break;
            case 'assignment':
                this.drawAssignmentChart(ctx, canvas);
                break;
            case 'transport':
                this.drawTransportChart(ctx, canvas);
                break;
            case 'scheduling':
                this.drawSchedulingChart(ctx, canvas);
                break;
            case 'facility':
                this.drawFacilityChart(ctx, canvas);
                break;
            case 'network':
                this.drawNetworkChart(ctx, canvas);
                break;
            case 'integrated':
                this.drawIntegratedChart(ctx, canvas);
                break;
            default:
                this.drawDefaultChart(ctx, canvas);
        }
    }
    
    drawKnapsackChart(ctx, canvas) {
        const capacity = this.levelData.capacity;
        const used = this.currentSolution.totalWeight || 0;
        const value = this.currentSolution.totalValue || 0;
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Capacidad de la Mochila', canvas.width / 2, 30);
        
        // Barra de capacidad
        const barWidth = canvas.width - 80;
        const barHeight = 40;
        const barX = 40;
        const barY = 60;
        
        // Fondo de la barra
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Barra de progreso
        const fillWidth = (used / capacity) * barWidth;
        const gradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
        
        if (used > capacity) {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(1, '#dc2626');
        } else if (used > capacity * 0.8) {
            gradient.addColorStop(0, '#f59e0b');
            gradient.addColorStop(1, '#d97706');
        } else {
            gradient.addColorStop(0, '#1a759f');
            gradient.addColorStop(1, '#52b69a');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, Math.min(fillWidth, barWidth), barHeight);
        
        // Texto en la barra
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${used} / ${capacity} kg`, canvas.width / 2, barY + 27);
        
        // Valor total
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Inter';
        ctx.fillText('Valor Total', canvas.width / 2, 140);
        
        ctx.fillStyle = '#76c893';
        ctx.font = 'bold 36px Inter';
        ctx.fillText(`$${value}`, canvas.width / 2, 185);
        
        // Número de items
        const itemCount = this.currentSolution.items?.length || 0;
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.fillText(`${itemCount} ${itemCount === 1 ? 'objeto' : 'objetos'} seleccionados`, canvas.width / 2, 220);
    }
    
    drawProductionChart(ctx, canvas) {
        const resources = this.levelData.resources;
        let usedTime = 0;
        let usedMaterial = 0;
        let profit = 0;
        
        this.levelData.products.forEach(product => {
            const quantity = this.currentSolution[product.id] || 0;
            usedTime += quantity * product.time;
            usedMaterial += quantity * product.material;
            profit += quantity * product.profit;
        });
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Uso de Recursos', canvas.width / 2, 25);
        
        // Barra de Tiempo
        this.drawResourceBar(ctx, canvas, 'Tiempo', usedTime, resources.time, 60, '#1a759f');
        
        // Barra de Material (si existe)
        if (resources.material) {
            this.drawResourceBar(ctx, canvas, 'Material', usedMaterial, resources.material, 130, '#52b69a');
        }
        
        // Ganancia
        const profitY = resources.material ? 200 : 160;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Ganancia Total', canvas.width / 2, profitY);
        
        ctx.fillStyle = '#76c893';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(`$${profit.toLocaleString()}`, canvas.width / 2, profitY + 40);
    }
    
    drawResourceBar(ctx, canvas, label, used, total, y, color) {
        const barWidth = canvas.width - 80;
        const barHeight = 30;
        const barX = 40;
        
        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(label, barX, y - 5);
        
        // Fondo
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(barX, y, barWidth, barHeight);
        
        // Progreso
        const fillWidth = Math.min((used / total) * barWidth, barWidth);
        const gradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
        
        if (used > total) {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(1, '#dc2626');
        } else {
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + 'cc');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, y, fillWidth, barHeight);
        
        // Texto
        ctx.fillStyle = used > total * 0.5 ? 'white' : '#1e293b';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${used} / ${total}`, canvas.width / 2, y + 20);
    }
    
    drawAssignmentChart(ctx, canvas) {
        const total = Object.keys(this.currentSolution.assignments || {}).length;
        const required = this.levelData.employees.length;
        const time = this.currentSolution.totalTime || 0;
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Estado de Asignaciones', canvas.width / 2, 30);
        
        // Círculo de progreso
        const centerX = canvas.width / 2;
        const centerY = 120;
        const radius = 60;
        
        // Fondo del círculo
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        
        // Progreso
        if (total > 0) {
            const percentage = total / required;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * percentage));
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = '#1a759f';
            ctx.fill();
        }
        
        // Círculo interior
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 15, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Texto central
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${total}/${required}`, centerX, centerY + 10);
        
        // Tiempo total
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.fillText('Asignaciones', centerX, centerY + 30);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Inter';
        ctx.fillText('Tiempo Total', centerX, 220);
        
        ctx.fillStyle = '#76c893';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(`${time}h`, centerX, 260);
    }
    
    drawTransportChart(ctx, canvas) {
        const shipments = Object.keys(this.currentSolution.shipments || {}).length;
        const cost = this.currentSolution.totalCost || 0;
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Resumen de Transporte', canvas.width / 2, 30);
        
        // Envíos
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.fillText('Envíos Activos', canvas.width / 2, 80);
        
        ctx.fillStyle = '#1a759f';
        ctx.font = 'bold 48px Inter';
        ctx.fillText(`${shipments}`, canvas.width / 2, 135);
        
        // Costo
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Costo Total', canvas.width / 2, 190);
        
        ctx.fillStyle = '#76c893';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(`$${cost.toLocaleString()}`, canvas.width / 2, 230);
    }
    
    drawSchedulingChart(ctx, canvas) {
        const assigned = Object.keys(this.currentSolution.schedule || {}).length;
        const total = this.levelData.courses.length;
        const slotsUsed = this.currentSolution.slotsUsed || 0;
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Progreso del Horario', canvas.width / 2, 30);
        
        // Círculo de progreso
        const centerX = canvas.width / 2;
        const centerY = 100;
        const radius = 50;
        
        // Fondo
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        
        // Progreso
        if (assigned > 0) {
            const percentage = assigned / total;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * percentage));
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = percentage === 1 ? '#76c893' : '#1a759f';
            ctx.fill();
        }
        
        // Centro
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 12, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Texto
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px Inter';
        ctx.fillText(`${assigned}/${total}`, centerX, centerY + 8);
        
        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.fillText('Cursos', centerX, centerY + 25);
        
        // Franjas usadas
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Franjas Usadas', centerX, 190);
        
        const slotColor = slotsUsed <= 3 ? '#76c893' : '#f59e0b';
        ctx.fillStyle = slotColor;
        ctx.font = 'bold 36px Inter';
        ctx.fillText(slotsUsed.toString(), centerX, 230);
        
        // Objetivo
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.fillText('Objetivo: 3 franjas', centerX, 260);
    }
    
    drawFacilityChart(ctx, canvas) {
        const placed = this.currentSolution.facilities?.length || 0;
        const required = this.levelData.numFacilities;
        const distance = this.currentSolution.totalDistance || 0;
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Centros de Distribución', canvas.width / 2, 30);
        
        // Círculo de progreso
        const centerX = canvas.width / 2;
        const centerY = 110;
        const radius = 55;
        
        // Fondo
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        
        // Progreso
        if (placed > 0) {
            const percentage = placed / required;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * percentage));
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = percentage === 1 ? '#76c893' : '#1a759f';
            ctx.fill();
        }
        
        // Centro blanco
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 12, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Texto central
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px Inter';
        ctx.fillText(`${placed}/${required}`, centerX, centerY + 8);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.fillText('Centros', centerX, centerY + 26);
        
        // Distancia total
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Distancia Total', centerX, 200);
        
        if (placed === required) {
            const optimalDist = this.levelData.optimalSolution.totalDistance;
            const efficiency = (optimalDist / distance) * 100;
            let color = '#76c893';
            
            if (efficiency < 80) color = '#f59e0b';
            if (efficiency < 60) color = '#ef4444';
            
            ctx.fillStyle = color;
            ctx.font = 'bold 32px Inter';
            ctx.fillText(distance.toFixed(1), centerX, 240);
            
            // Comparación con óptimo
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Inter';
            ctx.fillText(`Óptimo: ${optimalDist}`, centerX, 265);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 16px Inter';
            ctx.fillText('Coloca todos los centros', centerX, 240);
        }
    }
    
    drawNetworkChart(ctx, canvas) {
        const cost = this.currentSolution.totalCost || 0;
        const optimalCost = this.levelData.optimalSolution.totalCost;
        
        // Calcular si se satisface demanda
        const totalDemand = this.levelData.consumers.reduce((sum, c) => sum + c.demand, 0);
        let totalSupplied = 0;
        
        Object.values(this.currentSolution.flow || {}).forEach(flow => {
            totalSupplied += flow;
        });
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Red Eléctrica', canvas.width / 2, 30);
        
        // Círculo de demanda satisfecha
        const centerX = canvas.width / 2;
        const centerY = 110;
        const radius = 55;
        
        // Fondo
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        
        // Progreso de demanda
        if (totalSupplied > 0) {
            const percentage = Math.min(1, totalSupplied / totalDemand);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * percentage));
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = percentage >= 1 ? '#76c893' : '#f59e0b';
            ctx.fill();
        }
        
        // Centro blanco
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 12, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Porcentaje
        const percentage = totalDemand > 0 ? Math.round((totalSupplied / totalDemand) * 100) : 0;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px Inter';
        ctx.fillText(`${percentage}%`, centerX, centerY + 8);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Inter';
        ctx.fillText('Demanda', centerX, centerY + 24);
        
        // Costo total
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Costo Total', centerX, 195);
        
        if (totalSupplied === totalDemand) {
            const efficiency = (optimalCost / cost) * 100;
            let color = '#76c893';
            
            if (efficiency < 80) color = '#f59e0b';
            if (efficiency < 60) color = '#ef4444';
            
            ctx.fillStyle = color;
            ctx.font = 'bold 32px Inter';
            ctx.fillText(`$${cost.toLocaleString()}`, centerX, 235);
            
            // Comparación con óptimo
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Inter';
            ctx.fillText(`Óptimo: $${optimalCost.toLocaleString()}`, centerX, 260);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 14px Inter';
            ctx.fillText('Satisface la demanda', centerX, 235);
            ctx.fillText('para ver el costo', centerX, 255);
        }
    }
    
    drawIntegratedChart(ctx, canvas) {
        const productionCost = this.currentSolution.productionCost || 0;
        const transportCost = this.currentSolution.transportCost || 0;
        const totalCost = productionCost + transportCost;
        const optimalCost = this.levelData.optimalSolution.totalCost;
        
        // Título
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Costos de la Cadena', canvas.width / 2, 25);
        
        // Gráfica de barras apiladas
        const barWidth = canvas.width - 80;
        const barHeight = 50;
        const barX = 40;
        const barY = 60;
        
        // Fondo
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        if (totalCost > 0) {
            // Barra de producción
            const prodWidth = (productionCost / (productionCost + transportCost)) * barWidth;
            const gradient1 = ctx.createLinearGradient(barX, 0, barX + prodWidth, 0);
            gradient1.addColorStop(0, '#1a759f');
            gradient1.addColorStop(1, '#168aad');
            ctx.fillStyle = gradient1;
            ctx.fillRect(barX, barY, prodWidth, barHeight);
            
            // Barra de transporte
            const gradient2 = ctx.createLinearGradient(barX + prodWidth, 0, barX + barWidth, 0);
            gradient2.addColorStop(0, '#52b69a');
            gradient2.addColorStop(1, '#76c893');
            ctx.fillStyle = gradient2;
            ctx.fillRect(barX + prodWidth, barY, barWidth - prodWidth, barHeight);
            
            // Etiquetas en la barra
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Inter';
            
            if (prodWidth > 80) {
                ctx.textAlign = 'center';
                ctx.fillText(`Prod: $${(productionCost / 1000).toFixed(1)}k`, barX + prodWidth / 2, barY + 32);
            }
            
            if (barWidth - prodWidth > 80) {
                ctx.textAlign = 'center';
                ctx.fillText(`Trans: $${(transportCost / 1000).toFixed(1)}k`, barX + prodWidth + (barWidth - prodWidth) / 2, barY + 32);
            }
        }
        
        // Leyenda
        ctx.textAlign = 'left';
        ctx.font = '12px Inter';
        
        ctx.fillStyle = '#1a759f';
        ctx.fillRect(barX, barY + 65, 15, 15);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`Producción: $${productionCost.toLocaleString()}`, barX + 20, barY + 77);
        
        ctx.fillStyle = '#52b69a';
        ctx.fillRect(barX, barY + 90, 15, 15);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`Transporte: $${transportCost.toLocaleString()}`, barX + 20, barY + 102);
        
        // Costo total
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Inter';
        ctx.fillText('Costo Total', canvas.width / 2, 195);
        
        if (totalCost > 0) {
            const efficiency = (optimalCost / totalCost) * 100;
            let color = '#76c893';
            
            if (efficiency < 80) color = '#f59e0b';
            if (efficiency < 60) color = '#ef4444';
            
            ctx.fillStyle = color;
            ctx.font = 'bold 36px Inter';
            ctx.fillText(`$${totalCost.toLocaleString()}`, canvas.width / 2, 240);
            
            // Comparación
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter';
            ctx.fillText(`Óptimo: $${optimalCost.toLocaleString()}`, canvas.width / 2, 265);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 16px Inter';
            ctx.fillText('--', canvas.width / 2, 240);
        }
    }
    
    drawDefaultChart(ctx, canvas) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Visualización no disponible', canvas.width / 2, canvas.height / 2);
        ctx.fillText('para este tipo de problema', canvas.width / 2, canvas.height / 2 + 20);
    }
    
    updateCurrentSolution() {
        const display = document.getElementById('currentSolution');
        
        let html = '<div style="font-size: 0.875rem;">';
        
        switch(this.levelData.type) {
            case 'knapsack':
                html += `<strong>Objetos seleccionados:</strong> ${this.currentSolution.items.length}<br>`;
                html += `<strong>Peso total:</strong> ${this.currentSolution.totalWeight}kg<br>`;
                html += `<strong>Valor total:</strong> ${this.currentSolution.totalValue}`;
                break;
            case 'production':
                const products = this.levelData.products.map(p => 
                    `${p.name}: ${this.currentSolution[p.id] || 0}`
                ).join('<br>');
                html += products;
                break;
            case 'tsp':
                html += `<strong>Ubicaciones visitadas:</strong> ${this.currentSolution.route.length}<br>`;
                html += `<strong>Distancia:</strong> ${this.currentSolution.distance}km`;
                break;
            case 'assignment':
                html += `<strong>Asignaciones:</strong> ${Object.keys(this.currentSolution.assignments).length}<br>`;
                html += `<strong>Tiempo total:</strong> ${this.currentSolution.totalTime}h`;
                break;
            case 'transport':
                html += `<strong>Envíos realizados:</strong> ${Object.keys(this.currentSolution.shipments).length}<br>`;
                html += `<strong>Costo total:</strong> $${this.currentSolution.totalCost}`;
                break;
            case 'scheduling':
                html += `<strong>Cursos asignados:</strong> ${Object.keys(this.currentSolution.schedule || {}).length}/5<br>`;
                html += `<strong>Franjas usadas:</strong> ${this.currentSolution.slotsUsed || 0}`;
                break;
            case 'facility':
                html += `<strong>Centros colocados:</strong> ${this.currentSolution.facilities?.length || 0}/3<br>`;
                html += `<strong>Distancia total:</strong> ${this.currentSolution.totalDistance?.toFixed(1) || '--'}`;
                break;
            case 'network':
                html += `<strong>Flujos activos:</strong> ${Object.keys(this.currentSolution.flow || {}).length}<br>`;
                html += `<strong>Costo total:</strong> $${this.currentSolution.totalCost?.toLocaleString() || '0'}`;
                break;
            case 'integrated':
                const prodCost = this.currentSolution.productionCost || 0;
                const transCost = this.currentSolution.transportCost || 0;
                html += `<strong>Producción:</strong> $${prodCost.toLocaleString()}<br>`;
                html += `<strong>Transporte:</strong> $${transCost.toLocaleString()}<br>`;
                html += `<strong>Total:</strong> $${(prodCost + transCost).toLocaleString()}`;
                break;
        }
        
        html += '</div>';
        display.innerHTML = html;
    }
    
    getSolution() {
        return this.currentSolution;
    }
    
    getTime() {
        return this.timer;
    }
    
    incrementAttempts() {
        this.attempts++;
        document.getElementById('attempts').textContent = this.attempts;
    }
}

// Exportar clase
window.GameEngine = GameEngine;

