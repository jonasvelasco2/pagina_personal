/**
 * Subconjuntos que suman K — Backtracking con poda
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORS
// ============================================================
const CLR = {
    bg:        '#f8fafc',
    exploring: '#0073bb',
    solution:  '#16a34a',
    pruned:    '#ef4444',
    visited:   '#93c5fd',
    unvisited: '#d1d5db',
    edgeDefault:'#cbd5e1',
    edgeActive: '#0073bb',
    edgePruned: '#fca5a5',
    edgeSolution:'#16a34a',
    text:      '#1e293b',
    textLight: '#ffffff',
};

// ============================================================
// STATE
// ============================================================
let nums = [1, 2, 3, 4, 5];
let K = 7;
let speed = 400;

// Tree structure
let treeNodes = [];   // [{id, depth, index, label, state, sum, included, parentId, branch}]
let treeEdges = [];   // [{from, to, label, state}]
let nodeIdCounter = 0;

// Algorithm
let btGenerator = null;
let btFinished = false;
let running = false;
let timerId = null;
let solutions = [];   // arrays of included numbers
let stats = { explored: 0, pruned: 0, solutions: 0, total: 0 };
let currentSubset = [];  // currently included elements
let currentDecisions = []; // [{num, decision: 'in'|'out'|'pending'}]

// ============================================================
// DOM
// ============================================================
let canvas, ctx;

function cacheDom() {
    canvas = document.getElementById('tree-canvas');
    ctx = canvas.getContext('2d');
}

// ============================================================
// TREE BUILDING
// ============================================================
function createNode(depth, index, label, parentId, branch) {
    const id = nodeIdCounter++;
    const node = {
        id,
        depth,
        index,     // position among siblings at this depth
        label,
        state: 'unvisited', // 'unvisited' | 'exploring' | 'visited' | 'solution' | 'pruned'
        sum: 0,
        included: [],
        parentId,
        branch,    // 'include' | 'exclude' | 'root'
        x: 0, y: 0,
    };
    treeNodes.push(node);
    if (parentId !== null) {
        treeEdges.push({ from: parentId, to: id, label: branch === 'include' ? `+${label}` : `−${label}`, state: 'default' });
    }
    return id;
}

function buildTree() {
    treeNodes = [];
    treeEdges = [];
    nodeIdCounter = 0;

    // Build full binary tree recursively
    function build(depth, parentId, branch, label) {
        const nodeLabel = depth === 0 ? '∅' : label;
        const id = createNode(depth, 0, nodeLabel, parentId, branch);

        if (depth < nums.length) {
            const nextNum = nums[depth];
            build(depth + 1, id, 'include', `+${nextNum}`);
            build(depth + 1, id, 'exclude', `−${nextNum}`);
        }
        return id;
    }

    build(0, null, 'root', '∅');
    stats.total = treeNodes.length;

    // Layout
    layoutTree();
}

function layoutTree() {
    const maxDepth = nums.length;
    // Assign index within each depth level using in-order traversal
    const depthCounters = {};

    function assignIndex(nodeId) {
        const node = treeNodes[nodeId];
        // Find children
        const children = treeEdges.filter(e => e.from === nodeId).map(e => e.to);

        if (children.length === 0) {
            const d = node.depth;
            if (!depthCounters[d]) depthCounters[d] = 0;
            node.index = depthCounters[d]++;
            return;
        }

        assignIndex(children[0]); // left (include)
        const d = node.depth;
        if (!depthCounters[d]) depthCounters[d] = 0;
        node.index = depthCounters[d]++;
        if (children[1] !== undefined) assignIndex(children[1]); // right (exclude)
    }

    assignIndex(0);

    // Count nodes per depth for positioning
    const maxLeaves = Math.pow(2, maxDepth);

    treeNodes.forEach(n => {
        const nodesAtDepth = depthCounters[n.depth] || 1;
        const xSpacing = 1.0 / (nodesAtDepth + 1);
        n.x = (n.index + 1) * xSpacing;
        n.y = (n.depth + 0.5) / (maxDepth + 1.5);
    });
}

// ============================================================
// BACKTRACKING GENERATOR
// ============================================================
function* solveGenerator() {
    currentSubset = [];
    currentDecisions = nums.map(n => ({ num: n, decision: 'pending' }));

    function* bt(depth, sum, nodeId) {
        const node = treeNodes[nodeId];
        node.state = 'exploring';
        node.sum = sum;
        node.included = [...currentSubset];
        stats.explored++;
        yield { type: 'explore', nodeId, sum };

        // Leaf node
        if (depth === nums.length) {
            if (sum === K) {
                node.state = 'solution';
                stats.solutions++;
                solutions.push([...currentSubset]);
                // Mark path to root as solution
                markPathSolution(nodeId);
                yield { type: 'solution', nodeId, subset: [...currentSubset] };
            } else {
                node.state = 'visited';
                yield { type: 'leaf', nodeId, sum };
            }
            return;
        }

        const num = nums[depth];
        const children = treeEdges.filter(e => e.from === nodeId).map(e => e.to);
        const includeChild = children[0];
        const excludeChild = children[1];

        // Try INCLUDE
        if (sum + num <= K) {
            currentSubset.push(num);
            currentDecisions[depth].decision = 'in';
            const edge = treeEdges.find(e => e.from === nodeId && e.to === includeChild);
            if (edge) edge.state = 'active';
            yield { type: 'include', nodeId, num, depth };

            yield* bt(depth + 1, sum + num, includeChild);

            currentSubset.pop();
            currentDecisions[depth].decision = 'pending';
        } else {
            // Prune include branch
            treeNodes[includeChild].state = 'pruned';
            pruneSubtree(includeChild);
            stats.pruned++;
            const edge = treeEdges.find(e => e.from === nodeId && e.to === includeChild);
            if (edge) edge.state = 'pruned';
            yield { type: 'prune', nodeId: includeChild, num, sum: sum + num, depth };
        }

        // Try EXCLUDE
        currentDecisions[depth].decision = 'out';
        const edgeEx = treeEdges.find(e => e.from === nodeId && e.to === excludeChild);
        if (edgeEx) edgeEx.state = 'active';
        yield { type: 'exclude', nodeId, num, depth };

        yield* bt(depth + 1, sum, excludeChild);
        currentDecisions[depth].decision = 'pending';

        node.state = node.state === 'solution' ? 'solution' : 'visited';
    }

    yield* bt(0, 0, 0);

    yield { type: 'done' };
}

function pruneSubtree(nodeId) {
    const children = treeEdges.filter(e => e.from === nodeId).map(e => e.to);
    children.forEach(cid => {
        treeNodes[cid].state = 'pruned';
        const edge = treeEdges.find(e => e.from === nodeId && e.to === cid);
        if (edge) edge.state = 'pruned';
        stats.pruned++;
        pruneSubtree(cid);
    });
}

function markPathSolution(nodeId) {
    let id = nodeId;
    while (id !== null) {
        const node = treeNodes[id];
        node.state = 'solution';
        const edge = treeEdges.find(e => e.to === id);
        if (edge) edge.state = 'solution';
        id = node.parentId;
    }
}

// ============================================================
// STEPPING
// ============================================================
function btStep() {
    if (btFinished) return 'done';
    if (!btGenerator) {
        btGenerator = solveGenerator();
    }

    const result = btGenerator.next();
    if (result.done) {
        btFinished = true;
        finishSearch();
        return 'done';
    }

    const action = result.value;
    render();
    updateStats();
    updateSubsetDisplay();
    updateSolutionsList();

    if (action.type === 'explore') {
        setStatus('default', `Explorando nodo — suma parcial = <strong>${action.sum}</strong>`);
    } else if (action.type === 'include') {
        setStatus('default', `Incluir <strong>${action.num}</strong> — subconjunto: {${currentSubset.join(', ')}}`);
    } else if (action.type === 'exclude') {
        setStatus('default', `Excluir <strong>${action.num}</strong> — subconjunto: {${currentSubset.join(', ')}}`);
    } else if (action.type === 'prune') {
        setStatus('default', `<span style="color:#ef4444;font-weight:700">✂ Poda:</span> incluir ${action.num} daría suma = ${action.sum} > K = ${K}`);
    } else if (action.type === 'solution') {
        setStatus('found', `<strong>¡Solución!</strong> {${action.subset.join(', ')}} = ${K}`);
    } else if (action.type === 'leaf') {
        setStatus('default', `Hoja — suma = ${action.sum} ≠ ${K}`);
    } else if (action.type === 'done') {
        btFinished = true;
        finishSearch();
        return 'done';
    }

    updateSavingsBar();
    return action.type;
}

function finishSearch() {
    stopRunning();
    render();
    updateStats();
    updateSavingsBar();
    updateSolutionsList();
    setStatus('found', `<strong>Búsqueda completa.</strong> ${stats.solutions} solución(es) encontrada(s). ${stats.explored} nodos explorados, ${stats.pruned} podados.`);
    document.getElementById('btn-step').disabled = true;
    document.getElementById('btn-run').disabled = true;
    document.getElementById('btn-all').disabled = true;
}

// ============================================================
// SOLVE INSTANTLY
// ============================================================
function solveInstant() {
    stopRunning();
    while (!btFinished) {
        btStep();
    }
}

// ============================================================
// RENDERING
// ============================================================
function render() {
    const wrap = canvas.parentElement;
    const maxW = wrap.clientWidth - 16;
    const maxDepth = nums.length;
    const h = Math.max(300, (maxDepth + 2) * 60);
    const w = Math.max(400, maxW);

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = CLR.bg;
    ctx.fillRect(0, 0, w, h);

    const padX = 30, padY = 20;

    function screenPos(node) {
        return {
            x: padX + node.x * (w - 2 * padX),
            y: padY + node.y * (h - 2 * padY),
        };
    }

    // Edges
    treeEdges.forEach(e => {
        const from = screenPos(treeNodes[e.from]);
        const to = screenPos(treeNodes[e.to]);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        if (e.state === 'solution') {
            ctx.strokeStyle = CLR.edgeSolution;
            ctx.lineWidth = 3;
        } else if (e.state === 'pruned') {
            ctx.strokeStyle = CLR.edgePruned;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
        } else if (e.state === 'active') {
            ctx.strokeStyle = CLR.edgeActive;
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = CLR.edgeDefault;
            ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Edge label
        if (treeNodes[e.to].depth <= nums.length) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const dx = to.x - from.x, dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const lx = mx + nx * 10, ly = my + ny * 10;

            ctx.font = '600 9px "Source Sans Pro", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = e.state === 'pruned' ? '#ef4444' : '#64748b';
            ctx.fillText(e.label, lx, ly);
        }
    });

    // Nodes
    const R = Math.max(10, Math.min(16, w / (Math.pow(2, maxDepth) * 3)));

    treeNodes.forEach(n => {
        const pos = screenPos(n);
        let bg = CLR.unvisited;
        if (n.state === 'exploring') bg = CLR.exploring;
        else if (n.state === 'solution') bg = CLR.solution;
        else if (n.state === 'pruned') bg = CLR.pruned;
        else if (n.state === 'visited') bg = CLR.visited;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();

        if (n.state === 'exploring') {
            ctx.strokeStyle = '#005a94';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Sum label inside node
        if (n.state !== 'unvisited' && n.state !== 'pruned') {
            ctx.font = `700 ${Math.max(8, R * 0.7)}px "Source Sans Pro", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = ['exploring', 'solution', 'pruned'].includes(n.state) ? CLR.textLight : CLR.text;
            ctx.fillText(String(n.sum), pos.x, pos.y + 1);
        }

        // Pruned X
        if (n.state === 'pruned' && n.sum === 0) {
            ctx.font = `700 ${Math.max(8, R * 0.8)}px "Source Sans Pro", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = CLR.textLight;
            ctx.fillText('✗', pos.x, pos.y + 1);
        }

        // Subset label below leaf solution nodes
        if (n.state === 'solution' && n.depth === nums.length) {
            ctx.font = '600 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = CLR.solution;
            ctx.fillText(`{${n.included.join(',')}}`, pos.x, pos.y + R + 3);
        }
    });

    // Depth labels on left
    for (let d = 0; d <= maxDepth; d++) {
        const nodeAtD = treeNodes.find(n => n.depth === d);
        if (!nodeAtD) continue;
        const y = padY + nodeAtD.y * (h - 2 * padY);
        ctx.font = '600 10px "Source Sans Pro", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#94a3b8';
        if (d === 0) {
            ctx.fillText('raíz', padX - 6, y);
        } else {
            ctx.fillText(`${nums[d - 1]}?`, padX - 6, y);
        }
    }
}

// ============================================================
// UI UPDATES
// ============================================================
function updateStats() {
    document.getElementById('stat-explored').textContent = stats.explored;
    document.getElementById('stat-pruned').textContent = stats.pruned;
    document.getElementById('stat-solutions').textContent = stats.solutions;
    document.getElementById('stat-total').textContent = stats.total;
}

function updateSubsetDisplay() {
    const container = document.getElementById('subset-chips');
    if (currentDecisions.every(d => d.decision === 'pending') && currentSubset.length === 0) {
        container.innerHTML = '<span class="sol-empty">Presiona Paso para iniciar</span>';
        return;
    }

    let html = '';
    currentDecisions.forEach(d => {
        if (d.decision === 'in') {
            html += `<span class="chip chip-in">${d.num}</span>`;
        } else if (d.decision === 'out') {
            html += `<span class="chip chip-out">${d.num}</span>`;
        } else {
            html += `<span class="chip chip-pending">${d.num}</span>`;
        }
    });

    const sum = currentSubset.reduce((a, b) => a + b, 0);
    html += `<span style="margin-left:0.5rem; font-weight:700; color:var(--text-secondary);">= ${sum}</span>`;
    container.innerHTML = html;
}

function updateSolutionsList() {
    const box = document.getElementById('solutions-box');
    const count = document.getElementById('sol-count');
    count.textContent = solutions.length;

    if (solutions.length === 0) {
        box.innerHTML = '<span class="sol-empty">Ninguna aún</span>';
        return;
    }

    let html = '';
    solutions.forEach((sol, i) => {
        html += `<div class="sol-item">#${i + 1}: {${sol.join(', ')}} = ${sol.reduce((a, b) => a + b, 0)}</div>`;
    });
    box.innerHTML = html;
}

function updateSavingsBar() {
    const total = stats.explored + stats.pruned;
    if (total === 0) return;

    const expPct = (stats.explored / stats.total) * 100;
    const prunedPct = (stats.pruned / stats.total) * 100;

    document.getElementById('bar-explored').style.width = expPct + '%';
    document.getElementById('bar-explored').textContent = stats.explored > 0 ? stats.explored : '';
    document.getElementById('bar-pruned').style.width = prunedPct + '%';
    document.getElementById('bar-pruned').textContent = stats.pruned > 0 ? stats.pruned : '';

    document.getElementById('savings-explored').textContent = `Exploradas: ${stats.explored}`;
    document.getElementById('savings-pruned').textContent = `Podadas: ${stats.pruned}`;

    const savingsPct = stats.total > 0 ? Math.round((stats.pruned / stats.total) * 100) : 0;
    document.getElementById('savings-pct').textContent = `Ahorro: ${savingsPct}%`;
}

function setStatus(type, html) {
    const el = document.getElementById('status-box');
    el.className = 'status-box';
    if (type === 'found') el.classList.add('found');
    el.innerHTML = html;
}

// ============================================================
// ANIMATION
// ============================================================
function startRunning() {
    if (running || btFinished) return;
    running = true;
    document.getElementById('btn-run').textContent = '⏸ Pausar';

    function tick() {
        if (!running || btFinished) { stopRunning(); return; }
        const result = btStep();
        if (result === 'done') {
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
// RESET
// ============================================================
function resetAll() {
    stopRunning();
    btGenerator = null;
    btFinished = false;
    solutions = [];
    stats = { explored: 0, pruned: 0, solutions: 0, total: 0 };
    currentSubset = [];
    currentDecisions = nums.map(n => ({ num: n, decision: 'pending' }));

    buildTree();
    render();
    updateStats();
    updateSubsetDisplay();
    updateSolutionsList();
    updateSavingsBar();
    document.getElementById('bar-explored').style.width = '0%';
    document.getElementById('bar-pruned').style.width = '0%';
    setStatus('default', 'Edita el conjunto y K, luego presiona <strong>Paso</strong> para explorar el árbol rama por rama.');
    document.getElementById('btn-step').disabled = false;
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-all').disabled = false;
    document.getElementById('tree-info').textContent = `Incluir / Excluir — profundidad hasta ${nums.length}`;
}

// ============================================================
// EVENTS
// ============================================================
function setup() {
    document.getElementById('set-input').addEventListener('change', (e) => {
        const val = e.target.value;
        const parsed = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (parsed.length > 0 && parsed.length <= 7) {
            nums = parsed;
            // Update K slider max
            const maxK = nums.reduce((a, b) => a + b, 0);
            document.getElementById('k-slider').max = maxK;
            if (K > maxK) {
                K = maxK;
                document.getElementById('k-slider').value = K;
                document.getElementById('k-value').textContent = K;
            }
            resetAll();
        }
    });

    document.getElementById('k-slider').addEventListener('input', (e) => {
        K = parseInt(e.target.value);
        document.getElementById('k-value').textContent = K;
        resetAll();
    });

    document.getElementById('btn-step').addEventListener('click', () => {
        if (running) stopRunning();
        btStep();
    });

    document.getElementById('btn-run').addEventListener('click', () => {
        if (running) { stopRunning(); return; }
        startRunning();
    });

    document.getElementById('btn-all').addEventListener('click', () => {
        solveInstant();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        resetAll();
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        document.getElementById('speed-value').textContent = speed + 'ms';
    });

    window.addEventListener('resize', render);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setup();
    // Set K slider max
    const maxK = nums.reduce((a, b) => a + b, 0);
    document.getElementById('k-slider').max = maxK;
    resetAll();
});
