/**
 * Visualizador interactivo de Pila y Cola
 * Inteligencia Artificial — Universidad Panamericana
 * Dr. Jonás Velasco Álvarez
 */

// ============================================================
// STATE
// ============================================================
const stack = [];
const queue = [];
let autoRunning = false;
let autoTimerId = null;
let autoStep = 0;
let nextId = 1;
let logEntries = [];

// ============================================================
// DOM REFS
// ============================================================
let elStackBody, elQueueBody, elStackCount, elQueueCount;
let elStackEmpty, elQueueEmpty, elLogList, elInputValue;
let btnPushStack, btnPopStack, btnEnqueue, btnDequeue, btnAuto, btnClear;

function cacheDom() {
    elStackBody = document.getElementById('stack-body');
    elQueueBody = document.getElementById('queue-body');
    elStackCount = document.getElementById('stack-count');
    elQueueCount = document.getElementById('queue-count');
    elStackEmpty = document.getElementById('stack-empty');
    elQueueEmpty = document.getElementById('queue-empty');
    elLogList = document.getElementById('log-list');
    elInputValue = document.getElementById('input-value');
    btnPushStack = document.getElementById('btn-push-stack');
    btnPopStack = document.getElementById('btn-pop-stack');
    btnEnqueue = document.getElementById('btn-enqueue');
    btnDequeue = document.getElementById('btn-dequeue');
    btnAuto = document.getElementById('btn-auto');
    btnClear = document.getElementById('btn-clear');
}

// ============================================================
// AUTO-MODE GRAPH (A→F from presentation)
// ============================================================
const AUTO_GRAPH = {
    adj: {
        'A': ['B', 'C'],
        'B': ['A', 'D', 'E'],
        'C': ['A', 'E'],
        'D': ['B', 'F'],
        'E': ['B', 'C', 'F'],
        'F': ['D', 'E'],
    },
    start: 'A',
    goal: 'F',
};

let dfsState = null;
let bfsState = null;

function initAutoStates() {
    dfsState = {
        frontier: [AUTO_GRAPH.start],
        visited: new Set(),
        finished: false,
    };
    bfsState = {
        frontier: [AUTO_GRAPH.start],
        visited: new Set(),
        finished: false,
    };
}

// ============================================================
// RENDERING
// ============================================================
function renderStack() {
    elStackCount.textContent = stack.length;
    elStackEmpty.style.display = stack.length === 0 ? 'block' : 'none';

    // Build items — top of stack first (last pushed = index stack.length-1)
    const existing = elStackBody.querySelectorAll('.struct-item');
    const existingIds = new Set();
    existing.forEach(el => existingIds.add(el.dataset.uid));

    let html = '';
    for (let i = stack.length - 1; i >= 0; i--) {
        const item = stack[i];
        const isTop = (i === stack.length - 1);
        const pointer = isTop ? '<span class="item-pointer">← tope</span>' : '';
        const animClass = item.animIn ? ' highlight-in' : '';
        html += `<div class="struct-item stack-item${animClass}" data-uid="${item.uid}">${item.value}${pointer}</div>`;
    }
    // Keep empty msg
    const emptyDiv = elStackEmpty.outerHTML;
    elStackBody.innerHTML = emptyDiv + html;
    elStackEmpty = document.getElementById('stack-empty');

    // Clear animIn flags
    stack.forEach(item => { item.animIn = false; });
}

function renderQueue() {
    elQueueCount.textContent = queue.length;
    elQueueEmpty.style.display = queue.length === 0 ? 'block' : 'none';

    let html = '';
    for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const isFront = (i === 0);
        const isBack = (i === queue.length - 1);
        let pointer = '';
        if (isFront && isBack) pointer = '<span class="item-pointer">← frente/final</span>';
        else if (isFront) pointer = '<span class="item-pointer">← frente</span>';
        else if (isBack) pointer = '<span class="item-pointer">← final</span>';
        const animClass = item.animIn ? ' highlight-in' : '';
        html += `<div class="struct-item queue-item${animClass}" data-uid="${item.uid}">${item.value}${pointer}</div>`;
    }

    const emptyDiv = elQueueEmpty.outerHTML;
    elQueueBody.innerHTML = emptyDiv + html;
    elQueueEmpty = document.getElementById('queue-empty');

    queue.forEach(item => { item.animIn = false; });
}

