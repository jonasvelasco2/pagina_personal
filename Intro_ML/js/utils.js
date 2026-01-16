/**
 * Utilidades compartidas para recursos interactivos de ML
 * Universidad Panamericana - Curso de Machine Learning
 */

// ============================================
// Colores del tema
// ============================================
const COLORS = {
    blue: '#3b82f6',
    cyan: '#06b6d4',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
    gray: '#64748b',
    
    // Para datos
    train: '#3b82f6',
    test: '#f97316',
    prediction: '#22c55e',
    error: '#ef4444',
    
    // Para bias-variance
    bias: '#ec4899',
    variance: '#8b5cf6',
    noise: '#64748b',
    totalError: '#ef4444'
};

// ============================================
// Generación de datos
// ============================================

/**
 * Genera datos con una función subyacente + ruido
 * @param {number} n - Número de puntos
 * @param {function} trueFn - Función verdadera f(x)
 * @param {number} noise - Desviación estándar del ruido
 * @param {number} xMin - Valor mínimo de x
 * @param {number} xMax - Valor máximo de x
 * @returns {Array} Array de objetos {x, y, yTrue}
 */
function generateData(n, trueFn, noise = 0.3, xMin = 0, xMax = 1) {
    const data = [];
    for (let i = 0; i < n; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const yTrue = trueFn(x);
        const y = yTrue + randomNormal(0, noise);
        data.push({ x, y, yTrue });
    }
    return data.sort((a, b) => a.x - b.x);
}

/**
 * Genera puntos uniformemente espaciados
 */
function linspace(start, end, n) {
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
}

/**
 * Genera número aleatorio con distribución normal (Box-Muller)
 */
function randomNormal(mean = 0, std = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}

/**
 * Mezcla un array (Fisher-Yates shuffle)
 */
function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Divide datos en train/test
 */
function trainTestSplit(data, trainRatio = 0.7) {
    const shuffled = shuffle(data);
    const splitIdx = Math.floor(shuffled.length * trainRatio);
    return {
        train: shuffled.slice(0, splitIdx).sort((a, b) => a.x - b.x),
        test: shuffled.slice(splitIdx).sort((a, b) => a.x - b.x)
    };
}

// ============================================
// Regresión Polinomial
// ============================================

/**
 * Ajusta un polinomio de grado n a los datos
 * Usa mínimos cuadrados ordinarios
 * @param {Array} data - Array de {x, y}
 * @param {number} degree - Grado del polinomio
 * @returns {Array} Coeficientes [a0, a1, a2, ..., an]
 */
function polynomialFit(data, degree) {
    const n = data.length;
    const m = degree + 1;
    
    // Construir matriz de Vandermonde
    const X = [];
    const Y = [];
    
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(Math.pow(data[i].x, j));
        }
        X.push(row);
        Y.push(data[i].y);
    }
    
    // Resolver X'X * beta = X'Y usando Cholesky o pseudo-inversa simple
    // X'X
    const XtX = [];
    for (let i = 0; i < m; i++) {
        XtX[i] = [];
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += X[k][i] * X[k][j];
            }
            XtX[i][j] = sum;
        }
    }
    
    // X'Y
    const XtY = [];
    for (let i = 0; i < m; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += X[k][i] * Y[k];
        }
        XtY[i] = sum;
    }
    
    // Resolver sistema usando eliminación de Gauss con pivoteo parcial
    const coeffs = solveLinearSystem(XtX, XtY);
    
    return coeffs;
}

/**
 * Resuelve sistema de ecuaciones lineales Ax = b
 */
function solveLinearSystem(A, b) {
    const n = b.length;
    const aug = A.map((row, i) => [...row, b[i]]);
    
    // Eliminación hacia adelante con pivoteo parcial
    for (let col = 0; col < n; col++) {
        // Encontrar pivote máximo
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
                maxRow = row;
            }
        }
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
        
        // Eliminar
        for (let row = col + 1; row < n; row++) {
            const factor = aug[row][col] / aug[col][col];
            for (let j = col; j <= n; j++) {
                aug[row][j] -= factor * aug[col][j];
            }
        }
    }
    
    // Sustitución hacia atrás
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = aug[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= aug[i][j] * x[j];
        }
        x[i] /= aug[i][i];
    }
    
    return x;
}

/**
 * Evalúa polinomio en un punto
 */
function evaluatePolynomial(coeffs, x) {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
        result += coeffs[i] * Math.pow(x, i);
    }
    return result;
}

/**
 * Genera puntos para graficar el polinomio
 */
function polynomialCurve(coeffs, xMin, xMax, nPoints = 100) {
    const xs = linspace(xMin, xMax, nPoints);
    return xs.map(x => ({
        x,
        y: evaluatePolynomial(coeffs, x)
    }));
}

// ============================================
// Métricas
// ============================================

/**
 * Error cuadrático medio
 */
function mse(yTrue, yPred) {
    const n = yTrue.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += Math.pow(yTrue[i] - yPred[i], 2);
    }
    return sum / n;
}

/**
 * Raíz del error cuadrático medio
 */
function rmse(yTrue, yPred) {
    return Math.sqrt(mse(yTrue, yPred));
}

/**
 * Error absoluto medio
 */
function mae(yTrue, yPred) {
    const n = yTrue.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += Math.abs(yTrue[i] - yPred[i]);
    }
    return sum / n;
}

/**
 * Coeficiente de determinación R²
 */
function r2Score(yTrue, yPred) {
    const n = yTrue.length;
    const yMean = yTrue.reduce((a, b) => a + b, 0) / n;
    
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
        ssRes += Math.pow(yTrue[i] - yPred[i], 2);
        ssTot += Math.pow(yTrue[i] - yMean, 2);
    }
    
    return 1 - (ssRes / ssTot);
}

// ============================================
// Utilidades de UI
// ============================================

/**
 * Formatea número para mostrar
 */
function formatNumber(num, decimals = 3) {
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
}

/**
 * Actualiza texto de un elemento
 */
function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/**
 * Debounce para optimizar eventos frecuentes
 */
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ============================================
// Exportar para uso global
// ============================================
window.MLUtils = {
    COLORS,
    generateData,
    linspace,
    randomNormal,
    shuffle,
    trainTestSplit,
    polynomialFit,
    evaluatePolynomial,
    polynomialCurve,
    mse,
    rmse,
    mae,
    r2Score,
    formatNumber,
    updateText,
    debounce
};
