# Caja de Herramientas - Geometría Plana v1

Una aplicación web interactiva para el aprendizaje de conceptos matemáticos fundamentales, incluyendo álgebra lineal, geometría plana y cálculo de determinantes.

## Características Principales

### 🔧 Herramientas Disponibles

#### Álgebra Lineal
- **Método Gauss-Jordan**: Resolución de sistemas de ecuaciones lineales
- **Suma de Matrices**: Operaciones con matrices (incluyendo fracciones)
- **Determinantes**: Cálculo por operaciones de fila

#### Geometría Plana - Secciones Cónicas
- **Círculo**: Visualización interactiva con coordenadas paramétricas
- **Elipse**: Análisis completo con propiedades y ecuaciones
- **Hipérbola**: Representación gráfica y características matemáticas
- **Parábolas Verticales**: Nueva herramienta interactiva
- **Parábolas Horizontales**: Nueva herramienta interactiva

### ✨ Características Técnicas

#### Renderizado Matemático
- **MathJax**: Renderizado profesional de ecuaciones matemáticas
- **Compatibilidad**: Soporte para MathJax 2.x y 3.x
- **LaTeX**: Formato matemático estándar para todas las fórmulas
- **Coordenadas Paramétricas**: Visualización correcta en todas las cónicas

#### Interfaz de Usuario
- **Bootstrap 5**: Diseño responsivo y moderno
- **Canvas HTML5**: Gráficos interactivos de alta calidad
- **Controles Intuitivos**: Sliders y campos de entrada para parámetros
- **Animaciones**: Visualización dinámica de puntos y propiedades

#### Compatibilidad
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, tablet, móvil
- **Responsive**: Adaptación automática a diferentes tamaños de pantalla

## Estructura del Proyecto

```
GeometriaPlanaV1/
├── index.html              # Aplicación principal
├── README.md               # Documentación
├── CHANGELOG.md            # Historial de cambios
├── SOLUCION_DEFINITIVA.md  # Documentación técnica
├── css/
│   └── style.css          # Estilos personalizados
├── js/
│   ├── script1.js         # Funcionalidad principal
│   ├── script2.js         # Funciones auxiliares
│   └── script3.js         # Utilidades adicionales
├── img/                   # Recursos gráficos
└── test_*.html           # Archivos de prueba
```

## Instalación y Uso

### Requisitos
- Navegador web moderno con soporte HTML5
- Conexión a internet (para cargar MathJax y Bootstrap)

### Ejecución
1. Descargar o clonar el repositorio
2. Abrir `index.html` en un navegador web
3. Seleccionar la herramienta deseada del menú lateral
4. Interactuar con los controles para explorar conceptos matemáticos

### Archivos de Prueba
- `test_final.html`: Verificación completa de funcionalidad
- `test_coordenadas_fix.html`: Prueba específica de coordenadas paramétricas
- `test_parabolas.html`: Prueba de herramientas de parábolas

## Últimas Actualizaciones (Junio 2025)

### ✅ Nuevas Herramientas
- **Parábolas Verticales**: Implementación completa con visualización interactiva
- **Parábolas Horizontales**: Análisis matemático y gráfico dinámico

### ✅ Correcciones Importantes
- **Coordenadas Paramétricas**: Renderizado LaTeX corregido en todas las cónicas
- **MathJax**: Función global mejorada para compatibilidad universal
- **Responsive Design**: Mejoras en dispositivos móviles

### ✅ Mejoras Técnicas
- **Renderizado Robusto**: Sistema de timeouts escalonados para procesamiento MathJax
- **Detección Automática**: Identificación de versiones MathJax 2.x/3.x
- **Manejo de Errores**: Fallbacks múltiples para garantizar funcionamiento

## Desarrollo y Contribución

### Equipo de Desarrollo
- **Carlos Andrés Escobar Guerra**: Diseño pedagógico y conceptual
- **Pablo Andrés Guzmán**: Consultoría en R y programación estadística
- **John Jairo Estrada Álvarez**: Programación y desarrollo de aplicaciones
- **Juan Albero Arias Quiceno**: Colaboración y testing

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.1.3
- **Matemáticas**: MathJax 3.x
- **Gráficos**: Canvas HTML5
- **Responsive**: CSS Grid y Flexbox

## Soporte y Documentación

### Archivos de Documentación
- `README.md`: Información general y uso
- `CHANGELOG.md`: Historial detallado de cambios
- `SOLUCION_DEFINITIVA.md`: Documentación técnica de correcciones
- `COORDENADAS_PARAMETRICAS_FIX.md`: Detalles de correcciones LaTeX

### Testing
- Suite completa de archivos de prueba
- Verificación automática de renderizado
- Tests de compatibilidad cross-browser

---

**Versión**: 1.0 (Junio 2025)  
**Licencia**: Uso Educativo  
**Institución**: Facultad de Ciencias y Biotecnología
