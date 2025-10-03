# 📝 Alternativa: Google Forms para Muchos Estudiantes

Si tienes más de 100 estudiantes, Google Forms es una mejor opción (ilimitado y gratuito).

## 🎯 Ventajas de Google Forms

- ✅ **Ilimitado y gratuito**
- ✅ Respuestas automáticas en Google Sheets
- ✅ Fácil de analizar y filtrar
- ✅ Puede recibir archivos (requiere Google Drive)
- ✅ Notificaciones por email

## 📋 Pasos para Implementar

### 1. Crear el Google Form

1. Ve a [forms.google.com](https://forms.google.com)
2. Crea un nuevo formulario: **"Competencia MCP - Registro de Soluciones"**

### 2. Agregar Campos

Agrega estos campos al formulario:

**Información del Estudiante:**
- Nombre completo (Respuesta corta, requerido)
- Email (Respuesta corta, requerido, validar email)
- Matrícula/ID (Respuesta corta)
- Institución (Respuesta corta)

**Información de la Solución:**
- Instancia seleccionada (Desplegable, requerido)
  - Opciones: 2019-3-0.5, 2019-5-1.0, etc.
- Puntuación obtenida (Respuesta corta, requerido, validar número)
- Porcentaje de cobertura (Respuesta corta, requerido, validar número)
- Método utilizado (Desplegable, requerido)
  - Opciones: Greedy, Búsqueda Local, Simulated Annealing, etc.
- Descripción de la solución (Párrafo)

**Archivos:**
- Archivo de solución CSV (Subida de archivo, requerido)
- Código fuente (Subida de archivo, opcional)

### 3. Configurar Subida de Archivos

1. Para campos de archivo, click en el menú ⋮ → **"Validación de respuesta"**
2. Configura:
   - Tipo de archivo: Específico (.csv para solución)
   - Tamaño máximo: 10 MB
   - Número máximo de archivos: 1

### 4. Configurar Respuestas

1. Ve a **Respuestas** → Click en el ícono de Google Sheets
2. Crea una hoja de cálculo vinculada
3. Todas las respuestas se guardarán automáticamente

### 5. Integrar con tu Página Web

Opción A: **Botón directo**

```html
<a href="TU_URL_DE_GOOGLE_FORM" 
   class="btn btn-primary" 
   target="_blank">
   🏆 Registrar Solución Oficial
</a>
```

Opción B: **Iframe embebido**

```html
<iframe 
    src="TU_URL_DE_GOOGLE_FORM?embedded=true" 
    width="100%" 
    height="1200" 
    frameborder="0" 
    marginheight="0" 
    marginwidth="0">
    Cargando…
</iframe>
```

### 6. Modificar competencia_mcp.html

Reemplaza el botón de registro:

```javascript
// Submit solution button - redirect to Google Form
document.getElementById('submit-solution-btn').addEventListener('click', function() {
    // Abrir Google Form en nueva pestaña
    window.open('TU_URL_DE_GOOGLE_FORM', '_blank');
});
```

## 📊 Análisis de Resultados

### En Google Sheets

La hoja de cálculo tendrá columnas automáticas:
- Marca temporal
- Todos los campos del formulario
- Links a los archivos subidos

### Crear Ranking Automático

Agrega estas fórmulas en tu hoja:

**Columna de Ranking:**
```
=RANK(E2, E:E, 0)
```
(Donde E es la columna de puntuación)

**Filtrar por Instancia:**
```
=FILTER(A:F, C:C="2023-5-1.0")
```

**Top 10:**
```
=SORT(A:F, E, FALSE)
```

### Visualización con Google Data Studio

1. Conecta Google Sheets con Data Studio
2. Crea gráficos de:
   - Distribución de puntuaciones
   - Métodos más usados
   - Cobertura promedio por método
   - Ranking de estudiantes

## 🔔 Notificaciones Automáticas

### Opción 1: Notificaciones de Google Forms

1. En el formulario, click en **Respuestas**
2. Click en ⋮ → **"Recibir notificaciones por correo electrónico para nuevas respuestas"**

### Opción 2: Apps Script (Avanzado)

Crea un script para enviar emails personalizados:

```javascript
function onFormSubmit(e) {
  var email = e.values[2]; // Email del estudiante
  var nombre = e.values[1]; // Nombre
  var puntuacion = e.values[5]; // Puntuación
  
  var subject = "Confirmación - Competencia MCP";
  var body = "Hola " + nombre + ",\n\n" +
             "Tu solución ha sido recibida exitosamente.\n" +
             "Puntuación: " + puntuacion + "\n\n" +
             "Gracias por participar!";
  
  MailApp.sendEmail(email, subject, body);
}
```

Para activarlo:
1. En Google Sheets, **Extensiones** → **Apps Script**
2. Pega el código
3. Configura trigger: **onFormSubmit**

## 🏆 Crear Leaderboard Público

### Opción 1: Google Sheets Público

1. Publica la hoja de cálculo: **Archivo** → **Publicar en la web**
2. Selecciona solo las columnas necesarias
3. Embebe en tu página web

### Opción 2: API de Google Sheets

Usa la API para mostrar el ranking en tiempo real:

```javascript
// Ejemplo de fetch desde Google Sheets API
fetch('https://sheets.googleapis.com/v4/spreadsheets/SHEET_ID/values/A1:F100?key=API_KEY')
  .then(response => response.json())
  .then(data => {
    // Mostrar ranking en tu página
    displayLeaderboard(data.values);
  });
```

## 💡 Consejos

1. **Anonimizar datos:** Si publicas un leaderboard, considera usar solo iniciales o IDs
2. **Validación:** Revisa manualmente las primeras soluciones para detectar problemas
3. **Backup:** Exporta regularmente las respuestas a CSV
4. **Plagio:** Compara las soluciones para detectar copias

## 🔗 Recursos

- [Google Forms](https://forms.google.com)
- [Google Sheets](https://sheets.google.com)
- [Apps Script](https://script.google.com)
- [Data Studio](https://datastudio.google.com)

## 📧 Template de Email de Confirmación

```
Asunto: ✅ Solución Recibida - Competencia MCP

Hola [NOMBRE],

Tu solución para la Competencia MCP ha sido recibida exitosamente.

📊 Resumen:
- Instancia: [INSTANCIA]
- Puntuación: [PUNTUACION]
- Cobertura: [COBERTURA]%
- Método: [METODO]

Los resultados finales se publicarán el [FECHA].

¡Gracias por participar!

---
[TU NOMBRE]
[INSTITUCIÓN]
```

---

**Recomendación:** Usa Google Forms si tienes más de 50 estudiantes. Es más escalable y fácil de administrar.
