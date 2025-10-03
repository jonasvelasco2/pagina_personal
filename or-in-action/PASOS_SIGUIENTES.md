# 🚀 Pasos Siguientes para Desplegar la Competencia

## ✅ Lo que ya está listo

- ✅ `competencia_mcp.html` - Página principal de la competencia
- ✅ `ejemplo_solucion.py` - Script de ejemplo para estudiantes
- ✅ `ejemplo_solucion.csv` - Ejemplo de formato de solución
- ✅ `iniciar_servidor.sh` - Script para servidor local
- ✅ `data/` - Carpeta con archivos CSV de instancias
- ✅ Integración con Google Forms configurada en el código

## 📝 Pasos para Completar el Setup

### 1. Crear el Google Form (15 minutos)

Sigue la guía completa en: **`GUIA_GOOGLE_FORMS.md`**

**Resumen rápido:**
1. Ve a [forms.google.com](https://forms.google.com)
2. Crea un nuevo formulario
3. Agrega los campos según la guía
4. Habilita subida de archivos
5. Vincula con Google Sheets
6. Copia la URL del formulario

### 2. Actualizar competencia_mcp.html (2 minutos)

Abre `competencia_mcp.html` y busca la línea **987**:

```javascript
const googleFormUrl = 'https://docs.google.com/forms/d/e/TU_FORM_ID/viewform';
```

Reemplázala con tu URL de Google Forms:

```javascript
const googleFormUrl = 'https://forms.gle/TU_URL_REAL';
```

Guarda el archivo.

### 3. Configurar Google Sheets (10 minutos)

Sigue la guía: **`TEMPLATE_GOOGLE_SHEETS.md`**

**Resumen rápido:**
1. Abre la hoja de respuestas vinculada
2. Crea hoja "Ranking General"
3. Agrega fórmulas de ranking
4. Crea gráficos básicos
5. (Opcional) Configura email de confirmación automático

### 4. Desplegar en Netlify (10 minutos)

#### 4.1 Preparar repositorio Git

```bash
cd "/home/jonas/pCloudDrive/Public Folder/Pagina3_gemini/or-in-action"
git init
git add .
git commit -m "Competencia MCP - Initial commit"
```

#### 4.2 Subir a GitHub

1. Crea un nuevo repositorio en GitHub
2. Sigue las instrucciones para push:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

#### 4.3 Conectar con Netlify

1. Ve a [netlify.com](https://netlify.com)
2. **Add new site** → **Import an existing project**
3. Conecta tu repositorio de GitHub
4. Configuración:
   - Build command: (vacío)
   - Publish directory: `.`
5. **Deploy site**

#### 4.4 Obtener URL

Tu sitio estará en: `https://tu-sitio.netlify.app/competencia_mcp.html`

Puedes configurar un dominio personalizado si lo deseas.

### 5. Probar Todo el Flujo (5 minutos)

1. Abre tu sitio en Netlify
2. Selecciona una instancia
3. Descarga los datos
4. Sube una solución de prueba
5. Click en "Registrar Solución Oficial"
6. Verifica que el Google Form se abra
7. Completa y envía el formulario
8. Verifica que aparezca en Google Sheets
9. Verifica que recibas el email de notificación

---

## 🎓 Compartir con Estudiantes

### Información a Compartir

**URL de la Competencia:**
```
https://tu-sitio.netlify.app/competencia_mcp.html
```

**Instrucciones Básicas:**
```
1. Selecciona una instancia (año, ambulancias, radio)
2. Descarga el archivo CSV con los datos
3. Resuelve el problema con tu método preferido
4. Prepara tu solución en formato CSV (LATITUD,LONGITUD)
5. Sube tu solución para evaluarla
6. Registra tu solución oficial en el formulario
```

**Recursos Adicionales:**
- Script de ejemplo: `ejemplo_solucion.py`
- Formato de solución: `ejemplo_solucion.csv`

### Email Template para Estudiantes

```
Asunto: 🏆 Competencia MCP - Maximal Covering Location

Hola estudiantes,

Les invito a participar en la Competencia de Maximal Covering Location (MCP).

🎯 Objetivo:
Maximizar la cobertura de accidentes colocando un número limitado de ambulancias.

🔗 Link de la competencia:
https://tu-sitio.netlify.app/competencia_mcp.html

📋 Instrucciones:
1. Selecciona una instancia del problema
2. Descarga los datos de accidentes
3. Resuelve el problema con tu método preferido
4. Evalúa tu solución en la plataforma
5. Registra tu solución oficial

🏅 Premios:
- 1er lugar: [TU PREMIO]
- 2do lugar: [TU PREMIO]
- 3er lugar: [TU PREMIO]

📅 Fecha límite: [TU FECHA]

📊 El ranking se actualizará en tiempo real en:
[URL de tu Google Sheet público]

¡Buena suerte!

[TU NOMBRE]
```

---

## 📊 Monitorear la Competencia

### Durante la Competencia

1. **Revisa Google Sheets regularmente** para ver nuevos envíos
2. **Verifica soluciones** para detectar errores o problemas
3. **Responde preguntas** de estudiantes rápidamente
4. **Actualiza el ranking** si es necesario

### Después de la Competencia

1. **Exporta resultados** desde Google Sheets
2. **Genera ranking final** con las fórmulas
3. **Crea certificados** para los ganadores (opcional)
4. **Publica resultados** en tu sitio web
5. **Analiza métodos** más efectivos para futuras clases

---

## 🔧 Mantenimiento

### Actualizar Instancias

Para agregar nuevos años de datos:

1. Agrega el CSV a la carpeta `data/`
2. Actualiza el selector en `competencia_mcp.html` (línea ~318)
3. Actualiza las opciones en Google Forms
4. Commit y push a GitHub
5. Netlify desplegará automáticamente

### Modificar Parámetros

Para cambiar ambulancias o radios disponibles:

1. Edita los selectores en `competencia_mcp.html`
2. Actualiza las opciones en Google Forms
3. Commit y push

---

## 🆘 Solución de Problemas Comunes

### "No se puede cargar la instancia"

**Solución:** Los estudiantes deben usar la opción de carga manual si abren el HTML localmente. O mejor, comparte la URL de Netlify.

### "El formulario no se abre"

**Solución:** Verifica que hayas actualizado la URL del Google Form en `competencia_mcp.html` línea 987.

### "No aparecen las respuestas en Google Sheets"

**Solución:** Verifica que el formulario esté vinculado correctamente a la hoja de cálculo.

### "Los archivos no se suben al formulario"

**Solución:** Los estudiantes deben estar logueados en Google. Verifica que la configuración de subida de archivos esté habilitada.

---

## 📚 Recursos Adicionales

- **GUIA_GOOGLE_FORMS.md** - Guía detallada de configuración del formulario
- **TEMPLATE_GOOGLE_SHEETS.md** - Fórmulas y análisis para Google Sheets
- **ejemplo_solucion.py** - Script de ejemplo para estudiantes

---

## ✨ Mejoras Futuras (Opcional)

- [ ] Agregar autenticación con Netlify Identity
- [ ] Crear API para ranking en tiempo real
- [ ] Implementar visualización interactiva del ranking
- [ ] Agregar sistema de badges/logros
- [ ] Crear dashboard de estadísticas en tiempo real
- [ ] Implementar sistema de equipos
- [ ] Agregar chat o foro de discusión

---

## 🎯 Checklist Final

- [ ] Google Form creado y configurado
- [ ] URL del formulario actualizada en competencia_mcp.html
- [ ] Google Sheets configurado con fórmulas
- [ ] Email de confirmación automático configurado (opcional)
- [ ] Repositorio Git creado y subido a GitHub
- [ ] Sitio desplegado en Netlify
- [ ] Prueba completa del flujo realizada
- [ ] URL compartida con estudiantes
- [ ] Fecha límite establecida
- [ ] Sistema de premios definido

---

¡Todo listo para lanzar tu competencia! 🚀

Si tienes alguna pregunta o problema, revisa las guías detalladas o contacta para soporte.
