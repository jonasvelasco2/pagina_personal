document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('game-board');
    const sizeSelect = document.getElementById('grid-size');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const winOverlay = document.getElementById('win-overlay');
    const newGameBtn = document.getElementById('new-game-btn');
    const generateBtn = document.getElementById('generate-btn');

    let gridSize = parseInt(sizeSelect.value);
    let grid = []; // 0: empty, 1: wall
    let playerPos = { x: 0, y: 0 };
    let targetPos = { x: 0, y: 0 };
    let startPos = { x: 0, y: 0 };
    let isMoving = false;
    let moveCount = 0;
    const moveCountElement = document.getElementById('move-count');

    // Initialize game
    initGame();

    // Event Listeners
    generateBtn.addEventListener('click', () => {
        const originalText = generateBtn.textContent;
        generateBtn.textContent = "Generando...";
        generateBtn.disabled = true;

        // Allow UI to update before heavy calculation
        setTimeout(() => {
            gridSize = parseInt(sizeSelect.value);
            initGame();

            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }, 50);
    });

    resetBtn.addEventListener('click', resetLevel);
    newGameBtn.addEventListener('click', initGame);
    downloadBtn.addEventListener('click', downloadInstance);

    document.addEventListener('keydown', handleInput);

    // Touch support
    let touchStartX = 0;
    let touchStartY = 0;
    boardElement.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: false });

    boardElement.addEventListener('touchend', e => {
        if (isMoving) return;
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: false });

    function initGame() {
        try {
            generateLevel();
            renderBoard();
            resetMoves();
            winOverlay.classList.add('hidden');
            isMoving = false;
        } catch (e) {
            console.error(e);
            alert("Error al iniciar el juego: " + e.message);
            isMoving = false;
        }
    }

    function resetLevel() {
        try {
            // Reset player to start position
            playerPos = { ...startPos };
            renderBoard();
            resetMoves();
            winOverlay.classList.add('hidden');
            isMoving = false;
        } catch (e) {
            console.error(e);
            alert("Error al reiniciar: " + e.message);
            isMoving = false;
        }
    }

    function generateLevel() {
        try {
            let attempts = 0;
            const maxAttempts = 50;
            let solvable = false;

            do {
                attempts++;
                grid = [];
                const totalSize = gridSize + 2;

                // Initialize grid with perimeter walls
                for (let y = 0; y < totalSize; y++) {
                    let row = [];
                    for (let x = 0; x < totalSize; x++) {
                        if (x === 0 || x === totalSize - 1 || y === 0 || y === totalSize - 1) {
                            row.push(1);
                        } else {
                            row.push(0);
                        }
                    }
                    grid.push(row);
                }

                // Add random walls
                const wallCount = Math.floor(gridSize * gridSize * 0.15);
                for (let i = 0; i < wallCount; i++) {
                    const rx = Math.floor(Math.random() * gridSize) + 1;
                    const ry = Math.floor(Math.random() * gridSize) + 1;
                    grid[ry][rx] = 1;
                }

                // Set Player Start
                let startAttempts = 0;
                do {
                    startPos.x = Math.floor(Math.random() * gridSize) + 1;
                    startPos.y = Math.floor(Math.random() * gridSize) + 1;
                    startAttempts++;
                } while (grid[startPos.y][startPos.x] === 1 && startAttempts < 1000);

                if (startAttempts >= 1000) throw new Error("No se pudo colocar el jugador");

                playerPos = { ...startPos };

                // Set Target
                let targetAttempts = 0;
                do {
                    targetPos.x = Math.floor(Math.random() * gridSize) + 1;
                    targetPos.y = Math.floor(Math.random() * gridSize) + 1;
                    targetAttempts++;
                } while ((grid[targetPos.y][targetPos.x] === 1 || (targetPos.x === playerPos.x && targetPos.y === playerPos.y)) && targetAttempts < 1000);

                if (targetAttempts >= 1000) throw new Error("No se pudo colocar la meta");

                // Verify Solvability and Connectivity
                // 1. Check if all empty cells are connected (no isolated islands)
                // 2. Check if target is reachable via sliding
                if (checkConnectivity() && checkSolvability()) {
                    solvable = true;
                }

            } while (!solvable && attempts < maxAttempts);

            if (!solvable) {
                console.warn("No se pudo generar un nivel solucionable en " + maxAttempts + " intentos.");
                // We continue anyway, but maybe we should alert?
                // alert("Advertencia: No se garantizó solución en este nivel.");
            }
        } catch (e) {
            throw e; // Re-throw to be caught by initGame
        }
    }

    function checkConnectivity() {
        // Flood fill to ensure all empty cells are reachable from startPos
        // This prevents "enclosed" areas
        const totalSize = gridSize + 2;
        const visited = new Set();
        const queue = [{ x: startPos.x, y: startPos.y }];
        visited.add(`${startPos.x},${startPos.y}`);

        let reachableCount = 0;

        // Count total empty cells first
        let totalEmpty = 0;
        for (let y = 0; y < totalSize; y++) {
            for (let x = 0; x < totalSize; x++) {
                if (grid[y][x] === 0) totalEmpty++;
            }
        }

        while (queue.length > 0) {
            const curr = queue.shift();
            reachableCount++;

            const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

            for (const dir of dirs) {
                const nx = curr.x + dir.dx;
                const ny = curr.y + dir.dy;

                // Check bounds (though perimeter walls handle this, we check grid value)
                if (nx >= 0 && nx < totalSize && ny >= 0 && ny < totalSize) {
                    if (grid[ny][nx] === 0 && !visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return reachableCount === totalEmpty;
    }

    function checkSolvability() {
        const queue = [{ x: startPos.x, y: startPos.y }];
        const visited = new Set();
        visited.add(`${startPos.x},${startPos.y}`);

        const totalSize = gridSize + 2;

        while (queue.length > 0) {
            const curr = queue.shift();

            // Directions: Up, Down, Left, Right
            const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

            for (const dir of dirs) {
                const result = simulateSlide(curr.x, curr.y, dir.dx, dir.dy, totalSize);

                if (result.hitTarget) return true;

                const key = `${result.x},${result.y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: result.x, y: result.y });
                }
            }
        }
        return false;
    }

    function simulateSlide(startX, startY, dx, dy, size) {
        let currX = startX;
        let currY = startY;
        let hitTarget = false;

        while (true) {
            const nextX = currX + dx;
            const nextY = currY + dy;

            // Check collision with walls
            if (grid[nextY][nextX] === 1) {
                break;
            }

            currX = nextX;
            currY = nextY;
        }

        // Check if stopped at target
        if (currX === targetPos.x && currY === targetPos.y) {
            hitTarget = true;
        }

        return { x: currX, y: currY, hitTarget: hitTarget };
    }

    function renderBoard() {
        boardElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        boardElement.innerHTML = '';

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');

                if (grid[y][x] === 1) {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('empty');
                }

                if (x === targetPos.x && y === targetPos.y) {
                    cell.classList.add('target');
                }

                if (x === playerPos.x && y === playerPos.y) {
                    cell.classList.add('player');
                    // We can add a transform here for smooth sliding if we want to get fancy with FLIP
                    // For now, CSS transition on the class might be enough if we just move the class?
                    // Actually, re-rendering the whole board kills transitions.
                    // Better approach: Create grid once, update classes.
                }

                // To support smooth transitions, we should probably not destroy DOM every time.
                // But for MVP, let's stick to this. 
                // Optimization: Assign IDs or data-coords to cells and update them.
                cell.dataset.x = x;
                cell.dataset.y = y;
                boardElement.appendChild(cell);
            }
        }

        // Optimization for smooth sliding:
        // Instead of re-rendering, we could just find the player cell and move the class.
        // Let's try to be smarter in the next iteration if needed. 
        // For now, let's improve renderBoard to NOT clear HTML if dimensions match.
    }

    // Improved Render to support transitions
    function updatePlayerView(oldX, oldY, newX, newY) {
        const totalSize = gridSize + 2;
        // Find old player cell
        const indexOld = oldY * totalSize + oldX;
        const indexNew = newY * totalSize + newX;

        if (boardElement.children[indexOld]) {
            boardElement.children[indexOld].classList.remove('player');
        }
        if (boardElement.children[indexNew]) {
            boardElement.children[indexNew].classList.add('player');
        }
    }

    // Override renderBoard for initial setup vs updates
    // Actually, let's keep it simple. The current renderBoard destroys DOM, so no transition.
    // Let's fix it.

    function renderBoard() {
        const totalSize = gridSize + 2;

        // Adjust gap for large grids to prevent cells from disappearing
        if (totalSize > 20) {
            boardElement.style.gap = '1px';
        } else {
            boardElement.style.gap = '4px'; // Default from CSS
        }

        // Check if we need to rebuild grid (size change)
        if (boardElement.children.length !== totalSize * totalSize) {
            boardElement.style.gridTemplateColumns = `repeat(${totalSize}, 1fr)`;
            boardElement.innerHTML = '';
            for (let y = 0; y < totalSize; y++) {
                for (let x = 0; x < totalSize; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    boardElement.appendChild(cell);
                }
            }
        }

        // Update classes
        const cells = boardElement.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            // Reset classes
            cell.className = 'cell';

            if (grid[y][x] === 1) cell.classList.add('wall');
            else cell.classList.add('empty');

            if (x === targetPos.x && y === targetPos.y) cell.classList.add('target');
            if (x === playerPos.x && y === playerPos.y) cell.classList.add('player');
        }
    }

    function handleInput(e) {
        if (isMoving) return;

        let dx = 0;
        let dy = 0;

        switch (e.key) {
            case 'ArrowUp': dy = -1; break;
            case 'ArrowDown': dy = 1; break;
            case 'ArrowLeft': dx = -1; break;
            case 'ArrowRight': dx = 1; break;
            default: return;
        }

        e.preventDefault();
        incrementMoves();
        movePlayer(dx, dy);
    }

    function handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (Math.abs(diffX) > 30) { // Threshold
                incrementMoves();
                movePlayer(diffX > 0 ? 1 : -1, 0);
            }
        } else {
            // Vertical
            if (Math.abs(diffY) > 30) {
                incrementMoves();
                movePlayer(0, diffY > 0 ? 1 : -1);
            }
        }
    }

    function incrementMoves() {
        moveCount++;
        moveCountElement.textContent = moveCount;
    }

    function resetMoves() {
        moveCount = 0;
        moveCountElement.textContent = 0;
    }

    function movePlayer(dx, dy) {
        isMoving = true;

        const interval = setInterval(() => {
            let nextX = playerPos.x + dx;
            let nextY = playerPos.y + dy;

            // Check bounds and walls
            // Bounds are now 0 to totalSize-1, but perimeter walls handle the collision naturally.
            // We just need to check if it's a wall.
            // However, to be safe against out of bounds:
            const totalSize = gridSize + 2;

            if (nextX < 0 || nextX >= totalSize || nextY < 0 || nextY >= totalSize || grid[nextY][nextX] === 1) {
                clearInterval(interval);
                isMoving = false;
                checkWin(); // Check win on stop just in case, though pass-through handles it
                return;
            }

            // Move
            playerPos.x = nextX;
            playerPos.y = nextY;
            renderBoard();

        }, 50); // Speed of sliding
    }

    function checkWin() {
        if (playerPos.x === targetPos.x && playerPos.y === targetPos.y) {
            setTimeout(() => {
                winOverlay.classList.remove('hidden');
            }, 200);
        }
    }

    function downloadInstance() {
        let content = "";
        // Format: 
        // Size (including perimeter)
        // Grid (0, 1, S, E)

        const totalSize = gridSize + 2;
        content += `SIZE ${totalSize}\n`;

        for (let y = 0; y < totalSize; y++) {
            let rowStr = "";
            for (let x = 0; x < totalSize; x++) {
                if (x === startPos.x && y === startPos.y) rowStr += "S";
                else if (x === targetPos.x && y === targetPos.y) rowStr += "E";
                else rowStr += grid[y][x];

                if (x < totalSize - 1) rowStr += " ";
            }
            content += rowStr + "\n";
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slider_level_${gridSize}x${gridSize}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
