// ROC Curve Builder
// Visualiza cómo se construye la curva ROC y el AUC

// Colores
const COLORS = {
    positive: '#0073bb',
    negative: '#ff9900',
    threshold: '#d13212',
    roc: '#1e8e8e',
    rocPoint: '#d13212',
    diagonal: '#ccc',
    areaFill: 'rgba(30, 142, 142, 0.2)'
};

// Estado global
let positiveScores = [];
let negativeScores = [];
let rocPoints = [];
let currentThreshold = 0.5;
let isAnimating = false;
let histogramChart = null;
let rocChart = null;

// Elementos del DOM
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValue = document.getElementById('thresholdValue');
const samplesSlider = document.getElementById('samplesSlider');
const samplesValue = document.getElementById('samplesValue');
const animateBtn = document.getElementById('animateBtn');
const resetBtn = document.getElementById('resetBtn');

const posMeanSlider = document.getElementById('posMean');
const posMeanValue = document.getElementById('posMeanValue');
const posStdSlider = document.getElementById('posStd');
const posStdValue = document.getElementById('posStdValue');
const negMeanSlider = document.getElementById('negMean');
const negMeanValue = document.getElementById('negMeanValue');
const negStdSlider = document.getElementById('negStd');
const negStdValue = document.getElementById('negStdValue');

const metricThreshold = document.getElementById('metricThreshold');
const metricTPR = document.getElementById('metricTPR');
const metricFPR = document.getElementById('metricFPR');
const metricAUC = document.getElementById('metricAUC');

const confTP = document.getElementById('confTP');
const confFN = document.getElementById('confFN');
const confFP = document.getElementById('confFP');
const confTN = document.getElementById('confTN');

const infoText = document.getElementById('infoText');

// Generar muestra de distribución normal usando Box-Muller
function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateNormalSamples(n, mean, std) {
    const samples = [];
    for (let i = 0; i < n; i++) {
        let value = mean + std * randn();
        // Clamp to [0, 1]
        value = Math.max(0, Math.min(1, value));
        samples.push(value);
    }
    return samples;
}

// Generar datos
function generateData() {
    const n = parseInt(samplesSlider.value);
    const posMean = parseInt(posMeanSlider.value) / 100;
    const posStd = parseInt(posStdSlider.value) / 100;
    const negMean = parseInt(negMeanSlider.value) / 100;
    const negStd = parseInt(negStdSlider.value) / 100;
    
    positiveScores = generateNormalSamples(n, posMean, posStd);
    negativeScores = generateNormalSamples(n, negMean, negStd);
    
    // Calcular curva ROC completa
    calculateROCCurve();
}

// Calcular métricas para un umbral dado
function calculateMetrics(threshold) {
    const tp = positiveScores.filter(s => s >= threshold).length;
    const fn = positiveScores.filter(s => s < threshold).length;
    const fp = negativeScores.filter(s => s >= threshold).length;
    const tn = negativeScores.filter(s => s < threshold).length;
    
    const tpr = positiveScores.length > 0 ? tp / positiveScores.length : 0;
    const fpr = negativeScores.length > 0 ? fp / negativeScores.length : 0;
    
    return { tp, fn, fp, tn, tpr, fpr };
}

// Calcular curva ROC completa
function calculateROCCurve() {
    rocPoints = [];
    
    // Generar puntos para diferentes umbrales
    const thresholds = [];
    for (let t = 0; t <= 1.01; t += 0.01) {
        thresholds.push(t);
    }
    
    for (const t of thresholds) {
        const metrics = calculateMetrics(t);
        rocPoints.push({
            threshold: t,
            fpr: metrics.fpr,
            tpr: metrics.tpr
        });
    }
    
    // Ordenar por FPR para dibujar correctamente
    rocPoints.sort((a, b) => a.fpr - b.fpr);
}

// Calcular AUC usando el método del trapecio
function calculateAUC() {
    let auc = 0;
    const sorted = [...rocPoints].sort((a, b) => a.fpr - b.fpr);
    
    for (let i = 1; i < sorted.length; i++) {
        const dx = sorted[i].fpr - sorted[i-1].fpr;
        const avgY = (sorted[i].tpr + sorted[i-1].tpr) / 2;
        auc += dx * avgY;
    }
    
    return auc;
}

// Crear histograma de scores
function createHistogram(scores, bins = 20) {
    const histogram = new Array(bins).fill(0);
    const binWidth = 1 / bins;
    
    for (const score of scores) {
        const binIndex = Math.min(Math.floor(score / binWidth), bins - 1);
        histogram[binIndex]++;
    }
    
    return histogram;
}

