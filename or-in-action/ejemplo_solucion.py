#!/usr/bin/env python3
"""
Ejemplo de solución para la Competencia MCP
Este script muestra cómo generar una solución válida para el problema.

NOTA: Esta es una solución SIMPLE usando un algoritmo greedy.
Los estudiantes deben implementar métodos más sofisticados para obtener mejores resultados.
"""

import pandas as pd
import numpy as np
from typing import List, Tuple
import argparse


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula la distancia en metros entre dos puntos usando la fórmula de Haversine.
    
    Args:
        lat1, lon1: Coordenadas del primer punto
        lat2, lon2: Coordenadas del segundo punto
    
    Returns:
        Distancia en metros
    """
    R = 6371000  # Radio de la Tierra en metros
    
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lat = np.radians(lat2 - lat1)
    delta_lon = np.radians(lon2 - lon1)
    
    a = np.sin(delta_lat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    
    return R * c


def greedy_maximal_covering(accidents: pd.DataFrame, 
                           num_ambulances: int, 
                           coverage_radius: float) -> List[Tuple[float, float]]:
    """
    Algoritmo greedy simple para el problema MCP.
    
    En cada iteración, coloca una ambulancia en la ubicación que cubre
    la mayor cantidad de accidentes no cubiertos.
    
    Args:
        accidents: DataFrame con columnas LATITUD y LONGITUD
        num_ambulances: Número de ambulancias a colocar
        coverage_radius: Radio de cobertura en metros
    
    Returns:
        Lista de tuplas (latitud, longitud) para cada ambulancia
    """
    ambulance_locations = []
    covered_accidents = set()
    
    # Convertir a numpy array para cálculos más rápidos
    accident_coords = accidents[['LATITUD', 'LONGITUD']].values
    
    for _ in range(num_ambulances):
        best_location = None
        best_coverage = 0
        
        # Probar cada accidente como posible ubicación
        for i, (lat, lon) in enumerate(accident_coords):
            if i in covered_accidents:
                continue
            
            # Contar cuántos accidentes no cubiertos estaría cubriendo
            new_coverage = 0
            for j, (acc_lat, acc_lon) in enumerate(accident_coords):
                if j not in covered_accidents:
                    dist = haversine_distance(lat, lon, acc_lat, acc_lon)
                    if dist <= coverage_radius:
                        new_coverage += 1
            
            if new_coverage > best_coverage:
                best_coverage = new_coverage
                best_location = (lat, lon)
        
        if best_location is None:
            # Si no hay más accidentes por cubrir, usar una ubicación aleatoria
            idx = np.random.choice(len(accident_coords))
            best_location = tuple(accident_coords[idx])
        
        ambulance_locations.append(best_location)
        
        # Actualizar accidentes cubiertos
        for j, (acc_lat, acc_lon) in enumerate(accident_coords):
            dist = haversine_distance(best_location[0], best_location[1], acc_lat, acc_lon)
            if dist <= coverage_radius:
                covered_accidents.add(j)
    
    return ambulance_locations


def calculate_coverage(accidents: pd.DataFrame, 
                      ambulances: List[Tuple[float, float]], 
                      coverage_radius: float) -> Tuple[int, float]:
    """
    Calcula la cobertura de una solución.
    
    Args:
        accidents: DataFrame con accidentes
        ambulances: Lista de ubicaciones de ambulancias
        coverage_radius: Radio de cobertura en metros
    
    Returns:
        Tupla (número de accidentes cubiertos, porcentaje de cobertura)
    """
    covered = set()
    accident_coords = accidents[['LATITUD', 'LONGITUD']].values
    
    for amb_lat, amb_lon in ambulances:
        for i, (acc_lat, acc_lon) in enumerate(accident_coords):
            dist = haversine_distance(amb_lat, amb_lon, acc_lat, acc_lon)
            if dist <= coverage_radius:
                covered.add(i)
    
    coverage_count = len(covered)
    coverage_percent = (coverage_count / len(accidents)) * 100
    
    return coverage_count, coverage_percent


def save_solution(ambulances: List[Tuple[float, float]], output_file: str):
    """
    Guarda la solución en formato CSV.
    
    Args:
        ambulances: Lista de ubicaciones de ambulancias
        output_file: Nombre del archivo de salida
    """
    df = pd.DataFrame(ambulances, columns=['LATITUD', 'LONGITUD'])
    df.to_csv(output_file, index=False)
    print(f"✅ Solución guardada en: {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Genera una solución para el problema MCP')
    parser.add_argument('--input', '-i', required=True, help='Archivo CSV de entrada con accidentes')
    parser.add_argument('--output', '-o', required=True, help='Archivo CSV de salida con la solución')
    parser.add_argument('--ambulances', '-a', type=int, default=5, help='Número de ambulancias (default: 5)')
    parser.add_argument('--radius', '-r', type=float, default=1.0, help='Radio de cobertura en km (default: 1.0)')
    
    args = parser.parse_args()
    
    # Cargar datos
    print(f"📂 Cargando datos desde: {args.input}")
    accidents = pd.read_csv(args.input)
    print(f"   Total de accidentes: {len(accidents)}")
    
    # Convertir radio a metros
    coverage_radius = args.radius * 1000
    
    # Generar solución
    print(f"\n🔍 Generando solución con {args.ambulances} ambulancias y radio de {args.radius} km...")
    ambulances = greedy_maximal_covering(accidents, args.ambulances, coverage_radius)
    
    # Calcular cobertura
    coverage_count, coverage_percent = calculate_coverage(accidents, ambulances, coverage_radius)
    
    print(f"\n📊 Resultados:")
    print(f"   Accidentes cubiertos: {coverage_count} de {len(accidents)}")
    print(f"   Porcentaje de cobertura: {coverage_percent:.2f}%")
    print(f"   Puntuación: {coverage_count}")
    
    # Guardar solución
    print(f"\n💾 Guardando solución...")
    save_solution(ambulances, args.output)
    
    print("\n✨ ¡Listo! Ahora puedes subir el archivo a la plataforma de competencia.")
    print(f"   Archivo: {args.output}")


if __name__ == "__main__":
    main()


"""
EJEMPLOS DE USO:

1. Solución básica con 5 ambulancias y radio de 1 km:
   python ejemplo_solucion.py -i data/accidentes_Ags_2019.csv -o mi_solucion.csv

2. Con 7 ambulancias y radio de 1.5 km:
   python ejemplo_solucion.py -i data/accidentes_Ags_2020.csv -o mi_solucion.csv -a 7 -r 1.5

3. Instancia difícil con 3 ambulancias:
   python ejemplo_solucion.py -i data/accidentes_Ags_2023.csv -o mi_solucion.csv -a 3 -r 0.5


MEJORAS SUGERIDAS PARA LOS ESTUDIANTES:

1. Implementar búsqueda local para mejorar la solución greedy
2. Usar algoritmos genéticos o simulated annealing
3. Formular como un problema de optimización lineal entera (ILP)
4. Implementar clustering (k-means, DBSCAN) para identificar zonas críticas
5. Usar técnicas de machine learning para predecir zonas de alto riesgo
6. Implementar búsqueda tabú o GRASP
7. Considerar múltiples escenarios (diferentes días/horas)
"""
