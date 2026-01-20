// Supuestos de Regresión Lineal - Visualización interactiva

// Colores
const COLORS = {
    point: '#0073bb',
    line: '#ff9900',
    residual: '#d13212',
    pass: '#1d8102',
    fail: '#d13212',
    grid: '#e8e8e8',
    axis: '#999',
    histogram: 'rgba(0, 115, 187, 0.6)',
    qqLine: '#ff9900',
    reference: '#1d8102'
};

// Estado global
let currentScenario = 'ideal';
let violationLevel = 50;
let residuals = [];
let fittedValues = [];
let xValues = [];
let yValues = [];
let beta0Hat = 2;  // Coeficientes estimados
let beta1Hat = 0.5;
let r2 = 0;
let n = 50;

// Elementos del DOM
const canvasModel = document.getElementById('canvasModel');
const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
const canvas3 = document.getElementById('canvas3');
const canvas4 = document.getElementById('canvas4');

const ctxModel = canvasModel.getContext('2d');
const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');
const ctx3 = canvas3.getContext('2d');
const ctx4 = canvas4.getContext('2d');

const modelR2 = document.getElementById('modelR2');
const modelBeta0 = document.getElementById('modelBeta0');
const modelBeta1 = document.getElementById('modelBeta1');

const violationSlider = document.getElementById('violationSlider');
const violationValue = document.getElementById('violationValue');

const status1 = document.getElementById('status1');
const status2 = document.getElementById('status2');
const status3 = document.getElementById('status3');
const status4 = document.getElementById('status4');

const pvalue1 = document.getElementById('pvalue1');
const pvalue2 = document.getElementById('pvalue2');
const pvalue3 = document.getElementById('pvalue3');
const pvalue4 = document.getElementById('pvalue4');

const explanation = document.getElementById('explanation');
const explanationText = document.getElementById('explanationText');

// Generador de números aleatorios con semilla
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Generar normal estándar (Box-Muller)
function randomNormal(mean = 0, std = 1, seed = null) {
    let u1, u2;
    if (seed !== null) {
        u1 = seededRandom(seed);
        u2 = seededRandom(seed + 1);
    } else {
        u1 = Math.random();
        u2 = Math.random();
    }
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z;
}

// Generar datos según escenario
function generateData() {
    const tempErrors = [];  // Errores del modelo verdadero
    xValues = [];
    yValues = [];
    
    const severity = violationLevel / 100;
    const beta0True = 2;  // Modelo verdadero
    const beta1True = 0.5;
    
    // Paso 1: Generar X y errores según el escenario
    for (let i = 0; i < n; i++) {
        const x = i / n * 10;
        xValues.push(x);
        
        let error;
        
        switch (currentScenario) {
            case 'ideal':
                // Errores normales, homocedasticos, independientes
                error = randomNormal(0, 1);
                break;
                
            case 'non-normal':
                // Distribución claramente no normal
                if (severity < 0.3) {
                    const skewFactor = 0.5 + severity * 2;
                    const u = Math.random();
                    error = (Math.pow(u, skewFactor) - 0.5) * 4;
                } else if (severity < 0.7) {
                    if (Math.random() < 0.5) {
                        error = randomNormal(-2, 0.6);
                    } else {
                        error = randomNormal(2, 0.6);
                    }
                } else {
                    const u = Math.random();
                    if (u < 0.6) {
                        error = randomNormal(0, 0.3);
                    } else if (u < 0.9) {
                        error = 2 + Math.abs(randomNormal(0, 2));
                    } else {
                        error = 5 + Math.abs(randomNormal(0, 1));
                    }
                }
                break;
                
            case 'heteroscedastic':
                const variance = 0.3 + x * 0.8 * severity;
                error = randomNormal(0, Math.sqrt(variance));
                break;
                
            case 'autocorrelated':
                if (i === 0) {
                    error = randomNormal(0, 1);
                } else {
                    const rho = 0.3 + 0.65 * severity;
                    error = rho * tempErrors[i - 1] + randomNormal(0, Math.sqrt(1 - rho * rho));
                }
                break;
                
            case 'nonlinear':
                const quadratic = 0.15 * severity * (x - 5) * (x - 5) - 3.5 * severity;
                error = randomNormal(0, 0.6) + quadratic;
                break;
                
            default:
                error = randomNormal(0, 1);
        }
        
        tempErrors.push(error);
        // Y = verdadero modelo + error
        yValues.push(beta0True + beta1True * x + error);
    }
    
    // Paso 2: Calcular coeficientes estimados por MCO (Mínimos Cuadrados Ordinarios)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumX2 += xValues[i] * xValues[i];
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    // β̂₁ = Σ(x - x̄)(y - ȳ) / Σ(x - x̄)²
    beta1Hat = (sumXY - n * meanX * meanY) / (sumX2 - n * meanX * meanX);
    // β̂₀ = ȳ - β̂₁x̄
    beta0Hat = meanY - beta1Hat * meanX;
    
    // Paso 3: Calcular valores ajustados y residuales del modelo ESTIMADO
    residuals = [];
    fittedValues = [];
    let ssRes = 0, ssTot = 0;
    
    for (let i = 0; i < n; i++) {
        const yHat = beta0Hat + beta1Hat * xValues[i];
        fittedValues.push(yHat);
        residuals.push(yValues[i] - yHat);
        
        ssRes += (yValues[i] - yHat) ** 2;
        ssTot += (yValues[i] - meanY) ** 2;
    }
    
    // R² del modelo ajustado
    r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
}

