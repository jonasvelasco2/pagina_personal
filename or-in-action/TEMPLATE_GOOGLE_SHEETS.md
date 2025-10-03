# 📊 Template de Google Sheets para Análisis

## Estructura de la Hoja de Respuestas

Después de vincular el formulario, tendrás estas columnas automáticas:

| Columna | Nombre | Tipo |
|---------|--------|------|
| A | Marca temporal | Fecha/Hora |
| B | Nombre completo | Texto |
| C | Email | Texto |
| D | Matrícula o ID | Texto |
| E | Institución | Texto |
| F | Instancia seleccionada | Texto |
| G | Puntuación obtenida | Número |
| H | Porcentaje de cobertura | Número |
| I | Método utilizado | Texto |
| J | Descripción | Texto |
| K | Archivo de solución | URL |
| L | Código fuente | URL |

---

## Hoja 2: Ranking General

Crea una nueva hoja llamada "Ranking" con estas columnas:

### Fila 1 (Encabezados):
```
A1: Posición
B1: Nombre
C1: Instancia
D1: Puntuación
E1: Cobertura (%)
F1: Método
G1: Fecha
```

### Fórmulas (empezando en fila 2):

**A2 - Posición:**
```
=ROW()-1
```

**B2 - Nombre (ordenado por puntuación):**
```
=SORT(Respuestas!B:B, Respuestas!G:G, FALSE)
```

Mejor aún, usa esta fórmula en B2 para todo el ranking:
```
=QUERY(Respuestas!B:H, "SELECT B, F, G, H, I, A WHERE G IS NOT NULL ORDER BY G DESC", 1)
```

Esto creará automáticamente el ranking completo ordenado por puntuación.

---

## Hoja 3: Ranking por Instancia

Crea hojas separadas para cada instancia popular:

### Ejemplo: "Ranking 2023-5-1.0"

```
=QUERY(Respuestas!B:H, "SELECT B, G, H, I, A WHERE F = '2023 - 5 ambulancias - 1.0 km' AND G IS NOT NULL ORDER BY G DESC", 1)
```

---

## Hoja 4: Estadísticas

### Estadísticas Generales

| Métrica | Fórmula |
|---------|---------|
| Total de participantes | `=COUNTA(Respuestas!B:B)-1` |
| Puntuación promedio | `=AVERAGE(Respuestas!G:G)` |
| Puntuación máxima | `=MAX(Respuestas!G:G)` |
| Puntuación mínima | `=MIN(Respuestas!G:G)` |
| Cobertura promedio | `=AVERAGE(Respuestas!H:H)` |
| Cobertura máxima | `=MAX(Respuestas!H:H)` |

### Estadísticas por Método

```
=QUERY(Respuestas!I:G, "SELECT I, COUNT(I), AVG(G), MAX(G) WHERE I IS NOT NULL GROUP BY I ORDER BY AVG(G) DESC", 1)
```

Esto mostrará:
- Método
- Número de participantes que lo usaron
- Puntuación promedio
- Puntuación máxima

### Estadísticas por Instancia

```
=QUERY(Respuestas!F:G, "SELECT F, COUNT(F), AVG(G), MAX(G) WHERE F IS NOT NULL GROUP BY F ORDER BY F", 1)
```

---

## Hoja 5: Detección de Duplicados

Para detectar posibles soluciones duplicadas o estudiantes que enviaron múltiples veces:

### Envíos Múltiples por Email:

```
=QUERY(Respuestas!C:C, "SELECT C, COUNT(C) WHERE C IS NOT NULL GROUP BY C HAVING COUNT(C) > 1", 1)
```

### Mantener Solo el Mejor Envío:

```
=QUERY(Respuestas!B:H, "SELECT B, C, F, MAX(G), MAX(H), I, MAX(A) WHERE B IS NOT NULL GROUP BY B, C, F, I ORDER BY MAX(G) DESC", 1)
```

---

## Formato Condicional

### Resaltar Top 3

