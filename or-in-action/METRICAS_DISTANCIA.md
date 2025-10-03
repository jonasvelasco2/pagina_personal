# 📐 Métricas de Distancia en la Competencia MCP

## Introducción

En la Competencia MCP, puedes elegir entre tres métricas diferentes para calcular las distancias entre ambulancias y accidentes. Cada métrica tiene sus ventajas y desventajas.

---

## 🌍 1. Haversine (Recomendada)

### Descripción
Calcula la distancia del **gran círculo** sobre la superficie de la Tierra. Es la distancia más corta entre dos puntos siguiendo la curvatura terrestre.

### Fórmula
```
a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1-a))
d = R × c
```

Donde:
- φ = latitud (en radianes)
- λ = longitud (en radianes)
- R = radio de la Tierra = 6,371 km
- d = distancia

### Ventajas
✅ **Más realista** para problemas del mundo real
✅ **Precisa** para distancias cortas y largas
✅ Considera la **curvatura de la Tierra**
✅ Estándar en aplicaciones geográficas

### Desventajas
⚠️ Ligeramente más lenta de calcular (usa funciones trigonométricas)
⚠️ Asume que la Tierra es una esfera perfecta

### Cuándo usarla
- ✅ Problemas realistas de ubicación
- ✅ Cuando necesitas precisión
- ✅ Distancias > 1 km
- ✅ Para comparar con soluciones del mundo real

### Ejemplo
```python
# Aguascalientes centro a Fraccionamiento Pilar Blanco
lat1, lon1 = 21.8853, -102.2916
lat2, lon2 = 21.9123, -102.3145

# Haversine: ~3.2 km
```

---

## 📏 2. Euclidiana

### Descripción
Calcula la distancia en **línea recta** en un plano 2D, convirtiendo las coordenadas geográficas a metros.

### Fórmula
```
dx = (lat₂ - lat₁) × 111,320 metros
dy = (lon₂ - lon₁) × 111,320 × cos(lat_promedio) metros
d = √(dx² + dy²)
```

### Ventajas
✅ **Más rápida** de calcular (no usa funciones trigonométricas complejas)
✅ Buena **aproximación** para distancias cortas (< 10 km)
✅ Intuitiva y fácil de entender
✅ Útil para análisis teóricos

### Desventajas
⚠️ **Menos precisa** que Haversine
⚠️ Error aumenta con la distancia
⚠️ No considera la curvatura terrestre
⚠️ Distorsión en latitudes altas

### Cuándo usarla
- ✅ Análisis rápidos o prototipos
- ✅ Distancias cortas (< 5 km)
- ✅ Cuando la velocidad es crítica
- ✅ Estudios teóricos o académicos

### Ejemplo
```python
# Misma distancia que arriba
# Euclidiana: ~3.15 km (error ~1.5%)
```

---

## 🏙️ 3. Manhattan

### Descripción
Calcula la distancia como la **suma de las diferencias** en latitud y longitud (como caminar en una ciudad con calles en cuadrícula).

### Fórmula
```
dx = |lat₂ - lat₁| × 111,320 metros
dy = |lon₂ - lon₁| × 111,320 × cos(lat_promedio) metros
d = dx + dy
```

### Ventajas
✅ **Muy rápida** de calcular
✅ Útil para ciudades con **calles en cuadrícula**
✅ Modela mejor el movimiento real en algunas ciudades
✅ Siempre mayor o igual que Euclidiana

### Desventajas
⚠️ **Sobrestima** la distancia real
⚠️ No es realista para movimiento directo
⚠️ Puede dar soluciones subóptimas

### Cuándo usarla
- ✅ Ciudades con calles en cuadrícula (ej: Nueva York)
- ✅ Cuando los vehículos no pueden moverse en línea recta
- ✅ Análisis conservadores (peor caso)
- ✅ Problemas donde se penaliza el movimiento diagonal

### Ejemplo
```python
# Misma distancia que arriba
# Manhattan: ~4.5 km (sobrestima ~40%)
```

---

## 📊 Comparación de Métricas

### Tabla Comparativa

| Métrica | Velocidad | Precisión | Realismo | Uso Típico |
|---------|-----------|-----------|----------|------------|
| **Haversine** | Media | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Problemas reales |
| **Euclidiana** | Rápida | ⭐⭐⭐⭐ | ⭐⭐⭐ | Prototipos, análisis |
| **Manhattan** | Muy rápida | ⭐⭐⭐ | ⭐⭐ | Ciudades cuadrícula |

### Ejemplo Numérico

Para dos puntos en Aguascalientes separados por ~3 km:

| Métrica | Distancia | Error vs Haversine |
|---------|-----------|-------------------|
| Haversine | 3.200 km | 0% (referencia) |
| Euclidiana | 3.150 km | -1.5% |
| Manhattan | 4.500 km | +40.6% |

---

## 🎯 Impacto en la Competencia

### Cobertura
Diferentes métricas pueden dar **diferentes coberturas** para la misma solución:

