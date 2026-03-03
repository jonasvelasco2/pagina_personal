/**
 * Explorador interactivo de grafos: DFS vs BFS
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORES
// ============================================================
const C = {
    start:     '#ff9900',
    goal:      '#16a34a',
    current:   '#0073bb',
    visited:   '#93c5fd',
    frontier:  '#06b6d4',
    unvisited: '#d1d5db',
    path:      '#22c55e',
    edgeDefault: '#cbd5e1',
    edgeVisited: '#60a5fa',
    edgePath:    '#22c55e',
    textDark:  '#1e293b',
    textLight: '#ffffff',
    weightBg:  '#ffffff',
};

// ============================================================
// GRAFOS PREDEFINIDOS
// ============================================================
const GRAPHS = {
    graph1: {
        label: 'A→F (Presentación)',
        nodes: [
            { id: 'A', x: 0.10, y: 0.50 },
            { id: 'B', x: 0.32, y: 0.18 },
            { id: 'C', x: 0.32, y: 0.82 },
            { id: 'D', x: 0.60, y: 0.18 },
            { id: 'E', x: 0.60, y: 0.82 },
            { id: 'F', x: 0.88, y: 0.50 },
        ],
        edges: [
            { from: 'A', to: 'B', w: 2 },
            { from: 'A', to: 'C', w: 4 },
            { from: 'B', to: 'D', w: 3 },
            { from: 'B', to: 'E', w: 5 },
            { from: 'C', to: 'E', w: 1 },
            { from: 'D', to: 'F', w: 2 },
            { from: 'E', to: 'F', w: 6 },
        ],
        start: 'A',
        goal: 'F',
    },
    graph2: {
        label: 'S→G (Actividad 1)',
        nodes: [
            { id: 'S', x: 0.08, y: 0.50 },
            { id: 'A', x: 0.28, y: 0.22 },
            { id: 'B', x: 0.28, y: 0.78 },
            { id: 'C', x: 0.50, y: 0.15 },
            { id: 'D', x: 0.50, y: 0.60 },
            { id: 'E', x: 0.72, y: 0.08 },
            { id: 'H', x: 0.72, y: 0.38 },
            { id: 'G', x: 0.90, y: 0.60 },
        ],
        edges: [
            { from: 'S', to: 'A' },
            { from: 'S', to: 'B' },
            { from: 'A', to: 'C' },
            { from: 'A', to: 'D' },
            { from: 'B', to: 'D' },
            { from: 'C', to: 'E' },
            { from: 'C', to: 'H' },
            { from: 'D', to: 'G' },
            { from: 'H', to: 'G' },
        ],
        start: 'S',
        goal: 'G',
    },
    graph3: {
        label: 'Grafo grande',
        nodes: [
            { id: '1', x: 0.08, y: 0.30 },
            { id: '2', x: 0.08, y: 0.70 },
            { id: '3', x: 0.28, y: 0.10 },
            { id: '4', x: 0.28, y: 0.50 },
            { id: '5', x: 0.28, y: 0.90 },
            { id: '6', x: 0.50, y: 0.25 },
            { id: '7', x: 0.50, y: 0.65 },
            { id: '8', x: 0.72, y: 0.15 },
            { id: '9', x: 0.72, y: 0.50 },
            { id: '10', x: 0.72, y: 0.85 },
            { id: '11', x: 0.92, y: 0.35 },
            { id: '12', x: 0.92, y: 0.70 },
        ],
        edges: [
            { from: '1', to: '3', w: 2 },
            { from: '1', to: '4', w: 3 },
            { from: '2', to: '4', w: 1 },
            { from: '2', to: '5', w: 4 },
            { from: '3', to: '6', w: 2 },
            { from: '4', to: '6', w: 5 },
            { from: '4', to: '7', w: 2 },
            { from: '5', to: '7', w: 3 },
            { from: '5', to: '10', w: 6 },
            { from: '6', to: '8', w: 1 },
            { from: '6', to: '9', w: 4 },
            { from: '7', to: '9', w: 2 },
            { from: '7', to: '10', w: 3 },
            { from: '8', to: '11', w: 3 },
            { from: '9', to: '11', w: 2 },
            { from: '9', to: '12', w: 1 },
            { from: '10', to: '12', w: 2 },
            { from: '11', to: '12', w: 4 },
        ],
        start: '1',
        goal: '12',
    },
};

// ============================================================
// STATE
// ============================================================
let state = {
    algorithm: 'dfs',
    graphId: 'graph1',
    // Graph data (built from GRAPHS)
    nodes: [],
    adj: {},
    start: null,
    goal: null,
    // Algorithm state
    frontier: [],
    visited: new Set(),
    parent: {},
    currentNode: null,
    visitOrder: [],
    path: [],
    stepCount: 0,
    finished: false,
    foundGoal: false,
    started: false,
    // Animation
    running: false,
    speed: 600,
    timerId: null,
};

// ============================================================
// DOM REFS
// ============================================================
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const elStructContainer = document.getElementById('structure-container');
const elVisitOrder = document.getElementById('visit-order');
const elPathDisplay = document.getElementById('path-display');
const elPathResult = document.getElementById('path-result');
const elStructTitle = document.getElementById('structure-title');
const elStructCount = document.getElementById('structure-count');
const elStructHint = document.getElementById('struct-hint');
const elGraphInfo = document.getElementById('graph-info');
const elStatusBox = document.getElementById('status-box');
const elSpeedValue = document.getElementById('speed-value');

const metricStep = document.getElementById('metric-step');
const metricExplored = document.getElementById('metric-explored');
const metricFrontier = document.getElementById('metric-frontier');
const metricPath = document.getElementById('metric-path');
const metricStatus = document.getElementById('metric-status');

// ============================================================
// GRAPH HELPERS
// ============================================================
function buildAdjacency(graphDef) {
    const adj = {};
    graphDef.nodes.forEach(n => { adj[n.id] = []; });
    graphDef.edges.forEach(e => {
        adj[e.from].push({ node: e.to, weight: e.w || null });
        adj[e.to].push({ node: e.from, weight: e.w || null });
    });
    // Sort adjacency lists alphabetically for deterministic order
    Object.keys(adj).forEach(k => {
        adj[k].sort((a, b) => a.node.localeCompare(b.node, undefined, { numeric: true }));
    });
    return adj;
}

function loadGraph(graphId) {
    const def = GRAPHS[graphId];
    state.graphId = graphId;
    state.nodes = def.nodes.map(n => ({ ...n }));
    state.adj = buildAdjacency(def);
    state.start = def.start;
    state.goal = def.goal;

    const edgeCount = def.edges.length;
    const nodeCount = def.nodes.length;
    elGraphInfo.textContent = `${nodeCount} nodos · ${edgeCount} aristas`;

    resetAlgorithm();
}

// ============================================================
// ALGORITHM
// ============================================================
function resetAlgorithm() {
    stopRunning();
    state.frontier = [state.start];
    state.visited = new Set();
    state.parent = {};
    state.currentNode = null;
    state.visitOrder = [];
    state.path = [];
    state.stepCount = 0;
    state.finished = false;
    state.foundGoal = false;
    state.started = false;

    updateStructureTitle();
    render();
    renderStructure();
    renderVisitOrder();
    renderPathDisplay();
    updateMetrics();
    setStatus('default', 'Presiona <strong>Paso</strong> para iniciar la búsqueda.');
    enableButtons(true);
}

function updateStructureTitle() {
    if (state.algorithm === 'dfs') {
        elStructTitle.textContent = 'Pila (LIFO)';
        elStructHint.textContent = 'tope ↑ · se extrae de aquí';
    } else {
        elStructTitle.textContent = 'Cola (FIFO)';
        elStructHint.textContent = 'frente ↑ · se extrae de aquí';
    }
}

function step() {
    if (state.finished) return 'done';

    if (!state.started) {
        state.started = true;
    }

    if (state.frontier.length === 0) {
        state.finished = true;
        setStatus('no-path', 'No se encontró camino de <strong>' + state.start + '</strong> a <strong>' + state.goal + '</strong>.');
        enableButtons(false);
        return 'no-path';
    }

    // Extract next node
    let current;
    if (state.algorithm === 'dfs') {
        current = state.frontier.pop();
    } else {
        current = state.frontier.shift();
    }

    state.stepCount++;
    state.currentNode = current;

    // Check if already visited (DFS may have duplicates on the stack)
    if (state.visited.has(current)) {
        // Skip, re-render and continue
        render();
        renderStructure();
        updateMetrics();
        setStatus('default', `Paso ${state.stepCount}: <strong>${current}</strong> ya fue visitado, se descarta.`);
        return 'skip';
    }

    // Visit the node
    state.visited.add(current);
    state.visitOrder.push(current);

    // Check goal
    if (current === state.goal) {
        state.foundGoal = true;
        state.finished = true;
        state.path = reconstructPath();
        render();
        renderStructure();
        renderVisitOrder();
        renderPathDisplay();
        updateMetrics();
        const pathStr = state.path.join(' → ');
        setStatus('found', `<strong>¡Meta encontrada!</strong> Camino: ${pathStr} (${state.path.length - 1} aristas)`);
        enableButtons(false);
        return 'found';
    }

    // Expand neighbors
    const neighbors = state.adj[current] || [];
    const toAdd = [];
    for (const nb of neighbors) {
        if (!state.visited.has(nb.node)) {
            if (state.algorithm === 'dfs') {
                if (!(nb.node in state.parent)) {
                    state.parent[nb.node] = current;
                }
                toAdd.push(nb.node);
            } else {
                // BFS: only add if not visited and not already in queue
                if (!state.frontier.includes(nb.node)) {
                    state.parent[nb.node] = current;
                    state.frontier.push(nb.node);
                    toAdd.push(nb.node);
                }
            }
        }
    }

    if (state.algorithm === 'dfs') {
        // Push in reverse so first alphabetical neighbor ends up on top of stack
        for (let i = toAdd.length - 1; i >= 0; i--) {
            state.frontier.push(toAdd[i]);
        }
    }

    // Build status message
    const structName = state.algorithm === 'dfs' ? 'Pila' : 'Cola';
    const frontierStr = state.frontier.length > 0 ? '[' + [...state.frontier].join(', ') + ']' : '[]';

    setStatus('default',
        `Paso ${state.stepCount}: Visitamos <strong>${current}</strong>. ` +
        `Vecinos añadidos: ${toAdd.length > 0 ? toAdd.join(', ') : 'ninguno'}. ` +
        `${structName}: ${frontierStr}`
    );

    render();
    renderStructure();
    renderVisitOrder();
    updateMetrics();

    return 'continue';
}

function reconstructPath() {
    const path = [];
    let node = state.goal;
    while (node != null) {
        path.unshift(node);
        node = state.parent[node] != null ? state.parent[node] : null;
        if (node === undefined) break;
    }
    return path;
}

// ============================================================
// RENDERING — CANVAS
// ============================================================
function getCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    return { w: canvas.width, h: canvas.height };
}

function nodeScreenPos(n) {
    const { w, h } = getCanvasSize();
    const pad = 40;
    return {
        x: pad + n.x * (w - 2 * pad),
        y: pad + n.y * (h - 2 * pad),
    };
}

function nodeColor(id) {
    if (state.path.length > 0 && state.path.includes(id)) {
        if (id === state.start) return C.start;
        if (id === state.goal) return C.goal;
        return C.path;
    }
    if (id === state.currentNode && !state.finished) return C.current;
    if (id === state.start) return C.start;
    if (id === state.goal) return C.goal;
    if (state.visited.has(id)) return C.visited;
    if (state.frontier.includes(id)) return C.frontier;
    return C.unvisited;
}

function nodeTextColor(id) {
    const bg = nodeColor(id);
    if ([C.current, C.goal, C.path, C.start].includes(bg)) return C.textLight;
    return C.textDark;
}

function edgeColor(fromId, toId) {
    if (state.path.length >= 2) {
        for (let i = 0; i < state.path.length - 1; i++) {
            const a = state.path[i], b = state.path[i + 1];
            if ((fromId === a && toId === b) || (fromId === b && toId === a)) {
                return C.edgePath;
            }
        }
    }
    if (state.visited.has(fromId) && state.visited.has(toId)) return C.edgeVisited;
    return C.edgeDefault;
}

function edgeWidth(fromId, toId) {
    if (state.path.length >= 2) {
        for (let i = 0; i < state.path.length - 1; i++) {
            const a = state.path[i], b = state.path[i + 1];
            if ((fromId === a && toId === b) || (fromId === b && toId === a)) {
                return 4;
            }
        }
    }
    return 2;
}

function render() {
    const { w, h } = getCanvasSize();
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    if (state.nodes.length === 0) return;

    const graphDef = GRAPHS[state.graphId];
    const nodeMap = {};
    state.nodes.forEach(n => { nodeMap[n.id] = n; });

    // Draw edges
    graphDef.edges.forEach(e => {
        const from = nodeScreenPos(nodeMap[e.from]);
        const to = nodeScreenPos(nodeMap[e.to]);
        const color = edgeColor(e.from, e.to);
        const width = edgeWidth(e.from, e.to);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        // Weight label
        if (e.w != null) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            // Offset label slightly perpendicular to the edge
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const offset = 14;
            const lx = mx + nx * offset;
            const ly = my + ny * offset;

            ctx.font = '600 12px "Source Sans Pro", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Background pill
            const tw = ctx.measureText(String(e.w)).width + 8;
            ctx.fillStyle = C.weightBg;
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(lx - tw / 2, ly - 9, tw, 18, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#64748b';
            ctx.fillText(String(e.w), lx, ly);
        }
    });

    // Draw nodes
    const R = 22;
    state.nodes.forEach(n => {
        const pos = nodeScreenPos(n);
        const bg = nodeColor(n.id);
        const fg = nodeTextColor(n.id);

        // Shadow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + 2, R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = (bg === C.unvisited) ? '#b0b8c1' : bg;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Label
        ctx.font = '700 15px "Source Sans Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fg;
        ctx.fillText(n.id, pos.x, pos.y + 1);
    });
}

// ============================================================
// RENDERING — STRUCTURE (Stack / Queue)
// ============================================================
function renderStructure() {
    elStructCount.textContent = state.frontier.length;

    if (state.frontier.length === 0) {
        elStructContainer.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem;text-align:center;padding:1rem;">Vacía</div>';
        return;
    }

    // For DFS (stack) show top at top; for BFS (queue) show front at top
    let items;
    if (state.algorithm === 'dfs') {
        items = [...state.frontier].reverse(); // top of stack first
    } else {
        items = [...state.frontier]; // front of queue first
    }

    let html = '';
    items.forEach((id, i) => {
        const isTop = (i === 0);
        const cls = isTop ? 'struct-item top-item' : 'struct-item';
        const pointer = isTop
            ? (state.algorithm === 'dfs' ? '<span class="struct-pointer">← tope (pop)</span>' : '<span class="struct-pointer">← frente (dequeue)</span>')
            : '';
        html += `<div class="${cls}">${id}${pointer}</div>`;
    });

    elStructContainer.innerHTML = html;
}

function renderVisitOrder() {
    if (state.visitOrder.length === 0) {
        elVisitOrder.innerHTML = '<span style="color:#94a3b8;font-size:0.75rem;">—</span>';
        return;
    }
    elVisitOrder.innerHTML = state.visitOrder.map(id =>
        `<span class="visit-tag">${id}</span>`
    ).join('');
}

function renderPathDisplay() {
    if (state.path.length === 0) {
        elPathResult.style.display = 'none';
        return;
    }
    elPathResult.style.display = 'block';
    elPathDisplay.innerHTML = state.path.map((id, i) => {
        let html = `<span class="path-node">${id}</span>`;
        if (i < state.path.length - 1) html += '<span class="path-arrow">→</span>';
        return html;
    }).join('');
}

// ============================================================
// METRICS & STATUS
// ============================================================
function updateMetrics() {
    metricStep.textContent = state.stepCount;
    metricExplored.textContent = state.visitOrder.length;
    metricFrontier.textContent = state.frontier.length;

    if (state.path.length > 0) {
        metricPath.textContent = state.path.length - 1;
        metricPath.classList.add('success');
    } else {
        metricPath.innerHTML = '&mdash;';
        metricPath.classList.remove('success');
    }

    if (state.finished && state.foundGoal) {
        metricStatus.textContent = '¡Meta!';
        metricStatus.classList.add('success');
        metricStatus.classList.remove('warning');
    } else if (state.finished && !state.foundGoal) {
        metricStatus.textContent = 'Sin camino';
        metricStatus.classList.remove('success');
        metricStatus.classList.add('warning');
    } else if (state.started) {
        metricStatus.textContent = 'Buscando…';
        metricStatus.classList.remove('success', 'warning');
    } else {
        metricStatus.textContent = 'Listo';
        metricStatus.classList.remove('success', 'warning');
    }
}

function setStatus(type, html) {
    elStatusBox.className = 'status-box';
    if (type === 'found') elStatusBox.classList.add('found');
    if (type === 'no-path') elStatusBox.classList.add('no-path');
    elStatusBox.innerHTML = html;
}

function enableButtons(enabled) {
    document.getElementById('btn-step').disabled = !enabled;
    // Run button disabled only if finished
    document.getElementById('btn-run').disabled = !enabled;
}

// ============================================================
// ANIMATION
// ============================================================
function startRunning() {
    if (state.running || state.finished) return;
    state.running = true;
    document.getElementById('btn-run').textContent = '⏸ Pausar';

    function tick() {
        if (!state.running || state.finished) {
            stopRunning();
            return;
        }
        const result = step();
        if (result === 'skip') {
            // Immediately do next step for skipped nodes
            state.timerId = setTimeout(tick, 100);
        } else if (result === 'found' || result === 'no-path' || result === 'done') {
            stopRunning();
        } else {
            state.timerId = setTimeout(tick, state.speed);
        }
    }

    tick();
}

function stopRunning() {
    state.running = false;
    clearTimeout(state.timerId);
    state.timerId = null;
    document.getElementById('btn-run').textContent = '⏩ Ejecutar';
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setup() {
    // Algorithm toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.algorithm = btn.dataset.algo;
            resetAlgorithm();
        });
    });

    // Graph selector
    document.getElementById('graph-select').addEventListener('change', (e) => {
        loadGraph(e.target.value);
    });

    // Step button
    document.getElementById('btn-step').addEventListener('click', () => {
        if (state.running) stopRunning();
        step();
    });

    // Run / Pause button
    document.getElementById('btn-run').addEventListener('click', () => {
        if (state.running) {
            stopRunning();
        } else {
            startRunning();
        }
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        resetAlgorithm();
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value);
        elSpeedValue.textContent = state.speed + 'ms';
    });

    // Handle canvas resize
    window.addEventListener('resize', handleResize);
    handleResize();
}

function handleResize() {
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth - 16; // account for padding
    const ratio = 420 / 700;
    canvas.width = Math.max(400, w);
    canvas.height = Math.round(canvas.width * ratio);
    render();
}

// ============================================================
// CANVAS roundRect POLYFILL
// ============================================================
if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        this.moveTo(x + r[0], y);
        this.lineTo(x + w - r[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        this.lineTo(x + w, y + h - r[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        this.lineTo(x + r[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        this.lineTo(x, y + r[0]);
        this.quadraticCurveTo(x, y, x + r[0], y);
        this.closePath();
    };
}

// ============================================================
// INIT
// ============================================================
function init() {
    setup();
    loadGraph('graph1');
    // Ensure canvas renders after browser layout pass
    requestAnimationFrame(() => {
        handleResize();
    });
}

document.addEventListener('DOMContentLoaded', init);
