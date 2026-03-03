/**
 * N-Reinas Interactivo — Backtracking
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// COLORS
// ============================================================
const CLR = {
    light:    '#f0d9b5',
    dark:     '#b58863',
    attacked: 'rgba(239, 68, 68, 0.35)',
    queen:    '#1e293b',
    queenOk:  '#16a34a',
    queenTry: '#0073bb',
    queenBad: '#ef4444',
    highlight:'rgba(34,197,94,0.25)',
    pathHl:   'rgba(6,182,212,0.25)',
};

// ============================================================
// STATE
// ============================================================
let N = 4;
let mode = 'manual';       // 'manual' | 'auto'
let board = [];             // board[row] = col (-1 if empty)
let manualQueens = [];      // [{row, col}, ...]
let solutions = [];
let stats = { attempts: 0, prunes: 0, solutions: 0, queens: 0 };
let logEntries = [];
let running = false;
let timerId = null;
let speed = 100;
let btStack = [];           // backtracking stack of actions for step mode
let btFinished = false;
let allMode = false;

// ============================================================
// DOM
// ============================================================
let canvas, ctx;
let elBoardInfo, elStatusBox, elSpeedValue, elNValue;
let elStatQueens, elStatAttempts, elStatPrunes, elStatSolutions;
let elLogBox, elSolSection, elSolGrid, elSolCount;
let btnStep, btnRun, btnAll, btnReset;

function cacheDom() {
    canvas = document.getElementById('board');
    ctx = canvas.getContext('2d');
    elBoardInfo = document.getElementById('board-info');
    elStatusBox = document.getElementById('status-box');
    elSpeedValue = document.getElementById('speed-value');
    elNValue = document.getElementById('n-value');
    elStatQueens = document.getElementById('stat-queens');
    elStatAttempts = document.getElementById('stat-attempts');
    elStatPrunes = document.getElementById('stat-prunes');
    elStatSolutions = document.getElementById('stat-solutions');
    elLogBox = document.getElementById('log-box');
    elSolSection = document.getElementById('solutions-section');
    elSolGrid = document.getElementById('solutions-grid');
    elSolCount = document.getElementById('sol-count');
    btnStep = document.getElementById('btn-step');
    btnRun = document.getElementById('btn-run');
    btnAll = document.getElementById('btn-all');
    btnReset = document.getElementById('btn-reset');
}

// ============================================================
// BOARD HELPERS
// ============================================================
function initBoard() {
    board = new Array(N).fill(-1);
    manualQueens = [];
    solutions = [];
    stats = { attempts: 0, prunes: 0, solutions: 0, queens: 0 };
    logEntries = [];
    btStack = [];
    btFinished = false;
    allMode = false;
    stopRunning();
}

function isSafe(queens, row, col) {
    for (let r = 0; r < row; r++) {
        const c = queens[r];
        if (c === -1) continue;
        if (c === col) return false;
        if (Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
}

function getAttackedCells(queens) {
    const attacked = new Set();
    queens.forEach(q => {
        if (!q) return;
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (r === q.row && c === q.col) continue;
                if (c === q.col || r === q.row || Math.abs(c - q.col) === Math.abs(r - q.row)) {
                    attacked.add(`${r},${c}`);
                }
            }
        }
    });
    return attacked;
}

function hasConflict(queens) {
    for (let i = 0; i < queens.length; i++) {
        for (let j = i + 1; j < queens.length; j++) {
            const a = queens[i], b = queens[j];
            if (a.col === b.col || a.row === b.row) return true;
            if (Math.abs(a.col - b.col) === Math.abs(a.row - b.row)) return true;
        }
    }
    return false;
}

// ============================================================
// RENDERING
// ============================================================
function cellSize() {
    return Math.floor(canvas.width / N);
}

function renderBoard() {
    const sz = cellSize();
    canvas.width = sz * N;
    canvas.height = sz * N;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const attacked = mode === 'manual' ? getAttackedCells(manualQueens) : new Set();

    // Draw cells
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const x = c * sz, y = r * sz;
            const isLight = (r + c) % 2 === 0;
            ctx.fillStyle = isLight ? CLR.light : CLR.dark;
            ctx.fillRect(x, y, sz, sz);

            // Attacked overlay (manual mode)
            if (mode === 'manual' && attacked.has(`${r},${c}`)) {
                ctx.fillStyle = CLR.attacked;
                ctx.fillRect(x, y, sz, sz);
            }
        }
    }

    // Draw queens
    if (mode === 'manual') {
        manualQueens.forEach(q => {
            drawQueen(q.row, q.col, sz, CLR.queen);
        });
    } else {
        // Auto mode: draw from board[]
        for (let r = 0; r < N; r++) {
            if (board[r] >= 0) {
                const color = btFinished && stats.solutions > 0 ? CLR.queenOk : CLR.queenTry;
                drawQueen(r, board[r], sz, color);
            }
        }
    }
}

function drawQueen(row, col, sz, color) {
    const cx = col * sz + sz / 2;
    const cy = row * sz + sz / 2;
    const r = sz * 0.35;

    ctx.save();
    ctx.font = `${Math.round(sz * 0.6)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText('♛', cx, cy + 2);
    ctx.restore();
}

function renderMiniBoard(solution, canvasEl) {
    const miniCtx = canvasEl.getContext('2d');
    const n = solution.length;
    const sz = Math.floor(canvasEl.width / n);
    miniCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const x = c * sz, y = r * sz;
            miniCtx.fillStyle = (r + c) % 2 === 0 ? CLR.light : CLR.dark;
            miniCtx.fillRect(x, y, sz, sz);
        }
    }

    for (let r = 0; r < n; r++) {
        if (solution[r] >= 0) {
            const cx = solution[r] * sz + sz / 2;
            const cy = r * sz + sz / 2;
            miniCtx.font = `${Math.round(sz * 0.55)}px serif`;
            miniCtx.textAlign = 'center';
            miniCtx.textBaseline = 'middle';
            miniCtx.fillStyle = CLR.queenOk;
            miniCtx.fillText('♛', cx, cy + 1);
        }
    }
}

// ============================================================
// LOG
// ============================================================
function addLog(msg) {
    logEntries.push(msg);
    if (logEntries.length > 100) logEntries.shift();
    renderLog();
}

function renderLog() {
    if (logEntries.length === 0) {
        elLogBox.innerHTML = '<div class="log-entry" style="color:var(--text-muted);">Sin actividad.</div>';
        return;
    }
    let html = '';
    for (let i = logEntries.length - 1; i >= 0; i--) {
        html += `<div class="log-entry">${logEntries[i]}</div>`;
    }
    elLogBox.innerHTML = html;
}

function updateStats() {
    elStatQueens.textContent = stats.queens;
    elStatAttempts.textContent = stats.attempts;
    elStatPrunes.textContent = stats.prunes;
    elStatSolutions.textContent = stats.solutions;
}

// ============================================================
// MANUAL MODE
// ============================================================
function handleManualClick(e) {
    if (mode !== 'manual') return;
    const rect = canvas.getBoundingClientRect();
    const sz = cellSize();
    const col = Math.floor((e.clientX - rect.left) / sz);
    const row = Math.floor((e.clientY - rect.top) / sz);
    if (row < 0 || row >= N || col < 0 || col >= N) return;

    // Check if queen already exists at this position
    const idx = manualQueens.findIndex(q => q.row === row && q.col === col);
    if (idx >= 0) {
        manualQueens.splice(idx, 1);
        addLog(`Reina removida de (${row}, ${col})`);
    } else {
        manualQueens.push({ row, col });
        addLog(`<span class="log-place">Reina colocada</span> en (${row}, ${col})`);
    }

    stats.queens = manualQueens.length;
    updateStats();
    renderBoard();

    // Check if solved
    if (manualQueens.length === N && !hasConflict(manualQueens)) {
        stats.solutions = 1;
        updateStats();
        setStatus('found', `<strong>¡Solución encontrada!</strong> ${N} reinas colocadas sin conflictos.`);
        addLog(`<span class="log-solution">¡SOLUCIÓN!</span> ${N} reinas sin conflictos`);
    } else if (manualQueens.length > 0 && hasConflict(manualQueens)) {
        setStatus('conflict', `<strong>Conflicto detectado.</strong> Hay reinas que se atacan entre sí.`);
    } else {
        setStatus('default', `<strong>Modo manual:</strong> haz clic en una celda para colocar o quitar una reina. Llevas ${manualQueens.length}/${N}.`);
    }
}

// ============================================================
// BACKTRACKING — step-by-step generator
// ============================================================
function* backtrackGenerator(findAll) {
    board = new Array(N).fill(-1);
    stats.attempts = 0;
    stats.prunes = 0;
    stats.solutions = 0;
    stats.queens = 0;
    solutions = [];

    function* solve(row) {
        if (row === N) {
            // Found a solution
            stats.solutions++;
            stats.queens = N;
            const sol = [...board];
            solutions.push(sol);
            addLog(`<span class="log-solution">SOLUCIÓN #${stats.solutions}</span> encontrada: [${sol.join(', ')}]`);
            yield { type: 'solution', solution: sol };
            if (!findAll) return true;
            return false;
        }

        for (let col = 0; col < N; col++) {
            stats.attempts++;
            board[row] = col;
            stats.queens = row + 1;

            if (isSafe(board, row, col)) {
                addLog(`<span class="log-place">Colocar</span> reina en fila ${row}, col ${col}`);
                yield { type: 'place', row, col };

                const result = yield* solve(row + 1);
                if (result === true) return true;
            } else {
                stats.prunes++;
                addLog(`<span class="log-conflict">Conflicto</span> en fila ${row}, col ${col} — poda`);
                yield { type: 'conflict', row, col };
            }

            // Backtrack
            board[row] = -1;
            stats.queens = row;
        }

        if (row > 0) {
            addLog(`<span class="log-backtrack">Backtrack</span> desde fila ${row} a fila ${row - 1}`);
            yield { type: 'backtrack', row };
        }

        return false;
    }

    yield* solve(0);
    btFinished = true;
    yield { type: 'done' };
}

let btGenerator = null;

function btStep() {
    if (btFinished) return 'done';
    if (!btGenerator) {
        btGenerator = backtrackGenerator(allMode);
    }

    const result = btGenerator.next();
    if (result.done) {
        btFinished = true;
        finishBacktracking();
        return 'done';
    }

    const action = result.value;
    updateStats();
    renderBoard();

    if (action.type === 'solution') {
        showSolutions();
        if (!allMode) {
            btFinished = true;
            finishBacktracking();
            return 'done';
        }
    }

    if (action.type === 'done') {
        btFinished = true;
        finishBacktracking();
        return 'done';
    }

    // Update status
    if (action.type === 'place') {
        setStatus('default', `Paso: colocar reina en (<strong>${action.row}, ${action.col}</strong>). Intentos: ${stats.attempts}`);
    } else if (action.type === 'conflict') {
        setStatus('conflict', `Conflicto en (<strong>${action.row}, ${action.col}</strong>) — poda. Podas totales: ${stats.prunes}`);
    } else if (action.type === 'backtrack') {
        setStatus('default', `Backtrack desde fila <strong>${action.row}</strong>. Intentos: ${stats.attempts}`);
    } else if (action.type === 'solution') {
        setStatus('found', `<strong>¡Solución #${stats.solutions} encontrada!</strong>`);
    }

    return action.type;
}

function finishBacktracking() {
    stopRunning();
    renderBoard();
    updateStats();
    showSolutions();

    if (stats.solutions > 0) {
        setStatus('found', `<strong>Backtracking completo.</strong> ${stats.solutions} solución(es) encontrada(s). ${stats.attempts} intentos, ${stats.prunes} podas.`);
    } else {
        setStatus('conflict', `<strong>Backtracking completo.</strong> No se encontraron soluciones.`);
    }

    btnStep.disabled = true;
    btnRun.disabled = true;
}

function showSolutions() {
    if (solutions.length === 0) {
        elSolSection.style.display = 'none';
        return;
    }
    elSolSection.style.display = 'block';
    elSolCount.textContent = solutions.length;
    elSolGrid.innerHTML = '';

    solutions.forEach((sol, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'solution-mini';
        const miniSize = Math.min(80, Math.floor(320 / N) * N);
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = miniSize;
        miniCanvas.height = miniSize;
        wrapper.appendChild(miniCanvas);
        const label = document.createElement('div');
        label.className = 'solution-label';
        label.textContent = `#${idx + 1}`;
        wrapper.appendChild(label);

        wrapper.addEventListener('click', () => {
            board = [...sol];
            stats.queens = N;
            renderBoard();
            document.querySelectorAll('.solution-mini').forEach(s => s.classList.remove('active'));
            wrapper.classList.add('active');
        });

        elSolGrid.appendChild(wrapper);
        renderMiniBoard(sol, miniCanvas);
    });
}

// ============================================================
// ANIMATION
// ============================================================
function startRunning() {
    if (running || btFinished) return;
    running = true;
    btnRun.textContent = '⏸ Pausar';

    function tick() {
        if (!running || btFinished) { stopRunning(); return; }
        const result = btStep();
        if (result === 'done') {
            stopRunning();
        } else if (result === 'conflict' || result === 'backtrack') {
            timerId = setTimeout(tick, Math.max(10, speed / 3));
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
    btnRun.textContent = '⏩ Ejecutar';
}

// ============================================================
// STATUS
// ============================================================
function setStatus(type, html) {
    elStatusBox.className = 'status-box';
    if (type === 'found') elStatusBox.classList.add('found');
    if (type === 'conflict') elStatusBox.classList.add('conflict');
    elStatusBox.innerHTML = html;
}

// ============================================================
// MODE SWITCHING
// ============================================================
function setMode(newMode) {
    mode = newMode;
    initBoard();

    const autoControls = [btnStep, btnRun, btnAll];
    const speedGroup = document.getElementById('speed-group');

    if (mode === 'manual') {
        autoControls.forEach(b => b.style.display = 'none');
        speedGroup.style.display = 'none';
        setStatus('default', '<strong>Modo manual:</strong> haz clic en una celda para colocar o quitar una reina.');
    } else {
        autoControls.forEach(b => { b.style.display = ''; b.disabled = false; });
        speedGroup.style.display = '';
        setStatus('default', 'Usa <strong>Paso</strong> para avanzar uno a uno, o <strong>Ejecutar</strong> para animación continua.');
    }

    elSolSection.style.display = 'none';
    updateStats();
    renderBoard();
    renderLog();
}

// ============================================================
// RESIZE
// ============================================================
function handleResize() {
    const wrap = canvas.parentElement;
    const maxW = wrap.clientWidth - 24;
    const sz = Math.floor(Math.min(maxW, 520) / N) * N;
    canvas.width = sz;
    canvas.height = sz;
    renderBoard();
}

// ============================================================
// EVENTS
// ============================================================
function setup() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setMode(btn.dataset.mode);
        });
    });

    document.getElementById('n-slider').addEventListener('input', (e) => {
        N = parseInt(e.target.value);
        elNValue.textContent = N;
        elBoardInfo.textContent = `${N} × ${N}`;
        initBoard();
        btGenerator = null;
        handleResize();
        updateStats();
        renderLog();
        if (mode === 'manual') {
            setStatus('default', '<strong>Modo manual:</strong> haz clic en una celda para colocar o quitar una reina.');
        } else {
            setStatus('default', 'Usa <strong>Paso</strong> para avanzar uno a uno, o <strong>Ejecutar</strong> para animación continua.');
            btnStep.disabled = false;
            btnRun.disabled = false;
        }
        elSolSection.style.display = 'none';
    });

    btnStep.addEventListener('click', () => {
        if (running) stopRunning();
        allMode = false;
        btStep();
    });

    btnRun.addEventListener('click', () => {
        if (running) { stopRunning(); return; }
        allMode = false;
        startRunning();
    });

    btnAll.addEventListener('click', () => {
        if (running) stopRunning();
        // Reset and find all
        initBoard();
        btGenerator = null;
        allMode = true;
        btFinished = false;
        updateStats();
        renderBoard();
        renderLog();
        addLog('<strong>Buscando todas las soluciones...</strong>');
        startRunning();
    });

    btnReset.addEventListener('click', () => {
        initBoard();
        btGenerator = null;
        handleResize();
        updateStats();
        renderLog();
        elSolSection.style.display = 'none';
        if (mode === 'manual') {
            setStatus('default', '<strong>Modo manual:</strong> haz clic en una celda para colocar o quitar una reina.');
        } else {
            btnStep.disabled = false;
            btnRun.disabled = false;
            setStatus('default', 'Usa <strong>Paso</strong> para avanzar uno a uno, o <strong>Ejecutar</strong> para animación continua.');
        }
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        elSpeedValue.textContent = speed + 'ms';
    });

    canvas.addEventListener('click', handleManualClick);
    window.addEventListener('resize', handleResize);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setup();
    initBoard();
    requestAnimationFrame(() => {
        handleResize();
        updateStats();
    });
});
