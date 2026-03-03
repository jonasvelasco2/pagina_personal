/**
 * Calculadora f(n) = g(n) + h(n)
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORS
// ============================================================
const CLR = {
    start:    '#ff9900',
    goal:     '#16a34a',
    current:  '#0073bb',
    visited:  '#93c5fd',
    open:     '#06b6d4',
    unvisited:'#d1d5db',
    path:     '#22c55e',
    edgeDefault:'#cbd5e1',
    edgeVisited:'#60a5fa',
    edgePath:   '#22c55e',
    textDark: '#1e293b',
    textLight:'#ffffff',
    g:        '#3b82f6',
    h:        '#ef4444',
    f:        '#7b68ee',
};

// ============================================================
// GRAPHS — with true shortest path costs h*(n)
// ============================================================
const GRAPHS = {
    graph1: {
        label: 'A→F (Presentación)',
        nodes: [
            { id: 'A', x: 0.08, y: 0.50 },
            { id: 'B', x: 0.30, y: 0.15 },
            { id: 'C', x: 0.30, y: 0.85 },
            { id: 'D', x: 0.58, y: 0.15 },
            { id: 'E', x: 0.58, y: 0.85 },
            { id: 'F', x: 0.90, y: 0.50 },
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
        // h*(n): true shortest path cost to F
        hStar: { A: 7, B: 5, C: 5, D: 2, E: 6, F: 0 },
        // Default heuristic (admissible)
        hDefault: { A: 6, B: 4, C: 4, D: 2, E: 5, F: 0 },
    },
    graph2: {
        label: 'S→G (Actividad)',
        nodes: [
            { id: 'S', x: 0.06, y: 0.50 },
            { id: 'A', x: 0.25, y: 0.18 },
            { id: 'B', x: 0.25, y: 0.82 },
            { id: 'C', x: 0.48, y: 0.18 },
            { id: 'D', x: 0.48, y: 0.50 },
            { id: 'E', x: 0.48, y: 0.82 },
            { id: 'F', x: 0.72, y: 0.35 },
            { id: 'G', x: 0.94, y: 0.50 },
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
        hStar: { S: 8, A: 5, B: 7, C: 3, D: 5, E: 4, F: 2, G: 0 },
        hDefault: { S: 7, A: 4, B: 6, C: 3, D: 4, E: 4, F: 2, G: 0 },
    },
    graph3: {
        label: 'Red de ciudades (10 nodos)',
        nodes: [
            { id: 'Ori', x: 0.04, y: 0.50 },
            { id: 'P1',  x: 0.18, y: 0.18 },
            { id: 'P2',  x: 0.18, y: 0.82 },
            { id: 'P3',  x: 0.36, y: 0.10 },
            { id: 'P4',  x: 0.36, y: 0.50 },
            { id: 'P5',  x: 0.36, y: 0.90 },
            { id: 'P6',  x: 0.56, y: 0.20 },
            { id: 'P7',  x: 0.56, y: 0.75 },
            { id: 'P8',  x: 0.76, y: 0.55 },
            { id: 'Dst', x: 0.96, y: 0.50 },
        ],
        edges: [
            { from: 'Ori', to: 'P1', w: 3 },
            { from: 'Ori', to: 'P2', w: 5 },
            { from: 'Ori', to: 'P4', w: 8 },
            { from: 'P1',  to: 'P3', w: 2 },
            { from: 'P1',  to: 'P4', w: 4 },
            { from: 'P2',  to: 'P4', w: 3 },
            { from: 'P2',  to: 'P5', w: 2 },
            { from: 'P3',  to: 'P6', w: 4 },
            { from: 'P4',  to: 'P6', w: 2 },
            { from: 'P4',  to: 'P7', w: 3 },
            { from: 'P5',  to: 'P7', w: 5 },
            { from: 'P6',  to: 'P8', w: 3 },
            { from: 'P7',  to: 'P8', w: 2 },
            { from: 'P8',  to: 'Dst', w: 4 },
            { from: 'P6',  to: 'Dst', w: 8 },
        ],
        start: 'Ori', goal: 'Dst',
        hStar: { Ori: 12, P1: 11, P2: 10, P3: 11, P4: 9, P5: 11, P6: 7, P7: 6, P8: 4, Dst: 0 },
        hDefault: { Ori: 10, P1: 9, P2: 8, P3: 9, P4: 7, P5: 9, P6: 6, P7: 5, P8: 3, Dst: 0 },
    },
    graph4: {
        label: 'Laberinto (12 nodos)',
        nodes: [
            { id: 'S',  x: 0.04, y: 0.50 },
            { id: 'A',  x: 0.16, y: 0.15 },
            { id: 'B',  x: 0.16, y: 0.50 },
            { id: 'C',  x: 0.16, y: 0.85 },
            { id: 'D',  x: 0.34, y: 0.15 },
            { id: 'E',  x: 0.34, y: 0.50 },
            { id: 'F',  x: 0.34, y: 0.85 },
            { id: 'H',  x: 0.54, y: 0.30 },
            { id: 'I',  x: 0.54, y: 0.70 },
            { id: 'J',  x: 0.72, y: 0.30 },
            { id: 'K',  x: 0.72, y: 0.70 },
            { id: 'G',  x: 0.96, y: 0.50 },
        ],
        edges: [
            { from: 'S', to: 'A', w: 2 },
            { from: 'S', to: 'B', w: 1 },
            { from: 'S', to: 'C', w: 4 },
            { from: 'A', to: 'D', w: 3 },
            { from: 'B', to: 'D', w: 5 },
            { from: 'B', to: 'E', w: 2 },
            { from: 'B', to: 'F', w: 6 },
            { from: 'C', to: 'F', w: 1 },
            { from: 'D', to: 'H', w: 2 },
            { from: 'E', to: 'H', w: 3 },
            { from: 'E', to: 'I', w: 2 },
            { from: 'F', to: 'I', w: 3 },
            { from: 'H', to: 'J', w: 1 },
            { from: 'H', to: 'K', w: 4 },
            { from: 'I', to: 'K', w: 2 },
            { from: 'J', to: 'G', w: 5 },
            { from: 'K', to: 'G', w: 3 },
            { from: 'J', to: 'K', w: 2 },
        ],
        start: 'S', goal: 'G',
        hStar: { S: 10, A: 8, B: 9, C: 10, D: 8, E: 7, F: 8, H: 6, I: 5, J: 5, K: 3, G: 0 },
        hDefault: { S: 9, A: 7, B: 8, C: 9, D: 7, E: 6, F: 7, H: 5, I: 4, J: 4, K: 3, G: 0 },
    },
};

// ============================================================
// STATE
// ============================================================
let graphId = 'graph1';
let graphDef = GRAPHS.graph1;
let adj = {};
let hValues = {};        // user-editable h(n)
let selectedNode = null; // node clicked for formula display

// A* state
let openList = [];       // [{id, g, f}]
let closedSet = new Set();
let gScore = {};
let cameFrom = {};
let stepLog = [];        // [{step, node, g, h, f, action}]
let stepCount = 0;
let finished = false;
let foundPath = false;
let pathNodes = new Set();
let currentNode = null;
let running = false;
let timerId = null;
let speed = 800;

// ============================================================
// DOM
// ============================================================
let canvas, ctx;

function cacheDom() {
    canvas = document.getElementById('graph-canvas');
    ctx = canvas.getContext('2d');
}

// ============================================================
// GRAPH HELPERS
// ============================================================
function buildAdj() {
    adj = {};
    graphDef.nodes.forEach(n => { adj[n.id] = []; });
    graphDef.edges.forEach(e => {
        adj[e.from].push({ to: e.to, w: e.w });
        adj[e.to].push({ to: e.from, w: e.w });
    });
}

function loadGraph(id) {
    graphId = id;
    graphDef = GRAPHS[id];
    buildAdj();
    hValues = { ...graphDef.hDefault };
    selectedNode = null;
    buildHTable();
    resetAlgorithm();
}

// ============================================================
// HEURISTIC TABLE
// ============================================================
function buildHTable() {
    const tbody = document.getElementById('h-table-body');
    tbody.innerHTML = '';
    graphDef.nodes.forEach(n => {
        const tr = document.createElement('tr');
        const hStar = graphDef.hStar[n.id];
        const hVal = hValues[n.id];
        const admissible = hVal <= hStar;

        tr.innerHTML = `
            <td class="node-label">${n.id}</td>
            <td><input type="number" min="0" max="99" value="${hVal}" data-node="${n.id}" class="h-input"></td>
            <td>${hStar}</td>
            <td class="${admissible ? 'admissible' : 'inadmissible'}">${admissible ? '✓ Sí' : '✗ No'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Event listeners
    document.querySelectorAll('.h-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const nodeId = e.target.dataset.node;
            hValues[nodeId] = Math.max(0, parseInt(e.target.value) || 0);
            buildHTable();
            checkAdmissibility();
            if (!finished && stepCount === 0) resetAlgorithm();
        });
    });

    checkAdmissibility();
}

function checkAdmissibility() {
    let allAdm = true;
    graphDef.nodes.forEach(n => {
        if (hValues[n.id] > graphDef.hStar[n.id]) allAdm = false;
    });
    const label = document.getElementById('admissibility-label');
    if (allAdm) {
        label.textContent = '✓ Heurística admisible';
        label.className = 'panel-subtitle admissible';
    } else {
        label.textContent = '✗ No admisible';
        label.className = 'panel-subtitle inadmissible';
    }
}

// ============================================================
// A* ALGORITHM
// ============================================================
function resetAlgorithm() {
    stopRunning();
    openList = [];
    closedSet = new Set();
    gScore = {};
    cameFrom = {};
    stepLog = [];
    stepCount = 0;
    finished = false;
    foundPath = false;
    pathNodes = new Set();
    currentNode = null;

    const s = graphDef.start;
    gScore[s] = 0;
    openList.push({ id: s, g: 0, f: 0 + hValues[s] });

    renderAll();
    updateFormula(null);
    renderPQ();
    renderStepTable();
    setStatus('default', 'Edita los valores <strong>h(n)</strong> en la tabla y presiona <strong>Paso A*</strong> para ejecutar el algoritmo.');
    document.getElementById('btn-step').disabled = false;
    document.getElementById('btn-run').disabled = false;
}

function astarStep() {
    if (finished) return 'done';

    if (openList.length === 0) {
        finished = true;
        setStatus('no-path', '<strong>No se encontró camino.</strong> La lista abierta está vacía.');
        document.getElementById('btn-step').disabled = true;
        document.getElementById('btn-run').disabled = true;
        renderAll();
        return 'no-path';
    }

    // Pick node with lowest f
    openList.sort((a, b) => a.f - b.f);
    const curr = openList.shift();
    currentNode = curr.id;

    if (closedSet.has(curr.id)) {
        return 'skip';
    }

    closedSet.add(curr.id);
    stepCount++;

    const gVal = gScore[curr.id] || 0;
    const hVal = hValues[curr.id] || 0;
    const fVal = gVal + hVal;

    stepLog.push({
        step: stepCount,
        node: curr.id,
        g: gVal,
        h: hVal,
        f: fVal,
        action: curr.id === graphDef.goal ? '¡META!' : 'Expandir',
    });

    // Select this node for formula display
    selectedNode = curr.id;
    updateFormula(curr.id);

    // Check goal
    if (curr.id === graphDef.goal) {
        finished = true;
        foundPath = true;
        reconstructPath();
        renderAll();
        renderPQ();
        renderStepTable();
        const pathArr = getPathArray();
        setStatus('found', `<strong>¡Meta encontrada!</strong> Camino: ${pathArr.join(' → ')} (costo: ${gVal})`);
        document.getElementById('btn-step').disabled = true;
        document.getElementById('btn-run').disabled = true;
        return 'found';
    }

    // Expand neighbors
    const neighbors = adj[curr.id] || [];
    for (const nb of neighbors) {
        if (closedSet.has(nb.to)) continue;
        const tentG = gVal + nb.w;
        if (tentG < (gScore[nb.to] ?? Infinity)) {
            gScore[nb.to] = tentG;
            cameFrom[nb.to] = curr.id;
            const fNb = tentG + (hValues[nb.to] || 0);
            openList.push({ id: nb.to, g: tentG, f: fNb });
        }
    }

    setStatus('default',
        `Paso ${stepCount}: expandir <strong>${curr.id}</strong> — ` +
        `g=${gVal}, h=${hVal}, f=${fVal}`
    );

    renderAll();
    renderPQ();
    renderStepTable();
    return 'continue';
}

function reconstructPath() {
    pathNodes = new Set();
    let n = graphDef.goal;
    while (n) {
        pathNodes.add(n);
        n = cameFrom[n] || null;
    }
}

function getPathArray() {
    const arr = [];
    let n = graphDef.goal;
    while (n) {
        arr.unshift(n);
        n = cameFrom[n] || null;
    }
    return arr;
}

// ============================================================
// FORMULA DISPLAY
// ============================================================
function updateFormula(nodeId) {
    const elNode = document.getElementById('f-node');
    const elG = document.getElementById('f-g');
    const elH = document.getElementById('f-h');
    const elF = document.getElementById('f-f');
    const barG = document.getElementById('bar-g');
    const barH = document.getElementById('bar-h');
    const diagStart = document.getElementById('diag-start');
    const diagN = document.getElementById('diag-n');
    const diagGoal = document.getElementById('diag-goal');
    const diagG = document.getElementById('diag-g');
    const diagH = document.getElementById('diag-h');

    diagStart.textContent = graphDef.start;
    diagGoal.textContent = graphDef.goal;

    if (!nodeId || gScore[nodeId] === undefined) {
        elNode.textContent = '—';
        elG.textContent = '—';
        elH.textContent = '—';
        elF.textContent = '—';
        barG.style.width = '0%';
        barH.style.width = '0%';
        barG.textContent = '';
        barH.textContent = '';
        diagN.textContent = '?';
        diagG.textContent = '—';
        diagH.textContent = '—';
        return;
    }

    const g = gScore[nodeId] || 0;
    const h = hValues[nodeId] || 0;
    const f = g + h;

    elNode.textContent = nodeId;
    elG.textContent = g;
    elH.textContent = h;
    elF.textContent = f;

    const maxF = Math.max(f, 1);
    const gPct = (g / maxF) * 100;
    const hPct = (h / maxF) * 100;
    barG.style.width = gPct + '%';
    barH.style.width = hPct + '%';
    barG.textContent = g > 0 ? `g=${g}` : '';
    barH.textContent = h > 0 ? `h=${h}` : '';

    diagN.textContent = nodeId;
    diagG.textContent = g;
    diagH.textContent = h;
}

// ============================================================
// PRIORITY QUEUE DISPLAY
// ============================================================
function renderPQ() {
    const container = document.getElementById('pq-items');
    if (openList.length === 0 && !finished) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">Vacía</span>';
        return;
    }
    if (finished && openList.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">Algoritmo terminado</span>';
        return;
    }

    const sorted = [...openList].sort((a, b) => a.f - b.f);
    let html = '';
    sorted.forEach((item, idx) => {
        const cls = idx === 0 ? 'pq-item current' : 'pq-item';
        html += `<div class="${cls}"><span class="pq-node">${item.id}</span> <span class="pq-f">f=${item.f}</span></div>`;
    });
    container.innerHTML = html;
}

// ============================================================
// STEP TABLE
// ============================================================
function renderStepTable() {
    const tbody = document.getElementById('step-table-body');
    let html = '';
    stepLog.forEach((entry, idx) => {
        const isCurrent = idx === stepLog.length - 1 && !finished;
        const isPath = pathNodes.has(entry.node) && finished && foundPath;
        const cls = isCurrent ? 'current-row' : (isPath ? 'path-row' : '');
        html += `<tr class="${cls}">
            <td>${entry.step}</td>
            <td><strong>${entry.node}</strong></td>
            <td style="color:${CLR.g}">${entry.g}</td>
            <td style="color:${CLR.h}">${entry.h}</td>
            <td style="color:${CLR.f}; font-weight:700">${entry.f}</td>
            <td>${entry.action}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ============================================================
// GRAPH RENDERING
// ============================================================
function nodeScreenPos(n) {
    const pad = 36;
    return {
        x: pad + n.x * (canvas.width - 2 * pad),
        y: pad + n.y * (canvas.height - 2 * pad),
    };
}

function nodeColor(id) {
    if (pathNodes.has(id) && finished) {
        if (id === graphDef.start) return CLR.start;
        if (id === graphDef.goal) return CLR.goal;
        return CLR.path;
    }
    if (id === currentNode && !finished) return CLR.current;
    if (id === graphDef.start) return CLR.start;
    if (id === graphDef.goal) return CLR.goal;
    if (closedSet.has(id)) return CLR.visited;
    if (openList.some(o => o.id === id)) return CLR.open;
    return CLR.unvisited;
}

function isPathEdge(a, b) {
    if (!finished || !foundPath) return false;
    return (pathNodes.has(a) && pathNodes.has(b) && (cameFrom[a] === b || cameFrom[b] === a));
}

function renderGraph() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const nodeMap = {};
    graphDef.nodes.forEach(n => { nodeMap[n.id] = n; });

    // Edges
    graphDef.edges.forEach(e => {
        const from = nodeScreenPos(nodeMap[e.from]);
        const to = nodeScreenPos(nodeMap[e.to]);
        const onPath = isPathEdge(e.from, e.to);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = onPath ? CLR.edgePath : (closedSet.has(e.from) && closedSet.has(e.to) ? CLR.edgeVisited : CLR.edgeDefault);
        ctx.lineWidth = onPath ? 4 : 2;
        ctx.stroke();

        // Weight label
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x, dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const lx = mx + nx * 14, ly = my + ny * 14;

        ctx.font = '700 12px "Source Sans Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#64748b';
        ctx.fillText(String(e.w), lx, ly);
    });

    // Nodes — dynamic radius based on label length
    const maxLabel = Math.max(...graphDef.nodes.map(n => n.id.length));
    const R = maxLabel <= 1 ? 22 : (maxLabel <= 2 ? 24 : 26);
    const fontSize = maxLabel <= 2 ? 14 : 11;
    graphDef.nodes.forEach(n => {
        const pos = nodeScreenPos(n);
        const bg = nodeColor(n.id);
        const isSelected = n.id === selectedNode;

        // Selection ring
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, R + 5, 0, Math.PI * 2);
            ctx.strokeStyle = CLR.f;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = bg === CLR.unvisited ? '#b0b8c1' : bg;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.font = `700 ${fontSize}px "Source Sans Pro", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = [CLR.current, CLR.goal, CLR.path, CLR.start].includes(bg) ? CLR.textLight : CLR.textDark;
        ctx.fillText(n.id, pos.x, pos.y + 1);

        // g/f values below node (if explored)
        if (gScore[n.id] !== undefined && closedSet.has(n.id)) {
            const g = gScore[n.id];
            const f = g + (hValues[n.id] || 0);
            ctx.font = '600 10px "Source Sans Pro", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = CLR.g;
            ctx.fillText(`g=${g}`, pos.x - 16, pos.y + R + 4);
            ctx.fillStyle = CLR.f;
            ctx.fillText(`f=${f}`, pos.x + 16, pos.y + R + 4);
        }
    });
}

function renderAll() {
    renderGraph();
}

// ============================================================
// CANVAS CLICK — select node
// ============================================================
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const maxL = Math.max(...graphDef.nodes.map(n => n.id.length));
    const R = maxL <= 1 ? 22 : (maxL <= 2 ? 24 : 26);
    for (const n of graphDef.nodes) {
        const pos = nodeScreenPos(n);
        const dx = mx - pos.x, dy = my - pos.y;
        if (dx * dx + dy * dy <= (R + 5) * (R + 5)) {
            selectedNode = n.id;
            if (gScore[n.id] !== undefined) {
                updateFormula(n.id);
            } else {
                // Show h only
                const elNode = document.getElementById('f-node');
                const elG = document.getElementById('f-g');
                const elH = document.getElementById('f-h');
                const elF = document.getElementById('f-f');
                elNode.textContent = n.id;
                elG.textContent = '?';
                elH.textContent = hValues[n.id] || 0;
                elF.textContent = '?';
                document.getElementById('bar-g').style.width = '0%';
                document.getElementById('bar-h').style.width = '50%';
                document.getElementById('bar-g').textContent = '';
                document.getElementById('bar-h').textContent = `h=${hValues[n.id]}`;
                document.getElementById('diag-n').textContent = n.id;
                document.getElementById('diag-g').textContent = '?';
                document.getElementById('diag-h').textContent = hValues[n.id];
            }
            renderAll();
            return;
        }
    }
}

// ============================================================
// STATUS
// ============================================================
function setStatus(type, html) {
    const el = document.getElementById('status-box');
    el.className = 'status-box';
    if (type === 'found') el.classList.add('found');
    if (type === 'no-path') el.classList.add('no-path');
    el.innerHTML = html;
}

// ============================================================
// ANIMATION
// ============================================================
function startRunning() {
    if (running || finished) return;
    running = true;
    document.getElementById('btn-run').textContent = '⏸ Pausar';

    function tick() {
        if (!running || finished) { stopRunning(); return; }
        const result = astarStep();
        if (result === 'skip') {
            timerId = setTimeout(tick, 0);
        } else if (result === 'found' || result === 'no-path' || result === 'done') {
            stopRunning();
        } else {
            timerId = setTimeout(tick, speed);
        }
    }
    tick();
}

function stopRunning() {
    running = false;
    clearTimeout(timerId);
    timerId = null;
    document.getElementById('btn-run').textContent = '⏩ Ejecutar';
}

// ============================================================
// RESIZE
// ============================================================
function handleResize() {
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth - 16;
    const ratio = 360 / 520;
    canvas.width = Math.max(280, w);
    canvas.height = Math.round(canvas.width * ratio);
    renderAll();
}

// ============================================================
// EVENTS
// ============================================================
function setup() {
    document.getElementById('graph-select').addEventListener('change', (e) => {
        loadGraph(e.target.value);
    });

    document.getElementById('btn-step').addEventListener('click', () => {
        if (running) stopRunning();
        let result = 'skip';
        while (result === 'skip') {
            result = astarStep();
        }
    });

    document.getElementById('btn-run').addEventListener('click', () => {
        if (running) { stopRunning(); return; }
        startRunning();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        resetAlgorithm();
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        document.getElementById('speed-value').textContent = speed + 'ms';
    });

    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', handleResize);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setup();
    loadGraph('graph1');
    requestAnimationFrame(() => {
        handleResize();
    });
});