// Calcular estadísticas
function calculateStats() {
    const mean = residuals.reduce((a, b) => a + b, 0) / n;
    
    // Varianza
    const variance = residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
    const std = Math.sqrt(variance);
    
    // Normalidad - basado en correlación QQ y curtosis/asimetría
    const sorted = [...residuals].sort((a, b) => a - b);
    let qqCorrelation = calculateQQCorrelation(sorted);
    
    // Calcular curtosis y asimetría para detectar no-normalidad
    let m2 = 0, m3 = 0, m4 = 0;
    for (const r of residuals) {
        const d = r - mean;
        m2 += d * d;
        m3 += d * d * d;
        m4 += d * d * d * d;
    }
    m2 /= n;
    m3 /= n;
    m4 /= n;
    
    const skewness = m3 / Math.pow(m2, 1.5);
    const kurtosis = m4 / (m2 * m2) - 3; // Exceso de curtosis
    
    // Detectar bimodalidad: calcular el "dip" en la distribución
    // Dividir en bins y buscar valles
    const nBins = 20;
    const minR = Math.min(...residuals);
    const maxR = Math.max(...residuals);
    const binWidth = (maxR - minR) / nBins;
    const bins = new Array(nBins).fill(0);
    for (const r of residuals) {
        const idx = Math.min(Math.floor((r - minR) / binWidth), nBins - 1);
        bins[idx]++;
    }
    
    // Buscar bimodalidad: si hay dos picos con un valle en medio
    let bimodalScore = 0;
    const smoothedBins = bins.map((_, i) => {
        const start = Math.max(0, i - 1);
        const end = Math.min(nBins, i + 2);
        return bins.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
    });
    
    // Encontrar máximos locales
    const peaks = [];
    for (let i = 1; i < nBins - 1; i++) {
        if (smoothedBins[i] > smoothedBins[i-1] && smoothedBins[i] > smoothedBins[i+1]) {
            peaks.push({idx: i, val: smoothedBins[i]});
        }
    }
    
    // Si hay 2+ picos separados, calcular bimodalidad
    if (peaks.length >= 2) {
        peaks.sort((a, b) => b.val - a.val);
        const p1 = peaks[0].idx;
        const p2 = peaks[1].idx;
        const valleyIdx = Math.floor((p1 + p2) / 2);
        const valleyVal = smoothedBins[valleyIdx];
        const avgPeakVal = (peaks[0].val + peaks[1].val) / 2;
        
        // Puntuación de bimodalidad: qué tan profundo es el valle
        if (avgPeakVal > 0) {
            bimodalScore = Math.max(0, (avgPeakVal - valleyVal) / avgPeakVal);
        }
    }
    
    // P-value de Shapiro-Wilk simulado
    // Combina correlación QQ con medidas de forma
    const qqDeviation = 1 - qqCorrelation;
    
    // Pesos más agresivos para detectar no-normalidad
    const shapeDeviation = Math.abs(skewness) * 0.8 + Math.abs(kurtosis) * 0.3 + bimodalScore * 3;
    const normalityStatistic = qqDeviation * 15 + shapeDeviation;
    
    // Transformar a p-value (aproximación más sensible)
    let shapiroPValue = Math.exp(-normalityStatistic * 1.5);
    shapiroPValue = Math.max(0.001, Math.min(0.999, shapiroPValue));
    
    // Breusch-Pagan - basado en correlación entre residuales² y valores ajustados
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        const x = fittedValues[i];
        const y = residuals[i] * residuals[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
    }
    const corrNum = n * sumXY - sumX * sumY;
    const corrDen = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const heteroCorr = corrDen > 0 ? Math.abs(corrNum / corrDen) : 0;
    
    // Transformar correlación a p-value
    let bpPValue = Math.exp(-heteroCorr * n / 3);
    bpPValue = Math.max(0.001, Math.min(0.999, bpPValue));
    
    // Durbin-Watson
    let dw = calculateDurbinWatson();
    
    // P-value aproximado para Durbin-Watson
    // DW cerca de 2 = independencia, DW < 2 = autocorrelación positiva
    const dwDeviation = Math.abs(dw - 2);
    let dwPValue = Math.exp(-dwDeviation * n / 10);
    dwPValue = Math.max(0.001, Math.min(0.999, dwPValue));
    
    // Prueba de linealidad (RESET simplificado)
    // Correlación entre residuales y X²
    let linSumX2R = 0, linSumX2 = 0, linSumR = 0, linSumX2sq = 0, linSumRsq = 0;
    for (let i = 0; i < n; i++) {
        const x2 = xValues[i] * xValues[i];
        linSumX2R += x2 * residuals[i];
        linSumX2 += x2;
        linSumR += residuals[i];
        linSumX2sq += x2 * x2;
        linSumRsq += residuals[i] * residuals[i];
    }
    
    const corrLinNum = n * linSumX2R - linSumX2 * linSumR;
    const corrLinDen = Math.sqrt((n * linSumX2sq - linSumX2 * linSumX2) * (n * linSumRsq - linSumR * linSumR));
    const linearityCorr = corrLinDen > 0 ? Math.abs(corrLinNum / corrLinDen) : 0;
    
    // También considerar correlación con X³ para patrones cúbicos
    let linSumX3R = 0, linSumX3 = 0, linSumX3sq = 0;
    for (let i = 0; i < n; i++) {
        const x3 = xValues[i] * xValues[i] * xValues[i];
        linSumX3R += x3 * residuals[i];
        linSumX3 += x3;
        linSumX3sq += x3 * x3;
    }
    
    const corrLin3Num = n * linSumX3R - linSumX3 * linSumR;
    const corrLin3Den = Math.sqrt((n * linSumX3sq - linSumX3 * linSumX3) * (n * linSumRsq - linSumR * linSumR));
    const linearityCorr3 = corrLin3Den > 0 ? Math.abs(corrLin3Num / corrLin3Den) : 0;
    
    // Combinar ambas correlaciones
    const combinedLinearityCorr = Math.max(linearityCorr, linearityCorr3);
    
    // Transformar a p-value
    let linearityPValue = Math.exp(-combinedLinearityCorr * n / 4);
    linearityPValue = Math.max(0.001, Math.min(0.999, linearityPValue));
    
    return { mean, std, shapiroPValue, bpPValue, dw, dwPValue, qqCorrelation, skewness, kurtosis, linearityPValue };
}

