# 🚀 Guía de Despliegue en Netlify

## Pasos para Desplegar la Competencia MCP en Netlify

### 1. Preparar el Repositorio

Si aún no tienes un repositorio Git:

```bash
cd "/home/jonas/pCloudDrive/Public Folder/Pagina3_gemini/or-in-action"
git init
git add .
git commit -m "Initial commit - Competencia MCP"
```

Luego sube a GitHub/GitLab:
```bash
git remote add origin <tu-repositorio-url>
git push -u origin main
```

### 2. Conectar con Netlify

1. Ve a [netlify.com](https://netlify.com) e inicia sesión
2. Click en **"Add new site"** → **"Import an existing project"**
3. Conecta tu repositorio de GitHub/GitLab
4. Selecciona el repositorio de la competencia

### 3. Configuración de Build

En la configuración de Netlify:

- **Build command:** (dejar vacío - no necesita build)
- **Publish directory:** `.` (punto, significa raíz)
- **Branch to deploy:** `main`

### 4. Habilitar Netlify Forms

**IMPORTANTE:** Para que funcione el formulario de registro:

1. En el dashboard de Netlify, ve a **Site settings** → **Forms**
2. Asegúrate de que **Form detection** esté habilitado
3. Los formularios se detectarán automáticamente por el atributo `data-netlify="true"`

### 5. Configurar Notificaciones de Formularios

1. Ve a **Site settings** → **Forms** → **Form notifications**
2. Configura notificaciones por email para recibir las soluciones
3. Puedes agregar tu email institucional

### 6. Variables de Entorno (Opcional)

Si necesitas configurar variables:

1. Ve a **Site settings** → **Environment variables**
2. Agrega las variables necesarias

### 7. Dominio Personalizado (Opcional)

1. Ve a **Domain settings**
2. Puedes usar el dominio gratuito de Netlify: `tu-sitio.netlify.app`
3. O configurar un dominio personalizado

## 📋 Archivos Importantes

- `competencia_mcp.html` - Página principal de la competencia
- `competencia_registro.html` - Formulario de registro con Netlify Forms
- `netlify.toml` - Configuración de Netlify
- `data/` - Carpeta con archivos CSV de instancias

## 🔍 Verificar el Despliegue

Después del despliegue, verifica:

1. ✅ La página principal carga correctamente
2. ✅ Los archivos CSV se pueden descargar
3. ✅ El formulario de registro funciona
4. ✅ Recibes notificaciones de envíos

## 📊 Ver Soluciones Enviadas

Las soluciones enviadas se pueden ver en:

1. Dashboard de Netlify → **Forms**
2. Verás una lista de todos los envíos
3. Puedes exportar a CSV o integrar con Zapier/Google Sheets

### Exportar a Google Sheets (Recomendado)

1. En Netlify Forms, click en **"Notifications"**
2. Agrega una notificación de tipo **"Outgoing webhook"**
3. Usa Zapier o Make.com para conectar con Google Sheets
4. Configura para que cada envío cree una fila en tu hoja de cálculo

## 🔐 Seguridad

El archivo `netlify.toml` incluye:
- Headers de seguridad (XSS, frame options, etc.)
- Protección contra spam con honeypot
- CORS configurado para archivos de datos

## 🎯 URLs Finales

Después del despliegue, tus URLs serán:

- Competencia: `https://tu-sitio.netlify.app/competencia_mcp.html`
- Registro: `https://tu-sitio.netlify.app/competencia_registro.html`
- Atajos: 
  - `https://tu-sitio.netlify.app/competencia`
  - `https://tu-sitio.netlify.app/registro`

## 📧 Notificaciones por Email

Para recibir emails cuando alguien envíe una solución:

1. Ve a **Forms** → **Form notifications**
2. Click en **"Add notification"**
3. Selecciona **"Email notification"**
4. Ingresa tu email
5. Personaliza el mensaje si lo deseas

Recibirás un email con:
- Nombre del estudiante
- Email
- Instancia seleccionada
- Puntuación y cobertura
- Método utilizado
- Links a los archivos subidos

## 🔄 Actualizaciones

Para actualizar el sitio:

```bash
git add .
git commit -m "Actualización de la competencia"
git push
```

Netlify detectará el cambio y desplegará automáticamente.

## 🆘 Solución de Problemas

### El formulario no funciona
- Verifica que el atributo `data-netlify="true"` esté presente
- Asegúrate de que el campo `name="form-name"` coincida con el nombre del form
- Revisa los logs en Netlify Dashboard

### Los archivos CSV no se descargan
- Verifica que la carpeta `data/` esté en el repositorio
- Revisa los headers CORS en `netlify.toml`

### No recibo notificaciones
- Verifica la configuración en **Forms** → **Form notifications**
- Revisa tu carpeta de spam
- Asegúrate de que el email esté verificado

## 📚 Recursos Adicionales

- [Documentación de Netlify Forms](https://docs.netlify.com/forms/setup/)
- [Netlify Headers](https://docs.netlify.com/routing/headers/)
- [Netlify Redirects](https://docs.netlify.com/routing/redirects/)

## 🎓 Para los Estudiantes

Comparte estas URLs con tus estudiantes:

1. **Página principal:** `https://tu-sitio.netlify.app/competencia`
2. **Instrucciones:** Incluidas en la página principal
3. **Soporte:** Tu email de contacto

---

**Nota:** Netlify Forms tiene un límite gratuito de 100 envíos por mes. Si esperas más participantes, considera actualizar a un plan de pago o usar una alternativa como Google Forms + Apps Script.
