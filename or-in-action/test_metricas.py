#!/usr/bin/env python3
"""
Script de prueba para verificar que las métricas de distancia funcionan correctamente.
Compara las tres métricas con puntos de ejemplo en Aguascalientes.
"""

import numpy as np

# Funciones de distancia (copiadas de ejemplo_solucion.py)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia Haversine en metros."""
    R = 6371000  # Radio de la Tierra en metros
    
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lat = np.radians(lat2 - lat1)
    delta_lon = np.radians(lon2 - lon1)
    
    a = np.sin(delta_lat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    
    return R * c


def euclidean_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia Euclidiana en metros."""
    meters_per_degree_lat = 111320
    lat_avg = np.radians((lat1 + lat2) / 2)
    meters_per_degree_lon = 111320 * np.cos(lat_avg)
    
    dx = (lat2 - lat1) * meters_per_degree_lat
    dy = (lon2 - lon1) * meters_per_degree_lon
    
    return np.sqrt(dx**2 + dy**2)


def manhattan_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia Manhattan en metros."""
    meters_per_degree_lat = 111320
    lat_avg = np.radians((lat1 + lat2) / 2)
    meters_per_degree_lon = 111320 * np.cos(lat_avg)
    
    dx = abs(lat2 - lat1) * meters_per_degree_lat
    dy = abs(lon2 - lon1) * meters_per_degree_lon
    
    return dx + dy


def test_metrics():
    """Prueba las tres métricas con puntos de ejemplo."""
    
    print("=" * 70)
    print("🧪 TEST DE MÉTRICAS DE DISTANCIA")
    print("=" * 70)
    print()
    
    # Puntos de prueba en Aguascalientes
    test_cases = [
        {
            "name": "Centro a Fraccionamiento Norte",
            "p1": (21.8853, -102.2916),  # Centro de Aguascalientes
            "p2": (21.9123, -102.3145),  # Fraccionamiento al norte
            "expected_km": 3.2
        },
        {
            "name": "Distancia corta (500m aprox)",
            "p1": (21.8853, -102.2916),
            "p2": (21.8900, -102.2950),
            "expected_km": 0.55
        },
        {
            "name": "Distancia media (2km aprox)",
            "p1": (21.8853, -102.2916),
            "p2": (21.9000, -102.3100),
            "expected_km": 2.1
        },
        {
            "name": "Mismo punto (0 km)",
            "p1": (21.8853, -102.2916),
            "p2": (21.8853, -102.2916),
            "expected_km": 0.0
        },
        {
            "name": "Solo latitud diferente",
            "p1": (21.8853, -102.2916),
            "p2": (21.8953, -102.2916),
            "expected_km": 1.11
        },
        {
            "name": "Solo longitud diferente",
            "p1": (21.8853, -102.2916),
            "p2": (21.8853, -102.3016),
            "expected_km": 0.95
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"Test {i}: {test['name']}")
        print(f"  Punto 1: {test['p1']}")
        print(f"  Punto 2: {test['p2']}")
        print(f"  Distancia esperada: ~{test['expected_km']} km")
        print()
        
        lat1, lon1 = test['p1']
        lat2, lon2 = test['p2']
        
        # Calcular con las tres métricas
        d_haversine = haversine_distance(lat1, lon1, lat2, lon2)
        d_euclidean = euclidean_distance(lat1, lon1, lat2, lon2)
        d_manhattan = manhattan_distance(lat1, lon1, lat2, lon2)
        
        # Mostrar resultados
        print(f"  📏 Haversine:  {d_haversine:8.2f} m ({d_haversine/1000:.3f} km)")
        print(f"  📐 Euclidiana: {d_euclidean:8.2f} m ({d_euclidean/1000:.3f} km)")
        print(f"  🏙️  Manhattan:  {d_manhattan:8.2f} m ({d_manhattan/1000:.3f} km)")
        
        # Calcular diferencias
        if d_haversine > 0:
            diff_euclidean = ((d_euclidean - d_haversine) / d_haversine) * 100
            diff_manhattan = ((d_manhattan - d_haversine) / d_haversine) * 100
            
            print()
            print(f"  Diferencias vs Haversine:")
            print(f"    Euclidiana: {diff_euclidean:+.2f}%")
            print(f"    Manhattan:  {diff_manhattan:+.2f}%")
        
        print()
        print("-" * 70)
        print()
    
    # Verificaciones
    print("=" * 70)
    print("✅ VERIFICACIONES")
    print("=" * 70)
    print()
    
    # Test 1: Mismo punto debe dar 0
    lat, lon = 21.8853, -102.2916
    d_h = haversine_distance(lat, lon, lat, lon)
    d_e = euclidean_distance(lat, lon, lat, lon)
    d_m = manhattan_distance(lat, lon, lat, lon)
    
    print("1. Mismo punto debe dar distancia 0:")
    print(f"   Haversine:  {d_h:.6f} m {'✅' if d_h < 0.001 else '❌'}")
    print(f"   Euclidiana: {d_e:.6f} m {'✅' if d_e < 0.001 else '❌'}")
    print(f"   Manhattan:  {d_m:.6f} m {'✅' if d_m < 0.001 else '❌'}")
    print()
    
    # Test 2: Manhattan >= Euclidiana >= Haversine (generalmente)
    lat1, lon1 = 21.8853, -102.2916
    lat2, lon2 = 21.9123, -102.3145
    
    d_h = haversine_distance(lat1, lon1, lat2, lon2)
    d_e = euclidean_distance(lat1, lon1, lat2, lon2)
    d_m = manhattan_distance(lat1, lon1, lat2, lon2)
    
    print("2. Relación entre métricas (Manhattan ≥ Euclidiana ≥ Haversine):")
    print(f"   Manhattan ({d_m:.0f}) ≥ Euclidiana ({d_e:.0f}): {'✅' if d_m >= d_e else '❌'}")
    print(f"   Euclidiana ({d_e:.0f}) ≥ Haversine ({d_h:.0f}): {'✅' if d_e >= d_h else '⚠️'}")
    print()
    
    # Test 3: Simetría (d(A,B) = d(B,A))
    d_ab_h = haversine_distance(lat1, lon1, lat2, lon2)
    d_ba_h = haversine_distance(lat2, lon2, lat1, lon1)
    
    d_ab_e = euclidean_distance(lat1, lon1, lat2, lon2)
    d_ba_e = euclidean_distance(lat2, lon2, lat1, lon1)
    
    d_ab_m = manhattan_distance(lat1, lon1, lat2, lon2)
    d_ba_m = manhattan_distance(lat2, lon2, lat1, lon1)
    
    print("3. Simetría (d(A,B) = d(B,A)):")
    print(f"   Haversine:  {abs(d_ab_h - d_ba_h):.6f} {'✅' if abs(d_ab_h - d_ba_h) < 0.001 else '❌'}")
    print(f"   Euclidiana: {abs(d_ab_e - d_ba_e):.6f} {'✅' if abs(d_ab_e - d_ba_e) < 0.001 else '❌'}")
    print(f"   Manhattan:  {abs(d_ab_m - d_ba_m):.6f} {'✅' if abs(d_ab_m - d_ba_m) < 0.001 else '❌'}")
    print()
    
    # Test 4: Precisión de Euclidiana vs Haversine para distancias cortas
    print("4. Precisión de Euclidiana vs Haversine para distancias cortas:")
    
    short_distances = [
        (21.8853, -102.2916, 21.8863, -102.2926),  # ~150m
        (21.8853, -102.2916, 21.8900, -102.2950),  # ~550m
        (21.8853, -102.2916, 21.8953, -102.3016),  # ~1.5km
    ]
    
    for lat1, lon1, lat2, lon2 in short_distances:
        d_h = haversine_distance(lat1, lon1, lat2, lon2)
        d_e = euclidean_distance(lat1, lon1, lat2, lon2)
        error = abs(d_e - d_h) / d_h * 100
        
        print(f"   Distancia ~{d_h/1000:.2f} km: Error = {error:.2f}% {'✅' if error < 2 else '⚠️'}")
    
    print()
    print("=" * 70)
    print("✅ TESTS COMPLETADOS")
    print("=" * 70)
    print()
    
    # Resumen
    print("📊 RESUMEN:")
    print()
    print("• Haversine es la métrica más precisa para distancias reales")
    print("• Euclidiana es una buena aproximación para distancias < 5 km")
    print("• Manhattan sobrestima las distancias (útil para análisis conservador)")
    print()
    print("Recomendación: Usa Haversine para la competencia a menos que tengas")
    print("una razón específica para usar otra métrica.")
    print()


if __name__ == "__main__":
    test_metrics()