// Calcular correlación QQ
function calculateQQCorrelation(sorted) {
    const theoretical = [];
    for (let i = 0; i < n; i++) {
        const p = (i + 0.5) / n;
        theoretical.push(normalQuantile(p));
    }
    
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += theoretical[i];
        sumY += sorted[i];
        sumXY += theoretical[i] * sorted[i];
        sumX2 += theoretical[i] ** 2;
        sumY2 += sorted[i] ** 2;
    }
    
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    
    return den > 0 ? num / den : 1;
}

// Cuantil normal (aproximación)
function normalQuantile(p) {
    if (p <= 0) return -3;
    if (p >= 1) return 3;
    
    // Aproximación de Acklam
    const a = [-3.969683028665376e+01, 2.209460984245205e+02,
               -2.759285104469687e+02, 1.383577518672690e+02,
               -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02,
               -1.556989798598866e+02, 6.680131188771972e+01,
               -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01,
               -2.400758277161838e+00, -2.549732539343734e+00,
               4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01,
               2.445134137142996e+00, 3.754408661907416e+00];
    
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    
    let q, r;
    
    if (p < pLow) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
               ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= pHigh) {
        q = p - 0.5;
        r = q * q;
        return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
               (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
}

// Calcular Durbin-Watson
function calculateDurbinWatson() {
    let sumDiff2 = 0;
    let sumRes2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumRes2 += residuals[i] ** 2;
        if (i > 0) {
            sumDiff2 += (residuals[i] - residuals[i - 1]) ** 2;
        }
    }
    
    return sumRes2 > 0 ? sumDiff2 / sumRes2 : 2;
}

