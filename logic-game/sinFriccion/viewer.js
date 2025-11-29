document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('game-board');
    const inputArea = document.getElementById('instance-input');
    const visualizeBtn = document.getElementById('visualize-btn');
    const fileInput = document.getElementById('file-input');

    visualizeBtn.addEventListener('click', () => {
        const content = inputArea.value;
        if (content.trim()) {
            parseAndRender(content);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            inputArea.value = e.target.result;
            parseAndRender(e.target.result);
        };
        reader.readAsText(file);
    });

    function parseAndRender(content) {
        try {
            const lines = content.trim().split('\n').map(l => l.trim()).filter(l => l);

            // Parse SIZE
            const sizeLine = lines.find(l => l.startsWith('SIZE'));
            if (!sizeLine) throw new Error("No se encontró la línea SIZE");

            const gridSize = parseInt(sizeLine.split(' ')[1]);
            if (isNaN(gridSize)) throw new Error("Tamaño de grid inválido");

            // Parse Grid
            // Filter out the SIZE line and process the rest
            const gridLines = lines.filter(l => !l.startsWith('SIZE'));

            if (gridLines.length !== gridSize) {
                console.warn(`Advertencia: Se esperaban ${gridSize} filas, pero hay ${gridLines.length}. Intentando renderizar de todas formas.`);
            }

            renderBoard(gridSize, gridLines);

        } catch (e) {
            alert(`Error al procesar la instancia: ${e.message}`);
        }
    }

    function renderBoard(size, rows) {
        boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        boardElement.innerHTML = '';

        rows.forEach((rowStr, y) => {
            const cells = rowStr.split(/\s+/); // Split by whitespace

            cells.forEach((cellValue, x) => {
                const cell = document.createElement('div');
                cell.classList.add('cell');

                if (cellValue === '1') {
                    cell.classList.add('wall');
                } else if (cellValue === 'S') {
                    cell.classList.add('player');
                } else if (cellValue === 'E') {
                    cell.classList.add('target');
                } else {
                    cell.classList.add('empty');
                }

                boardElement.appendChild(cell);
            });
        });
    }
});
