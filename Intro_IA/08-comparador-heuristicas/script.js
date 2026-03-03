/**
 * Comparador de Heurísticas: Manhattan vs Euclidiana vs Chebyshev
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORS
// ============================================================
const CLR = {
    bg:        '#f8fafc',
    grid:      '#e2e8f0',
    wall:      '#475569',
    pointA:    '#ff9900',
    pointB:    '#7c3aed',
    manhattan: '#3b82f6',
    euclidean: '#ef4444',
    chebyshev: '#f59e0b',
    realPath:  '#16a34a',
    astarM:    'rgba(59,130,246,0.15)',
    astarE:    'rgba(239,68,68,0.15)',
    astarC:    'rgba(245,158,11,0.15)',
};

// ============================================================
// STATE
// ============================================================
let N = 20;
let cellPx = 28;
let gridData = [];       // N×N: 0=free, 1=wall
let pointA = [2, 2];
let pointB = [17, 17];
let showChebyshev = true;
let tool = 'move';       // 'move' | 'wall' | 'erase'
let dragging = null;     // 'A' | 'B' | null
let painting = false;

// A* comparison results
let compareResults = null; // { manhattan: {explored, path}, euclidean: {...}, chebyshev: {...} }

// ============================================================
// DOM
// ============================================================
let canvas, ctx;

function cacheDom() {
    canvas = document.getElementById('grid-canvas');
    ctx = canvas.getContext('2d');
}

// ============================================================
// GRID
// ============================================================
function initGrid() {
    gridData = Array.from({ length: N }, () => Array(N).fill(0));
    pointA = [Math.floor(N * 0.15), Math.floor(N * 0.15)];
    pointB = [Math.floor(N * 0.85), Math.floor(N * 0.85)];
    compareResults = null;
}

// ============================================================
// HEURISTIC CALCULATIONS
// ============================================================
function manhattan(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function euclidean(r1, c1, r2, c2) {
    const dr = r1 - r2, dc = c1 - c2;
    return Math.sqrt(dr * dr + dc * dc);
}

function chebyshev(r1, c1, r2, c2) {
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

function updateDistances() {
    const [ar, ac] = pointA;
    const [br, bc] = pointB;
    const dx = Math.abs(ac - bc);
    const dy = Math.abs(ar - br);

    const mVal = manhattan(ar, ac, br, bc);
    const eVal = euclidean(ar, ac, br, bc);
    const cVal = chebyshev(ar, ac, br, bc);

    document.getElementById('d-manhattan').textContent = mVal;
    document.getElementById('f-manhattan').textContent = `|${dx}| + |${dy}| = ${mVal}`;

    document.getElementById('d-euclidean').textContent = eVal.toFixed(2);
    document.getElementById('f-euclidean').textContent = `√(${dx}² + ${dy}²) = ${eVal.toFixed(2)}`;

    document.getElementById('d-chebyshev').textContent = cVal;
    document.getElementById('f-chebyshev').textContent = `máx(${dx}, ${dy}) = ${cVal}`;

    // Admissibility check (against real A* path if available)
    updateAdmissibility();
}

function updateAdmissibility() {
    const box = document.getElementById('admiss-box');
    if (!compareResults || !compareResults.manhattan.path) {
        box.className = 'admiss-box yes';
        box.textContent = '✓ Todas las heurísticas son admisibles (h ≤ h*)';
        return;
    }

    const realCost = compareResults.manhattan.path.length - 1; // steps = cells - 1
    const [ar, ac] = pointA;
    const [br, bc] = pointB;
    const mVal = manhattan(ar, ac, br, bc);
    const eVal = euclidean(ar, ac, br, bc);
    const cVal = chebyshev(ar, ac, br, bc);

    const allAdm = mVal <= realCost && eVal <= realCost && (!showChebyshev || cVal <= realCost);

    if (allAdm) {
        box.className = 'admiss-box yes';
        box.innerHTML = `✓ Todas admisibles: h ≤ h* = ${realCost}`;
    } else {
        box.className = 'admiss-box no';
        box.innerHTML = `✗ Alguna heurística sobreestima (h* = ${realCost})`;
    }
}

// ============================================================
// A* (returns {explored: Set, path: [cells] or null})
// ============================================================
function runAstar(hFunc) {
    const [sr, sc] = pointA;
    const [gr, gc] = pointB;

    const key = (r, c) => r * N + c;
    const openSet = []; // min-heap
    const closed = new Set();
    const gScore = {};
    const cameFrom = {};
    const explored = new Set();

    const sk = key(sr, sc);
    gScore[sk] = 0;
    heapPush(openSet, { r: sr, c: sc, f: hFunc(sr, sc, gr, gc) });

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    while (openSet.length > 0) {
        const curr = heapPop(openSet);
        const ck = key(curr.r, curr.c);

        if (closed.has(ck)) continue;
        closed.add(ck);
        explored.add(ck);

        if (curr.r === gr && curr.c === gc) {
            // Reconstruct path
            const path = [];
            let k = ck;
            while (k !== undefined) {
                const r = Math.floor(k / N), c = k % N;
                path.unshift([r, c]);
                k = cameFrom[k];
            }
            return { explored, path };
        }

        for (const [dr, dc] of dirs) {
            const nr = curr.r + dr, nc = curr.c + dc;
            if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
            if (gridData[nr][nc] === 1) continue;
            const nk = key(nr, nc);
            if (closed.has(nk)) continue;
            const tentG = (gScore[ck] || 0) + 1;
            if (tentG < (gScore[nk] ?? Infinity)) {
                gScore[nk] = tentG;
                cameFrom[nk] = ck;
                heapPush(openSet, { r: nr, c: nc, f: tentG + hFunc(nr, nc, gr, gc) });
            }
        }
    }

    return { explored, path: null };
}

function heapPush(heap, item) {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (heap[p].f <= heap[i].f) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
    }
}

function heapPop(heap) {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
        heap[0] = last;
        let i = 0;
        while (true) {
            let s = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < heap.length && heap[l].f < heap[s].f) s = l;
            if (r < heap.length && heap[r].f < heap[s].f) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    }
    return top;
}

function runComparison() {
    const resM = runAstar(manhattan);
    const resE = runAstar(euclidean);
    const resC = showChebyshev ? runAstar(chebyshev) : null;

    compareResults = {
        manhattan: resM,
        euclidean: resE,
        chebyshev: resC,
    };

    // Update comparison table
    const tbody = document.getElementById('compare-body');
    const rows = [
        { name: 'Manhattan', res: resM, clr: CLR.manhattan },
        { name: 'Euclidiana', res: resE, clr: CLR.euclidean },
    ];
    if (showChebyshev && resC) {
        rows.push({ name: 'Chebyshev', res: resC, clr: CLR.chebyshev });
    }

    // Find winner (fewest explored)
    const minExplored = Math.min(...rows.map(r => r.res.explored.size));

    let html = '';
    rows.forEach(r => {
        const isWinner = r.res.explored.size === minExplored;
        const pathLen = r.res.path ? r.res.path.length - 1 : '—';
        html += `<tr class="${isWinner ? 'winner' : ''}">
            <td style="color:${r.clr}; font-weight:700">${r.name}</td>
            <td>${r.res.explored.size}</td>
            <td>${pathLen}</td>
        </tr>`;
    });
    tbody.innerHTML = html;

    // Update real path distance
    if (resM.path) {
        const realCost = resM.path.length - 1;
        document.getElementById('d-real').textContent = realCost;
        document.getElementById('f-real').textContent = `Camino óptimo = ${realCost} pasos`;
    } else {
        document.getElementById('d-real').textContent = '∞';
        document.getElementById('f-real').textContent = 'No hay camino';
    }

    updateAdmissibility();
    render();

    if (resM.path) {
        setStatus('found', `<strong>Comparación completa.</strong> Manhattan: ${resM.explored.size} nodos, Euclidiana: ${resE.explored.size} nodos${resC ? ', Chebyshev: ' + resC.explored.size + ' nodos' : ''}. Camino óptimo: ${resM.path.length - 1} pasos.`);
    } else {
        setStatus('default', '<strong>No hay camino</strong> entre A y B. Los muros bloquean todas las rutas.');
    }
}

// ============================================================
// RENDERING
// ============================================================
function computeCellSize() {
    const wrap = canvas.parentElement;
    const maxW = wrap.clientWidth - 16;
    cellPx = Math.max(14, Math.min(36, Math.floor(maxW / N)));
}

function render() {
    computeCellSize();
    const size = cellPx * N;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const key = (r, c) => r * N + c;

    // Background cells
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const x = c * cellPx, y = r * cellPx;
            const k = key(r, c);

            let bg = CLR.bg;
            if (gridData[r][c] === 1) bg = CLR.wall;

            // A* explored overlay
            if (compareResults && gridData[r][c] === 0) {
                if (compareResults.manhattan.explored.has(k) && compareResults.euclidean.explored.has(k)) {
                    bg = 'rgba(139,92,246,0.12)'; // both: purple tint
                } else if (compareResults.manhattan.explored.has(k)) {
                    bg = CLR.astarM;
                } else if (compareResults.euclidean.explored.has(k)) {
                    bg = CLR.astarE;
                }
                if (showChebyshev && compareResults.chebyshev && compareResults.chebyshev.explored.has(k)) {
                    // Add subtle chebyshev marker
                }
            }

            ctx.fillStyle = bg;
            ctx.fillRect(x, y, cellPx, cellPx);

            ctx.strokeStyle = CLR.grid;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellPx, cellPx);
        }
    }

    // Draw A* real path if available
    if (compareResults && compareResults.manhattan.path) {
        const path = compareResults.manhattan.path;
        ctx.beginPath();
        ctx.strokeStyle = CLR.realPath;
        ctx.lineWidth = Math.max(2, cellPx * 0.2);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (let i = 0; i < path.length; i++) {
            const cx = path[i][1] * cellPx + cellPx / 2;
            const cy = path[i][0] * cellPx + cellPx / 2;
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }

    // Draw heuristic lines between A and B
    const ax = pointA[1] * cellPx + cellPx / 2;
    const ay = pointA[0] * cellPx + cellPx / 2;
    const bx = pointB[1] * cellPx + cellPx / 2;
    const by = pointB[0] * cellPx + cellPx / 2;

    // Manhattan path (L-shape)
    ctx.beginPath();
    ctx.strokeStyle = CLR.manhattan;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, ay); // horizontal
    ctx.lineTo(bx, by); // vertical
    ctx.stroke();

    // Euclidean (dashed straight line)
    ctx.beginPath();
    ctx.strokeStyle = CLR.euclidean;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);

    // Chebyshev (diagonal + straight)
    if (showChebyshev) {
        const dr = pointB[0] - pointA[0];
        const dc = pointB[1] - pointA[1];
        const diag = Math.min(Math.abs(dr), Math.abs(dc));
        const midR = pointA[0] + diag * Math.sign(dr);
        const midC = pointA[1] + diag * Math.sign(dc);
        const mx = midC * cellPx + cellPx / 2;
        const my = midR * cellPx + cellPx / 2;

        ctx.beginPath();
        ctx.strokeStyle = CLR.chebyshev;
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(ax, ay);
        ctx.lineTo(mx, my);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Points A and B
    const R = Math.max(8, cellPx * 0.4);

    ctx.beginPath();
    ctx.arc(ax, ay, R, 0, Math.PI * 2);
    ctx.fillStyle = CLR.pointA;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `700 ${Math.max(10, R)}px "Source Sans Pro", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('A', ax, ay + 1);

    ctx.beginPath();
    ctx.arc(bx, by, R, 0, Math.PI * 2);
    ctx.fillStyle = CLR.pointB;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('B', bx, by + 1);
}

function setStatus(type, html) {
    const el = document.getElementById('status-box');
    el.className = 'status-box';
    if (type === 'found') el.classList.add('found');
    el.innerHTML = html;
}

// ============================================================
// MOUSE
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

function isNearPoint(pos, point) {
    return Math.abs(pos[0] - point[0]) <= 1 && Math.abs(pos[1] - point[1]) <= 1;
}

function handleMouseDown(e) {
    e.preventDefault();
    const pos = getCellFromEvent(e);
    if (!pos) return;

    if (tool === 'move') {
        if (isNearPoint(pos, pointA)) {
            dragging = 'A';
        } else if (isNearPoint(pos, pointB)) {
            dragging = 'B';
        }
    } else if (tool === 'wall') {
        painting = true;
        applyWall(pos);
    } else if (tool === 'erase') {
        painting = true;
        eraseWall(pos);
    }
}

function handleMouseMove(e) {
    const pos = getCellFromEvent(e);
    if (!pos) return;

    if (dragging === 'A') {
        if (gridData[pos[0]][pos[1]] === 0 && !(pos[0] === pointB[0] && pos[1] === pointB[1])) {
            pointA = pos;
            compareResults = null;
            updateDistances();
            render();
        }
    } else if (dragging === 'B') {
        if (gridData[pos[0]][pos[1]] === 0 && !(pos[0] === pointA[0] && pos[1] === pointA[1])) {
            pointB = pos;
            compareResults = null;
            updateDistances();
            render();
        }
    } else if (painting && tool === 'wall') {
        applyWall(pos);
    } else if (painting && tool === 'erase') {
        eraseWall(pos);
    }
}

function handleMouseUp() {
    dragging = null;
    painting = false;
}

function applyWall(pos) {
    const [r, c] = pos;
    if ((r === pointA[0] && c === pointA[1]) || (r === pointB[0] && c === pointB[1])) return;
    gridData[r][c] = 1;
    compareResults = null;
    render();
}

function eraseWall(pos) {
    gridData[pos[0]][pos[1]] = 0;
    compareResults = null;
    render();
}

function setupMouse() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseDown(touch);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove(touch);
    }, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);
}

// ============================================================
// EVENTS
// ============================================================
function setup() {
    document.getElementById('grid-size').addEventListener('change', (e) => {
        N = parseInt(e.target.value);
        initGrid();
        updateDistances();
        render();
        document.getElementById('grid-info').textContent = `${N} × ${N}`;
    });

    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tool = btn.dataset.tool;
            canvas.style.cursor = tool === 'move' ? 'grab' : 'crosshair';
        });
    });

    // Chebyshev toggle
    document.getElementById('cheb-on').addEventListener('click', () => {
        showChebyshev = true;
        document.getElementById('cheb-on').classList.add('active');
        document.getElementById('cheb-off').classList.remove('active');
        document.getElementById('chebyshev-card').style.display = '';
        compareResults = null;
        render();
    });
    document.getElementById('cheb-off').addEventListener('click', () => {
        showChebyshev = false;
        document.getElementById('cheb-off').classList.add('active');
        document.getElementById('cheb-on').classList.remove('active');
        document.getElementById('chebyshev-card').style.display = 'none';
        compareResults = null;
        render();
    });

    document.getElementById('btn-compare').addEventListener('click', () => {
        runComparison();
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) gridData[r][c] = 0;
        compareResults = null;
        document.getElementById('d-real').textContent = '—';
        document.getElementById('f-real').textContent = 'Presiona Comparar A*';
        document.getElementById('compare-body').innerHTML = '<tr><td colspan="3" style="color:var(--text-muted);">Presiona Comparar A*</td></tr>';
        updateAdmissibility();
        render();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        initGrid();
        updateDistances();
        document.getElementById('d-real').textContent = '—';
        document.getElementById('f-real').textContent = 'Presiona Comparar A*';
        document.getElementById('compare-body').innerHTML = '<tr><td colspan="3" style="color:var(--text-muted);">Presiona Comparar A*</td></tr>';
        updateAdmissibility();
        render();
        setStatus('default', 'Arrastra los puntos <strong>A</strong> y <strong>B</strong> y observa las distancias en tiempo real.');
    });

    window.addEventListener('resize', render);
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
        updateDistances();
        render();
    });
});