1. Selecciona la columna de puntuación
2. **Formato** → **Formato condicional**
3. Regla personalizada:
   - Top 1: `=G2=MAX($G$2:$G)`  → Color: Oro (#FFD700)
   - Top 2: `=G2=LARGE($G$2:$G,2)` → Color: Plata (#C0C0C0)
   - Top 3: `=G2=LARGE($G$2:$G,3)` → Color: Bronce (#CD7F32)

### Resaltar Cobertura Alta

- Cobertura ≥ 90%: Verde oscuro
- Cobertura ≥ 70%: Verde claro
- Cobertura ≥ 50%: Amarillo
- Cobertura < 50%: Rojo claro

---

## Gráficos Recomendados

### 1. Distribución de Puntuaciones (Histograma)

- Tipo: Histograma
- Rango de datos: Columna G (Puntuación)
- Tamaño de bin: 50 o 100

### 2. Métodos Más Usados (Gráfico de Barras)

- Tipo: Gráfico de barras
- Datos: Resultado de la query de métodos
- Eje X: Método
- Eje Y: Cantidad de participantes

### 3. Puntuación Promedio por Método (Gráfico de Columnas)

- Tipo: Gráfico de columnas
- Datos: Método vs Puntuación promedio
- Ordenar por puntuación descendente

### 4. Evolución de Envíos en el Tiempo (Gráfico de Línea)

- Tipo: Gráfico de línea
- Eje X: Fecha (columna A)
- Eje Y: Número acumulado de envíos

```
=COUNTIF($A$2:$A, "<="&A2)
```

### 5. Scatter Plot: Puntuación vs Cobertura

- Tipo: Gráfico de dispersión
- Eje X: Cobertura (%)
- Eje Y: Puntuación
- Agrupado por: Método

---

## Script de Apps Script para Análisis Avanzado

### Calcular Tiempo de Respuesta

```javascript
function calcularTiempoRespuesta() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respuestas");
  var data = sheet.getDataRange().getValues();
  
  // Asumiendo que tienes una fecha límite
  var fechaInicio = new Date("2025-01-01"); // Ajusta esta fecha
  
  for (var i = 1; i < data.length; i++) {
    var fechaEnvio = new Date(data[i][0]); // Columna A
    var tiempoHoras = (fechaEnvio - fechaInicio) / (1000 * 60 * 60);
    
    // Escribir en columna M (ajusta según necesites)
    sheet.getRange(i + 1, 13).setValue(tiempoHoras.toFixed(2));
  }
}
```

### Generar Certificados Automáticos

```javascript
function generarCertificados() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ranking");
  var data = sheet.getDataRange().getValues();
  
  // Template de certificado en Google Docs
  var templateId = "TU_TEMPLATE_ID";
  var folder = DriveApp.getFolderById("TU_FOLDER_ID");
  
  for (var i = 1; i < data.length && i <= 10; i++) { // Top 10
    var nombre = data[i][1];
    var posicion = i;
    var puntuacion = data[i][3];
    
    // Copiar template
    var docCopy = DriveApp.getFileById(templateId).makeCopy(
      "Certificado - " + nombre,
      folder
    );
    
    var doc = DocumentApp.openById(docCopy.getId());
    var body = doc.getBody();
    
    // Reemplazar placeholders
    body.replaceText("{{NOMBRE}}", nombre);
    body.replaceText("{{POSICION}}", posicion);
    body.replaceText("{{PUNTUACION}}", puntuacion);
    
    doc.saveAndClose();
    
    Logger.log("Certificado generado para: " + nombre);
  }
}
```

---

## Dashboard Interactivo

### Crear Filtros

1. Selecciona toda la tabla de datos
2. **Datos** → **Crear un filtro**
3. Ahora puedes filtrar por:
   - Instancia
   - Método
   - Rango de puntuación
   - Fecha

### Crear Vistas Filtradas

1. **Datos** → **Vistas de filtro** → **Crear nueva vista de filtro**
2. Crea vistas para:
   - "Top 10 General"
   - "Instancia 2023-5-1.0"
   - "Métodos Heurísticos"
   - "Métodos Exactos"

---

## Exportar Resultados

### Exportar a PDF

```javascript
function exportarRankingPDF() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ranking");
  var url = ss.getUrl();
  
  url = url.replace(/edit.*$/, '') + 
        'export?exportFormat=pdf&format=pdf' +
        '&gid=' + sheet.getSheetId();
  
  Logger.log(url);
  // Abre esta URL para descargar el PDF
}
```

### Enviar Ranking por Email

```javascript
function enviarRankingSemanal() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ranking");
  var data = sheet.getRange("A1:G11").getValues(); // Top 10 + header
  
  var htmlBody = "<h2>🏆 Ranking Semanal - Competencia MCP</h2>";
  htmlBody += "<table border='1' style='border-collapse: collapse;'>";
  
  for (var i = 0; i < data.length; i++) {
    htmlBody += "<tr>";
    for (var j = 0; j < data[i].length; j++) {
      var tag = i === 0 ? "th" : "td";
      htmlBody += "<" + tag + ">" + data[i][j] + "</" + tag + ">";
    }
    htmlBody += "</tr>";
  }
  htmlBody += "</table>";
  
  MailApp.sendEmail({
    to: "tu-email@ejemplo.com",
    subject: "Ranking Semanal - Competencia MCP",
    htmlBody: htmlBody
  });
}
```

Configura un trigger para que se ejecute semanalmente.

---

## Ejemplo de Hoja Completa

```
Hoja "Respuestas" (automática del formulario)
├── Columnas A-L: Datos del formulario
└── Columna M: Tiempo de respuesta (calculado)

Hoja "Ranking General"
├── Ranking completo ordenado por puntuación
└── Formato condicional para Top 3

Hoja "Ranking 2023-5-1.0"
├── Ranking filtrado por instancia
└── Solo muestra esa instancia específica

Hoja "Estadísticas"
├── Métricas generales
├── Estadísticas por método
├── Estadísticas por instancia
└── Gráficos

Hoja "Análisis"
├── Detección de duplicados
├── Envíos múltiples
└── Tendencias temporales

Hoja "Leaderboard Público"
├── Solo columnas públicas (sin emails)
├── Formato bonito para publicar
└── Esta es la que publicas en web
```

---

## 🎯 Checklist de Configuración

- [ ] Formulario vinculado a Google Sheets
- [ ] Hoja "Ranking General" creada con fórmulas
- [ ] Hojas por instancia creadas
- [ ] Hoja "Estadísticas" con métricas
- [ ] Formato condicional aplicado
- [ ] Gráficos creados
- [ ] Script de email de confirmación configurado
- [ ] Triggers configurados
- [ ] Vista pública creada (sin emails)
- [ ] Permisos de compartir configurados

---

¡Tu sistema de análisis está listo! 📊
