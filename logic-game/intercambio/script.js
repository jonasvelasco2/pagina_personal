document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const connectionsLayer = document.getElementById('connections-layer');
    const difficultySelect = document.getElementById('difficulty-select');
    const newGameBtn = document.getElementById('new-game-btn');
    const resetBtn = document.getElementById('reset-btn');
    const checkBtn = document.getElementById('check-btn');
    const downloadBtn = document.getElementById('download-btn');
    const winOverlay = document.getElementById('win-overlay');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const currentScoreDisplay = document.getElementById('current-score');
    const targetScoreDisplay = document.getElementById('target-score');

    // Rules Modal Elements
    const rulesBtn = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeRulesBtn = document.getElementById('close-rules-btn');

    // Tutorial Elements
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialCard = document.querySelector('.tutorial-card');
    const tutorialTitle = document.getElementById('tutorial-title');
    const tutorialText = document.getElementById('tutorial-text');
    const nextTutorialBtn = document.getElementById('next-tutorial-btn');
    const skipTutorialBtn = document.getElementById('skip-tutorial-btn');
    const tutorialSpotlight = document.getElementById('tutorial-spotlight');

    let numPeople = 6;
    let people = []; // Array of { id, name, x, y }
    let empathyMatrix = []; // 2D array [from][to] = score (0-10)
    let assignments = {}; // Map fromId -> toId
    let maxScore = 0;
    let targetScore = 0;

    // Tutorial State
    let currentTutorialStep = 0;
    const tutorialSteps = [
        {
            title: "¡Bienvenido!",
            text: "El objetivo es organizar el intercambio de regalos perfecto. Todos deben dar y recibir un regalo.",
            target: null
        },
        {
            title: "Las Personas",
            text: "Estos círculos representan a los participantes. En el juego, arrastrarás desde una persona hacia otra para asignar el regalo.",
            target: "#game-board"
        },
        {
            title: "Felicidad",
            text: "Cada conexión muestra un puntaje. ¡Busca los más altos! Las líneas rojas indican que no hay afinidad (0 puntos).",
            target: "#current-score"
        },
        {
            title: "La Meta",
            text: "Debes alcanzar este puntaje total para ganar. Si no lo logras, prueba diferentes combinaciones.",
            target: "#target-score"
        },
        {
            title: "Herramientas",
            text: "Usa 'Verificar' para comprobar tu solución y 'Reiniciar' si quieres empezar de cero.",
            target: ".game-controls"
        }
    ];

    const NAMES = [
        "Ana", "Beto", "Carla", "Dani", "Elena", "Fer",
        "Gaby", "Hugo", "Inés", "Juan", "Katy", "Luis",
        "María", "Nico", "Olga", "Pedro", "Queta", "Raúl",
        "Sara", "Toni", "Úrsula", "Vero", "Willy", "Ximena",
        "Yoli", "Zoe", "Alicia", "Bruno", "Clara", "Diego",
        "Emma", "Franco", "Gina", "Héctor", "Irene", "Jorge",
        "Karen", "Lalo", "Marta", "Nora", "Omar", "Paty",
        "Quintin", "Rosa", "Santi", "Tere", "Ulises", "Vale",
        "Walter", "Xavi"
    ];

    // SVG Arrow Marker
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
        refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--primary-color)" />
        </marker>
    `;
    connectionsLayer.appendChild(defs);

    // Initialize
    initGame();
    checkTutorial();

    // Event Listeners
    newGameBtn.addEventListener('click', startNewGame);
    resetBtn.addEventListener('click', resetBoard);
    checkBtn.addEventListener('click', checkSolution);
    downloadBtn.addEventListener('click', downloadInstance);
    difficultySelect.addEventListener('change', startNewGame);

    // Fix: Add Next Level Listener
    nextLevelBtn.addEventListener('click', () => {
        // Increase difficulty if possible, or just new game
        // Let's just start a new game for now, maybe increase count?
        // Keeping it simple: New Game with same settings for endless play
        startNewGame();
    });

    // Rules Modal Listeners
    rulesBtn.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
    });
    closeRulesBtn.addEventListener('click', () => {
        rulesModal.classList.add('hidden');
    });
    rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
            rulesModal.classList.add('hidden');
        }
    });

    // Tutorial Listeners
    nextTutorialBtn.addEventListener('click', () => {
        currentTutorialStep++;
        if (currentTutorialStep < tutorialSteps.length) {
            showTutorialStep(currentTutorialStep);
        } else {
            endTutorial();
        }
    });

    skipTutorialBtn.addEventListener('click', endTutorial);


    function initGame() {
        numPeople = parseInt(difficultySelect.value);
        generateLevel();
        renderBoard();
    }

    function startNewGame() {
        winOverlay.classList.add('hidden');
        numPeople = parseInt(difficultySelect.value);
        generateLevel();
        renderBoard();
    }

    function resetBoard() {
        assignments = {};
        renderConnections();
        updateScore();
        document.querySelectorAll('.node').forEach(n => {
            n.classList.remove('satisfied', 'error');
        });
    }

    // --- Tutorial Logic ---

    function checkTutorial() {
        try {
            const seen = localStorage.getItem('tutorialSeen');
            if (!seen) {
                startTutorial();
            }
        } catch (e) {
            console.warn("LocalStorage not available, skipping tutorial check.");
        }
    }

    function startTutorial() {
        tutorialOverlay.classList.remove('hidden');
        currentTutorialStep = 0;
        showTutorialStep(0);
    }

    function showTutorialStep(index) {
        const step = tutorialSteps[index];
        tutorialTitle.textContent = step.title;
        tutorialText.textContent = step.text;

        // Reset spotlight
        tutorialSpotlight.style.width = '0';
        tutorialSpotlight.style.height = '0';
        tutorialSpotlight.style.top = '50%';
        tutorialSpotlight.style.left = '50%';
        tutorialSpotlight.style.opacity = '0';

        // Reset Card Position (Center default)
        tutorialCard.style.top = '50%';
        tutorialCard.style.bottom = 'auto';
        tutorialCard.style.transform = 'translate(-50%, -50%)';

        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                // Add padding
                const padding = 20;
                const size = Math.max(rect.width, rect.height) + padding;

                tutorialSpotlight.style.width = `${size}px`;
                tutorialSpotlight.style.height = `${size}px`;
                tutorialSpotlight.style.top = `${rect.top + rect.height / 2}px`;
                tutorialSpotlight.style.left = `${rect.left + rect.width / 2}px`;
                tutorialSpotlight.style.opacity = '1';

                // Dynamic Card Positioning
                // If target is in the top half of the screen, move card to bottom
                const centerY = rect.top + rect.height / 2;
                if (centerY < window.innerHeight / 2) {
                    // Target is top -> Card bottom
                    tutorialCard.style.top = 'auto';
                    tutorialCard.style.bottom = '10%';
                    tutorialCard.style.transform = 'translate(-50%, 0)';
                } else {
                    // Target is bottom -> Card top
                    tutorialCard.style.top = '10%';
                    tutorialCard.style.bottom = 'auto';
                    tutorialCard.style.transform = 'translate(-50%, 0)';
                }
            }
        }

        if (index === tutorialSteps.length - 1) {
            nextTutorialBtn.textContent = "¡Jugar!";
        } else {
            nextTutorialBtn.textContent = "Siguiente";
        }
    }

    function endTutorial() {
        tutorialOverlay.classList.add('hidden');
        try {
            localStorage.setItem('tutorialSeen', 'true');
        } catch (e) {
            // Ignore
        }
    }


    // --- Level Generation ---

    function generateLevel() {
        people = [];
        // Pick random names
        const shuffledNames = [...NAMES].sort(() => Math.random() - 0.5).slice(0, numPeople);

        // Calculate positions (Circle)
        // Use percentages to be responsive
        // Center is 50%, Radius is 35%
        const radius = 35;
        const centerX = 50;
        const centerY = 50;

        for (let i = 0; i < numPeople; i++) {
            const angle = (i * 2 * Math.PI) / numPeople - Math.PI / 2; // Start at top
            people.push({
                id: i,
                name: shuffledNames[i],
                xPct: centerX + radius * Math.cos(angle),
                yPct: centerY + radius * Math.sin(angle)
            });
        }

        // Generate Empathy Matrix
        // Ensure at least one valid cycle cover (Derangement) exists with high score.
        // Strategy: Generate a random derangement (cycle cover). Assign high scores (8-10).
        // Fill others with random scores (0-7), with some 0s (blocked).

        empathyMatrix = Array(numPeople).fill().map(() => Array(numPeople).fill(0));

        // 1. Create a guaranteed solution
        let solution = generateRandomDerangement(numPeople);
        let solutionScore = 0;

        for (let i = 0; i < numPeople; i++) {
            const target = solution[i];
            const score = Math.floor(Math.random() * 3) + 8; // 8, 9, 10
            empathyMatrix[i][target] = score;
            solutionScore += score;
        }

        // 2. Fill others
        for (let i = 0; i < numPeople; i++) {
            for (let j = 0; j < numPeople; j++) {
                if (i === j) continue; // Self is always 0 (blocked)
                if (empathyMatrix[i][j] === 0) {
                    // Random score
                    // 20% chance of being blocked (0)
                    // 80% chance of being 1-7
                    if (Math.random() > 0.2) {
                        empathyMatrix[i][j] = Math.floor(Math.random() * 7) + 1;
                    }
                }
            }
        }

        maxScore = solutionScore;
        targetScore = Math.floor(solutionScore * 0.9);

        assignments = {};
        updateScore();
    }

    function generateRandomDerangement(n) {
        // Simple way: Shuffle until no fixed points.
        let arr = Array.from({ length: n }, (_, i) => i);
        let valid = false;
        while (!valid) {
            arr.sort(() => Math.random() - 0.5);
            valid = true;
            for (let i = 0; i < n; i++) {
                if (arr[i] === i) {
                    valid = false;
                    break;
                }
            }
        }
        return arr;
    }

    // --- Rendering & Interaction ---

    function renderBoard() {
        gameBoard.innerHTML = ''; // Clear nodes
        gameBoard.appendChild(connectionsLayer); // Keep layer
        connectionsLayer.innerHTML = ''; // Clear lines
        connectionsLayer.appendChild(defs); // Keep defs

        // Render Nodes
        people.forEach(p => {
            const node = document.createElement('div');
            node.classList.add('node');
            node.style.left = `${p.xPct}%`;
            node.style.top = `${p.yPct}%`;
            node.textContent = p.name; // Initials? Or full name if fits.
            node.title = p.name;
            node.dataset.id = p.id;

            // Drag Logic
            setupDrag(node);

            gameBoard.appendChild(node);
        });

        renderConnections();
        updateScore();
    }

    function renderConnections() {
        // Clear existing lines (except defs)
        const lines = connectionsLayer.querySelectorAll('line, text, rect, g');
        lines.forEach(l => l.remove());

        // Draw Assignments
        for (let fromId in assignments) {
            const toId = assignments[fromId];
            drawArrow(parseInt(fromId), toId);
        }
    }

    function drawArrow(fromId, toId) {
        const p1 = people[fromId];
        const p2 = people[toId];
        const score = empathyMatrix[fromId][toId];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${p1.xPct}%`);
        line.setAttribute("y1", `${p1.yPct}%`);
        line.setAttribute("x2", `${p2.xPct}%`);
        line.setAttribute("y2", `${p2.yPct}%`);
        line.classList.add("connection", "active");
        if (score === 0) line.classList.add("blocked");

        // Click to remove
        line.addEventListener('click', () => {
            delete assignments[fromId];
            renderConnections();
            updateScore();
            validateNodes();
        });

        connectionsLayer.appendChild(line);

        // Draw Score Label
        const midX = (p1.xPct + p2.xPct) / 2;
        const midY = (p1.yPct + p2.yPct) / 2;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Background rect for text readability
        // Actually, let's use HTML overlay for labels to handle styling easier?
        // Or SVG text. SVG text is fine.

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", `${midX}%`);
        text.setAttribute("y", `${midY}%`);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", "0.3em");
        text.setAttribute("fill", score === 0 ? "red" : "black");
        text.setAttribute("font-weight", "bold");
        text.textContent = score;

        // Background circle for text
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", `${midX}%`);
        circle.setAttribute("cy", `${midY}%`);
        circle.setAttribute("r", "10");
        circle.setAttribute("fill", "white");
        circle.setAttribute("stroke", "#ccc");

        g.appendChild(circle);
        g.appendChild(text);
        connectionsLayer.appendChild(g);
    }

    // Drag Interaction
    let dragSource = null;
    let dragLine = null;

    function setupDrag(node) {
        node.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragSource = parseInt(node.dataset.id);

            // Create temporary drag line
            dragLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            dragLine.classList.add("connection");
            dragLine.style.stroke = "var(--primary-color)";
            dragLine.style.strokeDasharray = "5,5";
            dragLine.setAttribute("x1", `${people[dragSource].xPct}%`);
            dragLine.setAttribute("y1", `${people[dragSource].yPct}%`);
            dragLine.setAttribute("x2", `${people[dragSource].xPct}%`);
            dragLine.setAttribute("y2", `${people[dragSource].yPct}%`);
            connectionsLayer.appendChild(dragLine);

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onDrop);
        });

        // Touch support
        node.addEventListener('touchstart', (e) => {
            e.preventDefault();
            dragSource = parseInt(node.dataset.id);

            dragLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            dragLine.classList.add("connection");
            dragLine.style.stroke = "var(--primary-color)";
            dragLine.style.strokeDasharray = "5,5";
            dragLine.setAttribute("x1", `${people[dragSource].xPct}%`);
            dragLine.setAttribute("y1", `${people[dragSource].yPct}%`);
            dragLine.setAttribute("x2", `${people[dragSource].xPct}%`);
            dragLine.setAttribute("y2", `${people[dragSource].yPct}%`);
            connectionsLayer.appendChild(dragLine);

            document.addEventListener('touchmove', onTouchDrag, { passive: false });
            document.addEventListener('touchend', onTouchDrop);
        });
    }

    function onDrag(e) {
        if (!dragLine) return;
        // Get mouse pos relative to SVG
        const rect = gameBoard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to percentage
        const xPct = (x / rect.width) * 100;
        const yPct = (y / rect.height) * 100;

        dragLine.setAttribute("x2", `${xPct}%`);
        dragLine.setAttribute("y2", `${yPct}%`);
    }

    function onTouchDrag(e) {
        if (!dragLine) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = gameBoard.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const xPct = (x / rect.width) * 100;
        const yPct = (y / rect.height) * 100;

        dragLine.setAttribute("x2", `${xPct}%`);
        dragLine.setAttribute("y2", `${yPct}%`);
    }

    function onDrop(e) {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDrop);
        if (dragLine) dragLine.remove();
        dragLine = null;

        // Check if dropped on a target node
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('node')) {
            const targetId = parseInt(target.dataset.id);
            if (dragSource !== null && targetId !== dragSource) {
                // Assign
                assignments[dragSource] = targetId;
                renderConnections();
                updateScore();
                validateNodes();
            }
        }
        dragSource = null;
    }

    function onTouchDrop(e) {
        document.removeEventListener('touchmove', onTouchDrag);
        document.removeEventListener('touchend', onTouchDrop);
        if (dragLine) dragLine.remove();
        dragLine = null;

        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target && target.classList.contains('node')) {
            const targetId = parseInt(target.dataset.id);
            if (dragSource !== null && targetId !== dragSource) {
                assignments[dragSource] = targetId;
                renderConnections();
                updateScore();
                validateNodes();
            }
        }
        dragSource = null;
    }

    function updateScore() {
        let score = 0;
        for (let fromId in assignments) {
            const toId = assignments[fromId];
            score += empathyMatrix[fromId][toId];
        }
        currentScoreDisplay.textContent = score;
        targetScoreDisplay.textContent = targetScore;
    }

    function validateNodes() {
        // Count incoming and outgoing
        let incoming = Array(numPeople).fill(0);
        let outgoing = Array(numPeople).fill(0);

        for (let fromId in assignments) {
            const toId = assignments[fromId];
            outgoing[fromId]++;
            incoming[toId]++;
        }

        document.querySelectorAll('.node').forEach(node => {
            const id = parseInt(node.dataset.id);
            node.classList.remove('satisfied', 'error');

            if (outgoing[id] === 1 && incoming[id] === 1) {
                node.classList.add('satisfied');
            } else if (outgoing[id] > 1 || incoming[id] > 1) {
                node.classList.add('error'); // Shouldn't happen with UI logic but good to have
            }
        });
    }

    function checkSolution() {
        // 1. Check Completeness
        if (Object.keys(assignments).length !== numPeople) {
            alert("Falta asignar regalos a algunas personas.");
            return;
        }

        // 2. Check Validity (1-to-1)
        let incoming = Array(numPeople).fill(0);
        for (let fromId in assignments) {
            const toId = assignments[fromId];
            incoming[toId]++;

            // Check Blocked
            if (empathyMatrix[fromId][toId] === 0) {
                alert(`${people[fromId].name} no puede regalar a ${people[toId].name} (Empatía 0).`);
                return;
            }
        }

        for (let i = 0; i < numPeople; i++) {
            if (incoming[i] !== 1) {
                alert("Alguien está recibiendo más de un regalo o ninguno.");
                return;
            }
        }

        // 3. Check Score
        const current = parseInt(currentScoreDisplay.textContent);
        if (current < targetScore) {
            alert(`La felicidad total (${current}) es menor a la meta (${targetScore}). Busca mejores parejas.`);
            return;
        }

        winOverlay.classList.remove('hidden');
    }

    function downloadInstance() {
        let content = "";
        content += `PEOPLE ${numPeople}\n`;
        content += people.map(p => p.name).join(' ') + "\n";
        content += `MATRIX\n`;
        for (let i = 0; i < numPeople; i++) {
            content += empathyMatrix[i].join(' ') + "\n";
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intercambio_${numPeople}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
