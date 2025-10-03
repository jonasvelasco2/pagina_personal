# 🏆 Competencia MCP - Maximal Covering Location

## 📋 Descripción

Esta es una competencia de optimización donde los estudiantes deben resolver el problema de Maximal Covering Location (MCP). El objetivo es colocar un número limitado de ambulancias para maximizar la cobertura de accidentes dentro de un radio dado.

## 🚀 Cómo usar la aplicación

### Opción 1: Con Servidor Local (Recomendado)

Para evitar problemas de CORS al cargar archivos CSV, es recomendable usar un servidor local:

#### Usando Python 3:
```bash
cd "/home/jonas/pCloudDrive/Public Folder/Pagina3_gemini/or-in-action"
python3 -m http.server 8000
```

Luego abre tu navegador en: `http://localhost:8000/competencia_mcp.html`

#### Usando Node.js (http-server):
```bash
cd "/home/jonas/pCloudDrive/Public Folder/Pagina3_gemini/or-in-action"
npx http-server -p 8000
```

Luego abre tu navegador en: `http://localhost:8000/competencia_mcp.html`

#### Usando PHP:
```bash
cd "/home/jonas/pCloudDrive/Public Folder/Pagina3_gemini/or-in-action"
php -S localhost:8000
```

Luego abre tu navegador en: `http://localhost:8000/competencia_mcp.html`

### Opción 2: Carga Manual de Archivos

Si abres el archivo directamente (`file://`), usa la opción de **carga manual** en la página:

1. Selecciona los parámetros (año, ambulancias, radio)
2. En lugar de hacer clic en "Cargar Instancia", usa el input de archivo manual
3. Navega a la carpeta `data/` y selecciona el archivo correspondiente (ej: `accidentes_Ags_2019.csv`)

## 📝 Instrucciones para Estudiantes

### Paso 1: Seleccionar Instancia
1. Elige el año de datos (2019-2023)
2. Selecciona el número de ambulancias disponibles (3, 5, 7, o 10)
3. Elige el radio de cobertura (0.5 a 2.5 km)
4. Carga la instancia (automática o manual)
5. Descarga el archivo CSV con los datos

### Paso 2: Resolver el Problema
Trabaja offline con el archivo descargado. Puedes usar:
- **Optimización exacta**: CPLEX, Gurobi, PuLP, OR-Tools
- **Heurísticas**: Greedy, búsqueda local, simulated annealing
- **Metaheurísticas**: Algoritmos genéticos, búsqueda tabú
- **Cualquier método que prefieras**

### Paso 3: Preparar Solución
Crea un archivo CSV con tus ubicaciones propuestas:

**Formato requerido:**
```csv
LATITUD,LONGITUD
21.8853,-102.2916
21.9123,-102.3145
21.8765,-102.2789
```

**Importante:**
- Debe tener exactamente el número de ambulancias especificado
- Columnas: `LATITUD,LONGITUD` (con encabezado)
- Coordenadas válidas (latitud: -90 a 90, longitud: -180 a 180)

### Paso 4: Evaluar
1. Sube tu archivo de solución
2. El sistema validará el formato
3. Verás tu puntuación y cobertura en el mapa
4. Puedes intentar mejorar tu solución

## 🎯 Criterios de Evaluación

- **Puntuación = Número de accidentes cubiertos**
- Un accidente está cubierto si al menos una ambulancia está dentro del radio de cobertura
- Mayor cobertura = mejor puntuación

### Rangos de desempeño:
- 🥇 **Excelente**: ≥ 90% de cobertura
- 🥈 **Muy bien**: 70-89% de cobertura
- 🥉 **Bien**: 50-69% de cobertura
- 💪 **Sigue intentando**: < 50% de cobertura

## 📊 Datos Disponibles

Los archivos de instancias están en la carpeta `data/`:
- `accidentes_Ags_2019.csv`
- `accidentes_Ags_2020.csv`
- `accidentes_Ags_2021.csv`
- `accidentes_Ags_2022.csv`
- `accidentes_Ags_2023.csv`

Cada archivo contiene:
- `LATITUD`: Coordenada de latitud del accidente
- `LONGITUD`: Coordenada de longitud del accidente
- `MES`: Mes del accidente
- `DIASEMANA`: Día de la semana
- `HORA`: Hora del accidente

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Mapas**: Leaflet.js
- **Parsing CSV**: PapaParse
- **Estilos**: Tailwind CSS

## 📧 Contacto

Si tienes preguntas sobre la competencia, contacta al instructor.

## 📄 Licencia

© 2025 Jonás Velasco. Todos los derechos reservados.
