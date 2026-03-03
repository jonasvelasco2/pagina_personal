/**
 * Comparativa final: BFS vs DFS vs Greedy vs A*
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORS
// ============================================================
const CLR = {
    bg:      '#f8fafc',
    wall:    '#334155',
    start:   '#ff9900',
    goal:    '#16a34a',
    grid:    '#e2e8f0',
    path:    '#22c55e',
    bfs:     { explored: 'rgba(59,130,246,0.3)',  frontier: 'rgba(59,130,246,0.6)',  path: '#2563eb' },
    dfs:     { explored: 'rgba(219,39,119,0.25)', frontier: 'rgba(219,39,119,0.6)',  path: '#be185d' },
    greedy:  { explored: 'rgba(245,158,11,0.25)', frontier: 'rgba(245,158,11,0.6)',  path: '#d97706' },
    astar:   { explored: 'rgba(5,150,105,0.25)',  frontier: 'rgba(5,150,105,0.6)',   path: '#059669' },
};

// ============================================================
// MAZE SCENARIOS
// ============================================================
function emptyGrid(N) {
    return Array.from({ length: N }, () => Array(N).fill(0));
}

function generateMaze1() {
    const N = 15;
    const g = emptyGrid(N);
    const walls = [
        [1,3],[2,3],[3,3],[4,3],[5,3],
        [5,4],[5,5],[5,6],[5,7],
        [3,6],[3,7],[3,8],[3,9],[3,10],
        [7,1],[7,2],[7,3],[7,4],[7,5],
        [9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],
        [7,8],[7,9],[7,10],[7,11],
        [11,2],[11,3],[11,4],
        [12,7],[12,8],[13,8],
        [1,11],[2,11],[2,12],
    ];
    walls.forEach(([r,c]) => { if (r < N && c < N) g[r][c] = 1; });
    return { grid: g, N, start: [0, 0], goal: [N-1, N-1] };
}

function generateMaze2() {
    const N = 20;
    const g = emptyGrid(N);
    // Trap: long wall forces detour, Greedy gets fooled
    for (let r = 2; r <= 16; r++) g[r][10] = 1;
    for (let c = 10; c <= 17; c++) g[2][c] = 1;
    for (let c = 3; c <= 10; c++) g[16][c] = 1;
    // Extra walls
    for (let r = 5; r <= 10; r++) g[r][4] = 1;
    for (let c = 6; c <= 8; c++) g[8][c] = 1;
    for (let r = 12; r <= 15; r++) g[r][14] = 1;
    for (let c = 14; c <= 17; c++) g[12][c] = 1;
    g[6][15] = 1; g[6][16] = 1; g[7][16] = 1;
    return { grid: g, N, start: [10, 0], goal: [10, 19] };
}

function generateMaze3() {
    const N = 20;
    const g = emptyGrid(N);
    // Dense maze with corridors
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (r % 2 === 0 && c % 2 === 0) continue;
            if (r % 2 === 1 && c % 2 === 1) g[r][c] = 1;
        }
    }
    // Carve passages using simple randomized approach (seeded)
    const seed = 42;
    let rng = seed;
    function nextRng() { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng; }

    for (let r = 0; r < N; r += 2) {
        for (let c = 0; c < N; c += 2) {
            const dirs = [];
            if (r + 2 < N) dirs.push([r+1, c]);
            if (c + 2 < N) dirs.push([r, c+1]);
            if (dirs.length > 0) {
                const pick = dirs[nextRng() % dirs.length];
                g[pick[0]][pick[1]] = 0;
            }
        }
    }
    // Ensure more openness
    for (let r = 1; r < N-1; r += 4) {
        for (let c = 1; c < N-1; c += 4) {
            g[r][c] = 0;
            if (r+1 < N) g[r+1][c] = 0;
            if (c+1 < N) g[r][c+1] = 0;
        }
    }
    // Clear start and goal areas
    g[0][0] = 0; g[0][1] = 0; g[1][0] = 0;
    g[N-1][N-1] = 0; g[N-2][N-1] = 0; g[N-1][N-2] = 0;
    return { grid: g, N, start: [0, 0], goal: [N-1, N-1] };
}

const SCENARIOS = {
    maze1: generateMaze1,
    maze2: generateMaze2,
    maze3: generateMaze3,
};

// ============================================================
// STATE
// ============================================================
let scenario = null; // { grid, N, start, goal }
let speed = 80;
let running = false;
let timerId = null;
let allFinished = false;

// Per-algorithm state
const ALGOS = ['bfs', 'dfs', 'greedy', 'astar'];
let algoState = {};

function initAlgoState(name) {
    return {
        name,
        explored: new Set(),
        frontier: [],     // array of {r, c}
        frontierSet: new Set(),
        cameFrom: {},
        finished: false,
        foundPath: false,
        path: [],
        exploredCount: 0,
        maxFrontier: 0,
        pathLen: 0,
    };
}

// ============================================================
// KEY HELPER
// ============================================================
function key(r, c) { return r * 1000 + c; }
function fromKey(k) { return [Math.floor(k / 1000), k % 1000]; }

// ============================================================
// ALGORITHM IMPLEMENTATIONS
// ============================================================
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function manhattan(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function initBFS(st) {
    const [sr, sc] = scenario.start;
    const k = key(sr, sc);
    st.frontier = [{ r: sr, c: sc }];
    st.frontierSet = new Set([k]);
    st.cameFrom = {};
    st.cameFrom[k] = null;
}

function stepBFS(st) {
    if (st.finished || st.frontier.length === 0) {
        st.finished = true;
        return;
    }
    const curr = st.frontier.shift();
    const ck = key(curr.r, curr.c);
    st.frontierSet.delete(ck);

    if (st.explored.has(ck)) return;
    st.explored.add(ck);
    st.exploredCount++;
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);

    if (curr.r === scenario.goal[0] && curr.c === scenario.goal[1]) {
        st.finished = true;
        st.foundPath = true;
        reconstructPath(st, ck);
        return;
    }

    for (const [dr, dc] of DIRS) {
        const nr = curr.r + dr, nc = curr.c + dc;
        if (nr < 0 || nr >= scenario.N || nc < 0 || nc >= scenario.N) continue;
        if (scenario.grid[nr][nc] === 1) continue;
        const nk = key(nr, nc);
        if (st.explored.has(nk) || st.frontierSet.has(nk)) continue;
        st.frontier.push({ r: nr, c: nc });
        st.frontierSet.add(nk);
        st.cameFrom[nk] = ck;
    }
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);
}

function initDFS(st) {
    const [sr, sc] = scenario.start;
    const k = key(sr, sc);
    st.frontier = [{ r: sr, c: sc }]; // stack
    st.frontierSet = new Set([k]);
    st.cameFrom = {};
    st.cameFrom[k] = null;
}

function stepDFS(st) {
    if (st.finished || st.frontier.length === 0) {
        st.finished = true;
        return;
    }
    const curr = st.frontier.pop();
    const ck = key(curr.r, curr.c);
    st.frontierSet.delete(ck);

    if (st.explored.has(ck)) return;
    st.explored.add(ck);
    st.exploredCount++;
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);

    if (curr.r === scenario.goal[0] && curr.c === scenario.goal[1]) {
        st.finished = true;
        st.foundPath = true;
        reconstructPath(st, ck);
        return;
    }

    // Shuffle to get varied paths (but deterministic order)
    const shuffled = [...DIRS].reverse();
    for (const [dr, dc] of shuffled) {
        const nr = curr.r + dr, nc = curr.c + dc;
        if (nr < 0 || nr >= scenario.N || nc < 0 || nc >= scenario.N) continue;
        if (scenario.grid[nr][nc] === 1) continue;
        const nk = key(nr, nc);
        if (st.explored.has(nk) || st.frontierSet.has(nk)) continue;
        st.frontier.push({ r: nr, c: nc });
        st.frontierSet.add(nk);
        st.cameFrom[nk] = ck;
    }
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);
}

function initGreedy(st) {
    const [sr, sc] = scenario.start;
    const k = key(sr, sc);
    st.frontier = [{ r: sr, c: sc, h: manhattan(sr, sc, scenario.goal[0], scenario.goal[1]) }];
    st.frontierSet = new Set([k]);
    st.cameFrom = {};
    st.cameFrom[k] = null;
}

function stepGreedy(st) {
    if (st.finished || st.frontier.length === 0) {
        st.finished = true;
        return;
    }
    // Pick lowest h
    st.frontier.sort((a, b) => a.h - b.h);
    const curr = st.frontier.shift();
    const ck = key(curr.r, curr.c);
    st.frontierSet.delete(ck);

    if (st.explored.has(ck)) return;
    st.explored.add(ck);
    st.exploredCount++;
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);

    if (curr.r === scenario.goal[0] && curr.c === scenario.goal[1]) {
        st.finished = true;
        st.foundPath = true;
        reconstructPath(st, ck);
        return;
    }

    for (const [dr, dc] of DIRS) {
        const nr = curr.r + dr, nc = curr.c + dc;
        if (nr < 0 || nr >= scenario.N || nc < 0 || nc >= scenario.N) continue;
        if (scenario.grid[nr][nc] === 1) continue;
        const nk = key(nr, nc);
        if (st.explored.has(nk) || st.frontierSet.has(nk)) continue;
        const h = manhattan(nr, nc, scenario.goal[0], scenario.goal[1]);
        st.frontier.push({ r: nr, c: nc, h });
        st.frontierSet.add(nk);
        st.cameFrom[nk] = ck;
    }
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);
}

function initAstar(st) {
    const [sr, sc] = scenario.start;
    const k = key(sr, sc);
    st.gScore = {};
    st.gScore[k] = 0;
    const h = manhattan(sr, sc, scenario.goal[0], scenario.goal[1]);
    st.frontier = [{ r: sr, c: sc, f: h }]; // min-heap by f
    st.frontierSet = new Set([k]);
    st.cameFrom = {};
    st.cameFrom[k] = null;
}

function stepAstar(st) {
    if (st.finished || st.frontier.length === 0) {
        st.finished = true;
        return;
    }
    // Pick lowest f
    st.frontier.sort((a, b) => a.f - b.f);
    const curr = st.frontier.shift();
    const ck = key(curr.r, curr.c);
    st.frontierSet.delete(ck);

    if (st.explored.has(ck)) return;
    st.explored.add(ck);
    st.exploredCount++;
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);

    if (curr.r === scenario.goal[0] && curr.c === scenario.goal[1]) {
        st.finished = true;
        st.foundPath = true;
        reconstructPath(st, ck);
        return;
    }

    const gCurr = st.gScore[ck] || 0;

    for (const [dr, dc] of DIRS) {
        const nr = curr.r + dr, nc = curr.c + dc;
        if (nr < 0 || nr >= scenario.N || nc < 0 || nc >= scenario.N) continue;
        if (scenario.grid[nr][nc] === 1) continue;
        const nk = key(nr, nc);
        if (st.explored.has(nk)) continue;
        const tentG = gCurr + 1;
        if (tentG < (st.gScore[nk] ?? Infinity)) {
            st.gScore[nk] = tentG;
            st.cameFrom[nk] = ck;
            const h = manhattan(nr, nc, scenario.goal[0], scenario.goal[1]);
            st.frontier.push({ r: nr, c: nc, f: tentG + h });
            st.frontierSet.add(nk);
        }
    }
    st.maxFrontier = Math.max(st.maxFrontier, st.frontier.length);
}

function reconstructPath(st, goalKey) {
    st.path = [];
    let k = goalKey;
    while (k !== null && k !== undefined) {
        st.path.unshift(k);
        k = st.cameFrom[k];
    }
    st.pathLen = st.path.length - 1;
}

const INIT_FN = { bfs: initBFS, dfs: initDFS, greedy: initGreedy, astar: initAstar };
const STEP_FN = { bfs: stepBFS, dfs: stepDFS, greedy: stepGreedy, astar: stepAstar };

// ============================================================
// RENDERING
// ============================================================
function renderQuad(algoName) {
    const canvas = document.getElementById(`canvas-${algoName}`);
    const ctx = canvas.getContext('2d');
    const st = algoState[algoName];
    const N = scenario.N;
    const wrap = canvas.parentElement;
    const maxW = wrap.clientWidth - 8;
    const cellPx = Math.max(8, Math.floor(maxW / N));
    const size = cellPx * N;

    canvas.width = size;
    canvas.height = size;

    const pathSet = new Set(st.path);
    const [gr, gc] = scenario.goal;
    const [sr, sc] = scenario.start;

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const x = c * cellPx, y = r * cellPx;
            const k2 = key(r, c);

            let bg = CLR.bg;
            if (scenario.grid[r][c] === 1) {
                bg = CLR.wall;
            } else if (r === sr && c === sc) {
                bg = CLR.start;
            } else if (r === gr && c === gc) {
                bg = CLR.goal;
            } else if (pathSet.has(k2) && st.foundPath) {
                bg = CLR[algoName].path;
            } else if (st.explored.has(k2)) {
                bg = CLR[algoName].explored;
            } else if (st.frontierSet.has(k2)) {
                bg = CLR[algoName].frontier;
            }

            ctx.fillStyle = bg;
            ctx.fillRect(x, y, cellPx, cellPx);

            if (cellPx > 10) {
                ctx.strokeStyle = CLR.grid;
                ctx.lineWidth = 0.3;
                ctx.strokeRect(x, y, cellPx, cellPx);
            }
        }
    }

    // Update stats
    document.getElementById(`stat-${algoName}-explored`).textContent = st.exploredCount;
    document.getElementById(`stat-${algoName}-frontier`).textContent = st.frontier.length;
    document.getElementById(`stat-${algoName}-path`).textContent = st.foundPath ? st.pathLen : (st.finished ? '✗' : '—');

    // Done badge
    const doneBadge = document.getElementById(`done-${algoName}`);
    if (st.finished) {
        doneBadge.style.display = 'block';
        doneBadge.textContent = st.foundPath ? `✓ Camino: ${st.pathLen}` : '✗ Sin camino';
    } else {
        doneBadge.style.display = 'none';
    }
}

function renderAll() {
    ALGOS.forEach(a => renderQuad(a));
}

// ============================================================
// COMPARISON TABLE
// ============================================================
function updateCompareTable() {
    const allDone = ALGOS.every(a => algoState[a].finished);

    // Find optimal path (BFS or A* guaranteed optimal)
    let optimalLen = Infinity;
    if (algoState.astar.foundPath) optimalLen = algoState.astar.pathLen;
    else if (algoState.bfs.foundPath) optimalLen = algoState.bfs.pathLen;

    // Find min explored
    const finishedAlgos = ALGOS.filter(a => algoState[a].finished && algoState[a].foundPath);
    const minExplored = finishedAlgos.length > 0 ? Math.min(...finishedAlgos.map(a => algoState[a].exploredCount)) : Infinity;

    ALGOS.forEach(a => {
        const st = algoState[a];
        document.getElementById(`cmp-${a}-exp`).textContent = st.finished ? st.exploredCount : '...';
        document.getElementById(`cmp-${a}-front`).textContent = st.finished ? st.maxFrontier : '...';
        document.getElementById(`cmp-${a}-path`).textContent = st.foundPath ? st.pathLen : (st.finished ? '✗' : '...');

        if (st.foundPath && optimalLen < Infinity) {
            const isOpt = st.pathLen === optimalLen;
            document.getElementById(`cmp-${a}-opt`).innerHTML = isOpt ? '<span style="color:#16a34a">✓ Sí</span>' : '<span style="color:#ef4444">✗ No</span>';
        } else {
            document.getElementById(`cmp-${a}-opt`).textContent = st.finished ? '—' : '...';
        }

        // Highlight winner row
        const row = document.getElementById(`cmp-${a}-exp`).parentElement;
        if (allDone && st.foundPath && st.exploredCount === minExplored) {
            row.classList.add('winner-row');
        } else {
            row.classList.remove('winner-row');
        }
    });

    document.getElementById('compare-status').textContent = allDone ? 'Completado' : 'En progreso...';
}

// ============================================================
// STEPPING
// ============================================================
function stepAll() {
    if (allFinished) return;

    let anyActive = false;
    ALGOS.forEach(a => {
        const st = algoState[a];
        if (!st.finished) {
            STEP_FN[a](st);
            anyActive = true;
        }
    });

    renderAll();
    updateCompareTable();

    if (!anyActive) {
        allFinished = true;
        stopRunning();
        setStatus('found', '<strong>¡Comparación completa!</strong> Revisa la tabla inferior para ver las diferencias.');
        document.getElementById('btn-step').disabled = true;
        document.getElementById('btn-run').disabled = true;
        document.getElementById('btn-instant').disabled = true;
    }
}

function solveInstant() {
    stopRunning();
    let safety = 0;
    while (!allFinished && safety < 100000) {
        stepAll();
        safety++;
    }
}

// ============================================================
// ANIMATION
// ============================================================
function startRunning() {
    if (running || allFinished) return;
    running = true;
    document.getElementById('btn-run').textContent = '⏸ Pausar';

    function tick() {
        if (!running || allFinished) { stopRunning(); return; }
        stepAll();
        if (!allFinished) {
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
function loadScenario(id) {
    stopRunning();
    scenario = SCENARIOS[id]();
    allFinished = false;

    algoState = {};
    ALGOS.forEach(a => {
        algoState[a] = initAlgoState(a);
        INIT_FN[a](algoState[a]);
    });

    renderAll();
    updateCompareTable();
    setStatus('default', 'Presiona <strong>Ejecutar</strong> para ver los 4 algoritmos en acción simultáneamente.');
    document.getElementById('btn-step').disabled = false;
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-instant').disabled = false;
    ALGOS.forEach(a => { document.getElementById(`done-${a}`).style.display = 'none'; });
}

function setStatus(type, html) {
    const el = document.getElementById('status-box');
    el.className = 'status-box';
    if (type === 'found') el.classList.add('found');
    el.innerHTML = html;
}

// ============================================================
// EVENTS
// ============================================================
function setup() {
    document.getElementById('scenario-select').addEventListener('change', (e) => {
        loadScenario(e.target.value);
    });

    document.getElementById('btn-step').addEventListener('click', () => {
        if (running) stopRunning();
        stepAll();
    });

    document.getElementById('btn-run').addEventListener('click', () => {
        if (running) { stopRunning(); return; }
        startRunning();
    });

    document.getElementById('btn-instant').addEventListener('click', () => {
        solveInstant();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        loadScenario(document.getElementById('scenario-select').value);
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        document.getElementById('speed-value').textContent = speed + 'ms';
    });

    window.addEventListener('resize', () => {
        if (scenario) renderAll();
    });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setup();
    loadScenario('maze1');
});
