/**
 * Playground de A* en grid
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// CONSTANTS
// ============================================================
const CLR = {
    bg:       '#f8fafc',
    grid:     '#e2e8f0',
    wall:     '#475569',
    start:    '#ff9900',
    goal:     '#16a34a',
    open:     '#bfdbfe',
    closed:   '#3b82f6',
    path:     '#22c55e',
    current:  '#0073bb',
    textF:    '#1e293b',
    textG:    '#6366f1',
    textH:    '#0891b2',
};

// ============================================================
// STATE
// ============================================================
let N = 20;
let cellPx = 28;
let grid = [];           // N×N: 0=free, 1=wall
let startPos = [0, 0];
let goalPos = [19, 19];
let tool = 'wall';       // 'wall' | 'start' | 'goal' | 'erase'
let painting = false;
let heuristic = 'manhattan';

// A* state
let openSet = [];        // min-heap by f
let closedSet = new Set();
let gScore = {};
let fScore = {};
let cameFrom = {};
let pathCells = new Set();
let stepCount = 0;
let finished = false;
let foundPath = false;
let running = false;
let timerId = null;
let speed = 40;
let showValues = true;

// ============================================================
// DOM
// ============================================================
let canvas, ctx;
let elGridInfo, elStatusBox, elSpeedValue;
let mSteps, mOpen, mClosed, mPath, mCost;

function cacheDom() {
    canvas = document.getElementById('grid-canvas');
    ctx = canvas.getContext('2d');
    elGridInfo = document.getElementById('grid-info');
    elStatusBox = document.getElementById('status-box');
    elSpeedValue = document.getElementById('speed-value');
    mSteps = document.getElementById('m-steps');
    mOpen = document.getElementById('m-open');
    mClosed = document.getElementById('m-closed');
    mPath = document.getElementById('m-path');
    mCost = document.getElementById('m-cost');
}

// ============================================================
// GRID HELPERS
// ============================================================
function key(r, c) { return r + ',' + c; }

function initGrid() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    startPos = [0, 0];
    goalPos = [N - 1, N - 1];
}

function resetAlgorithm() {
    stopRunning();
    openSet = [];
    closedSet = new Set();
    gScore = {};
    fScore = {};
    cameFrom = {};
    pathCells = new Set();
    stepCount = 0;
    finished = false;
    foundPath = false;

    // Init start
    const sk = key(startPos[0], startPos[1]);
    gScore[sk] = 0;
    fScore[sk] = h(startPos[0], startPos[1]);
    openSet.push({ r: startPos[0], c: startPos[1], f: fScore[sk] });

    render();
    updateMetrics();
    updateInfo();
    setStatus('default', 'Dibuja muros con la herramienta <strong>Muro</strong>, luego presiona <strong>Paso</strong> o <strong>Ejecutar</strong>.');
    document.getElementById('btn-step').disabled = false;
    document.getElementById('btn-run').disabled = false;
}

// ============================================================
// HEURISTICS
// ============================================================
function h(r, c) {
    const dr = Math.abs(r - goalPos[0]);
    const dc = Math.abs(c - goalPos[1]);
    if (heuristic === 'manhattan') return dr + dc;
    if (heuristic === 'euclidean') return Math.sqrt(dr * dr + dc * dc);
    if (heuristic === 'chebyshev') return Math.max(dr, dc);
    return dr + dc;
}

const HEUR_LABELS = { manhattan: 'Manhattan', euclidean: 'Euclidiana', chebyshev: 'Chebyshev' };

function updateInfo() {
    elGridInfo.textContent = `${N} × ${N} — A*(${HEUR_LABELS[heuristic]})`;
}

// ============================================================
// A* STEP
// ============================================================
function neighbors(r, c) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const result = [];
    for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === 0) {
            result.push([nr, nc]);
        }
    }
    return result;
}

function heapPush(item) {
    openSet.push(item);
    let i = openSet.length - 1;
    while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        if (openSet[parent].f <= openSet[i].f) break;
        [openSet[parent], openSet[i]] = [openSet[i], openSet[parent]];
        i = parent;
    }
}

function heapPop() {
    if (openSet.length === 0) return null;
    const top = openSet[0];
    const last = openSet.pop();
    if (openSet.length > 0) {
        openSet[0] = last;
        let i = 0;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < openSet.length && openSet[l].f < openSet[smallest].f) smallest = l;
            if (r < openSet.length && openSet[r].f < openSet[smallest].f) smallest = r;
            if (smallest === i) break;
            [openSet[smallest], openSet[i]] = [openSet[i], openSet[smallest]];
            i = smallest;
        }
    }
    return top;
}

function astarStep() {
    if (finished) return 'done';

    if (openSet.length === 0) {
        finished = true;
        setStatus('no-path', '<strong>No se encontró camino.</strong> El destino es inalcanzable.');
        document.getElementById('btn-step').disabled = true;
        document.getElementById('btn-run').disabled = true;
        render();
        updateMetrics();
        return 'no-path';
    }

    const current = heapPop();
    const ck = key(current.r, current.c);

    // Skip if already closed
    if (closedSet.has(ck)) {
        return 'skip';
    }

    closedSet.add(ck);
    stepCount++;

    // Check goal
    if (current.r === goalPos[0] && current.c === goalPos[1]) {
        finished = true;
        foundPath = true;
        reconstructPath();
        render();
        updateMetrics();
        const cost = gScore[ck] || 0;
        setStatus('found', `<strong>¡Camino encontrado!</strong> Longitud: ${pathCells.size} celdas, costo: ${cost}.`);
        document.getElementById('btn-step').disabled = true;
        document.getElementById('btn-run').disabled = true;
        return 'found';
    }

    // Expand neighbors
    const nbs = neighbors(current.r, current.c);
    for (const [nr, nc] of nbs) {
        const nk = key(nr, nc);
        if (closedSet.has(nk)) continue;
        const tentG = (gScore[ck] || 0) + 1;
        if (tentG < (gScore[nk] ?? Infinity)) {
            cameFrom[nk] = ck;
            gScore[nk] = tentG;
            fScore[nk] = tentG + h(nr, nc);
            heapPush({ r: nr, c: nc, f: fScore[nk] });
        }
    }

    const openInHeap = new Set(openSet.map(o => key(o.r, o.c)));
    setStatus('default',
        `Paso ${stepCount}: expandir (<strong>${current.r}, ${current.c}</strong>), ` +
        `f=${(fScore[ck] || 0).toFixed(1)}, g=${gScore[ck] || 0}, ` +
        `h=${h(current.r, current.c).toFixed(1)}. ` +
        `Abiertos: ${openSet.length}, Cerrados: ${closedSet.size}`
    );

    render();
    updateMetrics();
    return 'continue';
}

function reconstructPath() {
    pathCells = new Set();
    let ck = key(goalPos[0], goalPos[1]);
    while (ck) {
        pathCells.add(ck);
        ck = cameFrom[ck] || null;
    }
}

// ============================================================
// RENDERING
// ============================================================
function computeCellSize() {
    const wrap = canvas.parentElement;
    const maxW = wrap.clientWidth - 16;
    cellPx = Math.max(16, Math.min(40, Math.floor(maxW / N)));
    showValues = cellPx >= 24;
}

function render() {
    computeCellSize();
    const size = cellPx * N;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const openKeys = new Set(openSet.map(o => key(o.r, o.c)));

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const x = c * cellPx;
            const y = r * cellPx;
            const k = key(r, c);

            // Background
            let bg = CLR.bg;
            if (grid[r][c] === 1) bg = CLR.wall;
            else if (r === startPos[0] && c === startPos[1]) bg = CLR.start;
            else if (r === goalPos[0] && c === goalPos[1]) bg = CLR.goal;
            else if (pathCells.has(k)) bg = CLR.path;
            else if (closedSet.has(k)) bg = CLR.closed;
            else if (openKeys.has(k)) bg = CLR.open;

            ctx.fillStyle = bg;
            ctx.fillRect(x, y, cellPx, cellPx);

            // Grid lines
            ctx.strokeStyle = CLR.grid;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellPx, cellPx);

            // f, g, h values (only for explored cells with enough space)
            if (showValues && cellPx >= 28 && grid[r][c] === 0 && gScore[k] !== undefined &&
                !(r === startPos[0] && c === startPos[1] && !closedSet.has(k)) ) {
                const g = gScore[k] || 0;
                const hv = h(r, c);
                const f = fScore[k] || 0;

                const textOnDark = closedSet.has(k) || pathCells.has(k);
                const fgF = textOnDark ? '#ffffff' : CLR.textF;
                const fgG = textOnDark ? '#e0e7ff' : CLR.textG;
                const fgH = textOnDark ? '#ccfbf1' : CLR.textH;

                // g top-left
                ctx.font = `600 ${Math.max(8, cellPx * 0.28)}px "Source Sans Pro", sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillStyle = fgG;
                ctx.fillText(g, x + 2, y + 1);

                // h top-right
                ctx.textAlign = 'right';
                ctx.fillStyle = fgH;
                ctx.fillText(hv % 1 === 0 ? hv : hv.toFixed(1), x + cellPx - 2, y + 1);

                // f center
                ctx.font = `700 ${Math.max(9, cellPx * 0.35)}px "Source Sans Pro", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = fgF;
                ctx.fillText(f % 1 === 0 ? f : f.toFixed(1), x + cellPx / 2, y + cellPx / 2 + 2);
            }

            // Start / Goal labels
            if (r === startPos[0] && c === startPos[1]) {
                ctx.font = `700 ${Math.max(10, cellPx * 0.45)}px "Source Sans Pro", sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff';
                ctx.fillText('S', x + cellPx / 2, y + cellPx / 2 + 1);
            }
            if (r === goalPos[0] && c === goalPos[1]) {
                ctx.font = `700 ${Math.max(10, cellPx * 0.45)}px "Source Sans Pro", sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff';
                ctx.fillText('G', x + cellPx / 2, y + cellPx / 2 + 1);
            }
        }
    }
}

function updateMetrics() {
    mSteps.textContent = stepCount;
    mOpen.textContent = openSet.length;
    mClosed.textContent = closedSet.size;
    if (foundPath) {
        mPath.textContent = pathCells.size;
        mPath.classList.add('success');
        const gk = key(goalPos[0], goalPos[1]);
        mCost.textContent = gScore[gk] || 0;
        mCost.classList.add('success');
    } else {
        mPath.innerHTML = '&mdash;';
        mPath.classList.remove('success');
        mCost.innerHTML = '&mdash;';
        mCost.classList.remove('success');
    }
}

function setStatus(type, html) {
    elStatusBox.className = 'status-box';
    if (type === 'found') elStatusBox.classList.add('found');
    if (type === 'no-path') elStatusBox.classList.add('no-path');
    elStatusBox.innerHTML = html;
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
            // Immediately try next
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
// MOUSE INTERACTION
// ============================================================
function getCellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const c = Math.floor(mx / cellPx);
    const r = Math.floor(my / cellPx);
    if (r < 0 || r >= N || c < 0 || c >= N) return null;
    return [r, c];
}

function applyTool(r, c) {
    const isStart = r === startPos[0] && c === startPos[1];
    const isGoal = r === goalPos[0] && c === goalPos[1];

    if (tool === 'wall') {
        if (!isStart && !isGoal) grid[r][c] = 1;
    } else if (tool === 'erase') {
        grid[r][c] = 0;
    } else if (tool === 'start') {
        grid[startPos[0]][startPos[1]] = 0; // clear old
        grid[r][c] = 0;
        startPos = [r, c];
    } else if (tool === 'goal') {
        grid[goalPos[0]][goalPos[1]] = 0;
        grid[r][c] = 0;
        goalPos = [r, c];
    }
    resetAlgorithm();
    render();
}

function setupMouse() {
    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        painting = true;
        const pos = getCellFromEvent(e);
        if (pos) applyTool(pos[0], pos[1]);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!painting) return;
        const pos = getCellFromEvent(e);
        if (pos) applyTool(pos[0], pos[1]);
    });
    canvas.addEventListener('mouseup', () => { painting = false; });
    canvas.addEventListener('mouseleave', () => { painting = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        painting = true;
        const touch = e.touches[0];
        const pos = getCellFromEvent(touch);
        if (pos) applyTool(pos[0], pos[1]);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!painting) return;
        const touch = e.touches[0];
        const pos = getCellFromEvent(touch);
        if (pos) applyTool(pos[0], pos[1]);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { painting = false; });
}

// ============================================================
// EVENTS
// ============================================================
function setup() {
    document.getElementById('grid-size').addEventListener('change', (e) => {
        N = parseInt(e.target.value);
        initGrid();
        resetAlgorithm();
    });

    document.getElementById('heuristic-select').addEventListener('change', (e) => {
        heuristic = e.target.value;
        resetAlgorithm();
    });

    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tool = btn.dataset.tool;
        });
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

    document.getElementById('btn-clear').addEventListener('click', () => {
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = 0;
        resetAlgorithm();
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        elSpeedValue.textContent = speed + 'ms';
    });

    window.addEventListener('resize', () => {
        render();
    });

    setupMouse();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setup();
    initGrid();
    requestAnimationFrame(() => {
        resetAlgorithm();
    });
});
