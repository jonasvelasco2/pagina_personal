# 📝 Guía: Configurar Google Forms para la Competencia MCP

## Paso 1: Crear el Google Form

1. Ve a [forms.google.com](https://forms.google.com)
2. Click en **"+ Blank"** o **"+ En blanco"**
3. Título: **"Competencia MCP - Registro de Soluciones"**
4. Descripción: 
```
Formulario oficial para registrar tu solución en la Competencia de Maximal Covering Location.
Asegúrate de tener tu archivo CSV de solución listo antes de enviar.
```

## Paso 2: Agregar Campos al Formulario

### Sección 1: Información del Estudiante

**Campo 1: Nombre completo**
- Tipo: Respuesta corta
- ✅ Obligatorio
- Descripción: "Tu nombre completo"

**Campo 2: Email**
- Tipo: Respuesta corta
- ✅ Obligatorio
- ✅ Validación de respuesta → Texto → Dirección de correo electrónico
- Descripción: "Usa tu correo institucional si es posible"

**Campo 3: Matrícula o ID de estudiante**
- Tipo: Respuesta corta
- Descripción: "Tu matrícula o número de identificación"

**Campo 4: Institución**
- Tipo: Respuesta corta
- Descripción: "Universidad, empresa u organización"

---

### Sección 2: Información de la Solución

**Campo 5: Instancia seleccionada**
- Tipo: Desplegable (Dropdown)
- ✅ Obligatorio
- Opciones:
  ```
  2019 - 3 ambulancias - 0.5 km
  2019 - 3 ambulancias - 1.0 km
  2019 - 5 ambulancias - 0.5 km
  2019 - 5 ambulancias - 1.0 km
  2019 - 5 ambulancias - 1.5 km
  2019 - 7 ambulancias - 1.0 km
  2019 - 7 ambulancias - 1.5 km
  2019 - 10 ambulancias - 1.0 km
  2020 - 3 ambulancias - 0.5 km
  2020 - 5 ambulancias - 1.0 km
  2020 - 7 ambulancias - 1.5 km
  2021 - 3 ambulancias - 0.5 km
  2021 - 5 ambulancias - 1.0 km
  2021 - 7 ambulancias - 1.5 km
  2022 - 3 ambulancias - 0.5 km
  2022 - 5 ambulancias - 1.0 km
  2022 - 7 ambulancias - 1.5 km
  2023 - 3 ambulancias - 0.5 km
  2023 - 5 ambulancias - 1.0 km
  2023 - 7 ambulancias - 1.5 km
  2023 - 10 ambulancias - 2.0 km
  ```

**Campo 6: Puntuación obtenida**
- Tipo: Respuesta corta
- ✅ Obligatorio
- ✅ Validación de respuesta → Número → Mayor o igual a → 0
- Descripción: "Número de accidentes cubiertos (tu puntuación)"

**Campo 7: Porcentaje de cobertura**
- Tipo: Respuesta corta
- ✅ Obligatorio
- ✅ Validación de respuesta → Número → Entre → 0 y 100
- Descripción: "Porcentaje de cobertura (ejemplo: 85.50)"

**Campo 8: Método utilizado**
- Tipo: Desplegable (Dropdown)
- ✅ Obligatorio
- Opciones:
  ```
  Algoritmo Greedy
  Búsqueda Local
  Simulated Annealing
  Algoritmo Genético
  Búsqueda Tabú
  Programación Lineal Entera (ILP)
  GRASP
  Variable Neighborhood Search (VNS)
  Ant Colony Optimization
  Particle Swarm Optimization
  Híbrido (especificar en descripción)
  Otro (especificar en descripción)
  ```

**Campo 9: Descripción de tu solución**
- Tipo: Párrafo
- Descripción: "Describe brevemente tu enfoque, herramientas utilizadas, tiempo de ejecución, etc."

---

### Sección 3: Archivos

**Campo 10: Archivo de solución (CSV)**
- Tipo: Subida de archivo
- ✅ Obligatorio
- Configuración:
  - Click en ⋮ (menú) → "Validación de respuesta"
  - Tipo de archivo: Específico → `.csv`
  - Tamaño máximo de archivo: 10 MB
  - Número máximo de archivos: 1
- Descripción: "Sube tu archivo CSV con las ubicaciones de las ambulancias (formato: LATITUD,LONGITUD)"

**Campo 11: Código fuente (opcional)**
- Tipo: Subida de archivo
- Configuración:
  - Tipo de archivo: Específico → `.py, .ipynb, .r, .jl, .cpp, .java, .zip, .rar, .7z`
  - Tamaño máximo de archivo: 50 MB
  - Número máximo de archivos: 1
- Descripción: "Opcional: Sube tu código fuente (Python, R, Julia, C++, Java, etc.)"

---

## Paso 3: Configurar Respuestas

1. Click en la pestaña **"Respuestas"**
2. Click en el ícono de Google Sheets (crear hoja de cálculo)
3. Selecciona **"Crear una hoja de cálculo nueva"**
4. Nombre: "Competencia MCP - Respuestas"
5. Click en **"Crear"**

Ahora todas las respuestas se guardarán automáticamente en Google Sheets.

---

## Paso 4: Configurar Notificaciones por Email

1. En la pestaña **"Respuestas"**
2. Click en ⋮ (menú) → **"Recibir notificaciones por correo electrónico para nuevas respuestas"**
3. Recibirás un email cada vez que alguien envíe el formulario

---

## Paso 5: Obtener la URL del Formulario

1. Click en **"Enviar"** (botón morado arriba a la derecha)
2. Click en el ícono de enlace 🔗
3. ✅ Marca "Acortar URL"
4. Copia la URL (ejemplo: `https://forms.gle/XXXXXXX`)

---

## Paso 6: Actualizar competencia_mcp.html

Abre `competencia_mcp.html` y busca esta línea (aproximadamente línea 987):

```javascript
const googleFormUrl = 'https://docs.google.com/forms/d/e/TU_FORM_ID/viewform';
```

Reemplázala con tu URL:

```javascript
const googleFormUrl = 'https://forms.gle/TU_URL_ACORTADA';
```

---

## Paso 7: (OPCIONAL) Pre-llenar Campos Automáticamente

Para que los campos se llenen automáticamente con los datos de la evaluación:

### 7.1 Obtener IDs de los campos

1. Abre tu Google Form
2. Click en **"Vista previa"** (ícono de ojo)
3. Abre las **Herramientas de Desarrollador** (F12)
4. En la pestaña **"Elements"** o **"Elementos"**, busca cada campo
5. Encuentra el atributo `name="entry.XXXXXXXXX"`
6. Anota los números para cada campo:
   - Instancia: `entry.123456789` (ejemplo)
   - Puntuación: `entry.987654321` (ejemplo)
   - Cobertura: `entry.111222333` (ejemplo)

### 7.2 Actualizar el código JavaScript

En `competencia_mcp.html`, descomenta y actualiza estas líneas (aproximadamente línea 992-996):

```javascript
const params = new URLSearchParams({
    'entry.123456789': instancia,  // Reemplaza con tu ID real
    'entry.987654321': score,      // Reemplaza con tu ID real
    'entry.111222333': percentage  // Reemplaza con tu ID real
});
```

Y cambia la línea 1001 a:

```javascript
window.open(fullUrl, '_blank');  // Usa fullUrl en lugar de googleFormUrl
```

---

## Paso 8: Analizar Resultados en Google Sheets

### Crear Ranking

En tu hoja de Google Sheets, agrega una columna "Ranking":

```
=RANK(G2, G:G, 0)
```
(Donde G es la columna de puntuación)

### Filtrar por Instancia

```
=FILTER(A:K, F:F="2023 - 5 ambulancias - 1.0 km")
```

### Top 10

```
=SORT(A:K, G, FALSE)
```

### Estadísticas

```
Promedio: =AVERAGE(G:G)
Máximo: =MAX(G:G)
Mínimo: =MIN(G:G)
```

---

## Paso 9: Email de Confirmación Automático (OPCIONAL)

Para enviar emails de confirmación automáticos:

1. Abre tu Google Sheet de respuestas
2. **Extensiones** → **Apps Script**
3. Pega este código:

```javascript
function onFormSubmit(e) {
  try {
    // Obtener valores del formulario
    var timestamp = e.values[0];
    var nombre = e.values[1];
    var email = e.values[2];
    var matricula = e.values[3];
    var institucion = e.values[4];
    var instancia = e.values[5];
    var puntuacion = e.values[6];
    var cobertura = e.values[7];
    var metodo = e.values[8];
    
    // Crear email de confirmación
    var subject = "✅ Solución Recibida - Competencia MCP";
    var body = "Hola " + nombre + ",\n\n" +
               "Tu solución para la Competencia MCP ha sido recibida exitosamente.\n\n" +
               "📊 Resumen de tu solución:\n" +
               "• Instancia: " + instancia + "\n" +
               "• Puntuación: " + puntuacion + " accidentes cubiertos\n" +
               "• Cobertura: " + cobertura + "%\n" +
               "• Método: " + metodo + "\n\n" +
               "Los resultados finales se publicarán próximamente.\n\n" +
               "¡Gracias por participar!\n\n" +
               "---\n" +
               "Competencia MCP\n" +
               "Maximal Covering Location Problem";
    
    // Enviar email
    MailApp.sendEmail(email, subject, body);
    
    Logger.log("Email enviado a: " + email);
  } catch (error) {
    Logger.log("Error: " + error);
  }
}
```

4. Click en **"Guardar"** (ícono de disco)
5. Click en **"Activadores"** (ícono de reloj) en el menú izquierdo
6. Click en **"+ Agregar activador"**
7. Configuración:
   - Función: `onFormSubmit`
   - Evento: "Al enviar formulario"
   - Tipo de evento: "Desde una hoja de cálculo"
8. Click en **"Guardar"**
9. Autoriza los permisos necesarios

Ahora cada estudiante recibirá un email de confirmación automáticamente.

---

## Paso 10: Crear Leaderboard Público (OPCIONAL)

### Opción A: Publicar Google Sheet

1. En tu Google Sheet, **Archivo** → **Compartir** → **Publicar en la web**
2. Selecciona la hoja y el rango (solo columnas públicas: nombre, instancia, puntuación)
3. Click en **"Publicar"**
4. Copia la URL

### Opción B: Embeber en tu página web

Crea un archivo `leaderboard.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Leaderboard - Competencia MCP</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-8">
        <h1 class="text-4xl font-bold text-center mb-8 text-green-800">
            🏆 Leaderboard - Competencia MCP
        </h1>
        
        <iframe 
            src="TU_URL_DE_GOOGLE_SHEET_PUBLICADA"
            width="100%" 
            height="800" 
            frameborder="0">
        </iframe>
    </div>
</body>
</html>
```

---

## 📊 Resumen de Configuración

✅ Formulario creado con todos los campos
✅ Validaciones configuradas
✅ Subida de archivos habilitada
✅ Respuestas vinculadas a Google Sheets
✅ Notificaciones por email activadas
✅ URL del formulario copiada
✅ `competencia_mcp.html` actualizado con la URL
✅ (Opcional) Pre-llenado automático configurado
✅ (Opcional) Email de confirmación automático
✅ (Opcional) Leaderboard público

---

## 🎯 Prueba Final

1. Abre `competencia_mcp.html`
2. Carga una instancia
3. Sube una solución de prueba
4. Click en **"Registrar Solución Oficial"**
5. Verifica que el formulario se abra
6. Completa y envía el formulario
7. Verifica que la respuesta aparezca en Google Sheets
8. Verifica que recibas el email de notificación

---

## 🆘 Solución de Problemas

**El formulario no acepta archivos:**
- Verifica que hayas habilitado "Subida de archivo" en la configuración del campo
- Asegúrate de que el estudiante esté logueado en Google

**No recibo notificaciones:**
- Revisa la configuración en Respuestas → ⋮ → Notificaciones
- Verifica tu carpeta de spam

**Los campos no se pre-llenan:**
- Verifica que los IDs de `entry.XXXXX` sean correctos
- Usa la consola del navegador para debug

---

¡Listo! Tu sistema de registro con Google Forms está configurado. 🎉
