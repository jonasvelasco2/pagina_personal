// ============================================================
// MODULE: KnapsackProblem
// ============================================================
const KnapsackProblem = (() => {
    const presets = {
        3: {
            weights: [3, 4, 5],
            values:  [4, 5, 7],
            capacity: 8
        },
        4: {
            weights: [2, 3, 4, 5],
            values:  [3, 4, 5, 7],
            capacity: 10
        },
        6: {
            weights: [2, 3, 4, 5, 7, 8],
            values:  [3, 4, 5, 7, 9, 11],
            capacity: 18
        },
        8: {
            weights: [2, 3, 4, 5, 6, 7, 8, 9],
            values:  [3, 4, 5, 7, 8, 10, 12, 14],
            capacity: 25
        },
        10: {
            weights: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            values:  [3, 4, 5, 7, 8, 10, 12, 14, 16, 18],
            capacity: 35
        }
    };

    let current = null;
    let treeRoot = null;
    let leafMap = {};

    function init(n) {
        current = { ...presets[n], n: parseInt(n) };
        leafMap = {};
        treeRoot = buildTree(current.n, current.weights, current.values, current.capacity);
        return current;
    }

    function buildTree(n, weights, values, capacity) {
        function recurse(level, decisions) {
            const id = decisions.join('');
            if (level === n) {
                let w = 0, v = 0;
                for (let i = 0; i < n; i++) {
                    if (decisions[i] === 1) {
                        w += weights[i];
                        v += values[i];
                    }
                }
                const feasible = w <= capacity;
                const node = {
                    id,
                    name: `[${decisions.join(',')}]`,
                    vector: [...decisions],
                    weight: w,
                    value: v,
                    feasible,
                    fitness: feasible ? v : 0,
                    isLeaf: true,
                    level
                };
                leafMap[decisions.join('')] = node;
                return node;
            }
            const left = recurse(level + 1, [...decisions, 0]);
            const right = recurse(level + 1, [...decisions, 1]);
            return {
                id,
                name: `x${level + 1}`,
                itemLabel: `\u00cdtem ${level + 1}`,
                isLeaf: false,
                level,
                children: [left, right]
            };
        }
        return recurse(0, []);
    }

    function getLeaf(vector) {
        return leafMap[vector.join('')];
    }

    function getAllFeasibleLeaves() {
        return Object.values(leafMap).filter(l => l.feasible);
    }

    function getRandomFeasibleSolution() {
        const feasible = getAllFeasibleLeaves();
        return feasible[Math.floor(Math.random() * feasible.length)];
    }

    function getData() { return current; }
    function getTree() { return treeRoot; }
    function getLeafMap() { return leafMap; }

    return { init, getData, getTree, getLeafMap, getLeaf, getRandomFeasibleSolution, getAllFeasibleLeaves };
})();