```
Radio de cobertura: 1.0 km
Ubicación ambulancia: (21.8853, -102.2916)
Ubicación accidente: (21.8900, -102.2950)

Haversine:  0.55 km → ✅ CUBIERTO
Euclidiana: 0.54 km → ✅ CUBIERTO  
Manhattan:  0.77 km → ✅ CUBIERTO
```

Pero con otro accidente más lejano:
```
Ubicación accidente: (21.8950, -102.3050)

Haversine:  1.05 km → ❌ NO CUBIERTO
Euclidiana: 1.03 km → ❌ NO CUBIERTO
Manhattan:  1.47 km → ❌ NO CUBIERTO
```

### Estrategia
- **Haversine**: Soluciones más realistas, mejor para comparar con el mundo real
- **Euclidiana**: Puede dar coberturas ligeramente diferentes, útil para optimización rápida
- **Manhattan**: Cobertura más conservadora, útil para garantías de servicio

---

## 💡 Recomendaciones

### Para la Competencia
1. **Usa Haversine** si quieres la solución más realista
2. **Usa Euclidiana** si necesitas iterar rápidamente
3. **Usa Manhattan** si quieres modelar restricciones de calles

### Para Desarrollo
1. **Prototipo rápido**: Euclidiana
2. **Validación**: Haversine
3. **Análisis de sensibilidad**: Prueba las tres métricas

### Para Comparación
Si quieres comparar tu solución con otros estudiantes, asegúrate de usar la **misma métrica**.

---

## 🔬 Experimento Sugerido

Prueba resolver la misma instancia con las tres métricas:

```bash
# Haversine
python ejemplo_solucion.py -i data/accidentes_Ags_2023.csv -o sol_haversine.csv -m haversine

# Euclidiana
python ejemplo_solucion.py -i data/accidentes_Ags_2023.csv -o sol_euclidean.csv -m euclidean

# Manhattan
python ejemplo_solucion.py -i data/accidentes_Ags_2023.csv -o sol_manhattan.csv -m manhattan
```

Compara:
- ¿Qué métrica da mejor cobertura?
- ¿Las ubicaciones de ambulancias son diferentes?
- ¿Cuál es más rápida de calcular?

---

## 📚 Referencias

### Haversine
- [Fórmula de Haversine - Wikipedia](https://en.wikipedia.org/wiki/Haversine_formula)
- Usado en: GPS, navegación marítima, aviación

### Euclidiana
- [Distancia Euclidiana - Wikipedia](https://en.wikipedia.org/wiki/Euclidean_distance)
- Usado en: Machine learning, clustering, análisis de datos

### Manhattan
- [Distancia Manhattan - Wikipedia](https://en.wikipedia.org/wiki/Taxicab_geometry)
- Usado en: Planificación urbana, routing en ciudades

---

## ❓ Preguntas Frecuentes

**P: ¿Cuál métrica debo usar para obtener la mejor puntuación?**
R: Depende de la instancia. Generalmente, Haversine es la más realista, pero prueba las tres y compara.

**P: ¿Puedo cambiar de métrica después de generar mi solución?**
R: Sí, pero la cobertura puede cambiar. Es mejor decidir la métrica antes de optimizar.

**P: ¿La métrica afecta mi puntuación?**
R: Sí, diferentes métricas pueden dar diferentes coberturas para la misma solución.

**P: ¿Qué métrica es más rápida?**
R: Manhattan > Euclidiana > Haversine (pero la diferencia es mínima para instancias pequeñas)

**P: ¿Puedo implementar mi propia métrica?**
R: Para la competencia oficial, debes usar una de las tres métricas proporcionadas.

---

## 🎓 Para Profundizar

### Implementación en Python
```python
import numpy as np

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Radio de la Tierra en metros
    φ1, φ2 = np.radians(lat1), np.radians(lat2)
    Δφ = np.radians(lat2 - lat1)
    Δλ = np.radians(lon2 - lon1)
    
    a = np.sin(Δφ/2)**2 + np.cos(φ1) * np.cos(φ2) * np.sin(Δλ/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    
    return R * c

def euclidean(lat1, lon1, lat2, lon2):
    meters_per_degree_lat = 111320
    lat_avg = np.radians((lat1 + lat2) / 2)
    meters_per_degree_lon = 111320 * np.cos(lat_avg)
    
    dx = (lat2 - lat1) * meters_per_degree_lat
    dy = (lon2 - lon1) * meters_per_degree_lon
    
    return np.sqrt(dx**2 + dy**2)

def manhattan(lat1, lon1, lat2, lon2):
    meters_per_degree_lat = 111320
    lat_avg = np.radians((lat1 + lat2) / 2)
    meters_per_degree_lon = 111320 * np.cos(lat_avg)
    
    dx = abs(lat2 - lat1) * meters_per_degree_lat
    dy = abs(lon2 - lon1) * meters_per_degree_lon
    
    return dx + dy
```

---

¡Buena suerte en la competencia! 🏆