// Inicializar gráfico de histograma
function initHistogramChart() {
    const ctx = document.getElementById('histogramChart').getContext('2d');
    
    if (histogramChart) {
        histogramChart.destroy();
    }
    
    const bins = 20;
    const labels = Array.from({length: bins}, (_, i) => ((i + 0.5) / bins).toFixed(2));
    
    histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Clase negativa',
                    data: [],
                    backgroundColor: COLORS.negative + '80',
                    borderColor: COLORS.negative,
                    borderWidth: 1
                },
                {
                    label: 'Clase positiva',
                    data: [],
                    backgroundColor: COLORS.positive + '80',
                    borderColor: COLORS.positive,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: { family: "'Source Sans Pro'" }
                    }
                },
                annotation: {
                    annotations: {}
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Score del modelo',
                        font: { family: "'Source Sans Pro'", weight: 'bold' }
                    },
                    stacked: false
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frecuencia',
                        font: { family: "'Source Sans Pro'", weight: 'bold' }
                    },
                    stacked: false,
                    beginAtZero: true
                }
            }
        }
    });
}

// Inicializar gráfico ROC
function initROCChart() {
    const ctx = document.getElementById('rocChart').getContext('2d');
    
    if (rocChart) {
        rocChart.destroy();
    }
    
    rocChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Diagonal (aleatorio)',
                    data: [{x: 0, y: 0}, {x: 1, y: 1}],
                    type: 'line',
                    borderColor: COLORS.diagonal,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Curva ROC',
                    data: [],
                    type: 'line',
                    borderColor: COLORS.roc,
                    borderWidth: 3,
                    fill: true,
                    backgroundColor: COLORS.areaFill,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    label: 'Punto actual',
                    data: [],
                    type: 'scatter',
                    backgroundColor: COLORS.rocPoint,
                    borderColor: 'white',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: { family: "'Source Sans Pro'" },
                        filter: (item) => item.text !== 'Punto actual'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'FPR (1 - Specificity)',
                        font: { family: "'Source Sans Pro'", weight: 'bold' }
                    },
                    min: 0,
                    max: 1
                },
                y: {
                    title: {
                        display: true,
                        text: 'TPR (Sensitivity)',
                        font: { family: "'Source Sans Pro'", weight: 'bold' }
                    },
                    min: 0,
                    max: 1
                }
            }
        }
    });
}

// Actualizar histograma
function updateHistogram() {
    const bins = 20;
    const posHist = createHistogram(positiveScores, bins);
    const negHist = createHistogram(negativeScores, bins);
    
    histogramChart.data.datasets[0].data = negHist;
    histogramChart.data.datasets[1].data = posHist;
    histogramChart.update();
}

// Actualizar gráfico ROC
function updateROCChart(showFullCurve = true) {
    // Actualizar curva completa
    if (showFullCurve) {
        rocChart.data.datasets[1].data = rocPoints.map(p => ({ x: p.fpr, y: p.tpr }));
    }
    
    // Actualizar punto actual
    const metrics = calculateMetrics(currentThreshold);
    rocChart.data.datasets[2].data = [{ x: metrics.fpr, y: metrics.tpr }];
    
    rocChart.update();
}

// Actualizar métricas mostradas
function updateMetrics() {
    const metrics = calculateMetrics(currentThreshold);
    const auc = calculateAUC();
    
    metricThreshold.textContent = currentThreshold.toFixed(2);
    metricTPR.textContent = metrics.tpr.toFixed(3);
    metricFPR.textContent = metrics.fpr.toFixed(3);
    metricAUC.textContent = auc.toFixed(3);
    
    confTP.textContent = metrics.tp;
    confFN.textContent = metrics.fn;
    confFP.textContent = metrics.fp;
    confTN.textContent = metrics.tn;
    
    // Actualizar texto informativo según la posición en la curva
    if (currentThreshold < 0.2) {
        infoText.textContent = 'Con un umbral muy bajo, clasificamos casi todo como positivo. ' +
            'Tenemos alto TPR (detectamos casi todos los positivos) pero también alto FPR (muchos falsos positivos).';
    } else if (currentThreshold > 0.8) {
        infoText.textContent = 'Con un umbral muy alto, somos muy conservadores. ' +
            'Bajo FPR (pocos falsos positivos) pero también bajo TPR (perdemos muchos positivos reales).';
    } else {
        infoText.textContent = 'La curva ROC muestra la relación entre TPR y FPR para diferentes umbrales. ' +
            `Con umbral ${currentThreshold.toFixed(2)}, TPR = ${metrics.tpr.toFixed(2)} y FPR = ${metrics.fpr.toFixed(2)}. ` +
            `El AUC de ${auc.toFixed(3)} indica ${auc > 0.9 ? 'excelente' : auc > 0.8 ? 'buen' : auc > 0.7 ? 'aceptable' : 'pobre'} poder discriminativo.`;
    }
}