// Actualizar estados visuales
function updateStatus(element, pvalueEl, passes, pvalueText, isSignificant) {
    if (passes) {
        element.className = 'panel-status pass';
        element.innerHTML = '<span>✓</span><span>Cumple</span>';
        pvalueEl.className = 'test-pvalue not-significant';
    } else {
        element.className = 'panel-status fail';
        element.innerHTML = '<span>✗</span><span>Violado</span>';
        pvalueEl.className = 'test-pvalue significant';
    }
    pvalueEl.textContent = pvalueText;
}

// Renderizar Panel 1: Residuales vs X (Linealidad)
function renderPanel1(stats) {
    const ctx = ctx1;
    const width = canvas1.width;
    const height = canvas1.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    const minX = 0;
    const maxX = 10;
    const minR = Math.min(...residuals) - 0.5;
    const maxR = Math.max(...residuals) + 0.5;
    
    // Línea en y=0 (referencia)
    const zeroY = height - padding - ((0 - minR) / (maxR - minR)) * (height - 2 * padding);
    ctx.strokeStyle = COLORS.reference;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Puntos: residuales vs X
    ctx.fillStyle = COLORS.point;
    for (let i = 0; i < n; i++) {
        const px = padding + ((xValues[i] - minX) / (maxX - minX)) * (width - 2 * padding);
        const py = height - padding - ((residuals[i] - minR) / (maxR - minR)) * (height - 2 * padding);
        
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Curva suavizada LOWESS para detectar patrón no lineal
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const windowSize = 8;
    let firstPoint = true;
    for (let xi = 0; xi <= 10; xi += 0.5) {
        // Promedio ponderado de residuales cercanos
        let sumW = 0, sumWR = 0;
        for (let i = 0; i < n; i++) {
            const dist = Math.abs(xValues[i] - xi);
            if (dist < windowSize / 2) {
                const w = 1 - (dist / (windowSize / 2));
                sumW += w;
                sumWR += w * residuals[i];
            }
        }
        
        if (sumW > 0) {
            const avgR = sumWR / sumW;
            const px = padding + (xi / 10) * (width - 2 * padding);
            const py = height - padding - ((avgR - minR) / (maxR - minR)) * (height - 2 * padding);
            
            if (firstPoint) {
                ctx.moveTo(px, py);
                firstPoint = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();
    
    // Ejes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Etiquetas
    ctx.fillStyle = '#666';
    ctx.font = '11px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('X (variable independiente)', width / 2, height - 5);
    
    // Actualizar estado (basado en prueba de linealidad)
    const linearOk = stats.linearityPValue > 0.05;
    updateStatus(status1, pvalue1, linearOk, `p = ${stats.linearityPValue.toFixed(3)}`, !linearOk);
}

// Renderizar Panel 2: Histograma de residuales (Normalidad)
function renderPanel2(stats) {
    const ctx = ctx2;
    const width = canvas2.width;
    const height = canvas2.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    // Calcular histograma
    const nBins = 12;
    const minR = Math.min(...residuals);
    const maxR = Math.max(...residuals);
    const range = maxR - minR;
    const binWidth = range / nBins;
    const counts = new Array(nBins).fill(0);
    
    for (const r of residuals) {
        const binIdx = Math.min(Math.floor((r - minR) / binWidth), nBins - 1);
        counts[binIdx]++;
    }
    
    const maxCount = Math.max(...counts);
    
    // Dibujar barras del histograma
    const barPixelWidth = (width - 2 * padding) / nBins;
    const scaleY = (height - 2 * padding) / (maxCount * 1.2);
    
    ctx.fillStyle = COLORS.histogram;
    for (let i = 0; i < nBins; i++) {
        const x = padding + i * barPixelWidth;
        const barHeight = counts[i] * scaleY;
        ctx.fillRect(x + 1, height - padding - barHeight, barPixelWidth - 2, barHeight);
    }
    
    // Superponer curva normal teórica
    const mean = stats.mean;
    const std = stats.std;
    
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Escalar la curva normal al histograma
    const normalPeak = 1 / (std * Math.sqrt(2 * Math.PI));
    const scaleFactor = (maxCount * scaleY) / normalPeak * 0.8;
    
    for (let px = padding; px <= width - padding; px++) {
        const r = minR + ((px - padding) / (width - 2 * padding)) * range;
        const z = (r - mean) / std;
        const normalDensity = Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
        const py = height - padding - normalDensity * scaleFactor;
        
        if (px === padding) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
    
    // Línea en cero (media)
    const zeroX = padding + ((0 - minR) / range) * (width - 2 * padding);
    if (zeroX > padding && zeroX < width - padding) {
        ctx.strokeStyle = COLORS.reference;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(zeroX, padding);
        ctx.lineTo(zeroX, height - padding);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Eje X
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Etiquetas
    ctx.fillStyle = '#666';
    ctx.font = '11px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('Residuales', width / 2, height - 5);
    
    // Etiquetas de rango
    ctx.font = '10px Source Sans Pro';
    ctx.fillText(minR.toFixed(1), padding, height - padding + 12);
    ctx.fillText(maxR.toFixed(1), width - padding, height - padding + 12);
    
    // Actualizar estado
    const normalOk = stats.shapiroPValue > 0.05;
    updateStatus(status2, pvalue2, normalOk, `p = ${stats.shapiroPValue.toFixed(3)}`, !normalOk);
}

// Renderizar Panel 3: Residuales vs Fitted
function renderPanel3(stats) {
    const ctx = ctx3;
    const width = canvas3.width;
    const height = canvas3.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    const minF = Math.min(...fittedValues);
    const maxF = Math.max(...fittedValues);
    const minR = Math.min(...residuals);
    const maxR = Math.max(...residuals);
    
    // Línea en y=0
    const zeroY = height - padding - ((0 - minR) / (maxR - minR)) * (height - 2 * padding);
    ctx.strokeStyle = COLORS.reference;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Puntos
    ctx.fillStyle = COLORS.point;
    for (let i = 0; i < n; i++) {
        const x = padding + ((fittedValues[i] - minF) / (maxF - minF)) * (width - 2 * padding);
        const y = height - padding - ((residuals[i] - minR) / (maxR - minR)) * (height - 2 * padding);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Tendencia suavizada (LOWESS simplificado)
    if (currentScenario === 'heteroscedastic' || currentScenario === 'nonlinear') {
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const windowSize = 10;
        for (let i = 0; i < n; i += 2) {
            const start = Math.max(0, i - windowSize);
            const end = Math.min(n, i + windowSize);
            let sumR = 0, count = 0;
            for (let j = start; j < end; j++) {
                sumR += residuals[j];
                count++;
            }
            const avgR = sumR / count;
            
            const x = padding + ((fittedValues[i] - minF) / (maxF - minF)) * (width - 2 * padding);
            const y = height - padding - ((avgR - minR) / (maxR - minR)) * (height - 2 * padding);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Ejes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Etiquetas
    ctx.fillStyle = '#666';
    ctx.font = '11px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('Valores ajustados (ŷ)', width / 2, height - 5);
    
    // Actualizar estado
    const homoOk = stats.bpPValue > 0.05;
    updateStatus(status3, pvalue3, homoOk, `p = ${stats.bpPValue.toFixed(3)}`, !homoOk);
}

// Renderizar Panel 4: Residuales vs Orden
function renderPanel4(stats) {
    const ctx = ctx4;
    const width = canvas4.width;
    const height = canvas4.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    const minR = Math.min(...residuals);
    const maxR = Math.max(...residuals);
    
    // Línea en y=0
    const zeroY = height - padding - ((0 - minR) / (maxR - minR)) * (height - 2 * padding);
    ctx.strokeStyle = COLORS.reference;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Línea conectando puntos
    ctx.strokeStyle = 'rgba(0, 115, 187, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        const x = padding + (i / (n - 1)) * (width - 2 * padding);
        const y = height - padding - ((residuals[i] - minR) / (maxR - minR)) * (height - 2 * padding);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Puntos
    ctx.fillStyle = COLORS.point;
    for (let i = 0; i < n; i++) {
        const x = padding + (i / (n - 1)) * (width - 2 * padding);
        const y = height - padding - ((residuals[i] - minR) / (maxR - minR)) * (height - 2 * padding);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Ejes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Etiquetas
    ctx.fillStyle = '#666';
    ctx.font = '11px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('Orden de observación', width / 2, height - 5);
    
    // Actualizar estado
    const indepOk = stats.dw > 1.5 && stats.dw < 2.5;
    updateStatus(status4, pvalue4, indepOk, `DW = ${stats.dw.toFixed(2)}`, !indepOk);
}

// Actualizar explicación
function updateExplanation() {
    const titles = {
        ideal: '💡 Escenario actual: Supuestos cumplidos',
        'non-normal': '⚠️ Escenario actual: Violación de normalidad',
        heteroscedastic: '⚠️ Escenario actual: Heterocedasticidad',
        autocorrelated: '⚠️ Escenario actual: Autocorrelación',
        nonlinear: '⚠️ Escenario actual: Relación no lineal'
    };
    
    const texts = {
        ideal: 'Cuando todos los supuestos se cumplen: la relación es lineal, los residuales siguen una distribución normal, tienen varianza constante y son independientes entre sí. En este caso, las inferencias estadísticas (p-values, intervalos de confianza) son válidas.',
        
        'non-normal': 'Los residuales no siguen una distribución normal. Esto puede deberse a outliers, colas pesadas o distribuciones asimétricas. <strong>Observa el histograma:</strong> no tiene forma de campana. <strong>Consecuencia:</strong> Los intervalos de confianza y pruebas de hipótesis pueden ser inexactos.',
        
        heteroscedastic: 'La varianza de los residuales no es constante (heterocedasticidad). En este caso, la varianza aumenta con los valores ajustados. <strong>Consecuencia:</strong> Los errores estándar de los coeficientes son incorrectos, lo que invalida las pruebas t y los intervalos de confianza.',
        
        autocorrelated: 'Los residuales están correlacionados entre sí (autocorrelación positiva). Común en datos de series temporales. <strong>Consecuencia:</strong> Los errores estándar están subestimados, lo que lleva a p-values artificialmente pequeños y conclusiones incorrectas.',
        
        nonlinear: '<strong>El supuesto de linealidad está violado.</strong> El modelo lineal no captura la verdadera relación entre las variables. Observa en el panel 1 cómo la curva naranja (tendencia de residuales) se aleja de la línea cero, mostrando un patrón sistemático. <strong>Consecuencia:</strong> Predicciones sesgadas y coeficientes sin interpretación válida.'
    };
    
    explanation.querySelector('h3').textContent = titles[currentScenario];
    explanationText.innerHTML = texts[currentScenario];
}

// Renderizar Panel del Modelo de Regresión
function renderModelPanel(stats) {
    const ctx = ctxModel;
    const width = canvasModel.width;
    const height = canvasModel.height;
    const padding = 50;
    
    ctx.clearRect(0, 0, width, height);
    
    // Rangos (usando los valores globales xValues e yValues)
    const minX = 0;
    const maxX = 10;
    const minY = Math.min(...yValues) - 0.5;
    const maxY = Math.max(...yValues) + 0.5;
    
    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= 10; x += 2) {
        const px = padding + (x / 10) * (width - 2 * padding);
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
    }
    
    // Línea de regresión ESTIMADA (usando coeficientes calculados por MCO)
    const yHatStart = beta0Hat + beta1Hat * minX;
    const yHatEnd = beta0Hat + beta1Hat * maxX;
    const x1 = padding;
    const y1 = height - padding - ((yHatStart - minY) / (maxY - minY)) * (height - 2 * padding);
    const x2 = width - padding;
    const y2 = height - padding - ((yHatEnd - minY) / (maxY - minY)) * (height - 2 * padding);
    
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Residuales (líneas verticales desde punto hasta línea ajustada)
    ctx.strokeStyle = COLORS.residual;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i < n; i++) {
        const px = padding + (xValues[i] / 10) * (width - 2 * padding);
        const pyActual = height - padding - ((yValues[i] - minY) / (maxY - minY)) * (height - 2 * padding);
        const yHat = beta0Hat + beta1Hat * xValues[i];
        const pyHat = height - padding - ((yHat - minY) / (maxY - minY)) * (height - 2 * padding);
        
        ctx.beginPath();
        ctx.moveTo(px, pyActual);
        ctx.lineTo(px, pyHat);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Puntos de datos
    ctx.fillStyle = COLORS.point;
    for (let i = 0; i < n; i++) {
        const px = padding + (xValues[i] / 10) * (width - 2 * padding);
        const py = height - padding - ((yValues[i] - minY) / (maxY - minY)) * (height - 2 * padding);
        
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Ejes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    
    // Etiquetas de ejes
    ctx.fillStyle = '#666';
    ctx.font = 'bold 12px Source Sans Pro';
    ctx.textAlign = 'center';
    ctx.fillText('x (variable independiente)', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y (variable dependiente)', 0, 0);
    ctx.restore();
    
    // Etiquetas numéricas
    ctx.font = '11px Source Sans Pro';
    for (let x = 0; x <= 10; x += 2) {
        const px = padding + (x / 10) * (width - 2 * padding);
        ctx.fillText(x.toString(), px, height - padding + 15);
    }
    
    // Actualizar info del modelo con coeficientes ESTIMADOS
    modelR2.textContent = `R² = ${r2.toFixed(3)}`;
    modelBeta0.textContent = beta0Hat.toFixed(2);
    modelBeta1.textContent = beta1Hat.toFixed(2);
}

// Renderizar todo
function render() {
    generateData();
    const stats = calculateStats();
    
    renderModelPanel(stats);
    renderPanel1(stats);
    renderPanel2(stats);
    renderPanel3(stats);
    renderPanel4(stats);
    updateExplanation();
}

// Event listeners
document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentScenario = btn.dataset.scenario;
        render();
    });
});

violationSlider.addEventListener('input', () => {
    violationLevel = parseInt(violationSlider.value);
    violationValue.textContent = violationLevel + '%';
    render();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    render();
});