// ============================================================
// LOG
// ============================================================
function addLog(message) {
    logEntries.push(message);
    if (logEntries.length > 50) logEntries.shift();
    renderLog();
}

function renderLog() {
    if (logEntries.length === 0) {
        elLogList.innerHTML = '<div class="log-entry" style="color:var(--text-muted);">Sin operaciones aún.</div>';
        return;
    }
    let html = '';
    for (let i = logEntries.length - 1; i >= 0; i--) {
        html += `<div class="log-entry">${logEntries[i]}</div>`;
    }
    elLogList.innerHTML = html;
}

// ============================================================
// STACK OPERATIONS
// ============================================================
function pushStack(value) {
    const uid = 'item-' + (nextId++);
    stack.push({ value, uid, animIn: true });
    addLog(`<span class="op-push">PUSH</span> Pila ← <strong>${value}</strong> &nbsp; [${stack.map(i => i.value).join(', ')}]`);
    renderStack();
}

function popStack() {
    if (stack.length === 0) return null;
    const item = stack.pop();
    addLog(`<span class="op-pop">POP</span> Pila → <strong>${item.value}</strong> &nbsp; [${stack.map(i => i.value).join(', ')}]`);

    // Animate out
    const topEl = elStackBody.querySelector('.struct-item');
    if (topEl) {
        topEl.classList.add('highlight-out');
        setTimeout(() => renderStack(), 300);
    } else {
        renderStack();
    }
    return item.value;
}

// ============================================================
// QUEUE OPERATIONS
// ============================================================
function enqueue(value) {
    const uid = 'item-' + (nextId++);
    queue.push({ value, uid, animIn: true });
    addLog(`<span class="op-push">ENQUEUE</span> Cola ← <strong>${value}</strong> &nbsp; [${queue.map(i => i.value).join(', ')}]`);
    renderQueue();
}

function dequeue() {
    if (queue.length === 0) return null;
    const item = queue.shift();
    addLog(`<span class="op-pop">DEQUEUE</span> Cola → <strong>${item.value}</strong> &nbsp; [${queue.map(i => i.value).join(', ')}]`);

    const frontEl = elQueueBody.querySelector('.struct-item');
    if (frontEl) {
        frontEl.classList.add('highlight-out');
        setTimeout(() => renderQueue(), 300);
    } else {
        renderQueue();
    }
    return item.value;
}

