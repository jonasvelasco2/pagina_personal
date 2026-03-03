/**
 * Árbol de búsqueda en vivo
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORS
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
    edgeTree:    '#94a3b8',
    textDark:  '#1e293b',
    textLight: '#ffffff',
    weightBg:  '#ffffff',
};

// ============================================================
// GRAPHS
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
        start: 'A', goal: 'F',
    },
    graph2: {
        label: 'S→G (Actividad)',
        nodes: [
            { id: 'S', x: 0.08, y: 0.50 },
            { id: 'A', x: 0.28, y: 0.20 },
            { id: 'B', x: 0.28, y: 0.80 },
            { id: 'C', x: 0.50, y: 0.20 },
            { id: 'D', x: 0.50, y: 0.50 },
            { id: 'E', x: 0.50, y: 0.80 },
            { id: 'F', x: 0.72, y: 0.35 },
            { id: 'G', x: 0.92, y: 0.50 },
        ],
        edges: [
            { from: 'S', to: 'A', w: 3 },
            { from: 'S', to: 'B', w: 5 },
            { from: 'A', to: 'C', w: 2 },
            { from: 'A', to: 'D', w: 4 },
            { from: 'B', to: 'D', w: 2 },
            { from: 'B', to: 'E', w: 6 },
            { from: 'C', to: 'F', w: 1 },
            { from: 'D', to: 'F', w: 3 },
            { from: 'E', to: 'G', w: 4 },
            { from: 'F', to: 'G', w: 2 },
        ],
        start: 'S', goal: 'G',
    },
    graph3: {
        label: 'Grafo grande',
        nodes: [
            { id: '1', x: 0.08, y: 0.50 },
            { id: '2', x: 0.25, y: 0.15 },
            { id: '3', x: 0.25, y: 0.50 },
            { id: '4', x: 0.25, y: 0.85 },
            { id: '5', x: 0.50, y: 0.15 },
            { id: '6', x: 0.50, y: 0.50 },
            { id: '7', x: 0.50, y: 0.85 },
            { id: '8', x: 0.75, y: 0.30 },
            { id: '9', x: 0.75, y: 0.70 },
            { id: '10', x: 0.92, y: 0.50 },
        ],
        edges: [
            { from: '1', to: '2' }, { from: '1', to: '3' }, { from: '1', to: '4' },
            { from: '2', to: '5' }, { from: '3', to: '5' }, { from: '3', to: '6' },
            { from: '4', to: '7' }, { from: '5', to: '8' }, { from: '6', to: '8' },
            { from: '6', to: '9' }, { from: '7', to: '9' }, { from: '8', to: '10' },
            { from: '9', to: '10' },
        ],
        start: '1', goal: '10',
    },
};

// ============================================================
// STATE
// ============================================================
let state = {
    algorithm: 'dfs',
    graphId: 'graph1',
    nodes: [],
    adj: {},
    start: null,
    goal: null,
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
    running: false,
    speed: 600,
    timerId: null,
    // Tree structure: treeNodes[id] = { id, parentId, children[], depth }
    treeNodes: {},
    treeRoot: null,
    maxDepth: 0,
};

// ============================================================
// DOM
// ============================================================
const graphCanvas = document.getElementById('graph-canvas');
const treeCanvas = document.getElementById('tree-canvas');
const gCtx = graphCanvas.getContext('2d');
const tCtx = treeCanvas.getContext('2d');
const elGraphInfo = document.getElementById('graph-info');
const elTreeInfo = document.getElementById('tree-info');
const elStatusBox = document.getElementById('status-box');
const elSpeedValue = document.getElementById('speed-value');
const metricStep = document.getElementById('metric-step');
const metricExplored = document.getElementById('metric-explored');
const metricDepth = document.getElementById('metric-depth');
const metricPath = document.getElementById('metric-path');
const metricStatus = document.getElementById('metric-status');

// ============================================================
// GRAPH HELPERS
// ============================================================
function buildAdjacency(graphDef) {
    const adj = {};
    graphDef.nodes.forEach(n => { adj[n.id] = []; });
    graphDef.edges.forEach(e => {
        adj[e.from].push(e.to);
        adj[e.to].push(e.from);
    });
    Object.keys(adj).forEach(k => {
        adj[k].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
    elGraphInfo.textContent = `${def.nodes.length} nodos · ${def.edges.length} aristas`;
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
    state.treeNodes = {};
    state.treeRoot = null;
    state.maxDepth = 0;

    renderAll();
    updateMetrics();
    setStatus('default', 'Presiona <strong>Paso</strong> para iniciar la búsqueda.');
    enableButtons(true);
}

function step() {
    if (state.finished) return 'done';
    if (!state.started) state.started = true;

    if (state.frontier.length === 0) {
        state.finished = true;
        setStatus('no-path', 'No se encontró camino de <strong>' + state.start + '</strong> a <strong>' + state.goal + '</strong>.');
        enableButtons(false);
        renderAll();
        updateMetrics();
        return 'no-path';
    }

    let current;
    if (state.algorithm === 'dfs') {
        current = state.frontier.pop();
    } else {
        current = state.frontier.shift();
    }

    state.stepCount++;
    state.currentNode = current;

    if (state.visited.has(current)) {
        renderAll();
        updateMetrics();
        setStatus('default', `Paso ${state.stepCount}: <strong>${current}</strong> ya fue visitado, se descarta.`);
        return 'skip';
    }

    // Visit
    state.visited.add(current);
    state.visitOrder.push(current);

    // Add to tree
    addTreeNode(current);

    // Check goal
    if (current === state.goal) {
        state.foundGoal = true;
        state.finished = true;
        state.path = reconstructPath();
        renderAll();
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
        if (!state.visited.has(nb)) {
            if (state.algorithm === 'dfs') {
                if (!(nb in state.parent)) {
                    state.parent[nb] = current;
                }
                toAdd.push(nb);
            } else {
                if (!state.frontier.includes(nb)) {
                    state.parent[nb] = current;
                    state.frontier.push(nb);
                    toAdd.push(nb);
                }
            }
        }
    }

    if (state.algorithm === 'dfs') {
        for (let i = toAdd.length - 1; i >= 0; i--) {
            state.frontier.push(toAdd[i]);
        }
    }

    // Add frontier nodes to tree as children (if not already in tree)
    toAdd.forEach(nb => {
        addTreeNode(nb);
    });

    const structName = state.algorithm === 'dfs' ? 'Pila' : 'Cola';
    const frontierStr = '[' + [...state.frontier].join(', ') + ']';
    setStatus('default',
        `Paso ${state.stepCount}: Visitamos <strong>${current}</strong>. ` +
        `Vecinos añadidos: ${toAdd.length > 0 ? toAdd.join(', ') : 'ninguno'}. ` +
        `${structName}: ${frontierStr}`
    );

    renderAll();
    updateMetrics();
    return 'continue';
}

function addTreeNode(id) {
    if (state.treeNodes[id]) return;

    const parentId = state.parent[id] || null;
    const depth = parentId && state.treeNodes[parentId] ? state.treeNodes[parentId].depth + 1 : 0;

    state.treeNodes[id] = {
        id: id,
        parentId: parentId,
        children: [],
        depth: depth,
    };

    if (parentId && state.treeNodes[parentId]) {
        state.treeNodes[parentId].children.push(id);
    }

    if (depth === 0) state.treeRoot = id;
    if (depth > state.maxDepth) state.maxDepth = depth;
}

function reconstructPath() {
    const path = [];
    let node = state.goal;
    while (node != null) {
        path.unshift(node);
        node = state.parent[node] != null ? state.parent[node] : null;
    }
    return path;
}

// ============================================================
// RENDERING — GRAPH CANVAS (left)
// ============================================================
function nodeScreenPos(n, canvas) {
    const pad = 36;
    return {
        x: pad + n.x * (canvas.width - 2 * pad),
        y: pad + n.y * (canvas.height - 2 * pad),
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
            if ((fromId === a && toId === b) || (fromId === b && toId === a)) return C.edgePath;
        }
    }
    if (state.visited.has(fromId) && state.visited.has(toId)) return C.edgeVisited;
    return C.edgeDefault;
}

function renderGraph() {
    const ctx = gCtx;
    const w = graphCanvas.width, h = graphCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    if (state.nodes.length === 0) return;

    const graphDef = GRAPHS[state.graphId];
    const nodeMap = {};
    state.nodes.forEach(n => { nodeMap[n.id] = n; });

    // Edges
    graphDef.edges.forEach(e => {
        const from = nodeScreenPos(nodeMap[e.from], graphCanvas);
        const to = nodeScreenPos(nodeMap[e.to], graphCanvas);
        const color = edgeColor(e.from, e.to);
        const width = (state.path.length >= 2 && isPathEdge(e.from, e.to)) ? 4 : 2;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        // Weight
        if (e.w != null) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const dx = to.x - from.x, dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const lx = mx + nx * 12, ly = my + ny * 12;

            ctx.font = '600 11px "Source Sans Pro", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#64748b';
            ctx.fillText(String(e.w), lx, ly);
        }
    });

    // Nodes
    const R = 20;
    state.nodes.forEach(n => {
        const pos = nodeScreenPos(n, graphCanvas);
        const bg = nodeColor(n.id);
        const fg = nodeTextColor(n.id);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = bg === C.unvisited ? '#b0b8c1' : bg;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '700 14px "Source Sans Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fg;
        ctx.fillText(n.id, pos.x, pos.y + 1);
    });
}

function isPathEdge(a, b) {
    for (let i = 0; i < state.path.length - 1; i++) {
        const x = state.path[i], y = state.path[i + 1];
        if ((a === x && b === y) || (a === y && b === x)) return true;
    }
    return false;
}

// ============================================================
// RENDERING — TREE CANVAS (right)
// ============================================================
function computeTreeLayout() {
    // Assign x positions using a simple recursive layout
    const layout = {}; // id -> { x, y }
    if (!state.treeRoot || !state.treeNodes[state.treeRoot]) return layout;

    const maxD = state.maxDepth + 1;
    const w = treeCanvas.width;
    const h = treeCanvas.height;
    const padX = 30, padY = 40;
    const usableH = h - 2 * padY;
    const levelH = maxD > 1 ? usableH / maxD : usableH;

    // Count leaves under each node to assign proportional width
    function countLeaves(id) {
        const node = state.treeNodes[id];
        if (!node || node.children.length === 0) return 1;
        let total = 0;
        node.children.forEach(c => { total += countLeaves(c); });
        return total;
    }

    const totalLeaves = countLeaves(state.treeRoot);

    function assignPositions(id, leftX, rightX) {
        const node = state.treeNodes[id];
        if (!node) return;

        const cx = (leftX + rightX) / 2;
        const cy = padY + node.depth * levelH;
        layout[id] = { x: cx, y: cy };

        if (node.children.length === 0) return;

        const totalChildLeaves = node.children.reduce((sum, c) => sum + countLeaves(c), 0);
        let currentLeft = leftX;
        node.children.forEach(c => {
            const childLeaves = countLeaves(c);
            const childWidth = ((rightX - leftX) * childLeaves) / totalChildLeaves;
            assignPositions(c, currentLeft, currentLeft + childWidth);
            currentLeft += childWidth;
        });
    }

    assignPositions(state.treeRoot, padX, w - padX);
    return layout;
}

function treeNodeColor(id) {
    if (state.path.length > 0 && state.path.includes(id)) {
        if (id === state.start) return C.start;
        if (id === state.goal) return C.goal;
        return C.path;
    }
    if (id === state.currentNode && !state.finished) return C.current;
    if (id === state.start) return C.start;
    if (id === state.goal) return C.goal;
    if (state.visited.has(id)) return C.visited;
    return C.frontier;
}

function treeNodeTextColor(id) {
    const bg = treeNodeColor(id);
    if ([C.current, C.goal, C.path, C.start].includes(bg)) return C.textLight;
    return C.textDark;
}

function renderTree() {
    const ctx = tCtx;
    const w = treeCanvas.width, h = treeCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    if (!state.treeRoot || Object.keys(state.treeNodes).length === 0) {
        ctx.font = '400 14px "Source Sans Pro", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('El árbol se construirá al iniciar la búsqueda', w / 2, h / 2);
        return;
    }

    const layout = computeTreeLayout();
    const R = 18;

    // Draw edges
    Object.keys(state.treeNodes).forEach(id => {
        const node = state.treeNodes[id];
        if (!node || !layout[id]) return;
        node.children.forEach(childId => {
            if (!layout[childId]) return;
            const from = layout[id];
            const to = layout[childId];

            const isOnPath = state.path.length >= 2 && isPathEdge(id, childId);
            const childVisited = state.visited.has(childId);

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);

            if (isOnPath) {
                ctx.strokeStyle = C.edgePath;
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
            } else if (childVisited) {
                ctx.strokeStyle = C.edgeVisited;
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = C.edgeDefault;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        });
    });

    // Draw nodes
    Object.keys(state.treeNodes).forEach(id => {
        if (!layout[id]) return;
        const pos = layout[id];
        const bg = treeNodeColor(id);
        const fg = treeNodeTextColor(id);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = bg;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '700 13px "Source Sans Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fg;
        ctx.fillText(id, pos.x, pos.y + 1);
    });

    // Depth labels on the left
    const maxD = state.maxDepth;
    const padY = 40;
    const usableH = h - 2 * padY;
    const levelH = (maxD + 1) > 1 ? usableH / (maxD + 1) : usableH;
    ctx.font = '600 10px "Source Sans Pro", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let d = 0; d <= maxD; d++) {
        const y = padY + d * levelH;
        ctx.fillText(`d=${d}`, 4, y);
    }
}

// ============================================================
// RENDER ALL
// ============================================================
function renderAll() {
    renderGraph();
    renderTree();
    elTreeInfo.textContent = `Profundidad: ${state.maxDepth}`;
}

// ============================================================
// METRICS & STATUS
// ============================================================
function updateMetrics() {
    metricStep.textContent = state.stepCount;
    metricExplored.textContent = state.visitOrder.length;
    metricDepth.textContent = state.maxDepth;

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
    } else if (state.finished && !state.foundGoal) {
        metricStatus.textContent = 'Sin camino';
        metricStatus.classList.remove('success');
    } else if (state.started) {
        metricStatus.textContent = 'Buscando…';
        metricStatus.classList.remove('success');
    } else {
        metricStatus.textContent = 'Listo';
        metricStatus.classList.remove('success');
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
        if (!state.running || state.finished) { stopRunning(); return; }
        const result = step();
        if (result === 'skip') {
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
// CANVAS RESIZE
// ============================================================
function handleResize() {
    [graphCanvas, treeCanvas].forEach(canvas => {
        const wrap = canvas.parentElement;
        const w = wrap.clientWidth - 16;
        const ratio = 380 / 560;
        canvas.width = Math.max(280, w);
        canvas.height = Math.round(canvas.width * ratio);
    });
    renderAll();
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setup() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.algorithm = btn.dataset.algo;
            resetAlgorithm();
        });
    });

    document.getElementById('graph-select').addEventListener('change', (e) => {
        loadGraph(e.target.value);
    });

    document.getElementById('btn-step').addEventListener('click', () => {
        if (state.running) stopRunning();
        step();
    });

    document.getElementById('btn-run').addEventListener('click', () => {
        if (state.running) stopRunning();
        else startRunning();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        resetAlgorithm();
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value);
        elSpeedValue.textContent = state.speed + 'ms';
    });

    window.addEventListener('resize', handleResize);
}

// ============================================================
// INIT
// ============================================================
function init() {
    setup();
    loadGraph('graph1');
    requestAnimationFrame(() => {
        handleResize();
    });
}

document.addEventListener('DOMContentLoaded', init);