// ============================================================
// MODULE: TreeVisualization
// ============================================================
const TreeVisualization = (() => {
    let svg, g, zoom, treeLayout;
    let nodeSelection, linkSelection;
    let nodesData = [], linksData = [];
    let width, height;
    const tooltip = document.getElementById('tooltip');

    function init() {
        const container = document.getElementById('tree-area');
        width = container.clientWidth;
        height = container.clientHeight;

        svg = d3.select('#tree-svg')
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('*').remove();

        // SVG defs for glow/shadow filters (subtle for light theme)
        const defs = svg.append('defs');

        function addGlow(id, color) {
            const filter = defs.append('filter').attr('id', id)
                .attr('x', '-50%').attr('y', '-50%')
                .attr('width', '200%').attr('height', '200%');
            filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
            filter.append('feFlood').attr('flood-color', color).attr('flood-opacity', '0.35').attr('result', 'color');
            filter.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
            const merge = filter.append('feMerge');
            merge.append('feMergeNode').attr('in', 'glow');
            merge.append('feMergeNode').attr('in', 'SourceGraphic');
        }
        addGlow('glow-cyan', '#0891b2');
        addGlow('glow-green', '#059669');
        addGlow('glow-orange', '#d97706');
        addGlow('glow-red', '#dc2626');

        zoom = d3.zoom()
            .scaleExtent([0.05, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        g = svg.append('g');
    }

    // Dynamic rendering parameters based on n
    function getTreeParams(n) {
        const params = {
            3:  { hSpacing: 90, vSpacing: 100, leafR: 18, internalR: 12, leafFont: 8, internalFont: 10, subFont: 8, subDy: 32, showLeafText: true,  showSubLabel: true,  showLinkLabels: true,  linkWidth: 1.5, hlStroke: 3 },
            4:  { hSpacing: 70, vSpacing: 85,  leafR: 18, internalR: 12, leafFont: 8, internalFont: 10, subFont: 8, subDy: 32, showLeafText: true,  showSubLabel: true,  showLinkLabels: true,  linkWidth: 1.5, hlStroke: 3 },
            6:  { hSpacing: 26, vSpacing: 70,  leafR: 10, internalR: 7,  leafFont: 5, internalFont: 7,  subFont: 5, subDy: 18, showLeafText: true,  showSubLabel: true,  showLinkLabels: true,  linkWidth: 1,   hlStroke: 2.5 },
            8:  { hSpacing: 10, vSpacing: 55,  leafR: 4,  internalR: 3,  leafFont: 0, internalFont: 0,  subFont: 0, subDy: 0,  showLeafText: false, showSubLabel: false, showLinkLabels: false, linkWidth: 0.6, hlStroke: 2 },
            10: { hSpacing: 4,  vSpacing: 45,  leafR: 2,  internalR: 1.5,leafFont: 0, internalFont: 0,  subFont: 0, subDy: 0,  showLeafText: false, showSubLabel: false, showLinkLabels: false, linkWidth: 0.3, hlStroke: 1.5 },
        };
        return params[n] || params[4];
    }

    function render(treeRoot) {
        g.selectAll('*').remove();

        const n = KnapsackProblem.getData().n;
        const leafCount = Math.pow(2, n);
        const p = getTreeParams(n);
        const treeW = leafCount * p.hSpacing;
        const treeH = (n + 1) * p.vSpacing;

        treeLayout = d3.tree().size([treeW, treeH]);

        const root = d3.hierarchy(treeRoot, d => d.children);
        treeLayout(root);

        nodesData = root.descendants();
        linksData = root.links();

        // Links
        linkSelection = g.selectAll('.link')
            .data(linksData)
            .join('path')
            .attr('class', 'link')
            .attr('d', d => {
                return `M${d.source.x},${d.source.y} C${d.source.x},${(d.source.y + d.target.y) / 2} ${d.target.x},${(d.source.y + d.target.y) / 2} ${d.target.x},${d.target.y}`;
            })
            .attr('data-source', d => d.source.data.id)
            .attr('data-target', d => d.target.data.id)
            .style('stroke-width', p.linkWidth);

        // Link labels (0 / 1) - only for small trees
        if (p.showLinkLabels) {
            g.selectAll('.link-label')
                .data(linksData)
                .join('text')
                .attr('class', 'link-label')
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2 - 4)
                .attr('text-anchor', 'middle')
                .style('font-size', n >= 6 ? '6px' : '9px')
                .text((d) => {
                    const parent = d.source;
                    const idx = parent.children.indexOf(d.target);
                    return idx === 0 ? '0' : '1';
                });
        }

        // Nodes
        nodeSelection = g.selectAll('.node')
            .data(nodesData)
            .join('g')
            .attr('class', d => `node ${d.data.isLeaf ? 'leaf' : 'internal'} ${d.data.isLeaf && !d.data.feasible ? 'infeasible' : ''}`)
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .attr('data-id', d => d.data.id);

        // Circles - dynamic radius
        nodeSelection.append('circle')
            .attr('r', d => d.data.isLeaf ? p.leafR : p.internalR);

        // Internal labels
        if (p.internalFont > 0) {
            nodeSelection.filter(d => !d.data.isLeaf)
                .append('text')
                .attr('dy', n >= 6 ? 3 : 4)
                .attr('text-anchor', 'middle')
                .style('font-size', p.internalFont + 'px')
                .text(d => d.data.name);
        }

        // Leaf labels: vector
        if (p.showLeafText) {
            nodeSelection.filter(d => d.data.isLeaf)
                .append('text')
                .attr('dy', n >= 6 ? 2 : 3)
                .attr('text-anchor', 'middle')
                .style('font-size', p.leafFont + 'px')
                .text(d => d.data.vector.join(''));
        }

        // Leaf sub-labels: weight/value
        if (p.showSubLabel) {
            nodeSelection.filter(d => d.data.isLeaf)
                .append('text')
                .attr('dy', p.subDy)
                .attr('text-anchor', 'middle')
                .style('font-size', p.subFont + 'px')
                .style('fill', d => d.data.feasible ? '#64748b' : '#f87171')
                .text(d => `w=${d.data.weight} v=${d.data.value}`);
        }

        fitToView(treeW, treeH);

        // Tooltip on hover for ALL leaf nodes (essential for large trees without labels)
        nodeSelection.filter(d => d.data.isLeaf)
            .on('mouseenter', (event, d) => {
                const data = d.data;
                tooltip.innerHTML = `
                    <div style="color:#0891b2; margin-bottom:4px; font-weight:600;">[${data.vector.join(', ')}]</div>
                    <div>Peso: ${data.weight}</div>
                    <div>Valor: ${data.value}</div>
                    <div>Factible: ${data.feasible ? '<span style="color:#059669">S\u00ed</span>' : '<span style="color:#dc2626">No</span>'}</div>
                    <div>Fitness: ${data.fitness}</div>
                `;
                tooltip.style.display = 'block';
            })
            .on('mousemove', (event) => {
                const rect = document.getElementById('tree-area').getBoundingClientRect();
                tooltip.style.left = (event.clientX - rect.left + 14) + 'px';
                tooltip.style.top = (event.clientY - rect.top + 14) + 'px';
            })
            .on('mouseleave', () => {
                tooltip.style.display = 'none';
            });
    }

    function fitToView(treeW, treeH) {
        const padding = 60;
        const scale = Math.min(
            (width - padding * 2) / treeW,
            (height - padding * 2) / treeH,
            1.2
        );
        const tx = (width - treeW * scale) / 2;
        const ty = padding;
        svg.transition().duration(500).call(
            zoom.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
    }

    function clearHighlights() {
        g.selectAll('.node')
            .classed('highlight-current', false)
            .classed('highlight-best', false)
            .classed('highlight-candidate', false)
            .classed('highlight-rejected', false)
            .classed('flash-reject', false);
        g.selectAll('.link')
            .classed('highlight-current', false)
            .classed('highlight-best', false)
            .classed('highlight-candidate', false);
    }

    function highlightNode(vector, className) {
        const id = vector.join('');
        g.selectAll('.node')
            .filter(d => d.data.id === id && d.data.isLeaf)
            .classed(className, true);
    }

    function highlightPath(vector, className) {
        const n = vector.length;
        let currentId = '';
        for (let i = 0; i < n; i++) {
            const nextId = currentId + vector[i];
            g.selectAll('.link')
                .filter(d => d.source.data.id === currentId && d.target.data.id === nextId)
                .classed(className, true);
            currentId = nextId;
        }
    }

    function flashReject(vector) {
        const id = vector.join('');
        const node = g.selectAll('.node')
            .filter(d => d.data.id === id && d.data.isLeaf);
        node.classed('flash-reject', false);
        node.each(function() { void this.offsetWidth; });
        node.classed('flash-reject', true);
        setTimeout(() => node.classed('flash-reject', false), 900);
    }

    // Phases where the candidate (orange) should be visible on the tree
    const candidatePhases = new Set([
        'generate_neighbor', 'evaluate', 'compute_delta',
        'check_improve', 'check_metropolis', 'check_reject'
    ]);

    function updateHighlights(currentVec, bestVec, candidateVec, phase) {
        clearHighlights();

        // Best solution (green) — always visible
        if (bestVec) {
            highlightNode(bestVec, 'highlight-best');
            highlightPath(bestVec, 'highlight-best');
        }

        // Current solution (cyan) — always visible
        if (currentVec) {
            highlightNode(currentVec, 'highlight-current');
            if (!bestVec || currentVec.join('') !== bestVec.join('')) {
                highlightPath(currentVec, 'highlight-current');
            }
        }

        // Candidate (orange) — only during evaluation phases
        if (candidateVec && candidatePhases.has(phase)) {
            highlightNode(candidateVec, 'highlight-candidate');
            highlightPath(candidateVec, 'highlight-candidate');
        }
    }

    function onResize() {
        const container = document.getElementById('tree-area');
        width = container.clientWidth;
        height = container.clientHeight;
        svg.attr('width', width).attr('height', height);
    }

    return { init, render, clearHighlights, highlightNode, highlightPath, flashReject, updateHighlights, onResize };
})();


// ============================================================
// MODULE: PseudocodePanel
// ============================================================
const PseudocodePanel = (() => {
    const lines = [
        { tokens: [['var','S'],['op',' \u2190 '],['fn','soluci\u00f3n aleatoria factible']] },
        { tokens: [['var','S*'],['op',' \u2190 '],['var','S'],['var',';  '],['var','f*'],['op',' \u2190 '],['fn','f(S)']] },
        { tokens: [['var','T'],['op',' \u2190 '],['var','T0']] },
        { tokens: [['kw','while '],['var','iter'],['op',' < '],['var','maxIter'],['kw',':']] },
        { tokens: [['var','    S\''],['op',' \u2190 '],['fn','perturbar'],['var','(S)']] },
        { tokens: [['var','    '],['fn','Evaluar '],['fn','f'],['var','(S\')']] },
        { tokens: [['var','    \u0394E'],['op',' \u2190 '],['fn','f'],['var','(S\')'],['op',' - '],['fn','f'],['var','(S)']] },
        { tokens: [['var','    '],['kw','if '],['var','\u0394E'],['op',' \u2265 '],['var','0'],['kw',':']] },
        { tokens: [['var','        S'],['op',' \u2190 '],['var','S\''],['cm','  // aceptar mejora']] },
        { tokens: [['var','    '],['kw','else if '],['fn','rand()'],['op',' < '],['fn','exp'],['var','(\u0394E/T)'],['kw',':']] },
        { tokens: [['var','        S'],['op',' \u2190 '],['var','S\''],['cm','  // aceptar peor']] },
        { tokens: [['var','    '],['kw','else'],['kw',':']] },
        { tokens: [['var','        '],['fn','mantener '],['var','S'],['cm','  // rechazar']] },
        { tokens: [['var','    '],['kw','if '],['fn','f'],['var','(S)'],['op',' > '],['var','f*'],['kw',':']] },
        { tokens: [['var','        S*'],['op',' \u2190 '],['var','S'],['var',';  '],['var','f*'],['op',' \u2190 '],['fn','f(S)']] },
        { tokens: [['var','    T'],['op',' \u2190 '],['var','\u03b1'],['op',' \u00d7 '],['var','T']] },
        { tokens: [['var','    iter'],['op',' \u2190 '],['var','iter'],['op',' + '],['var','1']] },
        { tokens: [['kw','return '],['var','S*']] },
    ];

    const container = document.getElementById('pseudocode-container');

    function init() {
        container.innerHTML = '';
        lines.forEach((line, i) => {
            const div = document.createElement('div');
            div.className = 'pseudo-line';
            div.dataset.line = i;
            const numSpan = document.createElement('span');
            numSpan.className = 'line-num';
            numSpan.textContent = (i + 1).toString().padStart(2, ' ');
            div.appendChild(numSpan);

            const codeSpan = document.createElement('span');
            line.tokens.forEach(([cls, text]) => {
                const s = document.createElement('span');
                s.className = cls;
                s.textContent = text;
                codeSpan.appendChild(s);
            });
            div.appendChild(codeSpan);
            container.appendChild(div);
        });
    }

    function highlightLine(lineIndex) {
        container.querySelectorAll('.pseudo-line').forEach((el, i) => {
            el.classList.toggle('active', i === lineIndex);
        });
        const active = container.querySelector('.pseudo-line.active');
        if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function clearHighlight() {
        container.querySelectorAll('.pseudo-line').forEach(el => {
            el.classList.remove('active');
        });
    }

    const phaseToLine = {
        'init':               0,
        'init_best':          1,
        'init_temp':          2,
        'loop_start':         3,
        'generate_neighbor':  4,
        'evaluate':           5,
        'compute_delta':      6,
        'check_improve':      7,
        'accept_improve':     8,
        'check_metropolis':   9,
        'accept_worse':       10,
        'check_reject':       11,
        'reject':             12,
        'check_best':         13,
        'update_best':        14,
        'cool':               15,
        'increment':          16,
        'done':               17
    };

    function highlightPhase(phase) {
        const line = phaseToLine[phase];
        if (line !== undefined) highlightLine(line);
    }

    return { init, highlightLine, highlightPhase, clearHighlight };
})();


// ============================================================
// MODULE: VariablesPanel
// ============================================================
const VariablesPanel = (() => {
    const container = document.getElementById('variables-container');

    const vars = [
        { key: 'iter',       label: 'Iteraci\u00f3n' },
        { key: 'T',          label: 'T (temperatura)' },
        { key: 'current',    label: 'S (actual)' },
        { key: 'currentF',   label: 'f(S)' },
        { key: 'best',       label: 'S* (mejor)' },
        { key: 'bestF',      label: 'f(S*)' },
        { key: 'candidate',  label: 'S\' (candidato)' },
        { key: 'candidateF', label: 'f(S\')' },
        { key: 'deltaE',     label: '\u0394E' },
        { key: 'pAccept',    label: 'P(aceptar)' },
        { key: 'decision',   label: 'Decisi\u00f3n' },
    ];

    function init() {
        container.innerHTML = '';
        vars.forEach(v => {
            const row = document.createElement('div');
            row.className = 'var-row';
            row.innerHTML = `<span class="var-label">${v.label}</span><span class="var-value" id="var-${v.key}">-</span>`;
            container.appendChild(row);
        });
    }

    function update(state) {
        const set = (key, val, cls) => {
            const el = document.getElementById(`var-${key}`);
            if (el) {
                el.textContent = val;
                el.className = 'var-value' + (cls ? ' ' + cls : '');
            }
        };

        set('iter', state.iter !== undefined ? state.iter : '-');
        set('T', state.T !== undefined ? state.T.toFixed(4) : '-');
        set('current', state.current ? `[${state.current.join(',')}]` : '-', '');
        set('currentF', state.currentF !== undefined ? state.currentF : '-');
        set('best', state.best ? `[${state.best.join(',')}]` : '-', 'green');
        set('bestF', state.bestF !== undefined ? state.bestF : '-', 'green');
        set('candidate', state.candidate ? `[${state.candidate.join(',')}]` : '-', 'orange');
        set('candidateF', state.candidateF !== undefined ? state.candidateF : '-', 'orange');
        set('deltaE', state.deltaE !== undefined ? state.deltaE : '-',
            state.deltaE !== undefined ? (state.deltaE >= 0 ? 'green' : 'red') : '');
        set('pAccept', state.pAccept !== undefined ? state.pAccept.toFixed(4) : '-');

        if (state.decision === 'accept_improve') {
            set('decision', 'Aceptar (mejora)', 'green');
        } else if (state.decision === 'accept_worse') {
            set('decision', 'Aceptar (peor)', 'orange');
        } else if (state.decision === 'reject') {
            set('decision', 'Rechazar', 'red');
        } else {
            set('decision', '-');
        }
    }

    function clear() {
        vars.forEach(v => {
            const el = document.getElementById(`var-${v.key}`);
            if (el) { el.textContent = '-'; el.className = 'var-value'; }
        });
    }

    return { init, update, clear };
})();


// ============================================================
// MODULE: SimulatedAnnealing
// ============================================================
const SimulatedAnnealing = (() => {
    let state = null;

    function init(params) {
        const sol = KnapsackProblem.getRandomFeasibleSolution();
        state = {
            phase: 'init',
            current: [...sol.vector],
            currentF: sol.fitness,
            best: [...sol.vector],
            bestF: sol.fitness,
            candidate: null,
            candidateF: null,
            deltaE: null,
            pAccept: null,
            decision: null,
            T: params.T0,
            T0: params.T0,
            alpha: params.alpha,
            maxIter: params.maxIter,
            iter: 0,
            perturbation: params.perturbation,
            done: false,
            randVal: null
        };
        return state;
    }

    function perturb(vector, method) {
        const n = vector.length;
        const v = [...vector];

        if (method === 'flip1') {
            const i = Math.floor(Math.random() * n);
            v[i] = 1 - v[i];
        } else if (method === 'swap2') {
            if (n < 2) return v;
            let i = Math.floor(Math.random() * n);
            let j = Math.floor(Math.random() * n);
            while (j === i) j = Math.floor(Math.random() * n);
            [v[i], v[j]] = [v[j], v[i]];
        } else if (method === 'flip2') {
            if (n < 2) return v;
            let i = Math.floor(Math.random() * n);
            let j = Math.floor(Math.random() * n);
            while (j === i) j = Math.floor(Math.random() * n);
            v[i] = 1 - v[i];
            v[j] = 1 - v[j];
        }
        return v;
    }

    function stepOnce() {
        if (!state || state.done) return state;

        switch (state.phase) {
            case 'init':
                state.phase = 'init_best';
                break;

            case 'init_best':
                state.phase = 'init_temp';
                break;

            case 'init_temp':
                state.phase = 'loop_start';
                break;

            case 'loop_start':
                if (state.iter >= state.maxIter) {
                    state.phase = 'done';
                    state.done = true;
                } else {
                    state.candidate = null;
                    state.candidateF = null;
                    state.deltaE = null;
                    state.pAccept = null;
                    state.decision = null;
                    state.phase = 'generate_neighbor';
                }
                break;

            case 'generate_neighbor':
                state.candidate = perturb(state.current, state.perturbation);
                state.phase = 'evaluate';
                break;

            case 'evaluate': {
                const leaf = KnapsackProblem.getLeaf(state.candidate);
                state.candidateF = leaf ? leaf.fitness : 0;
                state.phase = 'compute_delta';
                break;
            }

            case 'compute_delta':
                state.deltaE = state.candidateF - state.currentF;
                state.phase = 'check_improve';
                break;

            case 'check_improve':
                if (state.deltaE >= 0) {
                    state.phase = 'accept_improve';
                } else {
                    state.phase = 'check_metropolis';
                }
                break;

            case 'accept_improve':
                state.decision = 'accept_improve';
                state.current = [...state.candidate];
                state.currentF = state.candidateF;
                state.phase = 'check_best';
                break;

            case 'check_metropolis': {
                const prob = Math.exp(state.deltaE / state.T);
                state.pAccept = prob;
                state.randVal = Math.random();
                if (state.randVal < prob) {
                    state.phase = 'accept_worse';
                } else {
                    state.phase = 'check_reject';
                }
                break;
            }

            case 'accept_worse':
                state.decision = 'accept_worse';
                state.current = [...state.candidate];
                state.currentF = state.candidateF;
                state.phase = 'check_best';
                break;

            case 'check_reject':
                state.phase = 'reject';
                break;

            case 'reject':
                state.decision = 'reject';
                state.phase = 'check_best';
                break;

            case 'check_best':
                if (state.currentF > state.bestF) {
                    state.phase = 'update_best';
                } else {
                    state.phase = 'cool';
                }
                break;

            case 'update_best':
                state.best = [...state.current];
                state.bestF = state.currentF;
                state.phase = 'cool';
                break;

            case 'cool':
                state.T = state.alpha * state.T;
                state.phase = 'increment';
                break;

            case 'increment':
                state.iter++;
                state.phase = 'loop_start';
                break;

            case 'done':
                state.done = true;
                break;
        }

        return state;
    }

    function getState() { return state; }
    function isDone() { return state ? state.done : true; }

    return { init, stepOnce, getState, isDone };
})();


// ============================================================
// MODULE: AnimationController
// ============================================================
const AnimationController = (() => {
    let intervalId = null;
    let playing = false;
    let speed = 600;
    let initialized = false;

    function setSpeed(ms) {
        speed = ms;
        if (playing) {
            clearInterval(intervalId);
            intervalId = setInterval(doStep, speed);
        }
    }

    function doStep() {
        // Save phase BEFORE stepping — this is what just executed
        const prevPhase = SimulatedAnnealing.getState()?.phase;
        const state = SimulatedAnnealing.stepOnce();
        if (!state) return;

        // When loop_start detects done, jump display to 'done'
        const displayPhase = (state.done && prevPhase === 'loop_start') ? 'done' : prevPhase;

        // All panels use displayPhase (what just executed) for sync
        PseudocodePanel.highlightPhase(displayPhase);
        VariablesPanel.update(state);

        TreeVisualization.updateHighlights(
            state.current,
            state.best,
            state.candidate,
            displayPhase
        );

        if (displayPhase === 'reject' && state.candidate) {
            TreeVisualization.flashReject(state.candidate);
        }

        updateStatus(state, displayPhase);

        if (state.done) {
            pause();
            document.getElementById('status-msg').textContent =
                `Terminado. Mejor soluci\u00f3n: [${state.best.join(',')}] con f*=${state.bestF}`;
        }
    }

    function updateStatus(state, displayPhase) {
        const msg = document.getElementById('status-msg');
        const info = document.getElementById('status-info');

        const phase = displayPhase || state.phase;

        const phaseLabels = {
            'init': `S \u2190 [${state.current.join(',')}] (factible aleatoria)`,
            'init_best': `S* \u2190 S,  f* \u2190 ${state.bestF}`,
            'init_temp': `T \u2190 ${state.T0}`,
            'loop_start': `Iteraci\u00f3n ${state.iter + 1} / ${state.maxIter}`,
            'generate_neighbor': `S' \u2190 perturbar(S) = [${state.candidate ? state.candidate.join(',') : '?'}]`,
            'evaluate': `f(S') = ${state.candidateF !== null && state.candidateF !== undefined ? state.candidateF : '?'}`,
            'compute_delta': `\u0394E = f(S') \u2212 f(S) = ${state.deltaE}`,
            'check_improve': state.deltaE >= 0 ? `\u0394E = ${state.deltaE} \u2265 0 \u2192 aceptar mejora` : `\u0394E = ${state.deltaE} < 0 \u2192 evaluar Metropolis`,
            'accept_improve': `Aceptar mejora: S \u2190 [${state.current.join(',')}]`,
            'check_metropolis': `P = exp(\u0394E/T) = ${state.pAccept ? state.pAccept.toFixed(4) : '?'},  rand = ${state.randVal ? state.randVal.toFixed(4) : '?'}`,
            'accept_worse': `Aceptar peor (Metropolis): S \u2190 [${state.current.join(',')}]`,
            'check_reject': `rand \u2265 P \u2192 rechazar candidato`,
            'reject': `Rechazado: mantener S = [${state.current.join(',')}]`,
            'check_best': state.currentF > state.bestF
                ? `f(S) = ${state.currentF} > f* = ${state.bestF} \u2192 actualizar mejor`
                : `f(S) = ${state.currentF} \u2264 f* = ${state.bestF} \u2192 mantener mejor`,
            'update_best': `\u00a1Nueva mejor! S* = [${state.best.join(',')}], f* = ${state.bestF}`,
            'cool': `T \u2190 \u03b1\u00d7T = ${state.T.toFixed(4)}`,
            'increment': `iter \u2190 ${state.iter}`,
            'done': 'Algoritmo terminado'
        };

        msg.textContent = phaseLabels[phase] || phase;
        info.textContent = `T=${state.T.toFixed(2)} | iter=${state.iter}/${state.maxIter}`;
    }

    function play() {
        if (!initialized) initSA();
        if (SimulatedAnnealing.isDone()) return;
        playing = true;
        intervalId = setInterval(doStep, speed);
        document.getElementById('btn-play').disabled = true;
        document.getElementById('btn-pause').disabled = false;
    }

    function pause() {
        playing = false;
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-pause').disabled = true;
    }

    function step() {
        if (!initialized) initSA();
        if (SimulatedAnnealing.isDone()) return;
        doStep();
    }

    function reset() {
        pause();
        initialized = false;
        PseudocodePanel.clearHighlight();
        VariablesPanel.clear();
        TreeVisualization.clearHighlights();
        document.getElementById('status-msg').textContent = 'Listo. Configure par\u00e1metros y presione Play o Step.';
        document.getElementById('status-info').textContent = '';
        document.getElementById('btn-play').disabled = false;
    }

    function initSA() {
        const params = {
            T0: parseFloat(document.getElementById('input-t0').value),
            alpha: parseFloat(document.getElementById('input-alpha').value),
            maxIter: parseInt(document.getElementById('input-maxiter').value),
            perturbation: document.getElementById('input-perturbation').value
        };
        SimulatedAnnealing.init(params);
        initialized = true;

        const state = SimulatedAnnealing.getState();
        VariablesPanel.update(state);
        TreeVisualization.updateHighlights(state.current, state.best, null, 'init');
        PseudocodePanel.highlightPhase('init');
        updateStatus(state, 'init');
    }

    function isPlaying() { return playing; }
    function isInitialized() { return initialized; }

    return { play, pause, step, reset, setSpeed, isPlaying, isInitialized };
})();


// ============================================================
// MODULE: ControlPanel (event wiring)
// ============================================================
const ControlPanel = (() => {
    function init() {
        // Speed input updates the animation controller in real time
        document.getElementById('input-speed').addEventListener('input', (e) => {
            AnimationController.setSpeed(parseInt(e.target.value));
        });

        // Buttons
        document.getElementById('btn-play').addEventListener('click', () => AnimationController.play());
        document.getElementById('btn-pause').addEventListener('click', () => AnimationController.pause());
        document.getElementById('btn-step').addEventListener('click', () => AnimationController.step());
        document.getElementById('btn-reset').addEventListener('click', () => AnimationController.reset());

        // N selector — rebuild tree
        document.getElementById('input-n').addEventListener('change', (e) => {
            AnimationController.reset();
            document.getElementById('val-n').textContent = e.target.value;
            initProblem(parseInt(e.target.value));
        });
    }

    return { init };
})();


// ============================================================
// INIT
// ============================================================
function initProblem(n) {
    const data = KnapsackProblem.init(n);
    const tree = KnapsackProblem.getTree();

    const tbody = document.querySelector('#items-table tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < data.n; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${data.weights[i]}</td><td>${data.values[i]}</td>`;
        tbody.appendChild(tr);
    }
    document.getElementById('capacity-display').textContent = `W = ${data.capacity}`;

    document.getElementById('problem-summary').textContent =
        `n=${data.n} | W=${data.capacity} | ${Math.pow(2, data.n)} soluciones`;

    TreeVisualization.init();
    TreeVisualization.render(tree);
}

function main() {
    PseudocodePanel.init();
    VariablesPanel.init();
    ControlPanel.init();

    // Read the actual selected value (browser may restore form state on refresh)
    const selectN = document.getElementById('input-n');
    const n = parseInt(selectN.value);
    document.getElementById('val-n').textContent = n;
    initProblem(n);

    window.addEventListener('resize', () => {
        TreeVisualization.onResize();
        const tree = KnapsackProblem.getTree();
        TreeVisualization.render(tree);
    });
}

document.addEventListener('DOMContentLoaded', main);