// ============================================================
// AUTO MODE — DFS + BFS simultaneously on the graph
// ============================================================
function autoStepOnce() {
    let dfsMsg = '';
    let bfsMsg = '';

    // DFS step (stack)
    if (!dfsState.finished) {
        if (dfsState.frontier.length === 0) {
            dfsState.finished = true;
            dfsMsg = 'DFS: Pila vacía — terminado.';
        } else {
            const current = dfsState.frontier.pop();
            if (dfsState.visited.has(current)) {
                // Pop from stack but skip
                const uid = 'item-' + (nextId++);
                stack.push({ value: current, uid, animIn: true });
                renderStack();
                setTimeout(() => {
                    if (stack.length > 0 && stack[stack.length - 1].value === current) {
                        stack.pop();
                        renderStack();
                    }
                }, 400);
                dfsMsg = `DFS: Pop <strong>${current}</strong> (ya visitado, descartado)`;
            } else {
                dfsState.visited.add(current);
                // Show push then pop on the visual stack
                pushStack(current);
                if (current === AUTO_GRAPH.goal) {
                    dfsState.finished = true;
                    dfsMsg = `DFS: Pop <strong>${current}</strong> — ¡Meta encontrada!`;
                } else {
                    const neighbors = AUTO_GRAPH.adj[current] || [];
                    const toExpand = neighbors.filter(n => !dfsState.visited.has(n)).reverse();
                    toExpand.forEach(n => {
                        dfsState.frontier.push(n);
                    });
                    dfsMsg = `DFS: Visita <strong>${current}</strong>, push vecinos [${toExpand.reverse().join(', ')}]`;
                }
            }
        }
    }

    // BFS step (queue)
    if (!bfsState.finished) {
        if (bfsState.frontier.length === 0) {
            bfsState.finished = true;
            bfsMsg = 'BFS: Cola vacía — terminado.';
        } else {
            const current = bfsState.frontier.shift();
            if (bfsState.visited.has(current)) {
                bfsMsg = `BFS: Dequeue <strong>${current}</strong> (ya visitado, descartado)`;
            } else {
                bfsState.visited.add(current);
                enqueue(current);
                if (current === AUTO_GRAPH.goal) {
                    bfsState.finished = true;
                    bfsMsg = `BFS: Dequeue <strong>${current}</strong> — ¡Meta encontrada!`;
                } else {
                    const neighbors = AUTO_GRAPH.adj[current] || [];
                    const toExpand = neighbors.filter(n => !bfsState.visited.has(n) && !bfsState.frontier.includes(n));
                    toExpand.forEach(n => {
                        bfsState.frontier.push(n);
                    });
                    bfsMsg = `BFS: Visita <strong>${current}</strong>, enqueue vecinos [${toExpand.join(', ')}]`;
                }
            }
        }
    }

    if (dfsMsg) addLog(dfsMsg);
    if (bfsMsg) addLog(bfsMsg);

    if (dfsState.finished && bfsState.finished) {
        stopAuto();
        addLog('<strong>— Simulación finalizada —</strong>');
    }
}

function startAuto() {
    if (autoRunning) { stopAuto(); return; }

    // Clear current structures
    clearAll(false);
    initAutoStates();
    autoRunning = true;
    autoStep = 0;
    btnAuto.innerHTML = '&#9724; Detener';
    addLog('<strong>— Modo Auto: DFS (pila) y BFS (cola) sobre grafo A→F —</strong>');

    function tick() {
        if (!autoRunning) return;
        autoStepOnce();
        autoStep++;
        if (autoRunning) {
            autoTimerId = setTimeout(tick, 1000);
        }
    }
    tick();
}

function stopAuto() {
    autoRunning = false;
    clearTimeout(autoTimerId);
    autoTimerId = null;
    btnAuto.innerHTML = '&#9654; DFS/BFS Auto';
}

// ============================================================
// CLEAR
// ============================================================
function clearAll(clearLog) {
    stack.length = 0;
    queue.length = 0;
    renderStack();
    renderQueue();
    if (clearLog !== false) {
        logEntries = [];
        renderLog();
    }
    stopAuto();
}

// ============================================================
// AUTO VALUE GENERATION
// ============================================================
let autoValueIdx = 0;
const autoValues = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getNextValue() {
    const val = elInputValue.value.trim();
    if (val) {
        elInputValue.value = '';
        return val.toUpperCase();
    }
    const v = autoValues[autoValueIdx % autoValues.length];
    autoValueIdx++;
    return v;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setup() {
    btnPushStack.addEventListener('click', () => {
        if (autoRunning) stopAuto();
        pushStack(getNextValue());
    });

    btnPopStack.addEventListener('click', () => {
        if (autoRunning) stopAuto();
        popStack();
    });

    btnEnqueue.addEventListener('click', () => {
        if (autoRunning) stopAuto();
        enqueue(getNextValue());
    });

    btnDequeue.addEventListener('click', () => {
        if (autoRunning) stopAuto();
        dequeue();
    });

    btnAuto.addEventListener('click', () => {
        startAuto();
    });

    btnClear.addEventListener('click', () => {
        clearAll(true);
        autoValueIdx = 0;
    });

    // Allow Enter key to push/enqueue
    elInputValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            pushStack(getNextValue());
        }
    });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setup();
    renderStack();
    renderQueue();
});