// Dibujar línea de umbral en el histograma
function drawThresholdLine() {
    const bins = 20;
    const binIndex = Math.floor(currentThreshold * bins);
    
    // Usamos un plugin de annotation o dibujamos manualmente
    // Como no tenemos el plugin, actualizamos visualmente usando otro enfoque
    // Recreamos el histograma con colores según el umbral
    
    const posHist = createHistogram(positiveScores, bins);
    const negHist = createHistogram(negativeScores, bins);
    
    // Colorear barras según si están por encima o debajo del umbral
    const posColors = posHist.map((_, i) => {
        const binMid = (i + 0.5) / bins;
        return binMid >= currentThreshold ? COLORS.positive + 'cc' : COLORS.positive + '40';
    });
    
    const negColors = negHist.map((_, i) => {
        const binMid = (i + 0.5) / bins;
        return binMid >= currentThreshold ? COLORS.negative + 'cc' : COLORS.negative + '40';
    });
    
    histogramChart.data.datasets[0].backgroundColor = negColors;
    histogramChart.data.datasets[1].backgroundColor = posColors;
    histogramChart.update();
}

// Animar curva ROC
async function animateROC() {
    if (isAnimating) {
        isAnimating = false;
        animateBtn.textContent = '▶ Animar curva';
        return;
    }
    
    isAnimating = true;
    animateBtn.textContent = '⏸ Detener';
    
    // Limpiar curva
    rocChart.data.datasets[1].data = [];
    rocChart.update();
    
    // Animar desde umbral 1 hasta 0
    const steps = 50;
    const animatedPoints = [];
    
    for (let i = 0; i <= steps && isAnimating; i++) {
        const threshold = 1 - (i / steps);
        currentThreshold = threshold;
        thresholdSlider.value = Math.round(threshold * 100);
        thresholdValue.textContent = threshold.toFixed(2);
        
        const metrics = calculateMetrics(threshold);
        animatedPoints.push({ x: metrics.fpr, y: metrics.tpr });
        
        rocChart.data.datasets[1].data = [...animatedPoints];
        rocChart.data.datasets[2].data = [{ x: metrics.fpr, y: metrics.tpr }];
        rocChart.update('none');
        
        updateMetrics();
        drawThresholdLine();
        
        await new Promise(resolve => setTimeout(resolve, 60));
    }
    
    // Mostrar curva completa al final
    updateROCChart(true);
    
    isAnimating = false;
    animateBtn.textContent = '▶ Animar curva';
}

// Inicializar todo
function initialize() {
    generateData();
    initHistogramChart();
    initROCChart();
    updateHistogram();
    updateROCChart();
    updateMetrics();
    drawThresholdLine();
}

// Event listeners
thresholdSlider.addEventListener('input', () => {
    currentThreshold = parseInt(thresholdSlider.value) / 100;
    thresholdValue.textContent = currentThreshold.toFixed(2);
    updateROCChart();
    updateMetrics();
    drawThresholdLine();
});

samplesSlider.addEventListener('input', () => {
    samplesValue.textContent = samplesSlider.value;
    generateData();
    updateHistogram();
    updateROCChart();
    updateMetrics();
    drawThresholdLine();
});

// Distribution controls
[posMeanSlider, posStdSlider, negMeanSlider, negStdSlider].forEach(slider => {
    slider.addEventListener('input', () => {
        posMeanValue.textContent = (parseInt(posMeanSlider.value) / 100).toFixed(2);
        posStdValue.textContent = (parseInt(posStdSlider.value) / 100).toFixed(2);
        negMeanValue.textContent = (parseInt(negMeanSlider.value) / 100).toFixed(2);
        negStdValue.textContent = (parseInt(negStdSlider.value) / 100).toFixed(2);
        
        generateData();
        updateHistogram();
        updateROCChart();
        updateMetrics();
        drawThresholdLine();
    });
});

animateBtn.addEventListener('click', animateROC);

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    animateBtn.textContent = '▶ Animar curva';
    
    // Reset sliders
    thresholdSlider.value = 50;
    currentThreshold = 0.5;
    thresholdValue.textContent = '0.50';
    
    posMeanSlider.value = 65;
    posStdSlider.value = 15;
    negMeanSlider.value = 35;
    negStdSlider.value = 15;
    
    posMeanValue.textContent = '0.65';
    posStdValue.textContent = '0.15';
    negMeanValue.textContent = '0.35';
    negStdValue.textContent = '0.15';
    
    initialize();
});

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initialize);
