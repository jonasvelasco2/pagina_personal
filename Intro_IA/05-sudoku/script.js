/**
 * Sudoku con Backtracking
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// PUZZLES
// ============================================================
const PUZZLES = {
    easy: [
        [5,3,0, 0,7,0, 0,0,0],
        [6,0,0, 1,9,5, 0,0,0],
        [0,9,8, 0,0,0, 0,6,0],
        [8,0,0, 0,6,0, 0,0,3],
        [4,0,0, 8,0,3, 0,0,1],
        [7,0,0, 0,2,0, 0,0,6],
        [0,6,0, 0,0,0, 2,8,0],
        [0,0,0, 4,1,9, 0,0,5],
        [0,0,0, 0,8,0, 0,7,9],
    ],
    medium: [
        [0,0,0, 6,0,0, 4,0,0],
        [7,0,0, 0,0,3, 6,0,0],
        [0,0,0, 0,9,1, 0,8,0],
        [0,0,0, 0,0,0, 0,0,0],
        [0,5,0, 1,8,0, 0,0,3],
        [0,0,0, 3,0,6, 0,4,5],
        [0,4,0, 2,0,0, 0,6,0],
        [9,0,3, 0,0,0, 0,0,0],
        [0,2,0, 0,0,0, 1,0,0],
    ],
    hard: [
        [0,0,0, 0,0,0, 0,0,0],
        [0,0,0, 0,0,3, 0,8,5],
        [0,0,1, 0,2,0, 0,0,0],
        [0,0,0, 5,0,7, 0,0,0],
        [0,0,4, 0,0,0, 1,0,0],
        [0,9,0, 0,0,0, 0,0,0],
        [5,0,0, 0,0,0, 0,7,3],
        [0,0,2, 0,1,0, 0,0,0],
        [0,0,0, 0,4,0, 0,0,9],
    ],
};

const PUZZLE_LABELS = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };

// ============================================================
// STATE
// ============================================================
let grid = [];          // 9x9 current grid
let given = [];         // 9x9 booleans — true if cell is part of original puzzle
let cellStates = [];    // 9x9 strings: '', 'current', 'trying', 'conflict', 'solved', 'backtrack'
let stats = { filled: 0, empty: 0, attempts: 0, backtracks: 0 };
let logEntries = [];
let running = false;
let timerId = null;
let speed = 30;
let btGenerator = null;
let btFinished = false;
let currentPuzzle = 'easy';

// ============================================================
// DOM
// ============================================================
let elGrid, elLogBox, elStatusBox, elBoardInfo, elSpeedValue;
let elStatFilled, elStatEmpty, elStatAttempts, elStatBacktracks;
let btnStep, btnRun, btnSolve, btnReset;

function cacheDom() {
    elGrid = document.getElementById('sudoku-grid');
    elLogBox = document.getElementById('log-box');
    elStatusBox = document.getElementById('status-box');
    elBoardInfo = document.getElementById('board-info');
    elSpeedValue = document.getElementById('speed-value');
    elStatFilled = document.getElementById('stat-filled');
    elStatEmpty = document.getElementById('stat-empty');
    elStatAttempts = document.getElementById('stat-attempts');
    elStatBacktracks = document.getElementById('stat-backtracks');
    btnStep = document.getElementById('btn-step');
    btnRun = document.getElementById('btn-run');
    btnSolve = document.getElementById('btn-solve');
    btnReset = document.getElementById('btn-reset');
}

// ============================================================
// GRID HELPERS
// ============================================================
function loadPuzzle(key) {
    currentPuzzle = key;
    const puzzle = PUZZLES[key];
    grid = puzzle.map(row => [...row]);
    given = puzzle.map(row => row.map(v => v !== 0));
    cellStates = Array.from({ length: 9 }, () => Array(9).fill(''));
    stats = { filled: 0, empty: 0, attempts: 0, backtracks: 0 };
    logEntries = [];
    btGenerator = null;
    btFinished = false;
    stopRunning();

    // Count
    let empty = 0;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (grid[r][c] === 0) empty++;
    stats.empty = empty;
    stats.filled = 81 - empty;

    elBoardInfo.textContent = `${PUZZLE_LABELS[key]} — ${empty} celdas vacías`;
    renderGrid();
    updateStats();
    renderLog();
    setStatus('default', 'Selecciona un puzzle y presiona <strong>Paso</strong> para resolver celda por celda, o <strong>Ejecutar</strong> para animación continua.');
    btnStep.disabled = false;
    btnRun.disabled = false;
    btnSolve.disabled = false;
}

function isValid(grid, row, col, num) {
    // Row
    for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === num) return false;
    }
    // Column
    for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col] === num) return false;
    }
    // 3x3 box
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (r !== row && c !== col && grid[r][c] === num) return false;
        }
    }
    return true;
}

function findNextEmpty(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) return [r, c];
        }
    }
    return null;
}

// ============================================================
// RENDERING
// ============================================================
function buildGrid() {
    elGrid.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            elGrid.appendChild(cell);
        }
    }
}

function renderGrid() {
    const cells = elGrid.children;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const idx = r * 9 + c;
            const cell = cells[idx];
            const val = grid[r][c];

            cell.textContent = val > 0 ? val : '';

            // Classes
            cell.className = 'sudoku-cell';
            if (given[r][c]) {
                cell.classList.add('given');
            } else {
                const st = cellStates[r][c];
                if (st) cell.classList.add(st);
            }
        }
    }
}

// ============================================================
// LOG
// ============================================================
function addLog(msg) {
    logEntries.push(msg);
    if (logEntries.length > 150) logEntries.shift();
    renderLog();
}

function renderLog() {
    if (logEntries.length === 0) {
        elLogBox.innerHTML = '<div class="log-entry" style="color:var(--text-muted);">Carga un puzzle y presiona Paso o Ejecutar.</div>';
        return;
    }
    let html = '';
    for (let i = logEntries.length - 1; i >= 0; i--) {
        html += `<div class="log-entry">${logEntries[i]}</div>`;
    }
    elLogBox.innerHTML = html;
}

function updateStats() {
    // Recount filled/empty
    let filled = 0;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (grid[r][c] > 0) filled++;
    stats.filled = filled;
    stats.empty = 81 - filled;

    elStatFilled.textContent = stats.filled;
    elStatEmpty.textContent = stats.empty;
    elStatAttempts.textContent = stats.attempts;
    elStatBacktracks.textContent = stats.backtracks;
}

function setStatus(type, html) {
    elStatusBox.className = 'status-box';
    if (type === 'found') elStatusBox.classList.add('found');
    if (type === 'error') elStatusBox.classList.add('error');
    elStatusBox.innerHTML = html;
}

// ============================================================
// BACKTRACKING GENERATOR
// ============================================================
function* solveGenerator() {
    // Clear all non-given cell states
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (!given[r][c]) {
                cellStates[r][c] = '';
                grid[r][c] = 0;
            }
        }
    }

    function* solve() {
        const pos = findNextEmpty(grid);
        if (!pos) {
            // Solved!
            return true;
        }

        const [row, col] = pos;
        cellStates[row][col] = 'current';
        yield { type: 'focus', row, col };

        for (let num = 1; num <= 9; num++) {
            stats.attempts++;
            grid[row][col] = num;
            cellStates[row][col] = 'trying';
            addLog(`<span class="log-try">Probar</span> ${num} en (${row},${col})`);
            yield { type: 'try', row, col, num };

            if (isValid(grid, row, col, num)) {
                cellStates[row][col] = 'solved';
                addLog(`<span class="log-place">Colocar</span> ${num} en (${row},${col}) ✓`);
                yield { type: 'place', row, col, num };

                const result = yield* solve();
                if (result) return true;

                // Backtrack
                grid[row][col] = 0;
                cellStates[row][col] = 'backtrack';
                stats.backtracks++;
                addLog(`<span class="log-backtrack">Backtrack</span> en (${row},${col}) — quitar ${num}`);
                yield { type: 'backtrack', row, col, num };
            } else {
                cellStates[row][col] = 'conflict';
                stats.backtracks++;
                addLog(`<span class="log-conflict">Conflicto</span> ${num} en (${row},${col}) ✗`);
                yield { type: 'conflict', row, col, num };
            }
        }

        // No valid number found — full backtrack from this cell
        grid[row][col] = 0;
        cellStates[row][col] = '';
        yield { type: 'clear', row, col };
        return false;
    }

    const solved = yield* solve();

    if (solved) {
        // Mark all solved cells
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (!given[r][c]) cellStates[r][c] = 'solved';
            }
        }
        addLog(`<span class="log-solved">¡RESUELTO!</span> ${stats.attempts} intentos, ${stats.backtracks} backtracks`);
        yield { type: 'solved' };
    } else {
        addLog(`<span class="log-conflict">Sin solución</span> después de ${stats.attempts} intentos`);
        yield { type: 'unsolvable' };
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
        finishSolving();
        return 'done';
    }

    const action = result.value;
    renderGrid();
    updateStats();

    if (action.type === 'try') {
        setStatus('default', `Probando <strong>${action.num}</strong> en (${action.row}, ${action.col}). Intentos: ${stats.attempts}`);
    } else if (action.type === 'place') {
        setStatus('default', `Colocado <strong>${action.num}</strong> en (${action.row}, ${action.col}) ✓`);
    } else if (action.type === 'conflict') {
        setStatus('error', `Conflicto: <strong>${action.num}</strong> no es válido en (${action.row}, ${action.col})`);
    } else if (action.type === 'backtrack') {
        setStatus('default', `Backtrack en (${action.row}, ${action.col}) — quitar <strong>${action.num}</strong>`);
    } else if (action.type === 'solved') {
        btFinished = true;
        finishSolving();
        return 'done';
    } else if (action.type === 'unsolvable') {
        btFinished = true;
        setStatus('error', '<strong>Este puzzle no tiene solución.</strong>');
        btnStep.disabled = true;
        btnRun.disabled = true;
        return 'done';
    }

    return action.type;
}

function finishSolving() {
    stopRunning();
    renderGrid();
    updateStats();
    setStatus('found', `<strong>¡Sudoku resuelto!</strong> ${stats.attempts} intentos, ${stats.backtracks} backtracks.`);
    btnStep.disabled = true;
    btnRun.disabled = true;
    btnSolve.disabled = true;
}

// ============================================================
// SOLVE INSTANTLY
// ============================================================
function solveInstant() {
    stopRunning();
    // Reset grid to puzzle
    const puzzle = PUZZLES[currentPuzzle];
    grid = puzzle.map(row => [...row]);
    cellStates = Array.from({ length: 9 }, () => Array(9).fill(''));
    stats.attempts = 0;
    stats.backtracks = 0;
    logEntries = [];

    function solve() {
        const pos = findNextEmpty(grid);
        if (!pos) return true;
        const [row, col] = pos;
        for (let num = 1; num <= 9; num++) {
            stats.attempts++;
            if (isValid(grid, row, col, num)) {
                grid[row][col] = num;
                if (solve()) return true;
                grid[row][col] = 0;
                stats.backtracks++;
            } else {
                stats.backtracks++;
            }
        }
        return false;
    }

    const solved = solve();

    if (solved) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (!given[r][c]) cellStates[r][c] = 'solved';
            }
        }
        addLog(`<span class="log-solved">¡RESUELTO!</span> ${stats.attempts} intentos, ${stats.backtracks} backtracks`);
        btFinished = true;
        renderGrid();
        updateStats();
        renderLog();
        setStatus('found', `<strong>¡Sudoku resuelto!</strong> ${stats.attempts} intentos, ${stats.backtracks} backtracks.`);
        btnStep.disabled = true;
        btnRun.disabled = true;
        btnSolve.disabled = true;
    } else {
        addLog(`<span class="log-conflict">Sin solución</span>`);
        setStatus('error', '<strong>Este puzzle no tiene solución.</strong>');
    }
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
        } else if (result === 'conflict' || result === 'focus' || result === 'clear') {
            timerId = setTimeout(tick, Math.max(1, speed / 4));
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
// EVENTS
// ============================================================
function setup() {
    document.getElementById('puzzle-select').addEventListener('change', (e) => {
        loadPuzzle(e.target.value);
    });

    btnStep.addEventListener('click', () => {
        if (running) stopRunning();
        btStep();
    });

    btnRun.addEventListener('click', () => {
        if (running) { stopRunning(); return; }
        startRunning();
    });

    btnSolve.addEventListener('click', () => {
        solveInstant();
    });

    btnReset.addEventListener('click', () => {
        loadPuzzle(currentPuzzle);
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        elSpeedValue.textContent = speed + 'ms';
    });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    buildGrid();
    setup();
    loadPuzzle('easy');
});
