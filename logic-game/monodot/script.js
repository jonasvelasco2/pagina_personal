document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const nodePool = document.getElementById('node-pool');
    const difficultySelect = document.getElementById('difficulty-select');
    const newGameBtn = document.getElementById('new-game-btn');
    const resetBtn = document.getElementById('reset-btn');
    const checkBtn = document.getElementById('check-btn');
    const downloadBtn = document.getElementById('download-btn');
    const winOverlay = document.getElementById('win-overlay');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const levelDisplay = document.getElementById('level-display');

    let gridSize = 5;
    let nodeCount = 6;
    let nodes = []; // {id, requiredDegree, currentDegree, r, c (if placed), placed: bool}
    let grid = []; // 2D array storing node IDs or null
    let level = 1;
    let draggedNodeId = null;

    // Initialize
    initGame();

    // Event Listeners
    newGameBtn.addEventListener('click', startNewGame);
    resetBtn.addEventListener('click', resetBoard);
    checkBtn.addEventListener('click', checkSolution);
    downloadBtn.addEventListener('click', downloadInstance);
    nextLevelBtn.addEventListener('click', () => {
        level++;
        levelDisplay.textContent = level;
        startNewGame();
    });

    difficultySelect.addEventListener('change', startNewGame);

    function initGame() {
        parseDifficulty();
        generateLevel();
        renderBoard();
        renderPool();
    }

    function parseDifficulty() {
        const diff = difficultySelect.value;
        if (diff === 'easy') { gridSize = 4; nodeCount = 4; }
        else if (diff === 'medium') { gridSize = 5; nodeCount = 6; }
        else if (diff === 'hard') { gridSize = 6; nodeCount = 8; }
        else if (diff === 'expert') { gridSize = 8; nodeCount = 12; }
        else if (diff === 'master') { gridSize = 12; nodeCount = 20; }
        else if (diff === 'insane') { gridSize = 15; nodeCount = 30; }
        else if (diff === 'god') { gridSize = 20; nodeCount = 50; }

        // Update grid CSS
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        // Adjust font size for large grids
        if (gridSize >= 15) {
            gameBoard.style.fontSize = '0.6rem';
        } else if (gridSize >= 12) {
            gameBoard.style.fontSize = '0.8rem';
        } else {
            gameBoard.style.fontSize = '1.2rem';
        }
    }

    function startNewGame() {
        winOverlay.classList.add('hidden');
        parseDifficulty();
        generateLevel();
        renderBoard();
        renderPool();
    }

    function resetBoard() {
        // Return all nodes to pool
        nodes.forEach(n => {
            n.placed = false;
            n.r = null;
            n.c = null;
            n.currentDegree = 0;
        });
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
        renderBoard();
        renderPool();
    }

    function generateLevel() {
        nodes = [];
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));

        // 1. Place nodes randomly
        let placedCount = 0;
        let tempNodes = [];

        while (placedCount < nodeCount) {
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);

            if (grid[r][c] === null) {
                const id = placedCount;
                grid[r][c] = id;
                tempNodes.push({ id, r, c });
                placedCount++;
            }
        }

        // 2. Ensure no node has degree 0
        // We iterate and move isolated nodes until all have at least one neighbor
        let attempts = 0;
        let hasIsolated = true;

        while (hasIsolated && attempts < 100) {
            hasIsolated = false;
            attempts++;

            // Calculate degrees for current layout
            tempNodes.forEach(node => {
                let degree = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = node.r + dr;
                        const nc = node.c + dc;

                        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
                            if (grid[nr][nc] !== null) {
                                degree++;
                            }
                        }
                    }
                }
                node.degree = degree;
            });

            // Find isolated nodes
            const isolated = tempNodes.filter(n => n.degree === 0);

            if (isolated.length > 0) {
                hasIsolated = true;

                // Move one isolated node to a spot next to another node
                const nodeToMove = isolated[0];

                // Find a target spot: adjacent to a non-isolated node (or any node if all are isolated)
                // Pick a random other node
                let otherNode = tempNodes[Math.floor(Math.random() * tempNodes.length)];
                while (otherNode.id === nodeToMove.id) {
                    otherNode = tempNodes[Math.floor(Math.random() * tempNodes.length)];
                }

                // Find empty neighbor of otherNode
                let neighbors = [];
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = otherNode.r + dr;
                        const nc = otherNode.c + dc;
                        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === null) {
                            neighbors.push({ r: nr, c: nc });
                        }
                    }
                }

                if (neighbors.length > 0) {
                    // Move
                    const target = neighbors[Math.floor(Math.random() * neighbors.length)];
                    grid[nodeToMove.r][nodeToMove.c] = null; // Clear old
                    nodeToMove.r = target.r;
                    nodeToMove.c = target.c;
                    grid[nodeToMove.r][nodeToMove.c] = nodeToMove.id; // Set new
                } else {
                    // Could not move next to this one, try again next loop
                }
            }
        }

        // 3. Finalize nodes
        tempNodes.forEach(node => {
            // Recalculate final degree
            let degree = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = node.r + dr;
                    const nc = node.c + dc;
                    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] !== null) {
                        degree++;
                    }
                }
            }

            nodes.push({
                id: node.id,
                requiredDegree: degree,
                currentDegree: 0,
                placed: false,
                r: null,
                c: null
            });
        });

        // 4. Clear grid for the player
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));

        nodes.sort((a, b) => b.requiredDegree - a.requiredDegree);
    }

    function renderBoard() {
        gameBoard.innerHTML = '';

        // Create SVG layer
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "connections-layer";
        gameBoard.appendChild(svg);

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.r = r;
                cell.dataset.c = c;

                // Drop events
                cell.addEventListener('dragover', handleDragOver);
                cell.addEventListener('dragleave', handleDragLeave);
                cell.addEventListener('drop', handleDrop);

                // Check if node is here
                const nodeId = grid[r][c];
                if (nodeId !== null) {
                    const nodeData = nodes.find(n => n.id === nodeId);
                    const nodeEl = createNodeElement(nodeData);
                    cell.appendChild(nodeEl);
                }

                gameBoard.appendChild(cell);
            }
        }

        drawConnections();
        updateNodeStatus();
    }

    function drawConnections() {
        const svg = document.getElementById('connections-layer');
        if (!svg) return;
        svg.innerHTML = ''; // Clear lines

        const cellPercent = 100 / gridSize;
        const halfCell = cellPercent / 2;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === null) continue;

                // Check 4 neighbors (Right, Down-Left, Down, Down-Right) to avoid duplicates
                const neighbors = [
                    { dr: 0, dc: 1 },
                    { dr: 1, dc: -1 },
                    { dr: 1, dc: 0 },
                    { dr: 1, dc: 1 }
                ];

                neighbors.forEach(offset => {
                    const nr = r + offset.dr;
                    const nc = c + offset.dc;

                    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
                        if (grid[nr][nc] !== null) {
                            // Draw line
                            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

                            const x1 = (c * cellPercent) + halfCell;
                            const y1 = (r * cellPercent) + halfCell;
                            const x2 = (nc * cellPercent) + halfCell;
                            const y2 = (nr * cellPercent) + halfCell;

                            line.setAttribute("x1", x1 + "%");
                            line.setAttribute("y1", y1 + "%");
                            line.setAttribute("x2", x2 + "%");
                            line.setAttribute("y2", y2 + "%");

                            svg.appendChild(line);
                        }
                    }
                });
            }
        }
    }

    function renderPool() {
        nodePool.innerHTML = '';
        nodes.filter(n => !n.placed).forEach(node => {
            const nodeEl = createNodeElement(node);
            nodePool.appendChild(nodeEl);
        });
    }

    function createNodeElement(nodeData) {
        const div = document.createElement('div');
        div.classList.add('node');
        div.textContent = nodeData.requiredDegree;
        div.draggable = true;
        div.dataset.id = nodeData.id;

        if (nodeData.placed) {
            div.classList.add('placed');
            // Check status
            if (nodeData.currentDegree === nodeData.requiredDegree) {
                div.classList.add('satisfied');
            } else {
                div.classList.add('unsatisfied');
            }
        }

        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);

        // Touch support (custom)
        div.addEventListener('touchstart', handleTouchStart, { passive: false });

        return div;
    }

    // --- Drag and Drop Logic ---

    function handleDragStart(e) {
        draggedNodeId = parseInt(e.target.dataset.id);
        e.target.classList.add('dragging-source');
        e.dataTransfer.setData('text/plain', draggedNodeId);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging-source');
        draggedNodeId = null;
        document.querySelectorAll('.cell.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const r = parseInt(e.currentTarget.dataset.r);
        const c = parseInt(e.currentTarget.dataset.c);
        const id = parseInt(e.dataTransfer.getData('text/plain'));

        moveNodeTo(id, r, c);
    }

    // --- Touch Logic (Basic) ---
    let touchNode = null;
    let touchClone = null;

    function handleTouchStart(e) {
        e.preventDefault();
        const target = e.target.closest('.node');
        if (!target) return;

        touchNode = target;
        draggedNodeId = parseInt(touchNode.dataset.id);

        // Create a clone to follow finger
        touchClone = touchNode.cloneNode(true);
        touchClone.classList.add('dragging');
        document.body.appendChild(touchClone);

        moveTouchClone(e.touches[0]);

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (touchClone) {
            moveTouchClone(e.touches[0]);
        }
    }

    function moveTouchClone(touch) {
        touchClone.style.left = touch.clientX + 'px';
        touchClone.style.top = touch.clientY + 'px';

        // Highlight cell under finger
        document.querySelectorAll('.cell.drag-over').forEach(el => el.classList.remove('drag-over'));
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = el ? el.closest('.cell') : null;
        if (cell) {
            cell.classList.add('drag-over');
        }
    }

    function handleTouchEnd(e) {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);

        if (touchClone) {
            touchClone.remove();
            touchClone = null;
        }

        // Find drop target
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = el ? el.closest('.cell') : null;

        if (cell) {
            cell.classList.remove('drag-over');
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            moveNodeTo(draggedNodeId, r, c);
        } else {
            // Dropped outside? Maybe return to pool if it was on board?
            // For now, do nothing if dropped outside.
            // If we want to remove from board by dragging out:
            const pool = el ? el.closest('.node-pool-container') : null;
            if (pool) {
                removeNodeFromBoard(draggedNodeId);
            }
        }

        draggedNodeId = null;
        touchNode = null;
    }

    function moveNodeTo(id, r, c) {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        // Check if cell is occupied
        if (grid[r][c] !== null && grid[r][c] !== id) {
            // Swap? Or just return?
            // Let's swap if dragging from board, or reject if dragging from pool
            // Simple logic: Reject if occupied
            // Better logic: Swap
            const occupierId = grid[r][c];
            const occupier = nodes.find(n => n.id === occupierId);

            // If node was already on board, swap positions
            if (node.placed) {
                // Swap
                grid[node.r][node.c] = occupierId;
                occupier.r = node.r;
                occupier.c = node.c;

                grid[r][c] = id;
                node.r = r;
                node.c = c;
            } else {
                // Dragging from pool to occupied cell: Swap (occupier goes to pool? or just reject?)
                // Let's reject for simplicity, or return occupier to pool
                removeNodeFromBoard(occupierId);
                grid[r][c] = id;
                node.placed = true;
                node.r = r;
                node.c = c;
            }
        } else {
            // Empty cell
            // Remove from old position if placed
            if (node.placed) {
                grid[node.r][node.c] = null;
            }

            grid[r][c] = id;
            node.placed = true;
            node.r = r;
            node.c = c;
        }

        renderBoard();
        renderPool();
    }

    function removeNodeFromBoard(id) {
        const node = nodes.find(n => n.id === id);
        if (node && node.placed) {
            grid[node.r][node.c] = null;
            node.placed = false;
            node.r = null;
            node.c = null;
            renderBoard();
            renderPool();
        }
    }

    function updateNodeStatus() {
        // Recalculate degrees for all placed nodes
        nodes.forEach(node => {
            if (!node.placed) return;

            let degree = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = node.r + dr;
                    const nc = node.c + dc;

                    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
                        if (grid[nr][nc] !== null) {
                            degree++;
                        }
                    }
                }
            }
            node.currentDegree = degree;
        });

        // Update UI classes (satisfied/unsatisfied)
        // This is handled in createNodeElement, but we need to refresh the board elements
        // Since we re-render the whole board in moveNodeTo, this is fine.
        // But wait, createNodeElement uses the state. So we just need to ensure state is updated before render.
        // Actually, moveNodeTo calls renderBoard, so we should update degrees BEFORE renderBoard?
        // Or renderBoard calls updateNodeStatus?
        // Let's call updateNodeStatus inside renderBoard logic or separate?

        // Refactor:
        // moveNodeTo -> updateGrid -> calculateDegrees -> renderBoard
    }

    // Override moveNodeTo to include calculation
    const originalMoveNodeTo = moveNodeTo;
    moveNodeTo = function (id, r, c) {
        // ... logic from above ...
        // Copy-paste logic here to avoid recursion issues or just fix the flow

        const node = nodes.find(n => n.id === id);
        if (!node) return;

        if (grid[r][c] !== null && grid[r][c] !== id) {
            const occupierId = grid[r][c];
            const occupier = nodes.find(n => n.id === occupierId);

            if (node.placed) {
                grid[node.r][node.c] = occupierId;
                occupier.r = node.r;
                occupier.c = node.c;

                grid[r][c] = id;
                node.r = r;
                node.c = c;
            } else {
                removeNodeFromBoard(occupierId);
                grid[r][c] = id;
                node.placed = true;
                node.r = r;
                node.c = c;
            }
        } else {
            if (node.placed) {
                grid[node.r][node.c] = null;
            }
            grid[r][c] = id;
            node.placed = true;
            node.r = r;
            node.c = c;
        }

        calculateAllDegrees();
        renderBoard();
        renderPool();

        // Auto-check win?
        checkWinCondition();
    };

    // Also need to update removeNodeFromBoard
    const originalRemove = removeNodeFromBoard;
    removeNodeFromBoard = function (id) {
        const node = nodes.find(n => n.id === id);
        if (node && node.placed) {
            grid[node.r][node.c] = null;
            node.placed = false;
            node.r = null;
            node.c = null;
            calculateAllDegrees();
            renderBoard();
            renderPool();
        }
    };

    function calculateAllDegrees() {
        nodes.forEach(node => {
            if (!node.placed) {
                node.currentDegree = 0;
                return;
            }

            let degree = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = node.r + dr;
                    const nc = node.c + dc;

                    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
                        if (grid[nr][nc] !== null) {
                            degree++;
                        }
                    }
                }
            }
            node.currentDegree = degree;
        });
    }

    function checkWinCondition() {
        const allPlaced = nodes.every(n => n.placed);
        const allSatisfied = nodes.every(n => n.currentDegree === n.requiredDegree);
        const isConnected = checkConnectivity();

        if (allPlaced && allSatisfied && isConnected) {
            setTimeout(() => {
                winOverlay.classList.remove('hidden');
            }, 300);
        }
    }

    function checkSolution() {
        if (!nodes.every(n => n.placed)) {
            alert("Debes colocar todos los nodos.");
            return;
        }

        const unsatisfied = nodes.filter(n => n.currentDegree !== n.requiredDegree);
        if (unsatisfied.length > 0) {
            alert(`Hay ${unsatisfied.length} nodos con conexiones incorrectas.`);
            return;
        }

        if (!checkConnectivity()) {
            alert("El grafo no es conexo. Todos los nodos deben estar conectados entre sí.");
            return;
        }

        winOverlay.classList.remove('hidden');
    }

    function checkConnectivity() {
        const placedNodes = nodes.filter(n => n.placed);
        if (placedNodes.length === 0) return true; // Empty graph is technically connected or irrelevant
        if (placedNodes.length === 1) return true;

        // BFS to check connectivity
        const startNode = placedNodes[0];
        const visited = new Set();
        const queue = [startNode];
        visited.add(startNode.id);

        while (queue.length > 0) {
            const current = queue.shift();

            // Find neighbors
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = current.r + dr;
                    const nc = current.c + dc;

                    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
                        const neighborId = grid[nr][nc];
                        if (neighborId !== null && !visited.has(neighborId)) {
                            visited.add(neighborId);
                            const neighbor = nodes.find(n => n.id === neighborId);
                            if (neighbor) {
                                queue.push(neighbor);
                            }
                        }
                    }
                }
            }
        }

        return visited.size === placedNodes.length;
    }

    function downloadInstance() {
        let content = "";
        content += `SIZE ${gridSize}\n`;
        content += `NODES ${nodes.length}\n`;
        content += `DEGREES ${nodes.map(n => n.requiredDegree).join(' ')}\n`;

        // Maybe also the solution?
        // content += `SOLUTION ...`

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monodot_level_${gridSize}x${gridSize}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
