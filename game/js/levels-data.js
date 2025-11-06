// ============================================
// LEVELS-DATA.JS - Datos de todos los niveles
// ============================================

const LEVELS_DATA = {
    1: {
        id: 1,
        title: "La Mochila",
        icon: "📦",
        type: "knapsack",
        objective: "Maximiza el valor total de los objetos que puedes llevar en tu mochila sin exceder la capacidad de peso.",
        constraints: [
            "Capacidad máxima: 50 kg",
            "Cada objeto puede ser tomado solo una vez",
            "Debes respetar el límite de peso"
        ],
        hint: "Considera la relación valor/peso de cada objeto. Los objetos con mejor ratio suelen ser buenas opciones.",
        advancedHint: "Prueba el enfoque 'greedy': ordena los objetos por valor/peso y selecciona de mayor a menor ratio. ¿Es siempre óptimo?",
        items: [
            { id: 1, name: "Laptop", emoji: "💻", value: 800, weight: 3 },
            { id: 2, name: "Cámara", emoji: "📷", value: 500, weight: 2 },
            { id: 3, name: "Tablet", emoji: "📱", value: 400, weight: 1 },
            { id: 4, name: "Libro", emoji: "📚", value: 50, weight: 1 },
            { id: 5, name: "Ropa", emoji: "👕", value: 100, weight: 2 },
            { id: 6, name: "Zapatos", emoji: "👟", value: 150, weight: 2 },
            { id: 7, name: "Perfume", emoji: "🧴", value: 200, weight: 1 },
            { id: 8, name: "Reloj", emoji: "⌚", value: 600, weight: 1 }
        ],
        capacity: 8,
        optimalSolution: {
            items: [1, 2, 3, 7, 8], // IDs de los objetos óptimos
            value: 2550,
            weight: 8
        }
    },
    
    2: {
        id: 2,
        title: "Producción Óptima",
        icon: "🏭",
        type: "production",
        objective: "Una fábrica produce sillas y mesas. Determina cuántas unidades de cada producto fabricar para maximizar las ganancias.",
        constraints: [
            "Tiempo disponible: 480 horas/mes",
            "Material disponible: 300 unidades/mes",
            "Una silla requiere: 4h y 2 unidades de material",
            "Una mesa requiere: 8h y 5 unidades de material",
            "Ganancia por silla: $50",
            "Ganancia por mesa: $120"
        ],
        hint: "Encuentra el punto donde se maximiza la ganancia respetando ambas restricciones.",
        advancedHint: "Esto es un problema de programación lineal. Dibuja las restricciones en un plano y encuentra el vértice del área factible con mayor ganancia.",
        resources: {
            time: 480,
            material: 300
        },
        products: [
            { id: 'silla', name: 'Silla', emoji: '🪑', time: 4, material: 2, profit: 50 },
            { id: 'mesa', name: 'Mesa', emoji: '🪑', time: 8, material: 5, profit: 120 }
        ],
        optimalSolution: {
            silla: 0,
            mesa: 60,
            profit: 7200
        }
    },
    
    3: {
        id: 3,
        title: "Reparto de Pizza",
        icon: "🍕",
        type: "tsp",
        objective: "Encuentra la ruta más corta para entregar pizzas a 8 direcciones y regresar al restaurante.",
        constraints: [
            "Debes visitar cada dirección exactamente una vez",
            "Debes regresar al punto de inicio",
            "Minimiza la distancia total recorrida"
        ],
        hint: "Busca patrones geográficos. Agrupa direcciones cercanas y evita cruzar tu propia ruta.",
        advancedHint: "Prueba heurísticas como 'vecino más cercano' o '2-opt'. El TSP es NP-difícil, así que las heurísticas son clave.",
        locations: [
            { id: 0, name: "Restaurante", emoji: "🏪", x: 50, y: 50 },
            { id: 1, name: "Casa A", emoji: "🏠", x: 20, y: 80 },
            { id: 2, name: "Casa B", emoji: "🏠", x: 80, y: 85 },
            { id: 3, name: "Casa C", emoji: "🏠", x: 90, y: 40 },
            { id: 4, name: "Casa D", emoji: "🏠", x: 70, y: 20 },
            { id: 5, name: "Casa E", emoji: "🏠", x: 30, y: 30 },
            { id: 6, name: "Casa F", emoji: "🏠", x: 10, y: 50 },
            { id: 7, name: "Casa G", emoji: "🏠", x: 60, y: 70 }
        ],
        optimalSolution: {
            route: [0, 6, 1, 5, 4, 3, 2, 7, 0],
            distance: 285.4
        }
    },
    
    4: {
        id: 4,
        title: "Asignación de Tareas",
        icon: "👥",
        type: "assignment",
        objective: "Asigna 5 empleados a 5 proyectos minimizando el tiempo total de ejecución.",
        constraints: [
            "Cada empleado debe asignarse a exactamente un proyecto",
            "Cada proyecto debe tener exactamente un empleado",
            "Minimiza el tiempo total"
        ],
        hint: "Cada empleado tiene diferentes habilidades. Busca la mejor combinación.",
        advancedHint: "Este es el 'Problema de Asignación'. El algoritmo húngaro lo resuelve en O(n³).",
        employees: [
            { id: 'Ana', name: 'Ana', emoji: '👩‍💼' },
            { id: 'Bruno', name: 'Bruno', emoji: '👨‍💼' },
            { id: 'Carla', name: 'Carla', emoji: '👩‍💻' },
            { id: 'Diego', name: 'Diego', emoji: '👨‍💻' },
            { id: 'Elena', name: 'Elena', emoji: '👩‍🔬' }
        ],
        projects: [
            { id: 'Web', name: 'Sitio Web', emoji: '🌐' },
            { id: 'App', name: 'App Móvil', emoji: '📱' },
            { id: 'DB', name: 'Base de Datos', emoji: '🗄️' },
            { id: 'Design', name: 'Diseño UI', emoji: '🎨' },
            { id: 'Test', name: 'Testing', emoji: '🧪' }
        ],
        costMatrix: {
            'Ana': { 'Web': 9, 'App': 5, 'DB': 8, 'Design': 4, 'Test': 7 },
            'Bruno': { 'Web': 6, 'App': 8, 'DB': 4, 'Design': 9, 'Test': 5 },
            'Carla': { 'Web': 5, 'App': 7, 'DB': 6, 'Design': 5, 'Test': 8 },
            'Diego': { 'Web': 7, 'App': 6, 'DB': 5, 'Design': 8, 'Test': 4 },
            'Elena': { 'Web': 8, 'App': 4, 'DB': 7, 'Design': 6, 'Test': 6 }
        },
        optimalSolution: {
            assignments: {
                'Ana': 'Design',    // 4h
                'Bruno': 'DB',      // 4h
                'Carla': 'Web',     // 5h
                'Diego': 'Test',    // 4h
                'Elena': 'App'      // 4h
            },
            totalTime: 21  // 4+4+5+4+4 = 21h (corregido de 22)
        }
    },
    
    5: {
        id: 5,
        title: "Logística de Transporte",
        icon: "🚚",
        type: "transport",
        objective: "Minimiza el costo de enviar productos desde 3 almacenes a 4 tiendas cumpliendo con la demanda.",
        constraints: [
            "Satisfacer toda la demanda de las tiendas",
            "No exceder la capacidad de los almacenes",
            "Minimizar el costo total de transporte"
        ],
        hint: "Empieza enviando desde el almacén más barato a cada tienda.",
        advancedHint: "Usa el método de aproximación de Vogel o el método del costo mínimo para encontrar una solución inicial.",
        warehouses: [
            { id: 'W1', name: 'Almacén Norte', emoji: '🏭', supply: 100 },
            { id: 'W2', name: 'Almacén Centro', emoji: '🏭', supply: 150 },
            { id: 'W3', name: 'Almacén Sur', emoji: '🏭', supply: 120 }
        ],
        stores: [
            { id: 'S1', name: 'Tienda A', emoji: '🏪', demand: 80 },
            { id: 'S2', name: 'Tienda B', emoji: '🏪', demand: 90 },
            { id: 'S3', name: 'Tienda C', emoji: '🏪', demand: 70 },
            { id: 'S4', name: 'Tienda D', emoji: '🏪', demand: 130 }
        ],
        costs: {
            'W1': { 'S1': 8, 'S2': 6, 'S3': 10, 'S4': 9 },
            'W2': { 'S1': 9, 'S2': 12, 'S3': 13, 'S4': 7 },
            'W3': { 'S1': 14, 'S2': 9, 'S3': 16, 'S4': 5 }
        },
        optimalSolution: {
            shipments: {
                'W1-S2': 10,
                'W1-S1': 80,
                'W1-S4': 10,
                'W2-S2': 80,
                'W2-S4': 70,
                'W3-S3': 70,
                'W3-S4': 50
            },
            totalCost: 3120
        }
    },
    
    6: {
        id: 6,
        title: "Planificación de Horarios",
        icon: "📅",
        type: "scheduling",
        objective: "Crea un horario óptimo para 5 cursos evitando conflictos y respetando la capacidad de aulas y laboratorios por franja. Los cursos pueden impartirse en paralelo (diferentes aulas). Minimiza el número de franjas usadas.",
        constraints: [
            "Cada franja horaria puede tener múltiples cursos (en aulas diferentes)",
            "Cursos en conflicto NO pueden estar en la misma franja horaria",
            "Cada curso debe asignarse a exactamente una franja",
            "Objetivo: Minimizar el número total de franjas horarias usadas"
        ],
        hint: "Empieza por cursos con más restricciones (laboratorio/profesor). Usa primero las franjas con más capacidad de aula.",
        advancedHint: "Coloración de grafos + recursos: conflictos definen colores mínimos; además respeta capacidad de aulas (rooms) y laboratorios (labs).",
        courses: [
            { id: 'Math', name: 'Matemáticas', emoji: '📐', duration: 2, students: 30, conflicts: ['Phys', 'Prog'], requiresLab: false, professor: 'P_Math' },
            { id: 'Phys', name: 'Física', emoji: '⚛️', duration: 2, students: 25, conflicts: ['Math', 'Chem'], requiresLab: false, professor: 'P_Phys' },
            { id: 'Chem', name: 'Química', emoji: '🧪', duration: 2, students: 28, conflicts: ['Phys'], requiresLab: true, professor: 'P_Chem' },
            { id: 'Prog', name: 'Programación', emoji: '💻', duration: 2, students: 35, conflicts: ['Math'], requiresLab: false, professor: 'P_Prog' },
            { id: 'Eng', name: 'Inglés', emoji: '📚', duration: 2, students: 32, conflicts: [], requiresLab: false, professor: 'P_Eng' }
        ],
        timeSlots: [
            { id: 1, time: '08:00-10:00', duration: 2, rooms: 3, labs: 1 },
            { id: 2, time: '10:00-12:00', duration: 2, rooms: 2, labs: 1 },
            { id: 3, time: '12:00-14:00', duration: 2, rooms: 2, labs: 0 },
            { id: 4, time: '14:00-16:00', duration: 2, rooms: 2, labs: 1 },
            { id: 5, time: '16:00-18:00', duration: 2, rooms: 1, labs: 0 }
        ],
        professors: [
            { id: 'P_Math', name: 'Prof. García', unavailableSlots: [] },
            { id: 'P_Phys', name: 'Prof. Torres', unavailableSlots: [3] },
            { id: 'P_Chem', name: 'Dra. López', unavailableSlots: [] },
            { id: 'P_Prog', name: 'Mtro. Díaz', unavailableSlots: [1] },
            { id: 'P_Eng', name: 'Ms. Smith', unavailableSlots: [] }
        ],
        conflicts: [
            ['Math', 'Phys'],   // Comparten muchos estudiantes (no pueden asistir a ambos)
            ['Chem', 'Phys'],   // Comparten el laboratorio (solo hay uno disponible)
            ['Prog', 'Math']    // Comparten el mismo profesor
        ],
        conflictReasons: {
            'Math-Phys': 'Muchos estudiantes cursan ambas materias',
            'Chem-Phys': 'Comparten el único laboratorio disponible',
            'Prog-Math': 'El profesor imparte ambas materias'
        },
        optimalSolution: {
            schedule: {
                'Math': 1,
                'Chem': 1,
                'Eng': 1,
                'Phys': 2,
                'Prog': 2
            },
            slotsUsed: 2
        }
    },
    
    7: {
        id: 7,
        title: "Localización de Instalaciones",
        icon: "🏪",
        type: "facility",
        objective: "Decide dónde ubicar 3 centros de distribución para minimizar la distancia total a 10 ciudades.",
        constraints: [
            "Debes abrir exactamente 3 centros",
            "Cada ciudad debe ser atendida por el centro más cercano",
            "Minimiza la suma de distancias"
        ],
        hint: "Busca ubicaciones que estén centralizadas respecto a grupos de ciudades.",
        advancedHint: "Usa el algoritmo k-means o métodos de clustering para agrupar ciudades y encontrar centroides óptimos.",
        cities: [
            { id: 1, name: 'Ciudad A', x: 10, y: 20 },
            { id: 2, name: 'Ciudad B', x: 30, y: 40 },
            { id: 3, name: 'Ciudad C', x: 50, y: 30 },
            { id: 4, name: 'Ciudad D', x: 70, y: 50 },
            { id: 5, name: 'Ciudad E', x: 20, y: 70 },
            { id: 6, name: 'Ciudad F', x: 40, y: 80 },
            { id: 7, name: 'Ciudad G', x: 80, y: 20 },
            { id: 8, name: 'Ciudad H', x: 90, y: 60 },
            { id: 9, name: 'Ciudad I', x: 60, y: 70 },
            { id: 10, name: 'Ciudad J', x: 35, y: 15 }
        ],
        facilityCost: 10000,
        numFacilities: 3,
        optimalSolution: {
            facilities: [
                { x: 25, y: 35 },
                { x: 50, y: 70 },
                { x: 80, y: 40 }
            ],
            totalDistance: 234.5,
            assignments: {
                1: 0, 2: 0, 3: 2, 4: 2, 5: 1,
                6: 1, 7: 2, 8: 2, 9: 1, 10: 0
            }
        }
    },
    
    8: {
        id: 8,
        title: "Red Eléctrica",
        icon: "⚡",
        type: "network",
        objective: "Optimiza el flujo de energía en una red eléctrica minimizando pérdidas y costos.",
        constraints: [
            "Satisfacer toda la demanda",
            "No exceder capacidad de las líneas",
            "Respetar límites de generación",
            "Minimizar costos operativos"
        ],
        hint: "Prioriza las fuentes de energía más baratas y cercanas a la demanda.",
        advancedHint: "Este es un problema de flujo de costo mínimo. Usa el algoritmo de simplex en redes.",
        generators: [
            { id: 'G1', name: 'Planta Solar', emoji: '☀️', capacity: 100, cost: 30 },
            { id: 'G2', name: 'Planta Eólica', emoji: '💨', capacity: 150, cost: 25 },
            { id: 'G3', name: 'Planta Hidro', emoji: '💧', capacity: 200, cost: 20 }
        ],
        consumers: [
            { id: 'C1', name: 'Zona Industrial', emoji: '🏭', demand: 180 },
            { id: 'C2', name: 'Zona Residencial', emoji: '🏘️', demand: 120 },
            { id: 'C3', name: 'Zona Comercial', emoji: '🏢', demand: 150 }
        ],
        optimalSolution: {
            flow: {
                'G1-C2': 100,   // Solar → Residencial: 100 × $30 = $3,000
                'G2-C3': 150,   // Eólica → Comercial: 150 × $25 = $3,750
                'G3-C1': 180,   // Hidro → Industrial: 180 × $20 = $3,600
                'G3-C2': 20     // Hidro → Residencial: 20 × $20 = $400
            },
            totalCost: 10750    // $3,000 + $3,750 + $3,600 + $400 = $10,750 (corregido de $11,500)
        }
    },
    
    9: {
        id: 9,
        title: "Problema Integrado",
        icon: "🎯",
        type: "integrated",
        objective: "Gestiona una cadena de suministro completa: decide qué producir en cada fábrica y cómo distribuir a los clientes minimizando costos totales.",
        constraints: [
            "3 fábricas con capacidades de producción diferentes",
            "2 productos con costos de producción variables por fábrica",
            "4 clientes con demandas específicas de cada producto",
            "Costos de transporte desde cada fábrica a cada cliente",
            "Satisfacer toda la demanda minimizando costo total"
        ],
        hint: "Primero identifica qué fábrica produce más barato cada producto, luego optimiza el transporte.",
        advancedHint: "Esto es programación entera mixta (MIP). Usa variables binarias para decisiones de producción y continuas para cantidades.",
        factories: [
            { 
                id: 'F1', 
                name: 'Fábrica Norte', 
                emoji: '🏭',
                location: { x: 20, y: 30 },
                production: {
                    'A': { capacity: 200, cost: 15 },
                    'B': { capacity: 150, cost: 22 }
                }
            },
            { 
                id: 'F2', 
                name: 'Fábrica Centro', 
                emoji: '🏭',
                location: { x: 50, y: 50 },
                production: {
                    'A': { capacity: 250, cost: 12 },
                    'B': { capacity: 200, cost: 18 }
                }
            },
            { 
                id: 'F3', 
                name: 'Fábrica Sur', 
                emoji: '🏭',
                location: { x: 80, y: 70 },
                production: {
                    'A': { capacity: 180, cost: 18 },
                    'B': { capacity: 220, cost: 16 }
                }
            }
        ],
        products: [
            { id: 'A', name: 'Producto A', emoji: '📦' },
            { id: 'B', name: 'Producto B', emoji: '📦' }
        ],
        customers: [
            { 
                id: 'C1', 
                name: 'Cliente Norte', 
                emoji: '🏪',
                location: { x: 15, y: 20 },
                demand: { 'A': 120, 'B': 80 }
            },
            { 
                id: 'C2', 
                name: 'Cliente Este', 
                emoji: '🏪',
                location: { x: 85, y: 40 },
                demand: { 'A': 150, 'B': 100 }
            },
            { 
                id: 'C3', 
                name: 'Cliente Oeste', 
                emoji: '🏪',
                location: { x: 30, y: 80 },
                demand: { 'A': 100, 'B': 120 }
            },
            { 
                id: 'C4', 
                name: 'Cliente Centro', 
                emoji: '🏪',
                location: { x: 50, y: 50 },
                demand: { 'A': 80, 'B': 70 }
            }
        ],
        transportCosts: {
            'F1': { 'C1': 2, 'C2': 8, 'C3': 6, 'C4': 4 },
            'F2': { 'C1': 5, 'C2': 6, 'C3': 4, 'C4': 2 },
            'F3': { 'C1': 9, 'C2': 5, 'C3': 3, 'C4': 4 }
        },
        optimalSolution: {
            production: {
                'F1-A': 120,  // 120 × $15 = $1,800
                'F1-B': 0,    // 0 × $22 = $0
                'F2-A': 250,  // 250 × $12 = $3,000 (más barato para A)
                'F2-B': 150,  // 150 × $18 = $2,700
                'F3-A': 80,   // 80 × $18 = $1,440
                'F3-B': 220   // 220 × $16 = $3,520 (más barato para B)
            },
            shipments: {
                'F1-C1-A': 120,  // 120 × $2 = $240
                'F2-C2-A': 150,  // 150 × $6 = $900
                'F2-C4-A': 80,   // 80 × $2 = $160
                'F2-C4-B': 70,   // 70 × $2 = $140
                'F2-C2-B': 80,   // 80 × $6 = $480
                'F3-C3-A': 100,  // 100 × $3 = $300
                'F3-C3-B': 120,  // 120 × $3 = $360
                'F3-C1-B': 80,   // 80 × $9 = $720
                'F3-C2-B': 20    // 20 × $5 = $100
            },
            totalCost: 15860,       // $12,460 + $3,400 (corregido de $18,940)
            productionCost: 12460,  // $1,800 + $3,000 + $2,700 + $1,440 + $3,520 (corregido de $16,240)
            transportCost: 3400     // $240 + $900 + $160 + $140 + $480 + $300 + $360 + $720 + $100 (corregido de $2,700)
        }
    }
};

// Exportar datos
window.LEVELS_DATA = LEVELS_DATA;

